elation.extend("space.meshes.whatever", function(args) {
  elation.space.thing.call( this, args );
  this.postinit = function() {
    if (this.properties.render && this.properties.render.mesh) {
      this.material = new THREE.MeshFaceMaterial({color: 0xffffff});
      (function(self, mesh) {
        var loader = new THREE.JSONLoader();
        loader.load( mesh, function(geometry) { self.loadMesh(geometry); }, '/media/space/textures' );
      })(this, this.properties.render.mesh);
    }  
  }
  this.loadMesh = function(geometry) {
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    var mesh = new THREE.Mesh(geometry, this.material);
    mesh.doubleSided = false;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.add(mesh);
  }
  this.init();
});
elation.space.meshes.whatever.prototype = new elation.space.thing();
elation.space.meshes.whatever.prototype.constructor = elation.space.meshes.whatever;
