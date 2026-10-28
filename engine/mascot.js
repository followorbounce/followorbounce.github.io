/* Mascots: Dima and Claude (the Claude Code mascot), live on the homepage's first screen.
 *
 * The characters are a line-for-line port of /home/none/git/animation/3d/characters.py and the renderer of
 * voxel.py (painter-sorted boxes, key + fill + rim light, jittered voxel cells), so the homepage shows the same two
 * characters as the films. characters.py stays the source of truth: change the look there first, then here, and run
 * `python3 3d/web_parity.py` in the animation repo, which checks this file box-for-box against the Python.
 *
 * It runs in the homepage intro (engine/mascot-hero.*). Everything else here is the stage: moods that react to the visitor (look-at, pokes, throws, idling), six
 * scenarios, five environments. API: FobMascot.init / draw / pointer / opts / hint (see the end of the file).
 */
(function(root){
'use strict';

// ---------- matrices (4×4, row-major, same layout as numpy) ----------
function I4(){return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];}
function T(x,y,z){var m=I4();m[3]=x;m[7]=y;m[11]=z;return m;}
function RX(a){var c=Math.cos(a),s=Math.sin(a),m=I4();m[5]=c;m[6]=-s;m[9]=s;m[10]=c;return m;}
function RY(a){var c=Math.cos(a),s=Math.sin(a),m=I4();m[0]=c;m[2]=s;m[8]=-s;m[10]=c;return m;}
function RZ(a){var c=Math.cos(a),s=Math.sin(a),m=I4();m[0]=c;m[1]=-s;m[4]=s;m[5]=c;return m;}
function mul(A,B){
  var o=new Array(16);
  for(var i=0;i<4;i++)for(var j=0;j<4;j++)
    o[i*4+j]=A[i*4]*B[j]+A[i*4+1]*B[4+j]+A[i*4+2]*B[8+j]+A[i*4+3]*B[12+j];
  return o;
}
function mm(){var m=arguments[0];for(var i=1;i<arguments.length;i++)m=mul(m,arguments[i]);return m;}
function hexc(h){h=h.replace('#','');return [parseInt(h.substr(0,2),16),parseInt(h.substr(2,2),16),parseInt(h.substr(4,2),16)];}
function box(M,a,b,col,cells,glow){return {M:M,a:a,b:b,c:typeof col==='string'?hexc(col):col,cells:cells||0,glow:glow||0};}
function g(o,k,d){return (o&&o[k]!==undefined)?o[k]:d;}

// ---------- characters (port of characters.py) ----------
var SKIN='#E2A37A',SKIN2='#C98A63',HAIR='#3A2A20',BEARD='#5A3F2E',HOOD='#2C3442',HOOD2='#232A36',ORANGE='#D97757';
function blink(t,seed){var ph=(t+seed*1.7)%3.7;return ph<0.12?0.12:1.0;}

function dima(t,mood,mo,gest,R){
  gest=gest||{};mood=mood||'calm';mo=mo||0;R=R||I4();
  var out=[];
  var slump=g(gest,'slump',0);
  var breathe=Math.sin(t*2.1)*0.015;
  out.push(box(R,[-0.42,0,-0.25],[-0.06,1.55,0.25],'#1E2230',4),box(R,[0.06,0,-0.25],[0.42,1.55,0.25],'#1E2230',4));
  var Tor=mm(R,T(0,1.55,0),RX(slump*0.25));
  out.push(box(Tor,[-0.56,0,-0.3],[0.56,1.25+breathe,0.3],HOOD,6),
           box(Tor,[-0.48,1.0,-0.42],[0.48,1.3,-0.22],HOOD2,5),
           box(Tor,[-0.16,0.55,0.3],[-0.11,1.05,0.34],ORANGE),box(Tor,[0.11,0.6,0.3],[0.16,1.05,0.34],ORANGE),
           box(Tor,[-0.3,0.12,0.3],[0.3,0.45,0.33],HOOD2));
  var arms=[['L',g(gest,'armL',[0.1,0.06,0.15])],['R',g(gest,'armR',[0.1,0.06,0.15])]];
  for(var k=0;k<2;k++){
    var pose=arms[k][1],up=pose[0],roll=pose[1],fore=pose[2],yaw=pose.length>3?pose[3]:0;
    var sx=arms[k][0]==='L'?-1:1;
    var A=mm(Tor,T(sx*0.68,1.15,0),RY(-sx*yaw),RZ(sx*roll),RX(-up));
    out.push(box(A,[-0.14,-0.62,-0.15],[0.14,0.05,0.15],HOOD,6));
    var F=mm(A,T(0,-0.6,0),RX(-fore));
    out.push(box(F,[-0.13,-0.6,-0.14],[0.13,0.0,0.14],HOOD,6),box(F,[-0.12,-0.82,-0.12],[0.12,-0.6,0.12],SKIN,5));
  }
  var nod=g(gest,'nod',0);
  var He=mm(Tor,T(0,1.25,0),RY(g(gest,'turn',0)),RX(nod-slump*0.35),RZ(g(gest,'tilt',0)));
  out.push(box(He,[-0.17,0,-0.15],[0.17,0.2,0.15],SKIN2),
           box(He,[-0.5,0.18,-0.48],[0.5,1.28,0.48],SKIN,7),
           box(He,[-0.52,1.02,-0.5],[0.52,1.42,0.42],HAIR,7),
           box(He,[-0.53,0.62,-0.5],[-0.4,1.1,0.12],HAIR,7),box(He,[0.4,0.62,-0.5],[0.53,1.1,0.12],HAIR,7),
           box(He,[-0.52,0.5,-0.5],[0.52,1.1,-0.36],HAIR,7),
           box(He,[-0.5,1.12,0.38],[0.5,1.3,0.5],HAIR,7),
           box(He,[-0.51,0.16,-0.05],[0.51,0.62,0.5],BEARD,8),
           box(He,[-0.08,0.6,0.48],[0.08,0.86,0.62],SKIN2,4));
  var mh=0.05+0.15*mo;
  var smile={joy:0.06,proud:0.04}[mood]||0;
  var mw=0.17+smile+((mood==='shock'||mood==='angry')?0.04:0);
  out.push(box(He,[-mw,0.42-mh/2,0.5],[mw,0.42+mh/2,0.53],'#5A1E1A'));
  if(mo>0.35)out.push(box(He,[-mw+0.03,0.42+mh/2-0.04,0.505],[mw-0.03,0.42+mh/2,0.535],'#F2EDE4'));
  var bl=blink(t,0);
  var wide={shock:1.3,angry:0.85,slump:0.7,joy:0.9}[mood]||1.0;
  var look=g(gest,'look',0.04);
  var TILT={worried:0.35,plead:0.45,slump:0.3,angry:-0.4,shock:0.0},LIFT={shock:0.1,joy:0.06,worried:0.03};
  for(var e=0;e<2;e++){
    var ex=e?1:-1,cx=ex*0.24,eh=0.2*bl*wide,ph=Math.min(eh,0.13);
    out.push(box(He,[cx-0.12,0.82-eh/2,0.48],[cx+0.12,0.82+eh/2,0.5],'#F4F1EA'),
             box(He,[cx-0.05+look,0.82-ph/2,0.49],[cx+0.06+look,0.82+ph/2,0.515],'#2A3550'));
    var tilt=(TILT[mood]!==undefined?TILT[mood]:0.08)*-ex,lift=LIFT[mood]||0;
    out.push(box(mm(He,T(cx,1.03+lift,0.5),RZ(tilt)),[-0.15,-0.035,0],[0.15,0.035,0.04],HAIR));
    var G=mm(He,T(cx,0.82,0.56)),fr='#111318';
    out.push(box(G,[-0.18,0.13,0],[0.18,0.17,0.03],fr),box(G,[-0.18,-0.17,0],[0.18,-0.13,0.03],fr),
             box(G,[-0.18,-0.17,0],[-0.14,0.17,0.03],fr),box(G,[0.14,-0.17,0],[0.18,0.17,0.03],fr));
  }
  out.push(box(mm(He,T(0,0.86,0.56)),[-0.07,-0.02,0],[0.07,0.02,0.03],'#111318'));
  out.push(box(He,[-0.52,0.84,-0.3],[-0.48,0.88,0.56],'#111318'),box(He,[0.48,0.84,-0.3],[0.52,0.88,0.56],'#111318'));
  if((mood==='worried'||mood==='plead'||mood==='slump')&&gest.sweat)out.push(box(He,[0.36,1.0,0.45],[0.44,1.12,0.52],'#9BD3FF',0,0.3));
  return out;
}

var RACK_TOP=2.05;
function rack(t,R){
  R=R||I4();var out=[];
  out.push(box(R,[-1.1,0,-0.7],[1.1,2.05,0.7],'#141A2A',3));
  for(var k=0;k<5;k++){
    var y=0.25+k*0.36;
    out.push(box(R,[-0.98,y,0.7],[0.98,y+0.26,0.72],'#1C2438',0));
    for(var j=0;j<4;j++){
      var on=Math.sin(t*(3+j)+k*1.3+j)>0.2;
      var colr=on?((k+j)%3===0?'#E8452C':'#38D27A'):'#2A3348';
      out.push(box(R,[0.55+j*0.1,y+0.1,0.72],[0.61+j*0.1,y+0.16,0.74],colr,0,on?0.9:0));
    }
  }
  return out;
}

function claude(t,mood,mo,gest,R,stand){
  gest=gest||{};mood=mood||'calm';mo=mo||0;R=R||I4();stand=stand||0;
  var out=[];
  var hop=g(gest,'hop',0),sway=g(gest,'sway',0);
  var B=mm(R,T(sway,stand+0.32+hop,0.05),RZ(g(gest,'tilt',0)),RY(g(gest,'turn',0)));
  var step=g(gest,'step',0),legs=[[-0.6,0.18],[-0.25,0.18],[0.25,0.18],[0.6,0.18]];
  for(var k=0;k<4;k++){
    var lx=legs[k][0],lz=legs[k][1],lift=Math.max(0,Math.sin(t*12+k*Math.PI))*0.08*step;
    out.push(box(B,[lx-0.1,-0.32+lift,lz-0.12],[lx+0.1,0.0,lz+0.12],ORANGE,6));
  }
  out.push(box(B,[-0.85,0,-0.42],[0.85,1.0-0.05*hop,0.42],ORANGE,10));
  var wave=g(gest,'wave',0);
  for(var s=0;s<2;s++){
    var sx=s?1:-1;
    var A=mm(B,T(sx*0.85,0.5,0.05),RZ(sx*(0.1+wave*(0.5+0.4*Math.sin(t*14)))));
    out.push(box(A,[Math.min(0,sx*0.24),-0.14,-0.14],[Math.max(0,sx*0.24),0.14,0.14],ORANGE,8));
  }
  var bl=blink(t,2),ey=0.6;
  for(var e=0;e<2;e++){
    var ex=e?1:-1,cx=ex*0.33;
    if(mood==='proud'||mood==='joy'||(mood==='shy'&&gest.smile)){
      for(var dd=-1;dd<=1;dd+=2)out.push(box(mm(B,T(cx+dd*0.06,ey,0.4),RZ(dd*-0.7)),[-0.09,-0.03,0],[0.09,0.03,0.03],'#1A1310'));
    }else{
      var eh=({sweat:0.16,calm:0.24,shy:0.14}[mood]||0.22)*bl,ew=mood!=='sweat'?0.11:0.13,lk=g(gest,'look',0);
      out.push(box(B,[cx-ew/2+lk,ey-eh/2,0.4],[cx+ew/2+lk,ey+eh/2,0.43],'#1A1310'));
    }
    if(mood==='shy'||mood==='proud'||gest.blush)
      out.push(box(B,[cx+ex*0.12-0.09,ey-0.24,0.4],[cx+ex*0.12+0.09,ey-0.17,0.42],'#F28FA0',0,0.15));
  }
  if(mo>0.05){var mh=0.03+0.1*mo;out.push(box(B,[-0.07,0.32-mh/2,0.4],[0.07,0.32+mh/2,0.43],'#1A1310'));}
  else if(mood==='calm'||mood==='proud')out.push(box(B,[-0.05,0.3,0.4],[0.05,0.33,0.43],'#1A1310'));
  if(mood==='sweat'){var dy=(t*0.25)%0.25;out.push(box(B,[0.62,0.78-dy,0.38],[0.72,0.94-dy,0.46],'#9BD3FF',0,0.35));}
  return out;
}

var POSES={
  dima:{rest:{},shock:{armL:[1.3,0.35,1.0],armR:[1.3,0.35,1.0],nod:-0.12},'point-out':{armR:[1.0,0.6,0.6]},
    plead:{armL:[0.9,0,1.1,0.55],armR:[0.9,0,1.1,0.55],sweat:true},'fist-pump':{armR:[2.7,-0.55,0.3,0],nod:-0.1},
    'open-arms':{armL:[0.8,0.7,0.4],armR:[0.8,0.7,0.4]},facepalm:{armR:[1.35,0,1.75,0.75],nod:0.12,slump:0.3},slump:{slump:1.0}},
  claude:{rest:{},wave:{wave:1},shuffle:{step:1},shy:{blush:true,tilt:0.06},happy:{smile:true}}
};

// ---------- renderer (port of voxel.draw_boxes, drawing on a 2D canvas) ----------
function nrm(v){var l=Math.hypot(v[0],v[1],v[2]);return [v[0]/l,v[1]/l,v[2]/l];}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
var KEY=nrm([-0.45,0.75,0.55]),RIM=nrm([0.6,0.25,-0.75]),FILL=nrm([0.7,0.1,0.6]);
// face: [origin corner from a/b, u axis, v axis] for +z, -z, +x, -x, +y, -y
var FACES=[
  function(a,b,d){return [[a[0],a[1],b[2]],[d[0],0,0],[0,d[1],0]];},
  function(a,b,d){return [[b[0],a[1],a[2]],[-d[0],0,0],[0,d[1],0]];},
  function(a,b,d){return [[b[0],a[1],b[2]],[0,0,-d[2]],[0,d[1],0]];},
  function(a,b,d){return [[a[0],a[1],a[2]],[0,0,d[2]],[0,d[1],0]];},
  function(a,b,d){return [[a[0],b[1],b[2]],[d[0],0,0],[0,0,-d[2]]];},
  function(a,b,d){return [[a[0],a[1],a[2]],[d[0],0,0],[0,0,d[2]]];}
];
function jitter(i,j,seed){var x=(Math.sin(i*12.9898+j*78.233+seed*37.719)*43758.5453)%1;if(x<0)x+=1;return x-0.5;}
function xf(M,p){return [M[0]*p[0]+M[1]*p[1]+M[2]*p[2]+M[3],M[4]*p[0]+M[5]*p[1]+M[6]*p[2]+M[7],M[8]*p[0]+M[9]*p[1]+M[10]*p[2]+M[11]];}
function xv(M,p){return [M[0]*p[0]+M[1]*p[1]+M[2]*p[2],M[4]*p[0]+M[5]*p[1]+M[6]*p[2],M[8]*p[0]+M[9]*p[1]+M[10]*p[2]];}

function Cam(pos,target,fov,W,H){
  this.pos=pos;this.W=W;this.H=H;
  this.f=nrm([target[0]-pos[0],target[1]-pos[1],target[2]-pos[2]]);
  this.r=nrm(cross(this.f,[0,1,0]));this.u=cross(this.r,this.f);
  this.fs=1/Math.tan(fov*Math.PI/360)*H/2;
}
Cam.prototype.project=function(p){
  var v=[p[0]-this.pos[0],p[1]-this.pos[1],p[2]-this.pos[2]],z=dot(v,this.f),s=this.fs/Math.max(z,1e-3);
  return [this.W/2+dot(v,this.r)*s,this.H/2-dot(v,this.u)*s,z];
};
Cam.prototype.ray=function(sx,sy){
  var a=(sx-this.W/2)/this.fs,b=(this.H/2-sy)/this.fs;
  return [this.r[0]*a+this.u[0]*b+this.f[0],this.r[1]*a+this.u[1]*b+this.f[1],this.r[2]*a+this.u[2]*b+this.f[2]];
};
// screen point -> world point on the plane axis = value (axis 1 = floor y, 2 = depth z)
Cam.prototype.onPlane=function(sx,sy,axis,val){
  var d=this.ray(sx,sy);if(Math.abs(d[axis])<1e-6)return null;
  var k=(val-this.pos[axis])/d[axis];if(k<=0)return null;
  return [this.pos[0]+d[0]*k,this.pos[1]+d[1]*k,this.pos[2]+d[2]*k];
};

function rgb(c,k){return 'rgb('+Math.max(0,Math.min(255,c[0]*k|0))+','+Math.max(0,Math.min(255,c[1]*k|0))+','+Math.max(0,Math.min(255,c[2]*k|0))+')';}

// items: [{b: box, own: 'd'|'c'|..., seed}] -> draws back to front; returns screen bounds per owner
function drawBoxes(ctx,cam,items,rimC,amb){
  var bounds={},i;
  for(i=0;i<items.length;i++){
    var B=items[i].b,cen=xf(B.M,[(B.a[0]+B.b[0])/2,(B.a[1]+B.b[1])/2,(B.a[2]+B.b[2])/2]);
    items[i].dist=Math.hypot(cen[0]-cam.pos[0],cen[1]-cam.pos[1],cen[2]-cam.pos[2]);
  }
  items.sort(function(p,q){return q.dist-p.dist;});
  ctx.lineJoin='round';ctx.lineWidth=0.75;
  for(i=0;i<items.length;i++){
    var it=items[i],bx=it.b,a=bx.a,b=bx.b,d=[b[0]-a[0],b[1]-a[1],b[2]-a[2]];
    for(var fi=0;fi<6;fi++){
      var f=FACES[fi](a,b,d),ow=xf(bx.M,f[0]),uw=xv(bx.M,f[1]),vw=xv(bx.M,f[2]);
      var n=cross(uw,vw),ln=Math.hypot(n[0],n[1],n[2]);if(ln<1e-9)continue;
      n=[n[0]/ln,n[1]/ln,n[2]/ln];
      var mid=[ow[0]+uw[0]/2+vw[0]/2,ow[1]+uw[1]/2+vw[1]/2,ow[2]+uw[2]/2+vw[2]/2];
      if(dot(n,[cam.pos[0]-mid[0],cam.pos[1]-mid[1],cam.pos[2]-mid[2]])<=0)continue;
      var light=(0.34+0.62*Math.max(0,dot(n,KEY))+0.16*Math.max(0,dot(n,FILL)))*amb*(it.lit||1),rim=Math.pow(Math.max(0,dot(n,RIM)),2)*0.55;
      var base=[bx.c[0]*light+rimC[0]*rim+bx.c[0]*bx.glow,bx.c[1]*light+rimC[1]*rim+bx.c[1]*bx.glow,bx.c[2]*light+rimC[2]*rim+bx.c[2]*bx.glow];
      var P0=cam.project(ow),P1=cam.project([ow[0]+uw[0],ow[1]+uw[1],ow[2]+uw[2]]),
          P2=cam.project([ow[0]+uw[0]+vw[0],ow[1]+uw[1]+vw[1],ow[2]+uw[2]+vw[2]]),P3=cam.project([ow[0]+vw[0],ow[1]+vw[1],ow[2]+vw[2]]);
      if(P0[2]<0.05||P1[2]<0.05||P2[2]<0.05||P3[2]<0.05)continue;
      if(it.own){var bb=bounds[it.own]||(bounds[it.own]=[1e9,1e9,-1e9,-1e9]);
        for(var q=0,P=[P0,P1,P2,P3];q<4;q++){bb[0]=Math.min(bb[0],P[q][0]);bb[1]=Math.min(bb[1],P[q][1]);bb[2]=Math.max(bb[2],P[q][0]);bb[3]=Math.max(bb[3],P[q][1]);}}
      var col=rgb(base,1);
      ctx.fillStyle=col;ctx.strokeStyle=col;
      ctx.beginPath();ctx.moveTo(P0[0],P0[1]);ctx.lineTo(P1[0],P1[1]);ctx.lineTo(P2[0],P2[1]);ctx.lineTo(P3[0],P3[1]);ctx.closePath();
      ctx.fill();ctx.stroke();
      if(!bx.cells)continue;
      var nu=Math.max(1,Math.round(Math.hypot(uw[0],uw[1],uw[2])*bx.cells)),nv=Math.max(1,Math.round(Math.hypot(vw[0],vw[1],vw[2])*bx.cells));
      if(nu*nv===1)continue;
      // voxel cells: the jitter (±4.5 % brightness, as in voxel.py) is quantised to four tones, one path each
      var paths=[[],[],[],[]],seed=it.seed*7+fi;
      for(var ci=0;ci<nu;ci++)for(var cj=0;cj<nv;cj++){
        var jv=jitter(ci,cj,seed),bin=jv<-0.25?0:jv<-0.08?1:jv>0.25?3:jv>0.08?2:-1;
        if(bin>=0)paths[bin].push(ci,cj);
      }
      var tones=[-0.375,-0.165,0.165,0.375];
      for(var tb=0;tb<4;tb++){
        var L=paths[tb];if(!L.length)continue;
        ctx.fillStyle=rgb(base,1+0.09*tones[tb]);ctx.beginPath();
        for(var li=0;li<L.length;li+=2){
          var s0=L[li]/nu,s1=(L[li]+1)/nu,t0=L[li+1]/nv,t1=(L[li+1]+1)/nv;
          var c00=bil(P0,P1,P2,P3,s0,t0),c10=bil(P0,P1,P2,P3,s1,t0),c11=bil(P0,P1,P2,P3,s1,t1),c01=bil(P0,P1,P2,P3,s0,t1);
          ctx.moveTo(c00[0],c00[1]);ctx.lineTo(c10[0],c10[1]);ctx.lineTo(c11[0],c11[1]);ctx.lineTo(c01[0],c01[1]);ctx.closePath();
        }
        ctx.fill();
      }
    }
  }
  return bounds;
}
function bil(p0,p1,p2,p3,s,t){
  return [(1-t)*((1-s)*p0[0]+s*p1[0])+t*((1-s)*p3[0]+s*p2[0]),(1-t)*((1-s)*p0[1]+s*p1[1])+t*((1-s)*p3[1]+s*p2[1])];
}

// =====================================================================================================
// Stage
// =====================================================================================================
function clamp(x,a,b){return x<a?a:x>b?b:x;}
function ease(x){x=clamp(x,0,1);return x*x*(3-2*x);}
function rnd(a,b){return a+Math.random()*(b-a);}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function hash(n){var x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);}

