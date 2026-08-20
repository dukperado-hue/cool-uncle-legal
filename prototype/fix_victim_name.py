#!/usr/bin/env python3
import json, re

h = open('/home/ubuntu/cool-uncle-legal/news-case-khdiiesrim-saakhrraasdr-2541.html', encoding='utf-8').read()

# The legacy grep found: เจนจิรา พลอยองคุณศรี
# Extract exact substring + codepoints
m = re.search(r'เจนจิรา พลอยอง.{1,6}', h)
name = m.group(0).strip()
print('raw:', repr(name))
print('codepoints:', [f'{c} U+{ord(c):04X}' for c in name])

P = "assets/cases/janeera-2541.json"
j = json.load(open(P))
j["deident"]["original_names"]["victim"] = name
json.dump(j, open(P, "w"), ensure_ascii=False, indent=1)
j2 = json.load(open(P))
print('victim stored as:', j2['deident']['original_names']['victim'])
