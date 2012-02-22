elation.extend("space.thing", function(args) {
  THREE.Object3D.call( this );

  this.args = args || {};
  this.properties = this.args.properties || {};
  this.autocreategeometry = this.args.autocreategeometry || true;
  this.materials = [];
  this.cameras = [];
  this.parts = {};
  this.state = {};
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
    if (!this.mass) {
      this.mass = elation.utils.arrayget(this.properties, "physical.mass", 1);
    }
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
    if (this.properties.render) {
      if (this.properties.render.scale) {
        this.scale.set(this.properties.render.scale[0], this.properties.render.scale[1], this.properties.render.scale[2]);
      }
      if (this.properties.render.mesh) {
        this.loadJSON(this.properties.render.mesh, this.properties.render.texturepath);
      }
      if (this.properties.render.collada) {
        this.loadCollada(this.properties.render.collada);
      }
    }
    if (this.autocreategeometry) {
      this.createMaterial();
      this.createGeometry();
    }
    this.createDynamics();
    this.createRadarContact();

    elation.events.add([this], "select,deselect", this);
    if (typeof this.loaded == 'function') {
      elation.events.add([this], "loaded", this);
    }

    if (typeof this.postinit == 'function') {
      this.postinit();
    }
  }
  this.setState = function(state, value) {
    this.state[state] = value;
    if (typeof this.updateParts == 'function') {
      this.updateParts();
    }
  }
  this.setStates = function(states) {
    for (var k in states) {
      this.state[k] = states[k];
    }
    if (typeof this.updateParts == 'function') {
      this.updateParts();
    }
  }
  this.createMaterial = function() {
    return [new THREE.MeshPhongMaterial({color: 0xcccccc})];
  }
  this.createGeometry = function() {
  }
  this.loadJSON = function(url, texturepath) {
    if (typeof texturepath == 'undefined') {
      texturepath = '/media/space/textures';
    }
    (function(self, mesh, texturepath) {
      var loader = new THREE.JSONLoader();
      loader.load( mesh, function(geometry) { self.processJSON(geometry); }, texturepath);
    })(this, url, texturepath);
  }
  this.processJSON = function(geometry) {
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial());
    mesh.doubleSided = false;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    this.add(mesh);
    this.updateCollisionSize();
    elation.events.fire({type: "loaded", element: this, data: mesh});
  }
  this.loadCollada = function(url) {
    var loader = new THREE.ColladaLoader();
    (function(self) {
      loader.load(url, function(collada) {
        self.processCollada(collada);
      });
    })(this);
  }
  this.processCollada = function(collada) {
    collada.scene.rotation.x = -Math.PI / 2;
    collada.scene.rotation.z = Math.PI;
    this.add(collada.scene);
    this.extractEntities(collada.scene);
    this.updateCollisionSize();
    elation.events.fire({type: "loaded", element: this, data: collada.scene});
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
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
    })(this, scene);
    console.log('Collada loaded: ', this.parts, this.cameras); 
    if (this.cameras.length > 0) {
      this.camera = this.cameras[0];
    }
    this.updateCollisionSize();
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
      var velocity = elation.utils.arrayget(this.properties, 'physical.velocity');
      if (!velocity) velocity = [0,0,0];
      var angular = elation.utils.arrayget(this.properties, 'physical.rotationalvelocity');
      if (!angular) angular = [0,0,0];

      this.dynamics = new elation.utils.physics.object({
        position: this.position,
        rotation: this.rotation,
        restitution: .5,
        radius: this.collisionradius,
        drag: this.drag,
        friction: this.friction,
        mass: this.mass,
        velocity: new THREE.Vector3(velocity[0], velocity[1], velocity[2]),
        angular: new THREE.Vector3(angular[0] * Math.PI/180, angular[1] * Math.PI / 180, angular[2] * Math.PI / 180),
        object: this
      });
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
    this.cameras.push(new THREE.PerspectiveCamera(50, viewsize[0] / viewsize[1], 1, 1.5e15));
    this.camera = this.cameras[this.cameras.length-1];
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
      //var bounds = this.getBoundingBox();
