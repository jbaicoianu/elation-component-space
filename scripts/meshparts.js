elation.extend("space.meshparts", new function() {
  this.parts = {"_loading": 0, "_total": 0};
  this.partsqueue = {};
  this.materials = {
    face: new THREE.MeshFaceMaterial()
  };

  this.loadParts = function(parts) {
    //console.log('Start loading mesh parts', parts);

    var loader = new THREE.JSONLoader();
    //elation.events.add([this], "meshpartload,meshpartsloaded", this);
    var ts = new Date().getTime();
    for (var k in parts) {
      this.parts._loading++;
      if (typeof this.parts[k] == 'undefined') {
        //console.log('Loading meshpart: ' + k + ' (' + parts[k] + ')');
        this.parts[k] = false; // prevent others from kicking off the same load again
        (function(self, loader, partname, part) {
          loader.load( part, function(geometry) {
              //elation.events.fire({type: "meshpartload", element: self, fn: self, data: geometry});
              self.meshpartload({data: {partname: partname, geometry: geometry, ts: ts}});
            },
            "/media/space/textures" 
          );
        })(this, loader, k, parts[k]);
      } else {
        (function(self, k) {
          setTimeout(function() { 
            self.meshpartload({data: {partname: k, geometry: self.parts[k], ts: ts}});
          }, 0);
        })(this, k);
      }
    }
  }
  this.meshpartload = function(ev) {
    var partname = ev.data.partname,
        geometry = ev.data.geometry,
        ts = ev.data.ts;
    console.log('Loaded part in ' + (new Date().getTime() - ts) + 'ms', partname, geometry);
    if (!geometry) {
      console.log("wtf?", ev);
      return;
    }
    geometry.computeBoundingBox();
    this.parts[partname] = geometry;
    this.parts._loading--;
    this.parts._total++;

    if (this.partsqueue[partname]) {
      console.log('got some queues', this.partsqueue);
    }

    geometry.computeFaceNormals();
    if (this.parts._loading == 0) {
      this.meshpartsloaded();
    }
  }
  this.meshpartsloaded = function() {
    console.log('finished loading parts', this.parts);
    elation.events.fire({type: "meshpartsloaded", element: this, fn: this, data: this.parts});
    //this.createGeometry();
  }
  this.requestPart = function(partname, repeat) {
    if (this.parts[partname]) {
      console.log('fuck yeah');
    }
  }
  this.repeat = function(part, repeat, scale, callback) {
    var geom = new THREE.Geometry();
    geom.dynamic = true;

    (function(self, part, geom, callback) {
      //setTimeout(function() {
        if (typeof part == "string") {
          part = self.parts[part];
        }
        //console.log('party', part, typeof part, self.parts);
        var chunk = new THREE.Mesh(part, self.materials.face);

        //console.log('scaley scale', scale);
        //var scale = 10;
        var sizex = (chunk.geometry.boundingBox.max.x - chunk.geometry.boundingBox.min.x) * scale[0];
        var sizey = (chunk.geometry.boundingBox.max.y - chunk.geometry.boundingBox.min.y) * scale[1];
        chunk.scale.set(scale[0],scale[1],scale[1]);

        for (var y = 0; y < repeat[1]; y++) {
          chunk.position.y = y * sizey;
          for (var x = 0; x < repeat[0]; x++) {
            chunk.position.x = x * sizex;
            //console.log('chunky', chunk);
            THREE.GeometryUtils.merge(geom, chunk);
          }
        }
        //console.log('geom now is ', geom);
        if (typeof callback == 'function') {
          callback(geom);
        }
      //}, 0)
    })(this, part, geom, callback);
    return geom;
  }
  this.fillx = function(part, size, callback) {
    var geom = new THREE.Geometry();
    geom.dynamic = true;

    //var chunk = new THREE.Mesh(this.parts[part], this.materials.face);
    var chunksize = [
      this.parts[part].boundingBox.max.x - this.parts[part].boundingBox.min.x,
      this.parts[part].boundingBox.max.y - this.parts[part].boundingBox.min.y,
    ];
    var scale = size[1] / chunksize[1];
    var xsize = chunksize[0] * scale;
    var repeat = Math.max(1, Math.floor(size[0] / xsize));
    var xscale = size[0] / (xsize * repeat);
    xsize = chunksize[0] * (xscale * scale);
    //chunk.scale.set(xscale * scale,scale,scale);
    //console.log('scale', scale, 'xsize', xsize, 'repeat', repeat, chunksize);

    geom = this.repeat(part, [repeat, 1], [xscale * scale, scale], callback);
    return geom;
  }
  this.outline = function(part, outline, callback) {
    if (typeof part == "string") {
      part = self.parts[part];
    }

    var geom = new THREE.Geometry();
    for (var i = 0; i < outline.length - 1; i++) {
      var wall = this.createWall(outline[i], outline[i+1], 0, storyheight, wallthickness, this.materials.face);
console.log('new wall', wall);
      THREE.GeometryUtils.merge(storygeom, wall);
    }
    
    
  }
});
/*
repeat(outline(buildargs.outline, stretch("window01")), [1, buildargs.stories]);
repeat(outline(buildargs.outline, dynafill("window01")), [1, buildargs.stories]);
repeat(outline(buildargs.outline, dynafill("corner01", alternate("wall01", "window01"), "corner01")), [1, buildargs.stories]);

{
  'repeat': 

var wallgeom = elation.space.meshpart.repeat("window01", [5, 1]);
var stacks = elation.space.meshpart.repeat(wallgeom, [1, 10]);
*/
