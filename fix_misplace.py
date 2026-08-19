import re
p='/home/ubuntu/seo_analysis/local_repo/news-index.html'
raw=open(p,encoding='utf-8').read()

def block_range(raw, tag):
    m=re.search(r'<div class="yr-page yr-page-%s" data-year="%s" data-page="0"[^>]*>'%(tag,tag), raw)
    if not m: return None,None
    start=m.start()
    # หา </div> ที่ depth=0
    depth=0; i=start
    while i<len(raw):
        o=raw.find('<div',i); c=raw.find('</div>',i)
        if o<0 and c<0: break
        if o<0 or (c>=0 and c<o):
            depth-=1; i=c+6
            if depth==0: return start, c+6
        else:
            depth+=1; i=o+4
    return start, len(raw)

# คัดลอก li เป๋อารักษออกจาก block 2527
s,e = block_range(raw,'2527')
blk = raw[s:e]
m_li = re.search(r'<li>.*?araksa-2523.*?</li>', blk, re.S)
assert m_li, 'araksa li not in 2527 block'
li = m_li.group(0) + '\n'
blk2 = blk.replace(m_li.group(0),'')
raw = raw[:s]+blk2+raw[e:]
# แทรกเข้า block 2523 (ก่อน </ul>)
s2,e2 = block_range(raw,'2523')
ul2 = raw.find('</ul>', s2)
raw = raw[:ul2]+li+raw[ul2:]

# ตรวจว่าปอื่น (2563,2562,2558) ใส่ตรงบล็อกถูกต้องไหม: 2563 เดิมมี Enrica Lexie → block 2563 มี 1; +1 = 2 ok
# ตรวจว่าแต่ละบล็อก 2523 มี 2 รายการแล้ว
s2,e2 = block_range(raw,'2523')
n = len(re.findall(r'<li>', raw[s2:e2]))
print('2523 block lis:', n, '(expect 2)')
open(p,'w',encoding='utf-8').write(raw)
print('fixed')
