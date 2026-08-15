"""Add video owner credits on coolunclelab.com pages with videos.

1. index.html: after "📺 ติดตามช่องของเรา" heading area add credit line.
2. subject-hub-template.html: after "📺 แนะนำวิดีโอเสริมเรียน" heading add credit line.
3. constproc, crimpro, iplaw, constcourt: append credit after the iframe render
   (edit the JS render template string that builds the video block).
4. legalphil: static video-frame blocks — add credit after the section heading.
Credit line: "📺 วิดีโอแนะนำเกี่ยวกับคดีนี้ — จากช่อง Cool Uncle Law (youtube.com/@CoolUncleLaw)"
"""
import re

ROOT = "/home/ubuntu/cool-uncle-legal"
CREDIT_HTML = (
    '<div class="video-credit" style="margin:4px 0 10px 0;font-size:12px;color:#8a6d3b;'
    "font-style:italic\">📺 วิดีโอแนะนำเกี่ยวกับคดีนี้ — จากช่อง "
    '<a href="https://www.youtube.com/@CoolUncleLaw/videos" target="_blank" rel="noopener" '
    'style="color:#b45309;font-weight:600">Cool Uncle Law (youtube.com/@CoolUncleLaw)</a></div>'
)


def patch(path, find, replace, count=None):
    src = open(path, encoding="utf-8").read()
    n = src.count(find)
    print(f"{path}: found {n}")
    if n == 0:
        return False
    new = src.replace(find, replace) if count is None else src.replace(find, replace, count)
    open(path, "w", encoding="utf-8").write(new)
    return True


# 1. index.html
p = f"{ROOT}/index.html"
old = '<h3>📺 ติดตามช่องของเรา</h3>'
new = '<h3>📺 ติดตามช่องของเรา</h3>' + CREDIT_HTML
patch(p, old, new)

# 2. subject-hub-template.html
p = f"{ROOT}/subject-hub-template.html"
old = '<h3>📺 แนะนำวิดีโอเสริมเรียน</h3>'
new = '<h3>📺 แนะนำวิดีโอเสริมเรียน</h3>' + CREDIT_HTML
patch(p, old, new, count=1)

# 3. Lecture-page render templates — insert credit div after the closing </div></div> of the video frame.
# constproc.html
p = f"{ROOT}/constproc.html"
old = 'allowfullscreen loading="lazy"></iframe></div></div>` : \'\''
new = 'allowfullscreen loading="lazy"></iframe></div><div class="video-credit">📺 วิดีโอแนะนำเกี่ยวกับคดีนี้ — จากช่อง <a href="https://www.youtube.com/@CoolUncleLaw/videos" target="_blank" rel="noopener">Cool Uncle Law</a></div></div>` : \'\''
patch(p, old, new)

# crimpro.html
p = f"{ROOT}/crimpro.html"
old = 'allowfullscreen loading="lazy"></iframe></div></div>` : \'\''
new = 'allowfullscreen loading="lazy"></iframe></div><div class="video-credit">📺 วิดีโอแนะนำเกี่ยวกับคดีนี้ — จากช่อง <a href="https://www.youtube.com/@CoolUncleLaw/videos" target="_blank" rel="noopener">Cool Uncle Law</a></div></div>` : \'\''
patch(p, old, new)

# iplaw.html
p = f"{ROOT}/iplaw.html"
old = 'allowfullscreen loading="lazy"></iframe></div></div>` : \'\''
new = 'allowfullscreen loading="lazy"></iframe></div><div class="video-credit">📺 วิดีโอแนะนำเกี่ยวกับคดีนี้ — จากช่อง <a href="https://www.youtube.com/@CoolUncleLaw/videos" target="_blank" rel="noopener">Cool Uncle Law</a></div></div>` : \'\''
patch(p, old, new)

# constcourt.html (template differs: iframe src uses ${id})
p = f"{ROOT}/constcourt.html"
m = re.search(r'iframe src="https://www\.youtube\.com/embed/\$\{id\}"[^>]*>(.*?)</iframe>', open(p, encoding="utf-8").read(), re.S)
print("constcourt iframe tail:", m.group(1)[-40:] if m else None)
if m:
    tail = m.group(1)[-30:]
    old = '</iframe>' + tail
    new = '</iframe>' + tail.replace('</div></div>', '</div><div class="video-credit">📺 วิดีโอแนะนำเกี่ยวกับคดีนี้ — จากช่อง <a href="https://www.youtube.com/@CoolUncleLaw/videos" target="_blank" rel="noopener">Cool Uncle Law</a></div></div>')
    patch(p, old, new)

# legalphil.html — credit after the 🎬 heading
p = f"{ROOT}/legalphil.html"
old = '<h1>🎬 วิดีโอบรรยายประกอบ</h1>'
new = '<h1>🎬 วิดีโอบรรยายประกอบ</h1>' + CREDIT_HTML
patch(p, old, new)

print("DONE")
