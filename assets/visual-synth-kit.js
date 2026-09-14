/* ===================== Visual Synth Kit =====================
   Shared pieces reused across the visual-synth family — Palette Synth,
   Additive Wave Sculptor, Lissajous Plotter, Audio-Reactive Diffusion,
   and the Complex-Plane Fractal Mapper. Extracted once the duplication
   across all five became concrete rather than hypothetical (each page
   carried its own byte-identical copy of the knob widget, and four of
   the five duplicated the cosine-gradient color formula too) — see
   ROADMAP.md §2 for the history of that decision.

   Exposed as a single global, VisualSynthKit, since these pages are
   plain <script> tags with no bundler. Load this file before a page's
   own inline <script>. Pair with visual-synth-kit.css for the knob's
   styling — the JS alone only wires behavior onto elements the page's
   own markup and CSS already provide (.knob > .ind, a sibling .kval).

   Deliberately NOT included here: Patch Bay's and Signal Chain's own,
   separate knob implementation. It predates this family, has a
   different API (data-attributes, log-scale support, a big param
   dispatch table) and powers already-shipped, working audio instruments
   — merging it into this kit would be a larger, separate refactor with
   real regression risk for uncertain benefit, not a rename. */
(function(global){
'use strict';

/* ===================== knob widget =====================
   Dual knob/range-slider control: a draggable round knob for pointer
   devices, and a native range input (CSS-swapped in under
   @media(pointer:coarse), see visual-synth-kit.css) for touch, since a
   vertical-drag gesture is unreliable on a touchscreen. Both stay in
   sync because setVal() drives both.

   decimals controls the knob's live-readout precision (kval.textContent)
   — most instruments show 2 decimal places, but Audio-Reactive
   Diffusion's feed/kill rates (values like 0.0545) need 3; default
   preserves the original behavior for every other caller. */
function initKnob(el, min, max, defaultVal, onChange, decimals){
  decimals = decimals===undefined ? 2 : decimals;
  var val = defaultVal;
  var ind = el.querySelector('.ind');
  var kval = el.parentNode.querySelector('.kval');
  var range = document.createElement('input');
  range.type='range'; range.className='krange'; range.min='0'; range.max='1'; range.step='0.001';
  el.insertAdjacentElement('afterend', range);

  function toT(v){ return (v-min)/(max-min); }
  function toAngle(v){ return -135 + toT(v)*270; }
  function render(){
    ind.style.transform = 'rotate('+toAngle(val)+'deg)';
    kval.textContent = val.toFixed(decimals);
    range.value = toT(val);
  }
  function setVal(v){
    v = Math.min(max, Math.max(min, v));
    val = v; render(); onChange(val);
  }
  range.addEventListener('input', function(){
    setVal(min + parseFloat(range.value)*(max-min));
  });
  var dragging=false, startY=0, startVal=0;
  el.addEventListener('pointerdown', function(e){
    dragging=true; startY=e.clientY; startVal=val; el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', function(e){
    if(!dragging) return;
    setVal(startVal + ((startY-e.clientY)/150)*(max-min));
  });
  ['pointerup','pointercancel'].forEach(function(evt){ el.addEventListener(evt, function(){ dragging=false; }); });
  render(); onChange(val);
  el._setVal = setVal;
  return el;
}

/* ===================== cosine-gradient color engine =====================
   color(t)[i] = a[i] + b[i] * cos( 2*PI * (c[i]*t + d[i]) ), one triple
   of coefficients per channel — Inigo Quilez's cosine gradient palette.
   Palette Synth's own About section has the full explanation; this is
   the exact formula, generalized to a pure function of a {a,b,c,d}
   coefficient object instead of Palette Synth's live per-channel knob
   state, since every other consumer just needs the finished color. */
function paletteColor(pal, t){
  var out = [0,0,0];
  for(var i=0;i<3;i++){
    var v = pal.a[i] + pal.b[i]*Math.cos(2*Math.PI*(pal.c[i]*t + pal.d[i]));
    out[i] = Math.max(0, Math.min(255, Math.round(v*255)));
  }
  return out;
}

/* The six named coefficient sets Palette Synth shipped with. Every
   other instrument that colors something with this formula reads them
   from here instead of keeping its own copy — before this, two
   independent copies had already drifted apart (one had "Plasma"
   annotated "(Media Servers II)", the other didn't). */
var PALETTES = [
  {name:'Plasma',  a:[.5,.5,.5],   b:[.5,.5,.5],   c:[1,1,1],    d:[0,.33,.67]},
  {name:'Sunset',  a:[.6,.4,.3],   b:[.4,.3,.2],   c:[1,1,1],    d:[0,.15,.3]},
  {name:'Ocean',   a:[.3,.45,.55], b:[.25,.3,.35], c:[1,1.5,2],  d:[.5,.6,.7]},
  {name:'Forest',  a:[.35,.4,.25], b:[.3,.35,.2],  c:[1,1,1],    d:[.1,.3,.15]},
  {name:'Neon',    a:[.5,.5,.5],   b:[.5,.5,.5],   c:[2,3,1],    d:[0,.2,.5]},
  {name:'Mono',    a:[.5,.5,.5],   b:[.4,.4,.4],   c:[1,1,1],    d:[0,0,0]}
];
function getPalette(name){
  for(var i=0;i<PALETTES.length;i++){ if(PALETTES[i].name===name) return PALETTES[i]; }
  return null;
}

global.VisualSynthKit = {
  initKnob: initKnob,
  paletteColor: paletteColor,
  PALETTES: PALETTES,
  getPalette: getPalette
};

})(window);
