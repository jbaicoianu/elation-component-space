elation.component.add('space.fly', {
  usewebgl: true,
  lights: {},
  materials: {},
  objects: {},

  init: function() {
    this.viewsize = this.getsize();

    //this.camera = new THREE.FlyCamera({fov: 50, aspect: this.viewsize[0] / this.viewsize[1], movementSpeed: 200, domElement: this.container, near: 1, far: 1e4, rollSpeed: Math.PI / 6, dragToLook: true});
    this.camera = new THREE.Camera( 50, this.viewsize[0] / this.viewsize[1], 1, 100000 );

    this.scene = this.args.scene || new THREE.Scene();

    this.camera.position.x = 0;
    this.camera.position.y = 0;
    this.camera.position.z = 0;

    this.lights['white'] = new THREE.PointLight( 0xffffff, 1, 200000);
    this.lights['white'].position.x = 10000;
    this.lights['white'].position.y = 10000;
    this.lights['white'].position.z = 10000;
    this.scene.addLight(this.lights['white']);

    this.objects['thingy'] = new elation.shitplop();
    this.objects['thingy'].setPosition([-200, 0, 0]);
    this.scene.addObject(this.objects['thingy'].mesh);

    this.camera.position = this.objects['thingy'].mesh.position;
    this.camera.rotation = this.objects['thingy'].mesh.rotation;
    this.camera.quaternion = this.objects['thingy'].mesh.quaternion;
    this.camera.useTarget = false;
    this.camera.useQuaternion = true;

    this.addObjects(this.args.sector, this.scene);

    this.renderer = (this.usewebgl ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer());
    this.renderer.setSize(this.viewsize[0], this.viewsize[1]);

    if (this.container) {
      this.container.appendChild(this.renderer.domElement);
    } else {
      document.body.appendChild(this.renderer.domElement);
    }
    this.stats = new Stats();
    this.stats.domElement.style.position = 'fixed';
    this.stats.domElement.style.bottom = '0px';
    this.stats.domElement.style.right = '0px';
    this.stats.domElement.style.zIndex = 100;
    this.container.appendChild( this.stats.domElement );

    this.loop();
  },
  getsize: function() {
    if (this.container) {
      this.container.style.height = window.innerHeight + 'px';
      return [this.container.offsetWidth, this.container.offsetHeight];
    }
    return [window.innerWidth, window.innerHeight];
  },
  loop: function() {
    (function(self) {
      requestAnimationFrame( function() { self.loop(); } );
    })(this);

    var newsize = this.getsize();
    if (this.viewsize[0] != newsize[0] || this.viewsize[1] != newsize[1]) {
      this.viewsize = newsize;
      this.renderer.setSize(this.viewsize[0], this.viewsize[1]);
      this.camera.aspect = this.viewsize[0] / this.viewsize[1];
      this.camera.updateProjectionMatrix();
    }
    this.objects['thingy'].update();
    //this.camera.update();
    this.renderer.render(this.scene, this.camera);
    this.stats.update();
  },
  addObjects: function(thing, root) {
/*
    this.lights['red'] = new THREE.PointLight( 0xff0000, .5, 25000);
    this.lights['red'].position.x = -5000;
    this.lights['red'].position.y = 2500;
    this.lights['red'].position.z = 5000;
    this.scene.addLight(this.lights['red']);

    this.lights['green'] = new THREE.PointLight( 0x00ff00, .5, 25000);
    this.lights['green'].position.x = 5000;
    this.lights['green'].position.y = 2500;
    this.lights['green'].position.z = 5000;
    this.scene.addLight(this.lights['green']);

    this.lights['blue'] = new THREE.PointLight( 0x0000ff, .5, 25000);
    this.lights['blue'].position.x = 5000;
    this.lights['blue'].position.y = 2500;
    this.lights['blue'].position.z = -5000;
    this.scene.addLight(this.lights['blue']);
*/
/*
    this.lights['yellow'] = new THREE.PointLight( 0xffff00, .25, 25000);
    this.lights['yellow'].position.x = -5000;
    this.lights['yellow'].position.y = 2500;
    this.lights['yellow'].position.z = -5000;
    this.scene.addLight(this.lights['yellow']);
*/

/*
    this.objects['cube'] = new THREE.Mesh( new THREE.CubeGeometry(15000, 5000, 15000, 20, 10, 20, this.materials['cube'], true), [new THREE.MeshPhongMaterial({color: 0xffffff}), new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true, transparent: true, opacity: 0.1})]); 
    this.objects['cube'].position.x = 0;
    this.objects['cube'].position.y = 2500;
    this.objects['cube'].position.z = 0;
    this.objects['cube'].doubleSided = true;
    this.scene.addObject(this.objects['cube']);
*/
/*
 this.objects['cube'].rotation.x = Math.random() * 180;
 this.objects['cube'].rotation.y = Math.random() * 180;
 this.objects['cube'].rotation.z = Math.random() * 180;
*/

/*
    this.objects['sphere'] = new THREE.Mesh(new THREE.SphereGeometry(50, 20, 20), new THREE.MeshPhongMaterial({color: 0xffffff}));
    this.objects['sphere'].position.x = 100;
    this.objects['sphere'].position.y = 0;
    this.objects['sphere'].position.z = 0;
    this.scene.addObject(this.objects['sphere']);
*/
    var currentobj = false;
    switch (thing.type) {
      case 'sector':
        currentobj = new THREE.Mesh( new THREE.PlaneGeometry( 100000, 100000, 10, 10 ), new THREE.MeshPhongMaterial( { color: 0xfee8d6 } ) );
        currentobj.position.y = -100;
        currentobj.rotation.x = -90 * (Math.PI / 180);
        currentobj.rotation.y = 0;
        currentobj.rotation.z = 0;
        break;
      case 'road':
        console.log("road:", thing);
        if (thing.properties && thing.properties.path) {
          var linegeom = new THREE.Geometry();
          var first = true;

          var segments = [];
          for (var k in thing.properties.path) {
            segments.push(k);
          }
          segments.sort();
          for (var i = 0; i < segments.length - 1; i++) {
/*
            var k = segments[i];
            var vert = new THREE.Vertex(new THREE.Vector3(thing.properties.path[k][0], thing.properties.path[k][1], thing.properties.path[k][2]));
            linegeom.vertices.push(vert);
            if (!first) {
              linegeom.vertices.push(vert);
            }
            first = false;
*/
            var start = new THREE.Vector3(thing.properties.path[segments[i]][0],thing.properties.path[segments[i]][1],thing.properties.path[segments[i]][2]);
            var end = new THREE.Vector3(thing.properties.path[segments[i+1]][0],thing.properties.path[segments[i+1]][1],thing.properties.path[segments[i+1]][2]);
            var diff = start.clone();
diff.addSelf(end);
            var side = diff.clone().crossSelf(new THREE.Vector3(0,0,1)).normalize().multiplyScalar(thing.properties.physical.width || 10);
console.log('start', start, 'end', end, 'diff', diff, 'side', side);
            linegeom.vertices.push(new THREE.Vertex(start.clone().addSelf(side)));
            linegeom.vertices.push(new THREE.Vertex(end.clone().addSelf(side)));
            linegeom.vertices.push(new THREE.Vertex(start.clone().addSelf(side.multiplyScalar(-1))));
            linegeom.vertices.push(new THREE.Vertex(end.clone().addSelf(side)));
          } 
          currentobj = new THREE.Line(linegeom, new THREE.LineBasicMaterial({ color: 0x000000, linewidth: thing.properties.physical.width || 10}), THREE.LinePieces);
        }
        break;
      case 'building':
        console.log('building:', thing);
        if (thing.properties && thing.properties.physical && thing.properties.physical.position) {
          if (thing.properties.render && thing.properties.render.mesh) {
            (function(thing, root) {
              var loader = new THREE.JSONLoader();
              loader.load( { model: thing.properties.render.mesh, callback: function( geometry ) { 
                console.log('cool shit', geometry); 
geometry.computeCentroids();
geometry.computeVertexNormals();
geometry.computeFaceNormals();
                var currentobj = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial({color: 0xffffff}));
                currentobj.position.x = thing.properties.physical.position[0];
                currentobj.position.y = thing.properties.physical.position[1];
                currentobj.position.z = thing.properties.physical.position[2] + 20;
currentobj.rotation.x = 90 * (Math.PI / 180)
currentobj.scale.x = 30;
currentobj.scale.y = 30;
currentobj.scale.z = 30;
//currentobj.doubleSided = true;
                root.addChild(currentobj);
              } } );
            })(thing, root);
          } else {
            var buildingsize = thing.properties.physical.size || [1000, 1000, 500];
            var newgeom = new THREE.CubeGeometry(buildingsize[0], buildingsize[1], buildingsize[2], 10, 5, 10)
            currentobj = new THREE.Mesh( newgeom, [new THREE.MeshPhongMaterial({color: 0xcccccc}), new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true, transparent: true, opacity: 0.1})]); 
            currentobj.position.x = thing.properties.physical.position[0];
            currentobj.position.y = thing.properties.physical.position[1];
            currentobj.position.z = thing.properties.physical.position[2];
          }
        }
        break;
      case 'drone':
        //console.log('cool, a drone', thing);
        currentobj = new elation.space.drone(thing);
        break;
      default:
        console.log("dunno wtf:", thing);
    }
    if (currentobj) {
console.log(root, currentobj);
      root.addChild(currentobj);

      if (thing.things) {
        for (var k in thing.things) {
          this.addObjects(thing.things[k], currentobj);
        }
      }
    }
    
  }
});
elation.extend("shitplop", function() {
  this.geometry = new THREE.SphereGeometry(50, 20, 20);
  this.material = new THREE.MeshPhongMaterial({color: 0xffffff});
  this.mesh = new THREE.Mesh(this.geometry, this.material);
  this.strength = 35000;
  this.moveVector = new THREE.Vector3(0,0,0);
  this.rotationVector = new THREE.Vector3(0,0,0);
  this.tmpQuaternion = new THREE.Quaternion();
  this.mesh.useQuaternion = true;

  this.mouseStatus = 0;
  this.moveState = { up: 0, down: 0, left: 0, right: 0, forward: 0, back: 0, pitchUp: 0, pitchDown: 0, yawLeft: 0, yawRight: 0, rollLeft: 0, rollRight: 0 };

  (function(self) {
    self.dynamics = new elation.utils.dynamics(self, {
      onmove: function(a) { self.respond(); },
      drag:0.1,
      mass: 1
    });
  })(this);
//this.dynamics.setVelocityY(10);
console.log(this.dynamics);
  this.lastupdate = new Date().getTime();
  elation.events.add(document, 'keydown,keyup,mousedown,mousemove,mouseup', this);
  this.dragToLook = true;

  this.setPosition = function(pos) {
    this.mesh.position.x = pos[0];
    this.mesh.position.y = pos[1];
    this.mesh.position.z = pos[2];
    this.dynamics.setPosition(pos);
  }
  this.update = function() {
    var ts = new Date().getTime();
    if (ts > this.lastupdate) {
      this.dynamics.iterate((ts - this.lastupdate) / 1000);
    }
    this.lastupdate = ts;
    if (this.mesh.position.y < 0) {
      this.mesh.position.y = 0;
      this.dynamics.removeForce('gravity');
      this.dynamics.setVelocityY(0);
      this.dynamics.setFriction(250);
    } else {
      this.dynamics.addForce('gravity', [0, -9800 * 2, 0]);
      this.dynamics.setFriction(0);
    }
  }
  this.respond = function() {
    this.mesh.position.x = this.dynamics.pos.e(1);
    this.mesh.position.y = this.dynamics.pos.e(2);
    this.mesh.position.z = this.dynamics.pos.e(3);

  }
  this.rotateRel = function(rot) {
    var rel = new THREE.Vector3(rot.e(1), rot.e(2), rot.e(3));
    //this.mesh.rotation.rotateAxis(rel);
    //this.mesh.rotation.addSelf(rel);
    var rotMult = .5;
		this.tmpQuaternion.set( rot.e(1) * rotMult, rot.e(2) * rotMult, rot.e(3) * rotMult, 1 ).normalize();
		this.mesh.quaternion.multiplySelf( this.tmpQuaternion );
		this.mesh.matrix.setRotationFromQuaternion( this.mesh.quaternion );
		this.mesh.matrixWorldNeedsUpdate = true;
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
      this.dynamics.addForce("thrusters", this.mesh.matrix.multiplyVector3(this.moveVector.multiplyScalar(this.strength)));
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
});
