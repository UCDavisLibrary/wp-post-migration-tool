import fs from 'fs';
import path from 'path';
import { stringify } from 'csv-stringify';

class Query {

  load(file) {
    return JSON.parse(fs.readFileSync(file), 'utf-8');
  }

  export(file, minHits=5) {
    let data = this.load(file);
    let all = {};

    console.log(data.stats);

    for( let path in data.success ) {
      all[path] = {
        path,
        successHits : data.success[path],
        redirectHits : 0,
        responseType : 'success'
      }
    }

    for( let path in data.redirects ) {
      if( !all[path] ) {
        all[path] = {
          path,
          successHits : 0,
          redirectHits : data.redirects[path],
          responseType : data.error[path] ? 'error' : 'redirect'
        }
      } else {
        all[path].redirectHits = data.redirects[path];
      }
    }

    let arr = Object.values(all);
    console.log('Total paths: '+arr.length);

    arr = arr.filter(row => row.successHits >= minHits || row.redirectHits >= minHits)
      .map(row => {
        row.type = row.path.replace(/^\//, '').split('/')[0].toLowerCase();
        row.isFile = row.path.match(/\.[a-z0-9]+$/) ? 'true' : 'false';
        row.extension = row.path.match(/\.[a-z0-9]+$/);
        row.extension = row.extension ? row.extension[0] : '';

        return row
      })


    arr.sort((a,b) => {
      if( !a.successHits && !b.successHits ) {
        return a.redirectHits < b.redirectHits ? 1 : -1
      }
      return a.successHits < b.successHits ? 1 : -1
    });

    console.log('Paths with more than '+minHits+' hits: '+arr.length);

    stringify(arr, function(err, output) {
      output = 'path,success_hits,redirect_hits,response_type,type,is_file,extension\n'+output;

      let parsed = path.parse(file);
      fs.writeFileSync(
        path.join(parsed.dir, parsed.name+'-'+minHits+'.csv'),
        output
      )
    });

  }

}

const instance = new Query();
instance.export(path.join(process.cwd(), 'logs', 'crawl-stats.json'))