# The Scale of Nature: data and physics spec

**Purpose.** Ground truth for an interactive page that runs from the Planck length to the observable universe. It covers where sizes "meet", where a human sits on the scale, and which physics governs each band. This is a spec, not code.
**Audience.** The page's implementers (data and drawing) and its content writers. Every number here can be traced to a source or to a formula.
**Files.**
- `physics.md`: this document.
- `objects.json`: the catalogue. It has 175 entries sorted by length, and each entry carries a source and a status flag.
- `check.py`: run it with `python3 check.py` (it needs numpy). It recomputes **every derived number in this document** (206 claims) from primary inputs, evaluates the `formula` field of the 81 catalogue entries that have one, and validates the schema. It exits with code 0 only when everything matches. If you change a number here, change its `claim(...)` line too.
**Owner.** Science team (physical-science side), 2026-10-19.
**Assumptions.** SI units. Constants are CODATA 2022 (CODATA 2018 is shown where the two differ). Cosmology is flat ΛCDM with Planck 2018 parameters.
**Known limitations.** Biological and geological "typical" sizes vary widely in nature. Each one carries a range and the status `approximate`. A few entries are marked `textbook value; flagged`: no single primary paper defines them, so give them a second source before they appear as a headline number.

Notation: `log` means log10. "Orders of magnitude" means a difference in log10.

---

## 1. Constants

### 1.1 Fundamental and atomic (CODATA 2022 unless stated)

| Quantity | Symbol | Value | Std. uncertainty | Note |
|---|---|---|---|---|
| Speed of light | c | 299 792 458 m/s | exact | SI definition |
| Planck constant | h | 6.626 070 15 × 10⁻³⁴ J s | exact | SI 2019 |
| Reduced Planck constant | ħ = h/2π | 1.054 571 817… × 10⁻³⁴ J s | exact | |
| Boltzmann constant | k_B | 1.380 649 × 10⁻²³ J/K | exact | |
| Elementary charge | e | 1.602 176 634 × 10⁻¹⁹ C | exact | |
| Newtonian gravitation | G | 6.674 30 × 10⁻¹¹ m³ kg⁻¹ s⁻² | 0.000 15 (2.2 × 10⁻⁵ rel.) | same in 2018 and 2022; the least precise constant here |
| Electron mass | m_e | 9.109 383 7139 × 10⁻³¹ kg | 28 in last digits | 2018: 9.109 383 7015 |
| Proton mass | m_p | 1.672 621 925 95 × 10⁻²⁷ kg | 52 in last digits | 2018: 1.672 621 923 69 |
| Fine-structure constant | α | 7.297 352 5643 × 10⁻³ (1/α = 137.035 999 177) | 1.6 × 10⁻¹⁰ rel. | 2018: 1/α = 137.035 999 084 |
| Planck length | l_P = √(ħG/c³) | 1.616 255 × 10⁻³⁵ m | 0.000 018 (1.1 × 10⁻⁵) | uncertainty comes from G |
| Planck mass | m_P = √(ħc/G) | 2.176 434 × 10⁻⁸ kg | 0.000 024 | |
| Planck time | t_P = l_P/c | 5.391 247 × 10⁻⁴⁴ s | 0.000 060 | |
| Planck temperature | T_P = m_P c²/k_B | 1.416 784 × 10³² K | 0.000 016 | |
| Bohr radius | a₀ = ħ/(m_e c α) | 5.291 772 105 44 × 10⁻¹¹ m | 82 in last digits | 2018: 5.291 772 109 03 (relative shift 6.8 × 10⁻¹⁰) |
| Classical electron radius | r_e = α² a₀ | 2.817 940 3205 × 10⁻¹⁵ m | 13 in last digits | |
| Electron reduced Compton wavelength | ƛ_e = ħ/(m_e c) | 3.861 592 6744 × 10⁻¹³ m | 12 in last digits | the full λ_C = h/(m_e c) = 2.426 × 10⁻¹² m |
| Proton reduced Compton wavelength | ƛ_p = ħ/(m_p c) | 2.103 089 101 09 × 10⁻¹⁶ m | 67 in last digits | |
| Proton rms charge radius | r_p | 0.840 75 fm | 0.000 64 fm | 2018: 0.8414(19) fm. See §4.4 |
| ħc | | 197.326 9804 MeV fm | exact | used for every "ħc/E" length |
| hc | | 1239.841 98 eV nm | exact | photon λ = hc/E |
| Wien constant | b | 2.897 771 955 × 10⁻³ m K | exact | λ_peak = b/T |

check.py derives l_P, m_P, t_P, T_P, a₀, r_e, ƛ_e and ƛ_p from c, h, G, m_e, m_p and α, and matches the CODATA values (to 10⁻⁵ for the Planck units, 10⁻⁹ for the rest).

Particle masses (PDG 2024): top 172.57 ± 0.29 GeV, Higgs 125.20 ± 0.11 GeV, Z 91.1876 GeV, W 80.3692 GeV, π± 139.570 39 MeV, muon from CODATA 2022.

### 1.2 Astronomical

| Quantity | Value | Source / status |
|---|---|---|
| Astronomical unit (au) | 149 597 870 700 m | exact, IAU 2012 B2 |
| Light-year (ly) | c × 365.25 d = 9.460 730 472 580 8 × 10¹⁵ m | exact (Julian year) |
| Parsec (pc) | 648 000/π au = 3.085 677 581 × 10¹⁶ m = 3.261 56 ly | exact, IAU 2015 B2 |
| Solar mass M☉ | GM☉/G = 1.988 41 × 10³⁰ kg | GM☉ = 1.327 1244 × 10²⁰ m³/s² (IAU 2015 B3). The kg value is uncertain at 2 × 10⁻⁵ because of G |
| Solar radius R☉ | 6.957 × 10⁸ m (nominal) | IAU 2015 B3 |
| Earth | R = 6371.0 km (mean), M = 5.9722 × 10²⁴ kg | NASA fact sheet |

