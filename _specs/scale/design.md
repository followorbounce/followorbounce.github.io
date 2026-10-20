# Planck to Horizon: design and education spec

Status: design spec, not code. Written by the education, design and creative side of the science team, wearing these hats: Curriculum Designer, Learning Experience Designer, Science Communicator, Information Designer, Interaction Designer, Chief Creative Officer, UX Researcher and Ethicist. The physicist's spec (`physics.md`, `objects.json` in this folder) owns every number, definition and regime boundary. Where this file quotes a number, it is a design placeholder that the physicist's file overrides. Where the two disagree, physics wins and this file's wording follows it.

Owner rules this spec obeys: no artist names; never Russian; iPhone guidelines (safe areas, 44 pt touch targets, 16 px inputs); nothing flashes more than 3 times a second; `prefers-reduced-motion` is honoured; plain English, short sentences, and every technical word is explained the first time it appears.

Audience: a curious adult or teenager who knows what a metre and an atom are, and who has never used a logarithmic scale on purpose. Second audience: a teacher, who should be able to run the guided tour in a 15-minute lesson. Third audience: a gallery visitor standing in front of a screen in installation mode.

Placeholder numbers used below (checked by us, to be confirmed by `physics.md`): Planck length 1.616 × 10⁻³⁵ m; observable universe diameter 8.8 × 10²⁶ m; range 61.7 orders of magnitude; geometric mean of the two extremes 1.19 × 10⁻⁴ m (0.12 mm); a 1.7 m human sits 35.0 orders above the Planck length and 26.7 below the universe, which is 57 % of the way up. Sun / Earth diameter 109; by volume 1.31 million.

---

## 0. Words the page uses (gloss once, then use freely)

| Word | Plain gloss shown on first use |
|---|---|
| order of magnitude | one step of ten: 1 m to 10 m is one order of magnitude |
| logarithmic scale | a ruler where each step of ten gets the same space, instead of each metre |
| geometric mean | the middle in steps of ten: the size that is as many times bigger than the smallest as it is smaller than the largest |
| Planck length | the length at which our two best theories, gravity and quantum physics, both matter and neither works alone |
| quantum | the rules for very small things, where position and speed are both fuzzy and energy comes in lumps |
| Compton wavelength | the smallest region a particle of a given mass can be pinned into; squeeze harder and new particles appear |
| Schwarzschild radius | the size to which a mass must be squeezed to become a black hole |
| black hole | a region where gravity is so strong that nothing, not even light, gets out |
| diffraction limit | light spreads as it passes through a lens, so details smaller than about half its wavelength blur together |
| capillary length | the size (about 2.7 mm for water) below which surface tension beats gravity |
| surface tension | the pull of a liquid's surface, which acts like a stretched skin |
| viscosity | how thick and sticky a fluid feels; for very small swimmers water feels like honey |
| potato radius | the size (a few hundred km) above which a body's own gravity pulls it round |
| density | mass per volume, in kg per cubic metre; water is 1000 |
| observable universe | the part of the universe from which light has had time to reach us since the Big Bang |
| horizon | the edge of what we can see, set by time and the speed of light, not by a wall |
| SI prefix | a word in front of "metre" that means a power of ten: kilo = 10³, nano = 10⁻⁹ |

---

## 1. Learning objectives

Each objective has a check the page can observe (for a later evaluation study) or a teacher can ask.

1. **Read a log scale.** A visitor can say how many steps of ten separate two objects and convert that into "N times bigger". *Check:* in Compare mode, asked "how many times wider is a hair than a bacterium?", they answer "about 100" (2 orders) within one try.
2. **Place themselves.** A visitor can mark roughly where a human sits on the full range and name the true midpoint (about 0.1 mm, the width of a hair or a human egg cell). *Check:* the predict-the-middle pin (chapter 2) is dropped within 3 orders of the true midpoint on the second try, after the reveal.
3. **Scale changes the rules.** A visitor can name the force or effect that dominates at three scales: surface tension and stickiness (cells, insects), gravity making things round (moons and up), quantum rules (atoms and down). *Check:* after the tour, they can sort five objects (bacterium, water strider, Mimas, Earth, atom) by "what rules here".
4. **Length, area and volume grow differently.** A visitor can predict that an object 10 times wider holds about 1000 times the volume. *Check:* predict-then-reveal in Compare mode: "How many Earths fit inside the Sun?" Most first guesses are near 100; the answer is 1.3 million.
5. **Mass and size are not free.** A visitor can point to the two forbidden corners of the mass–size diagram and say why each is forbidden (a black hole hides what is above one line; quantum fuzz forbids what is below the other), and that the two lines meet near the Planck scale. *Check:* tap the black-hole region and the quantum region and choose the right explanation from three.
6. **The edges are limits of knowledge, not of nature.** A visitor can say that the Planck length is not a known pixel of space, and that the observable universe is not all there is. *Check:* true/false pair at the end of the tour, both answered correctly.

---

## 2. Misconceptions to confront

Method for every row: ask first (a question in the stage HUD, held 5 s, fading over 600 ms), let the visitor act, then show evidence. Prediction before reveal is what makes the correction stick.

