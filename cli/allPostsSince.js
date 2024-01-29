import "../lib/browser.js"; // must be first import!
import wp from "../lib/wp.js";
import config from "../lib/config.js"
import {PostTransform} from "../lib/transform/index.js";
import errors from "../lib/errors.js";

const TYPE = 'posts';
const SINCE = '2022-01-01T00:00:00';

async function allPostsSince() {
  let page = 1;

  console.log('Migrating from '+config.source.host+' to '+config.sink.host);
  console.log('Migrating posts since '+SINCE);

  let {host, apiPath} = config.source;
  while( 1 ) {
    let list = await wp.fetchJson(host+apiPath+'/'+TYPE+'?per_page=100&page='+page+'&after='+SINCE, true, false);
    // let list = [await wp.fetchJson(host+apiPath+'/'+TYPE+'/60211', true, false)]

    for( let result of list ) {
      try {
        let transform = new PostTransform(result);
        await transform.run({skipExisting: true});
      } catch(e) {
        console.error('Failed to migrate post: '+result.id);
        console.error(e);
        errors.handle(result, {
          error : {
            message : e.message,
            stack : e.stack
          },
          description: 'Failed to migrate post: '+result.id
        });
      }
    }

    if( list.length < 100 ){
      break;
    }

    page++;
  }

  process.exit();
}

allPostsSince();
