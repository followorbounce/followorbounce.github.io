"""Convert an AliceVision / Meshroom SfM Alembic export (point cloud + camera
poses) into the compact binary that visual-synths/photogrammetry-scan.html loads.

    python3 visual-synths/tools/abc_to_bin.py visual-synths/abc/cloud_and_poses.abc \
            visual-synths/data/city-scan.bin

What it does, in order:
  1. reads P + color from the AbcGeom_Points object and every camera xform;
  2. rotates the scene so the mean camera "up" axis becomes +Y (SfM has no
     gravity; the photographer's horizon is the best estimate of it);
  3. centres on the 1st-99th percentile box and scales its largest side to 2.6
     units (the frame every installation study uses), drops far outliers;
  4. shuffles points with a fixed seed so any first-N prefix is a uniform subsample;
  5. sorts cameras by the frame number in their name (pngExport_NNNNN), which
     recovers the order of the original capture path.

Layout (little-endian): 'SFM1', u32 nPts, u32 nCams, f32 fovy, f32 aspect,
f32 bmin[3], f32 bmax[3], i16 pos[n*3] (quantised over bmin..bmax, padded to 4
bytes), u8 rgb[n*3] (padded to 4), f32 cam[nCams*9] = position, forward, up.
Requires numpy.
"""
import os
import re
import struct
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from abc_reader import Reader  # noqa: E402


def find(o, pred):
    if pred(o):
        return o
    for c in o['children']:
        f = find(c, pred)
        if f:
            return f


def pad4(b):
    return b + b'\0' * (-len(b) % 4)


def main(src, dst):
    r = Reader(src)
    pts = find(r.top, lambda o: 'AbcGeom_Points' in o['meta'])
    g = pts['props']['.geom']['props']
    P = np.array(r.sample(g['P'])[0], np.float64).reshape(-1, 3)
    arb = g.get('.arbGeomParams', {}).get('props', {})
    C = (np.array(r.sample(arb['color'])[0], np.float32).reshape(-1, 3)
         if 'color' in arb else np.full_like(P, 0.8, np.float32))

    cams, fov, aspect = [], 0.8, 16 / 9
    root = find(r.top, lambda o: o['name'] == 'mvgCameras')
    for c in (root['children'] if root else []):
        M = np.array(r.sample(c['props']['.xform']['props']['.vals'])[0]).reshape(4, 4)
        m = re.search(r'pngExport_(\d+)|_(\d+)$', c['name'])
        order = int(next(x for x in m.groups() if x)) if m else len(cams)
        cams.append((order, M[3, :3], -M[2, :3], M[1, :3]))
        if len(cams) == 1:  # AbcGeom_Camera core: [0] focal mm, [1] h-aperture cm, [2] ... [3] v-aperture cm
            core = find(c, lambda o: 'AbcGeom_Camera' in o['meta'])
            if core:
                k, _ = r.sample(core['props']['.geom']['props']['.core'])
                fov = 2 * np.arctan(k[3] * 10 / 2 / k[0])
                aspect = k[1] / k[3]
    cams.sort(key=lambda c: c[0])

    up = np.mean([c[3] for c in cams], 0) if cams else np.array([0, 1.0, 0])
    y = up / np.linalg.norm(up)
    x = np.cross([0, 0, 1.0] if abs(y[2]) < 0.9 else [1.0, 0, 0], y)
    x /= np.linalg.norm(x)
    R = np.stack([x, y, np.cross(x, y)])

    Q = P @ R.T
    lo, hi = np.percentile(Q, 1, 0), np.percentile(Q, 99, 0)
    ctr, s = (lo + hi) / 2, 2.6 / (hi - lo).max()
    Q = (Q - ctr) * s
    keep = np.all(np.abs(Q) < 1.3 * 2.2, 1)
    Q, C = Q[keep], C[keep]
    perm = np.random.default_rng(7).permutation(len(Q))
    Q, C = Q[perm], C[perm]

    bmin, bmax = Q.min(0), Q.max(0)
    q = np.round((Q - bmin) / (bmax - bmin) * 65535 - 32768).astype('<i2')
    col = np.round(np.clip(C, 0, 1) * 255).astype(np.uint8)
    cam = np.array([np.concatenate([(p @ R.T - ctr) * s, f @ R.T, u @ R.T])
                    for _, p, f, u in cams], '<f4').reshape(-1, 9)

    head = b'SFM1' + struct.pack('<II2f3f3f', len(Q), len(cam), fov, aspect, *bmin, *bmax)
    blob = head + pad4(q.tobytes()) + pad4(col.tobytes()) + cam.tobytes()
    os.makedirs(os.path.dirname(dst) or '.', exist_ok=True)
    open(dst, 'wb').write(blob)
    print('%d points (%d outliers dropped), %d cameras, fovy %.1f deg, aspect %.2f, %.2f MB -> %s'
          % (len(Q), (~keep).sum(), len(cam), np.degrees(fov), aspect, len(blob) / 1e6, dst))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
