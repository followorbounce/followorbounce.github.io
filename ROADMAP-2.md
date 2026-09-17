# followorbounce.github.io — Roadmap II: Beyond the Visual Synths

**Context:** `ROADMAP.md` (the original) is fully resolved — all five visual synths shipped, the shared knob/palette kit extracted, the §5 near-term wins done, the hub page built. This is a fresh, whole-site pass, not a continuation of that one: what's actually in the codebase today, what's drifted or inconsistent, and where the next concrete, buildable opportunities are — grounded in a full read of every page, not a guess at what might be there.

---

## 1. Housekeeping

- ✅ **`llms.txt` was stale — fixed in this pass.** It still described the pre-reorg nav (a "Technology — Blockchain Infrastructure" section that no longer exists, one undifferentiated "Instruments" list instead of the current Instruments/Audio synth/Video synth split, no mention of four of the five visual synths or the hub, and three already-published Philosophy essays mislabeled "(planned)"). Now matches `index.html`.
- ✅ **`password-generator.html` was the only page on the site (of 23 checked) without the Google Analytics snippet.** Decided: added, matching every other page.
- **`_llm_code_req`** — a 0-byte file at the repo root. It's not stray cruft: git history shows it was deliberately emptied in a commit titled "Close out P0s: surface hidden Instruments, relink Philosophy, clear scratch note." Reads like a personal scratch file for handing task requests to an LLM assistant between sessions, currently empty because whatever was in it got done. Flagging only so it isn't mistaken for garbage and deleted.

---

## 2. Site-wide tech inventory

| Capability | Files | Notes |
|---|---|---|
| WebGL | 1 (`mediaservers-shaders.html`) | The only fragment shader on the entire site — the plasma demo Palette Synth's "Plasma" preset already reproduces in JS/Canvas 2D |
| Real microphone input (`getUserMedia`) | 2 (`audio-reactive-diffusion.html`, `radio-communications.html`) | Both from the last pass; same proven pattern (opt-in button, synthetic default, graceful denial) |
| Web Audio (non-mic) | 7 | Patch Bay, Signal Chain, Music-Mathematics, Media Servers, Additive Wave Sculptor, plus the two mic-capable pages above |
| Client-side crypto (`crypto.subtle`) | 1 (`blockchain-infrastructure.html`) | Real SHA-256 hashing and ECDSA sign/verify, not simulated |
| Canvas 2D | 13 | The dominant rendering technique on the site by a wide margin |
| Range sliders (`<input type=range>`) | 9 | |
| Oscilloscope / spectrum-bar drawer (`AnalyserNode` → canvas) | 6 independent implementations | See §3 — this is new information the original roadmap didn't have |

No other hidden WebGL, no other real-mic instrument, no second crypto demo — the site's technical surface is exactly as wide as it looks from these single instances.

---

## 3. A second deduplication opportunity: the oscilloscope/spectrum drawer

The knob widget and palette formula weren't the only things quietly duplicated. The `AnalyserNode` → canvas draw loop (`getByteTimeDomainData`/`getByteFrequencyData`, clear canvas, draw) is implemented **independently six times**: `patch-bay.html`, `signal-chain.html`, `music-mathematics.html`, `mediaservers.html`, `audio-reactive-diffusion.html`, `radio-communications.html`. The original roadmap only knew about the first two.

Unlike the knob widget (byte-identical in 4 of 5 files), these six are **not** identical — each has its own chrome, colors, and canvas dimensions suited to its page. That makes this a real design call, not a mechanical lift-and-share:

- **Option A — leave it.** Six essay/instrument pages, six independently-tuned visualizations. Consistent with "every page stands alone."
- **Option B — extract just the draw function**, parameterized by `(canvas, analyser, mode, color)`, the same way `visual-synth-kit.css` parameterized knob size and label width with custom properties instead of forcing one look. Each page keeps its own surrounding markup/CSS; only the inner "read the analyser, paint the canvas" loop moves to a shared file.