### 1.3 Cosmology

| Quantity | Value | Source |
|---|---|---|
| H₀ (Planck CMB, ΛCDM) | **67.4 ± 0.5** km/s/Mpc (TT,TE,EE+lowE+lensing: 67.36 ± 0.54) | Planck 2018 VI, A&A 641, A6 |
| H₀ (SH0ES, Cepheids + SNe Ia) | **73.04 ± 1.04** km/s/Mpc | Riess et al., ApJL 934, L7 (2022) |
| Hubble tension | (73.04 − 67.36)/√(1.04² + 0.54²) = **4.8σ** | the two papers quote ~5σ. Tip-of-the-red-giant-branch distances from JWST (Freedman et al. 2024–25) give ≈ 70, and this is still debated. **Show both values; do not pick a winner.** |
| Age of the universe | **13.787 ± 0.020 Gyr** (Planck + BAO); 13.797 ± 0.023 (CMB + lensing) | Planck 2018 VI. check.py's own integral gives 13.795 Gyr |
| Ω_m, Ω_b h², Ω_Λ | 0.3153, 0.02237, 0.6847 (flat). Radiation Ω_r = 9.22 × 10⁻⁵ (photons + 3.046 massless ν) | Planck 2018 VI |
| Critical density ρ_c = 3H₀²/(8πG) | 8.52 × 10⁻²⁷ kg/m³ (≈ 5 protons per m³) | derived |
| Hubble radius c/H₀ | **4451 Mpc = 14.52 Gly = 1.373 × 10²⁶ m** (H₀ = 67.36). With SH0ES: 13.39 Gly | derived |
| Particle horizon (comoving radius of the observable universe) | **14.15 Gpc = 46.1 Gly = 4.37 × 10²⁶ m** | check.py integral |
| Observable universe, diameter | **8.73 × 10²⁶ m**. The commonly quoted figures are 46.5 Gly (radius) and 8.8 × 10²⁶ m (diameter) | |
| Comoving distance to the CMB last-scattering surface | 45.2 Gly (z* = 1089.92) | check.py integral |
| Cosmic event horizon (comoving, today) | **16.7 Gly** | check.py integral |
| Matter–Λ equality / acceleration onset | z = 0.295 / z = 0.632 | derived |

The commonly quoted **46.5 Gly** (Davis & Lineweaver 2004, and other sources using slightly different parameters) and our 46.1 Gly agree to within 1 %. The difference comes from the inputs (H₀, Ω_m, how neutrinos are treated). **Use 46.5 Gly / 8.8 × 10²⁶ m as the rounded display numbers and say "about".** check.py confirms that the headline results below barely change between the two: the log-scale midpoint is 1.19 × 10⁻⁴ m either way.

**The four cosmic distances, which are not the same thing** (all comoving, i.e. measured "now"):
1. **Hubble radius (14.5 Gly).** Here the recession speed equals c, by Hubble's law v = H₀D. It is **not** a horizon. We see plenty of galaxies that are receding faster than light today, because light emitted long ago kept gaining ground as H(t) fell.
2. **Event horizon (16.7 Gly).** Light emitted *today* from beyond this distance will never reach us, even in the infinite future, because of accelerating expansion. Galaxies cross it continually.
3. **Last-scattering surface (45.2 Gly).** The farthest place we see with *light*. Before recombination the universe was opaque.
4. **Particle horizon (46.1 Gly ≈ "46.5 Gly").** The farthest place from which *anything* moving at c could have reached us since t = 0. This is the formal edge of the observable universe. Neutrinos and gravitational waves could in principle see slightly past distance 3.

---

## 2. Object catalogue (`objects.json`)

### 2.1 Schema

```
{ id, name, length_m, length_kind, log10_m, mass_kg|null, category, kind, status,
  uncertainty, source, description (≤ 20 words), formula? }
```
- `length_kind` says what the number is: radius, diameter, height, length, wavelength, reduced wavelength (ħ/mc or ħc/E), rms charge radius, distance, depth, thickness, circumference, orbit radius, Schwarzschild radius, and so on. **Never put a radius and a diameter side by side without labelling them.** The UI must show `length_kind`.
- `category` is one of: quantum, particle, nuclear, atomic, molecular, cellular, organism, human-made, geological, planetary, stellar, galactic, cosmological, hypothetical, plus **`wave`**, added for electromagnetic and gravitational wavelengths.
- `kind` is one of: `object` (a thing with a size), `wavelength`, `distance` (a separation, not a size), `scale` (a derived characteristic length).
- `status` is one of: `measured`, `derived` (formula given), `upper_limit`, `lower_limit`, `theoretical`, `hypothetical`, `inferred`, `approximate`, `convention`, `contested`. **The UI must show a visible marker for every status except measured, derived and convention.**
- `formula` is a Python expression in check.py's `NS()` namespace. When it is present, `length_m` equals that formula rounded to 4 significant figures. check.py re-evaluates it.
- `mass_kg` is null where mass is meaningless (wavelengths, distances) or poorly defined. For the observable universe it holds **ordinary (baryonic) matter only**, 1.46 × 10⁵³ kg.

### 2.2 Coverage

175 entries span from 1.616 × 10⁻³⁵ m (Planck length) to 2.05 × 10²⁷ m (the lower limit on the curvature radius of space). The physical endpoints of the page are the Planck length and the observable-universe diameter, which are **61.73 orders apart**.

By category: planetary 25, wave 18, organism 18, particle 16, human-made 15, geological 12, cosmological 12, stellar 11, galactic 11, cellular 10, molecular 9, nuclear 7, atomic 6, hypothetical 3, quantum 2.
By status: measured 88, derived 39, approximate 25, convention 9, theoretical 5, upper_limit 2, lower_limit 1, inferred 3, hypothetical 2, contested 1.

