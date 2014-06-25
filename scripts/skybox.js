elation.extend('space.skybox', function(controller) {
  this.controller = controller;
  
  this.init = function() {
    this.renderer = this.controller.renderer;
    var viewsize = this.controller.viewsize;
    
    console.log('SKYBOX', this.controller, this);
    this.sceneCube = new THREE.Scene();
    this.cameraCube = new THREE.PerspectiveCamera(50, viewsize[0] / viewsize[1], 1, 100);
    this.sceneCube.add(this.cameraCube);
    
    elation.events.add(this, 'renderframe_end', this);
  }
  
  this.create = function() {
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
  }
  
  this.renderframe_end = function() {

  }
  
  //this.init();
});