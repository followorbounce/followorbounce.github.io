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
  {id:'flow',   label:'Meadow', hint:'Walk through the grass · press for a gust · the sun and moon follow the clock', opt:'sky'},
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

// ===== MEADOW v2 (WebGL2): a dreaming meadow =====
// Instanced grass that bends with stiffness, travelling wind and a pointer wake; GPU-drawn flowers that
// follow the sun and glow at night; a flowing pigment sky with a sun on its clock arc and the moon in
// today's real phase. Falls back to the 2D meadow above if WebGL2 is unavailable.
var M={ok:null,gl:null,cv:null,dpr:1,W:1,H:1,trail:[],gusts:[],inside:false,real:false,dream0:0,dreamT0:0,lastHint:0};
var DREAM_DAY=120; // seconds per dream-time day
var TRAIL_N=16, GUST_N=4;
var GL_COMMON='#version 300 es\nprecision highp float;\n'+
'uniform vec2 uRes;uniform float uT;uniform float uHorizon;uniform vec4 uTrail[16];uniform vec4 uGust[4];uniform float uWind;\n'+
'uniform vec3 uSun;uniform vec3 uMoon;uniform float uPhase;uniform float uDark;uniform float uDay;uniform float uGold;\n'+
'uniform vec3 uZen;uniform vec3 uHor;uniform vec3 uFog;uniform vec3 uLight;\n'+
'float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}\n'+
'float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+1.),f.x),f.y);}\n'+
'float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*vnoise(p);p=p*2.03+vec2(17.1,9.7);a*=.5;}return s;}\n'+
// iridescent cosine palette; dark theme a little deeper and more saturated
'vec3 pal(float t){vec3 a=mix(vec3(.62,.58,.66),vec3(.5,.45,.58),uDark),b=mix(vec3(.32,.3,.32),vec3(.48,.42,.42),uDark);return a+b*cos(6.2832*(vec3(1.)*t+vec3(.0,.33,.67)));}\n'+
// wind + pointer field -> horizontal bend (in blade heights) at a root position (px, y down)
'vec3 pal2(float t){return vec3(.52,.52,.62)+vec3(.42,.36,.38)*cos(6.2832*(t+vec3(.55,.72,.92)));}\n'+
'float bendAt(vec2 base,float z,float phase){\n'+
'  float x=base.x/uRes.y, t=uT;\n'+
'  float gust=fbm(vec2(x*.9-t*.32,z*2.+t*.04))*2.-1.;\n'+
'  float wave=sin(x*4.2-t*1.35+gust*2.4);\n'+
'  float prevailing=.18+.22*vnoise(vec2(t*.05,3.1));\n'+
'  float w=(prevailing+wave*.22+gust*.38)*uWind;\n'+
'  w+=sin(t*(2.1+phase*1.7)+phase*6.2832)*.045*uWind;\n'+
'  float push=0.;\n'+
'  for(int i=0;i<16;i++){vec4 tr=uTrail[i]; if(tr.w<=0.)continue; vec2 d=base-tr.xy; d.y*=1.6;\n'+
'    float r=uRes.y*(.12+.1*z); float f=exp(-dot(d,d)/(r*r)); push+=clamp(d.x/r*1.6,-1.,1.)*f*exp(-tr.z*1.1)*tr.w*1.9;}\n'+
'  for(int i=0;i<4;i++){vec4 g=uGust[i]; if(g.w<=0.)continue; vec2 d=base-g.xy; d.y*=1.6; float dist=length(d);\n'+
'    float front=g.z*uRes.y*1.1; float kk=(dist-front)/(uRes.y*.2); float ring=exp(-kk*kk); push+=d.x/(abs(d.x)+uRes.y*.06)*ring*exp(-g.z*.75)*2.4;}\n'+
'  return w+push;}\n'+
'float rootY(float z){return uHorizon+pow(z,1.45)*(uRes.y-uHorizon+uRes.y*.06);}\n';

