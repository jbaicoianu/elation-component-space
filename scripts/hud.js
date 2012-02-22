elation.extend('ui.hud', new function() {
  this.widgets = [
    'console', 
    'overlay',
    'debug', 
    'rotacol', 
    'radar', 
    'aeronautics',
    'targeting'
  ];
  this.ticks = 0;
  
  // there is one clock, but this controls which widgets get fired at what intervals
  this.timings = {
    overlay: 0,
    rotacol: 10,
    radar: 1,
    altimeter: 4,
    console: 0,
    aeronautics: 1,
    targeting: 0,
    debug: 0
  };
  
  this.colors = {
    background: '#000000',
    lines: '#7b9cab',
    target_blip: '#8affac',
    target_outline: '#7b9cab',
    target_arrow: '#8affac',
    target_box: '#d53131',
    target_ring: '#8affac',
    target_hilight: '#CDE472',
    radar_sweeper: '#FD5252'
  };
  
  this.init = function() {
    for (var i=0; i<this.widgets.length; i++) {
      var widget = this.widgets[i];
      
      this[widget] = new elation.ui.widgets[widget](this);
    }
    
    elation.events.add(null, 'renderframe_end', this);
  }
     
  this.handleEvent = function(event) {
    if (typeof this[event.type] == 'function')
      this[event.type](event);
  }
  
  this.renderframe_end = function(e) {
    this.ticks++;
    
    for (var i=0; i<this.widgets.length; i++) {
      var widget = this.widgets[i],
          timing = this.timings[widget];
      
      if (timing !== 0 && this.ticks % (timing || 2) == 0) {
        this[widget].render(e);
      }
    }
  }
  
  this.container = function(classname, canvas) {
    var container = elation.html.create({
      tag: canvas ? 'canvas' : 'div',
      classname: classname,
      append: document.body
    });
    
    if (canvas) {
      container.setAttribute('width', container.offsetWidth);
      container.setAttribute('height', container.offsetHeight);
    }
    
    return container;
  }
  
  this.clear = function(ctx, width, height) {
    switch(elation.browser.type) {
      case "firefox":
        // Store the current transformation matrix
        //ctx.save();

        // Use the identity matrix while clearing the canvas
        //ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, width, height);

        // Restore the transform
        //ctx.restore();
        break;
      default:
        ctx.canvas.width = width;
    }
  }
});

/* This is for static content that is omnipresent and never needs to update */
elation.extend('ui.widgets.overlay', function(hud) {
  this.hud = hud;
  this.colors = this.hud.colors;
  this.fns = [];
  
  this.init = function() {
    this.container = this.hud.container('static_overlay', true);
    this.ctx = this.container.getContext('2d');
    
    this.resize();
    
    elation.events.add(window, 'resize', this);

    //this.hud.console.log('static overlay initialized.');
  }
  
  this.draw = function(fn, skip) {
    fn(this.ctx, this.center.x, this.center.y);
    
    if (!skip)
      this.fns.push(fn);
  }
  
  this.clear = function() {
    this.fns = [];
    this.container.width = this.width;
  }
  
  this.redraw = function() {
    for (var i=0; i<this.fns.length; i++) {
      this.draw(this.fns[i], true);
    }
  }
  
  this.handleEvent = function(event) {
    if (typeof this[event.type] == 'function')
      this[event.type](event);
  }
  
  this.resize = function(event) {
    var wdim = elation.html.dimensions(window);
    this.width = wdim.w;
    this.height = wdim.h;
    this.container.setAttribute('width', this.width);
    this.container.setAttribute('height', this.height);
    this.center = { x: (this.width / 2), y: (this.height / 2) };
    this.redraw();
  }
  
  this.init();
});

