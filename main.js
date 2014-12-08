/* Variable to hold the screen and stuff */
world = [[]]; /* the world */
seen = [[]]; /* what you've seen */
rooms = []; /* track room centers */
entities = []; /* track things */
messages = []; /* stack of messages to display */
turn = 0; /* what turn is it? */

var scr = [[]]; /* the screen buffer */
var world_x = 2000; /* World size... change me ! :) */
var world_y = 1000; 
var screen_x = 80; /* Screen size. Don't change me... */
var screen_y = 24;
var cam_x = Math.floor(world_x/2); /* The "camera" position */
var cam_y = Math.floor(world_y/2); 
var blocked_on_message = false; /* ignore input other than enter because blocked on a message */
var interactable = []; /* list of things the player can do on this block */
var max_iter = 45; /* how many iterations of dungeon generation to do (minimum 3)*/
var game_won = false;
var game_lost = false;
var use_mode = false;
var last_move = {x:0, y:0}; /* the last move the player made */

/* Special characters */
var full_block = '█';
var dark_block = '▓';
var medium_block = '▒';
var light_block = '░';

/* HTML handle */
var handle = document.getElementById("playarea");

var player = {
  x: Math.floor(world_x/2),
  y: Math.floor(world_y/2),
  health: 100,
  armor: 0,
  lr: 2,
  dmg: 3,
  reach: 2,
  base_health: 100,
  base_armor: 0,
  base_dmg: 3,
  base_reach: 3,
  pos: { x: Math.floor(world_x/2), y: Math.floor(world_y/2) },
  inventory: [],
  moveUp: function() {
    if (world[player.x][player.y + 1] == ' ')
      player.y++; 
      end_turn({x:0,y:1}); 
  },
  moveDown: function() {
    if (world[player.x][player.y - 1] == ' ')
      player.y--;
      end_turn({x:0,y:-1}); 
  },
  moveLeft: function() {
    if (world[player.x + 1][player.y] == ' ')
      player.x++;
      end_turn({x:1,y:0}); 
  },
  moveRight: function() {
    if (world[player.x - 1][player.y] == ' ')
      player.x--;  
      end_turn({x:-1,y:0}); 
  },
  use: function() {
    var msg = "What would you like to use? ";
    for (var i = 0; i < player.inventory.length; i++)
    {
      msg = msg + player.inventory[i].avatar;
    }
    messages.push(msg);
    use_mode = true;
  },
  try_use: function(what) {
    for (var i = 0; i < player.inventory.length; i++)
    {
      if (player.inventory[i].avatar == what)
      {
        if ("use" in player.inventory[i])
        {
          player.inventory[i].use(player.inventory[i]);
          player.inventory.splice(i, 1);
        } else {
          messages.push("You can't use the " + player.inventory[i].description + ".");
        }
        return;
      }
    }
    messages.push("Uh, I'm not sure you have one of those");
  },
  breadcrumb: function() {
    /* Special because of how it interacts */
    var i = JSON.parse(JSON.stringify(item_breadcrumb));
    i.draw = item_draw;
    i.think = function (item) {
      if (item.x == player.x && item.y == player.y)
      {
        interactable.push(item);
      }
    };
    i.x = player.x;
    i.description += turn;
    i.y = player.y;
    i.type = "item";
    i.interact = function (item) {
      messages.push("Here's your " + item.description + ".");
    };
    entities.push(i);
    end_turn({x:0,y:0});
  },
  pickUp: function(thing) {
    player.inventory.push(thing);
    
    interactable.splice(interactable.indexOf(thing), 1);
    entities.splice(entities.indexOf(thing), 1);
    end_turn({x:0,y:0});
  },
  takeDamage: function(source, amount) {
    console.log("Player taking " + amount + " damage (remaining health: " + player.health + ")");
    var damage = amount - player.armor;
    if (damage > 0) 
    {
      player.health -= damage;
    }

    if (player.health <= 0)
    {
      player.die();
    }
  },
  die: function() {
    lose_game(); 
  },
  attack: function() {
    /* this is really painful -- consider optimizing somehow */
    var hit = false;
    for (var i = 0; i < entities.length; i++)
    {
      if (entities[i].type == "enemy" && Math.abs(entities[i].x - player.x) <= player.reach && Math.abs(entities[i].y - player.y) <= player.reach)
      {
        hit = true;
        /* TODO: message depends on equipped weapon */
        messages.push("You manage to damage the " + entities[i].description + "!");
        entities[i].takeDamage(entities[i], player, genRand(1,3) + player.dmg);
      }
    }

    if (!hit) {
      if (genRand(1,20) < 19) {
        messages.push("You flail a bit, but it doesn't accomplish much.");
      } else {
        messages.push("You flail a bit, and manage to hurt yourself. Hah!");
        player.takeDamage(player, genRand(3,5));
      }
    }

    end_turn({x:0,y:0});
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

          if ("onPickup" in thing)
          {
            thing.onPickup();
          }
          continue;
        } else {
          /* Can I interact with it? */
          if (thing.interact)
          {
            thing.interact(thing);
          } else {
            messages.push("You can't play with the " + thing.description + ".");
          }
        }

      }

    }
    
  },
  printStatus: function() {
    messages.push("You evaluate yourself. Health: " + player.health + ", Armor: " + player.armor + ", Light: " + player.lr);
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
    player.pos = draw_entity("@", player.x, player.y, true, false);
  }
};

