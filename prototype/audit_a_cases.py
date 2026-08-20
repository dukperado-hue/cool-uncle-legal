#!/usr/bin/env python3
"""Audit A-grade cases (from cases-grade.json) -> legacy HTML richness -> inventory for curation."""
import json, os, re

ROOT = '/home/ubuntu/cool-uncle-legal'
g = json.load(open(f'{ROOT}/cases-grade.json'))

rows = []
for fname, meta in g.items():
    grade = meta.get('grade')
    score = meta.get('score')
    if grade != 'A':
        continue
    html = f'{ROOT}/{fname}'
    size = os.path.getsize(html) if os.path.exists(html) else 0
    # richness heuristics
    src = open(html, encoding='utf-8').read()
    def cnt(pat): return len(re.findall(pat, src))
    rows.append({
        'slug': re.sub(r'\.html$', '', fname),
        'grade': grade, 'score': score, 'release': meta.get('release'),
        'has_video': bool(meta.get('has_video')),
        'html_kb': round(size/1024, 1),
        'judicial': cnt(r'judicial|คำวินิจฉ'),
        'provisions': cnt(r'มาตรา'),
        'summary': cnt(r'สรุป|summary', ),
        'lessons': cnt(r'บทเรียน|lesson'),
        'verdict': cnt(r'วินิจฉ'),
    })

rows.sort(key=lambda r: -r['score'])
print(f'A-grade cases: {len(rows)}')
print(json.dumps(rows, ensure_ascii=False, indent=1)[:3000])
json.dump(rows, open('/home/ubuntu/cooluncle_rules/a_grade_inventory.json','w'), ensure_ascii=False, indent=1)

# release breakdown
rel = {}
for r in rows: rel[r['release']] = rel.get(r['release'],0)+1
print('\nrelease:', rel)
# median sizes
sizes = [r['html_kb'] for r in rows]
sizes.sort()
print('size p10/p50/p90:', sizes[len(sizes)//10], sizes[len(sizes)//2], sizes[9*len(sizes)//10])