### 2.3 Required items (the full list is in objects.json)

| Item | Length | Kind | Status / note |
|---|---|---|---|
| Planck length | 1.616 × 10⁻³⁵ m | unit | theoretical meaning (§4.1) |
| String length | ~10⁻³⁴ m | length | **hypothetical**, model-dependent |
| GUT scale ħc/10¹⁶ GeV | 1.97 × 10⁻³² m | reduced wavelength | hypothetical |
| LHC probe ħc/2 TeV | 9.9 × 10⁻²⁰ m | reduced wavelength | ≈ 10⁻¹⁹ m |
| Quark size | < 4.3 × 10⁻¹⁹ m | upper limit | ZEUS 2016 |
| Electron size | < ~10⁻¹⁸ m | upper limit | model-dependent (§4.3) |
| Top quark ƛ | 1.143 × 10⁻¹⁸ m | reduced Compton | PDG |
| Proton charge radius | 0.8408 fm | rms radius | CODATA 2022, puzzle in §4.4 |
| Uranium-238 nucleus | 5.857 fm (rms); ≈ 7.4 fm sharp-edge | rms radius | Angeli & Marinova 2013 |
| Hydrogen atom (a₀) | 52.92 pm | radius | |
| Water molecule | ~0.28 nm | effective diameter | approximate |
| DNA | 2.0 nm | width | |
| Ribosome (70S) | ~25 nm | diameter | approximate |
| SARS-CoV-2 | ~100 nm (60–140) | diameter | |
| E. coli | ~2 µm | length | |
| Red blood cell | 7.8 µm | diameter | |
| Human hair | ~75 µm (17–180) | diameter | approximate |
| Dust mite | ~0.3 mm | length | approximate |
| Ant | ~5 mm (1–30) | length | approximate |
| Human | 1.7 m | height | §3a.4 for the distribution |
| Blue whale | ~30 m (max) | length | |
| Burj Khalifa | 828 m | height | |
| Everest | 8848.86 m | height above sea level | |
| Challenger Deep | 10 935 m | depth | ±6 m; other surveys up to 10 984 m |
| Earth / Moon / Jupiter / Sun | 6371 / 1737.4 / 69 911 / 695 700 km | mean radius | |
| Earth–Moon | 384 400 km | mean distance | |
| AU | 1.496 × 10¹¹ m | defined | |
| Betelgeuse | 764 R☉ = 5.3 × 10¹¹ m (3.6 au) | radius | +116/−62 R☉ |
| Heliopause | 121.6 au | V1 crossing distance | |
| Voyager 1 | 1 light-day = 173.14 au from Earth on 18 Nov 2026 | distance | heliocentric ≈ 172 au; ±1 au annual swing |
| Oort cloud | inner ~2000 au, outer ~10⁵ au | distance | **inferred**, never observed directly |
| Proxima Centauri | 4.2465 ly | distance | Gaia DR3 |
| Milky Way disc | ~30 kpc ≈ 10⁵ ly | diameter | approximate; edge not sharp |
| Local Group | ~3 Mpc | diameter | approximate |
| Laniakea | ~160 Mpc | diameter | Tully et al. 2014 |
| Cosmic voids | ~40 Mpc typical, Boötes ~100 Mpc | diameter | approximate |
| Hubble radius | 1.373 × 10²⁶ m | radius | |
| Observable universe | 4.37 × 10²⁶ m radius; 8.73 × 10²⁶ m diameter | comoving | |
| Neutrino | **no size**. Examples: relic ν de Broglie λ ≈ 2.35 mm; solar pp ν (0.4 MeV) λ ≈ 3.1 pm; ƛ of a 0.05 eV ν = 3.95 µm | wavelengths | theoretical / derived |
| Wavelengths | 1.4 PeV γ 8.9 × 10⁻²² m; 1 MeV γ 1.24 pm; Cu Kα 0.154 nm; Lyα 121.6 nm; visible 380–750 nm (eye peak 555 nm); Sun peak 502 nm; body IR 9.35 µm; CMB 1.06 mm (Wien) / 1.87 mm (per-frequency peak at 160.2 GHz); microwave oven 12.2 cm; H 21 cm; FM 3 m; AM 300 m; Schumann 3.8 × 10⁴ km; GW150914 ~2000 km; PTA nHz GW ~1 ly | | derived/measured |

---

## 3. Where sizes meet

### 3a. The log-scale midpoint and the human's place

The page's log axis runs from l_P = 1.616 × 10⁻³⁵ m (log −34.79) to the observable-universe diameter D = 8.73 × 10²⁶ m (log +26.94). That is **61.73 orders of magnitude**, and D/l_P = 5.4 × 10⁶¹.

