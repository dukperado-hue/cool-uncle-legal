"""Robustly patch constcourt.html: add video credit after each lecture iframe.
The template line is unique; replace the '</iframe></div>' after the iframe attrs."""
p = "/home/ubuntu/cool-uncle-legal/constcourt.html"
src = open(p, encoding="utf-8").read()

anchor = 'allowfullscreen loading="lazy"></iframe></div>'
credit = '<div class="video-credit">📺 วิดีโอแนะนำเกี่ยวกับคดีนี้ — จากช่อง <a href="https://www.youtube.com/@CoolUncleLaw/videos" target="_blank" rel="noopener">Cool Uncle Law</a></div>'

n = src.count(anchor)
print("anchor count:", n)
replacement = anchor.replace("</iframe></div>", "</iframe>" + credit + "</div>")
new = src.replace(anchor, replacement)
open(p, "w", encoding="utf-8").write(new)
print("patched", n, "iframes")
