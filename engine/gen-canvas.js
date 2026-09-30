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
  {id:'lines',  label:'Lines',  hint:'Move to lift the field · click to ripple · Mic lets the room\'s sound draw it', opt:'mic'},
  {id:'grid',   label:'Grid',   hint:'Move to send the wave from the pointer · press and hold to turn squares into circles'},
  {id:'scan',   label:'Scan',   hint:'Move to orbit a real photogrammetry scan · press and hold to scatter its points'},
  {id:'matrix', label:'Matrix', hint:'Move left–right to set the tempo · press and hold to highlight a band'},
  {id:'flow',   label:'Meadow', hint:'Move through the grass · press to gust'},
  {id:'mesh',   label:'Mesh',   hint:'Move to push the grid · press and hold to pull it in'}
];
var cur='lines';

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

// ===== shared for the three study modes =====
var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function ink(){return isDark()?[236,234,228]:[23,22,19];}
function accent(){return isDark()?[163,150,218]:[107,92,165];}
var opts=document.getElementById('gen-opts'), hint=document.getElementById('gen-hint');
function hsh(n){n=Math.imul(n^(n>>>16),0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return ((n^(n>>>16))>>>0)/4294967296;}

// ===== LINES (after Displacement Field): hidden-line terrain; pointer lifts, click ripples, mic = spectrogram =====
var mic={on:false,stream:null,an:null,buf:null,rows:[]}, ripples=[];
var LN=30, LS=96;
function linesInit(){ripples=[];}
function micToggle(btn){
  if(mic.on){micStop();btn.classList.remove('active');btn.textContent='Mic';return;}
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){btn.textContent='No mic';return;}
  btn.textContent='Mic…';
  navigator.mediaDevices.getUserMedia({audio:true}).then(function(st){
    var AC=window.AudioContext||window.webkitAudioContext, ac=new AC();
    var an=ac.createAnalyser(); an.fftSize=512; an.smoothingTimeConstant=0.6;
    ac.createMediaStreamSource(st).connect(an);
    mic={on:true,stream:st,ac:ac,an:an,buf:new Uint8Array(an.frequencyBinCount),rows:[]};
    btn.classList.add('active');btn.textContent='Mic on';
  }).catch(function(){btn.textContent='Mic blocked';});
}
function micStop(){
  if(mic.stream)mic.stream.getTracks().forEach(function(t){t.stop();});
  if(mic.ac)mic.ac.close();
  mic={on:false,stream:null,an:null,buf:null,rows:[]};
}
function linesDraw(t){
  var p=palette(), k=ink(), ac=accent();
  var bg='rgb('+p.bg[0]+','+p.bg[1]+','+p.bg[2]+')';
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  if(mic.on){ // newest spectrum row enters at the front, older rows recede
    mic.an.getByteFrequencyData(mic.buf);
    var row=new Float32Array(LS);
    for(var i=0;i<LS;i++){var f=Math.pow(i/(LS-1),1.6)*0.7, b=Math.min(mic.buf.length-1,Math.floor(f*mic.buf.length)); row[i]=mic.buf[b]/255;}
    mic.rows.unshift(row); if(mic.rows.length>LN)mic.rows.pop();
  }
  if(pressed&&(!ripples.length||t-ripples[ripples.length-1].t>260))ripples.push({x:mx,z:my,t:t});
  while(ripples.length&&t-ripples[0].t>3200)ripples.shift();
  var hz=H*0.2, amp=H*0.3;
  ctx.lineWidth=Math.max(1,1.1*dpr);
  for(var r=0;r<LN;r++){ // back to front: each filled band hides the lines behind it
    var zf=r/(LN-1), persp=0.45+0.55*zf, y0=hz+(H*0.98-hz)*Math.pow(zf,1.25);
    var xs=[],ys=[];
    for(var i=0;i<LS;i++){
      var u=i/(LS-1), x=W*(0.5+(u-0.5)*(0.62+0.5*zf)*1.25);
      var h=0.11*(Math.sin(u*7.1+t*0.0006+r*0.35)*0.5+Math.sin(u*15.3-t*0.0009+r*0.8)*0.25+Math.sin(u*3.2+r*0.21+t*0.0004)*0.35);
      var du=u-mx, dz=zf-my; h+=1.05*Math.exp(-(du*du*45+dz*dz*30));
      for(var q=0;q<ripples.length;q++){var rp=ripples[q], age=(t-rp.t)/1000, dd=Math.sqrt((u-rp.x)*(u-rp.x)*1.8+(zf-rp.z)*(zf-rp.z)), w=dd-age*0.45;
        h+=0.45*Math.exp(-w*w*180)*Math.max(0,1-age/3.2);}
      if(mic.on){var mr=mic.rows[LN-1-r]; if(mr)h+=mr[i]*0.75*Math.sin(Math.PI*u);}
      xs.push(x);ys.push(y0-h*amp*persp);
    }
    ctx.beginPath();ctx.moveTo(xs[0],H);for(i=0;i<LS;i++)ctx.lineTo(xs[i],ys[i]);ctx.lineTo(xs[LS-1],H);ctx.closePath();
    ctx.fillStyle=bg;ctx.fill();
    var a=0.25+0.7*zf, c=(r%6===0)?ac:k;
    ctx.strokeStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+a+')';
    ctx.beginPath();for(i=0;i<LS;i++){if(i)ctx.lineTo(xs[i],ys[i]);else ctx.moveTo(xs[i],ys[i]);}ctx.stroke();
  }
}

