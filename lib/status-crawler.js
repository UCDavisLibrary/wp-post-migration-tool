import sitemap from './link-checker/sitemap.js';
import config from './config.js';
import linkChecker from './link-checker/index.js';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import {Storage} from '@google-cloud/storage';
import parseLinkHeader from 'parse-link-header';
import wp from './wp.js';
import bigquery from './bigquery.js';
import { stringify as csvStringify } from 'csv-stringify';


class StatusCrawler {

  constructor() {
    // this.statusDir = path.join(process.cwd(), '.status-dir');

    // if( !fs.existsSync(this.statusDir) ) {
    //   fs.mkdirSync(this.statusDir);
    // }

    this.urlStatus = {green : 0, yellow : 0, red : 0};


    this.GCS_FILES = {
      STATUS_SPREADSHEET : 'status.csv',
      DATA : 'data.json',
      HISTORICAL_STATUS : 'historical-status.json',
      HISTORICAL_STATUS_CSV : 'historical-status.csv',
      URL_MAP : 'url-map.json'
    }

    // we don't need to fetch metadata for the news, possibly other pages
    this.ignoreSinkMetadata = [
      /^\/news\//
    ]

    this.data = {};
    this.sinkMetadata = {};
    this.pathMap = [];

    this.running = false;
    this.storage = new Storage();
  }