1. **Geometric mean using the diameter:** √(l_P · D) = **1.19 × 10⁻⁴ m ≈ 0.12 mm**. With the quoted 8.8 × 10²⁶ m it is also 1.19 × 10⁻⁴ m. **The object at the centre of the cosmic scale is a human egg cell (0.12 mm, the largest human cell and just visible to the eye).** Neighbours at the same scale: a paramecium, a dust mite, the smallest insect (0.139 mm), the width of a thick hair, a sheet of paper.
2. **Geometric mean using the radius:** √(l_P · R) = **8.4 × 10⁻⁵ m = 84 µm**, about one human hair width (and close to the ~73 µm the eye can resolve at 25 cm, §3d).
3. **Where the human sits.** log 1.7 = 0.230. A human is **35.02 orders above the Planck length and 26.71 orders below the universe's diameter**. As a fraction of the range that is **0.567: we sit 57 % of the way up, 4.16 orders above the midpoint**. To the eye we are "in the middle", but we are closer to the cosmic end than to the Planck end.
4. **The human distribution on this axis.** National mean adult heights for the 1996 birth cohort run from about 1.50 m (women, Guatemala) to 1.83 m (men, Netherlands) (NCD-RisC, eLife 2016). Within one population the standard deviation is about 7 cm (textbook value; flagged). The whole range of population means covers 0.086 orders, **0.14 % of the scale**. Draw it as a short tick band, not a point. The verified extremes are 0.546 m and 2.72 m (Guinness).
5. **Ratios.** R/l_P = 2.7 × 10⁶¹ and D/l_P = 5.4 × 10⁶¹, so "about 10⁶¹–10⁶²" is correct. Planck volumes in the observable universe: (4/3)π(R/l_P)³ = **8.3 × 10¹⁸⁴ ≈ 10¹⁸⁵** (log 184.92).
6. **Mass analogue (optional panel).** The geometric mean of the Planck mass (2.18 × 10⁻⁸ kg) and the ordinary-matter mass of the observable universe (1.46 × 10⁵³ kg, about 8.8 × 10⁷⁹ proton masses) is **5.6 × 10²² kg, close to the Moon's mass (7.35 × 10²² kg)**. Caveat: this changes by a factor of √6 if dark matter is included. It is a curiosity, not a law.

### 3b. The mass–size diagram

Axes: x = log M [kg], y = log r [m]. Three families of lines:

**(1) Schwarzschild line** r_s = 2GM/c²:
```
log r = log M − 26.8282          (2G/c² = 1.4852 × 10⁻²⁷ m/kg; slope +1)
```
Nothing static can sit **below** this line: it would be inside its own event horizon.

**(2) Compton line** ƛ = ħ/(Mc):
```
log r = −log M − 42.4537         (ħ/c = 3.5177 × 10⁻⁴³ kg m; slope −1)
```
Below this line a body of mass M cannot be localised. Squeezing it into a smaller region costs enough energy (Δp·c ≳ ħc/r > Mc²) to create new particles. Elementary particles sit **on** this line. It is their quantum "size", not a ball radius.

**(3) The corner.** The two lines cross where 2GM/c² = ħ/(Mc):
```
M× = √(ħc/2G) = m_P/√2 = 1.539 × 10⁻⁸ kg,   r× = √2 · l_P = 2.286 × 10⁻³⁵ m
```
(Without the factor 2 the crossing is exactly (m_P, l_P). Label the corner "Planck scale".) Above the crossing, any object small enough to be quantum is already a black hole. **This is the corner where quantum mechanics and general relativity must both apply, and we have no tested theory for it.** For a sense of scale, the Planck mass is about the mass of a 0.25 mm sand grain (2.17 × 10⁻⁸ kg). It is an everyday mass at an impossible size.

The allowed region is the wedge **above both lines**, opening to the right from the corner.

**(4) Constant-density lines** r = (3M/4πρ)^(1/3), slope 1/3:
```
log r = (1/3) log M + K(ρ),   K(ρ) = −(1/3) log(4πρ/3)
  nuclear density  ρ = 2.29 × 10¹⁷ kg/m³ (from r = 1.2 fm·A^(1/3)):   K = −5.994
  rock             ρ = 3000 kg/m³:                                     K = −1.367
  water            ρ = 1000 kg/m³:                                     K = −1.207
```
"Atomic density" comes straight from the Bohr radius: m_p/((4/3)π a₀³) = **2.7 × 10³ kg/m³, "a few g/cm³"**. That is why rocks, metals, people, planets and the Sun all have densities within a factor of ~10 of each other (Sun 1410, Jupiter 1326, Earth 5514, human ≈ 1000 kg/m³). **Ordinary matter is atoms touching**, and its size is set by a₀ = ħ/(m_e c α).

Where the density lines meet the other lines (all in check.py):
- Nuclear-density line ∩ Schwarzschild line: M ≈ **9 M☉**. A ball at nuclear density heavier than this would be a black hole. General relativity and nuclear pressure lower the real maximum neutron-star mass to about 2–2.3 M☉ (the Tolman–Oppenheimer–Volkoff limit), so treat 9 M☉ as an order-of-magnitude marker only.
- Water-density line ∩ Schwarzschild line: M ≈ **1.4 × 10⁸ M☉**, r ≈ 2.7 au. **Supermassive black holes are not dense on average.** The mean density inside M87*'s horizon is 0.43 kg/m³, less than air.
- Atomic-density line ∩ Compton line at ≈ 0.16 m_e; nuclear-density line ∩ Compton line at ≈ 0.27 m_p. Matter made of electrons and nucleons cannot be denser than the Compton wavelengths of its own constituents allow. That is the quantum floor under the "matter band".

**Where things sit** (mean densities and distance from their own r_s, from check.py):

