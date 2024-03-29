import config from "./config.js";
import fetch from "node-fetch";
import cache from './http-cache.js';

class WPApi {

  constructor() {
    this.PAGE_SIZE = 100;
  }

  /**
   * @method getTypeName
   * @description  make plural, api creaat endpoint hits the list endpoint with a POST
   *
   * @param {String} type
   * @returns
   */
  getTypeName(type) {
    if( type === 'media' ) return type;
    if( type === 'exhibit' ) return type;
    if( type === 'library' ) return type;
    if( type === 'expertise' ) return type;
    if( type === 'department' ) return type;
    if( type === 'person' ) return type;
    if( type === 'directory-tag' ) return type;
    if( type === 'exhibit-location' ) return type;
    if( type === 'curator' ) return type;

    if( !type.match(/s$/) ) {
      if( type.match(/y$/) ) type = type.replace(/y$/, 'ies');
      else type = type+'s';
    }
    return type;
  }

  create(type, body, id='') {
    let {host, apiPath} = config.sink;
    if( id ) id = '/'+id;
    return this.postJson(host+apiPath+'/'+this.getTypeName(type)+id, body);
  }

  async createMedia(filename, mimetype, blob, body) {
    let {host, apiPath} = config.sink;

    console.log('     Creating media: '+filename);
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
    console.log('     Appending media metadata '+resp.id+': '+filename);
    return this.create('media', body, resp.id);
  }

  get(type, id, source=true) {
    let {host, apiPath} = config[source ? 'source' : 'sink'];
    if( type ==='user' ) {
      id = id+'?context=edit';
    }

    return this.fetchJson(host+apiPath+'/'+this.getTypeName(type)+'/'+id, source);
  }

  delete(type, id) {
    let {host, apiPath} = config.sink;
    return this.fetchDelete(host+apiPath+'/'+this.getTypeName(type)+'/'+id);
  }

  async find(type, key, value, opts={}) {
    if( typeof opts === 'boolean' ) opts = {source: opts, cache:true};
    else if( opts.source === undefined ) opts.source = true;

    let {host, apiPath} = config[opts.source === true ? 'source' : 'sink'];
    type = this.getTypeName(type);
    let page = 1;

    let additionalParams = '';
    if( type === 'posts' ) {
      additionalParams = '&status=publish,draft,pending,private,future'
    }

    console.log('   ...searching for '+type+' with '+key+'='+value);

    let list;
    while( 1 ) {
      // console.log('   ...searching page: '+page);

      try {
        list = await this.fetchJson(host+apiPath+'/'+type+'?per_page='+this.PAGE_SIZE+'&page='+page+additionalParams, opts.source, opts.cache);
      } catch(e) {
        console.log(e);
        // ignore for now.  TODO.  how should we handle this?
        // normally it means some form of bad page query, but we don't want to stop...
        return;
      }

      if( !Array.isArray(list) ) return;
      if( list.length === 0 ) break;

      for( let result of list ) {
        if( result[key] === value ) {
          return result;
        }
        if( result.meta && result.meta[key] === value ) {
          return result;
        }
        if ( type === 'media' && key === 'source_url' && result?.media_details?.sizes ){
          for( let size in result.media_details.sizes ) {
            if( result.media_details.sizes[size].source_url === value ) {
              return result;
            }
          }
        }
      }

      if( list.length < this.PAGE_SIZE ){
        break;
      }

      page++;
    }

    return null
  }

  async fetchJson(url, source, useCache=true) {
    let cacheHit = cache.get(url);

    if( useCache === true && cacheHit && source ) {
      return cacheHit;
    }

    let {username, key} = config[source ? 'source' : 'sink'];
    let resp = await fetch(url, {
      headers : {
        'Authorization' : 'Basic '+ btoa(username+':'+key)
      }
    });

    if( resp.status < 200 || resp.status > 299 ) {
      throw new Error('GET Request to '+url+' returned invalid status code: '+resp.status+' '+(await resp.text()));
    }

    let json = await resp.json();
    if( useCache === true && source ) {
      cache.set(url, json);
    }
    return json;
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

    if( resp.status < 200 || resp.status > 299 ) {
      throw new Error('POST Request to '+url+' returned invalid status code: '+resp.status+' '+(await resp.text()));
    }

    return resp.json();
  }

  async fetchDelete(url, usernameKey) {
    let {username, key} = usernameKey || config.sink;
    let resp = await fetch(url+'?force=true', {
      method: 'DELETE',
      headers : {
        'Authorization' : 'Basic '+ btoa(username+':'+key)
      }
    });

    if( resp.status < 200 || resp.status > 299 ) {
      throw new Error('DELETE Request to '+url+' returned invalid status code: '+resp.status);
    }

    return resp.json();
  }

}


const instance = new WPApi();
export default instance;
