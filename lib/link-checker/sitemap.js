import config from "../config.js";
import fetch from "node-fetch";
import {parseString} from 'xml2js';
import path from 'path';

class SitemapCrawler {

  constructor() {
    this.reset();
  }

  async run(url) {
    if( !url ) {
      url = config.source.host+'/wp-sitemap.xml';
    }

    this.reset();
    console.log('Loading sitemap: '+url);

    await this.loadSitemap(url);
  }

  reset() {
    this.urls = {};
  }

  async loadSitemap(url) {
    for( let re of config.sitemapIgnore ) {
      if( url.match(re) ) {
        console.log('Ignoring '+re+' sitemap: '+url);
        return;
      }
    }

    let resp = await fetch(url);
    let xml = await this.parseXml(await resp.text());

    let sitemaps = xml?.sitemapindex?.sitemap || [];
    for( let sitemap of sitemaps ) {
      for( let url of sitemap.loc ) {
        await this.loadSitemap(url);
      }
    }

    let urls = xml?.urlset?.url || [];
    for( let url of urls ) {
      for( let location of url.loc ) {
        this.urls[location] = path.parse(location);
        this.urls[location].type = this.urls[location].dir.split('/').pop()
      }
    }

  }

  parseXml(xml) {
    return new Promise((resolve, reject) => {
      parseString(xml, (err, result) => {
        if( err ) reject(err);
        else resolve(result);
      })
    });
  }

}

const instance = new SitemapCrawler();
export default instance;