var ENVS={
  studio:{label:'Studio',rim:'#5B6CFF',amb:1,g:-22},
  server:{label:'Server room',rim:'#3F6BFF',amb:0.92,g:-22},
  rain:{label:'Rain',rim:'#8FB4FF',amb:0.86,g:-22},
  snow:{label:'Snow',rim:'#9DB8FF',amb:1.04,g:-22},
  space:{label:'Moon',rim:'#B48CFF',amb:0.95,g:-4}
};
var ENV_IDS=['studio','server','rain','snow','space'];
var ENV_SAY={
  studio:[['d','calm','Back in the studio.'],['c','calm','Clean desk. Nice.']],
  server:[['c','proud','Home sweet home.'],['d','worried','Don\'t touch anything.']],
  rain:[['d','worried','Should\'ve brought an umbrella.'],['c','sweat','I\'m not waterproof!']],
  snow:[['d','joy','Snow!'],['c','joy','It\'s cold. I love it.']],
  space:[['c','joy','Wheee — low gravity!'],['d','shock','How did we get here?']]
};

var SCEN=[
  {id:'hello',label:'Hello'},{id:'deploy',label:'Deploy'},{id:'bug',label:'Bug hunt'},
  {id:'dance',label:'Dance'},{id:'hide',label:'Hide & seek'},{id:'ship',label:'Ship it'}
];

