# Data for the aerospace pieces

The four data files in `visual-synths/data/` used by Light-Day, Chirp, Orbit Loom and Relic, and how they were made
(19 October 2026). Scripts expect the downloads in `./dl/` and are run from a work folder next to it (`../dl/` paths);
they need numpy and scipy.

| File | Used by | Source | Script |
|---|---|---|---|
| `voyager-ephemeris.bin` (728 KB, "VGR1") | Light-Day | JPL Horizons API, barycentric (500@0) ecliptic J2000 state vectors, AU and AU/day: Voyager 1 (−31), Voyager 2 (−32), Earth (399) every 5 days; Sun (10), Jupiter–Neptune (599…899) every 10 days; 1977-10-01 to 2037-01-01 | `vgr.py` (writes the file and checks the light-time solve against Horizons' observer `delta`: < 0.1 km from 1990 on). `cross.py` and `three.py` find the one-light-day moments. |
| `gw150914.json` (80 KB) | Chirp | GWOSC: H1 and L1 4 kHz 32 s strain (GWTC-1, `H-H1_GWOSC_4KHZ_R1-1126259447-32.txt.gz`), `GW150914_4_NR_waveform.txt` | `gw.py` (whiten with a Welch PSD, band-pass 35–350 Hz, notch 60/120/180 Hz, 1.1 s around the peak, int16), then `gwpack.py` (NR template whitened and fitted: match 0.757, L1 −0.64 at −7.3 ms; NR amplitude/phase; H1 ASD grid). `gwmodel.py`, `gwcmp.py`, `gwnoise.py`: the simple formula's match (≈ 0.30) and the noise-only baseline (≈ 0.17). |
| `cmb-planck.bin` (3.6 MB, "CMB1") | Relic | Planck Legacy Archive, `COM_CMB_IQU-smica_1024_R2.02_full.fits` (Nside 1024, nested, Galactic, K_CMB) | `cmb.py`: average to Nside 512, nested → ring, int8 in 4 µK steps; TMASK as 1 bit per pixel (bit set = outside the confidence mask); a COBE-like copy at Nside 64 smoothed with a 7° Gaussian, int8 in 1.25 µK steps. Header: magic, nside, nsideCobe, step1, step2 (little-endian). |
| `land-110m.json` (55 KB) | Orbit Loom | Natural Earth 1:110m land (public domain) as world-atlas TopoJSON; copied from the Reckoning repo | — |

Layouts are documented at the top of each script; the pages' parsers (`parseEph` in light-day, `parse` in relic)
must change with them.