// ===== SCAN (after Photogrammetry Scan): the real SfM city, orbited by the pointer; hold to scatter points =====
var SCAN_N=70000, scan={state:'idle',P:null,R:null,S:null,n:0,yaw:0.6,pitch:0.45,k:0}, img=null, img32=null;
function scanLoad(){
  if(scan.state!=='idle')return; scan.state='loading';
  fetch('/visual-synths/data/city-scan.bin').then(function(r){if(!r.ok)throw 0;return r.arrayBuffer();}).then(function(buf){
    var dv=new DataView(buf); if(dv.getUint32(0,true)!==0x314d4653)throw 0; // 'SFM1'
    var n=Math.min(SCAN_N,dv.getUint32(4,true)), f=function(i){return dv.getFloat32(12+i*4,true);};
    var q=new Int16Array(buf,44,n*3); scanSet(n,function(i,c){return f(2+c)+(q[i*3+c]+32768)/65535*(f(5+c)-f(2+c));});
  }).catch(function(){ // offline fallback: a procedural block of towers
    scanSet(SCAN_N,function(i,c){var b=Math.floor(hsh(i*7+1)*40), bx=(hsh(b*3+11)-0.5)*2.2, bz=(hsh(b*5+13)-0.5)*1.6, bh=0.1+hsh(b*7+17)*hsh(b*9)*1.4,
      fx=hsh(i*7+2), fy=hsh(i*7+3), side=Math.floor(hsh(i*7+4)*4), w=0.14;
      var x=side<2?(side?w:-w):(fx-0.5)*2*w, z=side<2?(fx-0.5)*2*w:(side===2?w:-w);
      return c===0?bx+x:c===1?-0.3+fy*bh:bz+z;});
  });
}
function scanSet(n,get){
  var P=new Float32Array(n*3),R=new Float32Array(n*3),S=new Float32Array(n),lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];
  for(var i=0;i<n;i++)for(var c=0;c<3;c++){var v=get(i,c);P[i*3+c]=v;if(v<lo[c])lo[c]=v;if(v>hi[c])hi[c]=v;}
  for(i=0;i<n;i++){S[i]=hsh(i*13+5)*0.85;for(c=0;c<3;c++)R[i*3+c]=lo[c]+hsh(i*3+c+900001)*(hi[c]-lo[c]);}
  scan.P=P;scan.R=R;scan.S=S;scan.n=n;scan.lo=lo;scan.hi=hi;scan.state='ready';
}
function scanInit(){img=null;scanLoad();}
function scanDraw(t){
  var p=palette(), k=ink(), ac=accent();
  if(!img||img.width!==W||img.height!==H){img=ctx.createImageData(W,H);img32=new Uint32Array(img.data.buffer);}
  img32.fill((255<<24)|(p.bg[2]<<16)|(p.bg[1]<<8)|p.bg[0]);
  if(scan.state!=='ready'){ctx.putImageData(img,0,0);ctx.fillStyle='rgba('+k+',0.5)';ctx.font=(10*dpr)+'px monospace';ctx.fillText('LOADING SCAN…',14*dpr,22*dpr);return;}
  // pointer steers the orbit (eased), with a slow drift when idle
  scan.yaw+=((mx-0.5)*2.4+0.6+t*0.00004-scan.yaw)*0.05;
  scan.pitch+=(0.25+(0.5-my)*0.7-scan.pitch)*0.05;
  scan.k+=((pressed?1:0)-scan.k)*(pressed?0.025:0.05);
  var cy=Math.cos(scan.yaw),sy=Math.sin(scan.yaw),cp=Math.cos(scan.pitch),sp=Math.sin(scan.pitch);
  var P=scan.P,R=scan.R,S=scan.S,n=scan.n,f=H*2.3,dist=2.8,ps=dpr>1.5?2:1,D=img.data;
  var scanY=scan.lo[1]+((t*0.00012)%1)*(scan.hi[1]-scan.lo[1]), sh=0.05*(scan.hi[1]-scan.lo[1]);
  for(var i=0;i<n;i++){
    var x=P[i*3],y=P[i*3+1],z=P[i*3+2];
    var w=Math.max(0,Math.min(1,(scan.k-S[i])/0.15)); w=w*w*(3-2*w);
    if(w>0){x+=(R[i*3]-x)*w;y+=(R[i*3+1]-y)*w;z+=(R[i*3+2]-z)*w;}
    var X=x*cy-z*sy, Z=x*sy+z*cy, Y=y*cp-Z*sp; Z=y*sp+Z*cp;
    var zz=dist-Z; if(zz<0.2)continue;
    var u=(W/2+X*f/zz)|0, v=(H*0.47-Y*f/zz)|0;
    if(u<0||v<0||u>=W-ps||v>=H-ps)continue;
    var dy=y-scanY, hl=Math.abs(dy)<sh?1-Math.abs(dy)/sh:0, c=hl>0.05?ac:k, a=0.42+hl*0.45;
    for(var oy=0;oy<ps;oy++)for(var ox=0;ox<ps;ox++){var o=((v+oy)*W+u+ox)*4;
      D[o]+=(c[0]-D[o])*a;D[o+1]+=(c[1]-D[o+1])*a;D[o+2]+=(c[2]-D[o+2])*a;}
  }
  ctx.putImageData(img,0,0);
}

