window.usewebgl = true && !!window.WebGLRenderingContext;

elation.component.add("spacecraft.world", {
  init: function(name, container, args) {
    this.name = name;
    this.container = container;
    this.args = args;
    this.contextmenu = elation.ui.contextmenu("spacecraft_clickmenu");
    //this.contextmenu.setParent(this.container);

    window.usehighres = this.args.highres || false;

    elation.events.add(this.container, "click", this);
    //this.initRenderer();

    this.blah = elation.html.create({tag:'div', classname:'spacecraft_thing spacecraft_thing_sector'});
    this.container.appendChild(this.blah);

    var things = {};
    things[args.name] = args;
if (things[args.name]['properties'] == null) delete things[args.name]['properties'];
console.log(args, things[args.name]);
    elation.utils.arrayset(things[args.name], "properties.physical.position", [0, 0, 0]);

    this.thing = elation.spacecraft.thing("blahblah", this.blah, {type: "sector", scale: 1/1e4, parent: this, scene: this.args.scene, things: things}); //, parent: this.container});
    //this.thing.addthing(args.type, args.name, args);
    this.go();
  },
  go: function() {
    this.frametime = 1000/60;
    //this.timemultiplier = 60 * 60 * 24 * 10;
    //this.timemultiplier = 60 * 60 *24;
    //this.timemultiplier = 60;
    this.timemultiplier = 1;
    this.lastframetime = new Date().getTime();
    (function(self) {
      self.mainloop = setInterval(function() {
        var now = new Date().getTime();
        self.render(self.timemultiplier * ((now - self.lastframetime) / 1000)); 
        self.lastframetime = now;
      }, self.frametime);
      //self.gfxloop = setInterval(function() { elation.spacecraft.planet(self.args.scene).loop(); }, self.frametime * (window.usewebgl ? 1 : 10));
    })(this);
  },

  handleEvent: function(ev) {
    if (typeof this[ev.type] == 'function') {
      return this[ev.type](ev);
    }
  },

  click: function(ev) {
    if (ev.target == this.container) {
      this.contextmenu.toggle(ev);
    } else {
      this.contextmenu.hide(ev);
    }
  },
  destroy: function(ev) {
    console.log("destroying something: ", ev);
  },
  getsize: function() {
    return [this.container.offsetWidth, this.container.offsetHeight];
  },
  getposition: function() {
    return [0, 0, 0];
  },
  render: function(t) {
    this.thing.render(t);
/*
    elation.spacecraft.planet(this.args.scene).loop();
*/
  }
});
elation.component.add("spacecraft.thing", {
  init: function(name, container, args) {
    this.name = name;
    this.args = args || {};
    this.type = this.args.type;
    this.container = (container ? container : elation.html.create({'tag': 'div', 'classname': 'spacecraft_thing'}));
    this.parent = this.args.parent;
    this.things = {};
    this.scene = this.args.scene || false;
    elation.html.addclass(this.container, 'spacecraft_thing');
    if (this.args.type) {
      elation.html.addclass(this.container, 'spacecraft_thing_' + this.args.type);
      //this.container.innerHTML = '<img src="/elation/images/spacecraft/' + this.args.type + '.png" />';
    }
    if (this.args.properties) {
      this.properties = this.args.properties || {};
    }
    this.container.innerHTML = this.name;
    this.container.title = this.name;
    if (this.parent) {
      this.parent.container.appendChild(this.container);
    }
    if (elation.utils.arrayget(this, "properties.physical.position")) {
      this.setposition(elation.utils.arrayget(this, "properties.physical.position"));
    } else {
      this.setposition([0, 0, 0]);
    }
    this.scale = (this.parent ? this.parent.scale : this.args.scale || 1);
    if (elation.utils.arrayget(this, "properties.physical.mass")) {
      this.mass = elation.utils.arrayget(this, "properties.physical.mass");
    }
    if (this.args.things) {
      var maxdist = 0;
      for (var k in this.args.things) {
        if (elation.utils.arrayget(this.args.things[k], "properties.physical.position")) {
          var tdist = $V(elation.utils.arrayget(this.args.things[k], "properties.physical.position")).modulus();
          if (tdist > maxdist) {
            maxdist = tdist;
          }    
        }
      }
      this.scale = (this.type == "planet" ? (this.parent.container.offsetHeight / (maxdist * 1.2)) / 2 : (this.parent ? this.parent.scale : 1)) || 1;
    //console.log('scale for ' + this.name + ' is ', this.scale, this.parent.scale,  maxdist);
      for (var k in this.args.things) {
        //console.log('add thing ' + k, this.args.things[k]);
        this.args.things[k].scene = this.args.scene;
        this.addthing(this.args.things[k].type, k, this.args.things[k]);
      }
    } else {
    }
      this.scale = (this.type == "planet" ? (this.parent.container.offsetHeight / (elation.utils.arrayget(this, "properties.physical.radius", 1) * .1)) * 4 : (this.parent ? this.parent.scale : 1)) || 1;
      this.scale = (this.type == "planet" ? (this.parent.container.offsetHeight / (elation.utils.arrayget(this, "properties.physical.radius", 1) * .1)) * 4 : (this.parent ? this.parent.scale : 1)) || 1;
      console.log('scale for ' + this.name + ' is ', this.scale);
    this.containeroffset = (this.name == 'blahblah' ? [this.container.offsetWidth / 2, this.container.offsetHeight / 2] : [elation.utils.arrayget(this, "properties.physical.radius", 2) / 2 * this.scale, elation.utils.arrayget(this, "properties.physical.radius", 2) / 2 * this.scale]);
    if (this.type != 'sector') {
      var radius = elation.utils.arrayget(this, "properties.physical.radius", 1) * this.scale;
      if (radius < 1)
        radius = 1;
      this.container.style.width = this.container.style.height = radius + 'px';
    }

    var behaviors = elation.utils.arrayget(this, "properties.behaviors");
    var dynamicsopts = {};
    if (behaviors) {
      //console.log(behaviors);
      for (var k in behaviors) {
        if (k == "orbit" && behaviors[k] == 1 && this.parent && this.parent.mass) {
          var tpos = $V(this.pos).to3D();
          var initvel = Math.sqrt(6.67428e-11 * this.parent.mass / tpos.modulus());
          //console.log(this.parent.mass, initvel, tpos.modulus());
          var dynamicsopts = {
            position: this.pos, 
            velocity: [initvel, 0, 0],
            angularvelocity: elation.utils.arrayget(this, "properties.physical.angularvelocity", [0, 0, 0]),
            mass: this.mass
          };
          (function(self) { dynamicsopts['onmove'] = function(pos) { self.setposition(pos, {dynamics: true}); }})(this);
        }
      }
    }
    if (elation.utils.arrayget(this, "properties.physical.angularvelocity")) {
      //dynamicsopts['angularvelocity'] = elation.utils.arrayget(this, "properties.physical.angularvelocity");
      (function(self) { dynamicsopts['onrotate'] = function(rot) { self.rotate(rot); }})(this);
    }
    
    this.dynamics = new elation.utils.dynamics(this, dynamicsopts);

    (function(self) { 
      setTimeout(function() { self.createMesh(); }, 1);
    })(this);
    this.render(0);
    elation.events.add(this.container, "mousedown,click", this);
    //console.log('created thing: ', this.name, this);
    //this.contextmenu = elation.ui.contextmenu("spacecraft_clickmenu");
  },
  createMesh: function() {
    if (this.name == "blahblah") return;

    var viewport = elation.spacecraft.viewport(this.scene)
    //var scale = 1 / 1e4;
    var meshpos = new THREE.Vector3(this.pos[0] * this.scale, this.pos[1] * this.scale, this.pos[2] * this.scale);
    var planetargs = {
      radius: elation.utils.arrayget(this, "properties.physical.radius", 1) * this.scale,
      texture: elation.utils.arrayget(this.properties, "render.texture", false),
      nighttexture: elation.utils.arrayget(this.properties, "render.nighttexture", false),
      heightmap: elation.utils.arrayget(this.properties, "render.heightmap", false),
      //showsearches: (this.name == "earth")
    };
    //texture = '/elation/images/space/earth_' + (window.usehighres == 1 ? '8k' : '1k') + '_color.jpg';
if (0) {
    var material = (window.usewebgl ? new THREE.MeshPhongMaterial(materialargs) : new THREE.MeshBasicMaterial(materialargs))

    var wireframematerial = new THREE.MeshBasicMaterial({color: 0x113311, wireframe: true, wireframeLinewidth: 1, shading: THREE.FlatShading, blending: THREE.AdditiveBlending, opacity: 1});
    geometry.computeTangents();

    //if (elation.spacecraft.controls(0).getValue("wireframe")) {
      //materials[0].push(wireframematerial);
    //}
    //materials[0][1].opacity = (elation.spacecraft.controls(0).getValue("wireframe") / 2);
}

    this.mesh = new elation.spacecraft.meshes.planet(planetargs);
    this.mesh.position = meshpos;
    viewport.addObject(this.mesh);

    /* vertex display mode
    var particlematerial = new THREE.ParticleBasicMaterial({size: 15, map: ImageUtils.loadTexture( "/~bai/three.js/examples/textures/sprites/ball.png"), blending: THREE.BillboardBlending, vertexColors: true });
    var particles = new THREE.ParticleSystem(geometry, particlematerial);
    particles.sortParticles = true;
    particles.updateMatrix();
    viewport.addObject(particles);
    */
  },
  render: function(t) {
    if (this.dynamics) {
      var gforce = $V([0, 0, 0]);
      var other = this.parent;
      var me = this;
      while (other != false) {
        var ppos = $V(other.getposition()).to3D();
        var mpos = $V(this.getposition()).to3D();
        var vec = ppos.subtract(mpos);
        var dist = vec.modulus();//20; //128; // FIXME - magic number, dependent on time - probably need to use fancy calculus for gravity instead of calculating iteratively
        gforce = gforce.add(vec.toUnitVector().multiply((6.67428e-11 * this.mass * other.mass) / (dist * dist)));
//console.log('dist between ' + this.name + ' and ' + other.name + ' is ' + dist + ', and force is ' + gforce.modulus());
        me = other;
        other = (other.parent && other.parent.mass ? other.parent : false);
other = false; // FIXME - should be calculating gravity all the way up the heirarchy (moons orbit planets which orbit suns)
      }
      this.dynamics.addForce("gravity", gforce);

      this.dynamics.iterate(t);
    }
    if (this.container) {
      this.container.style.left = ((this.parent && this.parent.containeroffset ? this.parent.containeroffset[0] : 0) + (this.pos[0] * this.scale)) + 'px';
      this.container.style.top = ((this.parent && this.parent.containeroffset ? this.parent.containeroffset[1] : 0) + (this.pos[2] * this.scale)) + 'px';
    }
    for (var k in this.things) {
      this.things[k].render(t);
    }
  },
  handleEvent: function(ev) {
    if (typeof this[ev.type] == 'function') {
      return this[ev.type](ev);
    }
  },
  mousedown: function(ev) {
    this.dragging = true;
    this.cancelclick = false;
    if (ev.button == 0) {
      this.dragstart = [ev.clientX, ev.clientY];
      elation.events.add(document, "mousemove,mouseup", this);
      ev.preventDefault();
      ev.stopPropagation();
    }
  },
  mousemove: function(ev) {
    this.cancelclick = true;
    var diff = [this.dragstart[0] - ev.clientX, this.dragstart[1] - ev.clientY];
    this.dragstart = [ev.clientX, ev.clientY];
    //this.container.style.left = (this.container.offsetLeft - diff[0]) + 'px';
    //this.container.style.top = (this.container.offsetTop - diff[1]) + 'px';
    this.setposition([this.pos[0] - (diff[0] / this.scale), this.pos[1], this.pos[2] - (diff[1] / this.scale)]);
  },
  mouseup: function(ev) {
    this.dragging = false;
    elation.events.remove(document, "mousemove,mouseup,mouseleave", this);
  },
  click: function(ev) {
    if (!this.cancelclick) {
      var contextmenu = elation.ui.contextmenu("spacecraft_clickmenu");
      if (ev.target == this.container) {
        contextmenu.clear();
        if (this.properties && this.properties.capacity) {
          for (var k in this.properties.capacity) {
            contextmenu.add("Build " + k, [this, "create", k]);
          }
        }
        contextmenu.toggle(ev);
      } else {
        contextmenu.hide(ev);
      }
      ev.preventDefault();
      ev.stopPropagation();
    }
  },
  create: function(ev) {
    var ppos = elation.html.dimensions(this.container);
    var newthing = this.addthing(ev.data, ev.data + "_" + parseInt(Math.random() * 1000), { pos: [ (ev.clientX - ppos.x), (ev.clientY - ppos.y) ], radius: 1, parent: this, quantity: 1, mass: this.mass / 300, behaviors: ["orbit"]});
  },
  addthing: function(type, name, thingargs) {
    //var ppos = this.getposition();
    thingargs.type = type;
    if (!thingargs.parent) {
      thingargs.parent = this;
    }
    if (this.things[name]) {
      console.log('thing already exists: ' + name);
    } else {
      this.things[name] = elation.spacecraft.thing(name, elation.html.create({tag:'div'}), thingargs);
    }
    return this.things[name];  
  },
  getposition: function() {
    var parentpos = [0, 0, 0];
    if (this.parent) {
      parentpos = this.parent.getposition();
    }
    return [parentpos[0] + this.pos[0], parentpos[1] + this.pos[1], parentpos[2] + this.pos[2]];
  },
  setposition: function(pos, skip) {
    if (typeof skip == 'undefined') skip = {};
    if (pos && !skip['self']) {
      this.pos = pos;
    } else if (!pos) {
      pos = this.pos;
    }
    if (this.dynamics && !skip['dynamics']) {
      this.dynamics.pos = $V(this.pos);
    }
    if (this.mesh && !skip['mesh']) {
      var abspos = this.getposition();
      this.mesh.position.x = abspos[0] * this.scale;
      this.mesh.position.y = abspos[1] * this.scale;
      this.mesh.position.z = abspos[2] * this.scale;
    } 
  },
  rotate: function(rot) {
    if (this.mesh) {
      //this.mesh.rotation.addSelf(rot);
      this.mesh.rotation.x += rot[0];
      this.mesh.rotation.y += rot[1];
      this.mesh.rotation.z += rot[2];
    }
  },
  thingsSetAttribute: function(name, value, root) {
    if (root == undefined)
      root = this.things;
    for (var k in root) {
      elation.utils.arrayset(root[k], name, value);
      if (root[k].things) {
        this.thingSetAttribute(name, value, root[k].things);
      }
    }
  }
});
elation.component.add("spacecraft.controls", {
  init: function(name, container, args) {
    this.name = name;
    this.container = container;
    this.args = args;

/*
    if (this.container.nodeName == 'FORM') {
      for (var k in this.container.elements) {
        console.log(k, this.container.elements[k]);
      }
    }
*/
    elation.events.add(this.container, "submit", this);
  },
  getValue: function(name) {
    for (var k in this.container.elements) {
      if (this.container.elements[k].name == name) {
        return parseFloat(this.container.elements[k].value);
      }
    }
    return undefined;
  },
  handleEvent: function(ev) {
    if (typeof this[ev.type] == 'function') return this[ev.type](ev);
  },
  submit: function(ev) {
try {
    for (var k in this.container.elements) {
      var el = this.container.elements[k];
      switch (el.name) {
        case 'movespeed':
          elation.spacecraft.planet('spacecraft_planet_render').camera.movementSpeed = el.value;
          break;
        case 'highres':
          for (var k in elation.spacecraft.thing.obj) {
            var obj = elation.spacecraft.thing(k);
            if (obj.mesh && obj.mesh.setHighres) {
              obj.mesh.setHighres(el.checked);
            }
          }
          break;
        case 'wireframe':
          for (var k in elation.spacecraft.thing.obj) {
            var obj = elation.spacecraft.thing(k);
            if (obj.mesh && obj.mesh.setWireframe) {
              obj.mesh.setWireframe(el.checked);
            }
          }
          break;
      }
//document.getElementById("spacecraft_dashboard").focus();
    }
} catch(e) {
console.log(e);
}
    ev.preventDefault();
  }
  
});
