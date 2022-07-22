import "../lib/browser.js"; // must be first import!
import wp from "../lib/wp.js";
import config from "../lib/config.js"
import striptags from "striptags";

const TYPE = 'article';
const SLUG_PATH = '/guide-missing/';

const REDIRECTS_GROUP = 3;

async function allGuides() {
  let page = 1;

  let {host, apiPath, redirectApiPath} = config.source;
  while( 1 ) {
    let list = await wp.fetchJson(host+apiPath+'/'+TYPE+'?per_page=100&page='+page, true, false);
    
    for( let result of list ) {
      try {
        let author = await wp.get('user', result.author);

        let url = new URL(config.sink.host+SLUG_PATH);
        url.searchParams.append('contact_name', author.name);
        url.searchParams.append('contact_id', author.email.replace(/@.*/, ''));
        url.searchParams.append('type', 'libguide');
        url.searchParams.append('guide_name', striptags(result.title.rendered));

        let sourcePath = new URL(result.link).pathname;
        console.log(sourcePath, url.href.replace(config.sink.host, ''));

        let test = new URL(config.sink.host+config.sink.redirectApiPath);
        test.searchParams.append('filterBy[url]', sourcePath);
        test.searchParams.append('filterBy[status]', 'enabled');
        test.searchParams.append('filterBy[action]', 'url');
        let resp = (await wp.fetchJson(test.href, false, false)).items;
        for( let item of resp ) {
          if( item.url === sourcePath ) {
            console.log('  - redirect already set');
            continue;
          }
        }

        resp = await wp.postJson(
          config.sink.host+config.sink.redirectApiPath,
          {
            status : 'enabled',
            url : new URL(result.link).pathname,
            match_type : 'url',
            action_type : 'url',
            group_id: REDIRECTS_GROUP,
            action_data : {url: url.href.replace(config.sink.host, '')}
          }
        );
        console.log('  - created');

      } catch(e) {
        console.error('Failed to migrate guide: '+result.id);
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

allGuides();