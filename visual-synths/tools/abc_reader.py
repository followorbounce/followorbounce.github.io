"""Minimal read-only Alembic (Ogawa backend) reader — enough to walk the object
tree and pull array/scalar property samples out of an AliceVision / Meshroom
SfM export (point cloud + camera poses). No third-party dependencies.

Ogawa layout: a tree of *groups* (lists of uint64 child offsets) and *data*
blobs (uint64 size + bytes). A child offset with the top bit set is data.
Alembic's AbcCoreOgawa layer maps objects / compound / scalar / array
properties onto that tree; see ReadUtil.cpp in the Alembic sources.
"""
import struct

DATA_BIT = 0x8000000000000000
POD = {  # pod index -> (struct code, byte size)
    0: ('?', 1), 1: ('B', 1), 2: ('b', 1), 3: ('H', 2), 4: ('h', 2), 5: ('I', 4), 6: ('i', 4),
    7: ('Q', 8), 8: ('q', 8), 9: ('e', 2), 10: ('f', 4), 11: ('d', 8), 12: ('s', 0), 13: ('w', 0),
}


class Ogawa:
    def __init__(self, path):
        self.buf = open(path, 'rb').read()
        if self.buf[:5] != b'Ogawa':
            raise ValueError('not an Ogawa Alembic file')
        self.root = struct.unpack_from('<Q', self.buf, 8)[0]

    def group(self, pos):
        if pos == 0:
            return []
        n = struct.unpack_from('<Q', self.buf, pos)[0]
        return list(struct.unpack_from('<%dQ' % n, self.buf, pos + 8))

    def data(self, child):
        pos = child & ~DATA_BIT
        if pos == 0:
            return b''
        n = struct.unpack_from('<Q', self.buf, pos)[0]
        return self.buf[pos + 8: pos + 8 + n]


class Reader:
    def __init__(self, path):
        self.o = Ogawa(path)
        top = self.o.group(self.o.root)
        # [0] archive version, [1] library version, [2] top object, [3] archive metadata,
        # [4] time samplings, [5] indexed metadata
        self.metadata = self._indexed_metadata(self.o.data(top[5])) if len(top) > 5 else ['']
        self.top = self._object('ABC', '', top[2])

    @staticmethod
    def _indexed_metadata(b):
        out, i = [''], 0
        while i < len(b):
            n = b[i]; i += 1
            out.append(b[i:i + n].decode('utf-8', 'replace')); i += n
        return out

    def _meta(self, idx, b, i):
        if idx == 0xff:
            n = struct.unpack_from('<I', b, i)[0]; i += 4
            return b[i:i + n].decode('utf-8', 'replace'), i + n
        return (self.metadata[idx] if idx < len(self.metadata) else ''), i

    def _object(self, name, meta, pos):
        kids = self.o.group(pos)
        obj = {'name': name, 'meta': meta, 'children': [], 'props': {}}
        if not kids:
            return obj
        obj['props'] = self._compound(kids[0])
        headers = self.o.data(kids[-1])
        b = headers[:-32] if len(headers) >= 32 else headers  # trailing 32 bytes are hashes
        i, k = 0, 1
        while i < len(b):
            n = struct.unpack_from('<I', b, i)[0]; i += 4
            cname = b[i:i + n].decode('utf-8', 'replace'); i += n
            midx = b[i]; i += 1
            cmeta, i = self._meta(midx, b, i)
            obj['children'].append(self._object(cname, cmeta, kids[k])); k += 1
        return obj

    def _compound(self, pos):
        kids = self.o.group(pos)
        if not kids:
            return {}
        b = self.o.data(kids[-1])
        props, i, k = {}, 0, 0
        while i < len(b):
            info = struct.unpack_from('<I', b, i)[0]; i += 4
            ptype = info & 0x3
            hint = (info & 0xc) >> 2
            fmt, sz = ('<B', 1) if hint == 0 else ('<H', 2) if hint == 1 else ('<I', 4)
            def rd():
                nonlocal i
                v = struct.unpack_from(fmt, b, i)[0]; i += sz
                return v
            p = {'type': ('compound', 'scalar', 'array')[min(ptype, 2)]}
            if ptype != 0:
                p['pod'] = (info & 0xf0) >> 4
                p['extent'] = (info & 0xff000) >> 12
                p['samples'] = rd()
                if info & 0x200:
                    p['first'] = rd(); p['last'] = rd()
                if info & 0x100:
                    p['ts'] = rd()
            n = rd()
            name = b[i:i + n].decode('utf-8', 'replace'); i += n
            p['meta'], i = self._meta((info & 0xff00000) >> 20, b, i)
            p['_pos'] = kids[k]; k += 1
            if ptype == 0:
                p['props'] = self._compound(p['_pos'])
            props[name] = p
        return props

    def sample(self, prop, index=0):
        """Return (flat tuple of values, dims) for sample `index` (clamped to what's stored)."""
        pod_code, pod_size = POD[prop['pod']]
        kids = self.o.group(prop['_pos'])
        ext = max(1, prop['extent'])
        if prop['type'] == 'scalar':
            raw = self.o.data(kids[min(index, len(kids) - 1)])[16:]
        else:
            nstored = len(kids) // 2
            j = min(index, nstored - 1)
            raw = self.o.data(kids[2 * j])[16:]
        if pod_code in 'sw':
            return raw.split(b'\0')[:-1] if raw else [], None
        count = len(raw) // pod_size
        return struct.unpack_from('<%d%s' % (count, pod_code), raw, 0), (count // ext, ext)


def walk(obj, depth=0, out=print):
    out('  ' * depth + '* ' + obj['name'] + ('   [' + obj['meta'][:60] + ']' if obj['meta'] else ''))
    def props(ps, d):
        for n, p in ps.items():
            if p['type'] == 'compound':
                out('  ' * d + '  {' + n + '}')
                props(p['props'], d + 1)
            else:
                out('  ' * d + '  - %s %s pod=%d ext=%d n=%d' % (n, p['type'], p['pod'], p['extent'], p['samples']))
    props(obj['props'], depth)
    for c in obj['children']:
        walk(c, depth + 1, out)


if __name__ == '__main__':
    import sys
    r = Reader(sys.argv[1])
    walk(r.top)
