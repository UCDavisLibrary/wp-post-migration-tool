// initialize fake window environment for react
import {JSDOM} from "jsdom";
const { window } = new JSDOM('');

window.matchMedia = () => ({addListener: () => ''});
window.requestAnimationFrame = () => {};
window.cancelAnimationFrame = () => {};
global.window = window;
global.document = window.document;
global.navigator = window.navigator;