import wp from '../wp.js';
import config from '../config.js';
import { JSDOM } from "jsdom";
import striptags from "striptags";
import fetch from 'node-fetch';
import path from 'path';
import crypto from 'crypto';
import {rawHandler, serialize} from "@wordpress/blocks";
import blockLibrary from "@wordpress/block-library";
import flexContent from "./flex-content.js"
import {getCatTagLabel, getNewTaxonomyObjects} from "../tag-map.js";
import imageTransform from './images.js'

blockLibrary.registerCoreBlocks();

class PostTransform {

  constructor(post) {
    this.post = post;
    // console.log(post);
  }

  async run(opts={}) {
    console.log('Transforming post '+this.post.id+': '+this.post.slug);
    let exists = await this.removeExistingPost(opts);
    if( opts.skipExisting && exists ) return console.log('  Post exists, skipping.')

    this.parseContent();
    await this.author();
    await this.categories(); // this must run before tags!!
    await this.tags();
    await this.featuredMedia();
    if( opts.embedMedia !== false ) {
      await this.embedMedia();
    }

    this.createNewPost();
    let resp = await wp.create('post', this.newPost);
    console.log(' New post id: '+resp.id);
  }

  async removeExistingPost(opts, count=1) {
    while( 1 ) {
      let slug = this.post.slug;
      if( count > 1 ) slug = slug+'-'+count;
      console.log(` Searching for existing post ${slug} on ${config.sink.host}`);

      let existingPost = await wp.find('post', 'slug', slug, {source: false, cache: false});
      if( !existingPost ) return false;
      else if( opts.skipExisting ) return true;

      console.log(` Found existing post ${slug} on ${config.sink.host}: ${existingPost.id}, removing`);
      await wp.delete('post', existingPost.id);

      count++;
      // await this.removeExistingPost(opts, count);
    }
  }

  parseContent() {
    this.content = this.post.content.rendered;


    // add ucd flex content
    this.flexContentHtml = (this.post?.acf?.ucd_pages_flexible_content || [])
      .map(item => flexContent.transform(item))
      .join('\n');

    this.flexContentHtml = (this.post?.acf?.ucd_pages_flexible_content || [])
    // console.log(this.flexContentHtml);

    this.content += this.flexContentHtml;

    this.content = imageTransform(this.content);

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

    if( !this.post.meta || Array.isArray(this.post.meta) ) this.post.meta = {};
    this.post.meta.ucd_hide_author = this.post?.acf?.ucd_do_not_display_authors || false;

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
      categories : this.post.categories,
      tags : this.post.tags
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
    let sources = Array.from(this.window.document.querySelectorAll('img,a'))
      .filter(ele => (ele.src || ele.href || '').match('/wp-content/uploads/'))
      .map(ele => ele.src || ele.href);

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

  async categories() {
    if( !this.post.categories ) return;

    let newCatIds = [];

    for( let catId of this.post.categories ) {
      console.log(' Category: '+catId);
      let sourceCategory = await wp.get('category', catId);

      // check if this category is mapped to multiple new tags
      const newTagAssignments = getNewTaxonomyObjects(sourceCategory.name, 'category', 'tag');
      if ( newTagAssignments.length ) {
        console.log('  - category '+sourceCategory.name+' mapped to tags');
        if( !this.post.categoriesToTags ) this.post.categoriesToTags = [];
        this.post.categoriesToTags = this.post.categoriesToTags.concat(newTagAssignments);
      }

      // check if this category is mapped to multiple new categories
      const newCategoryAssignments = getNewTaxonomyObjects(sourceCategory.name, 'category', 'category');
      for( let newCategory of newCategoryAssignments ) {
        let item = await this.findOrCreateTaxonomyTerm('category', newCategory);
        newCatIds.push(item.id);
        console.log('  - assigned to new category: '+item.id);
      }

      // check for one-to-one category/tag mappings (aka renaming)
      let catTagMapInfo = getCatTagLabel(sourceCategory.name);
      if( catTagMapInfo.catToTag ) {
        console.log('  - category '+sourceCategory.name+' mapped to tag');
        if( !this.post.categoriesToTags ) this.post.categoriesToTags = [];
        this.post.categoriesToTags.push(catTagMapInfo.tag);
        continue;
      } else if (catTagMapInfo.mapped ) {
        console.log('  - category '+sourceCategory.name+' mapped to : '+catTagMapInfo.category.name);
        sourceCategory = catTagMapInfo.category;
      } else if ( config.dropCategoriesByDefault ) {
        console.log('  - category dropped by default');
        continue;
      }

      let item = await this.findOrCreateTaxonomyTerm('category', sourceCategory);

      newCatIds.push(item.id);
      console.log('  - mapped to: '+item.id);
    }

    this.post.categories = newCatIds;
  }

  async findOrCreateTaxonomyTerm(taxonomy, sourceTerm) {
    let item = await wp.find(taxonomy, 'slug', sourceTerm.slug, false);
    if( !item ) {
      console.log(`Unable to locate ${taxonomy} ${sourceTerm.name}, generating new ${taxonomy}`);
      item = await wp.create(taxonomy, {
        slug : sourceTerm.slug,
        name : sourceTerm.name,
        description : sourceTerm.description
      });
    }
    return item;
  }

  async tags() {
    let newTagIds = [];

    if( this.post.tags ) {
      for( let tagId of this.post.tags ) {
        console.log(' Tag: '+tagId);

        let sourceTag = await wp.get('tag', tagId);

        // check if this tag is mapped to multiple new tags
        const newTagAssignments = getNewTaxonomyObjects(sourceTag.name, 'tag', 'tag');
        for( let newTag of newTagAssignments ) {
          let item = await this.findOrCreateTaxonomyTerm('tag', newTag);
          newTagIds.push(item.id);
          console.log('  - assigned to new tag: '+item.id);
        }

        // check if this tag is mapped to multiple new categories
        const newCategoryAssignments = getNewTaxonomyObjects(sourceTag.name, 'tag', 'category');
        if ( newCategoryAssignments.length ) {
          if( !this.post.categories ) this.post.categories = [];
          for ( let newCategory of newCategoryAssignments ) {
            let item = await this.findOrCreateTaxonomyTerm('category', newCategory);
            this.post.categories.push(item.id);
            console.log('  - assigned to new category: '+item.id);
          }
        }

        if ( config.dropTagsByDefault ) {
          console.log('  - tag dropped by default');
          continue;
        }

        // use tag as is
        let item = await this.findOrCreateTaxonomyTerm('tag', sourceTag);
        newTagIds.push(item.id);
        console.log('  - mapped to: '+item.id);
      }
    }

    if( this.post.categoriesToTags ) {
      for( let sourceTag of this.post.categoriesToTags ) {
        console.log(' Cat to Tag: '+sourceTag.name);

        let item = await wp.find('tag', 'slug', sourceTag.slug, false);
        if( !item ) {
          console.log('  - unable to locate, generating new tag: '+sourceTag.name);
          item = await wp.create('tag', {
            slug : sourceTag.slug,
            name : sourceTag.name,
            description : sourceTag.description
          });
        }

        newTagIds.push(item.id);
        console.log('  - mapped to: '+item.id);
      }
    }

    if( !newTagIds.length ) return;

    this.post.tags = newTagIds;
  }


}

export {PostTransform};
