/*
procedural building
arguments:
- groundfloor
- floor
  - meshes
    - corner
    - window
    - wall
  - layout
    - corner,window,wall,window,wall,window,corner
- mezzanine
- roof


{
  floor: {
    meshes: {
      corner: BuildingParts.brickcorner1,
      window: BuildingParts.fancywindow3,
      wall: BuildingParts.brickwall1
    },
    layout: "corner,window,wall,window,wall,window,corner"
  },
  groundfloor: {
    meshes: {
      wall: BuildingParts.groundfloorwall1
    },
  },
}


procbuilding
 - createHighres
   - createWorker        | procbuilding-worker
                            - requestSegments()
   - getSegments
  

*/
elation.extend("space.meshes.procbuilding", function(args) {
	elation.space.thing.call( this, args );
  this.autocreategeometry = false;
  this.loading = 0;
  this.geometries = {};
  this.meshes = {};
  this._tmpmesh = new THREE.Mesh();
  this.buildtime = new Date().getTime();

  this.materials = {
    //girder: new THREE.MeshPhongMaterial({color: 0xff0000}),
    wall: new THREE.MeshPhongMaterial({color: 0xcccccc}),
    floor: new THREE.MeshPhongMaterial({color: 0xccffff}),
    ceiling: new THREE.MeshPhongMaterial({color: 0xcccccc}),
    roof: new THREE.MeshPhongMaterial({color: 0xcccccc}),
    face: new THREE.MeshFaceMaterial({shading: THREE.FlatShading})
  };
  
  this.preinit = function() {
    this.type = 'building';
    console.log('procbuilding begins');
    //this.properties.building.stories = 6;
    elation.space.meshparts.loadParts({'window': '/media/space/models/procbuilding/window01.js'});
    if (this.properties.meshparts) {
      //console.log('meshparts to load', this.properties.meshparts);
      elation.space.meshparts.loadParts(this.properties.meshparts);
    }
  }
  this.postinit = function() {
    this.createLowres();
  }
  this.createHighres = function() {
    if (this.properties.building) {
      console.log("Start worker (t=" + this.age() + ")");
      this.worker = new Worker('/scripts/space/procbuilding-worker.js');
      elation.events.add([this.worker], 'message', this);
      this.worker.postMessage(JSON.stringify({action: 'generate', buildargs: this.properties.building, buildtime: this.buildtime}));
    }
  } 
  this.createLowres = function() {
    var shape = [];
    if (this.properties.building) {
      var verts = this.properties.building.outline || [];
      var vertmult = 1;
      for (var i = 0; i < verts.length; i++) {
        shape.push(new THREE.Vector2(verts[i][1] * vertmult, verts[i][0] * vertmult)); 
      }
      this.geometries['lowres'] = new THREE.ExtrudeGeometry(new THREE.Shape(shape), {amount: this.properties.building.stories * 100, bevelEnabled: false});
      this.meshes['lowres'] = this.createMesh(this.geometries['lowres'], this.materials.wall);
      this.meshes['lowres'].rotation.set(Math.PI/2, Math.PI, Math.PI/2);

      var mc = THREE.CollisionUtils.MeshColliderWBox(this.meshes['lowres']);
      mc.entity = this;
      THREE.Collisions.colliders.push( mc );
      //console.log(this.name + ' added collider', mc);

      this.createHighres();
    }
  }

  this.fadeMaterial = function(material, time, steps) {
    if (!steps) steps = 10;
    material.opacity -= (1 / steps);
    if (!material.transparent) material.transparent = true;
    if (material.opacity > 0) {
      this.meshes['lowres'].castShadow = false;
      this.meshes['lowres'].receiveShadow = false;
      (function(self, material, time, steps) {
        setTimeout(function() {
          self.fadeMaterial(material, time, steps);
        }, time / steps)
      })(this, material, time, steps);
    } else {
      material.opacity = 0;
      this.remove(this.meshes['lowres']);
      this.meshes['lowres'].visible = false;
    }
  }

  this.createFrame = function(outline, stories, wallheight, wallthickness) {
    var geom = new THREE.Geometry();
    var storyheight = wallheight + wallthickness;
    var height = stories * storyheight;
    for (var i = 0; i < outline.length - 1; i++) {
      // vertical supports
      var girder = this.createSegment(
        new THREE.Vector3(outline[i][0], 0, outline[i][1]),
        new THREE.Vector3(outline[i][0], height, outline[i][1]),
        wallthickness,
        materials['girder']
      );
      girder.rotation.x = Math.PI / 2;
      THREE.GeometryUtils.merge(geom, girder);

      for (var s = 0; s < stories; s++) {
        // horizontal outline
        var girder = this.createSegment(
          new THREE.Vector3(outline[i][0], (s + 1) * storyheight, outline[i][1]),
          new THREE.Vector3(outline[i+1][0], (s + 1) * storyheight, outline[i+1][1]),
          wallthickness,
          materials['girder'],
          true
        );
        THREE.GeometryUtils.merge(geom, girder);

        /*
        var wall = this.createSegment(
          new THREE.Vector3(outline[i][0], (s + .5) * storyheight, outline[i][1]),
          new THREE.Vector3(outline[i+1][0], (s + .5) * storyheight, outline[i+1][1]),
          [wallthickness, wallheight],
          materials['wall'],
          true
        );
        //var wall = this.createWall(outline[i], outline[i+1], (s + .5) * storyheight, storyheight, wallthickness, materials['wall']);
        THREE.GeometryUtils.merge(geom, wall);
        */

      }
      /*
      var floor = this.createFloor(outline,  (s * storyheight), materials['floor'], true);
      console.log('cool floor', floor);
      THREE.GeometryUtils.merge(geom, floor);
      */
    }

    return geom;
  }
  this.message = function(ev) {
    var logprefix = "Worker("+this.name+"):";
    var msg = (typeof ev.data == 'object' ? ev.data : JSON.parse(ev.data));
    if (msg) {
      switch (msg.action) {
        case 'log':
          console.log(logprefix, msg.msg, "(t=" + this.age() + ")");
          break; 
        case 'requestsegment':
          //console.log('request the segment', msg.segment);
          (function(self, seginfo) {
            if (typeof elation.space.meshparts[seginfo[0]] == 'function') {
              elation.space.meshparts[seginfo[0]](seginfo[1], seginfo[2], function(newgeom) {
                self.processSegment(seginfo[3], newgeom);
              });
            }
          })(this, msg.segment);
          break; 
        case 'finished':
          console.log("worker thread finished (t=" + this.age() + ")");
          this.geometries['highres'] = elation.space.procbuilding.helper.makeRealGeom(msg.geometry);
          console.log("generated (t=" + this.age() + "): " + this.geometries['highres'].vertices.length + " vertices, " + this.geometries['highres'].faces.length + ' faces');
          this.meshes['highres'] = this.createMesh(this.geometries['highres'], this.materials['face']);
          console.log("added (t=" + this.age() + ")");
          this.fadeMaterial(this.materials['wall'], 150);
          break;
        default:
          console.log(logprefix, "Unknown message:", msg);
      }
    }
  }
  this.processSegment = function(segments, geom) {
    //console.log('got back a segment', geom, segments);
    var fakegeom = elation.space.procbuilding.helper.makeFakeGeom(geom);
    this.worker.postMessage(JSON.stringify({action: 'process', geometry: fakegeom, segments: segments}));
  }
  this.age = function() {
    return new Date().getTime() - this.buildtime;
  }
  this.init();
});
elation.space.meshes.procbuilding.prototype = new elation.space.thing();
//elation.space.meshes.procbuilding.prototype.supr = elation.space.thing.prototype;
elation.space.meshes.procbuilding.prototype.constructor = elation.space.meshes.procbuilding;

