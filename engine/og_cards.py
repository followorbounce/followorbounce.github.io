#!/usr/bin/env python3
"""Share pictures (og:image, 1200x630) for every public page of every site in the network.

  python3 engine/og_cards.py [site ...] [--no-render] [--force] [--check] [--only slug,slug]

Sites are the sibling repo folders named in SITES (default: all of them), found next to this repo.
For each one: every .html page with a canonical link (redirect stubs and noindex pages skipped) gets
  og/<path>.jpg      in that repo, where <path> is the canonical path with "/" kept and ".html" dropped
                     ("" -> index), e.g. knots/bowline/ -> og/knots/bowline.jpg
  the head tags      og:image (+ width/height/alt), twitter:card summary_large_image, twitter:image,
                     written after the page's last og:/twitter: tag (idempotent; replaces only these lines).
A page that already carries an og:image of its own (marinewoodcraft.com's photos) is left alone.
It also writes the "More from Follow or Bounce" block (RELATED, NET_PLACE) into every page of the sub-sites:
plain links to the hub and three related sites, between <!-- fob-network --> markers, replaced on every run.
Cards are engine/og-card.html screenshotted with headless Firefox, one isolated --screenshot run per card
(the only reliable mode on this machine); og/manifest.json keeps a hash per card, so unchanged cards are
not rendered again. --check only reports pages without the tags.

Generated pages (knots, machinery, reckoning, newer aerospace guides, the homepage, candidate-results)
also get these tags from their own generator templates, so a rebuild keeps them; run this after a build
to render any new cards.
"""
import hashlib, html, io, json, os, re, subprocess, sys, tempfile, threading, urllib.parse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
ROOT = os.path.dirname(REPO)            # the folder holding every site repo
W, H = 1200, 630

