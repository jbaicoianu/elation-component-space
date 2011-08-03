{component name="space.threejs"}
{dependency name="space.viewport"}
{dependency name="space.planet"}
{dependency name="space.heightmap"}

<form class="spacecraft_controls" elation:component="spacecraft.controls">
  <ul style="float: left">
    {* <li>Move speed: <input name="movespeed" value="60" /></li> *}
    <li>High Res: <input type="checkbox" name="highres" onclick="this.form.btn.click()"{if $highres} checked{/if} /></li>
    <li>Wireframe: <input type="checkbox" name="wireframe" onclick="this.form.btn.click()" /></li>
    {* <li>Autoupdate: <input name="autoupdate" value="100" /></li> *}
    <li>Max Error: <input name="maxerror" value=".01" title="Decrease to 0.01 or 0.001 for higher detail/slower performance" /></li>
    <li>Max Vertices: <input name="maxvertices" value="2500" title="Increase in small increments up to ~15000 for higher detail/slower performance" /></li>
    {*<li>Fog density: <input name="fogdensity" value="0.05" /></li>*}
    <li><input type="submit" name="btn"/></li>
  </ul>

  <ul id="spacecraft_debug"></ul>
  <p>WASD to move, Q/E to rotate, R/F to move vertically.  Click+drag in viewport to turn.  Hold shift to slow down.  Velocity slows as you approach the surface.</p>
<br style="clear: left;" />
</form>
<div id="spacecraft_planet_render" elation:component="spacecraft.viewport">
  <elation:args>
    {ldelim}
      "skybox": {$skybox}
    {rdelim}
  </elation:args>
</div>
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


