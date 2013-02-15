elation.extend("space.meshes.player", function(args) {
  elation.space.thing.call( this, args, this );
  this.strength = 36800;
  this.mass = 4;
  this.drag = .378;
  this.burner = 2.0;
  this.booster = 10;
  this.throttle = 0;
  this.throttle_mode = 'analog';
  this.throttle_old = 0;
  this.throttle_sensitivity = .01;
  this.throttle_up = false;
  this.throttle_down = false;
  this.braking = false;
  this.brakes = .4;
  this.fuel = 1;
  this.fuel_consumption = .00003;
  this.fuel_booster_multiplier = 10;
  this.moveState = { up: 0, down: 0, left: 0, right: 0, forward: 0, back: 0, pitchUp: 0, pitchDown: 0, yawLeft: 0, yawRight: 0, rollLeft: 0, rollRight: 0 };
  this.moveVector = new THREE.Vector3(0,0,0);
  this.rotationVector = new THREE.Vector3(0,0,0);
  this.tmpQuaternion = new THREE.Quaternion();
  this.args = args;
  this.displays = {};
  this.expose = [ 'id', 'position', 'rotation' ];

  this.postinit = function() {
    this.useQuaternion = true;

    this.controller = elation.space.starbinger(0);
    this.camera = this.controller.camera;
    
    var pos = this.get(args, 'properties.physical.position');
    var rot = this.get(args, 'properties.physical.quaternion');
    
    this.camera.useQuaternion = true;
    this.position.set(pos[0], pos[1], pos[2]);
    this.quaternion.set(rot[0], rot[1], rot[2], rot[3]);
    
    this.camera.quaternion = this.quaternion;
    this.camera.position = this.position;
    
    this.setControls();
    this.pointerlock = new elation.pointerlock(this.controls);
    
    elation.events.add(this, 'renderframe_start', this);
    
    this.dynamics.mass = this.mass;
    this.dynamics.drag = this.drag;
    
    this.dynamics.addForce("gravity", [0,-.00001,0]);
    
    var lfn = function(x,y,z) {
      var light = new THREE.SpotLight('0xFFFFFF', 0.4, 1300000);
      //console.log('!!! LIGHTS', x,y,z);
      light.position.set(x,y,z);
      light.useQuaternion = true;
      light.castShadow = true;
      /*
      var sphereGeometry = new THREE.SphereGeometry( 10000, 16, 80 );
      var darkMaterial = new THREE.MeshBasicMaterial( { color: 0x000000 } );
      var wireframeMaterial = new THREE.MeshBasicMaterial( { color: 0xffff00, wireframe: true, transparent: true } ); 
      var shape = THREE.SceneUtils.createMultiMaterialObject( sphereGeometry, [ darkMaterial, wireframeMaterial ] );
      */
      //shape.position = light.position;
        
      return {light:light};
    }
    
    this.headlight = lfn(this.camera.position.x,this.camera.position.y,this.camera.position.z)
    //this.add(this.headlight.shape);
    this.add(this.headlight.light);
    
    if (this.properties.render && this.properties.render.mesh) {
      (function(self, mesh) {
        var loader = new THREE.JSONLoader();
        loader.load( { model: mesh, callback: function(geometry) { 
          geometry.computeVertexNormals();
          self.loadMesh(geometry); 
        } });
      })(this, this.properties.render.mesh);
    }
  }
  
  this.display = function(name, canvas) {
    var display = {
      name: name,
      canvas: canvas,
      ctx: canvas.getContext('2d'),
      texture: new THREE.Texture(canvas)
    };
    
    display.material = new THREE.MeshBasicMaterial({ map: display.texture });
    this.displays[name] = display;
    
    return display;
  }
  
  this.loadMesh = function(geometry) {
    geometry.double_sided = true;
    var material = new THREE.MeshFaceMaterial({color: 0x222222, shading: THREE.FlatShading});
    var displays = {};

    displays[0] = { material: new THREE.MeshPhongMaterial({shininess: 1, color: 0x323238, shading: THREE.FlatShading}) };
    displays[1] = { material: new THREE.MeshPhongMaterial({
      shininess: 25.0,
      specular: 0xffffff,
      transparent: true, 
      doubleSided: true,
      depthTest: true,
      depthWrite: false,
      opacity: 0, 
      color: 0x000000, 
      shading: THREE.SmoothShading}) 
    };
    displays[3] = this.display('target', elation.ui.hud.target.container);
    //displays[3] = this.display('radar', elation.ui.hud.radar.container);
    displays[2] = this.display('ops', elation.ui.hud.ops.container);
    
    for (var key in displays) {
      geometry.materials[key] = displays[key].material;
    }
    
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -2;
    mesh.position.y = -1.8;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    //mesh.doubleSided = true;
    mesh.renderDepth = -1.1;
    mesh.depthTest = -1.1;
    
    if (this.properties && this.properties.physical && this.properties.physical.scale) 
      mesh.scale.set(this.properties.physical.scale[0], this.properties.physical.scale[1], this.properties.physical.scale[2]);
    
    this.geometry = geometry;
    this.add(mesh);
    this.updateCollisionSize();
  }
  
  this.renderframe_start = function(ev) {
    for (var key in this.displays) {
      this.displays[key].material.map.needsUpdate = true;
    }
    
    
    // All this shit should really be framerate independant and based on time
    if (this.throttle_mode == 'analog') {
      if (this.throttle_up)
        this.throttle += this.throttle_sensitivity;
      if (this.throttle_down)
        this.throttle -= this.throttle_sensitivity;
      
      if (this.throttle > 1)
        this.throttle = 1;
      if (this.throttle < 0)
        this.throttle = 0;
      
      if (this.burner_on && this.fuel > 0)
        this.fuel -= this.fuel_consumption;
      
      if (this.booster_on && this.fuel > 0)
        this.fuel -= (this.fuel_consumption * this.fuel_booster_multiplier);
    } else {
      if (this.throttle_up || this.throttle_down)
        this.throttle = 1;
      else
        this.throttle = 0;
    }
    
    if (this.braking) {
      this.throttle = 0;
      if (this.fuel > 0) {
        var v = { 
              x: this.dynamics.vel.x,
              y: this.dynamics.vel.y,
              z: this.dynamics.vel.z
            },
            t = 0.1;
        
        if (v.x > t)
          v.x -= this.brakes;
        else if (v.x < -t)
          v.x += this.brakes;
          
        if (v.y > t)
          v.y -= this.brakes;
        else if (v.y < -t)
          v.y += this.brakes;
          
        if (v.z > t)
          v.z -= this.brakes;
        else if (v.z < -t)
          v.z += this.brakes;
        
        this.dynamics.setVelocity([v.x, v.y, v.z]);
        
        this.fuel -= (this.fuel_consumption);
      }
    }
  }
  
  this.dynamicsupdate = function(ev) {
    //this.headlight.position = this.camera.position;
    //this.headlight.quaternion = this.quaternion;
    
    this.updateMovementVector();
    this.updateRotationVector();
    this.rotateRel(this.rotationVector.clone().multiplyScalar(ev.data)); 
  }
  
  this.updateMovementVector = function() {
    if (this.throttle_mode == 'analog') {
      if (this.throttle > 0)
        this.moveState.forward = 1;
      else
        this.moveState.forward = 0;
      
      var forward = this.moveState.forward;
      
      if (this.fuel > 0) {
        if (this.booster_on)
          forward *= this.booster;
        else if (this.burner_on)
          forward *= this.burner;
      }
      
      forward = -forward * this.throttle;
    } else {
      var forward = (-this.moveState.forward + this.moveState.backward);
    }
    
    this.moveVector.x = ( -this.moveState.left    + this.moveState.right );
    this.moveVector.y = ( -this.moveState.down    + this.moveState.up );
    //this.moveVector.z = ( -this.moveState.forward    + this.moveState.backward );
    this.moveVector.z = ( forward );
    
    if (this.moveVector.length() > 0) {
      this.dynamics.addForce("thrusters", this.matrix.multiplyVector3(this.moveVector.multiplyScalar(this.strength)).subSelf(this.position));
    } else {
      this.dynamics.removeForce("thrusters");
    }
    
    this.throttle_old = this.throttle;
  }
  
  this.updateRotationVector = function() {
    this.rotationVector.x = ( -this.moveState.pitchDown + this.moveState.pitchUp );
    this.rotationVector.y = ( -this.moveState.yawRight  + this.moveState.yawLeft );
    this.rotationVector.z = ( -this.moveState.rollRight + this.moveState.rollLeft );
    
    this.dynamics.setAngularVelocity([this.rotationVector.x, this.rotationVector.y, this.rotationVector.z]);
  }
  
  this.rotateRel = function(rot) {
    var rel = rot;
    var rotMult = .5;
		this.tmpQuaternion.set( rot.x * rotMult, rot.y * rotMult, rot.z * rotMult, 1 ).normalize();
		this.quaternion.multiplySelf( this.tmpQuaternion );
		this.matrix.setRotationFromQuaternion( this.quaternion );
		this.matrixWorldNeedsUpdate = true;
  }
  
  this.mwheel = function(ev) {
		var	event = ev ? ev : window.event;
				mwdelta = event.value[0];
		
		if (window.opera) mwdelta = -mwdelta;
    
		this.mwdelta = mwdelta;
    
    if (elation.utils.arrayget(elation, 'ui.hud.radar')) {
      if (mwdelta < 0)
        elation.ui.hud.radar.prevTarget();
      else
        elation.ui.hud.radar.nextTarget();
    }
  }
  
  this.next_target = function(event) {
    if (event > 0)
      elation.ui.hud.radar.nextTarget();
  }
  
  this.prev_target = function(event) {
    if (event > 0)
      elation.ui.hud.radar.prevTarget();
  }
  
  this.forward = function(event) {
    this.moveState.forward = event;
    this.throttle_up = (event > 0 ? true : false);
  }
  
  this.reverse = function(event) {
    this.moveState.backward = event;
    this.throttle_down = (event > 0 ? true : false);
  }
  
  this.fire_primary = function(event) {
    this.firing = (event > 0 ? true : false);
  }
  
  this.change_throttle_mode = function(event) {
    if (event == 0)
      return;
    
    console.log(this);
    var old = this.throttle_mode;
    
    this.throttle_mode = this.throttle_mode == 'analog' ? 'momentary' : 'analog';
    
    elation.ui.hud.console.log('-!- Switched throttle mode from ' + old + ' to ' + this.throttle_mode + '.');
  }
  
  this.braking_thrusters = function(event) {
    this.braking = event > 0 ? true : false;
  }
  
  this.jump = function(event) {
    console.log('### JUMP!', event);
    
    if (event) {
      this.controller.clearScene();
      elation.ui.hud.radar.contacts = [];
      return;
    }
    
    elation.ajax.Get('/~lazarus/elation/index.php/space/starbinger.jsi', null, {
      callback: function(stuff) { 
        var stuff = elation.JSON.parse(stuff); 
        var controller = elation.space.starbinger(0);
        
        controller.args = stuff.data;
        controller.addObjects(stuff.data.sector, controller.scene); 
      }}
    );
  }
  
  this.setControls = function() { // for the heart of the sun
    this.controls = elation.space.controls(0);
    
    this.controls.addContext("spaceship", {
      'move_up': function(ev) { this.moveState.up = ev.value; },
      'move_down': function(ev) { this.moveState.down = ev.value; },
      'move_left': function(ev) { this.moveState.left = ev.value; },
      'move_right': function(ev) { this.moveState.right = ev.value; },
      'move_burner': function(ev) { this.burner_on = ev.value; },
      'move_booster': function(ev) { this.booster_on = ev.value; },
      'move_forward': function(ev) { this.moveState.forward = ev.value; },
      'move_backward': function(ev) { this.moveState.back = ev.value; },
      'roll_left': function(ev) { this.moveState.rollLeft = ev.value; },
      'roll_right': function(ev) { this.moveState.rollRight = ev.value; },
      'look_up': function(ev) { this.moveState.pitchUp = ev.value; },
      'look_down': function(ev) { this.moveState.pitchDown = ev.value; },
      'look_left': function(ev) { this.moveState.yawLeft = ev.value; },
      'look_right': function(ev) { this.moveState.yawRight = ev.value; },
      'forward': function(ev) { this.forward(ev.value); },
      'reverse': function(ev) { this.reverse(ev.value); },
      'fire_primary': function(ev) { this.fire_primary(ev.value); },
      'throttle_mode': function(ev) { this.change_throttle_mode(ev.value); },
      'braking_thrusters': function(ev) { this.braking_thrusters(ev.value); },
      'wheel_target': function(ev) { this.mwheel(ev); },
      'next_target': function(ev) { this.next_target(ev.value); },
      'prev_target': function(ev) { this.prev_target(ev.value); }
      //'jump': function(ev) { this.jump(ev.value); }
    });
    
    this.controls.addBindings("spaceship", {
      'mousewheel': 'wheel_target',
      'keyboard_t': 'next_target',
      'keyboard_y': 'prev_target',
      'mouse_drag_x': 'look_right',
      'mouse_drag_y': 'look_down',
      'keyboard_w': 'forward',
      'keyboard_a': 'move_left',
      'keyboard_s': 'reverse',
      'keyboard_d': 'move_right',
      'keyboard_q': 'roll_left',
      'keyboard_e': 'roll_right',
      'keyboard_r': 'move_up',
      'keyboard_f': 'move_down',
      'mouse_button_0': 'fire_primary',
      'mouse_button_2': 'move_burner',
      'keyboard_c': 'throttle_mode',
      'keyboard_shift': 'braking_thrusters',
      'keyboard_x': 'move_booster'
      //'keyboard_j': 'jump'
    });
    
    this.controls.activateContext('spaceship', this);
  }
  
  this.handleEvent = function(ev) {
    if (typeof this[ev.type] == 'function') {
      this[ev.type](ev);
    }
  }
  
  this.init();
});

