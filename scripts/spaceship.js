elation.extend("space.meshes.spaceship", function(args) {
  elation.space.thing.call( this, args, this );
  this.strength = 36800;
  this.mass = 4;
  this.drag = .378;
  this.burner = 1.33;
  this.booster = 3;
  this.moveState = { up: 0, down: 0, left: 0, right: 0, forward: 0, back: 0, pitchUp: 0, pitchDown: 0, yawLeft: 0, yawRight: 0, rollLeft: 0, rollRight: 0 };
  this.moveVector = new THREE.Vector3(0,0,0);
  this.rotationVector = new THREE.Vector3(0,0,0);
  this.tmpQuaternion = new THREE.Quaternion();
  this.args = args;
  this.expose = [
    'id',
    'position',
    'rotation'
  ];
  
  this.camerapositions = [
    [new THREE.Vector3(0,0,0), new THREE.Vector3()]
  ];

  this.postinit = function() {
    this.useQuaternion = false;

    if (this.position.y < this.collisionradius) this.position.y = this.collisionradius;
    this.controller = elation.space.starbinger(0);
    this.camera = this.controller.camera;
    
    var pos = this.get(args, 'properties.physical.position');
    this.camera.position.x = pos[0];
    this.camera.position.y = pos[1];
    this.camera.position.z = pos[2];
    
    //this.position = this.camera.position;
    this.camera.rotation = this.rotation;
    this.camera.position = this.position;
    
    //this.add(this.camera);
    this.setControls();
    
    this.select();
    //this.controls = new THREE.FirstPersonControls(this.camera);

    //this.controls.movementSpeed = 0;
    //this.controls.lookSpeed = 0.00005;
    //this.controls.noFly = false;
    //this.controls.lookVertical = false;
    elation.events.add(this, 'renderframe_start', this);
    this.dynamics.mass = this.mass;
    this.dynamics.drag = this.drag;
    
    //this.dynamics.addForce("gravity", [0,-.00001,0]);
    //console.log('### STAR GENERATED',color,this, args);
    var lfn = function(x,y,z) {
      var light = new THREE.SpotLight('0xFFFFFF', 2, 300000);
      light.position = {x:x,y:y,z:z};
      light.castShadow = true;
      return light;
    }
    
    this.headlight = lfn(this.position.x,this.position.y+1000,this.position.z)
    this.add(this.headlight);
    if (this.properties.render && this.properties.render.mesh) {
      this.materials = [new THREE.MeshFaceMaterial({color: 0xffffff, shading: THREE.FlatShading})];
      (function(self, mesh) {
        var loader = new THREE.JSONLoader();
        loader.load( { model: mesh, callback: function(geometry) { 
          geometry.computeVertexNormals();
          self.loadMesh(geometry); 
          console.log('@@@ LOADED MODEL', mesh, geometry); } });
      })(this, this.properties.render.mesh);
    }
  }
  this.loadMesh = function(geometry) {
    var material = new THREE.MeshPhongMaterial({color: 0x888888});
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -8;
    mesh.position.y = -18;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (this.properties && this.properties.physical && this.properties.physical.scale) 
      mesh.scale.set(this.properties.physical.scale[0], this.properties.physical.scale[1], this.properties.physical.scale[2]);
    console.log(this.properties.physical.scale);
    this.add(mesh);
    this.updateCollisionSize();
  }
  
  this.setControls = function() {
    elation.space.controls(0).addContext("spaceship", {
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
      'wheel_target': function(ev) { this.mwheel(ev); },
      'jump': function(ev) { this.jump(ev.value); }
    });
    
    elation.space.controls(0).addBindings("spaceship", {
      'mousewheel': 'wheel_target',
      'mouse_drag_x': 'look_right',
      'mouse_drag_y': 'look_down',
      'keyboard_w': 'move_forward',
      'keyboard_a': 'move_left',
      'keyboard_s': 'move_backward',
      'keyboard_d': 'move_right',
      'keyboard_q': 'roll_left',
      'keyboard_e': 'roll_right',
      'keyboard_r': 'move_up',
      'keyboard_f': 'move_down',
      'keyboard_shift': 'move_burner',
      'keyboard_ctrl': 'move_booster',
      'keyboard_j': 'jump'
    });
    
    elation.space.controls(0).activateContext('spaceship', this);
  }
  
  this.renderframe_start = function(ev) {
    this.headlight.position = this.position;
    this.headlight.rotation = this.rotation;
    //console.log('yay', [this.dynamics.vel.x, this.dynamics.vel.y, this.dynamics.vel.z]);
    this.updateMovementVector();
    this.updateRotationVector();
    this.rotateRel(this.rotationVector.clone().multiplyScalar(ev.data));
    if (this.position.y < this.collisionradius) {
      if (this.dynamics.vel.y <= 0) {
        this.position.y = this.collisionradius;
        this.dynamics.setVelocityY(this.dynamics.vel.y * -this.dynamics.restitution);
        //this.dynamics.removeForce('gravity');
        //this.dynamics.setVelocityY(0);
        this.dynamics.setFriction(250);
      } else {
        //this.dynamics.addForce('gravity', [0, -9800 * 2, 0]);
        //this.position.y = this.collisionradius + 1;
      }
    } else {
      this.dynamics.setFriction(0);
    }
  }
  
  this.updateMovementVector = function() {
    var forward = ( this.moveState.forward || ( this.autoForward && !this.moveState.back ) ) 
      ? ((this.moveState.forward * (this.booster_on ? this.booster : 1)) * (this.burner_on ? this.burner : 1))
      : 0;
    
    this.moveVector.x = ( -this.moveState.left    + this.moveState.right );
    this.moveVector.y = ( -this.moveState.down    + this.moveState.up );
    this.moveVector.z = ( -forward + this.moveState.back );

    if (this.moveVector.length() > 0) {
      this.dynamics.addForce("thrusters", this.matrix.multiplyVector3(this.moveVector.multiplyScalar(this.strength)).subSelf(this.position));
    } else {
      this.dynamics.removeForce("thrusters");
    }
  }
  
  this.setPosition = function(pos) {
    this.position.x = pos[0];
    this.position.y = pos[1];
    this.position.z = pos[2];
    this.dynamics.setPosition(pos);
  }
  
  this.updateRotationVector = function() {
    this.rotationVector.x = ( -this.moveState.pitchDown + this.moveState.pitchUp );
    this.rotationVector.y = ( -this.moveState.yawRight  + this.moveState.yawLeft );
    this.rotationVector.z = ( -this.moveState.rollRight + this.moveState.rollLeft );
    
    this.dynamics.setAngularVelocity([this.rotationVector.x, this.rotationVector.y, this.rotationVector.z]);
  }
  
  this.rotateRel = function(rot) {
    var rel = rot;//new THREE.Vector3(rot.e(1), rot.e(2), rot.e(3));
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
		//console.log(mwdelta, ev, mwdelta);
		this.mwdelta = mwdelta;
    
    if (elation.utils.arrayget(elation, 'ui.hud.radar')) {
      if (mwdelta < 0)
        elation.ui.hud.radar.prevTarget();
      else
        elation.ui.hud.radar.nextTarget();
    }
  }
  
  this.forward = function(event) {
    console.log('### SPACESHIP FORWARD', event, this);
  }
  
  this.reverse = function(event) {
    console.log('### SPACESHIP REVERSE', event, this);
  }
  
  this.jump = function(event) {
    console.log('### SPACESHIP JUMP', event);
    
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
  
  this.handleEvent = function(ev) {
    if (typeof this[ev.type] == 'function') {
      this[ev.type](ev);
    }
  }
  
  this.init();
});
elation.space.meshes.spaceship.prototype = new elation.space.thing();
elation.space.meshes.spaceship.prototype.supr = elation.space.thing.prototype
elation.space.meshes.spaceship.prototype.constructor = elation.space.meshes.spaceship;
