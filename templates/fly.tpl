{component name="space.threejs"}
{dependency type="component" name="utils.sylvester"}
{dependency type="component" name="utils.dynamics"}
{dependency name="utils.phy"}
{dependency name="deepzoom.image"}
{dependency name="deepzoom.canvas"}
{dependency name="space.controls"}
{dependency name="space.thing"}
{dependency name="space.materials"}
{dependency name="space.meshparts"}
{dependency name="space.admin"}

{foreach from=$types key=type item=typecount}
  {dependency name="space.`$type`"}
{/foreach}
{dependency name="space.fly"}
{dependency name="space.hud"}

<div elation:component="space.fly">
 <elation:args>{ldelim}"sector":{jsonencode var=$sector}{rdelim}</elation:args>
</div>
{* <div elation:component="space.flycontrols"></div> *}
{set var="page.title"}Physics Flight Demo{/set}