| Object | M (kg) | r (m) | Position |
|---|---|---|---|
| Electron, top quark, Higgs, proton (ƛ) | 9.1 × 10⁻³¹ … 3.1 × 10⁻²⁵ | ƛ | on the Compton line |
| Nuclei (proton r_p … U-238) | 10⁻²⁷ – 4 × 10⁻²⁵ | 0.84 – 7.4 fm | on the nuclear-density line, just above the Compton line |
| Atoms, molecules, cells, humans, mountains, planets | | | near the 10³–10⁴ kg/m³ lines |
| Human (62 kg) | 62 | 1.7 | 3 × 10⁴⁴ times its Compton wavelength (ƛ = 5.7 × 10⁻⁴⁵ m) and 2 × 10²⁵ times its Schwarzschild radius (r_s = 9.2 × 10⁻²⁶ m): deep inside the classical wedge |
| Earth | 5.97 × 10²⁴ | 6.37 × 10⁶ | r_s = 8.87 mm |
| Jupiter | 1.9 × 10²⁷ | 7.0 × 10⁷ | close to the **maximum radius of a cold body**: adding mass beyond ~1–3 Jupiter masses makes it smaller (electron degeneracy). Textbook value (e.g. Hubbard, *Planetary Interiors*); flag |
| Sun | 1.99 × 10³⁰ | 6.96 × 10⁸ | R/r_s = 2.36 × 10⁵ (r_s = 2.95 km) |
| Betelgeuse | ~3.6 × 10³¹ | 5.3 × 10¹¹ | ρ = 5.7 × 10⁻⁵ kg/m³: a "red-hot vacuum" |
| Sirius B (white dwarf) | 2.0 × 10³⁰ | 5.6 × 10⁶ | ρ = 2.7 × 10⁹ kg/m³ |
| Neutron star J0030+0451 | 2.7 × 10³⁰ | 1.27 × 10⁴ | ρ = 3.1 × 10¹⁷ (nuclear), R/r_s = 3.2 |
| Cyg X-1, Sgr A*, M87* | 21.2 M☉, 4.3 × 10⁶ M☉, 6.5 × 10⁹ M☉ | 62.6 km, 0.085 au, 128 au | **on** the Schwarzschild line |
| Milky Way halo | 1.3 × 10¹² M☉ | 280 kpc | mean density 113 ρ_c (≈ the virial overdensity, a consistency check) |
| Hubble sphere | c³/(2GH₀) = 9.2 × 10⁵² kg | 1.37 × 10²⁶ | **exactly on** the Schwarzschild line (below) |

**The universe and its Schwarzschild radius: what this does and does not mean.**
Take a sphere of radius R filled at the critical density ρ_c = 3H²/8πG. Then M = (4/3)πR³ρ_c and r_s = 2GM/c² = R³H²/c². So **for R = c/H, r_s = R exactly**, which is an identity of a flat universe. For the observable universe (R = 46 Gly), counting all energy at ρ_c gives r_s/R ≈ 10, matter only gives ≈ 3.2, and ordinary matter only gives ≈ 0.5. Write "**the observable universe lies close to its own Schwarzschild line**". **Do not** write "we live inside a black hole":
- The Schwarzschild solution describes a static, isolated mass in empty, asymptotically flat space. The universe is homogeneous and expanding, and has no outside, no centre and no empty exterior to collapse into. Its geometry is FLRW, not Schwarzschild.
- The "coincidence" r_s ≈ R_H is just the Friedmann equation H² = 8πGρ/3 rewritten. Any flat universe satisfies it at every epoch, so it carries no further meaning.
- Our horizons (§1.3) are observer-dependent cosmological horizons, not a black-hole event horizon around a singularity.

### 3c. Other crossovers

**Gravity vs electromagnetism.** Between two protons the electric force is **1.24 × 10³⁶** times the gravitational one. Gravity wins only by sheer number: charges cancel, mass does not. The crossover for solid bodies is the **"potato radius"**, the size at which self-gravity crushes rock (whose strength is electromagnetic) and the body becomes round:
- Central pressure of a uniform sphere: P_c = (2π/3)Gρ²R². Setting P_c equal to the yield strength σ gives R = √(3σ/(2πGρ²)).
  - Rock (σ ≈ 10⁸ Pa, ρ = 3000): **≈ 280 km**.
  - Ice (σ ≈ 10⁷ Pa, ρ = 1000): **≈ 270 km**.
- Published values are **~200 km (icy) and ~300 km (rocky)** (Lineweaver & Norman, arXiv:1004.1091). Observed: Mimas (r = 198 km, icy) is round; Proteus (r ≈ 210 km) is not; Vesta (263 km, rocky) is nearly round with a giant crater; Ceres (470 km) is round. σ is uncertain by a factor of a few, so present 200–300 km as a band.
- For comparison, Earth as a uniform sphere would have P_c ≈ 173 GPa, about 10³ times rock strength.

**The tallest possible mountain.** A mountain's base fails when ρ g h exceeds rock strength: h_max ≈ σ/(ρg). With ρ = 2700 and σ = 1, 2 and 3 × 10⁸ Pa this gives **3.8, 7.6 and 11.3 km**: on Earth, ~10 km is the limit (Weisskopf, Science 187, 605 (1975) makes the same order-of-magnitude argument). Everest is 8.85 km. **Test the scaling:** h ∝ 1/g. Everest × (g_E/g_Mars) = 23.4 km, and Olympus Mons is 21.9 km. This is an estimate: real heights also depend on isostasy, erosion and the age of the crust.

**Surface tension vs gravity: the capillary length** ℓ_c = √(γ/(ρg)) = **2.73 mm** for water at 20 °C (γ = 0.0728 N/m). Below a few mm, surface tension dominates: drops are round, insects stand on water, and a wet ant cannot escape a droplet. Above it, gravity flattens puddles. Note the coincidence (just a coincidence): the relic-neutrino wavelength (2.35 mm) and the CMB peak (1.06–1.87 mm) also fall at this scale.

**Viscosity vs inertia: the Reynolds number** Re = vL/ν (water ν = 1.0 × 10⁻⁶ m²/s):

| Swimmer | L | v | Re |
|---|---|---|---|
| E. coli | 2 µm | 30 µm/s | 6 × 10⁻⁵ |
| Human sperm | 50 µm | 50 µm/s | 2.5 × 10⁻³ |
| Copepod | 1 mm | 10 mm/s | 10 |
| Human swimmer | 2 m | 2 m/s | 4 × 10⁶ |
| Blue whale | 25 m | 5 m/s | 1.25 × 10⁸ |

If a swimmer moves at k body lengths per second, Re = 1 at L = √(ν/k): **1 mm for k = 1 and 0.32 mm for k = 10**. **Crossover ≈ 0.3–1 mm.** Below it there is no coasting: stop swimming and you stop within a fraction of an atom's width (bacteria), and only non-reciprocal strokes work (Purcell, "Life at low Reynolds number", Am. J. Phys. 45, 3 (1977)). Speeds are representative values (flag as approximate).

