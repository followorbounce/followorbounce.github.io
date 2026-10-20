#!/usr/bin/env python3
"""Verification script for _projection-spec.md (map-projection instrument).

Unit sphere R = 1. Angles in radians internally; test vectors printed in degrees in, unit-sphere x,y out.
Run:  python3 _projection-check.py          (prints test vectors + all checks)
Every projection is written in "frame" coordinates (phi', lam') = lat/lon AFTER the aspect rotation M.

Checks performed:
  1. round trip inverse(forward(p)) == p on random points inside each domain
  2. analytic local-scale matrix D (columns = frame east, frame north) vs central differences
  3. equal-area projections: |det D| == 1 ; conformal: a == b
  4. Transverse Mercator (Snyder 8-1..8-3) == Mercator in the aspect (phi0=0, lam0, gamma=90 deg),
     screen-rotated +90 deg  -> confirms the "TM is Mercator re-centred" statement
  5. trackball update M' = R(q0->q1) M keeps the grabbed point under the cursor
  6. float32 experiments: finite-difference step for GLSL, Equal Earth / Robinson inverse iterations,
     Mollweide forward Newton iteration counts
"""
import numpy as np

D2R = np.pi / 180.0
rng = np.random.default_rng(1)

# ---------------------------------------------------------------- rotation
def Rx(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])

def Ry(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])

def Rz(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])

def aspect_matrix(phi0, lam0, gamma, phiref=0.0):
    """q = M p : geographic unit vector -> frame unit vector.
    centre (phi0,lam0) -> frame (phiref, 0); heading gamma (clockwise from north) -> frame north."""
    return Ry(-phiref) @ Rx(gamma) @ Ry(phi0) @ Rz(-lam0)

def vec(phi, lam):
    return np.array([np.cos(phi) * np.cos(lam), np.cos(phi) * np.sin(lam), np.sin(phi)])

def latlon(v):
    return np.arctan2(v[2], np.hypot(v[0], v[1])), np.arctan2(v[1], v[0])

def rot_a_to_b(a, b):
    v = np.cross(a, b)
    c = float(np.dot(a, b))
    K = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
    return np.eye(3) + K + K @ K / (1.0 + c)

# ---------------------------------------------------------------- projections (frame coords)
SQ2 = np.sqrt(2.0)

def equirect_f(p, l): return l, p
def equirect_i(x, y): return y, x

PHI_MERC = np.arctan(np.sinh(np.pi))          # 85.0511 deg, makes the map square
def merc_f(p, l): return l, np.arctanh(np.sin(p))
def merc_i(x, y): return np.arctan(np.sinh(y)), x

def tm_f(p, l):  # Snyder eq 8-1, 8-3 with phi0 = 0
    B = np.cos(p) * np.sin(l)
    return np.arctanh(B), np.arctan2(np.sin(p), np.cos(p) * np.cos(l))
def tm_i(x, y):  # Snyder 8-6, 8-7
    return np.arcsin(np.sin(y) / np.cosh(x)), np.arctan2(np.sinh(x), np.cos(y))

def cea_f(p, l, ps=0.0): return l * np.cos(ps), np.sin(p) / np.cos(ps)
def cea_i(x, y, ps=0.0): return np.arcsin(y * np.cos(ps)), x / np.cos(ps)
GP = 45 * D2R

def moll_theta(p, tol=1e-12, maxit=40):
    """returns theta and iteration count. Solve 2t + sin 2t = pi sin p, Newton on u = 2t."""
    s = np.sin(p)
    if abs(s) > 1 - 1e-15:
        return np.copysign(np.pi / 2, p), 0
    if abs(p) < 60 * D2R:
        u = p
    else:  # asymptotic start: u + sin u ~ pi - (pi-u)^3/6 near u = pi
        u = np.copysign(np.pi - np.cbrt(6 * np.pi * (1 - abs(s))), p)
    for it in range(1, maxit + 1):
        du = -(u + np.sin(u) - np.pi * s) / (1 + np.cos(u))
        u += du
        if abs(du) < tol:
            break
    return u / 2, it

def moll_f(p, l):
    t, _ = moll_theta(p)
    return 2 * SQ2 / np.pi * l * np.cos(t), SQ2 * np.sin(t)
