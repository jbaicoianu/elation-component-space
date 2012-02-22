{component name="space.threejs"}
{dependency name="utils.phy"}
{dependency name="ui.select"}
{dependency name="deepzoom.image"}
{dependency name="deepzoom.canvas"}
{dependency name="space.controls"}
{dependency name="space.thing"}
{dependency name="space.observer"}
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
{set var="page.title"}WebGL World Viewer{if !empty($root)} - {$root}{/if}{/set}
