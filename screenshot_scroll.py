"""Scroll constproc.html in headless Chromium, screenshot when a video credit is visible."""
import subprocess, os, sys

CHROME = "/usr/bin/chromium"
OUT = "/home/ubuntu/cool-uncle-legal/_check"
os.makedirs(OUT, exist_ok=True)

# Use --virtual-time with a script to scroll then screenshot isn't supported.
# Fallback: screenshot tall viewport sections by running with --window-size height and CSS scroll is
# not possible headless-only. Alternative: use chromium --dump-dom to confirm credit exists (done),
# and screenshot with a tall window (viewport height = 3000) to capture deeper content.
args = [CHROME, "--headless", "--disable-gpu", "--no-sandbox",
        "--window-size=1280,3000",
        "--virtual-time-budget=20000",
        "--run-all-compositor-stages-before-draw",
        "--screenshot=" + f"{OUT}/tall.png",
        "http://localhost:8901/constproc.html"]
r = subprocess.run(args, capture_output=True, text=True, timeout=120)
print(r.returncode, r.stderr[-200:] if r.stderr else "")
if os.path.exists(f"{OUT}/tall.png"):
    from PIL import Image
    im = Image.open(f"{OUT}/tall.png")
    print("size", im.size)
    # video section typically after lecture 1 expansion; capture a middle band
    w, h = im.size
    im.crop((0, 1200, w, 1900)).save(f"{OUT}/band1.png")
    print("done")
