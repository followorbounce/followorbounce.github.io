# Map-projection instrument: math specification (GPU-ready)

Status: spec for implementation. It is not the page.
Owner: Applied Mathematician (spec), with Pure Mathematician review of the identities in sections 2, 5 and 6.
Audience: the WebGL 2 / JS implementer of the `projection` study.
Verification: `_projection-check.py` in this folder (`python3 _projection-check.py`, needs numpy). Every number
in this file was printed by that script: round trips, analytic-vs-numeric Jacobians, equal-area and conformal checks,
the TM identity, both drag solvers and the float32 experiments.
Known limitations: spherical Earth only (no ellipsoid, so no UTM-grade accuracy). Robinson is defined by a table,
so values between table nodes depend on the interpolation used (see 4.6).

---

## 0. Conventions (read first)

* Unit sphere, R = 1. All angles are in radians in code; test vectors are given in degrees in, unit-sphere x, y out.
* φ = latitude, λ = longitude (east positive). Map x points right (east in the normal aspect), map y points **up**.
  Flip y once, when turning pixels into map coordinates.
* Geographic unit vector: `p = (cos φ cos λ, cos φ sin λ, sin φ)`. +x goes through (0°, 0°), +z is the north pole.
* **Frame**: the rotated sphere the projection actually sees. `q = M p`. Frame coordinates (φ', λ') come from q exactly
  as (φ, λ) come from p. **Every projection formula below is written in frame coordinates.** It is the textbook
  formula in its natural aspect, centred on frame (φ_ref, 0).
