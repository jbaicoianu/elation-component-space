elation.extend("space.meshes.star", function(args) {
  elation.space.thing.call( this, args);
  this.args = args;
  this.postinit = function() {
  }
  this.createGeometry = function() {
    var color = elation.utils.arrayget(this.args, 'properties.render.color') || '0xFFFFFF',
        physical = this.get(args, 'properties.physical'),
        pos = physical.position,
        radius = physical.radius,
        r2 = radius / 1.2;
    
    //console.log('### STAR GENERATED',color,this, args);
    var lfn = function(x,y,z) {
      var light = new THREE.SpotLight(color, 1, 250000);
      light.position = {x:x,y:y,z:z};
      light.castShadow = true;
      return light;
    }
    
    this.add(lfn(0,0,0));

    var geom = new THREE.SphereGeometry(this.properties.physical.radius || 1000, 24, 24);
    this.createMesh(geom, new THREE.MeshBasicMaterial({color: color, fog: false}));
  }
  this.init();
});
elation.space.meshes.star.prototype = new elation.space.thing()
//elation.space.meshes.star.prototype.constructor = elation.space.meshes.star;

