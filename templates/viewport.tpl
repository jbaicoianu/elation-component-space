{component name="space.threejs"}
{dependency name="space.viewport"}
{dependency name="space.planet"}
{dependency name="space.heightmap"}

<form class="spacecraft_controls" elation:component="spacecraft.controls">
  <ul style="float: left">
    {* <li>Move speed: <input name="movespeed" value="60" /></li> *}
    <li>Wireframe: <input name="wireframe" value="1" /></li>
    <li>Autoupdate: <input name="autoupdate" value="100" /></li>
    <li>Max Error: <input name="maxerror" value=".05" /></li>
    <li>Max Vertices: <input name="maxvertices" value="2500" /></li>
    {*<li>Fog density: <input name="fogdensity" value="0.05" /></li>*}
    <li><input type="submit" /></li>
  </ul>

  <ul id="spacecraft_debug"></ul>
  <p>WASD to move, Q/E to rotate, R/F to move vertically.  Click+drag in viewport to turn.  Hold shift to slow down.  Velocity slows as you approach the surface.</p>
<br style="clear: left;" />
</form>
<div id="spacecraft_planet_render" elation:component="spacecraft.viewport"></div>
<div id="spacecraft_world" elation:component="spacecraft.world" elation:args.highres="{$highres}">
  <elation:args>
    {ldelim}
      "parentname": "{$parentname}",
      "name": "{$name}",
      "type": "{$type}",
      "properties": {jsonencode var=$properties},
      "things": {jsonencode var=$things},
      "scene": "spacecraft_planet_render"
    {rdelim}
  </elation:args>
</div>


