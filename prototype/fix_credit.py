#!/usr/bin/env python3
"""Replace the garbled credit text with clean Thai using pure ASCII-safe codepoints."""
import json

P = "assets/cases/janeera-2541.json"
j = json.load(open(P))

# Codepoint-constructed credit: ข่าวดังข้ามเวลา — เชิอมโยงเพื่อการศึกษา
# The garbled chars are \u0E40 (เ) followed by missing \u0E0A (ช): 'เชิอมโยง' should be 'เชิอมโยง' -> actually 'เชิอมโยง' = เชิอมโยง
# Simpler: rewrite the whole credit using explicit codepoints for 'เชิอมโยงเพื่อการศึกษา'
link_word = "".join([
    "\u0E40",  # เ sara e
    "\u0E0A",  # ช
    "\u0E37",  # ื sara ue
    "\u0E48",  # ่ mai ek
    "\u0E2D",  # อ
    "\u0E21",  # ม
    "\u0E42",  # โ sara o
    "\u0E22",  # ย
    "\u0E07",  # ง
])
rest = "".join([
    "\u0E40", "\u0E1E", "\u0E37", "\u0E48", "\u0E2D",  # เพื่อ
    "\u0E01", "\u0E32", "\u0E23",                      # การ
    "\u0E28", "\u0E36", "\u0E01", "\u0E29", "\u0E32",  # ศึกษา
])
credit = link_word + rest
j["media"]["items"][0]["credit"] = "ข่าวดังข้ามเวลา — " + credit
json.dump(j, open(P, "w"), ensure_ascii=False, indent=1)
print("credit:", j["media"]["items"][0]["credit"])
assert "เชิอมโยงเพื่อการศึกษา" in credit, "unexpected"
