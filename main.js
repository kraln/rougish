/* Variable to hold the screen and stuff */
var scr = [[]]; /* the screen buffer */
var world = [[]]; /* the world */
var world_x = 2000; /* World size... change me ! :) */
var world_y = 1000; 
var screen_x = 80; /* Screen size. Don't change me... */
var screen_y = 24;
var cam_x = world_x/2; /* The "camera" position */
var cam_y = world_y/2; 
var rooms = []; /* track room centers */
var entities = []; /* track things */
var turn = 0;
var messages = [];
var blocked_on_message = false;
var interactable = [];
var game_won = false;

/* Special characters */
var block = '█';

/* HTML handle */
var handle = document.getElementById("playarea");

var player = {
  x: world_x/2,
  y: world_y/2,
  pos: { x: world_x/2, y: world_y/2 },
  inventory: [],
  moveUp: function() {
    if (world[player.x][player.y + 1] == ' ')
      player.y++;   
      end_turn(); 
  },
  moveDown: function() {
    if (world[player.x][player.y - 1] == ' ')
      player.y--;
      end_turn(); 
  },
  moveLeft: function() {
    if (world[player.x + 1][player.y] == ' ')
      player.x++;
      end_turn(); 
  },
  moveRight: function() {
    if (world[player.x - 1][player.y] == ' ')
      player.x--;  
      end_turn(); 
  },
  pickUp: function(thing) {
    player.inventory.push(thing);
    
    interactable.splice(interactable.indexOf(thing), 1);
    entities.splice(entities.indexOf(thing), 1);
  },
  interact: function() {
    /* if nothing, then nothing */
    if (!interactable.length)
    {
      messages.push("There's nothing here but dusty floor.");
      return;
    }

    for (var i = 0; i < interactable.length; i++)
    {
      var thing = interactable[i];
      if (thing.type == "item")
      {
        if (thing.havable) {
          messages.push("You pick up the " + thing.description + ".");
          if (thing.legendary) 
          {
            messages.push("Ooooooh!");
          }
          player.pickUp(thing);
          continue;
        } else {
          /* Can I interact with it? */
          if (thing.interact)
          {
            thing.interact();
          } else {
            messages.push("You can't play with the " + thing.description + ".");
          }
        }

      }

    }
    
  },
  printInventory: function()
  {
    if (!player.inventory.length)
    {
      messages.push("You don't have any inventory.");
      return;
    }
    for (var i = 0; i < player.inventory.length; i++)
    {
      messages.push("You have " + player.inventory[i].avatar + ", a " + player.inventory[i].description + ".");
    }
  },
  draw: function()
  {
    player.pos = draw_entity("@", player.x, player.y);
  }
};

/* win the game! */
function win_game()
{
  alert("You have conquered the whole game, and the screenings are complete. Congratulations!\n\nTurns: " + turn);
  game_won = true;
  messages.push("Do you want your possessions identified? (Reload to replay!)");
}

/* give the other entities a chance to think */
function end_turn()
{
  /* clear the list of interactable things */
  interactable = [];

  /* make everythink think */
  for (var i = 0; i < entities.length; i++)
  {
    entities[i].think(entities[i]);
  }
  
  /* Increment the turn counter */
  turn++; 
}

/* messages will be added by events in the game world */
function draw_messages()
{
  if (messages.length == 0)
  {
    return;
  }

  blocked_on_message = true;
  var message = messages.pop();
  if (message.length > 74)
  {
    messages.push(message.substring(74,message.length));
    for (var i = 0; i < message.length && i < 74; i++)
    {
      scr[79-i][0] = message.charAt(i);
    }
    scr[79-i++][0] = "-";
    scr[79-i++][0] = "m";
    scr[79-i++][0] = "o";
    scr[79-i++][0] = "r";
    scr[79-i++][0] = "e";
    scr[79-i++][0] = "-";
  } else {
    for (var i = 0; i < message.length && i < 74; i++)
    {
      scr[79-i][0] = message.charAt(i);
    }

    i = 74;
    scr[79-i++][0] = "-";
    scr[79-i++][0] = "o";
    scr[79-i++][0] = "k";
    scr[79-i++][0] = "a";
    scr[79-i++][0] = "y";
    scr[79-i++][0] = "-";
  }
}

