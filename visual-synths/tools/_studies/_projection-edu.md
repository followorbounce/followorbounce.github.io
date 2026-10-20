# Rind: education spec for the map-projection instrument

Status: design spec, not code. Written by the education side of the science team, wearing four hats: Curriculum Designer, Learning Experience Designer, Science Communicator, Information Designer. The cartographer's spec covers the projection maths. This file covers what visitors learn, the tour, the layout, the readouts, the colours and the page text. Where the two specs meet (centre and heading convention, lines of no distortion), the cartographer's maths wins and this file's wording follows it.

Owner rules this spec obeys: no artist names; no Russian; iPhone guidelines (safe areas, 44 pt touch targets, 16 px inputs); nothing flashes more than 3 times a second (use `GLX.flashGuard`); `prefers-reduced-motion` is honoured; plain English with short sentences, and every technical word is explained the first time it appears.

Audience: a curious adult or teenager who knows what a world map is and has never heard the word "projection". The second audience is a teacher, who should be able to run the tour in a 10-minute lesson.

---

## 0. Words the page uses (gloss once, then use freely)

| Word | Plain gloss shown on first use |
|---|---|
| projection | a rule for flattening the round Earth onto a flat map |
| centre / aspect | the point the rule is built around; moving it gives a new aspect of the same projection |
| heading | which way is "up" on the map, measured clockwise from north |
| Tissot circle | a small circle of the same size drawn everywhere on the globe, then flattened by the map; its new shape shows the stretch at that spot |
| conformal | keeps the shape of small things and all angles; sizes change |
| equal-area | keeps every area in proportion; shapes change |
| equidistant | keeps true distance along certain lines (for example, out from the centre) |
| compromise | keeps nothing exactly; spreads small errors around |
| great circle | the shortest path between two places on a sphere, like a string pulled tight on a globe |
| rhumb line | a path that keeps one compass bearing all the way; it is longer than the great circle |
| line of no distortion | where the map is a perfect, unstretched copy of the globe |

---

## 1. Learning objectives

Each objective has a check the page can observe (for a later evaluation study) or a teacher can ask.

1. **No flat map is perfect.** After 3 minutes a visitor can say that every flat world map stretches something, and can point to where the stretch is worst on the current map (by tapping the most swollen Tissot circle). *Check:* asked "is there a map with no distortion?", they answer "no, only very small areas come close".
2. **Distortion belongs to the projection, not to the land.** After dragging the land under Mercator, a visitor can predict that Greenland will look small when it sits on the equator, before they drop it there. *Check:* predict-then-reveal prompt in stop 2.
3. **Every map chooses what to keep.** A visitor can sort four projections into "keeps shapes" (Mercator, stereographic), "keeps areas" (Equal Earth, Mollweide, Lambert, Albers) and "keeps neither" (Robinson), using only the Tissot circles and the heat map. *Check:* they can name one thing a conformal map is good for (navigation, local street maps) and one thing an equal-area map is good for (comparing countries, mapping population or forests).
4. **The centre is a choice.** A visitor can re-centre a projection on a place they choose and explain that the distortion pattern moved with the centre. *Check:* they can make a map where their own city has the least distortion.
5. **The shortest route is usually not a straight line on the map.** Using the measure tool, a visitor can show that the London to Los Angeles great circle (8,761 km) is shorter than the constant-bearing route (9,733 km), and that it bends north on most maps. *Check:* they can say which map makes the shortest route straight (gnomonic) and which makes the constant-bearing route straight (Mercator).
6. **North up is a habit, not a rule.** A visitor can turn the heading to 180° and say that nothing about the Earth changed, only the map.

---

## 2. Misconceptions to confront

Method for every row: ask a question first (shown in the HUD for 4 seconds, then fades slowly), let the visitor act, then show the evidence. Prediction before reveal is what makes the correction stick.