var GL_SKY_VS='#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0.,1.);}';
var GL_SKY_FS=GL_COMMON+
'out vec4 o;\n'+
'void main(){\n'+
'  vec2 px=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y); vec2 uv=px/uRes;\n'+
'  float sky=clamp(px.y/uHorizon,0.,1.);\n'+
'  vec3 col=mix(uZen,uHor,pow(sky,1.6));\n'+
// flowing pigment clouds (domain-warped fbm), strongest high in the sky, brighter at night
'  vec2 q=vec2(px.x/uRes.y,px.y/uRes.y)*1.6; float t=uT*.035;\n'+
'  vec2 w1=vec2(fbm(q+vec2(t,0.)),fbm(q+vec2(5.2,1.3)-vec2(0.,t)));\n'+
'  vec2 w2=vec2(fbm(q+3.*w1+vec2(1.7,9.2)+t*.6),fbm(q+3.*w1+vec2(8.3,2.8)-t*.4));\n'+
'  float f=fbm(q+3.5*w2);\n'+
'  vec3 ink=pal2(f*.9+w2.x*.5+uT*.012)*mix(vec3(1.),vec3(.75,.85,1.25),(1.-uDay)*uDark);\n'+
'  float amt=smoothstep(.45,.9,f)*(1.-sky*.75)*mix(.16,.42,1.-uDay)*(1.-uDark*.25+uDark*.45*(1.-uDay));\n'+
'  col=mix(col,ink,amt);\n'+
// stars
'  float night=1.-uDay;\n'+
'  vec2 sg=floor(px/3.); float st=h21(sg); float tw=.6+.4*sin(uT*2.+st*40.);\n'+
'  col+=vec3(.9,.92,1.)*step(.9965,st)*tw*night*(1.-sky)*mix(.45,1.,uDark);\n'+
// sun
'  vec2 sd=px-uSun.xy; float sr=uRes.y*.055; float sdl=length(sd)/sr;\n'+
'  float sunUp=smoothstep(-.18,.02,uSun.z);\n'+
'  vec3 sunCol=mix(vec3(1.,.55,.3),vec3(1.,.96,.86),smoothstep(0.,.35,uSun.z));\n'+
'  col+=sunCol*(smoothstep(1.05,.95,sdl)*.9+exp(-sdl*.55)*.35+exp(-sdl*.12)*.12)*sunUp;\n'+
// moon with today's phase: light from the sun's side, elongation = phase*2pi
'  vec2 md=(px-uMoon.xy)/(uRes.y*.045); float mr=length(md);\n'+
'  float moonUp=smoothstep(-.15,.03,uMoon.z)*mix(.55,1.,night);\n'+
'  if(mr<1.){float zz=sqrt(1.-mr*mr); float a=uPhase*6.2832; vec3 L=vec3(sin(a),0.,-cos(a));\n'+
'    float lit=smoothstep(-.06,.12,dot(vec3(md.x,-md.y,zz),L));\n'+
'    float crater=.82+.18*fbm(md*3.+7.);\n'+
'    vec3 mc=vec3(.93,.92,.88)*crater; col=mix(col,mix(col*.85+vec3(.04,.045,.07),mc,lit),moonUp*smoothstep(1.,.96,mr));}\n'+
'  col+=vec3(.75,.8,1.)*exp(-mr*.9)*.16*moonUp*(.3+.7*abs(sin(uPhase*3.1416)));\n'+
// horizon haze, sun glow across the horizon at golden hour
'  col+=uLight*exp(-abs(px.y-uHorizon)/(uRes.y*.12))*uGold*.35*exp(-abs(px.x-uSun.x)/(uRes.x*.35));\n'+
// distant hills with aerial perspective
'  float hx=px.x/uRes.y;\n'+
'  float h1=uHorizon-uRes.y*(.06+.07*fbm(vec2(hx*.8,1.3)));\n'+
'  float h2=uHorizon-uRes.y*(.02+.05*fbm(vec2(hx*1.4+4.,2.7)));\n'+
'  vec3 hillA=mix(uFog,uZen*.6+vec3(.02,.04,.04),.35), hillB=mix(uFog,vec3(.12,.2,.16)*mix(1.,.35,uDark),.45);\n'+
'  col=mix(col,hillA,smoothstep(h1-1.,h1+1.,px.y)*.85);\n'+
'  col=mix(col,hillB,smoothstep(h2-1.,h2+1.,px.y));\n'+
'  if(px.y>uHorizon){float g=(px.y-uHorizon)/(uRes.y-uHorizon); col=mix(mix(uFog,vec3(.16,.26,.16)*mix(1.,.3,uDark),.6),vec3(.06,.12,.08)*mix(1.,.4,uDark),g);}\n'+
// vignette + grain
'  col*=1.-.18*pow(length(uv-.5)*1.25,2.);\n'+
'  col+=(h21(px+fract(uT)*91.)-.5)*.018;\n'+
'  o=vec4(col,1.);}';

