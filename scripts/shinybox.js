elation.extend("space.meshes.shinybox", function(args) {
  elation.space.thing.call( this, args );

  this.createMaterial = function() {
    var params = {
      //color: 0xa1a100,
      color: 0xffffff,
      map: THREE.ImageUtils.loadTexture('/media/space/textures/brick.png'),
      normalMap: THREE.ImageUtils.loadTexture('/media/space/textures/brick-normal.png'),
      shading: THREE.SmoothShading,
      specular: 0x808080,
      shininess: 50,
      perPixel: true
    };

    if (this.properties.render && this.properties.render.normalmethod == "old") {
      var shader = THREE.ShaderUtils.lib[ "normal" ];

      var uniforms = THREE.UniformsUtils.clone( shader.uniforms );
      uniforms[ "enableAO" ].value = false;
      uniforms[ "enableSpecular" ].value = 0;
      uniforms[ "uSpecularColor" ].value.setHex( params.specular || 0x000000 );
      uniforms[ "uAmbientColor" ].value.setHex( 0x000000 );
      uniforms[ "enableDiffuse" ].value = true;
      uniforms[ "uDiffuseColor" ].value.setHex( params.color );
      uniforms[ "uShininess" ].value = params.shininess;
      uniforms[ "tNormal" ].texture = params.normalMap;
      uniforms[ "tDiffuse" ].texture = params.map;
      var parameters = { fog: true, fragmentShader: shader.fragmentShader, vertexShader: shader.vertexShader, uniforms: uniforms, lights: true };
      this.materials = new THREE.ShaderMaterial( parameters );
    } else {
      //this.materials = new THREE.MeshFaceMaterial(params);
      this.materials = new THREE.MeshPhongMaterial(params);
    }
  }
  this.createGeometry = function() {
    if (false && this.properties.render.mesh) {
      (function(self, modelurl, materials) {
        var loader = new THREE.JSONLoader();
        loader.load( { model: modelurl, callback: function(geometry) { self.createMesh(geometry, materials); } });
      })(this, this.properties.render.mesh, this.materials);
    } else {
      var geometry = new THREE.CubeGeometry(15, 15, 15, 10, 10, 10, this.materials);
      geometry.computeVertexNormals();
      geometry.computeTangents();
      this.createMesh(geometry, new THREE.MeshFaceMaterial());
    }
  }
/*
  this.createMesh = function(geometry, materials) {
    if (geometry) {
      geometry.computeVertexNormals();
      geometry.computeTangents();
      var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial());

      if (this.properties.render.normalmethod == 'old') {
        for (var i = 0; i < geometry.faces.length; i++) {
          geometry.faces[i].materials[0] = this.materials;
        }
      }

      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (this.properties.render && this.properties.render.scale) {
        mesh.scale.set(this.properties.render.scale[0], this.properties.render.scale[1], this.properties.render.scale[2]);
      }
      this.addChild(mesh);
    } else {
      console.log('Invalid geometry passed to createMesh');
    }
  }
*/
  this.init();
});
elation.space.meshes.shinybox.prototype = new elation.space.thing();
elation.space.meshes.shinybox.prototype.supr = elation.space.thing.prototype;
elation.space.meshes.shinybox.prototype.constructor = elation.space.meshes.shinybox;