| # | Misconception | Interaction that confronts it | Where |
|---|---|---|---|
| M1 | "Atoms are tiny solar systems." | At the atom, a button "Show the 1913 picture" draws planet-style orbits labelled *Old model, wrong*. After 3 s it melts (1.2 s cross-fade) into a cloud whose brightness is the electron's probability. A readout gives the nucleus as 1/60 000 of the atom's width. | Tour stop 5, chapter 4 |
| M2 | "Atoms are mostly empty space, like a stadium with a pea." | Same cloud: the electron cloud fills the whole atom. Text: the atom is mostly *nucleus-free*, not empty; the cloud is what stops your hand going through a table. | Chapter 4 |
| M3 | "The Planck length is the pixel size of space." | The Planck length is drawn as a dimension bar (a measured span), never as a dot or a grid. A grey fog fills the 16 unexplored orders above it. On the mass–size diagram, the black-hole line and the quantum line cross there: that crossing is the real reason it matters. | Tour stops 7–8, chapters 5 and 7 |
| M4 | "A human is in the middle of everything." | Predict-the-middle: drag a pin on the full 62-step ruler to where you think the middle is. Reveal: 0.12 mm, a hair's width. You sit 57 % of the way up, closer to stars than to the Planck length. | Chapter 2, tour stop 3 |
| M5 | "The universe is everything there is." | At the top, the horizon is drawn as a soft ring labelled *edge of what light has had time to show us*. Outside it the stage is not black but marked *unknown*, with the text "more universe, of unknown size". | Tour stop 14, chapter 8 |
| M6 | "If it is 10 times wider, it is 10 times bigger." | Compare mode always shows three ratios: width, area, volume. Predict-then-reveal "how many Earths fit in the Sun?" | Compare mode, chapter 1 |
| M7 | "On a normal ruler I could see all of this." | Linear-ruler toggle in chapter 1: the same objects on a linear scale the width of the screen. Everything but the universe collapses into the first pixel; the readout says a human would be 3 trillion times smaller than a proton on that drawing. | Chapter 1 |
| M8 | "Physics is the same at every size, so small things behave like small big things." | Regime crossings in the zoom: a caption card at each boundary says what takes over. Chapter 3 shows a bacterium that stops dead in a millionth of a second when it stops swimming. | Tour stops 2, 4, 9 |
| M9 | "A good enough microscope can see anything." | At 200 nm the stage gets a "light can't resolve this" band; objects below it switch from silhouettes to outlines with a note that we see them with electrons, X-rays or scattering instead. | Tour stop 4, chapter 3 |
| M10 | "The universe lies on the black-hole line, so it is a black hole." | On the mass–size diagram, tapping the universe point opens a note: the Hubble sphere does sit on the line, but a black hole is a lump in an outside space; the universe is evenly filled, expanding and has no outside. | Chapter 7 |

Ethicist note on framing M4 and M5: avoid both "you are the centre" and "you are insignificant". The honest message is: human size is unremarkable on the ruler, and remarkable in what it lets us measure. The page never uses words like "tiny, pointless" about people, and never claims certainty about what lies beyond the horizon or below the Planck length.

---

## 3. Page architecture

One self-contained file, `planck-to-horizon.html`, at the repo root, with the theme toggle, light/dark tokens, IBM Plex Mono for numbers and labels, Manrope for display and body text. The objects data is inlined as JSON in a `<script type="application/json" id="objects">` (built from `objects.json`; about 40 KB). No external libraries.

Order on the page:

1. **Header** (site chrome, "← Follow or Bounce", theme toggle).
2. **Hero:** eyebrow `SCIENCE · SCALE`, title, one-line lede, and a small static strip of the 62 steps with "you are here".
3. **Central instrument: the Zoom** (section 4). Full-bleed black stage, first thing below the hero, open at the human.
4. **Table of contents** for the chapters.
5. **Chapters 1–9** (section 6), each with its own mini-interactive or figure. Chapters link into the Zoom ("Show me in the zoom →" scrolls up and flies there).
6. **Second instrument: the Mass–size diagram** (section 5), placed inside chapter 7 at full content width.
7. **All objects** table: every object, sortable by size or mass, with uncertainty flags; each row has "Go there" (flies the Zoom) and "Plot" (highlights on the diagram).
8. **How it works / Limits / Sources** (house pattern).
9. **Footer.**

Layout widths: text column max 720 px; instruments max 1320 px, full bleed on phones; 16 px side gutter for text at phone width; no horizontal page scroll.

---

## 4. Central instrument: the Zoom

### 4.1 The model behind the drawing

- The camera state is one number, `s` = log₁₀ of the view width in metres, plus a horizontal pan `p` measured in view widths. Range: `s` from −35.3 (a view 3 Planck lengths wide) to 27.4 (a view 3 times the observable universe).
- **No world coordinate ever goes to the GPU.** For each object the CPU computes its screen size `L / 10^s` and screen position in view-width units, in JavaScript doubles, then sends float32 screen values. This avoids precision collapse over 62 orders.
- **Lineup layout.** Objects stand on a common ground line, like a museum shelf. Each object's horizontal anchor is `x = k · L`, where `L` is its size and `k` its slot (−3.4, −2.1, −0.9, +0.9, +2.1, +3.4, assigned by sorting objects of each decade by importance). Because position scales with size, each decade's group gathers round the centre when its scale is on screen, and smaller groups shrink into the centre point as you zoom out. The centre is a fine crosshair, the zoom pin.
- Round bodies (planets, stars, atoms) are centred on the ground line instead of standing on it, so they read as spheres, not boulders.
- **Lengths that are not objects** (Planck length, wavelengths, distances such as Earth–Moon, Hubble radius) sit on a separate thin rail above the shelf, drawn as dimension bars with end ticks: ⟝——⟞. Distances are spans, not things.
- Visibility: an object is drawn while its screen size is between 3 px and 6 view widths. Above 1.5 view widths it is drawn only as its outline arc, fading to 0 by 6. Below 12 px it becomes a glyph (see 4.2). Fades use size, not time, so scrolling back and forth never pops.

### 4.2 Drawing ~150 objects legibly

Every object has one of five **forms**, decided by what it is, not by taste:

| Form | Used for | Look on the stage |
|---|---|---|
| Silhouette | living things, made things, landforms (~40 hand-drawn, Tier A) | one-colour filled shape in the regime colour at 85 % opacity, 1 px lighter edge |
| Body | planets, moons, stars, nuclei with a defined radius | flat disc with a 1.5 px rim; limb slightly darker; no textures, no fake photos |
| Cloud | things with no sharp edge: atoms, protons, galaxies, clusters | radial falloff; a dashed ring at the size the data uses, labelled "edge by convention" on hover |
| Bound | upper limits (electron, quark: "smaller than") | dashed outline at the limit with three inward chevrons; label "smaller than …" |
| Span | lengths and distances | dimension bar on the rail |