var S=null,ctx=null,cv=null,font='ui-monospace, Menlo, monospace',dark=false,reduce=false,store=null;

function newState(){
  return {
    t:0,last:0,W:1,H:1,dpr:1,env:'studio',yaw:0,yawGoal:0,cam:null,bounds:{},
    ptr:{x:-1,y:-1,in:false,down:false,mode:null,sx:0,sy:0,t0:0,hist:[],speed:0},
    idle:0,auto:0,scn:null,greeted:false,
    d:{x:-1.15,mood:'calm',moodT:0,pose:'rest',poseT:0,cur:null,pokes:[],mo:0,say:null,over:null},
    c:{x:1.35,y:0,z:0.3,vx:0,vy:0,goal:null,mood:'calm',moodT:0,pose:'rest',poseT:0,cur:null,pokes:[],mo:0,say:null,
       tw:null,drag:false,air:false,turn:0,over:null},
    props:{rack:null,bug:null},fx:[],weather:[],stars:null,shake:0,flash:0
  };
}

// ---- mood / pose / speech helpers ----
function feel(ch,mood,secs){ch.mood=mood;ch.moodT=secs||2.5;}
function pose(ch,p,secs){ch.pose=p;ch.poseT=secs||0;}
function say(ch,text,secs){ch.say={text:text,t0:S.t,dur:secs||Math.max(1.6,0.9+text.length*0.06)};}
function who(k){return k==='d'?S.d:S.c;}

