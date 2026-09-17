# Progress — followorbounce.github.io (Knowledge Network)

## Status
- Large, actively-growing personal site: essays + two synth families (audio: Patch Bay/Signal Chain/Pulse Train line; visual: wave/fractal/diffusion/palette instruments) + two reference dictionaries (Design 112 terms, Inner Experience 77 terms).
- Working tree clean; branch up to date with `origin/main`. Remote: `github.com/followorbounce/followorbounce.github.io`.
- Dictionaries were previously tracked in memory as "committed not pushed" — that's now stale; both are pushed (confirmed via `git log`/`git status`).

## Recent work (most recent first)
- 2026-09-17 — Added `node-based-development.html`: a 15-chapter field guide to visual/node programming, visually consistent with the aerospace repo's field-guide language (corner-frame hero, eyebrow/chapter numbering, top progress bar, HUD chapter tracker) but self-contained per this repo's single-file convention. Real interactivity, not decorative: animated SVG data-flow diagrams, a click-through history timeline (14 eras), a filterable 13-platform comparison grid, a real pixel-based image→relief-map conversion demo (Sobel-style luminance shading), a live math-node demo, and a hand-rolled drag-and-connect node-graph playground (add/move/connect/delete nodes, Math Calculator and Image Filter presets) — QA'd with geckodriver+Selenium via real PointerEvents (confirmed drag, port-to-port connect, and live value propagation all work; caught one test-script bug, not a page bug — synthetic pointer coordinates need the target scrolled into view first). Wired into index.html's new "Systems & Development" category and llms.txt. Committed as `d9bf710`, not pushed — see no-git-credentials-in-env.
- 2026-09-16 — Added CLAUDE.md and progress.md for ongoing tracking.
- Added a patchable LFO node, scoped to real CV-able parameters (Pulse Train family).
- Added Electronics page: components, circuit logic, microcontrollers, physics.
- Pulse Train — Stage II: swapped Tone III/Plate for Drive/Shimmer, reorganized the rack.
- Added Pulse Train — Stage II page (third Tone + Plate reverb).
- Pulse Train — Stage: dropped Render, added rave-style Gate + Kill.
- Added Perception page (visual/auditory illusions, live demos).
- Rewrote Audio-Reactive Diffusion sim as GPU ping-pong shaders; rewrote Complex-Plane Fractal Mapper as real WebGL shader (ROADMAP-2.md items closed).
- Extracted shared knob widget + palette engine per ROADMAP.md §2.

## Next steps
- ROADMAP.md's open architectural question (shared visual-synth kit, option B: a narrow `/assets/visual-synth-kit.js`) — check current recommendation before adding another one-off shared file to a new instrument.
- ROADMAP-2.md may still have unclosed audit items — review before the next whole-site pass.
- `_llm_code_req` is a stray empty file at root — confirm whether it's load-bearing (e.g. referenced by tooling) or safe to delete.