elation.extend('ui.widgets.radar', function(hud) {
  this.hud = hud;
  this.range = 8400;
  this.width = 200;
  this.height = 200;
  this.odist = 0;
  this.sweepspeed = .02;
  this.sweepangle = Math.PI;
  this.contacts = [];
  this.colors = this.hud.colors;
  this.types = {
    drone: 'blip',
    building: 'outline',
    road: 'outline'
  };
  
  this.init = function() {
    this.setCamera(elation.space.fly.obj[0].camera);
    this.container = this.hud.container('radar radar_background', true);
    this.canvas = this.hud.container('radar radar_display', true);
    this.ctx = this.canvas.getContext('2d');
    
    this.center = { x: (this.width / 2), y: (this.height / 2) };
    this.outline();
    this.nextTarget();
    this.render();
    //this.hud.console.log('radar system initialized.');
  }
  
  this.setCamera = function(camera) {
    this.camera = camera;
    if (elation.ui.hud.rotacol) {
      elation.ui.hud.rotacol.camera = this.camera;
    }
  }

  this.rotate = function(X, Y, angle) {
    var range = (this.range/2) + ((this.range/2) * (this.camera.position.y / (this.range/4))) || 8400,
        cx = this.center.x, 
        cy = this.center.y,
        rot = elation.transform.rotate(X, Y, angle),
        x = rot.x,
        y = rot.y,
        x = cx + (cx * (x / range)),
        y = cy + (cy * (y / range));
    
    return { x: x, y: y };
  }
  
  this.sweep = function(ctx, cx, cy, bgColor, lnColor) {
    var lnColor = this.color('radar_sweeper'),
        angle = this.sweepangle + this.sweepspeed,
        angle = angle > (Math.PI * 2) ? 0 : angle,
        points = [
          elation.transform.rotate(-7, 99, angle),
          elation.transform.rotate(7, 99, angle)
        ];
    
    ctx.beginPath();
    ctx.fillStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .05)";
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + points[0].x, cy + points[0].y);
    ctx.lineTo(cx + points[1].x, cy + points[1].y);
    ctx.fill();
    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .07)";
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + points[0].x, cy + points[0].y);
    ctx.stroke();

    this.sweepangle = angle;
    this.sweeperpos = points[0];
  }
  
  this.outline = function() {
    var x = 0,
        y = 0,
        cx = x + (this.width / 2),
        cy = y + (this.height / 2),
        bgColor = hex2rgb(this.colors['background']),
        lnColor = hex2rgb(this.colors['lines']);
        slayer = this.hud.container('radar radar_static', true);
        ctx = slayer.getContext('2d');
        ctxbg = this.container.getContext('2d');
    
    ctxbg.beginPath();  
    ctxbg.fillStyle = "rgba("+bgColor[0]+", "+bgColor[1]+", "+bgColor[2]+", .7)";  
    ctxbg.arc(cx,cy,98,0,Math.PI*2,true);
    ctxbg.fill();
    ctx.beginPath();  
    ctx.arc(cx,cy,100,0,Math.PI*2,true);  
    ctx.clip();
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.fillStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .1)";
    ctx.moveTo(x+0,y+0);
    ctx.lineTo(x+100,y+101);
    ctx.lineTo(x+200,y+0);  
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x+0,y+0);
    ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .3)";
    ctx.lineTo(x+100,y+101);
    ctx.moveTo(x+200,y+0);
    ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .3)";
    ctx.lineTo(x+100,y+101);  
    ctx.stroke();
    ctx.beginPath();  
    ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .3)";
    ctx.arc(cx,cy,99,0,Math.PI*2,true);
    ctx.stroke(); 
  }
  
  this.render = function(e) {
    var ctx = this.ctx,
        cx = this.center.x, 
        cy = this.center.y,
        bgColor = hex2rgb(this.colors['background']),
        lnColor = hex2rgb(this.colors['lines']),
        altitude = (this.width/2) - ((this.width/4) * (this.camera.position.y / (this.range/4))),
        altitude = altitude >= 0 ? altitude : 0;
    
    //this.canvas.width = this.canvas.width;
    this.hud.clear(this.ctx, this.width, this.height);
    this.event = e;
  
    ctx.beginPath();  
    ctx.arc(cx,cy,100,0,Math.PI*2,true);  
    ctx.clip();
    ctx.beginPath();
    ctx.fillStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .1)";  
    ctx.arc(cx,cy,altitude,0,Math.PI*2,true);
    ctx.fill();
    ctx.beginPath();  
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .5)";
    ctx.arc(cx,cy,altitude,0,Math.PI*2,true); 
    ctx.stroke();
    ctx.lineWidth = 1

    this.sweep(ctx, cx, cy, bgColor, lnColor);
    this.draw(ctx, cx, cy);
    //this.flicker();
    
    this.paintTarget();
  }
  
  this.paintTarget = function() {
    var target = this.current_target,
        c = elation.canvas,
        r = target ? target.radar : false,
        center = this.center;
    
    if (r) {
      c.circle(this.ctx, r.x, r.y, 3, this.color('target_hilight'), .5, 'stroke');
      c.line(this.ctx, [[center.x, center.y],[r.x, r.y]], this.color('target_hilight'), .3, 'stroke');
    }
  }
  
  this.prevTarget = function() {
    this.switchTarget(-1);
  }

  this.nextTarget = function() {
    this.switchTarget(1);
  }
  
  this.switchTarget = function(n) {
    var contacts = this.contacts,
        contact, target;
    
    if (contacts.length == 0)
      return;
    
    for (var i=0; i<contacts.length; i++) {
      contact = contacts[i];
      var t = i+n < 0 ? contacts.length-1 : i+n ;
      
      if (contact.target) {
        delete contact.target;
        
        if (t < contacts.length) {
          target = contacts[t];
        } else {
          target = contacts[0];
        }
        
        break;
      }
    }
    
    if (!target)
      target = contacts[0];
    
    if (target.type) {
      this.hud.targeting.label.innerHTML = target.type;
      this.hud.targeting.name.innerHTML = target.thing.args.name;
    }
    
    this.updateTargetDistance(target);
    
    console.log('target',(t || 0),target);
    
    var rot = target.rotation,
        pos = target.position,
        scale = target.scale || [ 0, 0, 0 ];
    
    this.hud.debug.log({
      id: target.thing.id,
      position: Math.round(pos.x) + ', ' +Math.round(pos.y)+ ', ' +Math.round(pos.z),
      rotation: rot.x.toFixed(3) + ', ' +rot.y.toFixed(3) + ', ' +rot.z.toFixed(3),
      scale: scale[0]+', '+scale[1]+', '+scale[2]
    });
    
    target.target = true;
    this.current_target = target;
  }
  
  this.updateTargetDistance = function(target) {
    var A = [ target.position.x, target.position.y, target.position.z ],
        B = [ this.camera.position.x, this.camera.position.y, this.camera.position.z ],
        dist = Math.round(elation.vector3.distance(A, B));
    
    if (dist && dist != this.odist) {
      this.hud.targeting.distance.innerHTML = dist+'m';
      this.odist = dist;
    }
  }
  
  this.flicker = function() {
    var timings = [ 
      60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 
      150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 
      170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 
      250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 
      260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 
      270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 
      280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 
      290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 
      380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 
      390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 
    ];
    
    this.canvas.style.opacity = 1;
    
    for (var i=0; i<timings.length; i++) {
      if (this.hud.ticks % timings[i] == 0)
        this.canvas.style.opacity = .85;
      else if (this.hud.ticks > 500)
        this.hud.ticks = 0;
    }
  }
  
  this.color = function(type) {
    return hex2rgb(this.colors[type]);
  }

  this.draw = function(ctx, cx, cy) {
    var campos = this.camera.matrixWorld.decompose(),
        angle = elation.utils.quat2euler(campos[1]),
        heading = angle[0],
        bank = angle[1],
        pos = campos[0],
        contacts = this.contacts,
        contact, type,
        outlineColor = this.color('target_outline'),
        blipColor = this.color('target_blip'),
        hilightColor = this.color('target_hilight'),
        drawBlip = function(x, y, obj, event, a, type) {
          //console.log(type);
          if (type == 'outline') {
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba("+blipColor[0]+", "+blipColor[1]+", "+blipColor[2]+", "+ (.05 + a)+")";
            ctx.moveTo(x-3, y);
            ctx.lineTo(x+3, y);
            ctx.moveTo(x, y-3);
            ctx.lineTo(x, y+3);
            ctx.stroke();          
          } else {
            ctx.beginPath();
            ctx.fillStyle = "rgba("+blipColor[0]+", "+blipColor[1]+", "+blipColor[2]+", "+(.3 + a)+")";
            ctx.arc(x,y,2,0,Math.PI*2,true);
            ctx.fill();
          }
          
          obj.radar = { x: x, y: y }
          
          var head = Math.atan2(x - cx, y - cy);
          //elation.events.fire('radar_blip', { x: x, y: y, head: head, heading: heading, obj: obj, event: event, angle: angle });
        }; 
    
    for (var i=0; i<contacts.length; i++) {
      contact = contacts[i];
      type = this.types[contact.type] || 'blip';
      
      switch(type) {
        case "outline":
          var cpos = contact.position,
              x = cpos.x - pos.x,
              y = cpos.z - pos.z,
              outline = typeof contact.outline != 'undefined'
                      ? contact.outline
                      : [ [-.6,-.6], [.6,-.6], [.6,.6], [-.6,.6] ],
              scale = typeof contact.scale != 'undefined'
                    ? contact.scale
                    : [1, 1, 1];
          
          var style = "rgba("+blipColor[0]+", "+blipColor[1]+", "+blipColor[2]+", .1)";
          
          for (var b=0; b<2; b++) {
            ctx.beginPath();
            if (b % 2 == 0) {
              ctx.fillStyle = style;
              ctx.lineWidth = 1;
            } else {
              ctx.strokeStyle = "rgba("+outlineColor[0]+", "+outlineColor[1]+", "+outlineColor[2]+", .2)";
              ctx.lineWidth = 3;
            }
            
            for (var a=0; a<outline.length; a++) {
              var line = outline[a],
                  rpos = elation.transform.rotate(line[0], line[1], contact.rotation.y),
                  tpos = this.rotate((rpos.x * scale[0]) + x, (rpos.y * scale[2]) + y, heading),
                  tx = Math.round(tpos.x),
                  ty = Math.round(tpos.y);
              
              if (a==0)
                ctx.moveTo(tx, ty);
              
              ctx.lineTo(tx, ty);
            }
            
            if (b % 2 == 0)
              ctx.fill();
            else
              ctx.stroke();
          }
          //break;
        
        default:
          var cpos = contact.position,
              x = cpos.x - pos.x,
              y = cpos.z - pos.z,
              rot = this.rotate(x, y, heading), c = 0;
          
          //if (this.checkInBounds(x, y))
          
          var spos = [ this.sweeperpos.x, -this.sweeperpos.y, 0 ],
              cpos = [ rot.x-cx, cy-rot.y, 0 ],
              xpos = elation.vector3.normalize(elation.vector3.subtract(spos,cpos)),
              a = Math.atan2(spos[0],spos[1]),
              b = Math.atan2(cpos[0],cpos[1]),
              c = a - b,
              c = c < 0 ? c + (Math.PI * 2) : c,
              c = (1 - ((c / 2) / Math.PI)) * 5,
              c = (c * .1);
          
          drawBlip(rot.x, rot.y, contact, this.event, c, type);
          
          if (contact.target)
            this.updateTargetDistance(contact);
          
          break;
      }
    }
    
    this.angle = angle;
  }
  
  this.checkInBounds = function(x, y) {
    if (x < 0 || x > this.width || y < 0 || y > this.height)
      return false;
    
    return true;
  }
  
  this.addContact = function(contact) {
    this.contacts.push(contact);
    //console.log('Radar added contact', contact);
  }
  
  this.removeContact = function(contact) {
    for (var i = 0; i < this.contacts.length; i++) {
      if (this.contacts[i] == contact) {
        this.contacts.splice(i, 1);
        break;
      }
    }
    //console.log('Radar added contact', contact);
  }

  this.init();
});
elation.extend('canvas.circle', function(ctx, x, y, s, c, a, f) {
  var a = a || 1,
      s = s || 1,
      c = c || [ 150, 150, 150 ],
      f = f || 'fill';
  
  ctx.beginPath();
  ctx[f + 'Style'] = "rgba("+c[0]+", "+c[1]+", "+c[2]+", "+ a +")";
  ctx.arc(x,y,s,0,Math.PI*2,true);
  ctx[f]();
});
elation.extend('canvas.line', function(ctx, positions, color, alpha) {
  var alpha = alpha || 1,
      color = color || [ 150, 150, 150 ];
  
  ctx.beginPath();
  ctx.strokeStyle = "rgba("+color[0]+", "+color[1]+", "+color[2]+", "+alpha+")";
  
  for (var i=0; i<positions.length; i++) {
    var pos = positions[i],
        x = pos[0],
        y = pos[1];
    
    if (i==0)
      ctx.moveTo(x,y);
    
    ctx.lineTo(x,y);
  }
  
  ctx.stroke();
});