def moll_i(x, y):
    t = np.arcsin(np.clip(y / SQ2, -1, 1))
    return np.arcsin(np.clip((2 * t + np.sin(2 * t)) / np.pi, -1, 1)), np.pi * x / (2 * SQ2 * np.cos(t))

# Robinson (Snyder 1987 p.83 table; Robinson 1974)
ROB_X = np.array([1.0000, 0.9986, 0.9954, 0.9900, 0.9822, 0.9730, 0.9600, 0.9427, 0.9216, 0.8962,
                  0.8679, 0.8350, 0.7986, 0.7597, 0.7186, 0.6732, 0.6213, 0.5722, 0.5322])
ROB_Y = np.array([0.0000, 0.0620, 0.1240, 0.1860, 0.2480, 0.3100, 0.3720, 0.4340, 0.4958, 0.5571,
                  0.6176, 0.6769, 0.7346, 0.7903, 0.8435, 0.8936, 0.9394, 0.9761, 1.0000])
ROB_FX, ROB_FY = 0.8487, 1.3523
_nodes = np.arange(19) * 5 * D2R
# Interpolation: Catmull-Rom (uniform cubic Hermite, tangent = central difference) in u = |lat|/5deg.
# Ghost nodes: index -1 mirrors index 1 (X even, Y odd -> -Y[1]); index 19 = 2*v[18] - v[17].
def _ghost(v, odd):
    return np.concatenate([[-v[1] if odd else v[1]], v, [2 * v[18] - v[17]]])
_GX, _GY = _ghost(ROB_X, False), _ghost(ROB_Y, True)
def _cr(g, u, der=False):
    i = min(int(np.floor(u)), 17); t = u - i
    p0, p1, p2, p3 = g[i], g[i + 1], g[i + 2], g[i + 3]       # nodes i-1, i, i+1, i+2
    m1, m2 = (p2 - p0) / 2, (p3 - p1) / 2
    if not der:
        return ((2*t**3 - 3*t**2 + 1) * p1 + (t**3 - 2*t**2 + t) * m1
                + (-2*t**3 + 3*t**2) * p2 + (t**3 - t**2) * m2)
    return (6*t**2 - 6*t) * p1 + (3*t**2 - 4*t + 1) * m1 + (-6*t**2 + 6*t) * p2 + (3*t**2 - 2*t) * m2
U = 5 * D2R
def ROB_SX(p, d=0):
    u = abs(p) / U
    return _cr(_GX, u) if not d else _cr(_GX, u, True) / U * np.sign(p)
def ROB_SY(p, d=0):
    u = abs(p) / U
    return np.sign(p) * _cr(_GY, u) if not d else _cr(_GY, u, True) / U

def rob_f(p, l): return ROB_FX * ROB_SX(p) * l, ROB_FY * ROB_SY(p)
def rob_i(x, y, it=3):
    """segment search on the table, then Newton in t inside the segment (start = linear)."""
    Y = min(abs(y) / ROB_FY, 1.0)
    i = min(int(np.searchsorted(ROB_Y, Y, side='right')) - 1, 17)
    t = (Y - ROB_Y[i]) / (ROB_Y[i + 1] - ROB_Y[i])
    for _ in range(it):
        t -= (_cr(_GY, i + t) - Y) / _cr(_GY, i + t, True)
    p = np.copysign((i + t) * U, y)
    return p, x / (ROB_FX * ROB_SX(p))

# azimuthals via direction cosines: rho(c)
AZ = {
    'azeq':  (lambda c: c,                 lambda r: r,                 np.pi),
    'laea':  (lambda c: 2 * np.sin(c / 2), lambda r: 2 * np.arcsin(np.clip(r / 2, -1, 1)), 2.0),
    'stereo': (lambda c: 2 * np.tan(c / 2), lambda r: 2 * np.arctan(r / 2), np.inf),
    'ortho': (lambda c: np.sin(c),         lambda r: np.arcsin(np.clip(r, -1, 1)), 1.0),
    'gnomo': (lambda c: np.tan(c),         lambda r: np.arctan(r),      np.inf),
}
def az_f(kind):
    rho = AZ[kind][0]
    def f(p, l):
        q = vec(p, l)
        s = np.hypot(q[1], q[2]); c = np.arctan2(s, q[0])
        if s < 1e-300: return 0.0, 0.0
        r = rho(c)
        return r * q[1] / s, r * q[2] / s
    return f
