// Brick Box shell: intro, menu, game loop, pause, sound, reset, on/off, game-over wipe,
// hi-scores, keyboard and touch input. Plain script, loaded last.
// Games are found at run time through BB.games / BB.order, so the load order of the
// game files does not matter and a missing game only shows "SOON".
(function (root) {
  'use strict';
  var BB = root.BB;
  if (!BB) throw new Error('Brick Box: js/core.js did not load');
  if (!root.BBConsole) throw new Error('Brick Box: js/console.js did not load');
  var Sound = root.BBSound;
  if (!Sound) {
    console.warn('Brick Box: js/sound.js did not load, running without sound');
    Sound = { sfx: function () {}, jingle: function () {}, gameOver: function () {}, toggle: function () { return true; }, isMuted: function () { return true; } };
  }

  var ROWS = BB.ROWS, COLS = BB.COLS;
  var IDS = 'ABCDEFGHIJKL'.split('');
  var NAMES = {
    A: 'Block Drop', B: 'Odd Blocks', C: 'Rising Floor', D: 'Lane Racer', E: 'Tank Duel', F: 'Snake',
    G: 'Frog Hop', H: 'Brick Breaker', I: 'Row Blaster', J: 'Gap Filler', K: 'Copy Cat', L: 'Drop & Shoot'
  };

  // ---- big 5x7 letters for the menu ----
  var LETTERS = {
    A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
    C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
    D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
    E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
    F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
    G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
    H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
    K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
    L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####']
  };
  // tiny 3x5 letters for the "SOON" screen
  var SMALL = {
    S: ['###', '#..', '###', '..#', '###'],
    O: ['###', '#.#', '#.#', '#.#', '###'],
    N: ['#.#', '###', '###', '#.#', '#.#']
  };

  // ---- the 2-frame demo strips (8 rows x 10 cols each), drawn under the letter ----
  var DEMOS = {
    A: [['..##......', '...##.....', '..........', '..........', '..........', '#.#.......', '###.#.##..', '####.#####'],
        ['..........', '..........', '..##......', '...##.....', '..........', '#.#.......', '###.#.##..', '####.#####']],
    B: [['...#......', '..###.....', '...#......', '..........', '..........', '#.........', '##.#...#..', '###.######'],
        ['..........', '..........', '...#......', '..###.....', '...#......', '#.........', '##.#...#..', '###.######']],
    C: [['..........', '.......#..', '.......#..', '.......#..', '.......#..', '..........', '#.##.#.##.', '##.#####.#'],
        ['..........', '.......#..', '.......#..', '.......#..', '.......#..', '#.##.#.##.', '##.#####.#', '#####.####']],
    D: [['#......#.#', '#.....####', '#......#.#', '......#.#.', '#.#......#', '####.....#', '#.#......#', '.#.#......'],
        ['..........', '#......#.#', '#.....####', '#......#.#', '..#...#.#.', '####.....#', '#.#......#', '##.#.....#']],
    E: [['......#.#.', '......###.', '.......#..', '..#.......', '..........', '..#.......', '.###......', '.#.#......'],
        ['......#.#.', '......###.', '..#....#..', '..........', '..........', '..#.......', '.###......', '.#.#......']],
    F: [['..........', '..........', '.......#..', '..........', '..####....', '..#.......', '..#.......', '..#.......'],
        ['..........', '..........', '..........', '..........', '..#####...', '..#.......', '..#.......', '..........']],
    G: [['##.##.##.#', '###..####.', '.####..###', '..........', '..##...#..', '#...###...', '.....#....', '..........'],
        ['##.##.##.#', '.###..####', '####..###.', '..........', '...##...#.', '...###...#', '.....#....', '..........']],
    H: [['##########', '#.#.#.#.#.', '.#.#.#.#.#', '..........', '....#.....', '..........', '..........', '...###....'],
        ['##########', '#.#.#.#.#.', '.#.#.#.#.#', '.....#....', '..........', '..........', '..........', '....###...']],
    I: [['##.####.##', '#.##.####.', '.#####.##.', '..........', '....#.....', '..........', '....#.....', '...###....'],
        ['##.####.##', '#.##.####.', '.#####.##.', '....#.....', '..........', '..........', '.....#....', '....###...']],
    J: [['...###....', '....#.....', '..........', '....#.....', '..........', '##.####.##', '#.######.#', '####.#####'],
        ['....###...', '.....#....', '..........', '..........', '.....#....', '##.####.##', '#.######.#', '####.#####']],
    K: [['...###....', '...#.#....', '...###....', '..........', '..........', '...###....', '...##.....', '#########.'],
        ['...###....', '...#.#....', '...###....', '..........', '..........', '...###....', '...#......', '########..']],
    L: [['..##......', '...##.....', '..........', '.......#..', '..........', '.......#..', '#.##.....#', '######.###'],
        ['..........', '..##......', '...##..#..', '..........', '..........', '.......#..', '#.##.....#', '######.###']]
  };

  // ---- storage (can be blocked: then the values only last for this visit) ----
  var mem = {};
  function sget(k) {
    try { var v = root.localStorage.getItem(k); return v === null ? (k in mem ? mem[k] : null) : v; } catch (e) { return k in mem ? mem[k] : null; }
  }
  function sset(k, v) {
    mem[k] = v;
    try { root.localStorage.setItem(k, v); } catch (e) { /* kept in mem */ }
  }
  var hiCache = {};
  function hiOf(id) {
    if (!(id in hiCache)) {
      var n = parseInt(sget('brickbox.hi.' + id), 10);
      hiCache[id] = isFinite(n) ? BB.clamp(n, 0, 999999) : 0;
    }
    return hiCache[id];
  }
  function saveHi(id, score) {
    if (score > hiOf(id)) { hiCache[id] = score; sset('brickbox.hi.' + id, String(score)); }
  }

  // ---- state ----
  var sel = 'A', speed = 1, level = 1;
  var mode = 'intro', modeT = 0;
  var game = null, curId = null, paused = false, pauseT = 0, lastView = null;
  var ui;

  function loadLast() {
    var raw = sget('brickbox.last');
    if (!raw) return;
    var o;
    try { o = JSON.parse(raw); } catch (e) { return; } // bad stored value: start from defaults
    if (!o || typeof o !== 'object') return;
    if (typeof o.game === 'string' && /^[A-L]$/.test(o.game)) sel = o.game;
    if (isFinite(o.speed)) speed = BB.clamp(o.speed | 0, 1, 10);
    if (isFinite(o.level)) level = BB.clamp(o.level | 0, 1, 10);
  }
  function saveLast() { sset('brickbox.last', JSON.stringify({ game: sel, speed: speed, level: level })); }

  // ---- grid helpers ----
  function blank() { return BB.grid(ROWS, COLS, 0); }
  function stamp(g, rows, r0, c0) {
    for (var r = 0; r < rows.length; r++) {
      for (var c = 0; c < rows[r].length; c++) {
        if (rows[r][c] === '#' && g[r0 + r] && c0 + c < COLS) g[r0 + r][c0 + c] = 1;
      }
    }
  }
  function gameName(id) { var d = BB.games[id]; return d && d.name ? d.name : NAMES[id]; }

  // ---- drawing per mode ----
  function panel(o) {
    ui.setScore(o.score); ui.setHi(o.hi); ui.setSpeed(o.speed); ui.setLevel(o.level);
    ui.setLives(o.lives === undefined ? null : o.lives);
    ui.setNext(o.next || null);
  }

  function drawMenu() {
    var g = blank();
    stamp(g, LETTERS[sel], 1, 2);
    for (var c = 0; c < COLS; c += 2) g[9][c] = 1; // dotted divider
    stamp(g, DEMOS[sel][Math.floor(modeT / 500) % 2], 11, 0);
    ui.setGrid(g);
    ui.setName(gameName(sel));
    panel({ score: 0, hi: hiOf(sel), speed: speed, level: level, lives: null });
    ui.showScore(true); ui.setPause(false);
  }

  function drawIntro() {
    var step = 45, g = blank(), r;
    var t = modeT;
    if (t < 900) {
      var filled = Math.min(ROWS, Math.floor(t / step) + 1);
      for (r = ROWS - filled; r < ROWS; r++) g[r].fill(1);
    } else if (t < 1100) {
      for (r = 0; r < ROWS; r++) g[r].fill(1);
    } else {
      var cleared = Math.floor((t - 1100) / step) + 1;
      for (r = cleared; r < ROWS; r++) g[r].fill(1);
    }
    ui.setGrid(g);
    ui.setName('BRICK BOX');
    panel({ score: '888888', hi: '888888', speed: '88', level: '88', lives: null });
    ui.showScore(true);
  }

  function drawSoon() {
    var g = blank();
    stamp(g, SMALL.S, 5, 2); stamp(g, SMALL.O, 5, 6);
    stamp(g, SMALL.O, 11, 2); stamp(g, SMALL.N, 11, 6);
    ui.setGrid(g);
    ui.setName(NAMES[sel] + ' - coming soon');
    panel({ score: 0, hi: hiOf(sel), speed: speed, level: level, lives: null });
  }

  function drawView(v) {
    ui.setGrid(v.grid);
    panel({ score: v.score, hi: Math.max(hiOf(curId), v.score), speed: v.speed, level: v.level, lives: v.lives, next: v.next });
    ui.setName(gameName(curId));
  }

  function drawOver() {
    var t = modeT, step = 35, g = blank(), r;
    var wipeFill = ROWS * step, wipeClear = wipeFill + ROWS * step;
    if (t < wipeFill) {
      var n = Math.floor(t / step) + 1;
      for (r = ROWS - n; r < ROWS; r++) g[r].fill(1);
    } else if (t < wipeClear) {
      var k = Math.floor((t - wipeFill) / step) + 1;
      for (r = k; r < ROWS; r++) g[r].fill(1);
    }
    ui.setGrid(g);
    ui.setNext(null);
    var blinkT = t - wipeClear;
    ui.showScore(blinkT < 0 || Math.floor(blinkT / 300) % 2 === 0);
    return blinkT >= 1800; // finished
  }

  // ---- mode changes ----
  function goMenu() {
    mode = 'menu'; modeT = 0; game = null; paused = false;
    ui.setPause(false); ui.showScore(true);
    drawMenu();
  }
  function startIntro() {
    mode = 'intro'; modeT = 0; game = null; paused = false;
    ui.setPower(true);
    Sound.jingle();
    drawIntro();
  }
  function startGame() {
    var def = BB.games[sel];
    if (!def) { mode = 'soon'; modeT = 0; Sound.sfx('hit'); drawSoon(); return; }
    var g = def.create({
      speed: speed, level: level,
      rng: BB.rng(Date.now() & 0xffffffff),
      sfx: function (n) { Sound.sfx(n); },
      held: held
    });
    game = g; curId = sel; paused = false; pauseT = 0; mode = 'play'; modeT = 0;
    saveLast();
    Sound.sfx('start');
    lastView = g.view();
    drawView(lastView);
  }
  function leaveGame() { // reset or power off during a game: keep a new best
    if (game && lastView) saveHi(curId, lastView.score);
    game = null;
  }
  function powerToggle() {
    if (mode === 'off') { startIntro(); return; }
    if (mode === 'play') leaveGame();
    mode = 'off'; game = null; paused = false;
    ui.setPower(false);
    ui.setGrid(blank()); ui.setNext(null); ui.setLives(null); ui.setPause(false); ui.showScore(true);
    ui.setName('');
  }
  function soundToggle() {
    var m = Sound.toggle();
    ui.setSound(!m);
    if (!m) Sound.sfx('menu');
  }

  // ---- input ----
  var holders = {}; // action -> { n, ids, since, last }
  function held(a) { var h = holders[a]; return !!(h && h.n > 0); }

  function trigger(a) {
    if (a === 'onoff') { powerToggle(); return; }
    if (a === 'sound') { soundToggle(); return; }
    if (mode === 'off') return;
    if (mode === 'intro') { goMenu(); return; } // any other button skips the intro
    if (mode === 'menu') {
      if (a === 'left' || a === 'right') {
        var i = IDS.indexOf(sel);
        sel = IDS[(i + (a === 'right' ? 1 : IDS.length - 1)) % IDS.length];
        modeT = 0; saveLast(); Sound.sfx('menu');
      } else if (a === 'up') { speed = speed % 10 + 1; saveLast(); Sound.sfx('menu'); }
      else if (a === 'down') { level = level % 10 + 1; saveLast(); Sound.sfx('menu'); }
      else if (a === 'fire' || a === 'start') startGame();
      drawMenu();
      return;
    }
    if (mode === 'play') {
      if (a === 'start') {
        paused = !paused; pauseT = 0; Sound.sfx('pause');
        if (!paused) ui.setPause(false);
      } else if (a === 'reset') { leaveGame(); goMenu(); }
      else if (!paused && game) game.input(a);
      return;
    }
    if (a === 'reset') goMenu(); // soon / over
  }

  function inputDown(a, id) {
    var h = holders[a] || (holders[a] = { n: 0, ids: {}, since: 0, last: 0 });
    if (h.ids[id]) return;
    h.ids[id] = true; h.n++;
    if (h.n === 1) { h.since = h.last = root.performance.now(); trigger(a); }
  }
  function inputUp(a, id) {
    var h = holders[a];
    if (!h || !h.ids[id]) return;
    delete h.ids[id]; h.n--;
  }
  function releaseAll() {
    Object.keys(holders).forEach(function (a) { holders[a].ids = {}; holders[a].n = 0; });
  }
  function repeats(ts) {
    ['left', 'right', 'down'].forEach(function (a) {
      var h = holders[a];
      if (h && h.n > 0 && ts - h.since >= 170 && ts - h.last >= (a === 'down' ? 35 : 55)) {
        h.last = ts;
        if (mode === 'menu' || mode === 'play') trigger(a);
      }
    });
  }

  var KEYMAP = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
    ' ': 'fire', x: 'fire', X: 'fire', Enter: 'start', m: 'sound', M: 'sound', r: 'reset', R: 'reset', o: 'onoff', O: 'onoff'
  };
  root.addEventListener('keydown', function (e) {
    var a = KEYMAP[e.key];
    if (!a || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    if (e.repeat) return; // auto-repeat is done by the shell, not the OS
    inputDown(a, 'k:' + e.key.toLowerCase());
  });
  root.addEventListener('keyup', function (e) {
    var a = KEYMAP[e.key];
    if (!a) return;
    e.preventDefault();
    inputUp(a, 'k:' + e.key.toLowerCase());
  });
  root.addEventListener('blur', releaseAll);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { releaseAll(); if (mode === 'play' && !paused) { paused = true; pauseT = 0; } }
  });

  // ---- main loop ----
  var lastTs = null;
  function frame(ts) {
    root.requestAnimationFrame(frame);
    var dt = lastTs === null ? 0 : BB.clamp(ts - lastTs, 0, 50);
    lastTs = ts;
    repeats(ts);
    if (mode === 'off') return;
    modeT += dt;
    if (mode === 'intro') {
      if (modeT >= 2000) goMenu(); else drawIntro();
    } else if (mode === 'menu') {
      drawMenu();
    } else if (mode === 'soon') {
      if (modeT >= 1500) goMenu(); else drawSoon();
    } else if (mode === 'play') {
      if (!paused) game.tick(dt);
      lastView = game.view();
      drawView(lastView);
      if (paused) { pauseT += dt; ui.setPause(Math.floor(pauseT / 400) % 2 === 0); }
      if (game.over) {
        saveHi(curId, lastView.score);
        Sound.gameOver();
        mode = 'over'; modeT = 0; ui.setPause(false);
        ui.showScore(true);
      }
    } else if (mode === 'over') {
      if (drawOver()) goMenu();
    }
  }

  // ---- start ----
  function boot() {
    var layout = document.body.getAttribute('data-layout') === 'phone' ? 'phone' : 'laptop';
    ui = root.BBConsole.create(document.getElementById('app'), layout);
    ui.onButton = function (a, down) { if (down) inputDown(a, 'btn'); else inputUp(a, 'btn'); };
    ui.fit();
    root.addEventListener('resize', ui.fit);
    root.addEventListener('orientationchange', ui.fit);
    if (root.visualViewport) root.visualViewport.addEventListener('resize', ui.fit);
    loadLast();
    ui.setSound(!Sound.isMuted());
    startIntro();
    root.requestAnimationFrame(frame);
  }
  boot();

  // small hook for tests and debugging
  root.BBShell = {
    state: function () { return { mode: mode, sel: sel, speed: speed, level: level, paused: paused }; },
    press: function (a) { inputDown(a, 'dbg'); inputUp(a, 'dbg'); }
  };
})(window);
