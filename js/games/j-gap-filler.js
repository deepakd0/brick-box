// J Gap Filler: rows rise from the bottom; fire down from the top gun to fill gaps.
(function () {
  'use strict';
  const R = BB.ROWS, C = BB.COLS;
  const GUN_ROWS = 2;              // rows 0-1 belong to the gun; the stack must stay below them

  function create(opts) {
    const rng = opts.rng, sfx = opts.sfx || function () {};
    const level = BB.clamp(opts.level | 0 || 1, 1, 10);
    let speed = BB.clamp(opts.speed | 0 || 1, 1, 10);
    const g = { over: false, score: 0, cleared: 0, gx: 3, acc: 0, stack: BB.grid(), bullets: [] };

    function newRow() {
      const gaps = 2 + Math.floor(rng() * 3);    // 2..4 gaps
      const cols = [];
      for (let c = 0; c < C; c++) cols.push(c);
      for (let i = C - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = cols[i]; cols[i] = cols[j]; cols[j] = t; }
      const row = new Array(C).fill(1);
      for (let i = 0; i < gaps; i++) row[cols[i]] = 0;
      return row;
    }
    for (let i = 0; i < level + 1; i++) g.stack[R - 1 - i] = newRow();

    // fill the empty cell (r, c); a full row is cleared and the rows above fall one row
    function land(r, c) {
      if (r < GUN_ROWS) { g.over = true; sfx('die'); return; }
      g.stack[r][c] = 1;
      sfx('drop');
      if (g.stack[r].every(Boolean)) {
        for (let k = r; k > 0; k--) g.stack[k] = g.stack[k - 1];
        g.stack[0] = new Array(C).fill(0);
        g.score = Math.min(999999, g.score + 100 * speed);
        g.cleared++;
        sfx('clear');
        if (g.cleared % 15 === 0 && speed < 10) { speed++; sfx('levelup'); }
      }
    }
    // A bullet that ends up inside a filled cell (stack rose or a cleared row dropped onto it,
    // or a second bullet landed in its cell) stops in the first empty cell above it.
    function landAbove(b) {
      let r = b.r;
      while (r >= 0 && g.stack[r][b.c]) r--;
      land(r, b.c);
    }
    function rise() {
      for (let r = 0; r < R - 1; r++) g.stack[r] = g.stack[r + 1];
      g.stack[R - 1] = newRow();
      if (g.stack[0].some(Boolean) || g.stack[1].some(Boolean)) { g.over = true; sfx('die'); return; }
      // a bullet the stack rose into stops just above that cell
      const live = [];
      for (const b of g.bullets) {
        if (g.stack[b.r][b.c]) { landAbove(b); if (g.over) return; } else live.push(b);
      }
      g.bullets = live;
    }

    g.tick = function (dt) {
      if (g.over) return;
      g.acc += dt;
      const ms = BB.stepMs(speed) * 8;
      while (g.acc >= ms && !g.over) { g.acc -= ms; rise(); }
      if (g.over) return;
      const live = [];
      for (const b of g.bullets) {
        b.acc += dt;
        let alive = true;
        if (g.stack[b.r][b.c]) { landAbove(b); continue; }
        while (alive && b.acc >= 25 && !g.over) {
          b.acc -= 25;
          const nr = b.r + 1;
          if (nr >= R || g.stack[nr][b.c]) { landAbove(b); alive = false; }
          else b.r = nr;
        }
        if (alive) live.push(b);
      }
      // a row cleared by another bullet this tick may have dropped onto a bullet
      g.bullets = live;
      for (let i = 0; i < g.bullets.length && !g.over;) {
        const b = g.bullets[i];
        if (g.stack[b.r][b.c]) { g.bullets.splice(i, 1); landAbove(b); i = 0; } else i++;
      }
    };
    g.input = function (a) {
      if (g.over) return;
      if (a === 'left') g.gx = Math.max(0, g.gx - 1);
      else if (a === 'right') g.gx = Math.min(C - 3, g.gx + 1);
      else if (a === 'fire' && g.bullets.length < 2) {
        g.bullets.push({ r: 1, c: g.gx + 1, acc: 0 });
        sfx('shoot');
      }
    };
    g.view = function () {
      const grid = g.stack.map(function (row) { return row.slice(); });
      for (const b of g.bullets) if (b.r >= GUN_ROWS) grid[b.r][b.c] = 1;
      for (let k = 0; k < 3; k++) grid[0][g.gx + k] = 1;
      grid[1][g.gx + 1] = 1;
      return { grid, next: null, score: g.score, speed, level, lives: null };
    };
    return g;
  }

  BB.register({ id: 'J', name: 'Gap Filler', desc: 'Fill the gaps from above to clear rows', create });
})();
