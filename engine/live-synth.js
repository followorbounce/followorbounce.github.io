<script>
/* Live audio synth plugin: Pulse -> Filter -> Drive -> Space -> Out (Web Audio, no dependencies).
   Nothing makes sound until Play; the AudioContext is created on that first press. */
(function(){
var rig=document.getElementById('ls-rig'); if(!rig) return;
var $=function(id){return document.getElementById(id);};
var S={bpm:124, wave:'sine', pitch:0.35, decay:0.3, cut:0.62, res:0.25, lfo:0.35, ftype:'lowpass',
  drv:0.25, bits:0.15, dmix:0.6, fb:0.45, smix:0.3, time:0.75, vol:0.75, on:[true,true,true,true]};
var pattern=[1,0,0,0, 1,0,0,1, 1,0,0,0, 1,0,1,0];
var ac=null, A={}, playing=false, step=0, nextT=0, timer=0, raf=0, frozen=false;

/* ---- parameter maps ---- */
var hz=function(v){return 80*Math.pow(150,v);};                 // 80 Hz .. 12 kHz, log
var baseF=function(){return 38*Math.pow(8,S.pitch);};           // 38 .. 304 Hz
var nbits=function(){return Math.round(16-S.bits*13);};         // 16 .. 3 bits
var stepDur=function(){return 60/S.bpm/4;};

/* ---- audio graph ---- */
function stage(name){ // in -> proc -> wet -> out, in -> dry -> out; bypass crossfades wet/dry (click-free)
  var n={in:ac.createGain(), out:ac.createGain(), wet:ac.createGain(), dry:ac.createGain(), an:ac.createAnalyser()};
  n.dry.gain.value=0; n.in.connect(n.dry); n.dry.connect(n.out); n.wet.connect(n.out);
  n.an.fftSize=1024; n.out.connect(n.an); return n;
}
function build(){
  ac=new (window.AudioContext||window.webkitAudioContext)();
  // 01 pulse: voices are created per step into this bus
  A.src=stage('pulse'); A.src.dry.disconnect(); A.src.in.connect(A.src.wet);
  // 02 filter + tempo-synced LFO (one sweep per bar)
  A.f=stage('filter'); A.flt=ac.createBiquadFilter(); A.f.in.connect(A.flt); A.flt.connect(A.f.wet);
  A.lfo=ac.createOscillator(); A.lfoG=ac.createGain(); A.lfo.connect(A.lfoG); A.lfoG.connect(A.flt.detune); A.lfo.start();
  // 03 drive: tanh saturation quantised to N bits, with its own dry/wet mix inside the node
  A.d=stage('drive'); A.ws=ac.createWaveShaper(); A.ws.oversample='2x'; A.dm=ac.createGain(); A.dd=ac.createGain();
  A.d.in.connect(A.ws); A.ws.connect(A.dm); A.dm.connect(A.d.wet); A.d.in.connect(A.dd); A.dd.connect(A.d.wet);
  // 04 space: synced delay with a darkening filter in the feedback loop; freeze = full feedback, input cut
  A.s=stage('space'); A.dIn=ac.createGain(); A.del=ac.createDelay(2); A.fbG=ac.createGain(); A.fbF=ac.createBiquadFilter(); A.sw=ac.createGain();
  A.fbF.type='lowpass'; A.fbF.frequency.value=4200;
  A.s.in.connect(A.s.wet); A.s.in.connect(A.dIn); A.dIn.connect(A.del); A.del.connect(A.fbF); A.fbF.connect(A.fbG); A.fbG.connect(A.del);
  A.del.connect(A.sw); A.sw.connect(A.s.wet);
  // out: volume -> limiter -> speakers
  A.vol=ac.createGain(); A.lim=ac.createDynamicsCompressor(); A.lim.threshold.value=-8; A.lim.ratio.value=12; A.lim.attack.value=0.003; A.lim.release.value=0.12;
  A.oan=ac.createAnalyser(); A.oan.fftSize=1024;
  A.src.out.connect(A.f.in); A.f.out.connect(A.d.in); A.d.out.connect(A.s.in); A.s.out.connect(A.vol); A.clip=ac.createWaveShaper(); A.clip.curve=softClip(); A.half=ac.createGain(); A.half.gain.value=0.5;
  A.vol.connect(A.lim); A.lim.connect(A.half); A.half.connect(A.clip); A.clip.connect(ac.destination); A.clip.connect(A.oan); // limiter, then a tanh ceiling: output never exceeds ±0.93
  A.nodes=[A.src,A.f,A.d,A.s];
  A.noise=ac.createBuffer(1,ac.sampleRate*0.05,ac.sampleRate);
  var ch=A.noise.getChannelData(0); for(var i=0;i<ch.length;i++) ch[i]=(Math.random()*2-1)*Math.pow(1-i/ch.length,3);
  apply(true);
}
function softClip(){ // fed at half level: input ±1 here = ±2 real; unity gain for small signals, ceiling 0.96·tanh(2) ≈ 0.93
  var n=4096, c=new Float32Array(n); for(var i=0;i<n;i++){ var x=i/(n-1)*2-1; c[i]=0.96*Math.tanh(2*x); } return c; }
function curve(){
  var n=2048, c=new Float32Array(n), k=1+S.drv*30, q=Math.pow(2,nbits()-1), nk=Math.tanh(k);
  for(var i=0;i<n;i++){ var x=i/(n-1)*2-1, y=Math.tanh(k*x)/nk; c[i]=Math.round(y*q)/q; }
  return c;
}
var lastCurve='';
function apply(now){
  if(!ac) return;
  var t=ac.currentTime, tc=now?0.001:0.03, set=function(p,v){p.setTargetAtTime(v,t,tc);};
  A.nodes.forEach(function(n,i){ var on=S.on[i]; set(n.wet.gain,on?1:0); if(i>0) set(n.dry.gain,on?0:1); });
  A.flt.type=S.ftype; set(A.flt.frequency,hz(S.cut)); set(A.flt.Q,0.5+S.res*18);
  A.lfo.frequency.value=S.bpm/60/4; set(A.lfoG.gain,S.lfo*2400);
  var key=S.drv.toFixed(3)+'/'+nbits(); if(key!==lastCurve){ A.ws.curve=curve(); lastCurve=key; }
  set(A.dm.gain,S.dmix); set(A.dd.gain,1-S.dmix);
  set(A.del.delayTime,Math.min(1.9,stepDur()*4*S.time));
  set(A.fbG.gain,frozen?0.985:S.fb); set(A.dIn.gain,frozen?0:1); set(A.sw.gain,frozen?1:S.smix);
  set(A.vol.gain,S.vol*S.vol);
}

/* ---- sequencer: 25 ms look-ahead scheduler ---- */
function voice(t, accent){
  var g=ac.createGain(), f=baseF(), dec=0.04+S.decay*0.7, peak=accent?0.9:0.6;
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(peak,t+0.002); g.gain.exponentialRampToValueAtTime(0.0008,t+dec);
  g.connect(A.src.in);
  if(S.wave==='click'){
    var b=ac.createBufferSource(); b.buffer=A.noise; var bp=ac.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=f*12; bp.Q.value=2;
    b.connect(bp); bp.connect(g); b.start(t); b.stop(t+0.06);
    var o=ac.createOscillator(); o.frequency.setValueAtTime(f*2,t); o.connect(g); o.start(t); o.stop(t+Math.min(dec,0.08));
  } else {
    var o2=ac.createOscillator(); o2.type=S.wave==='tone'?'square':'sine';
    if(S.wave==='sine'){ o2.frequency.setValueAtTime(f*5,t); o2.frequency.exponentialRampToValueAtTime(f,t+0.035); }
    else o2.frequency.setValueAtTime(f*2,t);
    var lp; if(S.wave==='tone'){ lp=ac.createBiquadFilter(); lp.frequency.value=f*10; o2.connect(lp); lp.connect(g);} else o2.connect(g);
    o2.start(t); o2.stop(t+dec+0.02);
  }
}
var shown=-1;
function tick(){
  while(nextT<ac.currentTime+0.1){
    if(pattern[step]) voice(nextT, step%4===0);
    (function(s,at){ setTimeout(function(){ shown=s; paintSteps(); }, Math.max(0,(at-ac.currentTime)*1000)); })(step,nextT);
    nextT+=stepDur(); step=(step+1)%16;
  }
}
/* iOS: Web Audio is "ambient" and silenced by the Ring/Silent switch. Inside the tap we (1) ask for the
   playback audio session (Safari 16.4+), (2) start a silent looping <audio> element so the page counts as
   media playback, and (3) play a one-sample buffer to unlock the context. Same technique as Pulse Train. */
var SILENT='data:audio/wav;base64,UklGRmQGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUAGAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA', silentEl=null;
function iosUnlock(){
  try{ if(navigator.audioSession) navigator.audioSession.type='playback'; }catch(e){}
  if(!silentEl){ silentEl=document.createElement('audio'); silentEl.setAttribute('playsinline',''); silentEl.setAttribute('aria-hidden','true');
    silentEl.preload='auto'; silentEl.loop=true; silentEl.src=SILENT; silentEl.style.display='none'; document.body.appendChild(silentEl); }
  var pr=silentEl.play(); if(pr&&pr.catch) pr.catch(function(){});
}
function play(){
  if(!playing) iosUnlock();                       // must run synchronously inside the user gesture
  if(!ac) build();
  if(ac.state!=='running'){ var r=ac.resume(); if(r&&r.catch) r.catch(function(){}); }
  try{ var one=ac.createBufferSource(); one.buffer=ac.createBuffer(1,1,ac.sampleRate); one.connect(ac.destination); one.start(0); }catch(e){}
  playing=!playing; var b=$('ls-play');
  b.setAttribute('aria-pressed',String(playing)); b.innerHTML=playing?'&#9632; Stop':'&#9654; Play';
  if(playing){ step=0; nextT=ac.currentTime+0.05; tick(); timer=setInterval(tick,25); loop(); }
  else { clearInterval(timer); shown=-1; paintSteps(); if(silentEl) silentEl.pause(); }
}

/* ---- UI: steps, sliders, segments, switches ---- */
var stepsBox=$('ls-steps'), stepBtns=[];
for(var i=0;i<16;i++){ (function(i){ var b=document.createElement('button'); b.setAttribute('aria-label','Step '+(i+1));
  b.addEventListener('click',function(){ pattern[i]=pattern[i]?0:1; paintSteps(); }); stepsBox.appendChild(b); stepBtns.push(b); })(i); }
function paintSteps(){ stepBtns.forEach(function(b,i){ b.classList.toggle('on',!!pattern[i]); b.classList.toggle('now',i===shown); b.setAttribute('aria-pressed',String(!!pattern[i])); }); }
paintSteps();
function dice(){ for(var i=0;i<16;i++) pattern[i]= i%4===0 ? (Math.random()<0.85?1:0) : (Math.random()<0.28?1:0); paintSteps(); }
$('ls-dice').addEventListener('click',dice);

var FMT={bpm:function(v){return v+' bpm';}, cut:function(v){var h=hz(v);return h>=1000?(h/1000).toFixed(1)+' k':Math.round(h)+' Hz';},
  bits:function(){return nbits()+' bit';}, vol:function(v){return Math.round(v*100)+'%';}};
var pct=function(v){return Math.round(v*100)+'%';};
var sliders={};
['bpm','cut','res','lfo','drv','bits','dmix','fb','smix','vol'].forEach(function(k){
  var el=$('ls-'+k), out=$('ls-o-'+k); sliders[k]=el; el.value=S[k];
  var show=function(){ out.textContent=(FMT[k]||pct)(S[k]); };
  el.addEventListener('input',function(){ S[k]=parseFloat(el.value); show(); apply(); }); show();
});
function setS(k,v){ S[k]=v; if(sliders[k]){ sliders[k].value=v; sliders[k].dispatchEvent(new Event('input')); } else apply(); }
function seg(id,key,num){ var box=$(id);
  var mark=function(){ box.querySelectorAll('button[data-v]').forEach(function(b){ b.setAttribute('aria-pressed',String(b.dataset.v===String(S[key]))); }); };
  box.addEventListener('click',function(e){ var b=e.target.closest('button[data-v]'); if(!b) return; S[key]=num?parseFloat(b.dataset.v):b.dataset.v; mark(); apply(); }); mark(); }
seg('ls-wave','wave'); seg('ls-ftype','ftype'); seg('ls-time','time',true);
var nodesEl=rig.querySelectorAll('.ls-node');
function toggleNode(i){ S.on[i]=!S.on[i]; var b=rig.querySelector('[data-sw="'+i+'"]'); b.classList.toggle('on',S.on[i]); b.setAttribute('aria-pressed',String(S.on[i])); nodesEl[i].classList.toggle('off',!S.on[i]); apply(); }
rig.querySelectorAll('.ls-sw').forEach(function(b){ b.addEventListener('click',function(){ toggleNode(+b.dataset.sw); }); });
$('ls-play').addEventListener('click',play);
var fz=$('ls-freeze');
function freeze(on){ if(frozen===on) return; frozen=on; fz.setAttribute('aria-pressed',String(on)); apply(); }
fz.addEventListener('pointerdown',function(e){ freeze(true); try{ fz.setPointerCapture(e.pointerId); }catch(_){} });
['pointerup','pointercancel','lostpointercapture'].forEach(function(ev){ fz.addEventListener(ev,function(){ freeze(false); }); });

/* ---- XY pads: each scope plays its node's two main parameters ---- */
var XY=[['decay','pitch'],['cut','res'],['drv','bits'],['fb','smix']];
var scopes=rig.querySelectorAll('.ls-scope');
scopes.forEach(function(cv){
  var n=+cv.dataset.xy, down=false;
  var mv=function(e){ var r=cv.getBoundingClientRect(), x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)), y=Math.max(0,Math.min(1,1-(e.clientY-r.top)/r.height));
    var mx=function(k){return k==='fb'?0.85:1;}; setS(XY[n][0],x*mx(XY[n][0])); setS(XY[n][1],y*mx(XY[n][1])); cv.dataset.px=x; cv.dataset.py=y; };
  cv.addEventListener('pointerdown',function(e){ down=true; mv(e); try{ cv.setPointerCapture(e.pointerId); }catch(_){} });
  cv.addEventListener('pointermove',function(e){ if(down) mv(e); });
  ['pointerup','pointercancel'].forEach(function(ev){ cv.addEventListener(ev,function(){ down=false; delete cv.dataset.px; }); });
});

