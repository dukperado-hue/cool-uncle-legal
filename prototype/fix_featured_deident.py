#!/usr/bin/env python3
import json

P = "assets/cases/golden-cases.json"
j = json.load(open(P))
j["meta"]["_featured_deident"] = "\U0001F6E1 De-identification ระดับ C — แสดงเฉพาะบทบาท (จำเลย = นักศึกษาแพทย์ชาย / ผู้ตาย = นักศึกษาแพทย์หญิง) — ชื่อจริงเก็บไว้ใน case JSON เท่านั้น"
json.dump(j, open(P, "w"), ensure_ascii=False, indent=2)
print(j["meta"]["_featured_deident"])