// ---- scenarios: timed steps; each runs once when the clock passes it ----
function scenSteps(id){
  var d=S.d,c=S.c,P=S.props;
  if(id==='hello')return {dur:5,steps:[
    [0.0,function(){feel(c,'joy',3);pose(c,'wave',2.2);c.vy=4.5;say(c,'Hi there!');}],
    [0.7,function(){feel(d,'joy',3.5);pose(d,'open-arms',2.4);say(d,'Hey! Welcome in.');}],
    [3.0,function(){pose(d,'rest');feel(c,'proud',2);say(c,'Poke us. Throw me. Try the scenes.',2.6);}]]};
  if(id==='deploy')return {dur:14.5,steps:[
    [0.0,function(){P.rack={x:6.5,goal:c.x+0.15,z:-0.35};feel(c,'calm',3);say(c,'Time to clean up the server.');}],
    [1.3,function(){jump(c,P.rack.goal,RACK_TOP,0.6);}],
    [2.3,function(){feel(c,'calm',2);say(c,'Deleting old files…');pose(c,'shuffle',1.5);}],
    [3.6,function(){feel(d,'shock',2.4);pose(d,'shock',1.6);say(d,'Wait — which ones?');}],
    [5.0,function(){feel(c,'sweat',2.6);say(c,'production-old-DO-NOT-DELETE',2.2);}],
    [6.5,function(){feel(d,'plead',2.4);pose(d,'plead',2.2);say(d,'Please. Not that one.');}],
    [8.0,function(){feel(c,'shy',2.2);pose(c,'shy',2);say(c,'…it\'s already gone.');S.flash=1;}],
    [9.4,function(){feel(d,'slump',2.4);pose(d,'facepalm',2.2);say(d,'Of course it is.');}],
    [10.9,function(){feel(c,'sweat',1.6);pose(c,'shuffle',1.4);say(c,'Restoring from backup!');}],
    [12.2,function(){feel(d,'joy',2.4);pose(d,'fist-pump',1.8);feel(c,'proud',2.4);say(d,'We HAD a backup?!');burst(0.62);}],
    [13.6,function(){jump(c,P.rack.goal+0.4,0,0.6);P.rack.leave=true;}]]};
  if(id==='bug')return {dur:9,steps:[
    [0.0,function(){P.bug={x:4.2,dir:-1,sp:1.25,caught:false};feel(c,'calm',2);}],
    [0.8,function(){feel(d,'shock',2);pose(d,'point-out',2);say(d,'A bug! Over there!');}],
    [2.0,function(){feel(c,'proud',1.2);say(c,'On it.');P.bug.chase=true;}],
    [8.6,function(){if(P.bug&&!P.bug.caught)catchBug();}]]};
  if(id==='dance')return {dur:10,steps:[
    [0.0,function(){feel(d,'joy',10);feel(c,'joy',10);say(c,'Hit it!',1.2);S.dance=S.t;}],
    [9.9,function(){S.dance=null;feel(d,'proud',2);say(d,'Nailed it.');}]]};
  if(id==='hide')return {dur:11,steps:[
    [0.0,function(){feel(c,'joy',2);say(c,'Hide and seek! Count!');}],
    [1.2,function(){feel(d,'calm',3);pose(d,'facepalm',2.6);say(d,'One… two… three…',2.4);c.goal=d.x-0.05;c.zGoal=-1.25;}],
    [4.0,function(){pose(d,'rest');feel(d,'worried',2);d.over={turn:-0.55};say(d,'Claude?');}],
    [5.6,function(){d.over={turn:0.55};say(d,'Where did you go?');}],
    [7.2,function(){d.over=null;c.goal=d.x+1.7;c.zGoal=0.3;c.vy=6;feel(c,'joy',2);pose(c,'wave',1.5);say(c,'BOO!',1.1);}],
    [7.5,function(){feel(d,'shock',1.3);pose(d,'shock',1.1);S.shake=0.5;}],
    [8.9,function(){feel(d,'joy',2);pose(d,'open-arms',1.8);say(d,'Ha. You got me.');feel(c,'proud',2);}],
    [10.6,function(){c.goal=1.35;}]]};
  if(id==='ship')return {dur:5,steps:[
    [0.0,function(){feel(d,'proud',1.2);say(d,'Tests green…');}],
    [1.1,function(){feel(d,'joy',3);pose(d,'fist-pump',2.4);say(d,'SHIP IT!',1.6);burst(0.5);burst(0.3);S.shake=0.3;}],
    [1.3,function(){feel(c,'joy',3);pose(c,'wave',2.2);c.vy=7;}],
    [2.6,function(){c.vy=6;}],
    [3.6,function(){feel(c,'proud',1.5);say(c,'To production!',1.4);}]]};
  return {dur:0,steps:[]};
}
function play(id){
  if(S.scn)endScene(true);
  if(S.c.drag)return;
  var sc=scenSteps(id);
  S.scn={id:id,t0:S.t,dur:sc.dur,steps:sc.steps,i:0};
  S.idle=0;S.auto=0;markScen();
}
function endScene(cut){
  var P=S.props;
  if(P.rack&&cut){P.rack.leave=true;if(S.c.y>0.05&&!S.c.tw)jump(S.c,P.rack.goal+1.3,0,0.5);}
  if(P.bug&&cut)P.bug=null;
  S.dance=null;S.d.over=null;S.c.zGoal=0.3;
  if(S.c.goal===null&&Math.abs(S.c.x-1.35)>0.4&&!S.c.drag)S.c.goal=1.35;
  S.scn=null;markScen();
}
function jump(ch,x,y,dur){ch.tw={x0:ch.x,y0:ch.y,x1:x,y1:y,t0:S.t,dur:dur,h:1.0+Math.abs(y-ch.y)*0.5};ch.goal=null;ch.vx=0;ch.vy=0;}
function catchBug(){
  var b=S.props.bug;if(!b)return;b.caught=true;
  sparks(b.x,0.15);
  feel(S.c,'proud',2.4);S.c.vy=5;say(S.c,'Fixed.',1.4);
  feel(S.d,'joy',2.4);pose(S.d,'fist-pump',1.8);say(S.d,'Ship it!',1.4);
  S.props.bug=null;
}

// ---- particles ----
var CONF=['#D97757','#5B6CFF','#38D27A','#F2C14E','#F28FA0','#9BD3FF'];
function burst(fx){
  var W=S.W,H=S.H;
  for(var i=0;i<(reduce?24:70);i++)S.fx.push({k:'conf',x:W*fx+rnd(-20,20)*S.dpr,y:H*0.35,vx:rnd(-260,260)*S.dpr,vy:rnd(-420,-120)*S.dpr,
    r:rnd(0,6.28),vr:rnd(-9,9),c:pick(CONF),life:rnd(1.6,2.6),age:0,s:rnd(3,6)*S.dpr});
}
function sparks(x,y){
  var p=S.cam.project([x,y,0.3]);
  for(var i=0;i<18;i++){var a=i/18*6.283;S.fx.push({k:'spark',x:p[0],y:p[1],vx:Math.cos(a)*rnd(80,180)*S.dpr,vy:Math.sin(a)*rnd(80,180)*S.dpr,life:0.6,age:0,c:'#F2C14E'});}
}
function note(x,y){S.fx.push({k:'note',x:x,y:y,vx:rnd(-20,20)*S.dpr,vy:-rnd(40,70)*S.dpr,life:1.6,age:0,c:pick(CONF),ch:pick(['♪','♫'])});}

function weatherInit(){
  S.weather=[];var n=reduce?40:140;
  if(S.env==='rain')for(var i=0;i<n;i++)S.weather.push({x:Math.random(),y:Math.random(),v:rnd(1.6,2.4),l:rnd(0.03,0.06)});
  if(S.env==='snow')for(var j=0;j<n;j++)S.weather.push({x:Math.random(),y:Math.random(),v:rnd(0.06,0.14),r:rnd(1,2.6),ph:rnd(0,6.28)});
}

