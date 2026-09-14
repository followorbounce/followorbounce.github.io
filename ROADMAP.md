# followorbounce.github.io — New Services & Instruments Roadmap

**Focus of this pass:** not a general content audit (see the earlier "Knowledge Network Audit" if you still have that artifact) — this is specifically about *new, buildable tools*, centered on the request for a family of **visual synthesizers**: instruments where wave shape, color, and geometric form are transformed live through math functions, in the same spirit as Patch Bay and Signal Chain but visual instead of (or in addition to) audio.

Everything below is grounded in what's actually already in the codebase — a full technical pass through the rendering/math code on every page, not a guess at what might be there.

---

## 1. What's already in the codebase (the substrate to build on)

| Capability | Where it lives now | Technique |
|---|---|---|
| **Only shader on the site** | `mediaservers-shaders.html` — plasma canvas | Raw WebGL, one fullscreen quad, fragment shader sums 4 phase-shifted `sin()` terms into a scalar, maps it to RGB via **three sine waves 120° apart** — a real, reusable phase→color function |
| **Slider → GPU uniform** | same plasma canvas | Two `<input type=range>` sliders write straight into `u_speed`/`u_scale` uniforms every frame — proven pattern for any future shader instrument |
| **Sum-of-sines wave geometry** | same page — Gerstner ocean | `gerstner(x0,y0,n,steep)`: textbook trochoidal wave sum, slider-controlled wave count and steepness, isometrically projected — real precedent for parametric wave-form instruments |
| **Reaction-diffusion PDE** | same page | Gray-Scott `reaction = a*b*b` step over a pixel grid — currently a fixed demo inside an essay, not a playable instrument |
| **2-wave interference/sum** | `universal-waves.html` mixer canvas | Two independent sine sliders, third trace draws their literal sum — direct precedent for additive/Fourier synthesis, just capped at 2 harmonics |
| **Radial damped wave** | `universal-waves.html` | `sin(dist·0.08 − t)·exp(−dist/260)` — expanding ripple, a start toward Lissajous/radial-form instruments |
| **Time-domain oscilloscope** | Patch Bay, Signal Chain, Music-Mathematics | Identical `AnalyserNode` + `getByteTimeDomainData` pattern, duplicated three times |
| **Frequency-bar spectrum** | Music-Mathematics only | The *only* real FFT bar graph on the site (`getByteFrequencyData`, fftSize 2048) — neither synth has this |
| **Scrolling waterfall** | `radio-communications.html` | `drawImage` self-shift + `putImageData` new row — clean technique, but fed **simulated**, not real, data |
| **Audio → color mapping** | `mediaservers.html` particle demo | One literal `hsl(200+treble, 70%, 60%)` string — the only place bass/treble drives hue |
| **Drag-to-transform geometry** | `mediaservers.html` corner-pin warp | Bilinear-interpolated 4-corner drag warp — real precedent for a 2D-pad control instead of two sliders |

**The gap that matters most for "color transformation through math functions":** there is effectively **no color engine** on the site. One hardcoded HSL string and one sine-phase RGB formula are the entire precedent. This is the single biggest opportunity — see §3.

**Architectural fact that shapes every recommendation below:** every page on this site is a fully self-contained single `.html` file. `/assets/` holds only `favicon.svg`. Nothing is shared across pages today — confirmed with no exceptions. That convention is a deliberate strength (any page can be read, forked, or deleted in isolation) and the recommendations below respect it, with one proposed exception (§2).

---

## 2. Infrastructure decision to make before building the first instrument

Building "a bunch" of related visual synths will duplicate the same three things across every file: a knob/slider UI (already duplicated once, between Patch Bay and Signal Chain — a third and fourth copy starts to smell), canvas/WebGL boilerplate, and — once it exists — the color-palette engine from §3.

**Two honest options, not a foregone conclusion:**

- **A — Stay fully self-contained** (current convention, zero exceptions). Each new synth duplicates its own knob component and color function. Costs a few hundred lines of repetition per instrument; keeps every file independently forkable/deletable, which has real value on a personal site meant to be legible file-by-file.
- **B — Introduce one shared file**, e.g. `/assets/visual-synth-kit.js` (+ optional `.css`), holding: the knob/slider dual-control component (lifted and generalized from Patch Bay/Signal Chain, which already implement it twice, nearly identically), the cosine-palette color function (§3), and a small canvas/WebGL setup helper. This is the site's first cross-page shared asset — a deliberate, narrow exception, justified because this specific family of pages (unlike the essay pages, which have no reason to share anything) is genuinely one thing built four-to-six times.

**Recommendation: B, scoped narrowly.** Not a general component library — just the three things that would otherwise be copy-pasted verbatim. If it ever needs a fourth thing, that's a signal to reconsider, not a green light to keep growing it. This is a call worth making deliberately rather than defaulting into either option mid-build.

