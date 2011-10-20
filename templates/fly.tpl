{component name="space.threejs"}
{dependency type="javascript" url="/~bai/three.js/examples/fonts/helvetiker_regular.typeface.js"}
{dependency type="component" name="utils.sylvester"}
{dependency type="component" name="utils.dynamics"}
{dependency name="utils.phy"}
{dependency name="space.thing"}
{dependency name="space.meshparts"}
{foreach from=$types key=type item=typecount}
  {dependency name="space.`$type`"}
{/foreach}
{dependency name="space.fly"}
{dependency name="space.hud"}

<div elation:component="space.fly">
 <elation:args>{ldelim}"sector":{jsonencode var=$sector}{rdelim}</elation:args>
</div>
<div elation:component="space.flycontrols">
</div>
{set var="page.title"}Physics Flight Demo{/set}