elation.extend('ui.widgets.aeronautics', function(hud) {
  this.hud = hud;
  this.colors = this.hud.colors;
  this.opos = [0,50,0];
  this.radius = 150;
  
  this.init = function() {
    this.camera = elation.space.fly.obj[0].camera;
    this.container = this.hud.container('aeronautics', true);
    this.ctx = this.container.getContext('2d');

    this.resize();
    elation.events.add(window, 'resize', this);
  }
  
  this.resize = function(event) {
    var wdim = elation.html.dimensions(window),
        cdim = elation.html.dimensions(this.container);
    
    this.width = cdim.w;
    this.height = cdim.h;
    this.container.setAttribute('width', this.width);
    this.container.setAttribute('height', this.height);
    this.container.style.top = (wdim.h/2)-(cdim.h/2) + 'px';
    this.container.style.left = (wdim.w/2)-(cdim.w/2) + 'px';
    this.center = { x: (this.width / 2), y: (this.height / 2) };
  }
  
  this.render = function(event) {
    this.cpos = this.camera.position;
    this.angle = this.hud.radar.angle;
    
    //this.outline();
    this.hud.clear(this.ctx, this.width, this.height);
    this.setSpeed(event, this.cpos, this.opos);
    this.setFPV(event, this.cpos, this.opos);
    this.setPitch(event, this.cpos, this.opos);
    
    this.opos = { x:this.cpos.x, y:this.cpos.y, z:this.cpos.z };
  }
  
  this.setSpeed = function(event, cpos, opos) {
    var delta = event.data.lastupdatedelta,
        fps = 1 / delta,
        A = [ cpos.x, cpos.y, cpos.z ],
        B = [ opos.x, opos.y, opos.z ],
        speed = elation.vector3.distance(A, B) * fps;
    
    this.vector_current = A;
    this.vector_old = B;
    this.delta = delta;
    this.speed = speed;
    this.fps = fps;
  }
  
  this.setFPV = function(event, cpos, opos) {
    var center = this.center,
        ctx = this.ctx,
        A = this.vector_current,
        B = this.vector_old,
        delta = this.delta,
        speed = this.speed,
        angle = this.angle,
        heading = angle[0],
        pitch = angle[1],
        bank = angle[2],
        radius = this.radius - 20,
        FOV = .50,
        max_delta = 14.2, // FIXME - compute max delta programatically
        v3 = elation.vector3,d
        NA = v3.normalize(A),
        NB = v3.normalize(B),
        pos_delta = v3.subtract(A, B),
        FPV = [
          (pos_delta[0] / max_delta) * radius,
          (pos_delta[2] / max_delta) * radius
        ],
        translate = Math.atan2(FPV[0], FPV[1]) - heading,
        FPVrotate = elation.transform.rotate(0, -((speed / 1000) * (radius / 1.5)), -translate),
        FPVyr = Math.tan(heading) * FOV,
        fx = 0,
        fy = radius * FPVyr,
        fy = fy > radius ? radius : fy < -radius ? -radius : fy,
        cx = center.x + FPVrotate.x,
        cy = center.y + FPVrotate.y,
        lnColor = hex2rgb(this.colors['target_arrow']);
    
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .6)";
    ctx.arc(cx,cy,6,0,Math.PI*2,true);
    ctx.moveTo(cx+6,cy);
    ctx.lineTo(cx+6+12,cy);
    ctx.moveTo(cx-6,cy);
    ctx.lineTo(cx-6-12,cy);
    ctx.moveTo(cx,cy-6);
    ctx.lineTo(cx,cy-6-6);
    ctx.stroke();
  }
  
  this.setPitch = function(event, cpos, opos) {
    var ctx = this.ctx,
        angle = this.angle,
        yaw = angle[0],
        pitch = angle[1],
        bank = angle[2],
        r = 60,
        degrees = pitch * 180 / Math.PI,
        dim = elation.html.dimensions(),
        d2p = dim.h / 53, // Why 53?!
        d = degrees * d2p,
        q = {
          d: d,
          d2p: d2p,
          pitch: degrees
        },
        line = function(key, nx, ny, x1, y1, x2, y2, x3, y3, x4, y4) {
          rot(x1, y1, x2, y2);
          rot(x3, y3, x4, y4);
          
          if (key == 0 || key == 180 || key == -180)
            return;
          
          ctx.fillStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .5)";
          ctx.font = '15pt system';
          
          var metrics = ctx.measureText(key);
          var v1 = elation.transform.rotate(nx<0?nx-metrics.width-4:nx+4, ny + 10, bank);
          
          ctx.textBaseline = 'bottom';
          if (cx) {
            ctx.fillText(key, cx + v1.x, cy + v1.y);
          }
        },
        rot = function(x1, y1, x2, y2) {
          var v1 = elation.transform.rotate(x1, y1, bank);
          var v2 = elation.transform.rotate(x2, y2, bank);
          ctx.moveTo(cx + v1.x, cy + v1.y);
          ctx.lineTo(cx + v2.x, cy + v2.y);
        },
        min = Math.round(degrees - (d2p * 2)),
        max = Math.round(degrees + (d2p * 2)),
        ar = [], y, ob = {}, type;
    
    for (var i=min; i<max; i++) {
      if (i % 5 == 0) {
        tmp = (degrees - i) * d2p
        ar.push(-tmp);
        ob[i] = -tmp;
      }
    }
    
    //this.hud.debug.log({ d: d2p });
    
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .3)";
    
    for (var key in ob) {
      y = -ob[key];
      type = key == 0 || key == 180 || key == -180
        ? 'center'
        : key > 0
          ? 'positive'
          : key < 0
            ? 'negative'
            : 'buh';
      
      switch (type) {
        case "center":
          line(
            key, r, y,
            (r*1.35), y, (r/2), y,
            -(r*1.35), y, -(r/2), y
          );
          line(key, -r, y,
              (r/2), y, (r/2), y+(r/10),
              -(r/2), y, -(r/2), y+(r/10));
          break;
        case "positive":
          line(key, r, y,
              r, y, (r/2), y,
              -r, y, -(r/2), y);
          line(key, -r, y,
              r, y, r, y+(r/10),
              -r, y, -r, y+(r/10));
          break;
        case "negative":
          line(key, r, y,
              r, y, (r/2), y,
              -r, y, -(r/2), y);
          line(key, -r, y,
              r, y, r, y-(r/10),
              -r, y, -r, y-(r/10));
          break;
      }
    }
    ctx.stroke();
  }

  this.handleEvent = function(event) {
    if (typeof this[event.type] == 'function')
      this[event.type](event);
  }
  
  this.init();
});

