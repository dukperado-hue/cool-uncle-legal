import json,re,collections,os
S=os.environ['SPW']
L=json.load(open(S+r"\real_lectures.json",encoding='utf-8'))
d=json.load(open('codex-data.json',encoding='utf-8'))
a=d['books']['crimpro']['articles']; keys=set(a)
pat=re.compile(r'(?:ม\.|มาตรา)\s*(\d+(?:/\d+)?(?:\s*(?:ทวิ|ตรี|จัตวา))?)')
srcnum=lambda s: (re.search(r'ครั้งที่ (\d)',s) or [None,None])[1]
have=collections.defaultdict(set)
for k,v in a.items():
    for n in v.get('lectureNotes',[]):
        s=n['source']
        if 'เฉลย' in s: have['exer'].add(k)
        else: have[srcnum(s)].add(k)
for l in L:
    c=collections.Counter(m.group(1).strip() for m in pat.finditer(l['text']))
    ks=[x for x in c if x in keys]
    miss=[x for x in ks if x not in have[str(l['n'])]]
    print(l['n'],'cited',len(ks),'covered',len(ks)-len(miss),'| missing(count):',' '.join(f"{x}({c[x]})" for x in sorted(miss,key=lambda z:(int(re.match(r'\d+',z)[0]),z))))
