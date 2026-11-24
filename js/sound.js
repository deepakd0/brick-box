// Brick Box sound: WebAudio square-wave beeps. Plain script.
// BBSound.sfx(name), BBSound.jingle(), BBSound.gameOver(), BBSound.toggle(), BBSound.isMuted()
// The AudioContext is created on the first user gesture (browsers refuse earlier).
(function (root) {
  'use strict';
  var KEY = 'brickbox.mute';
  var ctx = null;
  var muted = false;
  // Storage can be blocked (private mode, some file:// setups): then mute only lasts for this visit.
  try { muted = root.localStorage.getItem(KEY) === '1'; } catch (e) { muted = false; }

  // A tune is a list of [freqHz, ms] or [freqHz, ms, slideToHz]; freq 0 is a rest.
  var SFX = {
    move:    [[330, 25]],
    rotate:  [[440, 30], [660, 30]],
    drop:    [[150, 55]],
    clear:   [[523, 60], [659, 60], [784, 60], [1047, 110]],
    hit:     [[220, 40], [170, 50]],
    die:     [[420, 90, 110], [300, 140, 60]],
    eat:     [[880, 40], [1175, 70]],
    shoot:   [[1300, 45, 500]],
    levelup: [[523, 70], [659, 70], [784, 70], [1047, 70], [1319, 150]],
    win:     [[523, 90], [523, 90], [659, 90], [784, 90], [0, 30], [784, 90], [1047, 300]],
    menu:    [[620, 22]],
    start:   [[440, 60], [660, 60], [880, 120]],
    pause:   [[520, 40], [390, 50]]
  };
  var JINGLE = [[392, 110], [523, 110], [659, 110], [784, 110], [0, 50], [659, 80], [784, 80], [1047, 300],
                [0, 80], [988, 90], [1047, 420]];
  var GAME_OVER = [[392, 170], [349, 170], [311, 170], [262, 170], [0, 60], [233, 520, 170]];

  function unlock() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
  }
  ['pointerdown', 'keydown', 'touchend'].forEach(function (t) {
    root.addEventListener(t, unlock, { passive: true });
  });

  function play(tune, vol) {
    if (muted || !ctx || ctx.state !== 'running') return;
    var t = ctx.currentTime + 0.01;
    for (var i = 0; i < tune.length; i++) {
      var n = tune[i], f = n[0], d = n[1] / 1000;
      if (f > 0) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(f, t);
        if (n[2]) o.frequency.linearRampToValueAtTime(n[2], t + d);
        g.gain.setValueAtTime(vol, t);
        g.gain.setValueAtTime(vol, t + d * 0.7);
        g.gain.linearRampToValueAtTime(0.0001, t + d);
        o.connect(g); g.connect(ctx.destination);
        o.start(t); o.stop(t + d + 0.02);
      }
      t += d;
    }
  }

  var warned = {};
  root.BBSound = {
    sfx: function (name) {
      var tune = SFX[name];
      if (!tune) {
        if (!warned[name]) { warned[name] = true; console.warn('BBSound: unknown sfx "' + name + '"'); }
        return;
      }
      play(tune, 0.05);
    },
    jingle: function () { play(JINGLE, 0.05); },
    gameOver: function () { play(GAME_OVER, 0.05); },
    toggle: function () {
      muted = !muted;
      try { root.localStorage.setItem(KEY, muted ? '1' : '0'); } catch (e) { /* see above */ }
      if (!muted) unlock();
      return muted;
    },
    isMuted: function () { return muted; }
  };
})(window);
