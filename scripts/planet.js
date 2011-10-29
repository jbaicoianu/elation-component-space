elation.extend("space.meshes.planet", function(args) {
	elation.space.thing.call( this, args );

  this.radius = this.properties.physical.radius || 1000;
  this.groundtexture = this.args.texture || false;
  this.nighttexture = this.args.nighttexture || false;
  this.heightmap = this.args.heightmap || false;
  this.resolution = false;
  this.texturecache = {};

  this.atmosphere = {
    Kr: 0.0025,   // Rayleigh scattering constant
    Km: 0.0010,   // Mie scattering constant
    ESun: 20.0,   // Sun brightness constant
    g: -0.990,    // The Mie phase asymmetry factor
    exposure: 2.0,
    innerRadius: this.radius,
    outerRadius: this.radius * 1.05,
    wavelength: [.650, .570, .475],
    scaleDepth: .25,
    mieScaleDepth: .1,
  };

  this.shaders = {};
  this.shaderloadcount = 0;
  this.shaderuniforms = {
    //"meshPosition": { type: "v3", value: new THREE.Vector3() },
    "v3LightPosition": { type: "v3", value: new THREE.Vector3(1e8, 0, 1e8).normalize() },
    "v3InvWavelength": { type: "v3", value: new THREE.Vector3(1 / Math.pow(this.atmosphere.wavelength[0], 4), 1 / Math.pow(this.atmosphere.wavelength[1], 4), 1 / Math.pow(this.atmosphere.wavelength[2], 4)) },
    "fCameraHeight": { type: "f", value: 0},
    "fCameraHeight2": { type: "f", value: 0},
    "fInnerRadius": { type: "f", value: this.atmosphere.innerRadius},
    "fOuterRadius": { type: "f", value: this.atmosphere.outerRadius},
    "fOuterRadius2": { type: "f", value: Math.pow(this.atmosphere.outerRadius, 2)},
    "fKrESun": { type: "f", value: this.atmosphere.Kr * this.atmosphere.ESun},
    "fKmESun": { type: "f", value: this.atmosphere.Km * this.atmosphere.ESun},
    "fKr4PI": { type: "f", value: this.atmosphere.Kr * 4.0 * Math.PI},
    "fKm4PI": { type: "f", value: this.atmosphere.Km * 4.0 * Math.PI},
    "fScale": { type: "f", value: 1 / (this.atmosphere.outerRadius - this.atmosphere.innerRadius)},
    "fScaleDepth": { type: "f", value: this.atmosphere.scaleDepth},
    "fScaleOverScaleDepth": { type: "f", value: (1 / (this.atmosphere.outerRadius - this.atmosphere.innerRadius)) / this.atmosphere.scaleDepth},
    "g": { type: "f", value: this.atmosphere.g},
    "g2": { type: "f", value: this.atmosphere.g * this.atmosphere.g},
    "nSamples": { type: "i", value: 3},
    "fSamples": { type: "f", value: 3.0},
    "tDiffuse": { type: "t", value: 0, texture: null },
    "tDiffuseNight": { type: "t", value: 0, texture: null },
    "tDisplacement": { type: "t", value: 0, texture: null },
    "tSkyboxDiffuse": { type: "t", value: 0, texture: null },
  };


  this.create = function() {
/*
    this.shaderLoad("GroundFromSpace");
    this.shaderLoad("GroundFromAtmosphere");
    this.shaderLoad("SkyFromSpace");
    this.shaderLoad("SkyFromAtmosphere")/;
*/
/*
    this.shaderLoad("SpaceFromSpace");
    this.shaderLoad("SpaceFromAtmosphere");
*/

    this.setHighres(window.usehighres);
    this.dynamic = true;

console.log(this.args);
/*
    if (this.heightmap) {
      this.shaderuniforms[ "tDisplacement" ].texture = THREE.ImageUtils.loadTexture( this.heightmap, THREE.NearestFilter);
console.log('displacement is now a uniform');
    }
*/
    this.shaderuniforms[ "tSkyboxDiffuse" ].texture = THREE.ImageUtils.loadTexture( '../images/space/galaxy_starfield.png', THREE.LinearMipMapLinearFilter);
    this.shadersloaded = false;

    var groundargs = {
      radius: this.radius,
      heightmap: this.heightmap,
      maxvariance: 15
    };
    console.log("groundargs:", groundargs);
    this.ground = {
      geometry: new ROAMSphere(groundargs),
      //geometry: new THREE.SphereGeometry(groundargs.radius, 50, 50),
      //materials: [new THREE.MeshPhongMaterial({color: 0xd2b48c, map: this.shaderuniforms[ "tDiffuse" ].texture})]
      //materials: [new THREE.MeshFaceMaterial()]
      //materials: [new THREE.MeshFaceMaterial(), new THREE.MeshBasicMaterial({color: 0x00ff00, shading: THREE.SmoothShading, wireframe: true})]
      //materials: [new THREE.MeshBasicMaterial({color: 0xff0000})]
      materials: [
        //new THREE.MeshBasicMaterial({color: 0xd2b48c, map: this.shaderuniforms[ "tDiffuse" ].texture, blending: THREE.NormalBlending, opacity: 1}),
        new THREE.MeshPhongMaterial({color: 0xd2b48c, map: this.shaderuniforms[ "tDiffuse" ].texture, shading: THREE.SmoothShading}),
        //new THREE.MeshFaceMaterial(),
        //new THREE.MeshDepthMaterial({map: this.shaderuniforms[ "tDisplacement" ].texture}),
        new THREE.MeshBasicMaterial({color: 0x00ff00, shading: THREE.SmoothShading, wireframe: true, blending: THREE.AdditiveBlending, opacity: 0})
      ]
    };
    this.ground.mesh = new THREE.Mesh(this.ground.geometry, this.ground.materials);

    this.test = {
      geometry: new THREE.CubeGeometry(this.radius, this.radius, this.radius, 1, 1, 1),
      materials: [new THREE.MeshFaceMaterial()]
    }
this.test.geometry.boundingSphere = { radius: this.radius };
this.test.geometry.doubleSided = true;
this.transparent = true;
/*
var redshit = new THREE.MeshBasicMaterial({color: 0xff0000, opacity: 0.5, blending: THREE.AdditiveAlphaBlending});
var blueshit = new THREE.MeshBasicMaterial({color: 0x000099, opacity: 0.5, blending: THREE.AdditiveAlphaBlending});
var wireshit = new THREE.MeshBasicMaterial({color: 0x00ff00, wireframe: true});
for (var i = 0; i < this.test.geometry.faces.length; i++) {
  this.test.geometry.faces[i].materials = [(i % 2 ? redshit : blueshit)];
}
console.log(this.test);
*/

    var skyargs = {
      radius: this.atmosphere.outerRadius
    };
    this.sky = {
      //geometry: new ROAMSphere(skyargs),
      geometry: new THREE.SphereGeometry(skyargs.radius, 80, 80),
      materials: [new THREE.MeshPhongMaterial({color: 0x87ceeb, opacity: 0.5})]
    };
    this.sky.mesh = new THREE.Mesh(this.sky.geometry, this.sky.materials);
    this.sky.mesh.flipSided = true;

/*
    this.space = { mesh: elation.space.viewport('spacecraft_planet_render').meshes['skybox'] };
    if (this.space.mesh) {
      this.space.materials = this.space.mesh.materials;
    }
*/

//this.dynamicGeometry = {chunksize: 1024, chunks: 1 };
    this.geometry = this.ground.geometry;
    this.materials = this.ground.materials && this.ground.materials.length ? this.ground.materials : [ this.ground.materials ];
    //this.geometry = this.test.geometry;
    //this.materials = this.test.materials && this.test.materials.length ? this.test.materials : [ this.test.materials ];
    //this.add(this.sky.mesh);

/*
    this.particles = new THREE.Geometry();
    this.particlesystem = new THREE.ParticleSystem(this.particles, new THREE.ParticleBasicMaterial( { size: 1, sizeAttenuation: false, blending: THREE.NormalBlending, transparent: true, depthTest: true}));
*/
    if (this.args.showsearches) {
      this.particles = new elation.space.meshes.planet.particlevis();
console.log(this.particles);
      this.add(this.particles);
    }

    if (this.args.showsearches) {
      this.getSearches();
    }
this.add(this.ground.mesh);
console.log('fuck yeah', this);
    elation.events.add(document, "keypress", this);
  }
	this.update = function ( parentMatrixWorld, forceUpdate, camera ) {
		if ( this.visible ) {
			if ( this.matrixAutoUpdate ) {
				forceUpdate |= this.updateMatrix();
			}
			// update matrixWorld
			if ( forceUpdate || this.matrixWorldNeedsUpdate ) {
				if ( parentMatrixWorld ) {
					this.matrixWorld.multiply( parentMatrixWorld, this.matrix );
				} else {
					this.matrixWorld.copy( this.matrix );
				}

				this.matrixRotationWorld.extractRotation( this.matrixWorld, this.scale );
				this.matrixWorldNeedsUpdate = false;
				forceUpdate = true;
			}

      var pos = camera.position.clone().subSelf(this.position);
      var rot = new THREE.Vector3(0,0,1);

      if (this.shadersloaded) {
        var cameraheight = pos.length();
        this.shaderuniforms['fCameraHeight'].value = cameraheight;
        this.shaderuniforms['fCameraHeight2'].value = cameraheight * cameraheight;
//console.log(pos.length(), this.atmosphere.outerRadius);
        if (cameraheight >= this.atmosphere.outerRadius) {
          this.ground.materials[0] = this.shaders['GroundFromSpace'].material;
          this.sky.materials[0] = this.shaders['SkyFromSpace'].material;
          //this.space.materials[1] = this.shaders['SpaceFromSpace'].material;
          if (this.shaders['SpaceFromSpace']) {
            elation.space.viewport('spacecraft_planet_render').setSpaceShader(this.shaders['SpaceFromSpace'].material);
          }
        } else {
          this.ground.materials[0] = this.shaders['GroundFromAtmosphere'].material;
          this.sky.materials[0] = this.shaders['SkyFromAtmosphere'].material;
          //this.space.materials[1] = this.shaders['SpaceFromAtmosphere'].material;
          if (this.shaders['SpaceFromAtmosphere']) {
            elation.space.viewport('spacecraft_planet_render').setSpaceShader(this.shaders['SpaceFromAtmosphere'].material);
          }
        }
      }

      var surfaceoffset = 0;
      camera.matrixWorld.rotateAxis( rot );
      if (this.geometry instanceof ROAMSphere) {
        this.geometry.updateROAMMesh(pos, rot, elation.space.controls(0).getValue("maxerror"));
        var surfaceoffset = this.geometry.getHeightmapOffset(pos);
      }
      if (this.sky.geometry instanceof ROAMSphere) {
        this.sky.geometry.updateROAMMesh(pos.multiplyScalar(-1), rot.multiplyScalar(-1), elation.space.controls(0).getValue("maxerror"));
      }

/*
      if (this.particles && this.particles.vertices.length > 0) {
        var now = new Date().getTime();
        var tdiff = (this.lastparticleupdate ? (now - this.lastparticleupdate) / 1000 : 0);
        for (var i = 0; i < this.particles.vertices.length; i++) {
          if (this.particles.vertices[i].vel) {
            this.particles.vertices[i].position.addSelf(this.particles.vertices[i].vel.clone().multiplyScalar(tdiff));
          }
        }
        this.lastparticleupdate = now;
        this.particles.__dirtyParticles = true;
        this.particles.__dirtyElements = true;
        this.particles.__dirtyNormals = true;
        this.particles.__dirtyVertices = true;
      }
*/

			// update children
			for ( var i = 0, l = this.children.length; i < l; i ++ ) {
				this.children[ i ].update( this.matrixWorld, forceUpdate, camera );
			}

      var altitude = pos.length() - surfaceoffset - this.radius;
      if (altitude < 1) {
        altitude = 1;
        var newpos = pos.clone().normalize();
        this.matrixWorld.rotateAxis(newpos);
newpos.multiplyScalar(this.radius + surfaceoffset + altitude);
//console.log('set pos to', [newpos.x, newpos.y, newpos.z]);
        camera.position = newpos;
      }
//console.log(altitude);
      camera.movementSpeed = altitude;
		}
	}
  this.shaderLoad = function(name) {
    var baseurl = '../images/space/shaders/' + name;
    this.shaders[name] = {frag: false, vert: false};
    this.shadersloaded = false;
    this.shaderloadcount += 2;
    (function(self) {
      elation.ajax.Get(baseurl + '.frag', null, {callback: function(data) { self.shaderRegister(name, 'frag', data); }});
      elation.ajax.Get(baseurl + '.vert', null, {callback: function(data) { self.shaderRegister(name, 'vert', data); }});
    })(this);
  }
  this.shaderRegister = function(name, type, shader) {
    this.shaders[name][type] = shader;
    if (--this.shaderloadcount <= 0) {
      this.shaderLoadComplete();
    }
  }
  this.shaderLoadComplete = function() {
    console.log(this.shaders);

    for (var k in this.shaders) {
      if (typeof this.shaders[k].material == 'undefined') {
        this.shaders[k].material = new THREE.MeshShaderMaterial({uniforms: this.shaderuniforms, vertexShader: this.shaders[k].vert, fragmentShader: this.shaders[k].frag, blending: (k == 'GroundFromAtmosphere' || k == 'GroundFromSpace' ? THREE.NormalBlending : THREE.NormalBlending ), shading: THREE.SmoothShading});
      }
    }

    this.shadersloaded = true;
  }
  this.handleEvent = function(ev) {
    if (typeof this[ev.type] == 'function') {
      return this[ev.type](ev);
    }
  }
  this.keypress = function(ev) {
    switch(ev.keyCode) {
      case 91:
        console.log('merge');
        this.geometry.merge();
        ev.preventDefault();
        break;
      case 93:
        console.log('split');
        this.geometry.split();
        ev.preventDefault();
        break;
      case 112:
        this.geometry.log();
        break;
    }
  }

  this.getSearches = function() {
    (function(self) { 
      elation.ajax.Queue({method: 'SCRIPT', url: 'http://elation.james.dev.thefind.com/test/realtime.json', callback: function(data) { self.processSearches(data); }});
      setTimeout(function() { self.getSearches(); }, 500);
    })(this);
  }
  this.processSearches = function(data) {
    console.log('got it!', data);
    var movespeed = 10;
    var updatefreq = 2;
    this.particles.addParticles(data.searches);
/*
    for (var ts in data.searches) {
      for (var i in data.searches[ts]) {
        var vpos = this.geometry.latLonToPos(data.searches[ts][i].location.split(','), Math.random() * movespeed * updatefreq);
        var vert = new THREE.Vertex(vpos);
        vert.vel = vpos.clone().normalize().multiplyScalar(movespeed);
        this.particles.vertices.push(vert);
      }
    }
    this.particles.__dirtyParticles = true;
    this.particles.__dirtyElements = true;
    this.particles.__dirtyNormals = true;
    this.particles.__dirtyVertices = true;
    this.particles.__dirtyUvs = true;
*/
  }
  this.setHighres = function(highres) {
    var changed = false;
    if (highres && this.resolution != 'high') {
      changed = true;
      this.resolution = 'high';
      if (this.groundtexture) this.groundtexture = this.groundtexture.replace('_1k_', '_8k_');
      if (this.nighttexture) this.nighttexture = this.nighttexture.replace('_1k_', '_8k_');
      if (this.heightmap) this.heightmap = this.heightmap.replace('_1k_', '_8k_');
    } else if (!highres && this.resolution != 'low') {
      changed = true;
      this.resolution = 'low';
      if (this.groundtexture) this.groundtexture = this.groundtexture.replace('_8k_', '_1k_');
      if (this.nighttexture) this.nighttexture = this.nighttexture.replace('_8k_', '_1k_');
      if (this.heightmap) this.heightmap = this.heightmap.replace('_8k_', '_1k_');
    }
    if (changed) {
      if (!this.texturecache[this.resolution]) {
        this.texturecache[this.resolution] = {};
      }
      if (this.groundtexture) {
        if (!this.texturecache[this.resolution]['ground']) {
          this.texturecache[this.resolution]['ground'] = THREE.ImageUtils.loadTexture( this.groundtexture, THREE.LinearMipMapLinearFilter);
        }
       this.shaderuniforms[ "tDiffuse" ].texture = this.texturecache[this.resolution]['ground'];
      }
      /*
      if (this.nighttexture) {
        this.shaderuniforms[ "tDiffuseNight" ].texture = THREE.ImageUtils.loadTexture( this.nighttexture, THREE.LinearMipMapLinearFilter);
      }
      */
      if (this.ground) {
        if (this.ground.geometry && this.ground.geometry.heightmap) {
          var img = new Image();
          (function(self) {
            img.onload = function() { self.ground.geometry.heightmap.loadImage(img); };
          })(this);
          img.src = this.heightmap;
        }
      }
    }
  }
  this.setWireframe = function(wireframe) {
    for (var i in this.materials) {
      if (this.materials[i].wireframe) {
        this.materials[i].opacity = (wireframe ? 1 : 0);
      }
    }
    for (var g in this.geometry.geometryGroup) {
      this.geometry.geometryGroup[g].__needsSmoothNormals = wireframe;
    }
    this.geometry.__dirtyNormals = true;
  }

  this.init();
  this.create();
});
elation.space.meshes.planet.prototype = new elation.space.thing();
elation.space.meshes.planet.prototype.constructor = elation.space.meshes.planet;

