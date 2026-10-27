(function(){
  /* Intro mascots: runs FobMascot (engine/mascot.js) on its own canvas in the first screen.
     Animates only while visible (in view + tab shown). The canvas lets phones scroll vertically (pan-y);
     a touch that lands on a character is kept for the stage, so Claude can still be dragged. */
  var cv=document.getElementById('mh-cv'),MS=window.FobMascot;
  if(!cv||!MS)return;
  var ctx=cv.getContext('2d'),W=1,H=1,dpr=1,raf=0,running=false,inView=false;
  function load(k){try{return localStorage.getItem(k);}catch(e){return null;}}
  function store(k,v){try{localStorage.setItem(k,v);}catch(e){}}
  function isDark(){var t=document.documentElement.getAttribute('data-theme');
    return t==='dark'||(!t&&window.matchMedia&&window.matchMedia('(prefers-color-scheme:dark)').matches);}
  function resize(){
    var r=cv.getBoundingClientRect();
    dpr=Math.min(window.devicePixelRatio||1,2);
    W=Math.max(1,Math.round(r.width*dpr));H=Math.max(1,Math.round(r.height*dpr));
    cv.width=W;cv.height=H;
  }
  MS.init(ctx,cv,{store:store,load:load});
  MS.opts(document.getElementById('mh-bar'));
  var hint=document.getElementById('mh-hint');
  if(hint&&window.matchMedia&&window.matchMedia('(pointer:coarse)').matches)hint.textContent='Tap a character · drag Claude to throw · tap the floor to send Claude';
  function loop(t){if(!running)return;try{MS.draw(t,W,H,dpr,isDark());}catch(e){}raf=requestAnimationFrame(loop);}
  function sync(){
    var on=inView&&!document.hidden;
    if(on&&!running){running=true;resize();raf=requestAnimationFrame(loop);}
    else if(!on&&running){running=false;cancelAnimationFrame(raf);MS.pause();}
  }
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){inView=es[0].isIntersecting;sync();},{threshold:0.05}).observe(cv);
  else{inView=true;sync();}
  document.addEventListener('visibilitychange',sync);
  window.addEventListener('resize',function(){if(running)resize();});
  cv.addEventListener('touchstart',function(e){var p=e.touches[0];if(p&&MS.hitAt(p.clientX,p.clientY))e.preventDefault();},{passive:false});
  cv.addEventListener('pointerdown',function(e){MS.pointer('down',e);});
  cv.addEventListener('pointermove',function(e){MS.pointer('move',e);});
  cv.addEventListener('pointerup',function(e){MS.pointer('up',e);});
  cv.addEventListener('pointercancel',function(e){MS.pointer('up',e);});
  cv.addEventListener('pointerleave',function(e){MS.pointer('leave',e);});
})();
