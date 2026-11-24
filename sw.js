// Brick Box service worker: caches every file so the phone version works offline.
// Bump CACHE when any file changes so installed copies refresh.
const CACHE = 'brickbox-v4';
const FILES = [
  './',
  'index.html',
  'laptop.html',
  'phone.html',
  'manifest.webmanifest',
  'css/console.css',
  'js/core.js',
  'js/sound.js',
  'js/console.js',
  'js/shell.js',
  'js/games/_blocks.js',
  'js/games/a-block-drop.js',
  'js/games/b-odd-blocks.js',
  'js/games/c-rising-floor.js',
  'js/games/d-lane-racer.js',
  'js/games/e-tank-duel.js',
  'js/games/f-snake.js',
  'js/games/g-frog-hop.js',
  'js/games/h-brick-breaker.js',
  'js/games/i-row-blaster.js',
  'js/games/j-gap-filler.js',
  'js/games/k-copy-cat.js',
  'js/games/l-drop-shoot.js'
];

self.addEventListener('install', (e) => {
  // A file that is not there yet (a game not written) must not stop the install: log it and go on.
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(FILES.map((f) =>
    c.add(new Request(f, { cache: 'reload' })).catch((err) => console.warn('sw: could not cache ' + f, err))))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Network first, so a new version shows up straight away; the cached copy is used offline.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then((c) =>
    fetch(req, { cache: 'no-cache' })
      .then((res) => { if (res.ok) c.put(req, res.clone()); return res; })
      .catch(() => c.match(req, { ignoreSearch: true }).then((hit) => hit || Response.error()))));
});
