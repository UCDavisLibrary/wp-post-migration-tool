import wp from '../wp.js';
import { JSDOM } from "jsdom";

class PostTransform {
  
  constructor(post) {
    this.post = post;
  }

  async run() {
    this.parseContent();
    await this.categories();
    await this.tags();
  }

  parseContent() {
    this.dom = new JSDOM(this.post.content.rendered);
  }

  async categories() {
    let newCatIds = [];

    for( let catId of this.post.categories ) {
      let sourceCategory = await wp.getCategory(catId);

      let item = await wp.find('categories', 'slug', sourceCategory.slug, false);
      if( !item ) {
        item = await wp.createCategory({
          slug : sourceCategory.slug,
          name : sourceCategory.name,
          description : sourceCategory.description
        });
      }

      newCatIds.push(item.id);
    }

    this.post.categories = newCatIds;
  }

  async tags() {
    let newTagIds = [];

    for( let tagId of this.post.tags ) {
      let sourceCat = await wp.getTag(tagId);

      let item = await wp.find('tags', 'slug', sourceCat.slug, false);
      if( !item ) {
        item = await wp.createTag({
          slug : sourceCat.slug,
          name : sourceCat.name,
          description : sourceCat.description
        });
      }

      newTagIds.push(item.id);
    }

    this.post.tags = newTagIds;
  }


}

export {PostTransform};