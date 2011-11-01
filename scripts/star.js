elation.extend("space.meshes.star", function(args) {
  elation.space.thing.call( this, args);

  this.postinit = function() {
  }
  this.createGeometry = function() {
    this.light = new THREE.SpotLight( 0xffffff, 1, 50000);
    this.light.position.x = -10000;
    this.light.position.y = 10000;
    this.light.position.z = 10000;
    this.light.castShadow = true;
    this.add(this.light);

    var geom = new THREE.SphereGeometry(this.properties.physical.radius || 1000, 10, 10);
    this.createMesh(geom, new THREE.MeshBasicMaterial({color: 0xffff00, fog: false }));
  }
  this.init();
});
elation.space.meshes.star.prototype = new elation.space.thing()
elation.space.meshes.star.prototype.supr = elation.space.thing.prototype
elation.space.meshes.star.prototype.constructor = elation.space.meshes.star;

