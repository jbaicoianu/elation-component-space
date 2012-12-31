elation.extend("space.meshes.spaceship", function(args) {
  elation.space.thing.call( this, args, this );
  this.moveState = { up: 0, down: 0, left: 0, right: 0, forward: 0, back: 0, pitchUp: 0, pitchDown: 0, yawLeft: 0, yawRight: 0, rollLeft: 0, rollRight: 0 };

  this.postinit = function() {
    //console.log('### CAMERA GENERATED',this);
    this.controller = elation.space.starbinger(0);
    this.camera = this.controller.camera;
    
    var pos = this.get(args, 'properties.physical.position');
    this.camera.position.x = pos[0];
    this.camera.position.y = pos[1];
    this.camera.position.z = pos[2];
    
    //this.add(this.camera);
    this.postinit2();
    
    this.select();
  }
  
  this.postinit2 = function() {
    //console.log('### SPACESHIP POSTINIT');
    elation.space.controls(0).addContext("spaceship", {
      'move_up': function(ev) { this.moveState.up = ev.value; },
      'move_down': function(ev) { this.moveState.down = ev.value; },
      'move_left': function(ev) { this.moveState.left = ev.value; },
      'move_right': function(ev) { this.moveState.right = ev.value; },
      'move_forward': function(ev) { this.moveState.forward = ev.value; },
      'move_backward': function(ev) { this.moveState.back = ev.value; },
      'forward': function(ev) { this.forward(ev.value); },
      'reverse': function(ev) { this.reverse(ev.value); },
      'wheel_target': function(ev) { this.mwheel(ev); },
      'jump': function(ev) { this.jump(ev.value); }
    });
    elation.space.controls(0).addBindings("spaceship", {
      'mousewheel': 'wheel_target',
      'keyboard_w': 'move_forward',
      'keyboard_a': 'move_left',
      'keyboard_s': 'move_backward',
      'keyboard_d': 'move_right',
      'keyboard_j': 'jump'
    });
    
    elation.space.controls(0).activateContext('spaceship', this);
  }
  
  this.mwheel = function(ev) {
		var	event = ev ? ev : window.event;
				mwdelta = (event.wheelDelta) 
					? (event.wheelDelta / 120) 
					: (event.detail) 
						? (-event.detail / 3) 
						: 0;
		
		if (window.opera) mwdelta = -mwdelta;		
		console.log(ev, mwdelta);
		this.mwdelta = mwdelta;
    
    if (elation.utils.arrayget(elation, 'ui.hud.radar')) {
      if (mwdelta < 0)
        elation.ui.hud.radar.nextTarget();
      else
        elation.ui.hud.radar.prevTarget();
    }
  }
  
  this.forward = function(event) {
    console.log('### SPACESHIP FORWARD', event, this);
  }
  
  this.reverse = function(event) {
    console.log('### SPACESHIP REVERSE', event, this);
  }
  
  this.jump = function(event) {
    console.log('### SPACESHIP JUMP', event);
    
    if (event) {
      this.controller.clearScene();
      elation.ui.hud.radar.contacts = [];
      return;
    }
    
    elation.ajax.Get('/~lazarus/elation/index.php/space/starbinger.jsi', null, {
      callback: function(stuff) { 
        var stuff = elation.JSON.parse(stuff); 
        var controller = elation.space.starbinger(0);
        
        controller.args = stuff.data;
        controller.addObjects(stuff.data.sector, controller.scene); 
      }}
    );
  }
  
  this.init();
});
elation.space.meshes.spaceship.prototype = new elation.space.thing();
elation.space.meshes.spaceship.prototype.supr = elation.space.thing.prototype
elation.space.meshes.spaceship.prototype.constructor = elation.space.meshes.spaceship;
