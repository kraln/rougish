enemy_bat = {
  avatar: "w",
  description: "really ugly bat",
  health: 20,
  range: 1,
  enemy_draw: base_enemy_draw,
  attack: function(enemy) {
    var outcome = genRand(1,10);
    if (outcome < 4)
    {
      messages.push("The " + enemy.description + " attacks!");
      player.takeDamage(enemy, outcome);
      return;
    } else if (outcome < 9) {
      messages.push("The " + enemy.description + " attacks! and misses...");
      return;
    } else {
      messages.push("The " + enemy.description + " attacks! and hurts itself.");
      enemy.takeDamage(enemy, enemy, genRand(1,5));
    }
  },

  enemy_think: function(enemy) {
    var try_x = 0;
    var try_y = 0;

    if (enemy.x == player.x && enemy.y == player.y) {
      /* try to move one step away */
      try_x = genRand(0,2) - 1;
      try_y = genRand(0,2) - 1;
      if (try_x == try_y == 0)
      {
        try_x = 1; /* randomly selected! */
      }
    } else if (Math.abs(enemy.x - player.x) <= player.lr && Math.abs(enemy.y - player.y) <= player.lr) {
      /* if within light radius of player, move towards player */
      if (enemy.x > player.x) {
        try_x = -1;
      } else if (enemy.x < player.x) {
        try_x = 1;
      } 
      if (enemy.y > player.y) {
        try_y = -1;
      } else if (enemy.y < player.y) {
        try_y = 1;
      } 
    } else {
      /* wander aimlessly */
      try_x = genRand(0,2) - 1;
      try_y = genRand(0,2) - 1;
    }
 
    /* move something like 30% of the time */ 
    if (world[enemy.x + try_x][enemy.y + try_y] < 255 && (genRand(1,10) < 4))
    {
      enemy.x += try_x;
      enemy.y += try_y;
    }

    /* bats have a reach of one */
    if (Math.abs(enemy.x - player.x) <= enemy.range && Math.abs(enemy.y - player.y) <= enemy.range) {
      enemy.attack(enemy);
    }
  },
  takeDamage: function(enemy, source, amount){
    console.log("Enemy taking " + amount + " damage (health: " + enemy.health + ")");
    enemy.health -= amount;
    if (enemy.health <= 0)
    {
      enemy.die(enemy);
    }
  },
  die: function(enemy) {
    messages.unshift("The " + enemy.description + " dies.");

    /* remove self from entities list */
    entities.splice(entities.indexOf(enemy), 1);
    
    /* maybe drop an item? */
    if (genRand(1,10) > 7) 
    {
      var i = item_spawn_at(enemy.x, enemy.y, item_cookie);
      i.use = edible_item_use;
    }
  }
};

enemy_grumpus = {
  avatar: "G",
  description: "hideous grumpus",
  health: 75,
  range: 2,
  enemy_draw: base_enemy_draw,
  attack: function(enemy) {
    var outcome = genRand(1,10);
    if (outcome < 4)
    {
      messages.push("The " + enemy.description + " attacks!");
      player.takeDamage(enemy, outcome*2);
      return;
    } else if (outcome < 9) {
      messages.push("The " + enemy.description + " attacks! and misses...");
      return;
    } else {
      messages.push("The " + enemy.description + " attacks! and hurts itself.");
      enemy.takeDamage(enemy, enemy, genRand(5,8));
    }
  },

  enemy_think: function(enemy) {
    var try_x = 0;
    var try_y = 0;

    if (enemy.x == player.x && enemy.y == player.y) {
      /* try to move one step away */
      try_x = genRand(0,2) - 1;
      try_y = genRand(0,2) - 1;
      if (try_x == try_y == 0)
      {
        try_x = 1; /* randomly selected! */
      }
    } else if (Math.abs(enemy.x - player.x) <= (player.lr*2) && Math.abs(enemy.y - player.y) <= (player.lr*2)) {
      /* if within light radius of player * 2, move towards player */
      if (enemy.x > player.x) {
        try_x = -1;
      } else if (enemy.x < player.x) {
        try_x = 1;
      } 
      if (enemy.y > player.y) {
        try_y = -1;
      } else if (enemy.y < player.y) {
        try_y = 1;
      } 
    } else {
      /* wander aimlessly */
      try_x = genRand(0,2) - 1;
      try_y = genRand(0,2) - 1;
    }
 
    /* move something like 70% of the time */ 
    if (world[enemy.x + try_x][enemy.y + try_y] < 255 && (genRand(1,10) < 8))
    {
      enemy.x += try_x;
      enemy.y += try_y;
    }

    /* grumpuses have a reach of two */
    if (Math.abs(enemy.x - player.x) <= enemy.range && Math.abs(enemy.y - player.y) <= enemy.range) {
      enemy.attack(enemy);
    }
  },
  takeDamage: function(enemy, source, amount){
    console.log("Enemy taking " + amount + " damage (health: " + enemy.health + ")");
    enemy.health -= amount;
    if (enemy.health <= 0)
    {
      enemy.die(enemy);
    }
  },
  die: function(enemy) {
    messages.unshift("The " + enemy.description + " dies. Hooray!");

    /* remove self from entities list */
    entities.splice(entities.indexOf(enemy), 1);
    
    /* definitely drop an item */
    var i = item_spawn_at(enemy.x, enemy.y, item_cookie);
    i.use = edible_item_use;
  }
};

enemies = [enemy_bat,enemy_grumpus,];

function base_enemy_draw(enemy)
{
  draw_entity(enemy.avatar, enemy.x, enemy.y, ("glowing" in enemy), true);
}

function enemy_spawn(room, enemy_idx)
{
  /* First clone */
  enemy = enemies[enemy_idx];
  console.log("Spawning enemy: " + enemy.description);

  /* XXX: Erases all functions */
  var e = JSON.parse(JSON.stringify(enemy)); 

  /* all enemies think and draw differently */
  e.draw = enemies[enemy_idx].enemy_draw;
  e.think = enemies[enemy_idx].enemy_think;
  e.attack = enemies[enemy_idx].attack;
  e.takeDamage = enemies[enemy_idx].takeDamage;
  e.die = enemies[enemy_idx].die;
  e.type = "enemy";

  /* put item into room */
  e.x = Math.floor(room.x - (room.w/2) + genRand(1, room.w-2));
  e.y = Math.floor(room.y - (room.h/2) + genRand(1, room.h-2));
  
  /* give the item a reference to the room it spawned in */
  e.r = room;

  /* Push the item into the entity pool */
  entities.push(e);

  return e;
}
