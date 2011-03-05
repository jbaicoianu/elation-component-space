{component name="html.header"}
{dependency type="component" name="space"}
<div id="spacecraft_dashboard" class="ui_clear_after">
  <div class="spacecraft_sidebar">
    <div class="spacecraft_navigation">
      <h2>Navigation</h2>
      <ul class="spacecraft_menu">
        <li><a href="thingtypes">Thing Types</a></li>
        <li><a href="things">Things</a></li>
        <li><a href="thinglinks">Thing Links</a></li>
      </ul>
    </div>
  </div>
  <div class="spacecraft_main">
    {component name="html.content" content=$content}
  </div>
</div>
{component name="html.footer"}