// ---- the main update ----
function update(dt){
  var d=S.d,c=S.c,P=S.props,env=ENVS[S.env];
  S.t+=dt;S.idle+=dt;
  // scenario clock
  if(S.scn){
    var st=S.t-S.scn.t0;
    while(S.scn&&S.scn.i<S.scn.steps.length&&st>=S.scn.steps[S.scn.i][0]){S.scn.steps[S.scn.i][1]();if(S.scn)S.scn.i++;}
    if(S.scn&&st>S.scn.dur)endScene(false);
  }else{
    S.auto+=dt;
    if(!S.greeted&&S.t>0.8){S.greeted=true;play('hello');}
    else if(S.auto>24&&!S.ptr.down){play(pick(['hello','dance','bug','hide','ship']));}
  }
  // mood decay and the idle moods
  ['d','c'].forEach(function(k){
    var ch=who(k);
    ch.moodT-=dt;ch.poseT-=dt;
    if(ch.poseT<=0&&ch.pose!=='rest'&&!(k==='d'&&ch.pose==='slump'))ch.pose='rest';
    if(ch.moodT<=0){
      if(k==='d'){
        if(S.idle>14&&!S.scn){ch.mood='slump';if(ch.pose==='rest')ch.pose='slump';}
        else if(S.env==='rain')ch.mood='worried';
        else ch.mood=S.ptr.in&&S.ptr.near==='d'?'joy':'calm';
      }else{
        if(S.ptr.in&&S.ptr.near==='c')ch.mood='shy';
        else if(S.env==='rain')ch.mood='sweat';
        else ch.mood='calm';
      }
    }
    if(ch.say&&S.t-ch.say.t0>ch.say.dur)ch.say=null;
    while(ch.pokes.length&&S.t-ch.pokes[0]>3)ch.pokes.shift();
    // mouth: syllables while the line is being said
    var talk=ch.say&&S.t-ch.say.t0<Math.min(ch.say.dur-0.2,0.35+ch.say.text.length*0.055);
    var mo=talk?Math.max(0,0.55*Math.sin(S.t*17+(k==='d'?0:1.3))+0.45*Math.sin(S.t*7.3)):0;
    ch.mo+=(mo-ch.mo)*Math.min(1,dt*25);
  });
  if(d.pose==='slump'&&(S.idle<1||S.scn))d.pose='rest';
  // pointer speed -> nerves
  S.ptr.speed*=Math.exp(-dt*4);
  if(S.ptr.speed>5000*S.dpr&&!S.scn&&!c.drag){
    if(d.mood!=='worried'){feel(d,'worried',2);if(!d.say)say(d,'Whoa — easy there.');}
    feel(c,'sweat',2);S.ptr.speed=0;
  }
  // Claude: tween (jumps), drag, walking, physics
  var g=env.g,floor=0,hx=S.halfW-0.95;
  if(P.rack&&!P.rack.leave&&Math.abs(c.x-P.rack.x)<1.1&&c.z<0.9)floor=RACK_TOP;
  if(c.tw){
    var k=clamp((S.t-c.tw.t0)/c.tw.dur,0,1),e=ease(k);
    c.x=c.tw.x0+(c.tw.x1-c.tw.x0)*e;c.y=c.tw.y0+(c.tw.y1-c.tw.y0)*e+Math.sin(k*Math.PI)*c.tw.h;
    if(k>=1){c.y=c.tw.y1;c.tw=null;c.vy=0;}
  }else if(c.drag){
    // position set by the pointer
  }else{
    if(c.goal!==null){
      var dx=c.goal-c.x,sp=2.4;
      if(Math.abs(dx)<0.05){c.goal=null;}else{c.x+=clamp(dx,-sp*dt,sp*dt);}
      c.turn+=(Math.sign(dx)*0.9*(c.goal!==null?1:0)-c.turn)*Math.min(1,dt*8);
    }else c.turn+=(0-c.turn)*Math.min(1,dt*6);
    if(c.zGoal!==undefined)c.z+=(c.zGoal-c.z)*Math.min(1,dt*3);
    if(c.y>floor+0.001||c.vy!==0){
      c.vy+=g*dt;c.y+=c.vy*dt;c.x+=c.vx*dt;c.air=true;
      if(c.y<=floor){
        c.y=floor;
        if(c.vy<-9&&!S.scn){c.vy=-c.vy*0.32;feel(c,'sweat',1.4);feel(d,'shock',1.2);S.shake=Math.min(0.6,-c.vy*0.03);}
        else if(c.vy<-6){c.vy=-c.vy*0.25;}
        else{c.vy=0;if(c.air&&!S.scn&&c.thrown){c.thrown=false;feel(c,'joy',1.6);feel(d,'joy',1.6);if(Math.random()<0.6)say(d,pick(['Nice landing.','Ten out of ten.','Careful!']));}c.air=false;}
      }
    }else{c.vx*=Math.exp(-dt*8);c.x+=c.vx*dt;}
    if(c.x>hx){c.x=hx;c.vx=-Math.abs(c.vx)*0.5;}
    if(c.x<-hx){c.x=-hx;c.vx=Math.abs(c.vx)*0.5;}
  }
  // rack prop slides in and out
  if(P.rack){
    var rg=P.rack.leave?7:P.rack.goal;P.rack.x+=(rg-P.rack.x)*Math.min(1,dt*3.5);
    if(P.rack.leave&&P.rack.x>6.5)P.rack=null;
  }
  // bug
  if(P.bug){
    var bg=P.bug;bg.x+=bg.dir*bg.sp*dt;
    if(bg.x<-hx+0.2){bg.dir=1;}if(bg.x>hx+0.4&&bg.dir>0){bg.dir=-1;}
    if(bg.chase&&!c.tw&&!c.drag){c.goal=bg.x;if(Math.abs(bg.x-c.x)<0.45&&S.scn&&S.t-S.scn.t0>4.2)catchBug();}
  }
  // camera yaw eases home after a while
  if(!S.ptr.down&&S.idle>5)S.yawGoal*=Math.exp(-dt*0.6);
  S.yaw+=(S.yawGoal-S.yaw)*Math.min(1,dt*6);
  S.shake=Math.max(0,S.shake-dt*1.5);S.flash=Math.max(0,S.flash-dt*1.6);
}

// target gestures from pose + look-at + dance, eased toward each frame
function targetDima(){
  var d=S.d,pz=POSES.dima[d.pose]||{},o={armL:[0.1,0.06,0.15,0],armR:[0.1,0.06,0.15,0],nod:0,turn:0,tilt:0,slump:0,look:0.04};
  if(pz.armL)o.armL=pad(pz.armL);if(pz.armR)o.armR=pad(pz.armR);
  ['nod','slump'].forEach(function(k){if(pz[k]!==undefined)o[k]=pz[k];});
  o.sweat=!!pz.sweat;
  var lk=lookAt(d.x,3.6);o.turn+=lk[0];o.nod+=lk[1];o.look=0.04+lk[0]*0.09;
  if(S.c.drag||S.c.air){var cl=S.cam.project([S.c.x,S.c.y+0.6,S.c.z]);var hd=S.cam.project([d.x,3.6,0]);
    o.turn=clamp((cl[0]-hd[0])/S.W*2.2,-0.6,0.6);o.nod=clamp((cl[1]-hd[1])/S.H*0.9,-0.3,0.25);o.look=0.04+o.turn*0.09;}
  if(S.dance!=null){
    var b=(S.t-S.dance)*112/60,on=Math.floor(b)%4;
    o.nod=Math.abs(Math.sin(b*Math.PI))*-0.12;o.tilt=Math.sin(b*Math.PI/2)*0.12;
    if(on===0){o.armR=[2.7,-0.55,0.3,0];}else if(on===2){o.armL=[2.7,-0.55,0.3,0];}else{o.armL=[0.8,0.7,0.4,0];o.armR=[0.8,0.7,0.4,0];}
  }
  if(!S.scn&&S.idle>4&&d.pose==='rest'&&!S.ptr.in)o.turn+=Math.sin(S.t*0.4)*0.25;
  if(d.over){for(var k in d.over)o[k]=d.over[k];}
  return o;
}
function targetClaude(){
  var c=S.c,pz=POSES.claude[c.pose]||{},o={hop:0,sway:0,tilt:0,turn:0,step:0,wave:0,look:0};
  for(var k in pz)if(typeof pz[k]==='number')o[k]=pz[k];
  o.blush=!!pz.blush;o.smile=!!pz.smile;
  var lk=lookAt(c.x,c.y+0.7);o.look=clamp(lk[0]*0.12,-0.06,0.06);o.turn+=lk[0]*0.35;
  o.turn+=c.turn;if(c.goal!==null)o.step=1;
  if(c.drag||c.air){o.tilt=clamp(-c.vx*0.05,-0.5,0.5);o.step=1;}
  if(S.dance!=null){var b=(S.t-S.dance)*112/60;o.hop=Math.abs(Math.sin(b*Math.PI))*0.32;o.sway=Math.sin(b*Math.PI/2)*0.28;o.wave=Math.floor(b/4)%2;o.tilt=Math.sin(b*Math.PI/2)*-0.08;}
  if(S.env==='space'&&!c.drag)o.hop+=0.12+Math.sin(S.t*1.6)*0.1;
  if(!S.scn&&S.idle>9&&c.goal===null&&!c.air&&!S.ptr.in){o.look=Math.sin(S.t*0.9)*0.06;o.step=Math.sin(S.t*0.7)>0.85?1:0;}
  return o;
}
function pad(a){return [a[0],a[1],a[2],a.length>3?a[3]:0];}
function lookAt(x,y){
  if(!S.ptr.in||!S.cam)return [0,0];
  var p=S.cam.project([x,y,0]);
  return [clamp((S.ptr.x-p[0])/S.W*1.8,-0.55,0.55),clamp((S.ptr.y-p[1])/S.H*0.6,-0.25,0.2)];
}
function blend(cur,tg,k){
  if(!cur)return JSON.parse(JSON.stringify(tg));
  for(var key in tg){
    var v=tg[key];
    if(Array.isArray(v)){for(var i=0;i<v.length;i++)cur[key][i]+=(v[i]-cur[key][i])*k;}
    else if(typeof v==='number')cur[key]+=(v-cur[key])*k;
    else cur[key]=v;
  }
  return cur;
}

