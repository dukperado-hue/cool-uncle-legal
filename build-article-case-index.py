# -*- coding: utf-8 -*-
"""Build prototype/assets/cases/article-case-index.json

Scans every case JSON in prototype/assets/cases/*.json, parses the
`read.sections[key=provisions].content.articles[].ref` strings, and maps each
one that can be confidently matched to a real codex-data.json article
(book + number) into an index:

    { "civil:1523": [{"id": "...", "title": "..."}], ... }

Used by neural-network.html to auto-draw case<->มาตรา links without any
manual linking UI (the site is static — there is no backend to persist
manually-created links, so everything here is derived from data that
already exists in each case file's own provisions citations).

Re-run this whenever a case file's provisions section changes:
    python3 build-article-case-index.py
"""
import json
import glob
import re
import sys

# Windows consoles default to a legacy codepage (e.g. cp874) that can't
# encode most Thai/Unicode punctuation in the unmatched-sample debug
# output below — reconfigure to UTF-8 so a run with unmatched refs prints
# its diagnostics instead of crashing after already writing the index.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

CODEX_PATH = "codex-data.json"
CASES_GLOB = "prototype/assets/cases/*.json"
OUT_PATH = "prototype/assets/cases/article-case-index.json"
SKIP_FILES = {"golden-cases.json", "explore-inventory.json", "article-case-index.json"}

# Order matters: check longer/more specific names before shorter ones.
BOOK_MATCHERS = [
    ("civpro", ["ประมวลกฎหมายวิธีพิจารณาความแพ่ง", "วิ.แพ่ง", "วิธีพิจารณาความแพ่ง"]),
    ("crimpro", ["ประมวลกฎหมายวิธีพิจารณาความอาญา", "วิ.อาญา", "วิธีพิจารณาความอาญา"]),
    ("const2560", ["รัฐธรรมนูญแห่งราชอาณาจักรไทย พ.ศ. 2560", "รัฐธรรมนูญ 2560", "รัฐธรรมนูญแห่งราชอาณาจักรไทย"]),
    ("constitution", ["พระธรรมนูญศาลยุติธรรม"]),
    ("adminproc", ["วิธีปฏิบัติราชการทางปกครอง"]),
    ("admincourt", ["จัดตั้งศาลปกครอง", "ศาลปกครอง"]),
    ("tortofficials", ["ความรับผิดทางละเมิดของเจ้าหน้าที่"]),
    ("copyright", ["ลิขสิทธิ์"]),
    ("patent", ["สิทธิบัตร"]),
    ("trademark", ["เครื่องหมายการค้า"]),
    ("carriage", ["รับขนของทางทะเล"]),
    ("ipcourt", ["ศาลทรัพย์สินทางปัญญา"]),
    ("politicalparty", ["พรรคการเมือง"]),
    ("criminal", ["ประมวลกฎหมายอาญา", "ป.อ.", "— อาญา", "-อาญา"]),
    ("civil", ["ประมวลกฎหมายแพ่งและพาณิชย์", "ป.พ.พ.", "— แพ่ง", "-แพ่ง"]),
]

THAI_DIGITS = str.maketrans("๐๑๒๓๔๕๖๗๘๙", "0123456789")


def guess_book(ref, loc):
    hay = f"{ref} {loc}"
    for book, needles in BOOK_MATCHERS:
        for n in needles:
            if n in hay:
                return book
    return None


def extract_numbers(ref):
    """Return EVERY มาตรา number mentioned in a ref string, not just the
    first. A ref frequently cites a companion article via "...ประกอบมาตรา
    NNN" (e.g. "มาตรา 1452 ประกอบมาตรา 1495", "มาตรา 288 ประกอบมาตรา 289
    (4)") — the base article a companion article depends on to mean
    anything on its own. Using re.search (first match only) silently
    dropped every companion citation from the index; re.findall here fixes
    that for every case at once instead of hand-patching each one."""
    ref = ref.translate(THAI_DIGITS)
    nums = re.findall(r"มาตรา\s*([0-9]+(?:/[0-9]+)?)", ref)
    if not nums:
        nums = re.findall(r"ม\.\s*([0-9]+(?:/[0-9]+)?)", ref)
    if not nums:
        # "289 — อาญา" style refs with no มาตรา/ม. keyword at all.
        m = re.match(r"\s*([0-9]+(?:/[0-9]+)?)\s", ref)
        if m:
            nums = [m.group(1)]
    seen = set()
    out = []
    for n in nums:
        if n not in seen:
            seen.add(n)
            out.append(n)
    return out


def main():
    codex = json.load(open(CODEX_PATH, encoding="utf-8"))
    books = codex["books"]

    index = {}
    matched, unmatched = 0, 0
    unmatched_samples = []

    for path in sorted(glob.glob(CASES_GLOB)):
        fname = path.replace("\\", "/").rsplit("/", 1)[-1]
        if fname in SKIP_FILES:
            continue
        try:
            case = json.load(open(path, encoding="utf-8"))
        except Exception as e:
            print("SKIP (bad json):", path, e)
            continue

        case_id = case.get("id") or fname[:-5]
        title = (case.get("meta") or {}).get("title") or case_id
        cat = (case.get("meta") or {}).get("cat") or ""
        is_public = bool((case.get("visibility") or {}).get("public"))

        for section in (case.get("read") or {}).get("sections", []):
            if section.get("key") != "provisions":
                continue
            content = section.get("content")
            if not isinstance(content, dict):
                continue
            for art in content.get("articles", []):
                ref = art.get("ref", "") or ""
                loc = art.get("loc", "") or ""
                book = guess_book(ref, loc)
                numbers = extract_numbers(ref) or extract_numbers(loc)
                if not book or not numbers:
                    unmatched += 1
                    if len(unmatched_samples) < 40:
                        unmatched_samples.append(f"{case_id}: ref={ref!r} loc={loc!r}")
                    continue
                book_articles = books.get(book, {}).get("articles", {})
                for number in numbers:
                    if number not in book_articles:
                        unmatched += 1
                        if len(unmatched_samples) < 40:
                            unmatched_samples.append(
                                f"{case_id}: guessed {book}:{number} but not in codex (ref={ref!r})"
                            )
                        continue
                    matched += 1
                    key = f"{book}:{number}"
                    bucket = index.setdefault(key, [])
                    if not any(c["id"] == case_id for c in bucket):
                        bucket.append({"id": case_id, "title": title, "cat": cat, "public": is_public})

    json.dump(index, open(OUT_PATH, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

    print(f"matched: {matched}, unmatched: {unmatched}, unique article keys: {len(index)}")
    print(f"wrote {OUT_PATH}")
    if unmatched_samples:
        print("\n--- sample unmatched refs (expected for old/repealed/foreign-law citations) ---")
        for s in unmatched_samples:
            print(" ", s)


if __name__ == "__main__":
    main()
