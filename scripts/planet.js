elation.extend("spacecraft.meshes.planet", function(args) {
	THREE.Object3D.call( this );

  this.args = args || {};
  this.radius = this.args.radius || 1000;
  this.texture = this.args.texture || false;
  this.nighttexture = this.args.nighttexture || false;
  this.heightmap = this.args.heightmap || false;

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
  };


  this.create = function() {
    this.shaderLoad("GroundFromSpace");
    this.shaderLoad("GroundFromAtmosphere");
    this.shaderLoad("SkyFromSpace");
    this.shaderLoad("SkyFromAtmosphere");
    //this.shaderLoad("SpaceFromSpace");
    //this.shaderLoad("SpaceFromAtmosphere");

    if (window.usehighres == 1) {
      if (this.texture) this.texture = this.texture.replace('_1k_', '_8k_');
      if (this.nighttexture) this.nighttexture = this.nighttexture.replace('_1k_', '_8k_');
      if (this.heightmap) this.heightmap = this.heightmap.replace('_1k_', '_8k_');
    }

    if (this.texture) {
      this.shaderuniforms[ "tDiffuse" ].texture = ImageUtils.loadTexture( this.texture, THREE.LinearMipMapLinearFilter);
    }
    if (this.nighttexture) {
      this.shaderuniforms[ "tDiffuseNight" ].texture = ImageUtils.loadTexture( this.nighttexture, THREE.LinearMipMapLinearFilter);
    }
    this.shadersloaded = false;

    var groundargs = {
      radius: this.radius,
      heightmap: this.heightmap,
    };
console.log(groundargs);
console.log('this.texture is ', this.texture);
    this.ground = {
      geometry: new ROAMSphere(groundargs),
      //geometry: new Sphere(groundargs.radius, 50, 50),
      materials: [new THREE.MeshPhongMaterial({color: 0xd2b48c, map: this.shaderuniforms[ "tDiffuse" ].texture})]
      //materials: [new THREE.MeshPhongMaterial({color: 0xaaaaaa, shading: THREE.SmoothShading})]
    };
    //this.ground.mesh = new THREE.Mesh(this.ground.geometry, this.ground.material);

    var skyargs = {
      radius: this.atmosphere.outerRadius
    };
    this.sky = {
      //geometry: new ROAMSphere(skyargs),
      geometry: new Sphere(skyargs.radius, 80, 80),
      materials: [new THREE.MeshPhongMaterial({color: 0x87ceeb, opacity: 0.5})]
    };
    this.sky.mesh = new THREE.Mesh(this.sky.geometry, this.sky.materials);
    this.sky.mesh.flipSided = true;

    this.space = { mesh: elation.spacecraft.viewport('spacecraft_planet_render').meshes['skybox'] };
    this.space.materials = this.space.mesh.materials;

//this.dynamicGeometry = {chunksize: 1024, chunks: 1 };
    this.geometry = this.ground.geometry;
    this.materials = this.ground.materials;
    this.addChild(this.sky.mesh);

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
        } else {
          this.ground.materials[0] = this.shaders['GroundFromAtmosphere'].material;
          this.sky.materials[0] = this.shaders['SkyFromAtmosphere'].material;
          //this.space.materials[1] = this.shaders['SpaceFromAtmosphere'].material;
        }
      }

      var surfaceoffset = 0;
      camera.matrixWorld.rotateAxis( rot );
      if (this.ground.geometry instanceof ROAMSphere) {
        this.ground.geometry.updateROAMMesh(pos, rot, elation.spacecraft.controls(0).getValue("maxerror"));
        var surfaceoffset = this.geometry.getHeightmapOffset(pos);
      }
      if (this.sky.geometry instanceof ROAMSphere) {
        this.sky.geometry.updateROAMMesh(pos.multiplyScalar(-1), rot.multiplyScalar(-1), elation.spacecraft.controls(0).getValue("maxerror"));
      }

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
console.log('set pos to', [newpos.x, newpos.y, newpos.z]);
        camera.position = newpos;
      }
//console.log(altitude);
      camera.movementSpeed = altitude;
		}
	}
  this.shaderLoad = function(name) {
    var baseurl = '/elation/images/space/shaders/' + name;
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
        this.shaders[k].material = new THREE.MeshShaderMaterial({uniforms: this.shaderuniforms, vertexShader: this.shaders[k].vert, fragmentShader: this.shaders[k].frag, blending: (k == 'GroundFromAtmosphere' || k == 'GroundFromSpace' ? THREE.NormalBlending : THREE.NormalBlending )});
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
        this.geometry.merge(this.geometry.diamonds.tail);
        this.geometry.updateROAMFaces();
    ev.preventDefault();
        break;
      case 93:
console.log('split');
        this.geometry.split(this.geometry.triangles.head);
        this.geometry.updateROAMFaces();
    ev.preventDefault();
        break;
    }
  }
  this.create();
});
console.log(elation.spacecraft.meshes);
elation.spacecraft.meshes.planet.prototype = new THREE.Mesh();
elation.spacecraft.meshes.planet.prototype.constructor = elation.spacecraft.meshes.planet;
