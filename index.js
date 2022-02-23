import "./lib/browser.js"; // must be first import!
import wp from "./lib/wp.js";
import {PostTransform} from "./lib/transform/index.js";

(async function() {

  let transform = new PostTransform(await wp.get('post', '55532'));
  await transform.run();
  // console.log(transform.newPost);

  process.exit();
})();
