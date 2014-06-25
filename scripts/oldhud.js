elation.extend('ui.widgets.atlas_controls', function(hud) {
  this.hud = hud;
  this.colors = this.hud.colors;
  
  this.init = function() {
    this.controls_r = this.hud.container('atlas_controls_right');
    this.controls_t = this.hud.container('atlas_controls_top');
    
    this.contents_r = elation.tplmgr.GetTemplate('atlas_controls_right');
    this.contents_t = elation.tplmgr.GetTemplate('atlas_controls_top');
    
    this.controls_r.innerHTML = this.contents_r;
    this.controls_t.innerHTML = this.contents_t;
    elation.events.add(window, 'resize', this);
    this.resize();
  }
  
  this.render = function() {

  }
  
  this.handleEvent = function(event) {
    if (typeof this[event.type] == 'function')
      this[event.type](event);
  }
  
  this.resize = function(event) {
    var wdim = elation.html.dimensions(window);
    
    this.controls_t.style.right = wdim.w/2 - this.controls_t.offsetWidth/2 + 'px';
  }
  
  this.init();
});

/* ATLAS spot picker */
elation.extend('ui.widgets.atlas', function(hud) {
  this.hud = hud;
  this.colors = this.hud.colors;
  
  this.init = function() {
    (function(self) {
      setTimeout(function() { self.resize(); },1);
    })(this);
    
    elation.events.add(window, 'resize', this);
  }
  
  this.render = function() {

  }
  
  this.handleEvent = function(event) {
    if (typeof this[event.type] == 'function')
      this[event.type](event);
  }
  
  this.resize = function(event) {
    
  }
  
  this.init();
});

