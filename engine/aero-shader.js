<script>
/* Aerospace shader plugin (engine/aero-shader.*): mission of the day. "Today" picks the mission
   whose anniversary (UTC date) is nearest to today; the period chips list 1957-75 / 1976-99 /
   2000-now in date order and the arrows step through them. One full-screen SDF fragment shader
   draws the mission's trajectory type (schematic, not to scale): LEO orbit, docking, lunar
   free-return, Hohmann transfer to Mars (true 259-day phasing), outer-planet flybys, Sun-Earth L2
   halo, Earth-trailing orbit, landing (with/without parachute) and suborbital hop. Drag = scrub
   mission time; idle = loops. Links go to the matching /aerospace/ field guide when one exists.
   Dates are UTC. Test hook: window.__aePreserve=true -> preserveDrawingBuffer + window.__aeDraw(ms),
   window.__aeShow(i). */
(function(){
var cv=document.getElementById('ae-cv');
if(!cv)return;
var $=function(id){return document.getElementById(id);};
// [UTC date, name, trajectory type, body for landings, /aerospace/ slug or '', one line]
var M=[
['1957-10-04','Sputnik 1','leo','','beep-sputnik-explorer','The first artificial satellite: a 58 cm sphere whose radio beeps were heard around the world for 21 days.'],
['1958-02-01','Explorer 1','leo','','beep-sputnik-explorer','The first US satellite; its Geiger counter revealed the Van Allen radiation belts.'],
['1959-09-13','Luna 2','lunar','','luna-programs','The first human-made object to reach the Moon, impacting east of Mare Imbrium.'],
['1959-10-04','Luna 3','lunar','','luna-programs','Looped behind the Moon and returned the first photographs of its far side.'],
['1961-04-12','Vostok 1 — Yuri Gagarin','leo','','first-vostok-voskhod','The first human in space: one orbit of Earth in 108 minutes.'],
['1961-05-05','Freedom 7 — Alan Shepard','sub','earth','ascent-mercury-program','The first American in space, a 15-minute suborbital flight to 187 km.'],
['1962-02-20','Friendship 7 — John Glenn','leo','','ascent-mercury-program','The first American to orbit Earth: three orbits in under five hours.'],
['1963-06-16','Vostok 6 — Valentina Tereshkova','leo','','first-vostok-voskhod','The first woman in space, 48 orbits over almost three days.'],
['1965-03-18','Voskhod 2 — Alexei Leonov','leo','','first-vostok-voskhod','The first spacewalk: 12 minutes outside, then a struggle to fit back through the airlock.'],
['1965-06-03','Gemini 4 — Ed White','leo','','rendezvous-gemini-program','The first American spacewalk, using a hand-held gas gun to move.'],
['1965-07-15','Mariner 4 at Mars','mars','','transfer-earth-to-mars','The first close flyby of Mars: 21 photos of a cratered, Moon-like surface.'],
['1965-12-15','Gemini 6A & Gemini 7','dock','','rendezvous-gemini-program','The first crewed rendezvous: two spacecraft flew within 30 cm of each other.'],
['1966-02-03','Luna 9','land','moon','luna-programs','The first soft landing on another world and the first pictures from the lunar surface.'],
['1966-03-16','Gemini 8','dock','','rendezvous-gemini-program','The first docking of two spacecraft in orbit, followed by a stuck-thruster emergency.'],
['1966-06-02','Surveyor 1','land','moon','luna-programs','The first US soft landing on the Moon, testing the ground Apollo would stand on.'],
['1968-12-21','Apollo 8','lunar','','tranquility-apollo-program','Launch of the first crew to leave Earth orbit and circle the Moon.'],
['1969-02-21','First N1 launch','sub','','thrust-saturn-v-n1','The Soviet Moon rocket’s 30-engine first stage was shut down by its control system 68.7 s into flight.'],
['1969-07-20','Apollo 11 — Eagle has landed','land','moon','tranquility-apollo-program','Armstrong and Aldrin landed in the Sea of Tranquility and walked on the Moon.'],
['1970-09-12','Luna 16','lunar','','luna-programs','Launch of the first robotic mission to return lunar soil to Earth.'],
['1970-11-17','Lunokhod 1','land','moon','luna-programs','The first robotic rover on another world began 10 months of driving on the Moon.'],
['1970-12-15','Venera 7','land','venus','furnace-venera-vega','The first landing on another planet, transmitting from Venus’ 475 °C surface.'],
['1971-04-19','Salyut 1','dock','','salute-salyut-program','The first space station was launched.'],
['1971-11-14','Mariner 9','mars','','transfer-earth-to-mars','The first spacecraft to orbit another planet, waiting out a global Martian dust storm.'],
['1971-12-02','Mars 3','land','mars','viking','The first soft landing on Mars; it transmitted for about 20 seconds.'],
['1972-03-03','Pioneer 10','outer','','voyager-and-pioner','Launch of the first probe to cross the asteroid belt and fly past Jupiter.'],
['1972-07-23','Landsat 1 (ERTS-1)','leo','','sunsync-earth-observation','The first Landsat began the longest record of Earth from space, from a sun-synchronous orbit.'],
['1972-12-07','Apollo 17','lunar','','tranquility-apollo-program','Launch of the last crewed Moon mission; the crew took the “Blue Marble” photo.'],
['1973-04-03','Salyut 2 (Almaz)','dock','','almaz-program-ussr','The first military Almaz station was launched; it failed days later.'],
['1973-04-06','Pioneer 11','outer','','voyager-and-pioner','Launch of the first probe to visit Saturn, after a Jupiter gravity assist.'],
['1973-05-14','Skylab','dock','','workshop-skylab','America’s first space station was launched, losing a solar wing on the way up.'],
['1974-02-05','Mariner 10 passes Venus','trail','','slingshot-gravity-assists','The first spacecraft to use one planet’s gravity to reach another, bent toward Mercury 5,768 km above Venus.'],
['1975-07-17','Apollo–Soyuz','dock','','union-soyuz-program','An American and a Soviet spacecraft docked and the crews shook hands in orbit.'],
['1976-07-20','Viking 1 lands','land','mars','viking','The first fully successful Mars landing, followed by six years of surface science.'],
['1977-08-20','Voyager 2','outer','','voyager-and-pioner','Launch of the only spacecraft to visit all four giant planets.'],
['1977-09-05','Voyager 1','outer','','voyager-and-pioner','Launch of the probe that is now the most distant human-made object.'],
['1978-02-22','First GPS satellite','leo','','navigator-gps','NAVSTAR 1 began the constellation that now times every blue dot on a map.'],
['1979-03-05','Voyager 1 at Jupiter','outer','','voyager-and-pioner','Closest approach to Jupiter; it discovered active volcanoes on Io.'],
['1981-04-12','STS-1 Columbia','leo','','orbiter-space-shuttle-program','The first Space Shuttle flight, crewed from the very first launch.'],
['1983-04-07','First Space Shuttle spacewalk','leo','','suit-spacesuits-eva','STS-6 crew went outside after a 3.5-hour oxygen prebreathe.'],
['1986-01-24','Voyager 2 at Uranus','outer','','tilt-uranus-neptune','The only visit to Uranus so far: 10 new moons, 2 new rings and a magnetic field tilted nearly 60°.'],
['1986-02-19','Mir core module','dock','','iss-and-mir','The first modular space station was launched; it hosted crews for 15 years.'],
['1989-08-25','Voyager 2 at Neptune','outer','','voyager-and-pioner','The only close look at Neptune and its moon Triton, 12 years after launch.'],
['1989-10-18','Galileo','outer','','umbrella-galileo-jupiter','Launch of the first Jupiter orbiter, which dropped a probe into Jupiter’s atmosphere.'],
['1990-04-24','Hubble Space Telescope','leo','','aperture-hubble-telescopes','Launch of the telescope whose flawed mirror was fixed in orbit three years later.'],
['1990-08-10','Magellan reaches Venus','outer','','veil-magellan-venus','The radar orbiter that went on to map 98% of Venus through its clouds.'],
['1994-01-25','Clementine','lunar','','prospect-clementine-mission','Launch of the small mission that mapped the Moon in 11 colours and hinted at polar ice.'],
['1997-07-04','Mars Pathfinder','land','mars','bounce-mars-pathfinder','Landed on airbags and released Sojourner, the first rover on Mars.'],
['1997-10-15','Cassini–Huygens','outer','','finale-cassini-huygens','Launch of the 13-year mission to Saturn and the first landing on Titan.'],
['1998-11-20','ISS — Zarya','dock','','iss-and-mir','The first module of the International Space Station was launched.'],
['1999-07-23','Chandra','leo','','xray-chandra-observatory','Launch of the X-ray observatory into a highly elliptical orbit a third of the way to the Moon.'],
['2000-11-02','ISS Expedition 1','dock','','iss-and-mir','The first resident crew arrived; the station has been occupied ever since.'],
['2003-08-25','Spitzer','trail','','infrared-spitzer-telescope','Launch of the infrared telescope into an orbit trailing Earth around the Sun.'],
['2003-10-15','Shenzhou 5 — Yang Liwei','leo','','vessel-shenzhou-program','China’s first crewed spaceflight, 14 orbits in 21 hours.'],
['2004-01-04','Spirit lands','land','mars','troy-spirit-rover','The rover planned for 90 sols drove on Mars for six years.'],
['2004-01-25','Opportunity lands','land','mars','marathon-opportunity-rover','It drove more than a marathon’s distance over 14 years.'],
['2005-01-14','Huygens lands on Titan','land','titan','finale-cassini-huygens','The most distant landing ever made, under the haze of Saturn’s largest moon.'],
['2006-01-15','Stardust comes home','land','earth','entry-heat-shields','The fastest Earth entry of any returning capsule, 12.9 km/s, under a PICA heat shield.'],
['2006-01-19','New Horizons','outer','','frontier-new-horizons','Launch of the fastest spacecraft ever sent from Earth, bound for Pluto.'],
['2008-10-22','Chandrayaan-1','lunar','','valor-the-chandrayaan-mission','Launch of India’s first Moon mission, which helped confirm water on the Moon.'],
['2009-02-10','Iridium–Cosmos collision','leo','','debris-space-junk','The first accidental collision of two intact satellites, at more than 11 km/s.'],
['2009-03-07','Kepler','trail','','transit-kepler-telescope','Launch of the planet hunter that found thousands of exoplanets.'],
['2009-06-18','Lunar Reconnaissance Orbiter','lunar','','scout-lunar-reconnaissance-orbiter','Launch of the orbiter that has mapped the Moon in detail ever since.'],
['2010-05-20','IKAROS solar sail','trail','','sail-solar-sails','The first solar sail demonstrated in flight, pushed by 1.12 mN of sunlight.'],
['2010-06-13','Hayabusa comes home','land','earth','sample-hayabusa-osiris-rex','The capsule landed at Woomera with about 1,500 grains of asteroid Itokawa.'],
['2011-03-18','MESSENGER orbits Mercury','outer','','scorch-mercury-messenger-bepicolombo','The first Mercury orbiter, after six braking flybys and six and a half years of flight.'],
['2011-07-16','Dawn reaches Vesta','outer','','belt-dawn-vesta-ceres','The first spacecraft to orbit an object in the main asteroid belt.'],
['2011-09-29','Tiangong-1','dock','','palace-tiangong-station','Launch of China’s first space laboratory module.'],
['2012-08-06','Curiosity lands','land','mars','skycrane-curiosity-rover','Lowered onto Gale Crater by a rocket-powered sky crane.'],
['2012-08-25','Voyager 1 leaves the heliosphere','outer','','voyager-and-pioner','The first spacecraft to cross into interstellar space, at about 121 AU.'],
['2013-12-19','Gaia','l2','','parallax-gaia-mission','Launch of the mission measuring the positions of almost two billion stars.'],
['2014-08-06','Rosetta reaches comet 67P','outer','','comet-rosetta-philae','After ten years and four planetary flybys, Rosetta matched orbits with a comet.'],
['2015-03-06','Dawn reaches Ceres','outer','','belt-dawn-vesta-ceres','Its ion engines carried Dawn on to a second world: the first orbiter of a dwarf planet.'],
['2015-07-14','New Horizons at Pluto','outer','','frontier-new-horizons','The first close flyby of Pluto, revealing its heart-shaped nitrogen-ice plain.'],
['2015-12-22','Falcon 9 booster lands','sub','','return-reusable-rockets','The first orbital-class booster to fly back and land upright, at Cape Canaveral.'],
['2016-07-05','Juno reaches Jupiter','outer','','polar-juno-jupiter','A 35-minute burn put the first solar-powered Jupiter orbiter into a pole-to-pole orbit.'],
['2017-09-15','Cassini’s Grand Finale','outer','','finale-cassini-huygens','After 13 years at Saturn, Cassini dove into the planet’s atmosphere.'],
['2019-01-03','Chang’e 4 lands on the far side','land','moon','rabbit-change-far-side','The first landing on the far side of the Moon, in Von Kármán crater, relayed through Queqiao.'],
['2020-05-30','Crew Dragon Demo-2','dock','','handoff-commercial-crew-program','The first crew launched to orbit on a commercial spacecraft.'],
['2020-12-01','Chang’e 5 lands','land','moon','rabbit-change-far-side','Landed near Mons Rümker and returned 1,731 g of the youngest lunar rocks ever dated.'],
['2021-02-18','Perseverance lands','land','mars','jezero-perseverance-rover','Landed in Jezero Crater to collect samples for return to Earth.'],
['2021-04-19','Ingenuity flies','land','mars','jezero-perseverance-rover','The first powered, controlled flight on another planet.'],
['2021-04-29','Tianhe core module','dock','','palace-tiangong-station','The core of China’s Tiangong space station was launched.'],
['2021-12-25','James Webb Space Telescope','l2','','james-webb-space-telescope','Launch of the largest space telescope, headed to the Sun–Earth L2 point.'],
['2022-09-26','DART hits Dimorphos','trail','','impact-dart-planetary-defence','The first test of asteroid deflection shortened Dimorphos’s orbit by 33 minutes.'],
['2022-11-16','Artemis I','lunar','','campaign-artemis-program','Launch of the uncrewed Orion test flight around the Moon.'],
['2023-08-23','Chandrayaan-3 lands','land','moon','valor-the-chandrayaan-mission','The first landing near the lunar south pole.'],
['2023-09-24','OSIRIS-REx sample lands','land','earth','sample-hayabusa-osiris-rex','The capsule parachuted into Utah with 121.6 g of asteroid Bennu.'],
['2024-06-01','Chang’e 6 lands on the far side','land','moon','rabbit-change-far-side','Collected 1,935.3 g of samples, the first ever returned from the Moon’s far side.'],
['2024-10-13','Super Heavy caught by the tower','sub','','return-reusable-rockets','Starship’s booster flew back to its launch tower and was caught by its arms.'],
['2024-10-14','Europa Clipper','outer','','flyby-europa-clipper','Launch of the mission to study whether Jupiter’s moon Europa could support life.'],
['2024-12-24','Parker Solar Probe’s closest pass','trail','','corona-parker-solar-orbiter','Perihelion at 9.86 solar radii, the closest any spacecraft has come to the Sun.']
];
var TYPE={leo:0,dock:1,lunar:2,mars:3,outer:4,l2:5,trail:6,land:7,sub:8};
var BODY={moon:0,mars:1,venus:2,titan:3,earth:4};
var ERA=[[1957,1975],[1976,1999],[2000,9999]];
var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- info panel + selection ---------- */
var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function doy(m,d){return Date.UTC(2001,m,d)/864e5-Date.UTC(2001,0,1)/864e5;}
function parts(s){var a=s.split('-');return [+a[0],+a[1]-1,+a[2]];}
var now=new Date(), today=doy(now.getUTCMonth(),now.getUTCDate()), cur=0, era='today', list=[];
function todayPick(){
  var best=0,bd=1e9;
  M.forEach(function(m,i){var p=parts(m[0]),d=doy(p[1],p[2])-today; if(d>182)d-=365; if(d<-182)d+=365;
    var k=Math.abs(d)+(d>0?0.5:0)+p[0]*1e-5; /* past beats upcoming; same day: the older mission */ if(k<bd){bd=k;best=i;}});
  return best;
}
function setList(){
  if(era==='today'){list=M.map(function(_,i){return i;});}
  else{var r=ERA[+era];list=M.map(function(_,i){return i;}).filter(function(i){var y=parts(M[i][0])[0];return y>=r[0]&&y<=r[1];});}
}
function show(i){
  cur=i;prog=0;held=0;var m=M[i],p=parts(m[0]);
  var dd=doy(p[1],p[2])-today; if(dd>182)dd-=365; if(dd<-182)dd+=365;
  var yrs=now.getUTCFullYear()-p[0]-(dd>0?1:0);
  var lead=era==='today'?(dd===0?'On this day':dd<0?(-dd)+' day'+(dd===-1?'':'s')+' ago':'In '+dd+' day'+(dd===1?'':'s')):'';
  $('ae-when').textContent=(lead?lead+' · ':'')+p[2]+' '+MON[p[1]]+' '+p[0]+' · '+(yrs===0?'this year':yrs+' year'+(yrs===1?'':'s')+' ago');
  $('ae-name').textContent=m[1];
  $('ae-what').textContent=m[5];
  var a=$('ae-read');
  if(m[4]){a.href='/aerospace/'+m[4];a.textContent='Read the field guide →';}
  else{a.href='/aerospace/';a.textContent='No field guide yet · Aerospace hub →';}
  cv.setAttribute('aria-label','Schematic trajectory: '+m[1]+' ('+m[0]+')');
}
function pickEra(e){
  era=e;
  document.querySelectorAll('#ae-eras [data-era]').forEach(function(b){var on=b.dataset.era===e;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
  setList();show(e==='today'?todayPick():list[0]);
}
document.querySelectorAll('#ae-eras [data-era]').forEach(function(b){b.addEventListener('click',function(){pickEra(b.dataset.era);});});
function step(k){if(era==='today'){setList();} var j=list.indexOf(cur); show(list[(j+k+list.length)%list.length]);}
$('ae-prev').addEventListener('click',function(){step(-1);});
$('ae-next').addEventListener('click',function(){step(1);});
setList();

/* ---------- GL ---------- */
var gl=null;
try{gl=cv.getContext('webgl2',{alpha:false,antialias:false,preserveDrawingBuffer:!!window.__aePreserve});}catch(e){}
var prog=0, held=0;
show(todayPick());
if(!gl){$('ae-hint').textContent='Animation needs WebGL 2';return;}

var VS='#version 300 es\nin vec2 aPos; void main(){ gl_Position=vec4(aPos,0.0,1.0); }';
var FS=['#version 300 es',
'precision highp float;',
'uniform vec2 uRes; uniform float uP, uT, uDpr; uniform int uType, uBody;',
'uniform vec3 uPaper, uInk, uAcc, uTone;',
'out vec4 o;',
'float PX, A;',
'const float PI=3.14159265;',
'float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }',
'float lineA(float d, float w){ return 1.0-smoothstep(w,w+1.5*PX,abs(d)); }',
'float fillA(float d){ return 1.0-smoothstep(-PX,PX,d); }',
'float segD(vec2 p, vec2 a, vec2 b, out float h){ vec2 pa=p-a, ba=b-a; h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0); return length(pa-ba*h); }',
'vec2 rot(vec2 v, float a){ float c=cos(a), s=sin(a); return vec2(c*v.x-s*v.y, s*v.x+c*v.y); }',
'vec2 bez(vec2 a, vec2 b, vec2 c, vec2 d, float t){ float u=1.0-t; return u*u*u*a+3.0*u*u*t*b+3.0*u*t*t*c+t*t*t*d; }',
// ---- trajectory per type, s in [0,1] ----
'const float TILT=0.32;',
'vec2 orb(float a, float r){ return vec2(cos(a)*r, sin(a)*r*TILT); }',            // planet orbits seen at an angle
'float RO(){ return min(A*0.5,1.6)*0.88; }',
'vec2 earthL(){ return vec2(-A*0.5+0.32,-0.02); }',
'vec2 moonL(){ return vec2(A*0.5-0.3, 0.05); }',
'vec2 curve(float s){',
'  if(uType==0||uType==1){ float a=s*2.0*PI; return rot(vec2(cos(a)*0.62, sin(a)*0.2),0.18); }',
'  if(uType==2){ vec2 E=earthL(), Mo=moonL(); float rr=0.11;',
'    if(s<0.45) return bez(E+vec2(0.0,-0.13), E+vec2(0.6,-0.32), Mo+vec2(-0.5,0.35), Mo+vec2(0.0,rr), s/0.45);',
'    if(s<0.62){ float a=PI*0.5-(s-0.45)/0.17*PI; return Mo+vec2(cos(a),sin(a))*rr; }',
'    return bez(Mo+vec2(0.0,-rr), Mo+vec2(-0.5,-0.35), E+vec2(0.6,0.32), E+vec2(0.0,0.13), (s-0.62)/0.38); }',
'  if(uType==3){ float R2=RO(), R1=R2/1.524, a=(R1+R2)*0.5, e=(R2-R1)/(R2+R1), th=s*PI;',
'    float r=a*(1.0-e*e)/(1.0+e*cos(th)); return orb(th,r); }',
'  if(uType==4){ float th=s*3.4; float R=RO()*1.05;',
'    float k=clamp(th/3.0,0.0,1.0); float r=mix(0.19,1.0,pow(k,0.85))*R + max(th-3.0,0.0)*0.5*R*0.3; return orb(th-0.4,r); }',
'  if(uType==5){ vec2 E=vec2(-A*0.5+0.55,0.0), L=vec2(A*0.5-0.45,0.0);',
'    if(s<0.4) return bez(E+vec2(0.06,-0.06), E+vec2(0.5,-0.4), L+vec2(-0.5,-0.3), L+vec2(0.0,-0.24), s/0.4);',
'    float a=-PI*0.5+(s-0.4)/0.6*2.0*PI*1.5; return L+vec2(cos(a)*0.08, sin(a)*0.24); }',
'  if(uType==6){ float a=-s*0.9; return orb(a+0.6, RO()*0.72*1.02); }',
'  if(uType==7){ return bez(vec2(-A*0.5+0.1,0.48), vec2(-A*0.12,0.42), vec2(A*0.1,0.05), vec2(A*0.16,-0.35), s); }',
'  return bez(vec2(-A*0.3,-0.35), vec2(-A*0.15,0.62), vec2(A*0.15,0.62), vec2(A*0.3,-0.35), s);',
'}',
'void track(vec2 p, inout vec3 c){',                                                // dashed path, travelled part in accent
'  float bd=1e3, bs=0.0; vec2 a=curve(0.0);',
'  for(int i=1;i<=72;i++){ float s=float(i)/72.0; vec2 b=curve(s); float h; float d=segD(p,a,b,h); if(d<bd){bd=d; bs=(float(i-1)+h)/72.0;} a=b; }',
'  float dash=step(0.45,fract(bs*60.0));',
'  bool loop=uType<=1;',
'  float done=loop?0.0:step(bs,uP);',
'  c=mix(c,uInk,lineA(bd,0.6*PX)*(loop?0.42:mix(0.38*dash,0.0,done)));',
'  c=mix(c,uAcc,lineA(bd,0.9*PX)*done);',
'}',
'void bodyC(vec2 p, vec2 ctr, float r, vec3 tone, vec2 sun, inout vec3 c){',
'  float d=length(p-ctr)-r; if(d>2.0*PX) { c=mix(c,uInk,lineA(d,0.5*PX)*0.0); return; }',
'  vec2 q=(p-ctr)/r; float z=sqrt(max(0.0,1.0-dot(q,q)));',
'  float lam=clamp(dot(normalize(vec3(q,z)),normalize(vec3(sun,0.6))),0.0,1.0);',
'  vec3 f=mix(mix(uPaper,uInk,0.55),tone,0.25+0.75*lam);',
'  c=mix(c,f,fillA(d)); c=mix(c,uInk,lineA(d,0.6*PX)*0.8);',
'}',
'void ring(vec2 p, vec2 ctr, float rx, float ry, float a, inout vec3 c){ vec2 q=(p-ctr)/vec2(rx,ry); float d=(length(q)-1.0)*min(rx,ry); c=mix(c,uInk,lineA(d,0.5*PX)*a); }',
'void craft(vec2 p, vec2 at, inout vec3 c){',
'  float d=length(p-at); c=mix(c,uAcc,fillA(d-0.016)); c=mix(c,uAcc,lineA(d-0.034-0.01*sin(uT*4.0),0.5*PX)*0.6);',
'}',
'void main(){',
'  vec2 fc=gl_FragCoord.xy; A=uRes.x/uRes.y; PX=1.0/uRes.y;',
'  vec2 p=(fc-uRes*0.5)/uRes.y;',
'  vec3 c=uPaper;',
'  vec2 g=floor(fc/(3.0*uDpr)); float st=hash(g);',                               // stars
'  c=mix(c,uInk,step(0.9965,st)*(0.25+0.35*hash(g+7.0))*(0.6+0.4*sin(uT*1.3+st*40.0)));',
'  vec3 earth=mix(uInk,vec3(0.25,0.45,0.75),0.6);',
'  if(uType==0||uType==1){',
'    float a=uP*2.0*PI*3.0;',
'    vec2 cr=rot(vec2(cos(a)*0.62, sin(a)*0.2),0.18); bool behind=sin(a)>0.0;',
'    track(p,c);',
'    bodyC(p,vec2(0.0),0.3,earth,vec2(-0.6,0.4),c);',
'    if(rot(p,-0.18).y<0.0) track(p,c);',                                              // near half of the orbit passes in front of Earth
'    if(uType==1){ float lag=(1.0-smoothstep(0.0,0.85,uP))*1.1; float b2=a-lag; vec2 st2=rot(vec2(cos(b2)*0.62, sin(b2)*0.2),0.18)*mix(0.9,1.0,smoothstep(0.0,0.85,uP));',
'      bool bh2=sin(b2)>0.0; if(!(bh2&&length(st2)<0.3)) { float d=length(p-st2); c=mix(c,uInk,fillA(max(abs(p.x-st2.x)-0.03,abs(p.y-st2.y)-0.008))); } }',
'    if(!(behind&&length(cr)<0.3)) craft(p,cr,c);',
'  } else if(uType==2){',
'    vec2 E=earthL(), Mo=moonL();',
'    ring(p,E,length(Mo-E),length(Mo-E)*0.35,0.12,c);',
'    track(p,c); bodyC(p,E,0.12,earth,vec2(-1.0,0.3),c); bodyC(p,Mo,0.045,mix(uPaper,uInk,0.3),vec2(-1.0,0.3),c);',
'    craft(p,curve(uP),c);',
'  } else if(uType==3){',
'    float R2=RO(), R1=R2/1.524;',
'    ring(p,vec2(0.0),R1,R1*TILT,0.25,c); ring(p,vec2(0.0),R2,R2*TILT,0.25,c);',
'    track(p,c);',
'    bodyC(p,vec2(0.0),0.06,uAcc,vec2(0.0,1.0),c);',
'    bodyC(p,orb(uP*2.0*PI*259.0/365.0,R1),0.03,earth,-orb(uP*2.0*PI*259.0/365.0,R1),c);',
'    float am=0.768+uP*2.374; bodyC(p,orb(am,R2),0.024,uAcc*0.9,-orb(am,R2),c);',
'    craft(p,curve(uP),c);',
'  } else if(uType==4){',
'    float R=RO()*1.05; float rs[5]=float[5](0.19,0.43,0.6,0.8,0.98);',
'    for(int i=0;i<5;i++) ring(p,vec2(0.0),rs[i]*R,rs[i]*R*TILT,0.2,c);',
'    track(p,c); bodyC(p,vec2(0.0),0.05,uAcc,vec2(0.0,1.0),c);',
'    for(int i=1;i<5;i++){ float th=0.0; float k=pow(rs[i]>0.19?(rs[i]-0.19)/0.81:0.0,1.0/0.85)*3.0; vec2 pl=orb(k-0.4,rs[i]*R);',
'      bodyC(p,pl,0.028-0.003*float(i),mix(uInk,uAcc,0.25),-pl,c); }',
'    craft(p,curve(uP),c);',
'  } else if(uType==5){',
'    vec2 E=vec2(-A*0.5+0.55,0.0), L=vec2(A*0.5-0.45,0.0);',
'    c=mix(c,uAcc,0.18*exp(-pow(max(0.0,p.x+A*0.5+0.1),1.0)*6.0));',             // sunlight from the left
'    ring(p,E,0.2,0.07,0.15,c);',
'    c=mix(c,uInk,(lineA(length(p-L)-0.012,0.5*PX))*0.6);',
'    track(p,c); bodyC(p,E,0.075,earth,vec2(-1.0,0.0),c);',
'    craft(p,curve(uP),c);',
'  } else if(uType==6){',
'    float R=RO()*0.72; ring(p,vec2(0.0),R,R*TILT,0.3,c); track(p,c);',
'    bodyC(p,vec2(0.0),0.06,uAcc,vec2(0.0,1.0),c);',
'    vec2 e=orb(0.6+uP*0.4,R); bodyC(p,e,0.03,earth,-e,c);',
'    craft(p,orb(0.6+uP*0.4-uP*0.9,R*1.02),c);',
'  } else {',
'    vec3 tone=uTone; float Rb=2.4; vec2 Cb=vec2(0.0,-0.36-Rb);',
'    float atm=(uBody==0)?0.0:1.0;',
'    float dpl=length(p-Cb)-Rb;',
'    c=mix(c,mix(uPaper,tone,0.35),atm*(1.0-smoothstep(0.0,0.2,dpl))*0.6*step(0.0,dpl));',
'    track(p,c);',
'    vec2 sp=(p-Cb)*7.0; float tex=0.5+0.25*sin(sp.x*1.3+sin(sp.y*1.7))+0.25*sin(sp.y*2.1+sp.x*0.6);',
'    c=mix(c,mix(tone,uInk,0.25*tex),fillA(dpl)); c=mix(c,uInk,lineA(dpl,0.6*PX)*0.9);',
'    vec2 at=curve(uP); craft(p,at,c);',
'    if(uType==7&&atm>0.5&&uP>0.55&&uP<0.97){ vec2 cp=at+vec2(0.0,0.09); float d=length(p-cp)-0.05;',   // parachute
'      c=mix(c,uInk,lineA(d,0.5*PX)*step(cp.y,p.y)*0.9);',
'      float h; c=mix(c,uInk,lineA(segD(p,at,cp+vec2(-0.05,0.0),h),0.4*PX)*0.6); c=mix(c,uInk,lineA(segD(p,at,cp+vec2(0.05,0.0),h),0.4*PX)*0.6); }',
'    if(uType==7&&(atm<0.5||uBody==1)&&uP>0.8&&uP<0.995){ float h; float d=segD(p,at,at-vec2(0.0,0.05+0.02*sin(uT*30.0)),h); c=mix(c,uAcc,lineA(d,1.2*PX)*0.8); }',
'    if(uP>0.97){ float k=(uP-0.97)/0.03; vec2 q=p-curve(1.0); c=mix(c,uInk,0.25*(1.0-k)*fillA(length(q*vec2(0.5,1.6))-0.05*k-0.01)); }',
'  }',
'  o=vec4(c,1.0);',
'}'].join('\n');
function sh(t,s){var x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(x));return x;}
var P,U={};
try{P=gl.createProgram();gl.attachShader(P,sh(gl.VERTEX_SHADER,VS));gl.attachShader(P,sh(gl.FRAGMENT_SHADER,FS));gl.bindAttribLocation(P,0,'aPos');gl.linkProgram(P);
  if(!gl.getProgramParameter(P,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(P));}
catch(e){console.error(e);$('ae-hint').textContent='Animation unavailable on this device';return;}
['uRes','uP','uT','uDpr','uType','uBody','uPaper','uInk','uAcc','uTone'].forEach(function(n){U[n]=gl.getUniformLocation(P,n);});
gl.bindVertexArray(gl.createVertexArray());gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);

var C={}, probe=document.createElement('canvas').getContext('2d');
function rgb(s,fb){probe.fillStyle=fb;probe.fillStyle=(s||'').trim()||fb;var h=probe.fillStyle;
  if(h[0]==='#')return [parseInt(h.substr(1,2),16)/255,parseInt(h.substr(3,2),16)/255,parseInt(h.substr(5,2),16)/255];
  var m=h.match(/[\d.]+/g);return m?[m[0]/255,m[1]/255,m[2]/255]:[0,0,0];}
function isDark(){var t=document.documentElement.getAttribute('data-theme');return t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches);}
var TONES={light:[[0.62,0.62,0.6],[0.76,0.42,0.24],[0.86,0.76,0.5],[0.74,0.55,0.3],[0.3,0.5,0.75]],dark:[[0.55,0.55,0.53],[0.8,0.47,0.3],[0.85,0.76,0.52],[0.78,0.6,0.35],[0.35,0.55,0.8]]};
function theme(){var cs=getComputedStyle(document.documentElement);C.dark=isDark();
  C.paper=rgb(getComputedStyle($('ae-frame')).backgroundColor,'#ffffff');C.ink=rgb(cs.getPropertyValue('--ink'),'#0b0b0c');
  C.acc=rgb(C.dark?'#e08a5c':'#c2572b');}
theme();
new MutationObserver(theme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
if(window.matchMedia)window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',theme);

/* drag scrubs mission time; otherwise it plays (9 s) and rests 2.5 s at the end */
var drag=false;
function scrub(e){var r=cv.getBoundingClientRect();prog=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width));held=0;}
cv.addEventListener('pointerdown',function(e){drag=true;scrub(e);});
cv.addEventListener('pointermove',function(e){if(drag)scrub(e);});
['pointerup','pointercancel','pointerleave'].forEach(function(n){cv.addEventListener(n,function(){drag=false;});});

var t=0,last=performance.now(),running=false,raf=0;
function draw(nowMs){
  var dt=Math.min(0.05,(nowMs-last)/1000);last=nowMs;t+=dt;
  if(!drag){ if(prog<1)prog=Math.min(1,prog+dt/(reduced?20:9)); else{held+=dt;if(held>2.5){prog=0;held=0;}} }
  var dpr=Math.min(window.devicePixelRatio||1,1.5),r=cv.getBoundingClientRect();
  var W=Math.max(1,Math.round(r.width*dpr)),H=Math.max(1,Math.round(r.height*dpr));
  if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}
  var m=M[cur], body=BODY[m[3]]||0, ease=TYPE[m[2]]<=1?prog:prog*prog*(3-2*prog);
  gl.viewport(0,0,W,H);gl.useProgram(P);
  gl.uniform2f(U.uRes,W,H);gl.uniform1f(U.uP,ease);gl.uniform1f(U.uT,reduced?t*0.3:t);gl.uniform1f(U.uDpr,dpr);
  gl.uniform1i(U.uType,TYPE[m[2]]);gl.uniform1i(U.uBody,body);
  gl.uniform3fv(U.uPaper,C.paper);gl.uniform3fv(U.uInk,C.ink);gl.uniform3fv(U.uAcc,C.acc);gl.uniform3fv(U.uTone,TONES[C.dark?'dark':'light'][body]);
  gl.drawArrays(gl.TRIANGLES,0,3);
}
function loop(n){if(!running)return;draw(n);raf=requestAnimationFrame(loop);}
function start(){if(running||document.hidden)return;running=true;last=performance.now();raf=requestAnimationFrame(loop);}
function stop(){running=false;cancelAnimationFrame(raf);}
var visible=false;
new IntersectionObserver(function(es){visible=es[0].isIntersecting;visible?start():stop();},{rootMargin:'100px'}).observe(cv);
document.addEventListener('visibilitychange',function(){document.hidden?stop():(visible&&start());});
cv.addEventListener('webglcontextlost',function(e){e.preventDefault();stop();$('ae-hint').textContent='Graphics context lost — reload to restart';});
if(window.__aePreserve){window.__aeDraw=function(ms){draw(ms);};window.__aeShow=function(i){show(i);};window.__aeSetP=function(v){prog=v;held=0;};window.__aeM=M;}
})();
</script>