**Light vs atoms vs viruses: the diffraction limit.** A lens cannot resolve details smaller than d = λ/(2 NA) (Abbe 1873). For λ = 550 nm and an oil-immersion NA of 1.4, **d ≈ 196 nm**.
- A virus (~100 nm) is below this. It can be detected as a blur, but its shape cannot be resolved.
- A hydrogen atom (2a₀ = 0.106 nm) is **~1900 times smaller** than the limit. Visible light (380–750 nm) is 3600–7100 times longer than that atom's diameter, so seeing an atom with it is like feeling a grain of sand with a beach ball.
- Ways around the limit:
  - shorter wavelengths: electrons at 300 kV have λ = 1.97 pm, and X-rays (Cu Kα 0.154 nm) are atom-sized;
  - scanning probes (STM, AFM);
  - super-resolution fluorescence (STED and related methods, ~20 nm; Nobel Prize in Chemistry 2014).

**The Bohr radius from α: the length ladder of the electron.**
```
r_e  :  ƛ_e  :  a₀   =   α² : α : 1        (α = 1/137.036)
2.818 fm   386.2 fm   52.918 pm
```
a₀ = ƛ_e/α: the atom is 137 times the electron's quantum length, because the electromagnetic force is weak (α ≪ 1). The Bohr radius is **62 940 times the proton's radius** and ~9000 times the rms charge radius of a uranium-238 nucleus. "Atoms are mostly empty" is a statement about these ratios. Rydberg atoms scale as n²a₀, so n = 100 gives 0.53 µm, the size of a bacterium.

**The two big ratios** (from §3a): R/l_P ≈ 2.7 × 10⁶¹ and D/l_P ≈ 5.4 × 10⁶¹. Planck volumes in the observable universe ≈ 10¹⁸⁵.

### 3d. Physical regimes by scale

The bands overlap on purpose. The page should cross-fade between them rather than draw hard edges.

| Band (m) | Regime | Governing physics | What sees it (resolution) |
|---|---|---|---|
| < 10⁻¹⁹ (down to l_P = 1.6 × 10⁻³⁵) | **Quantum gravity: unknown territory** | No tested theory. String theory and loop quantum gravity are candidates | Nothing. The gap between the LHC and the Planck length is **~16 orders**, about a quarter (0.26) of the whole scale, and it is empty of data |
| 10⁻¹⁹ – 10⁻¹⁵ | Particle physics | Standard Model: QCD, electroweak theory, QED. The weak force has a range of ~ƛ_Z = 2.2 × 10⁻¹⁸ m | LHC, 13.6 TeV: ħc/2 TeV ≈ **10⁻¹⁹ m** |
| 10⁻¹⁵ – 10⁻¹⁴ | Nuclear | Residual strong force with range ~ƛ_π = 1.41 fm; nuclear density 2.3 × 10¹⁷ kg/m³ | Electron scattering (e.g. Jefferson Lab PRad), muonic-atom spectroscopy (radius to ~0.001 fm) |
| 10⁻¹¹ – 10⁻⁸ | Atomic, chemistry | Quantum mechanics plus electromagnetism (QED). Sizes are set by a₀ = ħ/(m_e c α) | Electron ptychography **0.39 Å** (Jiang et al., Nature 559, 343 (2018)); STM/AFM; X-ray crystallography |
| 10⁻⁹ – 10⁻⁶ | Molecular biology | Electromagnetism at thermal energy k_BT ≈ 25 meV; Brownian motion; Re ≪ 1 | Cryo-EM ~1.2 Å on favourable proteins (Nakane et al., Nature 587, 152 (2020)); super-resolution light ~20 nm |
| 10⁻⁷ – 10⁻³ | Cells | Diffusion, viscosity (Re ≪ 1), surface forces | Optical microscope **~200 nm** (Abbe) |
| 10⁻⁴ – 10² | Organisms | Gravity vs surface tension (ℓ_c = 2.7 mm); inertia vs viscosity (Re ~1 at 0.3–1 mm); square–cube scaling | **Eye: ~1 arcmin, i.e. 73 µm at 25 cm** (a hair) |
| 10² – 10⁶ | Geology | Gravity vs material strength: maximum mountain ~10 km, potato radius 200–300 km | Seismology, GPS (mm), satellite altimetry |
| 10⁵ – 10¹³ | Planets and stars | Self-gravity in hydrostatic equilibrium, fusion (stars), degeneracy pressure (white dwarfs, neutron stars), general relativity near compact objects | Hubble **0.058″** (550 nm); JWST **0.077″** (2 µm); EHT **~21 µas**, which resolved the horizon-scale shadows of M87* and Sgr A*; LIGO senses arm changes of **4 × 10⁻¹⁸ m** |
| 10¹⁶ – 10²² | Galaxies | Gravity plus **dark matter**: rotation curves stay flat far beyond the visible stars (Rubin & Ford, ApJ 159, 379 (1970)) | Gaia (parallaxes to ~tens of µas), radio 21 cm surveys |
| 10²³ – 10²⁷ | Cosmology | General relativity (FLRW) plus **dark energy (Λ)**: it has dominated the expansion since z ≈ 0.3 and caused acceleration since z ≈ 0.63; homogeneous above ~100 Mpc | Planck satellite (CMB, ~5 arcmin beam), galaxy redshift surveys (SDSS, DESI), JWST for the most distant galaxies |

A note for the content writers: a telescope's angular resolution becomes a physical size only once you multiply by distance. For example, 21 µas at the 16.8 Mpc distance of M87* is ≈ 0.0017 pc. Do not show "resolution" columns for telescopes and microscopes on one shared metre axis without that conversion.

### 3e. Time scales (optional companion axis)

