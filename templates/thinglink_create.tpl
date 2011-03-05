  <form{if $error} style="background: #fcc; border: 1px solid red;"{/if}>
    <h3>Create ThingLink</h3>
    <label for="spacecraft_thinglink_create_parentname">Parentname</label> <input name="thinglink[parentname]" id="spacecraft_thinglink_create_parentname" value="{$item->parentname}" />
    <label for="spacecraft_thinglink_create_name">Name</label> <input name="thinglink[name]" id="spacecraft_thinglink_create_name" value="{$item->name}" />
    <label for="spacecraft_thinglink_create_type">Link Type</label> <input name="thinglink[linktype]" id="spacecraft_thinglink_create_linktype" value="{$item->linktype}" />
    <label for="spacecraft_thinglink_create_linkto">Link To</label> <input name="thinglink[linkto]" id="spacecraft_thinglink_create_linkto" value="{$item->linkto}" />
    <input type="submit" />
  </form>


