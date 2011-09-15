elation.extend("space.meshes.building", function(args) {
	THREE.Object3D.call( this );

  this.args = args || {};

  this.init = function() {
    if (this.args.physical && this.args.physical.position) {
      if (this.args.render && this.args.render.mesh) {
        this.materials = [new THREE.MeshFaceMaterial({color: 0xffffff})];
        (function(self, mesh) {
          var loader = new THREE.JSONLoader();
          loader.load( { model: mesh, callback: function(geometry) { self.loadMesh(geometry); } });
        })(this, this.args.render.mesh);
      } else {
        this.createBox();
      }
    }
  }
  this.createBox = function() {
    var buildingsize = this.args.physical.size || [1000, 1000, 500];
    var newgeom = new THREE.CubeGeometry(buildingsize[0], buildingsize[1], buildingsize[2], 10, 5, 10);
    this.materials = [new THREE.MeshPhongMaterial({color: 0xffffff}), new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true, opacity: 0.1, transparent: true})];
    this.loadMesh(newgeom);
  }
  this.loadMesh = function(geometry) {
    var newobj = new THREE.Mesh(geometry, this.materials);
    newobj.position.x = this.args.physical.position[0];
    newobj.position.y = this.args.physical.position[1];
    newobj.position.z = this.args.physical.position[2];

    if (this.args.render && this.args.render.scale) {
      newobj.scale.x = this.args.render.scale[0];
      newobj.scale.y = this.args.render.scale[1];
      newobj.scale.z = this.args.render.scale[2];
    }
    newobj.receiveShadow = true;
    newobj.castShadow = true;
    newobj.doubleSided = true;
    this.addChild(newobj);
  }
  this.init();
});
elation.space.meshes.building.prototype = new THREE.Object3D();
elation.space.meshes.building.prototype.constructor = elation.space.meshes.building;