elation.extend("space.meshes.planet.particlevis", function() {
	THREE.Object3D.call( this );

  this.movespeed = 10;
  this.updatefreq = 2;
  this.particles = [];
  this.freeparticles = [];
  this.freevertices = [];
  this.radius = 25760;
  this.type = THREE.LinePieces;

  this.search = function(v1, v2) {
    this.vertices = [v1, v2];
    this.vel = v1.position.clone().normalize().multiplyScalar(10);
    this.update = function() {
      this.vertices[0].position.addSelf(this.vel);
      if (this.vertices[0].position.length() > 25760 * 1.1) {
        this.vertices[0].position.set(0, 0, 0);
        this.vertices[1].position.set(0, 0, 0);
        return false;
      }
      return true;
    }
  }

  this.postinit = function() {
    this.pgeometry = new THREE.Geometry();
    this.line = new THREE.Line(this.pgeometry, new THREE.LineBasicMaterial( { color: 0xff0000, opacity: 0.1, linewidth: 5, blending: THREE.AdditiveAlphaBlending }), THREE.LinePieces );
this.line.transparent = true;
    this.add(this.line);
  }
  this.addParticles = function(data) {
console.log('go now', data);
    for (var ts in data) {
      for (var i in data[ts]) {
        var vpos = this.latLonToPos(data[ts][i].location.split(','));
        //var vert = new THREE.Vertex(vpos);
        var ppos = this.particles.push(this.getParticle(vpos))-1;
        
/*
        var vert = this.getVertex(vpos);
        vert.vel = vpos.clone().normalize().multiplyScalar(this.movespeed);
        this.particles.vertices.push(vert);
*/
//console.log(this.particles[ppos]);
//this.particles[ppos].updateMatrix();
//        this.add(this.particles[ppos]);
      }
    }
//console.log(this.particles);
    this.updateVertices();
//console.log(this.particles);
  }
  this.updateVertices = function(t) {
/*
    if (this.particles && this.particles.vertices.length > 0) {
      var now = new Date().getTime();
      var tdiff = (this.lastparticleupdate ? (now - this.lastparticleupdate) / 1000 : 0);
      if (tdiff > 0) {
        for (var i = 0; i < this.particles.vertices.length; i++) {
          if (this.particles.vertices[i].vel) {
            this.particles.vertices[i].position.addSelf(this.particles.vertices[i].vel.clone().multiplyScalar(tdiff));
          }
        }
      }
      this.lastparticleupdate = now;
      this.particles.__dirtyParticles = true;
      this.particles.__dirtyElements = true;
      this.particles.__dirtyNormals = true;
      this.particles.__dirtyVertices = true;
    }
*/
  }
  this.getParticle = function(pos) {
/*
    var p;
    if (this.freeparticles.length > 0) {
      p = this.freeparticles.pop();
    } else {
      p = new elation.space.meshes.planet.particlevis.search();
    }
    p.init(pos);
    return p;
*/
      this.pgeometry.__dirtyLines = true;
      this.pgeometry.__dirtyElements = true;
      this.pgeometry.__dirtyNormals = true;
      this.pgeometry.__dirtyVertices = true;
    return new this.search(this.getVertex(pos), this.getVertex(pos));
  }
  this.freeParticle = function(pnum) {
    this.freeparticles.push(this.particles[pnum]);
    this.particles.splice(pnum,1);
  }
  this.getVertex = function(pos) {
    var v, vnum;
    if (this.freevertices.length > 0) {
      v = this.freevertices.pop();
      vnum = v.vnum;
    } else {
      v = new THREE.Vertex();
      vnum = this.pgeometry.vertices.push(v)-1;
      this.pgeometry.vertices[vnum].vnum = vnum;
    }
    this.pgeometry.vertices[vnum].position = pos.clone();
    return this.pgeometry.vertices[vnum];
  }
  this.freeVertex = function(vnum) {
    this.freevertices.push(this.pgeometry.vertices[vnum]);
    this.particles.splice(pnum,1);
  }
  this.latLonToPos = function(latlon, offset) {
    var altitude = this.radius + (this.heightmap ? this.heightmap.latLonToHeight(latlon) : 0) + (offset ? offset : 0);
    var lat = (latlon[0]) * (Math.PI / 180), lon = (latlon[1] - 90) * (Math.PI / 180); // FIXME - not sure why this needs lon - 90 but it works
    var x = altitude * Math.cos(lat) * Math.cos(lon);
    var y = altitude * Math.sin(lat);
    var z = altitude * -1 * Math.cos(lat) * Math.sin(lon);
    return new THREE.Vector3(x, y, z);
  }
  this.update = function() {
    var removes = [];
    for (var i = 0; i < this.particles.length; i++) {
      if (!this.particles[i].update()) {
        removes.push(i);
      }
    }
    if (removes.length > 0) {
console.log(removes);
      for (var i = removes.length-1; i > 0; i--) {
        this.freeParticle(i);
      }
    }
    this.pgeometry.__dirtyVertices = true;
  }
  this.init();
});
elation.space.meshes.planet.particlevis.prototype = new THREE.Object3D();
elation.space.meshes.planet.particlevis.prototype.constructor = elation.space.meshes.planet.particlevis;