var GL_BLADE_VS=GL_COMMON+
'in vec2 aC; in vec4 aB; in vec4 aL;\n'+ // aC: side,v · aB: x01,z,h01,phase · aL: width,hue,stiff,tint
'out float vV; out float vZ; out float vHue; out float vSide; out float vTint; out float vX; out float vFw;\n'+
'void main(){\n'+
'  float z=aB.y, scale=mix(.32,1.,z);\n'+
'  float yb=rootY(z), xb=(aB.x*1.1-.05)*uRes.x;\n'+
'  float h=(.07+.17*aB.z)*uRes.y*scale*1.55;\n'+
'  float b=bendAt(vec2(xb,yb),z,aB.w)/aL.z;\n'+
'  b=clamp(b,-2.2,2.2);\n'+
'  float v=aC.y;\n'+
'  float bx=b*h*.55*v*v;\n'+
'  float by=-h*v*(1.-.16*min(abs(b),2.)*v);\n'+
'  float wdt=aL.x*scale*(1.-v)*(1.-v*.25)*uRes.y/280.;\n'+
'  vec2 p=vec2(xb+bx+aC.x*wdt,yb+by);\n'+
'  vV=v; vZ=z; vHue=aL.y; vSide=aC.x; vTint=aL.w; vX=xb/uRes.x;\n'+
'  vec2 fq=vec2(vX*2.6-uT*.07,z*1.8+uT*.025); vFw=fbm(fq+1.7*vec2(fbm(fq+3.1),fbm(fq-1.3+uT*.05)));\n'+
'  gl_Position=vec4(p.x/uRes.x*2.-1.,1.-p.y/uRes.y*2.,0.,1.);}';
var GL_BLADE_FS=GL_COMMON+
'in float vV; in float vZ; in float vHue; in float vSide; in float vTint; in float vX; in float vFw; out vec4 o;\n'+
'void main(){\n'+
'  vec3 base=mix(vec3(.10,.20,.12),vec3(.012,.04,.04),uDark);\n'+
'  vec3 mid=mix(vec3(.34,.52,.30)+vTint*vec3(.08,.06,-.02),vec3(.05,.14,.13),uDark);\n'+
'  vec3 col=mix(base,mid,smoothstep(0.,.8,vV));\n'+
'  vec3 irid=pal(vHue+vV*.35+uT*.02);\n'+
'  col=mix(col,irid*mix(1.,.8,uDark),smoothstep(.55,1.,vV)*mix(.28,.45,uDark));\n'+
'  col+=uLight*smoothstep(.5,1.,vV)*(.18*uDay+.08)*(.6+.4*vZ);\n'+
'  float fw=vFw;\n'+
'  float band=smoothstep(.38,.6,fw)*smoothstep(.2,1.,vV);\n'+
'  col=mix(col,pal2(fw*1.3+uT*.015)*mix(1.08,1.15,uDark),band*mix(.52,.78,uDark)*mix(1.,1.15,1.-uDay));\n'+
// light that flows up the blades at night, like data through fibre
'  float flow=smoothstep(.93,1.,sin(vV*7.-uT*1.6+vHue*31.+vX*9.));\n'+
'  col+=pal(vHue+.5)*flow*(1.-uDay)*mix(.25,.7,uDark)*smoothstep(.2,.9,vV);\n'+
'  col=mix(col,uFog,pow(1.-vZ,1.5)*.78);\n'+
'  float soft=mix(.35,-.6,smoothstep(.86,1.,vZ));\n'+
'  float a=smoothstep(1.,soft,abs(vSide))*mix(.7,1.,vZ)*mix(1.,.7,smoothstep(.9,1.,vZ));\n'+
'  o=vec4(col*a,a);}';

