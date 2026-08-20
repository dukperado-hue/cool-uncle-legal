#!/usr/bin/env python3
"""Correct predict_verdict answer: real outcome = life imprisonment (ลดโทษหนึ่งในสาม คงจำคุกตลอดชีวิต)."""
import json

P = "assets/cases/janeera-2541.json"
j = json.load(open(P))
for s in j["play"]["flow"]:
    if s["key"] == "predict_verdict":
        c = s["content"]
        for o in c["options"]:
            o["real"] = o["id"] == "c"
        c["answer"] = "c"
        break
json.dump(j, open(P, "w"), ensure_ascii=False, indent=1)
print("play answer -> c (จำคุกตลอดชีวิต); options real flags updated")
