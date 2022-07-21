import wp from '../wp.js';
import fs from 'fs';

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
    'author' : 'author',
    'acf.ucdlib_manuscript_biog' : 'biography',
    'acf.ucdlib_manuscript_url' : 'findingAid',
    'ark' : 'subject',
    'status' : 'links',
    'slug' : 'slug',
    'type': 'collectionType',
    'id' : 'fetchedData'


  }

 class CollectionPost {

    constructor(row) {
      this.row = row;
      this.data = {
        meta : {},
        content : this.content()
      };
      this.writer = fs.createWriteStream('imports.csv', { flags: 'a' });
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
      this.data.title = this.row.title;
      this.data.slug = this.slug(this.row) ? this.slug(this.row) : clean(this.row.title);
      this.data.status = 'publish';
  
  
      // see if collection exists
      let item = await wp.find('collection', 'slug',  this.data.slug, {cache: false});
      if( !item ) {
        console.log('Creating: '+ this.data.title);
        let resp = await wp.create('collection', this.data);

        // append to imports.csv
        let result = `"${this.data.meta.callNumber}",`;
        result += this.slug(this.row) ? `"=HYPERLINK(""https://www.library.ucdavis.edu/${this.data.slug}"", ""Old site"")",` : ',';
        result += `"=HYPERLINK(""https://stage.library.ucdavis.edu/archives-and-special-collections/collection/${this.data.slug}"", ""New site"")",\r\n`;
        this.writer.write(result);
      }
    }
  
    fetchedData(data) {
      let res = {
        "creator": this.creator(data) ? this.creator(data) : "",
        "callNumber": this.call_number(data) ? this.call_number(data) : "",
        "inclusiveDates": this.inclusiveDates(data) ? this.inclusiveDates(data) : "",
        "findingAid": this.findingAid(data) ? this.findingAid(data) : {},
        "description": this.description(data) ? this.description(data) : "",
        "extent": this.extent(data) ? this.extent(data) : "",
        "links": this.links(data) ? this.links(data) : [],
        "subject": this.subject(data) ? this.subject(data) : [],
        "title": this.title(data) ? this.title(data): ""
      }

      return res;
    }

    creator(data) {
      if( data['creator'] ) {
        return data['creator'];
      }
      if( data['creator/collector'])
        return data['creator/collector'];
    }

    collectionType(data) {
      if( data['type'])
        return data['type'];
    }
  
    title(data) {
      if( data['title'] ) {
        return data['title'];
      }
      if( data['title.rendered'] ) {
        return data['title.rendered'];
      }
    }
    call_number(data) {
      if( data['call_number'] ) {
        return data['call_number'];
      }
    }

    slug(data) {
      if( data['slug'] ) {
        return data['slug'];
      }
    }
  
    inclusiveDates(data) {
        if( data['acf.ucdlib_manuscript_date'] ) {
          return data['acf.ucdlib_manuscript_date'];
        }
        else if( data['acf.ucdlib_uacollections_date'] ) {
          return data['acf.ucdlib_uacollections_date'];
        }
        else if( data['dates'] ) {
            return data['dates'];
          }
        else if( data['date (inclusive)']){
            return data['date (inclusive)'];
        }
    }
  
    language(data) {
        if( data['language of material'] ) {
            return data['language of material'];
        }
    }
  
    author(data) {
        if( data['author'] ) {
            return data['author'];
        }
    }
  
    photographer(data) {
      if( data['photographer'] ) {
          return data['photographer'];
      }
    }
    extent(data) {
        if( data['extent'] ) {
            return data['extent'];
        }
        if( data['acf.ucdlib_manuscript_extent_num']){
            return data['acf.ucdlib_manuscript_extent_num'] + " " + data['acf.ucdlib_manuscript_extent_type'];
        }
        if( data['acf.ucdlib_uacollections_extent_num']){
            return data['acf.ucdlib_uacollections_extent_num'] + " " + data['acf.ucdlib_uacollections_extent_type'];
        }
    }
  
    description(data) {
      let res;

        if( data['abstract'] ) {
          if(data['acf.ucdlib_manuscript_descrip']){
            res = data['abstract'] + " " + data['acf.ucdlib_manuscript_descrip'];
          }
          if(data['acf.ucdlib_uacollections_description']){
            res = data['abstract'] + " " + data['acf.ucdlib_uacollections_description'];
          }
        }
        if(data['acf.ucdlib_manuscript_descrip']){
          res = data['acf.ucdlib_manuscript_descrip'];
        }
        if(data['acf.ucdlib_uacollections_description']){
          res = data['acf.ucdlib_uacollections_description'];
        }
      return res
    }
    biography(data) {
      if( data['acf.ucdlib_manuscript_biog'] ) {
        return data['acf.ucdlib_manuscript_biog'];
      }
      if( data['acf.ucdlib_uacollections_history'] ) {
        return data['acf.ucdlib_uacollections_history'];
      }
    }
    material(data) {
        if( data['material specific details'] ) {
            return data['material specific details'];
        }
    }
    original(data) {
        if( data['original'] ) {
            return data['original'];
        }
    }
    location(data) {
        if( data['physical location'] ) {
            return data['physical location'];
        }
    }  
    repository(data) {
        if( data['repository'] ) {
            return data['repository'];
        }
    }    
    shelf(data) {
        if( data['shelf location'] ) {
            return data['shelf location'];
        }
    }    
    source(data) {
        if( data['source'] ) {
            return data['source'];
        }
    }   
    findingAid(data){
      if(data['acf.ucdlib_manuscript_url'])
        return {
         "id" : "",
         "linkType": "",
         "linkURL": data['acf.ucdlib_manuscript_url'],
         "linkTitle": "Finding Aid on the Online Archive of California",
         "displayLabel": "",
        };
      if(data['acf.ucdlib_uacollections_moreinfo_url'])
        return {
          "id" : "",
          "linkType": "",
          "linkURL": data['acf.ucdlib_uacollections_moreinfo_url'],
          "linkTitle": data["acf.ucdlib_uacollections_moreinfo_name"],
          "displayLabel": "",
        };
    }
    
    subject(data) {
      if(data['acf.ucdlib_uacollections_subject'])
        return [data['acf.ucdlib_uacollections_subject']];
    }

    links(data) {
      let res = [];
      if (data['link'])  res.push({id:'', linkType:'', linkURL: data['link'], displayLabel : ''});
      if (data['_links.self'])  res.push({id:'', linkType:'', linkURL: data['_links.self'], displayLabel : ''});
      if (data['_links.collection']) res.push({id:'', linkType:'', linkURL: data['_links.collection'], displayLabel : ''});
      if (data['_links.about']) res.push({id:'', linkType:'', linkURL: data['_links.about'], displayLabel : ''});
      if (data['_links.wp:attachment']) res.push({id:'', linkType:'', linkURL: data['_links.wp:attachment'], displayLabel : ''});
      if (data['_links.wp:term']) res.push({id:'', linkType:'', linkURL: data['_links.wp:term'], displayLabel : ''});
      if (data['_links.curies']) res.push({id:'', linkType:'', linkURL: data['_links.curies'], displayLabel : ''});
      return res;
    }
  
    content() {
      return `
      <!-- wp:ucd-theme/layout-basic -->
      <!-- wp:ucd-theme/column {\"layoutClass\":\"l-content\",\"forbidWidthEdit\":true} -->
      <!-- wp:ucd-theme/special-description /-->
      <!-- wp:ucd-theme/special-finding-aid /-->
      <!-- wp:ucd-theme/special-biography /-->
      <!-- wp:ucd-theme/special-inclusive-dates /-->
      <!-- wp:ucd-theme/special-extent /-->
      <!-- wp:ucd-theme/special-subject /-->
      <!-- /wp:ucd-theme/column -->
      <!-- wp:ucd-theme/column {\"layoutClass\":\"l-sidebar-first\",\"forbidWidthEdit\":true} -->
      <!-- /wp:ucd-theme/column -->
      <!-- /wp:ucd-theme/layout-basic -->`;

    }
  
}

function clean(txt) {
    if( !txt ) txt = '';
    return txt.toLowerCase().replace(/[^A-Za-z0-9 ]/g, '').replace(/ /g, '-');
}

export default CollectionPost;
  

  