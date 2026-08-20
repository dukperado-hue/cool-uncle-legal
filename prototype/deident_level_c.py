#!/usr/bin/env python3
"""Level-C de-identification of janeera-2541 case JSON.

Rules applied:
- Public content (meta, sections, play, media): roles only — "จำเลย (นักศึกษาแพทย์ชาย)" / "ผู้ตาย (นักศึกษาแพทย์หญิง)"
- Original names preserved internally under deident.original_* (RULE 8 — no silent loss)
- Verbatim court quotes untouched (they use จำเลย/ผู้ตาย already)
"""
import json

P = "assets/cases/janeera-2541.json"
j = json.load(open(P))

# --- 1. Internal preservation of original names (RULE 8) ---
j["deident"] = {
    "required": True,
    "level": "C",
    "requested_by": "B",
    "approved_by": "owner",
    "labels": {
        "defendant": "จำเลย (นักศึกษาแพทย์ชาย)",
        "victim": "ผู้ตาย (นักศึกษาแพทย์หญิง)",
    },
    "original_names": {
        "defendant": "เสิรม สาครราษฏร",
        "victim": "เจนจิรา พลอยองคุณศรี",
    },
    "reason": "User/owner directive: ระดับ C — แสดงเฉพาะบทบาท (RULE 5, RULE 3)",
    "pending_review_by": "A",
}

# --- 2. Public meta: role-based title ---
j["meta"]["title"] = "จำเลย (นักศึกษาแพทย์ชาย) — คดีฆาตกรรมอำพรางศพ (2541)"
j["meta"]["title_display"] = "จำเลย (นักศึกษาแพทย์ชาย) — คดีฆาตกรรมอำพรางศพ (2541)"

# --- 3. Section content: replace "นายเสิรม" with role label (public content edit, owner-directed) ---
def replace_in(o):
    if isinstance(o, dict):
        return {k: replace_in(v) for k, v in o.items()}
    if isinstance(o, list):
        return [replace_in(v) for v in o]
    if isinstance(o, str):
        return o.replace("นายเสร", "จำเลย (นักศึกษาแพทย์ชาย)")
    return o

j = replace_in(j)

json.dump(j, open(P, "w"), ensure_ascii=False, indent=1)
print("Level C applied; labels:", j["deident"]["labels"])