* `φ_ref` = 0 for every projection except the conics, where φ_ref = φ_C (the conic's origin latitude, default 45°).
* Atan2 order is JS-style `atan2(y, x)`. In GLSL it is `atan(y, x)`.
* Snyder = J. P. Snyder, *Map Projections — A Working Manual*, USGS Professional Paper 1395 (1987). Chapter and equation
  numbers are given. Page numbers refer to the 1987 printing and are approximate: check them against your copy before
  you quote them in public text.

Pipeline for each fragment of the flat map:

```
pixel -> map (x, y) -> [inverse projection, domain test] -> frame unit vector q
      -> p = M^T q -> (φ, λ) geographic -> sample equirectangular land texture
      -> overlays: geographic graticule from (φ, λ); projection graticule + distortion from q (frame!)
```

Pipeline for each fragment of the 3D globe view:

```
pixel in disc -> view-space sphere point s -> p = V^T s (V = globe camera rotation) -> land from p
              -> q = M p -> the same overlay functions as the flat map (distortion, aspect lines, cut line)
```

---

## 1. Aspect rotation M (oblique and transverse aspects)

### 1.1 Construction

The user picks a centre (φ0, λ0) and a heading γ: the azimuth, clockwise from geographic north at the centre, that
becomes the projection's "up". Define the elementary rotations (row-major maths notation):

```
Rx(a) = [[1,0,0],[0,cos a,-sin a],[0,sin a,cos a]]
Ry(a) = [[cos a,0,sin a],[0,1,0],[-sin a,0,cos a]]
Rz(a) = [[cos a,-sin a,0],[sin a,cos a,0],[0,0,1]]

M = Ry(-φ_ref) · Rx(γ) · Ry(φ0) · Rz(-λ0)          q = M p,   p = Mᵀ q
```

How it works, read right to left: Rz(−λ0) brings the centre meridian to λ = 0. Ry(φ0) brings the centre to (1,0,0),
where local north is +z and local east is +y. Rx(γ) turns the heading-γ direction `(0, sin γ, cos γ)` onto +z.
Ry(−φ_ref) slides the centre up the frame meridian to latitude φ_ref, which only matters for the conics.

Properties, all checked in the script:
* Natural aspect: (φ0, λ0, γ) = (φ_ref, λ0, 0) gives M = Rz(−λ0). For the cylindricals and pseudocylindricals that is
  φ0 = 0. For the azimuthals the *natural* (polar) aspect is φ0 = 90°. Use it as their default.
* **Transverse aspect** = centre on the equator, γ = 90°.
* Test vector: φ0 = 40°, λ0 = −74°, γ = 30°, φ_ref = 0:
  ```
  M = [[ 0.2111504647, -0.7363691806,  0.6427876097],
       [ 0.9210651869, -0.0702346015, -0.3830222216],
       [ 0.3271916911,  0.6729246099,  0.6634139482]]
  geo (40, -74)    -> frame (0, 0)
  geo (51.5, 0)    -> frame (46.292341, 23.327683) -> oblique Mercator (0.407145, 0.913640)
                                                    -> oblique az. equidistant (0.312743, 0.826233), ρ = 0.883441237
  geo (-33.9,18.4) -> frame (3.667979, 112.701354) -> oblique Mercator (1.967010, 0.064062)
                                                    -> oblique az. equidistant (1.961423, 0.136298), ρ = 1.966152908
  ```
  (ρ equals the great-circle distance from the centre in both cases. This is the azimuthal-equidistant property.)

GLSL note: `mat3` is column-major. Either upload with `uniformMatrix3fv(loc, true, rowMajorArray)`, which is legal in
WebGL 2 (WebGL 1 required `false`), or upload the transposed array. Applying `p = Mᵀ q` in GLSL is `q * Mgl` when Mgl
holds M, because row-vector times matrix gives the transpose product. Pick one convention and unit-test it with the
vector above.

Read-back for the UI: centre = `Mᵀ · (cos φ_ref, 0, sin φ_ref)`. Heading: take the frame-north tangent at the centre,
map it to geographic coordinates with Mᵀ, and measure its azimuth against geographic north and east there.

Re-orthonormalise M (Gram–Schmidt on its rows) after every drag update. It costs nothing and stops float drift.

### 1.2 Key teaching point: distortion lives in the frame

The rotation is an isometry of the sphere. Write the local linear map of the projection at a point as a 2×2 matrix D.
In geographic tangent coordinates, `D_geo = D_frame · Rot(β)`, where β is the angle between geographic north and
frame north at that point. Singular values are invariant under rotation, so a, b, s = ab and ω (section 5) are
**functions of the frame position (φ', λ') only**. When the user re-centres the map, the whole distortion pattern moves
with the projection centre and its aspect lines: Mercator's "big poles" become "big at 90° from the chosen centre
line". Only h and k (scale along the geographic meridian and parallel) and the tilt of each ellipse relative to the
coastlines depend on the aspect. Script check, Mollweide at geo (51.5°, 0°):

```
normal aspect : β = 0         h = 0.929682  k = 1.075637   a = 1.075637  b = 0.929682
aspect of 1.1 : β = -76.8735° h = 1.074059  k = 0.942236   a = 1.106914  b = 0.903412
```

Here a and b changed because the *frame position* of that city changed, not because of the rotation itself.

---

## 2. Shared GLSL helpers (GLSL ES 3.00, `precision highp float;` required)

```glsl
const float PI = 3.14159265358979, HALFPI = 1.57079632679490, SQRT2 = 1.41421356237310;
vec3 sph(float phi, float lam) { float c = cos(phi); return vec3(c*cos(lam), c*sin(lam), sin(phi)); }
// latitude via atan, not asin(z): asin loses precision near |z| = 1.
vec2 geo(vec3 v) {
  float rxy = length(v.xy);
  float lam = (rxy < 1e-20) ? 0.0 : atan(v.y, v.x);          // GLSL atan(0,0) is undefined
  return vec2(atan(v.z, rxy), lam);                         // (phi, lam), lam in (-PI, PI]
}
float sasin(float x) { return asin(clamp(x, -1.0, 1.0)); }
float sacos(float x) { return acos(clamp(x, -1.0, 1.0)); }
float angleBetween(vec3 a, vec3 b) { return atan(length(cross(a, b)), dot(a, b)); }  // precise at 0 and PI
```

Every inverse below has the signature `bool inv(vec2 m, out vec3 q)`: it returns false outside the map, and q is a
unit vector in the frame. Compile one program per projection with `#define PROJ n`, rather than a uniform switch, to
avoid divergent branches. There are only about 16 small programs.

---

## 3. Domain (outside-the-map) tests, all in map units, R = 1

| projection | inside the map iff |
|---|---|
| Equirectangular | \|x\| ≤ π, \|y\| ≤ π/2 |
| Mercator | \|x\| ≤ π, \|y\| ≤ π (that is, \|φ'\| ≤ 85.051129°, `atan(sinh π)`, a square map) |
| Transverse Mercator | \|y\| ≤ π (one turn along the central meridian), \|x\| ≤ x_max (default π, i.e. 85.05° from the CM) |
| Lambert CEA, std parallel φs | \|x\| ≤ π cos φs, \|y\| ≤ 1/cos φs |
| Mollweide | x²/8 + y²/2 ≤ 1 (semi-axes 2√2 = 2.828427125, √2 = 1.414213562) |
| Robinson | \|y\| ≤ 1.3523 and \|x\| ≤ 0.8487·π·X(φ'(y)) |
| Azimuthal equidistant | ρ = √(x²+y²) ≤ π (ρ = π is the antipode, smeared over the rim) |
| Lambert azimuthal equal-area | ρ ≤ 2 (ρ = 2 is the antipode) |
| Stereographic | whole plane. Clip at ρ ≤ ρ_max = 2 tan(c_max/2), default c_max = 160° (ρ_max = 11.34) |
| Orthographic | ρ ≤ 1 (near hemisphere only) |
| Gnomonic | whole plane maps to c < 90°. Clip at c_max = 70° (ρ ≤ tan 70° = 2.747) |
| Equal Earth | \|y\| ≤ 1.317362759 and \|λ'\| ≤ π after the inverse (x_max at the equator 2.706629984) |
| Sinusoidal | \|y\| ≤ π/2, \|x\| ≤ π cos y |
| Lambert conformal conic | \|θ\| ≤ nπ and φ' ≥ φ_min (default −60°: ρ grows without bound toward the far pole) |
| Albers | \|θ\| ≤ nπ and ρ_N ≤ ρ ≤ ρ_S (defaults ρ(+90°) = 0.378937, ρ(−90°) = 2.449490) |

Draw the boundary with a 1-pixel antialiased edge. Compute a signed distance-like value g (for example `1 − x²/8 − y²/2`
for Mollweide) and use `smoothstep(0, fwidth(g), g)`.

---

## 4. The projections

For each one: natural aspect · property · forward (JS) · inverse (GLSL) · teaching point · local scale matrix D
(section 5) · test vectors. Test vectors are **frame** (φ', λ') in degrees → (x, y), with the frame centred as in
section 0. In the normal aspect frame = geographic, with λ measured from the central meridian.

### 4.1 Equirectangular (plate carrée), Snyder ch. 12 (eq. 12-1, 12-2; ~p. 90)
* Natural aspect: normal. Property: none. Equidistant along every meridian; the equator is the only true-scale parallel.
* Forward `x = λ, y = φ`. Inverse `φ = y, λ = x`. The texture itself is in this projection.
* Teaching point: the "raw data" grid. Equal steps of latitude and longitude become a square grid, so parallels
  stretch by 1/cos φ.
* D = [[1/cos φ, 0], [0, 1]] (columns = east, north).
* Vectors: (0,0)→(0,0); (30,45)→(0.785398163, 0.523598776); (−60,120)→(2.094395102, −1.047197551).

### 4.2 Mercator, Snyder ch. 7 (eq. 7-1, 7-2 forward; 7-4 inverse; ~p. 38)
* Normal aspect; **conformal**; true scale on the equator.
* Forward `x = λ, y = atanh(sin φ)` (= ln tan(π/4 + φ/2)). Clamp |φ| ≤ 85.051129° first.
* Inverse `φ = atan(sinh y), λ = x`. In GLSL ES 3.00 `sinh` exists, and sinh(π) = 11.55 is safe.
* Teaching point: shapes are locally true and rhumb lines are straight (navigation), but areal scale is sec²φ, so
  Greenland looks larger than Africa. At 60° areas are ×4, at 80° ×33.
* D = [[sec φ, 0], [0, sec φ]].
* Vectors: (0,0)→(0,0); (30,45)→(0.785398163, 0.549306144); (−60,120)→(2.094395102, −1.316957897).

### 4.3 Transverse Mercator: Mercator re-centred, Snyder ch. 8 (spherical eq. 8-1…8-7; ~p. 58)
* This is Mercator with the cylinder touching a meridian instead of the equator. It is conformal, with true scale on
  the central meridian (the projection's "equator").
* Direct formulas in frame coordinates (central meridian = frame λ' = 0, map y along it):
  `B = cos φ' sin λ'`, `x = atanh(B)`, `y = atan2(sin φ', cos φ' cos λ')`.
  Inverse: `φ' = asin(sin y / cosh x)`, `λ' = atan2(sinh x, cos y)`.
* **Identity (verified to 4.4e-16):** TM in the normal aspect with central meridian λ0 is exactly the Mercator
  projection in the aspect (φ0 = 0, λ0, γ = 90°), with the map rotated by 90°: `x_TM = y_Merc, y_TM = −x_Merc`.
  The implementer can ship TM either way: (a) as a Mercator preset, aspect γ = 90° plus a screen rotation, or (b) with
  the direct formulas. In the instrument the user's (φ0, λ0, γ) then applies on top. γ ≠ 0 tilts the central line, which
  makes it the oblique Mercator (Snyder ch. 9).
* Teaching point: the same projection, the same distortion law. The blow-up now runs away from the central meridian,
  not away from the equator. This is why UTM uses many narrow 6° zones.
* D: conformal, with a = b = 1/√(1 − B²) (checked numerically to 1.5e-8). Using the frame form,
  `D = (1/√(1−B²)) · R(ψ)` for some rotation ψ. For the heat map only a = b is needed. For Tissot method B (5.3), use the
  Mercator D of the γ = 90° frame, or use finite differences.
* Vectors: (30,45)→(0.712708472, 0.684719203); (−60,60)→(0.463598695, −1.289761425); (10,−20)→(−0.350505858, 0.185486335).

### 4.4 Lambert cylindrical equal-area and Gall–Peters, Snyder ch. 10 (eq. 10-1…10-6; ~p. 76)
* Normal aspect; **equal-area**. Standard parallels ±φs, where shape is true. Lambert: φs = 0. Gall–Peters: φs = 45°.
  (Behrmann is 30°, if you want a third preset.)
* Forward `x = λ cos φs, y = sin φ / cos φs`. Inverse `φ = asin(y cos φs), λ = x / cos φs`.
* Teaching point: areas are now true everywhere (the heat map goes flat), and the price is shape. Near the poles the
  map compresses north–south as much as it stretches east–west. This is the substance of the Peters debate.
* D = [[cos φs / cos φ, 0], [0, cos φ / cos φs]], so det = 1.
* Lambert (φs = 0): (0,0)→(0,0); (30,45)→(0.785398163, 0.5); (−60,120)→(2.094395102, −0.866025404).
* Gall–Peters: (0,0)→(0,0); (30,45)→(0.555360367, 0.707106781); (−60,120)→(1.480960979, −1.224744871).

### 4.5 Mollweide, Snyder ch. 31 (eq. 31-1…31-6; ~p. 249)
* Normal aspect; **equal-area** pseudocylindrical. A 2:1 ellipse. Parallels are straight and true scale holds only at
  ±40°44'.
* Forward (JS, double): solve `2θ + sin 2θ = π sin φ`, then `x = (2√2/π) λ cos θ, y = √2 sin θ`.
  Use Newton on u = 2θ: `u ← u − (u + sin u − π sin φ)/(1 + cos u)`. A safe start: `u = φ` if |φ| < 60°, otherwise
  `u = sign(φ)·(π − cbrt(6π(1 − |sin φ|)))`. This is the asymptote u + sin u ≈ π − (π−u)³/6, which avoids the slow
  convergence Snyder's plain start shows near the poles. If |sin φ| > 1 − 1e-15, return θ = ±π/2. Stop when
  |Δu| < 1e-12. Measured: at most **6 iterations**, mean 4.5, over φ ∈ [−89.9999°, 89.9999°]. (A 1e-15 tolerance
  never terminates near 86°, so do not use it.)
* Inverse (closed form, so the shader needs no iteration):
  ```glsl
  bool invMoll(vec2 m, out vec3 q) {
    if (m.x*m.x/8.0 + m.y*m.y/2.0 > 1.0) return false;
    float st = clamp(m.y / SQRT2, -1.0, 1.0), ct = sqrt(max(1.0 - st*st, 0.0)), th = asin(st);
    float phi = sasin((2.0*th + 2.0*st*ct) / PI);
    float lam = clamp(PI * m.x / (2.0*SQRT2*max(ct, 1e-7)), -PI, PI);
    q = sph(phi, lam); return true;
  }
  ```
* Teaching point: equal-area, and the curved meridians spread the shape error more evenly than the cylinders do. It is
  the standard for whole-sky maps, such as the published Planck CMB maps.
* D (with dθ/dφ = π cos φ / (4 cos²θ)): east = ((2√2/π) cos θ / cos φ, 0), north = (−(2√2/π) λ sin θ dθ/dφ, √2 cos θ dθ/dφ).
* Vectors: (30,45)→(0.646840790, 0.571303747); (−60,120)→(1.220225775, −1.078176746); (89,10)→(0.011160781, 1.410641838).

### 4.6 Robinson (kept). Snyder & Voxland, *An Album of Map Projections*, USGS PP 1453 (1989), Robinson entry; Robinson (1974). It is not in PP 1395.
* Normal aspect; **compromise** (neither conformal nor equal-area). It is defined by a table at 5° steps:
  `x = 0.8487 · X(φ) · λ`, `y = 1.3523 · Y(φ) · sign φ`.

| φ° | X | Y | | φ° | X | Y |
|---|---|---|---|---|---|---|
| 0 | 1.0000 | 0.0000 | | 50 | 0.8679 | 0.6176 |
| 5 | 0.9986 | 0.0620 | | 55 | 0.8350 | 0.6769 |
| 10 | 0.9954 | 0.1240 | | 60 | 0.7986 | 0.7346 |
| 15 | 0.9900 | 0.1860 | | 65 | 0.7597 | 0.7903 |
| 20 | 0.9822 | 0.2480 | | 70 | 0.7186 | 0.8435 |
| 25 | 0.9730 | 0.3100 | | 75 | 0.6732 | 0.8936 |
| 30 | 0.9600 | 0.3720 | | 80 | 0.6213 | 0.9394 |
| 35 | 0.9427 | 0.4340 | | 85 | 0.5722 | 0.9761 |
| 40 | 0.9216 | 0.4958 | | 90 | 0.5322 | 1.0000 |
| 45 | 0.8962 | 0.5571 | | | | |

* **Interpolation used here (portable, C¹): Catmull-Rom** in u = |φ|/5°, segment i = min(floor u, 17), t = u − i.
  Tangents are central differences, with ghost nodes `v[−1] = X[1]` (X is even) or `−Y[1]` (Y is odd), and
  `v[19] = 2v[18] − v[17]`:
  `f(t) = (2t³−3t²+1)v_i + (t³−2t²+t)m_i + (−2t³+3t²)v_{i+1} + (t³−t²)m_{i+1}`, with `m_i = (v_{i+1} − v_{i−1})/2`.
  Snyder's Album uses Stirling interpolation and PROJ uses its own cubic fits, so values between nodes differ by about
  1e-4. Between nodes the test vectors are only valid for *this* scheme.
* Inverse (GLSL): `Y = min(|y|/1.3523, 1)`. Find i with Y[i] ≤ Y < Y[i+1] (a loop over 18 entries in a uniform
  `float RY[20]` array with ghosts). Start at `t = (Y−Y[i])/(Y[i+1]−Y[i])` and take **3 Newton steps** on
  `f_Y(i+t) − Y` (max error 9e-16 in double; float32 is limited by the table). Then `φ = sign(y)(i+t)·5°`,
  `λ = x/(0.8487·X(φ))`, and the point is inside iff |λ| ≤ π.
* Teaching point: it was chosen to "look right" (National Geographic used it 1988–1998). Every kind of distortion is
  moderate and none is zero, so both heat maps show mild gradients.
* D: use central differences (5.4), or differentiate the Catmull-Rom polynomial (dX/dφ = f'(t)/5°).
* Vectors: (45,60)→(0.796503631, 0.753366330) [table node, interpolation-free]; (−30,120)→(1.706412598, −0.503055600)
  [node]; (52.5,−90)→(−1.135772561, 0.875512828) [Catmull-Rom only].

### 4.7–4.11 Azimuthal family (one formula, five radial laws), Snyder ch. 20–25

In the frame, the centre is (1,0,0). With `c = angle from centre = atan2(√(q_y²+q_z²), q_x)`, the map is
`(x, y) = ρ(c) · (q_y, q_z) / √(q_y²+q_z²)`. Directions from the centre are always true (they are *azimuthal*). Radial
scale is h' = ρ'(c) and tangential scale is k' = ρ(c)/sin c, so a = max(h', k') and b = min (checked to ≤ 1e-8). All the
forms below are division-safe in vector form:

| projection | Snyder | ρ(c) | forward (q → x,y) | inverse (m → q), r = \|m\| | h' | k' | property |
|---|---|---|---|---|---|---|---|
| Az. equidistant | ch. 25 (25-2…25-5) | c | (q_y,q_z)·c/s, s = √(q_y²+q_z²) | c = r; q = (cos r, m·sin r / r) | 1 | c / sin c | distances & directions from centre true |
| Lambert az. equal-area | ch. 24 (24-2…24-4) | 2 sin(c/2) | (q_y,q_z)·√(2/(1+q_x)) | q = (1 − r²/2, m·√(1 − r²/4)) | cos(c/2) | 1/cos(c/2) | equal-area |
| Stereographic | ch. 21 (21-2…21-4) | 2 tan(c/2) | 2(q_y,q_z)/(1+q_x) | q = (4 − r², 4m)/(4 + r²) | sec²(c/2) | sec²(c/2) | conformal, circles → circles |
| Orthographic | ch. 20 (20-3…20-5) | sin c | (q_y,q_z), needs q_x ≥ 0 | q = (√(1 − r²), m) | cos c | 1 | perspective from infinity |
| Gnomonic | ch. 22 (22-3…22-5) | tan c | (q_y,q_z)/q_x, needs q_x > 0 | q = normalize(1, m) | sec²c | sec c | every great circle is a straight line |

Implementation notes:
* For the AzEq inverse, use `sin(r)/r` with the series `1 − r²/6` for r < 1e-3. At r = π the antipode is a point
  smeared around the whole rim, so keep ρ ≤ π − 1e-4 for sampling. The other four inverses use no trig at all.
* Default to the polar aspect (φ0 = 90°). The UN emblem is AzEq polar. Great-circle bearing maps centred on one's own
  station, as radio amateurs use them, are AzEq oblique.
* Teaching points: AzEq shows "how far and which way from here". LAEA keeps area and puts the antipode on the rim
  circle. Stereographic is conformal, sends the antipode to infinity, and the user can watch its circles stay circles.
  Orthographic is what a camera far away sees. Gnomonic makes the shortest routes straight lines (route planning) and
  can show less than a hemisphere.
* D: for the heat maps a = max(h', k') and b = min(h', k') are enough. For the full matrix (Tissot method B), with the
  polar angle on the map ψ = atan2(q_z, q_y), the sphere's radial unit tangent `t_r = normalize((C·q)q − C)` (pointing
  away from the centre C = (1,0,0)), `t_t = q × t_r`, and the frame basis `e' = (−sin λ', cos λ', 0)`, `n' = q × e'`:
  ```
  H = [ h' cos ψ   −k' sin ψ ]        S = [ t_r·e'  t_t·e' ]        D = H · Sᵀ
      [ h' sin ψ    k' cos ψ ]            [ t_r·n'  t_t·n' ]
  ```
  This was checked against finite differences to 4e-10 for all five. It is undefined only at the centre itself, where
  D = identity for all five.
* Test vectors (frame centred at (0,0), equatorial aspect):
  * AzEq: (30,45)→(0.706229443, 0.576633926); (−60,120)→(0.815483519, −1.630967037); (0,179)→(3.124139361, 0).
  * LAEA: (30,45)→(0.682021317, 0.556868074); (−60,120)→(0.707106781, −1.414213562); (0,179)→(1.999923846, 0).
  * Stereo: (30,45)→(0.759591794, 0.620204103); (−60,120)→(1.154700538, −2.309401077); (10,−100)→(−2.339826522, 0.418939173).
  * Ortho: (30,45)→(0.612372436, 0.5); (−20,60)→(0.813797681, −0.342020143); (45,−30)→(−0.353553391, 0.707106781).
  * Gnomonic: (30,45)→(1.0, 0.816496581); (−20,60)→(1.732050808, −0.727940469); (45,−30)→(−0.577350269, 1.154700538).

### 4.12 Equal Earth. Šavrič, Patterson & Jenny, "The Equal Earth map projection", *IJGIS* 33(3):454–465, 2019 (online 2018), doi:10.1080/13658816.2018.1504949
* Normal aspect; **equal-area** pseudocylindrical, designed to look like Robinson.
* Constants: `A1 = 1.340264, A2 = −0.081106, A3 = 0.000893, A4 = 0.003796, M = √3/2`.
* Forward: `θ = asin(M sin φ)`;
  `P(θ) = θ(A1 + θ²(A2 + θ⁴(A3 + A4θ²)))` = A1θ + A2θ³ + A3θ⁷ + A4θ⁹;
  `P'(θ) = A1 + θ²(3A2 + θ⁴(7A3 + 9A4θ²))`;
  `x = 2√3 · λ · cos θ / (3 P'(θ))`, `y = P(θ)`.
* Inverse (GLSL): start θ = y and take **4 Newton steps** `θ ← θ − (P(θ) − y)/P'(θ)`. Float32 measurements: 3 steps
  already reach the float floor (2e-5° error for |φ| ≤ 80°, 3e-4° near ±90°, where asin is ill-conditioned). 2 steps
  are *not* enough (0.12°). Then `φ = asin(clamp(sin θ / M))`, `λ = 3x·P'(θ)/(2√3 cos θ)`, inside iff
  |y| ≤ 1.317362759 and |λ| ≤ π.
* D: let `g(θ) = 2√3 cos θ /(3P')`, `g' = (2√3/3)(−sin θ P' − cos θ P'')/P'²`, `P'' = θ(6A2 + θ⁴(42A3 + 72A4θ²))`,
  `dθ/dφ = M cos φ / cos θ`. Then east = (g/cos φ, 0) and north = (λ g' dθ/dφ, P' dθ/dφ).
* Teaching point: a 2018 answer to "equal-area *and* pleasant". Compare it with Robinson using the heat map: the
  areal-scale field is flat and the angular one is similar.
* Vectors: (0,0)→(0,0); (30,45)→(0.632925419, 0.592935120); (−60,120)→(1.359373392, −1.088300836).

### 4.13 Sinusoidal, Snyder ch. 30 (eq. 30-1…30-3; ~p. 243)
* Normal aspect; **equal-area**. True scale along every parallel and along the central meridian.
* Forward `x = λ cos φ, y = φ`. Inverse `φ = y, λ = x/cos y`, inside iff |λ| ≤ π. Guard cos y > 1e-7.
* Teaching point: area is perfect and the parallels are evenly spaced, but the edges shear badly (2ω reaches 68° at
  (60°, 90°)). Interrupted versions exist for exactly this reason.
* D = [[1, −λ sin φ], [0, 1]].
* Vectors: (0,0)→(0,0); (30,45)→(0.680174762, 0.523598776); (−60,120)→(1.047197551, −1.047197551).

### 4.14 Conics: Lambert conformal conic (Snyder ch. 15, eq. 15-1…15-5, inverse 15-8…15-10; ~p. 104) and Albers equal-area (ch. 14, eq. 14-1…14-4, inverse 14-8…14-11; ~p. 98)
**Default parameters:** standard parallels φ1 = 30°, φ2 = 60°, origin φ_C = 45° (= φ_ref of the aspect, so the user's
centre lands at map (0,0)). Constrain the UI to 0 < φ1 ≤ φ2 < 90°, which keeps n > 0. The aspect rotation moves the
cone anywhere, so southern standard parallels are not needed.

Common: `θ = nλ'`, `x = ρ sin θ`, `y = ρ0 − ρ cos θ`. Inverse: `ρ = √(x² + (ρ0 − y)²)`, `θ = atan2(x, ρ0 − y)`
(this atan2 is safe because |θ| ≤ nπ < π, so the cut never falls inside the map), `λ' = θ/n`.

**LCC** (conformal; true scale on φ1 and φ2): `t(φ) = tan(π/4 + φ/2)`,
`n = ln(cos φ1/cos φ2) / ln(t(φ2)/t(φ1))` (if φ1 = φ2 then n = sin φ1), `F = cos φ1 · t(φ1)ⁿ / n`, `ρ = F / t(φ)ⁿ`,
`ρ0 = ρ(φ_C)`. Inverse: `φ' = 2 atan((F/ρ)^(1/n)) − π/2`. Defaults: n = 0.715566847, F = 1.793025626,
ρ0 = 0.954299961, ρ(−60°) = 4.601010. In GLSL, write `pow(F/ρ, 1/n)` as `exp(log(F/ρ)/n)` and guard ρ > 1e-6.
At ρ = 0 the north pole is the cone apex.
* D: k = h = nρ/cos φ. East = (nρ cos θ / cos φ, nρ sin θ / cos φ) and north = (dρ sin θ, −dρ cos θ), with dρ/dφ = −nρ/cos φ.
* Vectors: (45,0)→(0,0); (30,45)→(0.644930509, −0.069812165); (60,−90)→(−0.630157891, 0.652392631).

**Albers** (equal-area; true scale on φ1 and φ2): `n = (sin φ1 + sin φ2)/2`, `C = cos²φ1 + 2n sin φ1`,
`ρ = √(C − 2n sin φ)/n`. Inverse: `φ' = asin(clamp((C − ρ²n²)/(2n)))`. Defaults: n = 0.683012702, C = 1.433012702,
ρ0 = 1.000622011. The whole sphere fits, as an annular sector with ρ from 0.378937 (N pole) to 2.449490 (S pole).
* D: k = nρ/cos φ, h = 1/k. Same column form as LCC, with dρ/dφ = −cos φ/(nρ).
* Vectors: (45,0)→(0,0); (30,45)→(0.648019227, −0.089224875); (−60,120)→(2.344789638, 0.669477471).

Teaching point: a cone touching or cutting the Earth along two parallels. Distortion is tiny in the band between them,
which is why mid-latitude countries are mapped with conics (LCC for aeronautical charts, Albers for US thematic maps).
Show the two standard parallels as aspect lines on the globe.

### 4.15 Dropped
None of the requested projections was dropped. Robinson was kept, with the caveat in 4.6 that it has no closed form and
between table nodes its values depend on the interpolation scheme.

---

## 5. Distortion: Jacobian, Tissot indicatrix, scalar fields (Snyder ch. 4, eq. 4-2…4-15; ~pp. 20–27)

### 5.1 Local scale matrix D
D is the 2×2 matrix that sends a unit tangent vector on the sphere (in radians, R = 1) to its image on the map. Its
**columns are the images of frame-east and frame-north**:

```
D = [ (∂x/∂λ')/cos φ'   ∂x/∂φ' ]
    [ (∂y/∂λ')/cos φ'   ∂y/∂φ' ]
```

Snyder's h (meridian scale) is the length of column 2 and k (parallel scale) is the length of column 1, both in the
*frame*. θ' (the angle at which meridian and parallel cross on the map) is the angle between the columns. The analytic D
for each projection is in section 4. All of them were checked against central differences to ≤ 1e-9.

### 5.2 Singular values without cancellation (use this, not E ± 2·det)
For D = [[p, q], [r, t]]:

```
A = hypot(p + t, q − r)      B = hypot(p − t, q + r)
a = (A + B)/2   (max scale)       b = |A − B|/2   (min scale)
s = a·b = |p·t − q·r|  (areal scale)      sin ω = B/A,   2ω = 2 asin(B/A)  (max angular deformation)
```

Why: (a+b)² = (p+t)² + (q−r)², (a−b)² = (p−t)² + (q+r)², and A² − B² = 4 det. The naive
`√(p²+q²+r²+t² − 2det)` suffers catastrophic cancellation in float32. It gives 2ω ≈ 0.03° of fake noise on conformal
maps. The form above is exactly 0 when D is a scaled rotation (p = t, q = −r). This matches Snyder's
`a' = √(h² + k² + 2hk sin θ')` and `b' = √(h² + k² − 2hk sin θ')` (4-12, 4-13), written in components.

Sanity values (script, normal aspect, (φ', λ') = (60°, 90°)): equirect a = 2, b = 1, 2ω = 38.94°; Mercator a = b = 2,
s = 4; Gall–Peters a = 1.414214, b = 0.707107; Mollweide a = 1.659310, b = 0.602660, 2ω = 55.70°; Equal Earth
2ω = 42.85°; sinusoidal 2ω = 68.45°; Robinson (Catmull-Rom) a = 1.527095, b = 0.779931, s = 1.191, 2ω = 37.79°.
LCC and Albers at (30°, 45°) give a = b = 1: that is a standard parallel.

### 5.3 Drawing Tissot indicatrices

**Where the centres sit.** Use a grid in *geographic* coordinates by default, so the circles ride with the land when the
user drags and visibly deform as they pass through the projection's distortion field. Offer a toggle that puts the
grid in *frame* coordinates instead: then the pattern is fixed on screen and the Earth slides underneath. That makes the
point of 1.2 directly visible.

Grid (one candidate per pixel, no loops): latitude bands φ_j = 30°·j, j = −3…3. Band j holds
`N_j = max(1, round(12 cos φ_j))` centres at λ = 360°·k/N_j (so 12, 10, 6, 1 at 0°, ±30°, ±60°, ±90°). Circle angular
radius r = 6°. To find the candidate for a sphere point (φ, λ): `j = round(φ/30°)`, `k = round(λ·N_j/360°)` (wrap k
mod N_j), `c = sph(φ_j, 2πk/N_j)`. Unambiguous because r = 6° is less than half of every spacing: latitude 15°, and
longitude at 60° gives asin(sin 6°/cos 60°) = 12.1°, under the half-step of 30°.

**Method A: exact image of a small circle (recommended default, cheapest).** The fragment already has p (or q). Compute
`d = angleBetween(p, c)`. The fill is `d < r` and the outline is `abs(d − r) < 1.2·fwidth(d)`. This is the true image of
a geodesic circle of radius r. It splits correctly across seams and shows finite-size effects: Mercator circles near the
clamp become egg-shaped and orthographic circles near the limb become crescents. That is honest, because it is what a 6°
circle really becomes.

**Method B: the linearised Tissot ellipse (the mathematical indicatrix, scaled by r).** For the candidate centre c, get
its frame position `qc = M c`, the map position `mc = F(qc)` (GLSL forward, the same formulas as JS) and `Dc = D(qc)`
(analytic). For the pixel offset `δ = m − mc`, set `u = inverse(Dc) · δ` (2×2 inverse; when |det Dc| < 1e-6 the point is
singular, so skip it). Fill where `|u| < r`. This gives a perfect ellipse with semi-axes a·r and b·r. Draw the axes as
the SVD directions if wanted: the major axis is along `Dc·v1`, where v1 is the first right singular vector. Caveats:
pixels are assigned by their own sphere point, so where the linearisation is poor (a/b > about 4 or a > about 4) the
ellipse can be clipped at the cell edge. Method B is also undefined across the seam. Use it for the "textbook" toggle
and the hover readout, and use A for the honest view. As r → 0 the two agree (the definition of the indicatrix).

**Hover readout (JS, double):** at the cursor, show (φ, λ), frame (φ', λ'), a, b, s, 2ω, h and k along the *geographic*
meridian and parallel (5.5), and the ellipse orientation.

### 5.4 Finite-difference fallback (GLSL float32), for Robinson or any new projection
Central differences in frame angles, with the forward projection F(φ', λ') evaluated **on unwrapped λ' ± ε** (do not
wrap into (−π, π], or the difference jumps by 2π at the seam):

```glsl
const float EPS = 2.0e-3;   // radians; float32 optimum is ~eps^(1/3) ≈ 5e-3; 2e-3–3e-3 measured best
vec2 dE = (F(phi, lam + EPS) - F(phi, lam - EPS)) / (2.0*EPS*cos(phi));
vec2 dN = (F(phi + EPS, lam) - F(phi - EPS, lam)) / (2.0*EPS);
mat2 D  = mat2(dE, dN);     // GLSL mat2(col0, col1): columns = east, north
```

Measured float32 relative error against analytic D: Mercator 7e-5 at ε = 1e-3 and 5.5e-5 at 3e-3; Equal Earth 2.9e-5 /
8e-6. At ε = 1e-4 the error grows to 3–5e-4 (round-off). Failure regions: (i) |φ'| > 89.5°, where 1/cos φ' amplifies
round-off, so clamp |φ'| ≤ 89.5° or mark the pixel singular; (ii) within ε of a genuine singularity (Mercator clamp
latitude, gnomonic c → 90°, stereographic antipode, LCC far pole and apex, the azimuthal centre for AzEq/LAEA where the
polar angle ψ is undefined, though D itself is fine); (iii) steps that cross the map boundary (Mollweide rim, the
Robinson pole line): use one-sided differences there, or skip the pixel.

### 5.5 Scale along a chosen geographic direction
Geographic north at p, in frame coordinates: `Nf = M · normalize(ẑ − p_z p)`. Frame east and north at q:
`e' = (−sin λ', cos λ', 0)`, `n' = q × e'`. Then `β = atan2(Nf·e', Nf·n')`, the azimuth of geographic north measured in
the frame. A geographic azimuth α is the frame azimuth α + β, so

```
scale(α) = | D · (sin(α+β), cos(α+β)) |       h = scale(0°), k = scale(90°)
```

In the normal aspect β ≡ 0. At the geographic poles, Nf is undefined (normalize of 0): skip those pixels or use α
relative to frame north. Checked in the script (see 1.2).

### 5.6 Heat-map fields and colour ranges (per pixel, from analytic D at the pixel's q)
| field | value | range / scale | notes |
|---|---|---|---|
| Areal scale | L = log2(s) | diverging, clamp [−3, +3] (×1/8 … ×8), neutral at 0; contours at integer L (each doubling) | dead band \|L\| < 0.01 → exactly neutral, so equal-area maps read perfectly flat |
| Angular deformation | 2ω in degrees | sequential, clamp [0°, 90°]; contours every 10° | dead band 2ω < 0.05° → exactly zero (conformal maps) |
| Max / min scale | log2 a, log2 b | diverging, clamp [−2, +2] | a = b everywhere on conformal maps |
| Scale along α (incl. h, k) | log2 scale(α) | diverging, clamp [−2, +2] | user picks α. h (α = 0°) and k (α = 90°) are the classic pair |

Contour lines: `w = fwidth(L); line = 1 − smoothstep(0.0, 1.5*w, abs(fract(L + 0.5) − 0.5))`. Mark singular pixels
(|det D| < 1e-6, or |D| > 1e6, or φ' beyond a clamp) with a hatch, not a colour. Orthographic s → 0 at the limb and
stereographic/gnomonic s → ∞ toward their limits, so the clamps are there on purpose. Paint the same fields on the 3D
globe from q = M p (1.2 is what makes that valid).

---

## 6. Drag: rotating the Earth under a fixed projection

The projection frame (its graticule, centre and aspect lines on the flat map) never moves. Dragging only changes M.

### 6.1 Free trackball (default; the point under the cursor stays under the cursor exactly)
On pointer-down at map point m0: if `inv(m0, q0)` succeeds, store `q0`, `M_down = M`, `mode = TRACK`. Otherwise use
`mode = NUDGE` (6.3).
On every move to m1: if `inv(m1, q1)` succeeds and the guards in 6.4 pass:

```
M = R(q0 → q1) · M_down
R(a → b) = I + [v]× + [v]×² / (1 + c),   v = a × b,  c = a · b     ([v]× = skew matrix of v)
          if c < −0.9999: rotate by π about any unit axis ⟂ a
```

Path-independent: every move is computed from M_down, so there is no drift. Check: the geographic point `M_downᵀ q0`
lands exactly at m1 (script: cursor (−0.7, 1.6) → grabbed point (−0.7, 1.6), M stays orthonormal). As with any
trackball, a circular drag adds roll, so γ changes. That is correct for an oblique-aspect tool.

### 6.2 Keep-north mode (optional toggle: γ stays fixed and only φ0, λ0 change)
Solve `M(φ0, λ0, γ) p = q1` for the grabbed geographic point p = (φp, λp):

```
v  = Rx(−γ) · Ry(φ_ref) · q1
sin Δ = clamp(v_y / cos φp, −1, 1);   Δ ∈ {asin(·), π − asin(·)}: pick the one nearer the previous Δ (= λp − λ0)
φ0 = wrap(atan2(sin φp, cos φp cos Δ) − atan2(v_z, v_x)),  then clamp φ0 to [−90°, 90°]
λ0 = λp − Δ
```

Exact when |v_y| ≤ cos φp and φ0 needs no clamp (script: grabbed point lands at (−0.4, 0.9) exactly). Otherwise the
point slides along. That happens near the geographic poles, where a north-locked globe cannot follow the cursor. It is
expected, and it is the same thing a globe app does.

### 6.3 Nudge fallback (outside the map, or in a degenerate region)
Rotate about frame axes as if the projection centre is pushed by the drag. For a pointer delta Δm = (Δx, Δy) in map
units:

```
angle = |Δm| / S        axis = (0, −Δy, Δx)/|Δm|   (frame; since (1,0,0) × (0,Δx,Δy))
M = Rot(axis, angle) · M          S = scale a at the projection centre (1 for most; for the conics the scale at φ_C,
                                  slightly below 1)
```

When TRACK resumes after a nudge (the cursor is back over a good region), re-anchor with `q0 = q1` and `M_down = M`
at that moment, so nothing snaps.

### 6.4 Guards: when TRACK hands over to NUDGE
* The inverse fails: the cursor is off the map (outside the Mollweide ellipse or the orthographic disc, past
  Mercator's ±π, past the clip radius of stereographic or gnomonic).
* **Compressed regions:** the minimum scale b at q1 is < 0.25 (the orthographic limb, LAEA and AzEq near the rim). There
  a pixel covers a large stretch of sphere, so the trackball would jump. Also switch if a single move's
  angleBetween(q_prev, q1) exceeds 0.25 rad.
* **Stretched regions** (Mercator near the clamp, gnomonic and stereographic far out) are *not* a problem for TRACK:
  a large cursor motion is a small sphere rotation, so the drag simply feels slower. Keep TRACK there. Keep Mercator's
  latitude clamp in the inverse so that q1 stays defined to the edge of the square.
* Pinch/zoom changes only the pixel→map scale, never M.

---

## 7. Texture sampling, seams, graticules

* Land texture (equirectangular, row 0 = north, uploaded without UNPACK_FLIP_Y): `u = λ/(2π) + 0.5`, `v = 0.5 − φ/π`.
  Use wrap REPEAT in u and CLAMP in v.
* **Antimeridian mip seam:** u jumps from 1 to 0 between neighbouring pixels, the hardware picks the smallest mip and a
  1-pixel line appears. Fix it with Tarini's trick: `float u1 = fract(u), u2 = fract(u + 0.5) − 0.5;
  u = (fwidth(u1) <= fwidth(u2) + 1e-6) ? u1 : u2;`. Alternatively, use `textureGrad` with gradients computed from the
  continuous one of u1 and u2.
* **Pole pinch:** the whole top row is one point, so mip selection blows up near the poles. Clamp the LOD with
  `textureLod` (or `textureGrad`, using `min(gradient, 1/texHeight·k)`), or keep mip levels small (≤ 4).
* Graticules: draw the geographic lines from (φ, λ) and the projection's own lines from (φ', λ'). Each uses the same
  antialiased-contour code as 5.6 on `φ/15°` and `λ/15°`. The **aspect lines** are the frame equator φ' = 0, the frame
  central meridian λ' = 0 and, for conics, the standard parallels φ' = φ1, φ2; for CEA, ±φs. The **cut line** (where the
  map is torn) is λ' = ±π for cylinders, pseudocylinders and conics, the antipode point for the azimuthals, and the
  frame horizon c = 90° for orthographic and gnomonic. Draw all of these on the 3D globe as well: seeing where the map
  is cut is half the lesson.
* Longitude lines near the poles crowd into sub-pixel width. Fade them by `smoothstep(80°, 88°, |φ|)`, or, better, use
  fwidth-based widths, which handle this automatically.

### 7.1 Globe view (orthographic, a second viewport)
For a pixel s = (s_x, s_y) in the unit disc: `s = (s_x, s_y, √(1 − s_x² − s_y²))` in view space (z toward the viewer),
`p = Vᵀ s`. The default V looks at the projection centre: `V = Rview · M`, where Rview maps frame (1,0,0) to view
(0,0,1) and frame +z to view +y. Shade with `dot(s, light)`. Overlays: the centre marker at `angleBetween(q, c_f) < 1.5°`,
the aspect lines, the cut line, the Tissot circles (method A on the globe stays perfect circles: the contrast is the
point), and the heat fields from q. Optional: show the developable surface (cylinder, cone or plane) as a translucent
ring along the line or lines of true scale.

---

## 8. float32 pitfalls in GLSL ES 3.00, and the fixes

1. **Precision:** declare `precision highp float;` in the fragment shader. mediump on mobile (~1e-3) is useless for
   projections.
2. **asin/acos domain:** values like 1.0000001 return NaN. Always clamp (`sasin`, `sacos`). Prefer the `atan` forms:
   latitude `atan(z, length(xy))`, angle between vectors `atan(|a×b|, a·b)`.
3. **atan(0, 0) is undefined in GLSL**, and on some GPUs it returns NaN. Guard it at the poles (see `geo`) and at the
   azimuthal centre.
4. **atan2 branch:** λ lands in (−π, π], with the cut at the frame antimeridian. That is the *intended* map seam. Do not
   add offsets that move the cut into the map interior (conics: |θ| ≤ nπ < π, so it is safe).
5. **Poles and singular lines:** never evaluate 1/cos φ' unguarded. Use the clamps per projection (Mercator 85.0511°,
   FD 89.5°), `max(cos, 1e-7)` in divisions, and hatch singular pixels in the heat maps.
6. **Cancellation:** use the A/B singular-value formula (5.2). For Mercator use `atanh(sin φ)` in JS only after the
   clamp; the shader only needs the inverse `atan(sinh y)`, which is well-conditioned. Near the AzEq centre use
   `1 − r²/6` for sin r / r.
7. **Large trig arguments:** keep λ in [−2π, 2π] before sin/cos (some mobile GPUs reduce arguments poorly). FD
   evaluation at λ' ± ε stays within that range.
8. **Newton in float32:** fixed iteration counts, no `while` loops: Equal Earth 4, Robinson 3 (in the segment), and
   Mollweide needs none in the shader (closed-form inverse). Forward Mollweide runs only in JS (double), at most 6
   iterations with the start in 4.5. If a GLSL forward Mollweide is needed (Tissot method B), use **4 fixed
   iterations** from the same start, with the denominator guarded: `max(1 + cos u, 1e-6)`. Measured in float32:
   |Δθ| ≤ 9.7e-6 rad for |φ| ≤ 89°. Within about 0.01° of a pole, float32 rounds 1 − |sin φ| to 0 and θ snaps to
   ±π/2 (error 3.3e-3 rad, but x ∝ cos θ is already ~0 there). 3 iterations give 3.6e-5 and 2 give 5.6e-3.
9. **Edge antialiasing:** use `fwidth` of a smooth function (domain function g, angular distance d). Never use fwidth of
   λ itself, which jumps at the seam.
10. **Matrix upload order:** see 1.1. Test once with the M test vector.
11. **NaN propagation:** if an inverse returns false, write the background colour and do not touch q. A NaN q poisons
    overlays through `fwidth` on neighbouring pixels (derivatives are computed in 2×2 quads).

---

## 9. Implementer checklist (acceptance criteria)
- [ ] JS forward and inverse reproduce every test vector in section 4 to 1e-9, and round-trip to 1e-12 (the script's
      double results show ≤ 8e-15).
- [ ] The GLSL inverse for each projection matches JS within 2e-6 rad on a 64×32 probe grid (read back with
      `preserveDrawingBuffer`, as in the other studies' test hooks).
- [ ] The aspect M test vector (1.1) is reproduced, including the oblique AzEq ρ = great-circle distance.
- [ ] Equal-area projections show a flat areal heat map (dead band) and conformal ones show 2ω ≡ 0.
- [ ] A drag keeps the grabbed coastline under the cursor (TRACK) and never jumps when crossing the map edge (NUDGE
      hand-off).
- [ ] Moving the centre moves the whole distortion pattern with the aspect lines (frame-fixed Tissot toggle).
- [ ] No seam line in the land texture at the frame antimeridian; no NaN pixels at the poles or at the centre.

## 10. Sources
* J. P. Snyder, *Map Projections — A Working Manual*, USGS Professional Paper 1395, 1987. Ch. 4 (distortion: h, k, θ',
  a, b, ω, s); ch. 5 (transformation of graticules / oblique aspects); ch. 7 Mercator; ch. 8 Transverse Mercator; ch. 9
  Oblique Mercator; ch. 10 Cylindrical equal-area; ch. 12 Equidistant cylindrical; ch. 14 Albers; ch. 15 Lambert
  conformal conic; ch. 20 Orthographic; ch. 21 Stereographic; ch. 22 Gnomonic; ch. 24 Lambert azimuthal equal-area; ch.
  25 Azimuthal equidistant; ch. 30 Sinusoidal; ch. 31 Mollweide. https://pubs.usgs.gov/pp/1395/report.pdf
* J. P. Snyder & P. M. Voxland, *An Album of Map Projections*, USGS PP 1453, 1989 (Robinson entry and table).
* A. H. Robinson, "A New Map Projection: Its Development and Characteristics", *International Yearbook of Cartography*
  14, 1974.
* B. Šavrič, T. Patterson, B. Jenny, "The Equal Earth map projection", *International Journal of Geographical
  Information Science* 33(3):454–465, 2019 (online 2018). doi:10.1080/13658816.2018.1504949
* M. Tarini, "Cylindrical and toroidal parameterizations without vertex seams", *Journal of Graphics Tools* 16(3), 2012
  (the seam trick in section 7).
