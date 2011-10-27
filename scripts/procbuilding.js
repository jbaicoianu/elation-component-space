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
    elation.space.meshparts.loadParts({'window': '/media/space/models/procbuilding/window01.js'});
  }
  this.postinit = function() {
    this.createLowres();
  }
  this.createHighres = function() {
    if (this.properties.building) {
      this.assembleStory(this.properties.building);
    }
  } 
  this.createLowres = function() {
    var shape = [];
    var verts = this.properties.building.outline || [];
    var vertmult = 1;
    for (var i = 0; i < verts.length; i++) {
      shape.push(new THREE.Vector2(verts[i][1] * vertmult, verts[i][0] * vertmult)); 
    }
    this.geometries['lowres'] = new THREE.ExtrudeGeometry(new THREE.Shape(shape), {amount: this.properties.building.stories * 100, bevelEnabled: false});
    this.meshes['lowres'] = this.createMesh(this.geometries['lowres'], this.materials.wall);
    this.meshes['lowres'].rotation.set(Math.PI/2, Math.PI, Math.PI/2);
    this.createHighres();
  }

  this.assembleStory = function(buildargs) {
    var outline = buildargs.outline || [];
    var segpart = "window"; // TODO - support different segment layouts for each segment
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
    (function(self, segments) {
      setTimeout(function() {
        elation.space.meshparts.fillx(part, [length, 100], function(newgeom) {
          self.processSegment(segments, newgeom);
        });
      }, 2000);
    })(this, segments);
    //console.log('make segment request', part, length, geom);
  }
  this.processSegment = function(segments, geom) {
    this.floorheight = 100;
    // Merge segments as we get them
    //var tmpmesh  = new THREE.Mesh(geom, this.materials['face']);
    this._tmpmesh.geometry = geom;
    for (var i = 0; i < segments.length; i++) {
      this._tmpmesh.position.copy(segments[i].position);
      this._tmpmesh.rotation.copy(segments[i].rotation);
      THREE.GeometryUtils.merge(this.geometries['floor'], this._tmpmesh);
    }
    
    if (--this.loading == 0) {
      // If all segments are loaded, cap them off with a floor and a ceiling
      var floor = this.createFloor(this.properties.building.outline, 0, this.materials.floor, false);
      THREE.GeometryUtils.merge(this.geometries['floor'], floor);
      var ceiling = this.createFloor(this.properties.building.outline, this.floorheight, this.materials.ceiling, true);
      THREE.GeometryUtils.merge(this.geometries['floor'], ceiling);
      //this.geometries['floor'].mergeVertices(); // Remove duplicate vertices

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
  this.assembleHighres = function() {
    this.geometries['highres'] = new THREE.Geometry();
    //var floormesh = new THREE.Mesh(this.geometries['floor'], this.materials.face);
    this._tmpmesh = new THREE.Mesh(this.geometries['floor'], this.materials.face);
    var stories = this.properties.building.stories || 10;
    for (var i = 0; i < stories; i++) {
      this._tmpmesh.position.y = this.floorheight * i;
      THREE.GeometryUtils.merge(this.geometries['highres'], this._tmpmesh);
    }

    var roof = this.createFloor(this.properties.building.outline, stories * this.floorheight, this.materials.roof, false);
    THREE.GeometryUtils.merge(this.geometries['highres'], roof);
    //this.geometries['highres'].mergeVertices();

    this.meshes['highres'] = this.createMesh(this.geometries['highres'], this.materials['face']);
    this.fadeMaterial(this.materials['wall'], 150);
  }
  this.fadeMaterial = function(material, time, steps) {
    if (!steps) steps = 10;
    material.opacity -= (1 / steps);
    if (!material.transparent) material.transparent = true;
    if (material.opacity > 0) {
      (function(self, material, time, steps) {
        setTimeout(function() {
          self.fadeMaterial(material, time, steps);
        }, time / steps)
      })(this, material, time, steps);
    } else {
      material.opacity = 0;
    }
  }
  this.getSegmentInfo = function(start, end, part, thickness, inner) {
    if (!(thickness instanceof Array)) { thickness = [thickness, thickness]; }
    if (start instanceof Array) start = (start.length == 2 ? new THREE.Vector3(start[0], 0, start[1]) : new THREE.Vector3(start[0], start[1], start[2]));
    if (end instanceof Array) end = (end.length == 2 ? new THREE.Vector3(end[0], 0, end[1]) : new THREE.Vector3(end[0], end[1], end[2]));
    var diff = end.clone().subSelf(start);
    var ret = {
      length: diff.length(),
      dimensions: new THREE.Vector3(length + (inner ? -thickness[0] : thickness[0]), thickness[0], thickness[1]),
      position: start,
      rotation: new THREE.Vector3( 0, -Math.atan2(diff.z, diff.x), 0),
      part: part
    };
    return ret;
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
  this.init();
});
elation.space.meshes.procbuilding.prototype = new elation.space.thing();
//elation.space.meshes.procbuilding.prototype.supr = elation.space.thing.prototype;
elation.space.meshes.procbuilding.prototype.constructor = elation.space.meshes.procbuilding;

