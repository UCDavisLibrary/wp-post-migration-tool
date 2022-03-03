import sitemap from './link-checker/sitemap.js';
import config from './config.js';
import linkChecker from './link-checker/index.js';
import fs from 'fs';
import path from 'path';

class StatusCrawler {

  constructor() {
    this.statusDir = path.join(process.cwd(), '.status-dir');

    if( !fs.existsSync(this.statusDir) ) {
      fs.mkdirSync(this.statusDir);
    }
  }

  async run() {
    this.data = {};
    this.urlStatus = {green : 0, yellow : 0, red : 0};
    this.statusCache = {};
    this.linkIgnoreList = config.commonLinks.map(path => config.sink.host+path);
    await sitemap.run();


    let urls = Object.keys(sitemap.urls);
    for( let url of urls ) {
      await this.crawlLink(url);
    }

    fs.writeFileSync(
      path.join(this.statusDir, new Date().toISOString().replace(/[\.:]/g, '-'))+'.json',
      JSON.stringify({
        timestamp : new Date().toISOString(),
        status: this.urlStatus,
        commonLinks : config.commonLinks,
        urlMap : config.urlMap
      }, '  ', '  ')
    );

    fs.writeFileSync(
      path.join(this.statusDir, 'data.json'),
      JSON.stringify({
        data: this.data,
        commonLinks : config.commonLinks,
        urlMap : config.urlMap
      })
    )
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
    console.log( this.urlStatus);
  }

}

const instance = new StatusCrawler();
instance.run();