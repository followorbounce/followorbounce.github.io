/* Knot Atlas: knot of the day. Fetches the compact feed published by /knots/ (same origin),
   picks today's knot with a date-seeded hash, and draws it on a 2D canvas as it is tied,
   one step at a time. Painter's algorithm on short rope chunks gives over/under. */
(function () {
  'use strict';
  var root = document.getElementById('kd-card');
  if (!root) return;
  var BASE = window.__kdBase || '/knots/';
  var cv = document.getElementById('kd-cv');
  var ctx = cv.getContext('2d');
  var el = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ROPE = { a: ['#d39a2c', '#7a4f0c'], b: ['#2f7f8a', '#14424a'], c: ['#b5523a', '#5c2214'] };
  var list = [], cur = null, knot = null;
  var st = { pos: 0, target: 0, playing: !reduce, settled: 0, visible: true };
  var geo = null;

  function fail() {
    root.classList.remove('bf-skel');
    el('kd-title').textContent = 'Knot Atlas';
    el('kd-sum').textContent = 'The knot of the day could not be loaded just now. Open the atlas to tie knots step by step in 3D.';
    el('kd-step').textContent = '';
    el('kd-n').textContent = '';
    ['kd-prev', 'kd-play', 'kd-next', 'kd-shuffle'].forEach(function (id) { el(id).disabled = true; });
  }
  function getJSON(url) {
    return new Promise(function (res, rej) {
      var done = false;
      var t = setTimeout(function () { if (!done) { done = true; rej(new Error('timeout')); } }, 8000);
      fetch(url, { cache: 'no-cache' }).then(function (r) {
        if (!r.ok) throw new Error('http ' + r.status);
        return r.json();
      }).then(function (j) { if (!done) { done = true; clearTimeout(t); res(j); } })
        .catch(function (e) { if (!done) { done = true; clearTimeout(t); rej(e); } });
    });
  }
  function dayIndex(n) {
    var d = new Date();
    var s = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ':knots';
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h % n;
  }

  /* ---------- geometry prep: bounds and chunk lists ---------- */
  function prep(k) {
    var xs = [], ys = [];
    var ropes = k.ropes.map(function (r) {
      var p = r.p, pts = [];
      for (var i = 0; i < p.length; i += 3) { pts.push([p[i], p[i + 1], p[i + 2]]); xs.push(p[i]); ys.push(p[i + 1]); }
      return { c: r.c, pts: pts };
    });
    (k.objects || []).forEach(function (o) {
      var c = o.c, e;
      if (o.type === 'pole') {
        var L = o.len / 2, R = o.radius;
        if (o.axis === 'y') { xs.push(c[0] - R, c[0] + R); ys.push(c[1] - L, c[1] + L); }
        else { xs.push(c[0] - L, c[0] + L); ys.push(c[1] - R, c[1] + R); }
      } else { e = o.radius + (o.tube || 0); xs.push(c[0] - e, c[0] + e); ys.push(c[1] - e, c[1] + e); }
    });
    var b = { x0: Math.min.apply(null, xs), x1: Math.max.apply(null, xs), y0: Math.min.apply(null, ys), y1: Math.max.apply(null, ys) };
    return { ropes: ropes, b: b, r: k.r || 0.15, objects: k.objects || [] };
  }

  function visAt(pos) {
    var s = knot.steps, i = Math.max(0, Math.min(s.length - 1, Math.floor(pos))), f = pos - i;
    var a = s[i].v, n = s[Math.min(s.length - 1, i + 1)].v;
    return a.map(function (v, k) { return v + (n[k] - v) * f; });
  }

  function css(name, fb) {
    var v = getComputedStyle(root).getPropertyValue(name).trim();
    return v || fb;
  }

  function draw() {
    if (!geo) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = cv.clientWidth, H = cv.clientHeight;
    if (!W || !H) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var b = geo.b, pad = 18;
    var s = Math.min((W - 2 * pad) / (b.x1 - b.x0), (H - 2 * pad) / (b.y1 - b.y0));
    var ox = (W - (b.x1 - b.x0) * s) / 2, oy = (H - (b.y1 - b.y0) * s) / 2;
    function X(x) { return ox + (x - b.x0) * s; }
    function Y(y) { return oy + (b.y1 - y) * s; }
    var items = [];
    geo.objects.forEach(function (o) { items.push({ z: o.type === 'ring' || o.type === 'arc' ? -0.001 : 0, o: o }); });
    var vis = visAt(st.pos), r = geo.r;
    geo.ropes.forEach(function (rp, k) {
      var n = Math.round(Math.max(0, Math.min(1, vis[k])) * (rp.pts.length - 1));
      if (n < 1) return;
      for (var i = 0; i < n; i += 3) {
        var j = Math.min(n, i + 3), z = 0;
        for (var q = i; q <= j; q++) z += rp.pts[q][2];
        items.push({ z: z / (j - i + 1), rope: rp, i: i, j: j, n: n });
      }
    });
    items.sort(function (a, c) { return a.z - c.z; });
    var wood = css('--kd-wood', '#d8c39a'), metal = '#9aa3a6';
    items.forEach(function (it) {
      if (it.o) {
        var o = it.o, c = o.c;
        if (o.type === 'pole') {
          var L = o.len / 2, R = o.radius;
          ctx.fillStyle = o.metal ? metal : (o.rope ? '#e7c88a' : wood);
          if (o.axis === 'y') ctx.fillRect(X(c[0] - R), Y(c[1] + L), 2 * R * s, 2 * L * s);
          else ctx.fillRect(X(c[0] - L), Y(c[1] + R), 2 * L * s, 2 * R * s);
        } else {
          ctx.strokeStyle = metal; ctx.lineWidth = 2 * (o.tube || 0.08) * s;
          ctx.beginPath();
          if (o.type === 'ring') ctx.arc(X(c[0]), Y(c[1]), o.radius * s, 0, 2 * Math.PI);
          else ctx.arc(X(c[0]), Y(c[1]), o.radius * s, -o.a0, -o.a1, true);
          ctx.stroke();
        }
        return;
      }
      var p = it.rope.pts, col = ROPE[it.rope.c] || ROPE.a;
      var a = Math.max(0, it.i - 1), e = Math.min(it.n, it.j + 1);
      ctx.lineJoin = 'round';
      ctx.lineCap = (it.i === 0 || it.j === it.n) ? 'round' : 'butt';
      ctx.strokeStyle = col[1]; ctx.lineWidth = 2 * r * s + 2;
      ctx.beginPath(); ctx.moveTo(X(p[it.i][0]), Y(p[it.i][1]));
      for (var q = it.i + 1; q <= it.j; q++) ctx.lineTo(X(p[q][0]), Y(p[q][1]));
      ctx.stroke();
      ctx.lineCap = 'round';
      ctx.strokeStyle = col[0]; ctx.lineWidth = Math.max(1, 2 * r * s - 1.4);
      ctx.beginPath(); ctx.moveTo(X(p[a][0]), Y(p[a][1]));
      for (q = a + 1; q <= e; q++) ctx.lineTo(X(p[q][0]), Y(p[q][1]));
      ctx.stroke();
    });
  }

  // every step of the knot sits in the same grid cell; only the current one is visible,
  // so the box always has the height of the longest step and the page never jumps
  function buildSteps(k) {
    var box = el('kd-step');
    box.textContent = '';
    k.steps.forEach(function (s, i) {
      var sp = document.createElement('span');
      sp.className = 'kd-s'; sp.textContent = s.t; sp.setAttribute('aria-hidden', 'true');
      box.appendChild(sp);
    });
  }
  function showStep(i) {
    var n = knot.steps.length, kids = el('kd-step').children;
    el('kd-n').textContent = 'Step ' + (i + 1) + ' / ' + n;
    for (var j = 0; j < kids.length; j++) { var on = j === i; kids[j].classList.toggle('on', on); kids[j].setAttribute('aria-hidden', on ? 'false' : 'true'); }
    el('kd-live').textContent = 'Step ' + (i + 1) + ': ' + knot.steps[i].t;
  }
  function go(i) {
    var n = knot.steps.length;
    st.target = (i + n) % n;
    if (reduce) st.pos = st.target;
    st.settled = 0;
    showStep(st.target);
  }

  function render(k) {
    knot = k; geo = prep(k);
    root.classList.remove('bf-skel');
    el('kd-cat').textContent = 'Knot of the day · ' + k.chapter;
    el('kd-title').textContent = k.name;
    el('kd-sum').textContent = k.brief;
    var dots = ['', 'Easy', 'Intermediate', 'Advanced'][k.difficulty] || '';
    el('kd-chip-a').textContent = dots; el('kd-chip-a').hidden = !dots;
    el('kd-chip-b').textContent = (k.acts || []).slice(0, 2).join(' · '); el('kd-chip-b').hidden = !(k.acts || []).length;
    el('kd-open').href = BASE + 'knots/' + k.slug + '/';
    buildSteps(k);
    st.pos = 0; st.target = 0; st.settled = 0;
    if (reduce) { st.pos = st.target = k.steps.length - 1; }
    showStep(st.target);
    draw();
  }

  function load(slug) {
    return getJSON(BASE + 'feed/' + slug + '.json').then(render);
  }

  var last = 0;
  function tick(now) {
    requestAnimationFrame(tick);
    if (!knot || !st.visible) return;
    var dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
    var d = st.target - st.pos;
    if (Math.abs(d) > 1e-3) {
      if (d < -0.5) st.pos = st.target;
      else st.pos += Math.sign(d) * Math.min(Math.abs(d), Math.max(0.8, Math.abs(d) * 2) * dt);
      st.settled = 0;
      draw();
    } else {
      st.pos = st.target;
      if (!st.settled) { st.settled = now; draw(); }
      var hold = st.target === knot.steps.length - 1 ? 2600 : 1300;
      if (st.playing && now - st.settled > hold) go(st.target + 1);
    }
  }

  el('kd-prev').addEventListener('click', function () { if (knot) { st.playing = false; el('kd-play').textContent = 'Play'; go(st.target - 1); } });
  el('kd-next').addEventListener('click', function () { if (knot) { st.playing = false; el('kd-play').textContent = 'Play'; go(st.target + 1); } });
  el('kd-play').addEventListener('click', function () {
    st.playing = !st.playing; this.textContent = st.playing ? 'Pause' : 'Play'; st.settled = 0;
  });
  el('kd-shuffle').addEventListener('click', function () {
    if (list.length < 2) return;
    var j;
    do { j = Math.floor(Math.random() * list.length); } while (list[j].slug === cur);
    cur = list[j].slug;
    load(cur).catch(fail);
  });
  if (reduce) { st.playing = false; el('kd-play').textContent = 'Play'; }
  window.addEventListener('resize', draw);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { st.visible = es[0].isIntersecting; if (st.visible) draw(); }).observe(root);
  }
  try {
    new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  } catch (e) { /* ignore */ }

  getJSON(BASE + 'feed/index.json').then(function (ix) {
    list = ix.knots || [];
    if (!list.length) throw new Error('empty');
    cur = list[dayIndex(list.length)].slug;
    return load(cur);
  }).catch(fail);
  requestAnimationFrame(tick);
})();
