elation.extend("space.materials", new function() {
  this.shaders = {};
  this.textures = {};
  this.materials = {};

  this.getTexture = function(url, repeat) {
    if (!this.textures[url]) {
      this.textures[url] = THREE.ImageUtils.loadTexture(url);
    }
    if (repeat) {
      this.textures[url].wrapS = THREE.RepeatWrapping;
      this.textures[url].wrapT = THREE.RepeatWrapping;

      if (elation.utils.isArray(repeat)) {
        this.textures[url].repeat.set(repeat[0], repeat[1]);
      }
    }
    return this.textures[url];
  }
  
  this.getMaterial = function(name, material) {
    if (this.materials[name]) {
      texture = material.map;
      material = this.materials[name];
      material.map = texture;
    }
    
    if (typeof material.map == 'string') {
      material.map = this.getTexture(material.map);
    }
    
    //this.materials[name] = material;
    
    return material;
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
