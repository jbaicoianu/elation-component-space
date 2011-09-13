elation.component.add("spacecraft.viewport", {
  init: function(name, container, args) {
    var usewebgl = window.usewebgl;
    this.name = name;
    this.container = container;
    this.args = args || {};
    this.scene = this.args.scene || new THREE.Scene();
    
    this.viewsize = this.getsize();

    // FIXME - lights should just be properties of objects like stars
    this.light = new THREE.PointLight( 0xffffff, .8);
    this.light.position.x = 1e8;
    this.light.position.z = 1e8;
    this.scene.addLight(this.light);
    this.scene.addLight(new THREE.AmbientLight( 0x444444, .25));
  
    this.meshes = {};
    var startexture = THREE.ImageUtils.loadTexture( '../images/space/galaxy_starfield.png' );
    if (this.args.skybox) {
      this.meshes['skybox'] = new THREE.Mesh(new THREE.SphereGeometry(1e19, 100, 100), new THREE.MeshBasicMaterial({ map: startexture }));
      this.meshes['skybox'].flipSided = true;
      this.scene.addObject(this.meshes['skybox']);
    }

    //this.camera = new THREE.QuatCamera({fov: 50, aspect: this.viewsize[0] / this.viewsize[1], movementSpeed: elation.spacecraft.controls(0).getValue("movespeed") || 12500, domElement: this.container, near: 1, far: 1e10, lookSpeed: .002});
    this.camera = new THREE.FlyCamera({fov: 50, aspect: this.viewsize[0] / this.viewsize[1], movementSpeed: elation.spacecraft.controls(0).getValue("movespeed") || 0.2, domElement: this.container, near: 1, far: 1e30, rollSpeed: Math.PI / 6, dragToLook: true});
//this.camera.matrixAutoUpdate = false;
    this.camera.position.x = 27000;
    this.camera.position.y = 10000;
    this.camera.position.z = 17000;
    this.renderer = (usewebgl ? new THREE.WebGLRenderer({ preserveDrawingBuffer: true }) : new THREE.CanvasRenderer());
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
    this.camera.update();
    this.renderer.render(this.scene, this.camera);
    this.stats.update();
  },
  handleEvent: function(ev) {
    if (this[ev.type] && typeof this[ev.type] == 'function') { 
      this[ev.type](ev);
    }
  },
  addObject: function(obj) {
    //this.meshes[obj.id] = obj;
    this.scene.addObject(obj);
  },
  setSpaceShader: function(shader) {
    if (this.meshes['skybox']) {
      if (shader instanceof THREE.MeshShaderMaterial) {
        this.meshes['skybox'].materials[0] = shader;
      } else {
        this.meshes['skybox'].materials[0] = new THREE.MeshShaderMaterial({uniforms: this.shaderuniforms, vertexShader: shader.vert, fragmentShader: shader.frag, blending: THREE.NormalBlending});
      }
    }
  }
});
