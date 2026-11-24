// K Copy Cat: copy the shown pattern into the input box before the bar runs out.
(function () {
  'use strict';
  const R = BB.ROWS, C = BB.COLS;
  const BOX_TOP = 14, TARGET_TOP = 1, BAR_ROW = 18;

  function create(opts) {
    const rng = opts.rng, sfx = opts.sfx || function () {};
    const level = BB.clamp(opts.level | 0 || 1, 1, 10);
    let speed = BB.clamp(opts.speed | 0 || 1, 1, 10);
    const bw = level >= 4 ? 5 : 3;                 // input box width
    const bx = Math.floor((C - bw) / 2);           // box (and target) left column
    const cells = Math.min(12, 3 + level);
    const g = {
      over: false, score: 0, lives: 4, correct: 0, flash: 0, t: 0,
      target: null, mine: null, cur: { r: 1, c: Math.floor(bw / 2) }, time: 0, total: 0,
    };

    // random 3 x w shape (w 3..bw) with a cell in its first and last column, centred in the box
    function newPattern() {
      const wmin = Math.max(3, Math.ceil(cells / 3));
      const w = wmin + Math.floor(rng() * (bw - wmin + 1));
      const free = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < w; c++) free.push([r, c]);
      const pick = function (filter) {
        const opts2 = free.filter(filter);
        const p = opts2[Math.floor(rng() * opts2.length)];
        free.splice(free.indexOf(p), 1);
        return p;
      };
      const chosen = [pick(function (p) { return p[1] === 0; }), pick(function (p) { return p[1] === w - 1; })];
      while (chosen.length < cells) chosen.push(pick(function () { return true; }));
      const off = Math.floor((bw - w) / 2);
      g.target = [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]];
      for (const p of chosen) g.target[p[0]][off + p[1]] = 1;
      g.mine = [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]];
      g.cur = { r: 1, c: Math.floor(bw / 2) };
      g.total = BB.stepMs(speed) * 40;
      g.time = g.total;
    }
    function lose() {
      g.lives--;
      sfx('die');
      if (g.lives <= 0) g.over = true; else g.flash = 600;
    }
    function submit() {
      let ok = true;
      for (let r = 0; r < 3; r++) for (let c = 0; c < bw; c++) if (g.target[r][c] !== g.mine[r][c]) ok = false;
      if (!ok) { lose(); return; }
      g.score = Math.min(999999, g.score + 50 * speed);
      g.correct++;
      sfx('win');
      if (g.correct % 5 === 0 && speed < 10) { speed++; sfx('levelup'); }
      newPattern();
    }

    g.tick = function (dt) {
      if (g.over) return;
      g.t += dt;
      if (g.flash > 0) {
        g.flash -= dt;
        if (g.flash <= 0) { g.flash = 0; newPattern(); }
        return;
      }
      g.time -= dt;
      if (g.time <= 0) { g.time = 0; lose(); }
    };
    g.input = function (a) {
      if (g.over || g.flash > 0) return;
      const c = g.cur;
      if (a === 'left') c.c = Math.max(0, c.c - 1);
      else if (a === 'right') c.c = Math.min(bw - 1, c.c + 1);
      else if (a === 'up') c.r = Math.max(0, c.r - 1);
      else if (a === 'down') { if (c.r === 2) submit(); else c.r++; }
      else if (a === 'fire') { g.mine[c.r][c.c] ^= 1; sfx('move'); }
    };
    g.view = function () {
      const grid = BB.grid();
      const blinkOff = g.flash > 0 && Math.floor(g.flash / 100) % 2 === 1;
      if (!blinkOff) {
        for (let r = 0; r < 3; r++) for (let c = 0; c < bw; c++) {
          grid[TARGET_TOP + r][bx + c] = g.target[r][c];
          grid[BOX_TOP + r][bx + c] = g.mine[r][c];
        }
        // box edges: dotted lines above and below the input area
        for (let c = 0; c < bw; c += 2) { grid[BOX_TOP - 1][bx + c] = 1; grid[BOX_TOP + 3][bx + c] = 1; }
        // cursor blinks
        if (g.flash <= 0) grid[BOX_TOP + g.cur.r][bx + g.cur.c] = Math.floor(g.t / 150) % 2 === 0 ? 1 : 0;
        // time bar: 10 cells shrinking to 0
        const n = g.total ? Math.ceil(10 * g.time / g.total) : 0;
        for (let c = 0; c < Math.min(10, n); c++) grid[BAR_ROW][c] = 1;
      }
      return { grid, next: null, score: g.score, speed, level, lives: g.lives };
    };
    newPattern();
    return g;
  }

  BB.register({ id: 'K', name: 'Copy Cat', desc: 'Copy the pattern before time runs out', create });
})();
