#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build-case-directory.py
Scans prototype/assets/cases/*.json (the real per-case dossiers consumed by
prototype/read-case.html) and emits prototype/assets/cases/case-directory.json —
the manifest that case-directory.html renders as a sortable list view.

Run from repo root:  python build-case-directory.py
"""
import json
import glob
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CASE_DIR = os.path.join(HERE, "prototype", "assets", "cases")
OUT = os.path.join(CASE_DIR, "case-directory.json")

# non-case bookkeeping files that live in the same folder
SKIP = {"explore-inventory", "article-case-index", "golden-cases", "case-directory"}

# 6-bucket taxonomy used by the site top-bar / category dossier pages
BUCKETS = [
    ("criminal",      "อาญา"),
    ("economic",      "เศรษฐกิจ-ทุจริต"),
    ("family",        "ครอบครัว-มรดก"),
    ("political",     "รธน.-การเมือง-ปกครอง"),
    ("international",  "ระหว่างประเทศ"),
    ("precode",       "ก่อนยุคประมวล"),
]
BUCKET_LABEL = dict(BUCKETS)


def bucket_for(meta, case_id):
    """Best-effort map of a case onto one primary bucket."""
    tags = [str(t).lower() for t in (meta.get("categories") or [])]
    cat = str(meta.get("cat") or "")
    idl = case_id.lower()
    year = norm_year(meta.get("year"))

    def has(*subs):
        hay = " ".join(tags) + " " + cat + " " + idl
        return any(s in hay for s in subs)

    # pre-code era wins if clearly historical / before 2478 (พ.ร.บ. ลักษณะอาญา ร.ศ.127 = 2451; ป.อาญา = 2500)
    if has("precode", "ประวัติศาสตร์", "โบราณ", "ยุค") or (year and year <= 2475):
        return "precode"
    if has("international", " icj", "ศาลโลก", "ทูต", "ระหว่างประเทศ", "corfu", "lagrand", "nicaragua"):
        return "international"
    if has("political", "constitution", "รัฐธรรมนูญ", "การเมือง", "ปกครอง", "มณเฑียรบาล", "กบฏ", "rebellion", "election"):
        return "political"
    if has("family", "มรดก", "ครอบครัว", "inheritance", "marriage", "divorce", "สมรส", "พินัยกรรม"):
        return "family"
    if has("economic", "เศรษฐกิจ", "ทุจริต", "corruption", "embezzle", "fraud", "หุ้น", "การเงิน", "ภาษี", "piracy", "ลิขสิทธิ์", "forex"):
        return "economic"
    if has("criminal", "อาญา", "murder", "ฆาต", "ฆ่า", "ปล้น", "ข่มขืน", "shooting"):
        return "criminal"
    return "criminal"  # default bucket (largest)


def normalize_grade(g):
    """Collapse the project's grade vocabulary to a display letter."""
    g = str(g or "").strip().upper()
    if g in ("VERIFIED_S", "S", "S_VERIFIED"):
        return "S"
    if g in ("S_CANDIDATE", "A_PLUS", "A+"):
        return "A"
    if g and g[0] in "ABCD":
        return g[0]
    return ""


def norm_year(y, fallback_id=""):
    src = str(y) if y is not None else ""
    m = re.search(r"(\d{4})", src) or re.search(r"(\d{4})", fallback_id)
    if not m:
        return None
    n = int(m.group(1))
    if n < 1000:
        return None
    # Gregorian year slipped through (e.g. "1999") -> convert to พ.ศ.
    # Ayutthaya/Rattanakosin พ.ศ. years (2091, 2231, ...) are already BE.
    if 1500 < n < 2000:
        n += 543
    return n


def judicial_info(case):
    secs = (case.get("read") or {}).get("sections") or []
    for s in secs:
        if s.get("key") == "judicial":
            c = s.get("content") or {}
            v = c.get("verdict") or {}
            courts = v.get("courts") or []
            verified = bool(c.get("verified"))
            # "COURT RULINGS" tab = judicial section verified by Agent C with a
            # real court ladder on file (>= 2 court levels), per user spec.
            full_ladder = verified and len(courts) >= 2
            return {
                "has_judicial": True,
                "verified": verified,
                "court_count": len(courts),
                "full_ladder": full_ladder,
                "ratio": bool(v.get("ratio")),
            }
    return {"has_judicial": False, "verified": False, "court_count": 0, "full_ladder": False, "ratio": False}


def is_landmark(meta, case_id, rank):
    idl = case_id.lower()
    if "landmark" in idl:
        return True
    blob = " ".join([
        str(meta.get("title") or ""),
        str(meta.get("title_display") or ""),
        str(meta.get("blurb_60") or ""),
        str((rank or {}).get("judicial_case") or ""),
    ])
    return "บรรทัดฐาน" in blob


def main():
    if not os.path.isdir(CASE_DIR):
        sys.exit("case dir not found: " + CASE_DIR)

    rows = []
    for path in sorted(glob.glob(os.path.join(CASE_DIR, "*.json"))):
        cid = os.path.splitext(os.path.basename(path))[0]
        if cid in SKIP:
            continue
        try:
            case = json.load(open(path, encoding="utf-8"))
        except Exception as e:  # noqa
            print("  skip (bad json):", cid, e)
            continue
        meta = case.get("meta") or {}
        if not meta:
            continue
        rank = case.get("rank") or {}
        vis = case.get("visibility") or {}
        # Database != Publication (site RULE 4/5): the public directory lists
        # only cases cleared for release. Non-public dossiers stay hidden here.
        if not vis.get("public"):
            continue
        j = judicial_info(case)
        bucket = bucket_for(meta, cid)
        title = meta.get("title_display") or meta.get("title") or cid
        grade = normalize_grade(rank.get("grade"))
        rows.append({
            "id": cid,
            "title": title.strip(),
            "year": norm_year(meta.get("year"), cid),
            "year_raw": str(meta.get("year") or ""),
            "bucket": bucket,
            "bucket_label": BUCKET_LABEL[bucket],
            "cat_raw": str(meta.get("cat") or ""),
            "blurb": str(meta.get("blurb_60") or "").strip(),
            "grade": grade,
            "grade_raw": str(rank.get("grade") or ""),
            "score": rank.get("score"),
            "s_verified": bool(rank.get("s_verified")),
            "public": bool(vis.get("public")),
            "has_play": bool(case.get("play")),
            "has_ruling": j["full_ladder"],
            "ruling_verified": j["verified"],
            "court_count": j["court_count"],
            "is_landmark": is_landmark(meta, cid, rank),
            "read_minutes": meta.get("read_minutes"),
        })

    rows.sort(key=lambda r: (r["title"] or ""))

    counts = {b: 0 for b, _ in BUCKETS}
    for r in rows:
        counts[r["bucket"]] += 1

    out = {
        "_meta": {
            "generated_by": "build-case-directory.py",
            "total": len(rows),
            "public": sum(1 for r in rows if r["public"]),
            "rulings": sum(1 for r in rows if r["has_ruling"]),
            "landmark": sum(1 for r in rows if r["is_landmark"]),
            "buckets": [{"key": b, "label": l, "count": counts[b]} for b, l in BUCKETS],
        },
        "cases": rows,
    }
    json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("wrote", OUT)
    print(json.dumps(out["_meta"], ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
