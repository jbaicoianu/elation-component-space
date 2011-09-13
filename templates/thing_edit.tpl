<div class="spacecraft_things">
  <h2>Edit Thing: {$thing->name}</h2>
  <h3>Properties</h3>
<form method="get">
  Add Property
  <input type="hidden" name="parentname" value="{$thing->parentname}" />
  <input type="hidden" name="name" value="{$thing->name}" />
  <input name="addproperty[property]" /> :
  <input name="addproperty[propertykey]" /> = 
  <input name="addproperty[value]" />
  {component name="ui.select" items="int;float;string;vector" selected=$prop->propertytype selectname="addproperty[propertytype]"}
  <input type="submit" />
</form>
  {foreach from=$properties key=propname item=props}
    <div class="spacecraft_thing_propertygroup">
      <h4>{$propname}</h4>
      <ul>
      {foreach from=$props key=propkey item=prop}
        <li>
          <label for="spacecraft_thing_{$prop->property}_{$prop->propertykey}">{$prop->propertykey}</label>
          <input id="spacecraft_thing_{$prop->property}_{$prop->propertykey}" name="properties[{$prop->property}][{$prop->propertykey}]" value="{$prop->value}" />
          {component name="ui.select" items="int;float;string;vector" selected=$prop->propertytype}
        </li>
      {/foreach}
      </ul>
    </div>
  {/foreach}

  {if !empty($thing->things)}
    <div class="">
      <h3>Things</h3>
      {component name="ui.list" items=$thing->things itemcomponent="space.thing"}
    </div>
  {/if}
  {component name="space.thing_create" error=$errors.thing parentthing=$thing}
</div>
{dependency type="component" name="space"}
