import wp from '../wp.js';
import config from '../config.js';
import { JSDOM } from "jsdom";
import striptags from "striptags";
import fetch from 'node-fetch';
import path from 'path';
import {rawHandler, serialize} from "@wordpress/blocks";
import blockLibrary from "@wordpress/block-library";
blockLibrary.registerCoreBlocks();

class PostTransform {
  
  constructor(post) {
    this.post = post;
    // console.log(post);
  }

  async run() {
    console.log('Transforming post '+this.post.id+': '+this.post.slug);
    await this.removeExistingPost();

    this.parseContent();
    // await this.author();
    await this.categories();
    await this.tags();
    await this.featuredMedia();
    await this.embedMedia();

    this.createNewPost();
    let resp = await wp.create('post', this.newPost);
    console.log(' New post id: '+resp.id);
  }

  async removeExistingPost() {
    while( 1 ) {
      let existingPost = await wp.find('post', 'slug', this.post.slug, false);
      if( !existingPost ) return;

      console.log(` Found existing post ${this.post.slug} on ${config.sink.host}: ${existingPost.id}, removing`);
      await wp.delete('post', existingPost.id);
    }
  }

  parseContent() {
    this.window = (new JSDOM(this.post.content.rendered)).window;
    this.content = this.post.content.rendered;
  }

  createNewPost() {
    // parse the html to gutenberg blocks
    let content = this.content.replaceAll(config.source.host, config.sink.host);
    let raw = rawHandler({HTML: content});
    let html = serialize(raw);

    this.newPost = {
      date: this.post.date,
      date_gmt : this.post.date_gmt,
      modified: this.post.modified,
      modified_gmt : this.post.modified_gmt,
      status : this.post.status,
      slug : this.post.slug,
      type : this.post.type,
      title : striptags(this.post.title.rendered),
      // content : this.post.content.rendered.replaceAll(config.source.host, config.sink.host),
      content : html,
      excerpt : striptags(this.post.excerpt.rendered),
      // author : this.post.author,
      featured_media : this.post.featured_media,
      meta : this.post.meta,
      categories : this.post.categories,
      tags : this.post.tags
    };
  };

  async author() {
    console.log(' Author: '+this.post.author);
    let sourceAuthor = await wp.get('user', this.post.author);
    // console.log(sourceAuthor)

    let item = await wp.find('user', 'id', this.post.author, false);
    if( !item ) {
      console.log('  - unable to locate, generating new user');
      // item = await wp.create('user', {
      //   username : sourceAuthor.slug,
      //   name : sourceAuthor.name,
      //   description : sourceAuthor.description
      // });
    }

    this.post.author = '';
    console.log('  - mapped to: '+item.id);
  }

  async featuredMedia() {
    console.log(' Featured Media: '+this.post.featured_media);
    let sourceMedia = await wp.get('media', this.post.featured_media);
    let item = await wp.find('media', 'slug', sourceMedia.slug, false);
    if( !item ) {
      console.log('  - unable to locate, generating new media');
      console.log(sourceMedia);
      item = await this._createMediaFromSrc(sourceMedia);
    }

    this.post.featured_media = item.id;
    console.log('  - mapped to: '+item.id);
  }

  async embedMedia() {
    let sources = Array.from(this.window.document.querySelectorAll('img'))
      .filter(ele => (ele.src || '').match('/wp-content/uploads/'))
      .map(ele => ele.src);

    for( let src of sources ) {
      let sourceMedia = await wp.find('media', 'source_url', src);
      console.log(' Embed Media: '+sourceMedia.id);

      let sinkMedia = await wp.find('media', 'slug', sourceMedia.slug, false);
      if( !sinkMedia ) {
        console.log('  - unable to locate, generating new media');
        sinkMedia = await this._createMediaFromSrc(sourceMedia);
      }

      this.content = this.content
        .replaceAll(src, sinkMedia.source_url)
        .replaceAll('wp-image-'+sourceMedia.id, 'wp-image-'+sinkMedia.id)
      console.log('  - mapped to: '+sinkMedia.id);
    }
  }

  async _createMediaFromSrc(sourceMedia) {
    let resp = await fetch(sourceMedia.source_url);
    let blob = await resp.blob();

    return wp.createMedia(
      path.parse(sourceMedia.media_details.file || sourceMedia.media_details.original_image).base, 
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

  async categories() {
    let newCatIds = [];

    for( let catId of this.post.categories ) {
      console.log(' Category: '+catId);
      let sourceCategory = await wp.get('category', catId);

      let item = await wp.find('category', 'slug', sourceCategory.slug, false);
      if( !item ) {
        console.log('  - unable to locate, generating new category',  {
          slug : sourceCategory.slug,
          name : sourceCategory.name,
          description : sourceCategory.description
        });
        item = await wp.create('category', {
          slug : sourceCategory.slug,
          name : sourceCategory.name,
          description : sourceCategory.description
        });
      }

      newCatIds.push(item.id);
      console.log('  - mapped to: '+item.id);
    }

    this.post.categories = newCatIds;
  }

  async tags() {
    let newTagIds = [];

    for( let tagId of this.post.tags ) {
      console.log(' Tag: '+tagId);
      let sourceTag = await wp.get('tag', tagId);

      let item = await wp.find('tag', 'slug', sourceTag.slug, false);
      if( !item ) {
        console.log('  - unable to locate, generating new tag');
        item = await wp.create('tag', {
          slug : sourceTag.slug,
          name : sourceTag.name,
          description : sourceTag.description
        });
      }

      newTagIds.push(item.id);
      console.log('  - mapped to: '+item.id);
    }

    this.post.tags = newTagIds;
  }


}

export {PostTransform};