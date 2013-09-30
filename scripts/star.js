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
        generated = g = this.get(args, 'properties.generated'),
        pos = this.pos = physical.position,
        radius = physical.radius * 2,
        lum = generated.lum,
        lum = lum > 15 ? 15 : lum,
        p = lum / 15,
        intensity_min = 2,
        intensity_max = 5.5
        lux = intensity_min + ((intensity_max - intensity_min) * p);
    
        r2 = radius;
    
    console.log('-!- Star: Generated type('+g.type+') color('+color+') lux('+lux.toFixed(5)+') mass('+g.mass+') temp('+g.temp+')');
    
    var lfn = function(x,y,z,l) {
      var light = new THREE.SpotLight(color, l, 0);
      light.position = {x:x,y:y,z:z};
      light.shadowCameraVisible = true;
      light.shadowDarkness = 0.90;
      light.castShadow = true;
      return light;
    }
    this.light = lfn(0,0,0,lux);
    this.add(this.light);
    /*
    var parameters = {
      map: THREE.ImageUtils.loadTexture('/~lazarus/elation/images/space/star2.jpg'),
      color: color,
      transparent: true, 
      depthTest: true,
      depthWrite: false,
      fog: false,
      blending: THREE.AdditiveAlphaBlending
    };
    
    //var geom = new THREE.SphereGeometry(r2 || 1000, 24, 24);
    var material = new THREE.MeshBasicMaterial(parameters),
        sphere = this.sphere = new THREE.Mesh(new THREE.SphereGeometry(r2,64,32),material);
    */
    //this.add(sphere);
    var texture = THREE.ImageUtils.loadTexture("/~lazarus/elation/images/space/lensflare0.png");
    var sprite = new THREE.Sprite({ 
      map: texture, 
      useScreenCoordinates: false, 
      blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: false,
      transparent: true,
      size: 1,
      color: this.color 
    });
    
    var r2 = r2 / 850;
    //console.log(radius, r2,r2/80000, pos);
    sprite.renderDepth = -1.1;
    sprite.depthWrite = -1.1;
    sprite.scale.set(r2,r2, r2);
    sprite.position.set(pos[0],pos[1],pos[2]);
    this.controller.scene.add(sprite);
    
    return;
				//var textureFlare0 = THREE.ImageUtils.loadTexture( "/~lazarus/elation/images/space/lensflare0.png" );
				//var textureFlare1 = THREE.ImageUtils.loadTexture( "/~lazarus/elation/images/space/sun_halo.png" );
				//var textureFlare2 = THREE.ImageUtils.loadTexture( "/~lazarus/elation/images/space/lensflare2.png" );
				var textureFlare3 = THREE.ImageUtils.loadTexture( "/~lazarus/elation/images/space/lensflare3.png" );

					var flareColor = new THREE.Color( 0xffffff );
					flareColor.copy( this.light.color );
					THREE.ColorUtils.adjustHSV( flareColor, 0, -0.8, 0.5 );
          
					var lensFlare = new THREE.LensFlare( textureFlare3, .5, 0.6, THREE.AdditiveBlending, flareColor );

					//lensFlare.add( textureFlare1, 0.8, 0.0, THREE.AdditiveBlending );
					//lensFlare.add( textureFlare2, 11.0, 0.0, THREE.AdditiveBlending );
					//lensFlare.add( textureFlare3, .3, 0.6, THREE.AdditiveBlending );
					lensFlare.add( textureFlare3, .4, 0.7, THREE.AdditiveBlending );
					lensFlare.add( textureFlare3, .8, 0.9, THREE.AdditiveBlending );
					lensFlare.add( textureFlare3, .3, 1.0, THREE.AdditiveBlending );

					lensFlare.customUpdateCallback = this.lensFlareUpdateCallback;
				   //lensFlare.position.set(0,0,0);
          //lensFlare.size = r2 / 50;

    lensFlare.position.set(pos[0],pos[1],pos[2]+1200000);
    this.controller.scene.add(lensFlare);
    
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
    var size = 80;
    var pos = this.pos;

    var camDistance = controller.camera.position.length();
    var player = controller.objects.player.Player;
    //var star_position = new THREE.Vector3(pos[0],pos[1],pos[2]);
    var player_position = player.position;
    var direction = player.dynamics.vel;
    
    //console.log(vecX, vecY, object);
    for( f = 0; f < fl; f++ ) {
      flare = object.lensFlares[ f ];

      flare.x = object.positionScreen.x + vecX * flare.distance;
      flare.y = object.positionScreen.y + vecY * flare.distance;

      flare.scale = size;
      flare.wantedRotation = flare.x * Math.PI * 0.05;
      flare.rotation += ( flare.wantedRotation - flare.rotation ) * 0.25;
    }
    
  }
      
  this.init();
});
function is_in_front(camera_position, target_position, camera_direction) {
    var product = (target_position.x - camera_position.x) * camera_direction.x
                     + (target_position.y - camera_position.y) * camera_direction.y
                     + (target_position.z - camera_position.z) * camera_direction.z;
    
    return (product > 0.0);
}
elation.space.meshes.star.prototype = new elation.space.thing()
//elation.space.meshes.star.prototype.constructor = elation.space.meshes.star;

