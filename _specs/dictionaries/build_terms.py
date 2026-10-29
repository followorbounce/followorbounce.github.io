#!/usr/bin/env python3
"""One page per dictionary term (reach plan B1): dictionary-of-design/<slug>.html and
dictionary-of-inner-experience/<slug>.html, served at /dictionary-of-…/<slug>.

  python3 _specs/dictionaries/extract.py        # the dictionaries' index.html -> terms.json
  python3 _specs/dictionaries/build_terms.py    # terms.json + extra-design.json + extra-inner.json -> pages

Each page: the term, its category, the card's drawing, the definition, the written extra (extra-*.json: "in practice",
the term it is confused with, a small exercise / a noticing prompt), for emotions the body map (Nummenmaa et al. 2014
data from the dictionary itself), related terms with their definitions, the rest of its category, previous/next,
DefinedTerm + BreadcrumbList JSON-LD. Also writes sitemap-terms.xml (listed in the sitemap index by
engine/build_network.py) and links every card's name in the two dictionaries to its page.
The share cards come from engine/og_cards.py (run it after this). Never edit the generated pages.
"""
import html, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
HOST = 'https://followorbounce.github.io'
E = lambda s: html.escape(str(s), quote=True)

THEME = {
    'design': dict(
        fonts='family=Archivo:wght@500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600',
        css=""":root{--ink:#141414;--paper:#f4f4f1;--paper-raised:#ffffff;--ink-muted:#5c5c58;--ink-faint:#9a9892;--line:#dcdbd4;--line-strong:#c3c1b8;--ext:#2545c9;--ext-soft:#e3e7fa;--acc:var(--ext);--acc-soft:var(--ext-soft);--font-display:'Archivo',system-ui,sans-serif;--font-mono:'IBM Plex Mono',ui-monospace,monospace;--font-body:var(--font-mono);--body-size:14px;--edge:clamp(16px,4vw,56px);--maxw:1080px}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--ink:#eeece6;--paper:#141412;--paper-raised:#1c1b18;--ink-muted:#a5a39b;--ink-faint:#726f66;--line:#2c2a26;--line-strong:#3d3a34;--ext:#7c95f2;--ext-soft:#1b2340}}
:root[data-theme="dark"]{--ink:#eeece6;--paper:#141412;--paper-raised:#1c1b18;--ink-muted:#a5a39b;--ink-faint:#726f66;--line:#2c2a26;--line-strong:#3d3a34;--ext:#7c95f2;--ext-soft:#1b2340}""",
        pair=('Design of the external world · paired with', 'inner'),
        title='{name}: meaning in art and design · Dictionary of Design',
        extra_h=('In practice', 'Often confused with', 'Try this')),
    'inner': dict(
        fonts='family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600;8..60,700&family=IBM+Plex+Mono:wght@400;500;600',
        css=""":root{--ink:#201c1c;--paper:#f6f4f1;--paper-raised:#ffffff;--ink-muted:#635b58;--ink-faint:#9c928c;--line:#e0dbd2;--line-strong:#c9c1b5;--int:#7a2b3d;--int-soft:#f3e2e5;--acc:var(--int);--acc-soft:var(--int-soft);--font-display:'Source Serif 4',Georgia,serif;--font-mono:'IBM Plex Mono',ui-monospace,monospace;--font-body:var(--font-display);--body-size:16px;--edge:clamp(16px,4vw,56px);--maxw:1080px}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--ink:#eee9e4;--paper:#161311;--paper-raised:#1e1a17;--ink-muted:#a89e97;--ink-faint:#726862;--line:#2e2925;--line-strong:#403933;--int:#e08a9c;--int-soft:#3a1e24}}
:root[data-theme="dark"]{--ink:#eee9e4;--paper:#161311;--paper-raised:#1e1a17;--ink-muted:#a89e97;--ink-faint:#726862;--line:#2e2925;--line-strong:#403933;--int:#e08a9c;--int-soft:#3a1e24}""",
        pair=('Design of inner experience · paired with', 'design'),
        title='{name}: what it is and where you feel it · Dictionary of Inner Experience',
        extra_h=('How it shows up', 'How it differs from', 'Notice')),
}

