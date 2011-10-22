elation.extend('ui.hud', new function() {
  this.widgets = [ 'rotacol', 'radar', 'altimeter' ];
  this.ticks = 0;
  
  // there is one clock, but this controls which widgets get fired at what intervals
  this.timings = {
    rotacol: 10,
    radar: 2,
    altimeter: 4
  };
  
  this.init = function() {
    for (var i=0; i<this.widgets.length; i++) {
      var widget = this.widgets[i];
      
      this[widget] = new elation.ui.widgets[widget](this);
    }
    
    (function(self) {
      setInterval(function() {
        self.render();
      }, 25);
    })(this);
  }
  
  this.render = function() {
    this.ticks++;
    
    for (var i=0; i<this.widgets.length; i++) {
      var widget = this.widgets[i];
      
      if (this.ticks % (this.timings[widget] || 2) == 0)
        this[widget].render();
    }
  }
});

elation.extend('ui.widgets.radar', function(hud) {
  this.hud = hud;
  this.range = 8400;
  this.width = 200;
  this.height = 200;
  this.contacts = [];
  this.colors = {
    blip: '#ffeedd',
    outline: '#ddeeff'
  };
  this.types = {
    drone: 'blip',
    building: 'outline',
    road: 'outline'
  };
  
  this.init = function() {
    this.camera = elation.space.fly.obj[0].camera;
    this.pos = this.camera.position;
    this.container = elation.html.create({
      tag: 'div',
      classname: 'hud_radar',
      append: document.body
    });
    
    this.canvas = elation.html.create({
      tag: 'canvas',
      classname: 'hud_radar_canvas',
      append: this.container
    });
    
    this.ctx = this.canvas.getContext('2d');
    this.canvas.setAttribute('width', this.width);
    this.canvas.setAttribute('height', this.height);
    this.center = { x: (this.width / 2), y: (this.height / 2) },
    this.addContact({ position: { x: 0, z: 0 }, type: 'blip' });
    this.render();
  }
  
  this.rotate = function(X, Y, angle) {
    var range = this.range,
        cx = this.center.x, 
        cy = this.center.y,
        rot = this.rotateNoScale(X, Y, angle),
        x = rot.x,
        y = rot.y,
        x = cx + (cx * (x / range)),
        y = cy + (cy * (y / range));
    
    return { x: x, y: y };
  }
  
  this.rotateNoScale = function(X, Y, angle) {
    var x = X * Math.cos(angle) - Y * Math.sin(angle),
        y = X * Math.sin(angle) + Y * Math.cos(angle);
    
    return { x: x, y: y };
  }
  
  this.render = function() {
    var ctx = this.ctx,
        cx = this.center.x, 
        cy = this.center.y; 
    
    this.canvas.width = this.canvas.width;
    
    ctx.beginPath();  
    ctx.fillStyle = "rgba(32, 32, 32, .7)";  
    ctx.arc(cx,cy,100,0,Math.PI*2,true);
    ctx.fill();
    ctx.beginPath();  
    ctx.fillStyle = "rgba(128, 128, 128, .25)";  
    ctx.arc(cx,cy,56,0,Math.PI*2,true);
    ctx.fill();
    
    this.draw(ctx, cx, cy);
    
    ctx.beginPath();  
    ctx.arc(cx,cy,56,0,Math.PI*2,true); 
    ctx.stroke();  
    ctx.beginPath();  
    ctx.moveTo(0,0);
    ctx.lineTo(100,101);
    ctx.moveTo(200,0);
    ctx.lineTo(100,101);  
    ctx.stroke();  
  }
  
  this.getAngle = function() {
    var q = this.camera.quaternion,
        y = q.y,
        degrees = (y * 180),
        element = this.container,
        test = q.x * q.y + q.z * q.w;
    
    var sqx = q.x * q.x,
        sqy = q.y * q.y,
        sqz = q.z * q.z,
        heading = Math.atan2(2 * q.y * q.w - 2 * q.x * q.z, 1 - 2 * sqy - 2 * sqz);//  * 180 / Math.PI;
    
    if (test > 0.499) { // singularity at north pole
      heading = 2 * Math.atan2(q.x, q.w);
    }
    
    if (test < -0.499) { // singularity at south pole
      heading = -2 * Math.atan2(q.x, q.w);
    }
    
    //var degrees = heading > 0 ? heading : 180 + (180 - Math.abs(heading));
    
    return heading;
  }
  
  this.draw = function(ctx, cx, cy) {
    var angle = this.getAngle(),
        pos = this.camera.position,
        contacts = this.contacts,
        contact, type,
        outlineColor = hex2rgb(this.colors['outline']),
        blipColor = hex2rgb(this.colors['blip']),
        drawBlip = function(x, y) {
          ctx.beginPath();
          ctx.fillStyle = "rgba("+blipColor[0]+", "+blipColor[1]+", "+blipColor[2]+", .9)";  
          ctx.arc(x,y,2,0,Math.PI*2,true);
          ctx.fill();   
        }; 
    
    for (var i=0; i<contacts.length; i++) {
      contact = contacts[i];
      type = this.types[contact.type] || 'blip';
      
      switch(type) {
        case "outline":
          var cpos = contact.position,
              x = cpos.x - pos.x,
              y = cpos.z - pos.z,
              //rot = this.rotate(x, y, angle),
              outline = typeof contact.outline != 'undefined'
                      ? contact.outline
                      : [ [-.6,-.6], [.6,-.6], [.6,.6], [-.6,.6] ];
          
          ctx.beginPath();
          ctx.fillStyle = "rgba("+outlineColor[0]+", "+outlineColor[1]+", "+outlineColor[2]+", .3)";
          
          for (var a=0; a<outline.length; a++) {
            var line = outline[a],
                rpos = this.rotateNoScale(line[0], line[1], contact.rotation.y),
                tpos = this.rotate((rpos.x * 500) + x, (rpos.y * 500) + y, angle),
                tx = Math.round(tpos.x),
                ty = Math.round(tpos.y);
            
            if (a==0)
              ctx.moveTo(tx, ty);
            
            ctx.lineTo(tx, ty);
          }
          
          ctx.fill();   
          
          break;
        
        default:
          var cpos = contact.position,
              x = cpos.x - pos.x,
              y = cpos.z - pos.z,
              rot = this.rotate(x, y, angle);
          
          drawBlip(rot.x, rot.y)
          break;
      }
    }
  }
  
  this.addContact = function(contact) {
    this.contacts.push(contact);
    console.log('Radar added contact', contact);
  }
  
  this.init();
});
elation.extend('css3.transform', function(el, transition, transform) {
  switch(elation.browser.type) {
    case 'firefox':
      el.style.MozTransition = (transition ? '-moz-' : '') + (transition ? transition : '');
      el.style.MozTransformOrigin = transform ? 'center' : '';
      el.style.MozTransform = transform ? transform : '';
      break;
    case 'safari':
      el.style.webkitTransition = (transition ? '-webkit-' : '') + (transition ? transition : '');
      el.style.webkitTransformOrigin = transform ? 'center' : '';
      el.style.webkitTransform = transform ? transform : '';
      break;
  }
});

