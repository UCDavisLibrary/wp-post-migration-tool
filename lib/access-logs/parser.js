import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import uaParser from 'ua-parser-js';

class AccessLogParser {

  constructor() {
    this.filters = [
      /.*null.*/i,
      /http(s?):\/\//i,
      /\.cfg$/i,
      /\.\.+/,
      /%2/
    ];
  }


  async crawl(dir, data={}) {
    if( !data.stats ) {
      data.stats = {
        files : 0,
        enteries : 0
      },
      data.redirects = {};
      data.success = {};
      data.error = {};
    }

    let files = fs.readdirSync(dir);
    for( let file of files ) {
      file = path.join(dir, file);

      if( fs.lstatSync(file).isDirectory() ) {
        await this.crawl(file, data);
      } else {
        await this.parse(file, data);
      }
    }

    return data;
  }

  async parse(file, data) {
    if( !file.match(/\/access_log.gz/) ) return;
    console.log('FILE '+data.stats.files+': '+file);

    data.stats.files++;

    let lines, overflow;

    return new Promise((resolve, reject) => {
      fs.createReadStream(file)
        .pipe(zlib.createGunzip())
        .on('data', raw => {
          overflow += raw.toString('utf-8');
          lines = overflow.split('\n');
          overflow = lines.pop();

          for( let line of lines ) {
            data.stats.enteries++;
            this.parseLine(line, data);
          }
        })
        .on('close', () => {
          this.parseLine(overflow, data);
          resolve();
        })
        .on('error', e => reject(e));
    });
  }

  parseLine(line='', data) {
    let matched = line.match(/"([A-Z]+)\s(.+?)\s(HTTP.+?)"\s(\d\d\d).+?".+?"\s"(.+?)"/);
    if( !matched ) return;

    let [full, method, path, httpVersion, statusCode, userAgent] = matched;

    statusCode = parseInt(statusCode);
    path = path.replace(/\?.*/, '').replace(/\/\/+/g, '/');

    if( method !== 'GET' ) return;

    for( let filter of this.filters ) {
      if( path.match(filter) ) return;
    }

    let ua = uaParser(userAgent);
    if( ua.browser.name === undefined || userAgent.match(/bot/)) {
      return;
    }

    if( statusCode >= 300 && statusCode <= 399 ) {
      if( !data.redirects[path] ) data.redirects[path] = 1;
      else data.redirects[path]++;
    }

    if( statusCode >= 200 && statusCode <= 299 ) {
      if( !data.success[path] ) data.success[path] = 1;
      else data.success[path]++;
    }

    if( statusCode > 399 ) {
      if( !data.error[path] ) data.error[path] = 1;
      else data.error[path]++;
    }
  }

}

const instance = new AccessLogParser();

let data = await instance.crawl(path.join(process.cwd(), 'logs', 'years'));

fs.writeFileSync(
  path.join(process.cwd(), 'logs', 'crawl-stats.json'),
  JSON.stringify(data)
)