// H Brick Breaker: diagonal ball, 3-cell paddle, 10 brick patterns.
(function () {
  'use strict';
  const R = BB.ROWS, C = BB.COLS;
  const TOP = 1;                   // first brick row (row 0 is free for the ball)
  const PADDLE_ROW = R - 1;
  // (r, c, rows) -> brick present. One hand-made pattern per level.
  const PATTERNS = [
    function () { return true; },                                                   // 1 solid wall
    function (r, c) { return (r + c) % 2 === 0; },                                  // 2 checker
    function (r) { return r % 2 === 0; },                                           // 3 stripes
    function (r, c) { return c % 2 === 0; },                                        // 4 columns
    function (r, c) { return c >= r && c <= C - 1 - r; },                           // 5 pyramid
    function (r, c, n) { return r === 0 || r === n - 1 || c === 0 || c === C - 1; },// 6 frame
    function (r, c) { return (r + c) % 3 !== 0; },                                  // 7 diagonal stripes
    function (r, c) { return Math.abs(c - 4.5) <= r + 0.5; },                       // 8 V
    function (r, c) { return c !== 4 && c !== 5; },                                 // 9 centre gap
    function (r, c) { return (Math.floor(r / 2) + Math.floor(c / 2)) % 2 === 0; },  // 10 big checker
  ];

  function create(opts) {
    const rng = opts.rng, sfx = opts.sfx || function () {};
    const level = BB.clamp(opts.level | 0 || 1, 1, 10);
    let speed = BB.clamp(opts.speed | 0 || 1, 1, 10);
    const rows = 3 + Math.floor(level / 2);
    const g = {
      over: false, score: 0, lives: 4, flash: 0, t: 0, acc: 0,
      pattern: level - 1, bricks: null, px: 3,
      ball: { r: PADDLE_ROW - 1, c: 4, dr: -1, dc: 1, live: false },
    };

    function buildBricks() {
      g.bricks = BB.grid();
      const f = PATTERNS[g.pattern % PATTERNS.length];
      for (let r = 0; r < rows; r++) for (let c = 0; c < C; c++) if (f(r, c, rows)) g.bricks[TOP + r][c] = 1;
    }
    function hasBrick(r, c) { return r >= 0 && r < R && c >= 0 && c < C && g.bricks[r][c] === 1; }
    function remaining() { return g.bricks.some(function (row) { return row.some(Boolean); }); }
    function hit(r, c) {
      g.bricks[r][c] = 0;
      g.score = Math.min(999999, g.score + 10 * speed);
      sfx('hit');
    }
    function park() { g.ball = { r: PADDLE_ROW - 1, c: g.px + 1, dr: -1, dc: 1, live: false }; }
    function miss() {
      g.lives--;
      sfx('die');
      if (g.lives <= 0) g.over = true; else g.flash = 600;
    }

    function stepBall() {
      const b = g.ball;
      // resolve bounces; capped so a bounce loop can never spin forever
      let nr = b.r + b.dr, nc = b.c + b.dc;
      for (let iter = 0; iter < 4; iter++) {
        let changed = false;
        if (nc < 0 || nc >= C) { b.dc = -b.dc; changed = true; }
        if (nr < 0) { b.dr = -b.dr; changed = true; }
        nr = b.r + b.dr; nc = b.c + b.dc;
        // side, vertical and diagonal neighbours: the ball never slips through a corner
        const side = hasBrick(b.r, nc), vert = hasBrick(nr, b.c), diag = hasBrick(nr, nc);
        if (side) { hit(b.r, nc); b.dc = -b.dc; changed = true; }
        if (vert) { hit(nr, b.c); b.dr = -b.dr; changed = true; }
        if (!side && !vert && diag) { hit(nr, nc); b.dr = -b.dr; b.dc = -b.dc; changed = true; }
        nr = b.r + b.dr; nc = b.c + b.dc;
        if (!changed) break;
      }
      if (nc < 0 || nc >= C || nr < 0 || hasBrick(nr, nc)) {
        // still blocked after the cap: turn around in place instead of moving
        b.dr = -b.dr; b.dc = -b.dc;
        if (!remaining()) nextRound();
        return;
      }
      if (nr >= PADDLE_ROW) {
        const k = nc - g.px;
        if (k >= 0 && k <= 2) {
          b.dr = -1;
          b.dc = k === 0 ? -1 : k === 2 ? 1 : -b.dc;
          sfx('move');
          nr = b.r + b.dr; nc = b.c + b.dc;
          if (nc < 0 || nc >= C) { b.dc = -b.dc; nc = b.c + b.dc; }
          if (nr < 0) { b.dr = -b.dr; nr = b.r + b.dr; }
          if (hasBrick(nr, nc)) { hit(nr, nc); b.dr = -b.dr; nr = b.r + b.dr; }
        } else { miss(); return; }
      }
      b.r = nr; b.c = nc;
      if (!remaining()) nextRound();
    }
    function nextRound() {
      g.pattern++;
      if (speed < 10) speed++;
      sfx('levelup');
      buildBricks();
      park();
    }

    g.tick = function (dt) {
      if (g.over) return;
      g.t += dt;
      if (g.flash > 0) {
        g.flash -= dt;
        if (g.flash <= 0) { g.flash = 0; park(); }
        return;
      }
      if (!g.ball.live) return;
      g.acc += dt;
      const ms = BB.stepMs(speed) * 0.7;
      while (g.acc >= ms && !g.over && g.flash <= 0 && g.ball.live) { g.acc -= ms; stepBall(); }
    };
    g.input = function (a) {
      if (g.over || g.flash > 0) return;
      if (a === 'left' || a === 'right') {
        g.px = BB.clamp(g.px + (a === 'left' ? -1 : 1), 0, C - 3);
        if (!g.ball.live) g.ball.c = g.px + 1;
      } else if ((a === 'fire' || a === 'up') && !g.ball.live) {
        g.ball.live = true;
        g.ball.dr = -1;
        g.ball.dc = rng() < 0.5 ? -1 : 1;
        g.acc = 0;
        sfx('shoot');
      }
    };
    g.view = function () {
      const grid = BB.grid();
      const blinkOff = g.flash > 0 && Math.floor(g.flash / 100) % 2 === 1;
      if (!blinkOff) {
        for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (g.bricks[r][c]) grid[r][c] = 1;
        for (let k = 0; k < 3; k++) grid[PADDLE_ROW][g.px + k] = 1;
        grid[g.ball.r][g.ball.c] = 1;
      }
      return { grid, next: null, score: g.score, speed, level, lives: g.lives };
    };
    buildBricks();
    park();
    return g;
  }

  BB.register({ id: 'H', name: 'Brick Breaker', desc: 'Bounce the ball and clear every brick', create });
})();
