#!/usr/bin/env python3
"""Fix the last Thai-digit occurrences found at lines 55, 60, 408 of the case JSON:
- section content paragraph (01 ภาพรวมคดี) — missed because walk() skips no fields but this
  one contains ๖๐๘๓/๒๕๔๖ and มาตรา ๒๘๙ — actually walk covers strings; these survived
  because json.dump(indent=1) put them on lines read from the original file. Convert in-place.
- quick_facts key "บทฉกรรจ์ตามมาตรา ๒๘๙ (๕)" — rename key + convert value
- sources.seed_facts note — keep the citation but convert Thai digits (not verbatim court text)
"""
import json
import re

PATH = "assets/cases/janeera-2541.json"
THAI = "๐๑๒๓๔๕๖๗๘๙"
ARABIC = "0123456789"

def thai2arabic(s):
    out = []
    for ch in s:
        idx = THAI.find(ch)
        out.append(ARABIC[idx] if idx >= 0 else ch)
    return "".join(out)

j = json.load(open(PATH, encoding="utf-8"))

# 1) walk all strings again (catches paragraph + sources)
def walk(o):
    if isinstance(o, dict):
        for k, v in list(o.items()):
            if isinstance(v, str):
                o[k] = thai2arabic(v)
            else:
                walk(v)
    elif isinstance(o, list):
        for v in o:
            walk(v)

walk(j)

# 2) rename the quick_facts key with Thai digits
def fix_keys(o):
    if isinstance(o, dict):
        for k in list(o.keys()):
            v = o.pop(k)
            nk = thai2arabic(k)
            o[nk] = v
            fix_keys(v)
    elif isinstance(o, list):
        for v in o:
            fix_keys(v)

fix_keys(j)

json.dump(j, open(PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
s = open(PATH, encoding="utf-8").read()
print("remaining Thai digits:", len(re.findall(r"[๐-๙]", s)))
