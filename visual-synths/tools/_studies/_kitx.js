/* ---- kit extras for the 2026-10 studies: render targets, passes, opt-in sound ---- */
const GLX = {
  /* full-screen triangle VAO, attribute 0 */
  quad(gl){
    const vao = gl.createVertexArray(), b = gl.createBuffer();
    gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    return vao;
  },
  VS: `#version 300 es
layout(location=0) in vec2 aPos; out vec2 vUv;
void main(){ vUv = aPos*0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`,
  /* a colour target; half-float when the device can render to it, else 8-bit */
  target(gl, w, h, opts){
    opts = opts || {};
    const hf = !opts.byte && (GLX._hf === undefined ? (GLX._hf = !!gl.getExtension('EXT_color_buffer_float')) : GLX._hf);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    if(hf) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const f = opts.nearest ? gl.NEAREST : gl.LINEAR, wrap = opts.repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return {tex, fb, w, h, free(){ gl.deleteTexture(tex); gl.deleteFramebuffer(fb); }};
  },
  /* two targets that swap: read .a, write .b, then swap() */
  pingpong(gl, w, h, opts){
    const pp = {a:GLX.target(gl, w, h, opts), b:GLX.target(gl, w, h, opts), w, h};
    pp.swap = () => { const t = pp.a; pp.a = pp.b; pp.b = t; };
    pp.free = () => { pp.a.free(); pp.b.free(); };
    return pp;
  },
  /* draw a full-screen pass into target (or the screen when null); tex = {unit: texture} */
  pass(gl, vao, prog, target, w, h, tex){
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fb : null);
    gl.viewport(0, 0, w, h);
    gl.useProgram(prog.p);
    let unit = 0;
    for(const name in (tex || {})){ gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex[name]); gl.uniform1i(prog.u[name], unit); unit++; }
    gl.bindVertexArray(vao); gl.drawArrays(gl.TRIANGLES, 0, 3);
  },
  /* opt-in sound: created on the first click that asks for it; master -> limiter -> out */
  audio(){
    if(GLX._ac) return GLX._ac;
    const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return null;
    const ac = new AC(), lim = ac.createDynamicsCompressor(), master = ac.createGain();
    lim.threshold.value = -6; lim.knee.value = 4; lim.ratio.value = 20; lim.attack.value = 0.003; lim.release.value = 0.2;
    master.gain.value = 0.0; master.connect(lim); lim.connect(ac.destination);
    master.gain.setTargetAtTime(0.8, ac.currentTime, 0.2);
    // iOS: a silent buffer started inside the tap unlocks output
    const s = ac.createBufferSource(); s.buffer = ac.createBuffer(1, 1, 22050); s.connect(ac.destination); s.start(0);
    if(ac.state === 'suspended') ac.resume();
    GLX._ac = {ac, master};
    return GLX._ac;
  },
  /* a toggle button for sound: onStart(audio) builds the voices once, then the button mutes/unmutes */
  soundButton(id, onStart){
    const b = document.getElementById(id); let on = false, built = false;
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => {
      const A = GLX.audio(); if(!A){ b.textContent = 'No sound'; b.disabled = true; return; }
      if(!built){ onStart(A); built = true; }
      on = !on; b.setAttribute('aria-pressed', String(on));
      if(A.ac.state === 'suspended') A.ac.resume();
      A.master.gain.setTargetAtTime(on ? 0.8 : 0.0, A.ac.currentTime, 0.08);
    });
    return () => on;
  },
  /* flashing guard: brightness may jump at most 3 times a second (WCAG 2.3.1) */
  flashGuard(){ let last = -1; return now => { if(now - last >= 334){ last = now; return true; } return false; }; }
};

