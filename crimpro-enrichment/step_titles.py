import json,os
S=os.environ['SPW']
def load():
    t={}
    for f in ('titles1.json','titles2.json','titles3.json'):
        t.update(json.load(open(S+'/'+f,encoding='utf-8')))
    return t
def run(d,A):
    t=load(); n=0
    for k,v in A.items():
        if k in t: v['articleTitle']=t[k]; n+=1
    print('articleTitle set',n)
