#!/usr/bin/env python3
"""check.py - recomputes every derived number quoted in physics.md and validates objects.json.

Run:  python3 check.py          (from any directory; needs numpy)
Exit code 0 = every claim matches; 1 = at least one mismatch.

Each `claim(label, computed, stated, rtol)` compares a value recomputed here from
primary inputs with the number printed in physics.md (the `stated` argument is the
number as written in the spec). If you edit a number in physics.md, edit it here too.
"""
import json
import math
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------------------
# 1. Primary inputs (SI). Sources in physics.md section 1.
# ---------------------------------------------------------------------------
c = 299_792_458.0                      # m/s, exact (SI 2019)
h = 6.626_070_15e-34                   # J s, exact
hbar = h / (2 * math.pi)               # J s, exact
kB = 1.380_649e-23                     # J/K, exact
eV = 1.602_176_634e-19                 # J, exact
G = 6.674_30e-11                       # m^3 kg^-1 s^-2, CODATA 2018 = 2022, u_r 2.2e-5
u = 1.660_539_068_92e-27               # kg, CODATA 2022
me = 9.109_383_7139e-31                # kg, CODATA 2022
mp = 1.672_621_925_95e-27              # kg, CODATA 2022
m_mu = 1.883_531_627e-28               # kg, CODATA 2022
m_d = 3.343_583_7768e-27               # kg, CODATA 2022 (deuteron)
alpha = 7.297_352_5643e-3              # CODATA 2022
# CODATA 2022 published derived values (used to cross-check our own derivations)
lP_codata = 1.616_255e-35
mP_codata = 2.176_434e-8
tP_codata = 5.391_247e-44
TP_codata = 1.416_784e32
a0_codata = 5.291_772_105_44e-11
re_codata = 2.817_940_3205e-15
lbar_e_codata = 3.861_592_6744e-13
lbar_p_codata = 2.103_089_101_09e-16
b_wien = 2.897_771_955e-3              # m K, exact (derived from exact constants)
r_p = 8.4075e-16                       # m, proton rms charge radius, CODATA 2022
# CODATA 2018 values that changed in 2022 (for the comparison table)
me_2018 = 9.109_383_7015e-31
mp_2018 = 1.672_621_923_69e-27
alpha_2018 = 7.297_352_5693e-3
a0_2018 = 5.291_772_109_03e-11
r_p_2018 = 8.414e-16

MeV_kg = 1e6 * eV / c**2
GeV_kg = 1e9 * eV / c**2
m_top = 172.57 * GeV_kg                # PDG 2024
m_H = 125.20 * GeV_kg
m_Z = 91.1876 * GeV_kg
m_W = 80.3692 * GeV_kg
m_pi = 139.57039 * MeV_kg              # charged pion

# Astronomy
AU = 149_597_870_700.0                 # m, exact (IAU 2012 B2)
yr = 365.25 * 86400.0                  # Julian year, s
ly = c * yr                            # m, exact
pc = AU * 648000 / math.pi             # m, exact (IAU 2015 B2)
kpc, Mpc = 1e3 * pc, 1e6 * pc
GM_sun = 1.327_124_4e20                # m^3/s^2, IAU 2015 B3 nominal
Msun = GM_sun / G                      # kg (uncertainty dominated by G)
Rsun = 6.957e8                         # m, IAU 2015 B3 nominal
GM_E = 3.986_004_418e14                # m^3/s^2, IERS 2010
sidereal_day = 86164.0905              # s
M_earth = 5.9722e24
R_earth = 6.3710e6
g0 = 9.806_65                          # standard gravity, exact
g_mars = 3.71                          # m/s^2, NASA fact sheet
T_cmb = 2.72548                        # K, Fixsen 2009

# Cosmology: Planck 2018 TT,TE,EE+lowE+lensing (A&A 641, A6, Table 2)
H0_P18 = 67.36 * 1e3 / Mpc             # 1/s  (headline "67.4 +/- 0.5")
H0_SH0ES = 73.04 * 1e3 / Mpc           # Riess et al. 2022, ApJL 934, L7
Om_P18 = 0.3153
Obh2_P18 = 0.02237
z_star = 1089.92
h_P18 = 67.36 / 100
Or_P18 = 2.473e-5 * (1 + 0.2271 * 3.046) / h_P18**2  # photons + 3.046 massless-nu approx
OL_P18 = 1 - Om_P18 - Or_P18                         # flat

