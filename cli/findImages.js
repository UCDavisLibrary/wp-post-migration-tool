import "../lib/browser.js"; // must be first import!
import wp from "../lib/wp.js";
import config from "../lib/config.js"
import {PostTransform} from "../lib/transform/index.js";
import errors from "../lib/errors.js";
import imageTransform from '../lib/transform/images.js'


const TYPE = 'posts';
// const TYPE = 'exhibit';

let ids = [];

async function allPosts() {
  let page = 1;

  console.log('Migrating from '+config.source.host+' to '+config.sink.host);

  let {host, apiPath} = config.source;
  // while( 1 ) {
  //   let list = await wp.fetchJson(host+apiPath+'/'+TYPE+'?per_page=100&page='+page, true, false);
    
  //   for( let result of list ) {
  //     imageTransform(result.content.rendered);
  //   }

  //   if( list.length < 100 ){
  //     break;
  //   }

  //   page++;
  // }
  let item = await wp.fetchJson(host+apiPath+'/'+TYPE+'/52371', true, false);
  imageTransform(item.content.rendered);

  process.exit();
}

allPosts();