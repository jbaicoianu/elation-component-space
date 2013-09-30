elation.component.add('space.starbinger', {
  usewebgl: Detector.webgl,
  lights: {},
  materials: {},
  objects_array: [],
  objects: {},
  camerapos: new THREE.Vector3(0,0,0),
  camnewpos: new THREE.Vector3(0,0,0),

  init: function() {
    this.dustCount = 5000;
    this.dustDiameter = 2200;
    this.dustRadius = this.dustDiameter / 2;
    this.dustSize = 2;
    
    elation.space.controller = this;
    this.viewsize = this.getsize();

    this.scene = this.args.scene || new THREE.Scene();
    this.sceneCube = new THREE.Scene();
    //this.scene.fog = new THREE.FogExp2(0xCCE8FF, 0.0000008);
    
    this.camera = new THREE.PerspectiveCamera(50, this.viewsize[0] / this.viewsize[1], 1, 1.5e15);
    this.tcamsize = [ 512, 512 ];
    //this.targetcam = new THREE.OrthographicCamera(w / -2, w / 2, h / 2, h / -2, -256, 512);
    this.targetcam = new THREE.PerspectiveCamera(30, this.tcamsize[0] / this.tcamsize[1], .1, 256);
    this.cameraCube = new THREE.PerspectiveCamera(50, this.viewsize[0] / this.viewsize[1], 1, 100);
    elation.events.add(window,'resize',this);
    this.camera.position = this.camerapos;
    this.scene.add(this.camera);
    this.scene.add(this.targetcam);
    this.sceneCube.add(this.cameraCube);    
    
    this.initRenderer(); 
    this.initControls();
    
    var HUD = elation.utils.arrayget(this.args, 'sector.properties.render.hud').split(',');
    elation.ui.hud.init(HUD, this);
    
    this.addObjects(this.args.sector, this.scene);

    if (this.container) {
      this.container.appendChild(this.renderer.domElement);
    } else {
      document.body.appendChild(this.renderer.domElement);
    }
    
    this.stats = new Stats();
    this.stats.domElement.style.position = 'fixed';
    this.stats.domElement.style.bottom = '0px';
    this.stats.domElement.style.left = '0px';
    this.stats.domElement.style.zIndex = 100;
    this.container.appendChild( this.stats.domElement );

    this.projector = new THREE.Projector();
    this.mouse = [0,0];
    elation.events.add(this.container, 'mousemove', this);

    this.lastupdate = new Date().getTime();
    this.loop();
    if (elation.utils.physics) {
      elation.utils.physics.system.setController(this);
      setTimeout(function() { 
        elation.utils.physics.system.start();
        //elation.ui.hud.target.list.nextTarget();
      }, 500);
    }
    
    //elation.ui.hud.console.log('initializing, please wait...');
    //this.createAdminTool();
    //elation.space.thing.setController = this;
    
    this.addSkybox();
    this.addDust();
    
    elation.ui.hud.console.log('');
    elation.ui.hud.console.log('Movement: <p>W</p>,<p>S</p> | Strafing: <p>A</p>,<p>D</p>,<p>R</p>,<p>F</p> | Rolling: <p>Q</p>,<p>E</p> | Targeting: <p>SCROLL</p>');
    elation.ui.hud.console.log('Fire: <p>Mouse0</p> | Afterburner: <p>X</p>,<p>Mouse2</p> | Boost: <p>Mouse1</p> | Brake: <p>SHIFT</p>');
    elation.ui.hud.console.log('Firing Mode: <p>G</p> | Change Weapon: <p>1-4</p> | Switch Flight Mode: <p>C</p>');
  },
  resize: function(event) {
    this.viewsize = this.getsize();
		this.camera.aspect = this.viewsize[0] / this.viewsize[1];
		this.targetcam.aspect = this.tcamsize[0] / this.tcamsize[1];
		this.cameraCube.aspect = this.viewsize[0] / this.viewsize[1];
		this.camera.updateProjectionMatrix();
		this.targetcam.updateProjectionMatrix();
		this.cameraCube.updateProjectionMatrix();

		this.renderer.setSize( this.viewsize[0], this.viewsize[1] );

    //this.camera = new THREE.PerspectiveCamera(50, this.viewsize[0] / this.viewsize[1], 1, 1.5e15);
    //this.cameraCube = new THREE.PerspectiveCamera(50, this.viewsize[0] / this.viewsize[1], 1, 100);
  },
  addSkybox: function() {
    var texture = THREE.ImageUtils.loadTexture( '/~lazarus/elation/images/space/galaxy_starfield.png');
    texture.repeat.y = 1;
    texture.repeat.x = .5;
    var material = new THREE.MeshBasicMaterial({ map: texture, depthWrite: false });
    var materialArray = material;
    var skyboxGeom = new THREE.CubeGeometry(100, 100, 100);
    
    this.skybox = new THREE.Mesh(skyboxGeom, materialArray);
    this.skybox.flipSided = true;
    this.skybox.position = this.cameraCube.position;
    
    this.sceneCube.add(this.skybox);
    this.renderer.autoClear = false;
    this.cameraCube.useQuaternion = true;
  },
  r: function(min, max) {
    var rand = Math.random(),
        value = (max - min) * rand + min;
    
    return Math.round(value);
  },
  addDust: function() {
    // create the particles
    this.dustParticles = new THREE.Geometry();
    
    var pMaterial = new THREE.ParticleBasicMaterial({
          size: this.dustSize,
          map: THREE.ImageUtils.loadTexture(
            "/~lazarus/elation/images/space/particle.png"
          ),
          blending: THREE.AdditiveBlending,
          depthTest: true,
          depthWrite: false,
          vertexColors: true,
          opacity: .85,
          transparent: true
        });
    
    for (var p = 0; p < this.dustCount; p++) {
      var ppos = new THREE.Vector3(
            this.camera.position.x + Math.random() * this.dustDiameter - this.dustRadius,
            this.camera.position.y + Math.random() * this.dustDiameter - this.dustRadius,
            this.camera.position.z + Math.random() * this.dustDiameter - this.dustRadius
          );
      
      if (this.camera.position.distanceTo(ppos) <= this.dustRadius) {
        particle = new THREE.Vertex(ppos);
        this.dustParticles.vertices.push(particle);
      }
    }
    
    for(var colors=[],i=0; i < this.dustParticles.vertices.length; i++) {
      colors[i] = new THREE.Color();
      colors[i].setHSV(Math.random(), .4, 1);
    }
    
    this.dustParticles.colors = colors;
    this.dustSystem = new THREE.ParticleSystem(this.dustParticles, pMaterial);
    this.dustSystem.sortParticles = false;
    this.scene.add(this.dustSystem);
  },
  initControls: function() {
    this.controlsenabled = true;
    this.controls = elation.space.controls(0, this.renderer.domElement);

    // TODO - define some top-level bindings for accessing menus, etc
    //this.controls.addContext("default", {}});
    //this.controls.addBindings("default", {});
    //this.controls.activateContext("default", this);
  },
  initRenderer: function() {
    this.renderer = (this.usewebgl ? new THREE.WebGLRenderer({ clearColor: 0x000000, clearAlpha: 1, antialias: true, maxShadows: 1000}) : new THREE.CanvasRenderer());
    this.renderer.setSize(this.viewsize[0], this.viewsize[1]);
    this.altrenderer = new THREE.WebGLRenderTarget( this.tcamsize[0], this.tcamsize[1], { format: THREE.RGBFormat } );
    this.renderer.shadowMapEnabled = true;
    this.renderer.shadowMapSoft = true;
    this.renderer.shadowMapType = THREE.BasicShadowMap;

    //this.renderer.sortObjects = false;
    this.renderer.autoClear = false;
  },
  getsize: function() {
    if (this.container) {
      this.container.style.height = window.innerHeight + 'px';
      return [this.container.offsetWidth, this.container.offsetHeight];
    }
    return [window.innerWidth, window.innerHeight];
  },
  loop: function(ev) {
    this.campos = new THREE.Vector3(
      this.camera.position.x,
      this.camera.position.y,
      this.camera.position.z
    );
    (function(self) {
      requestAnimationFrame( function() { self.loop(ev); } );
    })(this);
  
    this.newsize = newsize = this.getsize();
    var ts = new Date().getTime();
    
    this.renderer.setViewport(0, 0, this.newsize[0], this.newsize[1]);
    this.lastupdatedelta = (ts - this.lastupdate) / 1000;
    
    elation.events.fire('renderframe_start', this);
    
    if (this.controls && this.controlsenabled) {
      this.controls.update();
    }
    
    if (elation.utils.physics) {
      elation.utils.physics.system.iterate(this.lastupdatedelta);
    }
    
    //elation.events.fire('renderframe_middle', this);
    
    if (this.dustSystem) {
      var pCount = this.dustCount,
          ship = this.objects.player.Player,
          particle;
      
      while (pCount--) {
        particle = this.dustParticles.vertices[pCount];
        
        if (particle && this.camera.position.distanceTo(particle.position) > this.dustRadius) {
          particle.position = ship.matrixWorld.multiplyVector3(new THREE.Vector3(
            Math.random() * this.dustDiameter - this.dustRadius,
            Math.random() * this.dustDiameter - this.dustRadius,
            Math.random() * this.dustDiameter - this.dustRadius
          ));
          
          particle.color = '0xFFAA00';
        }
      }
      
      this.dustSystem.geometry.__dirtyVertices = true;
    }
    
    if (this.camera) {
      if (this.viewsize[0] != newsize[0] || this.viewsize[1] != newsize[1]) {
        this.viewsize = newsize;
        this.renderer.setSize(this.viewsize[0], this.viewsize[1]);
        this.camera.aspect = this.viewsize[0] / this.viewsize[1];
        this.targetcam.aspect = this.tcamsize[0] / this.tcamsize[1];
        this.camera.updateProjectionMatrix();
        this.targetcam.updateProjectionMatrix();
      }
      
			this.cameraCube.quaternion.copy( this.camera.quaternion );
      
      this.renderer.clear();
      this.renderer.render(this.sceneCube, this.cameraCube);
      this.renderer.render(this.scene, this.targetcam, this.altrenderer, true);
      this.renderer.render(this.scene, this.camera);

    }
    
    elation.events.fire('renderframe_end', this);

    this.stats.update();
    this.lastupdate = ts;
    this.camnewpos = new THREE.Vector3(
      this.camera.position.x,
      this.camera.position.y,
      this.camera.position.z
    );
    var diff = this.camvector = new THREE.Vector3(
      this.campos.x - this.camnewpos.x,
      this.campos.y - this.camnewpos.y,
      this.campos.z - this.camnewpos.z
    );
  },
  clearScene: function(root) {
    root = root || this.scene;
    
    for (var i=0; i<this.objects_array.length; i++) {
      root.remove(this.objects_array[i]);
    }
  },
  addObjects: function(thing, root) {
    var currentobj = false;
    if (typeof elation.space.meshes[thing.type] == 'function') {
      currentobj = new elation.space.meshes[thing.type](thing, this);
      if (elation.utils.arrayget(currentobj, 'properties.physical.exists') !== 0) {
        console.log("-!- Engine.Objects: Added new " + thing.type + ": " + thing.parentname + '/' + thing.name);
        this.objects_array.push(currentobj);
        root.add(currentobj);

        if (thing.things) {
          for (var k in thing.things) {
            this.addObjects(thing.things[k], currentobj);
          }
        }
        
        if (!this.objects[thing.type])
          this.objects[thing.type] = {};
        
        this.objects[thing.type][currentobj.name] = currentobj;
      }
    } else {
      if (elation.utils.arrayget(thing, 'properties.physical.exists') !== 0) {
        console.log("-!- Engine.Objects: Unknown thing type '" + thing.type + "'", thing);
      }
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
      console.log('camera attach', this.camera, thing);
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
    var component = elation.space.admin("admin", div, { controller: this });
    this.container.appendChild(div);
  }
});