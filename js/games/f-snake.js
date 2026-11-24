// F Snake: one cell per step, food blinks, 10 wall patterns by level.
(function () {
  'use strict';
  const R = BB.ROWS, C = BB.COLS;
  // Base cells in the left half; each is mirrored to the right half (col 9-c).
  // Level n uses the first (n-1) base cells, so (n-1) x 2 wall blocks. Cols 4/5 stay free (snake start).
  const PATTERNS = [
    [[1,1],[18,1],[1,2],[18,2],[2,1],[17,1],[1,3],[18,3],[3,1]],      // corners
    [[4,1],[15,1],[4,2],[15,2],[4,3],[15,3],[5,1],[14,1],[5,2]],      // top/bottom bars
    [[6,2],[13,2],[7,2],[12,2],[8,2],[11,2],[5,2],[14,2],[9,2]],      // centre bars
    [[0,0],[19,0],[1,0],[18,0],[2,0],[17,0],[3,0],[16,0],[9,0]],      // borders
    [[2,1],[17,1],[3,2],[16,2],[4,3],[15,3],[1,0],[18,0],[5,3]],      // diagonals
    [[3,3],[16,3],[4,3],[15,3],[5,3],[14,3],[6,3],[13,3],[2,3]],      // columns
    [[1,1],[18,1],[2,2],[17,2],[3,3],[16,3],[8,1],[11,1],[9,1]],      // stairs
    [[2,2],[17,2],[5,1],[14,1],[7,3],[12,3],[9,1],[3,3],[16,3]],      // scattered
    [[4,1],[15,1],[5,1],[14,1],[6,1],[13,1],[7,1],[12,1],[8,1]],      // side bars
    [[2,2],[17,2],[2,3],[17,3],[3,2],[16,2],[4,2],[15,2],[5,2]],      // inner frame
  ];

  function create(opts) {
    const rng = opts.rng, sfx = opts.sfx || function () {};
    const level = BB.clamp(opts.level | 0 || 1, 1, 10);
    let speed = BB.clamp(opts.speed | 0 || 1, 1, 10);
    const walls = BB.grid();
    const base = PATTERNS[level - 1];
    for (let i = 0; i < (level - 1) && i < base.length; i++) {
      walls[base[i][0]][base[i][1]] = 1;
      walls[base[i][0]][C - 1 - base[i][1]] = 1;
    }
    const DIRS = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };
    const g = {
      over: false, score: 0, lives: 4, foods: 0,
      snake: null, dir: null, queue: [], acc: 0, food: null, flash: 0, t: 0,
    };

    function placeFood() {
      const free = [];
      const occ = BB.grid();
      for (const p of g.snake) occ[p[0]][p[1]] = 1;
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (!occ[r][c] && !walls[r][c]) free.push([r, c]);
      g.food = free.length ? free[Math.floor(rng() * free.length)] : null;
    }
    function reset() {
      g.snake = [[10, 5], [11, 5], [12, 5]];
      g.dir = DIRS.up;
      g.queue = [];
      g.acc = 0;
      placeFood();
    }
    function die() {
      g.lives--;
      sfx('die');
      if (g.lives <= 0) g.over = true; else g.flash = 600;
    }
    function step() {
      // take the first buffered turn that is not a reversal or a repeat of the heading
      while (g.queue.length) {
        const d = g.queue.shift();
        if (d[0] === -g.dir[0] && d[1] === -g.dir[1]) continue;
        if (d[0] === g.dir[0] && d[1] === g.dir[1]) continue;
        g.dir = d; break;
      }
      const h = g.snake[0];
      const nr = h[0] + g.dir[0], nc = h[1] + g.dir[1];
      if (nr < 0 || nr >= R || nc < 0 || nc >= C || walls[nr][nc]) return die();
      const eat = g.food && g.food[0] === nr && g.food[1] === nc;
      const body = eat ? g.snake : g.snake.slice(0, -1);
      if (body.some(function (p) { return p[0] === nr && p[1] === nc; })) return die();
      g.snake.unshift([nr, nc]);
      if (eat) {
        g.score = Math.min(999999, g.score + 10 * speed);
        g.foods++;
        sfx('eat');
        if (g.foods % 10 === 0 && speed < 10) { speed++; sfx('levelup'); }
        placeFood();
      } else g.snake.pop();
    }

    g.tick = function (dt) {
      if (g.over) return;
      g.t += dt;
      if (g.flash > 0) {
        g.flash -= dt;
        if (g.flash <= 0) { g.flash = 0; reset(); }
        return;
      }
      g.acc += dt;
      const ms = BB.stepMs(speed) * 0.6;
      while (g.acc >= ms && !g.over && g.flash <= 0) { g.acc -= ms; step(); }
    };
    g.input = function (a) {
      if (g.over || g.flash > 0) return;
      const d = DIRS[a];
      if (!d) return;
      if (g.queue.length < 2) g.queue.push(d);
    };
    g.view = function () {
      const grid = BB.grid();
      const blinkOff = g.flash > 0 && Math.floor(g.flash / 100) % 2 === 1;
      if (!blinkOff) {
        for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (walls[r][c]) grid[r][c] = 1;
        for (const p of g.snake) grid[p[0]][p[1]] = 1;
        if (g.food && Math.floor(g.t / 150) % 2 === 0) grid[g.food[0]][g.food[1]] = 1;
      }
      return { grid, next: null, score: g.score, speed, level, lives: g.lives };
    };
    reset();
    return g;
  }

  BB.register({ id: 'F', name: 'Snake', desc: 'Eat, grow, and do not bite yourself', create });
})();
