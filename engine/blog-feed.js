<script>
(function(){
  /* Only the "Art tasks" category (slug art-tasks) feeds this card, so a post from another category never shows up here.
     Fetched live on every page view — no rebuild needed when the blog publishes. */
  var API = 'https://public-api.wordpress.com/rest/v1.1/sites/designdivinefuture.wordpress.com/posts/?number=1&category=art-tasks&fields=title,URL,content,categories';
  var BLOG = 'https://designdivinefuture.wordpress.com/category/art-tasks/';   /* fallback link target: the Art tasks archive */
  var card = document.getElementById('bf-card');
  function el(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }
  function clean(s){ return (s || '').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim(); }
  function fail(){
    card.classList.remove('bf-skel'); card.classList.add('no-img'); card.textContent = '';
    var b = el('div','bf-body'); b.appendChild(el('div','bf-cat','Blog'));
    var t = el('h2','bf-title'); var a = el('a',null,'Design, Divine & Future \u2014 read the latest art task'); a.href = BLOG; t.appendChild(a);
    b.appendChild(t); card.style.gridTemplateColumns = '1fr'; card.style.gridTemplateAreas = '"body"'; card.appendChild(b);
  }
  /* The post body is parsed as an inert document (nothing from it is ever inserted as HTML). */
  function parse(html){
    var doc = new DOMParser().parseFromString(html || '', 'text/html');
    var img = doc.querySelector('img');
    var out = { img: null, paras: [] };
    if(img){
      var src = img.getAttribute('src') || img.getAttribute('data-orig-file') || '';
      if(/^https:\/\//.test(src)) out.img = { src: src.split('?')[0] + '?w=576', alt: clean(img.getAttribute('alt')) };
    }
    doc.querySelectorAll('br').forEach(function(b){ b.replaceWith(' '); });   /* line breaks were gluing words together */
    doc.querySelectorAll('p').forEach(function(p){ var t = clean(p.textContent); if(t) out.paras.push(t); });
    return out;
  }
  function find(paras, re){ for(var i=0;i<paras.length;i++){ var m = re.exec(paras[i]); if(m) return m; } return null; }
  /* Posts follow a loose template ("Design terms applied:" / "Terms:" / "Design Terms Used:", "Concept summary:" / "Concept:" / just "Exercise:"),
     so each field is looked up by several labels and the summary falls back to the first real sentence. */
  var BOILER = /^(use .*dictionary|time limit:|(design )?terms( applied| used)?:|concept( summary)?:|baseline|exercise( steps)?:?$)/i;
  function summaryOf(paras){
    var m = find(paras, /^Concept(?: summary)?:\s*(.{20,})$/i); if(m) return m[1];
    for(var i=0;i<paras.length;i++){
      if(/^exercise( steps)?:?$/i.test(paras[i]) && paras[i+1] && paras[i+1].length > 40) return paras[i+1];
      var e = /^exercise( steps)?:\s*(.{40,})$/i.exec(paras[i]); if(e) return e[2];
    }
    for(var k=0;k<paras.length;k++) if(paras[k].length > 60 && !BOILER.test(paras[k])) return paras[k];
    return '';
  }
  function render(p){
    var c = parse(p.content);
    var time = find(c.paras, /^time limit:\s*(.+)$/i), terms = find(c.paras, /^(?:design )?terms(?: applied| used)?:\s*(.+)$/i);
    var summary = summaryOf(c.paras);
    var cat = Object.keys(p.categories || {})[0] || 'Post';
    card.classList.remove('bf-skel'); card.classList.toggle('no-img', !c.img); card.textContent = '';
    var body = el('div','bf-body');
    body.appendChild(el('div','bf-cat', cat));
    var h = el('h2','bf-title'); var a = el('a', null, clean(new DOMParser().parseFromString(p.title, 'text/html').body.textContent)); a.href = p.URL; h.appendChild(a); body.appendChild(h);
    if(summary) body.appendChild(el('p','bf-sum', summary));
    var meta = el('div','bf-meta');
    if(terms) terms[1].split(/\s*[,\u00b7]\s*/).forEach(function(t){ if(t) meta.appendChild(el('span','bf-chip', t)); });
    if(time) meta.appendChild(el('span','bf-time','\u23F1 ' + time[1]));
    var r = el('a','bf-read','Read the post \u2192'); r.href = p.URL; meta.appendChild(r);
    body.appendChild(meta);
    card.appendChild(body);
    if(c.img){
      var fig = el('a','bf-fig'); fig.href = p.URL; fig.tabIndex = -1; fig.setAttribute('aria-hidden','true');   /* decorative link: the title already links */
      var im = document.createElement('img'); im.alt = ''; im.decoding = 'async'; im.referrerPolicy = 'no-referrer';
      im.addEventListener('load', function(){ im.classList.add('ok'); });
      im.addEventListener('error', function(){ fig.remove(); card.classList.add('no-img'); });
      im.src = c.img.src; fig.appendChild(im); card.appendChild(fig);
    }
  }
  var ctl = new AbortController(), to = setTimeout(function(){ ctl.abort(); }, 8000);
  fetch(API, {signal: ctl.signal}).then(function(r){ if(!r.ok) throw 0; return r.json(); })
    .then(function(d){ clearTimeout(to); if(!d.posts || !d.posts[0]) throw 0; render(d.posts[0]); })
    .catch(function(){ clearTimeout(to); fail(); });
})();
</script>