| Quantity | Time | log s |
|---|---|---|
| Planck time | 5.39 × 10⁻⁴⁴ s | −43.27 |
| Light crossing a proton (2r_p/c) | 5.6 × 10⁻²⁴ s | −23.25 |
| Light crossing a hydrogen atom (2a₀/c) | 3.5 × 10⁻¹⁹ s | −18.45 |
| Bohr orbital period 2πa₀/(αc) | 152 as | −15.82 |
| O–H bond vibration (3657 cm⁻¹) | 9.1 fs | −14.04 |
| **Log midpoint √(t_P · t₀)** | **1.5 × 10⁻¹³ s = 0.15 ps** | −12.81 |
| Light crossing a human | 5.67 ns | −8.25 |
| Heartbeat (70 bpm) | 0.86 s | −0.07 |
| Light Earth→Moon / Sun→Earth | 1.28 s / 499 s | |
| Human lifetime (73.3 yr, UN World Population Prospects 2024, global 2024) | 2.31 × 10⁹ s | 9.36 |
| Age of the universe (13.787 Gyr) | 4.351 × 10¹⁷ s | 17.64 |

- The span is **60.91 orders**.
- The midpoint, ~0.15 ps, is the time scale of molecular motion (bond vibrations take ~10 fs, and hydrogen bonds in liquid water rearrange in ~1 ps).
- **A heartbeat sits at 0.709 of the way up and a human lifetime at 0.864.** In time, as in space, we sit above the middle.

---

## 4. Honesty notes (put these on the page, not only in the spec)

### 4.1 The Planck length is not a proven pixel
l_P is the only length you can build from G, ħ and c. Dimensional analysis suggests that **quantum-gravity effects should become important near it**. Nothing more is established.
- No experiment has probed below ~10⁻¹⁹ m.
- No accepted theory says space is a grid of l_P cells.
- Some approaches suggest a minimal length; others do not. Lorentz invariance makes a naive lattice problematic, and gamma-ray-burst timing has already ruled out the simplest linear "spacetime foam" dispersion at the Planck scale (Fermi-LAT, Abdo et al., Nature 462, 331 (2009)).

Wording to use: "the scale where our theories are expected to fail", **never** "the smallest possible length" or "the pixel size of the universe".

### 4.2 Measured, derived, theoretical, extrapolated
- **Measured:** everything from the proton radius (0.84 fm, scattering and spectroscopy) up to the particle horizon's inputs (CMB). The best-measured lengths have 10⁻¹⁰ relative uncertainty (a₀, the silicon lattice constant).
- **Derived:** Compton wavelengths, Schwarzschild radii (which need a measured mass), and the horizons (which need ΛCDM plus measured parameters).
- **Theoretical:** the Planck length's *meaning*, the relic-neutrino wavelength (that background has not been detected), and Rydberg scaling.
- **Hypothetical:** string length, the GUT scale, the meaning of anything below 10⁻¹⁹ m.
- **Extrapolated:** the comoving size of the observable universe assumes ΛCDM holds back to t ≈ 0. Its early-time part (z > 1090) cannot be checked with light.
- **Inferred, never imaged:** the Oort cloud, dark-matter haloes.
- **Contested:** the Hercules–Corona Borealis Great Wall, and the H₀ value itself (§1.3).

### 4.3 Fundamental particles do not have a "size" like a ball
For an elementary particle, the numbers on the page mean one of three different things. The UI label must say which.
1. **Upper limit from scattering.** Fire probes at the particle at energy E. A finite size or substructure would make the scattering deviate from point-particle predictions at distances ~ħc/E. No deviation has been seen, so any size is smaller than the bound.
   - **Quarks:** < 0.43 × 10⁻¹⁸ m (ZEUS 2016).
   - **Electrons:** the limits are on "contact interaction" scales Λ ≳ 10 TeV from LEP and later experiments (PDG compositeness review). Translated, that is "**smaller than ~10⁻¹⁸ m**" (the conservative, often-quoted figure), or ħc/Λ ~ 10⁻²⁰ m in the strictest reading. A g−2-based argument (Dehmelt, Physica Scripta T22, 102 (1988)) gives ~10⁻²² m, but it assumes a specific compositeness model, so we do not use it as the headline.
   - The catalogue stores 10⁻¹⁸ m, flagged `upper_limit`, with an arrow pointing left.
2. **Compton wavelength** ƛ = ħ/(mc). This is a quantum length, the scale below which localisation creates particle pairs. It is not a radius. Heavier means *smaller* (top quark 1.1 × 10⁻¹⁸ m, electron 3.9 × 10⁻¹³ m).
3. **Charge radius** (proton, nuclei). This is the rms spread of electric charge in a composite object, measured by elastic scattering or atomic spectroscopy. It is real and measurable because protons and nuclei are made of parts.

**Neutrinos.** They have mass (oscillations prove it; KATRIN gives m < 0.45 eV, Science 388, 180 (2025), and cosmology gives Σm < 0.12 eV), but no measured size and no measured individual mass. Show wavelengths instead:
- the de Broglie wavelength of a relic neutrino, 2.35 mm (predicted, not detected);
- a 0.4 MeV solar neutrino, 3.1 pm;
- ƛ at the minimum mass of the heaviest state (≈ 0.05 eV), 3.95 µm.

A neutrino's "size" depends on what it is doing.

The **classical electron radius** (2.8 fm) is a formal length (the scale of Thomson scattering), **not** the electron's size. Label it so.

### 4.4 The proton radius puzzle (resolved, mostly)
- In 2010, muonic-hydrogen spectroscopy gave 0.841 84(67) fm (Pohl et al., Nature 466, 213). The accepted value at the time was CODATA 2010's 0.8775(51) fm, from ordinary hydrogen and electron scattering. The two differed by **6.9σ**.
- Newer electronic-hydrogen and scattering measurements gave ~0.83–0.84 fm: Bezginov et al., Science 365, 1007 (2019); Xiong et al. (PRad), Nature 575, 147 (2019).
- CODATA 2018 adopted 0.8414 fm, and CODATA 2022 adopted **0.840 75(64) fm**.

