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
  {id:'flow',   label:'Meadow'},
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

// ===== MEADOW =====
var stems=[];
var windT=0,gustX=0,gustY=0;
function flowInit(){
  stems=[];
  var count=Math.round(W*0.18);
  for(var i=0;i<count;i++){
    var bx=Math.random()*W;
    var by=H*0.55+Math.random()*H*0.45;
    var h=20+Math.random()*50;
    var kind=Math.random();
    stems.push({
      bx:bx, by:by, h:h*dpr,
      phase:Math.random()*Math.PI*2,
      speed:0.6+Math.random()*0.8,
      sway:0, swayV:0,
      ci:Math.floor(Math.random()*5),
      hasFlower:kind<0.45,
      petalR: kind<0.45 ? (2+Math.random()*4)*dpr : 0,
      petalN: kind<0.45 ? 4+Math.floor(Math.random()*4) : 0,
      isBud: kind>=0.45&&kind<0.65,
      thick:(0.8+Math.random()*1.2)*dpr
    });
  }
  stems.sort(function(a,b){return a.by-b.by;});
}
function flowDraw(t){
  var p=palette();
  var d=isDark();
  // sky gradient
  var grad=ctx.createLinearGradient(0,0,0,H);
  if(d){grad.addColorStop(0,'#0e1018');grad.addColorStop(0.6,'#151520');grad.addColorStop(1,'#111113');}
  else{grad.addColorStop(0,'#dde4e8');grad.addColorStop(0.5,'#e8ece4');grad.addColorStop(1,'#d6dcc6');}
  ctx.fillStyle=grad;
  ctx.fillRect(0,0,W,H);

  // ground
  ctx.fillStyle=d?'#151a12':'#c4ccaa';
  ctx.fillRect(0,H*0.88,W,H*0.12);
  ctx.fillStyle=d?'#181e14':'#cdd4b4';
  ctx.beginPath();ctx.moveTo(0,H*0.88);
  for(var i=0;i<=W;i+=30){ctx.lineTo(i,H*0.88+Math.sin(i*0.015+t*0.0005)*6*dpr);}
  ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();

  var px=mx*W,py=my*H;
  // wind: gentle base sway + gust toward cursor on press
  windT=t*0.001;
  var baseWind=Math.sin(windT*0.7)*0.3+Math.sin(windT*1.3)*0.15;
  if(pressed){
    gustX+=(0.5-mx)*0.02;gustY+=(-0.3)*0.01;
  }
  gustX*=0.96;gustY*=0.96;

  var stemColors=d?[
    [80,110,60],[70,100,55],[90,120,65],[60,90,50],[75,105,58]
  ]:[
    [90,120,55],[80,110,50],[100,130,60],[70,100,45],[85,115,52]
  ];

  for(var i=0;i<stems.length;i++){
    var s=stems[i];
    var dx=s.bx-px,dy=(s.by-s.h*0.5)-py;
    var dist=Math.sqrt(dx*dx+dy*dy)+1;
    // cursor push: nearby stems bend away
    var cursorPush=0;
    if(dist<160*dpr){
      var f=(1-dist/(160*dpr));
      cursorPush=(dx>0?1:-1)*f*f*1.2;
      if(pressed)cursorPush*=2.5;
    }
    // wind + spring
    var windForce=baseWind+gustX*2+Math.sin(windT*s.speed+s.phase)*0.25;
    var target=windForce+cursorPush;
    var spring=(target-s.sway)*0.04;
    s.swayV=(s.swayV+spring)*0.92;
    s.sway+=s.swayV;

    // draw stem as quadratic curve
    var tipX=s.bx+s.sway*s.h*0.7;
    var tipY=s.by-s.h;
    var cpX=s.bx+s.sway*s.h*0.35;
    var cpY=s.by-s.h*0.55;

    var sc=stemColors[i%stemColors.length];
    var depth=s.by/H;
    var sa=0.5+depth*0.5;
    ctx.strokeStyle='rgba('+sc[0]+','+sc[1]+','+sc[2]+','+sa+')';
    ctx.lineWidth=s.thick;
    ctx.beginPath();ctx.moveTo(s.bx,s.by);ctx.quadraticCurveTo(cpX,cpY,tipX,tipY);ctx.stroke();

    // leaf on some stems
    if(s.h>35*dpr&&i%3===0){
      var lf=0.4+Math.sin(i)*0.15;
      var lx=s.bx+(cpX-s.bx)*lf*2;
      var ly=s.by+(cpY-s.by)*lf*1.5;
      var la=s.sway*0.5+Math.sin(t*0.003+s.phase)*0.3;
      ctx.fillStyle='rgba('+(sc[0]+10)+','+(sc[1]+15)+','+(sc[2]-5)+','+(sa*0.7)+')';
      ctx.save();ctx.translate(lx,ly);ctx.rotate(la);
      ctx.beginPath();ctx.ellipse(0,0,6*dpr,2.5*dpr,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }

    // flower or bud at tip
    if(s.hasFlower){
      var c=p.all[s.ci];
      ctx.fillStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+(sa*0.9)+')';
      for(var pn=0;pn<s.petalN;pn++){
        var pa=pn/s.petalN*Math.PI*2+s.sway*0.3+t*0.0003;
        var ppx=tipX+Math.cos(pa)*s.petalR;
        var ppy=tipY+Math.sin(pa)*s.petalR*0.7;
        ctx.beginPath();ctx.ellipse(ppx,ppy,s.petalR*0.55,s.petalR*0.35,pa,0,Math.PI*2);ctx.fill();
      }
      // center
      var cc=d?[220,200,130]:[180,150,60];
      ctx.fillStyle='rgba('+cc[0]+','+cc[1]+','+cc[2]+','+(sa*0.9)+')';
      ctx.beginPath();ctx.arc(tipX,tipY,s.petalR*0.28,0,Math.PI*2);ctx.fill();
    }else if(s.isBud){
      var c=p.all[s.ci];
      ctx.fillStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+(sa*0.6)+')';
      ctx.beginPath();ctx.ellipse(tipX,tipY-2*dpr,2.5*dpr,4*dpr,s.sway*0.4,0,Math.PI*2);ctx.fill();
    }
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
