{set var="page.title"}Stella Imperia{/set}

<script type="x-shader/x-fragment" id="imagemixer_fragment">
  #ifdef GL_ES
  precision highp float;
  #endif

  uniform sampler2D tOne;
  uniform sampler2D tSec;

  varying vec2 vUv;

  void main(void) {
    vec3 c;
    vec4 Ca = texture2D(tOne, vUv);
    vec4 Cb = texture2D(tSec, vUv);
    c = Ca.rgb * Ca.a + Cb.rgb * Cb.a * (1.0 - Ca.a);  // blending equation
    gl_FragColor = vec4(c, 1.0);
  }
</script>

<script type="x-shader/x-vertex" id="imagemixer_vertex">
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_Position = projectionMatrix * mvPosition;
  }
</script>

<script type="x-shader/x-vertex" id="alphasize_particles_vertex">
  attribute vec3 customColor;
  attribute float customSize;
  varying vec3 vColor;
  varying float ps;
  void main() 
  {
    vColor = customColor; // set color associated to vertex; use later in fragment shader
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_PointSize = customSize * ( 300.0 / length( mvPosition.xyz ) );
    ps = gl_PointSize;
    gl_Position = projectionMatrix * mvPosition;
  }
</script>

<script type="x-shader/x-fragment" id="alphasize_particles_fragment">
  uniform sampler2D texture;
  varying vec3 vColor; // colors associated to vertices; assigned by vertex shader
  varying float ps;
  void main() 
  {
    vec2 coord = gl_PointCoord - vec2(0.5);  //from [0,1] to [-0.5,0.5]
    if(length(coord) > 0.5)                  //outside of circle radius?
        discard;
    // calculates a color for the particle
    gl_FragColor = vec4( vColor, 1.5 - length(gl_PointCoord));
    // sets particle texture to desired color
    //gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );
  }
</script>

{component name="space.threejs"}

{dependency name="utils.phy"}

{dependency name="space.controls"}
{dependency name="space.thing"}
{dependency name="space.materials"}
{dependency name="space.geometry"}

{dependency name="space.OBJMTLLoader"}
{dependency name="space.MTLLoader"}

{dependency name="space.skybox"}
{dependency name="space.player"}
{dependency name="space.weapon"}
{dependency name="space.radar"}
{dependency name="space.roidfield"}
{dependency name="space.roid"}
{dependency name="space.ship"}
{dependency name="space.station"}
{dependency name="space.star"}
{dependency name="space.planet"}
{dependency name="space.sector"}
{dependency name="space.starbinger"}
{dependency name="space.hud"}
{dependency name="space.pointerlock"}
{dependency name="space.menus"}

<div elation:component="space.starbinger" class="main">
 <elation:args>{ldelim}"sector":{jsonencode var=$sector}{rdelim}</elation:args>
</div>