- **Glyph mode** (screen size 3–12 px): a dot of 3 px plus a short vertical tick, in the regime colour. Two or more glyphs closer than 10 px merge into one dot with a count ("+4").
- **Silhouettes**: drawn fresh for this page in one consistent hand: 2 px stroke rhythm, no interior detail below 1/20 of height, front or side view. Stored as SVG paths, rasterised once into a signed-distance-field atlas (64 px cells, 2048² maximum) so edges stay crisp at any size. Tier B objects (~110) use their category's glyph shape inside the body or cloud form.
- **Uncertainty is visible.** Range (for example, human height): a band between two rings. Convention-defined edge: dashed ring. Model-dependent (universe size): the ring carries a small "model" tag. Upper bound: the Bound form.
- **The human reference** is always present. When the human is on screen it is the silhouette, drawn in white at 95 % (the only white silhouette). When off screen it is a white chevron on the mini-map and in the scale bar: "you: 10³⁵ times bigger than this view" or "this view: 10²⁰ yous wide".

### 4.3 Labels without clutter

- Each frame, candidate labels are ranked: priority = importance (tour stop 3, notable 2, other 1) + 2 if the object fills 10–60 % of the view width − 1 if it is a glyph.
- Greedy placement in screen space, four candidate positions per object (above, right, left, below), with a 6 px gap; a hairline leader line is allowed up to 40 px. A label that cannot be placed waits; it is never drawn on top of another.
- Maximum labels: 9 on desktop, 5 on phones. The selected or hovered object always gets one.
- Label text: name on line 1 (Manrope 600, 14 px), size on line 2 (Plex Mono 12 px, for example `1.2 × 10⁻⁴ m · 120 µm`). Label fade 250 ms in, 400 ms out; with reduced motion, instant.
- Labels are HTML elements in an overlay layer (sharp text, screen-reader reachable), positioned with `transform`, pooled (no creation per frame).

### 4.4 Regime boundaries

The stage background stays black. Regimes show in three places: (a) the ruler band, coloured by regime; (b) a faint wash, 6 % of the regime colour at the edges of the stage, vignette shaped; (c) a **threshold card** when the view crosses a boundary: a 2-line caption in the lower left, held 4 s, for example *"Leaving the world of cells. Below here, light is too coarse to see by, and quantum rules begin."* A card shows at most once per crossing direction per 20 s, so wiggling the zoom never makes it blink.

Special zones:
- **The unexplored zone** (from about 10⁻¹⁹ m down to the Planck length): a slow grey fog of value noise (0.02 Hz drift, still under reduced motion), and the ruler band hatched instead of filled. Caption: *"No experiment has resolved anything here. These 16 steps are empty on the map, not in nature."*
- **The horizon** (top): the observable universe is a soft ring. Beyond it, the stage fills with the hatched "unknown" texture, never pure black.

### 4.5 Ruler, scale bar, mini-map

- **Powers-of-ten ruler** along the bottom of the stage: tick marks for every power of ten in view, major ticks labelled `10⁻⁹ m` and, where one exists, the SI prefix (`1 nm`). Since view width is always about one order, the ruler shows minor ticks at 2, 5 too. Below 10⁻³⁰ m the prefix line reads *"no SI prefix reaches this far"*.
- **Scale bar** (top left): a bar of a round length (1, 2 or 5 × 10ⁿ) about 1/5 of the view, labelled in metres and in plain words: `100 µm · about a hair's width`.
- **Mini-map "where am I"**: the full range from Planck to horizon as one strip (vertical on the right edge on desktop, horizontal at the top of the stage on phones), coloured by regime, with a bright window showing the current view, a white chevron at the human, a thin line at the midpoint (0.12 mm), and dots for tour stops. Drag or tap to jump; it is a slider for assistive tech.

### 4.6 Controls and speeds

| Input | Action | Speed |
|---|---|---|
| Wheel / trackpad over the stage | zoom about the pointer's x | 0.25 orders per notch (deltaY 100); trackpad continuous at 0.0025 orders per pixel |
| Pinch (two fingers) | zoom | log of finger-distance ratio, 1:1 |
| Drag (one finger / mouse) | pan along the shelf | 1:1 |
| Zoom rail (right edge, phones) | one-thumb zoom: drag up = bigger | 1 order per 40 px |
| `+` / `−` or `↑` / `↓` | zoom in / out | 0.1 order per press; hold = 2 orders/s |
| `PageUp` / `PageDown` | one order | animated 300 ms |
| `Home` / `End` | Planck length / horizon | flight |
| `H` | back to the human | flight |
| `←` / `→` | previous / next object by size | flight |
| `/` | open "Jump to" | — |
| `C` | Compare mode | — |
| `T` | start / stop the tour | — |
| `Esc` | close panels, leave fullscreen | — |