// ===== MATRIX (after Data Matrix): quiet data strips; pointer x = tempo, hold highlights the band under the pointer =====
function matrixDraw(t){
  var p=palette(), k=ink();
  ctx.fillStyle='rgb('+p.bg[0]+','+p.bg[1]+','+p.bg[2]+')';ctx.fillRect(0,0,W,H);
  var rgba=function(a){return 'rgba('+k[0]+','+k[1]+','+k[2]+','+a+')';};
  var bands=[0.13,0.09,0.15,0.07,0.13,0.1], gap=H*0.045, y=gap, rate=reduced?0.4:0.6+mx*2.4, tt=t*0.001*rate, tick=Math.floor(tt);
  var lw=Math.max(1,dpr*0.75), hb=Math.max(1,Math.round(dpr));
  for(var b=0;b<bands.length;b++){
    var h=Math.round(bands[b]*(H-gap*(bands.length+1))/0.67), on=pressed&&my*H>=y-gap/2&&my*H<y+h+gap/2;
    if(on){ctx.fillStyle=rgba(0.06);ctx.fillRect(0,y-gap*0.35,W,h+gap*0.7);}
    var al=on?0.85:0.5, kind=b%4, seed=b*7919+tick*(b%3+1), shift=(tt%1)*W*0.02*(b%2?1:-1); // strips glide between ticks
    ctx.fillStyle=rgba(al);ctx.strokeStyle=rgba(al);ctx.lineWidth=lw;
    if(kind===0){ // hairline barcode
      for(var x=-W*0.05+shift,j=0;x<W;j++){var bw=hsh(seed+j)>0.85?2*hb:hb; if(hsh(seed*3+j)>0.5)ctx.fillRect(Math.round(x),y,bw,h); x+=bw+Math.round((2+hsh(seed*5+j)*7)*dpr);}
    }else if(kind===1){ // sparse binary dots
      var cs=Math.max(4,Math.round(7*dpr)), cols=Math.ceil(W/cs), rows=Math.max(1,Math.floor(h/cs)), dr=Math.max(1,cs*0.16);
      for(var r=0;r<rows;r++)for(var c=0;c<cols;c++)if(hsh(seed+r*977+c)>0.72){ctx.beginPath();ctx.arc(c*cs+cs/2,y+r*cs+cs/2,dr,0,6.2832);ctx.fill();}
    }else if(kind===2){ // waveform plot on a faint baseline
      ctx.fillStyle=rgba(al*0.35);ctx.fillRect(0,y+h/2,W,lw);
      ctx.beginPath();for(x=0;x<=W;x+=2*dpr){var ph=x/W, s=Math.sin(ph*28+tt*1.3)*Math.sin(ph*5+b)*0.42+Math.sin(ph*90-tt*2)*0.06;
        if(x)ctx.lineTo(x,y+h/2-s*h);else ctx.moveTo(x,y+h/2-s*h);}ctx.stroke();
    }else{ // numeric strip
      ctx.font=Math.max(8,Math.round(h*0.5))+'px "IBM Plex Mono",monospace';ctx.textBaseline='middle';ctx.fillStyle=rgba(al*0.8);
      var str='';for(j=0;j<48;j++)str+=Math.floor(hsh(seed+j)*16).toString(16);
      ctx.fillText(str.toUpperCase().replace(/(.{4})/g,'$1  '),8*dpr+shift,y+h/2);
    }
    y+=h+gap;
  }
  ctx.fillStyle=rgba(0.35);ctx.fillRect(Math.round(mx*W),0,lw,H); // playhead
}

