elation.extend("space.meshes.drone", function(args) {
	THREE.Object3D.call( this );
  this.args = args || {};
  this.properties = args.properties || {};

  this.dragToLook = true;
  this.mouseStatus = 0;
  this.moveState = { up: 0, down: 0, left: 0, right: 0, forward: 0, back: 0, pitchUp: 0, pitchDown: 0, yawLeft: 0, yawRight: 0, rollLeft: 0, rollRight: 0 };
  this.strength = 35000;
  this.moveVector = new THREE.Vector3(0,0,0);
  this.rotationVector = new THREE.Vector3(0,0,0);
  this.tmpQuaternion = new THREE.Quaternion();
  this.minheight = 50;

  this.init = function() {
    this.useQuaternion = true;

    if (this.position.y < this.minheight) this.position.y = this.minheight;

    if (this.properties.render && this.properties.render.mesh) {
      this.materials = [new THREE.MeshFaceMaterial({color: 0xffffff})];
      (function(self, mesh) {
        var loader = new THREE.JSONLoader();
        loader.load( { model: mesh, callback: function(geometry) { self.loadMesh(geometry); } });
      })(this, this.properties.render.mesh);
    } else {
      this.createPlaceholder();
    }

    elation.space.fly(0).attachCameraToObject(this);

    this.light = new THREE.PointLight(0xff0000, .5, 1000);
    this.light.position = this.position;
    this.add(this.light);

    this.dynamics = new elation.utils.physics.object({position: this.position, restitution: .5, radius: this.minheight, drag: 0.1});
    elation.events.add([this.dynamics], "dynamicsupdate,rotate", this);
    elation.utils.physics.system.add(this.dynamics);
    this.dynamics.addForce("gravity", [0,-9800 * 2,0]);
/*
    (function(self) {
      self.dynamics = new elation.utils.dynamics(self, {
        onmove: function(a) { self.respond(); },
        drag:0.1,
        mass: 1
      });
    })(this);
    this.lastupdate = new Date().getTime();
*/
    this.nextblink = 0;
    elation.events.add(document, 'keydown,keyup,mousedown,mousemove,mouseup,mousewheel', this);
  }
  this.createPlaceholder = function() {
    var geometry = new THREE.SphereGeometry(50, 20, 20);
    this.loadMesh(geometry);
  }
  this.loadMesh = function(geometry) {
    var material = new THREE.MeshPhongMaterial({color: 0x666699});
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -1.5;
    mesh.position.y = -1.25;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.add(mesh);
  }

  this.setPosition = function(pos) {
    this.position.x = pos[0];
    this.position.y = pos[1];
    this.position.z = pos[2];
    this.dynamics.setPosition(pos);
  }
/*
  this.update = function(parentMatrixWorld, forceUpdate, camera) {
    this.supr.update.call( this, parentMatrixWorld, forceUpdate, camera );
    var ts = new Date().getTime();
    if (ts > this.lastupdate) {
      this.dynamics.iterate((ts - this.lastupdate) / 1000);
    }

    // blink test
    if (this.light && ts >= this.nextblink) {
      if (this.light.intensity == 1) {
        this.light.intensity = 0;
        this.nextblink = ts + 1800;
      } else {
        this.light.intensity = 1;
        this.nextblink = ts + 200;
      }
    }
    this.lastupdate = ts;
    if (this.position.y < this.minheight) {
      if (this.dynamics.vel.e(2) <= 0) {
        this.position.y = this.minheight;
        this.dynamics.removeForce('gravity');
        this.dynamics.setVelocityY(0);
        this.dynamics.setFriction(250);
      } else {
        this.dynamics.addForce('gravity', [0, -9800 * 2, 0]);
        this.position.y = this.minheight + 1;
      }
    } else {
      this.dynamics.setFriction(0);
    }
  }
*/
  this.respond = function() {
    this.position.x = this.dynamics.pos.e(1);
    this.position.y = this.dynamics.pos.e(2);
    this.position.z = this.dynamics.pos.e(3);
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
  this.keydown = function(ev) {
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
      
      case 84: elation.ui.hud.radar.nextTarget(); break;
      
      case 32: /*spacebar*/ this.moveState.up = 1; break;
      default:
        console.log('key not bound: '+ev.keyCode);
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
  this.dynamicsupdate = function(ev) {
    if (this.position.y < this.minheight) {
      if (this.dynamics.vel.y <= 0) {
        this.position.y = this.minheight;
        this.dynamics.setVelocityY(this.dynamics.vel.y * -this.dynamics.restitution);
        //this.dynamics.removeForce('gravity');
        //this.dynamics.setVelocityY(0);
        this.dynamics.setFriction(250);
      } else {
        //this.dynamics.addForce('gravity', [0, -9800 * 2, 0]);
        //this.position.y = this.minheight + 1;
      }
    } else {
      this.dynamics.setFriction(0);
    }
  }
  this.rotate = function(ev) {
    this.rotateRel(ev.data);
  }
  this.init();
});
elation.space.meshes.drone.prototype = new THREE.Object3D();
elation.space.meshes.drone.prototype.supr = THREE.Object3D.prototype;
elation.space.meshes.drone.prototype.constructor = elation.space.meshes.drone;

