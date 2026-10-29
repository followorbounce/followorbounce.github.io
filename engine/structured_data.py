#!/usr/bin/env python3
"""schema.org structured data (JSON-LD) for the hand-made pages of the network.

  python3 engine/structured_data.py [site ...] [--check]

Sites are sibling repo folders next to this repo (default: all in HANDLERS). Each page's blocks go between
<!-- fob-ld --> and <!-- /fob-ld --> just before </head>, replaced on every run (idempotent). Pages that
already carry JSON-LD of their own outside the markers, redirect stubs and noindex pages are left alone.

  aerospace                  every guide: Article (headline = the English half of the title, og:image,
                             first/last commit dates) + BreadcrumbList; the front page: WebSite.
  followorbounce.github.io   the two dictionaries: DefinedTermSet of every card (h3 + p.def, url #id)
                             + BreadcrumbList.
  country-atlas              the atlas: Dataset (variables from js/data/schema.js, sources as isBasedOn).

Knots and Reckoning write their own JSON-LD from build.py; machinery and marinewoodcraft.com already had it.
Run this after adding or renaming a page, and after aerospace's _tools/assemble.py writes a guide.
--check only reports pages that have no JSON-LD.
"""
import html, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
NET = {'@type': 'Organization', 'name': 'Follow or Bounce', 'url': 'https://followorbounce.github.io/'}
START, END = '<!-- fob-ld -->', '<!-- /fob-ld -->'
U = html.unescape


def meta(h, attr, name):
    m = re.search(r'<meta %s="%s" content="([^"]*)"' % (attr, re.escape(name)), h)
    return U(m.group(1)) if m else ''


def canonical(h):
    m = re.search(r'<link rel="canonical" href="([^"]+)"', h)
    return m.group(1) if m else ''


def title(h):
    m = re.search(r'<title>(.*?)</title>', h, re.S)
    return U(m.group(1)).strip() if m else ''


def crumbs(*trail):
    return {'@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': u} for i, (n, u) in enumerate(trail)]}


def git_dates(repo):
    """{path: (first, last)} commit dates of every .html file in a repo, from one pass over the log."""
    try:
        log = subprocess.run(['git', 'log', '--format=@%cs', '--name-only', '--', '*.html'], cwd=repo,
                             capture_output=True, text=True, check=True).stdout
    except (OSError, subprocess.CalledProcessError):
        return {}
    out, day = {}, None
    for line in log.splitlines():                # newest first
        if line.startswith('@'):
            day = line[1:]
        elif line:
            out[line] = (day, out.get(line, (day, day))[1])
    return out


# ------------------------------------------------------------------ sites

def aerospace(rel, h, dates):
    canon = canonical(h)
    home = 'https://followorbounce.github.io/aerospace/'
    if canon.rstrip('/') == home.rstrip('/'):
        return [{'@type': 'WebSite', 'name': 'Aerospace Knowledge Hub', 'url': home, 'inLanguage': ['en', 'ru'], 'publisher': NET}]
    t = meta(h, 'property', 'og:title') or title(h)
    head = re.split(r'\s+/\s+', t)[0].strip()               # "BOUNCE — MARS PATHFINDER & SOJOURNER / «…»" -> English half
    head = re.sub(r'\s*[—|-]\s*Aerospace Knowledge Hub$', '', head)
    first, last = dates.get(rel, (None, None))
    art = {'@type': 'Article', 'headline': head[:110], 'description': meta(h, 'name', 'description'), 'url': canon,
           'mainEntityOfPage': canon, 'image': meta(h, 'property', 'og:image'), 'author': NET, 'publisher': NET,
           'inLanguage': ['en', 'ru'] if re.search('[а-яА-Я]', h) else 'en',
           'isPartOf': {'@type': 'WebSite', 'name': 'Aerospace Knowledge Hub', 'url': home}}
    if first:
        art.update(datePublished=first, dateModified=last)
    return [art, crumbs(('Aerospace Knowledge Hub', home), (head, canon))]


