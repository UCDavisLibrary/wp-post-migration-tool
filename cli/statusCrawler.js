import statusCrawler from "../lib/status-crawler.js";
try {
  await statusCrawler.run();
  // console.log(await statusCrawler.test());
} catch(e) { console.error(e)}