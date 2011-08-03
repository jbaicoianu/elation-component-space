<h3><a href="thing_edit?parentname={$item->parentname|escape:html}&name={$item->name|escape:html}">{$item->name}</a> <em>({$item->type}): {$item->quantity}</em></h3> 

{if $show.properties && !empty($item->properties)}
  <div class="spacecraft_thing_properties" id="spacecraft_thing_properties_{$item->name}">
  {foreach from=$item->properties key=propkey item=props}
    <h4>{$propkey}</h4>
    <ul>
      {foreach from=$props key=propname item=propval}
        <li>{$propname} = {$propval}</li>
      {/foreach}
    </ul>
  {/foreach}
  </div>
{/if}
{if $show.things && !empty($item->things)}
  {component name="ui.list" items=$item->things itemcomponent="space.thing" class="spacecraft_things_list"}
{/if}
{if $show.links && !empty($item->links)}
  {printpre var=$item->links}
{/if}
