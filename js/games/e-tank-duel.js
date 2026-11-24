// Game E: Tank Duel. 3x3 tanks, one shell at a time, enemies enter from the top corners.
(function () {
  'use strict';
  const ROWS = BB.ROWS, COLS = BB.COLS;
  const DIRS = { up: [-1, 0], right: [0, 1], down: [1, 0], left: [0, -1] };
  const NAMES = ['up', 'right', 'down', 'left'];
  const SHELL_MS = 40, FLASH_MS = 600, SPAWN_MS = 1500, MAX_ENEMIES = 4;

  // Cells of a tank (offsets from its centre). Barrel in the facing direction, the two side
  // cells, and the two rear corners as tracks. Facing up: .#. / ### / #.#
  function tankCells(dir) {
    const [dr, dc] = DIRS[dir];
    const cells = [[0, 0], [dr, dc], [dc, dr], [-dc, -dr]];            // centre, barrel, sides
    cells.push([-dr + dc, -dc + dr], [-dr - dc, -dc - dr]);            // rear corners
    return cells;
  }

  BB.register({
    id: 'E', name: 'Tank Duel', desc: 'Shoot the enemy tanks before they shoot you.',
    create(opts) {
      const rng = opts.rng, sfx = opts.sfx || function () {};
      const startSpeed = BB.clamp(opts.speed | 0 || 1, 1, 10);
      const level = BB.clamp(opts.level | 0 || 1, 1, 10);
      const target = 10 + 2 * level;
      const s = {
        score: 0, speed: startSpeed, lives: 4, kills: 0, spawned: 0,
        player: null, enemies: [], shells: [], shellAcc: 0, spawnT: 0, flash: 0, over: false,
      };

      function addScore(n) { s.score = Math.min(999999, s.score + n); }
      function fireDelay() { return (1500 + rng() * 2500) * (1 - 0.06 * (s.speed - 1)); }

      function newPlayer() { return { cx: 4, cy: 18, dir: 'up', shell: false }; }
      function occupies(t, r, c) {
        for (const [dr, dc] of tankCells(t.dir)) if (t.cy + dr === r && t.cx + dc === c) return true;
        return false;
      }
      function inField(t, cx, cy) { return cx >= 1 && cx <= COLS - 2 && cy >= 1 && cy <= ROWS - 2; }
      // Would a tank with centre (cx, cy) overlap another tank (3x3 boxes)?
      function blocked(self, cx, cy) {
        const all = [s.player].concat(s.enemies);
        for (const t of all) {
          if (!t || t === self) continue;
          if (Math.abs(t.cx - cx) < 3 && Math.abs(t.cy - cy) < 3) return true;
        }
        return false;
      }
      function tryMove(t, dir) {
        if (t.dir !== dir) { t.dir = dir; return true; }       // first press only turns
        const [dr, dc] = DIRS[dir];
        const nx = t.cx + dc, ny = t.cy + dr;
        if (!inField(t, nx, ny) || blocked(t, nx, ny)) return false;
        t.cx = nx; t.cy = ny;
        return true;
      }
      function fire(t, owner) {
        const [dr, dc] = DIRS[t.dir];
        const r = t.cy + 2 * dr, c = t.cx + 2 * dc;
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
        const sh = { r, c, dr, dc, owner, from: t };
        // a shell already in the spawn cell: both cancel
        const other = s.shells.find((x) => x.r === r && x.c === c);
        if (other) { remove(other); return; }
        s.shells.push(sh);
        t.shell = true;
        sfx('shoot');
        resolveHits(sh);
      }

      // Apply a shell's position against tanks. Returns true if the shell is gone.
      function resolveHits(sh) {
        if (sh.r < 0 || sh.r >= ROWS || sh.c < 0 || sh.c >= COLS) return remove(sh);
        if (sh.owner === 'player') {
          for (let i = 0; i < s.enemies.length; i++) {
            if (occupies(s.enemies[i], sh.r, sh.c)) {
              s.enemies.splice(i, 1);
              addScore(100 * s.speed);
              s.kills++;
              sfx('hit');
              remove(sh);
              if (s.kills >= target) nextStage();
              return true;
            }
          }
        } else {
          if (occupies(s.player, sh.r, sh.c)) { remove(sh); lose(); return true; }
          for (const e of s.enemies) if (e !== sh.from && occupies(e, sh.r, sh.c)) return remove(sh);
        }
        return false;
      }
      function remove(sh) {
        const i = s.shells.indexOf(sh);
        if (i >= 0) s.shells.splice(i, 1);
        sh.from.shell = false;
        return true;
      }
      function lose() {
        s.lives--;
        sfx('die');
        if (s.lives <= 0) { s.over = true; return; }
        s.flash = FLASH_MS;
      }
      function resetField() {
        for (const sh of s.shells) sh.from.shell = false;
        s.shells = []; s.enemies = []; s.spawnT = 0;
        s.player = newPlayer();
      }
      function nextStage() {
        s.speed = Math.min(10, s.speed + 1);
        s.kills = 0; s.spawned = 0;
        sfx('levelup');
        resetField();
      }

      function spawnEnemy() {
        if (s.enemies.length >= MAX_ENEMIES || s.kills + s.enemies.length >= target) return;
        const left = rng() < 0.5;
        for (const cx of left ? [1, 8] : [8, 1]) {
          if (!blocked(null, cx, 1)) {
            s.enemies.push({ cx, cy: 1, dir: 'down', shell: false, moveAcc: 0, fireT: fireDelay() });
            return;
          }
        }
      }

      function enemyThink(e) {
        // keep moving; when blocked or at random, pick a new direction so it never gets stuck
        if (rng() < 0.2) { e.dir = NAMES[Math.floor(rng() * 4)]; return; }
        if (!tryMove(e, e.dir)) {
          const options = NAMES.filter((d) => d !== e.dir);
          e.dir = options[Math.floor(rng() * options.length)];
        }
      }

      function moveShells() {
        const moves = s.shells.map((sh) => ({ sh, r: sh.r + sh.dr, c: sh.c + sh.dc }));
        const cancel = new Set();
        for (let i = 0; i < moves.length; i++) for (let j = i + 1; j < moves.length; j++) {
          const a = moves[i], b = moves[j];
          const same = a.r === b.r && a.c === b.c;
          const swap = a.r === b.sh.r && a.c === b.sh.c && b.r === a.sh.r && b.c === a.sh.c;
          if (same || swap) { cancel.add(a.sh); cancel.add(b.sh); }
        }
        for (const sh of cancel) remove(sh);
        for (const m of moves) {
          if (cancel.has(m.sh) || s.over || s.flash > 0) continue;
          if (s.shells.indexOf(m.sh) < 0) continue;
          m.sh.r = m.r; m.sh.c = m.c;
          resolveHits(m.sh);
        }
      }

      function tick(dt) {
        if (s.over) return;
        if (s.flash > 0) {
          s.flash -= dt;
          if (s.flash <= 0) { s.flash = 0; resetField(); }
          return;
        }
        s.shellAcc += dt;
        while (s.shellAcc >= SHELL_MS && !s.over && s.flash === 0) { s.shellAcc -= SHELL_MS; moveShells(); }
        if (s.over || s.flash > 0) return;
        s.spawnT -= dt;
        if (s.spawnT <= 0) { s.spawnT = SPAWN_MS; spawnEnemy(); }
        const step = BB.stepMs(s.speed);
        for (const e of s.enemies.slice()) {
          if (s.enemies.indexOf(e) < 0) continue;
          e.moveAcc += dt;
          while (e.moveAcc >= step) { e.moveAcc -= step; enemyThink(e); }
          e.fireT -= dt;
          if (e.fireT <= 0) {
            e.fireT = fireDelay();
            if (!e.shell) fire(e, 'enemy');
          }
          if (s.over || s.flash > 0) return;
        }
      }

      function input(a) {
        if (s.over || s.flash > 0) return;
        if (DIRS[a]) { tryMove(s.player, a); sfx('move'); }
        else if (a === 'fire' && !s.player.shell) fire(s.player, 'player');
      }

      function view() {
        const g = BB.grid();
        if (s.flash > 0 && Math.floor(s.flash / 100) % 2 === 1) {
          return { grid: g, next: null, score: s.score, speed: s.speed, level, lives: s.lives };
        }
        for (const t of [s.player].concat(s.enemies)) {
          for (const [dr, dc] of tankCells(t.dir)) g[t.cy + dr][t.cx + dc] = 1;
        }
        for (const sh of s.shells) if (sh.r >= 0 && sh.r < ROWS && sh.c >= 0 && sh.c < COLS) g[sh.r][sh.c] = 1;
        return { grid: g, next: null, score: s.score, speed: s.speed, level, lives: s.lives };
      }

      s.player = newPlayer();
      s.spawnT = 0;
      return { tick, input, view, get over() { return s.over; } };
    },
  });
})();
