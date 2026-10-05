#!/usr/bin/env python3
"""Render outputs/venue_review.md from sources/search_venues.csv (derived; do not hand-edit).

Usage: python render_venue_review.py [--root research_dir]
"""
import argparse
import csv
import sys
from collections import Counter
from pathlib import Path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=str(Path(__file__).resolve().parents[1]))
    root = Path(ap.parse_args().root)
    with open(root / "sources/search_venues.csv", newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    L = ["# Proposed venue list for Conductor review", "",
         "Derived from `sources/search_venues.csv`. Venues are **NOT frozen**. Verification = URL resolution/identity only; no source searching.", ""]
    L.append("## Summary")
    L.append("")
    L.append("| disposition | n |")
    L.append("|---|---|")
    for k, v in sorted(Counter(r["proposed_disposition"] for r in rows).items()):
        L.append(f"| {k} | {v} |")
    L += ["", "| category | active venues |", "|---|---|"]
    act = [r for r in rows if r["proposed_disposition"] in ("include", "include_conditional")]
    for k, v in sorted(Counter(r["category"] for r in act).items(), key=lambda x: int(x[0][1:])):
        L.append(f"| {k} | {v} |")
    L += ["", "## Venues", "",
          "| id | cat | class | institution / platform | url | verification | disposition | note |", "|---|---|---|---|---|---|---|---|"]
    for r in rows:
        note = r["notes"].split("by URL resolution only (no searching). ", 1)[-1].replace("|", "/")
        L.append(f"| {r['venue_id']} | {r['category']} | {r['venue_class']} | {r['institution']} / {r['platform']} | {r['url']} | "
                 f"{r['verification_status']} | {r['proposed_disposition']} | {note} |")
    L += ["", "## Needing a human or Conductor decision before freeze", ""]
    for r in rows:
        if r["verification_status"] in ("identity_unconfirmed", "tls_error", "unreachable") and r["proposed_disposition"] != "drop" and r["venue_status"] != "withdrawn":
            L.append(f"- **{r['venue_id']}** {r['institution']} — {r['verification_status']}: {r['verification_evidence']}")
    out = root / "outputs/venue_review.md"
    out.write_text("\n".join(L) + "\n", encoding="utf-8", newline="\n")
    print("wrote", out)


if __name__ == "__main__":
    sys.exit(main())
