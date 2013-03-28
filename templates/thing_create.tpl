  <form action="things" {if $error} class="state_error"{/if}>
    <h3>Create Thing</h3>
    <ul class="spacecraft_thing_create">
      <li><label for="spacecraft_thing_create_name">Name</label> <input name="thing[name]" id="spacecraft_thing_create_name" value="{$item->name}" /></li>
      <li><label for="spacecraft_thing_create_type">Type</label> <input name="thing[type]" id="spacecraft_thing_create_type" value="{$item->type}" /></li>
      <li><label for="spacecraft_thing_create_parentname">Parent Name</label> <input name="thing[parentname]" id="spacecraft_thing_create_parentname" value="{$item->parentname}" /></li>
      <li><label for="spacecraft_thing_create_quantity">Quantity</label> <input name="thing[quantity]" id="spacecraft_thing_create_quantity" value="{$item->quantity|default:1}" /></li>
      <li><input type="submit" value="create" /></li>
    </ul>
  </form>

