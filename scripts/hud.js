elation.extend('ui.hud', new function() {
  this.widgets = [
    'debug', 
    //'console', 
    /*
    'atlas',
    'atlas_planet',
    'atlas_controls'
    */
    //'atlas_planet_2d'
    /*
    'overlay',
    'rotacol', 
    'radar', 
    'aeronautics',
    'targeting'
    */
  ];
  this.ticks = 0;
  
  this.timings = {
    atlas: 0,
    atlas_planet: 1,
    atlas_planet_2d: 1,
    atlas_controls: 0,
    overlay: 0,
    rotacol: 50,
    radar: 1,
    altimeter: 4,
    console: 0,
    aeronautics: 1,
    target: 1,
    targeting: 1,
    debug: 0
  };
  
  this.colors = {
    background: '#000000',
    lines: '#7b9cab',
    target_blip: '#8affac',
    target_outline: '#7b9cab',
    target_arrow: '#8affac',
    target_box: '#aa0000',
    target_ring: '#FF0000',
    //target_ring: '#8affac',
    target_hilight: '#CDE472',
    atlas_planet_lines: '#bb2222',
    radar_sweeper: '#FD5252'
  };
  
  this.init = function(widgets, controller) {
    this.controller = elation.space.controller;
    
    if (widgets && typeof widgets == 'object')
      this.widgets = widgets;
    
    for (var i=0; i<this.widgets.length; i++) {
      var widget = this.widgets[i];
      
      console.log(widget);
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
    e.ticks = this.ticks;
    
    for (var i=0; i<this.widgets.length; i++) {
      var widget = this.widgets[i],
          timing = this.timings[widget];
      
      e.ticks = this.ticks;
      if (timing !== 0 && this.ticks % (timing || 2) == 0) {
        this[widget].render(e);
      }
    }
  }
  
  this.container = function(classname, canvas, NoDOM) {
    var container = elation.html.create({
      tag: canvas ? 'canvas' : 'div',
      classname: classname,
    });
    
    if (!NoDOM)
      document.body.appendChild(container);
    
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
  
  this.color = function(type) {
    return hex2rgb(this.colors[type]);
  }
});

elation.extend('ui.widgets.rearview', function(hud) {
  this.hud = hud;
  this.colors = this.hud.colors;
  
  this.init = function() { return;
    this.controller = this.hud.controller;
    this.container = this.hud.container('rearview rearview_display');
    this.windowsize = this.controller.viewsize;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.viewsize = [ this.width, this.height ];
    this.scene = this.controller.scene;
    
    this.initRenderer();
    this.camera1 = new THREE.PerspectiveCamera(50, this.viewsize[0] / this.viewsize[1], 10, 1.5e15);
    this.scene.add( this.camera1 );
    
    elation.events.add(null, 'renderframe_end', this);
  }
  
  this.initRenderer = function() {
    //this.renderTarget = new THREE.WebGLRenderTarget( this.width, this.height, { format: THREE.RGBFormat } );
    this.renderer1 = new THREE.WebGLRenderer({antialias: true});
    this.renderer1.setSize(this.viewsize[0], this.viewsize[1]);
    this.container.appendChild(this.renderer1.domElement);
    //this.renderer.shadowMapEnabled = true;
    //this.renderer.shadowMapSoft = true;

    this.renderer1.autoClear = false;
  }
  
  this.render = function() { return; }
  
  this.renderframe_end = function(event) {
    //this.windowsize = this.controller.newsize;
    //this.viewsize = [ (this.windowsize[0] / 4), (this.windowsize[1] / 4) ];

    var ship = this.controller.objects.spaceship.Elemental;
    this.camera1.rotation = ship.matrixRotationWorld.multiplyVector3( new THREE.Vector3(0,Math.PI,0) ).addSelf(ship.rotation);
    this.camera1.position = this.controller.camera.position;

    this.camera1.updateProjectionMatrix();
    this.renderer1.setViewport(1, 1, this.width - 2, this.height - 2);
    this.renderer1.render( this.scene, this.camera1 );
  }
  
  this.handleEvent = function(event) {
    if (typeof this[event.type] == 'function')
      this[event.type](event);
  }
  
  this.init();
});

elation.extend('ui.widgets.overlay', function(hud) {
  this.hud = hud;
  this.colors = this.hud.colors;
  this.fns = [];
  
  this.init = function() {
    this.container = this.hud.container('static_overlay', true);
    this.ctx = this.container.getContext('2d');
    
    this.resize();
    
    elation.events.add(window, 'resize', this);

    this.hud.console.log('static overlay:  <strong>initialized</strong>');
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

elation.extend('ui.widgets.aeronautics', function(hud) {
  this.hud = hud;
  this.colors = this.hud.colors;
  this.opos = [0,50,0];
  this.radius = 150;
  
  this.init = function() {
    this.camera = this.hud.controller.camera;
    this.container = this.hud.container('aeronautics', true);
    this.ctx = this.container.getContext('2d');

    this.resize();
    elation.events.add(window, 'resize', this);
    
    this.hud.console.log('aeronautics system:  <strong>initialized</strong>');
  }
  
  this.resize = function(event) {
    var wdim = elation.html.dimensions(window),
        cdim = elation.html.dimensions(this.container);
    
    this.width = this.radius * 2;
    this.height = this.radius * 2;
    this.container.setAttribute('width', this.width);
    this.container.setAttribute('height', this.height);
    this.container.style.top = (wdim.h/2) - this.radius + 'px';
    this.container.style.left = (wdim.w/2) - this.radius + 'px';
    this.center = { x: this.radius, y: this.radius };
  }
  
  this.render = function(event) {
    this.cpos = this.camera.position;
    var campos = this.camera.matrix.decompose();
    this.angle = elation.utils.quat2euler(campos[1]);
    //this.angle = this.hud.radar.angle;
    
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
    //console.log(speed);
    this.fps = fps;
    //0x5b7c8b
    var txtColor = [123,156,171];
    var player = this.hud.controller.objects.player.Player;
    if (player.burner_on && player.fuel > 0) txtColor = [200,200,0];
    if (player.booster_on && player.fuel > 0) txtColor = [200,0,200];
    
      
    
    this.ctx.fillStyle = "rgba("+txtColor[0]+", "+txtColor[1]+", "+txtColor[2]+", 1)";
    this.ctx.font = '18px Arial bold';
    this.ctx.textBaseline = 'bottom';
    this.ctx.fillText('v'+Math.round(this.speed), 1, 20);
    this.ctx.stroke();
    this.ctx.fillStyle = "rgba("+txtColor[0]+", "+txtColor[1]+", "+txtColor[2]+", 1)";
    this.ctx.font = '12px Arial bold';
    this.ctx.textBaseline = 'bottom';
    this.ctx.fillText('T:'+Math.round(player.throttle * 100)+'%', 1, 35);
    this.ctx.stroke();
    this.ctx.fillStyle = "rgba("+txtColor[0]+", "+txtColor[1]+", "+txtColor[2]+", 1)";
    this.ctx.font = '12px Arial bold';
    this.ctx.textBaseline = 'bottom';
    this.ctx.fillText('F:'+Math.round(player.fuel * 100)+'%', 1, 50);
    this.ctx.stroke();
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
    ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", 1)";
    ctx.arc(cx,cy,6,0,Math.PI*2,true);
    ctx.moveTo(cx+6,cy);
    ctx.lineTo(cx+6+12,cy);
    ctx.moveTo(cx-6,cy);
    ctx.lineTo(cx-6-12,cy);
    ctx.moveTo(cx,cy-6);
    ctx.lineTo(cx,cy-6-6);
    ctx.stroke();
  }
  
  this.setPitch = function(event, cpos, opos) { return;
    var ctx = this.ctx,
        angle = this.angle,
        yaw = angle[0],
        pitch = angle[1],
        bank = angle[2],
        r = 60,
        degrees = pitch * 180 / Math.PI,
        dim = elation.html.dimensions(window),
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
          
          ctx.fillStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", 1)";
          ctx.font = '12pt impact';
          
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
    ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", 1)";
    
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
  }

  this.handleEvent = function(event) {
    if (typeof this[event.type] == 'function')
      this[event.type](event);
  }
  
  this.init();
});

elation.extend('canvas.circle', function(ctx, x, y, s, c, a, f, s, e) {
  var a = a || 1,
      s = s || 1,
      c = c || [ 150, 150, 150 ],
      f = f || 'fill',
      s = s || 0;
      e = e || Math.PI*2;
      
  ctx.beginPath();
  ctx[f + 'Style'] = "rgba("+c[0]+", "+c[1]+", "+c[2]+", "+ a +")";
  ctx.arc(x,y,s,s,e);
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

elation.extend('canvas.text', function(ctx, text, pos, color, font, alignment) {
  var text = text || 'undefined',
      color = color || "rgba(180,180,180,1)",
      font = font || '12pt impact',
      pos = pos || [0,0],
      alignment = alignment || 'left';
    
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textBaseline = 'top';
  ctx.textAlign = alignment;
  ctx.fillText(text, pos[0], pos[1]);
});

elation.extend('ui.hud.tabs', function(name, container, args) {
  this.name = name;
  this.container = container;
  this.args = args;
  
  this.init = function() {
    this.menu = elation.html.create({ tag: 'ul', classname: 'ui_widget_menu', append: this.container });
    this.content = elation.html.create({ tag: 'ul', classname: 'ui_widget_content', append: this.container });
    
    for (var i=0,tab,contents={},tabs={}; i<this.args.tabs.length; i++) {
      tab = this.args.tabs[i];
      
      tabs[tab.name] = elation.html.create({ 
        tag: 'li', 
        id: 'ui_widget_menu_'+tab.name, 
        append: this.menu,
        attributes: {
          innerHTML: tab.label,
          title: tab.tooltip
        }
      });
      
      contents[tab.name] = elation.html.create({ tag: 'li', classname: 'ui_widget_content_'+tab.name, append: this.content });
    }
    
    this.tabs = tabs;
    this.contents = contents;
    
    elation.events.add(this.menu, 'click', this);
    
    this.click({ target: this.tabs[this.args.tabs[0].name] });
  }
  
  this.click = function(event) {
    var target = event.target;
    
    if (target.tagName != 'LI')
      return;
    
    if (this.selected) {
      elation.html.removeclass(this.selected_content, 'selected');
      elation.html.removeclass(this.selected, 'selected');
    }
    var name = target.id.replace('ui_widget_menu_',''),
        content = this.contents[name];
    
    elation.html.addclass(content, 'selected');
    elation.html.addclass(target, 'selected');
    
    
    this.selected_content = content;
    this.selected = target;
  }
  
  this.handleEvent = function(event) {
    this[event.type](event);
  }
  
  this.init();
});

elation.extend('ui.hud.widget', function(name, parent, args) {
  this.name = name;
  this.parent = parent;
  this.args = args;
  this.hud = parent.hud;
  
  this.init = function() {
    this.container = this.hud.container('ui_widget '+this.name);
    this.label = elation.html.create({
      tag: 'div',
      classname: 'ui_widget_label',
      append: this.container,
      attributes: {
        innerHTML: this.args.label
      }
    });
  }
  
  this.handleEvent = function(event) {
    this[event.type](event);
  }
  
  this.init();
});

elation.extend('ui.widgets.target', function(hud) {
  this.hud = hud;
  
  this.init = function() {
    this.window = new elation.ui.hud.widget('target', this, {
      label: 'TARGETING',
      label_align: 'top_left'
    });
    
    this.container = this.window.container;
    
    /*
    this.tabs = new elation.ui.hud.tabs('target', this.window.container, {
      tabs: [{
        label: 'List',
        name: 'target_list',
        tooltip: 'View the Target List'
      },{
        label: 'Settings',
        name: 'target_settings',
        tooltip: 'Configure targeting and radar options'
      }]
    });
    */
    
    this.list = new elation.ui.widgets.target_list('target_list', this.container, this);
    //this.settings = new elation.ui.widgets.target_detail('target_settings', this.tabs.contents['target_settings'], this);
  }
  
  this.render = function(event) {
    //this.detail.render();
    this.list.render(event);
  }
  
  this.init();
});

elation.extend('ui.widgets.target_list', function(name, container, parent) {
  this.parent = parent;
  this.container = container;
  this.hud = parent.hud;
  this.lis = [];
  this.data = [];
  
  this.init = function() {
    this.radar = elation.ui.hud.radar;
    this.div = elation.html.create({ tag: 'div', classname: 'target_list_container', append: this.container });
    this.ul = elation.html.create({ tag: 'ul', classname: 'target_list_ul', append: this.div });
    this.exclude = { 'roid': 1, 'player': 1 };
    
    elation.events.add(this.ul, 'click', this);
  }
  
  this.handleEvent = function(event) {
    this[event.type](event);
  }
  
  this.distanceFormat = function(str) {
    return (''+Math.round(str)).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
  }
  
  this.createLI = function(ul) { 
    var li = elation.html.create({ 
      tag: 'li', 
      classname: 'target_list_item', 
      append: ul,
      attributes: {
        innerHTML: '<div class="target_list_item_container"><li></li>'+
                   '<strong>Scanning...</strong> <span class="type"></span>'+
                   '<p></p></div>'
                   //'</div>'
      }
    });
    
    return li
  };
  
  this.render = function(event) {
    var tl = elation.ui.hud.radar3d.visible;
    var list = [];
    var exclude = this.exclude;
    
    if (!tl)
      return;
    
    var fullupdate = (event && event.ticks % 60 == 0);
    
    // build a list after radar filtering
    for (var i=0,li; i<tl.length; i++) {
      if (tl[i].type != undefined && !exclude[tl[i].type])
        list.push(tl[i]);
    }
    
    var delta = this.lis.length - list.length;
    
    //if (delta != 0) console.log('delta',delta);
    
    if (delta > 0) {
      for (var i=this.lis.length-1; i>this.lis.length - 1 - delta; i--) {
        try { this.ul.removeChild(this.lis[i]); }
        catch(e) { }
      }
      this.data = [];
      this.lis = this.ul.children;
      for (var i=0,tmp=[]; i<this.lis.length; i++)
        tmp[i] = this.lis[i]
      this.lis = tmp;
    } else if (delta < 0) {
      this.data = [];
      for (var i=delta; i<0; i++) {
        list.push();
        this.lis.push(this.createLI(this.ul));
      }
    }
    
    var top = this.div.scrollTop,
        height = this.div.offsetHeight,
        itemtop, itemheight, inc = 0;
    
    list.sort(function(a, b) { return a.distance - b.distance; });
    
    var current = this.current_target_data;
    if (!current) {
      this.nextTarget();
    }
    
    for (var i=0,li; i<list.length; i++) {
      item = list[i];
      li = this.lis[i];
      
      if (!li || !li.parentNode) {
        console.log('no parent',li,item);
        continue;
      }
      // turns out this has no affect at all.  must be an internal browser optimization
      //itemtop = li.offsetTop;
      //itemheight = itemheight || li.offsetHeight;
      //if (itemtop + itemheight < top || itemtop > top + height) continue;
      
      inc++;
      div = li.children[0];
      dot = div.children[0];
      strong = div.children[1];
      span = div.children[2];
      p = div.children[3];
      d = this.data[i] || {name:'Unidentified',type:'unknown',distance:'-1',istarget:false};
      
      istarget = (current && current == item);
      
      if (istarget)
        elation.html.addclass(li, 'target');
      else if (d.istarget)
        elation.html.removeclass(li, 'target');
      
      if (fullupdate) {
      //if (d.name != item.name)
        strong.innerHTML = item.name;
      
      //if (d.type != item.type) {
        span.innerHTML = '('+item.type+')';
        dot.className = 'target_type_'+item.type;
      //}
      
      //if (Math.round(d.distance) != Math.round(item.distance)) {
        p.innerHTML = this.distanceFormat(item.distance);
      //}
      }
      
      this.data[i] = {name:item.name,type:item.type,distance:item.distance,istarget:istarget};
    }
    
    this.visible_list = list;
    //console.log('rendered:',this.lis.length,this.data.length,list.length, this.lis, this.data, list);
  }
  
  this.click = function(event) {
    var target = event.target,
        target = elation.html.hasclass(target, 'target_list_item') ? target : elation.utils.getParent(target, 'li', 'target_list_item');
    
    if (target)
      this.switchTo(target);
  }
  
  this.prevTarget = function() { 
    this.switchTarget(1);
  }

  this.nextTarget = function() { 
    this.switchTarget(-1);
  }
  
  this.switchTo = function(target) {
    var contacts = this.visible_list,
        contact, ret;
    
    for (var i=0; i<contacts.length; i++) {
      contact = contacts[i];
      
      if (target == this.lis[i]) {
        ret = contact;
      } else
        contact.target = false;
    }
    
    //console.log('switchTo',target, contact, i);
    
    this.current_target_data = ret;
    this.current_target = target;
    this.render();
  }
  
  this.switchTarget = function(n) { 
    var contacts = this.visible_list,
        contact, target;
    
    if (!contacts || contacts.length == 0)
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
    
    if (false && target.type) {
      this.hud.target.label = target.type;
      this.hud.target.name = target.thing.args.name;
    }
    
    var rot = target.rotation,
        pos = target.position,
        scale = target.scale || [ 0, 0, 0 ];
    
    //this.hud.ops.drawRotation(target,pos,rot);
    
    this.current_target_data = target;
    target.target = true;
    li = this.lis[t];
    
    if (li) {
      this.current_target = li;
      this.render();
      
      var top = this.div.scrollTop,
          height = this.div.offsetHeight,  
          itemtop = li.offsetTop,
          itemheight = li.offsetHeight;
        
      console.log('switchTo',top,height,itemtop,itemheight);
      if (itemtop + itemheight < top)
        li.scrollIntoView(true);
      else if (itemtop > top + height)
        li.scrollIntoView(false);
    }
    
    console.log('CURRENT TARGET', li);
  }
  
  this.init();
});

elation.extend('ui.widgets.ops', function(hud) {
  this.hud = hud;
  this.colors = hud.colors;
  this.width = 400;
  this.height = 400;
  
  this.init = function() {
    this.camera = this.hud.controller.camera;
    this.div = this.hud.container('ui_widget status');
    this.label = elation.html.create({
      tag: 'div',
      classname: 'ui_widget_label',
      append: this.div,
      attributes: {
        innerHTML: 'OPERATIONS'
      }
    });
    this.container = this.hud.container('ship_status', true, true);
    this.div.appendChild(this.container);
    this.ctx = this.container.getContext('2d');
    
    this.resize();

    this.hud.console.log('operations display subsystem:  <strong>initialized</strong>');
  }

  this.drawRotation = function(target, position, angle) {
    var c = this.hud.color('lines'),
        bg = this.hud.color('target_box'),
        fg = this.hud.color('target_blip'),
        pad = this.width / 24,
        campos = this.camera.matrix.decompose(),
        cangle = elation.utils.quat2euler(campos[1]),
        angle = { x: cangle[0] - (Math.PI/2), y: cangle[1] + (Math.PI/2), z: cangle[2] + Math.PI },
        rot = [angle.x,angle.y,angle.z],
        r = this.width / 10,
        p = [[pad+r,r+pad],[(pad*2)+(r*3),r+pad],[(pad*3)+(r*5),r+pad],[(pad*4)+(r*7),r+pad]],
        s = 1.5 * Math.PI,
        a = .2,
        l = 50,
        sin = Math.sin, cos = Math.cos,
        pos = [ sin(angle.y)*cos(angle.x), sin(angle.y)*sin(angle.x), cos(angle.y) ],
        proj = new THREE.Projector(),
        pos2 = proj.projectVector({x:pos[0],y:pos[1],z:pos[2]}, this.camera),
        cx = this.width/2,
        cy = this.height/2;
    
    //this.ctx.beginPath();  
    //this.ctx.fillStyle = "rgba(0,0,0,1)";
    //this.ctx.rect(0,0,this.width,this.height);  
    //this.ctx.fill();
    this.container.width = this.container.width;
    
    for (var i=0; i<p.length; i++) {
      var e = rot[i] + s,
          t = p[i],
          x = t[0],
          y = t[1],
          x2 = x - (pos[0]),
          y2 = y + (pos[1]);
      
      this.ctx.beginPath();
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = "rgba("+fg[0]+", "+fg[1]+", "+fg[2]+", 1)";
      this.ctx.arc(x,y,r,s,e);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.fillStyle = "rgba("+fg[0]+", "+fg[1]+", "+fg[2]+", .3)";
      this.ctx.moveTo(x,y);
      this.ctx.lineTo(x,y-r);
      this.ctx.arc(x,y,r,s,e);
      this.ctx.lineTo(x,y);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.strokeStyle = "rgba("+c[0]+", "+c[1]+", "+c[2]+", .6)";
      this.ctx.arc(x,y,r,0,Math.PI*2);
      this.ctx.stroke();
    }
    
    var x = cx,
        r = this.width / 4,
        y = (cy * 2) - r - pad,
        x2 = x - (pos[0] * r),
        y2 = y + (pos[1] * r),
        s = r;
        //bx = r*xax + cx,
        //by = r*zaz + cy;
    
    this.ctx.beginPath();
    this.ctx.strokeStyle = "rgba("+fg[0]+", "+fg[1]+", "+fg[2]+", 1)";
    this.ctx.moveTo(x,y);
    this.ctx.lineTo(x2,y2);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.fillStyle = "rgba("+bg[0]+", "+bg[1]+", "+bg[2]+", "+a+")";
    this.ctx.arc(x,y,r,0,Math.PI*2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = "rgba("+c[0]+", "+c[1]+", "+c[2]+", .6)";
    this.ctx.arc(x,y,r,0,Math.PI*2);
    this.ctx.stroke();
    
    var player = this.hud.controller.objects.player.Player,
        width = this.width / 7,
        height = r * 2,
        x = pad;
        h = (height * player.throttle),
        dh = this.height - height - pad,
        t = dh - h + height;
    
    this.ctx.beginPath();
    this.ctx.strokeStyle = "rgba("+c[0]+", "+c[1]+", "+c[2]+", .6)";
    this.ctx.rect(x,dh-2,width,height+4);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.fillStyle = "rgba(0,200,0,.6)";
    this.ctx.rect(x+2,t,width-4,h);
    this.ctx.fill();
   
    var h = (height * player.fuel),
        x = this.width - pad - width;
        t = dh - h + height;
    
    this.ctx.beginPath();
    this.ctx.strokeStyle = "rgba("+c[0]+", "+c[1]+", "+c[2]+", .6)";
    this.ctx.rect(x,dh-2,width,height+4);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.fillStyle = "rgba(200,200,0,.6)";
    this.ctx.rect(x+2,t,width-4,h);
    this.ctx.fill();
  }
  
  this.resize = function(event) {
    this.center = { x: (this.width / 2), y: (this.height / 2) };
    this.container.setAttribute('width', this.width);
    this.container.setAttribute('height', this.height);
    //this.container.style.width = this.cwidth + 'px';
    //this.container.style.height = this.cheight + 'px';
  }
  
  this.render = function(event) {

  }
    
  this.init();
});

elation.extend('ui.widgets.targeting', function(hud) {
  this.hud = hud;
  this.range = 3500;
  this.width = 500;
  this.height = 500;
  this.colors = hud.colors;
  this.opos = { x:0, y:0, z:0 };

  this.init = function() {
    this.camera = this.hud.controller.camera;
    
    this.container = this.hud.container('target_info');
    
    this.canvas_bg = elation.html.create({
      tag: 'canvas',
      classname: 'target_canvas',
      append: this.container
    });

    this.canvas_hud = elation.html.create({
      tag: 'canvas',
      classname: 'targeting',
      append: document.body
    });
    
    this.ctx = this.canvas_bg.getContext('2d');
    this.canvas_hud_ctx = this.canvas_hud.getContext('2d');

    this.targetring();
    
    this.width = 200;
    this.height = 170;
    this.canvas_bg.setAttribute('width', this.width);
    this.canvas_bg.setAttribute('height', this.height);
    
    this.resize();
    elation.events.add(window, 'resize', this);
    
    this.hud.console.log('targeting system:  <strong>initialized</strong>');
  }
  
  this.handleEvent = function(event) {
    if (typeof this[event.type] == 'function')
      this[event.type](event);
  }
  
  this.resize = function(event) {
    var wdim = elation.html.dimensions(window);
    this.canvas_hud_width = wdim.w;
    this.canvas_hud_height = wdim.h;
    this.canvas_hud.setAttribute('width', this.canvas_hud_width);
    this.canvas_hud.setAttribute('height', this.canvas_hud_height);
    this.canvas_hud_center = { x: (wdim.w / 2), y: (wdim.h / 2) };
    this.canvas_hud.style.width = wdim.w + 'px';
    this.canvas_hud.style.height = wdim.h + 'px';
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
    
    if (!this.hud.overlay)
      return;
    
    this.hud.overlay.draw((function(ctx, cx, cy) {
      ctx.beginPath();
      ctx.fillStyle = "rgba(180,180,180,.1)";
      ctx.arc(cx,cy,30,0,Math.PI*2,true);
      ctx.fill();  
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", .5)";
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
  
  this.render = function(event) {
    var ver = function(angle) {
      return (angle > (Math.PI/2) && angle < (Math.PI/2));
    };
    
    var dim = elation.html.dimensions(window),
        ctx = this.canvas_hud_ctx,
        hud = this.hud, 
        blipColor = hud.color('target_blip'),
        lnColor = hud.color('radar_sweeper'),
        tgColor = hud.color('radar_sweeper'),
        campos = this.camera.matrix.decompose(),
        angle = elation.utils.quat2euler(campos[1]),
        //angle = hud.radar.angle,
        heading = angle[0],
        contact = hud.target.list.current_target_data;
    
    //console.log(campos, angle, heading, contact);
    if (!contact || contact.type == 'player')
      return;
    
    var bpos = contact.position,
        cpos = this.camera.position,
        t = ver(heading),
        r = 115,
        tbr = 15,
        tbd = 8,
        cx = this.canvas_hud_center.x,
        cy = this.canvas_hud_center.y,
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
          n: contact.type,
          x: (dim.w/2) * s.x,
          y: (dim.h/2) * s.y,
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
      x:x,// < tbr ? tbr : x > dim.w-tbr ? dim.w-tbr : x, 
      y:y// < tbr ? tbr : y > dim.h-tbr ? dim.h-tbr : y
    };
    
    if (t || Math.pow((q.x), 2) + Math.pow((q.y), 2) > Math.pow(r,2)) {
      an = Math.atan2(cx*s.x, cy*s.y);
      rot = elation.transform.rotate(0, r, an);
      rot2 = elation.transform.rotate(0, r-tbr, an);
    }
    
    this.canvas_hud.width = this.canvas_hud_width;
    
    if (!t) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba("+tgColor[0]+", "+tgColor[1]+", "+tgColor[2]+", 1)";
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
      /*
      ctx.fillStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", 1)";
      ctx.font = '12px sans-serif bold';
      var dist = 'D:' + dist,
          metrics = ctx.measureText(dist);  

      ctx.textBaseline = 'bottom';
      ctx.fillText(dist, coords.x-(metrics.width/2), coords.y+tbr+15);
      */
    }
    
    if (an) {
      ctx.beginPath();
      ctx.fillStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", 1)";
      ctx.arc(cx-rot.x,cy-rot.y,4,0,Math.PI*2,true);
      ctx.fill();
      ctx.beginPath();
      ctx.strokeStyle = "rgba("+lnColor[0]+", "+lnColor[1]+", "+lnColor[2]+", 1)";
      ctx.moveTo(cx-rot.x,cy-rot.y);
      ctx.lineTo(cx-rot2.x,cy-rot2.y);
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
    this.camera = this.hud.controller.camera;
    this.container = elation.html.create({
      tag: 'div',
      classname: 'ui_widget rotacol',
      append: document.body
    });
    
    this.hud.console.log('rotacol subsystem:  <strong>initialized</strong>');
  }
  
  this.format = function(pos) {
    return Math.round(pos);
  }
  
  this.render = function(pos) {
    var pos = this.camera.position;
    this.container.innerHTML = 'x:<strong>' + this.format(pos.x) + '</strong> y:<strong>' + this.format(pos.y) + '</strong> z:<strong>' + this.format(pos.z) + '</strong>';
  }
  
  this.init();
});

elation.extend('ui.widgets.console', function(hud) {
  this.hud = hud;
  this.height = 150;
  
  this.init = function() {
    this.camera = this.hud.controller.camera;
    this.container = elation.html.create({
      tag: 'div',
      classname: 'ui_widget console',
      append: document.body
    });
    this.label = elation.html.create({
      tag: 'div',
      classname: 'ui_widget_label',
      append: this.container,
      attributes: {
        innerHTML: 'COMMS'
      }
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
    
    this.resize();
    
    elation.events.add(window, 'resize', this);
    //this.log('console <strong>initialized</strong>.');
  }
  
  this.handleEvent = function(event) {
    if (typeof this[event.type] == 'function')
      this[event.type](event);
  }
  
  this.resize = function(event) {
    var wdim = elation.html.dimensions(window),
        w = wdim.w / 2.5,
        h = wdim.h / 5,
        x = (wdim.w / 2) - (w / 2),
        y = 10;
    
    this.center = { x: (this.width / 2), y: (this.height / 2) };
    this.container.style.left = x + 'px';
    this.container.style.top = y + 'px';
    //this.container.style.height = h + 'px';
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

