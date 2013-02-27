elation.extend('pointerlock', function(controls) {
  this.controls = controls;
  this.container = this.controls.container;
  this.mainmenu = elation.space.menu.main;
  
  this.init = function() {
    console.log('pointerlock init',this);
    elation.events.add(this.container, 'click', this);
    elation.events.add(window, 'pointerlockchange,mozpointerlockchange,webkitpointerlockchange', this);
    
    elation.html.addclass(document.body, 'show_interface');
  }
  
  this.click = function(element) {
    if (!this.locked)
      this.request();
  }
  
  this.request = function(element) {
    this.container.webkitRequestPointerLock();
  }

  this.exit = function() {
    document.webkitExitPointerLock();
  }

  this.pointerlockchange = function(event) {
    if (document.pointerLockElement === this.container || document.mozPointerLockElement === this.container || document.webkitPointerLockElement === this.container) {
      this.locked = true;
      elation.html.removeclass(document.body, 'show_interface');
    } else {
      this.locked = false;
      elation.html.addclass(document.body, 'show_interface');
    }
    
    this.controls.state.mouse_x = 0;
    this.controls.state.mouse_y = 0;
    this.controls.state['mouse_drag_x'] = 0;
    this.controls.state['mouse_drag_y'] = 0;
    this.controls.changes.push("mouse_drag_x");
    this.controls.changes.push("mouse_drag_y");
    this.controls.pointerlock = this.locked;
    this.mainmenu.toggle(this.locked);
  }
  
  this.handleEvent = function(event) {
    var replace = {
      'pointerlockchange':'pointerlockchange',
      'mozpointerlockchange':'pointerlockchange',
      'webkitpointerlockchange':'pointerlockchange'
    };
    
    var type = replace[event.type] ? replace[event.type] : event.type;
    this[type](event);
  }
  
  this.init();
});