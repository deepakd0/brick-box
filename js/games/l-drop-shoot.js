// Game L: Drop & Shoot (every 6th piece is a one-cell gun that shoots up).
(function () {
  'use strict';
  BB.register({
    id: 'L', name: 'Drop & Shoot', desc: 'Every 6th piece is a gun. Shoot blocks into place.',
    create(opts) { return BB.blocks.make(opts, { pieces: BB.blocks.CLASSIC, gunEvery: 6 }); },
  });
})();
