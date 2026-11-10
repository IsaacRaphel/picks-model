"""Strip betting-bankroll content (parlays, simulated $ results) from the public data files.
Run from the repo root after copying fresh data into data/: python3 tools/public_filter.py"""
import json, re

BAD = re.compile(r"parlay|\$\s?\d|pretend|bankroll|\bstake", re.I)
SENT = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9\"'(])")

def clean_text(s):
    if not isinstance(s, str) or not BAD.search(s):
        return s
    if " · " in s and len(s) < 300:  # record lines like "Spread 9-6 · ML 11-4 · Parlay L"
        return " · ".join(p for p in s.split(" · ") if not BAD.search(p))
    keep = [x for x in SENT.split(s) if not BAD.search(x)]
    return " ".join(keep).strip()

def load(n):
    with open(f"data/{n}.json") as f:
        return json.load(f)

def save(n, d):
    with open(f"data/{n}.json", "w") as f:
        json.dump(d, f, indent=1, ensure_ascii=False)

picks = [p for p in load("picks") if p.get("kind") == "Pick of the day"]
save("picks", picks)

reviews = load("reviews")
for r in reviews:
    for k, v in list(r.items()):
        if k not in ("id", "date", "kind", "period"):
            r[k] = clean_text(v)
save("reviews", reviews)

lessons = [l for l in load("lessons") if not str(l.get("situation", "")).lower().startswith("parlay")]
for l in lessons:
    for k in ("lesson", "evidence"):
        l[k] = clean_text(l.get(k, ""))
save("lessons", lessons)

games = load("games")
for g in games:
    for k in ("note", "result_context"):
        g[k] = clean_text(g.get(k, ""))
save("games", games)
print(f"public filter: {len(picks)} top picks, {len(reviews)} reviews, {len(lessons)} lessons, {len(games)} games")
