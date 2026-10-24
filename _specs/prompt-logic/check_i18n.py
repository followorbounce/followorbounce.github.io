"""Check translations content.<lang>.json against the English content.json.

    python3 check_i18n.py            all translations present
    python3 check_i18n.py ja         one language

Same structure as English; fields that are data, not text (ids, numbers, answers, Grice tags, URLs, source
titles and authors) unchanged; every text non-empty and plain (no HTML, no markdown); {placeholders} in the
page strings kept; each part's strong example marks the words it adds with ⟦…⟧, and removing them gives the
weak example back (ignoring spaces and punctuation); CJK hero titles split their accent with '|'.
"""
import json, os, re, sys, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
LANGS = ['es', 'ru', 'zh', 'ja']
CJK = {'zh', 'ja'}
FIXED = {'id', 'n', 'domain', 'answer', 'options', 'maxim', 'verify', 'url', 'year', 'parts'}   # data, not text
FIXED_SOURCE = {'title', 'author'}                                                                  # citations stay as published

def norm(s):
    s = s.replace('⟦', '').replace('⟧', '')
    return ''.join(ch.lower() for ch in s if not (ch.isspace() or unicodedata.category(ch)[0] in 'PS'))

def check(lang):
    errors, warns = [], []
    en = json.load(open(os.path.join(HERE, 'content.json'), encoding='utf-8'))
    path = os.path.join(HERE, 'content.%s.json' % lang)
    try:
        tr = json.load(open(path, encoding='utf-8'))
    except (OSError, json.JSONDecodeError) as x:
        return ['cannot load %s: %s' % (path, x)], []

    def walk(a, b, where, in_sources=False):
        if isinstance(a, dict):
            if not isinstance(b, dict):
                errors.append('%s: expected an object' % where); return
            if set(a) != set(b):
                errors.append('%s: keys differ (missing %s, extra %s)' % (where, sorted(set(a) - set(b)), sorted(set(b) - set(a))))
            for k in a:
                if k not in b:
                    continue
                w = '%s.%s' % (where, k)
                ids_list = k == 'parts' and isinstance(a[k], list) and all(isinstance(x, str) for x in a[k])   # domains[].parts, not the root list of part cards
                if (k in FIXED and (k != 'parts' or ids_list)) or (in_sources and k in FIXED_SOURCE):
                    if a[k] != b[k]:
                        errors.append('%s: must stay as in English (%r)' % (w, a[k]))
                    continue
                walk(a[k], b[k], w, in_sources or k == 'sources')
        elif isinstance(a, list):
            if not isinstance(b, list) or len(a) != len(b):
                errors.append('%s: list length differs' % where); return
            for i, (x, y) in enumerate(zip(a, b)):
                walk(x, y, '%s[%d]' % (where, i), in_sources)
        elif isinstance(a, str):
            if not isinstance(b, str):
                errors.append('%s: expected text' % where); return
            if a.strip() and not b.strip():
                errors.append('%s: empty' % where)
            if re.search(r'<[a-zA-Z/]|\*\*|`', b):
                errors.append('%s: HTML or markdown characters' % where)
            ph_a, ph_b = set(re.findall(r'\{\w+\}', a)), set(re.findall(r'\{\w+\}', b))
            if ph_a != ph_b:
                errors.append('%s: placeholders %s, expected %s' % (where, sorted(ph_b), sorted(ph_a)))
            if b.strip() == a.strip() and len(a) > 12 and not where.startswith('root.sources') and 'back' not in where:
                warns.append('%s: identical to English' % where)
        else:
            if a != b:
                errors.append('%s: must stay %r' % (where, a))

    walk(en, tr, 'root')

    # strong examples: added words marked, the rest is the weak example
    for i, p in enumerate(tr.get('parts', [])):
        w = 'parts[%d] (%s)' % (i, p.get('id'))
        s, k = p.get('strong', ''), p.get('weak', '')
        if s.count('⟦') == 0 or s.count('⟦') != s.count('⟧'):
            errors.append('%s.strong: mark the added words with ⟦…⟧ (balanced)' % w); continue
        kept = re.sub(r'⟦.*?⟧', '', s)
        if norm(kept) != norm(k):
            errors.append('%s.strong: without the ⟦…⟧ parts it must read as the weak example\n      weak:  %s\n      kept:  %s' % (w, k, kept))
    ui = tr.get('ui', {})
    if ui.get('joiner') != ('' if lang in CJK else ' '):
        errors.append('ui.joiner must be %r for %s' % ('' if lang in CJK else ' ', lang))
    if not ui.get('translation_note', '').strip():
        errors.append('ui.translation_note: say in this language that the page was translated with AI help and not yet checked by a native speaker')
    t = tr.get('hero', {}).get('title', '')
    if lang in CJK and '|' not in t:
        errors.append("hero.title: put '|' before the accented last part (CJK titles have no spaces to split on)")
    if '⟦' in json.dumps({k: v for k, v in tr.items() if k != 'parts'}, ensure_ascii=False):
        errors.append('⟦…⟧ markers belong only in parts[].strong')
    for task in tr.get('builder', {}).get('tasks', []):
        for pid, frag in task.get('fragments', {}).items():
            if lang not in CJK and frag and not frag[0].isupper():
                warns.append('builder %s.%s: fragment should start a sentence' % (task.get('id'), pid))
    return errors, warns

def main():
    langs = sys.argv[1:] or [l for l in LANGS if os.path.exists(os.path.join(HERE, 'content.%s.json' % l))]
    bad = 0
    for lang in langs:
        errors, warns = check(lang)
        for x in warns:
            print('[%s] WARN %s' % (lang, x))
        for x in errors:
            print('[%s] FAIL %s' % (lang, x))
        print('[%s] %s' % (lang, 'PASS' if not errors else '%d error(s)' % len(errors)))
        bad += bool(errors)
    return 1 if bad else 0

if __name__ == '__main__':
    sys.exit(main())
