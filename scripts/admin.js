elation.component.add('space.admin', {
  init: function() {
    this.projector = new THREE.Projector();
    this.mouse = [0,0];
    this.tmpvec = new THREE.Vector3(0,0,.5);
    this.tmpray = new THREE.Ray(this.tmpvec);
    this.projectactive = true;
    this.projectfreq = 4;
    this.projecttime = 0;
    this.objectstates = { hover: false, active: false };

    this.inspector = elation.space.admin.inspector("space_admin_inspector", elation.html.create());
    this.container.appendChild(this.inspector.container);

    // FIXME - dumb
    this.renderelement = elation.space.fly(0).renderer.domElement;
    elation.events.add(this.renderelement, 'mousedown,mouseup,mousemove,click', this);
    elation.events.add(null, 'select', this);

    elation.space.controls(0).addContext("admin", {
      "move_left": function(ev) { this.position.x -= ev.value * 100; },
      "move_right": function(ev) { this.position.x += ev.value * 100; },
      "move_forward": function(ev) { this.position.z -= ev.value * 100; },
      "move_backward": function(ev) { this.position.z += ev.value * 100; },
      "move_up": function(ev) { this.position.y += ev.value * 100; },
      "move_down": function(ev) { this.position.y -= ev.value * 100; },
    });
    elation.space.controls(0).addBindings("admin", {
      "keyboard_w": "move_forward",
      "keyboard_a": "move_left",
      "keyboard_s": "move_backward",
      "keyboard_d": "move_right",
      "mouse_drag_delta_x": "move_left",
      "mouse_drag_delta_y": "move_up"
    });
    
    this.updateThingtypes();
    this.updateScene();
  },
  getThingTypes: function() {
    var itemtypes = [];
    for (var k in elation.space.meshes) {
      itemtypes.push(k);
    }
    return itemtypes;
  },
  updateThingtypes: function() {
    if (!this.typeselect) {
      if (elation.ui.select) {
        var selectid = "space_admin_thingtypes";
        this.typeselect = elation.ui.select(selectid, elation.html.create({tag: 'select', id: selectid}));
        var label = elation.html.create({tag: 'label', content: 'Add thing:', additional: {'htmlFor': selectid}});
        label.htmlFor = selectid;
        this.container.appendChild(label);
        this.container.appendChild(this.typeselect.container);
        elation.events.add([this.typeselect], "ui_select_change", this);
      } else {
        (function(self) {
          elation.file.get('javascript', '/scripts/ui/select.js', function() {
            self.updateThingtypes();
          })
        })(this);
      }
    }
    if (this.typeselect) {
      var types = ['', '-- load --'];
      types = types.concat(this.getThingTypes());
      this.typeselect.setItems(types);
    }
  },
  updateScene: function(root, el) {
    if (!root) {
      root = elation.space.fly(0).scene;
    }
    if (!el) {
      if (!this.scenelist) {
        this.scenelist = elation.html.create({tag: 'div', classname: 'space_admin_scene'});
        this.container.appendChild(this.scenelist);
      } else {
        this.scenelist.innerHTML = '';
      }
      el = this.scenelist;
    }
    var list = elation.html.create({'tag': 'ul', 'classname': 'space_admin_scene_thinglist'});
    for (var i = 0; i < root.children.length; i++) {
      var item = elation.html.create({'tag': 'li', 'classname': 'space_admin_scene_thing'});  
      var thing = root.children[i];
      if (thing instanceof elation.space.thing) {
        if (thing == this.findThingParent(this.objectstates['hover'])) {
          elation.html.addclass(item, 'state_hover');
        }
        if (thing == this.findThingParent(this.objectstates['active'])) {
          elation.html.addclass(item, 'state_active');
        }
        item.innerHTML = '<strong>' + thing.name + '</strong> <em>(' + thing.type + ')</em>';
        if (thing.children.length > 0) {
          this.updateScene(thing, item);
        }
        list.appendChild(item);
      }
    }
    el.appendChild(list);
  },
  findThingParent: function(thing) {
    var ret = thing;
    while (!(ret instanceof elation.space.thing) && typeof ret != 'undefined') {
      ret = ret.parent;
    }
    return ret;
  },
  createThing: function(type) {
    var name = prompt("Name for new " + type + "?");
    var thing = new elation.space.meshes[type]({name: name, type: type, physical: {position: [0,0,0]}});
    //thing.init();
    console.log('made the new thing', thing);
    elation.space.fly(0).scene.add(thing);

    this.updateScene();
    this.updateThingtypes();
  },
  setObjectState: function(state, obj) {
    if (typeof obj != 'undefined' && this.objectstates[state] != obj) {
      var oldobj = this.objectstates[state];
      this.objectstates[state] = obj;

      if (state == 'active') {
        if (oldobj) {
          elation.events.fire({type: "deselect", element: oldobj});
        }
        if (obj) {
          elation.events.fire({type: "select", element: obj});
          //elation.space.controls(0).activateContext("admin", obj);
        } else {
          //elation.space.controls(0).deactivateContext("admin");
        }
      }
      //console.log('Set ' + state + ' object:', obj);
      this.updateScene();
    }
  },
  ui_select_change: function(ev) {
    var thingtype = ev.data;
    if (thingtype == '-- load --') {
      var thingtype = prompt("New thing type to load:");
      console.log('gotta load for ' + thingtype);
    }
    if (typeof elation.space.meshes[thingtype] == 'undefined') {
      (function(self) {
        elation.file.get('javascript', '/scripts/space/' + thingtype + '.js', function() {
          self.createThing(thingtype);
        });
      })(this);
    } else {
      this.createThing(thingtype);
    }
  },
  updateMousePosition: function(ev) {
    var viewsize = [this.renderelement.offsetWidth, this.renderelement.offsetHeight];
    this.mouse[0] = ( ev.clientX / viewsize[0] ) * 2 - 1;
    this.mouse[1] = ( ev.clientY / viewsize[1] ) * 2 - 1;
  },
  projectMousePosition: function() {
    var camera = elation.space.fly(0).camera;
    this.tmpvec.set(this.mouse[0], -this.mouse[1], .5);
    this.projector.unprojectVector( this.tmpvec, camera );

    this.tmpray.origin = new THREE.Vector3(0,0,0);//camera.position.clone();
    camera.matrix.multiplyVector3(this.tmpray.origin);
    // FIXME - direction is wrong when camera is not at center...
    this.tmpray.direction = this.tmpvec.subSelf(this.tmpray.origin).normalize();
    var intersects = this.tmpray.intersectScene(elation.space.fly(0).scene);
    if (intersects.length > 0) {
      this.setObjectState('hover', this.findThingParent(intersects[0].object));
    } else {
      this.setObjectState('hover', false);
    }
  },
  mousemove: function(ev) {
    this.projectmoved = true;
    this.updateMousePosition(ev);

    var now = ev.timeStamp;
    if (this.projectactive && now - this.projecttime > 1000 / this.projectfreq) {
      this.projectMousePosition();
      this.projecttime = now;
      if (this.projecttimer) {
        clearTimeout(this.projecttimer);
      }
      (function(self) {
        self.projecttimer = setTimeout(function() { self.projectMousePosition(); }, 1000 / self.projectfreq);
      })(this);
    }
  },
  mousedown: function(ev) {
    this.projectactive = false;
    this.projectmoved = false;
    this.updateMousePosition(ev);
    this.projectMousePosition(ev);
  },
  mouseup: function(ev) {
    this.projectactive = true;
    if (!this.projectmoved) {
      this.setObjectState('active', (typeof this.objectstates['hover'] != 'undefined' ? this.objectstates['hover'] : false));
    }
  },
  select: function(ev) {
    console.log("YEAHH!!!!", ev);
  }
});

elation.component.add('space.admin.inspector', {
  init: function() {
  }
});