var GL_FLOWER_VS=GL_COMMON+
'in vec2 aQ; in vec4 aB; in vec4 aF;\n'+ // aQ corner -1..1 · aB: x01,z,h01,phase · aF: stiff,petals,hue,size
'out vec2 vP; out float vHue; out float vPet; out float vZ; out float vRot; out float vSeed;\n'+
'void main(){\n'+
'  float z=aB.y, scale=mix(.32,1.,z);\n'+
'  float yb=rootY(z), xb=(aB.x*1.1-.05)*uRes.x;\n'+
'  float h=(.07+.17*aB.z)*uRes.y*scale*1.55;\n'+
'  float b=clamp(bendAt(vec2(xb,yb),z,aB.w)/aF.x,-2.2,2.2);\n'+
'  vec2 tip=vec2(xb+b*h*.55,yb-h*(1.-.16*min(abs(b),2.)));\n'+
'  float s=aF.w*uRes.y*.072*mix(.16,1.,z*z)*(.85+.15*sin(uT*.6+aB.w*6.2832));\n'+
// heliotropism: by day the head leans toward the sun
'  float lean=clamp((uSun.x-tip.x)/uRes.x,-1.,1.)*.5*uDay+b*.25;\n'+
'  float c=cos(lean),sn=sin(lean); vec2 q=vec2(aQ.x,aQ.y*.82); q=vec2(c*q.x-sn*q.y,sn*q.x+c*q.y);\n'+
'  vec2 p=tip+q*s;\n'+
'  vP=aQ; vHue=aF.z; vPet=aF.y; vZ=z; vRot=aB.w*6.2832+uT*.05; vSeed=aB.w;\n'+
'  gl_Position=vec4(p.x/uRes.x*2.-1.,1.-p.y/uRes.y*2.,0.,1.);}';
var GL_FLOWER_FS=GL_COMMON+
'in vec2 vP; in float vHue; in float vPet; in float vZ; in float vRot; in float vSeed; out vec4 o;\n'+
'void main(){\n'+
'  vec2 p=vP; float r=length(p), a=atan(p.y,p.x)+vRot;\n'+
'  float open=mix(.42,1.,smoothstep(-.05,.3,uSun.z))*(.92+.08*sin(uT*.8+vSeed*30.));\n'+
'  float lobe=pow(abs(cos(a*vPet*.5)),.55);\n'+
'  float edge=.62*open*(.55+.45*lobe)+.04*sin(a*vPet*3.)*open;\n'+
'  float petal=smoothstep(edge+.03,edge-.03,r);\n'+
'  float inner=smoothstep(edge*.62+.03,edge*.62-.03,r)*step(.5,fract(vSeed*7.));\n'+ // some flowers carry a second ring
'  float core=smoothstep(.16,.11,r);\n'+
'  vec3 pc=pal(vHue+r*.55+uT*.015);\n'+
'  pc=mix(pc,pal(vHue+.35),inner*.6);\n'+
'  pc*=.75+.25*smoothstep(0.,edge,r)+.15*sin(a*vPet*6.);\n'+ // veins
'  vec3 cc=mix(vec3(.98,.82,.42),vec3(1.,.9,.6),uDark);\n'+
'  float night=1.-uDay;\n'+
'  pc+=vec3(1.)*smoothstep(edge-.14,edge-.01,r)*petal*.28;\n'+
'  vec3 col=mix(pc,cc,core);\n'+
'  col=mix(col,uFog,(1.-vZ)*(1.-vZ)*.55);\n'+
'  float a1=max(petal*.88,core)*mix(.85,1.,vZ);\n'+
'  float glow=exp(-r*2.6)*night*mix(.25,.8,uDark)*smoothstep(1.,.65,r);\n'+ // bioluminescence at night
'  vec3 g=pal(vHue+.1)*glow;\n'+
'  o=vec4(col*a1+g*(1.-a1),a1);}';