- **Scroll trap rule.** On the page, the wheel scrolls the page until the visitor clicks or taps the stage once ("engaged" state, shown by a 1 px ring and the hint *"Wheel zooms. Click outside to scroll the page."*). Ctrl/⌘ + wheel always zooms. In fullscreen and installation mode the wheel always zooms. One-finger vertical swipes on a phone always scroll the page; pinch, two-finger pan and the rail drive the zoom.
- **Flights** (jump, tour, `H`): ease in-out in log space, peak 3 orders per second, minimum 0.6 s; Planck to horizon takes about 22 s. A flight passing the human shows a small "you" tick in the ruler as it goes by. Any input cancels a flight.
- **Reduced motion:** no flights; jumps are a 200 ms cross-fade cut. Fog does not drift. Hold-to-zoom is still allowed (it is the visitor's own motion).
- **Momentum:** wheel and pinch get light inertia (decay 0.85 per frame at 60 fps); none under reduced motion.

### 4.7 Jump to (search)

- Button "Jump to" and `/`. A 16 px text input with a list of matches below (name, size, regime chip). Matches: name, aliases, category words ("moon", "cell"), and sizes typed as numbers (`1e-10`, `1 nm`, `3 km`). Typing a size flies to that view width and lists the 3 nearest objects.
- Enter flies to the first match; arrow keys move in the list; `aria-activedescendant` pattern.

### 4.8 Compare two objects

- Enter by `C`, the "Compare" button, or long-press on an object (500 ms). Pick object A, then B (or type both in two inputs).
- The stage splits its view: the view width fits the larger object; the smaller one is drawn beside it at true scale; if it is under 3 px, a magnifier circle (×10ⁿ, labelled "shown 10⁶× larger") draws it next to its true-size dot.
- Readouts:
  - `width ratio  109 ×   (2.04 orders)`  DATA
  - `area ratio  1.19 × 10⁴`  MODEL (assumes similar shapes)
  - `volume ratio  1.31 × 10⁶`  MODEL (assumes similar shapes)
  - `in a line: 109 Earths across the Sun`  DATA
  - `filling it: about 1.3 million Earths` MODEL; for spheres a packing note: "packed as spheres, about 960 000 would fit; the rest is gaps" (64 % random packing).
  - plain phrase: *"If the Sun were a football, Earth would be a peppercorn."* (analogy library: for any ratio, pick the pair of everyday objects with the closest width ratio from a fixed list of ~30 everyday things; tagged DRAWN because it is an illustration.)
- If both objects have mass: mass ratio and density ratio too.
- Predict first: for the first comparison of a visit, the volume readout is hidden behind *"Guess first: how many fit?"* with a log slider; reveal shows the guess beside the answer.

### 4.9 Guided tour (14 stops)

Tour bar under the stage: `Tour 3 / 14 · The middle of everything`, Previous, Next, Stop. The wall label is the in-stage label (lower left, max 360 px wide, Manrope 15 px). Each stop holds until Next (manual) or 18 s (auto/installation). Word counts are ≤ 45 and checked in QA.

1. **You** — view 4 m. *This is you, about 1.7 metres tall. Every size on this page is measured against you. Scroll down and you will pass 35 steps of ten before our theories run out. Scroll up and you will pass 27 before light runs out.*
2. **Where water becomes a skin** — water strider and a drop, view 2 cm. *Below about 3 millimetres, surface tension beats gravity. Drops stay round, insects walk on water, and a spilled ant floats. The same water, a different rule: size alone changed which force wins.*
3. **The middle of everything** — hair and human egg cell, view 1 mm. *This is the middle of the known range: a tenth of a millimetre, a hair's width, a human egg cell. You are not in the middle. You sit well above it, closer to the stars.*
4. **Too small for light** — bacterium, virus, 200 nm band, view 3 µm. *Light blurs anything smaller than about 200 nanometres. A bacterium is still visible; most viruses are not. To see further we use electrons, X‑rays and particle beams instead of light.*
5. **An atom is a cloud** — hydrogen atom, view 3 × 10⁻¹⁰ m. *An atom is not a tiny solar system. The electron is a cloud of chance, densest near the centre. The nucleus is 60 000 times narrower than the atom, yet holds almost all its mass.*
6. **Inside the nucleus** — proton, view 3 × 10⁻¹⁵ m. *A proton is about a femtometre across: a millionth of a billionth of a metre. It is made of quarks held by the strong force, the strongest pull in nature, which only reaches this far.*
7. **The edge of the map** — smallest resolved distance, view 10⁻¹⁹ m. *This is roughly the finest detail any experiment has resolved. Below here, nothing has been measured. The next 16 steps of ten are blank on our map. Blank does not mean empty.*
8. **The Planck length** — dimension bar, view 10⁻³⁴ m. *Here gravity and quantum physics both matter, and neither theory works alone. The Planck length is not a known pixel of space. It marks where our understanding stops, not where nature does.*
9. **Gravity makes it round** — Hyperion and Mimas side by side, view 600 km. *Above a few hundred kilometres, a body's own gravity crushes it into a ball. Hyperion, 270 km across, stays lumpy. Mimas, 400 km across, is round. Mountains cannot grow forever for the same reason.*
10. **One hundred and nine Earths** — Earth and Sun, view 3 × 10⁹ m. *The Sun is 109 times wider than Earth. That sounds modest, but volume grows as the cube: about 1.3 million Earths would fit inside. Width hides how big things really are.*
11. **The nearest star** — Sun to Proxima Centauri span, view 10¹⁷ m. *The nearest star beyond the Sun is 4.2 light‑years away, 40 trillion kilometres. Light from it is over four years old. At these sizes, distance is also time.*
12. **Our galaxy** — Milky Way, view 3 × 10²¹ m. *The Milky Way is about 100 000 light‑years across and holds a few hundred billion stars. Its stars move as if far more mass were present than we can see. We call the missing part dark matter.*
13. **The cosmic web** — filaments, view 10²⁵ m. *Galaxies gather into threads and walls around vast empty voids. Zoom out far enough, about a billion light‑years, and the web evens out: every large region looks much like any other.*
14. **The horizon** — observable universe, view 2 × 10²⁷ m. *This ring is not the edge of the universe. It is the edge of what light has had time to show us. Beyond it there is almost certainly more universe, of unknown size.*

Teacher note under the tour: stops 1, 3, 5, 9, 10, 14 make a 6-stop short version (7 minutes).

---

## 5. Second instrument: the Mass–size diagram

A log–log plot, one point per object that has a mass. Default axes: x = size (radius R, metres, 10⁻³⁶ to 10²⁸), y = mass (kg, 10⁻⁴⁴ to 10⁵⁴). Use the physicist's choice of radius versus diameter; the lines below assume radius. Drawn on 2D canvas (it does not need WebGL), on the page's paper colour (not the black stage), so it follows the theme.

- **Points:** 5 px discs in regime colours with the category shape (circle = body, ring = cloud, triangle = living, square = made, chevron = bound). Upper bounds draw an arrow pointing left.
- **Black-hole line** (Schwarzschild): M = c²R / 2G ≈ 6.7 × 10²⁶ kg per metre. Slope 1. Solid, ink colour, label along the line *"black holes"*.
- **Quantum line** (reduced Compton wavelength): M = ħ / cR ≈ 3.5 × 10⁻⁴³ kg·m / R. Slope −1. Solid, ink colour, label *"quantum limit"*.
- **Crossing:** they meet at R ≈ 2.3 × 10⁻³⁵ m, M ≈ 1.5 × 10⁻⁸ kg, within a factor of 2 of the Planck length and Planck mass (2.2 × 10⁻⁸ kg, about a grain of fine sand). A ringed marker: *"Planck scale: the smallest black hole would be its own quantum fuzz."* Note the factor: with the full (not reduced) Compton wavelength the crossing moves by √(2π); Limits says so.
- **Forbidden regions**, shaded with 45° hatching (not colour alone), 12 % ink:
  - above the black-hole line: *"Too dense. Anything here would already be a black hole, and would sit on the line, not above it."*
  - below the quantum line: *"Too light for its size. Quantum fuzz will not let this little mass be held in so small a space."*
  - left of the crossing (below the Planck length): *"No theory we have works here."*
- **Density lines:** slope 3, dotted, labelled at the right edge: cosmic average (critical density, about 9 × 10⁻²⁷ kg/m³), interstellar gas, air (1.2), water (1000), white dwarf (10⁹), atomic nucleus (2.3 × 10¹⁷). A one-line callout: *"Rocks, people, planets and water all crowd near the water line: atoms are all about the same size and weight."*
- **Vertical bands:** capillary length (2.7 mm) and potato radius (200–300 km), thin and labelled, linking back to the Zoom chapters.
- **Hover / tap** a point: tooltip card with name, size, mass, density, its Schwarzschild radius ("squeezed to 9 mm, Earth would be a black hole"), its Compton wavelength, and "Go there in the zoom". Tap a shaded region: its explanation card. Tooltips never cover the pointer; on phones they dock to the bottom of the plot.
- **Toggles:** "Show lines" (on), "Show density" (on), "Highlight" by regime chips. Each chip is a 44 px target with text, not just a swatch.
- **Universe point** opens M10's note.
- Keyboard: Tab into the plot, arrow keys move between points in size order, Enter opens the card. A visually hidden table carries the same data.

---

## 6. Chapters of the scroll page

Each chapter: kicker (`01 · SCALE`), heading, 80–150 words, one figure or mini-interactive, and "Show me in the zoom →".

### 1. Sixty-two steps of ten
*Key message:* only a logarithmic scale can hold nature's range, and length, area and volume grow differently.
*Interactive:* the **linear-ruler toggle** (M7) and a "times bigger" slider: drag between two objects, see "10 steps = 10 000 000 000 times".

> From the smallest length physics can talk about to the largest thing we can see, sizes span about 62 steps of ten. One step means ten times bigger. Two steps, a hundred times. Ten steps, ten billion times. A normal ruler cannot hold this. Draw the universe across your screen and you would be three trillion times smaller than a proton on it. So this page uses a logarithmic scale, where each step of ten gets the same space. It changes how you read sizes: moving one notch is always "ten times". Watch one more trap. Width is not the whole story. A thing ten times wider has a hundred times the area and a thousand times the volume.

### 2. Where you stand
*Key message:* the midpoint of the range is 0.1 mm; humans sit above the middle.
*Interactive:* **predict-the-middle pin** (M4).

> Where is the middle of all sizes? Not in metres: the universe would swallow everything. In steps of ten, the middle is the size that is as many times bigger than the Planck length as it is smaller than the universe. That is about a tenth of a millimetre. A human hair. A grain of fine dust. The human egg cell, the one cell you can almost see. You stand 35 steps above the smallest length and 27 below the largest. That is a little over halfway up. It is a good place to be: big enough to build telescopes, small enough to be made of cells.

### 3. The sticky small world
*Key message:* below millimetres, surface tension, viscosity and diffusion rule, and light runs out at 200 nm.
*Figure:* a side-by-side animation (paused under reduced motion, stepper instead): a fish and a bacterium stop swimming; the fish coasts a body length, the bacterium stops within a tenth of an atom's width in under a microsecond (placeholder: confirm with physics.md).

> Shrink below a few millimetres and the world turns sticky. Surface tension, the skin-like pull of water's surface, beats gravity, so drops stay round and insects walk on ponds. Shrink further and viscosity, the thickness of a fluid, takes over. For a bacterium, water feels like honey. If it stops swimming it stops dead, almost at once, with nothing to coast on. Swimming here works like a corkscrew in jam. Then light itself gives up. A microscope cannot sharpen details finer than about half the wavelength of light, roughly 200 nanometres. Viruses and molecules are below that line. We see them with electrons and X-rays.

### 4. Inside the atom
*Key message:* atoms are clouds of probability around a tiny, heavy nucleus; quantum rules.
*Interactive:* the **1913 picture → cloud** morph (M1, M2) and a nucleus-size readout.

> The picture of an atom as a little solar system is a century old, and it is wrong. Electrons do not orbit like planets. Quantum physics, the rulebook for very small things, says an electron has no exact path. It is a cloud of chance, thick where you are likely to find it. That cloud is the atom's size, about a tenth of a nanometre. At the centre sits the nucleus, 60 000 times narrower, holding almost all the mass. People say atoms are mostly empty. Better: they are mostly cloud. That cloud is what pushes back when you press on a table.

### 5. The edge of the knowable small
*Key message:* 16 unexplored orders lie between the smallest probed scale and the Planck length; the Planck length is a limit of theory, not a known pixel.
*Figure:* the ruler from 10⁻¹⁵ to 10⁻³⁵ m with a "how we looked" ladder: microscope, electron microscope, particle accelerators, then the hatched blank.

> Our best particle colliders smash protons hard enough to resolve details near a ten-billionth of a billionth of a metre. Below that, we have no data at all. The map then runs blank for 16 more steps of ten, down to the Planck length. The Planck length is where both gravity and quantum physics must matter at once, and we have no tested theory that does both. It is often called the pixel size of space. Nobody knows that. It is the size at which our current ideas break, the way old maps once said "unknown lands".

### 6. When gravity takes over
*Key message:* gravity is weak but adds up; above a few hundred km it makes bodies round and caps mountains.
*Interactive:* **lumpy-to-round slider**: drag a body's size from 50 to 1000 km and see its shape relax at the potato radius (drawn, tagged MODEL with the physicist's criterion).

