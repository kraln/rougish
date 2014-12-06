/* Variable to hold the screen */
var scr = [[]];
var handle = document.getElementById("playarea");

/* Set up the container for the screen */
function init_screen()
{
  for(var x = 0; x < 80; x++)
    for(var y = 0; y < 24; y++)
    {
      /* Initialize multidimensional array properly */
      if (y == 0)
      {
        scr[x] = new Array();
      }
      scr[x][y] = ' ';
      if(x == 40 && y == 12) scr[x][y] = 'x';
    }
}

/* Draw the container to the screen */
function draw_screen()
{
  var holder = "";

  /* Draw each character */
  for(y = 0; y < 24; y++)
    for(x = 0; x < 80; x++)
    {
      holder = holder + scr[x][y];
    }

  handle.innerHTML = holder;
}

init_screen();
draw_screen();
