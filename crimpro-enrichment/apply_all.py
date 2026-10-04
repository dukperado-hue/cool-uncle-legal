"""Applies all crimpro enrichment steps to codex-data.json. Run from a clean (git-checkout) file."""
import json,sys,os,re
sys.path.insert(0,os.environ['SPW'])
import buildnotes as B

P='codex-data.json'
d=json.load(open(P,encoding='utf-8'))
A=d['books']['crimpro']['articles']

def nid(art,seq):
    return 'lec-crimpro_'+art.replace('/','-').replace(' ','-')+'-'+str(seq)

# ---- step 1: lecture notes from lectures 1-9
out,_=B.build()
added=0
for o in out:
    a=A[o['article']]
    ln=a.setdefault('lectureNotes',[])
    seq=len(ln)+1
    while any(x['id']==nid(o['article'],seq) for x in ln): seq+=1
    ln.append({'id':nid(o['article'],seq),'topic':o['topic'],'text':o['text'],'source':o['source']})
    added+=1
print('lectureNotes added',added)

# optional later steps
for mod in ('step_titles','step_examples','step_levels'):
    try:
        m=__import__(mod)
    except ImportError:
        continue
    m.run(d,A)

open(P,'w',encoding='utf-8',newline='').write(json.dumps(d,ensure_ascii=False,separators=(',',':')))
print('written')
