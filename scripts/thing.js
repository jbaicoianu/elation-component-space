elation.extend("space.thing", function(args) {
  THREE.Object3D.call( this );

  this.args = args || {};
  this.properties = this.args.properties || {};
  this.autocreategeometry = this.args.autocreategeometry || true;
  this.materials = [];

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
    if (this.autocreategeometry) {
      this.createMaterial();
      this.createGeometry();
    }
    this.createDynamics();
    this.createRadarContact();
    if (this.dynamics) {
      elation.events.add([this.dynamics], "dynamicsupdate", this);
    }

/*
console.log('I got things', this.args.things);
      if (this.args.things) {
        for (var k in this.args.things) {
          var thing = this.args.things[k];
          if (typeof elation.space.meshes[thing.type] == 'function') {
            currentobj = new elation.space.meshes[thing.type](thing);
            this.add(currentobj);
            console.log("Added new " + thing.type + ": " + thing.parentname + '/' + thing.name, currentobj, thing);
          }
        }
      }
*/
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
  this.createMesh = function(geometry, materials) {
    if (geometry) {
      //geometry.computeVertexNormals();
      //geometry.computeTangents();
      var mesh = new THREE.Mesh(geometry, materials);
      mesh.dynamic = true;

      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.doubleSided = false;
      if (this.properties.render && this.properties.render.scale) {
        mesh.scale.set(this.properties.render.scale[0], this.properties.render.scale[1], this.properties.render.scale[2]);
      }
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
  }
  this.createRadarContact = function() {
  }

  this.handleEvent = function(ev) {
    if (typeof this[ev.type] == 'function') {
      this[ev.type](ev);
    }
  }
  this.select = function(ev) {
    console.log("selected", this);
  }
  this.deselect = function(ev) {
    console.log("deselected", this);
  }
  this.dynamicsupdate = function(ev) {
    //this.rotation.copy(this.dynamics.rot);
  }
});
elation.space.thing.prototype = new THREE.Object3D();
//elation.space.thing.prototype.supr = THREE.Object3D.prototype;
elation.space.thing.prototype.constructor = elation.space.thing;

elation.space.thing.prototype.createRadarContact = function() {
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
    }
  }
