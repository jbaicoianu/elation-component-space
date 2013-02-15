elation.extend("space.meshes.ship", function(args) {
  elation.space.thing.call( this, args);
  this.args = args;
  
  this.expose = [
    'id',
    'rotation',
    'position'
  ];
  
  this.postinit = function() {
    //console.log('@@@ SHIP POSTINIT');
    
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
      var shading = this.properties.render.shading;
      
      switch(shading) {
        case 'flat': var meshShading = THREE.FlatShading; break;
        case 'smooth': var meshShading = THREE.SmoothShading; break;
        default: var meshShading = THREE.FlatShading;
      }
      
      this.materials = [new THREE.MeshFaceMaterial({color: 0xffffff, shading: meshShading})];
      console.log('@@@ ship LOADED MODEL', this.properties.render.shading, this.materials, meshShading); 
      (function(self, mesh) {
        var loader = new THREE.JSONLoader();
        loader.load( { model: mesh, callback: function(geometry) { 
          if (shading == 'smooth') 
            geometry.computeVertexNormals();
          
          self.loadMesh(geometry); 
        } });
      })(this, this.properties.render.mesh);
    }
    
    elation.events.add(null, 'renderframe_start', this);
  }
  
  this.renderframe_start = function(ev) {
    if (this.mesh) {
      this.position.x += .02;
      this.position.y += .03;
      this.position.z += .02;
      this.rotation.z += .001;
      this.rotation.y += .002;
    }
  }
  this.loadMesh = function(geometry) {
    var material = new THREE.MeshFaceMaterial({color: 0xaaaaff});
    this.mesh = mesh = new THREE.Mesh(geometry, material);
    
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    if (this.properties && this.properties.physical && this.properties.physical.scale) 
      mesh.scale.set(this.properties.physical.scale[0], this.properties.physical.scale[1], this.properties.physical.scale[2]);
    
    this.add(mesh);
    this.updateCollisionSize();
  }
  this.createGeometry = function() { return;
    var color = 0xaaaaff,
        physical = this.get(args, 'properties.physical'),
        pos = physical.position,
        radius = 200,
        r2 = radius / 1.2;
    
    console.log('### ship geometry GENERATED',color,this, args);

    var geom = new THREE.SphereGeometry(this.properties.physical.radius || 1000, 18, 18);
    //this.collisionradius = 200;
    this.createMesh(geom, new THREE.MeshBasicMaterial({ color: 0xaa0000, wireframe: true, transparent: true }));
  }
  this.init();
});
elation.space.meshes.ship.prototype = new elation.space.thing()
//elation.space.meshes.star.prototype.constructor = elation.space.meshes.star;

