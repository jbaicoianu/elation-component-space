elation.extend("space.geometry", new function() {
  this.cache = {};

  this.get = function(url, parent, callback, nocache) {
    if (!callback)
      callback = 'loadMesh';
    
    if (this.cache[url] && !nocache) {
      this.deliver(url, this.cache[url], parent, callback);
    } else {
      var loader = new THREE.JSONLoader(),
          deliver = this.deliver;
      
      loader.load(url, function(geometry) { 
        geometry.computeVertexNormals();
        deliver(url, geometry, parent, callback); 
      });
    }
  }
  
  this.deliver = function(url, geometry, parent, callback) {
    elation.space.geometry.cache[url] = geometry;
    parent[callback](geometry);
  }
});
