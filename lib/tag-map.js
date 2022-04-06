// from: https://docs.google.com/document/d/1t-dxUyXaqfiePccI6rI6J5Gzh2b40EczCQSWvPKGqzA/edit

const map = {
  "Data & Digital Scholarship" : {
    name : "Data Science",
    slug : "data-science",
    description : ""
  },
  "Wine" : {
    name : "Food and Wine",
    slug : "food-and-wine",
    description : ""
  },
  "Local History" : {
    name : "Campus and Local History",
    slug : "campus-and-local-history",
    description : ""
  },
  "University Archives" : {
    name : "Campus and Local History",
    slug : "campus-and-local-history",
    description : ""
  },
  "Scholarly Communication" : {
    name: "Open Access and Scholarly Publishing",
    slug : "open-access-and-scholarly-publishing",
    description : ""
  },
  "Research Support" : {
    name : "Research Tools and Services",
    slug : "research-tools-and-services",
    description : ""
  }
}
const catToTags = [
  "Interviews",
  "BIBFLOW",
  "ICIS",
  "Photography",
  "Maps & GIS",
];

function getCatTagLabel(label) {
  if( map[label] ) {
    return {category: map[label], mapped: true, catToTag: false}
  }
  if( catToTags.includes(label) ) {
    return {
      tag: {
        name: label, 
        slug: label.replace(/[^a-z]+/i, '-').toLowerCase(),
        description : ''
      }, 
      catToTag: true
    }
  }
  return {label, catToTag: false}
}



export {map, catToTags, getCatTagLabel};