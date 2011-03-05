{component name="space.threejs"}
{dependency name="space.planet"}

<div id="spacecraft_planet_render" elation:component="spacecraft.planet"></div>
<div id="spacecraft_world" elation:component="spacecraft.world">
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


