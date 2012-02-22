elation.space.foocache = {};
elation.extend("space.meshes.building", function(args) {
	elation.space.thing.call(this, args);

  this.lod = new THREE.LOD();
  this.lodlevels = {
    'high': 0,
    'medium': 5000,
    'low': 10000
  };
  this.materials = {};

  this.postinit = function() {
    this.type = 'building';
    if (this.properties.physical) {
      if (this.properties.physical.exists === 0) 
        return;
      if (this.properties.physical.position) {
        this.position.x = this.properties.physical.position[0];
        this.position.y = this.properties.physical.position[1];
        this.position.z = this.properties.physical.position[2];
      }
      if (this.properties.physical.rotation) {
        this.rotation.x = this.properties.physical.rotation[0] * (Math.PI / 180);
        this.rotation.y = this.properties.physical.rotation[1] * (Math.PI / 180);
        this.rotation.z = this.properties.physical.rotation[2] * (Math.PI / 180);
      }
      this.size = this.properties.physical.size || [4, 4, 4];
      this.createMaterials('low');
      this.createBox();
      if (this.properties.render) {
        if (this.properties.render.mesh) {
          this.createMaterials('high');
          this.loadMesh(this.properties.render.mesh, 'high');
        }
        if (this.properties.render.meshlow) { // FIXME - not well named...
          this.createMaterials('medium');
          this.loadMesh(this.properties.render.meshlow, 'medium');
        }
      }
      this.add(this.lod);
      this.updateCollisionSize();
    }
  }
  this.createBox = function() {
    var rotation = false;
    var offset = false;
    if (this.properties.render && this.properties.render.outline) {
      var verts = this.properties.render.outline || [];
      var vertmult = 1;

      var shape = [];
      for (var i = 0; i < verts.length; i++) {
        shape.push(new THREE.Vector2(verts[i][0] * vertmult, verts[i][1] * vertmult)); 
      }
      var newgeom = new THREE.ExtrudeGeometry(new THREE.Shape(shape), {amount: this.size[1], bevelEnabled: false});
      offset = [0, 0, 0];
      rotation = [-90, 0, 0];
    } else {
      var newgeom = new THREE.CubeGeometry(this.size[0], this.size[1], this.size[2], 10, 5, 10, new THREE.MeshPhongMaterial({color: 0xff0000}));
    }
    this.createMesh(newgeom, 'low', offset, rotation);
  }

  this.createMaterials = function(lodlevel) {
    this.materials[lodlevel] = [];
    var color = 0x999999;
    switch (lodlevel) {
      case 'low':
        this.materials[lodlevel].push(new THREE.MeshPhongMaterial({color: color, shading: THREE.FlatShading}));
        break;
      case 'medium':
      case 'high':
      default:
        this.materials[lodlevel].push(new THREE.MeshFaceMaterial({shading: THREE.FlatShading}));
        break;
    }
  }
  this.loadMesh = function(meshurl, lodlevel) {
    if (false && elation.space.foocache[meshurl]) {
      this.createMesh(elation.space.foocache[meshurl], lodlevel);
    } else {
      (function(self, meshurl, lodlevel) {
        var loader = new THREE.JSONLoader();
        loader.load( { model: meshurl, callback: function(geometry) { elation.space.foocache[meshurl] = geometry; self.createMesh(geometry, lodlevel); }, texture_path: "/media/space/textures" });
      })(this, meshurl, lodlevel);
    }
  }
  this.createMesh = function(geometry, lodlevel, offset, rotation) {
    var newobj = new THREE.Mesh(geometry, this.materials[lodlevel]);

//newobj.rotation.y = Math.random() * Math.PI;
    if (this.properties.render && this.properties.render.scale) {
      newobj.scale.set(this.properties.render.scale[0], this.properties.render.scale[1], this.properties.render.scale[2]);
    }
    if (offset) {
      newobj.position.set(offset[0], offset[1], offset[2]);
    }
    if (rotation) {
      newobj.rotation.set(rotation[0] * Math.PI / 180, rotation[1] * Math.PI / 180, rotation[2] * Math.PI / 180);
    }
    newobj.receiveShadow = true;
    newobj.castShadow = true;
    newobj.doubleSided = true;
    newobj.transparent = true;
    //if (this.materials[0] instanceof THREE.MeshNormalMaterial) {
      geometry.computeVertexNormals();
      geometry.computeFaceNormals();
      geometry.computeTangents();
    //}
    this.lod.addLevel(newobj, this.lodlevels[lodlevel], true);
    console.log(this, 'Added LOD mesh', lodlevel, this.lodlevels[lodlevel], newobj);
  }
  this.init();
});
elation.space.meshes.building.prototype = new elation.space.thing();
elation.space.meshes.building.prototype.constructor = elation.space.meshes.building;
