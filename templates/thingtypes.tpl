<div class="spacecraft_thingtypes">
  <h2>Thing Types</h2>
  {component name="ui.list" items=$thingtypes itemcomponent="space.thingtype" groupby="type"}
  {component name="space.thingtype_create" item=$item error=$errors.thingtype}
</div>