/* ATLAS 3D Planet Wireframe */
elation.extend('ui.widgets.atlas_planet', function(hud) {
  this.hud = hud;
  this.rotating = true;
  this.delta = 0;
  
  this.init = function() {
    console.log('planet init start', this);
    this.atlas = this.hud.atlas;
    this.buffer = elation.html.create({ tag: 'canvas' });
    this.ctx = this.buffer.getContext('2d');
    
    //var controls = new THREEx.ControlMapper();
    
    var container = elation.find('canvas');
    elation.events.add(container[0], 'planet,renderframe_end', this);
    var obj = {
      "move_left": function(ev) { this.position.x -= ev.value * 100; },
      "move_right": function(ev) { this.position.x += ev.value * 100; },
      "move_forward": function(ev) { this.position.z -= ev.value * 100; },
      "move_backward": function(ev) { this.position.z += ev.value * 100; },
      "move_up": function(ev) { this.position.y += ev.value * 100; },
      "move_down": function(ev) { this.position.y -= ev.value * 100; },
      "move": this.move,
      "wheel": this.mousewheel
    };
    elation.space.controls(0).addContext("atlas_planet", obj);
    elation.space.controls(0).addBindings("atlas_planet", {
      "keyboard_w": "move_forward",
      "keyboard_a": "move_left",
      "keyboard_s": "move_backward",
      "keyboard_d": "move_right",
      /*
      "mouse_drag_x": "move_left",
      "mouse_drag_y": "move_up"
      */
      "mousewheel": "wheel",
      "mouse_drag_delta": "move"
    });
    
    elation.space.controls(0).activateContext("atlas_planet", this);
    
    console.log('planet init', this);
    elation.events.add(window, 'resize', this);
    //elation.events.add(container[0], 'click,mousedown,mousemove,mouseup,mouseout,mousewheel', this);
  }
  
  this.planet = function(event) {
    console.log('planetevent',event);
    this.planet = event.data.sphere;
    this.radius = event.data.radius;
    this.zoom = 10;
    this.zoominit = this.radius * 2.7;
    this.zoomstep = this.radius / 3.6;
    this.hud = elation.ui.hud;
    this.rotateX = 90;
    this.rotateY = 15;
    this.rotating = true;
    this.delta = 0;
    this.mouse = {x:0,y:0};
    this.viewport = this.hud.controller;
    this.viewport.camera.position.z = (this.zoom * this.zoomstep) + this.zoominit;
    this.zoom = 0;
    this.zoomchange = true;
    
    var canvas = this.buffer,
        ctx = this.ctx,
        width = 4096,
        height = 2048,
        center = { x: (width / 2), y: (height / 2) },
        viewport = this.viewport,
        lnColor = this.hud.color('atlas_planet_lines'),
        dw = width / 36,
        dh = height / 18,
        lines = function(bool) {
          var max = bool ? 37 : 19;
          
          for (var i=1; i<max; i++) {
            var n = i * (bool?dw:dh),
                x = bool ? n : width,
                y = bool ? height : n;
            
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .9)";
            ctx.moveTo((bool?n:0),(bool?0:n));
            ctx.lineTo(x,y);
            ctx.stroke();
          }
        };
    
    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);
    
    lines(true);
    lines(false);
    //this.craters();
    
    var texture = new THREE.Texture( canvas, THREE.UVMapping, THREE.NearestFilter, THREE.NearestFilter ),
        material = new THREE.MeshBasicMaterial({ transparent: true, map: texture, blending: THREE.AdditiveAlphaBlending });
    
    texture.needsUpdate = true;
    
    var sphere = this.sphere = new THREE.Mesh(new THREE.SphereGeometry(this.radius,108,54), material);
        
    viewport.scene.add(sphere);
    
    elation.events.add(sphere, 'mousemove', this);
  }
  
  this.render = function() {
    if (this.rotating)
      this.rotateX += .015;
    
    if (this.zoomchange) {
      this.zoomchange = false;
      this.zoompos = (this.zoom * this.zoomstep) + this.zoominit;
    }
    
    if (this.zoompos) {
      var pos = this.viewport.camera.position.z,
          delta = pos - this.zoompos,
          npos = pos - (delta/10);
      
      if (Math.abs(delta) < 1)
        this.zoompos = false;
      
      this.viewport.camera.position.z = npos;
    }
    
    if (this.sphere) {
      var y = this.degree2radian(this.rotateX);
      
      if (this.sphere.rotation.y != y) {
        this.sphere.rotation.y = y
        this.planet.rotation.y = this.degree2radian(this.rotateX) - ((Math.PI/2) * 2);
      }
      if (this.rotateY) {
        this.sphere.rotation.x = this.degree2radian(this.rotateY);
        this.planet.rotation.x = this.degree2radian(this.rotateY);
      }
    }
  }
  
  this.handleEvent = function(event) {
    var type = event.type,
        replace = {
          'mouseout':'mouseup',
          'DOMMouseScroll':'mousewheel'
        };
    
    if (replace[type])
      type = replace[type];
    
    if (typeof this[type] == 'function')
      this[type](event);
    
    event.preventDefault();
  }
  
  this.mousedown = function(event) {
    var mouse = elation.events.coords(event);
    
    this.dragging = true;
    this.mouse = mouse;
    this.omouse = mouse;
  }
  
  this.mousemove = function(event) {
    console.log(event);
    var point = event.data.point,
        inv = new THREE.Matrix4().getInverse(this.sphere.matrixWorld),
        xform = new THREE.Vector3(point.x, point.y, point.z);
    
    inv.multiplyVector3(xform);
    
    var spherical = this.cartesian2spherical(xform),
        geographic = this.spherical2geographic(spherical),
        geographic = [ geographic[0], geographic[1] ],
        latdiv = elation.id('#atlas_info_lat'),
        lngdiv = elation.id('#atlas_info_lng');
    
    console.log('###',point, xform.x, xform.y, xform.z, spherical, geographic);
    
    latdiv.innerHTML = geographic[0].toFixed(4);
    lngdiv.innerHTML = geographic[1].toFixed(4);
  }
  
  this.move = function(event) {
    //console.log(event.type, this.dragging, event);
    
    //if (!this.dragging)
    //  return;
    
    var wdim = elation.html.dimensions(window),
        x = (wdim.w * event.value[0]) + (wdim.w / 2),
        y = (wdim.h * event.value[1]) + (wdim.h / 2),
        mouse = { x:x, y:y },
        deltaX = event.value[0],
        deltaY = event.value[1],
        degreesX = 100 * -deltaX,
        degreesY = 100 * -deltaY,
        maxtilt = 90;
    
    this.rotateX += degreesX;
    this.rotateY += degreesY;
    this.rotateY = this.rotateY > maxtilt ? maxtilt : this.rotateY < -maxtilt ? -maxtilt : this.rotateY;
    
    this.mouse = mouse;
    this.delta = deltaX;
    //var meh = elation.space.admin.obj.admin.projectMousePosition([mouse.x,mouse.y]);
    
    //console.log(meh);
  }
  
  this.mouseup = function(event) { 
    var mouse = elation.events.coords(event);
    
    this.dragging = false;
    
    if (this.omouse && mouse.x == this.omouse.x && mouse.y == this.omouse.y)
      this.savedot(mouse);
  }
  
  this.mousewheel = function(event) {
		var	event = event ? event : window.event,
        max = 5,
				mwdelta = event.value[0];
		
    if (mwdelta < 0)
      this.zoom++;
    else
      this.zoom--;
    
    this.zoom = this.zoom < -max ? -(max + -((this.zoom + max)/2)) : this.zoom > max ? max : this.zoom;
    
    console.log(event.type, this.zoom, event);
    this.zoomchange = true;
  }
  
  this.craters = function() {
    for (var i=0; i<this.dots.length; i++) {
      var geographic = this.dots[i],
          lnColor = this.hud.color('target_blip'),
          alpha = .6,
          y = (1 - ((parseFloat(geographic[0]) + 90) / 180)) * height,
          t = this.validateLNG(parseFloat(geographic[1]) + 180),
          x = ( (t<0?360+t:t) / 360) * width,
          size = geographic[2] * 6 || 4;
      
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.fillStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", "+(alpha/3)+")";
      ctx.arc(x,y,size,0,Math.PI*2,true);
      ctx.fill();
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", "+alpha+")";
      ctx.arc(x,y,size,0,Math.PI*2,true);
      ctx.stroke();
    }
  }
  
  this.cartesian2spherical = function(point) {
    var r = this.radius,
        x = point.x,
        y = point.y,
        z = point.z,
        
        rho = Math.sqrt(Math.pow(x,2) + Math.pow(z,2) + Math.pow(y,2)),
        phi = Math.atan2(y, Math.sqrt(Math.pow(x,2) + Math.pow(z,2))),
        theta = Math.atan2(z, x);
    
    return [rho, phi, theta]; 
  }
  
  this.spherical2cartesian = function(spherical) {
    var r = spherical[2] || 1, sin = Math.sin, cos = Math.cos,
        x = r * (cos(spherical[1]) * sin(spherical[0])),
        y = r * (sin(spherical[1]) * sin(spherical[0])),
        z = r * cos(spherical[0]);
    
    return [x, y, z];
  }
  
  this.spherical2geographic = function(spherical) {
    var dphi = this.radian2degree(spherical[1]),
        dtheta = this.radian2degree(spherical[2]),
        latlng = this.degrees2geographic(dphi, dtheta);
    
    return [latlng[0], latlng[1]];
  }
  
  this.degrees2geographic = function(dphi, dtheta) {
    var lat = dphi,
        lat = dtheta > 0 ? -lat : lat;
        lng = dtheta;
    
    return [lat, lng];
  }
  
  this.degree2radian = function(degree) {
    var radian = (degree * 2 * Math.PI) / 360;
    return radian;
  }
  
  this.radian2degree = function(radian) {
    var degree = radian * (180 / Math.PI);
    return degree;
  }
  
  this.validateLNG = function(lng) {
    var tmp = lng / 360;
    
    lng = (tmp - Math.floor(tmp)) * 360;
    lng = lng > 180 ? lng - 360 : lng; 
    
    return lng;
  }
  
  this.validateLAT = function(lat) {
    lat = lat > 90 
      ? 90 - (lat - 90)
      : lat < -90
        ? -90 - (lat + 90)
        : lat;
    
    return lat;
  }
  
  this.init();
});

