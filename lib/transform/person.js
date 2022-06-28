import wp from '../wp.js';

const WEBSITE_TYPES = [
  {value: 'google-scholar', label: 'Google Scholar URL', icon: "ucd-public:fa-network-wired"},
  {value: 'linkedin', label: 'LinkedIn URL', icon: 'ucd-public:fa-linkedin'},
  {value: 'orcid', label: 'ORCID URL', icon: 'ucd-public:fa-orcid'},
  {value: 'twitter', label: 'Twitter URL', icon: 'ucd-public:fa-twitter'},
  {value: 'other', label: 'Other URL', icon: "ucd-public:fa-network-wired"}
]

// 'wp_user_id'
const META_MAP = {
  'Kerberos ID': 'username',
  'First Name': 'name_first',
  'Last Name': 'name_last',
  'Department': 'position_dept',
  'Position Title' : 'position_title',
  'Bio' : 'bio',
  'Preferred Pronoun(s)' : 'pronouns',
  'Phone Number' : 'contactPhone',
  'Email Address' : 'contactEmail',
  'Calendly link (if applicable)' : 'contactAppointmentUrl',
  'Links to include' : 'contactWebsite'
}

const TAXONOMY = {
  'Directory Tags' : 'directory-tag',
  'Areas of Expertise': 'expertise-area',
  'Location': 'library'
}

/// tax goes in root object (array of ideas)
// location is a taxonomy: library
// subject are is a flag on directory tag: isSubjectArea, passed via tax.meta.isSubjectArea = Boolean

// make directory tags
// make library locations tags


/**
 * Given a csv row, transform to a person post type
 */
class PersonPost {

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
    this.data.title = this.data.meta.username;
    this.data.slug = clean(this.data.meta.username);
    this.data.status = 'publish';

    // console.log(this.data.slug, this.data.meta.username);

    // handle taxonomies
    for( let key in this.row ) {
      if( !TAXONOMY[key] ) continue;
      let fnName = TAXONOMY[key];
      if( fnName === 'directory-tag' ) fnName = 'directory';
      if( fnName === 'expertise-area' ) fnName = 'expertise';

      this.data[TAXONOMY[key]] = await this[fnName](this.row) || null;
    }

    // see if user exists
    let item = await wp.find('person', 'slug',  this.data.slug, {cache: false});
    if( !item ) {
      console.log('Creating: '+ this.data.title);
      let resp = await wp.create('person', this.data);
    }
  }

  contactPhone(data) {
    if( data['Phone Number'] ) {
      return [{value: data['Phone Number'], label : ''}]
    }
  }

  contactEmail(data) {
    if( data['Email Address'] ) {
      return [{value: data['Email Address'], label : ''}]
    }
  }

  contactWebsite(data) {
    let keys = split(data['Links to include'])
    if( !keys.length ) return;
    return keys.map(key => {
      return {
      type : WEBSITE_TYPES.find(item => item.label === key)?.value || '',
      value : data[key],
      label : key.replace(' URL', '')
    }})
  }

  async position_dept(data) {
    if( !data['Department'] ) return;
    let resp = await mapToIds('department', [data['Department']]);
    return resp[0];
  }

  async directory(data) {
    let keys = split(data['Directory Tags']);
    await mapToIds('directory-tag', keys);
    return keys;
  }

  async expertise(data) {
    let keys = split(data['Areas of Expertise']);
    await mapToIds('expertise-area', keys);
    return keys;
  }

  async library(data) {
    let keys = split(data['Location']);
    await mapToIds('library', keys);
    return keys;
  }

  content() {
    return `<!-- wp:ucdlib-directory/name {"lock":{"move":true,"remove":true}} /-->

<!-- wp:ucdlib-directory/title {"lock":{"move":true,"remove":true}} /-->

<!-- wp:ucdlib-directory/pronouns {"lock":{"move":true,"remove":true}} /-->

<!-- wp:ucdlib-directory/contact {"lock":{"move":true,"remove":true}} /-->

<!-- wp:ucdlib-directory/library-locations {"lock":{"move":true,"remove":true}} /-->

<!-- wp:ucdlib-directory/bio {"lock":{"move":true,"remove":true}} /-->

<!-- wp:ucdlib-directory/expertise-areas {"lock":{"move":true,"remove":true}} /-->

<!-- wp:ucdlib-directory/tags {"lock":{"move":true,"remove":true}} /-->`;
  }

}

function split(item='') {
  return item.split(/,|;/)
    .map(item => item.replace(/\(.*/, '').trim())
    .filter(item => item);
}

async function mapToIds(tax, labels) {
  for( let i = 0; i < labels.length; i++ ) {
    labels[i] = await getTaxId(tax, labels[i]);
  }
  return labels
}

function clean(txt) {
  if( !txt ) txt = '';
  return txt.toLowerCase().replace(/[^A-Za-z0-9 ]/g, '').replace(/ /g, '-');
}

async function getTaxId(tax, label) {
  let slug = clean(label);

  // console.log(tax, 'slug', slug);
  let item = await wp.find(tax, 'slug', slug, {cache: false});
  // console.log((item || {}).id);

  if( !item ) {
    
    let labelProp = tax === 'department' ? 'title' : 'name';
    let data = {
      slug : slug,
      [labelProp] : label,
      description : ''
    }
    if( tax === 'department' ) data.status = 'publish';
    console.log('Creating tax', data);

    item = await wp.create(tax, data);
  }
  return item.id;    
}

export default PersonPost;