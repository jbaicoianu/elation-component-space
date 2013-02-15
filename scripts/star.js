elation.extend("space.meshes.star", function(args, controller) {
  elation.space.thing.call( this, args);
  this.args = args;
  this.controller = controller;
  var r2;
  this.expose = [
    'args.properties.generated'
  ];
  
  this.postinit = function() {
  }
  
  this.createGeometry = function() {
    var color = elation.utils.arrayget(this.args, 'properties.render.color') || '0xFFFFFF',
        physical = this.get(args, 'properties.physical'),
        pos = physical.position,
        radius = physical.radius * 2,
        lum = args.properties.generated.lum,
        lum = lum > 15 ? 15 : lum,
        p = lum / 15,
        intensity_min = 2,
        intensity_max = 5.5
        lux = intensity_min + ((intensity_max - intensity_min) * p);
    
        r2 = radius;
    //console.log('### STAR GENERATED',color,this, args);
    var lfn = function(x,y,z,l) {
      var light = new THREE.SpotLight(color, l, 0);
      light.position = {x:x,y:y,z:z};
      light.shadowCameraVisible = true;
      light.shadowDarkness = 0.90;
      light.castShadow = true;
      console.log('!!! STARLIGHT LUX:',l, lum, p);
      return light;
    }
    this.light = lfn(0,0,0,lux);
    this.add(this.light);
    var parameters = {
      map: THREE.ImageUtils.loadTexture('/~lazarus/elation/images/space/star2.jpg'),
      color: color,
      /*
      specular: 0x111111,
      ambient: 0x222222,
      shininess: .1,
      specular: 0x333333,
      normalScale: 0.5,
      */
      
      blending: THREE.AdditiveAlphaBlending
    };
    
    //var geom = new THREE.SphereGeometry(r2 || 1000, 24, 24);
    var material = new THREE.MeshBasicMaterial(parameters),
        sphere = this.sphere = new THREE.Mesh(new THREE.SphereGeometry(r2,64,32),material);
    
    this.add(sphere);

				var textureFlare0 = THREE.ImageUtils.loadTexture( "/~lazarus/elation/images/space/lensflare0.png" );
				var textureFlare1 = THREE.ImageUtils.loadTexture( "/~lazarus/elation/images/space/sun_halo.png" );
				var textureFlare2 = THREE.ImageUtils.loadTexture( "/~lazarus/elation/images/space/lensflare2.png" );
				var textureFlare3 = THREE.ImageUtils.loadTexture( "/~lazarus/elation/images/space/lensflare3.png" );

					var flareColor = new THREE.Color( 0xffffff );
					flareColor.copy( this.light.color );
					THREE.ColorUtils.adjustHSV( flareColor, 0, -0.8, 0.5 );
          
					var lensFlare = new THREE.LensFlare( textureFlare0, 6, 0.0, THREE.AdditiveBlending, flareColor );

					lensFlare.add( textureFlare1, 0.8, 0.0, THREE.AdditiveBlending );
					lensFlare.add( textureFlare2, 7.0, 0.0, THREE.AdditiveBlending );
					lensFlare.add( textureFlare3, .3, 0.6, THREE.AdditiveBlending );
					lensFlare.add( textureFlare3, .4, 0.7, THREE.AdditiveBlending );
					lensFlare.add( textureFlare3, .8, 0.9, THREE.AdditiveBlending );
					lensFlare.add( textureFlare3, .3, 1.0, THREE.AdditiveBlending );

					lensFlare.customUpdateCallback = this.lensFlareUpdateCallback;
					lensFlare.position.set(pos[0],pos[1],pos[2]);
          //lensFlare.size = r2 / 50;

					this.add( lensFlare );
/*
    var gyro=new THREE.Gyroscope();
    this.add(gyro);
    this.gyro=gyro;*/
    //this.createMesh(geom, new THREE.MeshBasicMaterial(parameters));
  }
  
  this.lensFlareUpdateCallback = function( object ) {
    var f, fl = object.lensFlares.length;
    var flare;
    var vecX = -object.positionScreen.x * 2;
    var vecY = -object.positionScreen.y * 2;
    var size = r2/2;

    var camDistance = controller.camera.position.length();
    
    for( f = 0; f < fl; f ++ ) {
      flare = object.lensFlares[ f ];

      flare.x = object.positionScreen.x + vecX * flare.distance;
      flare.y = object.positionScreen.y + vecY * flare.distance;

      flare.scale = size / camDistance;
      flare.wantedRotation = flare.x * Math.PI * 0.05;
      flare.rotation += ( flare.wantedRotation - flare.rotation ) * 0.25;
    }
    
  }
      
  this.init();
});
elation.space.meshes.star.prototype = new elation.space.thing()
//elation.space.meshes.star.prototype.constructor = elation.space.meshes.star;