# Materials (section 3c)
gamma_w = 0.0728       # N/m, water surface tension at 20 C (CRC)
rho_w = 998.2          # kg/m^3, water at 20 C
nu_w = 1.0e-6          # m^2/s, kinematic viscosity of water at 20 C
sigma_rock = 1e8       # Pa, representative rock strength (order of magnitude)
rho_rock = 3000.0      # kg/m^3
rho_ice = 1000.0


def cosmology():
    """Comoving distances (m) and age (s) for flat LCDM with radiation, Planck 2018."""
    H0, Om, Or, OL = H0_P18, Om_P18, Or_P18, OL_P18
    N = 2_000_001
    def integ(f, a, b):
        x = np.linspace(a, b, N)
        y = f(x)
        return float(np.sum((y[1:] + y[:-1]) * np.diff(x)) / 2)
    # particle horizon: chi = c int_0^1 da / (a^2 H) = c/H0 int_0^1 da / sqrt(Or + Om a + OL a^4)
    E2 = lambda a: Or + Om * a + OL * a**4
    chi_p = c / H0 * integ(lambda a: 1 / np.sqrt(E2(a)), 0.0, 1.0)
    a_star = 1 / (1 + z_star)
    chi_ls = c / H0 * integ(lambda a: 1 / np.sqrt(E2(a)), a_star, 1.0)
    # event horizon: chi = c int_1^inf da/(a^2 H); substitute x = 1/a in (0,1]
    chi_e = c / H0 * integ(lambda x: 1 / np.sqrt(Or * x**4 + Om * x**3 + OL), 0.0, 1.0)
    # age: t = int_0^1 da/(a H) = 1/H0 int a da / sqrt(Or + Om a + OL a^4)
    t0 = 1 / H0 * integ(lambda a: a / np.sqrt(E2(a)), 0.0, 1.0)
    return chi_p, chi_ls, chi_e, t0


CHI_P, CHI_LS, CHI_E, T0 = cosmology()
rho_crit = 3 * H0_P18**2 / (8 * math.pi * G)
Ob_P18 = Obh2_P18 / h_P18**2
M_baryon_obs = Ob_P18 * rho_crit * 4 / 3 * math.pi * CHI_P**3


def NS():
    """Namespace used to evaluate `formula` strings in objects.json."""
    hbarc = hbar * c
    ns = dict(math=math, c=c, G=G, h=h, hbar=hbar, kB=kB, eV=eV, me=me, mp=mp, alpha=alpha,
              lP=math.sqrt(hbar * G / c**3), mP=math.sqrt(hbar * c / G),
              a0=hbar / (me * c * alpha), re=alpha * hbar / (me * c), lbar_e=hbar / (me * c),
              r_p=r_p, m_top=m_top, m_H=m_H, m_Z=m_Z, m_W=m_W, m_mu=m_mu, m_pi=m_pi, m_d=m_d,
              m_H_atom=1.00782503223 * u, m_water=18.015 * u, m_c60=720.66 * u,
              m_hb=64500 * u, m_ribo=2.5e6 * u,
              m_red_muH=m_mu * mp / (m_mu + mp),
              hbarc_GeVm=hbarc / (1e9 * eV), hbarc_eVm=hbarc / eV, hc_eVm=h * c / eV,
              T_nu=(4 / 11) ** (1 / 3) * T_cmb, T_cmb=T_cmb, b_wien=b_wien,
              gamma_w=gamma_w, rho_w=rho_w, g0=g0, sigma_rock=sigma_rock, rho_rock=rho_rock,
              GM_E=GM_E, sidereal_day=sidereal_day,
              AU=AU, ly=ly, pc=pc, yr=yr, Msun=Msun, Rsun=Rsun, H0_P18=H0_P18,
              chi_particle=CHI_P, chi_event=CHI_E, chi_ls=CHI_LS, M_baryon_obs=M_baryon_obs)
    ns['m_H'] = m_H                      # Higgs (atom mass is m_H_atom)
    return ns


# ---------------------------------------------------------------------------
# claim machinery
# ---------------------------------------------------------------------------
FAIL = []
N_CLAIMS = 0


def claim(label, computed, stated, rtol=0.01):
    global N_CLAIMS
    N_CLAIMS += 1
    ok = math.isclose(computed, stated, rel_tol=max(rtol, 1e-12), abs_tol=0 if stated else 1e-12)
    flag = 'ok ' if ok else 'BAD'
    print(f'  [{flag}] {label}: computed {computed:.6g}  stated {stated:.6g}  (rtol {rtol:g})')
    if not ok:
        FAIL.append(label)


def section(t):
    print('\n== ' + t)


def L(x):
    return math.log10(x)