PAGE_CSS = """*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--font-body);font-size:var(--body-size);line-height:1.65}
.wrap{max-width:var(--maxw);margin:0 auto;padding-inline:max(var(--edge),env(safe-area-inset-left)) max(var(--edge),env(safe-area-inset-right))}
a{color:inherit}
h1,h2,h3{margin:0;font-family:var(--font-display);font-weight:700}
header{border-bottom:1px solid var(--ink);padding-block:14px;position:sticky;top:0;background:var(--paper);z-index:5;padding-top:max(14px,env(safe-area-inset-top))}
header .wrap{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
header .brand{font-family:var(--font-mono);font-size:12px;letter-spacing:.14em;border:1px solid var(--ink);padding:6px 10px;text-decoration:none}
header .pair{font-family:var(--font-mono);font-size:11px;color:var(--ink-faint)}
header .pair a{color:var(--acc);text-decoration:none}
header .back{font-family:var(--font-mono);font-size:12px;text-decoration:none;min-height:44px;display:inline-flex;align-items:center}
.crumbs{font-family:var(--font-mono);font-size:12px;color:var(--ink-faint);padding-top:22px}
.crumbs a{color:var(--ink-muted);text-decoration:none}
.crumbs a:hover{text-decoration:underline}
.head{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:clamp(20px,4vw,48px);align-items:center;padding-block:22px 34px;border-bottom:1px solid var(--ink)}
.eyebrow{font-family:var(--font-mono);font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:12px}
.eyebrow a{color:var(--acc);text-decoration:none}
.eyebrow .badge{margin-left:8px;border:1px solid var(--line-strong);padding:1px 6px;letter-spacing:.06em}
h1{font-size:clamp(2.3rem,7vw,4rem);line-height:1;letter-spacing:-.01em}
.def{font-family:var(--font-display);font-size:clamp(1.15rem,2.4vw,1.4rem);line-height:1.45;margin:18px 0 0;max-width:36em}
.dims{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
.dims span{font-family:var(--font-mono);font-size:11px;border:1px solid var(--line-strong);border-radius:12px;padding:3px 10px;color:var(--ink-muted)}
.art{background:var(--paper-raised);border:1px solid var(--line);aspect-ratio:100/76;padding:6%}
.art svg{display:block;width:100%;height:100%}
.body{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:clamp(20px,4vw,48px);padding-block:30px}
.body h2{font-size:13px;font-family:var(--font-mono);font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-faint);margin:0 0 8px}
.block{margin-bottom:26px;max-width:40em}
.block p{margin:0}
.more p{font-size:1.06em}
.aside{display:grid;gap:22px;align-content:start}
.note{border-left:3px solid var(--acc);padding:10px 14px;background:var(--acc-soft)}
.bm{display:grid;grid-template-columns:120px 1fr;gap:16px;align-items:center;border:1px solid var(--line);background:var(--paper-raised);padding:14px}
.bm svg{width:100%;height:auto;max-height:230px;display:block}
.bm .bm-region{fill:transparent;stroke:var(--line-strong);stroke-width:.6}
.bm .bm-region.lit{fill:var(--acc);stroke:var(--acc);stroke-width:1}
.bm p{margin:0 0 6px}
.bm small{display:block;font-family:var(--font-mono);font-size:10.5px;color:var(--ink-faint);line-height:1.5}
.rel{display:grid;gap:10px}
.rel a{display:block;border:1px solid var(--line);background:var(--paper-raised);padding:12px 14px;text-decoration:none;min-height:44px}
.rel a b{display:block;font-family:var(--font-display);font-size:1.08rem}
.rel a span{display:block;font-size:.92em;color:var(--ink-muted);line-height:1.5;margin-top:2px}
.rel a:hover{border-color:var(--acc)}
.cat{display:flex;flex-wrap:wrap;gap:6px}
.cat a,.cat span{font-family:var(--font-mono);font-size:12px;border:1px solid var(--line-strong);padding:9px 11px;text-decoration:none;color:var(--ink-muted);min-height:44px;display:inline-flex;align-items:center}
.cat span{border-color:var(--acc);color:var(--acc)}
.cat a:hover{border-color:var(--acc);color:var(--ink)}
.pn{display:flex;justify-content:space-between;gap:12px;border-top:1px solid var(--ink);padding-block:18px;font-family:var(--font-mono);font-size:13px}
.pn a{text-decoration:none;min-height:44px;display:inline-flex;align-items:center}
.pn a:hover{text-decoration:underline}
footer{border-top:1px solid var(--line);padding-block:22px calc(22px + env(safe-area-inset-bottom));font-family:var(--font-mono);font-size:12px;color:var(--ink-faint)}
footer a{color:var(--ink-muted)}
@media (max-width:760px){.head,.body{grid-template-columns:1fr}.art{max-width:360px}}"""


def clip(t, n=155):
    t = re.sub(r'\s+', ' ', t).strip()
    return t if len(t) <= n else t[:n - 1].rsplit(' ', 1)[0].rstrip(',;:—-') + '…'