// ---------- drawing ----------
function scene(){
  var W=S.W,H=S.H,env=S.env;
  var D=11.5,yaw=S.yaw+(S.shake?Math.sin(S.t*60)*S.shake*0.02:0);
  var pos=[Math.sin(yaw)*D,2.7,Math.cos(yaw)*D];
  S.cam=new Cam(pos,[0,2.5,0],H/W>0.75?39:32,W,H);   // aimed above the heads: room for the bubbles (owner, 2026-10-27)
  var a=S.cam.onPlane(0,H*0.75,2,0),b=S.cam.onPlane(W,H*0.75,2,0);
  S.halfW=a&&b?Math.min(Math.abs(a[0]),Math.abs(b[0]))*Math.cos(S.yaw):4;
  drawSky();
  var items=[],seed=0;
  // Dima gets a little more light than the scene (owner request 2026-10-27: "make me more light, but not too much")
  function add(list,own,base){for(var i=0;i<list.length;i++)items.push({b:list[i],own:own,seed:base+i,lit:own==='d'?1.2:1});}
  // characters
  var d=S.d,c=S.c,bob=S.env==='space'?Math.sin(S.t*1.3)*0.08+0.08:0;
  d.cur=blend(d.cur,targetDima(),Math.min(1,S.dt*9));
  c.cur=blend(c.cur,targetClaude(),Math.min(1,S.dt*10));
  var dg=d.cur;
  add(dima(S.t,d.mood,d.mo,{armL:dg.armL,armR:dg.armR,nod:dg.nod,turn:dg.turn,tilt:dg.tilt,slump:dg.slump,look:dg.look,sweat:dg.sweat},mm(T(d.x,bob,0),RY(0.28))),'d',0);
  add(claude(S.t,c.mood,c.mo,c.cur,mm(T(c.x,c.y+bob*0.6,c.z),RY(-0.3))),'c',100);
  if(S.props.rack)add(rack(S.t,T(S.props.rack.x,0,S.props.rack.z)),'r',200);
  if(S.props.bug)add(bugBoxes(S.props.bug),'b',300);
  if(env==='server')for(var r=0;r<4;r++)add(rack(S.t+r*1.7,mm(T(-6+r*3.9,0,-5.2))),null,400+r*40);
  shadows();
  S.bounds=drawBoxes(ctx,S.cam,items,hexc(ENVS[env].rim),ENVS[env].amb);
  drawWeather();
  drawFx();
  bubbles();
  hud();
  if(S.flash>0){ctx.fillStyle='rgba(232,69,44,'+(S.flash*0.18).toFixed(3)+')';ctx.fillRect(0,0,W,H);}
}
function bugBoxes(b){
  var R=mm(T(b.x,0,0.9),RY(b.dir>0?Math.PI/2:-Math.PI/2)),w=Math.sin(S.t*30)*0.03;
  return [box(R,[-0.13,0.03,-0.2],[0.13,0.2,0.16],'#2F6B3A',0),box(R,[-0.09,0.05,0.16],[0.09,0.16,0.27],'#1E3A24',0),
    box(R,[-0.2,0,-0.12+w],[-0.13,0.05,-0.08+w],'#1E3A24'),box(R,[0.13,0,0.02-w],[0.2,0.05,0.06-w],'#1E3A24'),
    box(R,[-0.05,0.13,0.27],[-0.02,0.16,0.29],'#F4F1EA',0,0.5),box(R,[0.02,0.13,0.27],[0.05,0.16,0.29],'#F4F1EA',0,0.5)];
}
function horizonY(){
  var f=S.cam.f,hf=nrm([f[0],0,f[2]]);
  return S.cam.project([S.cam.pos[0]+hf[0]*4000,0,S.cam.pos[2]+hf[2]*4000])[1];
}
function grad(y0,y1,c0,c1){var gr=ctx.createLinearGradient(0,y0,0,y1);gr.addColorStop(0,c0);gr.addColorStop(1,c1);return gr;}
function drawSky(){
  var W=S.W,H=S.H,hy=horizonY(),env=S.env;
  var sky={studio:dark?['#141519','#1b1d22']:['#F3F2EC','#E9E7DF'],server:['#060912','#111a33'],rain:['#2E3846','#556273'],
    snow:['#AFC3D6','#E6EDF3'],space:['#020309','#0A0B1A']}[env];
  var flo={studio:dark?['#202228','#17181c']:['#E2DFD5','#D3CFC3'],server:['#0E1528','#070A14'],rain:['#3A4552','#252D37'],
    snow:['#EEF3F7','#D9E3EC'],space:['#3A3B44','#24252C']}[env];
  ctx.fillStyle=grad(0,hy,sky[0],sky[1]);ctx.fillRect(0,0,W,H);
  if(env==='space')stars(hy);
  if(env==='server'){ctx.fillStyle='rgba(63,107,255,0.10)';ctx.fillRect(0,hy-H*0.5,W,H*0.5);}
  ctx.fillStyle=grad(hy,H,flo[0],flo[1]);ctx.fillRect(0,hy,W,H-hy);
  // floor grid (studio, server) or craters (moon)
  if(env==='studio'||env==='server'){
    ctx.lineWidth=S.dpr;ctx.strokeStyle=env==='server'?'rgba(80,120,255,0.22)':(dark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.07)');
    ctx.beginPath();
    for(var i=-8;i<=8;i++){seg([i,0,-9],[i,0,6]);}
    for(var z=-9;z<=6;z++){seg([-8,0,z],[8,0,z]);}
    ctx.stroke();
  }
  if(env==='space'){
    ctx.fillStyle='rgba(0,0,0,0.25)';
    for(var k=0;k<9;k++){var cx=(hash(k)-0.5)*14,cz=-hash(k+20)*9+2,r=0.3+hash(k+40)*0.8;ellipse([cx,0,cz],r);ctx.fill();}
  }
  if(env==='rain'){ // puddle shine
    ctx.fillStyle='rgba(180,205,235,0.10)';ellipse([-3.2,0,1.5],1.4);ctx.fill();ellipse([3.4,0,-1.5],1.1);ctx.fill();
  }
}
function seg(p,q){var a=S.cam.project(p),b=S.cam.project(q);if(a[2]<0.3||b[2]<0.3)return;ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);}
function ellipse(c,r){
  ctx.beginPath();
  for(var i=0;i<=24;i++){var a=i/24*6.283,p=S.cam.project([c[0]+Math.cos(a)*r,c[1],c[2]+Math.sin(a)*r]);if(i)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]);}
  ctx.closePath();
}
function stars(hy){
  if(!S.stars){S.stars=[];for(var i=0;i<160;i++)S.stars.push([hash(i*3.1),hash(i*7.7),hash(i*1.3)]);}
  for(var j=0;j<S.stars.length;j++){var s=S.stars[j],tw=0.5+0.5*Math.sin(S.t*(1+s[2]*3)+j);
    ctx.fillStyle='rgba(255,255,255,'+(0.25+0.6*s[2]*tw).toFixed(2)+')';
    var x=((s[0]+S.yaw*0.05)%1+1)%1*S.W;ctx.fillRect(x,s[1]*hy,S.dpr*(s[2]>0.8?2:1),S.dpr*(s[2]>0.8?2:1));}
  // the Earth, low in the sky
  var ex=S.W*(0.82-S.yaw*0.1),ey=hy*0.38,er=Math.min(S.W,S.H)*0.11;
  var gr=ctx.createRadialGradient(ex-er*0.35,ey-er*0.35,er*0.1,ex,ey,er);gr.addColorStop(0,'#7FB2FF');gr.addColorStop(0.6,'#2F5FB8');gr.addColorStop(1,'#0E1F45');
  ctx.fillStyle=gr;ctx.beginPath();ctx.arc(ex,ey,er,0,6.283);ctx.fill();
  ctx.fillStyle='rgba(120,180,110,0.55)';ctx.beginPath();ctx.ellipse(ex-er*0.2,ey-er*0.1,er*0.35,er*0.22,0.6,0,6.283);ctx.fill();
}
function shadows(){
  var c=S.c,sh=dark||S.env==='server'||S.env==='space'?0.38:0.16;
  ctx.fillStyle='rgba(0,0,0,'+sh+')';ellipse([S.d.x,0.005,0],0.75);ctx.fill();
  var fl=S.props.rack&&Math.abs(c.x-S.props.rack.x)<1.1?RACK_TOP:0,hgt=Math.max(0,c.y-fl);
  ctx.fillStyle='rgba(0,0,0,'+(sh/(1+hgt*0.8)).toFixed(3)+')';ellipse([c.x,fl+0.005,c.z+0.05],0.95/(1+hgt*0.15));ctx.fill();
  if(S.props.rack){ctx.fillStyle='rgba(0,0,0,'+sh+')';ellipse([S.props.rack.x,0.005,S.props.rack.z],1.4);ctx.fill();}
}
function drawWeather(){
  var W=S.W,H=S.H,dt=S.dt;
  if(S.env==='rain'){
    ctx.strokeStyle='rgba(190,215,240,0.45)';ctx.lineWidth=S.dpr;ctx.beginPath();
    for(var i=0;i<S.weather.length;i++){var p=S.weather[i];p.y+=p.v*dt;if(p.y>1){p.y-=1.05;p.x=Math.random();}
      var x=p.x*W,y=p.y*H;ctx.moveTo(x,y);ctx.lineTo(x-p.l*H*0.2,y+p.l*H);}
    ctx.stroke();
    if(Math.random()<0.6){var sx=Math.random()*W,sy=horizonY()+Math.random()*(H-horizonY());S.fx.push({k:'ring',x:sx,y:sy,life:0.5,age:0});}
  }
  if(S.env==='snow'){
    ctx.fillStyle='rgba(255,255,255,0.9)';
    for(var j=0;j<S.weather.length;j++){var q=S.weather[j];q.y+=q.v*dt;q.ph+=dt;if(q.y>1){q.y-=1.02;q.x=Math.random();}
      ctx.beginPath();ctx.arc(((q.x+Math.sin(q.ph)*0.01)%1)*W,q.y*H,q.r*S.dpr,0,6.283);ctx.fill();}
  }
}
function drawFx(){
  var dt=S.dt,keep=[];
  for(var i=0;i<S.fx.length;i++){
    var p=S.fx[i];p.age+=dt;if(p.age>p.life)continue;keep.push(p);
    var a=1-p.age/p.life;
    if(p.k==='conf'){p.vy+=700*S.dpr*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.985;p.r+=p.vr*dt;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.globalAlpha=Math.min(1,a*2);ctx.fillStyle=p.c;ctx.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);ctx.restore();}
    else if(p.k==='spark'){p.x+=p.vx*dt;p.y+=p.vy*dt;ctx.globalAlpha=a;ctx.fillStyle=p.c;ctx.fillRect(p.x-2*S.dpr,p.y-2*S.dpr,4*S.dpr,4*S.dpr);ctx.globalAlpha=1;}
    else if(p.k==='note'){p.x+=p.vx*dt;p.y+=p.vy*dt;ctx.globalAlpha=a;ctx.fillStyle=p.c;ctx.font=(16*S.dpr)+'px '+font;ctx.fillText(p.ch,p.x,p.y);ctx.globalAlpha=1;}
    else if(p.k==='ring'){ctx.strokeStyle='rgba(200,220,245,'+(a*0.5).toFixed(2)+')';ctx.lineWidth=S.dpr;ctx.beginPath();
      ctx.ellipse(p.x,p.y,(1-a)*10*S.dpr+2,(1-a)*3*S.dpr+1,0,0,6.283);ctx.stroke();}
    else if(p.k==='z'){p.y-=20*S.dpr*dt;p.x+=Math.sin(p.age*3)*0.4*S.dpr;ctx.globalAlpha=a;ctx.fillStyle=dark||S.env!=='studio'?'#fff':'#333';
      ctx.font='600 '+(12*S.dpr)+'px '+font;ctx.fillText('z',p.x,p.y);ctx.globalAlpha=1;}
  }
  S.fx=keep;
  if(S.dance!=null&&Math.random()<0.06){var hp=S.cam.project([S.d.x,4.6,0]);note(hp[0]+rnd(-30,30)*S.dpr,hp[1]);}
  if(S.d.mood==='slump'&&!S.scn&&S.idle>18&&Math.random()<0.012){var zp=S.cam.project([S.d.x+0.4,4.5,0]);S.fx.push({k:'z',x:zp[0],y:zp[1],life:2,age:0});}
}
function bubbles(){
  var list=[['d',S.d,4.55],['c',S.c,1.65]];
  for(var i=0;i<list.length;i++){
    var ch=list[i][1];if(!ch.say)continue;
    var x=list[i][0]==='d'?ch.x:ch.x,y=(list[i][0]==='c'?ch.y:0)+list[i][2];
    var p=S.cam.project([x,y,list[i][0]==='c'?ch.z:0]);
    var age=S.t-ch.say.t0,a=Math.min(1,age*6,(ch.say.dur-age)*4);if(a<=0)continue;
    var fs=Math.round(12*S.dpr);ctx.font='600 '+fs+'px '+font;
    var txt=ch.say.text,shown=txt.slice(0,Math.ceil(txt.length*Math.min(1,age*2.6)));
    var w=ctx.measureText(txt).width+fs*1.3,h=fs*2.1,bx=clamp(p[0]-w/2,4*S.dpr,S.W-w-4*S.dpr),by=Math.max(4*S.dpr,p[1]-h-10*S.dpr);
    ctx.globalAlpha=a;
    ctx.fillStyle='rgba(255,255,255,0.96)';ctx.strokeStyle='#15161A';ctx.lineWidth=Math.max(1,S.dpr);
    ctx.beginPath();rr(bx,by,w,h,5*S.dpr);ctx.fill();ctx.stroke();
    var tx=clamp(p[0],bx+10*S.dpr,bx+w-10*S.dpr);
    ctx.beginPath();ctx.moveTo(tx-5*S.dpr,by+h-0.5);ctx.lineTo(tx,by+h+8*S.dpr);ctx.lineTo(tx+5*S.dpr,by+h-0.5);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(tx-5*S.dpr,by+h);ctx.lineTo(tx,by+h+8*S.dpr);ctx.lineTo(tx+5*S.dpr,by+h);ctx.stroke();
    ctx.fillStyle='#15161A';ctx.textBaseline='middle';ctx.fillText(shown,bx+fs*0.65,by+h/2+S.dpr*0.5);ctx.textBaseline='alphabetic';
    ctx.globalAlpha=1;
  }
}
function rr(x,y,w,h,r){ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);}
var MOOD_WORD={calm:'calm',worried:'worried',shock:'shocked',angry:'annoyed',plead:'pleading',joy:'happy',slump:'bored',proud:'proud',sweat:'nervous',shy:'shy'};
function hud(){
  var fs=Math.round(9.5*S.dpr);ctx.font='500 '+fs+'px '+font;
  var light=S.env==='studio'&&!dark||S.env==='snow';
  ctx.fillStyle=light?'rgba(30,30,34,0.6)':'rgba(255,255,255,0.62)';
  var txt='DIMA · '+MOOD_WORD[S.d.mood].toUpperCase()+'    CLAUDE · '+MOOD_WORD[S.c.mood].toUpperCase();
  ctx.fillText(txt,10*S.dpr,16*S.dpr);
  if(S.scn){var k=clamp((S.t-S.scn.t0)/S.scn.dur,0,1);ctx.fillRect(10*S.dpr,21*S.dpr,ctx.measureText(txt).width*k,Math.max(1,S.dpr));}
}

