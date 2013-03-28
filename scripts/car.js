elation.extend("space.meshes.car", function(args) {
  elation.space.thing.call(this, args);
  this.autocreategeometry = false;
  this.state = { steer: 0, acceleration: new THREE.Vector3() };
  this.parts = {};
  this.controlcontext = 'vehicle_car';
  this.camerapositions = [
    [new THREE.Vector3(-5, 35, 25), new THREE.Vector3(-Math.PI / 16, 0, 0)],
    [new THREE.Vector3(0, 80, 120), new THREE.Vector3(-Math.PI / 8, 0, 0)],
    [new THREE.Vector3(120, 80, 0), new THREE.Vector3(-Math.PI / 8, Math.PI / 2, 0)],
  ];
  this.currentcamera = 0;
  this.collisionradius = 20;

  this.enginetorque = 39200000 * 2;
  
  this.mass = 1000;
  this.drag = .5;
  this.frontalarea = 2.5;
  this.strength = 50000000;
  this.steermax = Math.PI / 4;
  this.wheelbase = 60;
  this.wheelradius = 10;
  this.friction = .25;

  this.currentgear = 1;
  this.gears = [0, 2.66, 1.78, 1.30, 1.0, 0.74, 0.50];
  this.geardifferential = 3.42;

  this.dirvecs = {
    "forward": new THREE.Vector3(0,0,-1),
    "backward": new THREE.Vector3(0,0,1),
    "left": new THREE.Vector3(0,1,0),
    "right": new THREE.Vector3(0,-1,0),
  };

  this.postinit = function() {
    if (1) {
      this.createMesh();
      elation.events.add([elation.space.meshparts], 'meshpartsloaded', this);
      elation.space.meshparts.loadParts({
        'chassis': '/media/space/models/cars/ac1083/chassis.js',
        //'chassis': '/media/space/models/planes/spitfire/spitfire.js',
        //'wheel': '/media/space/models/cars/ac1083/wheel.js',
        'steeringwheel': '/media/space/models/cars/ac1083/steeringwheel.js',
      });
    } else {
      this.loadCollada('/media/space/models/cars/ac1038.dae');
    }

    elation.space.controls(0).addContext("vehicle_car", {
      'accelerate': function(ev) { this.accelerate("forward", ev.value); },
      'accelerate_blah': function(ev) { var fuck = THREE.Math.mapLinear(ev.value, -1, 1, 0, 1); this.accelerate("forward", fuck); },
      'reverse': function(ev) { this.accelerate("backward", ev.value); },
      'brake': function(ev) { this.brake(ev.value); },
      'shift_up': function(ev) { if (ev.value) this.shift(1); },
      'shift_down': function(ev) { if (ev.value) this.shift(-1); },
      'steer_left': function(ev) { this.steer("left", ev.value); },
      'steer_right': function(ev) { this.steer("right", ev.value); },
      'camera': function(ev) { if (ev.value) this.cycleCamera(); },
      'foh': function(ev) { console.log(ev.type, ev.value); }
    });
    elation.space.controls(0).addBindings("vehicle_car", {
      'keyboard_w': 'accelerate',
      'keyboard_a': 'steer_left',
      'keyboard_s': 'reverse',
      'keyboard_d': 'steer_right',
      'keyboard_up': 'accelerate',
      'keyboard_left': 'steer_left',
      'keyboard_down': 'reverse',
      'keyboard_right': 'steer_right',
      'keyboard_q': 'shift_down',
      'keyboard_e': 'shift_up',
      'keyboard_c': 'camera',
      'keyboard_space': 'brake',
      //'mouse_x': 'steer_right',
      'gamepad_0_axis_0': 'steer_right',
      //'gamepad_0_axis_1': 'reverse',
      'gamepad_0_button_14': 'accelerate',
      'gamepad_0_button_15': 'brake',
      'gamepad_0_button_1': 'brake',
      'gamepad_0_axis_13': 'accelerate_blah',
    });
    this.dynamics.addForce("gravity", [0,-9800 * this.mass,0]);
  }
  this.updateParts = function() {
    if (this.parts['wheel_front_left'] && this.parts['wheel_front_right']) {
      this.parts['wheel_front_left'].rotation.y = this.parts['wheel_front_right'].rotation.y = -this.state['steer'];
    }
    if (this.parts['wheel_steering']) {
      this.parts['wheel_steering'].rotation.x = this.state['steer'] * 2;
      this.parts['wheel_steering'].quaternion.setFromEuler(this.parts['wheel_steering'].rotation);

    }
    if (this.parts['lights_back']) {
      this.parts['lights_back'].material.color.setHex(this.state['brake'] > 0 ? 0xee0000 : 0x660000);
    }
  }
  this.accelerate = function(direction, amount) {
    this.state['acceleration'] = this.dirvecs[direction].clone().multiplyScalar(amount);
    //console.log('go faster', this, direction, amount * this.strength, this.dirvecs[direction]);
    this.getAngleFromSteer();
  }
  this.brake = function(amount) {
    this.dynamics.friction = this.friction + (amount * 200);
    this.state['brake'] = amount;
  }
  this.shift = function(direction) {
    var newgear = this.currentgear + direction;
    if (newgear > 0 && newgear < this.gears.length) {
      console.log('changed gears from ' + this.currentgear + ' to ' + newgear); 
      this.currentgear = newgear;
    }
  }
  this.getAngleFromSteer = function() {
    this.updateMatrix();
    var omega = 0;
    var up = new THREE.Vector3(0,1,0);
/*
    if (this.state['steer']) {
      var radius = this.wheelbase = Math.sin(this.state['steer']);
      omega = this.dynamics.vel.length() / radius;

      var vec = new THREE.Vector3(0, -omega, 0);
      //this.dynamics.setAngularVelocity(vec);
      //this.dynamics.addForce("centripetal", null);
      //console.log([vec.x, vec.y, vec.z]);
    }
*/
    var vel = this.dynamics.vel.clone();
    vel.normalize();
    var worldaccel = this.matrix.multiplyVector3(this.state['acceleration'].clone()).subSelf(this.position)

    var s = up.dot(vel.crossSelf(worldaccel.clone().normalize()));
    if (s > 0) {
      //worldaccel.negate();
      //this.state['brake'] = true;
    } else {
      //this.state['brake'] = false;
    }
    //console.log(s, [worldaccel.x, worldaccel.y, worldaccel.z], [vel.x, vel.y, vel.z]);
    //console.log(s);

    //var driveforce = worldaccel.multiplyScalar(this.enginetorque * this.geardifferential * this.gears[this.currentgear] / this.wheelradius);
    var driveforce = worldaccel.multiplyScalar(this.enginetorque);
  
    //console.log(this.enginetorque, this.currentgear, this.gears[this.currentgear], this.wheelradius, driveforce);
    this.dynamics.addForce("engine", driveforce);

    var movedir = this.dynamics.vel.clone().normalize();

    var vrel = this.dynamics.vel.clone();
    vrel.normalize();

    var forward = new THREE.Vector3(0,0,-1);
    this.matrix.multiplyVector3(forward);
    forward.subSelf(this.position);
    forward.normalize();

    if (this.dynamics.vel.length() > 0.5) {
      var cross = new THREE.Vector3().cross(forward, vrel);
      var sina = cross.length();
      var cosa = forward.dot(vrel);
      var sideslip = Math.atan2(sina, cosa);
      var foo = up.dot(cross);
      var slipdir = (foo > 0 ? -1 : 1) * 10000 

      var latforce = 0;
      var degrees = sideslip * 180/Math.PI;
      // FIXME - hack to simulate sideways friction for tires.  Should be looked up from a curve
      if (degrees > 3) {
        latforce = 6000 * vrel.length();
      } else {
        latforce = 2000 * sideslip;
      }
      if (!this.latforce) {
        this.latforce = new THREE.Vector3(-latforce * slipdir,0,0);
      } else {
        this.latforce.set(-latforce * slipdir,0,0);
      }
      //console.log(slipdir, latforce, sideslip);
      this.matrix.multiplyVector3(this.latforce);
      this.dynamics.addForce("lateral", this.latforce);
    } else {
      this.dynamics.removeForce("lateral");
    }

  }
  this.steer = function(direction, amount) {
    var vec = this.dirvecs[direction].clone().multiplyScalar(amount);
    this.state['steer'] = (this.steermax / 2) * amount * (direction == 'left' ? -1 : 1);
    this.dynamics.setAngularVelocity(vec);
    //this.getAngleFromSteer();
    //this.rotation.addSelf(vec);
  }
  this.createMesh = function() {
    var materialtype = (Detector.webgl ? THREE.MeshPhongMaterial : THREE.MeshBasicMaterial);
    var materials = {
      chassis: new materialtype({color: 0x000099, shading: THREE.SmoothShading}), 
      wheels: new materialtype({color: 0x222222, overdraw: true}), 
      headlights: new THREE.MeshBasicMaterial({color: 0xffff99}), 
      brakelights: new THREE.MeshBasicMaterial({color: 0x660000}), 
      windshield: new THREE.MeshPhongMaterial({color: 0xccffff, opacity: .3, transparent: true}), 
    }
    var chassis = new THREE.Mesh(new THREE.CubeGeometry(35,15,100, 4, 4, 4), materials['chassis']);
    var cockpit = new THREE.Mesh(new THREE.CubeGeometry(48,16,60, 4, 4, 4), materials['chassis']);
    this.parts['windshield'] = new THREE.Mesh(new THREE.CubeGeometry(25,10,1, 4, 4, 4), materials['windshield']);
    this.parts['windshield'].position.z = -25;
    this.parts['windshield'].position.y = 22 + this.wheelradius;
    this.parts['windshield'].rotation.z = -Math.PI / 16;
    //this.add(this.parts['windshield']);

    chassis.position.y = 11 + this.wheelradius;
    cockpit.position.y = 22 + 6 + this.wheelradius;
    cockpit.position.z = 10;
    var chassisgeom = new THREE.Geometry();
    THREE.GeometryUtils.merge(chassisgeom, chassis);
    //THREE.GeometryUtils.merge(chassisgeom, cockpit);
    chassisgeom.computeVertexNormals();
    this.parts['chassis'] = new THREE.Mesh(chassisgeom, materials['chassis']);

    var axle = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 50), materials['wheels']);
    axle.rotation.z = Math.PI / 2;
    //axle.rotation.y = Math.PI / 2;
    var tiregeom = new THREE.CylinderGeometry(this.wheelradius, this.wheelradius, 5, 12);
    var tire = new THREE.Mesh(tiregeom, materials['wheels']);
    tire.rotation.z = Math.PI / 2;
    tire.position.x = -25;
    tire.position.y = this.wheelradius;
    axle.position.y = this.wheelradius;

    var backwheelgeom = new THREE.Geometry();
    THREE.GeometryUtils.merge(backwheelgeom, axle);
    THREE.GeometryUtils.merge(backwheelgeom, tire);
    tire.position.x = 25;
    THREE.GeometryUtils.merge(backwheelgeom, tire);

    this.parts['wheel_back'] = new THREE.Mesh(backwheelgeom, materials['wheels']);
    this.parts['wheel_back'].position.z = this.wheelbase / 2;


    //this.add(this.parts['chassis']);
    this.add(this.parts['wheel_back']);

    var frontwheelgeom = new THREE.Geometry();
    THREE.GeometryUtils.merge(frontwheelgeom, axle);
    this.parts['wheel_front'] = new THREE.Mesh(frontwheelgeom, materials['wheels']);
    this.parts['wheel_front'].position.z = (this.wheelbase / -2) - 8; // FIXME - hack
    var tire_left = new THREE.Mesh(tiregeom, materials['wheels']);
    var tire_right = new THREE.Mesh(tiregeom, materials['wheels']);
    tire_left.rotation.z = tire_right.rotation.z = Math.PI / 2;
    tire_left.position.set(-25, this.wheelradius, 0);
    tire_right.position.set(25, this.wheelradius, 0);
    this.parts['wheel_front'].add(tire_left);
    this.parts['wheel_front'].add(tire_right);
    this.parts['wheel_front_left'] = tire_left;
    this.parts['wheel_front_right'] = tire_right;
    this.add(this.parts['wheel_front']);

    var lightgeom = new THREE.CylinderGeometry(5, 1, 3);
    var lightmesh = new THREE.Mesh(lightgeom, materials['wheels']); // temp material
    var lightpair = new THREE.Geometry();
    lightmesh.rotation.z = Math.PI / 2;
    lightmesh.position.x = -.5;
    lightmesh.position.y = 12 + this.wheelradius;
    lightmesh.position.z = -10;
    THREE.GeometryUtils.merge(lightpair, lightmesh);
    lightmesh.position.z = 10;
    THREE.GeometryUtils.merge(lightpair, lightmesh);
    this.parts['lights_front'] = new THREE.Mesh(lightpair, materials['headlights']);
    this.parts['lights_back'] = new THREE.Mesh(lightpair, materials['brakelights']);
    this.parts['lights_front'].position.z = -50;
    this.parts['lights_back'].position.z = 51;
    this.parts['chassis'].add(this.parts['lights_front']);
    this.parts['chassis'].add(this.parts['lights_back']);
    
    this.parts['wheel_front_left'].castShadow = true;
    this.parts['wheel_front_right'].castShadow = true;
    this.parts['wheel_back'].castShadow = true;

    this.createCamera(this.camerapositions[0][0], this.camerapositions[0][1]);
    this.currentcamera = -1;
    this.cycleCamera();

    //frontwheel.position.x = this.wheelbase / -2;
    //this.add(frontwheel);
    //this.add(axle);
  }
  this.handleEvent = function(ev) {
    if (typeof this[ev.type] == 'function') {
      this[ev.type](ev);
    }
  }
  this.meshpartsloaded = function(ev) {
    elation.events.remove([elation.space.meshparts], 'meshpartsloaded', this);
    // FIXME - hack...removing the meshpartsloaded event doesn't seem to work right
    if (!this.parts['wheel_steering']) {
      var chassis = new THREE.Mesh(ev.data.chassis, new THREE.MeshFaceMaterial());
      //console.log(chassis);
      chassis.scale.set(10,10,10);
      chassis.rotation.y = Math.PI / 2;
      chassis.position.y = 18;
      chassis.castShadow = true;
      chassis.receiveShadow = false;
      chassis.doubleSided = true;

      this.parts['wheel_steering'] = new THREE.Mesh(ev.data.steeringwheel, new THREE.MeshFaceMaterial());
      this.parts['wheel_steering'].position.x = -.14;
      this.parts['wheel_steering'].position.y = .7;
      this.parts['wheel_steering'].position.z = -1.05;
      chassis.add(this.parts['wheel_steering']);
      this.parts['wheel_steering'].castShadow = true;
      this.parts['wheel_steering'].receiveShadow = false;

      this.add(chassis);
      this.updateCollisionSize();
    }
  }
  this.dynamicsupdate = function(ev) {
    if (this.position.y < 6) this.position.y = 6;
    this.getAngleFromSteer();
    this.updateParts();
  }
  this.init();
});
elation.space.meshes.car.prototype = new elation.space.thing();
elation.space.meshes.car.prototype.constructor = elation.space.meshes.car;
