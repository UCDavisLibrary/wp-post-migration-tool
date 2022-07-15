import wp from '../wp.js';

// 'wp_user_id'

  const META_MAP = {
    'call_number': 'callNumber',
    'creator': 'creator',
    'title': 'title',
    'dates': 'inclusiveDates',
    'language of material' : 'language',
    'extent' : 'extent',
    'abstract' : 'description',
    'material specific details' : 'material',
    'original' : 'original',
    'photographer' : 'photographer',
    'physical location' : 'location',
    'repository' : 'repository',
    'shelf location' : 'shelf',
    'source' : 'source',
    'author' : 'author'
  }

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
      this.data.title = this.data.meta.callNumber;
      this.data.slug = clean(this.data.meta.callNumber);
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
        return data['creator']
      }
    }
  
    title(data) {
      if( data['title'] ) {
        return data['title']
      }
    }
    call_number(data) {
      if( data['call_number'] ) {
        return data['call_number']
      }
    }
  
    inclusiveDates(data) {
        if( data['dates'] ) {
            return data['dates']
          }
        if( data['date (inclusive)']){
            return data['date (inclusive)']
        }
    }
  
    language(data) {
        if( data['language of material'] ) {
            return data['language of material']
        }
    }
  
    author(data) {
        if( data['author'] ) {
            return data['author']
        }
    }
  
    photographer(data) {
      if( data['photographer'] ) {
          return data['photographer']
      }
    }
    extent(data) {
        if( data['extent'] ) {
            return data['extent']
        }
    }
  
    description(data) {
        if( data['abstract'] ) {
            return data['abstract']
        }
    }
    material(data) {
        if( data['material specific details'] ) {
            return data['material specific details']
        }
    }
    original(data) {
        if( data['original'] ) {
            return data['original']
        }
    }
    location(data) {
        if( data['physical location'] ) {
            return data['physical location']
        }
    }  
    repository(data) {
        if( data['repository'] ) {
            return data['repository']
        }
    }    
    shelf(data) {
        if( data['shelf location'] ) {
            return data['shelf location']
        }
    }    
    source(data) {
        if( data['source'] ) {
            return data['source']
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
  

  