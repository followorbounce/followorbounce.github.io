# followorbounce.github.io — Knowledge Network

Personal index/hub site: essays, interactive experiments, media-server tooling, visual/audio synthesizers, and reference dictionaries, served from GitHub Pages root. **Note:** earlier memory summarized this repo as just "design-divine-future-dictionaries" — it is much larger; the two dictionaries are one corner of a full personal site.

## Structure
- **Architectural rule: every page is a fully self-contained single `.html` file at repo root.** `/assets/` holds only `favicon.svg` — nothing is shared across pages today (confirmed via full code pass, see `ROADMAP.md`). Respect this convention; don't introduce shared assets casually.
- `index.html` — the Knowledge Network hub/index.
- Essay/interactive pages at root: `field-manual.html`, `physics-of-spaceflight`-style deep dives, `music-mathematics.html`, `electronics.html`, `perception-illusions.html`, `radio-communications.html`, `blockchain-infrastructure.html`, etc.
- **Audio synth family:** `patch-bay.html`, `signal-chain.html`, `pulse-train.html` / `pulse-train-ii.html` / `pulse-train-stage.html` / `pulse-train-stage-ii.html` / `pulse-train-node-database.html` — each a standalone instrument; knob/slider UI is currently duplicated across them (see ROADMAP.md §2 for the shared-kit discussion).
- **Visual synth family** (newer): `additive-wave-sculptor.html`, `audio-reactive-diffusion.html`, `complex-fractal-mapper.html`, `lissajous-plotter.html`, `palette-synth.html`, `universal-waves.html`, `visual-synths/`.
- `dictionary-of-design/` and `dictionary-of-inner-experience/` — the two reference dictionaries (Design: 112 terms; Inner Experience: 77 terms), each an `index.html`.
- `node-based-development.html` — "Systems & Development" category: a 15-chapter field guide to node/visual programming, including a hand-rolled drag-and-connect node-graph playground (own self-contained engine, no shared assets).
- `ROADMAP.md` / `ROADMAP-2.md` — living planning docs: whole-site audits and next-build ideas. Read before starting a new instrument/page — they document what's already built vs. what's genuinely new.
- `pages.json`, `sitemap.xml`, `llms.txt`, `robots.txt` — site manifest; keep in sync when adding pages.

## Conventions
- Keep new pages self-contained per the single-file convention above unless a ROADMAP explicitly calls for a shared asset (the one narrow exception under discussion is a shared knob/palette/canvas-setup kit for the synth families — check ROADMAP.md's current recommendation before adding another one-off shared file).
- Google Analytics (`gtag.js`, `G-CE86H6X7Z7`) is wired into `index.html` — don't strip without reason.
- Never use Russian in code/UI/docs unless the task explicitly calls for it.

## Deploy
GitHub Pages from `main`, root domain `followorbounce.github.io`. Remote: `github.com/followorbounce/followorbounce.github.io`.
