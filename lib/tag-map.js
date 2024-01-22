
import config from './config.js';

const map = config.categoryMap;

const catToTags = config.catToTags;

const tagAssignments = config.tagAssignments || {};

const categoryAssignments = config.categoryAssignments || {};

function getNewTaxonomyObjects(label, oldTaxonomy, newTaxonomy) {
  const map = oldTaxonomy === 'tag' ? tagAssignments : categoryAssignments;
  newTaxonomy = newTaxonomy === 'tag' ? 'tags' : 'categories';
  if ( map?.[label]?.[newTaxonomy]?.length ) {
    return map[label][newTaxonomy].map(t => createTaxObject(t));
  }
  return [];
}

function getCatTagLabel(label) {
  label = label.replace(/&amp;/g, '&');
  if( map[label] ) {
    return {category: map[label], mapped: true, catToTag: false}
  }
  if( catToTags.includes(label) ) {
    return {
      tag: createTaxObject(label),
      catToTag: true
    }
  }
  return {label, catToTag: false}
}

function createTaxObject(label){
  return {
    name: label.replace(/&/g, 'and'),
    slug: label.replace(/[^a-z]+/i, '-').toLowerCase(),
    description : ''
  }
}


export {map, catToTags, getCatTagLabel, getNewTaxonomyObjects};
