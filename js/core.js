// Brick Box core: the contract every game follows. Plain script, no modules.
// Loaded first by laptop.html / phone.html and by tests/smoke.mjs (in a vm).
(function (root) {
  'use strict';
  const ROWS = 20, COLS = 10;

  // Base step time per speed 1..10 (ms). Games derive their own timers from it.
  const SPEED_MS = [0, 800, 680, 570, 480, 400, 330, 270, 220, 175, 135];

  const BB = {
    ROWS, COLS, SPEED_MS,
    games: {},   // id -> def
    order: [],   // ids in A..L order after sort

    // def = { id:'A', name:'Block Drop', desc:'one line', create(opts) -> game }
    // opts = {
    //   speed: 1..10, level: 1..10,
    //   rng: () => float in [0,1)   (seeded; never use Math.random in a game)
    //   sfx: (name) => void         names: move rotate drop clear hit die eat shoot levelup win
    //   held: (action) => bool      is the button held right now
    // }
    // game = {
    //   tick(dtMs)        advance time; no-op once over
    //   input(action)     action: 'left'|'right'|'up'|'down'|'fire' (press, and auto-repeat for left/right/down)
    //   view()            -> { grid: ROWS arrays of COLS 0/1, next: 4 arrays of 4 0/1 or null,
    //                          score: int >= 0, speed: 1..10, level: 1..10, lives: int|null }
    //   over              bool, true once the game has ended
    // }
    register(def) {
      if (!def || !/^[A-L]$/.test(def.id) || typeof def.create !== 'function') throw new Error('bad game def');
      BB.games[def.id] = def;
      BB.order = Object.keys(BB.games).sort();
    },

    stepMs(speed) { return SPEED_MS[Math.max(1, Math.min(10, speed | 0))]; },

    rng(seed) { // mulberry32
      let a = seed >>> 0;
      return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },

    grid(rows = ROWS, cols = COLS, fill = 0) {
      const g = [];
      for (let r = 0; r < rows; r++) g.push(new Array(cols).fill(fill));
      return g;
    },

    clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; },
  };

  root.BB = BB;
})(typeof window !== 'undefined' ? window : globalThis);