> Gravity is by far the weakest force. A fridge magnet lifts a paperclip against the whole Earth. But gravity never cancels, so in big things it adds up. On a person it only decides which way is down. On a mountain it decides how tall it can be: a rock tower too high crushes its own base. On a body a few hundred kilometres across, gravity crushes the whole thing into a ball. Small moons look like potatoes. Bigger ones are round. Planets and stars are spheres for the same reason: their own weight pulled them that way.

### 7. Mass and size: the forbidden corners
*Key message:* not every combination of mass and size can exist; two limits, gravity and quantum, close in and meet at the Planck scale.
*Instrument:* the **Mass–size diagram** (section 5).

> Plot every object by size and by mass and a pattern appears. Almost everything solid lies near one line: the density of water and rock. Two other lines fence the map. Above the first, anything would be so dense that it is a black hole, a place light cannot leave. Below the second, a mass is too small to be held in so small a space: quantum fuzz spreads it out. These two lines lean towards each other and cross at the Planck scale. That crossing, not a pixel, is why the Planck length matters. The smallest possible black hole would be as fuzzy as it is heavy.

### 8. The largest things and the horizon
*Key message:* galaxies, the cosmic web, smoothness at the largest scales, and the observable universe as a horizon, not an edge.
*Figure:* three nested panels: galaxy, cluster, web, then the horizon ring.

