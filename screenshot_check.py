"""Headless Chromium screenshot check for the disclaimer bar and video credits."""
import subprocess, time, os, sys

CHROME = "/usr/bin/chromium"
URL = "http://localhost:8901/constproc.html"
OUT = "/home/ubuntu/cool-uncle-legal/_check"
os.makedirs(OUT, exist_ok=True)


def screenshot(url, out, extra_args=None):
    args = [CHROME, "--headless", "--disable-gpu", "--no-sandbox",
            "--hide-scrollbars", "--window-size=1280,2400",
            "--virtual-time-budget=10000", f"--screenshot={out}"]
    if extra_args:
        args.extend(extra_args)
    args.append(url)
    r = subprocess.run(args, capture_output=True, text=True, timeout=60)
    print(r.returncode, r.stderr[-200:] if r.stderr else "")
    return os.path.exists(out)


ok1 = screenshot(URL, f"{OUT}/top.png",
                 ["--run-all-compositor-stages-before-draw", "--screenshot=notused"])
# simpler: single screenshot with --timeout
ok1 = screenshot(URL, f"{OUT}/full.png")
print("full page shot:", os.path.getsize(f"{OUT}/full.png") if os.path.exists(f"{OUT}/full.png") else "MISSING")