def az_i(kind):
    crho = AZ[kind][1]
    def f(x, y):
        r = np.hypot(x, y); c = crho(r)
        k = np.sin(c) / r if r > 1e-12 else 1.0
        q = np.array([np.cos(c), k * x, k * y])
        return latlon(q)
    return f

# Equal Earth (Savric, Patterson, Jenny 2018)
A1, A2, A3, A4 = 1.340264, -0.081106, 0.000893, 0.003796
EE_M = np.sqrt(3) / 2
def ee_P(t):  return t * (A1 + t * t * (A2 + t ** 4 * (A3 + A4 * t * t)))
def ee_dP(t): return A1 + t * t * (3 * A2 + t ** 4 * (7 * A3 + 9 * A4 * t * t))
def ee_d2P(t): return t * (6 * A2 + t ** 4 * (42 * A3 + 72 * A4 * t * t))
def ee_f(p, l):
    t = np.arcsin(EE_M * np.sin(p))
    return 2 * np.sqrt(3) * l * np.cos(t) / (3 * ee_dP(t)), ee_P(t)
def ee_i(x, y, it=6, dtype=np.float64):
    x = dtype(x); y = dtype(y); t = y
    for _ in range(it):
        t = dtype(t - (ee_P(t) - y) / ee_dP(t))
    return np.arcsin(np.sin(t) / EE_M), 3 * x * ee_dP(t) / (2 * np.sqrt(3) * np.cos(t))
EE_YMAX = ee_P(np.pi / 3)

def sinu_f(p, l): return l * np.cos(p), p
def sinu_i(x, y): return y, x / np.cos(y)

# conics; default phi1 = 30, phi2 = 60, origin phiC = 45 (also the aspect reference latitude)
P1, P2, PC = 30 * D2R, 60 * D2R, 45 * D2R
def t_(p): return np.tan(np.pi / 4 + p / 2)
LCC_N = np.log(np.cos(P1) / np.cos(P2)) / np.log(t_(P2) / t_(P1))
LCC_F = np.cos(P1) * t_(P1) ** LCC_N / LCC_N
LCC_R0 = LCC_F / t_(PC) ** LCC_N
def lcc_f(p, l):
    r = LCC_F / t_(p) ** LCC_N; th = LCC_N * l
    return r * np.sin(th), LCC_R0 - r * np.cos(th)
def lcc_i(x, y):
    r = np.copysign(np.hypot(x, LCC_R0 - y), LCC_N)
    th = np.arctan2(x * np.sign(LCC_N), (LCC_R0 - y) * np.sign(LCC_N))
    return 2 * np.arctan((LCC_F / r) ** (1 / LCC_N)) - np.pi / 2, th / LCC_N

ALB_N = (np.sin(P1) + np.sin(P2)) / 2
ALB_C = np.cos(P1) ** 2 + 2 * ALB_N * np.sin(P1)
ALB_R0 = np.sqrt(ALB_C - 2 * ALB_N * np.sin(PC)) / ALB_N
def alb_f(p, l):
    r = np.sqrt(ALB_C - 2 * ALB_N * np.sin(p)) / ALB_N; th = ALB_N * l
    return r * np.sin(th), ALB_R0 - r * np.cos(th)
def alb_i(x, y):
    r = np.hypot(x, ALB_R0 - y)
    th = np.arctan2(x, ALB_R0 - y)
    return np.arcsin(np.clip((ALB_C - (r * ALB_N) ** 2) / (2 * ALB_N), -1, 1)), th / ALB_N