PLEX = {'display': "'IBM Plex Sans Condensed',sans-serif", 'body': "'IBM Plex Sans',sans-serif", 'mono': "'IBM Plex Mono',monospace"}
NET = 'Follow or Bounce'
SITES = {
    'followorbounce.github.io': dict(base='https://followorbounce.github.io/', label='Follow or Bounce', mark='',
        suffix=['Knowledge Network', 'Video Synths', 'Follow or Bounce'],
        cards={'index': dict(desc='Vibecoding, research & development.', art={'kind': 'mascot'})},
        theme=dict(PLEX, paper='#111113', raised='#1a1a1d', ink='#e8e8e4', muted='#a9a8a2', line='#333336', acc='#d4714e')),
    'aerospace': dict(base='https://followorbounce.github.io/aerospace/', label='Aerospace Knowledge Hub', mark=NET,
        suffix=['Aerospace'],
        theme=dict(PLEX, paper='#f6f6f2', raised='#ffffff', ink='#0b0b0c', muted='#55554f', line='#c9c9c1', acc='#c2572b', dtt='uppercase', dls='0')),
    'knots': dict(base='https://followorbounce.github.io/knots/', label='Knot Atlas', mark=NET, suffix=['Knot Atlas'],
        theme=dict(PLEX, display="'Barlow Condensed',sans-serif", paper='#eceee9', raised='#f7f8f4', ink='#172326', muted='#536165', line='#cfd5cf', acc='#b47a16', dtt='uppercase', dls='0')),
    'machinery': dict(base='https://followorbounce.github.io/machinery/', label='Heavy Machinery Encyclopedia', mark=NET,
        suffix=['Heavy Machinery Encyclopedia'],
        theme=dict(PLEX, paper='#f5f5f1', raised='#ffffff', ink='#151a1f', muted='#5b6672', line='#dbdfe2', acc='#c1541d')),
    'reckoning': dict(base='https://followorbounce.github.io/reckoning/', label='Reckoning', mark=NET, suffix=['Reckoning'],
        theme=dict(PLEX, display="'Barlow Condensed',sans-serif", body="'Source Serif 4',serif", paper='#f2f4f3', raised='#ffffff', ink='#14212b', muted='#56646d', line='#cfd6d8', acc='#c8261d', dtt='uppercase', dls='0')),
    'Maya-Calendar': dict(base='https://followorbounce.github.io/Maya-Calendar/', label="Ju'un K'in · Maya Calendar", mark=NET,
        suffix=["Ju'un K'in", "Ju'un K'in, the Classic Maya Calendar"],
        theme=dict(PLEX, display="'Spectral',serif", body="'Source Sans 3',sans-serif", dw='600', paper='#f2f1ec', raised='#ffffff', ink='#111111', muted='#4a4a44', line='#d9d7cc', acc='#a3200a')),
    'tarot': dict(base='https://followorbounce.github.io/tarot/', label='Tarot Draw', mark=NET, suffix=['Tarot Draw'],
        theme=dict(PLEX, display="'Jost',sans-serif", dw='600', paper='#f1ede3', raised='#e6e0d0', ink='#14120f', muted='#5c584e', line='#d4ccb8', acc='#c81e1e')),
    'country-atlas': dict(base='https://followorbounce.github.io/country-atlas/', label='Country Comparison Atlas', mark=NET, suffix=[],
        theme=dict(display="'Archivo',sans-serif", body="'Source Sans 3',sans-serif", mono="'Space Mono',monospace", dw='800', paper='#f7f3ea', raised='#ffffff', ink='#1a2620', muted='#5c6b5f', line='#d8d0ba', acc='#4a7c59')),
    'anatomy-explorer': dict(base='https://followorbounce.github.io/anatomy-explorer/', label='Anatomy Explorer', mark=NET, suffix=[],
        theme=dict(display="'Space Grotesk',sans-serif", body="'Inter',sans-serif", mono="'IBM Plex Mono',monospace", paper='#0a0e14', raised='#11161f', ink='#e8ecf1', muted='#9aa5b4', line='#232a38', acc='#3ddbd9')),
    'world-calendar-explorer': dict(base='https://followorbounce.github.io/world-calendar-explorer/', label='World Calendar Explorer', mark=NET,
        suffix=['World Calendar Explorer'],
        theme=dict(display="'Spectral',serif", body="'Inter',sans-serif", mono="'IBM Plex Mono',monospace", dw='600', paper='#f4efe1', raised='#fffdf7', ink='#1c1a14', muted='#5a5644', line='#c9bd9a', acc='#8a2c1e')),
    'us-states-atlas': dict(base='https://followorbounce.github.io/us-states-atlas/', label='US States Atlas', mark=NET, suffix=['US States Atlas'],
        theme=dict(display="'Fraunces',serif", body="'Inter',sans-serif", mono="'IBM Plex Mono',monospace", dw='600', paper='#f6f2e9', raised='#ffffff', ink='#1c2430', muted='#5c6470', line='#cfc6ae', acc='#b0863c')),
    'soundos': dict(base='https://followorbounce.github.io/soundos/', label='SoundOS', mark=NET, suffix=[],
        theme=dict(display="'Space Mono',monospace", body="'Space Mono',monospace", mono="'Space Mono',monospace", paper='#0a0a0a', raised='#000000', ink='#f5f5f0', muted='#9a9a94', line='#262626', acc='#f5f5f0', dls='-.03em')),
    'candidate-results': dict(base='https://followorbounce.github.io/candidate-results/', label='Candidate · audience votes', mark='', suffix=[],
        theme=dict(display="'Bebas Neue',sans-serif", body="'Golos Text',sans-serif", mono="'IBM Plex Mono',monospace", dw='400', paper='#ffffff', raised='#f2c400', ink='#0d0c0c', muted='#4d4a4a', line='#e6e2e1', acc='#d42a20', dls='.01em')),
    'marinewoodcraft.com': dict(base='https://marinewoodcraft.com/', label='Marine Wood Craft', mark='', suffix=['Marine Wood Craft'],
        theme=dict(display="'Bebas Neue',sans-serif", body="'DM Sans',sans-serif", mono="'IBM Plex Mono',monospace", dw='400', paper='#1b1510', raised='#2a2119', ink='#f3ead9', muted='#c9b89c', line='#4a3a2a', acc='#c49a6c', dls='.01em')),
}
# "More from Follow or Bounce": a plain-HTML block before </body> on every page of these sites (links a crawler can follow),
# the hub plus three sites chosen by topic. Edit here, then run this script; generators that rebuild pages run it after their build.
HUB = 'https://followorbounce.github.io/'
PLACES = {
    'aerospace': ('Aerospace Knowledge Hub', 'aerospace/', 'Field guides to spaceflight history and engineering'),
    'knots': ('Knot Atlas', 'knots/', 'Knots in 3D, tied step by step'),
    'machinery': ('Heavy Machinery Encyclopedia', 'machinery/', 'The largest machines and the physics behind them'),
    'reckoning': ('Reckoning', 'reckoning/', 'Units, sky and sea, signals, weather and ships'),
    'maya': ("Ju'un K'in", 'Maya-Calendar/', 'The Classic Maya calendar, computed live'),
    'tarot': ('Tarot Draw', 'tarot/', 'Three public-domain decks with their original art'),
    'country': ('Country Comparison Atlas', 'country-atlas/', 'Any two countries side by side'),
    'anatomy': ('Anatomy Explorer', 'anatomy-explorer/', 'The human body in 3D, layer by layer'),
    'calendars': ('World Calendar Explorer', 'world-calendar-explorer/', 'Today in the world\'s calendar systems'),
    'states': ('US States Atlas', 'us-states-atlas/', 'Compare any two states, and who governs them'),
    'audio': ('Audio Synths', 'audio-synths/', 'Playable instruments for phone and desktop'),
    'video': ('Video Synths', 'visual-synths/', 'Generative and audio-reactive studies'),
    'music': ('Mathematics of Music', 'music-mathematics', 'Why some notes sound right together'),
    'life': ('Life in Weeks', 'life-in-weeks', 'Your life as a grid of weeks'),
    'feelings': ('Dictionary of Inner Experience', 'dictionary-of-inner-experience/', 'Emotions, and where they are felt in the body'),
    'perception': ('Perception', 'perception-illusions', 'Illusions as evidence of a brain that guesses'),
    'scale': ('Planck to Horizon', 'planck-to-horizon', 'Every size in nature, in one zoom'),
}
RELATED = {
    'aerospace': ('scale', 'reckoning', 'machinery'),
    'knots': ('reckoning', 'machinery', 'aerospace'),
    'machinery': ('aerospace', 'knots', 'reckoning'),
    'reckoning': ('knots', 'calendars', 'aerospace'),
    'Maya-Calendar': ('calendars', 'life', 'tarot'),
    'tarot': ('maya', 'feelings', 'calendars'),
    'country-atlas': ('states', 'calendars', 'scale'),
    'anatomy-explorer': ('feelings', 'perception', 'life'),
    'world-calendar-explorer': ('maya', 'life', 'country'),
    'us-states-atlas': ('country', 'calendars', 'aerospace'),
    'soundos': ('audio', 'video', 'music'),
    'candidate-results': ('states', 'country', 'feelings'),
}
# Full-screen apps, where a block under the page would be out of sight: (mode, the text the block goes in front of).
NET_PLACE = {
    'anatomy-explorer': ('line', '</footer>'),                                # one line inside the credits footer
    'soundos': ('hub', '\n  </div>\n  <div class="toolbar-actions">'),        # a hub link beside the toolbar brand
}
NET_BLOCK = re.compile(r'[ \t]*<!-- fob-network -->[\s\S]*?<!-- /fob-network -->\n?')
NET_CSS = (
    '.fob-net{border-top:1px solid;border-color:color-mix(in srgb,currentColor 22%,transparent);margin-top:48px;'
    'padding:28px max(16px,env(safe-area-inset-right,0px)) calc(28px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));'
    'font-size:15px;line-height:1.45;clear:both}'
    '.fob-net>div{max-width:72rem;margin:0 auto}'
    '.fob-net p{margin:0 0 14px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.75}'
    '.fob-net p a{color:inherit;font-weight:600}'
    '.fob-net ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:10px 28px}'
    '.fob-net li a{display:block;min-height:44px;color:inherit;text-decoration:none}'
    '.fob-net li b{display:block;font-weight:600;text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1px}'
    '.fob-net li span{display:block;opacity:.72}'
    '.fob-net a:focus-visible{outline:2px solid currentColor;outline-offset:3px}')


