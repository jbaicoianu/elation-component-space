elation.extend('ui.hud', new function() {
  this.widgets = [ 
    'console', 
    'debug', 
    'rotacol', 
    'radar', 
    'targeting'
  ];
  this.ticks = 0;
  
  // there is one clock, but this controls which widgets get fired at what intervals
  this.timings = {
    rotacol: 10,
    radar: 1,
    pitch: 1,
    altimeter: 4,
    console: 0,
    targeting: 0,
    debug: 0,
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
      
      if (timing !== 0 && this.ticks % (timing || 2) == 0)
        this[widget].render(e);
    }
  }
});

elation.extend('ui.widgets.radar', function(hud) {
  this.hud = hud;
  this.range = 8400;
  this.width = 200;
  this.height = 200;
  this.sweepspeed = .02;
  this.sweepangle = Math.PI;
  this.contacts = [];
  this.colors = {
    blip: '#8aeeec',
    outline: '#7b9cab',
    background: '#000000',
    lines: '#7b9cab'
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
    this.render();
    this.hud.console.log('radar system initialized.');
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
    var angle = this.sweepangle + this.sweepspeed,
        angle = angle > (Math.PI * 2) ? 0 : angle,
        points = [
          elation.transform.rotate(-7, 99, angle),
          elation.transform.rotate(7, 99, angle)
        ];
    
    ctx.beginPath();
    ctx.fillStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .02)";
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + points[0].x, cy + points[0].y);
    ctx.lineTo(cx + points[1].x, cy + points[1].y);
    ctx.fill();
    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .03)";
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + points[0].x, cy + points[0].y);
    ctx.stroke();
    
    //this.hud.debug.log({ degrees:angle, x:points[0].x, y:points[0].y });
    this.sweepangle = angle;
  }
  
  this.render = function(e) {
    var ctx = this.ctx,
        cx = this.center.x, 
        cy = this.center.y,
        bgColor = hex2rgb(this.colors['background']),
        lnColor = hex2rgb(this.colors['lines']),
        altitude = (this.width/2) - ((this.width/4) * (this.camera.position.y / (this.range/4))),
        altitude = altitude >= 0 ? altitude : 0;
    
    this.canvas.width = this.canvas.width;
    this.event = e;
    
    ctx.beginPath();  
    ctx.arc(cx,cy,100,0,Math.PI*2,true);  
    ctx.clip();
    ctx.beginPath();  
    ctx.fillStyle = "rgba("+bgColor[0]+", "+bgColor[1]+", "+bgColor[2]+", .7)";  
    ctx.arc(cx,cy,100,0,Math.PI*2,true);
    ctx.fill();
    ctx.beginPath();  
    ctx.fillStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .1)";  
    ctx.arc(cx,cy,altitude,0,Math.PI*2,true);
    ctx.fill();
    
    this.sweep(ctx, cx, cy, bgColor, lnColor);
    this.draw(ctx, cx, cy);
        
    ctx.beginPath();  
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .5)";
    ctx.arc(cx,cy,altitude,0,Math.PI*2,true); 
    ctx.stroke();  
    ctx.beginPath();  
    ctx.arc(cx,cy,100,0,Math.PI*2,true);
    ctx.stroke();  
    ctx.beginPath();
    ctx.fillStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .1)";
    ctx.moveTo(0,0);
    ctx.lineTo(100,101);
    ctx.lineTo(200,0);  
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .5)";
    ctx.lineTo(100,101);
    ctx.moveTo(200,0);
    ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .5)";
    ctx.lineTo(100,101);  
    ctx.stroke();
  }
  
  //var degrees = bank > 0 ? bank : 180 + (180 - Math.abs(bank));
  //console.log(degrees);
  //elation.css3.transform(this.canvas, 'transform 0s linear', 'rotate('+degrees+'deg)');
  
  this.draw = function(ctx, cx, cy) {
    var angle = elation.utils.quat2euler(this.camera.quaternion),
        heading = angle[0],
        bank = angle[1],
        pos = this.camera.position,
        contacts = this.contacts,
        contact, type,
        outlineColor = hex2rgb(this.colors['outline']),
        blipColor = hex2rgb(this.colors['blip']),
        drawBlip = function(x, y, obj, event) {
          ctx.beginPath();
          ctx.fillStyle = "rgba("+blipColor[0]+", "+blipColor[1]+", "+blipColor[2]+", .25)";
          ctx.arc(x,y,3,0,Math.PI*2,true);
          ctx.fill();
          ctx.beginPath();
          ctx.fillStyle = "rgba("+blipColor[0]+", "+blipColor[1]+", "+blipColor[2]+", .8)";
          ctx.arc(x,y,1,0,Math.PI*2,true);
          ctx.fill();
          var head = Math.atan2(x - cx, y - cy);

          elation.events.fire('radar_blip', { x: x, y: y, head: head, heading: heading, obj: obj, event: event, angle: angle });
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
          
          ctx.beginPath();
          ctx.fillStyle = "rgba("+outlineColor[0]+", "+outlineColor[1]+", "+outlineColor[2]+", .3)";
          
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
          
          ctx.fill();   
          
          break;
        
        default:
          var cpos = contact.position,
              x = cpos.x - pos.x,
              y = cpos.z - pos.z,
              rot = this.rotate(x, y, heading);
          
          //if (this.checkInBounds(x, y))
            drawBlip(rot.x, rot.y, contact, this.event);
          
          break;
      }
    }
    
    return angle;
  }
  
  this.checkInBounds = function(x, y) {
    if (x < 0 || x > this.width || y < 0 || y > this.height)
      return false;
    
    return true;
  }
  
  this.addContact = function(contact) {
    this.contacts.push(contact);
    console.log('Radar added contact', contact);
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
    
    this.hud.console.log('rotacol initialized.');
  }
  
  this.format = function(pos) {
    return Math.round(pos);
  }
  
  this.render = function(pos) {
    var pos = this.camera.position;
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
      classname: 'hud_console',
      append: document.body
    });
    this.display = elation.html.create({
      tag: 'ul',
      classname: 'hud_console_display',
      append: this.container
    });
    this.bottom = elation.html.create({
      tag: 'div',
      classname: 'hud_console_bottom',
      append: this.container
    });
    this.input = elation.html.create({
      tag: 'input',
      classname: 'hud_console_input',
      append: this.bottom,
      attributes: {
        type: 'text'
      }
    });
    
    this.log('initializing vr interface...');
    //this.input.focus();
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
    
    this.hud.console.log('altimeter initialized.');
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
      classname: 'hud_debug',
      append: document.body
    });
    
    this.hud.console.log('debug initialized.');
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
          key + ':' + this.format(data[key]);
  }
  
  this.init();
});

