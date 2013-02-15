elation.extend("space.meshes.roidfield", function(args, controller) {
  elation.space.thing.call( this, args);
  this.args = args;
  this.controller = controller;
  this.meshes = [];
  this.counter = 0;
  this.geometry = new THREE.Geometry();
  this.expose = [
    'id',
    'rotation',
    'position'
  ];
  
  this.postinit = function() {
    var properties = this.properties,
        render = properties.render,
        physical = properties.physical,
        textures = ['moonmap1024','phobos_2k_color','mars_1k_color','mercurymap','venusmap'],
        meshes = ['','1','2'],
        random = function(array) {
          return array[Math.floor((array.length-.001) * Math.random())];
        },
        load = function(self, roid) {
          var loader = new THREE.JSONLoader();
          loader.load({ model: roid.mesh, callback: function(geometry) { 
            geometry.computeVertexNormals();
            self.loadMesh(geometry, roid, self); 
          }});
        };
    
    for (var i=0; i<physical.count; i++) {
      var rand = Math.pow(Math.random(), 8),
          minscale = 20,
          maxscale = 500,
          radius = physical.radius,
          diameter = radius * 2,
          scale = maxscale * rand,
          scale = scale < minscale ? minscale : scale,
          pos = new THREE.Vector3(
            Math.random() * diameter - radius,
            Math.random() * diameter - radius,
            Math.random() * diameter - radius
          ),
          type = 'asteroid',
          name = this.name + '_' + i,
          roid = {
            id: i,
            texture: '/~lazarus/elation/images/space/'+random(textures)+'.jpg',
            mesh: render.mesh+random(meshes)+'.js',
            scale: scale,
            maxscale: maxscale,
            rotation: new THREE.Vector3(
              Math.random() * Math.PI, 
              Math.random() * Math.PI, 
              Math.random() * Math.PI
            ),
            pos: pos,
            position: new THREE.Vector3(
              this.position.x + pos.x,
              this.position.y + pos.y,
              this.position.z + pos.z
            ),
            type: type,
            name: name,
            thing: {
              type: type,
              args: { name: name },
              position: {
                x: this.position.x + pos.x,
                y: this.position.y + pos.y,
                z: this.position.z + pos.z
              },
              properties: {
                physical: {
                  radius: 1 
                }
              }
            }
          };
      
      elation.ui.hud.radar.addContact(roid);
      load(this, roid);
    }
    
    this.i = i;
    elation.events.add(null, 'renderframe_start', this);
  }
  
  this.loadMesh = function(geometry, roid, self) {
    var texture = THREE.ImageUtils.loadTexture(roid.texture),
        //material = new THREE.MeshFaceMaterial({color: 0x222222, shading: THREE.FlatShading});
        material = new THREE.MeshPhongMaterial({ map: texture, shading: THREE.SmoothShading, blending: THREE.AdditiveAlphaBlending });
    
    var mesh = new THREE.Mesh(geometry, material);
    mesh.generated = roid;
    //var mesh = new THREE.Mesh(new THREE.SphereGeometry(7,6,6),material);
    this.meshes[roid.id] = mesh;

    mesh.receiveShadow = true;
    mesh.position.set(roid.position.x, roid.position.y, roid.position.z);
    mesh.rotation.copy(roid.rotation);
    mesh.scale.set(roid.scale, roid.scale, roid.scale);
    
    if (!this.controller.objects[roid.type])
      this.controller.objects[roid.type] = {};
      
    if (!this.controller.objects[roid.type][roid.name])
      this.controller.objects[roid.type][roid.name] = [];    
    
    this.controller.objects[roid.type][roid.name].push(mesh);
    
    this.controller.scene.add(mesh);
    this.updateCollisionSize();
  }
  
  this.renderframe_start = function(ev) {
    var min = .00005,
        max = .0005,
        mesh, aspect, speed;
    
    for (var i=0; i<this.meshes.length; i++) {
      mesh = this.meshes[i],
      aspect = 1 - (mesh.generated.maxscale / mesh.generated.scale),
      speed = (max - min) * aspect + min;
      
      mesh.rotation.z += speed;
      mesh.rotation.y += -speed*1.5;
    }
  }

  this.init();
});

elation.space.meshes.roidfield.prototype = new elation.space.thing();
