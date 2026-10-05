#!/usr/bin/env python3
"""Build the section grid and the NOT_ASSESSED article-level skeleton.

Reads the Atlas codex-data.json READ-ONLY (never modified, never copied: only section
labels, storage order and cancelled flag are extracted - no Atlas text/notes/metadata).

  corpus/section_grid.csv     fully derived; rewritten on every run (deterministic: same
                              input -> byte-identical output; records the input SHA-256)
  corpus/article_level.csv    additive only: adds one NOT_ASSESSED row for every grid
                              section that has no row yet. Existing rows are never modified
                              or deleted. This script performs NO search.

This builder only ever emits grid_status=PROXY (the Atlas grid is a proxy, never
authoritative) and refuses to run over a RECONCILED grid.

Section identifiers are strings ("1", "1/1", "4 ทวิ", "172 ตรี/1"); nothing is coerced
to integers. Repealed provisions are kept (provision_status=repealed).

Usage: python build_article_skeleton.py [--codex PATH] [--root research_dir] [--check]
  --check : build in memory and fail (exit 1) if section_grid.csv on disk differs.
NOTE: the Atlas grid is a working proxy for the Thai section index, not an authoritative
index; D1 must reconcile it against the official Thai text (see corpus-schema.md).
"""
import argparse
import csv
import hashlib
import json
import sys
from pathlib import Path

CODE_MAP = {"civil": "CCC", "criminal": "PENAL", "civpro": "CIVPRO", "crimpro": "CRIMPRO"}
GRID_COLS = ["code", "section", "statutory_order", "atlas_order", "provision_status", "grid_status", "grid_source", "grid_source_key", "grid_source_sha256"]


# Thai multiplicative suffixes in statutory order (e.g. 4 ทวิ follows 4, then 4 ตรี ...)
SUFFIX_RANK = {"ทวิ": 2, "ตรี": 3, "จัตวา": 4, "เบญจ": 5, "ฉ": 6, "สัตต": 7, "อัฎฐ": 8}


def sort_key(label):
    """Statutory sort key from a string label; raises on an unknown suffix (never guesses)."""
    main, _, rest = label.partition(" ")
    sub = 0
    if "/" in main:
        main, _, s = main.partition("/")
        sub = int(s)
        suffix, slash = "", 0
    else:
        suffix, _, s = rest.partition("/")
        slash = int(s) if s else 0
    rank = 1
    if suffix:
        if suffix not in SUFFIX_RANK:
            raise ValueError(f"unknown section suffix {suffix!r} in {label!r}")
        rank = SUFFIX_RANK[suffix]
    return (int(main), rank, sub, slash)


def default_codex(root):
    return root.parent / "codex-data.json"


def build_grid(codex_path):
    raw = Path(codex_path).read_bytes()
    sha = hashlib.sha256(raw).hexdigest()
    data = json.loads(raw.decode("utf-8"))
    rows = []
    for key, code in CODE_MAP.items():
        items = [(order, str(label), art) for order, (label, art) in enumerate(data["books"][key]["articles"].items(), start=1)]
        ranked = sorted(items, key=lambda t: sort_key(t[1]))
        for stat, (order, label, art) in enumerate(ranked, start=1):
            status = "repealed" if art.get("cancelled") is True else "in_force"
            rows.append({"code": code, "section": label, "statutory_order": str(stat), "atlas_order": str(order),
                         "provision_status": status, "grid_status": "PROXY", "grid_source": "atlas:codex-data.json",
                         "grid_source_key": f"books.{key}.articles", "grid_source_sha256": sha})
    return rows


def write_csv(path, cols, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols, lineterminator="\n")
        w.writeheader()
        w.writerows(rows)


def main():
    ap = argparse.ArgumentParser()
    root_default = Path(__file__).resolve().parents[1]
    ap.add_argument("--root", default=str(root_default))
    ap.add_argument("--codex")
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    root = Path(a.root)
    codex = Path(a.codex) if a.codex else default_codex(root)
    schema = json.loads((root / "methodology/schemas/master-dataset.schema.json").read_text(encoding="utf-8"))
    al_cols = list(schema["tables"]["article_level"]["fields"])

    grid = build_grid(codex)
    grid_path = root / "corpus/section_grid.csv"
    if grid_path.exists():
        with open(grid_path, newline="", encoding="utf-8") as f:
            reconciled = {r["code"] for r in csv.DictReader(f) if r.get("grid_status") == "RECONCILED"}
        if reconciled:
            print(f"refusing to rebuild: grid for {sorted(reconciled)} is RECONCILED. The Atlas proxy builder never overwrites or "
                  "relabels a reconciled grid; a reconciled grid is built from the Thai authoritative corpus by a separate, reviewed step.")
            return 2
    if a.check:
        with open(grid_path, newline="", encoding="utf-8") as f:
            on_disk = list(csv.DictReader(f))
        if on_disk != grid:
            print("section_grid.csv differs from codex-data.json derivation")
            return 1
        print("section_grid.csv up to date")
        return 0

    write_csv(grid_path, GRID_COLS, grid)

    art_path = root / "corpus/article_level.csv"
    with open(art_path, newline="", encoding="utf-8") as f:
        existing = list(csv.DictReader(f))
    have = {(r["code"], r["section"]) for r in existing}
    added = []
    for g in grid:
        if (g["code"], g["section"]) in have:
            continue
        r = {c: "" for c in al_cols}
        r.update(code=g["code"], section=g["section"], thai_version="unknown", search_status="NOT_ASSESSED")
        added.append(r)
    if added:
        write_csv(art_path, al_cols, existing + added)
    per = {}
    for g in grid:
        per[g["code"]] = per.get(g["code"], 0) + 1
    print("grid:", per, "| repealed:", sum(g["provision_status"] == "repealed" for g in grid),
          "| article rows added:", len(added), "| existing rows kept:", len(existing))
    return 0


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main())
