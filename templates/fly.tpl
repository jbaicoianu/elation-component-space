{component name="space.threejs"}
{dependency type="component" name="utils.sylvester"}
{dependency type="component" name="utils.dynamics"}
{dependency name="space.fly"}

<div elation:component="space.fly">
 <elation:args>{ldelim}"sector":{jsonencode var=$sector}{rdelim}</elation:args>
</div>
<div elation:component="space.flycontrols">
</div>
{set var="page.title"}Physics Flight Demo{/set}
