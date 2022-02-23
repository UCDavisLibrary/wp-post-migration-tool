import wp from '../wp.js';
import config from '../config.js';
import { JSDOM } from "jsdom";
import striptags from "striptags";
import fetch from 'node-fetch';
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

    this.createNewPost();
    let resp = await wp.create('post', this.newPost);
    console.log('New post id: '+resp.id);
  }

  async removeExistingPost() {
    while( 1 ) {
      let existingPost = await wp.find('post', 'slug', this.post.slug, false);
      if( !existingPost ) return;

      console.log(`Found existing post ${this.post.slug} on ${config.sink.host}: ${existingPost.id}, removing`);
      await wp.delete('post', existingPost.id);
    }
  }

  parseContent() {
    this.dom = new JSDOM(this.post.content.rendered);
  }

  createNewPost() {
    // parse the html to gutenberg blocks
    let content = this.post.content.rendered.replaceAll(config.source.host, config.sink.host);
    let raw = rawHandler({HTML: content});
    let html = serialize(raw);
    html += `
    <!-- wp:ucd-theme/layout-columns -->
    <!-- wp:ucd-theme/column {"layoutClass":"l-first","forbidWidthEdit":true} -->
    <!-- wp:paragraph -->
    <p>test1</p>
    <!-- /wp:paragraph -->
    <!-- /wp:ucd-theme/column -->
    
    <!-- wp:ucd-theme/column {"layoutClass":"l-second","forbidWidthEdit":true} -->
    <!-- wp:paragraph -->
    <p>justin hungeryalsddddjasdlj]</p>
    <!-- /wp:paragraph -->
    <!-- /wp:ucd-theme/column -->
    <!-- /wp:ucd-theme/layout-columns -->`;

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
      // featured_media : this.post.featured_media,
      meta : this.post.meta,
      categories : this.post.categories,
      tags : this.post.tags
    };
  };

  async author() {
    console.log(' Author: '+this.post.author);
    let sourceAuthor = await wp.get('user', this.post.author);
    // console.log(sourceAuthor)

    let item = await wp.find('user', 'id', this.post.author, true);
    if( !item ) {
      console.log('  - unable to locate, generating new user');
      // item = await wp.create('user', {
      //   username : sourceAuthor.slug,
      //   name : sourceCategory.name,
      //   description : sourceCategory.description
      // });
    }

    this.post.author = '';
    console.log('  - mapped to: '+item.id);
  }

  async featuredMedia() {
    console.log(' Featured Media: '+this.post.featured_media);
    let sourceMedia = await wp.get('media', this.post.featured_media);
    // console.log(sourceAuthor)

    let item = await wp.find('media', 'slug', sourceMedia.slug, true);
    if( !item ) {
      console.log('  - unable to locate, generating new media');

      let resp = await fetch(sourceMedia.source_url);
      let blob = await resp.blob();

      // item = await wp.createMedia(
      //   sourceMedia.media_details.original_image, 
      //   sourceMedia.mime_type,
      //   blob,
      //   {
      //     username : sourceAuthor.slug,
      //     name : sourceCategory.name,
      //     description : sourceCategory.description
      //   }
      // );
    }

    // this.post.author = '';
    // console.log('  - mapped to: '+item.id);
  }

  async categories() {
    let newCatIds = [];

    for( let catId of this.post.categories ) {
      console.log(' Category: '+catId);
      let sourceCategory = await wp.get('category', catId);

      let item = await wp.find('category', 'slug', sourceCategory.slug, false);
      if( !item ) {
        console.log('  - unable to locate, generating new category');
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
      console.log(' Tag: '+catId);
      let sourceCat = await wp.get('tag', tagId);

      let item = await wp.find('tag', 'slug', sourceCat.slug, false);
      if( !item ) {
        console.log('  - unable to locate, generating new tag');
        item = await wp.create('tag', {
          slug : sourceCat.slug,
          name : sourceCat.name,
          description : sourceCat.description
        });
      }

      newTagIds.push(item.id);
      console.log('  - mapped to: '+item.id);
    }

    this.post.tags = newTagIds;
  }


}

export {PostTransform};