var GL_MOTE_VS=GL_COMMON+
'in vec4 aS; out float vA; out float vHue;\n'+ // x01, band, speed, phase
'void main(){\n'+
'  float t=uT*aS.z;\n'+
'  float x=fract(aS.x+t*.012*(.4+uWind)+sin(t*.31+aS.w*6.)*.02);\n'+
'  float yb=mix(uHorizon-uRes.y*.08,uRes.y*.97,aS.y);\n'+
'  vec2 p=vec2(x*uRes.x,yb+sin(t*.53+aS.w*13.)*uRes.y*.035+cos(t*.29+aS.w*5.)*uRes.y*.02);\n'+
// drawn toward the pointer like moths
'  for(int i=0;i<16;i++){vec4 tr=uTrail[i]; if(tr.w<=0.)continue; vec2 d=tr.xy-p; float f=exp(-dot(d,d)/pow(uRes.y*.25,2.))*exp(-tr.z*.8); p+=d*f*.22;}\n'+
'  float blink=.5+.5*sin(uT*(1.3+aS.z)+aS.w*40.);\n'+
'  vA=mix(.35,blink,1.-uDay)*mix(.55,1.,uDark); vHue=aS.w;\n'+
'  gl_PointSize=(1.5+2.5*aS.y)*uRes.y/280.*mix(1.,1.6,1.-uDay);\n'+
'  gl_Position=vec4(p.x/uRes.x*2.-1.,1.-p.y/uRes.y*2.,0.,1.);}';
var GL_MOTE_FS=GL_COMMON+
'in float vA; in float vHue; out vec4 o;\n'+
'void main(){vec2 c=gl_PointCoord-.5; float r=length(c)*2.; float a=exp(-r*r*3.)*vA;\n'+
'  vec3 col=mix(vec3(1.,.95,.75),pal(vHue)*1.2,1.-uDay);\n'+
'  o=vec4(col*a,0.);}'; // additive (alpha 0 with premultiplied blending)

