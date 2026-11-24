// Brick Box console: DOM for the LCD, the side panel and the buttons.
// BBConsole.create(root, 'laptop' | 'phone') -> ui
// Only cells whose state changed are touched (previous-frame arrays), so drawing is cheap.
(function (root) {
  'use strict';
  var ROWS = 20, COLS = 10;

  var SPEAKER = '<svg class="spk" viewBox="0 0 24 24"><path d="M3 9v6h4l5 4V5L7 9H3z"/><path d="M15 8a5 5 0 0 1 0 8M17.5 5.5a9 9 0 0 1 0 13" fill="none" stroke="#1b1f15" stroke-width="2" stroke-linecap="round"/></svg>';
  var PAUSE = '<svg class="pse off" viewBox="0 0 24 24"><rect x="5" y="4" width="5" height="16"/><rect x="14" y="4" width="5" height="16"/></svg>';

  function div(cls, html) {
    var d = document.createElement('div');
    if (cls) d.className = cls;
    if (html) d.innerHTML = html; // html here is only fixed markup written in this file
    return d;
  }

  function makeCells(parent, n) {
    var arr = [];
    for (var i = 0; i < n; i++) {
      var c = div('bb-cell');
      parent.appendChild(c);
      arr.push(c);
    }
    return arr;
  }

  function digits(v, n) {
    return typeof v === 'string' ? v : String(Math.max(0, v | 0)).padStart(n, '0');
  }

  var KEYS = [
    ['Arrow keys', 'Move'], ['Space / X', 'Rotate / Fire'], ['Enter', 'Start / Pause'],
    ['M', 'Sound'], ['R', 'Reset'], ['O', 'On / Off']
  ];
  function keysCard() {
    var card = div('bb-keys');
    var h = document.createElement('h3'); h.textContent = 'KEYBOARD';
    card.appendChild(h);
    KEYS.forEach(function (k) {
      var r = document.createElement('div');
      var kb = document.createElement('kbd'); kb.textContent = k[0];
      var sp = document.createElement('span'); sp.textContent = k[1];
      r.appendChild(kb); r.appendChild(sp); card.appendChild(r);
    });
    var p = document.createElement('p');
    p.textContent = 'In the menu: Left/Right picks the game, Up changes speed, Down changes level, Space starts.';
    card.appendChild(p);
    return card;
  }

  function create(rootEl, layout) {
    var phone = layout === 'phone';
    var wrap = div(phone ? 'bb-phone' : 'bb-laptop');
    var body = div('bb-body');
    wrap.appendChild(body);

    var top = div('bb-top');
    var brand = div('bb-brand'); brand.textContent = 'BRICK BOX';
    var right = div(); right.style.cssText = 'display:flex;align-items:center';
    var b12 = div('bb-12'); b12.textContent = '12 in 1';
    var led = div('bb-led');
    right.appendChild(b12); right.appendChild(led);
    top.appendChild(brand); top.appendChild(right);
    body.appendChild(top);

    // LCD
    var bezel = div('bb-bezel');
    var lcd = div('bb-lcd');
    var field = div('bb-field');
    var cells = makeCells(field, ROWS * COLS);
    var side = div('bb-side');

    function numBlock(label) {
      var blk = div();
      var lab = div('bb-lab'); lab.textContent = label;
      var num = div('bb-num');
      var g = document.createElement('span'); g.className = 'g'; g.textContent = '888888';
      var v = document.createElement('span'); v.className = 'v'; v.textContent = '000000';
      num.appendChild(g); num.appendChild(v);
      blk.appendChild(lab); blk.appendChild(num);
      return { blk: blk, num: num, v: v };
    }
    var score = numBlock('SCORE'), hi = numBlock('HI-SCORE');
    side.appendChild(score.blk); side.appendChild(hi.blk);

    var nextBlk = div();
    var nlab = div('bb-lab'); nlab.textContent = 'NEXT';
    var nextGrid = div('bb-next');
    var nextCells = makeCells(nextGrid, 16);
    nextBlk.appendChild(nlab); nextBlk.appendChild(nextGrid);
    side.appendChild(nextBlk);

    var info = div();
    function row(label) {
      var r = div('bb-row');
      var a = document.createElement('span'); a.textContent = label;
      var b = document.createElement('span'); b.textContent = '1';
      r.appendChild(a); r.appendChild(b); info.appendChild(r);
      return b;
    }
    var speedEl = row('SPEED'), levelEl = row('LEVEL');
    var lives = div('bb-lives none');
    var dots = [];
    for (var i = 0; i < 4; i++) { var dd = document.createElement('i'); lives.appendChild(dd); dots.push(dd); }
    info.appendChild(lives);
    side.appendChild(info);

    var icons = div('bb-icons', SPEAKER + PAUSE);
    side.appendChild(icons);
    var spk = icons.querySelector('.spk'), pse = icons.querySelector('.pse');

    lcd.appendChild(field); lcd.appendChild(side);
    bezel.appendChild(lcd);
    body.appendChild(bezel);

    var name = div('bb-name');
    body.appendChild(name);

    // Buttons. data-act is what the shell receives.
    var pills = div('bb-pills');
    [['onoff', 'ON/OFF'], ['start', 'START/PAUSE'], ['sound', 'SOUND'], ['reset', 'RESET']].forEach(function (p) {
      var pl = div('bb-pill'); pl.setAttribute('data-act', p[0]); pl.setAttribute('role', 'button'); pl.setAttribute('aria-label', p[1]);
      var i = document.createElement('i'); pl.appendChild(i);
      pl.appendChild(document.createTextNode(p[1]));
      pills.appendChild(pl);
    });
    body.appendChild(pills);

    var ctl = div('bb-ctl');
    var dpad = div('bb-dpad');
    [['u', 'up', '▲'], ['l', 'left', '◀'], ['m', '', ''], ['r', 'right', '▶'], ['d', 'down', '▼']].forEach(function (d) {
      var b = document.createElement('b'); b.className = d[0]; b.textContent = d[2];
      if (d[1]) { b.setAttribute('data-act', d[1]); b.setAttribute('role', 'button'); b.setAttribute('aria-label', d[1]); }
      dpad.appendChild(b);
    });
    var fire = div('bb-fire'); fire.setAttribute('data-act', 'fire'); fire.setAttribute('role', 'button'); fire.setAttribute('aria-label', 'rotate or fire');
    var fi = document.createElement('i'); fire.appendChild(fi);
    fire.appendChild(document.createTextNode('ROTATE / FIRE'));
    ctl.appendChild(dpad); ctl.appendChild(fire);
    body.appendChild(ctl);

    if (!phone) wrap.appendChild(keysCard());

    rootEl.textContent = '';
    rootEl.appendChild(wrap);

    // ---- drawing (only changes are written) ----
    var prevCells = new Array(ROWS * COLS).fill(0);
    var prevNext = new Array(16).fill(0);
    var txt = {};
    function setText(key, el, s) {
      if (txt[key] !== s) { txt[key] = s; el.textContent = s; }
    }
    function flag(key, el, cls, on) {
      on = !!on;
      if (txt[key] !== on) { txt[key] = on; el.classList.toggle(cls, on); }
    }

    var ui = {
      el: wrap, body: body, lcd: lcd,
      onButton: null, // set by the shell: function (action, isDown)

      setGrid: function (g) {
        for (var r = 0; r < ROWS; r++) {
          var row = g[r];
          for (var c = 0; c < COLS; c++) {
            var v = row[c] ? 1 : 0, k = r * COLS + c;
            if (prevCells[k] !== v) { prevCells[k] = v; cells[k].classList.toggle('on', v === 1); }
          }
        }
      },
      setNext: function (n) {
        for (var r = 0; r < 4; r++) {
          for (var c = 0; c < 4; c++) {
            var v = n && n[r] && n[r][c] ? 1 : 0, k = r * 4 + c;
            if (prevNext[k] !== v) { prevNext[k] = v; nextCells[k].classList.toggle('on', v === 1); }
          }
        }
      },
      setScore: function (v) { setText('score', score.v, digits(v, 6)); },
      setHi: function (v) { setText('hi', hi.v, digits(v, 6)); },
      showScore: function (on) { flag('scoreShow', score.num, 'hide', !on); },
      setSpeed: function (v) { setText('speed', speedEl, String(v)); },
      setLevel: function (v) { setText('level', levelEl, String(v)); },
      // lives: integer or null (null hides the dots)
      setLives: function (n) {
        flag('livesNone', lives, 'none', n === null || n === undefined);
        var cnt = n | 0;
        for (var i = 0; i < dots.length; i++) flag('dot' + i, dots[i], 'on', i < cnt);
      },
      setName: function (s) { setText('name', name, s); },
      setSound: function (on) { flag('spk', spk, 'off', !on); },
      setPause: function (on) { flag('pse', pse, 'off', !on); },
      setPower: function (on) { flag('power', lcd, 'dark', !on); flag('led', led, 'off', !on); },

      // Pick the cell size so the console fits the screen.
      fit: function () {
        var c;
        if (phone) {
          var aw = bezel.clientWidth - 20, ah = bezel.clientHeight - 20;
          c = Math.min(aw / 18.8, ah / 22.9);
        } else {
          lcd.style.setProperty('--c', '22px');
          lcd.style.setProperty('--n', '17.6px');
          var overhead = body.offsetHeight - lcd.offsetHeight;
          c = Math.min(22, (root.innerHeight - 28 - overhead) / 22.9);
        }
        c = Math.max(6, Math.floor(c * 10) / 10);
        lcd.style.setProperty('--c', c + 'px');
        lcd.style.setProperty('--n', (Math.round(c * 0.8 * 10) / 10) + 'px');
      }
    };

    // ---- pointer input: multi-touch, one entry per pointer ----
    var active = {}; // pointerId -> element
    function press(el, id) {
      if (active[id]) return;
      active[id] = el;
      el.classList.add('act');
      if (ui.onButton) ui.onButton(el.getAttribute('data-act'), true);
    }
    function release(id) {
      var el = active[id];
      if (!el) return;
      delete active[id];
      el.classList.remove('act');
      if (ui.onButton) ui.onButton(el.getAttribute('data-act'), false);
    }
    body.addEventListener('pointerdown', function (e) {
      var el = e.target.closest ? e.target.closest('[data-act]') : null;
      if (!el || !body.contains(el)) return;
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointers cannot be captured */ }
      if (root.navigator && navigator.vibrate) navigator.vibrate(8);
      press(el, e.pointerId);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) {
      body.addEventListener(t, function (e) { release(e.pointerId); });
    });
    body.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    body.addEventListener('dragstart', function (e) { e.preventDefault(); });
    root.addEventListener('blur', function () { Object.keys(active).forEach(release); });

    return ui;
  }

  root.BBConsole = { create: create, ROWS: ROWS, COLS: COLS };
})(window);
