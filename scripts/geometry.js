elation.extend("space.geometry", new function() {
  this.cache = {};
  this.queue = {};
  this.loading = [];

  this.get = function(url, parent, callback, nocache) {
    if (!callback)
      callback = 'loadMesh';
    
    if (this.cache[url] && !nocache) {
      this.deliver(url, this.cache[url], parent, callback);
    } else if (this.loading.indexOf(url) >= 0) {
      this.queue[url].push({
        "parent":parent,
        "callback":callback
      });
    } else {
      var loader = new THREE.JSONLoader(),
          deliver = this.deliver;
      
      loader.load(url, function(geometry) { 
        geometry.computeVertexNormals();
        deliver(url, geometry); 
      });

      this.queue[url] = [{
        "parent":parent,
        "callback":callback
      }];

      this.loading.push(url);
    }
  }
  
  this.deliver = function(url, geometry, parent, callback) {
    var self = elation.space.geometry;

    self.cache[url] = geometry;
    
    for (var i=0; i<self.queue[url].length; i++) {
      var item = self.queue[url][i];

      item.parent[item.callback](geometry);
    }
    
    delete self.queue[url];
    self.loading.splice(self.loading.indexOf(url), 1);
  }
});
