import sitemap from './sitemap.js';
import config from '../config.js';
import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

class LinkChecker {

  constructor() {
    this.linkGraphDir = path.join(process.cwd(), '.link-graph');
    this.commonLinksFile = path.join(this.linkGraphDir, '_common-links.json');

    if( !fs.existsSync(this.linkGraphDir) ) {
      fs.mkdirSync(this.linkGraphDir);
    }
  }

  async run() {
    await sitemap.run();

    let urls = Object.keys(sitemap.urls);
    for( let url of urls ) {
      await this.fetchLinks(url, {
        refetch: true
      });
    }
  }

  /**
   * @method fetchLinks
   * @description given a url, fetch the status code and all embed links
   * to the wordpress instance.  Writes to .link-graph cache dir if no
   * 'opts.web' flag specified
   * 
   * @param {String} url 
   * @param {Object} opts 
   * @param {Boolean} opts.web is this function being called from a web client?
   * @param {Boolean} opts.refetch make request even if cache file exists on disk
   * @param {Boolean} opts.linkStatus check link status codes as well
   * @param {Object} opts.statusCache if making repeat requests, object to cache link HTTP status codes. 
   * good for crawling.
   * @returns 
   */
  async fetchLinks(url, opts={}) {
    let id = this.getLinkId(url);
    let file = path.join(this.linkGraphDir, id+'.json');
    let {origin} = new URL(url);

    if( !(opts.refetch !== true || opts.web !== true) && fs.existsSync(file) ) {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    }

    console.log('Fetching links for: '+url);

    let resp;
    try {
      resp = await fetch(url);
    } catch(e) {
      resp = {status: -1, message: e.message}
    }

    let status = resp.status;

    if( status < 200 || status > 299 ) {
      let data = {
        id, url, httpStatusCode: status
      };

      if( opts.web !== true ) {
        fs.writeFileSync(
          path.join(this.linkGraphDir, id+'.json'),
          JSON.stringify(data, '  ', '  ')
        );
      }
  
      return data;
    }

    let html = await resp.text();
    let window = (new JSDOM(html)).window;

    let links = {};

    Array.from(window.document.querySelectorAll('a'))
      .map(anchor => anchor.href || '')
      .map(href => href.match(/$\//) ? origin+href : href)
      .filter(href => href.startsWith(origin))
      .forEach(href => {
        if( links[href] ) return;
        links[href] = {id: this.getLinkId(href), url: href};
      });

    if( opts.linkStatus === true ) {
      for( let url in links ) {
        if( opts.ignoreList && opts.ignoreList.includes(url) ) {
          delete links[url]
          continue;
        }
        if( opts.ignoreList && url.match(/\/(tag|category)\/.*/) ) {
          delete links[url]
          continue;
        }

        if( opts.statusCache && opts.statusCache[url] ) {
          links[url].status = opts.statusCache[url];
          continue;
        }

        let head = await this.getLinkInfo(url);
        links[url].status = head.status;

        if( opts.statusCache ) {
          opts.statusCache[url] = head.status;
        }
      }
    }

    let data = {
      id, url, httpStatusCode: status,
      links: Object.values(links)
    };

    if( opts.web !== true ) {
      fs.writeFileSync(
        path.join(this.linkGraphDir, id+'.json'),
        JSON.stringify(data, '  ', '  ')
      );
    }

    return data;
  }

  /**
   * @method getLinkId
   * @description get md5 hash of url
   * 
   * @param {*} url 
   * @returns 
   */
  getLinkId(url) {
    return crypto.createHash('md5').update(url).digest('hex');
  }

  /**
   * @method getLinkInfo
   * @description get HTTP status code and headers for url via HEAD
   * request
   * 
   * @param {String} url 
   * @returns {Promise}
   */
  async getLinkInfo(url) {
    let resp;
    
    try {
      resp = await fetch(url, {
        method: 'HEAD',
        redirect: 'manual'
      });
    } catch(e) {
      return {status: -1, headers : {}, message: e.message}
    }

    let status = resp.status;
    let headers = resp.headers;

    return {status, headers};
  }

  linkFinder(url) {
    let files = fs.readdirSync(this.linkGraphDir);
    let resp = [];

    for( let file of files ) {
      if( file.match(/^_/) ) continue;

      let data = fs.readFileSync(path.join(this.linkGraphDir, file), 'utf-8');
      data = JSON.parse(data);
      if( data.links && data.links[url] ) resp.push(data.url);
    }

    return resp;
  }

  setCommonLinks() {
    let files = fs.readdirSync(this.linkGraphDir);
    let counts = {};
    
    for( let file of files ) {
      if( file.match(/^_/) ) continue;

      let links = fs.readFileSync(path.join(this.linkGraphDir, file), 'utf-8');
      links = JSON.parse(links).links;

      for( let link in links ) {
        if( !counts[link] ) counts[link] = 1;
        else counts[link]++;
      }
    }

    let arr = [];
    for( let link in counts ) {
      arr.push({link, count: counts[link]});
    }
    arr.sort((a, b) => a.count > b.count ? -1 : 1);

    let top = arr[0].count;
    arr = arr.filter(item => item.count >= top-10);
    arr = arr.map(item => {
      let {pathname} = new URL(item.link);
      return pathname;
    });

    fs.writeFileSync(this.commonLinksFile, JSON.stringify(arr, '  ', '  '));
  }

}

const instance = new LinkChecker();
export default instance;