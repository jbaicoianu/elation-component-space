elation.extend("space.meshes.sector", function(args) {
	THREE.Object3D.call( this );

  this.args = args || {};

  this.init = function() {
    this.createMesh();
  }
  this.createMesh = function() {
    var mesh = new THREE.Mesh( new THREE.PlaneGeometry( 100000, 100000, 10, 10 ), new THREE.MeshPhongMaterial( { color: 0xfee8d6 } ) );
    mesh.position.y = -1;
    mesh.rotation.x = -90 * (Math.PI / 180);
    mesh.rotation.y = 0;
    mesh.rotation.z = 0;
    mesh.receiveShadow = true;
    this.addChild(mesh);
  }
  this.init();
});
elation.space.meshes.sector.prototype = new THREE.Object3D();
elation.space.meshes.sector.prototype.constructor = elation.space.meshes.sector;

