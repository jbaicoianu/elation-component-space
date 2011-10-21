elation.space.foocache = {};
elation.extend("space.meshes.building", function(args) {
	THREE.LOD.call( this );

  this.args = args || {};
  this.lodlevels = {
    'high': 0,
    'medium': 5000,
    'low': 10000
  };
  this.materials = {};

  this.init = function() {
    if (this.args.physical) {
      if (this.args.physical.exists === 0) 
        return;
      if (this.args.physical.position) {
        this.position.x = this.args.physical.position[0];
        this.position.y = this.args.physical.position[1];
        this.position.z = this.args.physical.position[2];
      }
      if (this.args.physical.rotation) {
        this.rotation.x = this.args.physical.rotation[0] * (Math.PI / 180);
        this.rotation.y = this.args.physical.rotation[1] * (Math.PI / 180);
        this.rotation.z = this.args.physical.rotation[2] * (Math.PI / 180);
      }
      this.size = this.args.physical.size || [4, 4, 4];
      this.createMaterials('low');
      this.createBox();
      if (this.args.render) {
        if (this.args.render.mesh) {
          this.createMaterials('high');
          this.loadMesh(this.args.render.mesh, 'high');
        }
        if (this.args.render.meshlow) { // FIXME - not well named...
          this.createMaterials('medium');
          this.loadMesh(this.args.render.meshlow, 'medium');
        }
      }

      // Add contact to radar, if available
      if (elation.ui.hud && elation.ui.hud.radar) {
        var radarcontact = {
          position: this.position,
          rotation: this.rotation,
          thing: this
        };
        if (this.args.building && this.args.building.outline) {
          radarcontact.outline = this.args.building.outline;
        } else if (this.args.render && this.args.render.outline) {
          radarcontact.outline = this.args.render.outline
        }
        elation.ui.hud.radar.addContact(radarcontact);
      }
    }
  }
  this.createBox = function() {
    var rotation = false;
    var offset = false;
    if (this.args.render && this.args.render.outline) {
      var verts = this.args.render.outline || [];
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
    if (this.args.render && this.args.render.scale) {
      newobj.scale.set(this.args.render.scale[0], this.args.render.scale[1], this.args.render.scale[2]);
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
    this.addLevel(newobj, this.lodlevels[lodlevel], true);
    console.log(this, 'Added LOD mesh', lodlevel, this.lodlevels[lodlevel], newobj);

    if (lodlevel == "low") {
      var mc = THREE.CollisionUtils.MeshColliderWBox(newobj);
      mc.entity = this;
      THREE.Collisions.colliders.push( mc );
      console.log(this.name + ' added collider', mc);
    }

  }
  this.init();
});
elation.space.meshes.building.prototype = new THREE.LOD();
elation.space.meshes.building.prototype.constructor = elation.space.meshes.building;