/* Used by entities to figure out if they need to draw or not */
function draw_entity(chr, x, y)
{
  screen_minx = cam_x - (screen_x / 2); 
  screen_maxx = cam_x + (screen_x / 2) - 1;
  screen_miny = cam_y - (screen_y / 2);
  screen_maxy = cam_y + (screen_y / 2) - 1;

  if (x < screen_minx || x > screen_maxx)
    return { x: (x - screen_minx), y: (y - screen_miny) }

  if (y < screen_miny || y > screen_maxy)
    return { x: (x - screen_minx), y: (y - screen_miny) }

  scr[x - screen_minx][y - screen_miny] = chr; 
  return { x: (x - screen_minx), y: (y - screen_miny) }
}

/* called every time the game world is drawn */
function entities_draw()
{
  for (var i = 0; i < entities.length; i++)
  {
    entities[i].draw(entities[i]);
  }
  player.draw();
}

/* Set up the container for the screen */
function init_screen()
{
  for (var x = 0; x < screen_x; x++)
    for (var y = 0; y < screen_y; y++)
    {
      /* Initialize multidimensional array properly */
      if (y == 0)
      {
        scr[x] = new Array();
      }
      scr[x][y] = ' ';
      if (x == screen_x/2 && y == screen_y/2) scr[x][y] = 'x';
    }
}

/* Check if this chunk of the world is empty */
function check_empty(x1, y1, x2, y2)
{
  console.log("Entered CHECK_EMPTY (" + x1 + ", " + y1 + ", " + x2 + ", " + y2 + ")");

  if(x1 < 0 || y1 < 0)
  {
    return false;
  }

  if(x2 > world_x || y2 > world_y)
  {
    return false;
  }

  if(x1 == x2 || y1 == y2)
  {
    return false;
  }

  for (var x = x1; x < x2; x++)
    for (var y = y1; y < y2; y++)
    {
      if (world[x][y] != block)
      {
        return false;
      }
    }
      
  return true;
}

/* Generate a random number */
function genRand(min, max)
{
  return Math.floor(Math.random() * (max - min)) + min;
}

/* Fill a chunk of the world with a given character */
function fill(x1, y1, x2, y2, chr)
{
  console.log("Entered FILL (" + x1 + ", " + y1 + ", " + x2 + ", " + y2 + ", " + chr + ")");

  if(x1 < 0 || y1 < 0)
  {
    return false;
  }

  if(x2 > world_x || y2 > world_y)
  {
    return false;
  }

  /* Straight lines */
  if(x1 == x2)
  {
    for (var y = y1; y < y2; y++)
      world[x1][y] = chr;

    return;
  }

  if(y1 == y2)
  {
    for (var x = x1; x < x2; x++)
      world[x][y1] = chr;

    return;
  }

  /* normal case */
  if (x1 > x2)
  {
    var temp = x1;
    x1 = x2;
    x2 = temp;
  }

  if (y1 > y2)
  {
    var temp = y1;
    y1 = y2;
    y2 = temp;
  }

  for (var x = x1; x < x2; x++)
    for (var y = y1; y < y2; y++)
    {
      world[x][y] = chr;
    }
}

/* Create a room sized w, h at x, y */
function create_room(x, y, w, h)
{
  console.log("Entered CREATE_ROOM (" + x + ", " + y + ", " + w + ", " + h + ")");

  /* Check if already occupied, including border */
  var ret = check_empty(x-w/2-1, y-h/2-1, x+w/2+1, y+h/2+1);
  if (!ret) return false;

  /* Create room */

  /* Make a room random */
  var r = genRand(0, 32767);

  /* Track the room for the future */
  var roomId = rooms.push({x: x, y: y, w: w, h: h, rand: r, p: null, i: [], c: []}) - 1;

  /* Blank out the space */
  ret = fill(x-w/2, y-h/2, x+w/2, y+h/2, ' ');

  return roomId;
}

