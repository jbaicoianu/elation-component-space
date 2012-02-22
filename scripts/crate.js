elation.extend("space.meshes.crate", function(args) {
  elation.space.thing.call( this, args );

  this.postinit = function() {
    this.createMaterial();

    //this.dynamics.setVelocity([10,0,0]);
    //this.dynamics.addForce("gravity", [0,-9800,0]);
  }
  this.createMaterial = function() {
    var params = {
      color: 0xa1a1a1,
      shading: THREE.NormalShading
    };
    return new THREE.MeshPhongMaterial(params);
  }
  this.createGeometry = function() {
    var geometry = new THREE.CubeGeometry(50, 50, 50, 10, 10, 10, this.materials[0]);
    //var geometry = new THREE.SphereGeometry(5, 10, 10);
    this.createMesh(geometry, this.createMaterial());
  }
  this.init();
});
elation.space.meshes.crate.prototype = new elation.space.thing();
//elation.space.meshes.crate.prototype.supr = THREE.Object3D.prototype;
elation.space.meshes.crate.prototype.constructor = elation.space.meshes.crate;
