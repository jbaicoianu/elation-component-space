<h2>{$item->type}</h2> 
{foreach from=$item->properties key=propkey item=props}
  <div class="spacecraft_thing_propertygroup">
    <h4>{$propkey}</h4>
    <ul>
      {foreach from=$props key=propertykey item=propertyvalue}
        <li><label for="thingtype_{$item->type}_capacity_{$propertykey}">{$propertykey}:</label> <input name="itemtype[{$item->type}]["capacity"][{$propertykey}]" id="thingtype_{$item->type}_capacity_{$propertykey}" value="{$propertyvalue}" /></li>
      {/foreach}
    </ul>
  </div>
{/foreach}