function connect_rooms(cur_room)
{
  console.log("Entering CONNECT_ROOMS");
  /* Recursively connect rooms from the root */
  for (var i = 0; i < cur_room.c.length; i++)
  {
    other_room = rooms[cur_room.c[i]];
    /* Same X (Vertical Corridor) */
    if (cur_room.x == other_room.x)
    {
      if (cur_room.y > other_room.y)
      {     
        fill(cur_room.x, other_room.y, cur_room.x, cur_room.y, ' ');
      } else {
        fill(cur_room.x, cur_room.y, cur_room.x, other_room.y, ' ');
      }
    } else {
    /* Same Y */
      if (cur_room.x > other_room.x)
      {     
        fill(other_room.x, cur_room.y, cur_room.x, cur_room.y, ' ');
      } else {
        fill(cur_room.x, cur_room.y, other_room.x, cur_room.y, ' ');
      }
    }

    /* do the same for all leaves */

    connect_rooms(rooms[cur_room.c[i]]);
  }
}

/* Recursive function to create rooms at the leaves */
function iter_create_room(cur_room)
{
  /* Recursively built out rooms from the leaves */
  for (var i = 0; i < cur_room.c.length; i++)
  {
    iter_create_room(rooms[cur_room.c[i]]);
  }

  /* Attempt to make a new room attached to this room */
  if (cur_room.c.length < 4)
  {
    var roomDir = genRand(0,10)
    if (roomDir < 4)
    {
      var newRoomHeight = Math.floor(genRand(3,15) / 2) * 2;
      var newRoomWidth = Math.floor(genRand(5,50) / 2) * 2;
      var id = false;

      switch (roomDir) 
      {
        case 0: // north
          var y = cur_room.y + cur_room.h/2 + genRand(1,10) + newRoomHeight/2;
          var x = cur_room.x;
          id = create_room(x, y, newRoomWidth, newRoomHeight);
          if (id == false) return;
          break;
        case 1: // south
          var y = cur_room.y - cur_room.h/2 - genRand(1,10) - newRoomHeight/2;
          var x = cur_room.x;
          id = create_room(x, y, newRoomWidth, newRoomHeight);
          if (id == false) return;
          break;
        case 2: // east 
          var y = cur_room.y;
          var x = cur_room.x + cur_room.w/2 + genRand(1,20) + newRoomWidth/2;
          id = create_room(x, y, newRoomWidth, newRoomHeight);
          if (id == false) return;
          break;
        case 3: // west
          var y = cur_room.y;
          var x = cur_room.x - cur_room.w/2 - genRand(1,20) - newRoomWidth/2;
          id = create_room(x, y, newRoomWidth, newRoomHeight);
          if (id == false) return;
          break;
        default: // no room
          return;
      }

      /* Mark child as a child of parent */
      cur_room.c.push(id);

      /* Mark parent as a parent of child */
      rooms[id].p = rooms.indexOf(cur_room);
    } else {
      return;
    }
  }
  return;
}

/* Generate some dungeons, entities, etc. Seed the world. */
function init_world()
{
  console.log("Entered INIT_WORLD");

  /* Start with a solid world */
  for (var x = 0; x < world_x; x++)
    for (var y = 0; y < world_y; y++)
    {
      /* Initialize multidimensional array properly */
      if (y == 0)
      {
        world[x] = new Array();
      }
      world[x][y] = block;
    }

  /* Create start room */
  create_room(world_x/2, world_y/2, 20, 8);

  /* Create some rooms, bfs */
  var cur_room;
  var iter = 0;

  while (iter < 125)
  {
    cur_room = rooms[0];
    iter_create_room(cur_room);
    iter++;
  }

  /* Recursively connect rooms */
  connect_rooms(cur_room);

  /* Put exit in starting room */
  var exit = item_spawn(rooms[0], item_exit);
  exit.interact = function() {
    var has_ladder = false;
    for (var i = 0; i < player.inventory.length; i++)
    {
      if (player.inventory[i].avatar == "L")
      {
        has_ladder = true;
        break;
      }    
    }
    if (has_ladder) {
      win_game();
    } else {
      messages.push("Come back when you've found the ladder...");
    }
  };

  
  /* Put flashlight nearby */
  item_spawn(rooms[genRand(2,3)], item_flashlight);

  /* In last 50% of rooms */
  /* Spawn goal items */
  item_spawn(rooms[genRand(Math.floor(rooms.length/2),rooms.length)], item_ladder);
  /* Spawn bosses */

  /* Everywhere */
  /* Spawn regular enemies */
  /* Spawn regular items */
  
  world_to_canvas();
  
  messages.push("Welcome to Rougish. It's your thirteenth birthday, and by the rules of thevillage you must undergo several screenings before you're allowed to join society as an adult. You've already aced the written and verbal screeningsThere's just the small matter of the game screening. A man yells at you:  Come back when you've cleared the entire game... You'll need a ladder, andyou'll need a flashlight. Hope to god grumpus doesn't find you. Good luck!");

  console.log("Exited INIT_WORLD");
}

