#!/usr/bin/env python3
"""Convert Thai numerals to Arabic numerals in public content of the Janeera case JSON,
fix the (เดกะ) link text, and update the case title per user feedback.

Preserves internal/audit fields untouched. Thai-digit strings that are purely
citation-style (e.g. มาตรา ๒๘๙, ๖๐๘๓/๒๕๔๖, ม.๗๘) are converted. Verbatim court
quotes containing Thai digits are also converted so Read Mode is consistent,
per the Product Owner decision (user asked "ให้ใช้เลขอารบิกให้หมด").
"""
import json
import re

PATH = "assets/cases/janeera-2541.json"

THAI = "๐๑๒๓๔๕๖๗๘๙"
ARABIC = "0123456789"

def thai2arabic(s: str) -> str:
    out = []
    for ch in s:
        idx = THAI.find(ch)
        out.append(ARABIC[idx] if idx >= 0 else ch)
    return "".join(out)

j = json.load(open(PATH, encoding="utf-8"))
count = 0

def walk(o):
    global count
    if isinstance(o, dict):
        for k, v in o.items():
            if isinstance(v, str):
                o[k] = thai2arabic(v)
            else:
                walk(v)
    elif isinstance(o, list):
        for v in o:
            walk(v)

walk(j)

# Fix the link text (เดกะ) -> (ศาลฎีกา)
def fix_links(o):
    global count
    if isinstance(o, dict):
        for k, v in o.items():
            if isinstance(v, str) and "เดกะ" in v:
                o[k] = v.replace("(เดกะ)", "(ศาลฎีกา)")
            elif isinstance(v, str):
                o[k] = v
            else:
                fix_links(v)
    elif isinstance(o, list):
        for v in o:
            fix_links(v)

fix_links(j)

# Title: คดีฆาตกรรมนักศึกษาแพทย์ (2541)
j["meta"]["title"] = "คดีฆาตกรรมนักศึกษาแพทย์ (2541)"
j["meta"]["title_display"] = "คดีฆาตกรรมนักศึกษาแพทย์ (2541)"
if "slug_display" in j["meta"]:
    j["meta"]["slug_display"] = "คดีฆาตกรรมนักศึกษาแพทย์ (2541)"

json.dump(j, open(PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("done — remaining Thai digits:", len(re.findall(r"[๐-๙]", open(PATH, encoding="utf-8").read())))
