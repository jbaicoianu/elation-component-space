elation.extend("space.meshes.drone", function(args) {
  elation.space.thing.call( this, args );

  this.moveState = { up: 0, down: 0, left: 0, right: 0, forward: 0, back: 0, pitchUp: 0, pitchDown: 0, yawLeft: 0, yawRight: 0, rollLeft: 0, rollRight: 0 };
  this.strength = 3500;
  this.moveVector = new THREE.Vector3(0,0,0);
  this.rotationVector = new THREE.Vector3(0,0,0);
  this.tmpQuaternion = new THREE.Quaternion();
  this.controlcontext = 'vehicle_quadrotor';

  this.camerapositions = [
    [new THREE.Vector3(0,2,4), new THREE.Vector3()]
  ];

  this.postinit = function() {
    this.useQuaternion = true;

    if (this.position.y < this.collisionradius) this.position.y = this.collisionradius;

    if (this.properties.render && this.properties.render.mesh) {
      this.materials = [new THREE.MeshFaceMaterial({color: 0xffffff})];
      (function(self, mesh) {
        var loader = new THREE.JSONLoader();
        loader.load( mesh, function(geometry) { self.loadMesh(geometry); });
      })(this, this.properties.render.mesh);
    } else {
      this.createPlaceholder();
    }

    /*
    this.light = new THREE.PointLight(0xff0000, .5, 1000);
    this.light.position = this.position;
    this.add(this.light);
    this.nextblink = 0;
    */

    this.dynamics.addForce("gravity", [0,-9800 * 2,0]);

    elation.space.controls(0).addContext("vehicle_quadrotor", {
      'move_up': function(ev) { this.moveState.up = ev.value; },
      'move_down': function(ev) { this.moveState.down = ev.value; },
      'move_left': function(ev) { this.moveState.left = ev.value; },
      'move_right': function(ev) { this.moveState.right = ev.value; },
      'move_forward': function(ev) { this.moveState.forward = ev.value; },
      'move_backward': function(ev) { this.moveState.back = ev.value; },
      'look_up': function(ev) { this.moveState.pitchUp = ev.value; },
      'look_down': function(ev) { this.moveState.pitchDown = ev.value; },
      'look_left': function(ev) { this.moveState.yawLeft = ev.value; },
      'look_right': function(ev) { this.moveState.yawRight = ev.value; },
      'roll_left': function(ev) { this.moveState.rollLeft = ev.value; },
      'roll_right': function(ev) { this.moveState.rollRight = ev.value; },
    });
    elation.space.controls(0).addBindings("vehicle_quadrotor", {
      'keyboard_w': 'move_forward',
      'keyboard_a': 'move_left',
      'keyboard_s': 'move_backward',
      'keyboard_d': 'move_right',
      'keyboard_q': 'roll_left',
      'keyboard_e': 'roll_right',
      'keyboard_up': 'look_up',
      'keyboard_left': 'look_left',
      'keyboard_down': 'look_down',
      'keyboard_right': 'look_right',
      'keyboard_space': 'move_up',
      'keyboard_r': 'move_up',
      'keyboard_f': 'move_down',
      'mouse_drag_x': 'look_right',
      'mouse_drag_y': 'look_down',
      'gamepad_0_axis_0': 'move_right',
      'gamepad_0_axis_1': 'move_backward',
      'gamepad_0_axis_2': 'look_right',
      'gamepad_0_axis_3': 'look_down',
      'gamepad_0_axis_13_full': 'move_up',
    });

    this.createCamera(this.camerapositions[0][0], this.camerapositions[0][1]);
  }
  this.createPlaceholder = function() {
    var geometry = new THREE.SphereGeometry(10, 20, 20);
    this.loadMesh(geometry);
  }
  this.loadMesh = function(geometry) {
    var material = new THREE.MeshPhongMaterial({color: 0x666699});
    var mesh = new THREE.Mesh(geometry, material);
    //mesh.position.z = -1.5;
    //mesh.position.y = -1.25;
    //mesh.castShadow = true;
    //mesh.receiveShadow = true;
    this.add(mesh);
    this.updateCollisionSize();
  }

  this.setPosition = function(pos) {
    this.position.x = pos[0];
    this.position.y = pos[1];
    this.position.z = pos[2];
    this.dynamics.setPosition(pos);
  }
  this.rotateRel = function(rot) {
    var rel = rot;//new THREE.Vector3(rot.e(1), rot.e(2), rot.e(3));
    var rotMult = .5;
		this.tmpQuaternion.set( rot.x * rotMult, rot.y * rotMult, rot.z * rotMult, 1 ).normalize();
		this.quaternion.multiplySelf( this.tmpQuaternion );
		this.matrix.setRotationFromQuaternion( this.quaternion );
		this.matrixWorldNeedsUpdate = true;
  }
  this.handleEvent = function(ev) {
    if (typeof this[ev.type] == 'function') {
      this[ev.type](ev);
    }
  }
  this.mousewheel = function(ev) {
    // FIXME - should be moved into the hud object and mapped through the control mapper
		var	event = ev ? ev : window.event;
				mwdelta = (event.wheelDelta) 
					? (event.wheelDelta / 120) 
					: (event.detail) 
						? (-event.detail / 3) 
						: 0;
		
		if (window.opera) mwdelta = -mwdelta;		
		
		this.mwdelta = mwdelta;
    
    if (elation.utils.arrayget(elation, 'ui.hud.radar')) {
      if (mwdelta < 0)
        elation.ui.hud.radar.nextTarget();
      else
        elation.ui.hud.radar.prevTarget();
    }
  }

  this.updateMovementVector = function() {
    var forward = ( this.moveState.forward || ( this.autoForward && !this.moveState.back ) ) ? 1 : 0;
    
    this.moveVector.x = ( -this.moveState.left    + this.moveState.right );
    this.moveVector.y = ( -this.moveState.down    + this.moveState.up );
    this.moveVector.z = ( -forward + this.moveState.back );

    if (this.moveVector.length() > 0) {
      this.dynamics.addForce("thrusters", this.matrix.multiplyVector3(this.moveVector.multiplyScalar(this.strength)));
    } else {
      this.dynamics.removeForce("thrusters");
    }
  }
  this.updateRotationVector = function() {
    this.rotationVector.x = ( -this.moveState.pitchDown + this.moveState.pitchUp );
    this.rotationVector.y = ( -this.moveState.yawRight  + this.moveState.yawLeft );
    this.rotationVector.z = ( -this.moveState.rollRight + this.moveState.rollLeft );

    this.dynamics.setAngularVelocity([this.rotationVector.x, this.rotationVector.y, this.rotationVector.z]);
  }
  this.dynamicsupdate = function(ev) {
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
  this.init();
});
elation.space.meshes.drone.prototype = new elation.space.thing()
elation.space.meshes.drone.prototype.supr = elation.space.thing.prototype
elation.space.meshes.drone.prototype.constructor = elation.space.meshes.drone;

