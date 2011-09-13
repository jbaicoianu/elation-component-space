<?

class Component_space extends Component {
  function init() {
    $this->orm = OrmManager::singleton();
    $this->orm->LoadModel("space");

    $cfg  = ConfigManager::singleton();
    $cfg->current["page"]["frame"] = "space";
  }

  function controller_space($args) {
    $vars["content"] = any($args["content"], array("component" => "space.world"));
/*
    $vars["view"] = any($args["view"], "thingtypes");
    if (!empty($args["thinglink"])) {
      $add = ComponentManager::fetch("space.thinglink", array("create" => $args["thinglink"]), "data");
      $vars["errors"]["thinglink"] = $add["error"];
      $vars["view"] = "thinglinks";
    }
*/
    return $this->GetComponentResponse("./space.tpl", $vars);
  }
  function controller_thingtypes($args) {
    $datatype = any($args["datatype"], "tree");
    if (!empty($args["thingtype"])) {
      $add = ComponentManager::fetch("space.thingtype", array("create" => $args["thingtype"]), "data");
      $vars["errors"]["thingtype"] = $add["error"];
      $vars["view"] = "thingtypes";
    }
    $thingtypes = $this->orm->select("ThingType", "ORDER BY type,property");
    if ($datatype == "tree") {
      foreach ($thingtypes as $k) {
        if (!isset($vars["thingtypes"][$k->type]->type)) {
          $vars["thingtypes"][$k->type]->type = $k->type;
        }
        $vars["thingtypes"][$k->type]->properties[$k->property][$k->propertykey] = $k->value;
      }
    } else {
      $vars["thingtypes"] = $thingtypes;
    }
    $vars["errors"] = $args["errors"];
    return $this->GetComponentResponse("./thingtypes.tpl", $vars);
  }
  function controller_thingtype($args) {
    $vars["item"] = $args["item"];
    if (!empty($args["create"])) {
      $newitem = new ThingType();
      foreach ($args["create"] as $k=>$v) {
        $newitem->{$k} = $v;
      }
      $vars["item"] = $newitem;
      try {
        $this->orm->save($newitem);
        $vars["error"] = false;
      } catch (Exception $e) {
        $vars["error"] = true;
      }
    }
    return $this->GetComponentResponse("./thingtype.tpl", $vars);
  }
  function controller_thingtype_create($args) {
    $vars["thingtype"] = $args["thingtype"];
    $vars["error"] = $args["error"];
    return $this->GetComponentResponse("./thingtype_create.tpl", $vars);
  }
  function controller_things($args) {
    $datatype = any($args["datatype"], "tree");
    $where = "";
    $vars["name"] = "universe";
    $vars["parentname"] = "";
    $vars["type"] = "universe";
    $vars["quantity"] = "1";
    $vars["attributes"] = array("capacity" => array("sector" => 1000));
    
    if (!empty($args["thing"])) {
      $add = ComponentManager::fetch("space.thing", array("create" => $args["thing"]), "data");
      $vars["errors"]["thing"] = $add["error"];
      $vars["view"] = "things";
    }
    if (!empty($args["from"])) {
      $from = $args["from"] . (substr($args["from"], -1) != '/' ? '/' : '');
      $where .= "CONCAT({Thing.parentname},'/',{Thing.name}) LIKE '$from%'";

      $fromparts = explode("/", $from);
      $fromparentname = implode("/", array_slice($fromparts, 0, count($fromparts)-2));
      $fromname = $fromparts[count($fromparts)-2];

      $fromthing = ORMManager::from("Thing")->with("ThingType", "ThingProperty")->where("{Thing.parentname}=? AND {Thing.name}=?", array($fromparentname, $fromname))->find();
      if (!empty($fromthing[0])) {
        $this->mergeProperties($fromthing[0], $fromthing[0]->getThingTypes());
        $this->mergeProperties($fromthing[0], $fromthing[0]->getThingProperties());
        $vars = object_to_array($fromthing[0]);
      }
    }
    //$where .= "ORDER BY CONCAT(parentname,'/',name)";
    $things = ORMManager::from("Thing")->with("ThingType", "ThingProperty")->where($where)->orderBy("CONCAT({Thing.parentname},'/',{Thing.name})")->find();
    foreach ($things as $thing) {
      // FIXME - this is currently triggering many queries because the Outlet one-to-many processing needs some work
      $this->mergeProperties($thing, $thing->getThingTypes());
      $this->mergeProperties($thing, $thing->getThingProperties());
      if ($datatype == "tree") {
        $objkey = $thing->parentname . "/" . $thing->name;
        if (!empty($from)) {
          $objkey = preg_replace("|^" . $from . "|", "/", $objkey);
        }
        object_set($vars, str_replace("/", "/things/", $objkey), $thing, "/");
      } else {
        $vars["things"][] = $thing;
      }
    }
    return $this->GetComponentResponse("./things.tpl", $vars);
  }
  function controller_thing($args) {
    if (!empty($args["item"])) {
      $vars["item"] = $args["item"];
    } else if (!empty($args["parentname"]) && !empty($args["name"])) {
      $vars["item"] = ORMManager::load("Thing", array($args["parentname"], $args["name"]));
      $things = ComponentManager::fetch("space.things", array("from" => $args["parentname"] . "/" . $args["name"]), "data");
      $vars["item"]->things = $things["things"];
    }
    if (!empty($args["create"])) {
      $newitem = new Thing();
      foreach ($args["create"] as $k=>$v) {
        $newitem->{$k} = $v;
      }
      $vars["item"] = $newitem;
      try {
        $this->orm->save($newitem);
        $vars["error"] = false;
      } catch (Exception $e) {
        $vars["error"] = true;
      }
    }
    $vars["show"] = array("properties" => any($args["showproperties"], false), 
                          "things" => any($args["showproperties"], true),
                          "links" => any($args["showlinks"], false));
    return $this->GetComponentResponse("./thing.tpl", $vars);
  }
  function controller_thing_edit($args) {
    if (!empty($args["addproperty"])) {
      $newitem = new ThingProperty();
      $newitem->parentname = $args["parentname"];
      $newitem->name = $args["name"];
      foreach ($args["addproperty"] as $k=>$v) {
        $newitem->{$k} = $v;
      }
      //$vars["item"] = $newitem;
      try {
        $this->orm->save($newitem);
        $vars["error"] = false;
      } catch (Exception $e) {
        $vars["error"] = true;
      }
    }
    if (!empty($args["thing"])) {
      $vars["thing"] = $args["item"];
    } else if (!empty($args["parentname"]) && !empty($args["name"])) {
      $vars["thing"] = ORMManager::load("Thing", array($args["parentname"], $args["name"]));
      $types = $vars["thing"]->getThingTypes()->toArray();
      $properties = $vars["thing"]->getThingProperties()->toArray();
      $updates = any($args["updateproperty"], array()); 
      $updatetypes = any($args["updatetype"], array()); 
      $didupdate = false;
      foreach ($properties as $prop) {
        if (!empty($updates[$prop->property]) && !empty($updates[$prop->property][$prop->propertykey])) {
          if ($prop->value != $updates[$prop->property][$prop->propertykey] || $prop->propertytype != $updatetypes[$prop->property][$prop->propertykey]) {
            $prop->value = $updates[$prop->property][$prop->propertykey];
            $prop->propertytype = $updatetypes[$prop->property][$prop->propertykey];
            OrmManager::save($prop);
            $didupdate = true;
          }
        }
        $vars["properties"][$prop->property][$prop->propertykey] = $prop;
      }
      if ($didupdate) {
        //header("Location: " . $this->root->request["url"]);
      }
      $things = ComponentManager::fetch("space.things", array("from" => $args["parentname"] . "/" . $args["name"]), "data");
      $vars["thing"]->things = $things["things"];
    }

    return $this->GetComponentResponse("./thing_edit.tpl", $vars);
  }
  function controller_thing_create($args) {
    $vars["thing"] = $args["thing"];
    $vars["error"] = $args["error"];
    if (!empty($args["parentthing"])) {
      $vars["item"]->parentname = $args["parentthing"]->parentname . "/" . $args["parentthing"]->name;;
    }
    return $this->GetComponentResponse("./thing_create.tpl", $vars);
  }
  function controller_thinglinks($args) {
    $vars["thinglinks"] = $this->orm->select("ThingLink");
    return $this->GetComponentResponse("./thinglinks.tpl", $vars);
  }
  function controller_thinglink($args) {
    $vars["item"] = $args["item"];
    if (!empty($args["create"])) {
      $newitem = new ThingLink();
      foreach ($args["create"] as $k=>$v) {
        $newitem->{$k} = $v;
      }
      $vars["item"] = $newitem;
      try {
        $this->orm->save($newitem);
        $vars["error"] = false;
      } catch (Exception $e) {
        $vars["error"] = true;
      }
    }
    return $this->GetComponentResponse("./thinglink.tpl", $vars);
  }
  function controller_thinglink_create($args) {
    $vars["thinglink"] = $args["thinglink"];
    $vars["error"] = $args["error"];
    return $this->GetComponentResponse("./thinglink_create.tpl", $vars);
  }
  function controller_world($args) {
    $data = ComponentManager::fetch("space.thingtypes", array("datatype" => "tree"), "data");
    $vars["anchor"] = any($args["anchor"], "/milky way/solar system/sol/earth");
    $vars["skybox"] = !isset($args["skybox"]) || !empty($args["skybox"]);
    $vars["capacities"] = $data["thingtypes"];
    //$data = ComponentManager::fetch("space.things", array("datatype" => "tree"), "data");
    $vars["things"] = $data["things"];
    $vars["highres"] = any($args["hq"], false);

    return $this->GetComponentResponse("./world.tpl", $vars);
  }
/*
  function controller_test($args) {
    $datatype = any($args["datatype"], "tree");
    $things = ORMManager::from("Thing")->with("ThingType", "ThingProperty")->find();
    foreach ($things as $thing) {
      $allprops = array($thing->getThingTypes(), $thing->getThingProperties());
      foreach ($allprops as $props) {
        if (!empty($props)) {
          foreach ($props as $prop) {
            $thing->properties[$prop->property][$prop->propertykey] = $this->castProperty($prop);
          }
        }
      }
      if ($datatype == "tree") {
        object_set($vars, str_replace("/", "/things/", $thing->parentname . "/" . $thing->name), $thing, "/");
      } else {
        $vars["things"][] = $thing;
      }
    }

    return $this->GetComponentResponse(NULL, $vars);
  }
*/
  function controller_viewport($args) {
    $vars["anchor"] = any($args["anchor"], "/");
    $data = ComponentManager::fetch("space.things", array("from" => $vars["anchor"], "datatype" => "tree"), "data");
    $vars = $data;
    $vars["skybox"] = !empty($args["skybox"]);
    $vars["highres"] = any($args["highres"], false);
    return $this->GetComponentResponse("./viewport.tpl", $vars);
  }
  function controller_fly($args) {
    $vars["sector"] = ComponentManager::fetch("space.things", array("from" => "/milky way/solar system/sol/earth/north america/stupidtown"), "data");
    return $this->GetComponentResponse("./fly.tpl", $vars);
  }

  function castProperty($prop) {
    switch($prop->propertytype) {
      case 'float':
        $val = (float) $prop->value;
        break;
      case 'int':
      case 'integer':
        $val = (int) $prop->value;
        break;
      case 'vector':
        $val = explode(",", $prop->value);
        for ($i = 0; $i < count($val); $i++) {
          $val[$i] = (float) $val[$i];
        }
        break;
      default:
        $val = $prop->value;
    }
    return $val;
  }
  function mergeProperties($thing, $props) {
    if (!empty($props)) {
      foreach ($props as $prop) {
        switch ($prop->propertykey) {
          case 'texture':
          case 'heightmap':
            $value = DependencyManager::$locations['imageswww'] . $this->castProperty($prop);
            break;
          default:
            $value = $this->castProperty($prop);
        }
        $thing->properties[$prop->property][$prop->propertykey] = $value;
      }
    }
  }
}  
