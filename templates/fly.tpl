{component name="space.threejs"}
{* dependency name="utils.phy2" *}
{dependency name="physics.cyclone"}
{dependency name="physics.processors"}
{dependency name="physics.forces"}
{dependency name="physics.collisions"}
{dependency name="physics.visualizer"}
{dependency name="ui.select"}
{dependency name="deepzoom.image"}
{dependency name="deepzoom.canvas"}
{dependency name="space.controls"}
{dependency name="space.thing"}
{dependency name="space.observer"}
{dependency name="space.materials"}
{dependency name="space.meshparts"}
{dependency name="space.domevents"}
{dependency name="space.admin"}
{dependency name="space.pathedit"}

{foreach from=$types key=type item=typecount}
  {dependency name="space.`$type`"}
{/foreach}
{dependency name="space.fly"}
{dependency name="space.hud"}

<script>
// FIXME - this is retarded 
var craters1 = {jsonencode var=$craters1};
var craters2 = {jsonencode var=$craters2};
var craters3 = {jsonencode var=$craters3};
var craters4 = {jsonencode var=$craters4};
</script>
<div class="elation_space_viewport" elation:component="space.fly" class="main">
 <elation:args>{ldelim}"sector":{jsonencode var=$sector}{rdelim}</elation:args>
</div>
{* <div elation:component="space.flycontrols"></div> *}
{set var="page.title"}Physics Flight Demo{/set}
{dependency type="jstemplate" component="space.atlas_controls_top" name="atlas_controls_top"}
{dependency type="jstemplate" component="space.atlas_controls_right" name="atlas_controls_right"}
