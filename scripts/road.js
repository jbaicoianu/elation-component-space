elation.extend("space.meshes.road", function(args) {
	THREE.Object3D.call( this );

  this.args = args || {};

  this.init = function() {
    if (this.args.path) {
      this.geometry = new THREE.Geometry();
      var first = true;

      var segments = [];
      for (var k in this.args.path) {
        segments.push(k);
      }
      segments.sort();
      for (var i = 0; i < segments.length - 1; i++) {
        var start = new THREE.Vector3(this.args.path[segments[i]][0],this.args.path[segments[i]][1],this.args.path[segments[i]][2]);
        var end = new THREE.Vector3(this.args.path[segments[i+1]][0],this.args.path[segments[i+1]][1],this.args.path[segments[i+1]][2]);
        var diff = start.clone();
diff.addSelf(end);
        var side = diff.clone().crossSelf(new THREE.Vector3(0,1,0)).normalize().multiplyScalar(this.args.physical.width || 10);
        //console.log('start', start, 'end', end, 'diff', diff, 'side', side);
        this.geometry.vertices.push(new THREE.Vertex(start.clone().addSelf(side)));
        this.geometry.vertices.push(new THREE.Vertex(end.clone().addSelf(side)));
        this.geometry.vertices.push(new THREE.Vertex(start.clone().addSelf(side.multiplyScalar(-1))));
        this.geometry.vertices.push(new THREE.Vertex(end.clone().addSelf(side)));
      } 
      var blah = new THREE.Line(this.geometry, new THREE.LineBasicMaterial({ color: 0x000000, linewidth: this.args.physical.width || 10}), THREE.LinePieces);
      this.addChild(blah);
    }
  }
  this.init();
});
elation.space.meshes.road.prototype = new THREE.Object3D();
elation.space.meshes.road.prototype.constructor = elation.space.meshes.road;
