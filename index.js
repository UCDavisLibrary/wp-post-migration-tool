import wp from "./lib/wp.js";
import {PostTransform} from "./lib/transform/index.js"

(async function() {
  let transform = new PostTransform(await wp.getPost('55532'));
  transform.run();

})();