elation.extend('ui.widgets.atlas_planet_2d', function(hud) {
  this.hud = hud;
  this.colors = this.hud.colors;
  this.padding = 2;
  this.rotate = 90;
  this.rotateY = 0;
  this.delta = 0;
  this.dots = [];
  
  this.init = function() {
    this.atlas = this.hud.atlas;
    this.atlas.resize();
    this.container = this.hud.container('atlas_planet', true);
    this.ctx = this.container.getContext('2d');
    
    elation.events.add(this.container, 'click,mousedown,mousemove,mouseup,mouseout', this);
    
    this.craters(craters1, 1.5);
    this.craters(craters2, 1);
    this.craters(craters3, .5);
    this.craters(craters4, .5);
    
    //this.planet();
  }
  
  this.craters = function(craters, size) {
    for (var i=0; i<craters.length; i++) {
      var line = craters[i],
          line = line.split(' '),
          splices = [];
      
      for (var a=0; a<line.length; a++) {
        if (line[a] != "")
          splices.push(line[a]);
      }
      
      this.dots.push([splices[1],splices[0],size]);
    }
  }
  
  this.render = function(event) {
    var ctx = this.ctx,
        lnColor = this.hud.color('target_box'),
        cx = this.center.x,
        cy = this.center.y,
        radius = this.radius * 3;
    
    this.container.width = this.width;
    
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.fillStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .15)";
    ctx.arc(cx,cy,radius,0,Math.PI*2,true);
    ctx.fill();
    
    for (var i=0; i<this.dots.length; i++) {
      var geographic = this.dots[i],
          coord = this.geographic2cartesian(parseFloat(geographic[0]),parseFloat(geographic[1]), radius, cx, cy),
          lnColor = this.hud.color('target_blip'),
          alpha = coord[2] <= radius ? .9 : .4,
          x = coord[0],
          y = coord[1],
          size = geographic[2] || 4;
      
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", "+alpha+")";
      if (size == .5) {
        ctx.lineTo(x,y);      
        ctx.lineTo(x+1,y+1);      
      } else {
        ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", "+alpha+")";
        ctx.arc(x,y,size,0,Math.PI*2,true);
      }
      ctx.stroke();
    }
    
    lnColor = this.hud.color('target_box');
    for (var i=-180; i<180; i = i + 10) {
      var b = i === 0 ? 0.0000001 : i;
      this.line(b, null, radius, cx, cy, lnColor, ctx, 180);
    }
    
    for (var i=-180; i<180; i = i + 10) {
      var b = i === 0 ? 0.0000001 : i;
      this.line(null, b, radius, cx, cy, lnColor, ctx, 90);
    }
    
    //this.rotate += .02;
  }
  
  this.line = function(lat, lng, radius, cx, cy, lnColor, ctx, max) {
    ctx.beginPath();
    ctx.lineWidth = 2;
    
    for (var i=-max; i<=max; i = i + (max==90?5:30)) {
      var coord = this.geographic2cartesian(lat || i, lng || i, radius, cx, cy),
          alpha = coord[2] <= radius ? .7 : .25;
      
      ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", "+alpha+")";
      ctx.lineTo(coord[0],coord[1]);
    }
    
    ctx.stroke();
  }
  
  this.handleEvent = function(event) {
    var type = event.type,
        replace = {
          'mouseout':'mouseup'
        };
    
    if (replace[type])
      type = replace[type];
    
    if (typeof this[type] == 'function')
      this[type](event);
    
    event.preventDefault();
  }
  
  this.geographic2cartesian = function(lat, lng, radius, cx, cy) {
    var coord = this.geographic2spherical(lat, lng, radius),
        x = coord[0] + cx,
        y = coord[2] + cy,
        rho = coord[1] + radius,
        r = 1 + ((1-(rho/(radius*2))) * 4);
    
    return [x, y, rho]
  }
  
  this.geographic2spherical = function(lat, lng, radius) {
    var rot = this.rotate,
        roty = this.rotateY,
        lat = lat + 180,
        lng = lng + rot,
        phi = lat > 0 ? 90 - lat : 90 + lat;
        theta = lng;
        rphi = this.degree2radian(phi),
        rtheta = this.degree2radian(theta),
        coord = this.spherical2cartesian([rphi, rtheta, radius]);
    
    return coord;
  }
  
  this.cartesian2spherical = function(mouse) {
    var r = mouse.r,
        x = mouse.x - this.x - this.center.x,
        y = mouse.y - this.y - this.center.y,
        z = Math.sqrt(Math.pow(r,2) - Math.pow(x,2) - Math.pow(y,2)),
        
        rho = Math.sqrt(Math.pow(x,2) + Math.pow(z,2) + Math.pow(y,2)),
        phi = Math.atan2(y, Math.sqrt(Math.pow(x,2) + Math.pow(z,2))),
        theta = Math.atan2(z, x);
    
    return [rho, phi, theta]; 
  }
  
  this.spherical2cartesian = function(spherical) {
    var r = spherical[2] || 1, sin = Math.sin, cos = Math.cos,
        x = r * (cos(spherical[1]) * sin(spherical[0])),
        y = r * (sin(spherical[1]) * sin(spherical[0])),
        z = r * cos(spherical[0]);
    
    return [x, y, z];
  }
  
  this.spherical2geographic = function(spherical) {
    var dphi = this.radian2degree(spherical[1]),
        dtheta = this.radian2degree(spherical[2]),
        latlng = this.degrees2geographic(dphi, dtheta);
    
    return [latlng[0], latlng[1]];
  }
  
  this.degrees2geographic = function(dphi, dtheta) {
    var lat = dphi,
        lat = dtheta > 0 ? -lat : lat;
        lng = 90 - dtheta;
    
    return [lat, lng];
  }
  
  this.degree2radian = function(degree) {
    var radian = (degree * 2 * Math.PI) / 360;
    return radian;
  }
  
  this.radian2degree = function(radian) {
    var degree = radian * (180 / Math.PI);
    return degree;
  }
  
  this.mousedown = function(event) {
    var mouse = elation.events.coords(event);
    
    this.dragging = true;
    this.mouse = mouse;
    this.omouse = mouse;
  }
  
  this.mousemove = function(event) {
    if (!this.dragging)
      return;
    
    var mouse = elation.events.coords(event),
        deltaX = mouse.x - this.mouse.x,
        deltaY = mouse.y - this.mouse.y,
        degreesX = .25 * deltaX,
        degreesY = .25 * deltaY;
    
    this.rotate += degreesX;
    this.rotateY += degreesY;
    
    this.mouse = mouse;
    this.delta = deltaX;
  }
  
  this.mouseup = function(event) {
    var mouse = elation.events.coords(event);
    
    this.dragging = false;
    
    if (this.omouse && mouse.x == this.omouse.x && mouse.y == this.omouse.y)
      this.savedot(mouse);
  }
  
  this.savedot = function(mouse) {
    var spherical, geographic;
    
    mouse.r = this.radius;
    
    spherical = this.cartesian2spherical(mouse);
    geographic = this.spherical2geographic(spherical);
    
    // adjust for rotation
    geographic[1] = this.validateLNG(geographic[1] - this.rotate + 90);
    geographic[2] = 3;
    
    this.hud.debug.log({
      latitude: geographic[0],
      longitude: geographic[1]
    });
    
    this.dots.push(geographic);
    return;
  }
  
  this.validateLNG = function(lng) {
    var tmp = lng / 360;
    
    lng = (tmp - Math.floor(tmp)) * 360;
    lng = lng > 180 ? lng - 360 : lng; 
    
    return lng;
  }
  
  this.init();
});

