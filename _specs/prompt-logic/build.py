"""Build "The Logic of a Prompt & Life" in every language that has a content file.

    python3 _specs/prompt-logic/check.py                  English data (shape, word limits, owner's names)
    python3 _specs/prompt-logic/check_i18n.py             each translation against the English (same ids, markers, placeholders)
    python3 _specs/prompt-logic/build.py                  writes /logic-of-a-prompt.html and /logic-of-a-prompt-<lang>.html

content.json is English; content.<lang>.json is the same structure translated. Reading sections are rendered
here as static HTML (readable without JS, visible to search engines); the builder, game and valid/sound demo
get a trimmed copy of the data as inline JSON. The build refuses sources still marked "verify".
"""
import html, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'engine'))
from ga import apply as ga_apply   # the Google Analytics tag (engine/ga.py)
SITE = 'https://followorbounce.github.io/'

LATIN_FONTS = ('https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900'
               '&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap')
RU_FONTS = 'https://fonts.googleapis.com/css2?family=Onest:wght@400..900&family=IBM+Plex+Mono:wght@400;500;600&display=swap'
def cjk_fonts(fam):
    return 'https://fonts.googleapis.com/css2?family=%s:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap' % fam.replace(' ', '+')
RU_CSS = """:root{--font-display:'Onest','Arial',sans-serif; --font-body:'Onest','Segoe UI',system-ui,sans-serif}
.hero .display{font-size:clamp(46px, 10.5vw, 168px)} h2.section{font-size:clamp(38px, 7vw, 104px)} .dname{font-size:clamp(40px, 8vw, 120px)}
.truth{font-size:clamp(36px, 7vw, 96px)} .syl-side .big{font-size:clamp(24px, 3.4vw, 42px)} .display, h2.section, .dname, .truth{letter-spacing:-.015em}"""
def cjk_css(fam):
    return (""":root{--font-display:'%(f)s',sans-serif; --font-body:'%(f)s',system-ui,sans-serif; --font-mono:'IBM Plex Mono','%(f)s',monospace}
.display, h2.section, .dname, .truth, .syl-side .big, .basic .term, .stamp, .tile .sym, .part .top .sym, .dnum{letter-spacing:0}
.hero .display{font-size:clamp(44px, 9vw, 140px); line-height:1.12} h2.section{font-size:clamp(34px, 6vw, 88px); line-height:1.15}
.dname{font-size:clamp(40px, 7.5vw, 112px); line-height:1.1} .truth{font-size:clamp(34px, 6.4vw, 92px); line-height:1.12}
.syl-side .big{line-height:1.2} .basic .term{line-height:1.2} .dmeta .q{font-style:normal}
body{line-height:1.7} .lede{line-height:1.6} h1, h2, h3, p{word-break:auto-phrase; line-break:strict}""" % {'f': fam})

# code, file slug, html lang / hreflang, og:locale, switcher label, fonts, extra css, width-axis motion
LANGS = [
    ('en', 'logic-of-a-prompt', 'en', 'en_US', 'EN', LATIN_FONTS, '', True),
    ('es', 'logic-of-a-prompt-es', 'es-419', 'es_LA', 'ES', LATIN_FONTS, '', True),
    ('ru', 'logic-of-a-prompt-ru', 'ru', 'ru_RU', 'RU', RU_FONTS, RU_CSS, False),
    ('zh', 'logic-of-a-prompt-zh', 'zh-Hans', 'zh_CN', '中文', cjk_fonts('Noto Sans SC'), cjk_css('Noto Sans SC'), False),
    ('ja', 'logic-of-a-prompt-ja', 'ja', 'ja_JP', '日本語', cjk_fonts('Noto Sans JP'), cjk_css('Noto Sans JP'), False),
]
# two-letter element symbols (Latin in every language, like the chemical table)
SYMBOLS = {'act-as': 'Ac', 'audience': 'Au', 'tone': 'To', 'language': 'La', 'context': 'Cx', 'examples': 'Ex',
           'keywords': 'Kw', 'terminology': 'Tm', 'scope': 'Sc', 'limitations': 'Li', 'deadline': 'Dl', 'format': 'Fm',
           'objective': 'Ob', 'call-to-action': 'Ca', 'citations': 'Ci', 'statistics': 'St', 'quotes': 'Qu',
           'points-of-view': 'Pv', 'counterarguments': 'Co', 'analogies': 'An', 'questions': 'Qs'}
