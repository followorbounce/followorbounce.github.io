#!/usr/bin/env python3
"""Atom feeds for the daily content and for new pages across the network.

  python3 engine/feeds.py [--date YYYY-MM-DD] [--offline]

Writes feeds/<stream>.xml (+ feeds/index.html) in this repo:
  design-term   Dictionary of Design term of the day        (engine/term-of-day.js, DD, seed 7)
  emotion       Dictionary of Inner Experience, of the day   (engine/term-of-day.js, IE, seed 0)
  element       The Logic of a Prompt element of the day     (assets/prompt-elements.json)
  knot          Knot Atlas knot of the day                   (knots/feed/*.json)
  signal        Reckoning code flag of the day               (reckoning/assets/signal-of-day.json)
  new-pages     the newest pages of every site: each project sitemap's URLs, dated by the first commit of the page
The picks are the homepage cards' own date-seeded hashes, ported exactly (checked against the JS for 4,000 dates
on 2026-10-28; re-check if a card's dayIndex/dayHash changes), evaluated on the calendar date in Pacific time; each daily feed holds the last DAYS days,
so nothing appears before its day. .github/workflows/feeds.yml runs this every day and commits the files if changed.
Sibling repos are read from the folder next to this repo when present (local runs; the workflow clones them),
otherwise from the live site.
"""
import datetime, html, json, os, re, subprocess, sys, urllib.request
from zoneinfo import ZoneInfo
from ga import apply as ga_apply   # the Google Analytics tag (engine/ga.py)

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
ROOT = os.path.dirname(REPO)
HOST = 'https://followorbounce.github.io'
TZ = ZoneInfo('America/Los_Angeles')
DAYS = 30
NEW_PAGES = 60
PROJECTS = ['aerospace', 'knots', 'machinery', 'Maya-Calendar', 'reckoning', 'series']
OFFLINE = '--offline' in sys.argv
E = lambda s: html.escape(str(s), quote=True)


# ------------------------------------------------------------------ the homepage cards' picks

def _u32(x):
    return int(x) % 2 ** 32


def _i32(x):
    x = _u32(x)
    return x - 2 ** 32 if x >= 2 ** 31 else x


def day_hash(d, seed):
    """term-of-day.js dayHash: the products are JS doubles (not exact integers), so they are computed as floats."""
    key = d.year * 10000 + d.month * 100 + d.day + seed
    for _ in range(2):
        key = float((_u32(key) >> 16) ^ _i32(key)) * 0x45d9f3b
    return (_u32(key) >> 16) ^ _i32(key)


def term_index(d, seed, n):
    return abs(day_hash(d, seed)) % n


def fnv_index(d, tag, n):
    """element/knot/signal-of-day.js dayIndex: FNV-1a over 'Y-M-D:tag' (month and day not zero-padded)."""
    h = 2166136261
    for ch in '%d-%d-%d:%s' % (d.year, d.month, d.day, tag):
        h = ((h ^ ord(ch)) * 16777619) % 2 ** 32
    return h % n


# ------------------------------------------------------------------ data

def local(*parts):
    p = os.path.join(ROOT, *parts)
    return p if os.path.exists(p) else None


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'followorbounce feeds'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode('utf-8')


def read(parts, url):
    p = local(*parts)
    if p:
        return open(p, encoding='utf-8').read()
    if OFFLINE:
        raise SystemExit('missing %s (offline)' % '/'.join(parts))
    return fetch(url)


def terms():
    js = open(os.path.join(HERE, 'term-of-day.js'), encoding='utf-8').read()
    return [json.loads(re.search(r'var %s = (\[.*?\]);\n' % v, js, re.S).group(1)) for v in ('DD', 'IE')]


# ------------------------------------------------------------------ atom

