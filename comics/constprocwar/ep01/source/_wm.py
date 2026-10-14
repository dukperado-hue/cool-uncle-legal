"""helpers สำหรับการ์ตูน War Mode (ตัวละครจาก pics/game/character-sheets ชุดเดียวกับ crimgen)
ใช้: from _wm import *  แล้วเรียก cover/why/story/grid/sample/memo/build  (ดูตัวอย่าง _gen_crimprowar_002.py)"""
from _cch2 import *
import _cch

cast.update({"ct": "courtroom_cat", "lw": "defense_lawyer", "pr": "prosecutor", "jd": "judge",
             "bs": "crime_boss", "bk": "biker_gunman", "dl": "delinquent", "mm": "muscular_man",
             "wf": "wife", "hb": "husband", "sc": "elegant_socialite", "dv": "driver", "hg": "hero_girl",
             "ru": "rural_uncle", "rus": "rural_uncle_sad", "dla": "delinquent_angry", "lws": "defense_lawyer_sad", "cs": "civil_servant", "ld": "landlord", "tn": "tenant", "ew": "elderly_woman",
             "dr": "doctor", "ea": "estate_agent", "em": "employee", "ep": "employer", "mt": "male_teen",
             "ft": "female_teen", "fi": "female_influencer", "cl": "court_clerk", "ce": "comedian_uncle",
             "bg": "armored_bodyguard", "pl": "plaintiff_lawyer", "dg": "dog_golden", "mk": "monk"})

_BG = [lambda: HT("#eef7ff", "#bcdcff"), lambda: FOCUS(50, 50), lambda: HT("#fff2f2", "#ffc4c4"),
       lambda: RAYS("#fff", "#fff3c4", 50, 55, 6), lambda: HT("#fffbe0", "#ffe27a"), lambda: RAYS("#fff", "#dff5d8", 50, 55, 6)]


def _size(text, wide):
    n = len(text)
    lim = (150, 110, 85, 65) if wide else (95, 75, 58, 44)
    sizes = (27, 25, 23, 21) if wide else (28, 26, 24, 22)
    for l, s in zip(lim, sizes):
        if n <= l:
            return s
    return 20


def cover(big, tag, whos, caption, subject="วิ.อาญา"):
    """whos: list of (who, x, h) — ตัวละครบนปก (sticker)"""
    chars = [C(w, None, x, h, shot="full", sticker=True, tilt=t) for (w, x, h), t in zip(whos, (-3, 0, 2, -2, 3, 0))]
    return {"rows": [R(1, [{
        "bg": RAYS("#fff", "#ff9d8a", 50, 62, 6), "chars": chars,
        "fx": [{"type": "sparkle", "x": 8, "y": 36, "s": 1.5}, {"type": "burst", "x": 92, "y": 30, "s": 1.3}],
        "bubbles": [{"t": "title", "text": "⚔️ WAR MODE\n" + subject, "x": 4, "y": 4, "w": 92, "size": 84, "rot": -3},
                    {"t": "label", "text": tag, "x": 5, "y": 30, "w": 90, "size": 30, "rot": 2, "c": "#fff"}],
        "caption": caption}])]}


def grid(box, name, beats, boxsize=21, boxh=None):
    """box = ข้อความกล่องบนสุด; beats = [(who, text, cap[, expr])] วางทีละ 2 ช่อง (ช่องสุดท้ายเดี่ยวถ้าคี่)"""
    n = len(box or "")
    auto = 24 if n <= 220 else 22 if n <= 320 else 20 if n <= 430 else 18 if n <= 560 else 17
    rows = [BOX(box, name, max(boxsize, auto))] if box else []
    i, k = 0, 0
    while i < len(beats):
        two = i + 1 < len(beats)
        group = beats[i:i + 2] if two else beats[i:i + 1]
        ps = []
        for b in group:
            who, text, cap = b[0], b[1], b[2]
            expr = b[3] if len(b) > 3 else None
            ps.append(P(_BG[k % len(_BG)](), [C(who, expr, 50, 90 if not expr else 62, shot="half")],
                        [S(text, who, _size(text, not two))], w=1.3 if two else 1.5, cap=cap))
            k += 1
        rows.append(R(1.3 if two else 1.2, ps, slant=(30 if (i // 2) % 2 == 0 else -30) if two else 0))
        i += 2
    return {"rows": rows}


def sample(title, issue, rules, concl, who="pr", badge="เฉลยตัวอย่าง"):
    """หน้าตัวอย่างวิธีเขียนตอบ (ประเด็น → หลัก+วินิจฉัย → สรุป)"""
    secs = [("ประเด็น", "#7a3cff", issue)] + [(h, c, t) for h, c, t in rules] + [("สรุป", "#2a9d3c", concl)]
    pg = TH("", title, secs, who=who, expr="smug")
    pg["badge"] = badge
    return pg


def memo(title, traps, laws, who="lw"):
    secs = [("กับดัก", "#e0254a", traps)] + [(h, c, t) for h, c, t in laws]
    pg = TH("", title, secs, who=who, expr="smug")
    pg["badge"] = "สรุปท้ายตอน"
    return pg


def build(n, title, footer_tail, pages, code="crimprowar", subject="วิ.อาญา", label="crimpro"):
    meta = {"id": f"{code}_{n:03d}_content", "group": "content", "code": code, "style": "manga",
            "series": f"{subject} War Mode ฉบับลุงคูล",
            "footer": f"{label} War Mode ตอนที่ {n} · {title} · {footer_tail}"}
    FINISH(meta, pages, f"episodes/{code}_{n:03d}_content.comic.json")
