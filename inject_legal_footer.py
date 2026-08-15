"""Inject <script src="legal-footer.js"></script> before </body> in all HTML pages.

Skips bunkfai/* (separate app, has its own disclaimer area) and legal-footer.js itself.
Also injects legal-disclaimer.css link in pages without shared.css for the bar styling.
"""
import glob
import os

ROOT = "/home/ubuntu/cool-uncle-legal"
SNIPPET_JS = '<script src="legal-footer.js"></script>'
SNIPPET_CSS = '<link rel="stylesheet" href="legal-disclaimer.css">'

pages = [f for f in glob.glob(os.path.join(ROOT, "*.html")) if not f.endswith("article-index.html")]
changed_js = 0
changed_css = 0
errors = []
for path in pages:
    try:
        src = open(path, encoding="utf-8").read()
        new = src
        if SNIPPET_JS not in src:
            if "</body>" in src:
                new = src.replace("</body>", SNIPPET_JS + "\n</body>", 1)
            elif "</html>" in src:
                new = src.replace("</html>", SNIPPET_JS + "\n</html>", 1)
            else:
                new += "\n" + SNIPPET_JS
            changed_js += 1
        if "shared.css" not in src and SNIPPET_CSS not in src:
            # inject css link right before the js snippet we just added (last occurrence)
            idx = new.rfind(SNIPPET_JS)
            new = new[:idx] + SNIPPET_CSS + "\n" + new[idx:]
            changed_css += 1
        if new != src:
            open(path, "w", encoding="utf-8").write(new)
    except Exception as e:
        errors.append((os.path.basename(path), str(e)))

print(f"js injected in {changed_js} pages; css injected in {changed_css} pages; errors: {len(errors)}")
for e in errors:
    print(" ERR", e)