def atom(slug, title, sub, page, entries, updated):
    out = ['<?xml version="1.0" encoding="utf-8"?>',
           '<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en">',
           '<title>%s</title>' % E(title), '<subtitle>%s</subtitle>' % E(sub),
           '<id>%s/feeds/%s.xml</id>' % (HOST, slug),
           '<link rel="self" type="application/atom+xml" href="%s/feeds/%s.xml"/>' % (HOST, slug),
           '<link rel="alternate" type="text/html" href="%s"/>' % E(page),
           '<updated>%s</updated>' % updated,
           '<author><name>Follow or Bounce</name><uri>%s/</uri></author>' % HOST,
           '<icon>%s/assets/favicon.svg</icon>' % HOST]
    for e in entries:
        out += ['<entry>', '<title>%s</title>' % E(e['title']), '<id>%s</id>' % E(e['id']),
                '<link rel="alternate" type="text/html" href="%s"/>' % E(e['url']),
                '<published>%s</published>' % e['date'], '<updated>%s</updated>' % e['date'],
                '<summary>%s</summary>' % E(e['summary'])]
        if e.get('html'):
            out.append('<content type="html">%s</content>' % E(e['html']))
        out.append('</entry>')
    out.append('</feed>')
    return '\n'.join(out) + '\n'


def stamp(d):
    """Midnight of a calendar day in Pacific time, RFC 3339."""
    return datetime.datetime(d.year, d.month, d.day, tzinfo=TZ).isoformat()


def para(*texts):
    return ''.join('<p>%s</p>' % E(t) for t in texts if t)


# ------------------------------------------------------------------ streams

def daily(today):
    dd, ie = terms()
    el = json.load(open(os.path.join(REPO, 'assets', 'prompt-elements.json'), encoding='utf-8'))
    knots = json.loads(read(['knots', 'feed', 'index.json'], HOST + '/knots/feed/index.json'))['knots']
    flags = json.loads(read(['reckoning', 'assets', 'signal-of-day.json'], HOST + '/reckoning/assets/signal-of-day.json'))['flags']
    briefs = {}

    def knot_brief(slug):
        if slug not in briefs:
            briefs[slug] = json.loads(read(['knots', 'feed', slug + '.json'], '%s/knots/feed/%s.json' % (HOST, slug)))
        return briefs[slug]

    days = [today - datetime.timedelta(days=i) for i in range(DAYS)]
    streams = {
        'design-term': ('Design term of the day · Follow or Bounce', 'One term a day from the Dictionary of Design.',
                        HOST + '/dictionary-of-design/', []),
        'emotion': ('Emotion of the day · Follow or Bounce', 'One emotion a day from the Dictionary of Inner Experience.',
                    HOST + '/dictionary-of-inner-experience/', []),
        'element': ('Prompt element of the day · Follow or Bounce', 'One of the 21 parts of a prompt a day, from The Logic of a Prompt & Life.',
                    HOST + el['page'], []),
        'knot': ('Knot of the day · Knot Atlas', 'One knot a day from the Knot Atlas, with its steps.', HOST + '/knots/', []),
        'signal': ('Signal of the day · Reckoning', 'One International Code flag a day, with its meaning and Morse.',
                   HOST + '/reckoning/signal/flags/', []),
    }
    for d in days:
        iso, at = d.isoformat(), stamp(d)
        for key, arr, seed, base in (('design-term', dd, 7, '/dictionary-of-design/'), ('emotion', ie, 0, '/dictionary-of-inner-experience/')):
            t = arr[term_index(d, seed, len(arr))]
            streams[key][3].append({'title': t[1], 'summary': t[2], 'url': HOST + base + re.sub(r'[^a-z0-9]+', '-', t[0].replace('&', 'and').lower()).strip('-'), 'date': at,
                                    'id': 'tag:followorbounce.github.io,%s:%s' % (iso, key)})
        p = el['parts'][fnv_index(d, 'element', len(el['parts']))]
        streams['element'][3].append({'title': '%s (%s)' % (p['name'], p['sym']), 'summary': p['line'], 'date': at,
                                      'url': HOST + el['page'] + '#' + p['id'], 'id': 'tag:followorbounce.github.io,%s:element' % iso,
                                      'html': para(p['line'], p.get('logic'), p.get('pitfall') and 'Watch out: ' + p['pitfall'])})
        k = knot_brief(knots[fnv_index(d, 'knots', len(knots))]['slug'])
        steps = ''.join('<li>%s</li>' % E(s.get('t', '') if isinstance(s, dict) else s) for s in k.get('steps', []))
        streams['knot'][3].append({'title': k['name'], 'summary': k['brief'], 'date': at,
                                   'url': '%s/knots/knots/%s/' % (HOST, k['slug']), 'id': 'tag:followorbounce.github.io,%s:knot' % iso,
                                   'html': para(k['brief']) + ('<ol>%s</ol>' % steps if steps else '')})
        f = flags[fnv_index(d, 'signal', len(flags))]
        streams['signal'][3].append({'title': '%s · %s' % (f['L'], f['word']), 'summary': f['meaning'], 'url': f['url'], 'date': at,
                                     'id': 'tag:followorbounce.github.io,%s:signal' % iso,
                                     'html': para(f['meaning'], f.get('note'), 'Morse: ' + f['morse'])})
    return {k: atom(k, t, s, p, e, stamp(today)) for k, (t, s, p, e) in streams.items()}


