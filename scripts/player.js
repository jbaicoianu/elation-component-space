elation.extend("space.meshes.player", function(args) {
  elation.space.thing.call( this, args, this );
  this.strength = 60000;
  this.mass = 2.25;
  this.drag = 0.325;//0.378;
  this.burner = 4.0;
  this.booster = 10;
  this.throttle = 0;
  this.throttle_mode = 'Momentary';
  this.throttle_old = 0;
  this.throttle_sensitivity = .01;
  this.throttle_up = false;
  this.throttle_down = false;
  this.braking = false;
  this.brakes = .8;
  this.fuel = 1;
  this.fuel_consumption = .00003;
  this.fuel_booster_multiplier = 10;
  this.moveState = { up: 0, down: 0, left: 0, right: 0, forward: 0, backward: 0, pitchUp: 0, pitchDown: 0, yawLeft: 0, yawRight: 0, rollLeft: 0, rollRight: 0 };
  this.moveVector = new THREE.Vector3(0,0,0);
  this.rotationVector = new THREE.Vector3(0,0,0);
  this.tmpQuaternion = new THREE.Quaternion();
  this.args = args;
  this.displays = {};
  this.weapons = [];
  this.expose = [ 'id', 'position', 'rotation' ];
  this.hardpoints = [ [-6,-1,-8], [-3.5,-3,-6], [3.5,-3,-6], [6,-1,-8] ];
  
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
    
    this.dynamics.addForce("gravity", [0,0,-105.1]);
    
    this.headlight = new THREE.SpotLight('0xFFFFFF', 0.3,1300000)
    this.add(this.headlight);
    
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
    
    this.ship_status = new elation.ui.widgets.ship_status(this, { center: [ 0, .8, -4.7 ], scale: 0.03 });
    //this.target_status = new elation.ui.widgets.target_status(this);
  }
  
  this.setWeapons = function() {
    this.capacitor = new elation.space.equipment.capacitor('standard', this);
    
    this.weapons = [
      new elation.space.equipment.gun('Cannon', this, this.hardpoints[0]),
      new elation.space.equipment.gun('Gatling', this, this.hardpoints[1]),
      new elation.space.equipment.gun('Gatling', this, this.hardpoints[2]),
      new elation.space.equipment.gun('Cannon', this, this.hardpoints[3]),
    ];
    
    this.weapconf = [];
    
    for (var i=0; i<this.weapons.length; i++)
      this.weapconf.push(this.weapons[i]);
  }
  
  this.display = function(name, canvas, transparency) {
    var display = {
      name: name,
      canvas: canvas,
      ctx: canvas.getContext('2d'),
      texture: new THREE.Texture(canvas)
    };
    
    var material = { map: display.texture };
    
    if (transparency) {
      material.transparent = true;
      material.blending = THREE.AdditiveBlending,
      material.opacity = 1;
    }
    
    display.material = new THREE.MeshBasicMaterial(material);
    
    this.displays[name] = display;
    
    return display;
  }
  
  this.loadMesh = function(geometry) {
    var material = new THREE.MeshFaceMaterial({color: 0x222222, shading: THREE.FlatShading});
    var displays = {};
    /*
    var vertShader = document.getElementById('imagemixer_vertex').innerHTML;
    var fragShader = document.getElementById('imagemixer_fragment').innerHTML;
    var target_display = this.display('target_overlay', elation.ui.hud.target_overlay.container);

    var attributes = {}; // custom attributes

    var uniforms = {    // custom uniforms (your textures)
      tOne: { type: "t", value: this.controller.altrenderer },
      tSec: { type: "t", value: target_display.texture }
    };
    */
    displays[2] = { material: new THREE.MeshPhongMaterial({
      shininess: 5.0,
      specular: 0x222222,
      emmisive: 0xffffff,
      color: 0x111111, 
      blending: THREE.AdditiveBlending,
      shading: THREE.FlatShading
    })};
    displays[0] = { material: new THREE.MeshPhongMaterial({
      shininess: 4.0,
      specular: 0x002200,
      emmisive: 0xffffff,
      color: 0x000000, 
      blending: THREE.AdditiveBlending,
      shading: THREE.FlatShading
    })};
    displays[3] = { material: new THREE.MeshPhongMaterial({
      shininess: 25.0,
      specular: 0xffffff,
      transparent: true, 
      depthWrite: false,
      opacity: .13, 
      color: 0x000000, 
      blending: THREE.AdditiveBlending,
      shading: THREE.SmoothShading
    })};
    displays[5] = { material: new THREE.MeshPhongMaterial({
      shininess: 15.0,
      specular: 0x005500,
      transparent: true, 
      depthWrite: false,
      opacity: .14, 
      color: 0x003300, 
      blending: THREE.AdditiveBlending,
      shading: THREE.SmoothShading
    })};
    displays[4] = this.display('ops', elation.ui.hud.ops.container);
    displays[6] = { material: new THREE.MeshBasicMaterial({
      map: this.controller.altrenderer 
    })};
    displays[7] = this.display('target_overlay', elation.ui.hud.target_overlay.container, true);
    displays[1] = { material: new THREE.MeshPhongMaterial({
      shininess: 5.0,
      specular: 0x222222,
      emmisive: 0xffffff,
      color: 0x111111, 
      blending: THREE.AdditiveBlending,
      shading: THREE.SmoothShading
    })};

    
    for (var key in displays) {
      geometry.materials[key] = displays[key].material;
    }
    
    //console.log(geometry);
    
    this.mesh = mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -2;
    mesh.position.y = -1.8;
    //mesh.castShadow = true;
    //mesh.receiveShadow = true;
    mesh.renderDepth = 1;
    //mesh.depthTest = -1.1;
    
    if (this.properties && this.properties.physical && this.properties.physical.scale) 
      mesh.scale.set(this.properties.physical.scale[0], this.properties.physical.scale[1], this.properties.physical.scale[2]);
    
    this.geometry = geometry;
    this.add(mesh);
    //this.updateCollisionSize();
  }
  
  this.renderframe_start = function(ev) {
    for (var key in this.displays) {
      this.displays[key].material.map.needsUpdate = true;
    }
    
    // All this shit should really be framerate independant and based on time
    if (this.throttle_mode == 'Analog') {
      if (this.throttle_up)
        this.throttle += this.throttle_sensitivity;
      if (this.throttle_down)
        this.throttle -= this.throttle_sensitivity;
      
      if (this.throttle > 1)
        this.throttle = 1;
      if (this.throttle < 0)
        this.throttle = 0;
    } else {
      if (this.throttle_up || this.throttle_down)
        this.throttle = 1;
      else
        this.throttle = 0;
    }
    
    if (this.burner_on && this.fuel > 0)
      this.fuel -= this.fuel_consumption;
    
    if (this.booster_on && this.fuel > 0)
      this.fuel -= (this.fuel_consumption * this.fuel_booster_multiplier);
    
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
      var guns = [];
      var fired = false;
      
      for (var i=0; i<this.weapons.length; i++) {
        var gun = this.weapons[i];
        
        if (gun.trigger()) {
          var fired = true;
          guns.push(gun);
        } else {
          guns.splice(0,0,gun);
        }
      }
      
      if (fired)
        this.weapons = guns;
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
      
    if (this.throttle_mode == 'Analog') {
      forward = -forward * this.throttle;
    } else {
      forward = (-forward + this.moveState.backward);
    }
    
    this.moveVector.x = ( -this.moveState.left    + this.moveState.right );
    this.moveVector.y = ( -this.moveState.down    + this.moveState.up );
    //this.moveVector.z = ( -this.moveState.forward    + this.moveState.backward );
    this.moveVector.z = ( forward + this.moveState.backward );
    
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
    
    if (elation.utils.arrayget(elation, 'ui.hud.target')) {
      if (mwdelta < 0)
        elation.ui.hud.target.list.prevTarget();
      else
        elation.ui.hud.target.list.nextTarget();
    }
  }
  
  this.next_target = function(event) {
    if (event > 0)
      elation.ui.hud.target.list.nextTarget();
  }
  
  this.prev_target = function(event) {
    if (event > 0)
      elation.ui.hud.target.list.prevTarget();
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
    
    var old = this.throttle_mode;
    
    this.throttle_mode = this.throttle_mode == 'Analog' ? 'Momentary' : 'Analog';
    
    elation.ui.hud.console.log('-!- Switched throttle mode from ' + old + ' to ' + this.throttle_mode);
  }
  
  this.change_fire_mode = function(event) {
    if (event == 0)
      return;
    
    this.capacitor.toggleMode();
  }
  
  this.change_gun = function(event, num) {
    if (event == 0)
      return;
    
    this.capacitor.setWeapon(num);
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
      'prev_target': function(ev) { this.prev_target(ev.value); },
      'change_gun_1': function(ev) { this.change_gun(ev.value, 0); },
      'change_gun_2': function(ev) { this.change_gun(ev.value, 1); },
      'change_gun_3': function(ev) { this.change_gun(ev.value, 2); },
      'change_gun_4': function(ev) { this.change_gun(ev.value, 3); },
      'fire_mode': function(ev) { this.change_fire_mode(ev.value); }
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
      'keyboard_1': 'change_gun_1',
      'keyboard_2': 'change_gun_2',
      'keyboard_3': 'change_gun_3',
      'keyboard_4': 'change_gun_4',
      'keyboard_x': 'move_booster',
      'keyboard_g': 'fire_mode'
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

elation.extend('ui.widgets.ship_status', function(parent, args) {
  this.parent = parent;
  this.args = args;
  this.hud = parent.hud;
  this.center = args.center;
  this.scale = args.scale || .03;
  
  this.init = function() {
    elation.space.geometry.get('/~lazarus/elation/media/space/models/tau.js', this);
    elation.events.add(null,'renderframe_end',this);
  }

  this.loadMesh = function(geometry) {
    var material = elation.space.materials.getMaterial('shipstatus_wireframe', new THREE.MeshBasicMaterial({
      color: 0x5b7c8b,
      transparent: true, 
      depthTest: true,
      depthWrite: false,
      wireframe: true,
      opacity: .05,
      shading: THREE.SmoothShading
    }));
    
    this.mesh = mesh = new THREE.Mesh(geometry, material);
    
    this.geometry = geometry;
    
    this.mesh.position.set(this.center[0],this.center[1],this.center[2]);
    //this.mesh.useQuaternion = true;
    //this.mesh.quaternion.copy(this.parent.camera.quaternion);
    this.mesh.rotation.set(Math.PI/2,0,0);
    this.mesh.scale.set(this.scale,this.scale,this.scale);
    this.mesh.renderDepth = -1.1;
    this.mesh.depthTest = -1.1;
    this.parent.add(mesh);
  }
  
  this.renderframe_end = function(event) {
    var target = elation.ui.hud.target.list.current_target_data,
        parent = this.parent,
        camera = parent.controller.targetcam
    
    if (target) {
      var a = new THREE.Vector3().copy(parent.position),
          b = new THREE.Vector3().copy(target.position),
          d = a.distanceTo(b);
          q = new THREE.Vector3().sub(a, b),
          r = target.mesh.boundRadius * target.mesh.boundRadiusScale,
          br = parent.mesh.boundRadius * parent.mesh.boundRadiusScale * 3.333,
          s = r * 3.333;
          
      var s = s > d ? d : s;
      
      //console.log(parent);
      camera.far = s + r;
      camera.near = s - r < br ? br : s - r;
      camera.updateProjectionMatrix();
      camera.position.set(b.x, b.y, b.z).subSelf(q.normalize().multiplyScalar(-s));
      camera.lookAt(target.position);
    }
    
    return;
    
    if (this.mesh) {
      var q = new THREE.Quaternion();
      var vel = this.parent.dynamics.vel;
      var v = new THREE.Vector3(vel.x, vel.y, vel.z);
      
      q.copy(this.parent.camera.quaternion);
      q.multiplyVector3(v);
      this.mesh.quaternion = q;
      
      //this.mesh.quaternion.copy(this.parent.camera.quaternion); return;
      var target = elation.ui.hud.target.list.current_target_data;
      if (target) {
        var inverse = new THREE.Matrix4().getInverse(this.parent.matrixWorld)
        //var mypos = this.parent.position;
        //var tpos = target.position;
        //var tpos = new THREE.Vector3(tpos.x,tpos.y,tpos.z);
        //var relpos = inverse.multiplyVector3().subSelf(this.mesh.matrixWorld.getPosition());
        var dvel = this.parent.dynamics.vel;
        //var relpos = new THREE.Vector3(dvel.x, dvel.y, dvel.z);
        this.mesh.quaternion.multiplySelf(dvel);
        //console.log(tpos.subSelf(mypos).normalize());
        //console.log(mypos,' :: ',targetpos);
        //this.mesh.quaternion.setFromAxisAngle(tpos.subSelf(mypos).normalize(), Math.PI / 2)
        //this.mesh.lookAt(target.position);
      }
      //this.rotation.setRotationFromMatrix( this.matrix );
    }
  }
  
  this.handleEvent = function(event) {
    this[event.type](event);
  }
  
  this.init();
});

elation.space.meshes.player.prototype = new elation.space.thing();
elation.space.meshes.player.prototype.supr = elation.space.thing.prototype
elation.space.meshes.player.prototype.constructor = elation.space.meshes.player;
