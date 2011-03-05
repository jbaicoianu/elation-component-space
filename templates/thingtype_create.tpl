  <form{if $error} style="background: #fcc; border: 1px solid red;"{/if}>
    <label for="spacecraft_thingtypes_create_type">Type</label> <input name="thingtype[type]" id="spacecraft_thingtypes_create_type" value="{$item->type}" />
    <label for="spacecraft_thingtypes_create_property">Property</label> <input name="thingtype[property]" id="spacecraft_thingtypes_create_property" value="{$item->property}" />
    <label for="spacecraft_thingtypes_create_propertykey">Property Key</label> <input name="thingtype[propertykey]" id="spacecraft_thingtypes_create_propertykey" value="{$item->propertykey}" />
    <label for="spacecraft_thingtypes_create_value">Value</label> <input name="thingtype[value]" id="spacecraft_thingtypes_create_value" value="{$item->value}" />
    <input type="submit" />
  </form>