# ---------------------------------------------------------------- analytic D = [east | north] columns
def D_analytic(name, p, l):
    cp, sp = np.cos(p), np.sin(p)
    if name == 'equirect': return np.array([[1 / cp, 0], [0, 1]])
    if name == 'mercator': return np.array([[1 / cp, 0], [0, 1 / cp]])
    if name == 'cea':      return np.array([[1 / cp, 0], [0, cp]])
    if name == 'gallpeters': return np.array([[np.cos(GP) / cp, 0], [0, cp / np.cos(GP)]])
    if name == 'sinusoidal': return np.array([[1, -l * sp], [0, 1]])
    if name == 'mollweide':
        t, _ = moll_theta(p); ct = np.cos(t)
        dt = np.pi * cp / (4 * ct * ct)
        return np.array([[2 * SQ2 / np.pi * ct / cp, -2 * SQ2 / np.pi * l * np.sin(t) * dt],
                         [0, SQ2 * ct * dt]])
    if name == 'equalearth':
        t = np.arcsin(EE_M * sp); ct = np.cos(t); dP = ee_dP(t)
        g = 2 * np.sqrt(3) * ct / (3 * dP)
        gp = 2 * np.sqrt(3) / 3 * (-np.sin(t) * dP - ct * ee_d2P(t)) / dP ** 2
        dt = EE_M * cp / ct
        return np.array([[g / cp, l * gp * dt], [0, dP * dt]])
    if name in ('lcc', 'albers'):
        n = LCC_N if name == 'lcc' else ALB_N
        if name == 'lcc':
            r = LCC_F / t_(p) ** n; dr = -n * r / cp          # d rho/d phi
        else:
            r = np.sqrt(ALB_C - 2 * n * sp) / n; dr = -cp / (n * r)
        th = n * l
        # x = r sin th, y = r0 - r cos th
        return np.array([[r * n * np.cos(th) / cp, dr * np.sin(th)],
                         [r * n * np.sin(th) / cp, -dr * np.cos(th)]])
    return None

def D_numeric(f, p, l, e=1e-6):
    xe1, ye1 = f(p, l + e); xe0, ye0 = f(p, l - e)
    xn1, yn1 = f(p + e, l); xn0, yn0 = f(p - e, l)
    return np.array([[(xe1 - xe0) / (2 * e * np.cos(p)), (xn1 - xn0) / (2 * e)],
                     [(ye1 - ye0) / (2 * e * np.cos(p)), (yn1 - yn0) / (2 * e)]])

def ab(D):
    E = (D ** 2).sum(); s = abs(np.linalg.det(D))
    sp = np.sqrt(E + 2 * s); sm = np.sqrt(max(E - 2 * s, 0))
    return (sp + sm) / 2, (sp - sm) / 2

AZS = {'azeq': (lambda c: 1.0, lambda c: c / np.sin(c)),
       'laea': (lambda c: np.cos(c / 2), lambda c: 1 / np.cos(c / 2)),
       'stereo': (lambda c: 1 / np.cos(c / 2) ** 2, lambda c: 1 / np.cos(c / 2) ** 2),
       'ortho': (lambda c: np.cos(c), lambda c: 1.0),
       'gnomo': (lambda c: 1 / np.cos(c) ** 2, lambda c: 1 / np.cos(c))}

PROJ = {
    'equirect':   (equirect_f, equirect_i, 'none (equidistant along meridians)'),
    'mercator':   (merc_f, merc_i, 'conformal'),
    'transverse': (tm_f, tm_i, 'conformal'),
    'cea':        (cea_f, cea_i, 'equal-area'),
    'gallpeters': (lambda p, l: cea_f(p, l, GP), lambda x, y: cea_i(x, y, GP), 'equal-area'),
    'mollweide':  (moll_f, moll_i, 'equal-area'),
    'robinson':   (rob_f, rob_i, 'compromise'),
    'azeq':       (az_f('azeq'), az_i('azeq'), 'equidistant from centre'),
    'laea':       (az_f('laea'), az_i('laea'), 'equal-area'),
    'stereo':     (az_f('stereo'), az_i('stereo'), 'conformal'),
    'ortho':      (az_f('ortho'), az_i('ortho'), 'none (perspective)'),
    'gnomo':      (az_f('gnomo'), az_i('gnomo'), 'none (geodesics straight)'),
    'equalearth': (ee_f, ee_i, 'equal-area'),
    'sinusoidal': (sinu_f, sinu_i, 'equal-area'),
    'lcc':        (lcc_f, lcc_i, 'conformal'),
    'albers':     (alb_f, alb_i, 'equal-area'),
}
DOMAIN = {  # (phi range, lam range) for random tests, frame degrees
    'mercator': (80, 179), 'transverse': (80, 80), 'ortho': (60, 60), 'gnomo': (55, 55),
    'lcc': (80, 179),
}
VECTORS = {  # (lat, lon) degrees in frame coordinates
    'default': [(0, 0), (30, 45), (-60, 120)],
    'azeq': [(30, 45), (-60, 120), (0, 179)], 'laea': [(30, 45), (-60, 120), (0, 179)],
    'stereo': [(30, 45), (-60, 120), (10, -100)], 'ortho': [(30, 45), (-20, 60), (45, -30)],
    'gnomo': [(30, 45), (-20, 60), (45, -30)], 'transverse': [(30, 45), (-60, 60), (10, -20)],
    'lcc': [(45, 0), (30, 45), (60, -90)], 'albers': [(45, 0), (30, 45), (-60, 120)],
    'mollweide': [(30, 45), (-60, 120), (89, 10)], 'robinson': [(45, 60), (-30, 120), (52.5, -90)],
}

