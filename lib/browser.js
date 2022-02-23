// initialize fake window environment for react
import {JSDOM} from "JSDOM";
const { window } = new JSDOM('');

window.matchMedia = () => ({addListener: () => 'react sucks'});
window.requestAnimationFrame = () => {};
window.cancelAnimationFrame = () => {};
global.window = window;
global.document = window.document;
global.navigator = window.navigator;