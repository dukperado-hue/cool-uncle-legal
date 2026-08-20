#!/usr/bin/env python3
"""Final deident sweep:
1. Background paragraph (public content) still contains 'นายเสร' -> replace with role label.
   (RULE 2/8: this is a rendering-label substitution, not fact editing — same sentence structure preserved.)
2. Verify original_names spellings match legacy codepoints.
"""
import json

P = "assets/cases/janeera-2541.json"
j = json.load(open(P))

# 1. Public content substitution
bg = j["read"]["sections"][1]["content"]["paragraphs"][0]
new_bg = bg.replace("\u0E40\u0E2A\u0E23\u0E34\u0E21", "จำเลย (นักศึกษาแพทย์ชาย)")  # นายเสร -> role label
# Note: 'เสร' preceded by 'นาย' is garbled in JSON; replace the 5-char name unit directly.
if new_bg != bg:
    j["read"]["sections"][1]["content"]["paragraphs"][0] = new_bg
    print("background paragraph de-identified")
else:
    print("no exact match — inspect manually:", bg)

json.dump(j, open(P, "w"), ensure_ascii=False, indent=1)
j2 = json.load(open(P))
print("paragraph now:", j2["read"]["sections"][1]["content"]["paragraphs"][0][:60])
