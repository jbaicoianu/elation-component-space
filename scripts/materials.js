elation.extend("space.materials", new function() {
  this.shaders = {};
  this.texturecache = {};

  this.getTexture = function(url, repeat) {
    if (!this.texturecache[url]) {
      this.texturecache[url] = THREE.ImageUtils.loadTexture(url);
    }
    if (repeat) {
      this.texturecache[url].wrapS = THREE.RepeatWrapping;
      this.texturecache[url].wrapT = THREE.RepeatWrapping;

      if (elation.utils.isArray(repeat)) {
        this.texturecache[url].repeat.set(repeat[0], repeat[1]);
      }
    }
    return this.texturecache[url];
  }
  this.addShader = function(shadername, shader) {
    this.shaders[shadername] = shader;
  }
  this.getShaderMaterial = function(shadername, uniforms) {
    if (this.shaders[shadername]) {
      var shaderargs = {
        vertexShader: this.shaders[shadername].vertexShader,
        fragmentShader: this.shaders[shadername].fragmentShader,
        lights: true,
        perPixel: true
      };
		  shaderargs.uniforms = THREE.UniformsUtils.clone( this.shaders[shadername].uniforms );
      for (var k in uniforms) {
        if (shaderargs.uniforms[k]) {
          if (uniforms[k] instanceof THREE.Texture) {
            shaderargs.uniforms[k].texture = uniforms[k];
          } else {
            shaderargs.uniforms[k].value = uniforms[k];
          }
        }
      }
      return new THREE.ShaderMaterial(shaderargs);
    }
    return new THREE.MeshBasicMaterial({color: 0xcc0000});
  }
});
