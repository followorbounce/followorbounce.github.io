<script>
(function(){
  /* Studio mark: the logo's dot follows the ring once, then bounces on it (three bounces under one gravity, 0.8 s, 0.5 s, 0.3 s), then rests (9.6 s loop).
     Geometry = assets/favicon.svg scaled x9.33: ring r 9 -> 84, stroke 1.6 -> 14, dot r 2.6 -> 24, dot 9.6 above the centre -> 89.6.
     Runs only in view with the tab shown; reduced motion = the still logo. A tap replays the bounce. */
  var svg=document.getElementById('sm-svg');if(!svg)return;
  var dot=document.getElementById('sm-dot'),trail=document.getElementById('sm-trail'),ring=document.getElementById('sm-ring-g');
  var words={};Array.prototype.forEach.call(document.querySelectorAll('#studio-mark .sm-words span'),function(s){words[s.getAttribute('data-w')]=s;});
  var CX=200,CY=182,RR=84,RD=89.6,DR=24,L=9.6;
  var F0=1.2,F1=4.0,O1=4.8,B1=7.6;
  var H=[56,24,9],K=0.0535,TB=[];var sum=0;H.forEach(function(h){var d=2*K*Math.sqrt(h);TB.push(d);sum+=d;});
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function ease(p){return p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;}
  function setWords(f,o,b){[['follow',f],['or',o],['bounce',b]].forEach(function(x){var s=words[x[0]];if(!s)return;
    s.classList.toggle('on',x[1]===1);s.classList.toggle('done',x[1]===2);});}
  function arc(a0,a1){if(a1-a0<0.01)return '';var x0=CX+RR*Math.cos(a0),y0=CY+RR*Math.sin(a0),x1=CX+RR*Math.cos(a1),y1=CY+RR*Math.sin(a1);
    return 'M'+x0.toFixed(2)+' '+y0.toFixed(2)+'A'+RR+' '+RR+' 0 '+(a1-a0>Math.PI?1:0)+' 1 '+x1.toFixed(2)+' '+y1.toFixed(2);}
  function place(x,y,sx,sy){dot.setAttribute('cx',x.toFixed(2));dot.setAttribute('cy',y.toFixed(2));dot.setAttribute('rx',(DR*sx).toFixed(2));dot.setAttribute('ry',(DR*sy).toFixed(2));}
  function squashRing(k){ring.setAttribute('transform',k?'translate(200 273) scale('+(1+.035*k).toFixed(4)+' '+(1-.045*k).toFixed(4)+') translate(-200 -273)':'');}
  function draw(t){
    var top=CY-RD,a=-Math.PI/2;
    trail.setAttribute('d','');squashRing(0);
    if(t<F0){place(CX,top,1,1);setWords(0,0,0);return;}
    if(t<F1){var p=(t-F0)/(F1-F0),e=ease(p);a=-Math.PI/2+2*Math.PI*e;
      var len=Math.min(a+Math.PI/2,1.4*Math.sin(Math.PI*p));trail.setAttribute('d',arc(a-len,a));
      place(CX+RD*Math.cos(a),CY+RD*Math.sin(a),1,1);setWords(1,0,0);return;}
    if(t<O1){place(CX,top,1,1);setWords(2,1,0);return;}
    if(t<B1){var u=t-O1,i=0;
      while(i<TB.length&&u>TB[i]){u-=TB[i];i++;}
      if(i>=TB.length){place(CX,top,1,1);setWords(2,2,1);return;}
      var q=u/TB[i],h=H[i]*4*q*(1-q),c=Math.max(0,1-Math.min(q,1-q)/0.09);
      var land=i>0||q>.5?c:0, s=land*(0.22*H[i]/H[0]+0.06);
      place(CX,top-h+DR*s*.9,1+s*.9,1-s);squashRing(land*H[i]/H[0]);setWords(2,2,1);return;}
    place(CX,top,1,1);setWords(2,2,2);
  }
  window.__smDraw=draw;   /* test hook: draw the loop at t seconds */
  if(reduce){draw(L-0.01);return;}
  var t0=performance.now(),run=false,raf=0,inView=true,last=0;
  function frame(now){raf=0;if(!run)return;draw(((now-t0)/1000)%L);raf=requestAnimationFrame(frame);}
  function sync(){var want=inView&&!document.hidden;if(want&&!run){run=true;t0+=performance.now()-last;raf=requestAnimationFrame(frame);}
    else if(!want&&run){run=false;last=performance.now();if(raf)cancelAnimationFrame(raf);raf=0;}}
  last=performance.now();
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){inView=es[0].isIntersecting;sync();},{threshold:0.05}).observe(svg);
  document.addEventListener('visibilitychange',sync);
  svg.parentNode.addEventListener('click',function(){t0=performance.now()-O1*1000;});
  sync();
})();
</script>