**Status:** ✅ resolved — option B, built. `/assets/visual-synth-kit.js` + `/assets/visual-synth-kit.css` now hold the knob/range-slider dual control and the cosine-gradient color function + its six named palettes; all five §4 instruments load the shared file and call `VisualSynthKit.initKnob`/`.paletteColor`/`.getPalette` instead of carrying their own copies. Net effect: -314 lines across the five instrument pages. Not included: a canvas/WebGL setup helper (recommendation B's third item) — no instrument uses WebGL yet (see §4.3/§4.4's still-open status), so there's nothing concrete to extract; add it if/when that changes, not before. Also deliberately left alone: Patch Bay's and Signal Chain's own, separate, older knob implementation (data-attributes, log-scale support, a param-dispatch table) — a different API powering already-shipped audio instruments, and folding it in would be a larger, riskier refactor than this pass, not a rename.

Two real per-page differences survived the extraction rather than being flattened: knob size (38px on Lissajous Plotter and the Fractal Mapper vs. the kit's 40px default, for denser knob layouts) and touch-mode label width/alignment (60px centered on Audio-Reactive Diffusion and the Fractal Mapper vs. 52px left-aligned, for longer labels like "bass→feed"). Both are exposed as CSS custom properties (`--knob-size`, `--knob-ind-h`, `--knob-ind-origin`, `--klabel-align`, `--klabel-width`) with the common values as defaults, overridden per page only where needed — sharing the mechanism without forcing one-size-fits-all.

---

## 3. The color engine (build this first, it unlocks everything else)

The standard, elegant technique for "any parameter → a good-looking color" in creative coding — and currently absent from this site — is Inigo Quilez's **cosine gradient palette**:

```
color(t) = a + b · cos( 2π · (c·t + d) )   — computed per channel (R,G,B)
```

Four small vectors (`a,b,c,d`, one triplet each) define an entire smooth, cyclical palette family; the plasma shader's "three sines 120° apart" is actually a special case of exactly this formula. Generalizing it into one small function — usable from both Canvas 2D (JS) and WebGL (GLSL, same formula) — gives every future instrument a consistent, good-by-construction way to turn a math parameter into color, instead of each one improvising its own `hsl()` string.

**Recommended first deliverable:** a standalone **Palette Synth** — knobs for the `a/b/c/d` coefficients (or a curated preset list plus a "randomize" button, matching Patch Bay/Signal Chain's existing randomize convention), rendered as a live gradient strip plus the formula's live curve per channel. Small, fast to build, immediately useful as both an instrument in its own right and the proving ground for the shared palette function before four other instruments depend on it.

---

## 4. The visual synth suite

Four instruments, each anchored in a distinct mathematical family, each mapping to one of "wave / color / form":

### 4.1 Fourier / Additive Wave Sculptor — *wave* ✅ shipped (`/additive-wave-sculptor`)
**What:** Generalizes `universal-waves.html`'s 2-wave mixer to N harmonics (8–16). One knob-pair per harmonic (amplitude, phase), live-drawn resultant waveform, and — this is the new part — the resultant is also playable as real audio via `OscillatorNode` + a custom `PeriodicWave` built from the same harmonic coefficients, so the shape you sculpt is the sound you hear.
**Reuses:** the mixer's sum-of-sines math directly; the knob component from §2 (duplicated, not shared — see §2 status).
**Net-new:** N-harmonic generalization (8 harmonics); audio playback of the sculpted waveform (built); color engine applied to the waveform trace via spectral centroid (built).
**Effort:** small–medium. **Fit:** direct extension of "Music Is Mathematics" — not yet cross-linked from that page.

### 4.2 Lissajous / Harmonograph Synth — *form* ✅ shipped (`/lissajous-plotter`)
**What:** Two independent two-term sine sums (reusing 4.1's harmonic-sum engine, not the original 2-slider mixer) plotted against each other as (x,y), plus a harmonograph-style amplitude-decay knob so the curve settles like a real pendulum-drawn figure. Trail is colored by sweeping once through the palette gradient from oldest to newest point (bucketed into 48 segments, not a per-pixel gradient).
**Reuses:** knob component (duplicated); palette engine (duplicated, Plasma coefficients).
**Net-new:** the whole 2D parametric engine, built.
**Effort:** small–medium, pure Canvas 2D, no shader required — matched the estimate.

### 4.3 Cymatics / Reaction-Diffusion Synth — *wave + form, audio-reactive* ✅ shipped as CPU canvas (`/audio-reactive-diffusion`)
**What:** Takes the existing Gray-Scott reaction-diffusion code out of its essay-page demo and turns it into a real instrument, with a genuinely new capability: bass/treble from a real `AnalyserNode` (mic, opt-in) or a built-in synthetic source bend the feed/kill rates live, and loud transients inject fresh chemical seeds. Colored via the palette engine (Ocean coefficients) instead of the original demo's fixed tint.
**Reuses:** the Gray-Scott step function verbatim; its own Web Audio graph, built.
**Net-new:** real audio-reactivity, built (§4.3's audio-reactive requirement is met; done as feed/kill/seed modulation rather than the cymatics/Chladni framing originally described).
**Effort:** medium in practice — **still runs as a CPU canvas loop, not a shader.** The WebGL port this section recommended for performance headroom at higher grid resolution was not done; current 120×120 grid is fine at its own resolution but the perf ceiling this section flagged is still there, unaddressed.

### 4.4 Complex-Plane Mapper — *form* ✅ shipped as CPU canvas (`/complex-fractal-mapper`)
**What:** A Mandelbrot/Julia explorer (generalized to `z → z^power + c`, not fixed at power 2). Dragging directly on the picture pans the view (Mandelbrot mode) or sets the complex parameter `c` to the point under the pointer (Julia mode) — the 2D-pad interaction this section called for, generalized from the corner-pin drag as intended — alongside, not instead of, View/Fractal knobs. Palette engine colors escape-iteration count.
**Reuses:** the corner-pin drag math generalized to one point, done, but as a plain pointer handler over a CPU-computed field, not driving shader uniforms.
**Net-new:** escape-time math and the drag pad, both built.
**Effort:** medium in practice — **not built as a fragment shader.** It's a low-res grid (220×147) computed in JS then upscaled (the same trick used in §4.3), which stays responsive at this resolution but doesn't get the deep-zoom, high-iteration headroom a real shader would; the "site's second fragment shader" this section anticipated hasn't been written.

---

## 5. Smaller, near-term wins outside the visual-synth suite

- ✅ **Add a spectrum-bar mode to Patch Bay's and Signal Chain's existing scopes.** Done — a "Scopes: Wave/Spectrum" transport button on each toggles every scope between the original oscilloscope and a bar graph, reading `getByteFrequencyData` off the same `AnalyserNode` each scope already had (no new Web Audio wiring needed, exactly as this section predicted).
- ✅ **Make the Radio Communications waterfall real.** Done — an opt-in "Use Microphone" button swaps the synthetic per-row math for real `getByteFrequencyData` off a live mic `AnalyserNode`; the original synthetic signal is kept (relabeled "internal test signal") as the permission-free default, and the scrolling-canvas technique itself is untouched, as this section anticipated.
- ✅ **Cross-link Patch Bay ↔ Signal Chain ↔ visual synths.** Done — both audio synths' footers now link to `/visual-synths/`, and the hub already linked back to both.

---

## 6. Suggested sequencing

| Order | Build | Why here | Status |
|---|---|---|---|
| 1 | Palette Synth (`/palette-synth`) | Shipped. Shared-kit decision deferred (§2) — built self-contained | ✅ shipped |
| 2 | Fourier / Additive Wave Sculptor | Fastest genuinely-new instrument; strongest thematic tie to existing content | ✅ shipped, incl. audio playback |
| 3 | Lissajous / Harmonograph Synth | Pure Canvas 2D, no shader risk, high visual payoff for the effort | ✅ shipped |
| 4 | Spectrum-bar mode on Patch Bay + Signal Chain | Small, cheap, immediately useful polish | ✅ shipped |
| 5 | Cymatics / Reaction-Diffusion Synth | Medium-large; first real audio-reactive visual instrument | ✅ shipped, CPU canvas not WebGL |
| 6 | Complex-Plane Mapper | Largest effort, highest ceiling; benefits from having a second shader author's-worth of WebGL experience already banked from earlier steps | ✅ shipped, CPU canvas not WebGL |
| — | Real waterfall on Radio Communications | Independent of the above, can slot in anytime as a quick win | ✅ shipped |

All five §4 instruments shipped faster than sequenced (2–6 in one pass rather than incrementally), which is also why §2's "revisit at instrument #2" checkpoint got skipped — there was no natural pause between them to make that call, and it's still open. §4's spectrum-bar mode and the real waterfall (originally deferred because "nothing in the visual-synth work touched those files") were picked up in a later pass specifically to close that gap. §7's hub page is also now built.

## 7. Where this lives in the site once built

✅ **Done.** `visual-synths/index.html` — a card grid (title, one-line description, small inline-SVG icon per instrument, following the same card pattern as `dictionary-of-design/`), cross-linked from `index.html`'s "Video synth" category as a `Hub`-tagged entry (matching the `machinery/`/`aerospace/` precedent) and from every instrument's own footer.

---

*This file is a working plan. Status as of the latest pass: all of §2, §4, §5, and §7 are shipped. The only thing still open is the §4.3/§4.4 WebGL rewrites this doc originally recommended for performance headroom — a bigger, riskier undertaking than anything else here, and not attempted.*
