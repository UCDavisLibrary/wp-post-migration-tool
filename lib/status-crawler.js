import sitemap from './link-checker/sitemap.js';
import config from './config.js';
import linkChecker from './link-checker/index.js';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import {Storage} from '@google-cloud/storage';
import parseLinkHeader from 'parse-link-header';

class StatusCrawler {

  constructor() {
    // this.statusDir = path.join(process.cwd(), '.status-dir');

    // if( !fs.existsSync(this.statusDir) ) {
    //   fs.mkdirSync(this.statusDir);
    // }
    this.GCS_FILES = {
      DATA : 'data.json',
      HISTORICAL_STATUS : 'historical-status.json',
      URL_MAP : 'url-map.json'
    }

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

      // fetch current url map from GCS
      // try {
      //   let contents = await this.storage
      //     .bucket(config.google.storage.bucket)
      //     .file(this.GCS_FILES.URL_MAP)
      //     .download();
      //   config.urlMap = JSON.parse(contents);
      //   console.log('Url map downloaded, '+Object.keys(config.urlMap).length+' links found');
      // } catch(e) {
      //   console.error('Failed to download url map from GCS');
      // }

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
      urls = Object.keys(sitemap.urls);
      await this.runInParrallel(urls, this.crawlUrlSetMetadata);

      await sitemap.run();

      urls = Object.keys(sitemap.urls);
      await this.runInParrallel(urls, this.crawlUrlSet);

      console.log('Uploading results to GCS');

      historicalStatus.push({
        timestamp : new Date().toISOString(),
        status: this.urlStatus
      });

      console.log(this.urlStatus);

      await this.storage
        .bucket(config.google.storage.bucket)
        .file(this.GCS_FILES.HISTORICAL_STATUS)
        .save(JSON.stringify(historicalStatus));

      let csv = [];
      let pages = [];
      for( let source in this.data ) {
        let page = this.data[sourceUrl];
        csv.push([source, page.url, page.status, page.migrationStatus])
      }

      let contents = JSON.stringify({
        timestamp : new Date().toISOString(),
        data: this.data,
        commonLinks : config.commonLinks,
        pathMap : this.pathMap
      });

      await this.storage
        .bucket(config.google.storage.bucket)
        .file(this.GCS_FILES.DATA)
        .save(contents);
    } catch(e) {
      console.error('Failed to crawl migration status', e);
    }

    console.log('crawl complete');

    this.running = false;
  }

  async crawlLink(sourceUrl) {
    let parsedUrl = new URL(sourceUrl);
    let external = false;

    // either return original path or redirect if one is set
    let sinkPath = this.getRedirect(parsedUrl.pathname);
    let sinkUrl = '';

    if( sinkPath.match(/$http(s)?:\/\//) ) {
      sinkUrl = sinkPath;
      sinkPath = new URL(sinkPath).pathname;
      external = true;
    } else {
      sinkUrl = config.sink.host+sinkPath;
    }

    // if link
    if( external ) {
      let info = await linkChecker.getLinkInfo(sinkUrl);
      this.data[sourceUrl] = {
        url : sinkUrl,
        httpStatusCode : info.status,
        status : (info.status >= 200 && info.status <= 400) ? 'green' : 'red'
      }
      this.urlStatus[this.data[sourceUrl].status]++;
      return;
    }

    let info = await linkChecker.fetchLinks(sinkUrl, {
      web: true,
      linkStatus : true,
      statusCache : this.statusCache,
      ignoreList : this.linkIgnoreList
    });
    this.data[sourceUrl] = info;



    let urlStatus = (info.httpStatusCode >= 200 && info.httpStatusCode <= 299);
    if( !urlStatus ) info.status = 'red';
    
    // check status of links, if one is bad, set to yello
    if( !info.status && info.links ) {
      for( let link of info.links ) {
        if( link.status < 200 || link.status > 399 ) {
          info.status = 'yellow';
          break;
        }
      }
    }

    // set and check migration status
    info.migrationStatus = this.sinkMetadata[sinkUrl]?.meta?.migration_status;
    if( !info.status && info.migrationStatus ) {
      if( info.migrationStatus !== 'go-live-ready' ) info.status = 'yellow'
    }

    // all is good! set to green
    if( !info.status ) info.status = 'green';

    this.urlStatus[info.status]++;
  }

  runInParrallel(urls, fn) {
    urls = Object.keys(sitemap.urls);

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

  getRedirect(path) {
    for( let redirect of this.pathMap ) {
      if( redirect.rule.match(path) ) return redirect.destination;
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
      let metadata = await this.getApiMetdata(url);

      this.sinkMetadata[url] = metadata;
      if( !metadata?.meta?.migration_redirects ) continue;

      // check for metadata
      for( let redirect of metadata.meta.migration_redirects ) {
        if( redirect.regex === true ) {
          this.pathMap.push({
            rule : new RegExp(redirect.url),
            destination : url
          });
        } else {
          this.pathMap.push({
            rule : new RegExp('^'+redirect.url+'$'),
            destination : url
          });
        }
      }
    }
  }

  async getApiMetdata(url) {
    try {
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

      resp = await fetch(apiEndpoint);
      return await resp.json();
    } catch(e) {
      console.error('Failed to fetch metadata for: '+url, e);
    }
    return {};
  }

}

const instance = new StatusCrawler();
export default instance;