elation.extend('ui.widgets.targeting', function(hud) {
  this.hud = hud;
  this.range = 3500;
  this.width = 300;
  this.height = 300;
  this.colors = hud.colors;
  this.opos = { x:0, y:0, z:0 };
  
  this.sdas = function(txt) {
  
  }
  
  this.init = function() {
    this.camera = elation.space.fly.obj[0].camera;
    
    this.container = this.hud.container('target');
    
    this.top = elation.html.create({
      tag: 'div',
      classname: 'target_top',
      append: this.container
    });
    this.topleft = elation.html.create({
      tag: 'div',
      classname: 'target_topleft',
      append: this.top
    });    
    this.label = elation.html.create({
      tag: 'div',
      classname: 'target_label',
      append: this.topleft,
      attributes: {
        innerHTML: 'target'
      }
    });
    
    this.name = elation.html.create({
      tag: 'div',
      classname: 'target_name',
      append: this.topleft,
      attributes: {
        innerHTML: 'unknown'
      }
    });
    
    this.distance = elation.html.create({
      tag: 'div',
      classname: 'target_distance',
      append: this.top,
      attributes: {
        innerHTML: '0'
      }
    });
    
    //this.ctx = this.canvas.getContext('2d');

    //this.resize();
    this.targetring();
    
    //this.aeronautics = new elation.ui.widgets.aeronautics(this);
    //elation.events.add(window, 'resize', this);
    //elation.events.add(null, 'radar_blip', this);

    //this.hud.console.log('targeting system initialized.');
  }
  
  this.handleEvent = function(event) {
    if (typeof this[event.type] == 'function')
      this[event.type](event);
  }
  
  this.resize = function(event) {
    
    var wdim = elation.html.dimensions(window);
    this.width = wdim.w;
    this.height = wdim.h;
    this.canvas.setAttribute('width', this.width);
    this.canvas.setAttribute('height', this.height);
    this.center = { x: (this.width / 2), y: (this.height / 2) };
    
    //this.container.style.top = (wdim.h / 2) - (this.height / 2) + 'px';
    //this.container.style.left = (wdim.w / 2) - (this.width / 2) + 'px';
  }
  
  this.targetring = function() {
    //if (!elation.utils.arrayget(this, 'camera.position.y'))
      //return;
    
    var //ctx = this.ctx,
        lnColor = hex2rgb(this.colors['target_ring']),
        radius = 115,
        linelength = 10;
        //cx = this.center.x, 
        //cy = this.center.y;
    
    //this.container.width = this.width;
    //this.radius = radius;
    
    this.hud.overlay.draw((function(ctx, cx, cy) {
      ctx.beginPath();
      ctx.fillStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .05)";
      ctx.arc(cx,cy,30,0,Math.PI*2,true);
      ctx.fill();  
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .3)";
      ctx.arc(cx,cy,radius,0,Math.PI*2,true);
      ctx.stroke();
      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.moveTo(cx, cy-radius);
      ctx.lineTo(cx, cy-radius-linelength);
      ctx.moveTo(cx, cy+radius);
      ctx.lineTo(cx, cy+radius+linelength);
      ctx.moveTo(cx-radius,cy);
      ctx.lineTo(cx-radius-linelength,cy);
      ctx.moveTo(cx+radius,cy);
      ctx.lineTo(cx+radius+linelength,cy);
      ctx.stroke();
    }));
  }
  
  this.radar_blip = function(odata) {
    if (odata.data.obj.type != 'label')
      return;
    
    var ver = function(angle) {
      return (angle > -(Math.PI/2) && angle < (Math.PI/2));
    };
    
    var ctx = this.ctx,
        blipColor = hex2rgb(this.colors['blip']),
        lnColor = hex2rgb(this.colors['target_arrow']),
        tgColor = hex2rgb(this.colors['target_box']),
        data = odata.data,
        heading = data.head,
        bpos = data.obj.position,
        cpos = this.camera.position,
        t = ver(heading),
        r = 150,
        tbr = 15,
        tbd = 8,
        cx = this.center.x,
        cy = this.center.y,
        p = new THREE.Projector(),
        s = p.projectVector(bpos.clone(), this.camera),
        A = [ bpos.x, bpos.y, bpos.z ],
        B = [ cpos.x, cpos.y, cpos.z ],
        dist = Math.round(elation.vector3.distance(A, B)),
        s = {
          x: t?-s.x:s.x,
          y: t?-s.y:s.y,
          z: s.z
        },
        q = {
          n: data.obj.type,
          x: cx * s.x,
          y: cy * s.y,
          z: s.z,
          a: heading
        },
        v = {
          x: bpos.x - cpos.x,
          y: bpos.y - cpos.y,
          z: bpos.z - cpos.z
        },
        x = (cx+q.x),
        y = (cy-q.y),
        an, rot2;
    
    var coords = { 
      x:x < tbr ? tbr : x > this.width-tbr ? this.width-tbr : x, 
      y:y < tbr ? tbr : y > this.height-tbr ? this.height-tbr : y
    };
    
    if (t || Math.pow((q.x), 2) + Math.pow((q.y), 2) > Math.pow(r,2)) {
      an = Math.atan2(q.x, q.y);
      rot = elation.transform.rotate(0, r, an);
      rot2 = elation.transform.rotate(0, r-tbr, an);
    }
    
    this.render();
    
    if (!t) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba("+tgColor[0]+", "+tgColor[1]+", "+tgColor[2]+", .9)";
      ctx.lineWidth = 2;
      ctx.lineCap = 'butt'; // heh
      ctx.moveTo(coords.x-tbr, coords.y-tbd);
      ctx.lineTo(coords.x-tbr, coords.y-tbr);
      ctx.lineTo(coords.x-tbd, coords.y-tbr);
      ctx.moveTo(coords.x+tbd, coords.y-tbr);
      ctx.lineTo(coords.x+tbr, coords.y-tbr);
      ctx.lineTo(coords.x+tbr, coords.y-tbd);
      ctx.moveTo(coords.x+tbr, coords.y+tbd);
      ctx.lineTo(coords.x+tbr, coords.y+tbr);
      ctx.lineTo(coords.x+tbd, coords.y+tbr);
      ctx.moveTo(coords.x-tbd, coords.y+tbr);
      ctx.lineTo(coords.x-tbr, coords.y+tbr);
      ctx.lineTo(coords.x-tbr, coords.y+tbd);
      ctx.stroke();
      
      ctx.fillStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .8)";
      ctx.font = '12px sans-serif bold';
      var dist = 'D:' + dist,
          metrics = ctx.measureText(dist);  

      ctx.textBaseline = 'bottom';
      ctx.fillText(dist, coords.x-(metrics.width/2), coords.y+tbr+15);
    }
    
    if (an) {
      ctx.beginPath();
      ctx.fillStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .8)";
      ctx.arc(cx+-rot.x,cy+-rot.y,4,0,Math.PI*2,true);
      ctx.fill();
      ctx.beginPath();
      ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .8)";
      ctx.moveTo(cx+-rot.x,cy+-rot.y);
      ctx.lineTo(cx+-rot2.x,cy+-rot2.y);
      ctx.stroke();
    }
    
    this.opos = {
      x: cpos.x,
      y: cpos.y,
      z: cpos.z
    };
  };
    
  this.init();
});


