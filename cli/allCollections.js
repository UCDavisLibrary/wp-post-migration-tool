import { parse } from 'csv-parse';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import CollectionPost from '../lib/transform/collection.js';


function readCsv() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const csvContent = fs.readFileSync(
      path.resolve(__dirname, '..', 'samp.csv'), 'utf-8'
    );
  
    return new Promise((resolve, reject) => {
      parse(csvContent, {
        columns: true
      }, (err, records) => {
        if( err ) reject(err);
        else resolve(records);
      });
    });
  }
  
  (async function() {
    let csvContent = await readCsv();
    let c = 0;
  
    for( let row of csvContent ) {
      for( let key in row ) {
        row[key] = row[key].trim();
      }
  
      let collection = new CollectionPost(row);
      await collection.parse();
      
      c++;
      if( c == 200 ) break;
    }
  
  })();