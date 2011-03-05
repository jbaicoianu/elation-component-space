  <form{if $error} style="background: #fcc; border: 1px solid red;"{/if}>
    <h3>Create Thing</h3>
    <label for="spacecraft_thing_create_name">Name</label> <input name="thing[name]" id="spacecraft_thing_create_name" value="{$item->name}" />
    <label for="spacecraft_thing_create_type">Type</label> <input name="thing[type]" id="spacecraft_thing_create_type" value="{$item->type}" />
    <label for="spacecraft_thing_create_parentname">Parent Name</label> <input name="thing[parentname]" id="spacecraft_thing_create_parentname" value="{$item->parentname}" />
    <label for="spacecraft_thing_create_quantity">Quantity</label> <input name="thing[quantity]" id="spacecraft_thing_create_quantity" value="{$item->quantity|default:1}" />
    <input type="submit" />
  </form>