def hub(rel, h, dates):
    if not rel.startswith('dictionary-of-'):
        return None
    canon = canonical(h)
    name = re.sub(r'\s*—\s*Knowledge Network$', '', title(h))
    terms = []
    for m in re.finditer(r'<article class="card" id="([^"]+)"[^>]*>([\s\S]*?)</article>', h):
        hd = re.search(r'<h3>(.*?)</h3>', m.group(2))
        df = re.search(r'<p class="def">(.*?)</p>', m.group(2), re.S)
        if hd and df:
            terms.append({'@type': 'DefinedTerm', 'name': U(re.sub('<[^>]+>', '', hd.group(1))),
                          'description': U(re.sub('<[^>]+>', '', df.group(1))).strip(), 'url': canon + '#' + m.group(1),
                          'inDefinedTermSet': canon})
    return [{'@type': 'DefinedTermSet', 'name': name, 'description': meta(h, 'name', 'description'), 'url': canon,
             'inLanguage': 'en', 'publisher': NET, 'hasDefinedTerm': terms},
            crumbs(('Follow or Bounce', 'https://followorbounce.github.io/'), (name, canon))]


def country_atlas(rel, h, dates):
    if rel != 'index.html':
        return None
    js = open(os.path.join(ROOT, 'country-atlas', 'js', 'data', 'schema.js')).read()
    fields = []                                  # a field object spans lines: { key, label, unit, … def, src }
    for chunk in re.findall(r'\{ key: "\w+"[^{}]*\}', js):
        get = lambda k: (re.search(r'\b%s: "([^"]*)"' % k, chunk) or [None, ''])[1]
        if get('def'):
            fields.append((get('label'), get('unit'), get('def'), get('src')))
    n = len(re.findall(r'\bid: *"', open(os.path.join(ROOT, 'country-atlas', 'js', 'data', 'countries.js')).read()))
    canon = canonical(h)
    first, last = dates.get(rel, (None, None))
    ds = {'@type': 'Dataset', 'name': 'Country Comparison Atlas',
          'description': meta(h, 'name', 'description') + ' %d countries, territories and regions; %d measured fields across '
                         'geography, people, economy, infrastructure and more, each with its definition and source. '
                         'Figures are approximate, as of the mid-2020s.' % (n, len(fields)),
          'url': canon, 'creator': NET, 'publisher': NET, 'isAccessibleForFree': True, 'spatialCoverage': 'World',
          'keywords': ['country comparison', 'population', 'GDP', 'area', 'borders', 'countries'],
          'variableMeasured': [dict({'@type': 'PropertyValue', 'name': lab, 'description': d}, **({'unitText': u} if u else {}))
                               for lab, u, d, s in fields],
          'isBasedOn': sorted({s for *_, s in fields if s and not s.startswith('Derived')})}
    if first:
        ds['dateModified'] = last
    return [ds]


HANDLERS = {'aerospace': aerospace, 'followorbounce.github.io': hub, 'country-atlas': country_atlas}


def pages(repo):
    for dp, dn, fn in os.walk(repo):
        dn[:] = [d for d in dn if not d.startswith(('.', '_')) and d not in ('node_modules', 'og', 'docs')]
        for f in sorted(fn):
            if f.endswith('.html'):
                p = os.path.join(dp, f)
                yield os.path.relpath(p, repo), p


def run(site, check):
    repo = os.path.join(ROOT, site)
    dates = {} if check else git_dates(repo)
    wrote = skipped = missing = 0
    for rel, p in pages(repo):
        h = open(p, encoding='utf-8').read()
        if not canonical(h) or 'http-equiv="refresh"' in h or re.search(r'name="robots" content="[^"]*noindex', h):
            continue
        own = re.sub(re.escape(START) + r'[\s\S]*?' + re.escape(END) + r'\n?', '', h)
        if 'application/ld+json' in own:
            skipped += 1
            continue
        if check:
            if 'application/ld+json' not in h:
                missing += 1
                print('  no JSON-LD:', site, rel)
            continue
        items = HANDLERS[site](rel, h, dates)
        if not items:
            continue
        block = START + '\n' + ''.join('<script type="application/ld+json">%s</script>\n' % json.dumps(
            dict({'@context': 'https://schema.org'}, **it), ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
            for it in items) + END + '\n'
        new = own.replace('</head>', block + '</head>', 1)
        if new != h:
            with open(p, 'w', encoding='utf-8') as f:
                f.write(new)
        wrote += 1
    print('%s: JSON-LD on %d pages, %d keep their own%s' % (site, wrote, skipped, ', %d without' % missing if check else ''))


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    for s in args or HANDLERS:
        run(s, '--check' in sys.argv)
