<script>
/* Country atlas · borders (2026-10-16). The graph code and data are NOT copied here: they are loaded from
   the country-atlas repo (/country-atlas/js/data/borders.js + js/viz/borders.js) the first time the tab is
   shown, so fixes there reach the homepage without a rebuild. Fallback: a plain link after 10 s or an error. */
(function(){
  var root = document.querySelector('section.cborders');
  if(!root) return;
  var started = false;
  function fail(){
    var w = document.getElementById('cb-wait');
    if(w){ w.textContent = 'The border graph could not be loaded just now. '; var a = document.createElement('a'); a.href = '/country-atlas/'; a.textContent = 'Open the Country Atlas →'; w.appendChild(a); }
  }
  function load(src, done){
    var s = document.createElement('script'); s.src = src; s.onload = done; s.onerror = fail; document.head.appendChild(s);
  }
  function start(){
    if(started) return; started = true;
    var timer = setTimeout(fail, 10000);
    load('/country-atlas/js/data/borders.js', function(){
      load('/country-atlas/js/viz/borders.js', function(){
        clearTimeout(timer);
        try {
          BordersViz.init({ root: root, base: '/country-atlas/' });
          root.classList.add('cb-ready');
        } catch(e){ fail(); }
      });
    });
  }
  // The tab panel is display:none until chosen, so this fires only when the graph is actually on screen.
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es, io){ if(es[0].isIntersecting){ io.disconnect(); start(); } }).observe(root);
  } else start();
})();
</script>
