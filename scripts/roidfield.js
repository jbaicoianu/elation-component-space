elation.extend("space.meshes.roidfield", function(args, controller) {
  elation.space.thing.call(this, args);
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
        };
    
    for (var i=0; i<physical.count; i++) {
      var rand = Math.pow(Math.random(), 8),
          minscale = 20,
          maxscale = 500,
          radius = physical.fieldradius,
          diameter = radius * 2,
          scale = maxscale * rand,
          scale = scale < minscale ? minscale : scale,
          pos = new THREE.Vector3(
            Math.random() * diameter - radius,
            Math.random() * diameter - radius,
            Math.random() * diameter - radius
          ),
          type = 'roid',
          name = this.name + '_' + i,
          texture = '/~lazarus/elation/images/space/'+random(textures)+'.jpg',
          x = this.position.x + pos.x,
          y = this.position.y + pos.y,
          z = this.position.z + pos.z,
          roid = {
            type: type,
            name: name,
            properties: {
              render: {
                mesh: render.mesh+random(meshes)+'.js',
                texture: texture
              },
              physical: {
                rotation: [ Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI ],
                position: [ x, y, z ],
                radius: 10 * scale,
                mass: 10 * scale,
                maxscale: maxscale,
                scale: [ scale, scale, scale ]
              }
            }
          };
      
      //this.controller.addObjects(roid, this.controller.scene);
      this.meshes.push(new elation.space.meshes.roid(roid));
    }
  }

  this.init();
});

elation.space.meshes.roidfield.prototype = new elation.space.thing();
