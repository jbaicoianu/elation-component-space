elation.extend("space.meshes.crate", function(args) {
  elation.space.thing.call( this, args );

  this.init = function() {
    this.createMaterial();
    this.createGeometry();

    this.createDynamics();
  }
  this.createMaterial = function() {
    var params = {
      color: 0xa1a1a1,
      shading: THREE.NormalShading
    };
    this.materials.push(new THREE.MeshPhongMaterial(params));
  }
  this.createGeometry = function() {
    //var geometry = new THREE.CubeGeometry(15, 15, 15, 10, 10, 10, this.materials[0]);
    var geometry = new THREE.SphereGeometry(5, 10, 10);
    this.createMesh(geometry, this.materials);
  }
  this.createDynamics = function() {
    this.dynamics = new elation.utils.physics.object({position: this.position, restitution: .8, radius: 5});
    elation.events.add([this.dynamics], "dynamicsupdate", this);
    this.dynamics.setVelocity([0,0,5]);
    this.dynamics.addForce("gravity", [0,-9800,0]);
    elation.utils.physics.system.add(this.dynamics);
  }
  this.init();
});
elation.space.meshes.crate.prototype = new THREE.Object3D();
//elation.space.meshes.crate.prototype.supr = THREE.Object3D.prototype;
elation.space.meshes.crate.prototype.constructor = elation.space.meshes.crate;
