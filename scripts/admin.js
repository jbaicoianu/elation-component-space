elation.component.add('space.admin', {
  init: function(name, container, args) {
    this.args = args;
    this.controller = elation.space.controller;
    
    this.projector = new THREE.Projector();
    this.mouse = [0,0];
    this.tmpvec = new THREE.Vector3(0,0,.5);
    this.tmpray = new THREE.Ray(this.tmpvec);
    this.projectactive = true;
    this.projectfreq = 4;
    this.projecttime = 0;
    this.objectstates = { hover: false, active: false, editing: false };

    this.inspector = elation.space.admin.inspector("space_admin_inspector", elation.html.create());
    this.container.appendChild(this.inspector.container);
    this.renderelement = this.controller.renderer.domElement;
    
    console.log(args, name, container, this.renderelement, this.controller);
    elation.events.add(this.renderelement, 'mousedown,mouseup,mousemove,click', this);
    elation.events.add(null, 'select', this);

    elation.space.controls(0).addContext("admin", {
      "move_left": function(ev) { this.position.x -= ev.value * 100; },
      "move_right": function(ev) { this.position.x += ev.value * 100; },
      "move_forward": function(ev) { this.position.z -= ev.value * 100; },
      "move_backward": function(ev) { this.position.z += ev.value * 100; },
      "move_up": function(ev) { this.position.y += ev.value * 100; },
      "move_down": function(ev) { this.position.y -= ev.value * 100; },
      "move": function(ev) { elation.space.admin('admin').moveThing(this, ev); }
    });
    elation.space.controls(0).addBindings("admin", {
      "keyboard_w": "move_forward",
      "keyboard_a": "move_left",
      "keyboard_s": "move_backward",
      "keyboard_d": "move_right",
/*
      "mouse_drag_x": "move_left",
      "mouse_drag_y": "move_up"
*/
      "mouse_drag": "move"
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
      root = this.controller.scene;
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
        if (thing == this.findThingParent(this.objectstates['editing'])) {
          elation.html.addclass(item, 'state_editing');
        }
        item.innerHTML = '<strong>' + thing.name + '</strong> <em>(' + thing.type + ')</em>';
        var editlink = elation.html.create({tag: 'a', classname: 'space_admin_thing_edit'});
        editlink.innerHTML = 'edit';
        item.appendChild(editlink);
        if (thing.children.length > 0) {
          this.updateScene(thing, item);
        }
        (function(self, thing) {
          elation.events.add(item, "mouseover,click", function(ev) { 
            
            var objectstate = 'hover';
            if (ev.type == 'click') {
              objectstate = (elation.html.hasclass(ev.target, 'space_admin_thing_edit') ? 'editing' : 'active');
            }
            self.setObjectState(objectstate, thing);
            ev.stopPropagation();
          })
        })(this, thing);
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
    this.controller.scene.add(thing);

    this.updateScene();
    this.updateThingtypes();
  },
  editThing: function(thing) {
    console.log('do what you will with ', thing);
    if (!this.thingeditor) {
      var container = elation.html.create({tag: 'div', classname: 'space_admin_thing_editor'});
      container.innerHTML = 'yes!';
      this.thingeditor = elation.space.admin.thing_editor('thingeditor', container, {direction: 'left'});
      this.container.appendChild(container);
    }
    this.thingeditor.setActiveThing(thing);
  },
  setObjectState: function(state, obj, hoverdata) {
    if (typeof obj == 'undefined') {
      return;
    }
    var evdata;
    if (hoverdata) {
      // FIXME - we're trying to emulate MouseEvents here, but custom events only let you
      //         set attributes within the "data" objects, not as top-level event attributes
      evdata = {
        clientX: hoverdata.point.x,
        clientY: hoverdata.point.y,
        clientZ: hoverdata.point.z,
      };
    }
    if (obj && this.objectstates[state] != obj) {
      var oldobj = this.objectstates[state];
      this.objectstates[state] = obj;

      switch (state) {
        case 'active':
          if (oldobj) {
            elation.events.fire({type: "deselect", element: oldobj});
          }
          if (obj) {
            elation.events.fire({type: "select", element: obj});
          } else {
          }
          break;
        case 'editing':
          if (obj) {
            this.editThing(obj);
          } else {
            this.editThing(false);
          }
          break;
        case 'hover':
          if (evdata) {
            evdata.relatedTarget = obj;
            elation.events.fire({type: "mouseout", element: oldobj, target: oldobj, data: evdata});  
            evdata.relatedTarget = oldobj;
            elation.events.fire({type: "mouseover", element: obj, target: obj, data: evdata});  
          }
          break;
      }
      //console.log('Set ' + state + ' object:', obj);
      this.updateScene();
    } else if (state == 'hover') {
      elation.events.fire({type: "mousemove", element: obj, data: evdata});  
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
  projectMousePosition: function(mousepos) {
    if (!mousepos) {
      mousepos = this.mouse;
    }
    var camera = this.controller.camera;
    this.tmpvec.set(this.mouse[0], -this.mouse[1], -1);
    this.projector.unprojectVector( this.tmpvec, camera );

    this.tmpray.origin = new THREE.Vector3(0,0,0);
    camera.matrixWorld.multiplyVector3(this.tmpray.origin);
    this.tmpray.direction = this.tmpvec.subSelf(this.tmpray.origin).normalize();
    //console.log([this.tmpray.origin.x,this.tmpray.origin.y,this.tmpray.origin.z], [this.tmpray.direction.x,this.tmpray.direction.y,this.tmpray.direction.z]);
    return this.tmpray.intersectScene(this.controller.scene);
  },
  updateHover: function() {
    var intersects = this.projectMousePosition();
    if (intersects.length > 0) {
      var picked = intersects[0];
      for (var i = 0; i < intersects.length; i++) {
        var int = intersects[i];
        if ((int.object.material instanceof THREE.MeshFaceMaterial && 
            int.face.materialIndex &&
            int.object.geometry.materials[int.face.materialIndex] && 
            int.object.geometry.materials[int.face.materialIndex].transparent
            ) || int.object.material.transparent) {
        } else {
          picked = intersects[i];
          break;
        }
      }
      this.setObjectState('hover', this.findThingParent(picked.object), picked);
    } else {
      this.setObjectState('hover', false);
    }
  },
  moveThing: function(thing, mousepos) {
    var intersects = this.projectMousePosition(mousepos);
    var newpoint = false;
    if (intersects.length > 0) {
      for (var i = 0; i < intersects.length; i++) {
        var hoverthing = this.findThingParent(intersects[i].object);
        if (hoverthing != thing && hoverthing != this.objectstates['active']) {
          newpoint = intersects[i].point.clone();
          thing.position.copy(intersects[i].point);
          break;
        }
      }
    }
    if (!newpoint) {
      newpoint = new THREE.Vector3();
      newpoint.add(this.tmpray.origin, this.tmpray.direction.multiplyScalar(100));
    }
    thing.position = newpoint;
  },
  mousemove: function(ev) {
    this.projectmoved = true;
    this.updateMousePosition(ev);

    var now = ev.timeStamp;
    if (this.projectactive && now - this.projecttime > 1000 / this.projectfreq) {
      this.updateHover();
      this.projecttime = now;
      if (this.projecttimer) {
        clearTimeout(this.projecttimer);
      }
      (function(self) {
        self.projecttimer = setTimeout(function() { self.updateHover(); }, 1000 / self.projectfreq);
      })(this);
    }
  },
  mousedown: function(ev) {
    this.projectactive = false;
    this.projectmoved = false;
    this.updateMousePosition(ev);
    this.updateHover(ev);
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

elation.component.add('space.admin.thing_editor', {
  init: function() {
    console.log('here I am');
  },
  setActiveThing: function(thing) {
    if (thing) {
      console.log('go for the thing', thing);
      var foo = '<ul>';
      if (thing && thing.properties) {
        for (var k in thing.properties) {
          foo += '<li>' + k + ' <ul>';
          for (var k2 in thing.properties[k]) {
            foo += '<li>' + k2 + ': ' + thing.properties[k][k2] + '</li>';
          }
          foo += '</ul>';
        }
      }
      foo += '</ul>';
      this.container.innerHTML = foo;
      this.thing = thing;
      
      elation.space.controls(0).activateContext("admin", thing);

      var fuh = elation.html.create({tag: 'a', classname: 'space_admin_thing_editor_close', content: 'close'});
      this.container.appendChild(fuh);
      elation.events.add(fuh, 'click', this);
      this.container.style.display = 'block';
    } else {
      this.container.innerHTML = '';
      this.container.style.display = 'none';
    }
  },
  click: function(ev) {
    elation.space.controls(0).deactivateContext("admin");
    elation.space.admin('admin').setObjectState('editing', false);
  }
});
elation.component.add('space.admin.inspector', {
  init: function() {
  }
});
elation.extend('space.debug', new function() {
  this.watching = {};
    
  this.init = function() {
  }
  this.watch = function(name, thing) {
  }
  this.update = function(ts) {
  }
});
