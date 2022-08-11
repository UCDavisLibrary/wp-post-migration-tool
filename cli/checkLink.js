import statusCrawler from "../lib/status-crawler.js";
try {
  await statusCrawler.crawlLink('https://www.library.ucdavis.edu/guide/food-science-and-nutrition-2/');
  // console.log(await statusCrawler.test());
} catch(e) { console.error(e)}