CORE = ['objective', 'context', 'audience', 'format', 'scope']   # the builder's "essential five" preset
COLOURED = ('frame', 'premises', 'bounds', 'goal', 'evidence', 'testing', 'dialogue')

def e(s):
    return html.escape(str(s), quote=True)

def fmt(s, **kw):
    return re.sub(r'\{(\w+)\}', lambda m: str(kw.get(m.group(1), m.group(0))), s)

def diff_marks(weak, strong):
    """English: the words strong adds to weak, wrapped in <mark> (check.py guarantees strong keeps weak's words in order)."""
    norm = lambda w: re.sub(r'[^\w]', '', w.lower())
    wk = [norm(w) for w in weak.split() if norm(w)]
    out, run, j = [], [], 0
    for w in strong.split():
        if j < len(wk) and norm(w) == wk[j]:
            if run: out.append('<mark>' + e(' '.join(run)) + '</mark>'); run = []
            out.append(e(w)); j += 1
        else:
            run.append(w)
    if run: out.append('<mark>' + e(' '.join(run)) + '</mark>')
    return ' '.join(out)

def strong_segments(weak, strong):
    """[[text, added], ...] for the homepage widget, which inserts no HTML."""
    norm = lambda w: re.sub(r'[^\w]', '', w.lower())
    wk = [norm(w) for w in weak.split() if norm(w)]
    segs, j = [], 0
    for w in strong.split():
        added = not (j < len(wk) and norm(w) == wk[j])
        if not added: j += 1
        if segs and segs[-1][1] == added: segs[-1][0] += ' ' + w
        else: segs.append([w, added])
    return segs

