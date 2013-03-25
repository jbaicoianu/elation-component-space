<div class="spacecraft_things">
  <h2>Edit Thing: {$thing->name}</h2>
  <h3>Properties</h3>
<form method="post">
  Add Property
  <input type="hidden" name="parentname" value="{$thing->parentname}" />
  <input type="hidden" name="name" value="{$thing->name}" />
  <input name="addproperty[property]" tabindex="1" /> :
  <input name="addproperty[propertykey]" tabindex="2" /> = 
  <input name="addproperty[value]" tabindex="3" />
  {component name="ui.select" items="int;float;string;vector;json" selected=$prop->propertytype selectname="addproperty[propertytype]" tabindex="4"}
  <input type="submit" tabindex="5" />
</form>
<form method="post">
  <input type="hidden" name="parentname" value="{$thing->parentname}" />
  <input type="hidden" name="name" value="{$thing->name}" />

  {foreach from=$properties key=propname item=props}
    <div class="spacecraft_thing_propertygroup">
      <h4>{$propname}</h4>
      <ul>
      {foreach from=$props key=propkey item=prop}
        <li>
          <label for="spacecraft_thing_{$prop->property}_{$prop->propertykey}">{$prop->propertykey}</label>
          <input id="spacecraft_thing_{$prop->property}_{$prop->propertykey}" name="updateproperty[{$prop->property}][{$prop->propertykey}]" value="{$prop->value}" />
          {component name="ui.select" selectname="updatetype[`$prop->property`][`$prop->propertykey`]" items="int;float;string;vector;json" selected=$prop->propertytype}
        </li>
      {/foreach}
      </ul>
    </div>
  {/foreach}
  <input type="submit" value="update" />
</form>

  {if !empty($thing->things)}
    <div class="">
      <h3>Things</h3>
      {component name="ui.list" items=$thing->things itemcomponent="space.thing"}
    </div>
  {/if}
  {component name="space.thing_create" error=$errors.thing parentthing=$thing}
</div>
{dependency type="component" name="space"}