// ---------- pointer ----------
function hit(x,y){
  var pad=6*S.dpr;
  var cb=S.bounds.c,db=S.bounds.d;
  if(cb&&x>cb[0]-pad&&x<cb[2]+pad&&y>cb[1]-pad&&y<cb[3]+pad)return 'c';
  if(db&&x>db[0]-pad&&x<db[2]+pad&&y>db[1]-pad&&y<db[3]+pad)return 'd';
  return null;
}
function pokeDima(){
  var d=S.d;d.pokes.push(S.t);var n=d.pokes.length;S.idle=0;
  if(n>=6){feel(d,'angry',3);pose(d,'point-out',1.6);say(d,pick(['Okay, enough.','I\'m working here!','Seriously?']));}
  else if(n>=4){feel(d,'worried',2);pose(d,'plead',1.2);say(d,pick(['Hey, hey…','That tickles.']));}
  else{feel(d,'shock',0.5);pose(d,'shock',0.45);setTimeout(function(){if(S&&S.d.mood==='shock'&&!S.scn){feel(S.d,'joy',1.8);pose(S.d,'open-arms',1);}},450);
    if(n===1||Math.random()<0.5)say(d,pick(['Oh — hi!','Boop.','Yes?','Hello to you too.']));}
}
function pokeClaude(){
  var c=S.c;c.pokes.push(S.t);var n=c.pokes.length;S.idle=0;
  if(!c.air&&!c.tw)c.vy=S.env==='space'?3:4.2+Math.min(n,5)*0.4;
  if(n>=7){feel(c,'sweat',2.4);say(c,pick(['Too much!','Help!','I give up!']));if(!S.scn){feel(S.d,'worried',1.6);}}
  else if(n>=4){feel(c,'joy',2);pose(c,'wave',1.2);if(Math.random()<0.5)say(c,pick(['Hehehe!','Again!','Wheee!']));}
  else{feel(c,'shy',1.6);pose(c,'happy',1.6);if(n===1||Math.random()<0.4)say(c,pick(['Hehe.','Hi!','Beep?']));}
}
function pointer(type,e){
  if(!S||!cv)return;
  var r=cv.getBoundingClientRect(),x=(e.clientX-r.left)*S.W/r.width,y=(e.clientY-r.top)*S.H/r.height,P=S.ptr,now=S.t;
  if(type==='leave'){if(!P.down){P.in=false;P.near=null;}return;}
  if(type==='move'){
    if(P.in){var dd=Math.hypot(x-P.x,y-P.y);P.speed=Math.max(P.speed,dd/Math.max(S.dt,0.008));}
    P.x=x;P.y=y;P.in=true;P.near=hit(x,y);
    if(P.down){
      if(P.mode==='c'&&!S.c.drag&&Math.hypot(x-P.sx,y-P.sy)>6*S.dpr)startDrag();
      if(S.c.drag){
        var w=S.cam.onPlane(x,y,2,S.c.z);
        if(w){var ny=Math.max(0,w[1]-0.55),nx=clamp(w[0],-S.halfW+0.95,S.halfW-0.95);
          P.hist.push([now,nx,ny]);while(P.hist.length>6)P.hist.shift();S.c.x=nx;S.c.y=ny;}
      }else if(P.mode==='orbit'){S.yawGoal=clamp(P.yaw0-(x-P.sx)/S.W*1.6,-0.7,0.7);}
    }
    S.idle=Math.min(S.idle,3);
    return;
  }
  if(type==='down'){
    P.down=true;P.sx=x;P.sy=y;P.x=x;P.y=y;P.in=true;P.t0=now;P.hist=[];
    var h=hit(x,y);P.mode=h||'orbit';P.yaw0=S.yawGoal;S.idle=0;S.auto=0;
    if(h==='d')pokeDima();
    try{e.currentTarget&&e.currentTarget.setPointerCapture&&e.currentTarget.setPointerCapture(e.pointerId);}catch(err){}
    return;
  }
  if(type==='up'){
    var c=S.c;
    if(c.drag){
      c.drag=false;c.thrown=true;var hs=P.hist;
      if(hs.length>1){var a=hs[0],b=hs[hs.length-1],dt=Math.max(0.016,b[0]-a[0]);c.vx=clamp((b[1]-a[1])/dt,-14,14);c.vy=clamp((b[2]-a[2])/dt,-10,14);}
      if(c.vy===0)c.vy=0.01;
      if(Math.hypot(c.vx,c.vy)>7){say(c,pick(['Wheee!','Aaaah!','Weee-ooo!']),1.2);feel(S.d,'worried',1.5);}
    }else if(P.mode==='c'){pokeClaude();}
    else if(P.mode==='orbit'&&Math.hypot(x-P.sx,y-P.sy)<6*S.dpr&&now-P.t0<0.4&&!S.scn){
      var f=S.cam.onPlane(x,y,1,0);
      if(f&&f[2]>-3&&f[2]<4){c.goal=clamp(f[0],-S.halfW+0.95,S.halfW-0.95);if(Math.random()<0.35)say(c,pick(['On my way.','Here?','Trotting…']),1.2);}
    }
    P.down=false;P.mode=null;
  }
}
function startDrag(){
  var c=S.c;
  if(S.scn){var was=S.scn.id;endScene(true);say(S.d,was==='dance'?'We were dancing!':'Hey, we were busy!',1.6);}
  c.drag=true;c.tw=null;c.goal=null;c.vx=c.vy=0;feel(c,'sweat',3);feel(S.d,'worried',2);
  if(Math.random()<0.6)say(c,pick(['Put me down!','Whoa!','Up we go?']),1.2);
}

