elation.extend("space.meshes.station", function(args) {
  elation.space.thing.call( this, args);
  this.args = args;
  
  this.expose = [
    'id',
    'rotation',
    'position'
  ];
  
  this.postinit = function() {    
    /*
    this.controller = elation.space.starbinger(0);
    var args = this.args;
    
    var scene = this.controller.scene;
    var loader = new THREE.OBJMTLLoader();
    loader.addEventListener( 'load', function ( event ) {

      var object = event.content;

      object.position.x = args.properties.physical.position[0];
      object.position.y = args.properties.physical.position[1];
      object.position.z = args.properties.physical.position[2];
      scene.add( object );

    });
				loader.load( 'obj/male02/male02.obj', 'obj/male02/male02_dds.mtl' );
    
    */
    if (this.properties.render && this.properties.render.mesh) {
      this.materials = [new THREE.MeshFaceMaterial({color: 0x444444, shading: THREE.FlatShading})];
      (function(self, mesh) {
        var loader = new THREE.JSONLoader();
        loader.load(mesh, function(geometry) { 
          geometry.computeVertexNormals();
          self.loadMesh(geometry); 
        });
      })(this, this.properties.render.mesh);
    }
    
    
    elation.events.add(null, 'renderframe_start', this);
  }
  
  this.renderframe_start = function(ev) {
    if (this.mesh) {
      //this.rotation.z += .0001;
      //this.rotation.y += .0002;
    }
  }
  this.loadMesh = function(geometry) {
    var material = new THREE.MeshFaceMaterial({color: 0x772222, shading: THREE.FlatShading});
    this.mesh = mesh = new THREE.Mesh(geometry, material);
    //mesh.rotation.x = 3.1415;
    //mesh.rotation.z = 3.1415;
    //mesh.position.z = -1.5;
    //mesh.position.y = -1.25;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (this.properties && this.properties.physical && this.properties.physical.scale) 
      mesh.scale.set(this.properties.physical.scale[0], this.properties.physical.scale[1], this.properties.physical.scale[2]);
    
    if (this.properties && this.properties.rotation && this.properties.physical.rotation) {
      var rot = this.properties.physical.rotation;
      console.log('station rotation', rot);
      mesh.rotation.set(rot[0],rot[1],rot[2]);
    }
    this.geometry = geometry;
    this.add(mesh);
    this.updateCollisionSize();
  }
  this.createGeometry = function() { return;
    var color = 0xaaaaff,
        physical = this.get(args, 'properties.physical'),
        pos = physical.position,
        radius = 200,
        r2 = radius / 1.2;
    
    console.log('### STATION GENERATED',color,this, args);

    var geom = new THREE.SphereGeometry(this.properties.physical.radius || 1000, 18, 18);
    //this.collisionradius = 200;
    this.createMesh(geom, new THREE.MeshBasicMaterial({ color: 0xaa0000, wireframe: true, transparent: true }));
  }
  this.init();
});
elation.space.meshes.station.prototype = new elation.space.thing()
//elation.space.meshes.star.prototype.constructor = elation.space.meshes.star;

