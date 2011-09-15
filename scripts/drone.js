elation.extend("space.meshes.drone", function(args) {
	THREE.Object3D.call( this );
  this.args = args || {};

  this.dragToLook = true;
  this.mouseStatus = 0;
  this.moveState = { up: 0, down: 0, left: 0, right: 0, forward: 0, back: 0, pitchUp: 0, pitchDown: 0, yawLeft: 0, yawRight: 0, rollLeft: 0, rollRight: 0 };
  this.strength = 35000;
  this.moveVector = new THREE.Vector3(0,0,0);
  this.rotationVector = new THREE.Vector3(0,0,0);
  this.tmpQuaternion = new THREE.Quaternion();


  this.init = function() {
    this.geometry = new THREE.SphereGeometry(50, 20, 20);
    this.material = new THREE.MeshPhongMaterial({color: 0xffcc00});
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.useQuaternion = true;
    this.addChild(this.mesh);

    elation.space.fly(0).attachCameraToObject(this);;

    (function(self) {
      self.dynamics = new elation.utils.dynamics(self, {
        onmove: function(a) { self.respond(); },
        drag:0.1,
        mass: 1
      });
    })(this);
    this.lastupdate = new Date().getTime();
    elation.events.add(document, 'keydown,keyup,mousedown,mousemove,mouseup', this);
  }

  this.setPosition = function(pos) {
    this.position.x = pos[0];
    this.position.y = pos[1];
    this.position.z = pos[2];
    this.dynamics.setPosition(pos);
  }
  this.update = function() {
    var ts = new Date().getTime();
    if (ts > this.lastupdate) {
      this.dynamics.iterate((ts - this.lastupdate) / 1000);
    }
    this.lastupdate = ts;
    if (this.position.y < 0) {
      this.position.y = 0;
      this.dynamics.removeForce('gravity');
      this.dynamics.setVelocityY(0);
      this.dynamics.setFriction(250);
    } else {
      this.dynamics.addForce('gravity', [0, -9800 * 2, 0]);
      this.dynamics.setFriction(0);
    }
  }
  this.respond = function() {
    this.position.x = this.dynamics.pos.e(1);
    this.position.y = this.dynamics.pos.e(2);
    this.position.z = this.dynamics.pos.e(3);
  }
  this.rotateRel = function(rot) {
    var rel = new THREE.Vector3(rot.e(1), rot.e(2), rot.e(3));
    var rotMult = .5;
		this.tmpQuaternion.set( rot.e(1) * rotMult, rot.e(2) * rotMult, rot.e(3) * rotMult, 1 ).normalize();
		this.quaternion.multiplySelf( this.tmpQuaternion );
		this.matrix.setRotationFromQuaternion( this.quaternion );
		this.matrixWorldNeedsUpdate = true;
  }
  this.handleEvent = function(ev) {
    if (typeof this[ev.type] == 'function') {
      this[ev.type](ev);
    }
  }
  this.keydown = function(ev) {
    //console.log('down', ev);
    switch (ev.keyCode) {
      case 87: /*W*/ this.moveState.forward = 1; break;
      case 83: /*S*/ this.moveState.back = 1; break;

      case 65: /*A*/ this.moveState.left = 1; break;
      case 68: /*D*/ this.moveState.right = 1; break;

      case 82: /*R*/ this.moveState.up = 1; break;
      case 70: /*F*/ this.moveState.down = 1; break;

      case 38: /*up*/ this.moveState.pitchUp = 1; break;
      case 40: /*down*/ this.moveState.pitchDown = 1; break;

      case 37: /*left*/ this.moveState.yawLeft = 1; break;
      case 39: /*right*/ this.moveState.yawRight = 1; break;

      case 81: /*Q*/ this.moveState.rollLeft = 1; break;
      case 69: /*E*/ this.moveState.rollRight = 1; break;

      case 32: /*spacebar*/ this.moveState.up = 1; break;
      default:
        console.log('uh');
    }
    this.updateMovementVector();
    this.updateRotationVector();
  }
  this.keyup = function(ev) {
    switch (ev.keyCode) {
      case 87: /*W*/ this.moveState.forward = 0; break;
      case 83: /*S*/ this.moveState.back = 0; break;

      case 65: /*A*/ this.moveState.left = 0; break;
      case 68: /*D*/ this.moveState.right = 0; break;

      case 82: /*R*/ this.moveState.up = 0; break;
      case 70: /*F*/ this.moveState.down = 0; break;

      case 38: /*up*/ this.moveState.pitchUp = 0; break;
      case 40: /*down*/ this.moveState.pitchDown = 0; break;

      case 37: /*left*/ this.moveState.yawLeft = 0; break;
      case 39: /*right*/ this.moveState.yawRight = 0; break;

      case 81: /*Q*/ this.moveState.rollLeft = 0; break;
      case 69: /*E*/ this.moveState.rollRight = 0; break;

      case 32: /*spacebar*/ this.moveState.up = 0; break;
    }
    this.updateMovementVector();
    this.updateRotationVector();
  }
	this.mousedown = function(ev) {
		ev.preventDefault();
		ev.stopPropagation();

		if (this.dragToLook) {
			this.mouseStatus++;
		} else {
			switch ( event.button ) {
				case 0: this.moveForward = true; break;
				case 2: this.moveBackward = true; break;
			}
		}
	};

  this.mousemove = function(ev) {
		if (!this.dragToLook || this.mouseStatus > 0) {
			var halfWidth  = window.innerWidth / 2;
			var halfHeight = window.innerHeight / 2;
			
			this.moveState.yawLeft   = -(ev.clientX - halfWidth) / halfWidth;
			this.moveState.pitchDown =  (ev.clientY - halfHeight) / halfHeight;
			this.updateRotationVector();
		}
	};

	this.mouseup = function(ev) {
		ev.preventDefault();
		ev.stopPropagation();

		if (this.dragToLook) {
			this.mouseStatus--;
			this.moveState.yawLeft = this.moveState.pitchDown = 0;
		} else {
			switch ( event.button ) {
				case 0: this.moveForward = false; break;
				case 2: this.moveBackward = false; break;
			}
		}
		this.updateRotationVector();
	};
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
  this.init();
});
elation.space.meshes.drone.prototype = new THREE.Object3D();
elation.space.meshes.drone.prototype.constructor = elation.space.meshes.drone;
