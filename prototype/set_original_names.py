#!/usr/bin/env python3
"""Write exact codepoint-verified original names into deident.original_names.

Legacy HTML name: เ-ส-ร-ิ-ม (U+0E40 U+0E2A U+0E23 U+0E34 U+0E21)
Victim: เจนจิรา พลอยองคุณศรี (U+0E40 U+0E08 U+0E19 U+0E08 U+0E34 U+0E23 U+0E32 ...)
"""
import json

P = "assets/cases/janeera-2541.json"
j = json.load(open(P))

defendant = "\u0E40\u0E2A\u0E23\u0E34\u0E21 \u0E2A\u0E32\u0E04\u0E23\u0E23\u0E32\u0E29\u0E0E\u0E23"
victim = "\u0E40\u0E08\u0E19\u0E08\u0E34\u0E23\u0E32 \u0E1E\u0E25\u0E2D\u0E22\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E28\u0E23\u0E35"

h = open('/home/ubuntu/cool-uncle-legal/news-case-khdiiesrim-saakhrraasdr-2541.html', encoding='utf-8').read()
assert "\u0E40\u0E2A\u0E23\u0E34\u0E21 \u0E2A\u0E32\u0E04\u0E23\u0E23\u0E32\u0E29\u0E0E\u0E23" in h, "defendant spelling not in legacy"
assert "\u0E40\u0E08\u0E19\u0E08\u0E34\u0E23\u0E32 \u0E1E\u0E25\u0E2D\u0E22\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E28\u0E23\u0E35" in h, "victim spelling not in legacy"

j["deident"]["original_names"] = {"defendant": defendant, "victim": victim}
json.dump(j, open(P, "w"), ensure_ascii=False, indent=1)
print("original names written (codepoint-verified against legacy HTML)")
