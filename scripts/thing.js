elation.extend("space.thing", function(args) {
  THREE.Object3D.call( this );

  this.args = args || {};
  this.autocreategeometry = this.args.autocreategeometry || true;
  this.materials = [];

  this.init = function() {
    if (typeof this.preinit == 'function') {
      this.preinit();
    }

    //this.createMaterial();
    if (this.autocreategeometry) {
      this.createGeometry();
    }

    if (this.args.physical) {
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
    }
    this.createDynamics();

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
      mesh.doubleSided = true;
      if (this.args.render && this.args.render.scale) {
        mesh.scale.set(this.args.render.scale[0], this.args.render.scale[1], this.args.render.scale[2]);
      }
      //console.log('created new mesh', mesh);
      this.add(mesh);
    } else {
      console.log('Invalid geometry passed to createMesh');
    }
  }
  this.createDynamics = function() {
  }
  this.handleEvent = function(ev) {
    if (typeof this[ev.type] == 'function') {
      this[ev.type](ev);
    }
  }
});
elation.space.thing.prototype = new THREE.Object3D();
//elation.space.thing.prototype.supr = THREE.Object3D.prototype;
elation.space.thing.prototype.constructor = elation.space.thing;
