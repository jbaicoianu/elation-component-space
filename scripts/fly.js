elation.component.add('space.fly', {
  usewebgl: Detector.webgl,
  lights: {},
  materials: {},
  objects: {},
  camerapos: new THREE.Vector3(0,50,500),

  init: function() {
    this.viewsize = this.getsize();

    this.scene = this.args.scene || new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xCCE8FF, 0.000008);

    this.camera = new THREE.PerspectiveCamera(50, this.viewsize[0] / this.viewsize[1], 10, 1.5e15);
    this.camera.position = this.camerapos;
    this.scene.add(this.camera);

    elation.ui.hud.init();
    
    this.scene.add(this.camera);

    // TODO - light should just be a property of the sun...
    this.lights['white'] = new THREE.SpotLight( 0xffffff, 1, 50000);
    this.lights['white'].position.x = -10000;
    this.lights['white'].position.y = 10000;
    this.lights['white'].position.z = 10000;
    this.lights['white'].castShadow = true;

    this.lights['white'].shadowCameraNear = 700;
    this.lights['white'].shadowCameraFar = this.camera.far;
    this.lights['white'].shadowCameraFov = this.camera.fov;
 
    this.lights['white'].shadowBias = 0.00000001;
    this.lights['white'].shadowDarkness = 0.5;
    this.lights['white'].shadowMapWidth = 8192;
    this.lights['white'].shadowMapHeight = 8192;
 
    this.scene.add(this.lights['white']);

    //this.createSky(true);

    this.lights['ambient'] = new THREE.AmbientLight( 0x999999 );
    this.scene.add(this.lights['ambient']);

    this.initRenderer(); 
    this.initControls();

    this.addObjects(this.args.sector, this.scene);

    if (this.container) {
      this.container.appendChild(this.renderer.domElement);
    } else {
      document.body.appendChild(this.renderer.domElement);
    }
    this.stats = new Stats();
    this.stats.domElement.style.position = 'fixed';
    this.stats.domElement.style.top = '0px';
    this.stats.domElement.style.left = '0px';
    this.stats.domElement.style.zIndex = 100;
    this.container.appendChild( this.stats.domElement );

    this.projector = new THREE.Projector();
    this.mouse = [0,0];
    elation.events.add(this.container, 'mousemove', this);

    this.lastupdate = new Date().getTime();
    this.loop();
    if (elation.utils.physics) {
      setTimeout(function() { 
        elation.utils.physics.system.start();

        //elation.ui.hud.console.log('ready.');
        elation.ui.hud.radar.nextTarget();
      }, 500);
    }
    
    //elation.ui.hud.console.log('initializing, please wait...');
    this.createAdminTool();
  },
  initControls: function() {
    this.controlsenabled = true;
    /*
    this.controls = new THREE.TrackballControls( this.camera, this.renderer.domElement );
    this.controls.rotateSpeed = -1.0;
    this.controls.zoomSpeed = 4;
    this.controls.panSpeed = 3;

    this.controls.noZoom = false;
    this.controls.noPan = false;

    this.controls.staticMoving = true;
    this.controls.dynamicDampingFactor = 0.3;
    this.controls.keys = [ 65, 83, 68 ];
    */
    this.controls = elation.space.controls(0, this.renderer.domElement);

    // TODO - define some top-level bindings for accessing menus, etc
    //this.controls.addContext("default", {}});
    //this.controls.addBindings("default", {});
    //this.controls.activateContext("default", this);
  },
  initRenderer: function() {
    this.renderer = (this.usewebgl ? new THREE.WebGLRenderer({antialias: true, maxShadows: 10}) : new THREE.CanvasRenderer());
    this.renderer.setSize(this.viewsize[0], this.viewsize[1]);

    this.renderer.shadowMapEnabled = true;
    this.renderer.shadowMapSoft = true;

    this.renderer.autoClear = true;
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
    
    if (this.controls && this.controlsenabled) {
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

      this.renderer.render(this.scene, this.camera);
      this.lastupdate = ts;
    }
    
    elation.events.fire('renderframe_end', this);

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
    //this.controlsenabled = false;
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
  mousemove: function(ev) {
    this.mouse[0] = ( ev.clientX / this.viewsize[0] ) * 2 - 1;
    this.mouse[1] = ( ev.clientY / this.viewsize[1] ) * 2 - 1;
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
