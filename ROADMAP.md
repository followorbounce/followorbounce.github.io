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

**Status:** deferred, deliberately. Palette Synth (§4, first shipped) was built fully self-contained instead — extracting a shared kit from a single consumer risks guessing the wrong shared interface (the classic "wait for the third repetition" rule). Revisit this decision when building the second visual synth (the Fourier Sculptor), where the knob-component and palette-function duplication will be concrete rather than hypothetical.

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

### 4.1 Fourier / Additive Wave Sculptor — *wave*
**What:** Generalizes `universal-waves.html`'s 2-wave mixer to N harmonics (8–16). One knob-pair per harmonic (amplitude, phase), live-drawn resultant waveform, and — this is the new part — the resultant is also playable as real audio via `OscillatorNode` + a custom `PeriodicWave` built from the same harmonic coefficients, so the shape you sculpt is the sound you hear.
**Reuses:** the mixer's sum-of-sines math directly; the knob component from §2.
**Net-new:** N-harmonic generalization; audio playback of the sculpted waveform; color engine applied to the waveform trace (hue cycling with harmonic content, not just a static stroke color).
**Effort:** small–medium. **Fit:** direct extension of "Music Is Mathematics" — arguably belongs cross-linked from that page.

### 4.2 Lissajous / Harmonograph Synth — *form*
**What:** Classic `x = A·sin(a·t+δ), y = B·sin(b·t)` parametric plotting, plus a harmonograph-style amplitude decay so the curve settles like a real pendulum-drawn figure rather than looping forever identically. Knobs: frequency ratio `a:b`, phase `δ`, decay rate. Trail fades using the palette engine (older points shift through the gradient, not just a flat alpha fade).
**Reuses:** the radial-ripple math's damped-sine pattern; knob component; palette engine.
**Net-new:** the whole 2D parametric engine — this is the site's first genuine "form through math" instrument, not an extension of an existing one.
**Effort:** small–medium, pure Canvas 2D, no shader required.

### 4.3 Cymatics / Reaction-Diffusion Synth — *wave + form, audio-reactive*
**What:** Takes the existing Gray-Scott reaction-diffusion code out of its essay-page demo and turns it into a real instrument, with a genuinely new capability: periodic perturbation of the diffusion grid driven by a **real** `AnalyserNode` reading either a built-in oscillator or the user's microphone — a live Chladni-plate/cymatics simulation where actual sound shapes the pattern, colored via the palette engine instead of the current demo's fixed look.
**Reuses:** the Gray-Scott step function verbatim; needs its own Web Audio graph (confirmed no cross-page audio hook exists to borrow).
**Net-new:** real audio-reactivity — currently nowhere on the site actually reads a live `AnalyserNode` into a visual parameter (the one existing audio→visual mapping in `mediaservers.html` drives a canned demo oscillator, not user input/mic).
**Effort:** medium–large — the most technically ambitious of the four, and the best candidate to justify the WebGL investment (a grid-based PDE runs far faster as a shader than as a per-pixel JS loop at any serious resolution).

### 4.4 Complex-Plane Mapper — *form*
**What:** A Julia-set-adjacent explorer where a draggable 2D pad (reusing the corner-pin warp's drag interaction, generalized to a single point instead of four) sets the complex parameter `c`, recomputed live as a fragment shader. Palette engine colors escape-iteration count instead of the usual harsh banded fractal palettes.
**Reuses:** the plasma shader's WebGL scaffolding (fullscreen quad, uniform-per-frame pattern) almost directly; the corner-pin drag math generalized down to one point.
**Net-new:** the site's second-ever fragment shader, and the only one doing per-pixel iterative math (escape-time) rather than closed-form wave math — meaningfully harder than the plasma shader, worth sequencing last.
**Effort:** medium–large; highest technical ceiling and the most visually striking if done well.

---

## 5. Smaller, near-term wins outside the visual-synth suite

- **Add a spectrum-bar mode to Patch Bay's and Signal Chain's existing scopes.** Both synths only ever draw time-domain oscilloscopes; Music-Mathematics already has the working FFT bar-graph code sitting right there to adapt. Cheap, reuses proven code, and both synths' Output modules already expose the right `AnalyserNode`.
- **Make the Radio Communications waterfall real.** It's currently explicitly-labeled simulated data. Swapping the synthetic signal for a real `AnalyserNode` (oscillator or mic input) turns an "illustrative" demo into an actual instrument, and the scrolling-canvas technique is already solid — this is substituting the data source, not rebuilding the renderer.
- **Cross-link Patch Bay ↔ Signal Chain ↔ (new) visual synths once they exist.** If the visual synth suite ships, it's the natural third leg of an "Instruments" cluster — worth a shared "try the audio synths too" footer link once there's more than one visual instrument live.

---

## 6. Suggested sequencing

| Order | Build | Why here |
|---|---|---|
| 1 | ✅ Palette Synth (`/palette-synth`) | Shipped. Shared-kit decision deferred (§2) — built self-contained |
| 2 | Fourier / Additive Wave Sculptor | Fastest genuinely-new instrument; strongest thematic tie to existing content |
| 3 | Lissajous / Harmonograph Synth | Pure Canvas 2D, no shader risk, high visual payoff for the effort |
| 4 | Spectrum-bar mode on Patch Bay + Signal Chain | Small, cheap, immediately useful polish |
| 5 | Cymatics / Reaction-Diffusion Synth | Medium-large; first real audio-reactive visual instrument |
| 6 | Complex-Plane Mapper | Largest effort, highest ceiling; benefits from having a second shader author's-worth of WebGL experience already banked from earlier steps |
| — | Real waterfall on Radio Communications | Independent of the above, can slot in anytime as a quick win |

## 7. Where this lives in the site once built

Once three or more visual synths exist, they outgrow being loose entries under "Instruments" (which already lists seven items). Precedent for handling this already exists on the site: the paired-dictionary "hub" pattern (`dictionary-of-design/`, `dictionary-of-inner-experience/`) proves that a dedicated index page for a growing family works well here. Recommend a `visual-synths/` hub once the count justifies it, cross-linked from "Instruments" the way `machinery/` and `aerospace/` already are.

---

*This file is a working plan, not a commitment — treat effort sizes as relative to each other, not calendar estimates. Nothing here has been built yet.*