def write_widget_data(C):
    """assets/prompt-elements.json: the English elements for the homepage "Element of the day" card (engine/element-of-day.*)."""
    D = {d['id']: d for d in C['domains']}
    parts = []
    for p in sorted(C['parts'], key=lambda p: p['n']):
        d = D[p['domain']]
        parts.append({'id': p['id'], 'n': p['n'], 'sym': SYMBOLS[p['id']], 'name': p['name'], 'domain': p['domain'],
                      'family': d['name'], 'familyLogic': d['logic'], 'line': p['line'], 'logic': p['logic'], 'pitfall': p['pitfall'], 'weak': p['weak'],
                      'strong': strong_segments(p['weak'], p['strong']), 'guess': p['guess'], 'maxim': p.get('maxim')})
    out = os.path.join(ROOT, 'assets', 'prompt-elements.json')
    json.dump({'page': '/logic-of-a-prompt', 'title': C['ui']['doc_title'].split(' — ')[0], 'parts': parts},
              open(out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('wrote', os.path.relpath(out, ROOT))

def strong_html(weak, strong):
    """Translations mark the added words with ⟦…⟧ (word diffs cannot work without spaces)."""
    if '⟦' in strong:
        return re.sub(r'⟦(.*?)⟧', lambda m: '<mark>' + m.group(1) + '</mark>', e(strong))
    return diff_marks(weak, strong)

def plain(s):
    return s.replace('⟦', '').replace('⟧', '').replace('|', '')

def title_html(title, cjk):
    """Latin scripts: one span per word. CJK: segments split by '|'. The last segment is the accent."""
    segs = [x for x in (title.split('|') if '|' in title else title.split())]
    sep = '' if cjk else ' '
    return sep.join('<span class="w%s">%s</span>' % (' hot' if i == len(segs) - 1 else '', e(x)) for i, x in enumerate(segs))

def build(lang, slug, hl, locale, C, langs_built):
    U = C['ui']
    cjk = lang in ('zh', 'ja')
    unresolved = [s['title'] for s in C['sources'] if s.get('verify')]
    if unresolved:
        sys.exit('[%s] unresolved sources (verify=true): %s' % (lang, '; '.join(unresolved)))
    parts = sorted(C['parts'], key=lambda p: p['n'])
    P = {p['id']: p for p in parts}
    D = {d['id']: d for d in C['domains']}
    bad = [d['id'] for d in C['domains'] if d['id'] not in COLOURED]
    if bad:
        sys.exit('domain ids without a colour in the page CSS: ' + ', '.join(bad))

    t0 = C['builder']['tasks'][0]
    strip = ['<span class="tok" style="font-weight:600">%s</span>' % e(t0['base'])]
    for d in C['domains']:
        pid = d['parts'][0]
        strip.append('<span class="tok" data-d="%s" style="background:var(--dc);color:var(--dt)" title="%s">%s</span>' % (d['id'], e(P[pid]['name']), e(t0['fragments'][pid])))
    hero_prompt = U['joiner'].join(strip)

    basics = ''.join(
        '<article class="basic rise"><div class="term">%s</div><p>%s</p><p class="ex">%s</p><p class="inp"><b>%s</b> %s</p></article>'
        % (e(b['term']), e(b['plain']), e(b['example']), e(U['in_prompt']), e(b['inPrompts'])) for b in C['basics'])

    table = ''
    for d in C['domains']:
        tiles = ''.join(
            '<a class="tile" role="listitem" href="#%s" data-d="%s" aria-label="%s"><span class="n">%d</span><span class="sym">%s</span><span class="nm">%s</span></a>'
            % (pid, d['id'], e(fmt(U['tile_aria'], name=P[pid]['name'], family=d['name'], n=P[pid]['n'])), P[pid]['n'], SYMBOLS[pid], e(P[pid]['name'])) for pid in d['parts'])
        table += '<div class="pcol" role="list" aria-label="%s"><div class="phead" aria-hidden="true">%s</div>%s</div>' % (e(d['name']), e(d['name']), tiles)
    legend = ''.join('<a class="dchip" data-d="%s" href="#d-%s" style="text-decoration:none">%s · %s</a>' % (d['id'], d['id'], e(d['name']), e(d['logic'])) for d in C['domains'])

    domains = ''
    nd = len(C['domains'])
    for i, d in enumerate(C['domains'], 1):
        cards = ''
        for pid in d['parts']:
            p = P[pid]
            m = p.get('maxim')
            maxim = ('<span class="maxim" title="%s">%s</span>' % (e(fmt(U['maxim_title'], m=U['maxims'][m])), e(U['maxims'][m]))) if m else '<span></span>'
            cards += ('<article class="part rise" id="%s" data-d="%s"><div class="top"><span class="sym" aria-hidden="true">%s</span><div><h3>%s</h3><span class="n">%s</span></div>%s</div>'
                      '<div class="body"><p class="line">%s</p><p class="logic"><b>%s</b>%s</p>'
                      '<div class="flip"><div class="row weak"><span class="tag">%s</span><span class="say">%s</span></div><div class="row strong"><span class="tag">%s</span><span class="say">%s</span></div></div>'
                      '<p class="guess"><span class="ico" aria-hidden="true">?</span><span><b>%s</b> %s</span></p>'
                      '<p class="pit"><b>%s</b> %s</p></div></article>') % (
                pid, d['id'], SYMBOLS[pid], e(p['name']), e(fmt(U['of21'], n='%02d' % p['n'])), maxim, e(p['line']), e(U['the_logic']), e(p['logic']),
                e(U['weak']), e(p['weak']), e(U['strong']), strong_html(p['weak'], p['strong']), e(U['leave_out']), e(p['guess']), e(U['watch_out']), e(p['pitfall']))
        domains += ('<section class="domain" id="d-%s" data-d="%s"><div class="wrap"><div class="dhead"><div class="dnum" aria-hidden="true">%d</div>'
                    '<div><div class="kicker">%s</div><h2 class="dname">%s</h2></div></div>'
                    '<div class="dmeta"><span class="dchip">%s</span><span class="q">%s</span></div><div class="parts">%s</div></div></section>') % (
            d['id'], d['id'], i, e(fmt(U['family'], i=i, n=nd)), e(d['name']), e(d['logic']), e(d['question']), cards)

    limits = ''.join('<article class="limit rise"><h3>%s</h3><p>%s</p></article>' % (e(l['title']), e(l['text'])) for l in C['limits'])
    cheat = ''.join('<label class="check" data-d="%s"><input type="checkbox" id="c-%d"><span>%s<small>%s</small></span></label>' % (
        c['domain'], i, e(c['check']), e(D[c['domain']]['name'])) for i, c in enumerate(C['cheatsheet']))
    def src(s):
        t = '<b>%s</b>' % e(s['title'])
        if s.get('url'):
            t = '<a href="%s" rel="noopener">%s</a>' % (e(s['url']), t)
        meta = ', '.join(x for x in [s.get('author') or '', s.get('year') or ''] if x)
        return '<li>%s%s. %s</li>' % (t, (' · ' + e(meta)) if meta else '', e(s.get('note') or ''))
    sources = ''.join(src(s) for s in C['sources'])

    alternates = '\n'.join('<link rel="alternate" hreflang="%s" href="%s%s">' % (h, SITE, sl) for (_, sl, h, _, _, _, _, _) in langs_built)
    alternates += '\n<link rel="alternate" hreflang="x-default" href="%slogic-of-a-prompt">' % SITE
    lang_links = ''.join('<a href="/%s" hreflang="%s" lang="%s"%s>%s</a>' % (sl, h, h, ' aria-current="true"' if sl == slug else '', e(lb))
                         for (_, sl, h, _, lb, _, _, _) in langs_built)
    tnote = '<p class="tnote">%s</p>' % e(U['translation_note']) if U.get('translation_note') else ''

    parts_data = []
    for p in parts:
        parts_data.append({'id': p['id'], 'n': p['n'], 'name': p['name'], 'domain': p['domain'], 'guess': p['guess']})
    data = {'parts': parts_data, 'domains': C['domains'], 'builder': C['builder'], 'quiz': C['quiz'], 'syllogism': C['syllogism'],
            'symbols': SYMBOLS, 'core': CORE, 'ui': {k: v for k, v in U.items() if k not in ('doc_title', 'description')},
            'motion': next(m for (c, *_, m) in LANGS if c == lang)}
    blob = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')

    fonts, css = next((f, x) for (c, _, _, _, _, f, x, _) in LANGS if c == lang)
    page = open(os.path.join(HERE, 'page.src.html'), encoding='utf-8').read()
    fills = {
        'TITLE': e(U['doc_title']), 'DESCRIPTION': e(U['description']), 'SLUG': slug, 'HTML_LANG': hl, 'OG_LOCALE': locale,
        'ALTERNATES': alternates, 'FONTS_URL': e(fonts), 'LANG_CSS': css, 'LANG_LINKS': lang_links, 'TNOTE': tnote,
        'HERO_KICKER': e(C['hero']['kicker']), 'HERO_TITLE_HTML': title_html(C['hero']['title'], cjk), 'HERO_LEDE': e(C['hero']['lede']), 'HERO_PROMPT': hero_prompt,
        'BASICS': basics, 'SYL_P1': e(C['syllogism']['premises'][0]), 'SYL_P2': e(C['syllogism']['premises'][1]),
        'SYL_C': e(C['syllogism']['conclusion']), 'SYL_NOTE': e(C['syllogism']['note']),
        'TABLE': table, 'LEGEND': legend, 'DOMAINS': domains, 'LIMITS': limits, 'CHEAT': cheat, 'SOURCES': sources, 'DATA': blob,
    }
    for k, v in fills.items():
        page = page.replace('{{' + k + '}}', v)
    page = re.sub(r'\{\{U:(\w+)\}\}', lambda m: e(U[m.group(1)]), page)
    left = re.findall(r'\{\{[A-Za-z_:]+\}\}', page)
    if left:
        sys.exit('[%s] unfilled placeholders: %s' % (lang, ', '.join(sorted(set(left)))))
    out = os.path.join(ROOT, slug + '.html')
    open(out, 'w', encoding='utf-8').write(ga_apply(page))
    print('wrote', os.path.relpath(out, ROOT), len(page), 'bytes')

def main():
    want = sys.argv[1:]
    langs_built = []
    contents = {}
    for L in LANGS:
        path = os.path.join(HERE, 'content.json' if L[0] == 'en' else 'content.%s.json' % L[0])
        if os.path.exists(path):
            contents[L[0]] = json.load(open(path, encoding='utf-8'))
            langs_built.append(L)
    for (lang, slug, hl, locale, *_rest) in langs_built:
        if want and lang not in want:
            continue
        build(lang, slug, hl, locale, contents[lang], langs_built)
    if 'en' in contents and (not want or 'en' in want):
        write_widget_data(contents['en'])

if __name__ == '__main__':
    main()
