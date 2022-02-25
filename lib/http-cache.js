import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

class HTTPCache {

  constructor() {
    this.localCacheDir = path.join(process.cwd(), '.http-cache');
    if( !fs.existsSync(this.localCacheDir) ) {
      fs.mkdirSync(this.localCacheDir);
    }

    this.cache = {};
  }

  get(url) {
    url = this.hash(url);
    if( this.cache[url] ) {
      return this.cache[url].response;
    }

    let cacheFile = this.getCacheFile(url);
    if( fs.existsSync(cacheFile) ) {
      let cache = JSON.parse(fs.readFileSync(cacheFile));
      this.cache[url] = cache;
      return cache.response;
    }

    return null;
  }

  set(url, response) {
    let hash = this.hash(url);
    this.cache[hash] = {url, response};
    fs.writeFileSync(this.getCacheFile(hash), JSON.stringify(this.cache[hash]));
  }

  getCacheFile(hash) {
    return path.join(this.localCacheDir, hash+'.json');
  }

  hash(url) {
    return crypto.createHash('md5').update(url).digest('hex');
  }

}

const instance = new HTTPCache();
export default instance;