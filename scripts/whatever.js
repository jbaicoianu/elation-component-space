elation.extend("space.meshes.whatever", function(args) {
  elation.space.thing.call( this, args );
  this.postinit = function() {
    if (this.properties.render && this.properties.render.mesh) {
      this.material = new THREE.MeshFaceMaterial({color: 0xffffff});
      var texturepath = this.properties.render.texturepath || '/media/space/textures';
      (function(self, mesh, texturepath) {
        var loader = new THREE.JSONLoader();
        loader.load( mesh, function(geometry) { self.loadMesh(geometry); }, texturepath);
      })(this, this.properties.render.mesh, texturepath);
    }  
    elation.events.add([this], "mouseover,mouseout,mousemove", this);
  }
  this.loadMesh = function(geometry) {
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    var mesh = new THREE.Mesh(geometry, this.material);
    mesh.doubleSided = false;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    this.add(mesh);
    this.updateCollisionSize();
  }
  /*
  this.mouseover = function(ev) {
    console.log('over it: ' + ev.data.relatedTarget.name + " => " + ev.target.name, [ev.data.clientX, ev.data.clientY, ev.data.clientZ]);
  }
  this.mouseout = function(ev) {
    console.log('we out: ' + ev.target.name + " => " + ev.data.relatedTarget.name, [ev.data.clientX, ev.data.clientY, ev.data.clientZ]);
  }
  this.mousemove = function(ev) {
    console.log('keep on movin', ev.target.name, [ev.data.clientX, ev.data.clientY, ev.data.clientZ]);
  }
  */
  this.init();
});
elation.space.meshes.whatever.prototype = new elation.space.thing();
elation.space.meshes.whatever.prototype.constructor = elation.space.meshes.whatever;
