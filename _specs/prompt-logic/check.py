#!/usr/bin/env python3
"""Validate content.json for "The Logic of a Prompt". Stdlib only.

Usage: python3 check.py [path/to/content.json]
Exit code 0 when every check passes, 1 otherwise.
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PATH = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "content.json")

OWNER_NAMES = [
    "Tone", "Format", "Act as", "Objective", "Context", "Scope", "Keywords",
    "Limitations", "Examples", "Deadline", "Audience", "Language", "Citations",
    "Points of view", "Counterarguments", "Terminology", "Analogies", "Quotes",
    "Statistics", "Call to action", "Questions",
]
MAXIMS = {"Quantity", "Quality", "Relation", "Manner", None}
FORBIDDEN = ["<", ">", "**", "`", "](", "__", "\n", "\t"]
KEBAB = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")

errors = []
warnings = []


def err(msg):
    errors.append(msg)


def words(s):
    return len(s.split())


def check_str(where, value, limit=None, allow_empty=False):
    if not isinstance(value, str):
        err(f"{where}: expected string, got {type(value).__name__}")
        return
    if not allow_empty and not value.strip():
        err(f"{where}: empty string")
    if value != value.strip():
        err(f"{where}: leading/trailing whitespace")
    for bad in FORBIDDEN:
        if bad in value:
            err(f"{where}: forbidden character sequence {bad!r}")
    if limit is not None and words(value) > limit:
        err(f"{where}: {words(value)} words > limit {limit}: {value!r}")


def keys(where, obj, required, optional=()):
    if not isinstance(obj, dict):
        err(f"{where}: expected object")
        return False
    missing = [k for k in required if k not in obj]
    extra = [k for k in obj if k not in required and k not in optional]
    if missing:
        err(f"{where}: missing keys {missing}")
    if extra:
        err(f"{where}: unexpected keys {extra}")
    return not missing


def unique(where, ids):
    seen = set()
    for i in ids:
        if i in seen:
            err(f"{where}: duplicate id {i!r}")
        seen.add(i)


def main():
    try:
        with open(PATH, encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, json.JSONDecodeError) as e:
        print(f"FAIL: cannot load {PATH}: {e}")
        return 1

    top = ["hero", "basics", "syllogism", "domains", "parts", "builder",
           "quiz", "limits", "cheatsheet", "sources"]
    if not keys("root", data, top, optional=("ui",)):
        print("\n".join("FAIL: " + e for e in errors))
        return 1

    # hero
    h = data["hero"]
    if keys("hero", h, ["kicker", "title", "lede"]):
        check_str("hero.kicker", h["kicker"], 10)
        check_str("hero.title", h["title"], 7)
        check_str("hero.lede", h["lede"], 40)

    # basics
    b = data["basics"]
    if not isinstance(b, list) or not 6 <= len(b) <= 8:
        err(f"basics: need 6-8 entries, got {len(b) if isinstance(b, list) else b}")
    else:
        unique("basics", [x.get("id") for x in b])
        for i, x in enumerate(b):
            w = f"basics[{i}]"
            if keys(w, x, ["id", "term", "plain", "example", "inPrompts"]):
                check_str(w + ".id", x["id"])
                check_str(w + ".term", x["term"], 6)
                check_str(w + ".plain", x["plain"], 30)
                check_str(w + ".example", x["example"], 30)
                check_str(w + ".inPrompts", x["inPrompts"], 25)
        needed = ["premise", "inference", "domain", "definition", "condition",
                  "evidence", "counterexample", "grice"]
        have = {x.get("id") for x in b}
        for n in needed:
            if n not in have:
                warnings.append(f"basics: expected an entry with id {n!r}")

    # syllogism
    s = data["syllogism"]
    if keys("syllogism", s, ["premises", "conclusion", "brokenPremise",
                             "brokenConclusion", "note"]):
        if not isinstance(s["premises"], list) or len(s["premises"]) != 2:
            err("syllogism.premises: need exactly 2 strings")
        else:
            for i, p in enumerate(s["premises"]):
                check_str(f"syllogism.premises[{i}]", p, 15)
        for k in ["conclusion", "brokenPremise", "brokenConclusion"]:
            check_str("syllogism." + k, s[k], 15)
        check_str("syllogism.note", s["note"], 35)

    # domains
    doms = data["domains"]
    dom_ids = []
    dom_parts_order = []
    if not isinstance(doms, list) or not 1 <= len(doms) <= 7:
        err("domains: need 1-7 entries")
    else:
        for i, d in enumerate(doms):
            w = f"domains[{i}]"
            if keys(w, d, ["id", "name", "logic", "question", "parts"]):
                check_str(w + ".id", d["id"])
                if not KEBAB.match(d["id"]):
                    err(f"{w}.id not kebab-case")
                check_str(w + ".name", d["name"], 3)
                check_str(w + ".logic", d["logic"], 6)
                check_str(w + ".question", d["question"], 10)
                if not isinstance(d["parts"], list) or not d["parts"]:
                    err(f"{w}.parts: need a non-empty list")
                else:
                    dom_parts_order.extend((d["id"], p) for p in d["parts"])
                dom_ids.append(d["id"])
        unique("domains", dom_ids)

    # parts
    parts = data["parts"]
    part_ids = []
    if not isinstance(parts, list) or len(parts) != 21:
        err(f"parts: need exactly 21, got {len(parts) if isinstance(parts, list) else parts}")
        parts = parts if isinstance(parts, list) else []
    pkeys = ["id", "n", "name", "domain", "line", "logic", "guess", "weak",
             "strong", "pitfall", "maxim"]
    for i, p in enumerate(parts):
        w = f"parts[{i}]"
        if not keys(w, p, pkeys):
            continue
        part_ids.append(p["id"])
        check_str(w + ".id", p["id"])
        if not KEBAB.match(p["id"]):
            err(f"{w}.id {p['id']!r} not kebab-case")
        if p["n"] != i + 1:
            err(f"{w}.n = {p['n']!r}, expected {i + 1} (consecutive, array order)")
        if p["domain"] not in dom_ids:
            err(f"{w}.domain {p['domain']!r} not a domain id")
        check_str(w + ".name", p["name"])
        check_str(w + ".line", p["line"], 18)
        check_str(w + ".logic", p["logic"], 30)
        check_str(w + ".guess", p["guess"], 20)
        check_str(w + ".weak", p["weak"], 18)
        check_str(w + ".strong", p["strong"], 35)
        check_str(w + ".pitfall", p["pitfall"], 30)
        if p["maxim"] not in MAXIMS:
            err(f"{w}.maxim {p['maxim']!r} invalid")
        # weak vs strong: strong should keep the weak request and only add to it
        if isinstance(p["weak"], str) and isinstance(p["strong"], str):
            ww = re.findall(r"[a-z0-9']+", p["weak"].lower())
            sw = set(re.findall(r"[a-z0-9']+", p["strong"].lower()))
            lost = [x for x in ww if x not in sw]
            if lost:
                err(f"{w}: strong drops words from weak: {lost}")
            if p["weak"] == p["strong"]:
                err(f"{w}: weak and strong are identical")
    unique("parts", part_ids)

    names = [p.get("name") for p in parts if isinstance(p, dict)]
    for n in OWNER_NAMES:
        c = names.count(n)
        if c != 1:
            err(f"owner name {n!r} appears {c} times (need exactly 1)")
    for n in names:
        if n not in OWNER_NAMES:
            err(f"part name {n!r} is not one of the owner's 21 names")

    # page order = domain order, and each part in exactly one domain
    expected = [pid for _, pid in dom_parts_order]
    if expected != part_ids:
        err(f"parts order does not match domain order.\n  domains: {expected}\n  parts:   {part_ids}")
    unique("domains[].parts (a part in two domains)", expected)
    by_id = {p["id"]: p for p in parts if isinstance(p, dict) and "id" in p}
    for did, pid in dom_parts_order:
        if pid not in by_id:
            err(f"domain {did!r} lists unknown part {pid!r}")
        elif by_id[pid]["domain"] != did:
            err(f"part {pid!r} has domain {by_id[pid]['domain']!r} but is listed under {did!r}")

    # builder
    bl = data["builder"]
    if keys("builder", bl, ["tasks"]):
        tasks = bl["tasks"]
        if not isinstance(tasks, list) or len(tasks) != 3:
            err("builder.tasks: need exactly 3")
            tasks = tasks if isinstance(tasks, list) else []
        unique("builder.tasks", [t.get("id") for t in tasks])
        for i, t in enumerate(tasks):
            w = f"builder.tasks[{i}]"
            if not keys(w, t, ["id", "label", "base", "fragments"]):
                continue
            check_str(w + ".id", t["id"])
            check_str(w + ".label", t["label"], 6)
            check_str(w + ".base", t["base"], 12)
            fr = t["fragments"]
            if not isinstance(fr, dict):
                err(f"{w}.fragments: expected object")
                continue
            for pid in part_ids:
                if pid not in fr:
                    err(f"{w}.fragments: missing {pid!r}")
            for k, v in fr.items():
                if k not in part_ids:
                    err(f"{w}.fragments: unknown part id {k!r}")
                check_str(f"{w}.fragments.{k}", v, 28)
                if isinstance(v, str) and v and v[-1] not in ".?!'":
                    err(f"{w}.fragments.{k}: should end with sentence punctuation")
                if isinstance(v, str) and v and not v[0].isupper():
                    err(f"{w}.fragments.{k}: should start with a capital letter")

    # quiz
    q = data["quiz"]
    if not isinstance(q, list) or len(q) != 8:
        err("quiz: need exactly 8 rounds")
        q = q if isinstance(q, list) else []
    unique("quiz", [r.get("id") for r in q])
    answers = []
    for i, r in enumerate(q):
        w = f"quiz[{i}]"
        if not keys(w, r, ["id", "prompt", "reply", "answer", "options", "why"]):
            continue
        check_str(w + ".id", r["id"])
        check_str(w + ".prompt", r["prompt"], 20)
        check_str(w + ".reply", r["reply"], 30)
        check_str(w + ".why", r["why"], 35)
        if r["answer"] not in part_ids:
            err(f"{w}.answer {r['answer']!r} not a part id")
        opts = r["options"]
        if not isinstance(opts, list) or len(opts) != 4 or len(set(opts)) != 4:
            err(f"{w}.options: need 4 distinct ids")
        else:
            for o in opts:
                if o not in part_ids:
                    err(f"{w}.options: {o!r} not a part id")
            if r["answer"] not in opts:
                err(f"{w}.options: does not include answer")
        answers.append(r["answer"])
    if len(set(answers)) != len(answers):
        warnings.append("quiz: some answers repeat")
    qdoms = {by_id[a]["domain"] for a in answers if a in by_id}
    if len(qdoms) < 5:
        warnings.append(f"quiz: answers cover only {len(qdoms)} domains")

    # limits
    lim = data["limits"]
    if not isinstance(lim, list) or not 4 <= len(lim) <= 5:
        err("limits: need 4-5 entries")
    else:
        for i, x in enumerate(lim):
            w = f"limits[{i}]"
            if keys(w, x, ["title", "text"]):
                check_str(w + ".title", x["title"], 6)
                check_str(w + ".text", x["text"], 45)

    # cheatsheet
    cs = data["cheatsheet"]
    counts = {d: 0 for d in dom_ids}
    for i, x in enumerate(cs if isinstance(cs, list) else []):
        w = f"cheatsheet[{i}]"
        if keys(w, x, ["domain", "check"]):
            if x["domain"] not in counts:
                err(f"{w}.domain {x['domain']!r} unknown")
            else:
                counts[x["domain"]] += 1
            check_str(w + ".check", x["check"], 12)
            if isinstance(x["check"], str) and not x["check"].endswith("?"):
                err(f"{w}.check should be a question ending in '?'")
    for d, c in counts.items():
        if not 1 <= c <= 2:
            err(f"cheatsheet: domain {d!r} has {c} checks (need 1-2)")

    # sources
    src = data["sources"]
    if not isinstance(src, list) or not src:
        err("sources: need a non-empty list")
    else:
        for i, x in enumerate(src):
            w = f"sources[{i}]"
            if not keys(w, x, ["title", "author", "year", "url", "note", "verify"]):
                continue
            check_str(w + ".title", x["title"])
            check_str(w + ".author", x["author"])
            check_str(w + ".note", x["note"])
            if x["year"] is not None and not (isinstance(x["year"], str) and re.fullmatch(r"\d{4}", x["year"])):
                err(f"{w}.year must be a 4-digit string or null")
            if x["url"] is not None and not (isinstance(x["url"], str) and x["url"].startswith("https://")):
                err(f"{w}.url must be https or null")
            if not isinstance(x["verify"], bool):
                err(f"{w}.verify must be boolean")

    # ui: page strings (no HTML; {placeholders} kept by translations, see check_i18n.py)
    ui = data.get("ui")
    if not isinstance(ui, dict):
        err("ui: missing page strings")
    else:
        for k, v in ui.items():
            vals = v.values() if isinstance(v, dict) else [v]
            for x in vals:
                if not isinstance(x, str) or "<" in x or ">" in x:
                    err(f"ui.{k}: must be plain text")

    # summary
    nverify = sum(1 for x in src if isinstance(x, dict) and x.get("verify")) if isinstance(src, list) else 0
    print(f"file: {PATH}")
    print(f"basics {len(b)}, domains {len(dom_ids)}, parts {len(parts)}, "
          f"builder tasks {len(data['builder'].get('tasks', []))}, quiz {len(q)}, "
          f"limits {len(lim)}, cheatsheet {len(cs)}, sources {len(src)} ({nverify} marked verify)")
    print("quiz answers: " + ", ".join(f"{a} ({by_id[a]['domain']})" for a in answers if a in by_id))
    for wmsg in warnings:
        print("WARN: " + wmsg)
    if errors:
        for e in errors:
            print("FAIL: " + e)
        print(f"{len(errors)} error(s)")
        return 1
    print("PASS: all checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
