<script>
/* Life in weeks plugin (engine/life-weeks.*). One row per year of life, 52 squares each; a row starts on that
   year's birthday, so week squares never drift against real birthdays (the 52nd square absorbs the 1-2 extra
   days of each year). Lived / this week / ahead, a line at the world-average life expectancy, a small gap after
   every decade. Calendar figures are exact; body figures are labelled averages. The date of birth stays in the
   browser (localStorage 'fob-dob' as a per-viewer convenience, try/catch). Test hook: window.__lwDob = 'YYYY-MM-DD'
   before the script pre-fills the date. */
(function(){
var cv=document.getElementById('lw-cv');
if(!cv)return;
var $=function(id){return document.getElementById(id);};
var ctx=cv.getContext('2d'), input=$('lw-dob'), tip=$('lw-tip'), frame=$('lw-frame');
var WORLD_AVG=73, KEY='fob-dob', DAY=864e5;
var MAX=100, dob=null, geo=null, C={};
var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function today(){var n=new Date();return new Date(n.getFullYear(),n.getMonth(),n.getDate());}
input.max=(function(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');})(today());
function parse(v){var m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(v||'');if(!m)return null;
  var d=new Date(+m[1],+m[2]-1,+m[3]);if(d.getMonth()!==+m[2]-1)return null;
  if(d>today()||d.getFullYear()<1900)return null;return d;}
/* Birthday in year dob+y; a 29 Feb birthday falls on 1 Mar in common years (Date rolls over). */
function bday(y){return new Date(dob.getFullYear()+y,dob.getMonth(),dob.getDate());}
function addDays(d,n){return new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);}
function fmt(d){return d.getDate()+' '+MON[d.getMonth()]+' '+d.getFullYear();}
function weekStart(y,c){return addDays(bday(y),7*c);}
function weekEnd(y,c){return c===51?addDays(bday(y+1),-1):addDays(bday(y),7*c+6);}   /* inclusive */
function ageNow(){var t=today(),y=t.getFullYear()-dob.getFullYear();if(bday(y)>t)y--;return y;}
function curCell(){var y=ageNow(),c=Math.min(51,Math.floor((today()-bday(y))/DAY/7));return [y,c];}

/* ---------- colours (re-read on theme change) ---------- */
function theme(){var cs=getComputedStyle(document.documentElement);
  function v(n,f){return (cs.getPropertyValue(n)||'').trim()||f;}
  C.ink=v('--ink','#0b0b0c');C.line=v('--line','#c9c9c1');C.mid=v('--mid','#7a7a74');C.acc=v('--accent','#a6401f');
  C.bg=getComputedStyle(frame).backgroundColor;draw();}

/* ---------- grid ---------- */
function layout(){
  var w=cv.clientWidth||cv.parentNode.clientWidth;if(!w)return null;
  var gut=w<420?22:30, top=16, pitch=Math.min(11,(w-gut)/52), cell=Math.max(2,pitch-(pitch>6?2:1)), gap=pitch>6?5:3;
  var rows=MAX, h=top+rows*pitch+Math.floor((rows-1)/10)*gap+2;
  return {w:w,h:h,gut:gut,top:top,pitch:pitch,cell:cell,gap:gap,rows:rows};
}
function rowY(g,y){return g.top+y*g.pitch+Math.floor(y/10)*g.gap;}
function draw(){
  var g=layout();if(!g)return;geo=g;
  var dpr=Math.min(window.devicePixelRatio||1,2);
  var W=Math.round(g.w*dpr),H=Math.round(g.h*dpr);
  if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;cv.style.height=g.h+'px';}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,g.w,g.h);
  var cur=dob?curCell():[-1,-1];
  ctx.font='9.5px '+(getComputedStyle(cv).getPropertyValue('--font-mono')||'monospace');
  ctx.fillStyle=C.mid;ctx.textBaseline='middle';
  /* week numbers along the top, ages down the side */
  ctx.textAlign='center';
  [1,10,20,30,40].forEach(function(n){ctx.fillText(String(n),g.gut+(n-0.5)*g.pitch,g.top/2-1);});
  ctx.textAlign='right';ctx.fillText('52',g.gut+52*g.pitch,g.top/2-1);   /* right-aligned so it never clips */
  ctx.textAlign='right';
  for(var y=0;y<g.rows;y++){
    var ry=rowY(g,y);
    if(y%10===0)ctx.fillText(String(y),g.gut-6,ry+g.cell/2);
    for(var c=0;c<52;c++){
      var x=g.gut+c*g.pitch;
      if(dob&&(y<cur[0]||y===cur[0]&&c<cur[1])){ctx.fillStyle=C.ink;ctx.fillRect(x,ry,g.cell,g.cell);}
      else if(y===cur[0]&&c===cur[1]){ctx.fillStyle=C.acc;ctx.fillRect(x-0.5,ry-0.5,g.cell+1,g.cell+1);}
      else{ctx.strokeStyle=y>=WORLD_AVG?C.line:C.mid;ctx.globalAlpha=y>=WORLD_AVG?0.9:0.55;ctx.lineWidth=1;
        ctx.strokeRect(x+0.5,ry+0.5,Math.max(1,g.cell-1),Math.max(1,g.cell-1));ctx.globalAlpha=1;}
    }
    ctx.fillStyle=C.mid;
  }
  /* world-average line, drawn in the gap above that row */
  if(WORLD_AVG<g.rows){var ly=rowY(g,WORLD_AVG)-(g.pitch-g.cell)/2-0.5;
    ctx.strokeStyle=C.acc;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(g.gut-4,ly);ctx.lineTo(g.gut+52*g.pitch,ly);ctx.stroke();
    ctx.fillStyle=C.acc;ctx.textAlign='right';ctx.fillText('avg',g.gut-6,ly);}
  cv.setAttribute('aria-label',dob?'Life calendar of '+MAX+' years: '+num(lived())+' of '+num(MAX*52)+' weeks lived':'Life calendar: enter a date of birth to fill it in');
}
function lived(){var c=curCell();return c[0]*52+c[1];}

/* ---------- tooltip ---------- */
function cellAt(e){
  var g=geo;if(!g)return null;var r=cv.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top;
  var c=Math.floor((px-g.gut)/g.pitch);if(c<0||c>51)return null;
  for(var y=0;y<g.rows;y++){var ry=rowY(g,y);if(py>=ry-1&&py<ry+g.pitch-1)return {y:y,c:c,x:g.gut+c*g.pitch+g.cell/2,ry:ry};}
  return null;
}
function showTip(e){
  var h=cellAt(e);if(!h){tip.hidden=true;return;}
  var t='Age '+h.y+' · week '+(h.c+1);
  if(dob){var s=weekStart(h.y,h.c),en=weekEnd(h.y,h.c),cur=curCell();
    t+=' · '+fmt(s)+(+en===+s?'':' – '+fmt(en));
    if(h.y===cur[0]&&h.c===cur[1])t+=' · now';}
  tip.textContent=t;tip.hidden=false;
  var fr=frame.getBoundingClientRect(),cr=cv.getBoundingClientRect();
  var x=cr.left-fr.left+h.x, half=tip.offsetWidth/2;
  tip.style.left=Math.max(half+4,Math.min(fr.width-half-4,x))+'px';tip.style.top=(cr.top-fr.top+h.ry)+'px';
}
cv.addEventListener('pointermove',showTip);
cv.addEventListener('pointerdown',showTip);
cv.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse')tip.hidden=true;});

/* ---------- numbers ---------- */
function num(n){return Math.round(n).toLocaleString('en-GB');}
function big(n){var a=Math.abs(n);
  if(a>=1e12)return (n/1e12).toFixed(2)+' trillion';if(a>=1e9)return (n/1e9).toFixed(2)+' billion';
  if(a>=1e6)return (n/1e6).toFixed(1)+' million';return num(n);}
function stat(dl,label,value,note){var d=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');
  dt.textContent=label;dd.textContent=value;if(note){var s=document.createElement('small');s.textContent=note;dd.appendChild(s);}
  d.appendChild(dt);d.appendChild(dd);dl.appendChild(d);}
function countWeekday(a,b,wd){/* number of days with getDay()===wd in [a,b) */
  var n=Math.round((b-a)/DAY);if(n<=0)return 0;var first=(wd-a.getDay()+7)%7;return first>=n?0:Math.floor((n-1-first)/7)+1;}
function render(){
  $('lw-empty').hidden=!!dob;$('lw-out').hidden=!dob;
  if(!dob){draw();return;}
  var t=today(), days=Math.round((t-dob)/DAY), min=days*1440, age=ageNow(), wk=lived();
  $('lw-weeks').textContent=num(wk);
  var end=bday(MAX);
  $('lw-line').textContent='Age '+age+' · '+num(days)+' days · '+(100*wk/(MAX*52)).toFixed(1)+'% of a '+MAX+'-year calendar'+(age<WORLD_AVG?' · '+num(WORLD_AVG*52-wk)+' weeks to the world average':'');
  var ex=$('lw-exact'),bo=$('lw-body'),le=$('lw-left');ex.textContent='';bo.textContent='';le.textContent='';
  stat(ex,'Days alive',num(days));
  stat(ex,'Full moons',num(days/29.530589),'one every 29.53 days');
  stat(ex,'Around the Sun',big(days*86400*29.78)+' km','with Earth, at 29.78 km/s');
  stat(ex,'Weekends',num(countWeekday(dob,t,6)),'Saturdays lived');
  stat(bo,'Heartbeats','≈ '+big(min*70),'at 70 beats a minute');
  stat(bo,'Breaths','≈ '+big(min*15),'at 15 a minute');
  stat(bo,'Blood pumped','≈ '+big(min*5)+' L','5 litres a minute');
  stat(bo,'Asleep','≈ '+(days/3/365.2425).toFixed(1)+' years','8 hours a night');
  stat(bo,'Blinks','≈ '+big(days*16*60*15),'15 a minute, 16 waking hours');
  stat(bo,'Meals','≈ '+num(days*3),'three a day');
  $('lw-left-h').textContent='Left on a '+MAX+'-year calendar';
  var left=Math.max(0,MAX*52-wk);
  stat(le,'Weeks',num(left));
  stat(le,'Weekends',num(countWeekday(t,end,6)));
  stat(le,'Summers',num(Math.max(0,MAX-age)));
  draw();
}

/* ---------- controls ---------- */
function setDob(v,save){dob=parse(v);
  try{ if(save){ if(dob)localStorage.setItem(KEY,v); else localStorage.removeItem(KEY);} }catch(e){}
  render();}
input.addEventListener('change',function(){setDob(input.value,true);});
input.addEventListener('input',function(){if(parse(input.value))setDob(input.value,true);});
document.querySelectorAll('#lw-scale [data-max]').forEach(function(b){b.addEventListener('click',function(){
  MAX=+b.dataset.max;
  document.querySelectorAll('#lw-scale [data-max]').forEach(function(o){var on=o===b;o.classList.toggle('active',on);o.setAttribute('aria-pressed',String(on));});
  tip.hidden=true;render();});});
var saved=window.__lwDob||null;
if(!saved){try{saved=localStorage.getItem(KEY);}catch(e){}}
if(saved&&parse(saved)){input.value=saved;dob=parse(saved);}

theme();render();
new MutationObserver(theme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
if(window.matchMedia)window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',theme);
var rt=0;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){tip.hidden=true;draw();},60);});
/* the tab panel starts hidden (zero width); redraw once it is shown */
if('ResizeObserver' in window)new ResizeObserver(function(){draw();}).observe(frame);
/* roll the "this week" square over at midnight */
setInterval(function(){if(dob)render();},6e5);
})();
</script>
