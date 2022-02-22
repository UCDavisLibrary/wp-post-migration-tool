import config from "./config.js";
import fetch from "node-fetch";

class WPApi {

  getPost(id, source=true) {
    let {host, apiPath} = config[source ? 'source' : 'sink'];
    return this.fetchJson(host+apiPath+'/posts/'+id);
  }

  getPost(id, source=true) {
    let {host, apiPath} = config[source ? 'source' : 'sink'];
    return this.fetchJson(host+apiPath+'/posts/'+id);
  }

  getCategory(id, source=true) {
    let {host, apiPath} = config[source ? 'source' : 'sink'];
    return this.fetchJson(host+apiPath+'/categories/'+id);
  }

  async find(type, key, value, source=true) {
    let {host, apiPath} = config[source ? 'source' : 'sink'];
    let page = 1;

    while( 1 ) {
      let list = await this.fetchJson(host+apiPath+'/'+type+'?per_page=50&page='+page);
      if( list.length === 0 ) break;

      for( let result of list ) {
        if( result[key] === value ) {
          return result;
        }
      }

      page++;
    }

    return null
  }

  async fetchJson(url) {
    let resp = await fetch(url, {
      headers : {
        'Authorization' : 'Basic '+ (config.sink.username+':'+config.sink.key).toString('base64')
      }
    });
    return resp.json();
  }

}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const instance = new WPApi();
export default instance;