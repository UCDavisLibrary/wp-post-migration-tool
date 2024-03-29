import "../lib/browser.js"; // must be first import!
import wp from "../lib/wp.js";
import config from "../lib/config.js"
import {ExhibitTransform} from "../lib/transform/exhibit.js";
import errors from "../lib/errors.js";

const TYPE = 'exhibit';

async function allPosts() {
  let page = 1;

  console.log('Migrating from '+config.source.host+' to '+config.sink.host);

  let {host, apiPath} = config.source;
  while( 1 ) {
    let list = await wp.fetchJson(host+apiPath+'/'+TYPE+'?per_page=100&page='+page, true, false);
    // let list = await wp.fetchJson('https://www.library.ucdavis.edu/wp-json/wp/v2/exhibit/59884', true, false);
    // let list = await wp.fetchJson('https://www.library.ucdavis.edu/wp-json/wp/v2/exhibit/13585', true, false);

    // list = [list];

    // let list = [8791, 7655, 39920, 38860, 33913, 42538, 14241, 43828, 8802, 8399];

    for( let result of list ) {
    // for( let id of list) {
      // let result =  await wp.fetchJson('https://www.library.ucdavis.edu/wp-json/wp/v2/exhibit/'+id, true, false)
      try {
        let transform = new ExhibitTransform(result);
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

allPosts();