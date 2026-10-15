(function(){
  /* Edition date in the sticky bar. */
  var d = new Date();
  document.getElementById('ed-date').textContent = d.toLocaleDateString('en-GB', {weekday:'long', day:'numeric', month:'long', year:'numeric'});

  /* Instrument tabs: one stage section at a time. Hidden sections are display:none, so their animation loops
     pause (each instrument watches its own visibility); a resize event lets the shown canvas re-measure.
     The last choice is a per-viewer convenience only (localStorage may be blocked; the default is Generative). */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.ed-tabs [role=tab]'));
  var secs = document.querySelectorAll('.ed-stage > section');
  var KEY = 'fob-instrument';
  function pick(key, focus){
    tabs.forEach(function(t){
      var on = t.dataset.for === key;
      t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1;
      if(on && focus) t.focus();
    });
    for(var i = 0; i < secs.length; i++) secs[i].hidden = secs[i].dataset.tab !== key;
    window.dispatchEvent(new Event('resize'));
    try { localStorage.setItem(KEY, key); } catch(e){}
  }
  tabs.forEach(function(t, i){
    t.addEventListener('click', function(){ pick(t.dataset.for); });
    t.addEventListener('keydown', function(e){
      var n = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if(e.key === 'Home') n = -i; if(e.key === 'End') n = tabs.length - 1 - i;
      if(!n) return;
      e.preventDefault(); pick(tabs[(i + n + tabs.length) % tabs.length].dataset.for, true);
    });
  });
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch(e){}
  if(saved && saved !== 'gen' && tabs.some(function(t){ return t.dataset.for === saved; })) pick(saved);

  /* Highlight the section in view. */
  var links = document.querySelectorAll('.ed-nav a');
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting) for(var i = 0; i < links.length; i++) links[i].classList.toggle('on', links[i].getAttribute('href') === '#' + e.target.id); });
    }, {rootMargin:'-40% 0px -55% 0px'});
    ['today','instruments','live','index'].forEach(function(id){ var el = document.getElementById(id); if(el) io.observe(el); });
  }
})();
