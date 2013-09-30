elation.extend('space.equipment.capacitors', new function(name) {
  this['small']={
    capacity: 80,
    regeneration: 1000,
    dissapation:  0.15
  };
  this['standard']={
    capacity: 500,
    regeneration: 1000,
    dissapation:  0.11
  };
  this['large']={
    capacity: 900,
    regeneration: 600,
    dissapation:  0.08
  };
});

elation.extend('space.equipment.capacitor', function(name, parent) {
  this.name = name;
  this.parent = parent;
  this.options = options = elation.space.equipment.capacitors[name || 'small'];
  this.capacity = options.capacity || 300;
  this.regen = options.regen || 900;
  this.dissapation = options.dissapation || .011;
  this.energy = 0;
  this.heat = 0;
  this.value = 0;
  this.firemode = 0;
  this.active = 0;
  
  this.init = function(newoptions) {
    elation.events.add(this, 'renderframe_start', this);
    console.log('-!- Equipment.Capacitor: Initialized '+this.name+' capacitor.', options);
  }
  
  this.renderframe_start = function(ev) {
    var delta = ev.data.lastupdatedelta,
        mod = (1 - (this.parent.throttle)),
        modregen = ((this.regen / 3) + ((this.regen/1.5) * mod)),
        total = modregen * delta;
    
    this.energy += total;
    this.modregen = modregen;
    
    if (this.energy > this.capacity)
      this.energy = this.capacity;
    
    this.value = this.energy / this.capacity;
    
    var heat = this.heat - this.dissapation;
    this.heat = heat < 0 ? 0 : heat;
  }
  
  this.toggleMode = function(refresh) {
    var ship = this.parent,
        mode = refresh ? this.firemode : this.firemode + 1,
        mode = mode > 2 ? 0 : mode;
    
    switch(mode) {
      case 0:
        for (var name='All',i=0; i<ship.weapconf.length; i++) {
          var weapon = ship.weapconf[i];
          
          if (weapon.ammo != 0)
            weapon.enabled = 1;
        }
        
        break;
      case 1:
        for (var name='Group',i=0; i<ship.weapconf.length; i++) {
          var weapon = ship.weapconf[i];
          var active = ship.weapconf[this.active];
          
          if (weapon.name == active.name && weapon.ammo != 0)
            weapon.enabled = 1;
          else
            weapon.enabled = 0;
        }
        
        break;
      case 2:
        for (var name='Single',i=0; i<ship.weapconf.length; i++) {
          var weapon = ship.weapconf[i];
          
          if (this.active == i && weapon.ammo != 0)
            weapon.enabled = 1;
          else
            weapon.enabled = 0;
        }
        
        break;
    }
    
    this.firemode = mode;
    
    if (!refresh)
      elation.ui.hud.console.log('-!- Switched firing mode to ' + name);
  }
    
  this.setWeapon = function(num) {
    var ship = this.parent;
    
    for (var i=0; i<ship.weapconf.length; i++) {
      var weapon = ship.weapconf[i];
      
      if (i == num && weapon.ammo != 0)
        weapon.enabled = 1;
      else
        weapon.enabled = 0;
    }
    
    this.active = num;
    elation.ui.hud.console.log('-!- Switched active weapon to ' + ship.weapconf[num].name);
    this.toggleMode(true);
  }
  
  this.handleEvent = function(ev) {
    if (typeof this[ev.type] == 'function') {
      this[ev.type](ev);
    }
  }
  
  this.init();
});

elation.extend('space.equipment.guns', new function(name) {
  this['Cannon']={
    model:'cannon',
    recoil:.3,
    rotation:0,
    ammo:-1,
    energy:75,
    size:1.8,
    speed:2000,
    delay:.8,
    flash:{duration:300,color:0x00FF44,position_y:-.02,position_z:2},
    light:{duration:250,color:0x66FFAA,radius:35,position_z:3},
    color:0x00FF44
  };
  this['Gatling']={
    model:'gatling',
    recoil:0,
    rotation:(Math.PI/10),
    ammo:300,
    energy:25,
    size:.5,
    speed:2000,
    delay:.2,
    winddown: 1000,
    flash:{duration:200,color:0xFFFFFF,size:0.01,position_z:2.2,image:'muzzleflash0'},
    light:{duration:0},
    color:0xFFFFFF
  };
});

