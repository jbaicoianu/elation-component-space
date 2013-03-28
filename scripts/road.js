elation.extend("space.meshes.road", function(args) {
  elation.space.thing.call( this, args );
  this.autocreategeometry = false;

  this.postinit = function() {
    if (this.properties.path) {
      this.geometry = new THREE.Geometry();
      var width = this.properties.physical.width || 10;

      //this.createMaterial();

      var segments = [];
      var segpoints = [];
      for (var k in this.properties.path) {
        segments.push(k) - 1;
      }
      segments.sort();
      for (var i = 0; i < segments.length; i++) {
        segpoints[i] = new THREE.Vector3(this.properties.path[segments[i]][0],this.properties.path[segments[i]][1],this.properties.path[segments[i]][2]);
      }

      var anglebefore = angleafter = 0;
      for (var i = 0; i < segments.length - 1; i++) {
        var anglebefore = 0, angleafter = 0;
        var start = segpoints[i], end = segpoints[i+1];
        var prev = (i == 0 ? false : segpoints[i-1]);
        var next = (i == segments.length - 2 ? false : segpoints[i+1]);

        var thisseg = start.clone().subSelf(end);
        if (prev) {
          var prevseg = prev.clone().subSelf(start);
          anglebefore = Math.acos(thisseg.dot(prevseg) / (thisseg.length() * prevseg.length()));
        }
        if (next) {
          var nextseg = next.clone().subSelf(segpoints[i+2]);
          angleafter = Math.acos(thisseg.dot(nextseg) / (thisseg.length() * nextseg.length()));
        }

        this.createSegment(start, end, width, anglebefore);
        //console.log('start', start, 'end', end, 'angle', anglebefore * 180 / Math.PI, angleafter * 180 / Math.PI);
      } 
      //var blah = new THREE.Line(this.geometry, new THREE.LineBasicMaterial({ color: 0x000000 }), THREE.LinePieces);
      //var material = new THREE.MeshPhongMaterial({ color: 0x666666 });
      //var material = new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture('/media/space/models/asphalt.jpg')});

    }
    //var material = new THREE.MeshNormalMaterial({ normal: THREE.ImageUtils.loadTexture('/media/space/models/asphalt.jpg')});
    //var blah = new THREE.Mesh(this.geometry, material);
    //this.add(blah);
    this.updateCollisionSize();
  }
  this.createMaterial = function(params) {
    var repeats = (params['repeat'] ? params['repeat'][0] : 1);
    var repeatt = (params['repeat'] ? params['repeat'][1] : 1);
    var showroadtex = params.diffuse || false;

    if (false) {
      var shader = THREE.ShaderUtils.lib[ "normal" ];
      var uniforms = THREE.UniformsUtils.clone( shader.uniforms );
      uniforms[ "enableAO" ].value = false;
      uniforms[ "enableDiffuse" ].value = showroadtex;
      uniforms[ "enableSpecular" ].value = false;
      uniforms[ "uSpecularColor" ].value.setHex( 0x000000 );
      uniforms[ "uAmbientColor" ].value.setHex( 0x000000 );
      uniforms[ "uShininess" ].value = 0;
      uniforms[ "tNormal" ].texture = THREE.ImageUtils.loadTexture( "/media/space/models/asphalt-normal.jpg" );
      uniforms[ "tNormal" ].texture.wrapS = THREE.RepeatWrapping;
      uniforms[ "tNormal" ].texture.wrapT = THREE.RepeatWrapping;
      uniforms[ "tNormal" ].texture.magFilter = THREE.LinearMipMapLinearFilter;
      uniforms[ "tNormal" ].texture.minFilter = THREE.LinearMipMapLinearFilter;
      uniforms[ "offsetRepeat" ].value.set(0,0,repeats,repeatt);
      var parameters = { fragmentShader: shader.fragmentShader, vertexShader: shader.vertexShader, uniforms: uniforms, lights: true };
      if (showroadtex) {
        if (!this.roadtex) {
          this.roadtex = THREE.ImageUtils.loadTexture('/media/space/models/asphalt.jpg');
        }
        parameters.uniforms[ "uDiffuseColor" ].value.setHex( 0xffffff);
        parameters.map = this.roadtex;
      } else {
        uniforms[ "uDiffuseColor" ].value.setHex( 0x333333);
      }
      if (Detector.webgl) {
        return new THREE.MeshShaderMaterial( parameters );
      } else {
        return new THREE.MeshBasicMaterial( parameters );
      }
    } else {
      var parameters = {
        map: THREE.ImageUtils.loadTexture("/media/space/textures/road.png"),
        normalMap: THREE.ImageUtils.loadTexture("/media/space/textures/asphalt-normal.jpg"),
        offsetRepeat: new THREE.Vector4(0,0,repeats,repeatt),
        shading: THREE.FlatShading,
        overdraw: true
      };
      if (parameters.map) {
        parameters.map.repeat.set(repeats,repeatt);
        parameters.map.wrapS = THREE.RepeatWrapping;
        parameters.map.wrapT = THREE.RepeatWrapping;
        parameters.map.minFilter = THREE.LinearMipMapLinearFilter;
        parameters.map.magFilter = THREE.LinearFilter;
      }
      if (parameters.normalMap) {
        parameters.normalMap.repeat.set(repeats*10,repeatt*10);
        parameters.normalMap.wrapS = THREE.RepeatWrapping;
        parameters.normalMap.wrapT = THREE.RepeatWrapping;
      }
      if (Detector.webgl) {
        return new THREE.MeshPhongMaterial( parameters );
      } else {
        return new THREE.MeshBasicMaterial( parameters );
      }
    }
  }
  this.createSegment = function(start, end, width) {
    var diff = new THREE.Vector3().sub(end, start);
    var length = diff.length();
    var texscale = 1;
    var mesh = new THREE.Mesh(new THREE.CubeGeometry(length, 5, width, Math.floor(length / width), 1, 4), this.createMaterial({repeat: [Math.floor(length / width) * texscale, texscale], diffuse: false}));
    mesh.geometry.computeFaceNormals();
    mesh.geometry.computeVertexNormals();
    mesh.geometry.computeTangents();
    mesh.rotation.y = Math.acos(diff.dot(new THREE.Vector3(-1,0,0)) / length);
    //mesh.rotation.y = (Math.random() * 180) * (Math.PI / 180)
    mesh.position.add(start, diff.divideScalar(2));
    mesh.position.y += 2.5;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    this.add(mesh);
    //console.log(start, end, diff, mesh.rotation.y);
  }
  this.init();
});
elation.space.meshes.road.prototype = new elation.space.thing();
elation.space.meshes.road.prototype.constructor = elation.space.meshes.road;