def footer(site):
    if site not in RELATED:
        return ''
    mode = NET_PLACE.get(site, ('block',))[0]
    if mode == 'hub':
        return ('<!-- fob-network --><a href="%s" style="margin-left:10px;color:inherit;opacity:.7;font-size:11px;'
                'text-decoration:underline;text-underline-offset:3px">Follow or Bounce</a><!-- /fob-network -->' % HUB)
    if mode == 'line':
        links = ' · '.join('<a href="%s%s">%s</a>' % (HUB, PLACES[k][1], html.escape(PLACES[k][0])) for k in RELATED[site])
        return ('<!-- fob-network --><p style="margin:8px 0 0">More from <a href="%s">Follow or Bounce</a>: %s</p>'
                '<!-- /fob-network -->' % (HUB, links))
    items = ''.join('<li><a href="%s%s"><b>%s</b><span>%s</span></a></li>' % (HUB, PLACES[k][1], html.escape(PLACES[k][0]), html.escape(PLACES[k][2]))
                    for k in RELATED[site])
    return ('<!-- fob-network -->\n<aside class="fob-net" aria-label="More from Follow or Bounce"><style>%s</style><div>'
            '<p><a href="%s">Follow or Bounce</a> · more from the studio</p><ul>%s</ul></div></aside>\n<!-- /fob-network -->\n'
            % (NET_CSS, HUB, items))


