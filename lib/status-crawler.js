import sitemap from './link-checker/sitemap.js';
import config from './config.js';
import linkChecker from './link-checker/index.js';
import fs from 'fs';
import path from 'path';
import {Storage} from '@google-cloud/storage';


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

      console.log('Loading data from GCS');

      // fetch current url map from GCS
      try {
        let contents = await this.storage
          .bucket(config.google.storage.bucket)
          .file(this.GCS_FILES.URL_MAP)
          .download();
        config.urlMap = JSON.parse(contents);
        console.log('Url map downloaded, '+Object.keys(config.urlMap).length+' links found');
      } catch(e) {
        console.error('Failed to download url map from GCS');
      }

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

      await sitemap.run();

      let urls = Object.keys(sitemap.urls);
      for( let url of urls ) {
        await this.crawlLink(url);
      }

      console.log('Uploading results to GCS');

      historicalStatus.push({
        timestamp : new Date().toISOString(),
        status: this.urlStatus
      });

      await this.storage
        .bucket(config.google.storage.bucket)
        .file(this.GCS_FILES.HISTORICAL_STATUS)
        .save(JSON.stringify(historicalStatus));

      let contents = JSON.stringify({
        timestamp : new Date().toISOString(),
        data: this.data,
        commonLinks : config.commonLinks,
        urlMap : config.urlMap
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
    let parseUrl = new URL(sourceUrl);
    let external = false;

    if( config.urlMap[parseUrl.pathname] ) {
      let dest = urlMap[parseUrl.pathname];

      if( dest.match(/^\//) ) {
        parseUrl.pathname = dest;
        parseUrl = new URL(parseUrl.href.replace(parseUrl.origin, config.sink.host));
      } else { // external link
        external = true;
        parseUrl = new URL(urlMap[parseUrl.pathname]);
      }

    } else {
      parseUrl = new URL(parseUrl.href.replace(parseUrl.origin, config.sink.host));
    }

    if( external ) {
      let info = await linkChecker.getLinkInfo(parseUrl.href);
      this.data[sourceUrl] = {
        url : parseUrl.href,
        httpStatusCode : info.status,
        status : (info.status >= 200 && info.status <= 400) ? 'green' : 'red'
      }
      this.urlStatus[this.data[sourceUrl].status]++;
      return;
    }

    let info = await linkChecker.fetchLinks(parseUrl.href, {
      web: true,
      linkStatus : true,
      statusCache : this.statusCache,
      ignoreList : this.linkIgnoreList
    });
    this.data[sourceUrl] = info;


    let urlStatus = (info.httpStatusCode >= 200 && info.httpStatusCode <= 400);
    if( info.links ) {
      for( let link of info.links ) {
        if( link.status < 200 || link.status > 399 ) {
          info.status = urlStatus ? 'yellow' : 'red';
          break;
        }
      }
    }
    if( !info.status ) {
      if( urlStatus ) info.status = 'green';
      else info.status = 'red';
    } 

    this.urlStatus[info.status]++;
  }

}

const instance = new StatusCrawler();
export default instance;