elation.extend('space.equipment.gun', function(name, container, hardpoint) {
  this.name = name;
  this.parent = container;
  this.position = hardpoint || [0,-5,0];
  this.i = 0;
  this.ready = 1;
  this.radius = 0;
  this.enabled = 1;
  this.moving = [];
  this.bullets = [];
  
  this.init = function(newoptions) {
    var options = elation.space.equipment.guns[name],
        get = elation.utils.arrayget;
    
    console.log('-!- Equipment.Gun: Initialized', name, options);
    this.controller = this.parent.controller;
    this.camera = this.controller.camera;
    this.delay = options.delay || 1;
    this.speed = options.speed || 2000;
    this.damage = options.damage || 5;
    this.life = options.life || 10;
    this.color = options.color || 0xFFFFFF;
    this.size = options.size || 1;
    this.energy = options.energy || 5;
    this.recoil = options.recoil || 0;
    this.rotation = options.rotation || 0;
    this.winddown = options.winddown || 0;
    this.ammo = options.ammo || 'infinity';
    this.model = options.model || 'massdriver';
    
    this.flash = {
      duration: get(options, 'flash.duration')  || 200,
      size:     get(options, 'flash.size')      || .01,
      color:    get(options, 'flash.color')     || 0xFFFFFF,
      image:    false,
      position: {
        x: get(options, 'flash.position_x') || 0,
        y: get(options, 'flash.position_y') || 0,
        z: get(options, 'flash.position_z') || 0
      }
    };
    
    this.light = {
      duration:   get(options, 'light.duration')  || 0,
      radius:     get(options, 'light.radius')    || 25,
      color:      get(options, 'light.color')     || 0xFFFFFF,
      intensity:  get(options, 'light.intensity') || 1,
      position: {
        x: get(options, 'light.position_x') || 0,
        y: get(options, 'light.position_y') || 0,
        z: get(options, 'light.position_z') || 0
      }
    };
    
    this.bullet_count = (1 / this.delay) + 1;  // how many bullets can exist simultaneously on screen from this gun
    this.firing = this.parent.firing;
    this.makeWeapon();
    
    elation.events.add(this, 'renderframe_start', this);
  }
  
  this.makeBullets = function() {
    for (var i=this.bullet_count; i>0; i--) {
      var bullet = new elation.space.meshes.turret_bullet({ 
        radius: 1, 
        mass: 1, 
        position: new THREE.Vector3(0,0,0), 
        mesh: false,//this.bullet_mesh,
        material: this.bullet_material
      });
      
      bullet.scale.set(this.size, this.size, this.size);
      bullet.visible = false;
      bullet.add(this.makeSprite(0.02, this.color));
      
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
    
    this.flash.sprite.rotation = Math.PI * 2 * Math.random();
    bullet.children[0].rotation = Math.PI * 2 * Math.random();
    this.bullet = bullet;
    this.ammo--;
    
    //this.weapon.position.z = this.position[2] + this.recoil;
  }
  
  this.renderframe_start = function(event) {
    var lastfired = this.oldtime * 1000;
    var time = event.data.lastupdate;
    var delta = time - lastfired;
    var fp = 1 - (delta / this.flash.duration);
    var lp = 1 - (delta / this.light.duration);
    var li = lp * this.light.intensity;
    var light = this.light.entity;
    var flash = this.flash.sprite;
    var r = (delta / (this.delay * 1000));
    
    this.ready = r > 1 ? 1 : r < 0 ? 0 : r;
    this.ready_display = this.enabled == 0 ? 0 : this.ready;
    
    this.weapon.position.z = this.position[2] + ((1 - this.ready) * this.recoil);
    
    if (this.rotation && this.ready != 1) {
      this.weapon.rotation.z -= this.rotation;
      if (this.winddown)
        this.spinning = time;
    } else if (this.rotation && this.winddown > 0) {
      var p = 1 - ((time - this.spinning) / this.winddown),
          r = p > 1 ? 0 : p < 0 ? 0 : this.rotation * p;
      
      this.weapon.rotation.z -= r;
    }
    
    if (fp < 0) {
      flash.opacity = 0;
    } else if (fp > 1) {
      flash.opacity = 1;
    } else { 
      flash.opacity = fp;
    }
    
    if (lp < 0) {
      if (light && light.intensity != 0) 
        light.intensity = 0;
    } else if (lp > 1) {
      if (light && light.intensity != li)
        light.intensity = li;
    } else { 
      if (light) 
        light.intensity = li;
    }
    
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
    var geometry = new THREE.SphereGeometry(width, cols || 4, rows || 2);
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

    elation.space.geometry.get('/~lazarus/elation/media/space/models/'+this.model+'.js', this);
    elation.space.geometry.get('/~lazarus/elation/media/space/models/massdriver_bullet.js', this, 'loadMesh2');
    
    if (this.flash.duration > 0) {
      this.flash.sprite = flash = this.makeSprite(this.flash.size, this.flash.color, this.flash.image);
      flash.position.x = this.position[0] - this.flash.position.x;
      flash.position.y = this.position[1] - this.flash.position.y;
      flash.position.z = this.position[2] - this.flash.position.z;
      this.parent.add(flash);
    }
    
    if (this.light.duration > 0) {
      this.light.entity = light = new THREE.SpotLight(this.light.color, 0, this.light.radius);
      light.position.x = this.position[0] - this.light.position.x;
      light.position.y = this.position[1] - this.light.position.y;
      light.position.z = this.position[2] - this.light.position.z;
      this.parent.add(light);
    }
  }

  this.loadMesh = function(geometry) {
    var material = elation.space.materials.getMaterial('dg_lambert_wp', new THREE.MeshPhongMaterial({
      shininess: 5.0,
      specular: 0x222222,
      emmisive: 0xffffff,
      color: 0x111111, 
      shading: THREE.FlatShading
    }));
    
    geometry.computeVertexNormals();
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
    var ship = this.parent;
    
    if (!this.oldtime)
      this.oldtime = time - this.delay;
    
    if (/*ship.capacitor.heat <= 1 && */this.enabled && this.ammo != 0 && time - this.oldtime > this.delay) {
      if (ship.capacitor.energy - this.energy < 0)
        return false;
      
      ship.capacitor.energy -= this.energy;
      
      this.fire();
      
      ship.capacitor.heat += (this.energy>>3) * .01;
      
      this.oldtime = time;
      
      return true;
    }
    
    if (this.ammo == 0)
      this.enabled = 0;
    
    return false;
  }
  
  this.handleEvent = function(ev) {
    if (typeof this[ev.type] == 'function') {
      this[ev.type](ev);
    }
  }
  
  this.makeSprite = function(size, color, img) {
    var img = img || 'lensflare0';
    if (!this.spriteTexture)
      this.spriteTexture = THREE.ImageUtils.loadTexture("/~lazarus/elation/images/space/"+img+".png");
    
    var sprite = new THREE.Sprite({ 
      map: this.spriteTexture, 
      useScreenCoordinates: false, 
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0,
      size: size,
      color: color 
    });
    
    sprite.renderDepth = -1.1;
    sprite.depthWrite = -1.1;
    sprite.scale.set( size * this.size, size * this.size );
    sprite.position.set( 0, 0, 0 );
    
    return sprite;
    
    // create the particles
    //var geometry = new THREE.Geometry();
    
    /* 
    this.attributes = {
      size: {	type: 'f', value: [] },
      customColor: { type: 'c', value: [] }
    };

    uniforms = {
      amplitude: { type: "f", value: 1 },
      color:     { type: "c", value: new THREE.Color( 0xFFFFFF ) }//,
      texture:   { type: "t", value: THREE.ImageUtils.loadTexture( "/~lazarus/elation/images/space/particle.png" ) },
    };
    

    var materialargs = {
          color: this.color,
          size: pSize,
          map: THREE.ImageUtils.loadTexture(
            "/~lazarus/elation/images/space/lensflare0.png"
          ),
      blending: THREE.AdditiveBlending,
          depthTest: true,
          depthWrite: false,
          transparent: true
    };
    
    var material = new THREE.ParticleBasicMaterial(materialargs);
    
    for (var p = 0; p < pCount; p++) {
      var ppos = new THREE.Vector3(0,0,0);
      
      particle = new THREE.Vertex(ppos);
      geometry.vertices.push(particle);
    }

    var projectileSystem = new THREE.ParticleSystem(geometry, material);
    projectileSystem.sortParticles = true;
 
 
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
    }*/
    
    //projectileSystem.position.set(0,0,0);
    
    //console.log('Make Particles:', this.radarSystem, material);
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
    
    var original_quat = this.mesh.quaternion;
    var temp_quat = new THREE.Quaternion();
    var new_quat = temp_quat.setFromAxisAngle(new THREE.Vector3(0, 0, 1), ((360 * Math.random()) * (Math.PI / 180)));
    original_quat.multiplySelf(new_quat);
    
    this.visible = true;
    (function(self) {
      setTimeout(function() { self.cleanup(); }, 1000);
    })(this);
  }
  
  this.createGeometry = function() {
    //console.log('new bullet', this);
    
    //this.bmesh = mesh = new THREE.Mesh(this.args.mesh, this.args.material);
    //this.add(mesh);
    if (this.args.mesh)
      this.mesh = mesh = this.createMesh(this.args.mesh, this.args.material);
    else 
      this.mesh = mesh = new THREE.Object3D();//this.createMesh(this.args.mesh, this.args.material);
    
    mesh.useQuaternion = true;
  }
  this.dynamicsupdate = function(ev) {
    //var inertia_vector = this.args.vector.normalize().multiplyScalar(this.args.magnitude);
    //this.bmesh.position.multiply(inertia_vector);
    
    //if (this.args.camera.position.distanceTo(this.position) > 2000) {
    //  this.cleanup();
      //this.cleanup2();
    //}
    /*
    var original_quat = this.mesh.quaternion;
    var temp_quat = new THREE.Quaternion();
    var new_quat = temp_quat.setFromAxisAngle(new THREE.Vector3(0, 0, 1), ((10 * Math.random()) * (Math.PI / 180)));
    original_quat.multiplySelf(new_quat);
    */
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
    this.visible = false;

    //this.scene.remove(this);
  }
  
  this.init();
});
elation.space.meshes.turret_bullet.prototype = new elation.space.thing;
elation.space.meshes.turret_bullet.constructor = elation.space.meshes.turret_bullet;