// Smoke test for every registered game: node games/brick-box/tests/smoke.mjs [ids]
// Loads core.js + js/games/*.js in a vm, plays each game with random inputs at
// several speed/level settings and checks the contract in js/core.js.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'js');
const ctx = { console };
ctx.window = ctx; ctx.globalThis = ctx;
vm.createContext(ctx);
const load = (f) => vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
load(path.join(dir, 'core.js'));
const gdir = path.join(dir, 'games');
const files = fs.readdirSync(gdir).filter((f) => f.endsWith('.js')).sort();
// shared helpers (names starting with "_") load before games
for (const f of files.filter((f) => f.startsWith('_'))) load(path.join(gdir, f));
for (const f of files.filter((f) => !f.startsWith('_'))) load(path.join(gdir, f));

const BB = ctx.BB;
const want = process.argv[2] ? process.argv[2].toUpperCase().split(',') : 'ABCDEFGHIJKL'.split('');
const ACTIONS = ['left', 'right', 'up', 'down', 'fire'];
let fails = 0;
const fail = (m) => { fails++; console.log('FAIL ' + m); };

function checkView(id, v, ctxt) {
  if (!v || !Array.isArray(v.grid) || v.grid.length !== BB.ROWS) return fail(`${id} ${ctxt}: grid rows`);
  for (const row of v.grid) {
    if (!Array.isArray(row) || row.length !== BB.COLS || row.some((c) => c !== 0 && c !== 1)) return fail(`${id} ${ctxt}: grid row`);
  }
  if (v.next !== null && (!Array.isArray(v.next) || v.next.length !== 4 || v.next.some((r) => r.length !== 4))) return fail(`${id} ${ctxt}: next`);
  if (!Number.isInteger(v.score) || v.score < 0) return fail(`${id} ${ctxt}: score ${v.score}`);
  if (!(v.speed >= 1 && v.speed <= 10) || !(v.level >= 1 && v.level <= 10)) return fail(`${id} ${ctxt}: speed/level`);
}

for (const id of want) {
  const def = BB.games[id];
  if (!def) { fail(`${id}: not registered`); continue; }
  if (!def.name || !def.desc) fail(`${id}: name/desc missing`);
  let ended = 0, maxScore = 0;
  for (const speed of [1, 5, 10]) for (const level of [1, 5, 10]) for (const seed of [1, 2]) {
    const ctxt = `s${speed} l${level} seed${seed}`;
    const pick = BB.rng(seed * 977);
    const held = {};
    try {
      const g = def.create({ speed, level, rng: BB.rng(seed), sfx: () => {}, held: (a) => !!held[a] });
      checkView(id, g.view(), ctxt + ' start');
      for (let t = 0; t < 6000 && !g.over; t++) {          // ~100 s of play at 16 ms
        if (pick() < 0.15) { const a = ACTIONS[Math.floor(pick() * 5)]; held[a] = pick() < 0.5; g.input(a); }
        g.tick(16);
        if (t % 50 === 0) checkView(id, g.view(), ctxt + ' t' + t);
      }
      const v = g.view();
      checkView(id, v, ctxt + ' end');
      maxScore = Math.max(maxScore, v.score);
      if (g.over) { ended++; const before = JSON.stringify(v); g.tick(1000); g.input('fire'); if (JSON.stringify(g.view()) !== before) fail(`${id} ${ctxt}: changes after over`); }
    } catch (e) { fail(`${id} ${ctxt}: threw ${e && e.stack ? e.stack.split('\n').slice(0, 2).join(' | ') : e}`); }
  }
  console.log(`${id} ${def.name}: ran 18 games, ${ended} ended, max score ${maxScore}`);
}
console.log(fails ? `RESULT: ${fails} failures` : 'RESULT: all pass');
process.exit(fails ? 1 : 0);
