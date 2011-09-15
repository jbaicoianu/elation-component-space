elation.component.add('space.fly', {
  usewebgl: true,
  lights: {},
  materials: {},
  objects: {},

  init: function() {
    this.viewsize = this.getsize();

    //this.camera = new THREE.FlyCamera({fov: 50, aspect: this.viewsize[0] / this.viewsize[1], movementSpeed: 200, domElement: this.container, near: 1, far: 1e4, rollSpeed: Math.PI / 6, dragToLook: true});

    this.scene = this.args.scene || new THREE.Scene();

    this.camera = new THREE.Camera( 50, this.viewsize[0] / this.viewsize[1], 1, 100000 );

    // TODO - light should just be a property of the sun...
    this.lights['white'] = new THREE.SpotLight( 0xfffffff, 1, 200000);
    this.lights['white'].position.x = -10000;
    this.lights['white'].position.y = 10000;
    this.lights['white'].position.z = -10000;
    this.lights['white'].castShadow = true;
    this.scene.addLight(this.lights['white']);

    this.lights['ambient'] = new THREE.AmbientLight( 0x444444 );
    this.scene.addLight(this.lights['ambient']);

    this.addObjects(this.args.sector, this.scene);

    this.renderer = (this.usewebgl ? new THREE.WebGLRenderer({maxShadows: 10}) : new THREE.CanvasRenderer());
    this.renderer.setSize(this.viewsize[0], this.viewsize[1]);

    this.renderer.shadowCameraNear = 15;
    this.renderer.shadowCameraFar = this.camera.far;
    this.renderer.shadowCameraFov = 50;
 
    //this.renderer.shadowMapBias = 0.0039;
    //this.renderer.shadowMapDarkness = 0.5;
    this.renderer.shadowMapWidth = 8192;
    this.renderer.shadowMapHeight = 8192;
 
    this.renderer.shadowMapEnabled = true;
    this.renderer.shadowMapSoft = true;

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
    if (this.camera) {
      if (this.viewsize[0] != newsize[0] || this.viewsize[1] != newsize[1]) {
        this.viewsize = newsize;
        this.renderer.setSize(this.viewsize[0], this.viewsize[1]);
        this.camera.aspect = this.viewsize[0] / this.viewsize[1];
        this.camera.updateProjectionMatrix();
      }
      this.renderer.render(this.scene, this.camera);
    }
    this.stats.update();
  },
  addObjects: function(thing, root) {
    var currentobj = false;
    if (typeof elation.space.meshes[thing.type] == 'function') {
      currentobj = new elation.space.meshes[thing.type](thing.properties);
      root.addChild(currentobj);

      console.log("Added new " + thing.type + " '" + thing.name + "'", currentobj);
      if (thing.things) {
        for (var k in thing.things) {
          this.addObjects(thing.things[k], currentobj);
        }
      }
    } else {
      console.log("don't know how to handle thing type '" + thing.type + "'", thing);
    }
  },
  attachCameraToObject: function(thing) {
    this.camera.position = thing.position;
    this.camera.rotation = thing.rotation;
    this.camera.quaternion = thing.quaternion;
    this.camera.useTarget = false;
    this.camera.useQuaternion = true;
  }
});