> Stars gather into galaxies. Galaxies gather into clusters, and clusters into a web of threads around huge empty voids. Zoom out past a few hundred million light-years and the web evens out: every large patch looks about the same. Then there is a limit. Light has had about 13.8 billion years to travel since the Big Bang, and space has stretched meanwhile, so the farthest light we can see comes from about 46 billion light-years away. That makes a sphere 88 billion light-years wide: the observable universe. It is our horizon, like the edge of the sea from a ship. More ocean lies beyond.

### 9. How we know
*Key message:* every size on the page has a method and an uncertainty; the edges are the least certain.
*Figure:* the **measurement ladder**: a vertical strip of methods against the ruler (ruler and tape, light microscope, electron microscope, X-ray crystallography, scattering and colliders; radar, parallax, standard candles, cosmic background), each bar as wide as its working range. Tap a bar for one sentence and one example object.

> No single tool measures everything. Rulers and tapes work from millimetres to kilometres. Microscopes go down to cells, electron microscopes to molecules, and scattering experiments, which fire particles and watch them bounce, into the nucleus. Upward, radar times echoes off planets, parallax uses the shift of nearby stars as Earth circles the Sun, and stars and exploding stars of known brightness work as distance markers. Each method hands over to the next, like rungs on a ladder. Errors pile up as you climb. That is why each size on this page carries a flag: measured, a range, defined by convention, or an upper limit.

---

## 7. Readouts, plots, colour and number typography

### 7.1 Readouts (stage HUD and the panel under it)

| Readout | Example | Tag | Why |
|---|---|---|---|
| View width | `1.0 × 10⁻¹⁰ m · 1 Å` | DRAWN | it describes the drawing's camera |
| Order of magnitude | `step −10 of 62` | DRAWN | position on the drawn ruler |
| Regime | `Atoms & molecules — quantum rules` | MODEL | boundaries are a physical model with fuzzy edges |
| Selected object size | `1.06 × 10⁻¹⁰ m (H atom, by convention)` | DATA | from objects.json, with its flag |
| Selected object mass | `1.67 × 10⁻²⁷ kg` | DATA | |
| You vs this view | `you are 10¹⁰ times wider than this view` | DATA | ratio of data values |
| Compare: width ratio | `109 ×` | DATA | |
| Compare: area, volume, "how many fit" | `1.31 × 10⁶` | MODEL | assumes similar shapes |
| Schwarzschild radius of selected | `8.9 mm` | MODEL | formula |
| Compton wavelength of selected | `2.1 × 10⁻⁵⁰ m` | MODEL | formula |
| Everyday analogy | `football vs peppercorn` | DRAWN | an illustration, approximate |
| Object shape, colour, silhouette | — | DRAWN | stated once in How it works |

Tags appear as small mono chips (`DATA` filled, `MODEL` outlined, `DRAWN` dashed outline), so the tag is readable without colour. A legend line under the readouts explains the three tags in one sentence each.

### 7.2 Plots

- Mass–size diagram (section 5).
- Chapter 1 "times bigger" slider and linear-ruler figure.
- Chapter 9 measurement ladder.
- All plots use the house `plot` style: ink axes, faint grid every order, labels every 5 orders on phones and every 2 on desktop, mono tick labels with superscripts, theme-aware (re-read tokens on theme change).

### 7.3 Colour system