def main():
    np.set_printoptions(precision=10, suppress=True)
    print("== test vectors (frame lat, lon deg -> x, y ; R = 1) ==")
    for name, (f, fi, kind) in PROJ.items():
        vs = VECTORS.get(name, VECTORS['default'])
        out = []
        for la, lo in vs:
            x, y = f(la * D2R, lo * D2R)
            out.append(f"({la:g}, {lo:g}) -> ({float(x):.9f}, {float(y):.9f})")
        print(f"{name:11s} [{kind}]\n    " + "\n    ".join(out))

    print("\n== round trip + Jacobian checks ==")
    for name, (f, fi, kind) in PROJ.items():
        pm, lm = DOMAIN.get(name, (85, 179))
        worst_rt = worst_D = worst_area = worst_conf = 0.0
        for _ in range(400):
            p = rng.uniform(-pm, pm) * D2R; l = rng.uniform(-lm, lm) * D2R
            if name in ('lcc',) and p < -60 * D2R: continue
            x, y = f(p, l); p2, l2 = fi(x, y)
            worst_rt = max(worst_rt, abs(p2 - p), abs(l2 - l) * np.cos(p))
            Dn = D_numeric(f, p, l)
            Da = D_analytic(name, p, l)
            if Da is not None: worst_D = max(worst_D, np.abs(Da - Dn).max() / max(1, np.abs(Dn).max()))
            a, b = ab(Dn)
            if kind == 'equal-area': worst_area = max(worst_area, abs(a * b - 1))
            if kind == 'conformal': worst_conf = max(worst_conf, abs(a - b) / a)
        print(f"{name:11s} roundtrip {worst_rt:.1e}  analyticD-vs-FD {worst_D:.1e}  "
              f"|ab-1| {worst_area:.1e}  (a-b)/a {worst_conf:.1e}")

    print("\n== analytic h,k at test points (a, b, s=a*b, 2w deg) ==")
    for name in ('equirect', 'mercator', 'gallpeters', 'mollweide', 'equalearth', 'sinusoidal', 'lcc', 'albers',
                 'azeq', 'laea', 'stereo', 'ortho', 'gnomo', 'robinson'):
        f = PROJ[name][0]
        for la, lo in [(30, 45), (60, 90)]:
            if name == 'gnomo' and la == 60: continue
            a, b = ab(D_numeric(f, la * D2R, lo * D2R))
            print(f"  {name:11s} ({la},{lo}) a={a:.6f} b={b:.6f} s={a*b:.6f} 2w={2*np.degrees(np.arcsin((a-b)/(a+b))):.4f}")

    print("\n== azimuthal radial/tangential scales and TM scale vs numeric singular values ==")
    for k, (hr, kt) in AZS.items():
        worst = 0
        for _ in range(200):
            p = rng.uniform(-50, 50) * D2R; l = rng.uniform(-50, 50) * D2R
            cc = np.arccos(np.cos(p) * np.cos(l))
            a, b = ab(D_numeric(PROJ[k][0], p, l))
            worst = max(worst, abs(a - max(hr(cc), kt(cc))), abs(b - min(hr(cc), kt(cc))))
        print(f"  {k:7s} max |(a,b) - (h',k')| = {worst:.1e}")
    worst = 0
    for _ in range(200):
        p = rng.uniform(-60, 60) * D2R; l = rng.uniform(-60, 60) * D2R
        a, b = ab(D_numeric(tm_f, p, l)); kk = 1 / np.sqrt(1 - (np.cos(p) * np.sin(l)) ** 2)
        worst = max(worst, abs(a - kk), abs(b - kk))
    print(f"  TM      max |a,b - 1/sqrt(1-B^2)| = {worst:.1e}")

    print("\n== Transverse Mercator == oblique Mercator (phi0=0, lam0, gamma=90deg), screen rotate ==")
    lam0 = 20 * D2R
    M = aspect_matrix(0.0, lam0, 90 * D2R)
    worst = 0
    for _ in range(200):
        p = rng.uniform(-80, 80) * D2R; l = lam0 + rng.uniform(-70, 70) * D2R
        pf, lf = latlon(M @ vec(p, l))
        xm, ym = merc_f(pf, lf)
        xt, yt = tm_f(p, l - lam0)
        worst = max(worst, abs(xt - ym), abs(yt + xm))   # TM x = Merc y ; TM y = -Merc x
    print(f"  max |TM - rot(Merc)| = {worst:.2e}   (x_TM = y_M, y_TM = -x_M)")

    print("\n== aspect matrix test vector ==")
    M = aspect_matrix(40 * D2R, -74 * D2R, 30 * D2R)
    print("  M(phi0=40, lam0=-74, gamma=30) rows:\n", M)
    for la, lo in [(40, -74), (51.5, 0), (-33.9, 18.4)]:
        pf, lf = latlon(M @ vec(la * D2R, lo * D2R))
        x, y = merc_f(pf, lf)
        print(f"  geo ({la},{lo}) -> frame ({np.degrees(pf):.6f}, {np.degrees(lf):.6f}) -> oblique Mercator ({x:.6f}, {y:.6f})")
        xa, ya = az_f('azeq')(pf, lf)
        gc = np.arccos(np.clip(np.dot(vec(40 * D2R, -74 * D2R), vec(la * D2R, lo * D2R)), -1, 1))
        print(f"      oblique azimuthal-equidistant ({xa:.6f}, {ya:.6f}), rho = {np.hypot(xa, ya):.9f} = great-circle {gc:.9f}")
    # geographic h, k change with aspect, a, b do not (teaching point). D_geo = D_frame * Rot(beta)
    print("  Mollweide, geo point (51.5, 0): normal aspect vs aspect M above")
    for MM, lab in ((np.eye(3), 'normal'), (M, 'oblique')):
        pg = vec(51.5 * D2R, 0.0); q = MM @ pg
        pf, lf = latlon(q)
        Df = D_analytic('mollweide', pf, lf)
        Ng = np.array([0, 0, 1.0]) - pg[2] * pg; Ng /= np.linalg.norm(Ng)      # geographic north at p
        Nf = MM @ Ng
        ef = np.array([-np.sin(lf), np.cos(lf), 0.0]); nf = np.cross(q, ef)
        beta = np.arctan2(np.dot(Nf, ef), np.dot(Nf, nf))
        h = np.linalg.norm(Df @ np.array([np.sin(beta), np.cos(beta)]))          # along geographic north
        k = np.linalg.norm(Df @ np.array([np.sin(beta + np.pi / 2), np.cos(beta + np.pi / 2)]))
        a, b = ab(Df)
        print(f"    {lab:7s} beta={np.degrees(beta):9.4f} deg  h={h:.6f} k={k:.6f}  a={a:.6f} b={b:.6f}")
    Mc = aspect_matrix(45 * D2R, 10 * D2R, 0.0, phiref=45 * D2R)
    print("  conic aspect, centre (45,10), gamma 0, phiref 45 == Rz(-10):", np.allclose(Mc, Rz(-10 * D2R)))

    print("\n== trackball: point under cursor stays ==")
    M0 = aspect_matrix(10 * D2R, 30 * D2R, 0.0)
    f, fi = merc_f, merc_i
    m0 = np.array([0.4, 0.9]); m1 = np.array([-0.7, 1.6])
    q0 = vec(*fi(*m0)); q1 = vec(*fi(*m1))
    pgeo = M0.T @ q0
    M1 = rot_a_to_b(q0, q1) @ M0
    pf, lf = latlon(M1 @ pgeo)
    print("  cursor m1", m1, "-> grabbed point now at", np.array(f(pf, lf)),
          " orthonormal:", np.allclose(M1 @ M1.T, np.eye(3)))

    print("\n== keep-north drag: solve (phi0, lam0) with gamma fixed so that M p = q1 ==")
    def keep_north(pg, q1, gamma, phiref, d_prev=0.0):
        php, lap = latlon(pg)
        v = Rx(-gamma) @ Ry(phiref) @ q1
        sd = np.clip(v[1] / np.cos(php), -1, 1)
        d1 = np.arcsin(sd); d2 = np.pi - d1
        dd = min((d1, d2), key=lambda d: abs(np.angle(np.exp(1j * (d - d_prev)))))
        aw = np.arctan2(np.sin(php), np.cos(php) * np.cos(dd)); av = np.arctan2(v[2], v[0])
        phi0 = np.clip(np.angle(np.exp(1j * (aw - av))), -np.pi / 2, np.pi / 2)
        return phi0, lap - dd
    gamma = 15 * D2R
    M0 = aspect_matrix(20 * D2R, 40 * D2R, gamma)
    q0 = vec(*merc_i(0.3, 0.5)); pg = M0.T @ q0
    q1 = vec(*merc_i(-0.4, 0.9))
    phi0, lam0 = keep_north(pg, q1, gamma, 0.0, d_prev=latlon(pg)[1] - 40 * D2R)
    M1 = aspect_matrix(phi0, lam0, gamma)
    print(f"  new centre ({np.degrees(phi0):.6f}, {np.degrees(lam0):.6f}); grabbed point now at",
          np.array(merc_f(*latlon(M1 @ pg))), "(cursor -0.4, 0.9)")

    print("\n== float32: central-difference step for GLSL (Mercator D, Mollweide, Equal Earth) ==")
    f32 = np.float32
    def merc32(p, l): return f32(l), f32(np.arctanh(f32(np.sin(f32(p)))))
    def ee32(p, l):
        p = f32(p); l = f32(l); t = f32(np.arcsin(f32(EE_M) * np.sin(p)))
        return f32(2 * np.sqrt(3) * l * np.cos(t) / (3 * ee_dP(t))), f32(ee_P(t))
    for nm, f32f, f64 in (('mercator', merc32, 'mercator'), ('equalearth', ee32, 'equalearth')):
        for e in (1e-4, 3e-4, 1e-3, 3e-3, 1e-2):
            err = 0
            for la, lo in [(10, 20), (45, 100), (70, -150)]:
                p, l = la * D2R, lo * D2R
                Dn = np.array([[(f32f(p, l + e)[0] - f32f(p, l - e)[0]) / (2 * e * np.cos(p)),
                                (f32f(p + e, l)[0] - f32f(p - e, l)[0]) / (2 * e)],
                               [(f32f(p, l + e)[1] - f32f(p, l - e)[1]) / (2 * e * np.cos(p)),
                                (f32f(p + e, l)[1] - f32f(p - e, l)[1]) / (2 * e)]])
                Da = D_analytic(f64, p, l)
                err = max(err, np.abs(Dn - Da).max() / np.abs(Da).max())
            print(f"  {nm:10s} eps={e:.0e}  max rel err {err:.1e}")

    print("\n== float32 Equal Earth inverse: Newton iterations needed (start theta = y) ==")
    for nit in (2, 3, 4, 5):
        worst = 0
        for la in np.linspace(-89.9, 89.9, 400):
            x, y = ee_f(la * D2R, 1.0)
            p, _ = ee_i(x, y, it=nit, dtype=np.float32)
            worst = max(worst, abs(p - la * D2R))
        print(f"  {nit} iterations: max |dphi| = {np.degrees(worst):.2e} deg (worst near the poles: asin ill-conditioned)")
    worst = 0
    for la in np.linspace(-80, 80, 400):
        x, y = ee_f(la * D2R, 1.0); p, _ = ee_i(x, y, it=3, dtype=np.float32)
        worst = max(worst, abs(p - la * D2R))
    print(f"  3 iterations, |lat| <= 80: max |dphi| = {np.degrees(worst):.2e} deg")

    print("\n== Mollweide forward Newton iteration counts (float64, tol 1e-12) ==")
    its = [moll_theta(la * D2R)[1] for la in np.linspace(-89.9999, 89.9999, 2001)]
    print(f"  max iterations {max(its)}, mean {np.mean(its):.2f}")

    print("\n== Mollweide forward in float32 (for a GLSL forward): fixed iterations, guarded denominator ==")
    for nit in (2, 3, 4):
        for lim in (89.0, 89.99):
            worst = 0
            for la in np.linspace(-lim, lim, 3000):
                p = f32(la * D2R); s = f32(np.sin(p))
                u = p if abs(p) < f32(60 * D2R) else f32(np.copysign(np.pi - np.cbrt(f32(6 * np.pi) * (f32(1) - abs(s))), p))
                for _ in range(nit):
                    u = f32(u - (u + np.sin(u) - f32(np.pi) * s) / max(f32(1) + np.cos(u), f32(1e-6)))
                worst = max(worst, abs(u / 2 - moll_theta(la * D2R)[0]))
            print(f"  {nit} iterations, |lat| <= {lim}: max |dtheta| = {worst:.1e} rad")

    print("\n== azimuthal D = H S^T in the frame east/north basis ==")
    for k, (hr, kt) in AZS.items():
        worst = 0
        for _ in range(100):
            p = rng.uniform(-50, 50) * D2R; l = rng.uniform(-50, 50) * D2R
            q = vec(p, l); C = np.array([1.0, 0, 0])
            tr = np.dot(C, q) * q - C; tr /= np.linalg.norm(tr)      # radial, away from the centre
            tt = np.cross(q, tr)
            e = np.array([-np.sin(l), np.cos(l), 0]); n = np.cross(q, e)
            S = np.array([[tr @ e, tt @ e], [tr @ n, tt @ n]])
            psi = np.arctan2(q[2], q[1]); cc = np.arctan2(np.hypot(q[1], q[2]), q[0])
            H = np.array([[hr(cc) * np.cos(psi), -kt(cc) * np.sin(psi)], [hr(cc) * np.sin(psi), kt(cc) * np.cos(psi)]])
            worst = max(worst, np.abs(H @ S.T - D_numeric(PROJ[k][0], p, l)).max())
        print(f"  {k:7s} max |H S^T - D_fd| = {worst:.1e}")

    print("\n== Robinson: inverse Newton on spline, float32-like check; table-node test ==")
    worst = 0
    for la in np.linspace(-90, 90, 721):
        x, y = rob_f(la * D2R, 1.0); p, l = rob_i(x, y, it=3)
        worst = max(worst, abs(p - la * D2R), abs(l - 1))
    print(f"  3 Newton steps from linear-table start: max err {worst:.1e} rad")
    print("  (45,60) expected exactly", ROB_FX * 0.8962 * np.pi / 3, ROB_FY * 0.5571)

    print("\n== domain constants ==")
    print(f"  Mercator phi clamp {np.degrees(PHI_MERC):.6f} deg  (y_max = pi)")
    print(f"  Equal Earth y_max = {EE_YMAX:.9f}, x_max(eq) = {ee_f(0, np.pi)[0]:.9f}")
    print(f"  Mollweide semi-axes x {2*SQ2:.9f} y {SQ2:.9f}; Robinson x_max {ROB_FX*np.pi:.6f} y_max {ROB_FY}")
    print(f"  LCC(30,60,origin 45): n={LCC_N:.9f} F={LCC_F:.9f} rho0={LCC_R0:.9f}")
    print(f"  Albers(30,60,origin 45): n={ALB_N:.9f} C={ALB_C:.9f} rho0={ALB_R0:.9f}")
    print(f"  LCC rho at -60: {LCC_F/t_(-60*D2R)**LCC_N:.6f}  Albers rho at -90: {np.sqrt(ALB_C+2*ALB_N)/ALB_N:.6f}, at +90: {np.sqrt(ALB_C-2*ALB_N)/ALB_N:.6f}")

if __name__ == '__main__':
    main()
