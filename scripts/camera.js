elation.extend("space.meshes.camera", function(args) {
  elation.space.thing.call( this, args, this );

  this.init = function() {
    this.camera = new THREE.PerspectiveCamera(50, this.viewsize[0] / this.viewsize[1], 10, 1.5e15);
    this.scene.add(this.camera);
  }
  
  this.init();
});
elation.space.meshes.crate.prototype = new THREE.Object3D();
//elation.space.meshes.crate.prototype.supr = THREE.Object3D.prototype;
elation.space.meshes.crate.prototype.constructor = elation.space.meshes.crate;