elation.extend("space.procbuilding.worker", function(args) {
  this.geometries = {};
  this.loading = 0;
  this._tmpgeom = new THREE.Geometry();
  this._tmpmesh = new THREE.Mesh(this._tmpgeom, new THREE.MeshFaceMaterial());
  this.buildargs = { outline: [], stories: 1, storyheight: 100 };

  this.materials = {
    floor: new THREE.MeshPhongMaterial({color: 0xccffff}),
    ceiling: new THREE.MeshPhongMaterial({color: 0xcccccc}),
    roof: new THREE.MeshPhongMaterial({color: 0xcccccc}),
    face: new THREE.MeshFaceMaterial({shading: THREE.FlatShading})
  }

  this.message = function(ev) {
    var msg = (typeof ev.data == 'object' ? ev.data : JSON.parse(ev.data));
    if (msg) {
      switch (msg.action) {
        case 'generate':
          console.log('generation begins');
          for (var k in msg.buildargs) {
            this.buildargs[k] = msg.buildargs[k];
          }
          this.assembleStory(this.buildargs);
          break;
        case 'process':
          this.processSegment(msg.segments, msg.geometry);
          break;
        default:
          console.log('Unknown message:', msg);
      }
    } else {
      console.log('Unknown message:', msg);
    }
  }
  this.assembleStory = function(buildargs) {
    var outline = buildargs.outline || [];
    var segpart = buildargs.part || "window"; // TODO - support different segment layouts for each segment
    var segments = {};
    this.geometries['floor'] = new THREE.Geometry();
    for (var i = 0; i < outline.length - 1; i++) {
      var seginfo = this.getSegmentInfo(outline[i], outline[i+1], segpart, 1, false);
      var segname = segpart + '_' + seginfo.length;
      if (typeof segments[segname] == 'undefined') segments[segname] = [];
      segments[segname].push(seginfo);
    }
    for (var k in segments) {
      this.requestSegment(segments[k][0].part, segments[k][0].length, segments[k]);
    }
  }
  this.requestSegment = function(part, length, segments) {
    this.loading++;
    //console.log('make segment request', part, length);
    self.postMessage(JSON.stringify({action: 'requestsegment', segment: ["fillx", part, [length, this.buildargs.storyheight], segments] }));
  }
  this.processSegment = function(segments, fakegeom) {
    // Merge segments as we get them
    var geom = elation.space.procbuilding.helper.makeRealGeom(fakegeom);
    var tmpmesh  = new THREE.Mesh(geom, this.materials['face']);
    //this._tmpmesh.geometry = geom;
    for (var i = 0; i < segments.length; i++) {
      tmpmesh.position.copy(segments[i].position);
      tmpmesh.rotation.copy(segments[i].rotation);
      THREE.GeometryUtils.merge(this.geometries['floor'], tmpmesh);
    }
    
    if (--this.loading == 0) {
      console.log('Finished generating floor: ' + this.geometries['floor'].vertices.length + " vertices, " + this.geometries.floor.faces.length + ' faces');
      // If all segments are loaded, cap them off with a floor and a ceiling
      var floor = this.createFloor(this.buildargs.outline, 0, this.materials.floor, false);
      THREE.GeometryUtils.merge(this.geometries['floor'], floor);
      var ceiling = this.createFloor(this.buildargs.outline, this.buildargs.storyheight, this.materials.ceiling, true);
      THREE.GeometryUtils.merge(this.geometries['floor'], ceiling);
      this.geometries['floor'].mergeVertices(); // Remove duplicate vertices

      this.assembleHighres();
    }
  }
  this.createFloor = function(outline, height, material, ceiling) {
    var shape = [];
    var geom = new THREE.Geometry();
    for (var i = 0; i < outline.length - 1; i++) {
      shape.push(new THREE.Vector2(outline[i][0], outline[i][1])); 
      geom.vertices.push(new THREE.Vertex(new THREE.Vector3(outline[i][0], height, outline[i][1])));
    }
    var faces = THREE.Shape.Utils.triangulateShape ( shape, [] );
    for (var i = 0; i < faces.length; i++) {
      geom.faces.push(new THREE.Face3(faces[i][(ceiling ? 0 : 2)], faces[i][1], faces[i][(ceiling ? 2 : 0)], new THREE.Vector3(0,1,0), null, material));
      geom.faceVertexUvs[0].push(new THREE.UV(0, 0, 1, 1)); // FIXME - need real UV mappings
    }
    var floormesh = new THREE.Mesh(geom, this.materials.face);
    return floormesh;
  }
  this.getSegmentInfo = function(start, end, part, thickness, inner) {
    if (!(thickness instanceof Array)) { thickness = [thickness, thickness]; }
    if (start instanceof Array) start = (start.length == 2 ? new THREE.Vector3(start[0], 0, start[1]) : new THREE.Vector3(start[0], start[1], start[2]));
    if (end instanceof Array) end = (end.length == 2 ? new THREE.Vector3(end[0], 0, end[1]) : new THREE.Vector3(end[0], end[1], end[2]));
    var diff = end.clone().subSelf(start);
    var length = diff.length();
    var ret = {
      length: length,
      dimensions: new THREE.Vector3(length + (inner ? -thickness[0] : thickness[0]), thickness[0], thickness[1]),
      position: start,
      rotation: new THREE.Vector3( 0, -Math.atan2(diff.z, diff.x), 0),
      part: part
    };
    return ret;
  }
  this.assembleHighres = function() {
    this.geometries['highres'] = new THREE.Geometry();
    var floormesh = new THREE.Mesh(this.geometries['floor'], this.materials.face);
    //this._tmpmesh.geometry = this.geometries['floor'];
    var stories = this.buildargs.stories || 1;
    for (var i = 0; i < stories; i++) {
      floormesh.position.y = (this.buildargs.storyheight * i) + 1;
      THREE.GeometryUtils.merge(this.geometries['highres'], floormesh);
    }

    var roof = this.createFloor(this.buildargs.outline, stories * this.buildargs.storyheight + 1, this.materials.roof, false);
    THREE.GeometryUtils.merge(this.geometries['highres'], roof);
    this.geometries['highres'].mergeVertices();

    //this.meshes['highres'] = this.createMesh(this.geometries['highres'], this.materials['face']);
    //this.fadeMaterial(this.materials['wall'], 150);
    var fakegeom = elation.space.procbuilding.helper.makeFakeGeom(this.geometries['highres']);
    console.log('finished assembling stories');
    self.postMessage(JSON.stringify({action: 'finished', geometry: fakegeom}));
  }
});