/* lose the game! */
function lose_game() {
  alert("You have died.\n\nTurns: " + turn);
  game_lost = true;
  messages.unshift("Do you want your possessions identified? (Reload to replay!)");
}

/* win the game! */
function win_game()
{
  alert("You have conquered the whole game, and the screenings are complete. Congratulations!\n\nTurns: " + turn);
  game_won = true;
  messages.push("Do you want your possessions identified? (Reload to replay!)");
}

/* give the other entities a chance to think */
function end_turn(last_action)
{
  /* just in case we need to back out */
  last_move = last_action;

  /* clear the list of interactable things */
  interactable = [];

  /* make everythink think */
  for (var i = 0; i < entities.length; i++)
  {
    entities[i].think(entities[i]);
  }
 
  /* update the seen register based on the player position */
  for (var x = player.x - player.lr; x <= player.x + player.lr; x++)
    for (var y = player.y - player.lr; y <= player.y + player.lr; y++)
      seen[x][y] = true;

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
function draw_entity(chr, x, y, glowing, movable)
{
  screen_minx = cam_x - (screen_x / 2); 
  screen_maxx = cam_x + (screen_x / 2) - 1;
  screen_miny = cam_y - (screen_y / 2);
  screen_maxy = cam_y + (screen_y / 2) - 1;

  if (x < screen_minx || x > screen_maxx)
    return { x: (x - screen_minx), y: (y - screen_miny) }

  if (y < screen_miny || y > screen_maxy)
    return { x: (x - screen_minx), y: (y - screen_miny) }
 
  /* Draw glowing things even if they haven't been seen */ 
  if (!seen[x][y])
  {
    if (!glowing)
      return;
  }
  
  /* Only draw things that are within the light field, or things that don't move that have been seen */
  if (!movable || (Math.abs(x - player.x) <= player.lr && Math.abs(y - player.y) <= player.lr))
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

  /* flip bad input */
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

  /* Straight lines */
  if(x1 == x2)
  {
    for (var y = y1; y < y2; x++)
      if (world[x1][y] < 255)
      {
        return false;
      }
      
    return true;
  }

  if(y1 == y2)
  {
    for (var x = x1; x < x2; x++)
      if (world[x][y1] < 255)
      {
        return false;
      }
      
    return true;
  }

  /* normal case */
  for (var x = x1; x < x2; x++)
    for (var y = y1; y < y2; y++)
    {
      if (world[x][y] < 255)
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

  /* flip bad input */
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
        seen[x] = new Array();
      }
      world[x][y] = dark_block;
      seen[x][y] = false;
    }

  /* Create start room */
  create_room(world_x/2, world_y/2, 20, 8);

  /* Create some rooms, bfs */
  var done_iter = 0;
  
  var iter_func = function() {
    iter_create_room(rooms[0]);

    world_to_canvas();
   
    done_iter++;
    if (done_iter != max_iter)
    {
      setTimeout(iter_func, 0); 
    } else {
      /* Recursively connect rooms */
      connect_rooms(rooms[0]);
      
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
      var flashlight = item_spawn(rooms[genRand(2,3)], item_flashlight);

      flashlight.onPickup = function() {
        player.lr += 3;
      };

      /* Spawn goal items (last 50% of rooms)*/
      item_spawn(rooms[genRand(Math.floor(rooms.length/2),rooms.length)], item_ladder);

      /* Spawn a stick */
      var i = item_spawn(rooms[genRand(Math.floor(rooms.length/4),Math.floor(rooms.length/2))], item_stick);
      i.use = item_weapon_use;

      /* Spawn a shield */  
      i = item_spawn(rooms[genRand(Math.floor(rooms.length/4),Math.floor(rooms.length/2))], item_shield);
      i.use = item_armor_use;

      /* Spawn bosses */
      enemy_spawn(rooms[rooms.length-1], enemies.indexOf(enemy_grumpus));

      /* Everywhere */
      for (var i = 0; i < rooms.length; i++)
      {
        var act = genRand(1,100);
       
        /* Spawn regular enemies */
        if (act < 40) {
          enemy_spawn(rooms[i], enemies.indexOf(enemy_bat));
        } else if (act < 50) {
          enemy_spawn(rooms[i], enemies.indexOf(enemy_kobold));
        }

        /* Spawn regular items */
        if (act > 80) {
          var i = item_spawn(rooms[i], item_cookie);
          i.use = edible_item_use;
        }
      }
        
      world_to_canvas();
        
      messages.push("Welcome to Rougish. It's your thirteenth birthday, and by the rules of thevillage you must undergo several screenings before you're allowed to join society as an adult. You've already aced the written and verbal screeningsThere's just the small matter of the game screening. A man yells at you:  Come back when you've cleared the entire game... You'll need a ladder, andyou'll need a flashlight. Hope to god grumpus doesn't find you. Good luck!");

      refresh();

    }
  };

  setTimeout(iter_func, 0);
  console.log("Exited INIT_WORLD");
}

