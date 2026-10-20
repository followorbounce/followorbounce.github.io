#!/usr/bin/env python3
"""Build /planck-to-horizon.html from page.src.html + objects.json (the checked catalogue).
Adds display fields (form, importance, drawn size, aliases) and inlines the data as JSON.
Run: python3 _specs/scale/build.py   (from the repo root or anywhere)."""
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
d = json.load(open(os.path.join(HERE, 'objects.json')))

# objects the tour and chapters lean on, and the ones worth a label first
TOUR = {'human', 'raindrop', 'capillary-length', 'human-egg', 'human-hair', 'ecoli', 'sars-cov-2', 'bohr-radius', 'proton-radius',
        'lhc-probe', 'planck-length', 'proteus', 'mimas', 'earth', 'sun', 'proxima-distance', 'mw-disk', 'laniakea', 'void',
        'observable-diameter'}
NOTABLE = {'ant', 'blue-whale', 'everest', 'moon', 'jupiter', 'au', 'light-year', 'andromeda', 'dna-width', 'water-molecule',
           'red-blood-cell', 'electron-limit', 'top-compton', 'uranium238-radius', 'eiffel', 'burj-khalifa', 'iss', 'betelgeuse',
           'heliopause', 'voyager1', 'hubble-radius', 'local-group', 'tardigrade', 'mouse', 'elephant', 'ceres', 'vesta',
           'neutron-star', 'sgra-bh', 'm87-bh', 'green-555', 'c60', 'ribosome', 'string-scale', 'great-pyramid', 'trex'}
SIL = {'human', 'ant', 'honeybee', 'blue-whale', 'elephant', 'giraffe', 'mouse', 'trex', 'bee-hummingbird', 'eiffel', 'great-pyramid',
       'burj-khalifa', 'saturn-v', 'iss', 'everest', 'olympus-mons', 'mariana', 'tardigrade', 'dust-mite', 'paramecium',
       'red-blood-cell', 'ecoli', 'sars-cov-2', 'human-hair', 'hyperion', 'shortest-human', 'tallest-human', 'smallest-insect',
       'paedophryne', 'dna-width', 'lhc', 'raindrop', 'hailstone', 'sand-grain', 'human-egg', 'yeast', 'thiomargarita', 'mimivirus',
       'porcine-circovirus', 'pelagibacter', 'paper', 'transistor-1nm'}

def form(o):
    if o['kind'] in ('distance', 'wavelength', 'scale'): return 'span'
    if o['status'] == 'upper_limit': return 'bound'
    if o['id'] in SIL: return 'sil'
    c = o['category']
    if c in ('planetary', 'stellar'): return 'body'
    if c in ('atomic', 'molecular', 'nuclear', 'galactic', 'cosmological', 'particle', 'quantum', 'hypothetical'): return 'cloud'
    if c == 'cellular': return 'body'
    return 'box'

out = []
for o in d['objects']:
    lk = (o.get('length_kind') or '').lower()
    radius = 'radius' in lk
    out.append({
        'id': o['id'], 'n': o['name'], 'L': o['length_m'], 'lk': o.get('length_kind', ''), 'm': o.get('mass_kg'),
        'c': o['category'], 'k': o['kind'], 'st': o['status'], 'u': o.get('uncertainty', ''), 'src': o.get('source', ''),
        'd': o.get('description', ''), 'f': form(o), 'imp': 3 if o['id'] in TOUR else 2 if o['id'] in NOTABLE else 1,
        'W': o['length_m']*(2 if radius else 1)   # drawn width (diameter) in metres
    })
data = json.dumps(out, ensure_ascii=False, separators=(',', ':'))
src = open(os.path.join(HERE, 'page.src.html')).read()
assert '__OBJECTS__' in src
html = src.replace('__OBJECTS__', data.replace('</', '<\\/'))
open(os.path.join(ROOT, 'planck-to-horizon.html'), 'w').write(html)
print('wrote planck-to-horizon.html', len(html), 'bytes,', len(out), 'objects')
