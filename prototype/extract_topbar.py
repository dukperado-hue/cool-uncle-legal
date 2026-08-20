import re

html = open('/home/ubuntu/cool-uncle-legal/news-index.html', encoding='utf-8').read()
i = html.find('<div class="topbar')
# find closing tag of this div (may contain nested divs)
depth = 0
j = i
while j < len(html):
    m1 = re.search(r'<div[^>]*>', html[j:])
    m2 = re.search(r'</div>', html[j:])
    if not m1 or not m2:
        break
    pos1 = j + m1.start()
    pos2 = j + m2.start()
    if pos1 < pos2:
        depth += 1
        j = pos1 + len(m1.group(0))
    else:
        depth -= 1
        j = pos2 + len(m2.group(0))
        if depth == 0:
            break
print(html[i:j])
