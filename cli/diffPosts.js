import "../lib/browser.js"; // must be first import!
import wp from "../lib/wp.js";
import config from "../lib/config.js"
import errors from "../lib/errors.js";

const TYPE = 'posts';
// const TYPE = 'exhibit';

async function allPosts() {
  let page = 1;

  console.log('Diffing from '+config.source.host+' to '+config.sink.host);

  let {host, apiPath} = config.source;
  while( 1 ) {
    let list = await wp.fetchJson(host+apiPath+'/'+TYPE+'?per_page=100&page='+page, true, false);
    
    for( let result of list ) {
      try {
        let slug = result.slug;
        // console.log(`Searching for existing post ${slug} on ${config.sink.host}`);

        let existingPost = await wp.find('post', 'slug', slug, {source: false, cache: false});
        if( !existingPost ) {
          console.log(` - ${slug} found on source (${config.source.host}) but not sink (${config.sink.host})`);
          await wp.fetchDelete(host+apiPath+'/'+TYPE+'/'+result.id, config.source);
          console.log(' - post removed');
        } else if( existingPost.status !== 'publish' ) {
          console.log(existingPost.status);
          console.log(` - ${slug} found on sink (${config.sink.host}) but not published, removing`);
          await wp.fetchDelete(host+apiPath+'/'+TYPE+'/'+result.id, config.source);
          console.log(' - post removed');
        }
  
      } catch(e) {
        console.error('Failed to diff post: '+result.id);
        console.error(e);
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