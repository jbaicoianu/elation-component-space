{component name="space.threejs"}
{dependency type="component" name="utils.sylvester"}

{dependency name="utils.phy"}

{dependency name="utils.tplmgr"}
{dependency name="ui.select"}
{dependency name="space.controls"}
{dependency name="space.thing"}
{dependency name="space.materials"}
{dependency name="space.meshparts"}
{dependency name="space.admin"}

{*
{dependency name="space.OBJMTLLoader"}
{dependency name="space.MTLLoader"}
*}

{dependency name="space.skybox"}
{dependency name="space.player"}
{dependency name="space.roidfield"}
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

<style>
* { 
  font-family: sans-serif;
  font-weight: bold;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
body {
  margin: 0;
  overflow: hidden;
}
canvas {
  position: fixed;
}
.rotacol {
  position: fixed;
  top: 10px;
  right: 10px;
  padding: .3em .6em;
  background: #121516;
  font-size: .8em;
  opacity: .7;
  color: #7b9cab;
  border-radius: .5em;
  box-shadow: 0px 0px 20px 1px #3b5c6b inset,0px 0px 15px 0px #3b5c6b;
}
.console_display li {
  margin: -0.2em .4em;
}
.console_display {
  padding: 0;
  border-radius: .3em;
  height: 5.9em;
  overflow: auto;
  font-size: .8em;
  margin: 0;
}
.console_bottom {
  margin: 0;
}
.console_input {
  border-top: 1px solid #252525;
  padding: 0;
  background: black;
  border-radius: .3em;
  display: block;
  height: 1.5em;
  border: none;
  width: 100%;
  margin-top: .2em;
  box-shadow: 0px 0px 1px 1px #3b5c6b inset;
}
.console {
  position: fixed;
  bottom: 10px;
  right: 10px;
  height: 6em;
  width: 40%;
  padding: .3em;
  background: #121516;
  opacity: .7;
  color: #7b9cab;
  border-radius: .5em;
  border: 2px solid #3b5c6b;
  box-shadow: 0px 0px 30px 1px #3b5c6b inset,0px 0px 15px 0px #3b5c6b;
  z-index: 6;
}
.altimeter {
  position: fixed;
  bottom: 10px;
  left: 10px;
  width: 40px;
  height: 200px;
  border-radius: .5em;
}
div.debug span {
  margin: 0;
  float: left;
  overflow: hidden;
  overflow-y: auto;
  height: 1.3em;
}
div.debug span.alt {
  display: block;
  position: absolute;
  margin-left: 70px;
  width: 120px;
}
.debug {
  position: fixed;
  bottom: 14px;
  left: 17px;
  padding: .3em .6em;
  opacity: .7;
  color: #ab9c7b;
  font-size: .8em;
  z-index: 6;
  width: 5em;
}
div.target_top {
  border-bottom: 2px solid #7B9CAB;
  color: #7B9CAB;
  padding: 0;
  text-align: left;
  height: 30px;
  font-size: 11px;
}
div.target_topleft {
  width: 42%;
  height: 30px;
  float: left;
  padding: 0;
}
div.target_label {
  border-bottom: 1px solid #7B9CAB;
  color: #7B9CAB;
  height: 14px;
  padding-right: 3px;
  text-align: right;
}
div.target_name {
  color: #aaaaaa;
  height: 16px;
  padding-right: 3px;
  text-align: right;
  font-weight: bold;
  font-size: 12px;
}
div.target_distance {
  border-left: 1px solid #7B9CAB;
  color: #C44;
  width: 39%;
  height: 26px;
  float: left;
  padding-left: 3px;
  text-align: left;
  font-size: 19px;
  padding-top: 4px;
}
.target_canvas {
  width: 200px;
  height: 170px;
}
.rearview,
div.target {
  background: #121516;
  box-shadow: 0px 0px 11px 6px #3b5c6b inset,0px 0px 15px 0px #3b5c6b;
  border-radius: 25px;
  left: 10px;
  border: 2px solid #6B8C9B;
  opacity: .7;
}
.rearview,
.target,
.radar {
  position: fixed;
  bottom: 10px;
  left:  233px;
  width: 200px;
  height: 200px;
  overflow: hidden;
}
.radar {
  width: 400px;
  height: 400px;
}
.target_canvas,
.radar.radar_background {
  bottom: -100%;
}
.rearview {
  bottom: 10px;
  right:  10px;
  left: auto;
}
.radar_background {
  box-shadow: 0px 0px 75px 35px #3b5c6b inset,0px 0px 15px 0px #3b5c6b;
  border-radius: 100px;
  -webkit-border-radius: 100px;
  z-index: 1;
}
.radar_display {
  z-index: 2;
  -webkit-transition: opacity 100ms ease 0;
}
.radar_static {
  z-index: 3;
}
canvas.targeting {
  opacity: 1;
}
.targeting,
.aeronautics {
  position: fixed;
  width: 300px;
  height: 300px;
  top: 0;
  left: 0;
  opacity: .55;
  z-index: 5;
  pointer-events: none;
}
.static_overlay {
  position: fixed;
 /* width: 300px;
  height: 300px;*/
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 5;
  pointer-events: none;
}
/* admin */
.space_world_admin {
  position: fixed;
  right: 1em;
  bottom: 1em;
  border: 1px solid black;
  border-radius: 8px;
  background: rgba(200,200,200,.5);
  padding: .5em;
  box-shadow: 0 0 50px #000;
  display: none;
}
.space_admin_scene_thinglist {
  padding-left: 0;
  list-style-position: inside;
  list-style-type: none;
  margin: 0;
}
.space_admin_scene_thinglist .space_admin_scene_thinglist {
  margin-left: .5em;
  padding-left: .1em;
  border-left: 1px dotted black;
  list-style-image: url(../images/elation/blackdash.png);
}
.space_admin_scene_thinglist em {
  font-style: normal;
  font-size: .6em;
}
.space_admin_scene_thinglist li {
  background: rgba(200,200,200,.5);
}
.space_admin_scene_thinglist li.state_hover {
  background: #ffa;
}
.space_admin_scene_thinglist li.state_active {
  background: #afa;
}
.space_admin_scene_thinglist li.state_editing {
  background: #faa;
}
.space_admin_scene_thinglist li .space_admin_thing_edit {
  display: none;
  float: right;
  font-size: .8em;
}
.space_admin_scene_thinglist li:hover>.space_admin_thing_edit {
  display: block;
}
</style>