// ---------- options bar: scenarios + environments ----------
var optsEl=null,scenBtns=[];
function markScen(){scenBtns.forEach(function(b){var on=!!(S&&S.scn&&S.scn.id===b.dataset.s);b.classList.toggle('active',on);b.setAttribute('aria-pressed',on?'true':'false');});}
function opts(el){
  optsEl=el;scenBtns=[];
  var g1=document.createElement('span');g1.className='mascot-g';g1.setAttribute('role','group');g1.setAttribute('aria-label','Scenarios');
  SCEN.forEach(function(s){
    var b=document.createElement('button');b.type='button';b.className='gen-mode';b.textContent=s.label;b.dataset.s=s.id;b.setAttribute('aria-pressed','false');
    b.addEventListener('click',function(){if(!S)return;if(S.scn&&S.scn.id===s.id){endScene(true);}else play(s.id);});
    g1.appendChild(b);scenBtns.push(b);
  });
  var g2=document.createElement('span');g2.className='mascot-g';g2.setAttribute('role','group');g2.setAttribute('aria-label','Environment');
  var envBtns=[];
  ENV_IDS.forEach(function(id){
    var b=document.createElement('button');b.type='button';b.className='gen-mode'+(S&&S.env===id?' active':'');b.textContent=ENVS[id].label;
    b.setAttribute('aria-pressed',S&&S.env===id?'true':'false');
    b.addEventListener('click',function(){setEnv(id,true);envBtns.forEach(function(x,i){var on=ENV_IDS[i]===id;x.classList.toggle('active',on);x.setAttribute('aria-pressed',on?'true':'false');});});
    g2.appendChild(b);envBtns.push(b);
  });
  el.appendChild(g1);el.appendChild(g2);markScen();
}
function setEnv(id,react){
  if(!S||!ENVS[id])return;S.env=id;weatherInit();S.idle=0;S.auto=0;
  if(store)store('fob-mascot-env',id);
  if(react&&!S.scn){var l=pick(ENV_SAY[id]);var ch=who(l[0]);feel(ch,l[1],2.6);say(ch,l[2]);
    if(id==='space'){S.c.vy=3;}if(id==='snow'){pose(S.d,'open-arms',1.4);}if(id==='rain'){pose(S.d,'facepalm',1);}}
}

// ---------- public API ----------
function init(context,canvas,o){
  ctx=context;cv=canvas;o=o||{};store=o.store||null;
  reduce=!!(root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if(!S){S=newState();var saved=o.load&&o.load('fob-mascot-env');if(saved&&ENVS[saved])S.env=saved;weatherInit();}
  try{var f=getComputedStyle(document.documentElement).getPropertyValue('--font-mono');if(f&&f.trim())font=f.trim();}catch(e){}
  S.last=0;
}
function draw(t,W,H,dpr,isDark){
  if(!S||!ctx)return;
  S.W=W;S.H=H;S.dpr=dpr;dark=!!isDark;
  var now=t/1000,dt=S.last?Math.min(0.05,now-S.last):0.016;S.last=now;S.dt=dt;
  if(!S.cam)S.cam=new Cam([0,2.7,11.5],[0,2.5,0],32,W,H);
  update(dt);
  scene();
}
function pause(){if(S)S.last=0;}
// screen point (client px) -> 'd' | 'c' | null, used to keep a touch on a character from scrolling the page
function hitAt(cx,cy){if(!S||!cv)return null;var r=cv.getBoundingClientRect();if(r.width<1)return null;return hit((cx-r.left)*S.W/r.width,(cy-r.top)*S.H/r.height);}

var api={init:init,draw:draw,pointer:pointer,hitAt:hitAt,opts:opts,pause:pause,play:function(id){if(S)play(id);},env:function(id){setEnv(id,true);},
  hint:'Tap a character to poke · drag Claude to throw · tap the floor to send Claude · drag the floor to turn',
  chars:{dima:dima,claude:claude,rack:rack,POSES:POSES,RACK_TOP:RACK_TOP},m:{T:T,RX:RX,RY:RY,RZ:RZ,mm:mm}};
root.FobMascot=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
