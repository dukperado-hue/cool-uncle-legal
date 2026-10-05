#!/usr/bin/env python3
"""Derive the human-facing research views from the D0.3 tables (no second source of truth).

Outputs (all regenerated; never hand-edited):
  outputs/coverage_view.csv / .md      one row per source_coverage row joined to source_register
  outputs/article_research_view.csv    one row per IDENTIFIED article_level row (human-facing field names)
  outputs/source_family_history.md     source family -> versions; sources with no established family

Field mapping (conceptual field -> storage):
  Code, Section ........... article_level.code / .section
  Thai authoritative text . NOT stored; referenced via article_level.thai_version -> thai_corpus_register
  English translation ..... NOT stored (text lives under corpus/text/<source_id>/, later phase)
  Source Thai ............. article_level.thai_version / source_register.thai_version_reference
  Effective date .......... article_level.thai_effective_date (source_register.effective_date at source level)
  Last amendment .......... source_register.last_amending_act
  Previous translation .... article_level.previous_translation_source_id
  Translation status ...... article_level.translation_status
  Translator .............. source_register.translator (joined, not duplicated)
  Terminology ............. not stored here (future term-level table)
  Audit status/date ....... article_level.audit_status / audit_date
  Version ................. article_level.source_version

Usage: python build_research_view.py [--root research_dir]
"""
import argparse
import csv
import sys
from collections import defaultdict
from pathlib import Path


def read(root, rel):
    with open(root / rel, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_csv(path, cols, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols, lineterminator="\n")
        w.writeheader()
        w.writerows(rows)


def section_text(c):
    if c["unit_type"] == "whole_code":
        return "whole Code"
    if c["unit_type"] == "single_section":
        return f"s.{c['unit_from']}"
    if c["unit_type"] == "section_range":
        return f"ss.{c['unit_from']}-{c['unit_to']}"
    return f"{c['unit_type']} {c['unit_from']}" + (f"-{c['unit_to']}" if c["unit_to"] else "")


def currency(src, cov):
    """Relative currency only; absolute currency needs a frozen Thai authoritative corpus."""
    if cov["coverage_status"] == "amendment_only":
        return "amendment-only (not a consolidated text)"
    if src["last_amending_act"] in ("", "unknown"):
        return "unknown (Thai version not stated)"
    return "unknown vs current Thai text (no frozen authoritative corpus); reflects: " + src["last_amending_act"]


def coverage_view(root):
    reg = {r["source_id"]: r for r in read(root, "sources/source_register.csv")}
    rows = []
    for c in read(root, "sources/source_coverage.csv"):
        s = reg[c["source_id"]]
        rows.append({
            "Code": c["code"], "Section": section_text(c), "Thai version": c["thai_version_reference"] or s["thai_version_reference"],
            "Existing English translation": s["title"], "Translator": s["translator"], "Publisher": s["publisher"],
            "Published": s["publication_year"], "Amendment covered": s["amendment_coverage"] or s["last_amending_act"],
            "Status": f"{s['authority_status']} / coverage {c['coverage_status']} (row {c['verification']}) / source identity+claims {s['provenance_status']} (not completeness)",
            "Current?": currency(s, c), "Evidence": s["evidence_location"], "Source ID": s["source_id"], "Origin": s["origin"],
        })
    order = {"CCC": 0, "PENAL": 1, "CIVPRO": 2, "CRIMPRO": 3}
    rows.sort(key=lambda r: (order[r["Code"]], r["Source ID"]))
    return rows


def article_view(root):
    reg = {r["source_id"]: r for r in read(root, "sources/source_register.csv")}
    out = []
    for a in read(root, "corpus/article_level.csv"):
        if a["search_status"] != "IDENTIFIED":
            continue
        s = reg[a["english_source_id"]]
        out.append({
            "Code": a["code"], "Section": a["section"],
            "Thai authoritative text": f"[reference only: Thai corpus for {a['thai_version']}]",
            "English translation": f"[reference only: {a['english_source_id']} {a['source_version']}]",
            "Source Thai / authoritative source": a["thai_version"], "Effective date": a["thai_effective_date"],
            "Last amendment": s["last_amending_act"], "Previous translation": a["previous_translation_source_id"],
            "Translation status": a["translation_status"], "Translator": s["translator"], "Terminology": "",
            "Audit status": a["audit_status"] or "not_audited", "Audit date": a["audit_date"],
            "Version": a["source_version"], "Currency": a["currency_status"], "Traceability": a["traceability_status"],
        })
    return out


ARTICLE_COLS = ["Code", "Section", "Thai authoritative text", "English translation", "Source Thai / authoritative source", "Effective date",
                "Last amendment", "Previous translation", "Translation status", "Translator", "Terminology", "Audit status", "Audit date",
                "Version", "Currency", "Traceability"]
COV_COLS = ["Code", "Section", "Thai version", "Existing English translation", "Translator", "Publisher", "Published",
            "Amendment covered", "Status", "Current?", "Evidence", "Source ID", "Origin"]


def family_history(root):
    reg = read(root, "sources/source_register.csv")
    fam = defaultdict(list)
    loose = defaultdict(list)
    for s in reg:
        (fam[s["source_family_id"]] if s["source_family_id"] else loose[s["code"]]).append(s)
    L = ["# Source family / version history", "",
         "Derived from `sources/source_register.csv`. A family is created **only** when evidence establishes that sources are versions of one translation work; no version is invented.", ""]
    L.append("## Established families")
    L.append("")
    if not fam:
        L.append("_None. No source family has been established by evidence yet._")
    for fid, ss in sorted(fam.items()):
        L.append(f"### {fid}")
        for s in sorted(ss, key=lambda x: x["source_version"]):
            L.append(f"- **{s['source_version']}** ({s['source_id']}) {s['title']} - {s['publication_year']} - reflects: {s['last_amending_act']}")
    L += ["", "## Sources with no established family (each its own work/version v1)", ""]
    for code in ("CCC", "PENAL", "CIVPRO", "CRIMPRO", "MULTI"):
        if code not in loose:
            continue
        L.append(f"### {code}")
        for s in sorted(loose[code], key=lambda x: x["source_id"]):
            L.append(f"- {s['source_id']} [{s['origin']}; {s['provenance_status']}] {s['title'][:110]} - published {s['publication_year']} - Thai version: {s['last_amending_act'][:90]}")
        L.append("")
    return "\n".join(L) + "\n"


def md_table(cols, rows):
    out = ["| " + " | ".join(cols) + " |", "|" + "---|" * len(cols)]
    for r in rows:
        out.append("| " + " | ".join(str(r[c]).replace("|", "/").replace("\n", " ")[:160] for c in cols) + " |")
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=str(Path(__file__).resolve().parents[1]))
    root = Path(ap.parse_args().root)
    out = root / "outputs"
    cv = coverage_view(root)
    write_csv(out / "coverage_view.csv", COV_COLS, cv)
    (out / "coverage_view.md").write_text("# Coverage view (derived)\n\nOne row per coverage row. 'Current?' is relative only: absolute currency needs a frozen Thai authoritative corpus.\n\n" + md_table(COV_COLS, cv) + "\n", encoding="utf-8", newline="\n")
    av = article_view(root)
    write_csv(out / "article_research_view.csv", ARTICLE_COLS, av)
    (out / "source_family_history.md").write_text(family_history(root), encoding="utf-8", newline="\n")
    print(f"coverage_view rows={len(cv)} article_research_view rows={len(av)}")
    return 0


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main())
