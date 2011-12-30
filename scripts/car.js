elation.extend("space.meshes.car", function(args) {
  elation.space.thing.call(this, args);
  this.autocreategeometry = false;
  this.strength = 50000000;
  this.steermax = Math.PI / 4;
  this.state = { steer: 0, acceleration: new THREE.Vector3() };
  this.wheelbase = 60;
  this.fronttires = [];
  this.friction = 12.8;
  this.parts = {};

  this.dirvecs = {
    "forward": new THREE.Vector3(-1,0,0),
    "backward": new THREE.Vector3(1,0,0),
    "left": new THREE.Vector3(0,1,0),
    "right": new THREE.Vector3(0,-1,0),
  };

  this.postinit = function() {
    this.createMesh();
    this.createDynamics();

    elation.space.controls(0).addContext("vehicle_car", {
      'accelerate': function(ev) { this.accelerate("forward", ev.value); },
      'reverse': function(ev) { this.accelerate("backward", ev.value); },
      'brake': function(ev) { this.brake(ev.value); },
      'shift_up': function(ev) { this.shift(1); },
      'shift_down': function(ev) { this.shift(-1); },
      'steer_left': function(ev) { this.steer("left", ev.value); },
      'steer_right': function(ev) { this.steer("right", ev.value); },
    });
    elation.space.controls(0).addBindings("vehicle_car", {
      'keyboard_w': 'accelerate',
      'keyboard_a': 'steer_left',
      'keyboard_s': 'reverse',
      'keyboard_d': 'steer_right',
      'keyboard_space': 'brake',
      //'mouse_x': 'steer_right',
      'gamepad_0_axis_0': 'steer_right',
      'gamepad_0_axis_1': 'reverse',
      'gamepad_0_button_1': 'brake'
    });
  }
  this.updateParts = function() {
    if (this.parts['wheel_front_left'] && this.parts['wheel_front_right']) {
      this.parts['wheel_front_left'].rotation.z = this.parts['wheel_front_right'].rotation.z = this.state['steer'];
    }
    if (this.parts['lights_back']) {
      this.parts['lights_back'].material.color.setHex(this.state['brake'] > 0 ? 0xee0000 : 0x660000);
    }
  }
  this.accelerate = function(direction, amount) {
    this.state['acceleration'] = this.dirvecs[direction].clone().multiplyScalar(amount * this.strength);
    //console.log('go faster', this, direction, amount * this.strength, this.dirvecs[direction], [dirvec.x, dirvec.y, dirvec.z]);
    this.getAngleFromSteer();
  }
  this.brake = function(amount) {
    this.dynamics.friction = this.friction + (amount * 200);
    this.state['brake'] = amount;
  }
  this.shift = function(direction) {
  }
  this.getAngleFromSteer = function() {
    var omega = 0;
    if (this.state['steer']) {
      var radius = this.wheelbase = Math.sin(this.state['steer']);
      omega = this.dynamics.vel.length() / radius;

      var vec = new THREE.Vector3(0, -omega, 0);
      //this.dynamics.setAngularVelocity(vec);
      //this.dynamics.addForce("centripetal", null);
      //console.log([vec.x, vec.y, vec.z]);
    }
    this.dynamics.addForce("engine", this.matrix.multiplyVector3(this.state['acceleration'].clone()).subSelf(this.position));
//console.log(omega, this.dynamics.vel.length(), this.wheelbase, this.state['steer']);
  }
  this.steer = function(direction, amount) {
    var vec = this.dirvecs[direction].clone().multiplyScalar(amount);
    this.state['steer'] = (this.steermax / 2) * amount * (direction == 'left' ? -1 : 1);
    this.dynamics.setAngularVelocity(vec);
    //this.getAngleFromSteer();
    //this.rotation.addSelf(vec);
  }
  this.createMesh = function() {
    var materials = {
      chassis: new THREE.MeshPhongMaterial({color: 0x000099, shading: THREE.SmoothShading}), 
      wheels: new THREE.MeshPhongMaterial({color: 0x222222}), 
      headlights: new THREE.MeshBasicMaterial({color: 0xffff99}), 
      brakelights: new THREE.MeshBasicMaterial({color: 0x660000}), 
    }
    var chassis = new THREE.Mesh(new THREE.CubeGeometry(100,25,50, 5, 5, 5), materials['chassis']);
    var cockpit = new THREE.Mesh(new THREE.CubeGeometry(60,20,48, 5, 5, 5), materials['chassis']);
    chassis.position.y = 17;
    cockpit.position.y = 32;
    cockpit.position.x = 10;
    var chassisgeom = new THREE.Geometry();
    THREE.GeometryUtils.merge(chassisgeom, chassis);
    THREE.GeometryUtils.merge(chassisgeom, cockpit);
    chassisgeom.computeVertexNormals();
    this.parts['chassis'] = new THREE.Mesh(chassisgeom, materials['chassis']);

    var axle = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 50), materials['wheels']);
    axle.rotation.z = Math.PI / 2;
    axle.rotation.y = Math.PI / 2;
    var tiregeom = new THREE.CylinderGeometry(10, 10, 5, 12);
    var tire = new THREE.Mesh(tiregeom, materials['wheels']);
    tire.rotation.x = Math.PI / 2;
    tire.position.z = -25;
    tire.position.y = 5;
    axle.position.y = 5;

    var backwheelgeom = new THREE.Geometry();
    THREE.GeometryUtils.merge(backwheelgeom, axle);
    THREE.GeometryUtils.merge(backwheelgeom, tire);
    tire.position.z = 25;
    THREE.GeometryUtils.merge(backwheelgeom, tire);

    this.parts['wheel_back'] = new THREE.Mesh(backwheelgeom, materials['wheels']);
    this.parts['wheel_back'].position.x = this.wheelbase / 2;


    this.add(this.parts['chassis']);
    this.add(this.parts['wheel_back']);

    var frontwheelgeom = new THREE.Geometry();
    THREE.GeometryUtils.merge(frontwheelgeom, axle);
    this.parts['wheel_front'] = new THREE.Mesh(frontwheelgeom, materials['wheels']);
    this.parts['wheel_front'].position.x = this.wheelbase / -2;
    var tire_left = new THREE.Mesh(tiregeom, materials['wheels']);
    var tire_right = new THREE.Mesh(tiregeom, materials['wheels']);
    tire_left.rotation.x = tire_right.rotation.x = Math.PI / 2;
    tire_left.position.set(0, 5, -25);
    tire_right.position.set(0, 5, 25);
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
    lightmesh.position.y = 20;
    lightmesh.position.z = -15;
    THREE.GeometryUtils.merge(lightpair, lightmesh);
    lightmesh.position.z = 15;
    THREE.GeometryUtils.merge(lightpair, lightmesh);
    this.parts['lights_front'] = new THREE.Mesh(lightpair, materials['headlights']);
    this.parts['lights_back'] = new THREE.Mesh(lightpair, materials['brakelights']);
    this.parts['lights_front'].position.x = -50;
    this.parts['lights_back'].position.x = 51;
    this.parts['chassis'].add(this.parts['lights_front']);
    this.parts['chassis'].add(this.parts['lights_back']);
    

    //frontwheel.position.x = this.wheelbase / -2;
    //this.add(frontwheel);
    //this.add(axle);
  }
  this.createDynamics = function() {
    this.dynamics = new elation.utils.physics.object({position: this.position, restitution: .8, radius: 0, drag: .4257, friction: this.friction, mass: 1000});
    this.rotation = this.dynamics.rot;
    elation.events.add([this.dynamics], "dynamicsupdate", this);
    //this.dynamics.setVelocity([0,0,5]);
    //this.dynamics.addForce("gravity", [0,-9800,0]);
    elation.utils.physics.system.add(this.dynamics);
  }
  this.handleEvent = function(ev) {
    if (typeof this[ev.type] == 'function') {
      this[ev.type](ev);
    }
  }
  this.select = function(ev) {
    console.log("get in!");
    elation.space.controls(0).activateContext("vehicle_car", this);
    if (!this.camera) {
      var viewsize = elation.space.fly(0).viewsize;
      this.camera = new THREE.PerspectiveCamera(50, viewsize[0] / viewsize[1], 5, 1e10);
      this.camera.position.set(150, 100, 0);
      this.camera.eulerOrder = "YZX";
      this.camera.rotation.set(-Math.PI / 8, Math.PI / 2, 0);
      this.add(this.camera);
    }
    
    elation.space.fly(0).attachCameraToObject(this.camera);
  }
  this.deselect = function(ev) {
    console.log("get out.");
    elation.space.controls(0).deactivateContext("vehicle_car");
    elation.space.fly(0).attachCameraToObject(false);
  }
  this.dynamicsupdate = function(ev) {
    this.getAngleFromSteer();
    this.updateParts();
  }
  this.init();
});
elation.space.meshes.car.prototype = new elation.space.thing();
elation.space.meshes.car.prototype.constructor = elation.space.meshes.car;
