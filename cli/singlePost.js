import "../lib/browser.js"; // must be first import!
import wp from "../lib/wp.js";
import {PostTransform} from "../lib/transform/index.js";

async function singlePost() {

  let transform = new PostTransform(await wp.get('post', '17654'));
  await transform.run();

  process.exit();
}

singlePost();