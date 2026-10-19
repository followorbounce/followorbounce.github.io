/* ---- tiny WebGL2 kit (inlined per page; see visual-synths/ for the family) ---- */
const GL = {
  shader(gl, type, src){
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) + '\n' + src.split('\n').map((l,i)=>(i+1)+': '+l).join('\n'));
    return s;
  },
  program(gl, vs, fs, feedback){
    const p = gl.createProgram();
    gl.attachShader(p, GL.shader(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(p, GL.shader(gl, gl.FRAGMENT_SHADER, fs));
    if(feedback) gl.transformFeedbackVaryings(p, feedback, gl.INTERLEAVED_ATTRIBS);
    gl.linkProgram(p);
    if(!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for(let i = 0; i < n; i++){ const a = gl.getActiveUniform(p, i); u[a.name.replace('[0]','')] = gl.getUniformLocation(p, a.name); }
    return {p, u};
  },
  persp(fovy, aspect, near, far){
    const t = 1/Math.tan(fovy/2);
    return new Float32Array([t/aspect,0,0,0, 0,t,0,0, 0,0,(far+near)/(near-far),-1, 0,0,2*far*near/(near-far),0]);
  },
  lookAt(e, c){
    let zx=e[0]-c[0], zy=e[1]-c[1], zz=e[2]-c[2], l=Math.hypot(zx,zy,zz); zx/=l; zy/=l; zz/=l;
    let xx=zz, xz=-zx; l=Math.hypot(xx,xz)||1; xx/=l; xz/=l;
    const yx=zy*xz, yy=zz*xx-zx*xz, yz=-zy*xx;
    return new Float32Array([xx,yx,zx,0, 0,yy,zy,0, xz,yz,zz,0,
      -(xx*e[0]+xz*e[2]), -(yx*e[0]+yy*e[1]+yz*e[2]), -(zx*e[0]+zy*e[1]+zz*e[2]), 1]);
  },
  mul(a, b){
    const o = new Float32Array(16);
    for(let c=0;c<4;c++) for(let r=0;r<4;r++){ let s=0; for(let k=0;k<4;k++) s += a[k*4+r]*b[c*4+k]; o[c*4+r]=s; }
    return o;
  },
  /* orbit camera: drag = orbit, wheel / pinch = zoom; state.touched marks the last interaction */
  orbit(el, st){
    const pts = new Map();
    const pinch = () => { const v=[...pts.values()]; return Math.hypot(v[0][0]-v[1][0], v[0][1]-v[1][1]); };
    el.addEventListener('pointerdown', e => { try { el.setPointerCapture(e.pointerId); } catch(_){} pts.set(e.pointerId,[e.clientX,e.clientY]); st.touched=performance.now(); });
    el.addEventListener('pointermove', e => {
      if(!pts.has(e.pointerId)) return;
      const p = pts.get(e.pointerId);
      if(pts.size === 1){
        st.yaw -= (e.clientX-p[0])*0.006;
        st.pitch = Math.max(-1.45, Math.min(1.45, st.pitch + (e.clientY-p[1])*0.005));
        p[0]=e.clientX; p[1]=e.clientY;
      } else if(pts.size === 2){
        const d0 = pinch(); p[0]=e.clientX; p[1]=e.clientY; const d1 = pinch();
        if(d0 > 0 && d1 > 0) st.dist = Math.max(st.minDist, Math.min(st.maxDist, st.dist*d0/d1));
      }
      st.touched = performance.now();
    });
    const up = e => pts.delete(e.pointerId);
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', e => { e.preventDefault(); st.dist = Math.max(st.minDist, Math.min(st.maxDist, st.dist*Math.exp(e.deltaY*0.0012))); st.touched=performance.now(); }, {passive:false});
  },
  eye(st){ const cp=Math.cos(st.pitch); return [st.dist*cp*Math.sin(st.yaw), st.dist*Math.sin(st.pitch), st.dist*cp*Math.cos(st.yaw)]; },
  /* resize the drawing buffer to the element's CSS size (capped DPR); returns true when it changed */
  fit(cv, maxDpr){
    const r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio||1, maxDpr||2);
    const w = Math.max(1, Math.round(r.width*d)), h = Math.max(1, Math.round(r.height*d));
    if(cv.width !== w || cv.height !== h){ cv.width = w; cv.height = h; return true; }
    return false;
  },
  /* bind a <input type=range> to an object key with a live <output> */
  slider(id, obj, key, fmt){
    const el = document.getElementById(id), out = document.querySelector('output[for="'+id+'"]');
    const show = () => { if(out) out.textContent = fmt ? fmt(obj[key]) : obj[key]; };
    el.value = obj[key]; show();
    el.addEventListener('input', () => { obj[key] = parseFloat(el.value); show(); });
    return el;
  },
  /* segmented button group: data-v on each button */
  seg(id, initial, onPick){
    const box = document.getElementById(id);
    const set = v => { box.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === String(v)))); };
    box.addEventListener('click', e => { const b = e.target.closest('button'); if(!b) return; set(b.dataset.v); onPick(b.dataset.v); });
    set(initial);
    return set;
  },
  fullscreen(btnId, stage){
    const b = document.getElementById(btnId);
    if(!stage.requestFullscreen){ b.hidden = true; return; }
    b.addEventListener('click', () => document.fullscreenElement ? document.exitFullscreen() : stage.requestFullscreen());
  },
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  /* only animate while the stage is on screen and the tab is visible */
  visibleLoop(stage, frame){
    let on = true, raf = 0;
    const tick = t => { raf = requestAnimationFrame(tick); frame(t); };
    new IntersectionObserver(es => { on = es[0].isIntersecting; if(on && !raf && !document.hidden) raf = requestAnimationFrame(tick); else if(!on){ cancelAnimationFrame(raf); raf = 0; } }).observe(stage);
    document.addEventListener('visibilitychange', () => { if(document.hidden){ cancelAnimationFrame(raf); raf=0; } else if(on && !raf) raf = requestAnimationFrame(tick); });
    raf = requestAnimationFrame(tick);
  },
  /* shared GLSL: value noise + Palette Synth's cosine gradient */
  NOISE: `
float hash13(vec3 p){ p = fract(p*0.1031); p += dot(p, p.zyx+31.32); return fract((p.x+p.y)*p.z); }
float vnoise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(hash13(i), hash13(i+vec3(1,0,0)), f.x), mix(hash13(i+vec3(0,1,0)), hash13(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(hash13(i+vec3(0,0,1)), hash13(i+vec3(1,0,1)), f.x), mix(hash13(i+vec3(0,1,1)), hash13(i+vec3(1,1,1)), f.x), f.y), f.z);
}
vec3 vnoise3(vec3 p){ return vec3(vnoise(p), vnoise(p+vec3(31.4,7.1,2.9)), vnoise(p+vec3(-5.3,19.7,11.1)))*2.0-1.0; }
float fbm(vec3 p){ float s=0.0, a=0.5; for(int i=0;i<5;i++){ s += a*vnoise(p); p = p*2.03+vec3(1.7,9.2,3.1); a *= 0.5; } return s; }
vec3 cosPal(float t, vec3 a, vec3 b, vec3 c, vec3 d){ return a + b*cos(6.2831853*(c*t+d)); }
`
};