/* ---- museum helpers for the aerospace pieces ---- */
const MUSEUM = {
  css(name, fb){ const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fb; },
  /* a small 2D plot: frame(x0,x1,y0,y1,{xlab,ylab,xticks,yticks,logy}) then line/marker calls in data units */
  plot(cv){
    const ctx = cv.getContext('2d'), P = {cv, ctx, pad:{l:46, r:12, t:10, b:26}};
    P.frame = (x0, x1, y0, y1, o) => {
      o = o || {};
      const d = Math.min(window.devicePixelRatio || 1, 2), r = cv.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width*d)), h = Math.max(1, Math.round(r.height*d));
      if(cv.width !== w || cv.height !== h){ cv.width = w; cv.height = h; }
      ctx.setTransform(d, 0, 0, d, 0, 0); P.W = r.width; P.H = r.height;
      Object.assign(P, {x0, x1, y0, y1, logy:!!o.logy});
      const ink = MUSEUM.css('--ink', '#171613'), faint = MUSEUM.css('--ink-faint', '#8A877E'), line = MUSEUM.css('--line', '#DAD8D0');
      ctx.clearRect(0, 0, P.W, P.H);
      ctx.font = '10px "IBM Plex Mono", monospace'; ctx.lineWidth = 1;
      (o.yticks || []).forEach(v => { const y = P.Y(v); ctx.strokeStyle = line; ctx.beginPath(); ctx.moveTo(P.pad.l, y); ctx.lineTo(P.W - P.pad.r, y); ctx.stroke(); ctx.fillStyle = faint; ctx.textAlign = 'right'; ctx.fillText(o.yfmt ? o.yfmt(v) : v, P.pad.l - 5, y + 3); });
      (o.xticks || []).forEach(v => { const x = P.X(v); ctx.strokeStyle = line; ctx.beginPath(); ctx.moveTo(x, P.pad.t); ctx.lineTo(x, P.H - P.pad.b); ctx.stroke(); ctx.fillStyle = faint; ctx.textAlign = 'center'; ctx.fillText(o.xfmt ? o.xfmt(v) : v, x, P.H - P.pad.b + 13); });
      ctx.strokeStyle = ink; ctx.beginPath(); ctx.moveTo(P.pad.l, P.pad.t); ctx.lineTo(P.pad.l, P.H - P.pad.b); ctx.lineTo(P.W - P.pad.r, P.H - P.pad.b); ctx.stroke();
      ctx.fillStyle = faint; ctx.textAlign = 'right'; if(o.xlab) ctx.fillText(o.xlab, P.W - P.pad.r, P.H - 2);
      ctx.textAlign = 'left'; if(o.ylab) ctx.fillText(o.ylab, P.pad.l + 4, P.pad.t + 9);
      return P;
    };
    P.X = x => P.pad.l + (x - P.x0)/(P.x1 - P.x0)*(P.W - P.pad.l - P.pad.r);
    P.Y = y => { const f = P.logy ? (Math.log10(Math.max(y, 1e-30)) - Math.log10(P.y0))/(Math.log10(P.y1) - Math.log10(P.y0)) : (y - P.y0)/(P.y1 - P.y0); return P.H - P.pad.b - f*(P.H - P.pad.t - P.pad.b); };
    P.line = (pts, col, w, dash) => {
      ctx.save(); ctx.beginPath(); ctx.rect(P.pad.l, P.pad.t - 2, P.W - P.pad.l - P.pad.r + 2, P.H - P.pad.t - P.pad.b + 4); ctx.clip();
      ctx.strokeStyle = col; ctx.lineWidth = w || 1.5; ctx.setLineDash(dash || []); ctx.beginPath();
      let pen = false; for(const p of pts){ if(!isFinite(p[1])){ pen = false; continue; } const x = P.X(p[0]), y = P.Y(p[1]); if(pen) ctx.lineTo(x, y); else { ctx.moveTo(x, y); pen = true; } }
      ctx.stroke(); ctx.restore();
    };
    P.vline = (x, col, label) => { const X = P.X(x); if(X < P.pad.l - 1 || X > P.W - P.pad.r + 1) return; ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(X, P.pad.t); ctx.lineTo(X, P.H - P.pad.b); ctx.stroke(); ctx.setLineDash([]); if(label){ ctx.fillStyle = col; ctx.textAlign = X > P.W*0.7 ? 'right' : 'left'; ctx.fillText(label, X + (X > P.W*0.7 ? -4 : 4), P.pad.t + 20); } };
    P.hline = (y, col, label) => { const Y = P.Y(y); ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(P.pad.l, Y); ctx.lineTo(P.W - P.pad.r, Y); ctx.stroke(); ctx.setLineDash([]); if(label){ ctx.fillStyle = col; ctx.textAlign = 'right'; ctx.fillText(label, P.W - P.pad.r - 2, Y - 4); } };
    P.dot = (x, y, col, label) => { const X = P.X(x), Y = P.Y(y); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X, Y, 3.5, 0, 6.2832); ctx.fill(); if(label){ ctx.textAlign = X > P.W*0.7 ? 'right' : 'left'; ctx.fillText(label, X + (X > P.W*0.7 ? -7 : 7), Y - 6); } };
    P.text = (x, y, s, col, align) => { ctx.fillStyle = col; ctx.textAlign = align || 'left'; ctx.fillText(s, P.X(x), P.Y(y)); };
    return P;
  },
  /* readout cells: rows = [[id, label, tag]] -> {id: {v, s}} handles; tag is 'data' | 'model' | 'drawn' */
  readouts(boxId, rows){
    const box = document.getElementById(boxId), out = {};
    const TAG = {data:'DATA', model:'MODEL', drawn:'DRAWN'};
    box.innerHTML = rows.map(r => `<div><div class="k"><span>${r[1]}</span>${r[2] ? `<span class="src-tag ${r[2]}" title="${r[2] === 'data' ? 'Measured or published values' : r[2] === 'model' ? 'Computed from a physical model' : 'Drawn for the eye, not computed'}">${TAG[r[2]]}</span>` : ''}</div><div class="v" id="ro-${r[0]}">–</div><div class="s" id="ros-${r[0]}"></div></div>`).join('');
    rows.forEach(r => { const v = document.getElementById('ro-' + r[0]), s = document.getElementById('ros-' + r[0]); out[r[0]] = {set(a, b){ if(v.textContent !== a) v.textContent = a; const bb = b || ''; if(s.textContent !== bb) s.textContent = bb; }}; });
    return out;
  },
  /* wall label toggle */
  label(btnId, cardId, on){
    const b = document.getElementById(btnId), c = document.getElementById(cardId);
    const set = v => { c.classList.toggle('on', v); b.setAttribute('aria-pressed', String(v)); };
    b.addEventListener('click', () => set(!c.classList.contains('on'))); set(!!on);
    return set;
  },
  /* installation mode: full screen, hidden cursor, wall label on, onTick(seconds) every second while running */
  install(btnId, stage, onStart, onTick, onStop){
    const b = document.getElementById(btnId); let timer = 0, t0 = 0, on = false;
    const stop = () => { if(!on) return; on = false; clearInterval(timer); stage.classList.remove('installing'); b.setAttribute('aria-pressed', 'false'); if(onStop) onStop(); };
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => {
      if(on){ stop(); if(document.fullscreenElement) document.exitFullscreen(); return; }
      on = true; t0 = performance.now(); stage.classList.add('installing'); b.setAttribute('aria-pressed', 'true');
      if(stage.requestFullscreen) stage.requestFullscreen().catch(() => {});
      if(onStart) onStart();
      timer = setInterval(() => onTick && onTick((performance.now() - t0)/1000), 1000);
    });
    document.addEventListener('fullscreenchange', () => { if(!document.fullscreenElement) stop(); });
    return () => on;
  },
  fmt(x, d){ return Number(x).toLocaleString('en-GB', {minimumFractionDigits:d, maximumFractionDigits:d}); },
  /* scientific notation with superscript exponent: 1.3 × 10⁻⁶ */
  sci(x, d){ if(!isFinite(x) || x === 0) return String(x); const e = Math.floor(Math.log10(Math.abs(x))), m = x/Math.pow(10, e), SUP = {'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'}; return m.toFixed(d === undefined ? 1 : d) + ' × 10' + String(e).split('').map(c => SUP[c]).join(''); }
};
