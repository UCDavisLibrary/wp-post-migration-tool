import wp from '../wp.js';

// 'wp_user_id'

  const META_MAP = {
    'call_number': 'call_number',
    'creator': 'creator',
    'title': 'title',
    'dates': 'date',
    'language of material' : 'language',
    'extent' : 'extent',
    'description' : 'description',
    'material specific details' : 'material',
    'original' : 'original',
    'photographer' : 'photographer',
    'physical location' : 'location',
    'repository' : 'repository',
    'shelf location' : 'shelf',
    'source' : 'source',
  }

// const type = "ua_collections";

// if(type == 'manuscript')
//   const META_MAP = META_MAP_M
// else 
//   const META_MAP = META_MAP_UA;
  
/**
 * Given a csv row, transform to a person post type
 */
 class CollectionPost {

    constructor(row) {
      this.row = row;
      this.data = {
        meta : {},
        content : this.content()
      };

    }
  
    async parse() {
  
      // handle metadata
      for( let key in this.row ) {
        if( !META_MAP[key] ) continue;
        if( this[META_MAP[key]] ) {
          this.data.meta[META_MAP[key]] = await this[META_MAP[key]](this.row) || null;
        } else {
          this.data.meta[META_MAP[key]] = this.row[key] || null;
        }
      }
      this.data.title = this.data.meta.call_number;
      this.data.slug = clean(this.data.meta.call_number);
      this.data.status = 'publish';
  
  
      // see if collection exists
      let item = await wp.find('collection', 'slug',  this.data.slug, {cache: false});
      if( !item ) {
        console.log('Creating: '+ this.data.title);
        let resp = await wp.create('collection', this.data);
      }
    }
  
    creator(data) {
      if( data['creator'] ) {
        return [{value: data['creator'], label : ''}]
      }
    }
  
    title(data) {
      if( data['title'] ) {
        return [{value: data['title'], label : ''}]
      }
    }
  
    date(data) {
        if( data['date'] ) {
            return [{value: data['date'], label : ''}]
          }
    }
  
    language(data) {
        if( data['language'] ) {
            return [{value: data['language'], label : ''}]
        }
    }
  
    author(data) {
        if( data['author'] ) {
            return [{value: data['author'], label : ''}]
        }
    }
  
    extent(data) {
        if( data['extent'] ) {
            return [{value: data['extent'], label : ''}]
        }
    }
  
    description(data) {
        if( data['description'] ) {
            return [{value: data['description'], label : ''}]
        }
    }
    material(data) {
        if( data['material'] ) {
            return [{value: data['material'], label : ''}]
        }
    }
    original(data) {
        if( data['original'] ) {
            return [{value: data['original'], label : ''}]
        }
    }
    location(data) {
        if( data['location'] ) {
            return [{value: data['location'], label : ''}]
        }
    }  
    repository(data) {
        if( data['repository'] ) {
            return [{value: data['repository'], label : ''}]
        }
    }    
    shelf(data) {
        if( data['shelf'] ) {
            return [{value: data['shelf'], label : ''}]
        }
    }    
    source(data) {
        if( data['source'] ) {
            return [{value: data['source'], label : ''}]
        }
    }        
  
    content() {
      return ``;
// return `
//   <!-- wp:ucdlib-collection/creator {"lock":{"move":true,"remove":true}} /-->
  
//   <!-- wp:ucdlib-collection/title {"lock":{"move":true,"remove":true}} /-->
  
//   <!-- wp:ucdlib-collection/date {"lock":{"move":true,"remove":true}} /-->
  
//   <!-- wp:ucdlib-collection/language {"lock":{"move":true,"remove":true}} /-->
  
//   <!-- wp:ucdlib-collection/author {"lock":{"move":true,"remove":true}} /-->
  
//   <!-- wp:ucdlib-collection/extent {"lock":{"move":true,"remove":true}} /-->
  
//   <!-- wp:ucdlib-collection/description {"lock":{"move":true,"remove":true}} /-->
  
//   <!-- wp:ucdlib-collection/material {"lock":{"move":true,"remove":true}} /-->

//   <!-- wp:ucdlib-collection/original {"lock":{"move":true,"remove":true}} /-->
  
//   <!-- wp:ucdlib-collection/location {"lock":{"move":true,"remove":true}} /-->
  
//   <!-- wp:ucdlib-collection/repository {"lock":{"move":true,"remove":true}} /-->
  
//   <!-- wp:ucdlib-collection/shelf {"lock":{"move":true,"remove":true}} /-->

//   <!-- wp:ucdlib-collection/source {"lock":{"move":true,"remove":true}} /-->`;

    }
  
}

function clean(txt) {
    if( !txt ) txt = '';
    return txt.toLowerCase().replace(/[^A-Za-z0-9 ]/g, '').replace(/ /g, '-');
}

export default CollectionPost;
  

  