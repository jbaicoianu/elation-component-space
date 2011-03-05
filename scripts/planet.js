elation.component.add("spacecraft.planet", {
  init: function(name, container, args) {
    var usewebgl = window.usewebgl;
    this.name = name;
    this.container = container;
    this.args = args;
    
    this.viewsize = this.getsize();
    //this.camera = new THREE.Camera(50, this.viewsize[0] / this.viewsize[1], 1, 10000);

    this.scene = new THREE.Scene();

    this.scene.addLight(new THREE.AmbientLight( 0x444444, .25));

    this.light = new THREE.PointLight( 0xcccccc, .8);
    this.light.position.x = -1e8;
    this.light.position.z = 1e8;
    this.scene.addLight(this.light);
  
    this.meshes = {};
    var startexture = ImageUtils.loadTexture( '/elation/images/space/galaxy_starfield.png' );
    this.meshes['skybox'] = new THREE.Mesh(new Sphere(1e9, 50, 50), new THREE.MeshBasicMaterial({ map: startexture }));
    this.meshes['skybox'].flipSided = true;
    this.scene.addObject(this.meshes['skybox']);

    this.camera = new THREE.QuakeCamera({fov: 50, aspect: this.viewsize[0] / this.viewsize[1], movementSpeed: (window.usewebgl ? .1 : 10), domElement: this.container, far: 1e10});
    this.camera.position.x = -100;
    this.renderer = (usewebgl ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer());
    this.renderer.setSize(this.viewsize[0], this.viewsize[1]);
    if (this.container) {
      this.container.appendChild(this.renderer.domElement);
    } else {
      document.body.appendChild(this.renderer.domElement);
    }

    this.loop();
    //elation.events.add(this.container, "mousedown,mousewheel", this);
    //elation.events.add(document,"keydown,keyup,keypress", this);
  },
  getsize: function() {
    if (this.container) {
      return [this.container.offsetWidth, this.container.offsetHeight];
    }
    return [window.innerWidth, window.innerHeight];
  },
  loop: function() {
    var newsize = this.getsize();
    if (this.viewsize[0] != newsize[0] || this.viewsize[1] != newsize[1]) {
      this.viewsize = newsize;
      this.renderer.setSize(this.viewsize[0], this.viewsize[1]);
      this.camera.aspect = this.viewsize[0] / this.viewsize[1];
      this.camera.updateProjectionMatrix();
    }
    //this.meshes['self'].rotation.y -= 0.002;
    this.renderer.render(this.scene, this.camera);
  },
  handleEvent: function(ev) {
    if (this[ev.type] && typeof this[ev.type] == 'function') { 
      this[ev.type](ev);
    }
  },
  mousedown: function(ev) {
    elation.events.add(document, "mousemove,mouseup", this);
    this.lastmousepos = [ev.clientX, ev.clientY]; 
  },
  mousemove: function(ev) {
    var delta = [this.lastmousepos[0] - ev.clientX, this.lastmousepos[1] - ev.clientY];
/*
    this.camera.rotation.x += delta[0];
    this.camera.rotation.y += delta[1];
*/
    this.lastmousepos = [ev.clientX, ev.clientY]; 
  },
  mouseup: function(ev) {
    elation.events.remove(document, "mousemove,mouseup", this);
  },
  keydown: function(ev) {
    var move = [0, 0, 0];
    switch (ev.keyCode) {
      case 87: // w
        move[2] = -1;
        break;
      case 65: // a
        move[0] = -1;
        break;
      case 83: // s
        move[2] = 1;
        break;
      case 68: // d
        move[0] = 1;
        break;
    }
    if (move[0] != 0 || move[1] != 0 || move[2] != 0) {
      this.camera.translateX(move[0] * 10);
      //this.camera.translateY(move[1] * 10);
      this.camera.translateZ(move[2] * 10);
      //this.camera.projectionMatrix.lookAt(this.meshes['self'].position, this.camera.position, new THREE.Vector3([0, 1, 0]));
    }
  },
  keyup: function(ev) {
  },
  mousewheel: function(ev) {
    var dist = this.camera.position.distanceTo(this.meshes['self'].position);
    var zoom = (ev.wheelDelta ? ev.wheelDelta : ev.detail * -30) / 4;
    var newpos = this.camera.position.z - zoom;
    if (newpos - this.meshes['self'].position.z - this.meshes['self'].geometry.boundingSphere.radius < 100) {
      newpos = this.meshes['self'].position.z + this.meshes['self'].geometry.boundingSphere.radius + 100;
    }
    this.camera.position.z = newpos;
  },
  addObject: function(obj) {
    this.scene.addObject(obj);
  }
});
