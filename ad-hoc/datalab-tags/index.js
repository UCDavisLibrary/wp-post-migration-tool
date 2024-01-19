import fs from "node:fs";
import { parse } from 'csv-parse';

const __dirname = new URL(".", import.meta.url).pathname;

const loadCsv = async () => {
  const csv = fs.readFileSync(__dirname + "/taxonomies.csv");
  return new Promise((resolve, reject) => {
    parse(csv, { columns: true }, (err, records) => {
      if (err) reject(err);
      resolve(records);
    });
  });
}

const exportAsJson = (data, filename) => {
  fs.writeFileSync(`${filename}.json`, JSON.stringify(data, null, 2));
}

const transform = (records, taxonomy) => {
  const out = {};

  for (const record of records) {
    if (!record.taxonomy || record.taxonomy.trim() !== taxonomy) continue;
    if ( !record.value ) continue;
    const newTags = record.newTag.split(',').map(t => t.trim()).filter(t => !isEmptyValue(t));
    const newCategories = record.newCategory.split(',').map(t => t.trim()).filter(t => !isEmptyValue(t));

    if ( !newTags.length && !newCategories.length ) continue;
    out[record.value.trim()] = {
      tags: newTags,
      categories: newCategories
    };
  }

  return out;
}

const isEmptyValue = (value) => {
  if ( !value ) return true;
  value = value.trim();
  if ( value.toLowerCase() == 'na' ) return true;
  return value ? false : true;
}


const run = async () => {
  const records = await loadCsv();
  exportAsJson(transform(records, 'tag'), 'tag-map');
  exportAsJson(transform(records, 'category'), 'category-map');
};

run();
