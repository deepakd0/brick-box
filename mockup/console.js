// BRICK BOX 12-in-1: static mockup renderer (HTML/CSS only, no dependencies).
// window.renderConsole(container, {game, frame, score, hiscore, speed, level, next, layout})
// window.renderLCD(container, opts, cellPx)   LCD only (used by the gallery cards)
(function () {
  var CSS = [
    '.bb-lcd{--c:20px;box-sizing:border-box;display:flex;gap:calc(var(--c)*.8);padding:calc(var(--c)*1.2);background:#9ead86;',
    ' color:#1b1f15;border-radius:calc(var(--c)*.3);box-shadow:inset 0 0 calc(var(--c)*1.2) rgba(40,50,25,.45),inset 0 2px 4px rgba(0,0,0,.35);',
    ' font-family:"Courier New",Courier,monospace;position:relative;overflow:hidden}',
    '.bb-lcd::before{content:"";position:absolute;inset:0;background:linear-gradient(115deg,rgba(255,255,255,.14),rgba(255,255,255,0) 40%);pointer-events:none}',
    '.bb-field{display:grid;grid-template-columns:repeat(10,var(--c));border:calc(var(--c)*.14) solid #1b1f15;padding:calc(var(--c)*.1);flex:none}',
    '.bb-cell{position:relative;width:var(--c);height:var(--c);box-sizing:border-box;color:#1b1f15;opacity:.12;border:calc(var(--c)*.12) solid currentColor}',
    '.bb-cell::after{content:"";position:absolute;inset:calc(var(--c)*.14);background:currentColor}',
    '.bb-cell.on{opacity:1}',
    '.bb-side{width:calc(var(--c)*5);display:flex;flex-direction:column;justify-content:space-between;font-weight:bold}',
    '.bb-lab{font-size:calc(var(--c)*.55);letter-spacing:.06em;line-height:1.2}',
    '.bb-num{position:relative;display:inline-block;font-size:calc(var(--c)*.9);letter-spacing:.02em;line-height:1.1}',
    '.bb-num .g{opacity:.1}',
    '.bb-num .v{position:absolute;left:0;top:0}',
    '.bb-next{display:grid;grid-template-columns:repeat(4,var(--n));margin-top:calc(var(--c)*.2)}',
    '.bb-next .bb-cell{width:var(--n);height:var(--n);border-width:calc(var(--n)*.12)}',
    '.bb-next .bb-cell::after{inset:calc(var(--n)*.14)}',
    '.bb-row{display:flex;justify-content:space-between;font-size:calc(var(--c)*.6);letter-spacing:.06em}',
    '.bb-icons{display:flex;gap:calc(var(--c)*.5);align-items:center}',
    '.bb-icons svg{width:calc(var(--c)*.95);height:calc(var(--c)*.95);fill:#1b1f15}',
    '.bb-icons .off{opacity:.15}',

    '.bb-body{box-sizing:border-box;position:relative;border-radius:34px;padding:16px 16px 22px;font-family:Arial,Helvetica,sans-serif;',
    ' background:linear-gradient(160deg,#f1d75a 0%,#e3bf33 55%,#cba51f 100%);',
    ' box-shadow:inset 0 2px 3px rgba(255,255,255,.55),inset 0 -6px 10px rgba(110,80,0,.35),0 14px 30px rgba(0,0,0,.55);',
    ' display:flex;flex-direction:column;align-items:stretch;gap:12px}',
    '.bb-top{display:flex;align-items:baseline;justify-content:space-between;padding:4px 10px 0}',
    '.bb-brand{font-weight:900;font-style:italic;font-size:26px;letter-spacing:.08em;color:#b3261e;text-shadow:1px 1px 0 rgba(255,255,255,.4)}',
    '.bb-12{font-weight:bold;font-size:15px;color:#3a3a3a;letter-spacing:.12em}',
    '.bb-led{width:9px;height:9px;border-radius:50%;background:#d22;box-shadow:0 0 6px #f44;margin-left:8px}',
    '.bb-bezel{background:linear-gradient(#4a4d4b,#2f322f);border-radius:16px;padding:10px;box-shadow:inset 0 2px 5px rgba(0,0,0,.7),0 1px 0 rgba(255,255,255,.4)}',
    '.bb-bezel .bb-lcd{width:100%}',
    '.bb-name{font-variant:small-caps;text-transform:lowercase;font-size:15px;font-weight:bold;letter-spacing:.14em;color:#4a3a05;text-align:center}',
    '.bb-pills{display:flex;justify-content:space-between;gap:8px;padding:0 6px}',
    '.bb-pill{flex:1;text-align:center;font-size:9px;font-weight:bold;color:#4a3a05;letter-spacing:.05em}',
    '.bb-pill i{display:block;height:var(--ph,22px);border-radius:999px;margin:0 auto 4px;max-width:78px;',
    ' background:linear-gradient(#6a6e6a,#3b3e3b);box-shadow:0 2px 0 #1c1d1c,inset 0 1px 1px rgba(255,255,255,.35)}',
    '.bb-ctl{display:flex;justify-content:space-between;align-items:center;padding:6px 8px 0}',
    '.bb-dpad{display:grid;grid-template-columns:repeat(3,var(--dp));grid-template-rows:repeat(3,var(--dp))}',
    '.bb-dpad b{background:linear-gradient(#52564f,#2c2f2b);box-shadow:0 2px 0 #151615,inset 0 1px 1px rgba(255,255,255,.3);',
    ' display:flex;align-items:center;justify-content:center;color:#cfd4c4;font-size:calc(var(--dp)*.34)}',
    '.bb-dpad .u{grid-area:1/2;border-radius:10px 10px 0 0}.bb-dpad .l{grid-area:2/1;border-radius:10px 0 0 10px}',
    '.bb-dpad .r{grid-area:2/3;border-radius:0 10px 10px 0}.bb-dpad .d{grid-area:3/2;border-radius:0 0 10px 10px}',
    '.bb-dpad .m{grid-area:2/2;background:linear-gradient(#2c2f2b,#3a3d38)}',
    '.bb-fire{text-align:center;font-size:10px;font-weight:bold;color:#4a3a05;letter-spacing:.08em}',
    '.bb-fire i{display:block;width:var(--fb);height:var(--fb);border-radius:50%;margin:0 auto 8px;',
    ' background:radial-gradient(circle at 35% 30%,#ff7a6a,#c92a1c 60%,#8e1b11);box-shadow:0 5px 0 #5c0f08,0 8px 10px rgba(0,0,0,.4),inset 0 2px 3px rgba(255,255,255,.5)}',

    '.bb-laptop{display:flex;gap:40px;align-items:flex-start;justify-content:center;width:780px;margin:0 auto}',
    '.bb-laptop .bb-body{width:450px;flex:none;--dp:52px;--fb:84px}',
    '.bb-keys{width:280px;box-sizing:border-box;margin-top:60px;padding:18px 20px;border-radius:14px;background:#262626;color:#ddd;',
    ' font-family:Arial,Helvetica,sans-serif;font-size:14px;box-shadow:0 6px 18px rgba(0,0,0,.4)}',
    '.bb-keys h3{margin:0 0 12px;font-size:13px;letter-spacing:.14em;color:#e3bf33}',
    '.bb-keys div{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-top:1px solid #3a3a3a}',
    '.bb-keys kbd{background:#3c3c3c;border-bottom:3px solid #111;border-radius:5px;padding:3px 8px;font:bold 12px "Courier New",monospace;color:#fff}',

    '.bb-phone{width:390px;min-height:844px;margin:0 auto}',
    '.bb-phone .bb-body{min-height:844px;border-radius:0;padding:18px 14px 28px;justify-content:space-between;--dp:64px;--fb:108px;--ph:30px}',
    '.bb-phone .bb-pill{font-size:8px}'
  ].join('\n');

  function injectCss() {
    if (document.getElementById('bb-css')) return;
    var s = document.createElement('style');
    s.id = 'bb-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function cells(rows) {
    var out = '';
    for (var r = 0; r < rows.length; r++) {
      for (var c = 0; c < rows[r].length; c++) {
        out += '<div class="bb-cell' + (rows[r][c] === '#' ? ' on' : '') + '"></div>';
      }
    }
    return out;
  }

  function digits(n) {
    return String(n).padStart(6, '0');
  }

  function num(n) {
    return '<span class="bb-num"><span class="g">888888</span><span class="v">' + digits(n) + '</span></span>';
  }

  var SPEAKER = '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 4V5L7 9H3z"/><path d="M15 8a5 5 0 0 1 0 8M17.5 5.5a9 9 0 0 1 0 13" fill="none" stroke="#1b1f15" stroke-width="2" stroke-linecap="round"/></svg>';
  var PAUSE = '<svg class="off" viewBox="0 0 24 24"><rect x="5" y="4" width="5" height="16"/><rect x="14" y="4" width="5" height="16"/></svg>';

  function lcdHTML(o, c) {
    var n = Math.round(c * 0.8 * 10) / 10;
    return '<div class="bb-lcd" style="--c:' + c + 'px;--n:' + n + 'px">' +
      '<div class="bb-field">' + cells(o.frame) + '</div>' +
      '<div class="bb-side">' +
        '<div><div class="bb-lab">SCORE</div>' + num(o.score) + '</div>' +
        '<div><div class="bb-lab">HI-SCORE</div>' + num(o.hiscore) + '</div>' +
        '<div><div class="bb-lab">NEXT</div><div class="bb-next">' + cells(o.next) + '</div></div>' +
        '<div><div class="bb-row"><span>SPEED</span><span>' + esc(o.speed) + '</span></div>' +
        '<div class="bb-row"><span>LEVEL</span><span>' + esc(o.level) + '</span></div></div>' +
        '<div class="bb-icons">' + SPEAKER + PAUSE + '</div>' +
      '</div></div>';
  }

  function consoleHTML(o, c) {
    var name = typeof o.game === 'string' ? o.game : o.game.name;
    var pills = ['ON/OFF', 'START/PAUSE', 'SOUND', 'RESET'].map(function (t) {
      return '<div class="bb-pill"><i></i>' + t + '</div>';
    }).join('');
    return '<div class="bb-body">' +
      '<div class="bb-top"><span class="bb-brand">BRICK BOX</span><span style="display:flex;align-items:center"><span class="bb-12">12 in 1</span><span class="bb-led"></span></span></div>' +
      '<div class="bb-bezel">' + lcdHTML(o, c) + '</div>' +
      '<div class="bb-name">' + esc(name) + '</div>' +
      '<div class="bb-pills">' + pills + '</div>' +
      '<div class="bb-ctl">' +
        '<div class="bb-dpad"><b class="u">&#9650;</b><b class="l">&#9664;</b><b class="m"></b><b class="r">&#9654;</b><b class="d">&#9660;</b></div>' +
        '<div class="bb-fire"><i></i>ROTATE / FIRE</div>' +
      '</div></div>';
  }

  var KEYS = [
    ['Arrow keys', 'Move'],
    ['Up / Space', 'Rotate / Fire'],
    ['Enter', 'Start / Pause'],
    ['M', 'Sound'],
    ['R', 'Reset']
  ];

  function renderConsole(container, o) {
    injectCss();
    var layout = o.layout || 'laptop';
    var opts = {
      game: o.game, frame: o.frame, next: o.next,
      score: o.score, hiscore: o.hiscore, speed: o.speed, level: o.level
    };
    if (layout === 'phone') {
      container.innerHTML = '<div class="bb-phone">' + consoleHTML(opts, 17) + '</div>';
    } else {
      var keys = '<div class="bb-keys"><h3>KEYBOARD</h3>' + KEYS.map(function (k) {
        return '<div><kbd>' + esc(k[0]) + '</kbd><span>' + esc(k[1]) + '</span></div>';
      }).join('') + '</div>';
      container.innerHTML = '<div class="bb-laptop">' + consoleHTML(opts, 22) + keys + '</div>';
    }
  }

  function renderLCD(container, o, cellPx) {
    injectCss();
    container.innerHTML = lcdHTML(o, cellPx || 14);
  }

  window.renderConsole = renderConsole;
  window.renderLCD = renderLCD;
})();
