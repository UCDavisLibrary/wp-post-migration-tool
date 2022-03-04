import express from "express";
import config from "./lib/config.js";
import statusCrawler from "./lib/status-crawler.js";
const app = express();

app.get('/api/crawl', async (req, res) => {
  // don't wait
  statusCrawler.run();

  res.json({running: statusCrawler.running});
});

app.listen(config.server.port, () => {
  console.log('Website migration tool listening on: '+config.server.port);
})