def ld(items):
    return ''.join('<script type="application/ld+json">%s</script>\n' % json.dumps(dict({'@context': 'https://schema.org'}, **i), ensure_ascii=False,
                                                                                 separators=(',', ':')).replace('</', '<\\/') for i in items)


def body_map(t, data):
    regions = sorted(data['bodyMap'].get(t['id'], []), key=lambda r: -r['i'])
    if not regions:
        return ''
    svg = data['silhouette'].replace('viewBox="0 0 200 460"', 'viewBox="0 0 200 320"', 1)   # the figure ends at y 316
    for r in regions:                                      # light each region at its intensity
        svg = re.sub(r'(<(?:path|ellipse) class="bm-region)(" data-region="%s")' % re.escape(r['r']),
                     r'\1 lit\2 style="fill-opacity:%.2f"' % r['i'], svg)
    svg = svg.replace('<svg class="body-silhouette"', '<svg class="body-silhouette" role="img" aria-label="Body map of %s"' % E(t['name']), 1)
    names = [r['r'].replace('-', ' ') for r in regions[:3]]
    felt = ', '.join(names[:-1]) + ' and ' + names[-1] if len(names) > 1 else names[0]
    return ('<div class="block"><h2>Where it is felt</h2><div class="bm">%s<div><p>Felt most in the <b>%s</b>.</p>'
            '<small>%s The map shows where people report bodily sensation, on average; individual experience varies.</small></div></div></div>'
            % (svg, E(felt), E(data.get('bodyMapSource') or 'Based on Nummenmaa et al. (2014), bodily maps of emotions.')))


def page(t, data, extra, by_id, order):
    d = data['dictionaries'][t['dict']]
    th = THEME[t['dict']]
    other = data['dictionaries'][th['pair'][1]]
    folder = d['folder']
    url = '%s/%s/%s' % (HOST, folder, t['slug'])
    title = th['title'].format(name=t['name'])
    x = extra.get(t['id']) or {}
    desc = clip(t['def'])
    rel = [by_id[(t['dict'], r)] for r in t['rels'] if (t['dict'], r) in by_id]
    conf = x.get('confused') or x.get('distinct')
    peers = [p for p in order if p['cat'] == t['cat']]
    i = order.index(t)
    prev, nxt = order[i - 1], order[(i + 1) % len(order)]
    h1, h2, h3 = th['extra_h']

    blocks = ''
    if x.get('more'):
        blocks += '<div class="block more"><h2>%s</h2><p>%s</p></div>' % (h1, E(x['more']))
    if conf and conf.get('line'):
        target = by_id.get((t['dict'], conf.get('term', '')))
        label = ('<a href="%s">%s</a>' % (target['slug'], E(target['name']))) if target else E(conf.get('term', '').replace('-', ' '))
        blocks += '<div class="block"><h2>%s %s</h2><p>%s</p></div>' % (h2, label, E(conf['line']))
    tip = x.get('try') or x.get('notice')
    if tip:
        blocks += '<div class="block"><h2>%s</h2><p class="note">%s</p></div>' % (h3, E(tip))
    if t['dict'] == 'inner':
        blocks += body_map(t, data)
    aside = ''
    if rel:
        aside += '<div><h2>Related terms</h2><div class="rel">%s</div></div>' % ''.join(
            '<a href="%s"><b>%s</b><span>%s</span></a>' % (r['slug'], E(r['name']), E(clip(r['def'], 140))) for r in rel)
    aside += '<div><h2>More in %s</h2><div class="cat">%s</div></div>' % (E(t['catLabel']), ''.join(
        ('<span aria-current="page">%s</span>' % E(p['name'])) if p is t else '<a href="%s">%s</a>' % (p['slug'], E(p['name'])) for p in peers))

    term_ld = {'@type': 'DefinedTerm', 'name': t['name'], 'description': t['def'], 'url': url, 'termCode': t['slug'],
               'inDefinedTermSet': {'@type': 'DefinedTermSet', 'name': d['title'], 'url': '%s/%s/' % (HOST, folder)}}
    crumbs = {'@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'Follow or Bounce', 'item': HOST + '/'},
        {'@type': 'ListItem', 'position': 2, 'name': d['title'], 'item': '%s/%s/' % (HOST, folder)},
        {'@type': 'ListItem', 'position': 3, 'name': t['name'], 'item': url}]}
    care = ('<p>This dictionary describes common human experiences in plain language. It is not medical or psychological advice; '
            'if a feeling is overwhelming or lasts, talking to someone you trust or a professional can help.</p>') if t['dict'] == 'inner' else ''
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{E(title)}</title>
<meta name="description" content="{E(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="{E(d['title'])}">
<meta property="og:title" content="{E(t['name'])} · {E(d['title'])}">
<meta property="og:description" content="{E(desc)}">
<meta property="og:url" content="{url}">
{ld([term_ld, crumbs])}<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?{th['fonts']}&display=swap" rel="stylesheet">
<script src="/assets/theme-toggle.js"></script>
<style>
{th['css']}
{PAGE_CSS}
</style>
<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{{"token": "bba4e16a7d9b4d9985eda0cda2624e60"}}'></script>
</head>
<body>
<header>
  <div class="wrap">
    <a class="brand" href="/">KNOWLEDGE NETWORK</a>
    <span class="pair">{th['pair'][0]} <a href="/{other['folder']}/">{E(other['title'])} →</a></span>
    <a class="back" href="/{folder}/#{E(t['id'])}">← All {len(order)} terms</a>
  </div>
