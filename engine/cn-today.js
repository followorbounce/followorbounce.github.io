<script>
(function(){
  /* Live from the creative network's public endpoint (CORS-open to this origin only). It answers as a
     signed-out viewer: today's task + the newest public, unhidden works. Nothing is inserted as HTML. */
  var APP = 'https://creative-network.pages.dev';
  var API = window.__cnApi || (APP + '/api/public/today');
  var card = document.getElementById('cn-card'), wrap = document.getElementById('cn-works'), grid = document.getElementById('cn-grid');
  function el(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }
  function link(path){ return /^\/#\//.test(path || '') ? APP + path : APP + '/'; }
  function safeImg(u){ return typeof u === 'string' && u.indexOf(APP + '/media/') === 0 ? u : null; }
  function term(s){ return String(s).replace(/-/g, ' '); }
  function fmtDate(id){ var d = new Date(id + 'T12:00:00Z'); return isNaN(d) ? '' : d.toLocaleDateString('en-GB', {day:'numeric', month:'short', timeZone:'UTC'}); }
  function fail(){
    card.classList.remove('bf-skel'); card.classList.add('no-img'); card.textContent = '';
    var b = el('div','bf-body'); b.appendChild(el('div','bf-cat','Creative network'));
    var t = el('h2','bf-title'); var a = el('a',null,'Open today’s brief in the creative network'); a.href = APP + '/#/today'; t.appendChild(a);
    b.appendChild(t); card.appendChild(b);
  }
  /* Decorative stand-in when the brief has no picture: a seeded field of dots, a few of them breaking the rhythm. */
  function dots(seed){
    var h = 2166136261; for(var i=0;i<seed.length;i++){ h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
    function rnd(){ h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; }
    var NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('aria-hidden', 'true');
    for(var y=0;y<7;y++) for(var x=0;x<7;x++){
      var c = document.createElementNS(NS, 'circle'), big = rnd() < 0.08;
      c.setAttribute('cx', 8 + x*14); c.setAttribute('cy', 8 + y*14); c.setAttribute('r', big ? 6.2 : 2.6);
      c.setAttribute('fill', big ? 'var(--accent)' : 'var(--ink)'); svg.appendChild(c);
    }
    return svg;
  }
  /* A brief without an uploaded picture has its key visual drawn in code by the app: load the app's own
     generator (/js/art.js) so the homepage shows exactly the same picture. It returns an SVG data URI. */
  function drawArt(kind, seed, ok, bad){
    function go(){ try { var A = window.CN && window.CN.Art; if(A && A.kinds.indexOf(kind) >= 0) ok(A.uri(kind, seed)); else bad(); } catch(e){ bad(); } }
    if(window.CN && window.CN.Art) return go();
    var sc = document.createElement('script'); sc.src = APP + '/js/art.js'; sc.async = true;
    sc.onload = go; sc.onerror = bad; document.head.appendChild(sc);
  }
  function render(d){
    var t = d.task;
    card.classList.remove('bf-skel'); card.textContent = '';
    if(t){
      var body = el('div','bf-body');
      var k = el('div','bf-cat'); k.appendChild(document.createTextNode('Today · ' + fmtDate(t.id) + (t.difficulty ? ' · ' + t.difficulty : ''))); body.appendChild(k);
      var h = el('h2','bf-title'); var a = el('a', null, t.hook_title || 'Today’s brief'); a.href = link(t.url); h.appendChild(a); body.appendChild(h);
      if(t.subtitle) body.appendChild(el('div','cn-sub', t.subtitle));
      var sum = [t.concept, t.design_goal].filter(Boolean).join(' ');
      if(sum) body.appendChild(el('p','bf-sum', sum));
      var meta = el('div','bf-meta');
      (t.terms || []).forEach(function(s){ meta.appendChild(el('span','bf-chip', term(s))); });
      if(t.time_limit_minutes) meta.appendChild(el('span','bf-time','⏱ ' + t.time_limit_minutes + ' min'));
      var r = el('a','bf-read','Answer the brief →'); r.href = link(t.url); meta.appendChild(r);
      body.appendChild(meta); card.appendChild(body);
      var fig = el('a','bf-fig cn-fig'); fig.href = link(t.url); fig.tabIndex = -1; fig.setAttribute('aria-hidden','true');
      function show(src){
        var im = document.createElement('img'); im.alt = ''; im.decoding = 'async';
        im.addEventListener('load', function(){ im.classList.add('ok'); });
        im.addEventListener('error', function(){ im.remove(); fig.appendChild(dots(t.id)); });
        if(src.indexOf('data:') === 0) im.className = 'cn-art';   /* code-drawn art fills the frame, as in the app */
        im.src = src; fig.appendChild(im);
      }
      var src = safeImg(t.image_url);
      if(src) show(src);
      else if(/^[a-z]+$/.test(t.image_art || '')) drawArt(t.image_art, String(t.image_seed || 'task-' + t.id), show, function(){ fig.appendChild(dots(t.id)); });
      else fig.appendChild(dots(t.id));
      card.classList.remove('no-img'); card.appendChild(fig);
    } else fail();
    var works = (d.works || []).filter(function(w){ return safeImg(w.image_url); }).slice(0, 8);
    grid.textContent = '';
    works.forEach(function(w){
      var li = el('li'), a = el('a','cn-tile'); a.href = link(w.url);
      var who = (w.author && (w.author.name || w.author.handle)) || 'Member';
      a.setAttribute('aria-label', (w.kind === 'frame' ? 'OneFrame photograph' : 'Visual key') + ' by ' + who + (w.image_alt ? ': ' + w.image_alt : ''));
      var th = el('div','cn-thumb'), im = document.createElement('img'); im.alt = ''; im.loading = 'lazy'; im.decoding = 'async';
      im.addEventListener('load', function(){ im.classList.add('ok'); });
      im.addEventListener('error', function(){ li.remove(); if(!grid.children.length) wrap.hidden = true; });
      im.src = safeImg(w.image_url); th.appendChild(im); th.appendChild(el('span','cn-kind', w.kind === 'frame' ? 'OneFrame' : 'Key'));
      var cap = el('div','cn-cap'), n = el('span','cn-who', '@' + ((w.author && w.author.handle) || 'member'));
      if(w.author && w.author.resident) n.appendChild(el('span','cn-res','Resident · scripted'));   /* scripted members are always labelled */
      cap.appendChild(n); cap.appendChild(el('span','cn-terms', (w.terms || []).map(term).join(' · ') || fmtDate(w.date)));
      a.appendChild(th); a.appendChild(cap); li.appendChild(a); grid.appendChild(li);
    });
    wrap.hidden = !works.length;
  }
  var ctl = new AbortController(), to = setTimeout(function(){ ctl.abort(); }, 8000);
  fetch(API, {signal: ctl.signal, credentials: 'omit'}).then(function(r){ if(!r.ok) throw 0; return r.json(); })
    .then(function(d){ clearTimeout(to); if(!d || !d.ok) throw 0; render(d); })
    .catch(function(){ clearTimeout(to); fail(); });
})();
</script>
