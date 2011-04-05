elation.component.add("spacecraft.planet", {
  init: function(name, container, args) {
    var usewebgl = window.usewebgl;
    this.name = name;
    this.container = container;
    this.args = args;
    
    this.viewsize = this.getsize();
    //this.camera = new THREE.Camera(50, this.viewsize[0] / this.viewsize[1], 1, 10000);

    this.scene = new THREE.Scene();
    //this.scene.fog = new THREE.FogExp2( 0xefd1b5, 0);

    this.scene.addLight(new THREE.AmbientLight( 0x444444, .25));

    this.light = new THREE.PointLight( 0xffffff, .8);
    this.light.position.x = 1e8;
    this.light.position.z = 1e8;
    this.scene.addLight(this.light);
  
    this.meshes = {};
    var startexture = ImageUtils.loadTexture( '/elation/images/space/galaxy_starfield.png' );
    this.meshes['skybox'] = new THREE.Mesh(new Sphere(1e9, 5, 5), new THREE.MeshBasicMaterial({ map: startexture }));
    this.meshes['skybox'].flipSided = true;
    this.scene.addObject(this.meshes['skybox']);

    //this.camera = new THREE.QuakeCamera({fov: 50, aspect: this.viewsize[0] / this.viewsize[1], movementSpeed: elation.spacecraft.controls(0).getValue("movespeed") * (window.usewebgl ? 1 : 10), domElement: this.container, near: 1, far: 1e10});
    this.camera = new THREE.QuatCamera({fov: 50, aspect: this.viewsize[0] / this.viewsize[1], movementSpeed: elation.spacecraft.controls(0).getValue("movespeed") || 12500, domElement: this.container, near: 1, far: 1e10, lookSpeed: .002});
    //this.camera.position.x = 17000;
    this.camera.position.x = 27000;
    this.camera.position.y = 10000;
    this.camera.position.z = 17000;
    //this.camera.lookAt(new THREE.Vector3(0, 1, 0));
    //this.camera.matrix.rotateAxis(new THREE.Vector3(0, 100, 0));
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
    this.renderer.render(this.scene, this.camera);
  },
  handleEvent: function(ev) {
    if (this[ev.type] && typeof this[ev.type] == 'function') { 
      this[ev.type](ev);
    }
  },
  addObject: function(obj) {
    //this.meshes[obj.id] = obj;
    this.scene.addObject(obj);
  }
});
