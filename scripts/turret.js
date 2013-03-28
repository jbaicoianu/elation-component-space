elation.extend("space.meshes.turret", function(args) {
  elation.space.thing.call(this, args);

  this.collisionradius = 100;
  this.setStates({
    turn_left: 0,
    turn_right: 0,
    pitch_up: 0,
    pitch_down: 0,
    firing: 0
  });
  this.firetime = 500;
  this.firetimer = false;

  this.postinit = function() {
    if (!this.properties.turret) {
      this.properties.turret = {};
    }
    if (!this.properties.turret.pitch) {
      this.properties.turret.pitch = 0;
      this.properties.turret.maxpitchdegrees = 90;
      this.properties.turret.minpitchdegrees = -44;
    }
    if (!this.properties.turret.yaw) {
      this.properties.turret.yaw = 0;
    }
    if (!this.properties.turret.maxpitch) {
      this.properties.turret.minpitch = this.properties.turret.minpitchdegrees * Math.PI / 180;
      this.properties.turret.maxpitch = this.properties.turret.maxpitchdegrees * Math.PI / 180;
    }

    elation.space.controls(0).addContext("vehicle_turret", {
      "fire": function(ev) { this.setState("firing", ev.value); },
      "turn_left" : function(ev) { this.setState("turn_left", ev.value); },
      "turn_right" : function(ev) { this.setState("turn_right", ev.value); },
      "pitch_up" : function(ev) { this.setState("pitch_up", ev.value); },
      "pitch_down" : function(ev) { this.setState("pitch_down", ev.value); },
      "camera_cycle": function(ev) { if (ev.value) this.cycleCamera(); },
    });
    elation.space.controls(0).addBindings("vehicle_turret", {
      "keyboard_w": "pitch_up",
      "keyboard_a": "turn_left",
      "keyboard_s": "pitch_down",
      "keyboard_d": "turn_right",
      "keyboard_space": "fire",
      //"mouse_x": "turn_right",
      //"mouse_y": "pitch_down",
      "keyboard_c": "camera_cycle",
      "gamepad_0_axis_0": "turn_right",
      "gamepad_0_axis_1": "pitch_down",
      "mouse_drag_x": "turn_right",
      "mouse_drag_y": "pitch_down",
    });
    this.controlcontext = 'vehicle_turret';

    this.createDynamics();
    this.rotation = new THREE.Vector3(0,0,0);
  }
  this.updateParts = function() {
    var rate = Math.PI / 2;
    var pitch = (this.state.pitch_up - this.state.pitch_down) * rate;
    var rotation = new THREE.Vector3(0, 0, (this.state.turn_left - this.state.turn_right) * rate);
    if (this.dynamics.rot.x < this.properties.turret.minpitch) {
      this.dynamics.rot.x = this.properties.turret.minpitch;
    } else if (this.dynamics.rot.x > this.properties.turret.maxpitch) {
      this.dynamics.rot.x = this.properties.turret.maxpitch;
    } else {
      rotation.x = pitch;
    }
    this.dynamics.setAngularVelocity(rotation);

    if (this.parts['Turret_mount']) {
      this.parts['Turret_mount'].rotation.z = -this.dynamics.rot.z;
      this.parts['Turret_mount'].quaternion.setFromEuler(this.parts['Turret_mount'].rotation.clone().multiplyScalar(180/Math.PI));
    }
    if (this.parts['Turret_gun']) {
      this.parts['Turret_gun'].rotation.x = this.dynamics.rot.x;
      this.parts['Turret_gun'].quaternion.setFromEuler(this.parts['Turret_gun'].rotation.clone().multiplyScalar(180/Math.PI));
    }

    this.fire();
  }
  this.fire = function() {
    var now = new Date().getTime();
    if (this.state['firing']) {
      if (!this.lastfire || now > this.lastfire + this.firetime) {
        var pos = new THREE.Vector3(0,2,.4);
        var dir = pos.clone();
        dir.y += 1;
        this.parts['Turret_gun'].matrixWorld.multiplyVector3(dir);
        this.parts['Turret_gun'].matrixWorld.multiplyVector3(pos);
        dir.subSelf(pos).normalize();
        //console.log("BANG", [pos.x, pos.y, pos.z], [dir.x, dir.y, dir.z]);
        var parent = elation.space.fly(0).scene;
        var bullet = new elation.space.meshes.turret_bullet({radius: 5, mass: 1, position: pos, direction: dir, speed: 2500, scene: parent});
        parent.add(bullet);
        this.lastfire = now;

        (function(self) {
          self.firetimer = setTimeout(function() { self.fire(); }, self.firetime);
        })(this);

      } else if (!this.firetimer) {
        (function(self) {
          self.firetimer = setTimeout(function() { self.fire(); }, self.firetime - (now - self.lastfire));
        })(this);
      }
    } else if (!this.state['firing'] && this.firetimer) {
      clearTimeout(this.firetimer);
      this.firetimer = false;
    }
  }
  this.dynamicsupdate = function(ev) {
    //this.getAngleFromSteer();
    this.updateParts();
  }
  this.init();
});
elation.space.meshes.turret.prototype = new elation.space.thing;
elation.space.meshes.turret.constructor = elation.space.meshes.turret;

elation.extend("space.meshes.turret_bullet", function(args) {
  elation.space.thing.call(this, args);

  this.postinit = function() {
    //console.log('pew pew', this);
    this.position.copy(this.args.position);
    this.dynamics.setVelocity(this.args.direction.multiplyScalar(this.args.speed));
    this.dynamics.addForce('gravity', [0,-9800*2,0]);
    this.dynamics.drag = .01;
    if (this.args.scene) {
      this.scene = this.args.scene;
    }
    //this.createGeometry();
  }
  this.createGeometry = function() {
    //console.log('new bullet', this);
    this.createMesh(new THREE.SphereGeometry(5, 6, 6), new THREE.MeshPhongMaterial({color: 0x999999}));
    (function(self) {
      setTimeout(function() { self.cleanup(); }, 5000);
    })(this);
  }
  this.dynamicsupdate = function(ev) {
    if (this.position.y < 0) {
      this.cleanup();
    }
  }
  this.cleanup = function() {
    this.removeDynamics();
    this.removeRadarContact();
    if (this.scene) {
      this.scene.remove(this);
      if (this.collisionmesh) {
        this.scene.remove(this.collisionmesh);
      }
      //console.log('bye bullet', this);
    } else {
      console.log("couldn't remove", this);
    }
  }
  this.init();
});
elation.space.meshes.turret_bullet.prototype = new elation.space.thing;
elation.space.meshes.turret_bullet.constructor = elation.space.meshes.turret_bullet;
