		<script type="x-shader/x-vertex" id="vertexshader">

			uniform float amplitude;
			attribute float size;
			attribute vec3 customColor;

			varying vec3 vColor;

			void main() {

				vColor = customColor;

				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

				gl_PointSize = size;
				gl_PointSize = size * ( 300.0 / length( mvPosition.xyz ) );

				gl_Position = projectionMatrix * mvPosition;

			}

		</script>

		<script type="x-shader/x-fragment" id="fragmentshader">

			uniform vec3 color;
			uniform sampler2D texture;

			varying vec3 vColor;

			void main() {

				gl_FragColor = vec4( color * vColor, 1.0 );
				gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );

			}

		</script>


{component name="space.threejs"}
{dependency type="component" name="utils.sylvester"}

{dependency name="utils.phy"}

{dependency name="utils.tplmgr"}
{dependency name="ui.select"}
{dependency name="space.controls"}
{dependency name="space.thing"}
{dependency name="space.materials"}
{dependency name="space.geometry"}
{dependency name="space.meshparts"}
{dependency name="space.admin"}

{*
{dependency name="space.OBJMTLLoader"}
{dependency name="space.MTLLoader"}
*}

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

{set var="page.title"}Stella Imperia{/set}

<div elation:component="space.starbinger" class="main">
 <elation:args>{ldelim}"sector":{jsonencode var=$sector}{rdelim}</elation:args>
</div>