function glCompile(gl,vs,fs){
  function sh(type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
  var p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,vs));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
  var u={},n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);
  for(var i=0;i<n;i++){var info=gl.getActiveUniform(p,i),name=info.name.replace(/\[0\]$/,'');u[name]=gl.getUniformLocation(p,info.name);}
  return {p:p,u:u};
}
function meadowSetup(){
  if(M.ok!==null)return M.ok;
  try{
    var c=document.createElement('canvas');c.className='gen-gl';c.setAttribute('aria-hidden','true');
    var gl=c.getContext('webgl2',{alpha:false,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:!!window.__genPreserve});
    if(!gl)throw new Error('no webgl2');
    M.sky=glCompile(gl,GL_SKY_VS,GL_SKY_FS);
    M.blade=glCompile(gl,GL_BLADE_VS,GL_BLADE_FS);
    M.flower=glCompile(gl,GL_FLOWER_VS,GL_FLOWER_FS);
    M.mote=glCompile(gl,GL_MOTE_VS,GL_MOTE_FS);
    M.gl=gl;M.cv=c;cv.parentNode.insertBefore(c,cv.nextSibling);
    if(window.__genPreserve){window.__meadow=M;window.__meadowDraw=function(t){meadowDraw(t);};} // test hook (scratch test pages only)
    c.addEventListener('webglcontextlost',function(e){e.preventDefault();M.ok=false;meadowHide();if(cur==='flow'){flowInit();}});
    M.ok=true;
  }catch(e){M.ok=false;M.err=String(e&&e.message||e);}
  return M.ok;
}
function glBuffer(gl,data){var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);return b;}
function glAttr(gl,prog,name,buf,size,stride,off,div){var loc=gl.getAttribLocation(prog,name);if(loc<0)return;gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,stride,off);gl.vertexAttribDivisor(loc,div);}
function meadowBuild(){
  var gl=M.gl, area=M.W*M.H/(M.dpr*M.dpr);
  var NB=Math.round(Math.max(2600,Math.min(9500,area/26))), SEG=6;
  // blade strip geometry
  var g=[];for(var i=0;i<=SEG;i++){var v=i/SEG;g.push(-1,v,1,v);}
  var rnd=function(n){return hsh(n*2654435761>>>0);};
  var blades=[];
  for(i=0;i<NB;i++){var z=Math.pow(rnd(i*7+1),0.75);blades.push([rnd(i*7+2),z,Math.pow(rnd(i*7+3),1.3),rnd(i*7+4),
    (1.4+rnd(i*7+5)*2.6),rnd(i*7+6)*0.6+0.15,0.75+rnd(i*7+8)*0.9,rnd(i*7+9)]);}
  blades.sort(function(a,b){return a[1]-b[1];}); // far to near: GPU keeps primitive order, so blending layers correctly
  var bd=new Float32Array(NB*8);blades.forEach(function(b,k){bd.set(b,k*8);});
  // flowers ride the tips of the taller, nearer blades
  var fl=[];for(i=0;i<NB;i++){var b=blades[i];
    var drift=0.5+0.5*Math.sin(b[0]*13.0+Math.sin(b[1]*7.0)*2.2)*Math.sin(b[0]*4.3+b[1]*5.1+1.7);
    if(b[2]>0.45&&b[1]>0.1&&rnd(i*13+3)<0.16*drift*drift){
    fl.push(b[0],b[1],b[2],b[3], b[6], 4+Math.floor(rnd(i*13+5)*5), rnd(i*13+7), 0.6+rnd(i*13+11)*0.7);}}
  var NF=fl.length/8;
  var motes=new Float32Array(700*4);for(i=0;i<700;i++){motes.set([rnd(i*5+101),rnd(i*5+102),0.5+rnd(i*5+103)*0.9,rnd(i*5+104)],i*4);}
  if(M.bufs)M.bufs.forEach(function(b){gl.deleteBuffer(b);});
  var gB=glBuffer(gl,new Float32Array(g)), iB=glBuffer(gl,bd), qB=glBuffer(gl,new Float32Array([-1,-1,1,-1,-1,1,1,1])), fB=glBuffer(gl,new Float32Array(fl)), mB=glBuffer(gl,motes);
  M.bufs=[gB,iB,qB,fB,mB];
  M.vaoBlade=gl.createVertexArray();gl.bindVertexArray(M.vaoBlade);
  glAttr(gl,M.blade.p,'aC',gB,2,8,0,0);glAttr(gl,M.blade.p,'aB',iB,4,32,0,1);glAttr(gl,M.blade.p,'aL',iB,4,32,16,1);
  M.vaoFlower=gl.createVertexArray();gl.bindVertexArray(M.vaoFlower);
  glAttr(gl,M.flower.p,'aQ',qB,2,8,0,0);glAttr(gl,M.flower.p,'aB',fB,4,32,0,1);glAttr(gl,M.flower.p,'aF',fB,4,32,16,1);
  M.vaoMote=gl.createVertexArray();gl.bindVertexArray(M.vaoMote);glAttr(gl,M.mote.p,'aS',mB,4,16,0,0);
  M.vaoSky=gl.createVertexArray();
  gl.bindVertexArray(null);
  M.nb=NB;M.nf=NF;M.nverts=(SEG+1)*2;M.nm=700;
}
function meadowResize(){
  var r=cv.getBoundingClientRect();M.dpr=Math.min(window.devicePixelRatio||1,1.5);
  M.W=Math.max(1,Math.round(r.width*M.dpr));M.H=Math.max(1,Math.round(r.height*M.dpr));
  M.cv.width=M.W;M.cv.height=M.H;
}
function meadowHide(){if(M.cv)M.cv.style.display='none';}
function meadowInit(){
  if(!meadowSetup()){flowInit();return;}
  M.cv.style.display='block';meadowResize();meadowBuild();
  if(!M.dreamT0){var d=new Date();M.dream0=(d.getHours()+d.getMinutes()/60+d.getSeconds()/3600)/24;M.dreamT0=performance.now();}
  if(reduced)M.real=true;
}
// --- the sky clock: sun on a 24 h arc (rises 06:00 left, noon overhead, sets 18:00 right), moon lagging by its phase ---
function moonPhase(ms){var days=ms/86400000+2440587.5-2451550.1;var p=(days/29.530588853)%1;return p<0?p+1:p;} // 0 new, 0.5 full
function dayFrac(now){
  if(M.real){var d=new Date();return (d.getHours()+d.getMinutes()/60+d.getSeconds()/3600)/24;}
  var f=(M.dream0+(now-M.dreamT0)/1000/DREAM_DAY)%1;return f<0?f+1:f;
}
function clockLabel(f){var m=Math.floor(f*1440),h=Math.floor(m/60);return (h<10?'0':'')+h+':'+((m%60)<10?'0':'')+(m%60);}
function mix3(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
function sstep(a,b,x){var t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);}
function meadowDraw(t){
  if(!M.ok){flowDraw(t);return;}
  var gl=M.gl,W=M.W,H=M.H,dark=isDark()?1:0,now=performance.now(),sec=t/1000;
  var f=dayFrac(now), th=2*Math.PI*(f-0.25), sunEl=Math.sin(th), ph=moonPhase(Date.now()), thm=th-2*Math.PI*ph, moonEl=Math.sin(thm);
  var hor=H*0.56, arcH=hor*0.82;
  var sunX=W*(0.5-0.46*Math.cos(th)), sunY=hor-sunEl*arcH, moonX=W*(0.5-0.46*Math.cos(thm)), moonY=hor-moonEl*arcH;
  var day=sstep(-0.14,0.24,sunEl), gold=Math.exp(-Math.pow(sunEl/0.17,2));
  var P=dark?{zd:[.10,.19,.36],hd:[.40,.46,.54],zn:[.008,.010,.03],hn:[.045,.045,.11],gold:[.85,.40,.26],light:[.95,.75,.55]}
            :{zd:[.50,.68,.90],hd:[.93,.91,.84],zn:[.33,.37,.58],hn:[.68,.70,.83],gold:[1,.72,.55],light:[1,.9,.75]};
  var zen=mix3(mix3(P.zn,P.zd,day),dark?[.24,.16,.30]:[.62,.52,.66],gold*0.35), horc=mix3(mix3(P.hn,P.hd,day),P.gold,gold*0.8), fog=mix3(horc,zen,0.25);
  var light=mix3(dark?[.35,.42,.65]:[.75,.8,.95],P.light,day);
  // pointer trail (ages in seconds) and gust rings
  var tr=new Float32Array(TRAIL_N*4), gu=new Float32Array(GUST_N*4);
  M.trail=M.trail.filter(function(p){return now-p.t<2600;});
  for(var i=0;i<M.trail.length&&i<TRAIL_N;i++){var p=M.trail[M.trail.length-1-i];tr.set([p.x*M.dpr,p.y*M.dpr,(now-p.t)/1000,p.s],i*4);}
  M.gusts=M.gusts.filter(function(g){return now-g.t<4500;});
  for(i=0;i<M.gusts.length&&i<GUST_N;i++){var g=M.gusts[i];gu.set([g.x*M.dpr,g.y*M.dpr,(now-g.t)/1000,1],i*4);}
  var wind=reduced?0.45:1;
  gl.viewport(0,0,W,H);gl.disable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  function uniforms(pr){var u=pr.u;gl.useProgram(pr.p);
    if(u.uRes)gl.uniform2f(u.uRes,W,H);if(u.uT)gl.uniform1f(u.uT,sec);if(u.uHorizon)gl.uniform1f(u.uHorizon,hor);
    if(u.uTrail)gl.uniform4fv(u.uTrail,tr);if(u.uGust)gl.uniform4fv(u.uGust,gu);if(u.uWind)gl.uniform1f(u.uWind,wind);
    if(u.uSun)gl.uniform3f(u.uSun,sunX,sunY,sunEl);if(u.uMoon)gl.uniform3f(u.uMoon,moonX,moonY,moonEl);if(u.uPhase)gl.uniform1f(u.uPhase,ph);
    if(u.uDark)gl.uniform1f(u.uDark,dark);if(u.uDay)gl.uniform1f(u.uDay,day);if(u.uGold)gl.uniform1f(u.uGold,gold);
    if(u.uZen)gl.uniform3fv(u.uZen,zen);if(u.uHor)gl.uniform3fv(u.uHor,horc);if(u.uFog)gl.uniform3fv(u.uFog,fog);if(u.uLight)gl.uniform3fv(u.uLight,light);}
  uniforms(M.sky);gl.bindVertexArray(M.vaoSky);gl.disable(gl.BLEND);gl.drawArrays(gl.TRIANGLES,0,3);gl.enable(gl.BLEND);
  uniforms(M.blade);gl.bindVertexArray(M.vaoBlade);gl.drawArraysInstanced(gl.TRIANGLE_STRIP,0,M.nverts,M.nb);
  uniforms(M.flower);gl.bindVertexArray(M.vaoFlower);if(M.nf)gl.drawArraysInstanced(gl.TRIANGLE_STRIP,0,4,M.nf);
  uniforms(M.mote);gl.bindVertexArray(M.vaoMote);gl.drawArrays(gl.POINTS,0,M.nm);
  gl.bindVertexArray(null);
  if(now-M.lastHint>1000&&hint){M.lastHint=now;hint.textContent='Walk through the grass · press for a gust · sky '+clockLabel(f)+(M.real?' (your time)':' (dream time)');}
}
function meadowPointer(e,kind){
  if(cur!=='flow'||!M.ok)return;
  var r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,now=performance.now();
  if(kind==='down'){M.gusts.push({x:x,y:y,t:now});if(M.gusts.length>GUST_N)M.gusts.shift();return;}
  var last=M.trail[M.trail.length-1];
  var sp=last?Math.hypot(x-last.x,y-last.y)/Math.max(8,now-last.t):0;
  if(last&&now-last.t<30&&Math.hypot(x-last.x,y-last.y)<6)return;
  M.trail.push({x:x,y:y,t:now,s:Math.min(1,0.35+sp*1.4)});if(M.trail.length>TRAIL_N)M.trail.shift();
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
var inits={flow:meadowInit,mesh:meshInit,lines:linesInit,scan:scanInit,matrix:function(){},grid:gridInit};
var draws={flow:meadowDraw,mesh:meshDraw,lines:linesDraw,scan:scanDraw,matrix:matrixDraw,grid:gridDraw};

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
    if(cur!=='flow')meadowHide();
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
  if(m.opt==='sky'){var sb=document.createElement('button');sb.className='gen-mode'+(M.real?' active':'');sb.textContent='Your time';
    sb.setAttribute('aria-pressed',M.real?'true':'false');sb.title='Sun and moon at your local time instead of the fast dream-time day';
    sb.addEventListener('click',function(){M.real=!M.real;sb.classList.toggle('active',M.real);sb.setAttribute('aria-pressed',M.real?'true':'false');
      if(!M.real){var d=new Date();M.dream0=(d.getHours()+d.getMinutes()/60+d.getSeconds()/3600)/24;M.dreamT0=performance.now();}M.lastHint=0;});opts.appendChild(sb);}
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
// listen on the frame: the Meadow's WebGL canvas sits on top of the 2D one
var frame=cv.parentNode;
frame.addEventListener('pointermove',function(e){updatePointer(e);meadowPointer(e,'move');});
frame.addEventListener('pointerdown',function(e){pressed=true;updatePointer(e);meadowPointer(e,'down');});
frame.addEventListener('pointerup',function(){pressed=false;});
frame.addEventListener('pointerleave',function(){pressed=false;});

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