elation.extend("space.procbuilding.helper", new function() {
  this.materials = [];

  this.init = function() {
  }
  this.makeFakeGeom = function(realgeom) {
    //console.log('start make fake', realgeom);
    var fakegeom = {
      vertices: [],
      faces: [],
      uvs: [],
      materials: []
    }

    for (var i = 0; i < realgeom.vertices.length; i++) {
      fakegeom.vertices[i] = [realgeom.vertices[i].position.x, realgeom.vertices[i].position.y, realgeom.vertices[i].position.z];
    }
    var facevertices, facematerials;
    for (var i = 0; i < realgeom.faces.length; i++) {
      var face = realgeom.faces[i];
      facevertices = [];
      facematerials = [];
      facenormal = [0,0,0];
      if (face instanceof THREE.Face3) {
        facevertices = [face.a, face.b, face.c];
      } else if (face instanceof THREE.Face4) {
        facevertices = [face.a, face.b, face.c, face.d];
      }
      if (face.materials.length > 0) {
        for (var k = 0; k < face.materials.length; k++) {
          for (var m = 0; m < this.materials.length; m++) {
            if (this.materials[m] == face.materials[k]) {
              facematerials.push(m);
              break;
            }
          }
          if (m == this.materials.length) {
            //console.log('not found, push it', this.textureCube);
// FIXME - hack for skymap
if (face.materials[k].opacity < 1) {
  if (!this.textureCube && elation.space && elation.space.fly) {
    this.textureCube = elation.space.fly(0).textureCube;
  }
  if (this.textureCube) {
    face.materials[k].color = new THREE.Color(0xd1eeee);
    face.materials[k].envMap = this.textureCube;
    face.materials[k].flipEnvMap = 1;
    //face.materials[k].opacity = 1;
    //if (!face.materials[k].transparent) face.materials[k].transparent = true;
  }
}
            this.materials.push(face.materials[k]);
            facematerials.push(this.materials.length - 1);
          }
        }
      }
      if (face.normal) {
        facenormal = [face.normal.x, face.normal.y, face.normal.z];
      }
      fakegeom.faces[i] = [facevertices, facenormal, facematerials];
    }
    //console.log(fakegeom);
    for (var i = 0; i < realgeom.faceVertexUvs.length; i++) {
      fakegeom.uvs[i] = [];
      var uvs = realgeom.faceVertexUvs[i];
      for (var j = 0; j < uvs.length; j++) {
        fakegeom.uvs[i][j] = [];
        for (var k = 0; k < uvs[j].length; k++) {
          fakegeom.uvs[i][j][k] = [uvs[j][k].u, uvs[j][k].v];
        }
      }
    }
    //console.log('end make fake');
    return fakegeom;
  }
  this.makeRealGeom = function(fakegeom) {
    //console.log('start make real');
    var realgeom = new THREE.Geometry();
var t = new Date().getTime();

//console.log(" - generate: start (t=0)");
    for (var i = 0; i < fakegeom.vertices.length; i++) {
      realgeom.vertices.push(new THREE.Vertex(new THREE.Vector3(fakegeom.vertices[i][0], fakegeom.vertices[i][1], fakegeom.vertices[i][2])));
    }
//console.log(" - generate: vertices (t=" + (new Date().getTime() - t) + ")");
    for (var i = 0; i < fakegeom.faces.length; i++) {
      var face = fakegeom.faces[i];
      var facevertices = face[0];
      var facematerials = [];
      if (face[2].length > 0) {
        for (var k = 0; k < face[2].length; k++) {
          if (typeof this.materials[face[2][k]] == 'undefined') {
            console.log('create placeholder material', face[2][k]);
            this.materials[face[2][k]] = new THREE.MeshBasicMaterial({color: 0xcccccc});
          }
          facematerials.push(this.materials[face[2][k]]);
        }
      }
      var facenormal = new THREE.Vector3(face[1][0], face[1][1], face[1][2]);
      if (facevertices.length == 3) {
        realgeom.faces.push(new THREE.Face3(facevertices[0], facevertices[1], facevertices[2], facenormal, null, facematerials));
      } else if (facevertices.length == 4) {
        realgeom.faces.push(new THREE.Face4(facevertices[0], facevertices[1], facevertices[2], facevertices[3], facenormal, null, facematerials));
      }
    }
//console.log(" - generate: faces (t=" + (new Date().getTime() - t) + ")");
    for (var i = 0; i < fakegeom.uvs.length; i++) {
      realgeom.faceVertexUvs[i] = [];
      for (var j = 0; j < fakegeom.uvs[i].length; j++) {
        realgeom.faceVertexUvs[i][j] = [];
        for (var k = 0; k < fakegeom.uvs[i][j].length; k++) {
          realgeom.faceVertexUvs[i][j][k] = new THREE.UV(fakegeom.uvs[i][j][k][0], fakegeom.uvs[i][j][k][1]);
        }
      }
    }
//console.log(" - generate: uvs (t=" + (new Date().getTime() - t) + ")");
    //realgeom.computeFaceNormals();
//console.log(" - generate: normals (t=" + (new Date().getTime() - t) + ")");
    return realgeom;
  }
  this.init();
});
