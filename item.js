item_exit = {
  avatar: ">",
  description: "the exit. Do you have everything you need first?",
  movable: false,
  havable: false,
};

item_flashlight = {
  avatar: "F",
  description: "bright flashlight",
  movable: false,
  havable: true,
  legendary: true,
  glowing: true,
};

item_ladder = {
  avatar: "L",
  description: "wooden ladder",
  movable: false,
  havable: true,
  legendary: true,
};

item_breadcrumb = {
  avatar: ".",
  description: "a breadcrumb from turn ",
  movable: false,
  havable: false,
};

item_cookie = {
  avatar: "c",
  description: "delicious oatmeal cookie",
  comestable: true,
  havable: true,
  movable: false,
  restorative: 5
};

item_stick = {
  avatar: "I",
  description: "sharp-looking stick",
  comestable: false,
  havable: true,
  movable: false,
  damage: 1,
  reach: 1,
};

item_shield = {
  avatar: "o",
  description: "round wooden shield",
  comestable: false,
  havable: true,
  movable: false,
  armor: 1,
};

items = [item_exit, item_flashlight, item_ladder, item_breadcrumb, item_cookie, item_stick, item_shield,];

function item_collide(item)
{
  if (item.havable) 
  {
    messages.push("There is a " + item.description + " here. You can pick it up.");
  } else {
    messages.push("You see " + item.description);
  }

  interactable.push(item);
}

function item_think(item)
{
  /* Stuff common to all items */
  if (item.x == player.x && item.y == player.y)
  {
    item_collide(item);
  } 
}

function item_weapon_use(item)
{
  player.dmg = item.damage + player.base_dmg;
  player.reach = item.reach + player.base_reach;
  messages.push("Your new equipment looks dangerous.");
}

function item_armor_use(item)
{
  player.armor = player.base_armor + item.armor;
  messages.push("The world is a bit less scary.");
}

function edible_item_use(item)
{
  if (item.comestable) {
    player.health += item.restorative;
    messages.push("The " + item.description + " really hit the spot!");
    if (player.health > player.base_health)
    {
      player.health = player.base_health;
      messages.push("You feel really full.");
    }
  }
}

var draw_entity = function() {};
var genRand = function(x, y) {};

function item_draw(item)
{
  draw_entity(item.avatar, item.x, item.y, ("glowing" in item), item.movable);
}

function item_spawn(room, item)
{
  console.log("Spawning item: " + item.description);
  /* put item into room */
  var x = Math.floor(room.x - (room.w/2) + genRand(1, room.w-2));
  var y = Math.floor(room.y - (room.h/2) + genRand(1, room.h-2));
  var i = item_spawn_at(x, y, item);
  /* give the item a reference to the room */
  i.r = room;
  /* Let the room know it has this item */
  room.i.push(i);
  return i;
}

function item_spawn_at(x, y, item)
{
  /* First clone */
  /* XXX: Erases all functions */
  var i = JSON.parse(JSON.stringify(item)); 

  /* most items think and draw the same way */
  i.draw = item_draw;
  i.think = item_think;
  i.type = "item";

  /* properly locate the item */
  i.x = x;
  i.y = y;
 
  /* Push the item into the entity pool */
  entities.push(i);

  return i;

}