// ===== GRID (in the spirit of Nonotak's light installations): black and white, squares <-> circles on a grid, driven by waves =====
var grid={morph:0,seq:0};
function gridInit(){grid.morph=0;}
function rrect(x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function gridDraw(t){
  // always a black stage with white light, whatever the page theme (it is an installation, not page chrome)
  ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
  var ts=t*0.001*(reduced?0.35:1);
  grid.morph+=((pressed?1:0)-grid.morph)*0.06;
  // four movements, 7 s each, cross-faded: rotate / breathe / outline tunnel / scanning bars
  var per=7, ph=ts/per, m0=Math.floor(ph)%4, m1=(m0+1)%4, f=ph-Math.floor(ph), xf=Math.max(0,Math.min(1,(f-0.8)/0.2)); xf=xf*xf*(3-2*xf);
  var cell=Math.max(18*dpr,Math.min(W/26,H/7)), cols=Math.ceil(W/cell)+1, rows=Math.ceil(H/cell)+1, ox=(W-(cols-1)*cell)/2, oy=(H-(rows-1)*cell)/2;
  var px=mx*W, py=my*H;
  ctx.strokeStyle='rgba(255,255,255,0.07)';ctx.lineWidth=1; // hairline lattice
  ctx.beginPath();for(var c=0;c<cols;c++){ctx.moveTo(ox+c*cell,0);ctx.lineTo(ox+c*cell,H);}for(var r=0;r<rows;r++){ctx.moveTo(0,oy+r*cell);ctx.lineTo(W,oy+r*cell);}ctx.stroke();
  for(r=0;r<rows;r++)for(c=0;c<cols;c++){
    var cx=ox+c*cell, cy=oy+r*cell, d=Math.hypot(cx-px,cy-py)/cell;
    var wv=Math.sin(d*0.55-ts*2.2), s=0.5+0.5*wv;                       // radial wave from the pointer
    var band=0.5+0.5*Math.sin(c*0.45-ts*1.6+Math.sin(r*0.7+ts*0.4));    // travelling bars
    var mv=function(m){
      if(m===0)return {sz:0.62,rot:s*Math.PI/2,fill:1,a:0.35+0.65*s};
      if(m===1)return {sz:0.12+0.7*s,rot:0,fill:1,a:1};
      if(m===2)return {sz:0.25+0.7*(0.5+0.5*Math.sin(d*0.9-ts*3)),rot:Math.PI/4,fill:0,a:0.9};
      return {sz:0.18+0.62*band*band,rot:0,fill:band>0.55?1:0,a:0.25+0.75*band};
    };
    var A=mv(m0), B=mv(m1), sz=(A.sz+(B.sz-A.sz)*xf)*cell, rot=A.rot+(B.rot-A.rot)*xf, fill=A.fill+(B.fill-A.fill)*xf, al=A.a+(B.a-A.a)*xf;
    if(sz<1)continue;
    ctx.save();ctx.translate(cx,cy);ctx.rotate(rot*(1-grid.morph));
    ctx.beginPath();rrect(-sz/2,-sz/2,sz,sz,grid.morph*sz/2);
    if(fill>0.02){ctx.fillStyle='rgba(255,255,255,'+(al*fill)+')';ctx.fill();}
    if(fill<0.98){ctx.strokeStyle='rgba(255,255,255,'+(al*(1-fill))+')';ctx.lineWidth=Math.max(1,dpr);ctx.stroke();}
    ctx.restore();
  }
}

// -- Mode dispatch --
var inits={flow:flowInit,mesh:meshInit,lines:linesInit,scan:scanInit,matrix:function(){},grid:gridInit};
var draws={flow:flowDraw,mesh:meshDraw,lines:linesDraw,scan:scanDraw,matrix:matrixDraw,grid:gridDraw};

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
  running=false;cancelAnimationFrame(raf);if(mic.on){micStop();setOpts();}
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
    resize();clearCanvas();inits[cur]();setOpts();
    if(!running)startLoop();
  });
  bar.appendChild(btn);
});

// -- per-mode hint + the one option a mode may have (only Lines: the microphone, opt-in) --
function setOpts(){
  var m=modes.filter(function(x){return x.id===cur;})[0];
  if(hint)hint.textContent=m.hint||'';
  if(!opts)return;
  if(cur!=='lines'&&mic.on)micStop();
  opts.innerHTML='';
  if(m.opt==='mic'){var b=document.createElement('button');b.className='gen-mode'+(mic.on?' active':'');b.textContent=mic.on?'Mic on':'Mic';
    b.setAttribute('aria-label','Use microphone');b.addEventListener('click',function(){micToggle(b);});opts.appendChild(b);}
}
setOpts();

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
