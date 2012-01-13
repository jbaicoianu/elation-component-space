elation.extend("space.meshes.sector", function(args) {
  elation.space.thing.call( this, args );
  this.autocreategeometry = false;

/*
  this.init = function() {
    this.createMaterial();
    this.createMesh();
  }
*/
  this.postinit = function() {
    var hideplane = elation.utils.arrayget(this.properties, "sector.hideplane");
    if (!elation.utils.isTrue(hideplane)) {
      this.createMaterial();
      this.createGeometry();

      // FIXME - gross, stupid, ugly hack
      this.rotation.set(-Math.PI/2,0,0);
      for (var i = 0; i < this.children.length; i++) {
        if (this.children[i].geometry && this.children[i].geometry instanceof THREE.PlaneGeometry) {
          if (this.position) {
            this.children[i].position.set(this.position.x, this.position.y, this.position.z);
            this.position.set(0,0,0);
          }
          if (this.rotation) {
            this.children[i].rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
            this.rotation.set(0,0,0);
          }
        }
      }
    } else {
      this.rotation.set(0,0,0);
    }
    
    if (this.properties.render && this.properties.render.skybox) {
      this.createSky(true, this.properties.render.skybox);
    }

  }
  this.createGeometry = function() {
    if (!this.geometry) {
      this.geometry = new THREE.PlaneGeometry( 50000, 50000, 50, 50 );
      this.geometry.computeFaceNormals();
      this.geometry.computeVertexNormals();
      this.geometry.computeTangents();
      this.createMesh(this.geometry, this.materials[0]);
    }
  }
/*
  this.createMesh = function() {
    this.geometry = new THREE.PlaneGeometry( 50000, 50000, 200, 200 );

    // FIXME - one or all of these seem to be needed to get the geometry to render with the normal shader
    this.geometry.computeFaceNormals();
    this.geometry.computeVertexNormals();
    this.geometry.computeTangents();

    var mesh = new THREE.Mesh( this.geometry, this.materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    if (this.args.physical) {
      if (this.args.physical.position) {
        mesh.position.x = this.args.physical.position[0];
        mesh.position.y = this.args.physical.position[1];
        mesh.position.z = this.args.physical.position[2];
      }
      if (this.args.physical.rotation) {
        mesh.rotation.x = this.args.physical.rotation[0] * (Math.PI / 180);
        mesh.rotation.y = this.args.physical.rotation[1] * (Math.PI / 180);
        mesh.rotation.z = this.args.physical.rotation[2] * (Math.PI / 180);
      }
    }
    this.add(mesh);

    var mc = new THREE.PlaneCollider(mesh.position, new THREE.Vector3(0,1,0));
    mc.entity = this;
    THREE.Collisions.colliders.push( mc );

  }
*/
  this.createMaterial = function() {
    this.materials = [];

    var groundtex = THREE.ImageUtils.loadTexture( "/media/space/textures/dirt.jpg" );
    groundtex.wrapS = THREE.RepeatWrapping;
    groundtex.wrapT = THREE.RepeatWrapping;
    groundtex.repeat.set(200,200);

    var normaltex = THREE.ImageUtils.loadTexture( "/media/space/textures/dirt-normal.jpg");
    normaltex.wrapS = THREE.RepeatWrapping;
    normaltex.wrapT = THREE.RepeatWrapping;
    normaltex.repeat.set(200,200);

    if (false) {
      var shader = THREE.ShaderUtils.lib[ "normal" ];
      var uniforms = THREE.UniformsUtils.clone( shader.uniforms );
      uniforms[ "enableAO" ].value = false;
      uniforms[ "enableSpecular" ].value = false;
      uniforms[ "uSpecularColor" ].value.setHex( 0x111111 );
      uniforms[ "uAmbientColor" ].value.setHex( 0x050505 );
      uniforms[ "enableDiffuse" ].value = true;
      uniforms[ "uDiffuseColor" ].value.setHex( 0xffffff);
      uniforms[ "uShininess" ].value = 2;
      uniforms[ "tNormal" ].texture = normaltex;
      //uniforms[ "offsetRepeat" ].value.set(0,0,200,200);
      var parameters = { fragmentShader: shader.fragmentShader, vertexShader: shader.vertexShader, uniforms: uniforms, lights: true, map: groundtex, fog: true};
      this.materials.push(new THREE.MeshShaderMaterial( parameters ));
    } else {
      var parameters = {
        //color: 0x784800,
        map: groundtex,
        normalMap: normaltex,
        //specular: 0x111111,
        color: 0xffffff,
        //ambient: 0x050505,
        shininess: 2,
        shading: THREE.FlatShading,
        specular: 0x666666,
        overdraw: true,
        normalScale: 0.1
        //shininess: 10
      };
      if (Detector.webgl) {
        this.materials.push(new THREE.MeshPhongMaterial( parameters ));
      } else {
        delete parameters.map;
        delete parameters.normalMap;
        parameters.color = 0x999900;
        this.materials.push(new THREE.MeshBasicMaterial( parameters ));
      }
    }
    //this.materials.push(new THREE.MeshBasicMaterial({wireframe: true, color: 0x00ff00, opacity: 0.1, transparent: true}));

  }
  this.createSky = function(useskybox, path, format) {
    //var path = "/media/space/textures/skybox/";
    if (!format) {
      format = 'jpg';
    }
    var urls = [
        path + 'px' + '.' + format, path + 'nx' + '.' + format,
        path + 'py' + '.' + format, path + 'ny' + '.' + format,
        path + 'nz' + '.' + format, path + 'pz' + '.' + format
      ];


    if (useskybox) {
      var texturecube = THREE.ImageUtils.loadTextureCube( urls );
      var shader = THREE.ShaderUtils.lib[ "cube" ];
      shader.uniforms[ "tCube" ].texture = texturecube;

      var material = new THREE.ShaderMaterial( {

        fragmentShader: shader.fragmentShader,
        vertexShader: shader.vertexShader,
        uniforms: shader.uniforms,
        depthWrite: false

      } );

      this.sky = new THREE.Mesh( new THREE.CubeGeometry( 3000000, 3000000, 3000000 ), material);
      this.sky.flipSided = true;
      //this.sky.position = elation.space.fly(0).camerapos;
      this.add(this.sky);
    } else {
      this.sky = new THREE.Mesh(new THREE.SphereGeometry(30000, 10), new THREE.MeshBasicMaterial({ color: 0xB0E2FF}));
      this.sky.flipSided = true;
      this.scene.add(this.sky);
    }
  },
  this.init();
});
elation.space.meshes.sector.prototype = new elation.space.thing()
elation.space.meshes.sector.prototype.constructor = elation.space.meshes.sector;

