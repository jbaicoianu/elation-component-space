elation.component.add('space.fly', {
  usewebgl: Detector.webgl,
  lights: {},
  materials: {},
  objects: {},
  camerapos: new THREE.Vector3(0,50,500),

  init: function() {
    elation.space.controller = this;
    this.viewsize = this.getsize();
    console.log('### SECTOR', this);
    /*
    this.scene = this.args.scene || new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xCCE8FF, 0.000008);

    this.camera = new THREE.FirstPersonCamera(50, this.viewsize[0] / this.viewsize[1], 10, 1.5e15);
    this.camera.position = this.camerapos;
    this.scene.add(this.camera);
    */
    var HUD = elation.utils.arrayget(this.args, 'sector.properties.render.hud').split(',');
    
    this.initRenderer(); 
    this.initScene();
    this.initControls();
    this.initObserver();
    this.initLights();

    elation.ui.hud.init(HUD);

    this.addObjects(this.args.sector, this.scene);

    this.stats = new Stats();
    this.stats.domElement.style.position = 'fixed';
    this.stats.domElement.style.top = '0px';
    this.stats.domElement.style.left = '0px';
    this.stats.domElement.style.zIndex = 100;
    this.container.appendChild( this.stats.domElement );

    this.lastupdate = new Date().getTime();
    this.loop();
    if (elation.utils.physics) {
      setTimeout(function() { 
        elation.utils.physics.system.start();

        //elation.ui.hud.console.log('ready.');
        //elation.ui.hud.radar.nextTarget();
      }, 500);
    }
    
    //elation.ui.hud.console.log('initializing, please wait...');
    this.createAdminTool();
  },
  initScene: function() {
    this.scene = this.args.scene || new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xCCE8FF, 0.000008);
  },
  initLights: function() {
    // TODO - light should just be a property of the sun...
    //this.lights['white'] = new THREE.SpotLight( 0xffffff, 1, 50000);
    this.lights['white'] = new THREE.DirectionalLight( 0xffffff, 1, 50000);
    this.lights['white'].position.x = -5000;
    this.lights['white'].position.y = 50000;
    this.lights['white'].position.z = 50000;
    this.lights['white'].castShadow = true;

    this.lights['white'].shadowCameraNear = 20;
    this.lights['white'].shadowCameraFar = 1.5e15;
    this.lights['white'].shadowCameraFov = 50;
 
    this.lights['white'].shadowBias = 0;
    this.lights['white'].shadowDarkness = 0.5;
    this.lights['white'].shadowMapWidth = 4096;
    this.lights['white'].shadowMapHeight = 4096;
 
    this.scene.add(this.lights['white']);

    this.lights['ambient'] = new THREE.AmbientLight( 0x999999 );
    //this.scene.add(this.lights['ambient']);
  },
  initControls: function() {
    this.controls = elation.space.controls(0, this.renderer.domElement);

    // TODO - define some top-level bindings for accessing menus, etc
    //this.controls.addContext("default", {}});
    //this.controls.addBindings("default", {});
    //this.controls.activateContext("default", this);
  },
  initObserver: function() {
    /*
    this.camera = new THREE.PerspectiveCamera(50, this.viewsize[0] / this.viewsize[1], 10, 1.5e15);
    this.camera.position = this.camerapos;
    this.scene.add(this.camera);
    */
    this.observer = new elation.space.meshes.observer();
    this.observer.position.copy(this.camerapos);
    this.scene.add(this.observer);
    this.controls.activateContext("observer", this.observer);
    this.attachCameraToObject(this.observer.camera);
  },
  initRenderer: function() {
    this.renderer = (this.usewebgl ? new THREE.WebGLRenderer({antialias: true, maxShadows: 10, maxLights: 4}) : new THREE.CanvasRenderer());
    this.renderer.setSize(this.viewsize[0], this.viewsize[1]);

    this.renderer.shadowMapEnabled = true;
    this.renderer.shadowMapSoft = true;
    this.renderer.shadowMapCullFrontFaces = true;

    this.renderer.autoClear = true;

    if (this.container) {
      this.container.appendChild(this.renderer.domElement);
    } else {
      document.body.appendChild(this.renderer.domElement);
    }
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
    var ts = new Date().getTime();
    
    this.lastupdatedelta = (ts - this.lastupdate) / 1000;
    
    elation.events.fire('renderframe_start', this);
    
    if (this.controls) {
      this.controls.update();
    }
    if (elation.utils.physics) {
      elation.utils.physics.system.iterate(this.lastupdatedelta);
    }
    if (this.camera) {
      if (this.viewsize[0] != newsize[0] || this.viewsize[1] != newsize[1]) {
        this.viewsize = newsize;
        this.renderer.setSize(this.viewsize[0], this.viewsize[1]);
        this.camera.aspect = this.viewsize[0] / this.viewsize[1];
        this.camera.updateProjectionMatrix();
      }

      var camera = this.camera;
      if (elation.space.meshes.terrain2) {
        THREE.SceneUtils.traverseHierarchy( this.scene, function ( node ) { if ( node instanceof elation.space.meshes.terrain2 ) node.updateViewport( camera ) } );
      }

    elation.events.fire('renderframe_end', this);
      this.renderer.render(this.scene, this.camera);
      this.lastupdate = ts;
    }
    

    this.stats.update();
  },
  addObjects: function(thing, root) {
    var currentobj = false;
    if (typeof elation.space.meshes[thing.type] == 'function') {
      currentobj = new elation.space.meshes[thing.type](thing);
      if (currentobj.properties && currentobj.properties.physical && currentobj.properties.physical.exists !== 0) {
        root.add(currentobj);

        console.log("Added new " + thing.type + ": " + thing.parentname + '/' + thing.name, currentobj);
        if (thing.things) {
          for (var k in thing.things) {
            this.addObjects(thing.things[k], currentobj);
          }
        }
      }
    } else {
      console.log("don't know how to handle thing type '" + thing.type + "'", thing);
    }
  },
  attachCameraToObject: function(thing, nosave) {
    //this.camera = this.followcamera;
    if (thing instanceof THREE.Camera) {
      if (!nosave) {
        this.oldcamera = this.camera;
      }
      this.camera = thing;
    } else if (thing) {
      this.camera.position = thing.position;
      this.camera.rotation = thing.rotation;
      this.camera.quaternion = thing.quaternion;
      this.camera.useTarget = false;
      this.camera.useQuaternion = true;
    } else {
      if (this.oldcamera) {
        this.camera = this.oldcamera;
      }
    }
    this.camerapos = this.camera.position;
    if (elation.ui.hud && elation.ui.hud.radar) {
      elation.ui.hud.radar.setCamera(this.camera);
    }
  },
  createAdminTool: function() {
    var div = elation.html.create({tag: 'div', classname: "space_world_admin"});
    var component = elation.space.admin("admin", div);
    this.container.appendChild(div);
  }
});
/* Placeholder for simple universe mesh */
elation.extend("space.meshes.universe", function() {
});
elation.space.meshes.universe.prototype = new elation.space.thing;
