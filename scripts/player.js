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
        loader.load(mesh, function(geometry) { 
          geometry.computeVertexNormals();
          self.loadMesh(geometry); 
        });
      })(this, this.properties.render.mesh);
    }
    
    this.setWeapons();
  }
  
  this.setWeapons = function() {
    var w = elation.space.player.weapon;
    
    this.weapons = [
      new w({parent:this,position:[-2,-3,-6],speed:2200,delay:.6,color:0x00FF44}),
      new w({parent:this,position:[2,-3,-6],speed:2200,delay:.6,color:0x00FF44}),
      new w({parent:this,position:[-6,-1,-8],speed:2200,delay:.6,color:0x00FF44}),
      new w({parent:this,position:[6,-1,-8],speed:2200,delay:.6,color:0x00FF44})
    ];
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
    //displays[3] = this.display('target', elation.ui.hud.target.container);
    //displays[3] = this.display('radar', elation.ui.hud.radar.container);
    //displays[2] = this.display('ops', elation.ui.hud.ops.container);
    
    for (var key in displays) {
      geometry.materials[key] = displays[key].material;
    }
    
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -2;
    mesh.position.y = -1.8;
    //mesh.castShadow = true;
    //mesh.receiveShadow = true;
    //mesh.renderDepth = -1.1;
    //mesh.depthTest = -1.1;
    
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
    
    if (this.firing) {
      //console.log('fired');
      
      for (var i=0; i<this.weapons.length; i++) {
        this.weapons[i].trigger();
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
      'mouse_button_1': 'move_booster',
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

elation.space.meshes.player.prototype = new elation.space.thing();
elation.space.meshes.player.prototype.supr = elation.space.thing.prototype
elation.space.meshes.player.prototype.constructor = elation.space.meshes.player;
