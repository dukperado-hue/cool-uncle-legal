#!/usr/bin/env python3
"""Two remaining Thai-digit strings (likely inside JSON arrays with long lines,
so the earlier line-regex read missed context but the walk did work — actually
these two lines appear in the dump; convert their Thai digits via the paragraph
strings directly)."""
import json

THAI = "๐๑๒๓๔๕๖๗๘๙"
ARABIC = "0123456789"

def thai2arabic(s):
    return "".join(ARABIC[THAI.find(ch)] if ch in THAI else ch for ch in s)

PATH = "assets/cases/janeera-2541.json"
j = json.load(open(PATH, encoding="utf-8"))

# 1) Section 01 paragraph containing ๖๐๘๓/๒๕๔๖ and มาตรา ๒๘๙
def fix_sec01(o):
    if isinstance(o, dict):
        for k, v in o.items():
            if k == "paragraphs" and isinstance(v, list):
                o[k] = [thai2arabic(p) for p in v]
            else:
                fix_sec01(v)
    elif isinstance(o, list):
        for v in o:
            fix_sec01(v)

fix_sec01(j)

# 2) sources.seed_facts note line
if "sources" in j:
    for sf in j["sources"].get("seed_facts", []):
        if "๖๐๘๓" in sf:
            j["sources"]["seed_facts"] = [thai2arabic(x) for x in j["sources"]["seed_facts"]]

json.dump(j, open(PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
s = open(PATH, encoding="utf-8").read()
print("remaining Thai digits:", s.count("๖") + s.count("๒") + s.count("๘๙") + s.count("๕") )
import re
print("remaining Thai-digit chars:", len(re.findall(r"[๐-๙]", s)))