SKIP_DIRS = {'engine', 'tools', 'node_modules', 'og', 'tests', 'abc', 'src'}
TAGS = re.compile(r'[ \t]*<meta (?:property="og:image(?::[a-z]+)?"|name="twitter:(?:card|image)")[^>]*>\n?')


def meta(h, attr, name):
    m = re.search(r'<meta[^>]+%s=["\']%s["\'][^>]*>' % (attr, re.escape(name)), h, re.I)
    if not m:
        return None
    c = re.search(r'content=(["\'])(.*?)\1', m.group(0), re.S)
    return html.unescape(c.group(2)).strip() if c else None


def pages(site):
    cfg, root = SITES[site], os.path.join(ROOT, site)
    for dp, dn, fn in os.walk(root):
        dn[:] = sorted(d for d in dn if not d.startswith(('.', '_')) and d not in SKIP_DIRS)
        for f in sorted(fn):
            if not f.endswith('.html'):
                continue
            path = os.path.join(dp, f)
            h = open(path, encoding='utf-8').read()
            m = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]*href=["\']([^"\']+)', h) or \
                re.search(r'<link[^>]+href=["\']([^"\']+)["\'][^>]*rel=["\']canonical', h)
            if '</body>' not in h.lower():
                continue                        # a bare fragment (candidate-results/artifact.html, the claude.ai copy)
            if not m or re.search(r'http-equiv=["\']refresh', h, re.I) or re.search(r'<meta[^>]+name=["\']robots["\'][^>]+noindex', h, re.I):
                continue
            canon = m.group(1)
            if not canon.startswith(cfg['base']):
                print('  skip (canonical off-site):', os.path.relpath(path, root), canon); continue
            rel = canon[len(cfg['base']):].split('#')[0].rstrip('/')
            rel = re.sub(r'(^|/)index\.html$', '', rel)
            rel = re.sub(r'\.html$', '', rel) or 'index'
            yield dict(file=path, html=h, canon=canon, slug=rel)


def clean_title(t, cfg):
    t = re.sub(r'\s+', ' ', t).strip()
    parts = re.split(r'\s+[—|–·]\s+', t)
    if len(parts) > 1 and parts[-1] in cfg['suffix']:
        parts = parts[:-1]
    elif len(parts) > 1 and parts[0] in cfg['suffix'] + [cfg['label']]:
        parts = parts[1:]
    t = ' — '.join(parts)
    t = re.split(r'\s+/\s+(?=[«"]?[А-Яа-яЁё])', t)[0]       # bilingual "EN / RU" aerospace titles: the card is English
    return t


# The dictionaries' dark-theme colours, for the term drawings on the (dark) homepage card
DICT_DARK = {
    'dictionary-of-design': {'ink': '#eeece6', 'paper': '#141412', 'paper-raised': '#1c1b18', 'ink-muted': '#a5a39b', 'ink-faint': '#726f66',
                             'line': '#2c2a26', 'line-strong': '#3d3a34', 'ext': '#7c95f2', 'ext-soft': '#1b2340'},
    'dictionary-of-inner-experience': {'ink': '#eee9e4', 'paper': '#161311', 'paper-raised': '#1e1a17', 'ink-muted': '#a89e97', 'ink-faint': '#726862',
                                       'line': '#2e2925', 'line-strong': '#403933', 'int': '#e08a9c', 'int-soft': '#3a1e24'},
}


