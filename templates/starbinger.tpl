{component name="space.threejs"}
{dependency type="component" name="utils.sylvester"}
{dependency type="component" name="utils.dynamics"}
{dependency name="utils.phy"}

{*
{dependency name="physics.cyclone"}
{dependency name="physics.collisions"}
{dependency name="physics.forces"}
{dependency name="physics.processors"}
{dependency name="physics.visualizer"}
*}

{dependency name="utils.tplmgr"}
{dependency name="ui.select"}
{dependency name="deepzoom.image"}
{dependency name="deepzoom.canvas"}
{dependency name="space.controls"}
{dependency name="space.thing"}
{dependency name="space.materials"}
{dependency name="space.meshparts"}
{dependency name="space.admin"}

{dependency name="space.drone"}
{dependency name="space.spaceship"}
{dependency name="space.star"}
{dependency name="space.planet"}
{dependency name="space.sector"}
{dependency name="space.starbinger"}
{dependency name="space.hud"}

<div elation:component="space.starbinger" class="main">
 <elation:args>{ldelim}"sector":{jsonencode var=$sector}{rdelim}</elation:args>
</div>

{set var="page.title"}Starbinger: Truckin'{/set}
