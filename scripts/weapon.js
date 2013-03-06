elation.extend('space.player.weapon', function(options) {
  this.options = options;
  this.i = 0;
  this.moving = [];
  this.bullets = [];
  this.bullet_count = 4;
  
  this.init = function(newoptions) {
    var options = this.options = newoptions || this.options;
    
    console.log('WEAPON INIT', options);
    this.parent = options.parent || false;
    this.controller = this.parent.controller;
    this.camera = this.controller.camera;
    this.position = pos = options.position || [0,-5,0];
    this.delay = options.delay || 1;
    this.speed = options.speed || 2000;
    this.damage = options.damage || 5;
    this.life = options.life || 10;
    this.color = options.color || 0xFFFFFF;
    this.firing = this.parent.firing;
    
    this.radius = 0;
    
    this.makeWeapon();
    //this.makeParticles();
  }
  
  this.makeBullets = function() {
    for (var i=this.bullet_count; i>0; i--) {
      var bullet = new elation.space.meshes.turret_bullet({ 
        radius: 1, 
        mass: 1, 
        position: new THREE.Vector3(0,0,0), 
        mesh: this.bullet_mesh,
        material: this.bullet_material
      });
      
      this.bullets.push(bullet);
      
      this.controller.scene.add(bullet);
    }
  }
  
  this.getBullet = function() {
    if (this.i > this.bullet_count-1)
      this.i = 0;
    
    var bullet = this.bullets[this.i++];
    return bullet;
  }
  
  this.fire = function() {
    var ship = this.parent,
        bulletspeed = this.speed,
        bulletvelocity = ship.matrixWorld.multiplyVector3(new THREE.Vector3(0,0,-1))
                          .subSelf(ship.matrixWorld.getPosition())
                          .multiplyScalar(bulletspeed)
                          .addSelf(ship.dynamics.vel),
        bullet = this.getBullet();
    
    bullet.fire({ 
      radius: 1, 
      mass: 1, 
      position: this.weapon.matrixWorld.getPosition(), 
      direction: bulletvelocity, 
      speed: this.speed,
      quaternion: this.camera.quaternion,
      mesh: this.bullet_mesh,
      material: this.bullet_material,
      scene: this.controller.scene 
    });
    
    this.bullet = bullet;
  }
  
  this.renderframe_start = function(event) {
    return;
    var p = this.position;
    //this.projectileSystem.position.set(c.x, c.y, c.z).addSelf(new THREE.Vector3(0,0,-10));
      this.projectileSystem.position = this.camera.matrixWorld.multiplyVector3(new THREE.Vector3(
        p[0],
        p[1],
        p[2]
      ));
    
    if (this.parent.firing) {
      if (this.i > this.projectiles.length-1)
        this.i = 0;
      
      var particle = this.projectiles[this.i];
      
      particle.moving = true;
      
      this.i++;
    }
    
    for (var i=0; i<this.projectiles.length; i++) {
      var particle = this.projectiles[i];
      
      if (particle.moving) {
        var pos = this.projectileSystem.position,
            par = particle.position,
            v = new THREE.Vector3(
              par.x + pos.x, 
              par.y + pos.y,
              par.z + pos.z
            );
        if (particle && pos.distanceTo(v) < 2400) {
        console.log('FIRING', this.i, i, particle.moving, this.projectileSystem.position.distanceTo(par), pos, par);
          particle.position = this.camera.matrixWorld.multiplyVector3(new THREE.Vector3(0,0,-10));
        } else {
          particle.moving = false;
          particle.position.set(0,0,0);
        }
      }
    }
  }
  
  this.makeSphere = function(width, coords, material, cols, rows) {
    var geometry = new THREE.SphereGeometry(width,cols || 4,rows || 2);
    
    var sphere = new THREE.Mesh(geometry, material);
    
    sphere.position.x = coords[0];
    sphere.position.y = coords[1];
    sphere.position.z = coords[2];
    
    return sphere;
  }
  
  this.makeWeapon = function() {
    this.weapon = weapon = new THREE.Object3D();
    this.parent.add(weapon);
    
    weapon.position.x = this.position[0];
    weapon.position.y = this.position[1];
    weapon.position.z = this.position[2];

    elation.space.geometry.get('/~lazarus/elation/media/space/models/massdriver.js', this);
    elation.space.geometry.get('/~lazarus/elation/media/space/models/massdriver_bullet.js', this, 'loadMesh2');
  }

  this.loadMesh = function(geometry) {
    var material = elation.space.materials.getMaterial('dg_lambert', new THREE.MeshLambertMaterial({
      color: 0x333333, 
      shading: THREE.FlatShading
    }));
    
    this.mesh = mesh = new THREE.Mesh(geometry, material);
    
    this.geometry = geometry;
    this.weapon.add(mesh);
    //this.updateCollisionSize();
  }

  this.loadMesh2 = function(geometry) {
    this.bullet_material = elation.space.materials.getMaterial('massdriver_bullet_'+this.color, new THREE.MeshBasicMaterial({
      map: '/~lazarus/elation/images/space/star2.jpg', 
      color: this.color
    }));
    
    this.bullet_mesh = geometry;
    this.makeBullets();
  }
  
  this.trigger = function() {
    var time = this.controller.lastupdate * .001;
    
    if (!this.oldtime)
      this.oldtime = time - this.delay;
    
    if (time - this.oldtime > this.delay) {
      this.fire();
      this.oldtime = time;
    }
  }
  
  this.handleEvent = function(ev) {
    if (typeof this[ev.type] == 'function') {
      this[ev.type](ev);
    }
  }
  
  this.init();
});

