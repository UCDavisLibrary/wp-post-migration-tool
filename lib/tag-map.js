
import config from './config.js';

const map = config.categoryMap;

const catToTags = config.catToTags;

function getCatTagLabel(label) {
  label = label.replace(/&amp;/g, '&');
  if( map[label] ) {
    return {category: map[label], mapped: true, catToTag: false}
  }
  if( catToTags.includes(label) ) {
    return {
      tag: {
        name: label.replace(/&/g, 'and'),
        slug: label.replace(/[^a-z]+/i, '-').toLowerCase(),
        description : ''
      },
      catToTag: true
    }
  }
  return {label, catToTag: false}
}



export {map, catToTags, getCatTagLabel};