elation.extend('ui.widgets.rotacol', function(hud) {
  this.hud = hud;
  
  this.init = function() {
    this.camera = elation.space.fly.obj[0].camera;
    this.container = elation.html.create({
      tag: 'div',
      classname: 'rotacol',
      append: document.body
    });
    
    //this.hud.console.log('rotacol initialized.');
  }
  
  this.format = function(pos) {
    return Math.round(pos);
  }
  
  this.render = function(pos) {
    var pos = this.camera.matrixWorld.getPosition();
    this.container.innerHTML = 'x:' + this.format(pos.x) + ' y:' + this.format(pos.y) + ' z:' + this.format(pos.z);
  }
  
  this.init();
});

elation.extend('ui.widgets.console', function(hud) {
  this.hud = hud;
  
  this.init = function() {
    this.camera = elation.space.fly.obj[0].camera;
    this.container = elation.html.create({
      tag: 'div',
      classname: 'console',
      append: document.body
    });
    this.display = elation.html.create({
      tag: 'ul',
      classname: 'console_display',
      append: this.container
    });
    this.bottom = elation.html.create({
      tag: 'div',
      classname: 'console_bottom',
      append: this.container
    });
    this.input = elation.html.create({
      tag: 'input',
      classname: 'console_input',
      append: this.bottom,
      attributes: {
        type: 'text'
      }
    });
    
    //this.log('console initialized.');
  }
  
  this.format = function(pos) {
    return Math.round(pos);
  }
  
  this.log = function(text) {
    this.display.innerHTML += '<li>'+text+'</li>';
    this.scrollToBottom();
  }
	
  this.scrollToBottom = function() { 
		this.display.scrollTop = this.display.scrollHeight; 
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
    
    //this.hud.console.log('altimeter initialized.');
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
        var angle = this.draw(ctx, cx, cy);

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

elation.extend('ui.widgets.debug', function(hud) {
  this.hud = hud;
  
  this.init = function() {
    this.camera = elation.space.fly.obj[0].camera;
    this.container = elation.html.create({
      tag: 'div',
      classname: 'debug',
      append: document.body
    });
    
    //this.hud.console.log('debug initialized.');
  }
  
  this.format = function(pos) {
    if (typeof pos.toFixed == 'function') {
      var st = pos.toString(),
          sp = st.split('.'),
          ln = sp.length > 1 ? sp[1].length : 0,
          pos = ln > 3 ? pos.toFixed(3) : pos;
    }
    
    return pos;
  }
  
  this.log = function(data) {
    //console.log(data);
    this.container.innerHTML = '';
    if (typeof data.length == 'number')
      for (var i=0; i<data.length; i++)
        this.container.innerHTML += (this.container.innerHTML == ''
          ? ''
          : '<br>') +
          this.format(data[i]);
    else
      for (var key in data)
        if (typeof data[key] != 'function')
        this.container.innerHTML += (this.container.innerHTML == ''
          ? ''
          : '<br>') +
          '<span>' + key + ':</span><span class="alt">' + this.format(data[key]) + '</span>';
  }
  
  this.init();
});

elation.extend('vector3.dot', function(A, B) {
  var D = [ 
        A[0] * B[0],
        A[1] * B[1],
        A[2] * B[2]
      ],
      C = D[0] + D[1] + D[2];
  
  return C;
});
elation.extend('vector3.normalize', function(A) {
  var length = elation.vector3.magnitude(A),
      B = [
        A[0] / length,
        A[1] / length,
        A[2] / length
      ],
      C = [
        (isNaN(B[0]) ? 0 : B[0]),
        (isNaN(B[1]) ? 0 : B[1]),
        (isNaN(B[2]) ? 0 : B[2])
      ];
  
  return C;
});

elation.extend('vector3.subtract', function(A, B) {
  var C = [
        A[0] - B[0],
        A[1] - B[1],
        A[2] - B[2]
      ];
  
  return C;
});
elation.extend('vector3.distance', function(B, C) {
  var A = elation.vector3.subtract(B, C),
      dist = elation.vector3.magnitude(A);
  
  return dist;
});
elation.extend('vector3.magnitude', function(A) {
  var sx = Math.pow(A[0], 2),
      sy = Math.pow(A[1], 2),
      sz = Math.pow(A[2], 2),
      magnitude = Math.sqrt(sx + sy + sz);
  
  return magnitude;
});

elation.extend('transform.translate', function(x, y, tx, ty) {
  return { x: x+tx, y: y+ty };
});

elation.extend('transform.rotate', function(X, Y, angle, tx, ty) {
  var x, y;
  
  switch (typeof X) {
    case "number":
      break;
    case "object":
      if (typeof X.length == 'number') {
        ty = tx ? tx : X.length > 4 ? X[4] : 0;
        tx = ty ? ty : X.length > 3 ? X[3] : 0;
        angle = Y ? Y : X.length > 2 ? X[2] : 0;
        Y = X[1];
        X = X[0];
      } else {
        var get = elation.utils.arrayget,
            a = function(o, k, b) { 
              return b ? b : get(o, k) ? get(o, k) : 0; 
            };
        
        ty = a(X, 'ty', ty);
        tx = a(X, 'tx', tx);
        angle = a(X, 'angle', Y);
        Y = get(X, 'y');
        X = get(X, 'x');
      }
      
      break;
    default:
      return null;
  }
  
  x = X * Math.cos(angle) - Y * Math.sin(angle);
  y = X * Math.sin(angle) + Y * Math.cos(angle);
  
  if (tx && ty)
    var translate = elation.transform.translate(x, y, tx, ty),
        x = translate.x,
        y = translate.y;
  
  return { x: x, y: y, X: X, Y: Y, angle: angle };
});

elation.extend('transform.rotateOj', function(obj, angle) {
  var rotated = [];
  
  for (var i=0; i<obj.length; i++) {
    var point = obj[i],
        tmp = elation.point.rotate(point, angle);
    
    rotated.push(tmp);
  }
  
  return rotated;
});

elation.extend('utils.quat2euler', function(q, degrees) {
  var sqx   = q.x * q.x,
      sqy   = q.y * q.y,
      sqz   = q.z * q.z,
      yaw   = Math.atan2(2 * q.y * q.w - 2 * q.x * q.z, 1 - 2 * sqy - 2 * sqz),
      pitch = Math.atan2(2 * q.x * q.w - 2 * q.y * q.z, 1 - 2 * sqx - 2 * sqz),
      roll  = Math.asin(2 * q.x * q.y + 2 * q.z * q.w),
      r2d   = function(rad) { return rad * 180 / Math.PI; };
  
  if (degrees)
    return [ r2d(yaw), r2d(pitch), r2d(roll) ];
  else
    return [ yaw, pitch, roll ];
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


function hex2rgb(color) {
  var rgb = [128, 128, 128];
  if (color.charAt(0) == "#") color = color.substring(1, 7); // ignore #, if applicable
  if (color.match(/^[0-9a-f]{6}$/i))
  for (var i = 0; i < 3; i ++)
  rgb[i] = parseInt(color.substring(i*2, (i+1)*2), 16);
  return rgb;
} 