elation.extend('ui.widgets.radar3d', function(hud) {
  this.hud = hud;
  this.mode = 'ALL';
  this.range = 24000;
  this.width = .6;
  this.inner = .55;
  this.center = [ 0, -1.3, -4.7 ];
  this.controller = hud.controller;
  this.contacts = [];
  this.rcontacts = {};
  this.colors = this.hud.colors;
  this.types = {
    drone: 'blip',
    planet: 'blip',
    building: 'outline',
    road: 'outline'
  };
  
  this.makeSphere = function(width, coords, material, cols, rows) {
    var geometry = new THREE.SphereGeometry(width,cols || 4,rows || 2);
    
    var sphere = new THREE.Mesh(geometry, material);
    
    sphere.position.x = coords[0];
    sphere.position.y = coords[1];
    sphere.position.z = coords[2];
    
    //sphere.geometry.applyMatrix( new THREE.Matrix4().setTranslation( 0,+this.center[1],+this.center[2] ) );
    return sphere;
  }
  
  this.makeLine = function(l, color) {
    var material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: .3
    });
    
    var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(0,0,0)));
    geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(l[0], l[1], l[2])));
    
    return new THREE.Line(geometry, material, THREE.LinePieces)
  }
  
  this.init = function() { 
    this.camera = this.controller.camera;
    this.contacts = elation.ui.hud.radar.contacts;
    this.initialized = true;
    this.radar = radar = new THREE.Object3D();
    this.radar.useQuaternion = true;
    this.player.add(this.radar);
    
    this.radar.position.x = this.center[0];
    this.radar.position.y = this.center[1];
    this.radar.position.z = this.center[2];

    this.sphere = this.makeSphere(this.width, [0,0,0], new THREE.MeshLambertMaterial({
      color: 0x7b9cab,
      shininess: 25.0,
      ambient: 0xffffff,
      specular: 0xffffff,
      transparent: true, 
      depthTest: true,
      depthWrite: false,
      opacity: 0.2, 
      //wireframe: true,
      shading: THREE.SmoothShading
    }), 32, 16);
    //this.sphere.flipSided = true;
    //this.sphere.doubleSided = true;
    //this.radar.add(this.sphere);
    
    this.sphere_inner = this.makeSphere(this.width-.02, [0,0,0], new THREE.MeshBasicMaterial({
      color: 0x7b9cab,
      shininess: 25.0,
      ambient: 0xffffff,
      specular: 0xffffff,
      transparent: true, 
      depthTest: true,
      depthWrite: false,
      opacity: .1,
      wireframe: true,
      shading: THREE.SmoothShading
    }), 32, 16);
    this.sphere_inner.flipSided = true;
    this.sphere_inner.renderDepth = -1.1;
    this.sphere_inner.depthWrite = -1.1;
    this.radar.add(this.sphere_inner);
    
    var line = this.makeLine([0,0,-this.inner], 0x5b7c8b);
    line.position.set(this.center[0], this.center[1], this.center[2]);
    line.rotation.y = .8;
    this.player.add(line);
    var line = this.makeLine([0,0,-this.inner], 0x5b7c8b);
    line.position.set(this.center[0], this.center[1], this.center[2]);
    line.rotation.y = -.8;
    this.player.add(line);
    var line = this.makeLine([0,0,this.inner], 0x5b7c8b);
    line.position.set(this.center[0], this.center[1], this.center[2]);
    this.player.add(line);
    
    var material = new THREE.MeshBasicMaterial({
        color: 0x7b9cab,
        depthTest: true,
        depthWrite: false,
        transparent: true,
        opacity: .2
    });
    var cylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(this.inner+.03, this.inner+.03, .01, 32, 2, false), 
      material
    );
    cylinder.position.set(this.center[0], this.center[1], this.center[2]);
    this.player.add(cylinder);
    
    
    this.makeParticles();
    //var point = [ this.center[0], this.center[1], this.center[2] + .6 ];
    
    //this.sphere_testpoint = this.makeSphere(.01, point, this.blip_material);
    //this.radar.add(this.sphere_testpoint);

    //this.radar.geometry.applyMatrix( new THREE.Matrix4().setTranslation( 0,+this.center[1],+this.center[2] ) );
    //this.radar.quaternion.copy(this.camera.quaternion);
  }
  this.render = function(e) { 
    this.player = this.controller.objects.player.Player;
    if (!this.initialized && this.player) {
      this.init();
    } else {
      //this.radar.quaternion.copy(this.camera.quaternion);
      //this.rotateAroundWorldAxis(this.radar, new THREE.Vector3(1,0,0), 30 * Math.PI/180);
      //this.radar.quaternion.multiply(this.camera.quaternion,this.player.quaternion);
      
      var quat = this.camera.quaternion;
      this.radar.quaternion.set(quat.x, quat.y, quat.z, quat.w * -1);
      
    }
    //this.sphere.position = this.player.matrixWorld.multiplyVector3(new THREE.Vector3(0,-1.3,-4.7));
    this.draw();
  }
  
  // not used
  this.rotateAroundWorldAxis = function(object, axis, radians) {
    rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
    rotWorldMatrix.multiplySelf(object.matrix);        // pre-multiply
    object.matrix = rotWorldMatrix;
    object.rotation.getRotationFromMatrix(object.matrix, object.scale);
  }
  
  this.drawBlip = function(contact, cp, type, name, d) {
    var tp = contact.position ? contact.position : false;
    var object = elation.utils.arrayget(this.rcontacts, type + '.' + name);

    if (type == 'particle') {
      tp.x = tp.z + cp.x;
      tp.y = tp.z + cp.y;
      tp.z = tp.z + cp.z;
    }
    
    var distance = this.camera.position.distanceTo(contact.position);
    
    if (elation.utils.arrayget(contact,'args.properties.render.noradar'))
      return;
    
    
    if (Math.abs(distance) > this.range || !tp) {
      if (object && object.parent) {
        object.parent.remove(object);
      }
      
      return;
    }
    
    if (!this.rcontacts[type])
      this.rcontacts[type] = {};
    
    var s = this.inner,
        x = ((tp.x - cp.x) / this.range) * s,
        y = ((tp.y - cp.y) / this.range) * s,
        z = ((tp.z - cp.z) / this.range) * s,
        color,size;
    
    if (!object) {
      switch(type) {
        case 'player': color = 0x22ab22; size = .012; break;
        case 'asteroid': color = 0x444444; size = .007; break;
        case 'station': color = 0xaaaa22; break;
        case 'ship': color = 0xaa2222; break;
        default: color = 0xFF00FF;
      }
      
      //console.log(name, type, distance, [x,y,z], [tp.x,tp.y,tp.z], color);
      var material = new THREE.MeshBasicMaterial({ color: color, shading: THREE.SmoothShading });
      this.rcontacts[type][name] = object = this.makeBlip(size || .01, [x,y,z], material);
      
      if (false) {
      var line = this.makeLine(y, color)
        line.position.set(this.center[0] + x, this.center[1] + y, this.center[2] + z);
        line.useQuaternion = true;
        object.lineToPlane = line;
        this.player.add(line);
      }
      this.radar.add(object);
      //console.log(type, name, [x,y,z]);
    } else {
      object.position.set(x,y,z);
      if (false) {
        var p = [ this.player.position.x,this.player.position.y,this.player.position.z ];
        var wc = new THREE.Vector3(
          object.matrixWorld.n14,
          object.matrixWorld.n24,
          object.matrixWorld.n34
        );
        
        if (name == 'Outpost')
          console.log(wc);
       
        if (object.lineToPlane) {
          var pos = object.lineToPlane.position;
          object.lineToPlane.position.set(wc.x, wc.y, wc.z);
        }
      }
      if (!object.parent) {
        this.radar.add(object);
      }
    }
  }
  
  this.makeBlip = function(width, coords, material, cols, rows) {
    var material = new THREE.ParticleBasicMaterial({
                color: 0xFFFFFF,
          size: 5,
          map: THREE.ImageUtils.loadTexture(
            "/~lazarus/elation/images/space/particle_3.png"
          ),
          blending: THREE.AdditiveBlending
    });
    var dot = new THREE.Sprite(material);

    dot.position.x = coords[0];
    dot.position.y = coords[1];
    dot.position.z = coords[2];
    
    //sphere.geometry.applyMatrix( new THREE.Matrix4().setTranslation( 0,+this.center[1],+this.center[2] ) );
    return dot;
  }

  this.draw = function() {
    var objects = this.controller.objects,
        contact, type,
        cp = objects.player.Player.position; 
    
    for (var type in objects) {
      contacts = objects[type];
      
      for (var name in contacts) {
        contact = contacts[name];
        
        if (contact.length) {
          for (var i=0; i<contact.length; i++) {
            this.drawBlip(contact[i], cp, type, name, i==0?true:false);
          }
        } else {
          this.drawBlip(contact, cp, type, name, name=='Outpost'?true:false);
        }
      }
    }
  }
  
  this.makeParticles = function() {
    // create the particles
    this.pCount = 5000;
    this.pDiameter = 1.0;
    this.pRadius = this.pDiameter / 2;
    this.pSize = .08;
    this.geometry = new THREE.Geometry();
    
    var pMaterial = new THREE.ParticleBasicMaterial({
          color: 0x44FFFF,
          size: this.pSize,
          map: THREE.ImageUtils.loadTexture(
            "/~lazarus/elation/images/space/particle_1.png"
          ),
          blending: THREE.AdditiveBlending,
          transparent: true
        });
    
    for (var p = 0; p < this.pCount; p++) {
      var ppos = new THREE.Vector3(
            Math.random() * this.pDiameter - this.pRadius,
            Math.random() * this.pDiameter - this.pRadius,
            Math.random() * this.pDiameter - this.pRadius
          );
      
      var particle = new THREE.Vertex(ppos);
      this.geometry.vertices.push(particle);
    }

    this.dustSystem = new THREE.ParticleSystem(this.geometry, pMaterial);
    //this.dustSystem.position.copy(this.camera.position);
    this.dustSystem.sortParticles = true;
    
    // add it to the scene
    this.radar.add(this.dustSystem);
  }
  
  this.handleEvent = function(event) {
    this[event.type](event);
  }
});

elation.space.meshes.player.prototype = new elation.space.thing();
elation.space.meshes.player.prototype.supr = elation.space.thing.prototype
elation.space.meshes.player.prototype.constructor = elation.space.meshes.player;
