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