elation.extend("space.meshes.turret_bullet", function(args) {
  elation.space.thing.call(this, args);

  this.postinit = function() {
    //console.log('Make Bullet: ', this);
    this.position.copy(this.args.position);
    this.dynamics.drag = 0;
    
    //this.makeParticles();
    this.radius = this.dynamics.radius = 0;
  }
  
  this.fire = function(args) {
    this.position.copy(args.position);
    this.dynamics.setVelocity(args.direction);
    
    var q = args.quaternion;
    this.mesh.quaternion.set(q.x, q.y, q.z, q.w);
    
    (function(self) {
      setTimeout(function() { self.cleanup(); }, 1250);
    })(this);
  }
  
  this.createGeometry = function() {
    //console.log('new bullet', this);
    
    //this.bmesh = mesh = new THREE.Mesh(this.args.mesh, this.args.material);
    //this.add(mesh);
    this.mesh = mesh = this.createMesh(this.args.mesh, this.args.material);
    mesh.useQuaternion = true;
  }
  this.dynamicsupdate = function(ev) {
    //var inertia_vector = this.args.vector.normalize().multiplyScalar(this.args.magnitude);
    //this.bmesh.position.multiply(inertia_vector);
    
    //if (this.args.camera.position.distanceTo(this.position) > 2000) {
    //  this.cleanup();
      //this.cleanup2();
    //}
    
    //var original_quat = this.bmesh.quaternion;
    //var temp_quat = new THREE.Quaternion();
    //var new_quat = temp_quat.setFromAxisAngle(new THREE.Vector3(0, 0, 1), (15 * (Math.PI / 180)));
    //original_quat.multiplySelf(new_quat);
    /*
    if (this.geometry) {
      var verts = this.geometry.vertices;
      var vert = verts[this.inc++];
      var pos = this.bmesh.position;
      vert.position.set(pos.x, pos.y, pos.z);
    }
    */
  }
  this.cleanup2 = function() {
    //this.scene.remove(this.projectileSystem);
  }
  this.cleanup = function() {
    this.dynamics.setVelocity(new THREE.Vector3(0,0,0));
    this.position.set(0,0,0);

    //this.scene.remove(this);
  }
  
  this.makeParticles = function() { return;
    // create the particles
    this.pCount = 1000;
    this.pSize = 1;
    this.geometry = new THREE.Geometry();
    
    this.attributes = {
      size: {	type: 'f', value: [] },
      customColor: { type: 'c', value: [] }
    };

    uniforms = {
      amplitude: { type: "f", value: 1 },
      color:     { type: "c", value: new THREE.Color( 0xFFFFFF ) },
      texture:   { type: "t", value: THREE.ImageUtils.loadTexture( "/~lazarus/elation/images/space/particle.png" ) },
    };
    
    var materialargs = {
      uniforms: uniforms,
      attributes: this.attributes,
      vertexShader: document.getElementById('vertexshader').textContent,
      fragmentShader: document.getElementById('fragmentshader').textContent,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: true,
      transparent:	true
    };
    
    var material = new THREE.ShaderMaterial(materialargs);
    
    for (var p = 0; p < this.pCount; p++) {
      var ppos = new THREE.Vector3(0,0,0);
      
      particle = new THREE.Vertex(ppos);
      this.geometry.vertices.push(particle);
    }

    this.projectileSystem = new THREE.ParticleSystem(this.geometry, material);
    
    this.projectileSystem.dynamic = true;
    this.projectileSystem.sortParticles = true;
    this.projectileSystem.renderDepth = -1.5;
    this.projectileSystem.depthWrite = -1.5;
    
    var vertices = this.projectiles = this.geometry.vertices;
    var values_size = this.attributes.size.value;
    var values_color = this.attributes.customColor.value;
    
    for( var v = 0; v < vertices.length; v++ ) {
      values_size[ v ] = this.pSize;
      values_color[ v ] = new THREE.Color( 0xFFFFFF );
    }
    
    this.projectileSystem.position.set(0,0,0);
    
    console.log('Make Particles:', this.radarSystem, material);
    this.controller.scene.add(this.projectileSystem);
  }
  
  this.init();
});
elation.space.meshes.turret_bullet.prototype = new elation.space.thing;
elation.space.meshes.turret_bullet.constructor = elation.space.meshes.turret_bullet;