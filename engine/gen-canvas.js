(function(){
var cv=document.getElementById('gen-cv');
if(!cv)return;
var ctx=cv.getContext('2d');
var W=1,H=1,dpr=1,mx=0.5,my=0.5,pressed=false,raf=0;
var isDark=function(){return document.documentElement.getAttribute('data-theme')==='dark'||
  (!document.documentElement.getAttribute('data-theme')&&window.matchMedia('(prefers-color-scheme:dark)').matches);};

function resize(){
  var r=cv.getBoundingClientRect();
  dpr=Math.min(window.devicePixelRatio||1,2);
  W=Math.max(1,Math.round(r.width*dpr));
  H=Math.max(1,Math.round(r.height*dpr));
  cv.width=W; cv.height=H;
}

var modes=[
  {id:'flow',   label:'Flow Field'},
  {id:'mesh',   label:'Mesh'},
  {id:'ripple', label:'Ripple'},
  {id:'drift',  label:'Drift'},
  {id:'weave',  label:'Weave'}
];
var cur='flow';

function palette(){
  var d=isDark();
  var bg=d?[17,17,19]:[244,244,241];
  var cs=d?[
    [212,113,78],[107,140,206],[92,174,114],[212,168,78],[180,100,160]
  ]:[
    [161,58,47],[55,90,160],[50,130,70],[180,130,40],[140,60,120]
  ];
  return {bg:bg,all:cs};
}

// ===== FLOW FIELD =====
var flowParts=[];
function flowInit(){
  flowParts=[];
  for(var i=0;i<500;i++){
    flowParts.push({x:Math.random()*W,y:Math.random()*H,vx:0,vy:0,age:0,life:80+Math.random()*160});
  }
}
function flowDraw(t){
  var p=palette();
  ctx.fillStyle='rgba('+p.bg[0]+','+p.bg[1]+','+p.bg[2]+',0.08)';
  ctx.fillRect(0,0,W,H);
  var px=mx*W,py=my*H;
  for(var i=0;i<flowParts.length;i++){
    var pt=flowParts[i];
    var dx=pt.x-px,dy=pt.y-py;
    var d=Math.sqrt(dx*dx+dy*dy)+1;
    var angle=Math.atan2(dy,dx)+Math.sin(pt.x*0.003+t*0.001)*1.5+Math.cos(pt.y*0.003+t*0.0008)*1.2;
    var speed=Math.min(3.5,300/d);
    pt.vx=pt.vx*0.9+Math.cos(angle)*speed*0.1;
    pt.vy=pt.vy*0.9+Math.sin(angle)*speed*0.1;
    pt.x+=pt.vx; pt.y+=pt.vy;
    pt.age++;
    if(pt.age>pt.life||pt.x<-10||pt.x>W+10||pt.y<-10||pt.y>H+10){
      pt.x=Math.random()*W; pt.y=Math.random()*H; pt.vx=0; pt.vy=0; pt.age=0;
      pt.life=80+Math.random()*160;
    }
    var a=Math.min(1,pt.age/15)*Math.min(1,(pt.life-pt.age)/25);
    var ci=Math.abs(Math.floor((pt.x+pt.y)*0.01))%p.all.length;
    var c=p.all[ci];
    ctx.fillStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+(a*0.8)+')';
    ctx.fillRect(pt.x,pt.y,dpr*1.8,dpr*1.8);
  }
}

// ===== MESH =====
var meshPts=[];
function meshInit(){
  meshPts=[];
  var cols=18,rows=10;
  for(var r=0;r<rows;r++){
    for(var c=0;c<cols;c++){
      meshPts.push({
        ox:(c+0.5)/cols*W, oy:(r+0.5)/rows*H,
        x:(c+0.5)/cols*W, y:(r+0.5)/rows*H,
        sx:0, sy:0, svx:0, svy:0,
        col:c,row:r,cols:cols,rows:rows
      });
    }
  }
}
function meshDraw(t){
  var p=palette();
  ctx.fillStyle='rgb('+p.bg[0]+','+p.bg[1]+','+p.bg[2]+')';
  ctx.fillRect(0,0,W,H);
  var px=mx*W,py=my*H;
  var radius=220*dpr;
  for(var i=0;i<meshPts.length;i++){
    var pt=meshPts[i];
    var dx=pt.ox-px,dy=pt.oy-py;
    var d=Math.sqrt(dx*dx+dy*dy)+1;
    // base hover: push away
    var push=Math.min(60*dpr,3000/d);
    var ang=Math.atan2(dy,dx);
    var bx=pt.ox+Math.cos(ang)*push+Math.sin(t*0.002+pt.ox*0.005)*4*dpr;
    var by=pt.oy+Math.sin(ang)*push+Math.cos(t*0.0018+pt.oy*0.005)*4*dpr;
    // click-hold: pull toward cursor (additive offset with spring return)
    if(pressed&&d<radius){
      var f=(1-d/radius);f=f*f;
      pt.svx+=(px-pt.ox-pt.sx)*f*0.06;
      pt.svy+=(py-pt.oy-pt.sy)*f*0.06;
    }
    pt.svx+=-pt.sx*0.04;
    pt.svy+=-pt.sy*0.04;
    pt.svx*=0.92; pt.svy*=0.92;
    pt.sx+=pt.svx; pt.sy+=pt.svy;
    pt.x=bx+pt.sx; pt.y=by+pt.sy;
  }
  ctx.lineWidth=1;
  for(var i=0;i<meshPts.length;i++){
    var pt=meshPts[i];
    var ci=(pt.col+pt.row)%p.all.length;
    var c=p.all[ci];
    var dx=pt.x-px,dy=pt.y-py;
    var d=Math.sqrt(dx*dx+dy*dy);
    var a=Math.max(0.15,Math.min(0.8,1-d/(Math.max(W,H)*0.5)));
    ctx.strokeStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+a+')';
    if(pt.col<pt.cols-1){
      var r=meshPts[i+1];
      ctx.beginPath();ctx.moveTo(pt.x,pt.y);ctx.lineTo(r.x,r.y);ctx.stroke();
    }
    if(pt.row<pt.rows-1){
      var b=meshPts[i+pt.cols];
      ctx.beginPath();ctx.moveTo(pt.x,pt.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
    ctx.fillStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+(a*1.2)+')';
    ctx.beginPath();ctx.arc(pt.x,pt.y,2.5*dpr,0,Math.PI*2);ctx.fill();
  }
}

// ===== RIPPLE =====
var rings=[];
function rippleInit(){rings=[];}
function rippleDraw(t){
  var p=palette();
  ctx.fillStyle='rgba('+p.bg[0]+','+p.bg[1]+','+p.bg[2]+',0.12)';
  ctx.fillRect(0,0,W,H);
  var px=mx*W,py=my*H;
  if(rings.length<40&&t%4<1){
    rings.push({x:px,y:py,r:0,born:t,ci:Math.floor(Math.random()*p.all.length)});
  }
  for(var i=rings.length-1;i>=0;i--){
    var rr=rings[i];
    rr.r+=1.8*dpr;
    var age=(t-rr.born)*0.008;
    if(age>1){rings.splice(i,1);continue;}
    var a=(1-age)*0.6;
    var c=p.all[rr.ci%p.all.length];
    ctx.strokeStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+a+')';
    ctx.lineWidth=Math.max(1,(1-age)*3*dpr);
    ctx.beginPath();ctx.arc(rr.x,rr.y,rr.r,0,Math.PI*2);ctx.stroke();
  }
  var c=p.all[0];
  ctx.fillStyle='rgba('+c[0]+','+c[1]+','+c[2]+',0.9)';
  ctx.beginPath();ctx.arc(px,py,4*dpr,0,Math.PI*2);ctx.fill();
}

// ===== DRIFT =====
var driftPts=[];
function driftInit(){
  driftPts=[];
  for(var i=0;i<100;i++){
    driftPts.push({
      x:Math.random()*W, y:Math.random()*H,
      r:3+Math.random()*12, phase:Math.random()*Math.PI*2,
      speed:0.3+Math.random()*0.8, ci:Math.floor(Math.random()*5)
    });
  }
}
function driftDraw(t){
  var p=palette();
  ctx.fillStyle='rgb('+p.bg[0]+','+p.bg[1]+','+p.bg[2]+')';
  ctx.fillRect(0,0,W,H);
  var px=mx*W,py=my*H;
  for(var i=0;i<driftPts.length;i++){
    var pt=driftPts[i];
    var dx=pt.x-px,dy=pt.y-py;
    var d=Math.sqrt(dx*dx+dy*dy)+1;
    var grav=Math.min(2,800/d);
    var ang=Math.atan2(-dy,-dx);
    pt.x+=Math.cos(ang)*grav*0.3+Math.sin(t*0.001+pt.phase)*pt.speed;
    pt.y+=Math.sin(ang)*grav*0.3+Math.cos(t*0.0012+pt.phase*1.3)*pt.speed;
    if(pt.x<-50)pt.x=W+50; if(pt.x>W+50)pt.x=-50;
    if(pt.y<-50)pt.y=H+50; if(pt.y>H+50)pt.y=-50;
    var prox=Math.max(0.2,Math.min(1,1-d/(Math.max(W,H)*0.6)));
    var c=p.all[pt.ci%p.all.length];
    var r=pt.r*dpr*(0.6+prox*0.6);
    ctx.globalAlpha=prox*0.25;
    ctx.fillStyle='rgb('+c[0]+','+c[1]+','+c[2]+')';
    ctx.beginPath();ctx.arc(pt.x,pt.y,r,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=prox*0.08;
    ctx.strokeStyle='rgb('+c[0]+','+c[1]+','+c[2]+')';
    ctx.lineWidth=1;
    for(var j=i+1;j<driftPts.length&&j<i+6;j++){
      var pt2=driftPts[j];
      var dd=Math.hypot(pt.x-pt2.x,pt.y-pt2.y);
      if(dd<120*dpr){
        ctx.beginPath();ctx.moveTo(pt.x,pt.y);ctx.lineTo(pt2.x,pt2.y);ctx.stroke();
      }
    }
  }
  ctx.globalAlpha=1;
}

// ===== WEAVE =====
function weaveDraw(t){
  var p=palette();
  ctx.fillStyle='rgb('+p.bg[0]+','+p.bg[1]+','+p.bg[2]+')';
  ctx.fillRect(0,0,W,H);
  var px=mx*W,py=my*H;
  var count=24;
  ctx.lineWidth=1.5*dpr;
  for(var l=0;l<count;l++){
    var c=p.all[l%p.all.length];
    var off=l/count*Math.PI*2;
    ctx.strokeStyle='rgba('+c[0]+','+c[1]+','+c[2]+',0.4)';
    ctx.beginPath();
    for(var s=0;s<=80;s++){
      var frac=s/80;
      var x=frac*W;
      var wave=Math.sin(frac*6+t*0.002+off)*40*dpr;
      var pull=(px-x)*0.15*Math.exp(-Math.pow((frac-mx)*3,2));
      var yBase=H*0.3+l*(H*0.4/count);
      var pullY=(py-yBase)*0.2*Math.exp(-Math.pow((frac-mx)*3,2));
      var y=yBase+wave+pullY;
      x+=pull*0.3;
      if(s===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.stroke();
  }
}

// -- Mode dispatch --
var inits={flow:flowInit,mesh:meshInit,ripple:rippleInit,drift:driftInit,weave:function(){}};
var draws={flow:flowDraw,mesh:meshDraw,ripple:rippleDraw,drift:driftDraw,weave:weaveDraw};

function clearCanvas(){
  var p=palette();
  ctx.fillStyle='rgb('+p.bg[0]+','+p.bg[1]+','+p.bg[2]+')';
  ctx.fillRect(0,0,W,H);
}

var running=false;
function startLoop(){
  if(running)return;
  running=true;
  resize();inits[cur]();
  raf=requestAnimationFrame(loop);
}
function stopLoop(){
  running=false;cancelAnimationFrame(raf);
}

function loop(t){
  if(!running)return;
  try{draws[cur](t);}catch(e){}
  raf=requestAnimationFrame(loop);
}

// -- Mode buttons --
var bar=document.getElementById('gen-modes');
modes.forEach(function(m){
  var btn=document.createElement('button');
  btn.className='gen-mode'+(m.id===cur?' active':'');
  btn.textContent=m.label;
  btn.setAttribute('data-mode',m.id);
  btn.addEventListener('click',function(){
    cur=m.id;
    bar.querySelectorAll('.gen-mode').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-mode')===cur);});
    resize();clearCanvas();inits[cur]();
    if(!running)startLoop();
  });
  bar.appendChild(btn);
});

// -- Pointer --
function updatePointer(e){
  var r=cv.getBoundingClientRect();
  if(r.width<1)return;
  mx=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));
  my=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));
}
cv.addEventListener('pointermove',function(e){updatePointer(e);});
cv.addEventListener('pointerdown',function(e){pressed=true;updatePointer(e);});
cv.addEventListener('pointerup',function(){pressed=false;});
cv.addEventListener('pointerleave',function(){pressed=false;});

// -- Visibility: only animate when in viewport --
var observer=new IntersectionObserver(function(entries){
  if(entries[0].isIntersecting){startLoop();}
  else{stopLoop();}
},{threshold:0.05});
observer.observe(cv);

window.addEventListener('resize',function(){if(running){resize();clearCanvas();inits[cur]();}});

new MutationObserver(function(){if(running){clearCanvas();}}).observe(
  document.documentElement,{attributes:true,attributeFilter:['data-theme']}
);

})();
