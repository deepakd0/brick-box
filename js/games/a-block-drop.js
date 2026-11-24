// Game A: Block Drop (the 7 classic shapes).
(function () {
  'use strict';
  BB.register({
    id: 'A', name: 'Block Drop', desc: 'Stack the falling shapes and clear rows.',
    create(opts) { return BB.blocks.make(opts, { pieces: BB.blocks.CLASSIC }); },
  });
})();
