import wp from '../wp.js';
import config from '../config.js';
import { JSDOM } from "jsdom";
import striptags from "striptags";
import fetch from 'node-fetch';
import path from 'path';
import crypto from 'crypto';
import {rawHandler, serialize} from "@wordpress/blocks";
import blockLibrary from "@wordpress/block-library";
import flexContent from "./flex-content.js";

blockLibrary.registerCoreBlocks();

class ExhibitTransform {
  
  constructor(post) {
    this.post = post;
  }

  async run(opts={}) {
    console.log('Transforming exhibit '+this.post.id+': '+this.post.slug);
    let exists = await this.removeExistingPost(opts);
    if( opts.skipExisting && exists ) return console.log('  Post exists, skipping.')

    this.parseContent();
    this.parseACF();
    await this.author();
    await this.featuredMedia();
    if( opts.embedMedia !== false ) {
      await this.embedMedia();
    }

    this.createNewPost();

    let resp = await wp.create('exhibit', this.newPost);
    console.log(' New exhibit id: '+resp.id);
  }

  async removeExistingPost(opts, count=1) {
    while( 1 ) {
      let slug = this.post.slug;
      if( count > 1 ) slug = slug+'-'+count;
      console.log(` Searching for existing exhibit ${slug} on ${config.sink.host}`);

      let existingPost = await wp.find('exhibit', 'slug', slug, {source: false, cache: false});
      if( !existingPost ) return false;
      else if( opts.skipExisting ) return true;

      console.log(` Found existing exhibit ${slug} on ${config.sink.host}: ${existingPost.id}, removing`);
      await wp.delete('exhibit', existingPost.id);

      count++;
      await this.removeExistingPost(opts, count);
    }
  }

  async parseACF() {
    this.post.meta = {};

    let acf = this.post.acf || {};
    if( acf.curator ) {
      if( !Array.isArray(acf.curator) ) {
        acf.curator = [acf.curator];
      }
      this.post.curator = [];
      for( let item of acf.curator ) {
        this.post.curator.push(
          await this.getTaxId('curator',  item)
        );
      }
    }

    if( acf.exhibit_location ) {
      if( !Array.isArray(acf.exhibit_location) ) {
        acf.exhibit_location = [acf.exhibit_location];
      }
      this.post['exhibit-location'] = [];
      for( let item of acf.exhibit_location ) {
        this.post['exhibit-location'].push(
          await this.getTaxId('exhibit-location',  item)
        );
      }
    }

    this.post.meta.isOnline = acf.online_exhibit;
    this.post.meta.isPermanent = acf.permanent_exhibit;
    this.post.meta.isPhysical = acf.exhibit_location ? true : false;
    this.post.meta.dateFrom = acf.start_date;
    this.post.meta.dateTo = acf.end_date;
    this.post.meta.curationNotes = acf.curation_notes;
  }

  parseContent() {
    this.content = this.post.content.rendered;
    
    // add ucd flex content
    this.flexContentHtml = (this.post?.acf?.ucd_pages_flexible_content || [])
      .map(item => flexContent.transform(item))
      .join('\n');

    // this.flexContentHtml = (this.post?.acf?.ucd_pages_flexible_content || [])
    // console.log(this.flexContentHtml);

    this.content += this.flexContentHtml;
    this.window = (new JSDOM(this.content)).window;
  }

  createNewPost() {
    // parse the html to gutenberg blocks
    let content = this.content.replaceAll(config.source.host, config.sink.host);
    let raw = rawHandler({HTML: content});
    let html = serialize(raw);

    // if there is flex content, inject css headers.
    if( this.flexContentHtml ) {
      html = flexContent.cssHeader()+html; 
    }

    this.newPost = {
      date: this.post.date,
      date_gmt : this.post.date_gmt,
      modified: this.post.modified,
      modified_gmt : this.post.modified_gmt,
      status : this.post.status,
      slug : this.post.slug,
      status : this.post.status,
      type : this.post.type,
      title : striptags(this.post.title.rendered),
      content : html,
      excerpt : striptags(this.post.excerpt.rendered),
      author : this.post.author,
      featured_media : this.post.featured_media,
      meta : this.post.meta,
      curator : this.post.curator,
      'exhibit-location' : this.post['exhibit-location']
    };
  };