def first_dates(repo):
    """{path: first commit date} for every file of a repo, from one pass over the git log."""
    try:
        log = subprocess.run(['git', 'log', '--format=@%cI', '--name-only', '--diff-filter=A'], cwd=repo,
                             capture_output=True, text=True, check=True).stdout
    except (OSError, subprocess.CalledProcessError):
        return {}
    out, day = {}, None
    for line in log.splitlines():                       # newest first, so the last one seen is the first add
        if line.startswith('@'):
            day = line[1:]
        elif line:
            out[line] = day
    return out


def page_file(repo, rel):
    """URL path inside a site -> its .html file, the way GitHub Pages serves it."""
    for c in ([rel + 'index.html'] if rel.endswith('/') or not rel else [rel, rel + '.html', rel + '/index.html']):
        if os.path.isfile(os.path.join(repo, c)):
            return c
    return None


def head_meta(h, pat):
    m = re.search(pat, h, re.S)
    return html.unescape(m.group(1)).strip() if m else ''


def new_pages(now):
    found = []
    for site in PROJECTS + ['followorbounce.github.io']:
        repo = local(site)
        if not repo:
            continue
        smap = os.path.join(repo, 'sitemap-home.xml' if site == 'followorbounce.github.io' else 'sitemap.xml')
        if not os.path.exists(smap):
            continue
        base = HOST + '/' if site == 'followorbounce.github.io' else '%s/%s/' % (HOST, site)
        dates = first_dates(repo)
        for loc in re.findall(r'<loc>([^<]+)</loc>', open(smap, encoding='utf-8').read()):
            if not loc.startswith(base) or loc.startswith(HOST + '/aerospace/ru/'):   # editions of existing guides, not new pages
                continue
            f = page_file(repo, loc[len(base):])
            if not f or f not in dates:
                continue
            h = open(os.path.join(repo, f), encoding='utf-8', errors='replace').read()
            title = head_meta(h, r'<meta property="og:title" content="([^"]*)"') or head_meta(h, r'<title>(.*?)</title>')
            title = re.split(r'\s+/\s+', title)[0]          # bilingual aerospace titles: the English half
            found.append({'title': title, 'summary': head_meta(h, r'<meta name="description" content="([^"]*)"'),
                          'url': loc, 'date': dates[f], 'id': loc, 'site': site})
    found.sort(key=lambda e: (e['date'], e['url']), reverse=True)
    top = found[:NEW_PAGES]
    upd = top[0]['date'] if top else now.isoformat()
    return atom('new-pages', 'New pages · Follow or Bounce', 'The newest guides and pages across the Follow or Bounce sites.',
                HOST + '/', top, upd), len(found)


