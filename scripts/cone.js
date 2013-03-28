elation.extend("space.meshes.cone", function(args) {
  elation.space.thing.call(this, args);
  this.autocreategeometry = false;
  this.parts = {};
  this.collisionradius = 8;

  this.postinit = function() {
    this.createMesh();
  }
  this.createMesh = function() {
    var materialtype = (Detector.webgl ? THREE.MeshPhongMaterial : THREE.MeshBasicMaterial);
    this.parts['base'] = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 1), new materialtype({color: 0x222222}));
    this.parts['cone'] = new THREE.Mesh(new THREE.CylinderGeometry(2, 5, 20), new materialtype({color: 0xff6600}));

    this.parts['cone'].position.y = 11;
    this.parts['base'].position.y = .5;
    this.parts['cone'].castShadow = true;
    this.parts['cone'].receiveShadow = true;
    this.parts['base'].castShadow = true;
    this.parts['base'].receiveShadow = true;
    this.add(this.parts['base']);
    this.add(this.parts['cone']);
    this.updateCollisionSize();
  }
  this.init();
});
elation.space.meshes.cone.prototype = new elation.space.thing();
elation.space.meshes.cone.prototype.constructor = elation.space.meshes.cone;
