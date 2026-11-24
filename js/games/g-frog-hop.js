// G Frog Hop: cross road and river lanes, fill the 5 home slots.
(function () {
  'use strict';
  const R = BB.ROWS, C = BB.COLS;
  // Play area rows (index -> screen row OFF+index): 0 goal, 1-4 river, 5 safe, 6-9 road, 10 start.
  const OFF = 4, GOAL = 0, SAFE = 5, START = 10;
  const isRiver = function (i) { return i >= 1 && i <= 4; };
  const isRoad = function (i) { return i >= 6 && i <= 9; };

  // Circular lane: n objects of length lo..hi, at least minGap free cells between them.
  function makeLane(rng, n, lo, hi, minGap) {
    let lens = [];
    for (let i = 0; i < n; i++) lens.push(lo + Math.floor(rng() * (hi - lo + 1)));
    const fits = function () { return lens.reduce(function (a, b) { return a + b; }, 0) + lens.length * minGap <= C; };
    while (!fits()) {
      let k = 0;
      for (let i = 1; i < lens.length; i++) if (lens[i] > lens[k]) k = i;
      if (lens[k] > lo) lens[k]--; else lens.pop();
    }
    const total = lens.reduce(function (a, b) { return a + b; }, 0);
    let extra = C - total - lens.length * minGap;
    const gaps = lens.map(function () { return minGap; });
    while (extra > 0) { gaps[Math.floor(rng() * gaps.length)]++; extra--; }
    const cells = new Array(C).fill(0);
    let pos = Math.floor(rng() * C);
    for (let i = 0; i < lens.length; i++) {
      for (let k = 0; k < lens[i]; k++) cells[(pos + k) % C] = 1;
      pos += lens[i] + gaps[i];
    }
    return cells;
  }

  function create(opts) {
    const rng = opts.rng, sfx = opts.sfx || function () {};
    const level = BB.clamp(opts.level | 0 || 1, 1, 10);
    let speed = BB.clamp(opts.speed | 0 || 1, 1, 10);
    const g = {
      over: false, score: 0, lives: 4, flash: 0, t: 0,
      frog: { r: START, c: 4 }, homes: [0, 0, 0, 0, 0], lanes: {},
    };
    // Difficulty by level, chosen so every setting fits a 10-cell lane (makeLane would
    // otherwise shrink it silently). [count, min length, max length, min gap]
    //   road:  more and longer cars as the level rises
    //   river: less log to stand on as the level rises (about 70% of the lane at level 1, 30% at 10)
    const ROAD = level <= 3 ? [1, 2, 3, 3] : level <= 7 ? [2, 2, 3, 2] : [2, 3, 3, 2];
    const RIVER = level <= 3 ? [2, 3, 4, 1] : level <= 6 ? [2, 2, 3, 2] : level <= 8 ? [1, 4, 5, 5] : [1, 3, 3, 7];
    for (let i = 1; i <= 9; i++) {
      if (i === SAFE) continue;
      const p = isRoad(i) ? ROAD : RIVER;
      const cells = makeLane(rng, p[0], p[1], p[2], p[3]);
      g.lanes[i] = { cells, dir: i % 2 ? 1 : -1, mult: 1 + rng(), acc: 0 };
    }

    function die() {
      g.lives--;
      sfx('die');
      if (g.lives <= 0) g.over = true; else g.flash = 600;
    }
    function toStart() { g.frog = { r: START, c: 4 }; }
    // true if the frog is safe at its current cell
    function safeHere() {
      const f = g.frog;
      if (isRiver(f.r)) return !!g.lanes[f.r].cells[f.c];
      if (isRoad(f.r)) return !g.lanes[f.r].cells[f.c];
      return true;
    }
    function moveLane(i) {
      const l = g.lanes[i];
      const n = l.cells.length, out = new Array(n);
      for (let c = 0; c < n; c++) out[(c + l.dir + n) % n] = l.cells[c];
      l.cells = out;
      if (g.frog.r === i) {
        if (isRiver(i)) {
          g.frog.c += l.dir;
          if (g.frog.c < 0 || g.frog.c >= C) return die();
        }
        if (!safeHere()) die();
      }
    }

    g.tick = function (dt) {
      if (g.over) return;
      g.t += dt;
      if (g.flash > 0) {
        g.flash -= dt;
        if (g.flash <= 0) { g.flash = 0; toStart(); }
        return;
      }
      for (let i = 1; i <= 9 && !g.over && g.flash <= 0; i++) {
        const l = g.lanes[i];
        if (!l) continue;
        l.acc += dt;
        const ms = BB.stepMs(speed) * l.mult;
        while (l.acc >= ms && !g.over && g.flash <= 0) { l.acc -= ms; moveLane(i); }
      }
    };
    g.input = function (a) {
      if (g.over || g.flash > 0) return;
      const d = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }[a];
      if (!d) return;
      const nr = g.frog.r + d[0], nc = g.frog.c + d[1];
      if (nr < GOAL || nr > START || nc < 0 || nc >= C) return;
      if (nr === GOAL) {
        // only an empty home slot (odd col) can be entered; solid cells block the hop
        if (nc % 2 === 0 || g.homes[(nc - 1) / 2]) return;
        g.homes[(nc - 1) / 2] = 1;
        g.score = Math.min(999999, g.score + 200 * speed);
        sfx('win');
        toStart();
        if (g.homes.every(Boolean)) {
          g.homes = [0, 0, 0, 0, 0];
          if (speed < 10) speed++;
          sfx('levelup');
        }
        return;
      }
      g.frog = { r: nr, c: nc };
      sfx('move');
      if (!safeHere()) die();
    };
    g.view = function () {
      const grid = BB.grid();
      const blinkOff = g.flash > 0 && Math.floor(g.flash / 100) % 2 === 1;
      if (!blinkOff) {
        for (let c = 0; c < C; c++) grid[OFF + GOAL][c] = c % 2 === 0 ? 1 : g.homes[(c - 1) / 2];
        for (const k in g.lanes) for (let c = 0; c < C; c++) if (g.lanes[k].cells[c]) grid[OFF + (+k)][c] = 1;
        // the frog blinks (steady while the screen flashes)
        if (Math.floor(g.t / 180) % 2 === 0) grid[OFF + g.frog.r][g.frog.c] = 1;
        else if (isRiver(g.frog.r) || isRoad(g.frog.r)) grid[OFF + g.frog.r][g.frog.c] = 0;
      }
      return { grid, next: null, score: g.score, speed, level, lives: g.lives };
    };
    return g;
  }

  BB.register({ id: 'G', name: 'Frog Hop', desc: 'Cross the road and ride the logs home', create });
})();
