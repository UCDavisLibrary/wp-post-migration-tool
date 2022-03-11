import statusCrawler from "../lib/status-crawler.js";
try {
  await statusCrawler.run();
} catch(e) { console.error(e)}