/* ---- keyboard: only while focus is inside the plugin (so Space still scrolls the page elsewhere) ---- */
var sec=rig.closest('section');
sec.addEventListener('pointerdown',function(e){ if(!e.target.closest('input,button')) rig.focus({preventScroll:true}); });
sec.addEventListener('keydown',function(e){
  if(e.target.tagName==='INPUT'&&e.key!==' ') return;
  if(e.key===' '){ e.preventDefault(); play(); }
  else if(e.key>='1'&&e.key<='4') toggleNode(+e.key-1);
  else if(e.key==='d'||e.key==='D') dice();
  else if((e.key==='f'||e.key==='F')&&!e.repeat) freeze(true);
});
sec.addEventListener('keyup',function(e){ if(e.key==='f'||e.key==='F') freeze(false); });

/* ---- scopes + meter ---- */
var buf=new Float32Array(1024), meter=$('ls-meter'), lvl=0;
function col(v){ return getComputedStyle(document.documentElement).getPropertyValue(v).trim()||'#222'; }
function drawScope(cv,an,i){
  var d=Math.min(window.devicePixelRatio||1,2), w=Math.round(cv.clientWidth*d), h=Math.round(cv.clientHeight*d);
  if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}
  var x=cv.getContext('2d'); x.clearRect(0,0,w,h);
  x.strokeStyle=col('--line'); x.lineWidth=1; x.beginPath(); x.moveTo(0,h/2); x.lineTo(w,h/2); x.stroke();
  if(an){ an.getFloatTimeDomainData(buf);
    var st=0; for(var k=1;k<512;k++) if(buf[k-1]<0&&buf[k]>=0){st=k;break;}   // trigger on a rising zero crossing
    x.strokeStyle=S.on[i]?col('--ink'):col('--mid'); x.lineWidth=Math.max(1,d); x.beginPath();
    for(var j=0;j<512;j++){ var v=buf[st+j]||0, px=j/511*w, py=h/2-v*h*0.45; if(j) x.lineTo(px,py); else x.moveTo(px,py); } x.stroke(); }
  if(cv.dataset.px!==undefined){ var cx=cv.dataset.px*w, cy=(1-cv.dataset.py)*h; x.strokeStyle=col('--accent'); x.beginPath(); x.arc(cx,cy,5*d,0,6.2832); x.stroke(); }
}
function loop(){
  cancelAnimationFrame(raf);
  var frame=function(){
    scopes.forEach(function(cv,i){ drawScope(cv, ac?A.nodes[i].an:null, i); });
    if(ac){ A.oan.getFloatTimeDomainData(buf); var s=0; for(var k=0;k<buf.length;k++) s+=buf[k]*buf[k]; lvl=Math.max(Math.sqrt(s/buf.length)*2.2, lvl*0.9); }
    meter.style.setProperty('--lvl',Math.min(1,lvl).toFixed(3));
    if(playing||lvl>0.002||frozen) raf=requestAnimationFrame(frame); else raf=0;
  };
  raf=requestAnimationFrame(frame);
}
loop(); // draw the idle scopes once
window.addEventListener('resize',function(){ if(!raf) loop(); });
new MutationObserver(function(){ if(!raf) loop(); }).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
document.addEventListener('visibilitychange',function(){ if(document.hidden&&playing) play(); }); // stop when the tab is hidden
})();
</script>
