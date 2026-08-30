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

# The hand-curated category dossier pages ARE the authoritative membership:
# whatever read-case ids a page links to, those cases belong to that bucket.
# A case can appear on several pages (e.g. four-ministers-murder = criminal +
# political) — the directory keeps every membership so ?cat= behaves like the
# top-nav tabs.
CATEGORY_PAGES = {
    "criminal": ["news-index.html", "news-category-criminal.html"],
    "economic": ["news-category-economic.html"],
    "family": ["news-category-family.html"],
    "political": ["news-category-political.html"],
    "international": ["news-category-international.html"],
    "other": ["news-category-other.html"],
    "precode": ["news-category-precode.html"],
}
_ID_RE = re.compile(r"read-case\.html\?id=([A-Za-z0-9_-]+)")


def load_page_memberships():
    """id -> set(bucket keys) taken from the category pages' own link lists."""
    m = {}
    for bucket, pages in CATEGORY_PAGES.items():
        for page in pages:
            p = os.path.join(HERE, page)
            if not os.path.exists(p):
                continue
            for cid in _ID_RE.findall(open(p, encoding="utf-8", errors="replace").read()):
                m.setdefault(cid, set()).add(bucket)
    return m

# non-case bookkeeping files that live in the same folder
SKIP = {"explore-inventory", "article-case-index", "golden-cases", "case-directory"}

# Taxonomy mirrors the site top-bar / category dossier tabs (news-category-*.html)
BUCKETS = [
    ("criminal",      "อาญา"),
    ("economic",      "เศรษฐกิจ-ทุจริต"),
    ("family",        "ครอบครัว-มรดก"),
    ("political",     "รธน.-การเมือง-ปกครอง"),
    ("international",  "ระหว่างประเทศ"),
    ("other",         "อื่นๆ"),
    ("precode",       "ก่อนยุคประมวล"),
]
BUCKET_LABEL = dict(BUCKETS)

_CRIM_KW = ("ฆาต", "ฆ่า", "ฆา่", "หั่นศพ", "อำพราง", "อุ้ม", "มือปืน", "ปล้น", "ชิงทรัพย์",
            "ข่มขืน", "วิสามัญ", "ยิง", "ต่อเนื่อง", "แพะ", "murder", "serial", "robbery", "rape")
_POL_KW = ("กบฏ", "ปฏิวัติ", "รัฐประหาร", "รัฐมนตรี", "รัฐธรรมนูญ", "เลือกตั้ง", "การเมือง",
           "สูญหาย", "อุ้มหาย", "สวรรคต", "สมรสเท่าเทียม", "ปกครอง", "rebellion", "coup", "election")


_BUCKET_PRIORITY = ["international", "family", "economic", "criminal", "political", "other", "precode"]


def buckets_for(meta, case_id, page_buckets):
    """Return (sorted bucket list, primary bucket) for a case.

    page_buckets = memberships harvested from the category pages (authoritative).
    Cases that appear on no page fall back to meta.categories tags + keywords.
    A pre-code-era case always also carries the 'precode' bucket.
    """
    tags = {str(t).lower() for t in (meta.get("categories") or [])}
    cat = str(meta.get("cat") or "")
    year = norm_year(meta.get("year"), case_id)
    text = " ".join([
        str(meta.get("title") or ""),
        str(meta.get("title_display") or ""),
        str(meta.get("blurb_60") or ""),
        cat, case_id.lower(),
    ])

    found = set(page_buckets)

    # pre-code era: year gate + explicit historical signal (NOT bare "ประวัติศาสตร์"
    # — many modern landmark cases describe themselves as historic).
    if (year and year <= 2475) or "ประวัติศาสตร์กฎหมาย" in cat or "ยุคโบราณ" in cat \
            or any(k in text for k in ("ตราสามดวง", "กฎมณเฑียรบาล", "กรุงศรีอยุธยา")):
        found.add("precode")

    if not found or found == {"precode"}:
        # no page lists this case — derive from tags / keywords
        for t in ("international", "family", "economic", "political", "criminal", "other"):
            if t in tags:
                found.add(t)
        if "international" in tags or any(k in text for k in (" icj", "ศาลโลก", "ระหว่างประเทศ", "corfu", "lagrand")):
            found.add("international")
        if any(k in text for k in ("มรดก", "พินัยกรรม", "สมรส", "บุตรนอกสมรส", "living will", "สิทธิในการตาย")):
            found.add("family")
        if any(k in text for k in ("ทุจริต", "corruption", "embezzle", "fraud", "เงินทอน", "แชร์ลูกโซ่", "ฟอกเงิน")):
            found.add("economic")
        if any(k in text for k in _POL_KW):
            found.add("political")
        if any(k in text for k in _CRIM_KW):
            found.add("criminal")

    found.discard("")
    if not found:
        found = {"other"}

    ordered = [b for b in _BUCKET_PRIORITY if b in found]
    # primary = first non-precode bucket if any (precode is a time period, not a topic)
    primary = next((b for b in ordered if b != "precode"), ordered[0])
    return ordered, primary


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

    page_memberships = load_page_memberships()

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
        buckets, primary = buckets_for(meta, cid, page_memberships.get(cid, set()))
        title = meta.get("title_display") or meta.get("title") or cid
        grade = normalize_grade(rank.get("grade"))
        rows.append({
            "id": cid,
            "title": title.strip(),
            "year": norm_year(meta.get("year"), cid),
            "year_raw": str(meta.get("year") or ""),
            "bucket": primary,
            "bucket_label": BUCKET_LABEL[primary],
            "buckets": buckets,
            "bucket_labels": [BUCKET_LABEL[b] for b in buckets],
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
        for b in r["buckets"]:
            counts[b] += 1

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
