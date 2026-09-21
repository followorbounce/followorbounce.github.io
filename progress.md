# Progress — followorbounce.github.io (Knowledge Network)

## Status
- Large, actively-growing personal site: essays + two synth families (audio: Patch Bay/Signal Chain/Pulse Train line; visual: wave/fractal/diffusion/palette instruments) + two reference dictionaries (Design 112 terms, Inner Experience 77 terms).
- Working tree clean; branch up to date with `origin/main`. Remote: `github.com/followorbounce/followorbounce.github.io`.
- Dictionaries were previously tracked in memory as "committed not pushed" — that's now stale; both are pushed (confirmed via `git log`/`git status`).

## Recent work (most recent first)
- 2026-09-21 — **Pulse Train — Stage II: live taping.** Every module got two extra buttons beside its bypass footswitch: ● record (first click starts capturing every change to that module's settings — knobs, plus LFO shape and Output gate; second click stops; auto-stops at 4 s) and ▶ loop (replays the take until clicked again). Takes persist in localStorage (`pulseTrainStageII.loops.v1`). Verified in headless Firefox (record/loop/auto-stop/empty-take/persistence/preset capture). Committed (5f4a3c7) and pushed 2026-09-21.
- 2026-09-17 — Built the **Knowledge Network Engine** (`engine/build_network.py`): a re-runnable generator that reads `aerospace/pages.json`, `Maya-Calendar/pages.json`, and `machinery/data/graph.json` (each sibling repo's own source of truth) plus a new `engine/own-pages.json` manifest for this repo's own 28 pages, normalizes all four into `engine/network-graph.json`, and regenerates `index.html` from it. New homepage: real computed stats (112 pages / 4 repos), a live cross-network search box (client-side, filters all 112 entries by title/description/category), and per-sibling-repo "browse all N" disclosures. The old hand-maintained `index.html` is preserved at `old/index.html`. QA'd with geckodriver+Selenium (search, disclosures, mobile width) and every one of the 112 links verified to resolve to a real file — caught and fixed one real bug: aerospace's `time-philosophy/` directory-index slug was getting a wrong `.html` suffix appended. Scope: this indexes existing content across repos; it does NOT regenerate aerospace's/Maya-Calendar's individual hand-authored articles onto a shared template — that's logged as open Phase 2 work in `ROADMAP-2.md` §8. Since pushed.
- 2026-09-17 — Added `node-based-development.html`: a 15-chapter field guide to visual/node programming, visually consistent with the aerospace repo's field-guide language (corner-frame hero, eyebrow/chapter numbering, top progress bar, HUD chapter tracker) but self-contained per this repo's single-file convention. Real interactivity, not decorative: animated SVG data-flow diagrams, a click-through history timeline (14 eras), a filterable 13-platform comparison grid, a real pixel-based image→relief-map conversion demo (Sobel-style luminance shading), a live math-node demo, and a hand-rolled drag-and-connect node-graph playground (add/move/connect/delete nodes, Math Calculator and Image Filter presets) — QA'd with geckodriver+Selenium via real PointerEvents (confirmed drag, port-to-port connect, and live value propagation all work; caught one test-script bug, not a page bug — synthetic pointer coordinates need the target scrolled into view first). Wired into index.html's new "Systems & Development" category and llms.txt. Committed as `d9bf710`; since pushed.
- 2026-09-16 — Added CLAUDE.md and progress.md for ongoing tracking.
- Added a patchable LFO node, scoped to real CV-able parameters (Pulse Train family).
- Added Electronics page: components, circuit logic, microcontrollers, physics.
- Pulse Train — Stage II: swapped Tone III/Plate for Drive/Shimmer, reorganized the rack.
- Added Pulse Train — Stage II page (third Tone + Plate reverb).
- Pulse Train — Stage: dropped Render, added rave-style Gate + Kill.
- Added Perception page (visual/auditory illusions, live demos).
- Rewrote Audio-Reactive Diffusion sim as GPU ping-pong shaders; rewrote Complex-Plane Fractal Mapper as real WebGL shader (ROADMAP-2.md items closed).
- Extracted shared knob widget + palette engine per ROADMAP.md §2.

- 2026-09-19 — Added a Cloudflare Web Analytics beacon (cross-repo rollout across every deployed followorbounce/client site). See [[cloudflare-analytics-setup]] in the assistant's memory for the account/token map.

## Next steps
- Knowledge Network Engine Phase 2 (see `ROADMAP-2.md` §8): migrate aerospace's ~45 and Maya-Calendar's 8 articles onto a real shared build pipeline, not just an index — not started.
- ROADMAP.md's open architectural question (shared visual-synth kit, option B: a narrow `/assets/visual-synth-kit.js`) — check current recommendation before adding another one-off shared file to a new instrument.
- ROADMAP-2.md may still have unclosed audit items — review before the next whole-site pass.
- `_llm_code_req` is a stray empty file at root — confirm whether it's load-bearing (e.g. referenced by tooling) or safe to delete.