/* Draw the container to the screen */
function draw_screen()
{
  var holder = "";

  /* Draw each character */
  for (y = screen_y-1; y >= 0; y--)
    for (x = screen_x-1; x >= 0; x--)
    {
      holder = holder + scr[x][y];
    }

  handle.innerHTML = holder;
}

/* Copy a screen-spaced chunk of the world to the screen buffer */
function copy_world_to_screen(x,y)
{
  console.log("Entered COPY_WORLD_TO_SCREEN (" + x + ", " + y + ")");

  /* Boundary conditions */
  if (x < (screen_x/2))
  {
    x = (screen_x/2);
  }

  if (x >(world_x-(screen_x/2)))
  {
    x = world_x - (screen_x/2);
  }

  if (y < (screen_y/2))
  {
    y = (screen_y/2);
  }

  if (y > (world_y - (screen_y/2)))
  {
    y = world_y - (screen_y/2);
  }

  /* prep to copy */
  x = x - (screen_x / 2);
  y = y - (screen_y / 2);

  for (dy = screen_y - 1; dy >= 0; dy--)
    for (dx = screen_x - 1; dx >= 0; dx--)
    {
      scr[dx][dy] = world[x + dx][y + dy];
    }

  console.log("Exited COPY_WORLD_TO_SCREEN");
}

function cam_move(x, y)
{
  cam_x = x;
  cam_y = y;
  refresh();
}

function setPixel(imageData, x, y, r, g, b, a) {
    index = (x + y * imageData.width) * 4;
    imageData.data[index+0] = r;
    imageData.data[index+1] = g;
    imageData.data[index+2] = b;
    imageData.data[index+3] = a;
}

function world_to_canvas()
{
  c = document.getElementById("world_map").getContext("2d");
  i = c.createImageData(world_x, world_y);
  for (var x = 0; x < world_x; x++)
    for (var y = 0; y < world_y; y++)
    {
      if(world[x][y] == ' ')
      {
        setPixel(i, x, y, 255, 255, 255, 255);
      } else if (world[x][y] == block) {
        setPixel(i, x, y, 10, 10, 10, 255);
      } else {
        setPixel(i, x, y, 250, 10, 10, 255);
      }
    }
  c.putImageData(i, 0, 0);
}

function refresh()
{
  if (player.x - cam_x > 20)
  {
    cam_x++;
  }

  if (cam_x - player.x > 20)
  {
    cam_x--;
  }

  if (player.y - cam_y > 5)
  {
    cam_y++;
  }

  if (cam_y - player.y > 5)
  {
    cam_y--;
  }

  copy_world_to_screen(cam_x, cam_y);
  entities_draw();
  draw_messages();
  draw_screen();
  document.title = "rougish - turn " + turn;
}

/* bind the input handler */
document.onkeydown = checkKey;

function checkKey(e) {
  e = e || window.event;

  if (game_won == true)
    return;

  if (blocked_on_message == true && e.keyCode == '13')
  {
    blocked_on_message = false;
  } else if (blocked_on_message == true) {
    return;
  } 

         if (e.keyCode == '38' || e.keyCode == '75') { /* up */
    player.moveUp();
  } else if (e.keyCode == '40' || e.keyCode == '74') { /* down */
    player.moveDown();
  } else if (e.keyCode == '37' || e.keyCode == '72') { /* left */
    player.moveLeft();
  } else if (e.keyCode == '39' || e.keyCode == '76') { /* right */
    player.moveRight();
  } else if (e.keyCode == '73') { /* i */
    player.printInventory();
  } else if (e.keyCode == '190') { /* . */
    player.interact();
  } else {
    console.log(e.keyCode);
  }

  refresh();
}


init_screen();
init_world();

refresh();
