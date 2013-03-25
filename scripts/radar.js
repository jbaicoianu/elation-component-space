elation.extend('ui.widgets.radar3d', function(hud) {
  this.hud = hud;
  this.mode = 'ALL';
  this.range = 32000;
  this.width = .6;
  this.inner = .55;
  this.center = [ 0, -1.3, -4.7 ];
  this.controller = hud.controller;
  this.contacts = [];
  this.oldtime = Date.now() * .005;
  this.colors = this.hud.colors;
  this.inc = 0;
  
  this.init = function() { 
    this.initialized = true;
    this.camera = this.controller.camera;
    this.contacts = elation.ui.hud.target.visible_list;
    this.radar = radar = new THREE.Object3D();
    this.radar.useQuaternion = true;
    this.player.add(this.radar);
    
    this.radar.position.x = this.center[0];
    this.radar.position.y = this.center[1];
    this.radar.position.z = this.center[2];

    this.sphere = this.makeSphere(this.width, [0,0,0], new THREE.MeshLambertMaterial({
      color: 0x000000,
      shininess: 25.0,
      ambient: 0xffffff,
      specular: 0xffffff,
      transparent: true, 
      depthTest: true,
      depthWrite: false,
      opacity: 0.6, 
      //wireframe: true,
      shading: THREE.SmoothShading
    }), 32, 16);
    this.sphere.flipSided = true;
    //this.sphere.doubleSided = true;
    this.radar.add(this.sphere);
    
    this.sphere_inner = this.makeSphere(this.width-.02, [0,0,0], new THREE.MeshPhongMaterial({
      color: 0x7b9cab,
      transparent: true, 
      depthTest: true,
      depthWrite: false,
      //wireframe: true,
      blending: THREE.AdditiveBlending,
      opacity: .1,
      shading: THREE.SmoothShading
    }), 32, 16);
    this.sphere_inner.flipSided = true;
    this.sphere_inner.renderDepth = -1.5;
    this.sphere_inner.depthWrite = -1.5;
    this.radar.add(this.sphere_inner);
    
    var line = this.makeLine([0,0,-this.inner], 0x5b7c8b);
    line.position.set(this.center[0], this.center[1], this.center[2]);
    line.rotation.y = .8;
    this.player.add(line);
    
    var line = this.makeLine([0,0,-this.inner], 0x5b7c8b);
    line.position.set(this.center[0], this.center[1], this.center[2]);
    line.rotation.y = -.8;
    this.player.add(line);
    
    var line = this.makeLine([0,0,this.inner], 0x5b7c8b);
    line.position.set(this.center[0], this.center[1], this.center[2]);
    this.player.add(line);
    
    var material = new THREE.MeshBasicMaterial({
        color: 0x7b9cab,
        depthTest: true,
        depthWrite: false,
        transparent: true,
      blending: THREE.AdditiveBlending,
        //wireframe: true,
        opacity: .12
    });
    
    var cylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(this.inner+.03, this.inner+.03, .01, 32, 2, false), 
      material
    );
    
    cylinder.position.set(this.center[0], this.center[1], this.center[2]);
    cylinder.renderDepth = -1.5;
    cylinder.depthWrite = -1.5;
    cylinder.alphaTest = 0.5;
    this.player.add(cylinder);
    
    this.makeParticles();
  }
  
  this.render = function(e) { 
    this.player = this.controller.objects.player.Player;
    
    if (!this.initialized && this.player) {
      this.init();
    } else {
      var quat = this.camera.quaternion;
      this.radar.quaternion.set(quat.x, quat.y, quat.z, quat.w * -1);
    }
    
    this.visible = [];
    this.draw();
  }
  
  this.drawBlip = function(contact, cp, type, name, d) {
    var tp = contact.position ? contact.position : false;
    
    if (elation.utils.arrayget(contact,'args.properties.render.noradar'))
      return;
    
    var distance = this.camera.position.distanceTo(contact.position);
    
    if (Math.abs(distance) > this.range || !tp) {
      if (contact.blipsize > 0)
        this.toggleBlip(contact, 0);
      
      return;
    }
    
    var s = this.inner,
        x = ((tp.x - cp.x) / this.range) * s,
        y = ((tp.y - cp.y) / this.range) * s,
        z = ((tp.z - cp.z) / this.range) * s,
        color,size;
    
    switch(type) {
      case 'player':    color = 0x44FF44; size = .13; break;
      case 'roid':      color = 0x333333; size = .07; break;
      case 'station':   color = 0xFFFF44; size = .13; break;
      case 'ship':      color = 0x44FFFF; size = .11; break;
      default:          color = 0xFF00FF; size = .11;
    }
    
    if (!contact.particle) {
      contact.particle = this.makeBlip(contact, size, [x,y,z], color, true);
    } else {
      contact.particle.position.set(x,y,z);
      
      if (contact.blipsize == 0) {
        this.toggleBlip(contact, size);
      }
    }
    
    contact.name = name;
    contact.type = type;
    contact.distance = distance;
    this.visible.push(contact);
  }

  this.draw = function() {
    var objects = this.controller.objects,
        contact, type,
        cp = objects.player.Player.position; 
    
    for (var type in objects) {
      contacts = objects[type];
      
      for (var name in contacts) {
        contact = contacts[name];
        
        if (contact.length) {
          for (var i=0; i<contact.length; i++) {
            this.drawBlip(contact[i], cp, type, name);
          }
        } else {
          this.drawBlip(contact, cp, type, name);
        }
      }
    }
  }
  
  this.makeParticles = function() {
    // create the particles
    this.pCount = 1000;
    this.pSize = 0;
    this.geometry = new THREE.Geometry();
    
    this.attributes = {
      size: {	type: 'f', value: [] },
      customColor: { type: 'c', value: [] }
    };

    uniforms = {
      amplitude: { type: "f", value: 1 },
      color:     { type: "c", value: new THREE.Color( 0xFFFFFF ) },
      texture:   { type: "t", value: THREE.ImageUtils.loadTexture( "/~lazarus/elation/images/space/particle.png" ) },
    };
    
    var materialargs = {
      uniforms: uniforms,
      attributes: this.attributes,
      vertexShader: document.getElementById('vertexshader').textContent,
      fragmentShader: document.getElementById('fragmentshader').textContent,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: false,
      transparent:	true
    };
    
    var material = new THREE.ShaderMaterial(materialargs);
    
    for (var p = 0; p < this.pCount; p++) {
      var radius = .6/2;
      var diameter = .6;
      var ppos = new THREE.Vector3(0,0,0);
      
      particle = new THREE.Vertex(ppos);
      this.geometry.vertices.push(particle);
    }

    this.radarSystem = new THREE.ParticleSystem(this.geometry, material);
    
    this.radarSystem.dynamic = true;
    this.radarSystem.sortParticles = true;
    this.radarSystem.renderDepth = -1.1;
    this.radarSystem.depthWrite = -1.1;
    
    var vertices = this.geometry.vertices;
    var values_size = this.attributes.size.value;
    var values_color = this.attributes.customColor.value;
    
    for( var v = 0; v < vertices.length; v++ ) {
      values_size[ v ] = this.pSize;
      values_color[ v ] = new THREE.Color( 0x333333 );
    }
    
    //console.log('Make Particles:', this.radarSystem, material);
    this.radar.add(this.radarSystem);
  }
  
  this.toggleBlip = function(contact, size) {
    contact.blipsize = this.attributes.size.value[contact.blipindex] = size;
    this.attributes.size.needsUpdate = true;
  }
  
  this.makeBlip = function(contact, size, coords, color, debug) {
    var particle = this.geometry.vertices[this.inc];
    
    //if (debug) console.log(particle, contact, size, coords);
    
    if (particle) {
      particle.position.set(coords[0],coords[1],coords[2]);
      contact.blipindex = this.inc;
      contact.blipsize = this.attributes.size.value[this.inc] = size;
      this.attributes.customColor.value[this.inc] = new THREE.Color(color);
      this.attributes.size.needsUpdate = true;
    }
    
    this.inc++;
    
    return particle;
  }
  
  this.makeSphere = function(width, coords, material, cols, rows) {
    var geometry = new THREE.SphereGeometry(width,cols || 4,rows || 2);
    
    var sphere = new THREE.Mesh(geometry, material);
    
    sphere.position.x = coords[0];
    sphere.position.y = coords[1];
    sphere.position.z = coords[2];
    
    return sphere;
  }
  
  this.makeLine = function(l, color) {
    var material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: .4
    });
    
    var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(0,0,0)));
    geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(l[0], l[1], l[2])));
    
    return new THREE.Line(geometry, material, THREE.LinePieces)
  }
  
  this.handleEvent = function(event) {
    this[event.type](event);
  }
});

