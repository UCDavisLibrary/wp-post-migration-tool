import fs from 'fs';
import path from 'path';
import { stringify } from 'csv-stringify';

class Query {

  load(file) {
    return JSON.parse(fs.readFileSync(file), 'utf-8');
  }

  export(file, minHits=5) {
    let data = this.load(file);
    let total = {};

    console.log(data.stats);

    ['redirects', 'success'].forEach(type => {
      for( let path in data[type] ) {
        if( !total[path] ) total[path] = data[type][path];
        else total[path] += data[type][path];
      }
    });

    console.log('Total paths: '+Object.keys(total).length);

    let arr = [];
    for( let path in total ) {
      arr.push({path, count: total[path]});
    }

    arr = arr.filter(row => row.count >= minHits)
      .map(row => {
        row.type = row.path.replace(/^\//, '').split('/')[0].toLowerCase();
        row.isFile = row.path.match(/\.[a-z0-9]+$/) ? 'true' : 'false';
        row.extension = row.path.match(/\.[a-z0-9]+$/);
        row.extension = row.extension ? row.extension[0] : '';

        return row
      })


    arr.sort((a,b) => a.count < b.count ? 1 : -1);

    console.log('Paths with more than '+minHits+' hits: '+arr.length);

    stringify(arr, function(err, output) {
      output = 'path,hits,type,is_file,extension\n'+output;

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