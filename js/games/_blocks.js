// Shared falling-block engine for games A, B, C and L.
// Exposes BB.blocks = { make(opts, config), CLASSIC, ODD, rise(state) }.
// config = {
//   pieces: array of shapes (each a list of [row, col] cells),
//   gunEvery: every Nth piece is a gun (optional),
//   afterLock(s): hook run once a piece is locked and its rows are cleared, before the next spawn
// }
(function () {
  'use strict';
  const ROWS = BB.ROWS, COLS = BB.COLS;
  const CLEAR_MS = 300, BLINK_MS = 50, GUN_SHOTS = 20, GUN_DOWN_MS = 1000;
  const POINTS = [0, 100, 300, 600, 1000];

  const CLASSIC = [
    [[0, 0], [0, 1], [0, 2], [0, 3]],          // I
    [[0, 0], [0, 1], [1, 0], [1, 1]],          // O
    [[0, 1], [1, 0], [1, 1], [1, 2]],          // T
    [[0, 1], [0, 2], [1, 0], [1, 1]],          // S
    [[0, 0], [0, 1], [1, 1], [1, 2]],          // Z
    [[0, 0], [1, 0], [1, 1], [1, 2]],          // J
    [[0, 2], [1, 0], [1, 1], [1, 2]],          // L
  ];
  const ODD = [
    [[0, 0]],                                              // dot
    [[0, 0], [0, 1]],                                      // 2-cell bar
    [[0, 0], [1, 0], [1, 1]],                              // 3-cell corner
    [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]],              // plus
    [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]],              // U
  ];

  function size(cells) {
    let h = 0, w = 0;
    for (const [r, c] of cells) { if (r + 1 > h) h = r + 1; if (c + 1 > w) w = c + 1; }
    return { h, w };
  }
  // Rotate clockwise inside the bounding box, then move back to the top-left corner.
  function rotate(cells) {
    const { h } = size(cells);
    const out = cells.map(([r, c]) => [c, h - 1 - r]);
    let mr = Infinity, mc = Infinity;
    for (const [r, c] of out) { if (r < mr) mr = r; if (c < mc) mc = c; }
    return out.map(([r, c]) => [r - mr, c - mc]);
  }

  // Push the board up one row and add a junk row with one random gap at the bottom.
  // Sets s.over (and does not push) if a filled cell sits on row 0.
  function rise(s, rng) {
    if (s.board[0].some(Boolean)) { s.over = true; s.piece = null; return false; }
    s.board.shift();
    const row = new Array(COLS).fill(1);
    row[Math.floor((rng || s.rng)() * COLS)] = 0;
    s.board.push(row);
    return true;
  }

  function junkRow(rng) {
    const n = 6 + Math.floor(rng() * 3);   // 6..8 filled cells, so 2..4 gaps
    const cols = [];
    for (let i = 0; i < COLS; i++) cols.push(i);
    for (let i = COLS - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = cols[i]; cols[i] = cols[j]; cols[j] = t; }
    const row = new Array(COLS).fill(0);
    for (let i = 0; i < n; i++) row[cols[i]] = 1;
    return row;
  }

  function make(opts, cfg) {
    const rng = opts.rng, sfx = opts.sfx || function () {};
    const held = opts.held || function () { return false; };
    const startSpeed = BB.clamp(opts.speed | 0 || 1, 1, 10);
    const level = BB.clamp(opts.level | 0 || 1, 1, 10);
    const s = {
      board: BB.grid(), piece: null, next: null,
      score: 0, speed: startSpeed, level, rows: 0, locked: 0, pieceNo: 0,
      bag: [], acc: 0, pending: false, clear: null, over: false, downHeld: 0, rng,
    };

    function addScore(n) { s.score = Math.min(999999, s.score + n); }

    function genPiece() {
      s.pieceNo++;
      if (cfg.gunEvery && s.pieceNo % cfg.gunEvery === 0) return { cells: [[0, 0]], gun: true };
      if (!s.bag.length) {
        for (let i = 0; i < cfg.pieces.length; i++) s.bag.push(i);
        for (let i = s.bag.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = s.bag[i]; s.bag[i] = s.bag[j]; s.bag[j] = t; }
      }
      return { cells: cfg.pieces[s.bag.pop()].map((p) => p.slice()), gun: false };
    }

    function collides(cells, r, c) {
      for (const [dr, dc] of cells) {
        const rr = r + dr, cc = c + dc;
        if (cc < 0 || cc >= COLS || rr >= ROWS) return true;
        if (rr >= 0 && s.board[rr][cc]) return true;
      }
      return false;
    }

    function spawn() {
      const n = s.next;
      const { w } = size(n.cells);
      s.next = genPiece();
      s.acc = 0; s.pending = false; s.downHeld = 0;
      const p = { cells: n.cells, gun: n.gun, r: 0, c: Math.floor((COLS - w) / 2), shots: 0 };
      if (collides(p.cells, p.r, p.c)) { s.over = true; s.piece = null; return; }
      s.piece = p;
    }

    function fullRows() {
      const rows = [];
      for (let r = 0; r < ROWS; r++) if (s.board[r].every(Boolean)) rows.push(r);
      return rows;
    }

    function startClearIfAny() {
      const rows = fullRows();
      if (!rows.length) return false;
      s.clear = { rows, t: 0 };
      sfx('clear');
      return true;
    }

    function afterStable() {
      s.locked++;
      if (cfg.afterLock) cfg.afterLock(s);
      if (!s.over) spawn();
    }

    function lock() {
      const p = s.piece;
      for (const [dr, dc] of p.cells) {
        const rr = p.r + dr;
        if (rr < 0) { s.over = true; s.piece = null; return; }
        s.board[rr][p.c + dc] = 1;
      }
      s.piece = null;
      sfx('drop');
      if (!startClearIfAny()) afterStable();
    }

    function finishClear() {
      const rows = s.clear.rows;
      const keep = s.board.filter((_, r) => rows.indexOf(r) < 0);
      while (keep.length < ROWS) keep.unshift(new Array(COLS).fill(0));
      s.board = keep;
      addScore(POINTS[Math.min(rows.length, 4)] * s.speed);
      s.rows += rows.length;
      const sp = Math.min(10, startSpeed + Math.floor(s.rows / 10));
      if (sp > s.speed) { s.speed = sp; sfx('levelup'); }
      s.clear = null;
      if (s.piece) {
        // a gun shot cleared rows: make sure the gun is not inside a block
        const p = s.piece;
        while (p.r >= 0 && collides(p.cells, p.r, p.c)) p.r--;
        if (p.r < 0) { s.piece = null; afterStable(); }
        else if (p.gun && p.shots >= GUN_SHOTS) lock();
      } else afterStable();
    }

    function gravityStep() {
      const p = s.piece;
      if (!collides(p.cells, p.r + 1, p.c)) { p.r++; s.pending = false; return; }
      if (!s.pending) { s.pending = true; return; }   // one more step of lock delay
      lock();
    }

    function shoot() {
      const p = s.piece, col = p.c;
      p.shots++;
      let f = -1;
      for (let rr = p.r - 1; rr >= 0; rr--) if (s.board[rr][col]) { f = rr; break; }
      if (f >= 0) {
        if (f + 1 < p.r) s.board[f + 1][col] = 1;            // fill the empty cell under the first block
        else {                                               // column full to the gun: remove the top block
          let rr = f;
          while (rr - 1 >= 0 && s.board[rr - 1][col]) rr--;
          s.board[rr][col] = 0;
        }
        sfx('shoot');
      }
      if (startClearIfAny()) return;
      if (p.shots >= GUN_SHOTS) lock();
    }

    function tick(dt) {
      if (s.over) return;
      let rem = dt;
      while (rem > 0 && !s.over) {
        if (s.clear) {
          const use = Math.min(rem, CLEAR_MS - s.clear.t);
          s.clear.t += use; rem -= use;
          if (s.clear.t >= CLEAR_MS) finishClear();
          continue;
        }
        if (!s.piece) break;
        const step = BB.stepMs(s.speed);
        const use = Math.min(rem, step - s.acc);
        s.acc += use; rem -= use;
        if (s.piece.gun) {
          s.downHeld = held('down') ? s.downHeld + use : 0;
          if (s.downHeld >= GUN_DOWN_MS) { lock(); continue; }
        }
        if (s.acc >= step) { s.acc = 0; gravityStep(); }
      }
    }

    function input(a) {
      if (s.over || s.clear || !s.piece) return;
      const p = s.piece;
      if (a === 'left' || a === 'right') {
        const d = a === 'left' ? -1 : 1;
        if (!collides(p.cells, p.r, p.c + d)) { p.c += d; sfx('move'); }
      } else if (a === 'down') {
        if (!collides(p.cells, p.r + 1, p.c)) { p.r++; s.pending = false; s.acc = 0; addScore(1); }
        else lock();
      } else if (a === 'up' || a === 'fire') {
        if (p.gun) { if (a === 'fire') shoot(); return; }
        const rc = rotate(p.cells);
        for (const k of [0, -1, 1, -2, 2]) {
          if (!collides(rc, p.r, p.c + k)) { p.cells = rc; p.c += k; sfx('rotate'); return; }
        }
      }
    }

    function view() {
      const g = s.board.map((r) => r.slice());
      if (s.clear && Math.floor(s.clear.t / BLINK_MS) % 2 === 1) for (const r of s.clear.rows) g[r].fill(0);
      if (s.piece) {
        for (const [dr, dc] of s.piece.cells) {
          const rr = s.piece.r + dr, cc = s.piece.c + dc;
          if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS) g[rr][cc] = 1;
        }
      }
      let next = null;
      if (s.next) {
        next = BB.grid(4, 4);
        const { h, w } = size(s.next.cells);
        const or = Math.floor((4 - h) / 2), oc = Math.floor((4 - w) / 2);
        for (const [r, c] of s.next.cells) next[or + r][oc + c] = 1;
      }
      return { grid: g, next, score: s.score, speed: s.speed, level: s.level, lives: null };
    }

    // start junk: level n adds n-1 rows (max 9)
    const junk = Math.min(9, level - 1);
    for (let i = 0; i < junk; i++) s.board[ROWS - 1 - i] = junkRow(rng);
    s.next = genPiece();
    spawn();

    return { tick, input, view, get over() { return s.over; }, _s: s };
  }

  BB.blocks = { make, rise, CLASSIC, ODD, junkRow };
})();