/*
      var bounds = this.computeBoundingBox();
      var dims = [bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y, bounds.max.z - bounds.min.z];
      var diameter = Math.max(dims[0], dims[1], dims[2]);

      var dist = [dims[0] / 2, dims[1] / 2, dims[2] / 2];
      var center = [(bounds.max.x + bounds.min.x) / 2, (bounds.max.y + bounds.min.y) / 2, (bounds.max.z + bounds.min.z) / 2];

      this.collisionradius = this.dynamics.radius = diameter / 2;
console.log(bounds, dims, center, diameter, this.dynamics.radius);
*/
      var sphere = this.computeBoundingSphere();
      this.collisionradius = this.dynamics.radius = sphere.radius;
      if (this.collisionradius > 0) {
        var scene = elation.space.fly(0).scene;
        if (this.collisionmesh) {
          scene.remove(this.collisionmesh);
        }
        var collisiongeom = new THREE.OctahedronGeometry(this.dynamics.radius, 3);
        //var collisiongeom = new THREE.CubeGeometry(diameter, diameter, diameter);
        //var collisiongeom = new THREE.CubeGeometry(dims[0], dims[1], dims[2]);
        var offset = new THREE.Matrix4();
        //offset.setPosition(new THREE.Vector3(center[0], center[1], center[2]));
        //collisiongeom.applyMatrix(offset);
        this.collisionmesh = new THREE.Mesh(collisiongeom, new THREE.MeshLambertMaterial({color: 0x00ff00, opacity: .1, transparent: true, blending: THREE.AdditiveAlphaBlending, wireframe: true}));
        //this.collisionmesh.scale = this.scale;
        //this.collisionmesh.doubleSided = true;
        this.collisionmesh.ignoreCollider = true;
        this.collisionmesh.material.depthWrite = false;

        //this.add(this.collisionmesh);
      }
  }
/*
  this.updateBoundingBox = function(obj) {
    
  }
  this.getBoundingBox = function(obj) {
    var bbox = {max: new THREE.Vector3(), min: new THREE.Vector3()};

    if (!obj) obj = this;
    
    if (obj.children) {
      for (var i = 0; i < obj.children.length; i++) {
        obj.children[i].updateMatrix();
        if (obj.children[i] instanceof THREE.Mesh || obj.children[i].children.length > 0) {
          var childbbox = this.getBoundingBox(obj.children[i]);
          var min = childbbox.min.clone();
          var max = childbbox.max.clone();
          obj.children[i].matrix.multiplyVector3(min);
          obj.children[i].matrix.multiplyVector3(max);
  console.log("child:", obj.children[i], [min.x, min.y, min.z], [max.x, max.y, max.z]);

          if (min.x < bbox.min.x) bbox.min.x = min.x; 
          if (min.y < bbox.min.y) bbox.min.y = min.y; 
          if (min.z < bbox.min.z) bbox.min.z = min.z; 

          if (max.x < bbox.min.x) bbox.min.x = max.x; 
          if (max.y < bbox.min.y) bbox.min.y = max.y; 
          if (max.z < bbox.min.z) bbox.min.z = max.z; 

          if (min.x > bbox.max.x) bbox.max.x = min.x; 
          if (min.y > bbox.max.y) bbox.max.y = min.y; 
          if (min.z > bbox.max.z) bbox.max.z = min.z; 

          if (max.x > bbox.max.x) bbox.max.x = max.x; 
          if (max.y > bbox.max.y) bbox.max.y = max.y; 
          if (max.z > bbox.max.z) bbox.max.z = max.z; 
        }
      }
    }
    if (obj.geometry) {
      obj.geometry.computeBoundingBox();
      //console.log(obj, obj.geometry.boundingSphere, obj.geometry.boundingBox);
      var geobbox = obj.geometry.boundingBox;
      if (geobbox) {
        var min = geobbox.min.clone();
        var max = geobbox.max.clone();
        if (min.x < bbox.min.x) bbox.min.x = min.x; 
        if (min.y < bbox.min.y) bbox.min.y = min.y; 
        if (min.z < bbox.min.z) bbox.min.z = min.z; 

        if (max.x > bbox.max.x) bbox.max.x = max.x; 
        if (max.y > bbox.max.y) bbox.max.y = max.y; 
        if (max.z > bbox.max.z) bbox.max.z = max.z; 
      }
    } else {
      //console.log('no geom', obj);
    }
    return bbox;
  }
  */
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