elation.extend('ui.widgets.targeting', function(hud) {
  this.hud = hud;
  this.range = 3500;
  this.width = 300;
  this.height = 300;
  this.colors = {
    blip: '#0f0',
    target_arrow: '#bbffee',
    //target_arrow: '#8aeeec',
    target_box: '#d53131',
    target_ring: '#bbffee'
    //target_ring: '#7b9cab'
  };
  this.opos = { x:0, y:0, z:0 };
  
  this.init = function() {
    this.camera = elation.space.fly.obj[0].camera;
    
    this.container = elation.html.create({
      tag: 'div',
      classname: 'hud_targeting',
      append: document.body
    });
    
    this.canvas = elation.html.create({
      tag: 'canvas',
      classname: 'hud_targeting_canvas',
      append: this.container
    });
    
    this.ctx = this.canvas.getContext('2d');

    this.resize();
    this.render();
    
    elation.events.add(window, 'resize', this);
    
    elation.events.add(null, 'radar_blip', this);

    this.hud.console.log('targeting system initialized.');
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
  
  this.render = function() {
    if (!elation.utils.arrayget(this, 'camera.position.y'))
      return;
    
    var ctx = this.ctx,
        lnColor = hex2rgb(this.colors['target_ring']),
        cx = this.center.x, 
        cy = this.center.y;
        
    this.canvas.width = this.canvas.width;
    
    ctx.beginPath();
    ctx.fillStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .2)";
    ctx.arc(cx,cy,30,0,Math.PI*2,true);
    ctx.fill();  
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .35)";
    ctx.arc(cx,cy,150,0,Math.PI*2,true);
    ctx.stroke();  
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
        dist = Math.round(elation.vector3.distance(A, B)),
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
    this.setFPV(ctx, odata, cx, cy, cpos, r, lnColor);
    //this.hud.debug.log(q);
    
    if (!t) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba("+tgColor[0]+", "+tgColor[1]+", "+tgColor[2]+", .9)";
      ctx.lineWidth = 2;
      ctx.lineCap = 'butt';
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
  
  this.setFPV = function(ctx, data, cx, cy, cpos, r, lnColor) {
    var delta = data.data.event.data.lastupdatedelta,
        angle = data.data.angle,
        head = data.data.heading,
        pitch = angle[1],
        bank = angle[2],
        fps = 1 / delta,
        r = r - 20,
        J = 14.2, // FIXME - computer max delta programatically
        v = elation.vector3,
        A = [ cpos.x, cpos.y, cpos.z ],
        B = [ this.opos.x, this.opos.y, this.opos.z ],
        speed = elation.vector3.distance(A, B) * fps,
        NA = v.normalize(A),
        NB = v.normalize(B),
        W = v.subtract(A, B),
        K = [
          (W[0] / J) * r,
          (W[2] / J) * r
        ],
        F = Math.atan2(K[0], K[1]),
        T = F - head,
        rr = elation.transform.rotate(0, ((speed / 1000) * (r/2)), -T),
        x = cpos.x - this.opos.x,
        y = cpos.y - this.opos.y,
        z = cpos.z - this.opos.z,
        FPVxr = (Math.tan(bank) * .50),
        FPVyr = (Math.tan(head) * .50),
        fx = r * FPVxr,
        fy = r * FPVyr,
        fx = fx > r ? r : fx, 
        fx = 0,//fx > r ? r : fx < -r ? -r : fx, 
        fy = fy > r ? r : fy < -r ? -r : fy,
        q = {
          delta: data.data.event.data.lastupdatedelta,
          fps: Math.round(fps),
          speed: Math.round(speed) + '/sec',
          F: F,
          T: T,
          heading: head,
          sdelta: speed - this.speed,
          pitch: Math.tan(pitch) * .5,
          FPVxr: FPVxr,
          FPVyr: FPVyr
        }, 
        cx = cx + rr.x,
        cy = cy + rr.y;
    
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
    
    this.speed = speed;
    this.setPitch(ctx, data, cx, cy, cpos, r, lnColor); 
  }
  
  this.setPitch = function(ctx, data, cx, cy, cpos, r, lnColor) {
    var angle = data.data.angle,
        head = data.data.heading,
        yaw = angle[0],
        pitch = angle[1],
        bank = angle[2],
        r = 60,
        degrees = pitch * 180 / Math.PI,
        dim = elation.html.dimensions(),
        d2p = dim.h / 50,
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
          ctx.fillText(key, cx + v1.x, cy + v1.y);
        },
        rot = function(x1, y1, x2, y2) {
          var v1 = elation.transform.rotate(x1, y1, bank);
          var v2 = elation.transform.rotate(x2, y2, bank);
          ctx.moveTo(cx + v1.x, cy + v1.y);
          ctx.lineTo(cx + v2.x, cy + v2.y);
        },
        min = Math.round(degrees - (d2p)),
        max = Math.round(degrees + (d2p)),
        ar = [], y, ob = {}, type;
    
    for (var i=min; i<max; i++) {
      if (i % 5 == 0) {
        tmp = (degrees - i) * d2p
        ar.push(-tmp);
        ob[i] = -tmp;
      }
    }
    
    this.hud.debug.log(q);
    
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .5)";
    
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
          line(key, r, y,
              (r*1.35), y, (r/2), y,
              -(r*1.35), y, -(r/2), y);
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