**Recommendation: B, once a third page needs a genuinely new draw mode** (like the spectrum-bar toggle Patch Bay and Signal Chain just got) — that's the same "wait for the third repetition" logic the original roadmap used for the knob kit, and it held up well there.

---

## 4. New instrument ideas, grounded in existing precedent

### 4.1 Vectorscope — a real audio-reactive Lissajous instrument
**What:** Feed real stereo audio into the Lissajous Plotter's exact XY-plot engine — left channel to one `AnalyserNode`, right channel to another, `getByteTimeDomainData` from each mapped straight to (x, y) instead of two synthesized sine sums. This is a real audio vectorscope, the instrument recording studios and broadcast trucks use to check stereo phase — turn any music or mic input into a live Lissajous figure, trail-colored exactly the way the plotter already colors it.
**Reuses:** the Lissajous Plotter's canvas/trail-rendering code verbatim; the mic-opt-in-with-synthetic-default pattern proven in Audio-Reactive Diffusion and the Radio Communications waterfall; Palette Synth's color engine (already driving the trail).
**Net-new:** swapping the two synthesized axes for two real audio channels — a sixth member of the visual-synth family, and the second instrument (after Audio-Reactive Diffusion) to actually bridge live audio into a "video synth."
**Effort:** small–medium — the hard part (the renderer) already exists and works.

### 4.2 Nature of Time — an essay+instrument pairing, not just an essay
Every technical essay on this site pairs prose with at least one live demo — Universal Waves, Music Is Mathematics, Radio Communications, both Media Servers pages, the Machinery Blueprint. "Nature of Time" is currently a bare "Soon" tag with no page at all. Building it as prose-only would break that pattern; building it to match it means an essay on relativistic time (dilation, the twin paradox, light cones, simultaneity) paired with a small live instrument — a Lorentz-factor calculator (one velocity slider, dilated-time readout) and/or a draggable 2D light-cone/worldline diagram.
**Reuses:** the site's existing chapter shell (kicker/lede/chapter, already in `field-manual.html` and `universal-waves.html`); the range-slider pattern already in 9 files.
**Net-new:** the relativity math and the light-cone diagram — both genuinely new to the site.
**Effort:** medium — real writing plus one new small interactive, no new UI system required.

### 4.3 Cryptography Lab hub
Password Generator (Web Crypto, BIP-39) and Blockchain Infrastructure's Live Cryptography Demo (SHA-256, ECDSA) are both real, working crypto tools that currently read as unrelated entries under "Instruments." A small hub — same pattern as the dictionary pair and `visual-synths/` — would frame them as one applied-cryptography family. Worth adding one more cheap, real demo alongside them: a hash-avalanche visualizer (flip one input bit, watch the SHA-256 output scatter), which needs nothing beyond the `crypto.subtle` hashing already proven in `blockchain-infrastructure.html`.
**Effort:** small for the hub alone; small–medium with the avalanche visualizer.

### 4.4 WebGL rewrites — ✅ done
Was carried over from `ROADMAP.md` §4.3/§4.4: porting Reaction-Diffusion and the Fractal Mapper from CPU canvas loops to real fragment shaders. Both now ship as WebGL — the Fractal Mapper as a straightforward per-pixel escape-time shader, Reaction-Diffusion as a ping-pong pair of shaders simulating the PDE on two textures. Built without a browser/GPU available to test in, so the JS control flow around them is verified (mocked-WebGL harness, every interactive path) but the GLSL itself is manually reviewed rather than compiler-checked — worth a live look once pushed.

---

## 5. Content debt (writing, not code)

Lower priority for an "implementation" roadmap, but worth naming so it isn't lost:

- **Philosophy → Nature of Time**: proposed above as an essay+instrument pair, not a content-only task.
- **Philosophy → Ethics**: pure essay, no obvious interactive pairing yet — genuinely just writing.
- **Personal → Notes, Travel Stories, Ideas, Books & References, Archive**: five placeholders, all personal content, none code-shaped.
- **Personal → Useful Tools**: the one placeholder in this group that's actually cheap and code-shaped right now — a curated links page pointing at tools already built elsewhere on the site (Password Generator, the Cryptography Lab if built, the visual synths). No new writing, no new interactivity, just an index.
- **Radio & Electronics → Experiments & Observations**: a lab-notebook page; could reuse the `field-manual.html` chapter shell rather than invent new structure.

