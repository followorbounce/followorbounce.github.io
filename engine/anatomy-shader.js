<script>
/* Anatomy shader plugin (engine/anatomy-shader.*): a stylised body lying on a scan table, drawn by
   one full-screen SDF fragment shader in the manner of the video-synth studies (Light Grid,
   Displacement Field). Outside the lens the skin is hidden-line contours; inside it, the layers
   picked in the bar: skeleton, arteries/veins with flow pulsing on the heartbeat, nerves with
   travelling signals, the beating heart. Pointer = lens, hold = see through the whole body; idle,
   the lens wanders head to toe. Schematic only; the link below goes to the real 3D model.
   Test hook: window.__anaPreserve=true before this script keeps the GL buffer for read-back and
   exposes window.__anaDraw(t). */
(function(){
var cv=document.getElementById('as-cv'), frameEl=document.getElementById('as-frame'), hint=document.getElementById('as-hint');
if(!cv)return;
var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var gl=null;
try{gl=cv.getContext('webgl2',{alpha:false,antialias:false,preserveDrawingBuffer:!!window.__anaPreserve});}catch(e){}
function fail(msg){hint.textContent=msg;cv.style.cursor='default';}
if(!gl){fail('Needs WebGL 2 — open the Anatomy Explorer below');return;}

var VS='#version 300 es\nin vec2 aPos; void main(){ gl_Position=vec4(aPos,0.0,1.0); }';
var FS=['#version 300 es',
'precision highp float;',
'uniform vec2 uRes, uC, uLens;',
'uniform float uL, uR, uT, uBeat, uPhase, uBreath, uDpr;',
'uniform vec3 uLay, uPaper, uSunk, uInk, uRed, uBlue, uAmber;',
'out vec4 o;',
'float PX;',
'float capH(vec2 p, vec2 a, vec2 b, float ra, float rb, out float h){ vec2 pa=p-a, ba=b-a; h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0); return length(pa-ba*h)-mix(ra,rb,h); }',
'float cap(vec2 p, vec2 a, vec2 b, float ra, float rb){ float h; return capH(p,a,b,ra,rb,h); }',
'float smin(float a, float b, float k){ float h=clamp(0.5+0.5*(b-a)/k,0.0,1.0); return mix(b,a,h)-k*h*(1.0-h); }',
'float ell(vec2 p, vec2 r){ float k0=length(p/r), k1=length(p/(r*r)); return k0*(k0-1.0)/max(k1,1e-5); }',
'float fillA(float d){ return 1.0-smoothstep(-PX,PX,d); }',
'float lineA(float d, float w){ return 1.0-smoothstep(w-PX,w+PX,abs(d)); }',
// body silhouette: head at -x, feet at +x, lying supine seen from above
'float body(vec2 p){',
'  vec2 q=vec2(p.x,abs(p.y));',
'  float d=length(p-vec2(-0.44,0.0))-0.058;',
'  d=smin(d,cap(p,vec2(-0.39,0.0),vec2(-0.34,0.0),0.026,0.03),0.02);',
'  float t=ell(p-vec2(-0.25,0.0),vec2(0.1,0.108+0.004*uBreath));',
'  t=smin(t,ell(p-vec2(-0.1,0.0),vec2(0.1,0.082+0.003*uBreath)),0.05);',
'  t=smin(t,ell(p-vec2(0.0,0.0),vec2(0.07,0.098)),0.05);',
'  d=smin(d,t,0.03);',
'  float a=cap(q,vec2(-0.315,0.112),vec2(-0.16,0.138),0.03,0.024);',
'  a=smin(a,cap(q,vec2(-0.16,0.138),vec2(-0.005,0.15),0.023,0.018),0.015);',
'  a=smin(a,cap(q,vec2(-0.005,0.15),vec2(0.07,0.152),0.02,0.013),0.012);',
'  d=smin(d,a,0.02);',
'  float l=cap(q,vec2(0.03,0.05),vec2(0.25,0.056),0.052,0.033);',
'  l=smin(l,cap(q,vec2(0.25,0.056),vec2(0.45,0.05),0.032,0.02),0.02);',
'  l=smin(l,cap(q,vec2(0.455,0.05),vec2(0.497,0.056),0.022,0.015),0.012);',
'  return smin(d,l,0.03);',
'}',
'float bones(vec2 p){',
'  vec2 q=vec2(p.x,abs(p.y));',
'  float d=abs(length(p-vec2(-0.442,0.0))-0.047)-0.0055;',                       // skull
'  d=min(d,abs(length(q-vec2(-0.452,0.018))-0.011)-0.003);',                   // orbits
'  d=min(d,max(abs(ell(p-vec2(-0.418,0.0),vec2(0.016,0.028)))-0.0035,-p.x-0.418));', // mandible arc
'  float sx=clamp(floor((p.x+0.385)/0.0165+0.5),0.0,23.0)*0.0165-0.385;',      // vertebrae
'  vec2 vp=p-vec2(sx,0.0);',
'  d=min(d,length(max(abs(vp)-vec2(0.0052,0.008+0.004*step(-0.33,sx)),0.0))-0.002);',
'  d=min(d,ell(p-vec2(0.022,0.0),vec2(0.028,0.02)));',                         // sacrum
'  for(int i=0;i<12;i++){ float fi=float(i);',                                  // ribs
'    float w=0.09-abs(fi-4.0)*0.0034, x0=-0.325+fi*0.0165;',
'    float cx=x0+0.012+0.042*(q.y/w)*(q.y/w);',
'    float rd=max(max(abs(p.x-cx)-0.0026,q.y-w),0.011-q.y); d=min(d,rd); }',
'  d=min(d,cap(p,vec2(-0.335,0.0),vec2(-0.215,0.0),0.009,0.006));',            // sternum
'  d=min(d,cap(q,vec2(-0.338,0.014),vec2(-0.326,0.104),0.005,0.004));',         // clavicles
'  d=min(d,abs(ell(q-vec2(-0.01,0.05),vec2(0.027,0.042)))-0.0042);',            // iliac wing
'  d=min(d,abs(ell(q-vec2(0.036,0.036),vec2(0.01,0.013)))-0.003);',             // obturator ring
'  d=min(d,cap(q,vec2(0.05,0.005),vec2(0.03,0.05),0.0055,0.006));',            // pubis / ischium
'  d=min(d,cap(q,vec2(-0.31,0.118),vec2(-0.165,0.139),0.0085,0.007));',         // humerus
'  d=min(d,length(q-vec2(-0.312,0.116))-0.013);',
'  d=min(d,cap(q,vec2(-0.155,0.134),vec2(-0.008,0.142),0.005,0.0045));',        // radius / ulna
'  d=min(d,cap(q,vec2(-0.155,0.144),vec2(-0.008,0.156),0.004,0.004));',
'  for(int k=0;k<4;k++){ float oy=0.141+float(k)*0.0055;',                        // hand
'    d=min(d,cap(q,vec2(0.005,oy),vec2(0.065,oy+0.002*float(k-1)),0.0018,0.0014)); }',
'  d=min(d,length(q-vec2(0.017,0.066))-0.0135);',                                // femur head
'  d=min(d,cap(q,vec2(0.03,0.07),vec2(0.24,0.057),0.0105,0.0085));',            // femur
'  d=min(d,length(q-vec2(0.252,0.056))-0.0095);',                                // patella
'  d=min(d,cap(q,vec2(0.264,0.053),vec2(0.44,0.047),0.0078,0.006));',           // tibia
'  d=min(d,cap(q,vec2(0.266,0.068),vec2(0.44,0.06),0.0038,0.0035));',           // fibula
'  d=min(d,cap(q,vec2(0.455,0.05),vec2(0.495,0.056),0.007,0.005));',            // foot
'  return d;',
'}',
// vessels: distance + travel coordinate s (path length from the heart), mirrored limbs via q
'void seg(vec2 p, vec2 a, vec2 b, float w, float s0, inout float bd, inout float bs){ float h; float d=capH(p,a,b,w,w*0.8,h); if(d<bd){ bd=d; bs=s0+h*length(b-a); } }',
'void arteries(vec2 p, out float d, out float s){ vec2 q=vec2(p.x,abs(p.y)); d=1e3; s=0.0;',
'  seg(p,vec2(-0.245,0.02),vec2(-0.3,0.008),0.006,0.0,d,s);',
'  seg(p,vec2(-0.3,0.008),vec2(-0.02,0.008),0.0055,0.06,d,s);',
'  seg(q,vec2(-0.02,0.008),vec2(0.04,0.048),0.0042,0.34,d,s);',
'  seg(q,vec2(0.04,0.048),vec2(0.25,0.05),0.0038,0.41,d,s);',
'  seg(q,vec2(0.25,0.05),vec2(0.45,0.043),0.0032,0.62,d,s);',
'  seg(q,vec2(-0.3,0.012),vec2(-0.43,0.03),0.0036,0.06,d,s);',
'  seg(q,vec2(-0.3,0.012),vec2(-0.315,0.1),0.0036,0.06,d,s);',
'  seg(q,vec2(-0.315,0.1),vec2(-0.16,0.13),0.0032,0.15,d,s);',
'  seg(q,vec2(-0.16,0.13),vec2(-0.005,0.146),0.0028,0.31,d,s);',
'  seg(q,vec2(-0.005,0.146),vec2(0.06,0.15),0.0022,0.46,d,s);',
'}',
'void veins(vec2 p, out float d, out float s){ vec2 q=vec2(p.x,abs(p.y)); d=1e3; s=0.0;',
'  seg(p,vec2(-0.26,-0.014),vec2(-0.02,-0.012),0.0065,0.0,d,s);',
'  seg(q,vec2(-0.02,0.0),vec2(0.04,0.036),0.0046,0.24,d,s);',
'  seg(q,vec2(0.04,0.036),vec2(0.25,0.042),0.0042,0.31,d,s);',
'  seg(q,vec2(0.25,0.042),vec2(0.45,0.034),0.0036,0.52,d,s);',
'  seg(q,vec2(-0.29,0.024),vec2(-0.42,0.042),0.0042,0.03,d,s);',
'  seg(q,vec2(-0.29,0.024),vec2(-0.305,0.09),0.0038,0.03,d,s);',
'  seg(q,vec2(-0.305,0.09),vec2(-0.16,0.122),0.0034,0.1,d,s);',
'  seg(q,vec2(-0.16,0.122),vec2(0.0,0.137),0.003,0.25,d,s);',
'}',
'void nerves(vec2 p, out float d, out float s){ vec2 q=vec2(p.x,abs(p.y)); d=1e3; s=0.0;',
'  seg(p,vec2(-0.39,0.0),vec2(0.015,0.0),0.0024,0.0,d,s);',
'  seg(q,vec2(0.01,0.026),vec2(0.25,0.064),0.0024,0.4,d,s);',
'  seg(q,vec2(0.25,0.064),vec2(0.45,0.056),0.002,0.64,d,s);',
'  seg(q,vec2(-0.3,0.03),vec2(-0.31,0.106),0.0018,0.1,d,s);',
'  seg(q,vec2(-0.31,0.106),vec2(-0.16,0.134),0.0018,0.18,d,s);',
'  seg(q,vec2(-0.16,0.134),vec2(0.0,0.149),0.0016,0.33,d,s);',
'  seg(q,vec2(0.0,0.149),vec2(0.066,0.154),0.0014,0.49,d,s);',
'}',
'float heart(vec2 p){ vec2 c=p-vec2(-0.238,0.022); float a=-0.6, cs=cos(a), sn=sin(a); c=mat2(cs,-sn,sn,cs)*c;',
'  float k=1.0+0.09*uBeat; return ell(c,vec2(0.03,0.024)*k); }',
'float ecg(float x){ return 0.12*exp(-pow((x-0.18)/0.03,2.0)) - 0.15*exp(-pow((x-0.3)/0.008,2.0)) + 1.0*exp(-pow((x-0.32)/0.01,2.0))',
'  - 0.28*exp(-pow((x-0.345)/0.01,2.0)) + 0.25*exp(-pow((x-0.55)/0.05,2.0)); }',
'void main(){',
'  vec2 fc=gl_FragCoord.xy; PX=1.0/uL;',
'  vec2 p=(fc-uC)/uL;',
'  vec3 col=uPaper;',
'  vec2 gq=abs(fract(fc/(26.0*uDpr)+0.5)-0.5)*26.0*uDpr;',                       // scan-table grid
'  col=mix(col,uInk,0.045*(1.0-smoothstep(0.0,uDpr,min(gq.x,gq.y))));',
'  float sd=body(p), inside=fillA(sd);',
'  float dl=abs(fract(sd/0.011+0.5)-0.5)*0.011;',                               // hidden-line contours
'  float contour=(1.0-smoothstep(0.4*PX,1.4*PX,dl))*inside*(1.0-smoothstep(0.03,0.05,-sd));',
'  vec3 skin=mix(col,uInk,max(lineA(sd,0.6*PX)*0.85,contour*0.32));',
'  vec3 deep=mix(uSunk,uInk,lineA(sd,0.6*PX)*0.22);',
'  float lu=abs(ell(vec2(p.x,abs(p.y))-vec2(-0.255,0.052),vec2(0.072,0.042+0.003*uBreath)));',
'  deep=mix(deep,uInk,lineA(lu,0.5*PX)*0.18);',                                 // lungs
'  float b=bones(p);',
'  deep=mix(deep,uInk,fillA(b)*0.62*uLay.x);',
'  float ad, as_, vd, vs, nd, ns;',
'  arteries(p,ad,as_); veins(p,vd,vs); nerves(p,nd,ns);',
'  float flowA=0.45+0.55*pow(0.5+0.5*sin(as_*70.0-uPhase*6.2832),3.0)*(0.55+0.45*uBeat);',
'  float flowV=0.45+0.4*pow(0.5+0.5*sin(vs*55.0+uT*2.2),2.0);',
'  deep=mix(deep,uBlue,fillA(vd)*flowV*uLay.y);',
'  deep=mix(deep,uRed,fillA(ad)*flowA*uLay.y);',
'  float hd=heart(p);',
'  deep=mix(deep,uRed,fillA(hd)*(0.7+0.3*uBeat)*uLay.y);',
'  deep=mix(deep,uInk,lineA(hd,0.5*PX)*0.5*uLay.y);',
'  float spark=exp(-fract(ns*9.0-uT*1.3)*9.0);',
'  deep=mix(deep,uAmber,fillA(nd)*(0.35+0.65*spark)*uLay.z);',
'  float ld=length(fc-uLens), lens=1.0-smoothstep(uR-1.5*uDpr,uR+0.5*uDpr,ld);',
'  vec3 c=mix(skin,deep,lens);',
'  float scan=uLens.y+uR*0.92*sin(uT*1.7);',                                     // sweep line in the lens
'  c=mix(c,uInk,lens*0.18*(1.0-smoothstep(0.0,1.2*uDpr,abs(fc.y-scan))));',
'  float ring=1.0-smoothstep(0.6*uDpr,1.6*uDpr,abs(ld-uR));',
'  float ang=atan(fc.y-uLens.y,fc.x-uLens.x);',
'  float tick=(1.0-smoothstep(0.02,0.04,abs(fract(ang/0.2618+0.5)-0.5)))*step(uR,ld)*step(ld,uR+6.0*uDpr);',
'  c=mix(c,uInk,max(ring*0.8,tick*0.55)*step(uR,max(uRes.x,uRes.y)));',
'  float ew=150.0*uDpr, eh=34.0*uDpr, ex=(fc.x-(uRes.x-ew-12.0*uDpr))/ew;',          // ECG strip
'  if(ex>0.0&&ex<1.0&&fc.y<eh+14.0*uDpr&&fc.y>8.0*uDpr){',
'    float ph=fract(uPhase-(1.0-ex)*1.4);',
'    float y=14.0*uDpr+eh*0.42+eh*0.5*ecg(ph);',
'    float fade=smoothstep(0.0,0.5,ex);',
'    c=mix(c,uRed,(1.0-smoothstep(0.6*uDpr,1.7*uDpr,abs(fc.y-y)))*fade);',
'  }',
'  o=vec4(c,1.0);',
'}'].join('\n');

function sh(t,s){var x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(x));return x;}
var prog,U={};
try{
  prog=gl.createProgram();gl.attachShader(prog,sh(gl.VERTEX_SHADER,VS));gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,FS));
  gl.bindAttribLocation(prog,0,'aPos');gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(prog));
}catch(e){console.error(e);fail('Shader failed on this device — open the Anatomy Explorer below');return;}
['uRes','uC','uLens','uL','uR','uT','uBeat','uPhase','uBreath','uDpr','uLay','uPaper','uSunk','uInk','uRed','uBlue','uAmber'].forEach(function(n){U[n]=gl.getUniformLocation(prog,n);});
var vao=gl.createVertexArray();gl.bindVertexArray(vao);
gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);