def art(site, p):
    h, root = p['html'], os.path.join(ROOT, site)
    if site == 'knots':                 # the finished knot, as the site's own thumbnail file (it carries its object colours)
        m = re.match(r'knots/([a-z0-9-]+)$', p['slug'])
        if m and os.path.exists(os.path.join(root, 'assets/thumbs', m.group(1) + '.svg')):
            return {'kind': 'contain', 'src': '/f/knots/assets/thumbs/%s.svg' % m.group(1)}
    if site == 'machinery':
        m = re.search(r'<img[^>]+src="/machinery/(assets/img/machines/[^"]+)"', h)
        if m:
            return {'kind': 'img', 'src': '/f/machinery/' + m.group(1)}
    if site == 'followorbounce.github.io':
        m = re.match(r'visual-synths/([a-z0-9-]+)$', p['slug'])
        if m and os.path.exists(os.path.join(root, 'visual-synths/thumbs', m.group(1) + '.jpg')):
            return {'kind': 'img', 'src': '/f/%s/visual-synths/thumbs/%s.jpg' % (site, m.group(1))}
        m = re.match(r'(dictionary-of-design|dictionary-of-inner-experience)/[a-z0-9-]+$', p['slug'])
        art = re.search(r'<figure class="art"[^>]*>(<svg[\s\S]*?</svg>)</figure>', h) if m else None
        if art:                         # a dictionary term page: its own drawing, coloured as in the dictionary's dark theme
            svg = art.group(1)
            for k, v in DICT_DARK[m.group(1)].items():
                svg = svg.replace('var(--%s)' % k, v)
            return {'kind': 'svg', 'svg': svg}
    if site == 'tarot':
        return {'kind': 'fan', 'src': ['/f/tarot/images/' + f for f in ('egyptian/01.png', 'rws/major_00.jpg', 'solabusca/00.jpg')
                                       if os.path.exists(os.path.join(root, 'images', f))]}
    return None


def card_data(site, p):
    cfg, h = SITES[site], p['html']
    t = meta(h, 'property', 'og:title') or re.search(r'<title[^>]*>(.*?)</title>', h, re.S).group(1)
    d = meta(h, 'property', 'og:description') or meta(h, 'name', 'description') or ''
    title = clean_title(html.unescape(t), cfg)
    if d.lower().startswith(title.lower() + ':'):         # "Bowline: The classic fixed loop…" under the title BOWLINE
        d = d[len(title) + 1:].strip()
    if d and not re.search(r'[.!?…)"»]$', d):             # a description cut off mid-word by its generator
        d = d.rsplit(' ', 1)[0].rstrip(',;:—-') + '…'
    url = re.sub(r'^https://', '', p['canon']).rstrip('/')
    c = dict(theme=cfg['theme'], label=cfg['label'], mark=cfg['mark'], title=title, desc=d, url=url, art=art(site, p))
    c.update(cfg.get('cards', {}).get(p['slug'], {}))
    return c


def inject(site, p, img, alt, foot):
    """The page with its share tags and network block in place; written only when something changed."""
    h = p['html']
    if not (meta(h, 'property', 'og:image') == img and meta(h, 'name', 'twitter:image') == img):
        block = ('<meta property="og:image" content="%s">\n<meta property="og:image:width" content="%d">\n'
                 '<meta property="og:image:height" content="%d">\n<meta property="og:image:alt" content="%s">\n'
                 '<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:image" content="%s">\n'
                 % (img, W, H, html.escape(alt, quote=True), img))
        h = TAGS.sub('', h)
        last = None
        for m in re.finditer(r'<meta (?:property="og:[a-z:_]+"|name="twitter:[a-z:]+")[^>]*>\n?', h):
            last = m
        if last and h[last.end() - 1] == '\n':
            h = h[:last.end()] + block + h[last.end():]
        else:
            i = h.lower().index('</head>')
            h = h[:i] + block + h[i:]
    h = NET_BLOCK.sub('', h)
    if foot:
        place = NET_PLACE.get(site)
        i = h.index(place[1]) if place else h.lower().rindex('</body>')
        h = h[:i] + foot + h[i:]
    if h != p['html']:
        with open(p['file'], 'w', encoding='utf-8') as f:
            f.write(h)
        return True
    return False


class Handler(SimpleHTTPRequestHandler):
    cards = {}

    def do_GET(self):
        u = urllib.parse.urlparse(self.path).path
        if u.startswith('/card/'):
            c = self.cards[u[6:]]
            body = TEMPLATE.replace('/*DATA*/null', json.dumps(c).replace('</', '<\\/'))
            if c['art'] and c['art']['kind'] == 'mascot':        # Dima and Claude, drawn by the homepage widget's own code
                body = body.replace('<!--SCRIPTS-->', '<script src="/f/followorbounce.github.io/engine/mascot.js"></script>')
            body = body.encode()
            self.send_response(200); self.send_header('content-type', 'text/html; charset=utf-8'); self.end_headers()
            self.wfile.write(body); return
        if u.startswith('/f/'):
            self.path = u[2:]
            return super().do_GET()
        self.send_error(404)

    def log_message(self, *a):
        pass


