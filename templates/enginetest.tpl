{set var="page.title"}Elation Engine Test{/set}

{dependency name="utils.dust"}
{dependency name="utils.template"}
{dependency name="utils.math"}

{dependency name="ui.slider"}
{dependency name="ui.tabs"}
{dependency name="ui.treeview"}
{dependency name="ui.window"}

{dependency name="graphics.webgl"}
{dependency name="graphics.tiles"}
{dependency name="deepzoom.image"}
{dependency name="deepzoom.webgl"}

{dependency name="engine"}
{dependency name="engine.external.three.three"}
{dependency name="engine.external.three.stats"}
{dependency name="engine.external.three.ColladaLoader"}
{dependency name="engine.external.three.JSONLoader"}
{dependency name="engine.external.three.FlyControls"}
{dependency name="engine.external.three.render.EffectComposer"}
{dependency name="engine.external.three.render.RenderPass"}
{dependency name="engine.external.three.render.ShaderPass"}
{dependency name="engine.external.three.render.MaskPass"}
{dependency name="engine.external.three.render.CopyShader"}
{dependency name="engine.external.three.render.SepiaShader"}
{dependency name="engine.external.three.render.BleachBypassShader"}
{dependency name="engine.external.three.render.FilmShader"}
{dependency name="engine.external.three.render.FilmPass"}
{dependency name="engine.external.three.render.FXAAShader"}
{dependency name="engine.external.three.fonts.helvetiker_regular"}

{dependency name="engine.external.audiostage"}

{dependency name="physics.cyclone"}
{dependency name="physics.forces"}
{dependency name="physics.constraints"}
{dependency name="physics.collisions"}
{dependency name="physics.processors"}

{dependency name="engine.utils.materials"}
{dependency name="engine.systems"}
{dependency name="engine.systems.ai"}
{dependency name="engine.systems.controls"}
{dependency name="engine.systems.sound"}
{dependency name="engine.systems.world"}
{dependency name="engine.systems.physics"}
{dependency name="engine.systems.render"}
{dependency name="engine.systems.admin"}
{dependency name="engine.view"}
{dependency name="engine.things"}
{dependency name="engine.things.generic"}
{dependency name="engine.things.controllable"}
{dependency name="engine.things.controller"}
{dependency name="engine.things.sector"}
{dependency name="engine.things.light"}
{dependency name="engine.things.terrain"}
{dependency name="engine.things.turret"}
{dependency name="engine.things.gridhelper"}

{*
{foreach from=$types key=type item=typecount}
  {dependency name="space.things.`$type`"}
{/foreach}
*}

<script type="text/javascript">
  var engine = new elation.engine.loop("test");

  var physics = engine.systems.add("physics");
  var renderer = engine.systems.add("render");
  var controls = engine.systems.add("controls", {jsonencode var=$controls});
  var sound = engine.systems.add("sound");
  var ai = engine.systems.add("ai");
  var world = engine.systems.add("world", {jsonencode var=$sector});
  var admin = engine.systems.add('admin');

  controls.activateContext("default");

  engine.start();
</script>

<div elation:component="engine.view" elation:name="main" elation:args.engine="test" elation:args.fullsize=1 elation:args.picking=1></div>
