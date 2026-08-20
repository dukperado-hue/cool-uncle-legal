#!/usr/bin/env python3
import re
h = open('/home/ubuntu/cool-uncle-legal/news-case-khdiiesrim-saakhrraasdr-2541.html', encoding='utf-8').read()
m = re.search(r'เสร.{0,4} สาครราษ.{0,6}ร[a-zA-Z\u0E00-\u0E7F]*', h)
name = m.group(0) if m else None
print('raw:', repr(name))
if name:
    print('codepoints:', [f'U+{ord(c):04X} {c}' for c in name])
    # normal variant: เ-ิ-ร-ม
    print('len of เสิรม:', len('เสิรม'))
