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
    
    elation.events.add(null, 'renderframe_start', this);
    
    this.dynamics.skip = true;
    this.dynamics.radius = 0;
  }
  
  this.loadMesh = function(geometry) {
    var material = this.material = elation.space.materials.getMaterial('asteroid_material_'+this.render.texture, new THREE.MeshPhongMaterial({ 
      map: this.render.texture, 
      shading: THREE.SmoothShading, 
      blending: THREE.AdditiveAlphaBlending 
    }));
    
    var mesh = new THREE.Mesh(geometry, material);
    //var mesh = new THREE.Mesh(new THREE.SphereGeometry(7,6,6),material);

    mesh.receiveShadow = true;
    
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