elation.extend('ui.hud', new function() {
  this.widgets = [ 'rotacol', 'radar' ];
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
    var range = (this.range/2) + ((this.range/2) * (this.camera.position.y / (this.range/4))),
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
        cy = this.center.y,
        altitude = (this.width/2) - ((this.width/4) * (this.camera.position.y / (this.range/4))) || 1; 
    
    this.canvas.width = this.canvas.width;
    
    ctx.beginPath();  
    ctx.fillStyle = "rgba(32, 32, 32, .7)";  
    ctx.arc(cx,cy,100,0,Math.PI*2,true);
    ctx.fill();
    ctx.beginPath();  
    ctx.fillStyle = "rgba(128, 128, 128, .1)";  
    ctx.arc(cx,cy,altitude,0,Math.PI*2,true);
    ctx.fill();
    
    var r = 1.57079633,
        angle = this.draw(ctx, cx, cy);
    
    /*for (var i=0; i<a.length; i++) {
      var rot = this.rotateNoScale(100,0,angle[1])
      var rot2 = this.rotateNoScale(200,100,angle[1])
      console.log(rot.x, rot.y, altitude);
      ctx.beginPath();  
      ctx.strokeStyle = "rgba(128, 128, 128, .5)";
      ctx.moveTo(cx,cy);
      ctx.lineTo(cx-rot.x,cy-rot.y); 
      ctx.moveTo(cx,cy);
      ctx.lineTo(cx-rot2.x,cy-rot2.y); 
      ctx.stroke();  
   }*/
    
    ctx.beginPath();  
    ctx.strokeStyle = "rgba(128, 128, 128, .5)";
    ctx.arc(cx,cy,altitude,0,Math.PI*2,true); 
    ctx.stroke();  
    ctx.beginPath();  
    ctx.arc(cx,cy,100,0,Math.PI*2,true);
    ctx.stroke();  
    ctx.beginPath();
    ctx.fillStyle = "rgba(128, 128, 128, .1)";
    ctx.moveTo(0,0);
    ctx.lineTo(100,101);
    ctx.lineTo(200,0);  
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.strokeStyle = "rgba(128, 128, 128, .5)";
    ctx.lineTo(100,101);
    ctx.moveTo(200,0);
    ctx.strokeStyle = "rgba(128, 128, 128, .5)";
    ctx.lineTo(100,101);  
    ctx.stroke();  
  }
  
  this.getAngle = function() {
    var q = this.camera.quaternion,
        y = q.y,
        degrees = (y * 180),
        element = this.container;
    
    var sqx = q.x * q.x,
        sqy = q.y * q.y,
        sqz = q.z * q.z,
        heading = Math.atan2(2 * q.y * q.w - 2 * q.x * q.z, 1 - 2 * sqy - 2 * sqz), //  * 180 / Math.PI;
        bank    = Math.atan2(2 * q.x * q.w - 2 * q.y * q.z, 1 - 2 * sqx - 2 * sqz);
    
    //var degrees = heading > 0 ? heading : 180 + (180 - Math.abs(heading));
    
    return [ heading, bank ];
  }
  
  this.draw = function(ctx, cx, cy) {
    var angle = this.getAngle(),
        heading = angle[0],
        bank = angle[1],
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
          
          var scale = 500;
          for (var a=0; a<outline.length; a++) {
            var line = outline[a],
                rpos = this.rotateNoScale(line[0], line[1], contact.rotation.y),
                tpos = this.rotate((rpos.x * scale) + x, (rpos.y * scale) + y, heading),
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
              rot = this.rotate(x, y, heading);
          
          drawBlip(rot.x, rot.y)
          break;
      }
    }
    
    return angle;
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
    var pos = this.camera.position;
    this.container.innerHTML = 'x:' + this.format(pos.x) + ' y:' + this.format(pos.y) + ' z:' + this.format(pos.z);
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
    if (!elation.utils.arrayget(this, 'camera.position.y'))
      return;
    
    var ctx = this.ctx,
        cx = this.center.x, 
        cy = this.center.y,
        y = 200 - Math.round(this.height * (this.camera.position.y / this.range)),
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
