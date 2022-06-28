import { parse } from 'csv-parse';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import PersonPost from '../lib/transform/person.js';


function readCsv() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const csvContent = fs.readFileSync(
    path.resolve(__dirname, '..', 'directory-profiles.csv'), 'utf-8'
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

    let person = new PersonPost(row);
    await person.parse();
    
    c++;
    if( c == 200 ) break;
  }

})();