| # | Misconception | Interaction that confronts it | Preset | Wall-label sentence |
|---|---|---|---|---|
| M1 | "Greenland is about as big as Africa." | Carry-a-country: pick Greenland, drag its ghost outline down to the equator; it shrinks to its true size on the map. Readout shows true areas: 2.17 vs 30.37 million km², about 14 times. | 2 Greenland and Africa | Africa is about fourteen times bigger than Greenland; Mercator just stretches the far north. |
| M2 | "Mercator is wrong, so nobody should use it." | Measure tool in rhumb mode on Mercator: a constant compass bearing is a straight line. Tissot circles stay circles everywhere. | 1 The sailor's map | Mercator is not wrong: it keeps every angle true, which is why sailors and web maps use it. |
| M3 | "The shortest route is a straight line on the map." | Measure London to Los Angeles on Mercator: the great circle curves north over Hudson Bay. Switch to gnomonic: it becomes straight. | 5 The shortest way | The shortest route between two cities bends on most maps; only a gnomonic map draws it straight. |
| M4 | "North must be up." | Heading dial or Q / E keys; preset turns to 180°. Globe view shows the same Earth, only the camera turned. | 10 South up | Up is a choice made by the mapmaker, not a fact about the Earth. |
| M5 | "There is one correct world map." | Toggle between conformal and equal-area versions of the same family with Tissot circles on: circles vs same-area ellipses. | 6 Shape or size | Every flat map must give up shape, size, or both; a map is a choice of what to keep. |
| M6 | "The distortion is stuck to the far north." | Transverse Mercator: same rule turned 90°. The undistorted line now runs north to south, and Greenland on that line is true size. | 3 Same rule, turned | Turn Mercator on its side and the stretch moves with it: distortion lives in the rule, not in the land. |
| M7 | "The edge of the map is the edge of the world." | Pacific-centred map: drag the land sideways, the cut (the map's edge) moves through the Atlantic. Globe shows the cut as a dashed line. | 9 Pacific in the middle | The edge of a world map is a cut the mapmaker chose; move the centre and the cut moves too. |
| M8 | "Equal-area maps look wrong, so they are less true." | Area heat map on Equal Earth: one flat colour. Angle heat map: shapes bend near the edges. | 7 Fair to every country | This map keeps every country's size in proportion; the price is bent shapes near the edges. |

---

## 3. Guided tour: 12 stops

Convention (to align with the cartographer): **centre** = the point on Earth that goes to the projection's natural centre (lat 0°, lon 0° for world maps; the tangent point for azimuthal maps; the middle of the standard-parallel band for conic maps). **Heading** = rotation of the map about that centre, clockwise, 0° = north up. Transverse Mercator is Mercator with centre on the equator and heading 90°.

All stops: graticule (the grid of latitude and longitude lines) on at 30° spacing unless stated. Globe camera faces the projection centre unless stated. On the globe the projection centre is a white ring; lines of no distortion are a bright white line (points are a small filled dot); the map's cut (edge) is a dashed grey line.

### Stop 1. The sailor's map
- **Projection:** Mercator. **Centre:** 0°, 0°, heading 0°.
- **Overlays:** Tissot on (15° grid), graticule on, heat map off.
- **Globe:** camera at 30°N, 0°; equator lit as the line of no distortion.
- **Notice:** the circles stay round but swell towards the poles. At 60°N each circle is twice as wide and four times the area.
- **Wall label:** *This is the map most of us grew up with. It keeps every angle true, so a ship can steer by it with a ruler. The price is size: at 60° north, every circle is four times too big.*
- **Try this:** Tap a circle near Norway and one near Nigeria. Compare their area readouts.

### Stop 2. Greenland and Africa
- **Projection:** Mercator. **Centre:** 0°, 0°, heading 0°.
- **Overlays:** area heat map on, Tissot off, carry-a-country on with Greenland selected; ghost starts on Greenland's real position.
- **Globe:** camera at 40°N, 20°W showing both; Greenland outline highlighted on the globe too.
- **Notice:** HUD asks "Drag Greenland next to Africa. Will it stay the same size?" As the ghost moves south it shrinks; at the equator it is a fraction of Africa.
- **Wall label:** *On this map Greenland looks as big as Africa. Drag it to the equator and see its true size. Africa is about fourteen times larger. The map did not lie about shape; it lied about size.*
- **Try this:** Carry Africa up to the Arctic instead. Watch it swell past the edge of the map.

### Stop 3. Same rule, turned
- **Projection:** transverse Mercator. **Centre:** 0°, 2°W, heading 90°. (2°W is the line Britain's national grid is built on.)
- **Overlays:** Tissot on, area heat map on, graticule on.
- **Globe:** camera at 50°N, 2°W; the meridian 2°W lit as the line of no distortion, running pole to pole.
- **Notice:** the heat-map stripe now runs up and down. Britain and West Africa sit on the cool, true-size band; Asia and the Americas swell at the sides.
- **Wall label:** *Same rule as the sailor's map, turned on its side. Now the true-size line runs north to south. Mapping agencies use narrow strips like this for each country, so small areas stay accurate in both size and shape.*
- **Try this:** Drag the land sideways until your country sits on the bright line.

### Stop 4. Distance from here
- **Projection:** azimuthal equidistant. **Centre:** the visitor's city (select list; default London 51.51°N, 0.13°W), heading 0°.
- **Overlays:** distance rings every 2,000 km (labelled), graticule faint, Tissot off, angle heat map off.
- **Globe:** camera on the city; rings drawn as small circles on the globe; the antipode (the point exactly opposite) marked.
- **Notice:** every ring is a true distance. The outer edge of the disc is one single point: the antipode, 20,015 km away.
- **Wall label:** *From the centre, every distance and direction is true. Each ring is 2,000 km further away. The outer edge is one point stretched into a circle: the place on the far side of the Earth from you.*
- **Try this:** Choose another city. Find which city on the list is furthest from it.
- **City list (lat, lon):** London 51.51, −0.13 · New York 40.71, −74.01 · São Paulo −23.55, −46.63 · Lagos 6.52, 3.38 · Nairobi −1.29, 36.82 · Cairo 30.04, 31.24 · Mumbai 19.08, 72.88 · Beijing 39.90, 116.40 · Tokyo 35.68, 139.69 · Sydney −33.87, 151.21 · Reykjavík 64.15, −21.94 · Honolulu 21.31, −157.86 · "Tap the globe" (custom).

### Stop 5. The shortest way
- **Projection:** gnomonic. **Centre:** 60.2°N, 72.7°W (the midpoint of the route), heading 0°.
- **Overlays:** measure tool on with London Heathrow (51.47°N, 0.45°W) to Los Angeles (33.94°N, 118.41°W); great circle solid white, rhumb line dashed; graticule on; Tissot off.
- **Globe:** camera on the route midpoint; both paths drawn on the globe, where the great circle is visibly the tight string.
- **Notice:** on this map the shortest route is a straight line. Press "Show on Mercator" (part of this stop): the same route bends north, and the rhumb line becomes the straight one.
- **Wall label:** *On a gnomonic map every straight line is a shortest route. London to Los Angeles is 8,761 km along it. Keeping one compass bearing the whole way takes 9,733 km. That is why long flights curve north on most maps.*
- **Try this:** Measure New York (40.64°N, 73.78°W) to Singapore (1.36°N, 103.99°E). The shortest route passes within 3° of the North Pole.

### Stop 6. Shape or size
- **Projection:** pair toggle, Mercator ↔ Lambert cylindrical equal-area (both centre 0°, 0°). A third button gives Gall–Peters (Lambert with standard parallels at 45°).
- **Overlays:** Tissot on, heat map follows the toggle (angle heat for Lambert, area heat for Mercator).
- **Globe:** same camera as stop 1; standard lines lit (equator, or ±45° for Gall–Peters).
- **Notice:** Mercator keeps circles round but changes their size. Lambert keeps every ellipse the same area but squashes them flat near the poles. No setting does both.
- **Wall label:** *These two maps use the same cylinder. One keeps shapes and lets sizes grow. The other keeps sizes and lets shapes squash. Mathematics proves you cannot have both on a flat map. Every map chooses.*
- **Try this:** Switch the family to azimuthal: stereographic (keeps shape) against Lambert azimuthal (keeps size).

### Stop 7. Fair to every country
- **Projection:** Equal Earth. **Centre:** 0°, 0°, heading 0°.
- **Overlays:** area heat map on (one flat colour), then the stop switches to angle heat map after 6 seconds (slow 1.2 s cross-fade); Tissot on.
- **Globe:** camera at 20°N, 0°; no line of no distortion is lit (none exists for this map); the cut along 180° dashed.
- **Notice:** area is perfect everywhere, angle error grows towards the curved edges.
- **Wall label:** *This world map keeps every country's size in proportion, so it is fair for comparing them. Shapes bend near the edges instead. It was designed in 2018 to be equal-area and still look familiar.*
- **Try this:** Switch to Mollweide (also equal-area) and Robinson (keeps nothing exactly). Watch the area heat map in Robinson.

### Stop 8. Over the pole
- **Projection:** stereographic. **Centre:** 90°N, 0°, heading 0°.
- **Overlays:** Tissot on, graticule on (meridians every 30°, parallels every 10°), area heat map on.
- **Globe:** camera at 70°N, 0°; the centre (North Pole) marked as the point of no distortion.
- **Notice:** the Arctic Ocean is in the middle, with the land around it. Circles stay round and grow away from the pole.
- **Wall label:** *Put the pole in the middle and the Arctic becomes an ocean ringed by land. This map keeps shapes, like Mercator, but from one point instead of a line. Polar scientists and weather charts use it.*
- **Try this:** Set the centre to 90°S and find Antarctica's true shape.

### Stop 9. Pacific in the middle
- **Projection:** Equal Earth. **Centre:** 0°, 180°, heading 0°.
- **Overlays:** graticule on, heat off, cut line shown on the map edge and globe.
- **Globe:** camera at 0°, 180°; the cut is a dashed line down the Atlantic (0°).
- **Notice:** the Pacific is whole, Africa and Europe are split at the edges.
- **Wall label:** *Many maps in East Asia and Oceania put the Pacific in the middle. The edge of a world map is a cut through the globe. The mapmaker decides where to cut, and what to split.*
- **Try this:** Drag the land until the cut runs through land you care about. Then move it back to the ocean.

### Stop 10. South up
- **Projection:** Equal Earth. **Centre:** 0°, 20°E, heading 180°.
- **Overlays:** graticule on, compass rose in the HUD showing where north points.
- **Globe:** same as the map: camera at 0°, 20°E, with the camera turned 180° so south is up.
- **Notice:** every shape is correct, it only looks strange.
- **Wall label:** *Nothing is wrong with this map. The Earth has no top. North went up on most maps by habit and history. Turn the heading and every distance, area and angle stays exactly the same.*
- **Try this:** Set any heading you like and find the one that feels "right" for your home.

### Stop 11. A map for one country
- **Projection:** Albers equal-area conic, standard parallels 29.5°N and 45.5°N. **Centre:** 37.5°N, 96°W, heading 0°.
- **Overlays:** area heat map off, angle heat map on, Tissot on, graticule 10°.
- **Globe:** camera on 37.5°N, 96°W; both standard parallels lit.
- **Notice:** between the two bright lines the map is almost perfect. Outside them the errors grow fast.
- **Wall label:** *A cone touches the globe along two lines. Close to them the map is nearly perfect, so a country that fits between them maps well. This is how many national maps of mid-latitude countries are made.*
- **Try this:** Switch to Lambert conformal conic (same lines). Now shapes are perfect and sizes drift slightly.
- **Second setting for Europe (button):** Lambert azimuthal equal-area centred 52°N, 10°E (the European statistics grid).

### Stop 12. What the eye sees
- **Projection:** orthographic. **Centre:** 20°N, 20°E, heading 0°.
- **Overlays:** Tissot on, graticule on, area heat map on.
- **Globe:** set to match the map exactly (same view), then both slowly turn together at 4°/s (none under reduced motion).
- **Notice:** the map and the globe are the same picture. Circles near the rim squash to slivers. Only half the Earth fits.
- **Wall label:** *This is the Earth as a far-away camera sees it: a photograph is a projection too. It shows half the world, and shapes near the rim squash to almost nothing. Every view of a sphere chooses.*
- **Try this:** Press Reset to natural aspect, then pick any projection and try to make a map with no colour in the heat map. You cannot.

---

## 4. Page layout and controls

### Page order (same as the family)
Header → hero (eyebrow `Video Synth · Instrument · Map projections`, h1, paragraph) → stage → tour strip → controls grid → hint → readouts → plots → about (How it works, Lineage, Limits, Sources) → footer.

### The stage (always black)
- **Desktop and tablet (wider than 640 px):** 16:9. The map takes the left 66% of the width. The globe takes the right 34%, as a sphere filling about 90% of that column's width, vertically centred. A thin 1 px line (`rgba(255,255,255,.18)`) separates them. HUD tl: projection name and what it keeps. HUD tr (top of the globe column): centre and heading. HUD bl: heat-map legend when on. Wall label bottom-left, over the map.
- **Phone (640 px and narrower):** 4:5. Map on top, full width, 56% of the height. Globe below, a sphere 44% of the height, centred. HUD tr moves to the bottom (as the family already does). The wall label sits over the map, at its bottom. All overlays use `env(safe-area-inset-*)` padding in fullscreen.
- **Swap view** button: makes the globe the big view and the map the small one (same split). Useful on phones, where the globe is small.
- **Fullscreen and installation:** same split. In landscape fullscreen on a phone, use the desktop layout.
- **Pointer feedback:** a small crosshair on the map and a matching dot on the globe follow the pointer, so the visitor sees the same place in both views. On touch, the last touched point stays marked.
- **Never flashing:** the tour transitions move the land in 1.6 s with an ease-in-out curve. Heat-map changes cross-fade over 0.8 s or more. Under reduced motion every transition is an instant cut with a 300 ms cross-fade and no automatic turning.

### What dragging does
| View | Gesture | Effect |
|---|---|---|
| Map | one-finger drag / mouse drag | **Moves the land under the projection.** The distortion pattern (heat map, Tissot grid, lines of no distortion) stays still on the screen. Land and oceans slide through it and change shape as they go. This is the core teaching move. In maths terms it changes the centre. |
| Map | two-finger twist / Shift + drag | changes the heading |
| Map | pinch / wheel / + and − | zooms the paper 1× to 8×; the readouts still report Earth values |
| Map | double tap / double click | puts the centre on that point (animated) |
| Globe | drag the white centre ring | moves the projection centre on the sphere; the map updates live |
| Globe | drag the heading tick on the ring | changes the heading |
| Globe | drag anywhere else | turns the camera only (look around); the map does not change |
| Either | tap in Measure mode | places point A, then B; a third tap starts again |
| Either | tap in Carry mode | picks up the selected country's ghost, drag to move it |

The `drag` / `cross` canvas cursor classes from `_chrome.css` show the mode. A mode switch (segmented: **Move land · Measure · Carry a country**) sits first in the controls.

### Tour strip (above the controls)
A row of 12 numbered buttons (`.seg`, 44 pt high on touch), labelled with the stop names, plus **Previous** and **Next**. Selecting a stop applies its settings and shows its wall label. Any manual change keeps the stop highlighted but adds "(changed)" to the HUD name; **Back to this stop** restores it.

### Controls grid (`.controls`, `.ctl` blocks)
| Group | Control | Type | Default | Range / options |
|---|---|---|---|---|
| **Projection** | Projection | `select` (16 px font) grouped by family: Cylinders (equirectangular, Mercator, transverse Mercator, Lambert equal-area, Gall–Peters), World ovals (sinusoidal, Mollweide, Robinson, Equal Earth), From one point (azimuthal equidistant, Lambert azimuthal equal-area, stereographic, orthographic, gnomonic), Cones (Lambert conformal conic, Albers) | Mercator | 15 options |
| | Keeps | read-only chips under the select: Shape / Area / Distance from centre / Straight shortest routes / Nothing exactly | — | — |
| | Standard parallels (conics and Gall–Peters only; hidden otherwise) | two sliders | 29.5°, 45.5° | −80° to 80°, step 0.5°; second never below first |
| **Centre** | Latitude | slider | 0° | −90° to 90°, step 0.1° |
| | Longitude | slider | 0° | −180° to 180°, step 0.1°, wraps |
| | Heading | slider | 0° | 0° to 359°, step 1°; segmented quick set N up / E up / S up / W up |
| | Centre on a city | `select` | — | the 12 cities of stop 4 |
| | Reset to natural aspect | button | — | centre and heading back to the projection's textbook position (0°, 0°, 0° for world maps; 90°N for polar stereographic in stop 8; the band's middle for conics), zoom 1× |
| **Show** | Graticule | toggle + segmented spacing 10° / 15° / 30° | on, 30° | — |
| | Tissot circles | toggle + segmented grid 15° / 30° | off, 15° | — |
| | Heat map | segmented Off / Area / Angle | Off | exclusive; never both at once |
| | Heat style | segmented Smooth / Bands | Bands | bands show class edges as thin isolines |
| | Lines of no distortion | toggle | on | on map and globe |
| | Map edge (the cut) | toggle | on | dashed on the globe |
| | Land | segmented Outline / Filled | Filled | filled = 22% grey, outline 1 px white 70% |
| **Tools** | Mode | segmented Move land / Measure / Carry a country | Move land | — |
| | Measure shows | toggles Great circle / Rhumb line / Straight on map | first two on | — |
| | Country to carry | `select` | Greenland | Greenland, Africa (continent), Antarctica, Australia, Brazil, India, Indonesia, Russia, Alaska, Democratic Republic of the Congo, United Kingdom, your choice (tap a country) |
| | Clear | button | — | removes measure points and ghosts |
| **Room** | Swap view · Wall label · Installation · Fullscreen | buttons (`.btn`) | label on | as in the family |

Hint line under the controls: *"Drag the map to move the land through the projection. Drag the white ring on the globe to move the centre. The colours stay with the projection; the land moves through them."*

### Keyboard (stage has `tabindex="0"` and a visible focus ring; keys act only when the stage is focused)
| Key | Action |
|---|---|
| Arrow keys | move the land 5° (Shift: 1°) |
| Q / E | heading −5° / +5° |
| + / − | zoom |
| 0 | reset to natural aspect |
| [ / ] | previous / next tour stop |
| T, G, H | Tissot, graticule, heat map (cycles Off → Area → Angle) |
| M, C, V | Measure, Carry, Move land |
| Enter | in Measure mode, places a point at the pointer crosshair (moved with arrows while Measure is on) |
| Esc | clear the measure or leave installation |
A polite `aria-live` region announces the stop name and, after each keyboard move, the centre in words ("Centre 30 degrees north, 10 degrees east, north up"). The canvas `aria-label` is rewritten per stop.

---

## 5. Readouts (`MUSEUM.readouts('ro', …)`)

Tag rules: **MODEL** = computed by the instrument from the projection maths. **DATA** = published reference values. **DRAWN** = on screen for the eye, not a measurement.

### Under the pointer (or the last tapped point)
| id | Label | Value / sub-line | Tag |
|---|---|---|---|
| ll | Place | `51.5° N · 0.1° W` / nearest named land or ocean from Natural Earth | MODEL |
| area | Area here | `× 3.86` / `this spot looks 3.86 times its true size` (or "shrunk to 0.41") | MODEL |
| ang | Angle error here | `22.4°` / `the most any angle is bent at this spot` (2ω) | MODEL |
| hk | Stretch north–south · east–west | `h 1.96 · k 1.96` / `along the meridian · along the parallel` | MODEL |
| ab | Tissot circle | `a 1.96 · b 1.96` / `longest and shortest stretch; a = b means shape is kept` | MODEL |
| dist | From the centre | `4,312 km` / great-circle distance from the projection centre | MODEL |

### The map as a whole
| id | Label | Value / sub-line | Tag |
|---|---|---|---|
| proj | Projection | `Mercator` / `cylinder · keeps shape (conformal)` | MODEL |
| ctr | Centre | `0.0°, 0.0° · heading 0°` / `natural aspect` or `oblique aspect` | MODEL |
| nod | No distortion along | `the equator` / or `the meridian 2° W`, `two parallels 29.5° N, 45.5° N`, `one point: 90° N`, `none` | MODEL |
| spread | Area range on land | `× 0.98 to × 33` / smallest and largest area scale over all land drawn | MODEL |
| worst | Mean angle error, whole Earth | `0.0°` / area-weighted over the sphere, edges included | MODEL |
| gvsa | Greenland ÷ Africa, as drawn | `0.93` / `true ratio 0.071` | MODEL |
| true | True areas | `Greenland 2.17 · Africa 30.37 million km²` / published figures | DATA |

### Measure tool cells (shown when Measure has two points)
See section 6. Ghost country cells: `Ghost area as drawn` (MODEL, "× 0.10 of its drawn size at home") and `True area` (DATA).

Update rate: pointer cells every 100 ms, whole-map cells on change only (they need a sampling pass), following the `hudAt` / `roAt` throttling pattern in Orbit Loom.

### Plots (`MUSEUM.plot`)
1. **How fast it stretches.** x: distance from the line or point of no distortion, 0° to 90°. y: area scale, log axis × 0.25 to × 64. Current projection bold in `--live`; Mercator, stereographic, Lambert equal-area, azimuthal equidistant as faint reference lines; a dot marks the pointer. Note: *"Conformal maps grow fast away from their true line; equal-area maps stay flat at × 1."*
2. **What it gives up.** x: same. y: angle error, 0° to 90°. Same styling. Note: *"Equal-area maps pay in angles. Conformal maps stay at zero."*
For pseudocylindrical maps (no single line), x is latitude 0° to 90° along the central meridian and along the map edge, two lines, and the cap says so.

---

## 6. Measurement tools

### Two-point measure
Three paths, each toggleable, each with its own line style so colour is never the only signal:
- **Great circle**: solid white, 2 px, with small ticks every 1,000 km. Densified to at least 1 point per degree and re-projected, so it curves correctly and splits cleanly at the map cut.
- **Rhumb line** (constant bearing): dashed `--accent` equivalent on black (`#E07A5F`), 2 px.
- **Straight on the map** ("what a ruler would draw"): dotted light grey, 1.5 px. Its points are turned back into places on the globe, so its true ground length can be measured.

| id | Label | Value / sub-line | Tag |
|---|---|---|---|
| mgc | Shortest route (great circle) | `8,761 km` / `starts heading 312° from A` | MODEL |
| mrh | Constant bearing (rhumb line) | `9,733 km` / `+11.1% · bearing 262° all the way` | MODEL |
| mst | Ruler line on this map, on the ground | computed live / `+N% longer than the shortest route` (on Mercator it equals the rhumb line, 9,733 km for stop 5; on gnomonic it equals the great circle) | MODEL |
| mrul | Ruler line at the map's nominal scale | computed live / `what a ruler and the scale bar would say; wrong by N%` | MODEL |
| mmax | Furthest north on the route | `62.3° N` / for the great circle | MODEL |
| mpts | A and B | `51.47° N 0.45° W → 33.94° N 118.41° W` | DRAWN (they are where you tapped) |

Distances use a sphere of radius 6,371.0 km (the mean Earth radius). Points snap to a city from the list if tapped within 20 px.

### Distance rings (azimuthal equidistant and any other projection)
Rings of equal true distance from the centre at 1,000 / 2,000 / 5,000 km (segmented), drawn as small circles on the sphere and re-projected. On azimuthal equidistant they are perfect circles; on other maps they bend. That bending is the lesson.

### Carry a country
A ghost outline (1.5 px white, 25% white fill) of the chosen country. Dragging moves it across the sphere along the great circle from where it started to the pointer, as a rigid turn of the sphere. It keeps its true size and shape on the globe and is re-projected at every frame. The globe shows the ghost too. Release leaves it in place; **Clear** removes it.

### Tap a Tissot circle
Tapping any Tissot circle pins its numbers (a, b, area, angle error) in the pointer cells and draws the original unit circle beside it as a faint reference.

---

## 7. Colour scales for the heat maps

Both scales are perceptually ordered and safe for the common colour-vision types. Undistorted places are dark on both, so they disappear into the black stage and distortion "glows". Land is drawn on top as an outline plus a 22% grey fill, so the coastline stays readable over any colour. Heat-map opacity is 70%.

### Area scale: diverging, dark in the middle
- **Scale:** a dark-centred blue–black–orange diverging map (the published *berlin* scientific colour map is the reference: sample its LUT, do not hand-pick). Blue = shown smaller than true. Orange to pale peach = shown larger than true. Near-black = true size.
- **Mapping:** log₂ of area scale, clamped to −3 … +3 (× 1/8 … × 8). Beyond ×8, the brightest colour plus a fine diagonal hatch (the far Mercator Arctic), so "off the scale" is shown by texture as well as colour.
- **Bands mode classes:** < ×1/4 · ×1/4–1/2 · ×1/2–1/1.1 · ×1/1.1–×1.1 (true) · ×1.1–2 · ×2–4 · ×4–8 · > ×8. Isolines at ×1/2, ×2, ×4 in white at 35%.
- **Legend (HUD bl):** a 160 px bar, ticks `×⅛ ×¼ ×½ ×1 ×2 ×4 ×8`, caption **"Size on the map compared with the globe"**, end labels **"shrunk"** / **"swollen"**, middle label **"true size"**.

### Angle error: sequential, black to pale yellow
- **Scale:** *inferno* (perceptually uniform, readable for colour-blind viewers): 0 `#000004` · 0.25 `#420A68` · 0.5 `#932667` · 0.75 `#DD513A` · 1.0 `#FCFFA4`. Sample the full LUT in the shader.
- **Mapping:** 2ω in degrees, 0° → 0, 60° and above → 1, square-root curve so small errors (1–10°) are visible.
- **Bands mode classes:** < 1° (shape kept) · 1–5° · 5–10° · 10–20° · 20–40° · > 40°. Isolines at 5°, 20°.
- **Legend:** ticks `0° 5° 10° 20° 40° 60°+`, caption **"How much shapes are bent here"**, end labels **"shape kept"** / **"badly bent"**.

### Other ink on the stage
Graticule `rgba(235,238,242,.22)`, equator and the centre's own lines at `.45`. Lines of no distortion pure white 2 px with a 6 px soft glow at 25% (steady, never pulsing). Tissot circles white 1 px stroke, 12% fill. Cut line dashed `rgba(255,255,255,.4)`. All overlay text uses the HUD style.

---

## 8. Page text outlines

### Hero paragraph (draft)
*The Earth is round and paper is flat. Every map has to stretch the globe to lay it flat, and every map stretches it in a different way. Choose a projection, move its centre anywhere on Earth, and drag the land through it. The globe beside the map shows where the map is true and where it lies.*

### How it works (outline)
1. **From globe to paper.** A projection is a formula that turns latitude and longitude into x and y. The instrument computes it for every pixel on the GPU, in reverse: for each pixel it asks "which place on Earth lands here?" (the inverse projection), then colours it.
2. **Moving the centre.** Before projecting, the whole sphere is turned so that the chosen centre sits where the formula is best (the oblique aspect). Turning a sphere does not stretch it, so the kind of distortion stays the same; only its place on Earth moves.
3. **Measuring the stretch.** At each point the instrument measures how a tiny step north and a tiny step east change length on the map (h and k) and the angle between them. From these come Tissot's ellipse: its long and short axes a and b, the area scale a × b, and the largest bent angle 2ω, where sin ω = (a − b) / (a + b). Written as maths for the curious, in plain words first.
4. **Why no map is perfect.** In 1827 Gauss proved that a curved surface cannot be flattened without stretching. A sphere's curvature is the reason; an orange peel tears when pressed flat.
5. **Routes.** Great circles are computed by spherical interpolation between the two points; rhumb lines by the Mercator formula, where they are straight. Lengths use a sphere of radius 6,371 km.
6. **The land.** Natural Earth coastlines at 1:110 million, drawn as lines and a filled mask on both views.

### Lineage
*An instrument in the language of the cartographer's drafting table and the museum globe: a fine grid, a single bright line where the paper touches the Earth, and a field of colour that shows what the flattening costs. It recreates no specific work.*

### Limits (outline)
- The Earth is drawn as a perfect sphere. Real mapping uses an ellipsoid (slightly flattened at the poles), which moves positions by up to about 20 km and changes the numbers slightly.
- Distortion is measured from small differences across each pixel. Near a projection's edge or cut, and at the poles of Mercator (which go to infinity), values are clamped and shown as "off the scale".
- Coastlines are simplified (1:110 million), so small islands are missing and the areas computed from them are rough. Published areas are shown for comparison.
- The gnomonic and orthographic maps can only show part of the Earth; the rest is left black on purpose.
- Robinson is defined by a table of numbers; the instrument interpolates between them as the published method does.
- Real flight paths follow winds, air-traffic routes and airspace rules, so they are not exactly great circles.
- The colour scales are designed for common colour-vision differences but have not been tested with visitors yet.

### Sources (real references only)
- J. P. Snyder (1987). *Map Projections: A Working Manual.* U.S. Geological Survey Professional Paper 1395.
- J. P. Snyder and P. M. Voxland (1989). *An Album of Map Projections.* U.S. Geological Survey Professional Paper 1453.
- J. P. Snyder (1993). *Flattening the Earth: Two Thousand Years of Map Projections.* University of Chicago Press.
- N. A. Tissot (1881). *Mémoire sur la représentation des surfaces et les projections des cartes géographiques.* Gauthier-Villars, Paris.
- C. F. Gauss (1827). *Disquisitiones generales circa superficies curvas* (the Theorema Egregium).
- B. Šavrič, T. Patterson and B. Jenny (2018, online). The Equal Earth map projection. *International Journal of Geographical Information Science* 33(3), 454–465 (2019).
- A. H. Robinson (1974). A new map projection: its development and characteristics. *International Yearbook of Cartography* 14, 145–155.
- D. M. Goldberg and J. R. Gott III (2007). Flexion and skewness in map projections of the Earth. *Cartographica* 42(4), 297–318.
- F. Crameri, G. E. Shephard and P. J. Heron (2020). The misuse of colour in science communication. *Nature Communications* 11, 5444. (The *berlin* colour map is from Crameri's Scientific Colour Maps.)
- S. van der Walt and N. Smith (2015). The *inferno* colour map, designed for matplotlib.
- Natural Earth, land at 1:110m (public domain), the same file as Orbit Loom: `/visual-synths/data/land-110m.json`.
- Published areas: Greenland 2,166,086 km² (CIA World Factbook); Africa about 30.37 million km².
- Implementation check: projection formulas cross-checked against d3-geo and PROJ outputs at test points (named in the code comments, not as a citation).

Cartographer to confirm or replace the conic standard-parallel sources (US Albers 29.5°/45.5°, from Snyder 1987) and the European LAEA centre (52°N, 10°E, EPSG:3035).

---

## 9. Installation mode script

Uses `MUSEUM.install`. Wall label always on and enlarged. Cursor hidden. One loop is about 5 minutes; it repeats until stopped.

| Step | Stop | Dwell | Motion during the dwell (normal motion) |
|---|---|---|---|
| 1 | 1 The sailor's map | 24 s | land drifts east at 3°/s for 12 s, then holds |
| 2 | 2 Greenland and Africa | 28 s | ghost Greenland glides from home to the equator over 8 s, holds 10 s, glides back |
| 3 | 3 Same rule, turned | 24 s | heading turns 0° → 90° over 6 s at the start (shows that it is the same rule) |
| 4 | 4 Distance from here | 24 s | centre steps through London → Nairobi → Tokyo, 8 s each, 1.6 s moves |
| 5 | 5 The shortest way | 30 s | 15 s on gnomonic, then morph to Mercator for 15 s; route stays drawn |
| 6 | 6 Shape or size | 24 s | toggles Mercator ↔ Lambert every 8 s (1.2 s morph) |
| 7 | 7 Fair to every country | 24 s | area heat 12 s, then angle heat 12 s (1.2 s cross-fade) |
| 8 | 8 Over the pole | 20 s | heading turns at 4°/s |
| 9 | 9 Pacific in the middle | 20 s | holds still |
| 10 | 10 South up | 20 s | heading 0° → 180° over 6 s at the start |
| 11 | 11 A map for one country | 20 s | holds still |
| 12 | 12 What the eye sees | 24 s | map and globe turn together at 4°/s |

Between stops: 1.6 s ease-in-out move (centre slerp, projection morph in screen space where both are world maps, otherwise a 600 ms dark cross-fade, never a flash; total brightness change limited by `GLX.flashGuard`). Under reduced motion: no drifting or turning, every change is a 300 ms cross-fade, dwell times unchanged. HUD tl shows the stop number and name ("STOP 5 OF 12 · THE SHORTEST WAY"). The "Try this" prompt is hidden in installation mode, since nobody is at the controls.

---

## 10. Name, line and hub card

- **Name:** **Rind**. The peel of an orange: the classic picture of why a globe cannot lie flat without tearing or stretching. One short, concrete word, like Cone, Ring, Chain, Relic and Plume. (Fallbacks if taken or disliked: Peel, Graticule.)
- **Page path:** `/visual-synths/rind` (source `tools/_studies/rind.src.html`, thumb `thumbs/rind.jpg`).
- **Eyebrow:** `Video Synth · Instrument · Map projections`
- **One-line description:** *Flatten the Earth fifteen ways, move the centre anywhere, and drag the land through the stretch.*
- **Hub card:**
  - h3: `Rind`
  - tag: `Model · Maps`
  - p: *Fifteen map projections on one black wall, with a globe beside them. Re-centre any map, drag the land through it, and watch Tissot's circles show what each map keeps and what it gives up.*
  - thumb: the Mercator heat map (area, bands) with the land outline and the small globe on the right, the equator lit.

---

## 11. Acceptance criteria for the education layer (for the QA pass)

1. Every wall label is 45 words or fewer and has no unexplained technical word (check against section 0).
2. Every stop restores exactly from its button, and the readouts for stop 5 show 8,761 km and 9,733 km (± 5 km).
3. The Greenland ghost at the equator reads an area ratio to Africa as drawn within 10% of 0.071 on Mercator.
4. Every heat map is readable without colour: bands mode isolines and the pointer readout carry the same information.
5. All touch targets are at least 44 pt; the projection and city selects use 16 px text; nothing in fullscreen sits under the notch or home bar.
6. With reduced motion on, nothing moves on its own anywhere on the page, including installation mode.
7. No brightness change on the stage happens more than 3 times a second, including tour transitions and heat-map toggles.
8. Keyboard alone can run the whole tour and place measure points.
