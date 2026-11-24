// Game B: Odd Blocks (classic shapes plus 5 odd ones, a bag of 12).
(function () {
  'use strict';
  BB.register({
    id: 'B', name: 'Odd Blocks', desc: 'Falling blocks with strange extra shapes.',
    create(opts) { return BB.blocks.make(opts, { pieces: BB.blocks.CLASSIC.concat(BB.blocks.ODD) }); },
  });
})();