  async author() {
    console.log(' Author: '+this.post.author);
    let sourceAuthor = await wp.get('user', this.post.author);
    let item = await wp.find('user', 'slug', sourceAuthor.slug, false);
    if( !item ) {
      console.log('  - unable to locate, generating new user: '+sourceAuthor.username);
      item = await wp.create('user', {
        username : sourceAuthor.username,
        name : sourceAuthor.name,
        first_name : sourceAuthor.first_name,
        last_name : sourceAuthor.last_name,
        email : sourceAuthor.email,
        url : sourceAuthor.url,
        description : sourceAuthor.description,
        locale : sourceAuthor.locale,
        nickname : sourceAuthor.nickname,
        slug : sourceAuthor.slug,
        roles : sourceAuthor.roles,
        password : crypto.randomBytes(24).toString('hex'),
        meta : sourceAuthor.meta,
        acf : sourceAuthor.acf
      });
    }

    this.post.author = item.id;
    console.log('  - mapped to: '+item.id);

    let person = await wp.find('person', 'username',  item.slug, {source: false, cache: false});

    if( person ) {
      this.post.meta.curators = [person.id];
      console.log('  - mapped curator to person: '+person.id);
    }
  }

  async featuredMedia() {
    if( !this.post.featured_media ) return; // sometimes this is set to 0, which we want to ignore as well.

    console.log(' Featured Media: '+this.post.featured_media);
    let sourceMedia = await wp.get('media', this.post.featured_media);
    let item = await wp.find('media', 'slug', sourceMedia.slug, false);
    if( !item ) {
      console.log('  - unable to locate, generating new media');
      item = await this._createMediaFromSrc(sourceMedia);
    }

    this.post.featured_media = item.id;
    console.log('  - mapped to: '+item.id);
  }

  async embedMedia() {
    let tmp = new Set();
    let sources = Array.from(this.window.document.querySelectorAll('img,a'))
      .filter(ele => (ele.src || ele.href || '').match('/wp-content/uploads/'))
      .forEach(ele => tmp.add(ele.src || ele.href));
    sources = Array.from(tmp);


    for( let src of sources ) {
      // some sources are just the path, but the source_url is full url
      let orgSrc = src;
      if( !src.match(/^http(s)?:\/\//) ) {
        src = config.source.host+src;
      }
      console.log(' Embed Media: '+src);
      let sourceMedia = await wp.find('media', 'source_url', src);
      if( !sourceMedia ) {
        console.error('Unable to find source media: '+src);
        continue;
      }
      
      let sinkMedia = await wp.find('media', 'slug', sourceMedia.slug, false);
      if( !sinkMedia ) {
        console.log('  - unable to locate, generating new media');
        sinkMedia = await this._createMediaFromSrc(sourceMedia);
      }

      this.content = this.content
        .replaceAll(orgSrc, sinkMedia.source_url)
        .replaceAll('wp-image-'+sourceMedia.id, 'wp-image-'+sinkMedia.id)
        .replaceAll('attachment_'+sourceMedia.id, 'attachment_'+sinkMedia.id)        

      console.log('  - mapped to: '+sinkMedia.id);
    }
  }

  async _createMediaFromSrc(sourceMedia) {
    let resp = await fetch(sourceMedia.source_url);
    let blob = await resp.blob();

    return wp.createMedia(
      path.parse(sourceMedia.media_details.file || sourceMedia.media_details.original_image || sourceMedia.source_url).base, 
      sourceMedia.mime_type,
      blob,
      {
        date : sourceMedia.date,
        date_gmt : sourceMedia.date_gmt,
        modified : sourceMedia.modified,
        modified_gmt : sourceMedia.modified_gmt,
        slug : sourceMedia.slug,
        // status : sourceMedia.status, TODO
        title : sourceMedia.title.rendered,
        // author : TODO
        description : striptags(sourceMedia.description.rendered),
        caption : sourceMedia.caption.rendered
      }
    );
  }

  async getTaxId(tax, label) {
    let slug = clean(label);

    // console.log(tax, 'slug', slug);
    let item = await wp.find(tax, 'slug', slug, {source: false, cache: false});
    // console.log((item || {}).id);
  
    if( !item ) {
      let data = {
        slug : slug,
        name : label,
        status : 'publish',
        description : ''
      }
      
      console.log('Creating tax', tax, data);
      item = await wp.create(tax, data);
    }
    return item.id;    
  }

}

function clean(txt) {
  if( !txt ) txt = '';
  return txt.toLowerCase()
    .replace(/[^A-Za-z0-9 ]/g, '')
    .replace(/ /g, '-')
    .replace(/-+/g, '-');
}

export {ExhibitTransform};