elation.extend("space.meshes.planet.particlevis.search", function() {
  this.mass = 1;
this.speed = 10;

  var dynamicsopts = {
    position: this.position,
    mass: this.mass
  };
  //(function(self) { dynamicsopts['onmove'] = function(pos) { self.setposition(pos, {dynamics: true}); }})(this);
  this.dynamics = new elation.utils.dynamics();

  this.init = function(pos) {
    //this.setPosition(pos);
    if (!this.geometry) {
      this.geometry = new THREE.Geometry();
      this.materials = [new THREE.LineBasicMaterial( { color: 0xffff00, opacity: 1, linewidth: 1 } )];
      this.type = THREE.LinePieces;
    }

    if (!this.geometry.vertices || this.geometry.vertices.length == 0) {
      this.geometry.vertices = [new THREE.Vertex(), new THREE.Vertex()];
      this.geometry.colors = [new THREE.Color(0xffffff), new THREE.Color(0xffffff)];
    }
    this.geometry.vertices[0].position.copy(pos);
    this.geometry.vertices[1].position.copy(pos);
    this.vel = pos.normalize().multiplyScalar(this.speed);

        this.geometry.__dirtyParticles = true;
        this.geometry.__dirtyElements = true;
        this.geometry.__dirtyNormals = true;
        this.geometry.__dirtyVertices = true;
    this.matrixAutoUpdate = false;
  }

  this.setPosition = function(pos) {
    this.position = pos
  }
	this.update = function ( parentMatrixWorld, forceUpdate, camera ) {

    if (this.vel) {
      this.geometry.vertices[0].position.addSelf(this.vel);
      //this.geometry.__dirtyVertices = true;
    }
		this.matrixAutoUpdate && this.updateMatrix();

		// update matrixWorld

		if ( this.matrixWorldNeedsUpdate || forceUpdate ) {

			if ( parentMatrixWorld ) {

				this.matrixWorld.multiply( parentMatrixWorld, this.matrix );

			} else {

				this.matrixWorld.copy( this.matrix );

			}

			this.matrixRotationWorld.extractRotation( this.matrixWorld, this.scale );

			this.matrixWorldNeedsUpdate = false;

			forceUpdate = true;

		}

		// update children

		for ( var i = 0, l = this.children.length; i < l; i ++ ) {

			this.children[ i ].update( this.matrixWorld, forceUpdate, camera );

		}

  }
});
elation.space.meshes.planet.particlevis.search.prototype = new THREE.Line();
elation.space.meshes.planet.particlevis.search.prototype.constructor = elation.space.meshes.planet.particlevis.search;

