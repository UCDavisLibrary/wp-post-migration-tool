import fs from "fs";
import path from "path";
import { stringify } from 'csv-stringify';

const reRedirect = /^(RewriteRule|redirect)/i;

function redirects(file) {
  let contents = fs.readFileSync(file, 'utf-8');
  contents = contents.split('\n');

  let arr = [];
  for( let line of contents ) {
    if( !line.match(reRedirect) ) continue;
    let [type, rule, destination, opts] = line.split(/[\r\t\s\n]+/);

    if( type.toLowerCase() === 'redirect' ) {
      rule = '^'+destination+"$";
      destination = opts;
      opts = '302';
    }

    arr.push({type, rule, destination, opts})
  }

  stringify(arr, (err, output) => {
    output = 'type,rule,destination,opts\n'+output;

    fs.writeFileSync(
      path.join(process.cwd(), 'logs', 'htaccess.csv'),
      output
    )
  });


}

redirects(path.join(process.cwd(), '.htaccess'));