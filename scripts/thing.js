elation.extend("space.thing", function(args) {
  THREE.Object3D.call( this );

  this.args = args || {};
  this.properties = this.args.properties || {};
  this.autocreategeometry = this.args.autocreategeometry || true;
  this.materials = [];
  this.cameras = [];
  this.parts = {};
  this.collisionradius = 0;

  this.init = function() {
    this.name = this.args.name;
    this.parentname = this.args.parentname;
    this.type = this.args.type;

    if (typeof this.preinit == 'function') {
      this.preinit();
    }

    if (!this.properties.physical) {
      this.properties.physical = {};
    }
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
    if (this.properties.render && this.properties.render.scale) {
      this.scale.set(this.properties.render.scale[0], this.properties.render.scale[1], this.properties.render.scale[2]);
    }
    if (this.autocreategeometry) {
      this.createMaterial();
      this.createGeometry();
    }
    this.createDynamics();
    this.createRadarContact();

    elation.events.add([this], "select,deselect", this);

    if (typeof this.postinit == 'function') {
      this.postinit();
    }
  }
  this.createMaterial = function() {
    return [new THREE.MeshPhongMaterial({color: 0xcccccc})];
  }
  this.createGeometry = function() {
  }
  this.loadCollada = function(url) {
    var loader = new THREE.ColladaLoader();
    (function(self) {
      loader.load(url, function(collada) {
        self.createColladaScene(collada);
      });
    })(this);
  }
  this.createColladaScene = function(collada) {
    collada.scene.rotation.x = -Math.PI / 2;
    collada.scene.rotation.z = Math.PI;
    this.add(collada.scene);
    this.extractEntities(collada.scene);
    this.updateCollisionSize();
  }
  this.extractEntities = function(scene) {
    this.cameras = [];
    this.parts = {};
    (function(self, scene) {
      THREE.SceneUtils.traverseHierarchy( scene, function ( node ) { 
        if ( node instanceof THREE.Camera ) {
          self.cameras.push(node);
        } else if (node instanceof THREE.Mesh) {
          self.parts[node.name || node.id] = node;
        }
      });
    })(this, scene);
    console.log('Collada loaded: ', this.parts, this.cameras); 
    if (this.cameras.length > 0) {
      this.camera = this.cameras[0];
    }
  }
  this.createMesh = function(geometry, materials) {
    if (geometry) {
      //geometry.computeVertexNormals();
      //geometry.computeTangents();
      var mesh = new THREE.Mesh(geometry, materials);
      mesh.dynamic = true;

      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.doubleSided = false;
      //console.log('created new mesh', mesh);
      this.add(mesh);

      /*
      if (!this.trident) {
        this.trident = new THREE.Axes();
        this.add(this.trident);
      }
      */
    } else {
      console.log('Invalid geometry passed to createMesh');
    }
    return mesh;
  }
  this.createDynamics = function() {
    if (!this.dynamics) {
      var angular = elation.utils.arrayget(this.properties, 'physical.rotationalvelocity');
      if (!angular) angular = [0,0,0];
      this.dynamics = new elation.utils.physics.object({position: this.position, rotation: this.rotation, restitution: .8, radius: this.collisionradius, drag: .4257, friction: this.friction, mass: this.mass || 1, angular: new THREE.Vector3(angular[0] * Math.PI/180, angular[1] * Math.PI / 180, angular[2] * Math.PI / 180)});
      //this.dynamics.setVelocity([0,0,5]);
      //this.dynamics.addForce("gravity", [0,-9800,0]);
      elation.utils.physics.system.add(this.dynamics);

      this.updateCollisionSize();
      elation.events.add([this.dynamics], "dynamicsupdate,bounce", this);
    }
  }
  this.removeDynamics = function() {
    if (this.dynamics) {
      elation.utils.physics.system.remove(this.dynamics);
    }
  }
  this.createCamera = function(offset, rotation) {
    var viewsize = elation.space.fly(0).viewsize;
    this.camera = new THREE.PerspectiveCamera(50, viewsize[0] / viewsize[1], 1, 1.5e15);
    if (offset) {
      this.camera.position.copy(offset)
    }
    if (rotation) {
      this.camera.eulerOrder = "YZX";
      this.camera.rotation.copy(rotation);
    }
    this.add(this.camera);
  }
  this.cycleCamera = function() {
    if (this.camera) {
      if (typeof this.currentcamera == 'undefined') {
        this.currentcamera = 0;
      }

      if (this.camerapositions && this.camerapositions.length > 0) {
        if (++this.currentcamera >= this.camerapositions.length) {
          this.currentcamera = 0;
        }
        this.camera.position = this.camerapositions[this.currentcamera][0];
        this.camera.rotation = this.camerapositions[this.currentcamera][1];
      } else if (this.cameras && this.cameras.length > 0) {
        if (++this.currentcamera == this.cameras.length) {
          this.currentcamera = 0;
        }
        this.camera = this.cameras[this.currentcamera];
        elation.space.fly(0).attachCameraToObject(this.camera, true);
      }
    }
  }
  this.updateCollisionSize = function() {
      //console.log(this, this.collisionradius, this.boundRadius);
      var bounds = this.getBoundingBox();
console.log(bounds);
      var dist = [(bounds.max.x - bounds.min.x) / 2, (bounds.max.y - bounds.min.y) / 2, (bounds.max.z - bounds.min.z) / 2];
      var center = [(bounds.max.x + bounds.min.x) / 2, (bounds.max.y + bounds.min.y) / 2, (bounds.max.z + bounds.min.z) / 2];
      var radius = Math.max(dist[0], dist[1], dist[2]);

      this.collisionradius = this.dynamics.radius = radius;
      if (this.collisionradius > 0) {
        if (this.collisionmesh) {
          this.remove(this.collisionmesh);
        }
        var collsphere = new THREE.OctahedronGeometry(this.dynamics.radius, 3);
        this.collisionmesh = new THREE.Mesh(collsphere, new THREE.MeshBasicMaterial({color: 0x00ff00, opacity: .1, transparent: true, blending: THREE.AdditiveAlphaBlending, wireframe: true}));
        this.collisionmesh.position.set(center[0], center[1], center[2]);
        this.collisionmesh.fuck = true;
        this.collisionmesh.doubleSided = true;
        this.collisionmesh.material.depthWrite = false;

        this.add(this.collisionmesh);
      }
  }
  this.getBoundingBox = function(obj) {
    var bbox = {max: new THREE.Vector3(), min: new THREE.Vector3()};

    if (!obj) obj = this;
    
    if (obj.children) {
      for (var i = 0; i < obj.children.length; i++) {
        var childbbox = this.getBoundingBox(obj.children[i]);

        if (childbbox.min.x < bbox.min.x) bbox.min.x = childbbox.min.x; 
        if (childbbox.min.y < bbox.min.y) bbox.min.y = childbbox.min.y; 
        if (childbbox.min.z < bbox.min.z) bbox.min.z = childbbox.min.z; 

        if (childbbox.max.x > bbox.max.x) bbox.max.x = childbbox.max.x; 
        if (childbbox.max.y > bbox.max.y) bbox.max.y = childbbox.max.y; 
        if (childbbox.max.z > bbox.max.z) bbox.max.z = childbbox.max.z; 
      }
    }
    if (obj.geometry) {
      obj.geometry.computeBoundingBox();
      console.log(obj, obj.geometry.boundingSphere, obj.geometry.boundingBox);
      var geobbox = obj.geometry.boundingBox;
      if (geobbox) {
        if (geobbox.min.x < bbox.min.x) bbox.min.x = geobbox.min.x; 
        if (geobbox.min.y < bbox.min.y) bbox.min.y = geobbox.min.y; 
        if (geobbox.min.z < bbox.min.z) bbox.min.z = geobbox.min.z; 

        if (geobbox.max.x > bbox.max.x) bbox.max.x = geobbox.max.x; 
        if (geobbox.max.y > bbox.max.y) bbox.max.y = geobbox.max.y; 
        if (geobbox.max.z > bbox.max.z) bbox.max.z = geobbox.max.z; 
      }
    } else {
      console.log('no geom', obj);
    }
    /*
    if (obj != this) {
      this.matrix.multiplyVector3(bbox.max);
      this.matrix.multiplyVector3(bbox.min);
    }
    */
    return bbox;
  }
      
  this.createRadarContact = function() {
    // Add contact to radar, if available
    if (elation.ui.hud && elation.ui.hud.radar) {
      var radarcontact = {
        position: this.position,
        rotation: this.rotation,
        thing: this,
        type: this.type
      };
      if (this.properties.building && this.properties.building.outline) {
        radarcontact.outline = this.properties.building.outline;
      } else if (this.properties.render && this.properties.render.outline) {
        radarcontact.outline = this.properties.render.outline;
      } else if (this.properties.physical && this.properties.physical.size) {
        var halfsize = [this.properties.physical.size[0] / 2, this.properties.physical.size[1] / 2, this.properties.physical.size[2] / 2]; 
        radarcontact.outline = [
          [-halfsize[0], -halfsize[2]],
          [-halfsize[0], halfsize[2]],
          [halfsize[0], halfsize[2]],
          [halfsize[0], -halfsize[2]],
          [-halfsize[0], -halfsize[2]]
        ];
      }
      if (this.properties.render && this.properties.render.scale) {
        radarcontact.scale = this.properties.render.scale;
      }
      elation.ui.hud.radar.addContact(radarcontact);
      this.radarcontact = radarcontact;
    }
  }
  this.removeRadarContact = function() {
    if (elation.ui.hud && elation.ui.hud.radar) {
      elation.ui.hud.radar.removeContact(this.radarcontact);
    }
  }

  this.handleEvent = function(ev) {
    if (typeof this[ev.type] == 'function') {
      this[ev.type](ev);
    }
  }
  this.select = function(ev) {
    console.log("Thing selected:", this);
    if (this.controlcontext) {
      elation.space.controls(0).activateContext(this.controlcontext, this);
    }
    if (this.camera) {
      elation.space.fly(0).attachCameraToObject(this.camera);
    }
  }
  this.deselect = function(ev) {
    console.log("Thing deselected:", this);
    if (this.controlcontext) {
      elation.space.controls(0).deactivateContext(this.controlcontext);
    }
    if (this.camera) {
      elation.space.fly(0).attachCameraToObject(false);
    }
  }
  this.bounce = function(ev) {
    //console.log('boing', this, ev.data);
    if (this.collisionmesh) {
      this.collisionmesh.material.color.setHex(0xff0000);
      (function(mesh) {
        setTimeout(function() {
          mesh.material.color.setHex(0x00ff00);
        }, 500);
      })(this.collisionmesh);
    }
  }
});
elation.space.thing.prototype = new THREE.Object3D();
//elation.space.thing.prototype.supr = THREE.Object3D.prototype;
elation.space.thing.prototype.constructor = elation.space.thing;

