#!/usr/bin/env python3
"""
Knowledge Network Engine
=========================
Cross-repo aggregator for the followorbounce.github.io "Knowledge Network."

Reads the content manifests already maintained by each sibling repo —
aerospace/pages.json, Maya-Calendar/pages.json, machinery/data/graph.json —
plus this repo's own engine/own-pages.json, normalizes them into one
schema, writes the combined graph to engine/network-graph.json, and
regenerates this repo's index.html from that graph.

Re-run this script whenever any of the four repos adds a page:
    python3 engine/build_network.py

Scope note: this engine indexes and cross-links existing content. It does
NOT regenerate aerospace's or Maya-Calendar's individual articles — those
stay hand-authored HTML in their own repos. Migrating them onto a shared
per-article template/build pipeline is tracked as future work in
ROADMAP-2.md ("Phase 2 — Knowledge Network Engine, content migration").
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(HERE)          # .../followorbounce.github.io
GIT_ROOT = os.path.dirname(REPO_ROOT)      # .../git (sibling repos live here)

AEROSPACE_PAGES = os.path.join(GIT_ROOT, "aerospace", "pages.json")
MAYA_PAGES = os.path.join(GIT_ROOT, "Maya-Calendar", "pages.json")
MACHINERY_GRAPH = os.path.join(GIT_ROOT, "machinery", "data", "graph.json")
OWN_PAGES = os.path.join(HERE, "own-pages.json")
GRAPH_OUT = os.path.join(HERE, "network-graph.json")
INDEX_OUT = os.path.join(REPO_ROOT, "index.html")


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def build_aerospace_entries():
    data = load_json(AEROSPACE_PAGES)
    base = data["site"]["url"]
    entries = []
    for cat in data["categories"]:
        cat_title = cat["title"]["en"]
        for p in cat["pages"]:
            slug = p["slug"]
            # a slug ending in "/" is a directory index (e.g. "time-philosophy/") —
            # GitHub Pages serves its index.html implicitly, don't append ".html"
            page_url = base + slug if slug.endswith("/") else base + slug + ".html"
            entries.append({
                "repo": "aerospace",
                "repo_label": "Aerospace",
                "category": cat_title,
                "title": p["label"]["en"],
                "description": f"{cat_title} — {p['codename']}",
                "url": page_url,
                "tag": "Read",
                "interactive": True,
            })
    return entries, data["site"]["url"], "Aerospace Knowledge Hub"


def build_maya_entries():
    data = load_json(MAYA_PAGES)
    base = data["site"]["url"]
    entries = []
    for p in data["pages"]:
        if p["slug"] == "index":
            continue  # the hub page itself, not a content page
        entries.append({
            "repo": "maya",
            "repo_label": "Maya Basics",
            "category": "Maya Calendar",
            "title": p["label"],
            "description": p["blurb"],
            "url": base + p["file"],
            "tag": "Read",
            "interactive": True,
        })
    return entries, base, data["site"]["title"]


def build_machinery_entries():
    data = load_json(MACHINERY_GRAPH)
    base = data["site"]["url"]
    cat_labels = {c["id"]: c["label"] for c in data["categories"]}
    domain_labels = {d["id"]: d["label"] for d in data["domains"]}
    entries = []
    for m in data["machines"]:
        entries.append({
            "repo": "machinery",
            "repo_label": "Machinery",
            "category": cat_labels.get(m["category"], m["category"]),
            "title": m["title"],
            "description": m["summary"],
            "url": f"{base}machines/{m['slug']}/",
            "tag": "Machine",
            "interactive": True,
        })
    for c in data["concepts"]:
        entries.append({
            "repo": "machinery",
            "repo_label": "Machinery",
            "category": domain_labels.get(c["domain"], c["domain"]),
            "title": c["title"],
            "description": c["definition"],
            "url": f"{base}concepts/{c['slug']}/",
            "tag": "Concept",
            "interactive": True,
        })
    entries.append({
        "repo": "machinery",
        "repo_label": "Machinery",
        "category": "Quiz",
        "title": "What Kind of Heavy Machine Are You?",
        "description": "A ten-question personality quiz scored against all 20 machines.",
        "url": f"{base}quiz/",
        "tag": "Quiz",
        "interactive": True,
    })
    return entries, base, data["site"]["title"]


def build_own_entries():
    data = load_json(OWN_PAGES)
    base = data["site"]["url"]
    entries = []
    for cat in data["categories"]:
        for p in cat["pages"]:
            url = p["url"]
            full_url = url if url.startswith("http") else base.rstrip("/") + url
            entries.append({
                "repo": "home",
                "repo_label": "Knowledge Network",
                "category": cat["title"],
                "title": p["title"],
                "description": p["description"],
                "url": full_url,
                "tag": p["tag"],
                "interactive": p["interactive"],
            })
    return entries


def main():
    aero_entries, aero_url, aero_title = build_aerospace_entries()
    maya_entries, maya_url, maya_title = build_maya_entries()
    mach_entries, mach_url, mach_title = build_machinery_entries()
    own_entries = build_own_entries()

    hubs = [
        {"repo": "aerospace", "repo_label": "Aerospace", "title": aero_title, "url": aero_url,
         "count": len(aero_entries)},
        {"repo": "maya", "repo_label": "Maya Basics", "title": maya_title, "url": maya_url,
         "count": len(maya_entries)},
        {"repo": "machinery", "repo_label": "Machinery", "title": mach_title, "url": mach_url,
         "count": len(mach_entries)},
    ]

    all_entries = own_entries + aero_entries + maya_entries + mach_entries

    graph = {
        "generated_by": "engine/build_network.py",
        "hubs": hubs,
        "totals": {
            "pages": len(all_entries),
            "repos": 4,
            "own": len(own_entries),
            "aerospace": len(aero_entries),
            "maya": len(maya_entries),
            "machinery": len(mach_entries),
        },
        "entries": all_entries,
    }

    with open(GRAPH_OUT, "w", encoding="utf-8") as f:
        json.dump(graph, f, indent=2, ensure_ascii=False)

    render_index(graph)
    print(f"Wrote {GRAPH_OUT}")
    print(f"Wrote {INDEX_OUT}")
    print(f"Totals: {graph['totals']}")


def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
             .replace('"', "&quot;"))


def render_own_category(cat_title, entries):
    items = "\n".join(
        f'        <li><a href="{esc(e["url"])}"><span class="tag">{esc(e["tag"])}</span>'
        f'<span class="name">{esc(e["title"])}</span></a></li>'
        for e in entries
    )
    return f'''    <div class="cat">
      <h2>{esc(cat_title)}</h2>
      <ul>
{items}
      </ul>
    </div>'''


def render_hub_category(hub, entries, extra_own=None):
    rows = "\n".join(
        f'          <li><a href="{esc(e["url"])}"><span class="tag">{esc(e["tag"])}</span>'
        f'<span class="name">{esc(e["title"])}</span></a>'
        f'<span class="meta">{esc(e["category"])}</span></li>'
        for e in entries
    )
    extra_html = "\n".join(
        f'        <li><a href="{esc(e["url"])}"><span class="tag">{esc(e["tag"])}</span>'
        f'<span class="name">{esc(e["title"])}</span></a></li>'
        for e in (extra_own or [])
    )
    return f'''    <div class="cat cat-hub">
      <h2>{esc(hub["repo_label"])}</h2>
      <ul>
        <li><a href="{esc(hub["url"])}"><span class="tag">Hub</span><span class="name">{esc(hub["title"])}</span></a></li>
{extra_html}
      </ul>
      <details class="browse-all">
        <summary>Browse all {hub["count"]} →</summary>
        <ul class="browse-list">
{rows}
        </ul>
      </details>
    </div>'''


def render_index(graph):
    # "Latest art task" card (see engine/blog-feed.*): CSS/HTML/JS live in their own files so they
    # can be edited without escaping the f-string braces below; they are inlined into the page.
    blog_css = open(os.path.join(HERE, "blog-feed.css"), encoding="utf-8").read()
    blog_html = open(os.path.join(HERE, "blog-feed.html"), encoding="utf-8").read()
    blog_js = open(os.path.join(HERE, "blog-feed.js"), encoding="utf-8").read()
    # own-repo categories whose topic already has a sibling-repo hub card get
    # merged into that hub's card instead of rendered standalone, so e.g.
    # "Machinery" doesn't appear as two adjacent, identically-titled boxes.
    MERGE_INTO_HUB = {"Machinery": "machinery"}

    own_by_cat = {}
    own_order = []
    merged_extra = {}
    for e in graph["entries"]:
        if e["repo"] != "home":
            continue
        if e["category"] in MERGE_INTO_HUB:
            merged_extra.setdefault(MERGE_INTO_HUB[e["category"]], []).append(e)
            continue
        if e["category"] not in own_by_cat:
            own_by_cat[e["category"]] = []
            own_order.append(e["category"])
        own_by_cat[e["category"]].append(e)

    own_categories_html = "\n\n".join(
        render_own_category(cat, own_by_cat[cat]) for cat in own_order
    )

    hub_entries = {"aerospace": [], "maya": [], "machinery": []}
    for e in graph["entries"]:
        if e["repo"] in hub_entries:
            hub_entries[e["repo"]].append(e)

    hub_html = "\n\n".join(
        render_hub_category(hub, hub_entries[hub["repo"]], merged_extra.get(hub["repo"]))
        for hub in graph["hubs"]
    )

    totals = graph["totals"]
    network_json = json.dumps(graph["entries"], ensure_ascii=False)

    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-CE86H6X7Z7"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', 'G-CE86H6X7Z7');
</script>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Knowledge Network</title>
<meta name="description" content="A personal index of {totals['pages']} pages across four repositories — essays, interactive experiments, media servers, art, field guides, and a heavy-machinery and Maya-calendar encyclopedia — centred on space, time, perception, and engineering.">
<link rel="canonical" href="https://followorbounce.github.io/">
<meta name="theme-color" content="#f6f6f2">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:title" content="Knowledge Network">
<meta property="og:description" content="A personal index of {totals['pages']} pages across four repositories, centred on space, time, perception, and engineering.">
<meta property="og:url" content="https://followorbounce.github.io/">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Sans+Condensed:wght@600;700&display=swap" rel="stylesheet">

<style>
:root{{
  --ink:#0b0b0c;
  --paper:#f6f6f2;
  --line:#c9c9c1;
  --mid:#7a7a74;
  --accent:#a6401f;
  --font-display:'IBM Plex Sans Condensed', sans-serif;
  --font-body:'IBM Plex Sans', sans-serif;
  --font-mono:'IBM Plex Mono', monospace;
  --edge: clamp(16px, 4vw, 56px);
  --maxw: 1180px;
}}
*{{box-sizing:border-box;}}
@media (prefers-reduced-motion: reduce){{ *{{transition-duration:.001ms !important;}} }}
body{{
  margin:0; background:var(--paper); color:var(--ink);
  font-family:var(--font-body); font-size:16px; line-height:1.55;
  -webkit-font-smoothing:antialiased;
}}
a{{color:inherit;}}
h1,h2{{margin:0; font-family:var(--font-display); font-weight:700; text-transform:uppercase; letter-spacing:0.01em;}}
p{{margin:0;}}

.wrap{{max-width:var(--maxw); margin:0 auto; padding-left:var(--edge); padding-right:var(--edge);}}

header{{border-bottom:1px solid var(--ink); padding-block:14px;}}
header .brand{{
  font-family:var(--font-mono); font-size:12px; letter-spacing:0.14em;
  border:1px solid var(--ink); padding:6px 10px; display:inline-block;
}}

.hero{{padding-block:clamp(40px,8vw,80px); border-bottom:1px solid var(--ink);}}
.eyebrow{{
  font-family:var(--font-mono); font-size:12px; letter-spacing:0.16em;
  text-transform:uppercase; color:var(--mid);
  display:flex; align-items:center; gap:10px; margin-bottom:18px;
}}
.eyebrow::before{{content:''; width:22px; height:1px; background:var(--ink);}}
.hero h1{{font-size:clamp(2.2rem, 6vw, 4rem); line-height:1.0; margin-bottom:20px;}}
.hero p{{font-size:clamp(1.02rem, 1.4vw, 1.2rem); max-width:640px; color:#28282a;}}
.stats{{
  display:flex; flex-wrap:wrap; gap:28px 40px; margin-top:28px;
  font-family:var(--font-mono);
}}
.stat b{{display:block; font-size:1.7rem; font-family:var(--font-display); font-weight:700;}}
.stat span{{font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:var(--mid);}}

.search-wrap{{border-bottom:1px solid var(--ink); padding-block:20px; background:#efefe9;}}
#network-search{{
  width:100%; font:inherit; font-family:var(--font-mono); font-size:14px;
  padding:14px 16px; border:1px solid var(--ink); background:var(--paper); color:var(--ink);
}}
#network-search::placeholder{{color:var(--mid);}}
#search-results{{margin-top:16px; display:none; gap:2px; flex-direction:column;}}
#search-results.active{{display:flex;}}
#search-results .hit{{
  display:flex; gap:14px; align-items:baseline; padding:10px 12px; text-decoration:none;
  border-bottom:1px solid var(--line); background:var(--paper);
}}
#search-results .hit:hover{{background:#fff;}}
#search-results .hit .repo{{
  font-family:var(--font-mono); font-size:10px; letter-spacing:0.06em; text-transform:uppercase;
  color:#fff; background:var(--accent); padding:2px 6px; flex:0 0 auto;
}}
#search-results .hit .name{{font-size:14.5px; flex:0 0 auto;}}
#search-results .hit .desc{{font-size:12.5px; color:var(--mid); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}}
#search-empty{{display:none; font-family:var(--font-mono); font-size:12.5px; color:var(--mid); margin-top:14px;}}
#search-empty.active{{display:block;}}
[data-hide-when-search].search-active{{display:none;}}

{blog_css}

.cats{{padding-block:clamp(48px,8vw,88px);}}
.cats-grid{{
  display:grid; grid-template-columns:repeat(auto-fill,minmax(270px,1fr));
  gap:44px 52px;
}}
.cat h2{{font-size:1rem; letter-spacing:0.04em; margin-bottom:8px;}}
.cat ul{{list-style:none; margin:10px 0 0; padding:0;}}
.cat li{{border-top:1px solid var(--line);}}
.cat li:last-child{{border-bottom:1px solid var(--line);}}
.cat li > *{{
  display:flex; gap:12px; align-items:baseline;
  padding:10px 0; text-decoration:none;
}}
.cat .tag{{
  font-family:var(--font-mono); font-size:10px; letter-spacing:0.06em;
  color:var(--mid); flex:0 0 auto; min-width:44px;
}}
.cat .name{{font-size:14.5px;}}
.cat a:hover .name{{text-decoration:underline;}}
.cat li.soon .name{{color:var(--mid);}}
.cat li.ext .tag{{color:var(--ink);}}

.cat-hub .browse-all{{margin-top:10px; font-family:var(--font-mono); font-size:12px;}}
.cat-hub .browse-all summary{{cursor:pointer; color:var(--accent); letter-spacing:0.04em; padding-block:6px;}}
.browse-list{{list-style:none; margin:6px 0 0; padding:0; max-height:340px; overflow-y:auto; border:1px solid var(--line);}}
.browse-list li{{border-top:none !important; border-bottom:1px solid var(--line) !important;}}
.browse-list li > a{{padding:8px 10px !important; flex-wrap:wrap;}}
.browse-list .meta{{font-family:var(--font-mono); font-size:10px; color:var(--mid); margin-left:auto;}}

.section-divider{{grid-column:1/-1; border-top:2px solid var(--ink); margin-top:12px; padding-top:6px; font-family:var(--font-mono); font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:var(--mid);}}

footer{{
  border-top:1px solid var(--ink); padding-block:40px;
  font-family:var(--font-mono); font-size:12px; color:var(--mid);
}}
footer .wrap{{display:flex; justify-content:space-between; flex-wrap:wrap; gap:12px;}}

:focus-visible{{outline:2px solid var(--ink); outline-offset:2px;}}
</style>
</head>

<body>

<header>
  <div class="wrap"><span class="brand">KNOWLEDGE NETWORK</span></div>
</header>

<main>

<section class="hero">
  <div class="wrap">
    <div class="eyebrow">Index &middot; generated by the Knowledge Network Engine</div>
    <h1>Knowledge Network</h1>
    <p>A personal index of essays, interactive experiments, media servers, art and data analysis, and notes on space, time, and perception, often approached through contested questions. Entries marked <b>soon</b> are planned.</p>
    <div class="stats">
      <div class="stat"><b>{totals['pages']}</b><span>Pages indexed</span></div>
      <div class="stat"><b>4</b><span>Repositories</span></div>
      <div class="stat"><b>{totals['aerospace']}</b><span>Aerospace articles</span></div>
      <div class="stat"><b>{totals['machinery']}</b><span>Machinery entries</span></div>
      <div class="stat"><b>{totals['maya']}</b><span>Maya calendar pages</span></div>
    </div>
  </div>
</section>

{blog_html}
<section class="search-wrap">
  <div class="wrap">
    <input type="text" id="network-search" placeholder="Search all {totals['pages']} pages across the network&hellip; (title, topic, repo)" autocomplete="off" spellcheck="false">
    <div id="search-results" aria-live="polite"></div>
    <div id="search-empty">No matches. Try a different word, or browse by category below.</div>
  </div>
</section>

<section class="cats">
  <div class="wrap cats-grid">

{own_categories_html}

    <div class="section-divider" data-hide-when-search>Sibling repositories</div>

{hub_html}

    <div class="cat" data-hide-when-search>
      <h2>Philosophy</h2>
      <ul>
        <li class="soon"><span><span class="tag">Soon</span><span class="name">Nature of Time</span></span></li>
        <li><a href="https://followorbounce.com/p/humanity-as-functional-consciousness"><span class="tag">Read</span><span class="name">Consciousness — Humanity as Functional Consciousness</span></a></li>
        <li><a href="https://followorbounce.com/p/the-closed-door"><span class="tag">Read</span><span class="name">Reality &amp; Perception — The Closed Door</span></a></li>
        <li><a href="https://followorbounce.com/p/signal-noise"><span class="tag">Read</span><span class="name">Free Will — Signal &amp; Noise</span></a></li>
        <li class="soon"><span><span class="tag">Soon</span><span class="name">Ethics</span></span></li>
      </ul>
    </div>

    <div class="cat" data-hide-when-search>
      <h2>Personal</h2>
      <ul>
        <li class="soon"><span><span class="tag">Soon</span><span class="name">Notes</span></span></li>
        <li class="soon"><span><span class="tag">Soon</span><span class="name">Travel Stories</span></span></li>
        <li class="soon"><span><span class="tag">Soon</span><span class="name">Ideas</span></span></li>
        <li class="soon"><span><span class="tag">Soon</span><span class="name">Books &amp; References</span></span></li>
        <li class="soon"><span><span class="tag">Soon</span><span class="name">Useful Tools</span></span></li>
        <li class="ext"><a href="https://designdivinefuture.wordpress.com/" rel="external noopener" target="_blank"><span class="tag">Ext&#8599;</span><span class="name">Different Vision trainings</span></a></li>
        <li class="soon"><span><span class="tag">Soon</span><span class="name">Archive</span></span></li>
      </ul>
    </div>

  </div>
</section>

</main>

<footer>
  <div class="wrap">
    <span>KNOWLEDGE NETWORK — followorbounce.github.io</span>
    <span>{totals['pages']} PAGES &middot; 4 REPOS &middot; GENERATED BY engine/build_network.py</span>
  </div>
</footer>

<script id="network-data" type="application/json">{network_json}</script>
<script>
(function(){{
  var data;
  try {{
    data = JSON.parse(document.getElementById('network-data').textContent);
  }} catch(e) {{ data = []; }}

  var input = document.getElementById('network-search');
  var results = document.getElementById('search-results');
  var empty = document.getElementById('search-empty');
  var hideEls = document.querySelectorAll('[data-hide-when-search]');

  function esc(s){{
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }}

  function render(matches){{
    results.innerHTML = matches.slice(0, 60).map(function(e){{
      return '<a class="hit" href="' + esc(e.url) + '">' +
        '<span class="repo">' + esc(e.repo_label) + '</span>' +
        '<span class="name">' + esc(e.title) + '</span>' +
        '<span class="desc">' + esc(e.description) + '</span>' +
      '</a>';
    }}).join('');
  }}

  input.addEventListener('input', function(){{
    var q = input.value.trim().toLowerCase();
    var active = q.length > 0;
    for (var i = 0; i < hideEls.length; i++) hideEls[i].classList.toggle('search-active', active);
    if (!active) {{
      results.classList.remove('active');
      empty.classList.remove('active');
      return;
    }}
    var matches = data.filter(function(e){{
      return (e.title + ' ' + e.description + ' ' + e.category + ' ' + e.repo_label)
        .toLowerCase().indexOf(q) !== -1;
    }});
    render(matches);
    results.classList.toggle('active', matches.length > 0);
    empty.classList.toggle('active', matches.length === 0);
  }});
}})();
</script>

{blog_js}

</body>
</html>
'''
    with open(INDEX_OUT, "w", encoding="utf-8") as f:
        f.write(html)


if __name__ == "__main__":
    main()