elation.extend('ui.widgets.altimeter_lame', function(hud) {
  this.hud = hud;
  
  this.init = function() {
    this.camera = elation.space.fly.obj[0].camera;
    this.pos = this.camera.position;
    this.container = elation.html.create({
      tag: 'div',
      classname: 'hud_altimeter',
      append: document.body
    });
    
    console.log('altimeter initialized');
  }
  
  this.format = function(pos) {
    return Math.round(pos);
  }
  
  this.render = function() {
    this.container.innerHTML = 'Altitude: ' + this.format(this.pos.y);
  }
  
  this.init();
});
elation.extend('ui.widgets.rotacol', function(hud) {
  this.hud = hud;
  
  this.init = function() {
    this.camera = elation.space.fly.obj[0].camera;
    this.pos = this.camera.position;
    this.container = elation.html.create({
      tag: 'div',
      classname: 'hud_rotacol',
      append: document.body
    });
    
    console.log('rotacol initialized');
  }
  
  this.format = function(pos) {
    return Math.round(pos);
    //return pos.toFixed(2);
  }
  
  this.render = function() {
    this.container.innerHTML = 'x:' + this.format(this.pos.x) + ' y:' + this.format(this.pos.y) + ' z:' + this.format(this.pos.z);
  }
  
  this.init();
});

elation.extend('ui.widgets.altimeter', function(hud) {
  this.hud = hud;
  this.range = 3500;
  this.width = 40;
  this.height = 200;
  
  this.init = function() {
    this.camera = elation.space.fly.obj[0].camera;
    this.pos = this.camera.position;
    
    this.container = elation.html.create({
      tag: 'div',
      classname: 'hud_altimeter',
      append: document.body
    });
    
    this.canvas = elation.html.create({
      tag: 'canvas',
      classname: 'hud_altimeter_canvas',
      append: this.container
    });
    
    this.ctx = this.canvas.getContext('2d');
    this.canvas.setAttribute('width', this.width);
    this.canvas.setAttribute('height', this.height);
    this.center = { x: (this.width / 2), y: (this.height / 2) },
    this.render();
  }
  
  this.render = function() {
    var ctx = this.ctx,
        cx = this.center.x, 
        cy = this.center.y,
        y = 200 - Math.round(this.height * (this.pos.y / this.range)),
        h = 200 - y; 
    
    this.canvas.width = this.canvas.width;
    
    ctx.beginPath();  
    ctx.fillStyle = "rgba(32, 32, 32, .7)";  
    ctx.rect(0,0,50,200);  
    ctx.fill();
    ctx.beginPath();  
    ctx.fillStyle = "rgba(0, 255, 0, .25)";  
    ctx.rect(0,y,50,h);  
    ctx.fill();

    /*
    ctx.beginPath();  
    ctx.fillStyle = "rgba(32, 32, 32, .7)";  
    ctx.arc(cx,cy,100,0,Math.PI*2,true);
    ctx.fill();
    ctx.beginPath();  
    ctx.fillStyle = "rgba(128, 128, 128, .25)";  
    ctx.arc(cx,cy,56,0,Math.PI*2,true);
    ctx.fill();
    
    ctx.beginPath();
    ctx.fillStyle = "rgba(0, 255, 0, .9)";  
    ctx.arc(x,y,2,0,Math.PI*2,true);
    ctx.fill();
    
    ctx.beginPath();  
    ctx.arc(cx,cy,56,0,Math.PI * 2,true); 
    ctx.stroke();  
    ctx.beginPath();  
    ctx.moveTo(0,0);
    ctx.lineTo(100,101);
    ctx.moveTo(200,0);
    ctx.lineTo(100,101);  
    ctx.stroke();  
    */
  }
  
  this.init();
});

function hex2rgb(color) {
  var rgb = [128, 128, 128];
  if (color.charAt(0) == "#") color = color.substring(1, 7); // ignore #, if applicable
  if (color.match(/^[0-9a-f]{6}$/i))
  for (var i = 0; i < 3; i ++)
  rgb[i] = parseInt(color.substring(i*2, (i+1)*2), 16);
  return rgb;
} 