(function(){
  var cvs=document.getElementById('cubes-canvas'),
      ctx=cvs?cvs.getContext('2d'):null,
      cubes=[],running=false,raf=0,
      btn=document.getElementById('btn-cubes'),
      tbtn=document.getElementById('btn-theme');

  var palette=[
    'rgba(166,64,31,0.18)','rgba(166,64,31,0.12)',
    'rgba(122,122,116,0.14)','rgba(11,11,12,0.08)',
    'rgba(201,201,193,0.22)','rgba(80,120,180,0.12)',
    'rgba(212,113,78,0.16)','rgba(60,60,58,0.10)'
  ];

  function mkCube(){
    var s=6+Math.random()*28;
    return{
      x:Math.random()*cvs.width,
      y:-s-Math.random()*cvs.height*0.5,
      s:s,
      vy:0.3+Math.random()*1.2,
      vx:(Math.random()-0.5)*0.4,
      r:Math.random()*Math.PI*2,
      vr:(Math.random()-0.5)*0.02,
      c:palette[Math.floor(Math.random()*palette.length)]
    };
  }

  function resize(){
    if(!cvs)return;
    cvs.width=window.innerWidth;
    cvs.height=window.innerHeight;
  }

  function tick(){
    if(!running)return;
    ctx.clearRect(0,0,cvs.width,cvs.height);
    if(cubes.length<90) cubes.push(mkCube());
    for(var i=cubes.length-1;i>=0;i--){
      var c=cubes[i];
      c.y+=c.vy; c.x+=c.vx; c.r+=c.vr;
      if(c.y>cvs.height+c.s){cubes.splice(i,1);continue;}
      ctx.save();
      ctx.translate(c.x,c.y);
      ctx.rotate(c.r);
      ctx.fillStyle=c.c;
      ctx.fillRect(-c.s/2,-c.s/2,c.s,c.s);
      ctx.restore();
    }
    raf=requestAnimationFrame(tick);
  }

  function toggle(){
    running=!running;
    if(running){
      cvs.classList.add('on');
      document.body.classList.add('cubes-on');
      btn.classList.add('active');
      cubes=[];resize();tick();
    }else{
      cancelAnimationFrame(raf);
      cvs.classList.remove('on');
      document.body.classList.remove('cubes-on');
      btn.classList.remove('active');
      cubes=[];
    }
  }

  if(btn) btn.addEventListener('click',toggle);
  window.addEventListener('resize',function(){if(running)resize();});

  /* theme toggle */
  function applyTheme(t){
    document.documentElement.setAttribute('data-theme',t);
    document.body.style.background=getComputedStyle(document.documentElement).getPropertyValue('--paper');
    try{localStorage.setItem('fb-theme',t);}catch(e){}
    if(tbtn) tbtn.textContent=t==='dark'?'light':'dark';
  }
  function toggleTheme(){
    var cur=document.documentElement.getAttribute('data-theme')||'light';
    applyTheme(cur==='dark'?'light':'dark');
  }
  if(tbtn) tbtn.addEventListener('click',toggleTheme);
  try{
    var saved=localStorage.getItem('fb-theme');
    if(saved) applyTheme(saved);
    else if(window.matchMedia('(prefers-color-scheme:dark)').matches) applyTheme('dark');
  }catch(e){}
})();