Eight regime colours, from a colour-blind-safe family. Two sets: one for the black stage (and dark chrome), one for light chrome. All pass 4.5:1 contrast against their background (checked: stage set on #000 7.2–15.9:1, on dark paper #121110 6.5–14.3:1; light set on #F4F4F1 4.65–5.6:1).

| Regime (placeholder ranges; physics.md sets them) | Stage / dark | Light chrome | Ruler texture |
|---|---|---|---|
| 0. Unexplored (Planck to ~10⁻¹⁹ m) | `#9A978E` | `#6E6B63` | hatched |
| 1. Particles and nuclei (~10⁻¹⁹–10⁻¹⁴ m) | `#E58FC0` | `#A8487F` | solid |
| 2. Atoms and molecules: quantum (~10⁻¹⁴–10⁻⁸ m) | `#56B4E9` | `#1F6F9E` | solid |
| 3. Cells: the sticky world (~10⁻⁸–3 × 10⁻³ m) | `#2EC4A0` | `#00785A` | solid |
| 4. Human scale: gravity vs strength (~3 mm–200 km) | `#F0E442` | `#7A6F00` | solid |
| 5. Worlds and stars: gravity makes round (~200 km–10¹³ m) | `#F0A630` | `#9A5A00` | solid |
| 6. Stars to galaxies: orbits and dark matter (~10¹³–10²⁴ m) | `#6E9BFF` | `#2F5BC2` | solid |
| 7. Cosmos: expansion (~10²⁴ m–horizon) | `#FF6A3D` | `#B23A12` | solid |

Rules: colour never carries meaning alone; every regime is also named on the ruler, the chips have text, and forms (4.2) carry category. Adjacent regimes differ strongly in lightness or hue for the three common colour-vision types; run the dataviz validator on the final set. White on the stage is reserved for the human and the selection. The page accent (`--live`) is used only for interactive focus, never for data.

### 7.4 Typography for numbers

- All numbers in IBM Plex Mono with tabular figures.
- Scientific notation with a real times sign and Unicode superscripts: `1.6 × 10⁻³⁵ m` (never `1.6e-35` in the UI; search accepts it as input). Mantissa: 2 significant figures by default, 3 when the data supports it, never more than the data's precision.
- SI prefixes from quecto (10⁻³⁰) to quetta (10³⁰), shown next to the scientific form when the value is between 1 and 999 of that prefix: `1.2 × 10⁻⁴ m · 120 µm`. Outside the prefix range: the note "beyond SI prefixes". Fun fact used once in chapter 1: SI prefixes span 60 of the 62 steps.
- Familiar units added where they help: light-years above 10¹⁵ m, km between 1 km and 10¹² m, ångström for atoms only once with a gloss.
- Plain-language ratios: below 1000, say the number (`109 times`); 1000 to 10⁶, words with digits (`about 60 000 times`); above, `10¹⁵ times (15 steps of ten)` plus an analogy where the library has one. Digit groups use a thin space (`60 000`).
- Approximate values start with "about"; upper limits with "smaller than"; ranges as `1.5–1.9 m`.

---

## 8. Accessibility, phone layout, performance, installation

### 8.1 Accessibility

- **Keyboard:** everything in 4.6 works without a pointer. The stage is one focusable region (`role="application"` avoided; use `role="group"` with `aria-roledescription="zoomable scale"` and keys documented in a visible "Keys" disclosure). Focus ring 2 px, visible on black and paper.
- **Live region** (`aria-live="polite"`, debounced 700 ms after motion stops): *"View 100 micrometres wide, cells. In view: human hair, human egg cell, dust mite. You are 17 000 times wider than this view."* Tour stops announce the wall label. Threshold cards announce once.
- **Mini-map** is a `role="slider"` with `aria-valuemin="-35"`, `aria-valuemax="27"`, `aria-valuetext="10 to the minus 4 metres, cells"`.
- **Text alternative:** the All objects table is the full non-visual version of the Zoom; each row's "Go there" also works without seeing the stage.
- Labels are real DOM text; minimum 12 px; contrast ≥ 4.5:1.
- **Reduced motion:** no flights, no inertia, no fog drift, no label fades, chapter animations replaced by steppers. Nothing on the page flashes; the only periodic motion (fog) is below 0.1 Hz; any future effect goes through a flash guard capped at 3 per second.
- Language is plain; every glossed word has a `<dfn>` on first use and an entry in a small glossary at the end of How it works.

### 8.2 Phone layout (≤ 640 px)

- Stage: full bleed, height `min(78svh, 680px)`, safe-area insets respected (`env(safe-area-inset-*)`) in fullscreen.
- Mini-map horizontal across the top of the stage (24 px tall); zoom rail on the right edge (44 px wide); scale bar top left under the mini-map; ruler at the bottom.
- Readouts in a bottom sheet under the stage (collapsed to one line: view width and regime; tap to expand).
- Buttons (Jump to, Compare, Tour, Fullscreen, Keys) in one row of 44 × 44 pt targets with text labels below the stage; overflow goes into "More".
- Inputs 16 px (no iOS zoom). Labels max 5. Wall label width = stage width − 32 px, max 6 lines; longer text scrolls inside the label, never overflows.
- Landscape phone: mini-map moves to the right edge, readouts overlay the stage at 80 % opacity.
- Mass–size diagram: square aspect, x labels every 5 orders, tooltip docked at the bottom.

### 8.3 Performance budget (60 fps on a mid phone, e.g. a 2021 mid-range Android or iPhone 11)

- Frame ≤ 16.7 ms; JS per frame ≤ 4 ms; GPU ≤ 8 ms.
- WebGL 2, one instanced draw for bodies/clouds, one for silhouettes (SDF atlas), one for glyphs, one for the fog/background, one for rails: ≤ 8 draw calls. 2D canvas fallback if WebGL 2 is missing or the context is lost (same layout, no fog).
- Device pixel ratio capped at 2; drop to 1.5 if three consecutive frames exceed 20 ms.
- Per frame only objects within ±2.5 orders of the view are processed (binary search on a size-sorted array).
- Label layout runs at most every other frame during motion, every frame at rest.
- Page weight ≤ 450 KB gzipped excluding fonts; silhouette atlas built at load from inline SVG paths (≤ 60 KB).
- Pause the render loop when the stage is off screen (IntersectionObserver) or the tab is hidden; render on demand when nothing moves.
- localStorage only for the last view and tour progress (`fb-scale-view`), wrapped in try/catch; the page works without it.

### 8.4 Installation mode

Button "Installation" (and `?install=1`): fullscreen, cursor hidden after 3 s still, all page chrome hidden, wall label at 1.6× size, labels max 7.

Script (one loop ≈ 7 minutes):
1. 0:00 — open at You, label 1, hold 18 s.
2. Tour stops 2–8 downwards, 18 s each.
3. Planck to horizon traverse: a continuous 22 s flight with the mini-map highlighted and the "you" tick as it passes; no labels except regime names on the ruler.
4. Tour stops 9–14, 18 s each.
5. 30 s "free drift": slow zoom of 0.05 orders per second around the human, the hint *"Touch to explore"*.
6. Every third loop, replace step 5 with the Mass–size diagram overlay on the stage for 40 s (lines drawn one at a time, then the crossing marker).
- Any touch hands control to the visitor; after 90 s of no input the script resumes at the nearest tour stop.
- Under reduced motion (set on the device), flights become cuts and the drift is off.

---

## 9. Name, slug, card and category

- **Name / title:** *Planck to Horizon*
- **Page `<title>`:** `Planck to Horizon — every size in nature`
- **Slug / URL:** `planck-to-horizon` → `/planck-to-horizon` (file `planck-to-horizon.html` at root).
- **One-line description (meta + `own-pages.json`):** "A continuous zoom through 62 steps of ten, from the Planck length to the observable universe, with a mass–size map of everything in between."
- **Hub card text:** *"Zoom from the Planck length to the edge of the observable universe and see what rules at each size. Find the true middle of all sizes (a hair's width), compare any two things, and see where black holes and quantum fuzz fence in what can exist."*
- **Tag:** `Read` with `"interactive": true`.
- **Category:** none of the current visible categories fits well (Waves, Radio & Electronics, Making & Fabrication, Instruments, Systems & Development, Research & Method, Philosophy, Machinery, Design & Experience). Recommendation: add a new visible category **`science` · "Science & Nature"** with this page as its first entry; future candidates are physics and nature pages now filed elsewhere. Fallback if the owner prefers no new category: **Research & Method** (it shares the "how we know" thread with the Field Manual). After adding, rebuild with `python3 engine/build_network.py` (index, sitemap, llms.txt).

---

## 10. Acceptance criteria for QA

Numbers (against `physics.md`; placeholders shown):
1. Range readout shows 61.7 orders (rounded "about 62") computed from the data's two extremes, not hard-coded.
2. The midpoint marker sits at the geometric mean of the extremes (1.19 × 10⁻⁴ m ± 1 %).
3. Compare Earth–Sun shows width 109 ×, volume 1.31 × 10⁶ (±1 %); Compare hair–bacterium shows 2 orders ± 0.3.
4. Mass–size lines: black-hole line passes M = 6.73 × 10²⁶ kg at R = 1 m; quantum line M = 3.52 × 10⁻⁴³ kg at 1 m; crossing marker at R = 2.29 × 10⁻³⁵ m, M = 1.54 × 10⁻⁸ kg (±1 %).
5. Every object in `objects.json` appears in the Zoom, the table and (if it has a mass) the diagram; counts match.
6. Every uncertainty flag in the data maps to its visual form (range band, dashed edge, bound chevrons, model tag); spot-check 10.

Interaction:
7. Zoom works by wheel (after engaging), Ctrl/⌘ + wheel, pinch, rail, keyboard; page scroll is never hijacked before engaging.
8. Flights obey peak 3 orders/s; Planck → horizon 20–25 s; any input cancels.
9. Jump to finds by name, alias, category word and typed size (`1e-10`, `1 nm`, `3 km`).
10. Labels never overlap (check at 20 random views on desktop and phone); ≤ 9 / ≤ 5 shown.
11. The human reference is visible (silhouette or chevron) at every zoom level.
12. Threshold cards appear on each regime crossing and do not repeat within 20 s.
13. Tour: 14 stops, every wall label ≤ 45 words (scripted word count), each stop's view contains its named object(s), labelled.
14. Diagram: hover and tap readouts work; tapping each shaded region shows its explanation; universe point shows the M10 note.

Accessibility and rules:
15. Full keyboard pass of both instruments; focus always visible; live region announces view changes after motion stops, not during.
16. Screen-reader pass (VoiceOver iOS, NVDA): mini-map slider value text, tour labels, table rows usable.
17. Reduced motion: no flights, no inertia, no fog drift, no fades; nothing on the page changes brightness more than 3 times per second in any mode (frame-capture check over the full installation loop).
18. Colour: regime sets pass 4.5:1 on their backgrounds; meaning survives a grayscale and deuteranopia/protanopia/tritanopia simulation (text and shapes still tell regimes apart).
19. Phone (iPhone SE width 320 px and a 390 px iPhone): no horizontal scroll, 44 pt targets, 16 px inputs, safe areas in fullscreen, landscape layout works.
20. Theme: both light and dark (and system preference) correct; the stage stays black in both; the diagram re-reads tokens on toggle.
21. No artist names, no Russian, no unglossed technical word (check the glossary list against first uses).

Engineering:
22. 60 fps (≤ 16.7 ms p95 frame time) on the mid-phone target during a continuous zoom; ≤ 8 draw calls; loop paused off screen.
23. 2D fallback renders when WebGL 2 is disabled; context loss recovers.
24. `node --check` passes on every inline script extracted from the final file; no console errors; final build re-tested after the last edit.
25. Page appears in `own-pages.json`, the generated index, sitemap and `llms.txt` after the rebuild.

User test (UX Researcher, 5 people, think-aloud, before ship): at least 4 of 5 complete objectives 1, 2 and 4 checks unaided; at least 3 of 5 answer objective 5 correctly after chapter 7. Any task failed by 3 or more people is a blocking design issue.

---

## 11. Open questions for the physicist

1. Size convention per object (diameter vs radius vs length) and which the diagram uses.
2. Exact regime boundaries and their names; the smallest resolved distance to quote (10⁻¹⁹ or 10⁻²⁰ m).
3. Potato radius criterion and values for icy vs rocky bodies; whether Hyperion and Mimas are the right pair.
4. The bacterium coasting figures for chapter 3.
5. Mass to use for the observable universe (all matter and energy, or matter only) and how to flag it.
6. Field names in `objects.json` for uncertainty type (`exact | range | convention | upper_bound | model`), importance and aliases; this spec assumes those five types.
