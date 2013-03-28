{component name="space.threejs"}
{dependency name="graphics.webgl"}
{dependency name="graphics.tiles"}

{dependency name="deepzoom.image"}
{* dependency name="deepzoom.canvas" *}
{dependency name="deepzoom.webgl"}

{dependency name="physics.cyclone"}
{dependency name="physics.processors"}
{dependency name="physics.forces"}
{dependency name="physics.collisions"}
{dependency name="physics.visualizer"}

{dependency name="space.domevents"}
{dependency name="space.picker"}
{dependency name="space.viewport"}
{dependency name="space.controls"}
{dependency name="space.materials"}
{dependency name="space.thing2"}
{dependency name="space.things.generic"}
{dependency name="space.things.observer"}
{dependency name="space.things.pathedit"}

{foreach from=$types key=type item=typecount}
  {dependency name="space.things.`$type`"}
{/foreach}

<div class="elation_space_viewport" elation:component="space.viewport" elation:args.fullwindow="1">
 <elation:args>{ldelim}"sector":{jsonencode var=$sector}{rdelim}</elation:args>
</div>
{set var="page.title"}WebGL World Viewer{if !empty($root)} - {$root}{/if}{/set}