Present this as a solved discrepancy that taught something about systematics. Do not present it as new physics. A small residual tension among individual hydrogen measurements is still discussed.

### 4.5 The observable universe is not the universe
The particle horizon limits what *we* can see, not what exists. Planck 2018 + BAO measure the spatial curvature Ω_k = 0.0007 ± 0.0019, consistent with flat. If space is closed, its curvature radius is at least c/(H₀√|Ω_k|) ≳ **2 × 10²⁷ m** (|Ω_k| < 0.0045, about 2σ), which is larger than the observable universe. If space is flat or open, it may be infinite. The catalogue's last entry is this **lower limit**, styled as such. Write "the *observable* universe" everywhere on the page.

### 4.6 Other cautions for the writers
- Comoving distances are "now" distances. The CMB light we receive left when its source was only ~41 million ly away (45.2 Gly / (1 + z*)). Never call 46 Gly "the distance light travelled" (light travelled for 13.8 Gyr).
- "Size" for clouds, haloes, the Oort cloud, superclusters and voids depends on how the boundary is defined. Show "~" and the range.
- The human, ant and hair entries are representative values with large natural spread. Show the range on hover.
- **Never** put a radius and a diameter on the same tick without a label. The catalogue mixes them on purpose because each field reports its own convention.

---

## 5. Implementation notes for the scale itself

- Position on the main axis: `x = (log10_m − (−34.792)) / 61.733`. This places the endpoints l_P (x = 0) and D (x = 1). Entries beyond D (only the curvature lower limit) sit at x > 1 and should be drawn in a "beyond the observable" margin.
- Recommended highlighted markers: midpoint 1.19 × 10⁻⁴ m (human egg); human 1.7 m (x = 0.567); LHC limit 10⁻¹⁹ m; diffraction limit 196 nm; ℓ_c 2.7 mm; Re = 1 at ~0.3–1 mm; potato radius 200–300 km; Hubble radius; particle horizon.
- Mass–size diagram ranges: x from −32 to +54 (log kg), y from −36 to +28 (log m), with the three line equations from §3b. Draw one point per catalogue object that has `mass_kg`, using `length_m` as r. For objects that are not compact (galaxies, the universe), state that r is a radius or diameter of a diffuse body.
- Number formatting: show 3 significant figures at most on the page. The JSON keeps 4 so that check.py can verify it.
- The Voyager 1 entry depends on the date. It reaches 1 light-day from Earth on **18 Nov 2026** (light-time solve against JPL Horizons, as stated in the site's Voyager piece). After that date, update the wording to "more than a light-day" or compute it live: about 3.57 au/yr.

---

## 6. Review record (AGENTS.md checklists)

- **Theoretical Physicist.**
  - Assumptions: ☑ stated (flat ΛCDM, massless-ν radiation approximation, uniform-sphere estimates).
  - Domains of validity: ☑ potato radius and maximum mountain are order-of-magnitude; nuclear-density/BH crossing is Newtonian.
  - Testable predictions: ☑ Mars mountain scaling checked against Olympus Mons.
- **Astrophysicist.**
  - Observational uncertainties: ☑ carried in the `uncertainty` field.
  - Selection effects: ☑ the H₀ tension and the "~46.5 vs 46.1 Gly" difference are both disclosed.
- **Applied Physicist.**
  - Measurement uncertainties: ☑ quantified where a primary source gives them.
  - Instrument resolutions: ☑ derived from λ/D or Abbe, not quoted from memory.
- **Pure/Applied Mathematician.**
  - Line equations: ☑ derived in closed form; the corner (m_P/√2, √2 l_P) is exact.
  - Numerical integrals: ☑ trapezoid rule on 2 × 10⁶ points over smooth integrands (substitutions remove the singularities); the age reproduces Planck's 13.797 Gyr to 0.02 %.
- **Statistician.**
  - Significance claims: ☑ H₀ 4.8σ and proton radius 6.9σ, both computed from published ±1σ values assuming Gaussian, independent errors (stated).
  - No claim of "significant" without a number: ☑.
- **Open items before publication.** Second sources for the entries flagged `textbook value; flagged`: water-molecule size, haemoglobin and lipid-bilayer sizes, ant, dust mite, tardigrade, honeybee, hummingbird, mouse, giraffe, paramecium, raindrop, typical void, rich cluster, Boötes void size, human height SD, Jupiter maximum-radius statement. None of these affects a §3 headline number.

## 7. Key references (primary)
- CODATA 2022: Mohr et al., Rev. Mod. Phys. 97, 025002 (2025). CODATA 2018: Tiesinga et al., Rev. Mod. Phys. 93, 025010 (2021).
- PDG: Navas et al., Phys. Rev. D 110, 030001 (2024).
- Planck 2018 VI: A&A 641, A6 (2020). Riess et al., ApJL 934, L7 (2022). Davis & Lineweaver, PASA 21, 97 (2004).
- IAU 2012 B2 (au); IAU 2015 B2 (parsec); IAU 2015 B3 (solar nominal values).
- Lineweaver & Norman, arXiv:1004.1091 (2010). Weisskopf, Science 187, 605 (1975). Purcell, Am. J. Phys. 45, 3 (1977).
- Pohl et al., Nature 466, 213 (2010); Bezginov et al., Science 365, 1007 (2019); Xiong et al., Nature 575, 147 (2019).
- ZEUS, Phys. Lett. B 757, 468 (2016). Angeli & Marinova, ADNDT 99, 69 (2013).
- Tully et al., Nature 513, 71 (2014). GRAVITY Collaboration, A&A 657, L12 (2022). EHT, ApJL 875, L6 (2019).
- Every other catalogue source is listed per entry in objects.json.
