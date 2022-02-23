import config from "./config.js";
import fetch from "node-fetch";
import fs from 'fs';

class WPApi {

  /**
   * @method getTypeName
   * @description  make plural, api creaat endpoint hits the list endpoint with a POST
   * 
   * @param {String} type 
   * @returns 
   */
  getTypeName(type) {
    if( type === 'media' ) return type;
    if( !type.match(/s$/) ) {
      if( type.match(/y$/) ) type = type.replace(/y$/, 'ies');
      else type = type+'s';
    }
    return type;
  }

  create(type, body) {
    let {host, apiPath} = config.sink;
    return this.postJson(host+apiPath+'/'+this.getTypeName(type), body);
  }

  async createMedia(filename, mimetype, blob, body) {
    let {host, apiPath} = config.sink;

    // TODO: handle author

    let resp = await fetch(host+apiPath+'/media', {
      method: 'POST',
      headers : {
        'Content-Disposition':`attachment; filename="${filename}"`,
        'Authorization' : 'Basic '+ btoa(config.sink.username+':'+config.sink.key),
        'Content-type': mimetype
      },
      body : blob
    });
    resp = await resp.json();

    body.id = resp.id;
    return this.create('media', body);
  }

  get(type, id, source=true) {
    let {host, apiPath} = config[source ? 'source' : 'sink'];
    return this.fetchJson(host+apiPath+'/'+this.getTypeName(type)+'/'+id, source);
  }

  delete(type, id) {
    let {host, apiPath} = config.sink;
    return this.fetchDelete(host+apiPath+'/'+this.getTypeName(type)+'/'+id);
  }

  async find(type, key, value, source=true) {
    let {host, apiPath} = config[source ? 'source' : 'sink'];
    type = this.getTypeName(type);
    let page = 1;

    let additionalParams = '';
    if( type === 'posts' ) {
      additionalParams = '&status=publish,draft,pending,private,future'
    }

    while( 1 ) {
      let list = await this.fetchJson(host+apiPath+'/'+type+'?per_page=50&page='+page+additionalParams, source);
      if( !Array.isArray(list) ) return;
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

  async fetchJson(url, source) {
    let {username, key} = config[source ? 'source' : 'sink'];
    let resp = await fetch(url, {
      headers : {
        'Authorization' : 'Basic '+ btoa(username+':'+key)
      }
    });
    return resp.json();
  }

  async postJson(url, body) {
    let resp = await fetch(url, {
      method : 'POST',
      headers : {
        'Authorization' : 'Basic '+ btoa(config.sink.username+':'+config.sink.key),
        'content-type' : 'application/json'
      },
      body : JSON.stringify(body)
    });
    return resp.json();
  }

  async fetchDelete(url) {
    let resp = await fetch(url+'?force=true', {
      method: 'DELETE',
      headers : {
        'Authorization' : 'Basic '+ btoa(config.sink.username+':'+config.sink.key)
      }
    });
    return resp.json();
  }

}


const instance = new WPApi();
export default instance;