if __name__ == '__main__':
    ns = NS()
    lP = ns['lP']; mP = ns['mP']; a0 = ns['a0']

    # ------------------------------------------------------------------ §1
    section('1. Constants (derived from primary inputs vs CODATA 2022)')
    claim('Planck length l_P = sqrt(hbar G / c^3) [m]', lP, 1.616255e-35, 1e-5)
    claim('Planck mass m_P = sqrt(hbar c / G) [kg]', mP, 2.176434e-8, 1e-5)
    claim('Planck time t_P = l_P / c [s]', lP / c, 5.391247e-44, 1e-5)
    claim('Planck temperature T_P = m_P c^2 / k_B [K]', mP * c**2 / kB, 1.416784e32, 1e-5)
    claim('Bohr radius a0 = hbar/(m_e c alpha) [m]', a0, a0_codata, 1e-9)
    claim('classical electron radius r_e = alpha^2 a0 [m]', alpha**2 * a0, re_codata, 1e-9)
    claim('electron reduced Compton wavelength [m]', hbar / (me * c), lbar_e_codata, 1e-9)
    claim('proton reduced Compton wavelength [m]', hbar / (mp * c), lbar_p_codata, 1e-9)
    claim('1/alpha (2022)', 1 / alpha, 137.035999177, 1e-10)
    claim('1/alpha (2018)', 1 / alpha_2018, 137.035999084, 1e-10)
    claim('Bohr radius 2018 vs 2022 relative shift', (a0_2018 - a0_codata) / a0_codata, 6.8e-10, 0.05)
    claim('solar mass M_sun = GM_sun / G [kg]', Msun, 1.98841e30, 1e-5)
    claim('light-year [m]', ly, 9.4607304725808e15, 1e-12)
    claim('parsec [m]', pc, 3.0856775814913673e16, 1e-12)
    claim('parsec [ly]', pc / ly, 3.26156, 1e-5)
    claim('hbar c [MeV fm]', hbar * c / (1e6 * eV) / 1e-15, 197.3269804, 1e-9)
    claim('h c [eV nm]', h * c / eV / 1e-9, 1239.84198, 1e-8)

    section('1b. Cosmology (flat LCDM, Planck 2018 TT,TE,EE+lowE+lensing)')
    claim('Hubble radius c/H0, H0 = 67.36 [Mpc]', c / H0_P18 / Mpc, 4451, 1e-3)
    claim('Hubble radius c/H0, H0 = 67.36 [Gly]', c / H0_P18 / ly / 1e9, 14.52, 2e-3)
    claim('Hubble radius c/H0, H0 = 67.36 [m]', c / H0_P18, 1.373e26, 2e-3)
    claim('Hubble radius c/H0, H0 = 73.04 (SH0ES) [Gly]', c / H0_SH0ES / ly / 1e9, 13.39, 2e-3)
    claim('Hubble time 1/H0 (67.36) [Gyr]', 1 / H0_P18 / yr / 1e9, 14.52, 2e-3)
    tension = (73.04 - 67.36) / math.hypot(1.04, 0.54)
    claim('H0 tension (73.04+/-1.04 vs 67.36+/-0.54) [sigma]', tension, 4.8, 0.03)
    claim('age of universe from integral [Gyr]', T0 / yr / 1e9, 13.80, 2e-3)
    claim('particle horizon (comoving radius) [Gpc]', CHI_P / Mpc / 1e3, 14.15, 3e-3)
    claim('particle horizon (comoving radius) [Gly]', CHI_P / ly / 1e9, 46.1, 3e-3)
    claim('particle horizon (comoving radius) [m]', CHI_P, 4.37e26, 3e-3)
    claim('observable-universe diameter [m]', 2 * CHI_P, 8.73e26, 3e-3)
    claim('last-scattering comoving distance [Gly]', CHI_LS / ly / 1e9, 45.2, 3e-3)
    claim('cosmic event horizon (comoving, today) [Gly]', CHI_E / ly / 1e9, 16.7, 5e-3)
    claim('radiation density Omega_r', Or_P18, 9.22e-5, 5e-3)
    claim('critical density rho_c [kg/m^3]', rho_crit, 8.52e-27, 3e-3)
    claim('baryon density Omega_b', Ob_P18, 0.0493, 3e-3)
    claim('ordinary (baryonic) mass in observable universe [kg]', M_baryon_obs, 1.46e53, 0.01)
    claim('number of protons-equivalent in observable universe', M_baryon_obs / mp, 8.8e79, 0.01)

    # ------------------------------------------------------------------ objects
    section('2. objects.json validation')
    with open(os.path.join(HERE, 'objects.json'), encoding='utf-8') as f:
        doc = json.load(f)
    objs = doc['objects']
    required = ['id', 'name', 'length_m', 'length_kind', 'log10_m', 'mass_kg', 'category', 'kind',
                'status', 'uncertainty', 'source', 'description']
    bad = 0
    ids = set()
    for ob in objs:
        for k in required:
            if k not in ob:
                print('  missing', k, 'in', ob.get('id')); bad += 1
        if ob['id'] in ids:
            print('  duplicate id', ob['id']); bad += 1
        ids.add(ob['id'])
        if ob['category'] not in doc['categories']:
            print('  bad category', ob['id']); bad += 1
        if ob['status'] not in doc['statuses']:
            print('  bad status', ob['id']); bad += 1
        if ob['kind'] not in doc['kinds']:
            print('  bad kind', ob['id']); bad += 1
        nw = len(ob['description'].split())
        if nw > 20:
            print(f'  description too long ({nw} words):', ob['id']); bad += 1
        if not ob['source'].strip():
            print('  empty source', ob['id']); bad += 1
        if abs(ob['log10_m'] - L(ob['length_m'])) > 0.001:
            print('  log10 mismatch', ob['id']); bad += 1
        if 'formula' in ob:
            v = eval(ob['formula'], dict(ns))
            if not math.isclose(v, ob['length_m'], rel_tol=6e-4):
                print(f"  formula mismatch {ob['id']}: {v:.6g} vs {ob['length_m']:.6g}"); bad += 1
    lens = [o['length_m'] for o in objs]
    if lens != sorted(lens):
        print('  objects not sorted by length'); bad += 1
    nform = sum('formula' in o for o in objs)
    print(f'  {len(objs)} objects, {nform} with formulas re-evaluated, {bad} problems')
    claim('object count within 120-180', 120 <= len(objs) <= 180, 1, 0)
    claim('schema problems', bad, 0, 0)
    claim('catalogue span: log10 smallest', L(min(lens)), -34.79, 1e-3)
    claim('catalogue span: log10 largest', L(max(lens)), 27.31, 1e-3)
    byid = {o['id']: o for o in objs}

    # ------------------------------------------------------------------ §3a
    section('3a. Where sizes meet: geometric means on the log scale')
    D = 2 * CHI_P
    D_quoted = 8.8e26
    gm_D = math.sqrt(lP * D)
    gm_R = math.sqrt(lP * CHI_P)
    claim('geometric mean l_P x diameter [m]', gm_D, 1.19e-4, 0.01)
    claim('geometric mean l_P x 8.8e26 m (quoted diameter) [m]', math.sqrt(lP * D_quoted), 1.19e-4, 0.01)
    claim('geometric mean l_P x radius [m]', gm_R, 8.4e-5, 0.01)
    span = L(D) - L(lP)
    claim('orders of magnitude l_P -> diameter', span, 61.73, 1e-3)
    claim('ratio diameter / l_P', D / lP, 5.4e61, 0.01)
    claim('ratio radius / l_P', CHI_P / lP, 2.7e61, 0.01)
    frac = (L(1.7) - L(lP)) / span
    claim('human 1.7 m: fraction of log range (l_P -> diameter)', frac, 0.567, 2e-3)
    claim('human 1.7 m: orders above l_P', L(1.7) - L(lP), 35.02, 1e-3)
    claim('human 1.7 m: orders below diameter', L(D) - L(1.7), 26.71, 1e-3)
    claim('human: orders above the geometric midpoint', L(1.7) - L(gm_D), 4.15, 3e-3)
    nvol = 4 / 3 * math.pi * CHI_P**3 / lP**3
    claim('Planck volumes in observable universe', nvol, 8.3e184, 0.02)
    claim('log10 Planck volumes', L(nvol), 184.92, 1e-3)
    claim('geometric mean of Planck mass and baryonic mass of obs. universe [kg]', math.sqrt(mP * M_baryon_obs), 5.6e22, 0.01)
    claim('Moon mass for comparison [kg]', 7.346e22, 7.346e22, 0)

    # ------------------------------------------------------------------ §3b
    section('3b. Mass-size diagram lines')
    k_s = 2 * G / c**2
    k_c = hbar / c
    claim('Schwarzschild coefficient 2G/c^2 [m/kg]', k_s, 1.4852e-27, 1e-4)
    claim('log10(2G/c^2)', L(k_s), -26.8282, 1e-4)
    claim('Compton coefficient hbar/c [kg m]', k_c, 3.5177e-43, 1e-4)
    claim('log10(hbar/c)', L(k_c), -42.4537, 1e-4)
    Mx = math.sqrt(hbar * c / (2 * G))
    claim('crossing mass m_P/sqrt2 [kg]', Mx, 1.539e-8, 1e-3)
    claim('crossing radius sqrt2 l_P [m]', k_s * Mx, 2.286e-35, 1e-3)
    sand = 2650 * 4 / 3 * math.pi * (0.125e-3)**3
    claim('mass of a 0.25 mm quartz grain [kg]', sand, 2.17e-8, 0.01)
    rho_nuc = u / (4 / 3 * math.pi * (1.2e-15)**3)
    claim('nuclear density from r0 = 1.2 fm [kg/m^3]', rho_nuc, 2.29e17, 0.01)
    rho_atom = mp / (4 / 3 * math.pi * a0**3)
    claim('"atomic density" m_p / (4/3 pi a0^3) [kg/m^3]', rho_atom, 2.70e3, 0.01)
    def dens_coef(rho):  # log10 r = (1/3) log10 M + dens_coef
        return -L(4 * math.pi * rho / 3) / 3
    claim('density line coefficient, rho = 2.29e17', dens_coef(rho_nuc), -5.994, 1e-3)
    claim('density line coefficient, rho = 3000', dens_coef(3000), -1.367, 2e-3)
    claim('density line coefficient, rho = 1000', dens_coef(1000), -1.207, 2e-3)
    def dens_meets_bh(rho):   # (3M/4 pi rho)^(1/3) = 2GM/c^2
        return math.sqrt(3 * c**6 / (32 * math.pi * rho * G**3))
    Mn = dens_meets_bh(rho_nuc)
    claim('nuclear-density ball becomes a BH at M [Msun]', Mn / Msun, 9.0, 0.02)
    Mw = dens_meets_bh(1000)
    claim('water-density ball becomes a BH at M [Msun]', Mw / Msun, 1.36e8, 0.02)
    claim('... with radius [AU]', k_s * Mw / AU, 2.7, 0.02)
    def dens_meets_compton(rho):  # (3M/4 pi rho)^(1/3) = hbar/(Mc)
        return (hbar / c * (4 * math.pi * rho / 3) ** (1 / 3)) ** 0.75
    claim('atomic-density line meets Compton line at M [m_e]', dens_meets_compton(rho_atom) / me, 0.16, 0.03)
    claim('nuclear-density line meets Compton line at M [m_p]', dens_meets_compton(rho_nuc) / mp, 0.27, 0.03)
    # positions of reference objects relative to their own Schwarzschild radius
    claim('Earth: r_s [mm]', k_s * M_earth * 1e3, 8.87, 3e-3)
    claim('Sun: r_s [km]', k_s * Msun / 1e3, 2.953, 1e-3)
    claim('Sun: R / r_s', Rsun / (k_s * Msun), 2.36e5, 3e-3)
    claim('human (62 kg): r_s [m]', k_s * 62, 9.2e-26, 3e-3)
    claim('human (62 kg): reduced Compton wavelength [m]', hbar / (62 * c), 5.7e-45, 0.01)
    claim('neutron star J0030: R / r_s', 12.71e3 / (k_s * 1.34 * Msun), 3.2, 0.01)
    claim('Sgr A*: r_s [m]', k_s * 4.297e6 * Msun, 1.27e10, 3e-3)
    claim('Sgr A*: r_s [AU]', k_s * 4.297e6 * Msun / AU, 0.085, 0.01)
    claim('M87*: r_s [AU]', k_s * 6.5e9 * Msun / AU, 128, 0.01)
    claim('Cyg X-1: r_s [km]', k_s * 21.2 * Msun / 1e3, 62.6, 3e-3)
    claim('M87* r_s / mean density inside horizon [kg/m^3]', 6.5e9 * Msun / (4 / 3 * math.pi * (k_s * 6.5e9 * Msun)**3), 0.43, 0.02)
    # universe vs Schwarzschild
    RH = c / H0_P18
    M_H = 4 / 3 * math.pi * RH**3 * rho_crit
    claim('Hubble sphere at critical density: r_s / R_H', k_s * M_H / RH, 1.0, 1e-9)
    claim('Hubble-sphere mass c^3/(2 G H0) [kg]', M_H, 9.2e52, 0.01)
    Mtot_obs = 4 / 3 * math.pi * CHI_P**3 * rho_crit
    claim('observable universe (all energy at rho_c): r_s / R', k_s * Mtot_obs / CHI_P, 10.2, 0.01)
    Mm_obs = Om_P18 * Mtot_obs
    claim('observable universe (matter only): r_s / R', k_s * Mm_obs / CHI_P, 3.2, 0.01)
    claim('observable universe (baryons only): r_s / R', k_s * M_baryon_obs / CHI_P, 0.50, 0.02)
    # Jupiter / cold-body maximum radius context
    claim('Jupiter mass [M_earth]', 1.89813e27 / M_earth, 317.8, 1e-3)
    dens = lambda M, R: M / (4 / 3 * math.pi * R**3)
    claim('mean density: Sun [kg/m^3]', dens(Msun, Rsun), 1410, 3e-3)
    claim('mean density: Earth [kg/m^3]', dens(M_earth, R_earth), 5514, 3e-3)
    claim('mean density: Jupiter [kg/m^3]', dens(1.89813e27, 69911e3), 1326, 3e-3)
    claim('mean density: Sirius B [kg/m^3]', dens(1.018 * Msun, 0.008098 * Rsun), 2.70e9, 0.01)
    claim('mean density: neutron star J0030 [kg/m^3]', dens(1.34 * Msun, 12.71e3), 3.1e17, 0.01)
    claim('mean density: Betelgeuse [kg/m^3]', dens(18 * Msun, 764 * Rsun), 5.7e-5, 0.01)
    claim('mean density: human (62 kg in 0.062 m^3) [kg/m^3]', 62 / 0.062, 1000, 1e-9)
    mw_halo = dens(1.3e12 * Msun, 280e3 * pc)
    claim('mean density: Milky Way halo / rho_crit', mw_halo / rho_crit, 113, 0.01)
    # dark energy epochs
    a_eq = (Om_P18 / OL_P18) ** (1 / 3)
    claim('matter-Lambda equality redshift', 1 / a_eq - 1, 0.295, 0.01)
    claim('acceleration onset redshift (q = 0)', (2 * OL_P18 / Om_P18) ** (1 / 3) - 1, 0.632, 0.01)
    # proton radius puzzle significance (2010)
    claim('proton radius puzzle 2010: CODATA-2010 vs muonic H [sigma]', (0.8775 - 0.84184) / math.hypot(0.0051, 0.00067), 6.9, 0.01)
    # human height distribution on the log scale
    claim('population-mean height range 1.50-1.83 m as fraction of 61.73 orders', (L(1.83) - L(1.50)) / span, 0.0014, 0.02)

    # ------------------------------------------------------------------ §3c
    section('3c. Other crossovers')
    ratio_EG = (eV / 1.0)**2 / (4 * math.pi * 8.8541878188e-12 * G * mp**2)
    claim('electric / gravitational force between two protons', ratio_EG, 1.236e36, 1e-3)
    Rpot_rock = math.sqrt(3 * sigma_rock / (2 * math.pi * G * rho_rock**2))
    claim('potato radius, rock (sigma 1e8 Pa, rho 3000) [km]', Rpot_rock / 1e3, 282, 0.01)
    Rpot_ice = math.sqrt(3 * 1e7 / (2 * math.pi * G * rho_ice**2))
    claim('potato radius, ice (sigma 1e7 Pa, rho 1000) [km]', Rpot_ice / 1e3, 267, 0.01)
    claim('central pressure of Earth-like uniform sphere [GPa]', 2 * math.pi / 3 * G * 5514**2 * R_earth**2 / 1e9, 173, 0.01)
    for sig, st in ((1e8, 3.8), (2e8, 7.6), (3e8, 11.3)):
        claim(f'max mountain height on Earth, sigma = {sig:.0e} Pa, rho 2700 [km]', sig / (2700 * g0) / 1e3, st, 0.01)
    claim('Everest scaled to Mars gravity (x g_E/g_M) [km]', 8.84886 * g0 / g_mars, 23.4, 0.01)
    claim('Olympus Mons / Everest', 21.9 / 8.84886, 2.47, 0.01)
    lc = math.sqrt(gamma_w / (rho_w * g0))
    claim('capillary length of water [mm]', lc * 1e3, 2.73, 3e-3)
    for name, v, Lb, st in (('E. coli', 30e-6, 2e-6, 6e-5), ('human sperm', 50e-6, 50e-6, 2.5e-3),
                            ('copepod (1 mm, 10 mm/s)', 1e-2, 1e-3, 10), ('human swimmer', 2.0, 2.0, 4e6),
                            ('blue whale', 5.0, 25.0, 1.25e8)):
        claim(f'Reynolds number {name}', v * Lb / nu_w, st, 0.01)
    claim('Re = 1 size if speed = 1 body length/s [mm]', math.sqrt(nu_w / 1.0) * 1e3, 1.0, 1e-6)
    claim('Re = 1 size if speed = 10 body lengths/s [mm]', math.sqrt(nu_w / 10.0) * 1e3, 0.316, 3e-3)
    abbe = 550e-9 / (2 * 1.4)
    claim('Abbe limit, 550 nm, NA 1.4 [nm]', abbe * 1e9, 196, 0.01)
    claim('Abbe limit / hydrogen-atom diameter (2 a0)', abbe / (2 * a0), 1860, 0.01)
    V = 300e3
    lam_e = h / math.sqrt(2 * me * eV * V * (1 + eV * V / (2 * me * c**2)))
    claim('electron wavelength at 300 kV [pm]', lam_e * 1e12, 1.969, 2e-3)
    claim('eye resolution: 1 arcmin at 25 cm [um]', 0.25 * math.tan(math.radians(1 / 60)) * 1e6, 72.7, 3e-3)
    claim('Hubble diffraction 1.22 lambda/D, 550 nm, 2.4 m [arcsec]', math.degrees(1.22 * 550e-9 / 2.4) * 3600, 0.058, 0.02)
    claim('JWST diffraction 1.22 lambda/D, 2 um, 6.5 m [arcsec]', math.degrees(1.22 * 2e-6 / 6.5) * 3600, 0.077, 0.02)
    claim('EHT lambda/D, 1.3 mm, 12,700 km [microarcsec]', math.degrees(1.3e-3 / 1.27e7) * 3600e6, 21.1, 0.01)
    claim('LIGO arm change, strain 1e-21 x 4 km [m]', 1e-21 * 4e3, 4e-18, 1e-9)
    claim('LHC probe distance hbar c / 2 TeV [m]', hbar * c / (2e12 * eV), 9.9e-20, 0.01)
    claim('a0 = lbar_e / alpha [pm]', hbar / (me * c) / alpha * 1e12, 52.918, 1e-4)
    claim('r_e : lbar_e : a0 = alpha^2 : alpha : 1, alpha', alpha, 1 / 137.036, 1e-6)
    claim('a0 / r_p (atom vs proton)', a0 / r_p, 62_940, 1e-3)
    claim('2 a0 / U-238 rms radius', 2 * a0 / 5.8571e-15, 18_070, 1e-3)
    claim('a0 / U-238 rms radius', a0 / 5.8571e-15, 9035, 1e-3)
    claim('Rydberg n=100 radius n^2 a0 [um]', 1e4 * a0 * 1e6, 0.529, 2e-3)
    claim('relic-neutrino temperature T_nu [K]', ns['T_nu'], 1.945, 1e-3)
    claim('relic-neutrino de Broglie wavelength [mm]', h * c / (3.15 * kB * ns['T_nu']) * 1e3, 2.35, 0.01)
    claim('0.05 eV neutrino reduced Compton wavelength [um]', hbar * c / (0.05 * eV) * 1e6, 3.95, 3e-3)
    claim('top-quark reduced Compton wavelength [m]', hbar / (m_top * c), 1.143e-18, 2e-3)
    claim('pion reduced Compton wavelength [fm]', hbar / (m_pi * c) * 1e15, 1.414, 2e-3)
    claim('geostationary radius [km]', (GM_E * sidereal_day**2 / (4 * math.pi**2)) ** (1 / 3) / 1e3, 42_164, 1e-4)
    claim('one light-day [AU]', c * 86400 / AU, 173.14, 1e-4)
    claim('Voyager 1 speed 16.9 km/s [AU/yr]', 16.9e3 * yr / AU, 3.57, 3e-3)
    claim('Sun peak (Wien) 5772 K [nm]', b_wien / 5772 * 1e9, 502, 3e-3)
    claim('human IR peak 310 K [um]', b_wien / 310 * 1e6, 9.35, 3e-3)
    claim('CMB Wien peak [mm]', b_wien / T_cmb * 1e3, 1.063, 3e-3)
    claim('CMB frequency peak [GHz]', 2.821439 * kB * T_cmb / h / 1e9, 160.2, 3e-3)

    # ------------------------------------------------------------------ §3e
    section('3e. Time scales')
    tP = lP / c
    t_age = 13.787e9 * yr
    claim('age of universe 13.787 Gyr [s]', t_age, 4.351e17, 1e-3)
    claim('orders of magnitude t_P -> age', L(t_age) - L(tP), 60.91, 1e-3)
    tm = math.sqrt(tP * t_age)
    claim('geometric mean of t_P and age [s]', tm, 1.53e-13, 0.01)
    claim('heartbeat 0.86 s: fraction of log range', (L(0.86) - L(tP)) / (L(t_age) - L(tP)), 0.709, 2e-3)
    life = 73.3 * yr
    claim('human lifetime 73.3 yr [s]', life, 2.313e9, 1e-3)
    claim('human lifetime: fraction of log range', (L(life) - L(tP)) / (L(t_age) - L(tP)), 0.864, 2e-3)
    claim('light crossing a proton (2 r_p / c) [s]', 2 * r_p / c, 5.6e-24, 0.01)
    claim('light crossing a hydrogen atom (2 a0 / c) [s]', 2 * a0 / c, 3.5e-19, 0.01)
    claim('Bohr orbital period 2 pi a0 / (alpha c) [as]', 2 * math.pi * a0 / (alpha * c) * 1e18, 152, 3e-3)
    claim('O-H stretch vibration period, 3657 cm^-1 [fs]', 1 / (c * 3657e2) * 1e15, 9.12, 3e-3)
    claim('light crossing a human (1.7 m) [ns]', 1.7 / c * 1e9, 5.67, 3e-3)
    claim('light Earth-Moon [s]', 384400e3 / c, 1.28, 3e-3)
    claim('light Sun-Earth [s]', AU / c, 499.0, 1e-3)

    # ------------------------------------------------------------------ misc numbers quoted in physics.md
    section('Misc numbers quoted in physics.md')
    claim('top-quark mass [kg]', m_top, 3.08e-25, 0.01)
    claim('U-238 mass 238 u [kg]', 238 * u, 3.95e-25, 0.01)
    claim('critical density in protons per m^3', rho_crit / mp, 5.1, 0.01)
    claim('CMB source proper distance at emission [Mly]', CHI_LS / (1 + z_star) / ly / 1e6, 41.5, 0.01)
    claim('21 microarcsec at 16.8 Mpc [pc]', 21e-6 / 206264.806 * 16.8e6, 1.71e-3, 0.01)
    claim('orders between LHC probe (1e-19 m) and l_P', L(hbar * c / (2e12 * eV)) - L(lP), 15.79, 1e-3)
    claim('... as fraction of the scale', (L(hbar * c / (2e12 * eV)) - L(lP)) / span, 0.256, 0.01)
    claim('380 nm / hydrogen-atom diameter', 380e-9 / (2 * a0), 3590, 0.01)
    claim('750 nm / hydrogen-atom diameter', 750e-9 / (2 * a0), 7090, 0.01)
    claim('human height / its Compton wavelength', 1.7 / (hbar / (62 * c)), 3.0e44, 0.01)
    claim('human height / its Schwarzschild radius', 1.7 / (k_s * 62), 1.85e25, 0.01)
    claim('age integral vs Planck 13.797 Gyr [%]', abs(T0 / yr / 1e9 - 13.797) / 13.797 * 100, 0.013, 0.1)
    for lab, t, st in (('proton crossing', 2 * r_p / c, -23.25), ('H-atom crossing', 2 * a0 / c, -18.45),
                       ('Bohr period', 2 * math.pi * a0 / (alpha * c), -15.82), ('O-H vibration', 1 / (c * 3657e2), -14.04),
                       ('log midpoint', tm, -12.81), ('light across human', 1.7 / c, -8.25), ('heartbeat', 0.86, -0.07),
                       ('lifetime', life, 9.36), ('age', t_age, 17.64), ('Planck time', tP, -43.27)):
        claim(f'log10 time: {lab}', L(t), st, 2e-3 if abs(st) > 1 else 0.1)
    claim('position x of human on axis formula', (L(1.7) + 34.792) / 61.733, 0.567, 2e-3)
    from collections import Counter
    cs = Counter(o['status'] for o in objs); cc = Counter(o['category'] for o in objs)
    for k, v in dict(measured=88, derived=39, approximate=25, convention=9, theoretical=5, upper_limit=2,
                     lower_limit=1, inferred=3, hypothetical=2, contested=1).items():
        claim(f'status count {k}', cs[k], v, 1e-9)
    for k, v in dict(planetary=25, wave=18, organism=18, particle=16, **{'human-made': 15}, geological=12,
                     cosmological=12, stellar=11, galactic=11, cellular=10, molecular=9, nuclear=7, atomic=6,
                     hypothetical=3, quantum=2).items():
        claim(f'category count {k}', cc[k], v, 1e-9)
    claim('total objects', len(objs), 175, 1e-9)
    claim('objects with formulas', nform, 81, 1e-9)

    print(f'\n{N_CLAIMS} claims checked, {len(FAIL)} failed')
    if FAIL:
        for f_ in FAIL:
            print('  FAILED:', f_)
        sys.exit(1)
    print('ALL OK')
