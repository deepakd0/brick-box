// I Row Blaster: a wall comes down from the top; shoot it from the gun at the bottom.
(function () {
  'use strict';
  const R = BB.ROWS, C = BB.COLS;
  const GUN_ROW = R - 2;           // top row of the gun (the barrel); the base is the row below

  function create(opts) {
    const rng = opts.rng, sfx = opts.sfx || function () {};
    const level = BB.clamp(opts.level | 0 || 1, 1, 10);
    const startSpeed = BB.clamp(opts.speed | 0 || 1, 1, 10);
    let speed = startSpeed;
    const g = { over: false, score: 0, shot: 0, gx: 3, acc: 0, wall: BB.grid(), bullets: [] };

    function newRow() {
      const k = 5 + Math.floor(rng() * 4);       // 5..8 filled cells
      const cols = [];
      for (let c = 0; c < C; c++) cols.push(c);
      for (let i = C - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = cols[i]; cols[i] = cols[j]; cols[j] = t; }
      const row = new Array(C).fill(0);
      for (let i = 0; i < k; i++) row[cols[i]] = 1;
      return row;
    }
    for (let r = 0; r < level + 2; r++) g.wall[r] = newRow();

    function add(n) { g.score = Math.min(999999, g.score + n); }
    // remove one block; an emptied row is removed and the rows below it close up
    function shoot(r, c) {
      g.wall[r][c] = 0;
      add(10);
      g.shot++;
      sfx('hit');
      if (g.shot % 40 === 0 && speed < 10) { speed++; sfx('levelup'); }
      if (!g.wall[r].some(Boolean)) {
        for (let k = r; k < R - 1; k++) g.wall[k] = g.wall[k + 1];
        g.wall[R - 1] = new Array(C).fill(0);
        add(50 * speed);
        sfx('clear');
      }
    }
    function dropWall() {
      for (let r = R - 1; r > 0; r--) g.wall[r] = g.wall[r - 1];
      g.wall[0] = newRow();
      if (g.wall[GUN_ROW].some(Boolean) || g.wall[GUN_ROW + 1].some(Boolean)) { g.over = true; sfx('die'); return; }
      // a block that landed on a bullet is shot by it
      g.bullets = g.bullets.filter(function (b) {
        if (g.wall[b.r][b.c]) { shoot(b.r, b.c); return false; }
        return true;
      });
    }

    g.tick = function (dt) {
      if (g.over) return;
      g.acc += dt;
      const ms = BB.stepMs(speed) * 6;
      while (g.acc >= ms && !g.over) { g.acc -= ms; dropWall(); }
      const live = [];
      for (const b of g.bullets) {
        b.acc += dt;
        let alive = true;
        while (alive && b.acc >= 25) {
          b.acc -= 25;
          b.r--;
          if (b.r < 0) alive = false;
          else if (g.wall[b.r][b.c]) { shoot(b.r, b.c); alive = false; }
        }
        if (alive) live.push(b);
      }
      g.bullets = live;
    };
    g.input = function (a) {
      if (g.over) return;
      if (a === 'left') g.gx = Math.max(0, g.gx - 1);
      else if (a === 'right') g.gx = Math.min(C - 3, g.gx + 1);
      else if (a === 'fire' && g.bullets.length < 2) {
        g.bullets.push({ r: GUN_ROW, c: g.gx + 1, acc: 0 });
        sfx('shoot');
      }
    };
    g.view = function () {
      const grid = g.wall.map(function (row) { return row.slice(); });
      for (const b of g.bullets) if (b.r >= 0 && b.r < GUN_ROW) grid[b.r][b.c] = 1;
      grid[GUN_ROW][g.gx + 1] = 1;
      for (let k = 0; k < 3; k++) grid[GUN_ROW + 1][g.gx + k] = 1;
      return { grid, next: null, score: g.score, speed, level, lives: null };
    };
    return g;
  }

  BB.register({ id: 'I', name: 'Row Blaster', desc: 'Shoot the wall before it reaches you', create });
})();
