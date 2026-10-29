/* Reckoning: signal of the day. Reads the 26 International Code flags (drawn by Reckoning's own flag code,
   with their single-letter meanings and Morse) from /reckoning/assets/signal-of-day.json (same origin), so this
   card holds no copy of the code. Picks today's flag with a date-seeded hash; "Another flag" picks at random.
   Text goes in with textContent; only the flag SVG from that file is inserted as markup. */
(function () {
  'use strict';
  var root = document.getElementById('sd-card');
  if (!root) return;
  var URL = window.__sdUrl || '/reckoning/assets/signal-of-day.json';
  var el = function (id) { return document.getElementById(id); };
  var flags = [], cur = -1;
  function fail() {
    root.classList.remove('bf-skel');
    el('sd-title').textContent = 'Reckoning';
    el('sd-sum').textContent = 'The signal of the day could not be loaded just now. Open the code flags to read all 26.';
    el('sd-shuffle').disabled = true;
  }
  function dayIndex(n) {
    var d = new Date(), s = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ':signal', h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h % n;
  }
  function show(i) {
    var f = flags[i]; cur = i;
    root.classList.remove('bf-skel');
    el('sd-cat').textContent = 'Signal of the day';
    el('sd-title').textContent = f.L + ' · ' + f.word;
    el('sd-sum').textContent = f.meaning;
    var note = el('sd-note'); note.hidden = !f.note; note.textContent = f.note || '';
    var m = el('sd-morse'); m.textContent = '';
    f.morse.split('').forEach(function (c) { var b = document.createElement('i'); b.className = c === '.' ? 'dot' : 'dash'; m.appendChild(b); });
    var lab = document.createElement('span'); lab.textContent = 'Morse ' + f.morse.replace(/\./g, '·').replace(/-/g, '–'); m.appendChild(lab);
    var chip = el('sd-chip'); chip.hidden = false; chip.textContent = 'flown alone: ' + f.L;
    el('sd-open').href = f.url;
    var fig = el('sd-fig'); fig.innerHTML = f.svg;
    var L = document.createElement('span'); L.className = 'sd-letter'; L.textContent = f.L; fig.appendChild(L);
  }
  var done = false, t = setTimeout(function () { if (!done) { done = true; fail(); } }, 8000);
  fetch(URL, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
    .then(function (j) {
      if (done) return; done = true; clearTimeout(t);
      flags = (j && j.flags || []).filter(function (f) { return f && /^[A-Z]$/.test(f.L) && typeof f.svg === 'string' && f.svg.indexOf('<svg') === 0 && f.svg.indexOf('<script') < 0; });
      if (!flags.length) return fail();
      show(dayIndex(flags.length));
    }).catch(function () { if (!done) { done = true; clearTimeout(t); fail(); } });
  el('sd-shuffle').addEventListener('click', function () {
    if (flags.length < 2) return;
    var i; do { i = Math.floor(Math.random() * flags.length); } while (i === cur);
    show(i);
  });
})();
