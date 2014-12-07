var item_exit = {
  avatar: ">",
  description: "the exit. Do you have everything?",
  movable: false,
  havable: false,
};

var item_flashlight = {
  avatar: "F",
  description: "bright flashlight",
  movable: false,
  havable: true,
  legendary: true,
};

var item_ladder = {
  avatar: "L",
  description: "wooden ladder",
  movable: false,
  havable: true,
  legendary: true,
};

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

var draw_entity = function() {};
var genRand = function(x, y) {};

function item_draw(item)
{
  draw_entity(item.avatar, item.x, item.y);
}

function item_spawn(room, item)
{
  /* add the item to the list of tracked entities */

  /* First clone */
  /* XXX: Erases all functions */
  var i = JSON.parse(JSON.stringify(item)); 

  /* all items think and draw the same way */
  i.draw = item_draw;
  i.think = item_think;
  i.type = "item";

  /* put item into room */
  i.x = Math.floor(room.x - (room.w/2) + genRand(1, room.w-2));
  i.y = Math.floor(room.y - (room.h/2) + genRand(1, room.h-2));
  
  /* give the item a reference to the room */
  i.r = room;

  /* Let the room know it has this item */
  room.i.push(i);

  /* Push the item into the entity pool */
  entities.push(i);

  return i;
}


