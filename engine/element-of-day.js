<script>
/* The Logic of a Prompt & Life: element of the day. Reads the 21 elements from /assets/prompt-elements.json
   (same origin; written by _specs/prompt-logic/build.py from the page's own content), so this card keeps no copy.
   Picks today's element with a date-seeded hash; "Another element" picks at random. Text goes in with textContent
   only; the strong example arrives as [text, added] segments, so no markup is inserted. */
(function () {
  'use strict';
  var root = document.getElementById('el-card');
  if (!root) return;
  var URL = window.__elUrl || '/assets/prompt-elements.json';
  var el = function (id) { return document.getElementById(id); };
  var data = null, cur = -1;
  var DOMAINS = ['frame', 'premises', 'bounds', 'goal', 'evidence', 'testing', 'dialogue'];
  function fail() {
    root.classList.remove('bf-skel');
    el('el-title').textContent = 'The Logic of a Prompt & Life';
    el('el-sum').textContent = 'The element of the day could not be loaded just now. Open the page to read all 21.';
    el('el-shuffle').disabled = true;
  }
  function dayIndex(n) {
    var d = new Date(), s = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ':element', h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h % n;
  }
  function show(i) {
    var p = data.parts[i]; cur = i;
    root.classList.remove('bf-skel');
    root.setAttribute('data-d', p.domain);
    el('el-fig').setAttribute('data-d', p.domain);
    el('el-cat').textContent = p.family + ' · ' + p.familyLogic;
    el('el-title').textContent = p.name;
    el('el-sum').textContent = p.line;
    function labelled(id, label, text) { var n = el(id); n.textContent = ''; if (!text) { n.hidden = true; return; } var b = document.createElement('b'); b.textContent = label; n.appendChild(b); n.appendChild(document.createTextNode(text)); n.hidden = false; }
    labelled('el-logic', 'The logic', p.logic);
    labelled('el-pit', 'Watch out', p.pitfall);
    el('el-weak').textContent = p.weak;
    var st = el('el-strong'); st.textContent = '';
    p.strong.forEach(function (seg, k) {
      if (k) st.appendChild(document.createTextNode(' '));
      if (seg[1]) { var m = document.createElement('mark'); m.textContent = seg[0]; st.appendChild(m); }
      else st.appendChild(document.createTextNode(seg[0]));
    });
    el('el-flip').hidden = false;
    var g = el('el-guess'); g.textContent = ''; var b = document.createElement('b'); b.textContent = 'Leave it out:';
    g.appendChild(b); g.appendChild(document.createTextNode('the model guesses ' + p.guess.charAt(0).toLowerCase() + p.guess.slice(1))); g.hidden = false;
    var chip = el('el-chip'); chip.hidden = !p.maxim; chip.textContent = p.maxim ? 'Grice: ' + p.maxim : '';
    el('el-open').href = data.page + '#' + p.id;
    el('el-n').textContent = String(p.n);
    el('el-sym').textContent = p.sym;
    el('el-nm').textContent = p.name;
  }
  var done = false, t = setTimeout(function () { if (!done) { done = true; fail(); } }, 8000);
  fetch(URL, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
    .then(function (j) {
      if (done) return; done = true; clearTimeout(t);
      var parts = (j && j.parts || []).filter(function (p) {
        return p && /^[a-z-]+$/.test(p.id) && /^[A-Z][a-z]$/.test(p.sym) && DOMAINS.indexOf(p.domain) >= 0 && Array.isArray(p.strong);
      });
      if (!parts.length || typeof j.page !== 'string' || j.page.charAt(0) !== '/') return fail();
      data = { page: j.page, parts: parts };
      show(dayIndex(parts.length));
    }).catch(function () { if (!done) { done = true; clearTimeout(t); fail(); } });
  el('el-shuffle').addEventListener('click', function () {
    if (!data || data.parts.length < 2) return;
    var i; do { i = Math.floor(Math.random() * data.parts.length); } while (i === cur);
    show(i);
  });
})();
</script>