/* colours from the page theme */
var C={};
var probe=document.createElement('canvas').getContext('2d');
function rgb(s,fb){probe.fillStyle=fb;probe.fillStyle=(s||'').trim()||fb;var h=probe.fillStyle;
  if(h[0]==='#')return [parseInt(h.substr(1,2),16)/255,parseInt(h.substr(3,2),16)/255,parseInt(h.substr(5,2),16)/255];
  var m=h.match(/[\d.]+/g);return m?[m[0]/255,m[1]/255,m[2]/255]:[0,0,0];}
function isDark(){var t=document.documentElement.getAttribute('data-theme');return t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches);}
function theme(){
  var cs=getComputedStyle(document.documentElement), dark=isDark();
  C.paper=rgb(getComputedStyle(frameEl).backgroundColor,'#ffffff');
  C.ink=rgb(cs.getPropertyValue('--ink'),'#0b0b0c');
  C.sunk=C.paper.map(function(v,i){return v+(C.ink[i]-v)*(dark?0.05:0.045);});
  C.red=rgb(dark?'#e5606a':'#c42f3a');C.blue=rgb(dark?'#6f9ee6':'#3567b0');C.amber=rgb(dark?'#e8c14e':'#b98a10');
}
theme();
new MutationObserver(theme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
if(window.matchMedia)window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',theme);

/* layers */
var lay=[1,1,1], layT=[1,1,1];
document.querySelectorAll('#as-layers [data-l]').forEach(function(b){
  b.addEventListener('click',function(){var i=+b.dataset.l;layT[i]=layT[i]?0:1;b.classList.toggle('active',!!layT[i]);b.setAttribute('aria-pressed',String(!!layT[i]));});
});

/* pointer: lens follows; hold widens it to the whole frame; idle -> wanders head to toe */
var ptr={x:0,y:0,over:false,down:false,at:-1e9}, lens=null, R=0, hold=0;
function pp(e){var r=cv.getBoundingClientRect();ptr.x=(e.clientX-r.left)/r.width;ptr.y=(e.clientY-r.top)/r.height;ptr.at=performance.now();}
cv.addEventListener('pointermove',function(e){ptr.over=true;pp(e);});
cv.addEventListener('pointerdown',function(e){ptr.over=true;ptr.down=true;pp(e);});
['pointerup','pointercancel'].forEach(function(n){cv.addEventListener(n,function(){ptr.down=false;});});
cv.addEventListener('pointerleave',function(){ptr.over=false;ptr.down=false;});
if(window.matchMedia&&window.matchMedia('(pointer:coarse)').matches)hint.textContent='Drag to scan · hold to see through';

var BPM=64, t=0, phase=0, last=performance.now(), running=false, raf=0;
function draw(now){
  var dt=Math.min(0.05,(now-last)/1000);last=now;
  var speed=reduced?0.35:1;t+=dt*speed;phase+=dt*speed*BPM/60;
  var dpr=Math.min(window.devicePixelRatio||1,1.5), r=cv.getBoundingClientRect();
  var W=Math.max(1,Math.round(r.width*dpr)), H=Math.max(1,Math.round(r.height*dpr));
  if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}
  var L=Math.min(W*0.86,H*2.6), cx=W*0.5, cy=H*0.5;
  var idle=!ptr.over||now-ptr.at>2500, tx, ty;
  if(idle){tx=reduced?cx-0.25*L:cx+0.4*L*Math.sin(t*0.16);ty=reduced?cy:cy+0.06*L*Math.sin(t*0.47+1.0);}
  else{tx=ptr.x*W;ty=(1-ptr.y)*H;}
  if(!lens)lens=[tx,ty];
  var k=idle?0.04:0.25;lens[0]+=(tx-lens[0])*k;lens[1]+=(ty-lens[1])*k;
  hold+=((ptr.down?1:0)-hold)*(ptr.down?0.05:0.09);
  var R0=Math.max(46*dpr,Math.min(H*0.4,L*0.15)), Rmax=Math.hypot(W,H);
  R=R0+(Rmax-R0)*hold*hold*(3-2*hold);
  for(var i=0;i<3;i++)lay[i]+=(layT[i]-lay[i])*0.15;
  var bp=phase%1, beat=Math.exp(-bp*7)+0.45*Math.exp(-Math.abs(bp-0.18)*14);
  gl.viewport(0,0,W,H);gl.useProgram(prog);
  gl.uniform2f(U.uRes,W,H);gl.uniform2f(U.uC,cx,cy);gl.uniform2f(U.uLens,lens[0],lens[1]);
  gl.uniform1f(U.uL,L);gl.uniform1f(U.uR,R);gl.uniform1f(U.uT,t);gl.uniform1f(U.uBeat,Math.min(1,beat));
  gl.uniform1f(U.uPhase,phase);gl.uniform1f(U.uBreath,Math.sin(t*2*Math.PI/4.5));gl.uniform1f(U.uDpr,dpr);
  gl.uniform3fv(U.uLay,lay);gl.uniform3fv(U.uPaper,C.paper);gl.uniform3fv(U.uSunk,C.sunk);gl.uniform3fv(U.uInk,C.ink);
  gl.uniform3fv(U.uRed,C.red);gl.uniform3fv(U.uBlue,C.blue);gl.uniform3fv(U.uAmber,C.amber);
  gl.drawArrays(gl.TRIANGLES,0,3);
}
function loop(now){if(!running)return;draw(now);raf=requestAnimationFrame(loop);}
function start(){if(running||document.hidden)return;running=true;last=performance.now();raf=requestAnimationFrame(loop);}
function stop(){running=false;cancelAnimationFrame(raf);}
var visible=false;
new IntersectionObserver(function(es){visible=es[0].isIntersecting;visible?start():stop();},{rootMargin:'100px'}).observe(cv);
document.addEventListener('visibilitychange',function(){document.hidden?stop():(visible&&start());});
cv.addEventListener('webglcontextlost',function(e){e.preventDefault();stop();fail('Graphics context lost — reload to restart');});
if(window.__anaPreserve)window.__anaDraw=function(ms){draw(ms);};
})();
</script>
