import "../lib/browser.js"; // must be first import!
import wp from "../lib/wp.js";
import config from "../lib/config.js"
import striptags from "striptags";
import fetch from 'node-fetch';
import {JSDOM} from 'jsdom';

const TYPE = 'database';

const REDIRECTS_GROUP = 6;

async function allDatabases() {
  let page = 1;

  console.log(config.sink.host);

  let {host, apiPath, redirectApiPath} = config.source;
  while( 1 ) {
    let list = await wp.fetchJson(host+apiPath+'/'+TYPE+'?per_page=100&page='+page, true, false);
    
    for( let result of list ) {

      let link
      try {
        // let resp = await fetch(result.link);
        // let window = (new JSDOM(await resp.text())).window;
        // link = window.document.querySelector('a[data-db-location]').getAttribute('href');
        // let url = new URL(result.link);



        let sourcePath = new URL(result.link).pathname;
        link = config.libguides.host+config.libguides.azQueryPath+(sourcePath.replace(/(^\/|\/$)/g, '').split('/').pop())
        console.log(sourcePath, link);

        let test = new URL(config.sink.host+config.sink.redirectApiPath);
        test.searchParams.append('filterBy[url]', sourcePath);
        test.searchParams.append('filterBy[status]', 'enabled');
        test.searchParams.append('filterBy[action]', 'url');
        let resp = (await wp.fetchJson(test.href, false, false)).items;
        
        let alreadyCreated = false;
        for( let item of resp ) {
          if( item.url === sourcePath ) {
            console.log('  - redirect already set');
            alreadyCreated = true;
            break;
          }
        }
        if( alreadyCreated ) continue;

        resp = await wp.postJson(
          config.sink.host+config.sink.redirectApiPath,
          {
            status : 'enabled',
            url : new URL(result.link).pathname,
            match_type : 'url',
            action_type : 'url',
            group_id: REDIRECTS_GROUP,
            action_data : {url: link}
          }
        );
        console.log('  - created');

      } catch(e) {
        console.error('Failed to migrate database: '+result.id, link);
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

allDatabases();