elation.space.materials.addShader('radar_blip', {
		uniforms:  THREE.UniformsUtils.merge([
      {
        "amplitude" : { type: "f", value: 1.0 },
        "color" : { type: "c", value: new THREE.Color( 0xffffff ) },
        "texture" : { type: "t", value: 1, texture: null},
      }
		]),

		vertexShader: [
			"uniform float amplitude;",
			"attribute float size;",
			"attribute vec3 customColor;",

			"varying vec3 vColor;",

			"void main() {",
				"vColor = customColor;",
				"vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
				"gl_PointSize = size * ( 300.0 / length( mvPosition.xyz ) );",

				"gl_Position = projectionMatrix * mvPosition;",
			"}"
		].join("\n"),

		fragmentShader: [
			"uniform vec3 color;",
			"uniform sampler2D texture;",

			"varying vec3 vColor;",

			"void main() {",
				"gl_FragColor = vec4( color * vColor, 1.0 );",
				"gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );",
			"}"
		].join("\n")
});

/* bullshit
  sphere.geometry.applyMatrix( new THREE.Matrix4().setTranslation( 0,+this.center[1],+this.center[2] ) );
  
  this.radar.quaternion.copy(this.camera.quaternion);
  this.rotateAroundWorldAxis(this.radar, new THREE.Vector3(1,0,0), 30 * Math.PI/180);
  this.radar.quaternion.multiply(this.camera.quaternion,this.player.quaternion);
  this.sphere.position = this.player.matrixWorld.multiplyVector3(new THREE.Vector3(0,-1.3,-4.7));
  var point = [ this.center[0], this.center[1], this.center[2] + .6 ];
  
  this.sphere_testpoint = this.makeSphere(.01, point, this.blip_material);
  this.radar.add(this.sphere_testpoint);

  this.radar.geometry.applyMatrix( new THREE.Matrix4().setTranslation( 0,+this.center[1],+this.center[2] ) );
  this.radar.quaternion.copy(this.camera.quaternion);
    
			var time = Date.now() * 0.005;
			var values_color = this.attributes.customColor.value;
      
			if (false && time - this.oldtime > 10) {
        for( var i = 0; i < this.attributes.size.value.length; i++ ) {
          var hexColor = '0x'+this.r(0,15)+this.r(0,15)+this.r(0,15)+this.r(0,15)+this.r(0,15)+this.r(0,15);

          this.attributes.size.value[ i ] = 1 + Math.cos( 1 * i + time );
          this.attributes.customColor.value[ i ] = new THREE.Color( hexColor );
        }
        this.oldtime = time;
      }

			this.attributes.size.needsUpdate = true;
  
  this.r = function(min, max) {
    var rand = Math.random(),
        value = (max - min) * rand + min;
    
    return Math.round(value).toString(16);
  }
      
  // not used
  this.rotateAroundWorldAxis = function(object, axis, radians) {
    rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
    rotWorldMatrix.multiplySelf(object.matrix);        // pre-multiply
    object.matrix = rotWorldMatrix;
    object.rotation.getRotationFromMatrix(object.matrix, object.scale);
  }
  
  this.drawBlip = function(contact, cp, type, name, d) {
    var tp = contact.position ? contact.position : false;
    var object = elation.utils.arrayget(this.rcontacts, type + '.' + name);

    if (type == 'particle') {
      tp.x = tp.z + cp.x;
      tp.y = tp.z + cp.y;
      tp.z = tp.z + cp.z;
    }
    
    var distance = this.camera.position.distanceTo(contact.position);
    
    if (elation.utils.arrayget(contact,'args.properties.render.noradar'))
      return;
    
    
    if (Math.abs(distance) > this.range || !tp) {
      if (object && object.parent) {
        //object.parent.remove(object);
      }
      
      return;
    }
    
    if (!this.rcontacts[type])
      this.rcontacts[type] = {};
    
    var s = this.inner,
        x = ((tp.x - cp.x) / this.range) * s,
        y = ((tp.y - cp.y) / this.range) * s,
        z = ((tp.z - cp.z) / this.range) * s,
        color,size;
    
    if (!contact.particle) {
      switch(type) {
        case 'player': color = 0x22ab22; size = .012; break;
        case 'asteroid': color = 0x444444; size = .007; break;
        case 'station': color = 0xaaaa22; break;
        case 'ship': color = 0xaa2222; break;
        default: color = 0xFF00FF;
      }
      
      //console.log(name, type, distance, [x,y,z], [tp.x,tp.y,tp.z], color);
      var material = new THREE.MeshBasicMaterial({ color: color, shading: THREE.SmoothShading });
      this.rcontacts[type][name] = object = this.makeBlip(
        contact, 
        size || .01, 
        [x,y,z], 
        true);
      
      if (false) {
      var line = this.makeLine(y, color)
        line.position.set(this.center[0] + x, this.center[1] + y, this.center[2] + z);
        line.useQuaternion = true;
        object.lineToPlane = line;
        this.player.add(line);
      }
      //this.radar.add(object);
      //console.log(type, name, [x,y,z]);
    } else {
      object.position.set(x,y,z);
      if (false) {
        var p = [ this.player.position.x,this.player.position.y,this.player.position.z ];
        var wc = new THREE.Vector3(
          object.matrixWorld.n14,
          object.matrixWorld.n24,
          object.matrixWorld.n34
        );
        
        if (name == 'Outpost')
          console.log(wc);
       
        if (object.lineToPlane) {
          var pos = object.lineToPlane.position;
          object.lineToPlane.position.set(wc.x, wc.y, wc.z);
        }
      }
      if (!object.parent) {
        //this.radar.add(object);
      }
    }
  }
*/