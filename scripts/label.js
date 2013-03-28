elation.extend("space.meshes.label", function(args) {
  elation.space.thing.call( this, args);

  this.createGeometry = function() {
    var geometry = new THREE.TextGeometry( this.properties.content.text, {
      size: 20,
      height: 5,
      curveSegments: 6,

      font: "helvetiker",
      weight: "normal",
      style: "normal",

      bevelThickness: 2,
      bevelSize: 1,
      bevelEnabled: true
    });                                                
    geometry.computeBoundingBox();
    var bbox = geometry.boundingBox;
    var diff = new THREE.Vector3().sub(bbox.max, bbox.min).multiplyScalar(-.5);
    var geomod = new THREE.Matrix4();
    geomod.setPosition(diff);
    geometry.applyMatrix(geomod);
    this.createMesh(geometry, new THREE.MeshPhongMaterial({color: 0xcccccc}));
  }
  this.init();
});
elation.space.meshes.label.prototype = new elation.space.thing()
elation.space.meshes.label.prototype.supr = elation.space.thing.prototype
elation.space.meshes.label.prototype.constructor = elation.space.meshes.label;

