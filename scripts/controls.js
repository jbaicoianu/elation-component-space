elation.component.add("space.controls", {
  contexts: {},
  activecontexts: [],
  bindings: {},
  state: {},
  contexttargets: {},
  changes: [],
  gamepads: [],
  viewport: [],

  init: function() {
    elation.events.add(this.container, "mousedown,mousemove,mouseup", this);
    elation.events.add(window, "keydown,keyup,MozGamepadConnected,gamepadconnected,gamepaddisconnected", this);
  },
  addContext: function(context, actions) {
    this.contexts[context] = actions;
  },
  activateContext: function(context, target) {
    if (this.activecontexts.indexOf(context) == -1) {
      console.log('Activate control context ' + context);
      this.activecontexts.push(context);
    }
    if (target) {
      this.contexttargets[context] = target;
    }
  },
  deactivateContext: function(context) {
    var i = this.activecontexts.indexOf(context);
    if (i != -1) {
console.log('Deactivate control context ' + context);
      this.activecontexts.splice(i, 1);
      if (this.contexttargets[context]) {
        delete this.contexttargets[context];
      }
    }
  },
  addBindings: function(context, bindings) {
    if (!this.bindings[context]) {
      this.bindings[context] = {};
    }
    for (var k in bindings) {
      this.bindings[context][k] = bindings[k];
    }
  },
  update: function() {
    this.pollGamepads();

    if (this.changes.length > 0) {
      var now = new Date().getTime();
      for (var i = 0; i < this.changes.length; i++) {
        for (var j = 0; j < this.activecontexts.length; j++) {
          var context = this.activecontexts[j];
          if (this.bindings[context] && this.bindings[context][this.changes[i]]) {
            var action = this.bindings[context][this.changes[i]];
            if (this.contexts[context][action]) {
              var ev = {timeStamp: now, value: this.state[this.changes[i]]};
              //console.log('call it', this.changes[i], this.bindings[context][this.changes[i]], this.state[this.changes[i]]);
              if (this.contexttargets[context]) {
                ev.data = this.contexttargets[context];
                this.contexts[context][action].call(ev.data, ev);
              } else {
                this.contexts[context][action](ev);
              }
              break; // Event was handled, no need to check other active contexts
            } else {
              console.log('Unknown action "' + action + '" in context "' + context + '"');
            }
          }
        }
      }
      this.changes = [];
    }
  },
  getBindingName: function(type, id, subid) {
    var codes = {
      keyboard: {
        8: 'backspace',
        9: 'tab',
        13: 'enter',
        16: 'shift',
        17: 'ctrl',
        18: 'alt',
        27: 'esc',

        32: 'space',
        33: 'pgup',
        34: 'pgdn',
        35: 'end',
        36: 'home',
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down',

        45: 'insert',
        46: 'delete',
        
        91: 'meta',
        92: 'rightmeta',

        106: 'numpad_asterisk',
        107: 'numpad_plus',
        110: 'numpad_period',
        111: 'numpad_slash',

        144: 'numlock',

        186: 'semicolon',
        187: 'equals',
        188: 'comma',
        189: 'minus',
        190: 'period',
        191: 'slash',
        192: 'backtick',
        220: 'backslash',
        221: 'rightsquarebracket',
        219: 'leftsquarebracket',
        222: 'apostrophe',

        // firefox-specific
        0: 'meta',
        59: 'semicolon',
        61: 'equals',
        109: 'minus',
      },
    }
    var bindname = type + '_unknown_' + id;

    switch (type) {
      case 'keyboard':
        if (codes[type][id]) {
          bindname = type + '_' + codes[type][id];
        } else if (id >= 65 && id <= 90) {
          bindname = type + '_' + String.fromCharCode(id).toLowerCase();
        } else if (id >= 48 && id <= 57) {
          bindname = type + '_' + (id - 48);
        } else if (id >= 96 && id <= 105) {
          bindname = type + '_numpad_' + (id - 96);
        } else if (id >= 112 && id <= 123) {
          bindname = type + '_f' + (id - 111);
        } else {
          console.log('Unknown key pressed: ' + bindname);
        }
        break;
      case 'gamepad':
        bindname = type + '_' + id + '_' + subid;
        break;
    }
    return bindname;
  },
  pollGamepads: function() {
    if (this.gamepads.length > 0) {
      for (var i = 0; i < this.gamepads.length; i++) {
        var gamepad = this.gamepads[i];
        for (var a = 0; a < gamepad.axes.length; a++) {
          var bindname = this.getBindingName('gamepad', i, 'axis_' + a);
          if (this.state[bindname] != gamepad.axes[a]) {
            this.changes.push(bindname);
            this.state[bindname] = gamepad.axes[a];
          }
        }
        for (var b = 0; b < gamepad.buttons.length; b++) {
          var bindname = this.getBindingName('gamepad', i, 'button_' + b);
          if (this.state[bindname] != gamepad.buttons[b]) {
            this.changes.push(bindname);
            this.state[bindname] = gamepad.buttons[b];
          }
        }

      }
    }
  },
  getMousePosition: function(ev) {
    return [(ev.clientX / this.container.offsetWidth - .5) * 2, (ev.clientY / this.container.offsetHeight - .5) * 2];
  },
  mousedown: function(ev) {
    var bindid = "mouse_button_" + ev.button;
    if (!this.state[bindid]) {
      this.state[bindid] = 1;
      this.changes.push(bindid);
    }
  },
  mousemove: function(ev) {
    var mpos = this.getMousePosition(ev);
    var changed = {mouse_pos: false, mouse_x: false, mouse_y: false};
    if (!this.state["mouse_pos"]) {
      changed["mouse_pos"] = true;
      changed["mouse_x"] = true;
      changed["mouse_y"] = true;
    } else {
      if (this.state["mouse_pos"][0] != mpos[0]) {
        changed["mouse_pos"] = true;
        changed["mouse_x"] = true;
      }
      if (this.state["mouse_pos"][1] != mpos[1]) {
        changed["mouse_pos"] = true;
        changed["mouse_y"] = true;
      }
    }
    if (changed["mouse_pos"]) {
      this.changes.push("mouse_pos");
      this.state["mouse_pos"] = mpos;
      if (changed["mouse_x"]) {
        this.state["mouse_delta_x"] = this.state["mouse_x"] - mpos[0];
        this.state["mouse_x"] = mpos[0];
        this.changes.push("mouse_x");
        this.changes.push("mouse_delta_x");
        if (this.state["mouse_button_0"]) {
          this.state["mouse_drag_x"] = this.state["mouse_x"];
          this.state["mouse_drag_delta_x"] = this.state["mouse_delta_x"];
          this.changes.push("mouse_drag_x");
          this.changes.push("mouse_drag_delta_x");
        }
      }
      if (changed["mouse_y"]) {
        this.state["mouse_delta_y"] = this.state["mouse_y"] - mpos[1];
        this.state["mouse_y"] = mpos[1];
        this.changes.push("mouse_y");
        this.changes.push("mouse_delta_y");
        if (this.state["mouse_button_0"]) {
          this.state["mouse_drag_y"] = this.state["mouse_y"];
          this.state["mouse_drag_delta_y"] = this.state["mouse_delta_y"];
          this.changes.push("mouse_drag_y");
          this.changes.push("mouse_drag_delta_y");
        }
      }
    }
  },
  mouseup: function(ev) {
    var bindid = "mouse_button_" + ev.button;
    if (this.state[bindid]) {
      this.state[bindid] = 0;
      this.changes.push(bindid);
    }
  },
  keydown: function(ev) {
    var keyname = this.getBindingName("keyboard", ev.keyCode);
    //console.log(keyname + ' down', ev.value);
    if (!this.state[keyname]) {
      this.changes.push(keyname);
    }
    this.state[keyname] = 1;
  },
  keyup: function(ev) {
    var keyname = this.getBindingName("keyboard", ev.keyCode);
    //console.log(keyname + ' up');
    this.state[keyname] = 0;
    this.changes.push(keyname);
  },
  MozGamepadConnected: function(ev) {
    this.gamepads.push(ev.gamepad);
  },
  gamepadconnected: function(ev) {
alert('e');
    console.log('add a gamepad:', ev);
  },
  gamepaddisconnected: function(ev) {
    console.log('remove a gamepad:', ev);
  }
});