TEMPLATE = open(os.path.join(HERE, 'og-card.html'), encoding='utf-8').read()


def main():
    args = sys.argv[1:]
    only = set(args.pop(args.index('--only') + 1).split(',')) if '--only' in args else None
    flags = {a for a in args if a.startswith('--')}
    sites = [a for a in args if not a.startswith('--')] or [s for s in SITES if os.path.isdir(os.path.join(ROOT, s))]
    srv = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=ROOT))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = 'http://127.0.0.1:%d' % srv.server_address[1]
    profile = tempfile.mkdtemp(prefix='og-ff-')
    tver = hashlib.sha1(TEMPLATE.encode()).hexdigest()[:8]
    total = rendered = missing = 0
    for site in sites:
        cfg, root = SITES[site], os.path.join(ROOT, site)
        man_path = os.path.join(root, 'og', 'manifest.json')
        man = json.load(open(man_path)) if os.path.exists(man_path) else {}
        seen, n_inj = set(), 0
        foot = footer(site)
        for p in pages(site):
            if (only and p['slug'] not in only) or p['slug'] in seen:
                continue                        # (a second file claiming the same canonical, e.g. a draft copy)
            own = meta(p['html'], 'property', 'og:image')
            img = cfg['base'] + 'og/' + p['slug'] + '.jpg'
            if own and own != img:
                continue                        # the page has its own picture
            total += 1
            seen.add(p['slug'])
            if '--check' in flags:
                problems = [w for w, bad in (('tags', own != img),
                                             ('picture', not os.path.exists(os.path.join(root, 'og', p['slug'] + '.jpg'))),
                                             ('network block', bool(foot) and foot not in p['html'])) if bad]
                if problems:
                    missing += 1; print('  %s %s: no %s' % (site, p['slug'], ', '.join(problems)))
                continue
            data = card_data(site, p)
            key = hashlib.sha1((tver + json.dumps(data, sort_keys=True)).encode()).hexdigest()[:16]
            out = os.path.join(root, 'og', p['slug'] + '.jpg')
            if '--no-render' not in flags and ('--force' in flags or man.get(p['slug']) != key or not os.path.exists(out)):
                os.makedirs(os.path.dirname(out), exist_ok=True)
                cid = '%s-%d' % (site, total)
                Handler.cards[cid] = data
                png = os.path.join(profile, 'shot.png')
                for attempt in range(2):
                    if os.path.exists(png):
                        os.remove(png)
                    subprocess.run(['firefox', '--headless', '--no-remote', '--profile', profile, '--window-size=%d,%d' % (W, H),
                                    '--screenshot', png, base + '/card/' + cid], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=90)
                    if os.path.exists(png) and len(set(Image.open(png).convert('L').resize((40, 21)).tobytes())) > 12:
                        break
                if not os.path.exists(png):
                    print('  FAILED', site, p['slug']); continue
                Image.open(png).convert('RGB').crop((0, 0, W, H)).save(out, 'JPEG', quality=85, optimize=True, progressive=True)
                man[p['slug']] = key; rendered += 1
                print('  card', site, p['slug'], flush=True)
            n_inj += inject(site, p, img, '%s — %s' % (data['title'], cfg['label']), foot)
        if '--check' not in flags:
            for slug in [s for s in man if s not in seen and not only]:     # pages that went away
                man.pop(slug)
                f = os.path.join(root, 'og', slug + '.jpg')
                if os.path.exists(f):
                    os.remove(f)
            os.makedirs(os.path.dirname(man_path), exist_ok=True)
            with open(man_path, 'w') as f:
                json.dump(dict(sorted(man.items())), f, indent=0)
            print('%s: %d pages, tags written to %d' % (site, len(seen), n_inj), flush=True)
    srv.shutdown()
    print('done: %d pages, %d cards rendered%s' % (total, rendered, ', %d without tags' % missing if '--check' in flags else ''))
    if missing:
        sys.exit(1)


if __name__ == '__main__':
    main()