  async run() {
    if( this.running ) {
      console.warn('Crawler already running');
      return;
    }
    this.running = true;

    console.log(`Checking migration status for source=${config.source.host} sink=${config.sink.host}`);

    try {
      this.data = {};
      this.urlStatus = {green : 0, yellow : 0, red : 0};
      this.statusCache = {};
      this.linkIgnoreList = config.commonLinks.map(path => config.sink.host+path);
      let historicalStatus = [];
      this.sinkMetadata = {};
      this.pathMap = [];

      console.log('Loading data from GCS');

      // fetch historical status runs from 
      try {
        let contents = await this.storage
          .bucket(config.google.storage.bucket)
          .file(this.GCS_FILES.HISTORICAL_STATUS)
          .download();
        historicalStatus = JSON.parse(contents);
      } catch(e) {
        console.error('Failed to download historical status from GCS');
      }

      // first we will parse the current (sink) site
      await sitemap.run(config.sink.host+'/wp-sitemap.xml');
      let urls = Object.keys(sitemap.urls);
      // fetch all metadata and set url map
      console.log('Crawling sink site ('+config.sink.host+') metadata');
      await this.runInParrallel(urls, this.crawlUrlSetMetadata);

      await sitemap.run();

      urls = Object.keys(sitemap.urls);
      await this.runInParrallel(urls, this.crawlUrlSet);

      console.log('Uploading results to GCS');

      historicalStatus.push({
        timestamp : new Date().toISOString(),
        status: this.urlStatus
      });

      console.log('Writing '+this.GCS_FILES.HISTORICAL_STATUS+' to GCS');
      await this.storage
        .bucket(config.google.storage.bucket)
        .file(this.GCS_FILES.HISTORICAL_STATUS)
        .save(JSON.stringify(historicalStatus));

      let csv = [['timestamp', 'green', 'yellow', 'red']];
      for( let item of historicalStatus ) {
        csv.push([item.timestamp.replace(/Z$/, ''), item.status.green, item.status.yellow, item.status.red]);
      }
      console.log('Writing '+this.GCS_FILES.HISTORICAL_STATUS_CSV+' to GCS');
      await this.storage
        .bucket(config.google.storage.bucket)
        .file(this.GCS_FILES.HISTORICAL_STATUS_CSV)
        .save(await this.csvStringify(csv));

      try {
        console.log('Importing '+this.GCS_FILES.HISTORICAL_STATUS_CSV+' to bigquery');
        await bigquery.overwrite(
          this.GCS_FILES.HISTORICAL_STATUS_CSV,
          [
            {name: 'timestamp', type: 'DATETIME'},
            {name: 'green', type: 'INTEGER'},
            {name: 'yellow', type: 'INTEGER'},
            {name: 'red', type: 'INTEGER'}
          ]
        );
      } catch(e) {
        console.error('Failed to write '+this.GCS_FILES.HISTORICAL_STATUS_CSV+' to bigquery')
      }

      csv = [['old_location', 'old_location', 'new_location', 'migration_status', 'stub_status']];
      for( let sourcePath in this.data ) {
        let page = this.data[sourcePath];
        let type = sourcePath.replace(/^\//, '').split('/')[0] || '/';
        csv.push([sourcePath, type, page.url.replace(config.sink.host, ''), page.status, page.migrationStatus || 'na'])
      }

      // check urls that are just on the new site.  need to make sure that are not stubs
      for( let path in this.sinkMetadata ) {
        if( !this.data[path] ) {
          let migration_status = this.sinkMetadata[path]?.meta?.migration_status || '';
          let status = 'green';
          if( migration_status && migration_status !== 'go-live-ready'  ) {
            status = 'yellow'
          }

          csv.push(['na', 'na',  path, status, migration_status || 'na']);
        }
      }

      console.log('Writing '+this.GCS_FILES.STATUS_SPREADSHEET+' to GCS');
      await this.storage
        .bucket(config.google.storage.bucket)
        .file(this.GCS_FILES.STATUS_SPREADSHEET)
        .save(await this.csvStringify(csv));
      
      try {
        console.log('Importing '+this.GCS_FILES.STATUS_SPREADSHEET+' to bigquery');
        await bigquery.overwrite(
          this.GCS_FILES.STATUS_SPREADSHEET,
          [
            {name: 'old_location', type: 'STRING'},
            {name: 'old_location_type', type: 'STRING'},
            {name: 'new_location', type: 'STRING'},
            {name: 'migration_status', type: 'STRING'},
            {name: 'stub_status', type: 'STRING'}
          ]
        );
      } catch(e) {
        console.error('Failed to write '+this.GCS_FILES.STATUS_SPREADSHEET+' to bigquery')
      }

      let contents = JSON.stringify({
        timestamp : new Date().toISOString(),
        data: this.data,
        commonLinks : config.commonLinks,
        pathMap : this.pathMap
      });

      console.log('Writing '+this.GCS_FILES.DATA+' to GCS');
      await this.storage
        .bucket(config.google.storage.bucket)
        .file(this.GCS_FILES.DATA)
        .save(contents);
    } catch(e) {
      console.error('Failed to crawl migration status', e);
    }

    console.log('crawl complete', this.urlStatus);

    this.running = false;
  }


  async crawlLink(sourceUrl) {
    let parsedUrl = new URL(sourceUrl);
    let external = false;

    // either return original path or redirect if one is set
    // this should be a head request
    let sinkPath = await this.getRedirect(parsedUrl.pathname);
    let sinkUrl = '';

    if( sinkPath.match(/^http(s)?:\/\//) ) {
      sinkUrl = sinkPath;
      sinkPath = new URL(sinkPath).pathname;
      external = true;
    } else {
      sinkUrl = config.sink.host+sinkPath;
    }

    // if link
    if( external ) {
      let info = await linkChecker.getLinkInfo(sinkUrl);
      this.data[parsedUrl.pathname] = {
        url : sinkUrl,
        httpStatusCode : info.status,
        status : (info.status >= 200 && info.status <= 400) ? 'green' : 'red'
      }
      this.urlStatus[this.data[parsedUrl.pathname].status]++;
      return;
    }

    let info = await linkChecker.fetchLinks(sinkUrl, {
      web: true,
      linkStatus : true,
      statusCache : this.statusCache,
      ignoreList : this.linkIgnoreList
    });
    this.data[parsedUrl.pathname] = info;



    let urlStatus = (info.httpStatusCode >= 200 && info.httpStatusCode <= 299);
    if( !urlStatus ) info.status = 'red';
    
    // check if libguide points at /guide-missing 
    if( !info.status && parsedUrl.pathname.match(/^\/guide\//) ) {
      if( sinkPath.match(/^\/guide-missing/) ) {
        console.log('lib guide points to /guide-missing')
        info.status = 'yellow';
      }
    }

    // check status of links, if one is bad, set to yellow
    if( !info.status && info.links ) {
      for( let link of info.links ) {
        if( link.status < 200 || link.status > 399 ) {
          console.log('link is not 200 ', link);
          info.status = 'yellow';
          break;
        }
      }
    }

    // set and check migration status
    info.migrationStatus = this.sinkMetadata[sinkPath]?.meta?.migration_status;
    if( !info.status && info.migrationStatus ) {
      if( info.migrationStatus !== 'go-live-ready' ) {
        console.log('migrationStatus is ', info.migrationStatus);
        info.status = 'yellow'
      }
    }

    // all is good! set to green
    if( !info.status ) info.status = 'green';

    this.urlStatus[info.status]++;
  }

  runInParrallel(urls, fn) {
    let set1 = urls.splice(0, Math.floor(urls.length/3));
    let set2 = urls.splice(0, Math.floor(urls.length/3));
    let set3 = urls;

    // crawl 2 requests at a time
    return Promise.all([
      fn.apply(this, [set1]),
      fn.apply(this, [set2]),
      fn.apply(this, [set3])
    ]);
  }

  // getRedirect(path) {
  //   for( let redirect of this.pathMap ) {
  //     if( redirect.rule.match(path) ) return redirect.destination;
  //   }
  //   return path;
  // }
  async getRedirect(path) {
    let {status, headers} = await linkChecker.getLinkInfo(config.sink.host+path);
    if( status > 299 && status < 400 ) {
      return headers.get('location').replace(config.sink.host, '');
    }
    return path;
  }

  async crawlUrlSet(urls) {
    for( let url of urls ) {
      await this.crawlLink(url);
    }
  }

  async crawlUrlSetMetadata(urls) {
    for( let url of urls ) {
      let pathname = new URL(url).pathname;

      let ignore = false;
      for( let re of this.ignoreSinkMetadata ) {
        if( pathname.match(re) ) {
          ignore = true;
          break;
        }
      }
      if( ignore ) continue;

      let metadata = await this.getApiMetdata(url);
      if( Object.keys(metadata).length === 0 ) continue;

      this.sinkMetadata[pathname] = metadata;
      // if( !metadata?.meta?.migration_redirects ) continue;

      // check for metadata
      // for( let redirect of metadata.meta.migration_redirects ) {
      //   if( redirect.regex === true ) {
      //     this.pathMap.push({
      //       rule : new RegExp(redirect.match_url),
      //       destination : url
      //     });
      //   } else {
      //     this.pathMap.push({
      //       rule : new RegExp('^'+redirect.url+'$'),
      //       destination : url
      //     });
      //   }
      // }
    }
  }

  async getApiMetdata(url) {
    try {
      // first, make a head request so we can get the api link
      // we need to post id for the api and the headers contain this
      console.log('fetching metadata for: '+url);
      let resp = await fetch(url);
      let links = parseLinkHeader(resp.headers.get('link'));
      
      let apiEndpoint = '';
      for( let link in links ) {
        if( links[link].type === 'application/json' ) {
          apiEndpoint = links[link].url;
        }
      }

      if( !apiEndpoint ) {
        console.warn('no api endpoint found for: '+url, links);
        return {};
      }

      // now fetch the json api
      resp = await fetch(apiEndpoint);
      resp = await resp.json();

      // finally, attempt to hit the redirects plugin and find all redirects for this page
      try {
        let url = new URL(config.sink.host+config.sink.redirectApiPath);
        url.searchParams.append('filterBy[target]', resp.slug);
        url.searchParams.append('filterBy[status]', 'enabled');
        url.searchParams.append('filterBy[action]', 'url');

        resp.meta.migration_redirects = (await wp.fetchJson(url.href, false, false))
          .items.filter(item => item.action_data.url === '/'+resp.slug);
      } catch(e) {

      }

      return resp;

    } catch(e) {
      console.error('Failed to fetch metadata for: '+url, e);
    }

    return {};
  }

  csvStringify(arr) {
    return new Promise((resolve, reject) => {
      csvStringify(arr, (err, output) => {
        if( err ) reject(err);
        else resolve(output);
      });
    });

  }

}

const instance = new StatusCrawler();
export default instance;