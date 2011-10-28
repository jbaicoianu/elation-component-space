/*
- procbuilding
  - createGeometry()
*/

THREE = {};
window = {};
var console = window.console = {};
console.log = function() {
  var msg = "";
  for (var i = 0; i < arguments.length; i++) {
    var mpart = JSON.stringify(arguments[i]) + " ";
    msg += (mpart.length < 100 ? mpart : mpart.substr(0, 97) + "...") + " ";
  }
  self.postMessage({action: 'log', msg: msg});
};
importScripts('/~bai/three.js/build/Three.js');
importScripts('/scripts/utils/elation.js');
importScripts('/scripts/space/thing.js');
importScripts('/scripts/space/procbuilding.js');

var foo = new elation.space.procbuilding.worker();
onmessage = function(ev) {
  foo.message(ev);
}