INDEX = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Feeds · Follow or Bounce</title>
<meta name="description" content="Atom feeds for the daily cards and the newest pages of Follow or Bounce.">
<link rel="canonical" href="https://followorbounce.github.io/feeds/">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:title" content="Feeds · Follow or Bounce">
<meta property="og:description" content="Atom feeds for the daily cards and the newest pages of Follow or Bounce.">
<meta property="og:url" content="https://followorbounce.github.io/feeds/">
<meta property="og:image" content="https://followorbounce.github.io/og/feeds.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Feeds — Follow or Bounce">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://followorbounce.github.io/og/feeds.jpg">
%s<style>
:root{--paper:#f6f5f1;--ink:#1d1d1f;--muted:#5d5c58;--line:#d9d7d0;--acc:#b5532f}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--paper:#111113;--ink:#e8e8e4;--muted:#a9a8a2;--line:#333336;--acc:#d4714e}}
:root[data-theme="dark"]{--paper:#111113;--ink:#e8e8e4;--muted:#a9a8a2;--line:#333336;--acc:#d4714e}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 'IBM Plex Sans',system-ui,sans-serif}
main{max-width:720px;margin:0 auto;padding:max(32px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) 48px max(16px,env(safe-area-inset-left))}
h1{font:600 2rem/1.15 'IBM Plex Sans Condensed',system-ui,sans-serif;margin:0 0 8px}
p{color:var(--muted)} a{color:var(--acc)}
ul{list-style:none;padding:0;margin:24px 0;border-top:1px solid var(--line)}
li{border-bottom:1px solid var(--line);padding:14px 0;display:flex;flex-wrap:wrap;gap:4px 16px;align-items:baseline}
li b{flex:1 1 220px} li a{display:inline-block;min-height:44px;line-height:44px}
code{font:13px 'IBM Plex Mono',monospace;color:var(--muted);word-break:break-all;flex-basis:100%%}
</style>
<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "bba4e16a7d9b4d9985eda0cda2624e60"}'></script>
</head>
<body>
<main>
<p><a href="/">Follow or Bounce</a></p>
<h1>Feeds</h1>
<p>Follow the daily cards from the homepage, or the newest pages across every site, in any feed reader. Paste a feed address into the reader; the daily feeds hold the last %d days.</p>
<ul>
%s
</ul>
</main>
</body>
</html>
'''

FEEDS = [('design-term', 'Design term of the day'), ('emotion', 'Emotion of the day'), ('element', 'Prompt element of the day'),
         ('knot', 'Knot of the day'), ('signal', 'Signal of the day'), ('new-pages', 'New pages')]
HERALD = 'https://herald-console.followorbounce.workers.dev/feed.xml'   # Herald's own RSS: everything it posts, one feed


def head_links():
    """<link rel="alternate"> tags for every feed (build_network.py puts them in the homepage head)."""
    return ''.join('<link rel="alternate" type="application/atom+xml" title="%s" href="/feeds/%s.xml">\n' % (E(t), s) for s, t in FEEDS) + \
        '<link rel="alternate" type="application/rss+xml" title="Everything posted daily" href="%s">\n' % HERALD


def main():
    args = sys.argv[1:]
    today = datetime.date.fromisoformat(args[args.index('--date') + 1]) if '--date' in args else datetime.datetime.now(TZ).date()
    out = daily(today)
    out['new-pages'], n = new_pages(datetime.datetime.now(TZ))
    d = os.path.join(REPO, 'feeds')
    os.makedirs(d, exist_ok=True)
    for slug, xml in out.items():
        with open(os.path.join(d, slug + '.xml'), 'w', encoding='utf-8') as f:
            f.write(xml)
    items = '\n'.join('<li><b>%s</b><a href="/feeds/%s.xml">Atom feed</a><code>%s/feeds/%s.xml</code></li>' % (E(t), s, HOST, s) for s, t in FEEDS)
    items += ('\n<li><b>Everything posted daily, in one feed</b><a href="%s">RSS feed</a><code>%s</code></li>' % (HERALD, HERALD))
    with open(os.path.join(d, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(ga_apply(INDEX % (head_links(), DAYS, items)))
    print('feeds for %s: %s; new-pages from %d dated pages' % (today, ', '.join(sorted(out)), n))


if __name__ == '__main__':
    main()