---

## 6. Suggested sequencing

| Order | Item | Why here |
|---|---|---|
| 1 | ✅ Decide the `password-generator.html` GA question | Done — added, matching every other page |
| 2 | Personal → Useful Tools | Cheapest real content gap to close; no new code or writing, just curation |
| 3 | Vectorscope (§4.1) | Smallest-effort new instrument; the renderer already exists |
| 4 | Cryptography Lab hub (§4.3) | Small; consolidates two things that already exist |
| 5 | Nature of Time essay + instrument (§4.2) | Medium effort, but fills a real content gap the "Soon" tag has been carrying |
| 6 | Oscilloscope/spectrum-drawer kit (§3) | Revisit once a third page needs a new scope mode, per the "third repetition" rule |
| 7 | ✅ WebGL rewrites (§4.4) | Done — see §4.4 |

---

## 7. Where things live once built

- If the Vectorscope (§4.1) ships, it's a sixth card on `/visual-synths/` and a sixth entry under `index.html`'s "Video synth" category, cross-linked from the Lissajous Plotter's footer the way every other family member already is.
- If the Cryptography Lab (§4.3) ships, it's a new `crypto-lab/index.html` hub matching the `dictionary-of-design/`/`visual-synths/` pattern, cross-linked from "Instruments" the way `machinery/` and `aerospace/` already are.
- If Useful Tools (§5) ships, it slots directly into the existing "Personal" category in `index.html` — no new structure needed, just replacing one `Soon` tag with a real link.

---

---

## 8. Knowledge Network Engine — done (indexing) / Phase 2 open (content migration)

**2026-09-17 — done**: built `engine/build_network.py`, a re-runnable Python script that reads the content manifests already maintained by each sibling repo (`aerospace/pages.json`, `Maya-Calendar/pages.json`, `machinery/data/graph.json`) plus this repo's own `engine/own-pages.json`, normalizes all four into one schema, writes `engine/network-graph.json`, and regenerates this repo's `index.html` from it — real stats in the hero (112 pages / 4 repos, computed, not hardcoded), a live cross-network search box, and per-hub "browse all N" disclosures for aerospace (46), machinery (31), and Maya-Calendar (7). The previous hand-maintained `index.html` is preserved at `old/index.html`. Every one of the 112 links was verified to resolve to a real file before shipping (caught and fixed one real bug: aerospace's `time-philosophy/` directory-index slug needs different URL construction than its `.html`-file slugs).

**Phase 2 — explicitly not done, and not started**: this engine only *indexes* aerospace's ~45 and Maya-Calendar's 8 articles — it does not regenerate their actual page content. Both repos remain hand-authored HTML with duplicated per-page boilerplate. Migrating them onto a shared build-pipeline/template system (the way `machinery/build.py` already generates its own pages from data) is a separate, larger undertaking: each article carries bespoke interactive JS/SVG (pianos, harmonic simulators, oscilloscopes, waterfall displays) that a generic template can't safely auto-convert — doing this faithfully means designing a content-spec schema that can still carry fully custom per-page interactive blocks (similar to how `machinery`'s own concept pages already mix generated shell + hand-authored interactive functions), then porting each article one at a time with the same QA rigor (Selenium, real PointerEvents, mobile-width checks) every other page on this site has had. Not scheduled; re-run `engine/build_network.py` as new pages are added to any of the four repos in the meantime.

---

*This file is a working plan, not a commitment — treat effort sizes as relative to each other, not calendar estimates. Rows 1 and 7 of §6 are done; §3, §4.1–4.3, and §5 have not been built yet. §8's indexing engine is done; its Phase 2 content migration is open.*
