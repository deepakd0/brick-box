// Game D: Lane Racer. Dodge enemy cars on a 3-lane road.
(function () {
  'use strict';
  const ROWS = BB.ROWS, COLS = BB.COLS;
  const CAR = [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1], [3, 0], [3, 2]];   // .#. ### .#. #.#
  const LANE_X = [1, 4, 6];            // left col of each lane
  const CAR_H = 4, PLAYER_TOP = ROWS - CAR_H;
  const FLASH_MS = 600;

  BB.register({
    id: 'D', name: 'Lane Racer', desc: 'Dodge the oncoming cars. Hold fire to go faster.',
    create(opts) {
      const rng = opts.rng, sfx = opts.sfx || function () {};
      const held = opts.held || function () { return false; };
      const startSpeed = BB.clamp(opts.speed | 0 || 1, 1, 10);
      const level = BB.clamp(opts.level | 0 || 1, 1, 10);
      // minimum free rows between cars in a lane: 10 at level 1, down to 5 at level 10
      const minGap = Math.round(10 - (level - 1) * 5 / 9);
      const s = {
        score: 0, speed: startSpeed, lives: 4, passed: 0, lane: 1, cars: [], scroll: 0,
        acc: 0, flash: 0, over: false,
      };

      function addScore(n) { s.score = Math.min(999999, s.score + n); }

      function overlaps(car) {
        const px = LANE_X[s.lane], cx = LANE_X[car.lane];
        for (const [pr, pc] of CAR) for (const [er, ec] of CAR) {
          if (PLAYER_TOP + pr === car.top + er && px + pc === cx + ec) return true;
        }
        return false;
      }
      function checkCrash() {
        for (const car of s.cars) if (car.top + CAR_H > PLAYER_TOP && car.top < ROWS && overlaps(car)) { crash(); return true; }
        return false;
      }
      function crash() {
        s.lives--;
        sfx('die');
        if (s.lives <= 0) { s.over = true; return; }
        s.flash = FLASH_MS;
      }
      function restart() { s.cars = []; s.lane = 1; s.acc = 0; }

      function trySpawn() {
        if (rng() > 0.4) return;
        const lane = Math.floor(rng() * 3);
        const near = (l) => s.cars.some((c) => c.lane === l && c.top < 4);
        const last = s.cars.filter((c) => c.lane === lane).reduce((m, c) => Math.min(m, c.top), Infinity);
        if (last < minGap) return;                                // keep the gap in this lane
        let blocked = 0;
        for (let l = 0; l < 3; l++) if (l === lane || near(l)) blocked++;
        if (blocked >= 3) return;                                  // never block all 3 lanes
        s.cars.push({ lane, top: -CAR_H });
      }

      function step(boost) {
        s.scroll++;
        for (const car of s.cars) car.top++;
        const keep = [];
        for (const car of s.cars) {
          if (car.top >= ROWS) {
            s.passed++;
            addScore(10 * s.speed * (boost ? 2 : 1));
            if (s.passed % 30 === 0 && s.speed < 10) { s.speed++; sfx('levelup'); }
          } else keep.push(car);
        }
        s.cars = keep;
        trySpawn();
        checkCrash();
      }

      function tick(dt) {
        if (s.over) return;
        if (s.flash > 0) {
          s.flash -= dt;
          if (s.flash <= 0) { s.flash = 0; restart(); }
          return;
        }
        const boost = held('up') || held('fire');
        s.acc += dt * (boost ? 2 : 1);
        while (!s.over && s.flash === 0 && s.acc >= BB.stepMs(s.speed)) {
          s.acc -= BB.stepMs(s.speed);
          step(boost);
        }
      }

      function input(a) {
        if (s.over || s.flash > 0) return;
        if (a === 'left' && s.lane > 0) { s.lane--; sfx('move'); checkCrash(); }
        else if (a === 'right' && s.lane < 2) { s.lane++; sfx('move'); checkCrash(); }
      }

      function view() {
        const g = BB.grid();
        if (s.flash > 0 && Math.floor(s.flash / 100) % 2 === 1) {
          return { grid: g, next: null, score: s.score, speed: s.speed, level, lives: s.lives };
        }
        for (let r = 0; r < ROWS; r++) {
          if ((((r - s.scroll) % 4) + 4) % 4 !== 3) { g[r][0] = 1; g[r][COLS - 1] = 1; }
        }
        const draw = (top, x) => {
          for (const [dr, dc] of CAR) {
            const rr = top + dr;
            if (rr >= 0 && rr < ROWS) g[rr][x + dc] = 1;
          }
        };
        for (const car of s.cars) draw(car.top, LANE_X[car.lane]);
        draw(PLAYER_TOP, LANE_X[s.lane]);
        return { grid: g, next: null, score: s.score, speed: s.speed, level, lives: s.lives };
      }

      return { tick, input, view, get over() { return s.over; } };
    },
  });
})();