elation.extend('ui.widgets.radar', function(hud) {
  this.hud = hud;
  this.mode = 'ALL';
  this.range = 24000;
  this.width = 400;
  this.height = 400;
  this.odist = 0;
  this.sweepspeed = .06;
  this.sweepangle = Math.PI;
  this.contacts = [];
  this.colors = this.hud.colors;
  this.alpha = .5;
  this.types = {
    drone: 'blip',
    planet: 'blip',
    building: 'outline',
    road: 'outline'
  };
  
  this.init = function() {
    this.setCamera(this.hud.controller.camera);
    this.container = this.hud.container('radar radar_background', true);
    //this.canvas = this.hud.container('radar radar_display', true);
    this.ctx = this.container.getContext('2d');
    this.center = { x: (this.width / 2), y: (this.height / 2) };
    
    this.outline();
    this.nextTarget();
    this.render();
    
    //elation.events.add(null,'select,deselect',this);
    
    this.hud.console.log('radar system:  <strong>initialized</strong>');
  }
  
  this.handleEvent = function(event) {
    console.log('radar handleEvent', event);
    this[event.type](event);
  }
  
  this.select = function(event) {
    console.log('radar select', event);
  }
  
  this.deselect = function(event) {
    console.log('radar deselect', event);
  }
  
  this.setCamera = function(camera) {
    this.camera = camera;
  }

  this.rotate = function(X, Y, angle) {
    var range = this.range,
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
          elation.transform.rotate(-7, 198, angle),
          elation.transform.rotate(7, 198, angle)
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
        ctx = this.ctx,//slayer.getContext('2d');
        ctxbg = this.ctx,
        alpha = this.alpha;
    
    ctx.beginPath();  
    //ctx.fillStyle = "rgba("+bgColor[0]+", "+bgColor[1]+", "+bgColor[2]+", 1)";
    ctx.fillStyle = "rgba(33,0,0, 1)";
    ctx.rect(0,0,this.width,this.height);  
    ctx.fill();
    ctx.beginPath();  
    ctx.fillStyle = "rgba("+bgColor[0]+", "+bgColor[1]+", "+bgColor[2]+", 1)";
    ctx.arc(cx,cy,200,0,Math.PI*2,true);
    ctx.fill();
    
    this.drawText(ctx);
    
    ctx.beginPath();  
    ctx.arc(cx,cy,200,0,Math.PI*2,true);  
    ctx.clip();
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.fillStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .1)";
    ctx.moveTo(x+0,y+0);
    ctx.lineTo(x+200,y+202);
    ctx.lineTo(x+400,y+0);  
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x+0,y+0);
    ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", "+this.alpha+")";
    ctx.lineTo(x+200,y+202);
    ctx.moveTo(x+400,y+0);
    ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", "+this.alpha+")";
    ctx.lineTo(x+200,y+202);  
    ctx.stroke();
    ctx.beginPath();  
    ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", "+this.alpha+")";
    ctx.arc(cx,cy,198,0,Math.PI*2,true);
    ctx.stroke(); 
  }
  
  this.render = function(e) {
    var ctx = this.ctx,
        cx = this.center.x, 
        cy = this.center.y,
        bgColor = hex2rgb(this.colors['background']),
        lnColor = hex2rgb(this.colors['lines']),
        //altitude = (this.width/2) - ((this.width/4) * (this.camera.position.y / (this.range/4))),
        altitude = this.width/3,
        altitude = altitude >= 0 ? altitude : 0;
    
    //this.canvas.width = this.canvas.width;
    this.hud.clear(this.ctx, this.width, this.height);
    this.event = e;
  
    //this.outline();
    ctx.beginPath();  
    ctx.arc(cx,cy,200,0,Math.PI*2,true);  
    ctx.clip();
    ctx.beginPath();
    ctx.fillStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .1)";  
    ctx.arc(cx,cy,altitude,0,Math.PI*2,true);
    ctx.fill();
    ctx.beginPath();  
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", "+this.alpha+")";
    ctx.arc(cx,cy,altitude,0,Math.PI*2,true); 
    ctx.stroke();
    ctx.lineWidth = 1;

    //this.sweep(ctx, cx, cy, bgColor, lnColor);
    this.draw(ctx, cx, cy);
    //this.flicker();
    
    //this.paintTarget();
  }
  
  this.drawText = function(ctx) {
    var fgColor = hex2rgb(this.colors['target_hilight']),
        fgColor = "rgba("+fgColor[0]+","+fgColor[1]+","+fgColor[2]+",.6)";
    
    elation.canvas.text(ctx, this.range+'m', [this.width-8,2], fgColor, '15pt sans-serif', 'right');
    elation.canvas.text(ctx, this.mode, [this.width-8,22], fgColor, '10pt sans-serif', 'right');
  }
  
  this.paintTarget = function() {
    var target = this.current_target,
        c = elation.canvas,
        r = target ? target.radar : false,
        center = this.center;
    
    if (r) {
      c.circle(this.ctx, r.x, r.y, 3, this.color('target_hilight'), .5, 'stroke');
      this.ctx.lineWidth = 2;
      c.line(this.ctx, [[center.x, center.y],[r.x, r.y]], this.color('target_hilight'), .2, 'stroke');
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
      this.hud.target.label = target.type;
      this.hud.target.name = target.thing.args.name;
    }
    
    this.updateTargetDistance(target);
    
    //console.log('target',(t || 0),target);
    
    var rot = target.rotation,
        pos = target.position,
        scale = target.scale || [ 0, 0, 0 ];
    
    this.hud.ops.drawRotation(target,pos,rot);
    
    this.updateTargetInfo(target);
    
    target.target = true;
    this.current_target = target;
    console.log('CURRENT TARGET', this.current_target);
  }
  
  this.getTarget = function() {
    var contacts = this.contacts,
        contact;
    
    if (!contacts || contacts.length == 0)
      return;
    
    for (var i=0; i<contacts.length; i++) {
      contact = contacts[i];
      
      if (contact.target)
        return contact;
    }
    
    return false;
  }
  
  this.updateTargetInfo = function(target) { return;
    if (target.thing && target.thing.expose && target.thing.expose.length > 0) {
      var expose = target.thing.expose;
      var logObj = {};
      var thing = target.thing;
      
      for (var item,key,i=0; i<expose.length; i++) {
        key = expose[i];
        item = elation.utils.arrayget(thing, key);
        
        if (typeof item == 'string' || typeof item == 'number') {
          logObj[key] = item;
        } else if (typeof item == 'object') {
            if (item instanceof THREE.Vector3) {
              var value = '';
              
              for (var tkey in item) {
                if (typeof item[tkey] == 'number') {
                  if (key == 'rotation')
                    var num = (item[tkey]).toFixed(2);
                  else
                    var num = (item[tkey]).toFixed(0);
                  
                  value += !value ? num : ', ' + num;
                }
              }
              
              logObj[key] = value;
            } else {
              for (var tkey in item) {
                logObj[tkey] = item[tkey];
            }
          }
        }
      }
      
      if (logObj)
        this.hud.debug.log(logObj);
    } else {
      this.hud.debug.log('');
    }
  }
  
  this.updateTargetDistance = function(target) {
    var dist = Math.round(this.camera.position.distanceTo(target.thing.position) || 0);
    
    if (dist != this.odist) {
      this.hud.target.distance = dist;
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
    
    this.container.style.opacity = 1;
    
    for (var i=0; i<timings.length; i++) {
      if (this.hud.ticks % timings[i] == 0)
        this.container.style.opacity = .85;
      else if (this.hud.ticks > 500)
        this.hud.ticks = 0;
    }
  }
  
  this.color = function(type) {
    return hex2rgb(this.colors[type]);
  }

  this.draw = function(ctx, cx, cy) {
    var campos = this.camera.matrix.decompose(),
        angle = elation.utils.quat2euler(campos[1]),
        heading = angle[0],
        bank = angle[1],
        pos = campos[0],
        contacts = this.contacts,
        contact, type,
        outlineColor = this.color('target_outline'),
        blipColor = this.color('target_blip'),
        hilightColor = this.color('target_hilight'),
        drawBlip = function(x, y, obj, event, a, type, parent) {
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
            var physical = contact.thing.properties.physical, w;
            
            switch (contact.thing.type) {
              case 'roidfield': w = 0; break;
              case 'debris': w = 1; break;
              case 'planet': w = 6; break;
              default: 
                w = (physical && physical.radius ? Math.ceil((parent.width / 2) * (physical.radius / parent.range)) : 2);
            }
            
            //console.log('radar',contact.thing.type);
            ctx.beginPath();
            if (contact.thing.type == 'spacedust')
              ctx.fillStyle = "rgba(150, 150, 150, .6)";
            else
              ctx.fillStyle = "rgba("+blipColor[0]+", "+blipColor[1]+", "+blipColor[2]+", "+(.3 + a)+")";
            
            ctx.arc(x,y,w,0,Math.PI*2,true);
            
            
            
            ctx.fill();
          }
          
          obj.radar = { x: x, y: y }
          
          var head = Math.atan2(x - cx, y - cy);
          //elation.events.fire('radar_blip', { x: x, y: y, head: head, heading: heading, obj: obj, event: event, angle: angle });
        }; 
    
    for (var i=0; i<contacts.length; i++) {
      contact = contacts[i];
      type = this.types[contact.type] || 'blip';
      
      if (elation.utils.arrayget(contact,'thing.properties.render.noradar'))
        continue;
      
      //console.log(contact.thing.type);
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
          var cpos = contact.thing.position,
              x = cpos.x - pos.x,
              y = cpos.z - pos.z,
              rot = this.rotate(x, y, heading), c = 0;
          
          //if (this.checkInBounds(x, y))
          /*
          var spos = [ this.sweeperpos.x, -this.sweeperpos.y, 0 ],
              cpos = [ rot.x-cx, cy-rot.y, 0 ],
              xpos = elation.vector3.normalize(elation.vector3.subtract(spos,cpos)),
              a = Math.atan2(spos[0],spos[1]),
              b = Math.atan2(cpos[0],cpos[1]),
              c = a - b,
              c = c < 0 ? c + (Math.PI * 2) : c,
              c = (1 - ((c / 2) / Math.PI)) * 5,
              c = (c * .5);
          
          drawBlip(rot.x, rot.y, contact, this.event, c, type, this);
          */
          
          //console.log(contact == this.current_target, contact, this.current_target);
          if (contact == this.current_target) {
            //console.log(contact);
            this.updateTargetInfo(contact);
            this.updateTargetDistance(contact);
            this.hud.ops.drawRotation(contact,contact.position,contact.rotation);
          }
          
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

elation.extend('ui.widgets.target_detail', function(name, container, parent) {
  this.parent = parent;
  this.container = container;
  this.hud = parent.hud;
  this.width = 400;
  this.height = 400;
  this.colors = this.hud.colors;

  this.init = function() {
    this.camera = this.hud.controller.camera;
    
    this.canvas = this.hud.container('target_display', true, true);
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');   
    this.resize();
    
    this.hud.console.log('targeting display subsystem:  <strong>initialized</strong>');
  }
  
  this.render = function(event) {
    var ctx = this.ctx,
        hud = this.hud,
        color = hud.color('lines'),
        color2 = hud.color('target_box'),
        color3 = hud.color('target_hilight'),
        target = hud.radar.getTarget();
    
    if (!target)
      return;
    
    var format = function(str) { return (''+str).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"); },
        label = this.parent.label,
        name = this.parent.name,
        dist = format(this.parent.distance),
        pos = target.position,
        x = format(Math.round(pos.x)),
        y = format(Math.round(pos.y)),
        z = format(Math.round(pos.z)),
        top = this.width / 12,
        cx = this.center.x,
        cy = this.center.y + (top/2),
        lineWidth = Math.floor(this.width / 100),
        bgcolor = "rgba("+color[0]+","+color[1]+","+color[2]+",.3)",
        fgcolor = "rgba("+color[0]+","+color[1]+","+color[2]+",.6)",
        gridcolor = "rgba("+color2[0]+","+color2[1]+","+color2[2]+",.4)",
        hbgcolor = "rgba("+color3[0]+","+color3[1]+","+color3[2]+",.3)",
        hfgcolor = "rgba("+color3[0]+","+color3[1]+","+color3[2]+",.6)",
        lines = 3,
        cross = 9;
    

    //ctx.beginPath();  
    //ctx.fillStyle = "rgba(0,0,0,1)";
    //ctx.rect(0, 0, this.width, this.height);
    //ctx.fill();
    this.canvas.width = this.canvas.width;
    
    var w = this.width / lines,
        tx = Math.round(pos.x),
        ty = Math.round(pos.z),
        stepx = -(tx - (Math.floor(tx / w) * w)),
        stepy = -(ty - (Math.floor(ty / w) * w));
    
    for (var i=0; i<=lines; i++) {
      var xx = (w * i) + stepx,
          yy = top + 6;
      
      ctx.beginPath();
      ctx.strokeStyle = gridcolor;
      ctx.lineWidth = lineWidth/2;
      ctx.moveTo(xx, yy);
      ctx.lineTo(xx, this.height);
      ctx.stroke();
    }
    
    for (var i=1; i<=lines; i++) {
      var xx = 0,
          yy = 6 + (w * i) + stepy;
      
      ctx.beginPath();
      ctx.strokeStyle = gridcolor;
      ctx.lineWidth = lineWidth / 2;
      ctx.moveTo(xx, yy);
      ctx.lineTo(this.width, yy);
      ctx.stroke();
    }
    
    ctx.beginPath();  
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.rect(0, 0, this.width, top);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = gridcolor;
    ctx.rect(0, 0, this.width, top);  
    ctx.fill();
    /*
    ctx.beginPath();  
    ctx.strokeStyle = fgcolor;
    ctx.lineWidth = lineWidth;
    ctx.moveTo(0, top+2);
    ctx.lineTo(this.width, top);
    ctx.stroke();
    */
    ctx.beginPath();  
    ctx.strokeStyle = fgcolor;
    ctx.lineWidth = 1;
    ctx.moveTo(cx-cross, cy);
    ctx.lineTo(cx+cross, cy);
    ctx.moveTo(cx, cy-cross);
    ctx.lineTo(cx, cy+cross);
    ctx.stroke();

    elation.canvas.text(ctx, label+': '+name, [2,2], null, (top/2)+'pt sans-serif');
    elation.canvas.text(ctx, 'x:'+x, [2,top+7], hfgcolor, ((top/2)-lineWidth)+'pt sans-serif','left');
    elation.canvas.text(ctx, 'y:'+y, [(this.width/2)-10,top+7], hfgcolor, ((top/2)-lineWidth)+'pt sans-serif','center');
    elation.canvas.text(ctx, 'z:'+z, [this.width-10,top+7], hfgcolor, ((top/2)-lineWidth)+'pt sans-serif','right');
    elation.canvas.text(ctx, dist+'m', [this.width-10,this.width-32], null, (top/2)+'pt sans-serif', 'right');
  }
  
  this.resize = function(event) {
    this.canvas.setAttribute('width', this.width);
    this.canvas.setAttribute('height', this.height);
    this.center = { x: (this.width / 2), y: (this.height / 2) };
    //this.container.style.width = this.cwidth + 'px';
    //this.container.style.height = this.cheight + 'px';
  }
  
  this.init();
});

elation.extend('ui.widgets.altimeter', function(hud) {
  this.hud = hud;
  this.range = 3500;
  this.width = 40;
  this.height = 200;
  
  this.init = function() {
    this.camera = this.hud.controller.camera;
    
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
    
    //this.hud.console.log('altimeter <strong>initialized</strong>.');
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
    this.camera = this.hud.controller.camera;
    this.container = elation.html.create({
      tag: 'div',
      classname: 'debug',
      append: document.body
    });
    
    //this.hud.console.log('debug <strong>initialized</strong>.');
  }
  
  this.format = function(pos) {
    if (pos && typeof pos.toFixed == 'function') {
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


/* Starbinger UI Widget */
elation.extend('ui.widgets.planetviewer', function(hud) {
  this.hud = hud;
  this.rotating = true;
  this.delta = 0;
  this.position = {x:0, y:0, z:0};
  
  this.init = function() {
    this.atlas = this.hud.atlas;
    this.buffer = elation.html.create({ tag: 'canvas' });
    this.ctx = this.buffer.getContext('2d');
    
    //var controls = new THREEx.ControlMapper();
    
    var container = elation.find('canvas');
    elation.events.add(container[0], 'planet,renderframe_end', this);
    var obj = {
      "move_left": function(ev) { this.position.x -= ev.value * 100; },
      "move_right": function(ev) { this.position.x += ev.value * 100; },
      "move_forward": function(ev) { this.position.z -= ev.value * 100; },
      "move_backward": function(ev) { this.position.z += ev.value * 100; },
      "move_up": function(ev) { this.position.y += ev.value * 100; },
      "move_down": function(ev) { this.position.y -= ev.value * 100; },
      "move": this.move,
      "wheel": this.mousewheel
    };
    elation.space.controls(0).addContext("atlas_planet", obj);
    /*
    elation.space.controls(0).addBindings("atlas_planet", {
      "keyboard_w": "move_forward",
      "keyboard_a": "move_left",
      "keyboard_s": "move_backward",
      "keyboard_d": "move_right",
      /*
      "mouse_drag_x": "move_left",
      "mouse_drag_y": "move_up"
      *//*
      "mousewheel": "wheel",
      "mouse_drag_delta": "move"
    });
    
    elation.space.controls(0).activateContext("atlas_planet", this);
    */
    elation.events.add(window, 'resize', this);
    //elation.events.add(container[0], 'click,mousedown,mousemove,mouseup,mouseout,mousewheel', this);
  }
  
  this.planet = function(event) {
    console.log('planetevent',event);
    this.planet = event.data.sphere;
    this.radius = event.data.radius;
    this.zoom = 10;
    this.zoominit = this.radius * 2.7;
    this.zoomstep = this.radius / 3.6;
    this.hud = elation.ui.hud;
    this.rotateX = 90;
    this.rotateY = 15;
    this.rotating = true;
    this.delta = 0;
    this.mouse = {x:0,y:0};
    this.viewport = this.hud.controller;
    this.viewport.camera.position.z = (this.zoom * this.zoomstep) + this.zoominit;
    this.zoom = 0;
    this.zoomchange = true;
    
    var canvas = this.buffer,
        ctx = this.ctx,
        width = 4096,
        height = 2048,
        center = { x: (width / 2), y: (height / 2) },
        viewport = this.viewport,
        lnColor = this.hud.color('atlas_planet_lines'),
        dw = width / 36,
        dh = height / 18;
        /*,
        lines = function(bool) {
          var max = bool ? 37 : 19;
          
          for (var i=1; i<max; i++) {
            var n = i * (bool?dw:dh),
                x = bool ? n : width,
                y = bool ? height : n;
            
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .9)";
            ctx.moveTo((bool?n:0),(bool?0:n));
            ctx.lineTo(x,y);
            ctx.stroke();
          }
        };*/
    
    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);
    
    /*
    lines(true);
    lines(false);
    */
    
    var texture = new THREE.Texture( canvas, THREE.UVMapping, THREE.NearestFilter, THREE.NearestFilter ),
        material = new THREE.MeshBasicMaterial({ transparent: true, map: texture, blending: THREE.AdditiveAlphaBlending });
    
    texture.needsUpdate = true;
    
    var sphere = this.sphere = event.data.sphere; //new THREE.Mesh(new THREE.SphereGeometry(this.radius,108,54), material);
        
    //this.sphere.position.x = 0;
    //viewport.scene.add(sphere);
    
    //elation.events.add(sphere, 'mousemove', this);
    
  }
  
  this.render = function() {
    if (this.rotating)
      this.rotateX += .015;
    
    if (this.zoomchange) {
      this.zoomchange = false;
      this.zoompos = (this.zoom * this.zoomstep) + this.zoominit;
    }
    
    if (this.zoompos) {
      var pos = this.viewport.camera.position.z,
          delta = pos - this.zoompos,
          npos = pos - (delta/10);
      
      if (Math.abs(delta) < 1)
        this.zoompos = false;
      
      this.viewport.camera.position.z = npos;
    }
    
    if (this.sphere) {
      var y = this.degree2radian(this.rotateX);
      
      if (this.sphere.rotation.y != y) {
        this.sphere.rotation.y = y
        this.planet.rotation.y = this.degree2radian(this.rotateX) - ((Math.PI/2) * 2);
      }
      if (this.rotateY) {
        this.sphere.rotation.x = this.degree2radian(this.rotateY);
        this.planet.rotation.x = this.degree2radian(this.rotateY);
      }
    }
  }
  
  this.handleEvent = function(event) {
    var type = event.type,
        replace = {
          'mouseout':'mouseup',
          'DOMMouseScroll':'mousewheel'
        };
    
    if (replace[type])
      type = replace[type];
    
    if (typeof this[type] == 'function')
      this[type](event);
    
    event.preventDefault();
  }
  
  this.mousedown = function(event) {
    var mouse = elation.events.coords(event);
    
    this.dragging = true;
    this.mouse = mouse;
    this.omouse = mouse;
  }
  
  this.mousemove = function(event) {
    return;
    
    var point = event.data.point,
        inv = new THREE.Matrix4().getInverse(this.sphere.matrixWorld),
        xform = new THREE.Vector3(point.x, point.y, point.z);
    
    inv.multiplyVector3(xform);
    
    var spherical = this.cartesian2spherical(xform),
        geographic = this.spherical2geographic(spherical),
        geographic = [ geographic[0], geographic[1] ],
        latdiv = elation.id('#atlas_info_lat'),
        lngdiv = elation.id('#atlas_info_lng');
    
    console.log('###',point, xform.x, xform.y, xform.z, spherical, geographic);
    
    latdiv.innerHTML = geographic[0].toFixed(4);
    lngdiv.innerHTML = geographic[1].toFixed(4);
  }
  
  this.move = function(event) {
    //console.log(event.type, this.dragging, event);
    
    //if (!this.dragging)
    //  return;
    
    var wdim = elation.html.dimensions(window),
        x = (wdim.w * event.value[0]) + (wdim.w / 2),
        y = (wdim.h * event.value[1]) + (wdim.h / 2),
        mouse = { x:x, y:y },
        deltaX = event.value[0],
        deltaY = event.value[1],
        degreesX = 100 * -deltaX,
        degreesY = 100 * -deltaY,
        maxtilt = 90;
    
    this.rotateX += degreesX;
    this.rotateY += degreesY;
    this.rotateY = this.rotateY > maxtilt ? maxtilt : this.rotateY < -maxtilt ? -maxtilt : this.rotateY;
    
    this.mouse = mouse;
    this.delta = deltaX;
    //var meh = elation.space.admin.obj.admin.projectMousePosition([mouse.x,mouse.y]);
    
    //console.log(meh);
  }
  
  this.mouseup = function(event) { 
    var mouse = elation.events.coords(event);
    
    this.dragging = false;
    
    if (this.omouse && mouse.x == this.omouse.x && mouse.y == this.omouse.y)
      this.savedot(mouse);
  }
  
  this.mousewheel = function(event) {
		var	event = event ? event : window.event,
        max = 5,
				mwdelta = event.value[0];
		
    if (mwdelta < 0)
      this.zoom++;
    else
      this.zoom--;
    
    this.zoom = this.zoom < -max ? -(max + -((this.zoom + max)/2)) : this.zoom > max ? max : this.zoom;
    
    this.zoomchange = true;
  }
  
  this.craters = function() {
    for (var i=0; i<this.dots.length; i++) {
      var geographic = this.dots[i],
          lnColor = this.hud.color('target_blip'),
          alpha = .6,
          y = (1 - ((parseFloat(geographic[0]) + 90) / 180)) * height,
          t = this.validateLNG(parseFloat(geographic[1]) + 180),
          x = ( (t<0?360+t:t) / 360) * width,
          size = geographic[2] * 6 || 4;
      
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.fillStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", "+(alpha/3)+")";
      ctx.arc(x,y,size,0,Math.PI*2,true);
      ctx.fill();
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", "+alpha+")";
      ctx.arc(x,y,size,0,Math.PI*2,true);
      ctx.stroke();
    }
  }
  
  this.cartesian2spherical = function(point) {
    var r = this.radius,
        x = point.x,
        y = point.y,
        z = point.z,
        
        rho = Math.sqrt(Math.pow(x,2) + Math.pow(z,2) + Math.pow(y,2)),
        phi = Math.atan2(y, Math.sqrt(Math.pow(x,2) + Math.pow(z,2))),
        theta = Math.atan2(z, x);
    
    return [rho, phi, theta]; 
  }
  
  this.spherical2cartesian = function(spherical) {
    var r = spherical[2] || 1, sin = Math.sin, cos = Math.cos,
        x = r * (cos(spherical[1]) * sin(spherical[0])),
        y = r * (sin(spherical[1]) * sin(spherical[0])),
        z = r * cos(spherical[0]);
    
    return [x, y, z];
  }
  
  this.spherical2geographic = function(spherical) {
    var dphi = this.radian2degree(spherical[1]),
        dtheta = this.radian2degree(spherical[2]),
        latlng = this.degrees2geographic(dphi, dtheta);
    
    return [latlng[0], latlng[1]];
  }
  
  this.degrees2geographic = function(dphi, dtheta) {
    var lat = dphi,
        lat = dtheta > 0 ? -lat : lat;
        lng = dtheta;
    
    return [lat, lng];
  }
  
  this.degree2radian = function(degree) {
    var radian = (degree * 2 * Math.PI) / 360;
    return radian;
  }
  
  this.radian2degree = function(radian) {
    var degree = radian * (180 / Math.PI);
    return degree;
  }
  
  this.validateLNG = function(lng) {
    var tmp = lng / 360;
    
    lng = (tmp - Math.floor(tmp)) * 360;
    lng = lng > 180 ? lng - 360 : lng; 
    
    return lng;
  }
  
  this.validateLAT = function(lat) {
    lat = lat > 90 
      ? 90 - (lat - 90)
      : lat < -90
        ? -90 - (lat + 90)
        : lat;
    
    return lat;
  }
  
  this.init();
});