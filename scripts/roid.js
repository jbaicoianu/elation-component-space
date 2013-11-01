elation.extend("space.meshes.roid", function(args) {
  elation.space.thing.call(this, args);
  this.args = args;
  
  this.expose = [
    'id',
    'rotation',
    'position'
  ];
  
  this.postinit = function() {
    var properties = this.properties;
    
    this.render = properties.render;
    this.physical = properties.physical;
    //this.collisionradius = this.physical.radius;
    //console.log('roid',this.collisionradius);
    elation.space.geometry.get(this.render.mesh, this);
    /*
    (function(self, mesh) {
      var loader = new THREE.JSONLoader();
      loader.load(mesh, function(geometry) { 
        //geometry.computeVertexNormals();
        self.loadMesh(geometry); 
      });
    })(this, this.render.mesh);
    */
    elation.events.add(null, 'renderframe_start', this);
    
    this.dynamics.skip = true;
    this.dynamics.radius = 0;
  }
  
  this.loadMesh = function(geometry) {
    var color = new THREE.Color();
    var num = Math.random();
    var f = (1 + this.physical.rand).toFixed(2);
    color.setHSV(Math.random(), num, 1-num);
    //var geometry = new THREE.CubeGeometry( 1, 1, 1 );
    geometry.computeTangents();
    geometry.computeVertexNormals();

    var material = this.material = elation.space.materials.getMaterial('asteroid_material_'+this.render.texture, new THREE.MeshPhongMaterial({ 
      map: this.render.texture,
      normalMap: THREE.ImageUtils.loadTexture(this.render.normalMap),
      shinniness: 0,
      shading: THREE.SmoothShading, 
      blending: THREE.AdditiveAlphaBlending,
      color: color.getHex()
    }));
    material.color = color;
    material.map.wrapS = material.map.wrapT = THREE.RepeatWrapping;
    material.normalMap.wrapS = material.normalMap.wrapT = THREE.RepeatWrapping;
    material.map.repeat.set(f,f);   
    material.normalMap.repeat.set(f,f);  
    var mesh = new THREE.Mesh(geometry, material);

    //mesh.receiveShadow = true;
    
    mesh.position.set(this.physical.position[0], this.physical.position[1], this.physical.position[2]);
    mesh.rotation.set(this.physical.rotation[0], this.physical.rotation[1], this.physical.rotation[2]);
    mesh.scale.set(this.physical.scale[0], this.physical.scale[1], this.physical.scale[2]);

    this.mesh = mesh;
    this.addToController();
    this.controller.scene.add(mesh);
    //this.updateCollisionSize();
  }
  
  this.addToController = function() {
    var o = this.controller.objects,
        name = this.args.name,
        type = this.args.type;
    
    if (!o[type])
      o[type] = {};
      
    if (!o[type][name])
      o[type][name] = [];    
    
    o[type][name].push(this.mesh);
  }
  
  this.renderframe_start = function(ev) {
    if (!this.mesh)
      return;
        
    var min = .00005,
        max = .0005,
        mesh = this.mesh, 
        aspect, speed;
    
    aspect = 1 - (this.physical.maxscale / this.physical.scale[0]);
    speed = (max - min) * aspect + min;
    
    mesh.rotation.z += speed;
    mesh.rotation.y += -speed*1.5;
  }
  
  this.init();
});

elation.space.meshes.roid.prototype = new elation.space.thing();