/* Draw the container to the screen */
function draw_screen()
{
  var holder = "";

  /* Draw each character */
  for (y = screen_y-1; y >= 0; y--)
  {
    for (x = screen_x-1; x >= 0; x--)
    {
      holder = holder + scr[x][y];
    }
    holder = holder + "<br />";
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
      if (Math.abs((x+dx) - player.x) <= player.lr && Math.abs((y+dy) - player.y) <= player.lr)
      {
        /* directly observable */
        scr[dx][dy] = world[x + dx][y + dy];
      } else {
        if (seen[x+dx][y+dy])
        {
          /* saw it */
          scr[dx][dy] = (world[x + dx][y + dy] == dark_block?full_block:medium_block);
        } else {
          /* haven't seen it */
          scr[dx][dy] = full_block;
        } 
      }
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
  /* disabled */
  return;

  /* IE10 is really slow at Canvas... */
  if ("ActiveXObject" in window)
  {
    return;
  }

  console.log("Entered WORLD_TO_CANVAS");
  c = document.getElementById("world_map").getContext("2d");
  i = c.createImageData(world_x, world_y);
  for (var x = 0; x < world_x; x++)
    for (var y = 0; y < world_y; y++)
    {
      if(world[x][y] == ' ')
      {
        setPixel(i, x, y, 255, 255, 255, 255);
      } else if (world[x][y] == dark_block) {
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

function messageHelp() {
  messages.push("Leave a breadcrumb: b | Check status: s ");
  messages.push("Inventory: i | Use: u ");
  messages.push("Interaction: . | Attack: a ");
  messages.push("Movement: Arrow keys or HJKL ");
}

function checkKey(e) {
  e = e || window.event;

  if (game_won == true || game_lost == true)
    return;

  if (e.keyCode == '16') return true; /* eat shifts */

  if (use_mode)
  {
    var chr = String.fromCharCode(e.keyCode);
    if (!e.shiftKey)
    {
      chr = chr.toLowerCase();
    }
    player.try_use(chr);
    refresh();
    use_mode = false;
    return;
  }

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
  } else if (e.keyCode == '66') { /* b */
    player.breadcrumb();
  } else if (e.keyCode == '191') { /* ? */
    messageHelp();
  } else if (e.keyCode == '83') { /* s */
    player.printStatus();
  } else if (e.keyCode == '65') { /* a */
    player.attack();
  } else if (e.keyCode == '85') { /* u */
    player.use();
  } else {
    console.log(e.keyCode);
  }

  refresh();
}

init_screen();
init_world();
