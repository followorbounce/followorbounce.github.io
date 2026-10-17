(function(){
  /* Edition date in the sticky bar. */
  var d = new Date();
  document.getElementById('ed-date').textContent = d.toLocaleDateString('en-GB', {weekday:'long', day:'numeric', month:'long', year:'numeric'});

  /* Instrument tabs: one stage section at a time. Hidden sections are display:none, so their animation loops
     pause (each instrument watches its own visibility); a resize event lets the shown canvas re-measure.
     Until the visitor picks a tab, each visit opens a different instrument (never the one shown last time,
     kept in fob-instrument-auto). Once they pick one, that choice (fob-instrument) is reopened instead.
     Both are per-viewer conveniences only: localStorage may be blocked, and then the pick is just random. */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.ed-tabs [role=tab]'));
  var secs = document.querySelectorAll('.ed-stage > section');
  var KEY = 'fob-instrument', AUTO = 'fob-instrument-auto';
  function store(k, v){ try { localStorage.setItem(k, v); } catch(e){} }
  function load(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
  function has(key){ return tabs.some(function(t){ return t.dataset.for === key; }); }
  function pick(key, focus){
    tabs.forEach(function(t){
      var on = t.dataset.for === key;
      t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1;
      if(on && focus) t.focus();
    });
    for(var i = 0; i < secs.length; i++) secs[i].hidden = secs[i].dataset.tab !== key;
    window.dispatchEvent(new Event('resize'));
  }
  function choose(key, focus){ pick(key, focus); store(KEY, key); }
  tabs.forEach(function(t, i){
    t.addEventListener('click', function(){ choose(t.dataset.for); });
    t.addEventListener('keydown', function(e){
      var n = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if(e.key === 'Home') n = -i; if(e.key === 'End') n = tabs.length - 1 - i;
      if(!n) return;
      e.preventDefault(); choose(tabs[(i + n + tabs.length) % tabs.length].dataset.for, true);
    });
  });
  var saved = load(KEY);
  if(saved && has(saved)) pick(saved);
  else if(tabs.length){
    var last = load(AUTO);
    var pool = tabs.map(function(t){ return t.dataset.for; }).filter(function(k){ return k !== last; });
    var next = pool[Math.floor(Math.random() * pool.length)];
    pick(next); store(AUTO, next);
  }

  /* Highlight the section in view. */
  var links = document.querySelectorAll('.ed-nav a');
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting) for(var i = 0; i < links.length; i++) links[i].classList.toggle('on', links[i].getAttribute('href') === '#' + e.target.id); });
    }, {rootMargin:'-40% 0px -55% 0px'});
    ['today','generative','instruments','live','index'].forEach(function(id){ var el = document.getElementById(id); if(el) io.observe(el); });
  }
})();