</header>
<main class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Follow or Bounce</a> / <a href="/{folder}/">{E(d['title'])}</a> / {E(t['name'])}</nav>
  <div class="head">
    <div>
      <div class="eyebrow"><a href="/{folder}/#{E(t['id'])}">{E(t['catLabel'])}</a>{('<span class="badge">' + E(t['badge']) + '</span>') if t['badge'] else ''}</div>
      <h1>{E(t['name'])}</h1>
      <p class="def">{E(t['def'])}</p>
      {('<div class="dims">' + ''.join('<span>' + E(dm) + '</span>' for dm in t['dims']) + '</div>') if t['dims'] else ''}
    </div>
    <figure class="art" style="margin:0" aria-hidden="true">{t['svg']}</figure>
  </div>
  <div class="body">
    <div>{blocks}</div>
    <div class="aside">{aside}</div>
  </div>
  <nav class="pn" aria-label="Previous and next term"><a href="{prev['slug']}">← {E(prev['name'])}</a><a href="{nxt['slug']}">{E(nxt['name'])} →</a></nav>
</main>
<footer>
  <div class="wrap">{care}<p>From the <a href="/{folder}/">{E(d['title'])}</a>, part of <a href="/">Follow or Bounce</a>. Drawings and text are original.</p></div>
</footer>
</body>
</html>
'''


def link_cards(data):
    """In each dictionary, the card's name links to its page (idempotent)."""
    for key, d in data['dictionaries'].items():
        p = os.path.join(REPO, d['folder'], 'index.html')
        h = open(p, encoding='utf-8').read()
        slugs = {t['id']: t['slug'] for t in data['terms'] if t['dict'] == key}

        def card(m):
            cid, body = m.group(1), m.group(0)
            body = re.sub(r'<h3><a class="term-page" href="[^"]*">(.*?)</a></h3>', r'<h3>\1</h3>', body)
            return body.replace('<h3>', '<h3><a class="term-page" href="/%s/%s">' % (d['folder'], slugs[cid]), 1).replace('</h3>', '</a></h3>', 1)
        h = re.sub(r'<article class="card" id="([^"]+)"[\s\S]*?</article>', card, h)
        if '.term-page' not in h:
            h = h.replace('</style>', 'h3 a.term-page{color:inherit;text-decoration:none}\nh3 a.term-page:hover{text-decoration:underline;text-underline-offset:3px}\n</style>', 1)
        open(p, 'w', encoding='utf-8').write(h)


def main():
    data = json.load(open(os.path.join(HERE, 'terms.json'), encoding='utf-8'))
    extra = {}
    for key in ('design', 'inner'):
        f = os.path.join(HERE, 'extra-%s.json' % key)
        extra[key] = json.load(open(f, encoding='utf-8')) if os.path.exists(f) else {}
    by_id = {(t['dict'], t['id']): t for t in data['terms']}
    urls = []
    for key, d in data['dictionaries'].items():
        order = [t for t in data['terms'] if t['dict'] == key]
        for t in order:
            out = os.path.join(REPO, d['folder'], t['slug'] + '.html')
            open(out, 'w', encoding='utf-8').write(page(t, data, extra[key], by_id, order))
            urls.append('%s/%s/%s' % (HOST, d['folder'], t['slug']))
        missing = [t['id'] for t in order if t['id'] not in extra[key]]
        print('%s: %d pages, %d without written extra%s' % (d['folder'], len(order), len(missing), (': ' + ', '.join(missing[:6])) if missing else ''))
    with open(os.path.join(REPO, 'sitemap-terms.xml'), 'w', encoding='utf-8') as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
                ''.join('  <url><loc>%s</loc></url>\n' % u for u in urls) + '</urlset>\n')
    link_cards(data)
    print('sitemap-terms.xml: %d URLs; dictionary cards linked' % len(urls))


if __name__ == '__main__':
    main()
