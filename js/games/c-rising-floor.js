// Game C: Rising Floor (a junk row pushes up from the bottom every 12 pieces, 8 from speed 6).
(function () {
  'use strict';
  BB.register({
    id: 'C', name: 'Rising Floor', desc: 'The floor keeps rising. Clear rows fast.',
    create(opts) {
      let since = 0;
      return BB.blocks.make(opts, {
        pieces: BB.blocks.CLASSIC,
        afterLock(s) {
          since++;
          if (since >= (s.speed >= 6 ? 8 : 12)) { since = 0; BB.blocks.rise(s); }
        },
      });
    },
  });
})();
