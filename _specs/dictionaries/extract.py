#!/usr/bin/env python3
"""Read both dictionaries (their index.html is the source of truth) into _specs/dictionaries/terms.json:
one record per card, plus the categories, the body-map data and silhouette of the Dictionary of Inner Experience.
Run before build_terms.py; never edit terms.json by hand."""
import html, json, os, re, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
DICTS = {'design': 'dictionary-of-design', 'inner': 'dictionary-of-inner-experience'}
U = html.unescape


def url_slug(card_id):
    """Card ids are anchors (e.g. 'kerning-tracking-&-leading', 'frontend---backend'); page URLs need clean slugs."""
    s = card_id.replace('&', 'and')
    s = re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')
    return s


def public_def(d):
    """Drop the editors' notes about the old source dictionary that two cards carry; they make no sense on a term page."""
    d = re.sub(r'\s*—\s*not in the source dictionary, added as a real gap in this category\.$', '.', d)
    d = re.sub(r',\s*distinguished from the regulation strategy of Suppression that the source dictionary had bundled into it\.$',
               ', distinct from the regulation strategy of Suppression.', d)
    d = re.sub(r'\s*—\s*absorbs what the source separately, redundantly, called Graphic Editor\.$', '.', d)
    d = re.sub(r'\s*—\s*reframed here from a vaguer original definition into its actual working sense\.$', '.', d)
    d = re.sub(r', distinguished from RAW by not necessarily being an unprocessed camera file\.$', '.', d)
    return d


def text(fragment):
    return U(re.sub(r'<[^>]+>', '', fragment)).strip()


out = {'dictionaries': {}, 'terms': []}
for key, folder in DICTS.items():
    h = open(os.path.join(REPO, folder, 'index.html'), encoding='utf-8').read()
    cats = {c: text(lab).rstrip(' 0123456789') for c, lab in re.findall(r'<button class="catbtn[^"]*" data-cat="([^"]+)">([^<]*)', h) if c != 'all'}
    title = re.sub(r'\s*—.*$', '', text(re.search(r'<title>(.*?)</title>', h).group(1)))
    desc = U(re.search(r'<meta name="description" content="([^"]*)"', h).group(1))
    out['dictionaries'][key] = {'folder': folder, 'title': title, 'description': desc, 'categories': cats}
    for m in re.finditer(r'<article class="card" id="([^"]+)" data-cat="([^"]+)"[^>]*>([\s\S]*?)</article>', h):
        cid, cat, body = m.groups()
        rec = {'dict': key, 'id': cid, 'slug': url_slug(cid), 'cat': cat, 'catLabel': cats.get(cat, cat),
               'name': text(re.search(r'<h3>(.*?)</h3>', body).group(1)),
               'def': public_def(text(re.search(r'<p class="def">([\s\S]*?)</p>', body).group(1))),
               'rels': re.findall(r'<a href="#([^"]+)" class="rel">', body),
               'dims': [text(d) for d in re.findall(r'<span>([^<]*)</span>', (re.search(r'<div class="dims">([\s\S]*?)</div>', body) or [None, ''])[1])],
               'badge': text((re.search(r'<span class="badge">([^<]*)</span>', body) or [None, ''])[1]),
               'svg': re.search(r'<div class="card-art">([\s\S]*?)</div>', body).group(1).strip()}
        out['terms'].append(rec)
    if key == 'inner':
        js = re.search(r'var BODY_MAP = (\{[\s\S]*?\n\});', h).group(1)
        out['bodyMap'] = json.loads(subprocess.run(['node', '-e', 'process.stdout.write(JSON.stringify(' + js + '))'],
                                                   capture_output=True, text=True, check=True).stdout)
        out['silhouette'] = re.search(r'<svg class="body-silhouette"[\s\S]*?</svg>', h).group(0)
        note = re.search(r'Based on Nummenmaa[^<]*', h)
        out['bodyMapSource'] = note.group(0).strip() if note else ''

slugs = {}
for t in out['terms']:
    k = (t['dict'], t['slug'])
    assert k not in slugs, 'slug collision %s' % (k,)
    slugs[k] = t['id']
json.dump(out, open(os.path.join(HERE, 'terms.json'), 'w'), ensure_ascii=False, indent=1)
print('terms:', {k: sum(1 for t in out['terms'] if t['dict'] == k) for k in DICTS}, 'body maps:', len(out.get('bodyMap', {})))
