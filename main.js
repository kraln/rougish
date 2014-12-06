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

/* Special characters */
var block = '█';

/* HTML handle */
var handle = document.getElementById("playarea");

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

  /* Check if occupied */
  var ret = check_empty(x-w/2, y-h/2, x+w/2, y+h/2);
  if (!ret) return false;

  /* Create room */

  /* Make a room random */
  var r = genRand(0, 32767);

  /* Track the room for the future */
  var roomId = rooms.push({x: x, y: y, w: w, h: h, rand: r, p: null, c: []}) - 1;

  /* Blank out the space */
  ret = fill(x-w/2, y-h/2, x+w/2, y+h/2, ' ');

  /* TODO: Add random things? */
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

  while (iter < 80)
  {
    cur_room = rooms[0];
    iter_create_room(cur_room);
    iter++;
  }

  /* Recursively connect rooms */
  connect_rooms(cur_room);

  /* Create entrance, exit, and other special rooms */


  world_to_canvas();
  console.log("Exited INIT_WORLD");
}

/* Draw the container to the screen */
function draw_screen()
{
  var holder = "";

  /* Draw each character */
  for (y = 0; y < screen_y; y++)
    for (x = 0; x < screen_x; x++)
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

  for (dy = 0; dy < screen_y; dy++)
    for (dx = 0; dx < screen_x; dx++)
    {
      scr[dx][dy] = world[x + dx][y + dy];
    }

  /* TODO: Copy entities */
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
  copy_world_to_screen(cam_x, cam_y);
  draw_screen();
}

init_screen();
init_world();

refresh();
