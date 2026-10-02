"""crimgen ep1 — ม.1 นิยาม / ม.2 หลักความชอบด้วยกฎหมาย / ม.3 กฎหมายใหม่เป็นคุณ (manga mode)"""
import json
from _crimgen_common import apply_expr, has_sheet


def C(who, expr=None, x=50, h=78, shot="half", **k):
    d = {"who": who, "x": x, "y": 100, "h": h}
    if expr:
        d["expr"] = expr
    else:
        d["shot"] = shot
    d.update(k)
    return d


def S(text, who=None, size=30, t="speech", **k):
    b = {"t": t, "text": text, "size": size}
    if who:
        b["who"] = who
    b.update(k)
    return b


def P(bg, chars, bubbles=(), w=1, cap=None, **k):
    bubbles = list(bubbles)
    apply_expr(chars, bubbles, cast)
    for c in chars:
        if c.get("expr") in ("aim45", "aim_side", "worm", "run_away", "shove", "fall", "aim_bust", "worm2", "surrender", "cower"):
            c["h"] = min(c["h"], 78 if len(chars) > 1 else 86)   # ท่าแอคชั่นตัวเต็ม ใหญ่ได้
        elif c.get("expr") and not c.get("big"):
            c["h"] = min(c["h"], 54 if len(chars) > 1 else 66)
    if len(list(bubbles)) >= 2:
        for c in chars:
            if not c.get("expr") and not c.get("big"):
                c["h"] = min(c["h"], 60)
    bubbles = list(bubbles)
    for c_ in chars:  # chars ต้องเตี้ย เว้นหัวไว้ให้ bubble (กฎ: บนสุดของตัวละคร >= ~36% ของ panel)
        if not c_.get("expr") and not c_.get("big") and c_.get("shot") == "half":
            c_["h"] = min(c_["h"], 60 if len(chars) > 1 else 62)
    if len(bubbles) >= 2:  # shout ซ้อนกันบังหน้า -> ใช้ speech ธรรมดา
        for b in bubbles:
            if b.get("t") == "shout":
                b["t"] = "speech"
                b["size"] = min(b.get("size", 28), 27)
    d = {"bg": bg, "chars": chars, "bubbles": bubbles, "w": w}
    if cap:
        d["caption"] = cap
    d.update(k)
    return d


def R(h, panels, slant=0):
    d = {"h": h, "panels": panels}
    if slant:
        d["slant"] = slant
    return d


def OLD(v=0): return {"style": "oldcity", "v": v}
def FLAT(a="#fff"): return {"style": "flat", "c1": a}
def RAYS(a="#fff", b="#ffe14d", x=50, y=55, ang=6): return {"style": "rays", "c1": a, "c2": b, "x": x, "y": y, "a": ang}
def FOCUS(x=50, y=45): return {"style": "manga", "c1": "#fff", "c2": "#cfcfcf", "x": x, "y": y}
def HT(a="#fff", b="#c9c9c9", dot=14): return {"style": "halftone", "c1": a, "c2": b, "dot": dot}


def BOX(text, name, size=25, h=0.5):
    return R(h, [{"bg": FLAT("#fff"), "frame": "none", "bubbles": [{"t": "box", "name": name, "size": size, "text": text, "x": 3, "y": 10, "w": 94}]}])


def INFO(files, label):
    out = []
    for i, f in enumerate(files):
        out.append({"rows": [BOX(f"{label} — ผังสรุปจาก NotebookLM (หน้าเดียวจบ)", "ผังอธิบาย", 24, 0.22),
                             R(3, [{"bg": FLAT("#fff"), "chars": [], "frame": "heavy", "w": 1,
                                    "photo": {"file": "pics/toon/props/" + f, "fit": "contain", "pos": "50% 0%"}}])]})
    return out

def TH(n, title, secs, who="lw", expr="smug"):
    return {"kind": "explain", "badge_kind": "t", "badge": f"ทฤษฎี {n}", "title": title,
            "sections": [{"h": h, "c": c, "t": t} for h, c, t in secs],
            "char": {"who": who, "expr": expr} if has_sheet(cast[who]) else {"who": who, "shot": "half"}}


meta = {"id": "crimpro_001_content", "group": "content", "code": "crimpro", "style": "manga",
        "series": "วิธีพิจารณาความอาญาฉบับลุงคูล",
        "footer": "crimpro ตอนที่ 1 · พนักงานอัยการ · ป.วิ.อ. ม.2(5) · ม.28(1) · ม.120 · ม.140–143"}
cast = {"un": "uncle_wolf", "cp": "capy_prosecutor", "ct": "cat_narrator", "pf": "owl_professor",
        "gv": "tiger_governor", "yk": "meerkat_yokkrabat"}
pages = []

# ---- P1 ปก
pages.append({"rows": [R(1, [{
    "bg": RAYS("#fff", "#ffe14d", 50, 62, 6),
    "chars": [C("cp", None, 18, 66, shot="full", sticker=True, tilt=-3), C("un", None, 44, 74, shot="full", sticker=True, z=1),
              C("pf", None, 68, 52, shot="full", sticker=True), C("ct", None, 90, 36, shot="full", sticker=True, tilt=3)],
    "fx": [{"type": "sparkle", "x": 8, "y": 36, "s": 1.5}, {"type": "sparkle", "x": 92, "y": 32, "s": 1.3}],
    "bubbles": [{"t": "title", "text": "วิ.อาญา\nฉบับลุงคูล", "x": 4, "y": 4, "w": 92, "size": 86, "rot": -3},
                {"t": "label", "text": "ตอนที่ 1 · ใครคือ “พนักงานอัยการ”?", "x": 5, "y": 30, "w": 90, "size": 34, "rot": 2, "c": "#fff"}],
    "caption": "ตอนที่ 1 (เนื้อหา)  |  ลุงคูล · คาปิอัยการ · อาจารย์นกฮูก · แมวไทย"}])]})

# ---- P2 ห้องเรียน
pages.append({"rows": [
    BOX("ป.วิ.อ. ม.2(5): “พนักงานอัยการ” = เจ้าพนักงานผู้มีหน้าที่ฟ้องผู้ต้องหาต่อศาล", "ฉาก 1 · ห้องเรียน", 25),
    R(1.3, [
        P(HT("#eef7ff", "#bcdcff"), [C("pf", None, 50, 90, shot="half")],
          [S("วันนี้เริ่มจากคำเบสิก… “พนักงานอัยการ”", "pf")], w=1.1, cap="อาจารย์นกฮูก"),
        P(FOCUS(50, 50), [C("ct", None, 50, 90, shot="half")],
          [S("ทนายของแผ่นดิน ยืนฟ้องแทนรัฐใช่ไหมเมี้ยว?", "ct")], w=1, cap="แมวอธิบาย")], slant=30),
    R(1.3, [
        P(RAYS("#fff", "#fff3c4", 50, 55, 6), [C("cp", None, 50, 90, shot="half")],
          [S("แล้วต่างจากตำรวจยังไงครับ…", "cp")], w=1, cap="คาปิ"),
        P(HT("#fffbe0", "#ffe27a"), [C("un", None, 50, 90, shot="half")],
          [S("นั่นแหละ คำถามที่ต้องตอบให้ได้ในห้องสอบ", "un")], w=1.2, cap="ลุงคูล",
          stamps=[{"text": "ข้อสอบชอบ", "x": 50, "y": 86, "size": 52, "rot": -6}])], slant=-30)]})

# ---- P3 3 ด่านรับช่วง
pages.append({"rows": [
    BOX("กระบวนการยุติธรรมทางอาญา: ตำรวจ → อัยการ → ศาล (รับช่วงต่อกัน)", "ฉาก 2 · สามด่าน", 25),
    R(1.2, [
        P(HT("#fff2f2", "#ffc4c4"), [C("un", None, 50, 90, shot="half")],
          [S("ตำรวจ (พนักงานสอบสวน) = หาและรวบรวมพยานหลักฐาน", "un")], w=1.1, cap="ด่าน 1"),
        P(RAYS("#fff", "#dff5d8", 50, 55, 6), [C("cp", None, 50, 90, shot="half")],
          [S("อัยการ = กลั่นกรองสำนวน แล้วสั่งฟ้อง/ไม่ฟ้อง", "cp")], w=1.1, cap="ด่าน 2")], slant=30),
    R(1.2, [
        P(FOCUS(50, 50), [C("pf", None, 50, 90, shot="half")],
          [S("ศาล = ไต่สวนมูลฟ้อง และพิจารณาพิพากษา", "pf")], w=1.1, cap="ด่าน 3"),
        P(HT("#fff", "#d6d6d6"), [C("ct", None, 50, 90, shot="half")],
          [S("เหมือนวิ่งผลัด ส่งไม้ให้กัน… ห้ามทำไม้ตก เมี้ยว", "ct")], w=1.1, cap="แมวอธิบาย",
          stamps=[{"text": "Check & Balance", "x": 50, "y": 86, "size": 44, "rot": -4}])], slant=-30)]})

# ---- P3b ด่าน 1 ตำรวจ: ทำความเห็นส่งสำนวน (ม.140-142)
pages.append({"rows": [
    BOX("ด่าน 1 · ตำรวจ: สอบสวนเสร็จ พนักงานสอบสวนผู้รับผิดชอบต้อง “ทำความเห็น” ส่งอัยการ (ม.140–142)", "เล่ายาว 1/3 · ตำรวจ", 24),
    R(1.25, [
        P(HT("#fff2f2", "#ffc4c4"), [C("ct", None, 50, 90, shot="half")],
          [S("สอบสวนเสร็จ ตำรวจเก็บพยานหลักฐานมาเต็มแฟ้ม แต่ยังฟ้องเองไม่ได้นะ", "ct")], w=1.2, cap="แมวอธิบาย"),
        P(FOCUS(50, 50), [C("un", None, 50, 90, shot="half")],
          [S("ต้องทำ “ความเห็น” แนบสำนวนส่งอัยการ ไม่ใช่ตัดสินเอง", "un")], w=1.1, cap="ลุงคูล")], slant=30),
    R(1.25, [
        P(RAYS("#fff", "#dff5d8", 50, 55, 6), [C("ct", None, 50, 90, shot="half")],
          [S("ถ้ารู้ตัวคนทำ → ความเห็นคือ “ควรสั่งฟ้อง” หรือ “สั่งไม่ฟ้อง”", "ct")], w=1.3, cap="รู้ตัวผู้กระทำผิด"),
        P(HT("#eef7ff", "#bcdcff"), [C("cp", None, 50, 90, shot="half")],
          [S("แล้วถ้าไม่รู้ว่าใครทำล่ะครับ?", "cp")], w=1, cap="คาปิ")], slant=-30),
    R(1.25, [
        P(HT("#fffbe0", "#ffe27a"), [C("ct", None, 50, 90, shot="half")],
          [S("โทษจำคุกไม่เกิน 3 ปี → งดสอบสวนแล้วส่งอัยการ", "ct")], w=1.2, cap="ไม่รู้ตัว · ไม่เกิน 3 ปี"),
        P(FOCUS(50, 50), [C("un", None, 50, 90, shot="half")],
          [S("เกิน 3 ปี → ส่งสำนวนพร้อมความเห็นว่าควรงดสอบสวน ให้อัยการสั่ง", "un")], w=1.3, cap="ไม่รู้ตัว · เกิน 3 ปี")], slant=30)]})

# ---- P3c ด่าน 2 อัยการ: ม.143 + ถ่วงดุล ม.145
pages.append({"rows": [
    BOX("ด่าน 2 · อัยการ (ม.143): สั่งฟ้อง · สั่งไม่ฟ้อง · สั่งสอบสวนเพิ่ม · เรียกพยานมาซักถาม — แต่สอบสวนผู้ต้องหาเองไม่ได้", "เล่ายาว 2/3 · อัยการ", 24),
    R(1.25, [
        P(RAYS("#fff", "#dff5d8", 50, 55, 6), [C("cp", None, 50, 90, shot="half")],
          [S("ได้สำนวนแล้ว ผมมีสี่ทางเลือกครับ!", "cp", t="shout", size=28)], w=1.1, cap="คาปิ"),
        P(HT("#fffbe0", "#ffe27a"), [C("ct", None, 50, 90, shot="half")],
          [S("① สั่งฟ้อง ② สั่งไม่ฟ้อง ③ สั่งสอบเพิ่ม ④ เรียกพยานมาถามเอง", "ct")], w=1.4, cap="แมวอธิบาย")], slant=30),
    R(1.25, [
        P(HT("#fff2f2", "#ffc4c4"), [C("cp", None, 50, 90, shot="half")],
          [S("งั้นผมขอสอบปากคำผู้ต้องหาเองเลย…", "cp")], w=1, cap="คาปิ"),
        P(FOCUS(50, 50), [C("un", None, 50, 90, shot="half")],
          [S("ห้าม! เรียกมาซักถามได้แต่ “พยานอื่น” ผู้ต้องหาอัยการสอบเองไม่ได้", "un", t="shout", size=28)], w=1.3, cap="ลุงคูล")], slant=-30),
    R(1.25, [
        P(HT("#eef7ff", "#bcdcff"), [C("ct", None, 50, 90, shot="half")],
          [S("ถ้าอัยการสั่งไม่ฟ้อง ก็ไม่จบเลยนะ ต้องมีคนตรวจซ้ำ (ม.145)", "ct")], w=1.3, cap="ถ่วงดุลคำสั่งไม่ฟ้อง"),
        P(RAYS("#fff", "#ffe14d", 50, 58, 6), [C("un", None, 50, 90, shot="half")],
          [S("ส่ง ผบ.ตร. (กทม.) / ผู้ว่าฯ (ต่างจังหวัด) ถ้าแย้ง → อัยการสูงสุดชี้ขาด", "un")], w=1.4, cap="ลุงคูล")], slant=30)]})

# ---- P3d ด่าน 3 ศาล: ไต่สวนมูลฟ้อง (ม.162)
pages.append({"rows": [
    BOX("ด่าน 3 · ศาล (ม.162): อัยการฟ้อง → ศาลไม่จำเป็นต้องไต่สวนมูลฟ้อง · ราษฎรฟ้องเอง → ศาลต้องไต่สวนมูลฟ้องเสมอ", "เล่ายาว 3/3 · ศาล", 24),
    R(1.25, [
        P(HT("#eef7ff", "#bcdcff"), [C("ct", None, 50, 90, shot="half")],
          [S("คดีที่อัยการฟ้อง ผ่านตำรวจ+อัยการมาแล้ว ศาลไม่ต้องไต่สวนมูลฟ้องนะ", "ct")], w=1.3, cap="อัยการเป็นโจทก์"),
        P(FOCUS(50, 50), [C("cp", None, 50, 90, shot="half")],
          [S("ส่วนราษฎรฟ้องเองล่ะครับ?", "cp")], w=1, cap="คาปิ")], slant=30),
    R(1.25, [
        P(HT("#fff2f2", "#ffc4c4"), [C("un", None, 50, 90, shot="half")],
          [S("ศาลต้องไต่สวนมูลฟ้องเสมอ กรองคดีกลั่นแกล้งออกก่อน", "un")], w=1.2, cap="ราษฎรเป็นโจทก์"),
        P(RAYS("#fff", "#dff5d8", 50, 55, 6), [C("ct", None, 50, 90, shot="half")],
          [S("มีมูล → “ประทับฟ้อง” · ไม่มีมูล → “ยกฟ้อง”", "ct")], w=1.2, cap="ผลของการไต่สวน")], slant=-30),
    R(1.25, [
        P(HT("#fffbe0", "#ffe27a"), [C("pf", None, 50, 90, shot="half")],
          [S("สามด่านนี้แหละ ระบบ Check & Balance ของวิ.อาญา", "pf")], w=1.2, cap="อาจารย์นกฮูกสรุป"),
        P(HT("#fff", "#d6d6d6"), [C("ct", None, 50, 90, shot="half")],
          [S("ตำรวจเสนอ → อัยการกรอง → ศาลตัดสิน … ไม้ผลัดไม่ตก เมี้ยว", "ct")], w=1.3, cap="แมวสรุป")], slant=30)]})

# ---- P4 ย้อนอดีต ยกกระบัตร
pages.append({"rows": [
    BOX("สมัยกรุงศรีอยุธยา: “ยกกระบัตร” ผู้ตรวจการเมือง คอยถ่วงดุลเจ้าเมือง", "ฉาก 3 · ย้อนอดีต", 25),
    R(1.4, [
        P(OLD(1), [C("gv", None, 50, 90, shot="half")],
          [S("ข้าจะตัดสินคดีนี้เอง!", "gv", t="shout", size=30)], w=1.1, cap="เจ้าเมือง",
          fx=[{"type": "anger", "x": 14, "y": 22, "s": 1.0}]),
        P(OLD(2), [C("yk", None, 50, 90, shot="half")],
          [S("ช้าก่อนขอรับ! ต้องตรวจพยานหลักฐานให้ถูกต้องตามกฎหมาย", "yk")], w=1.2, cap="ยกกระบัตร")], slant=30),
    R(1.2, [
        P(OLD(3), [C("cp", None, 28, 80, shot="half"), C("un", None, 74, 86, shot="half")],
          [S("สมัยนั้นก็มีอัยการแล้วเหรอ?", "cp"), S("ใกล้เคียงที่สุดคือยกกระบัตรนี่แหละ", "un")], w=1.6, cap="โทนซีเปีย"),
        P(OLD(0), [C("gv", None, 50, 90, shot="half")],
          [S("(ใครให้เจ้ามาขัดข้า…)", "gv", t="thought")], w=1)], slant=-30)]})

# ---- P5 กรมอัยการ
pages.append({"rows": [
    BOX("ร.ศ. 112 (พ.ศ. 2436) รัชกาลที่ 5 ทรงตั้ง “กรมอัยการ” — จากผู้ตรวจการเมือง สู่ “ทนายแผ่นดิน”", "ฉาก 4 · กรมอัยการ", 25),
    R(1.3, [
        P(RAYS("#fff", "#ffe14d", 50, 60, 6), [C("yk", None, 50, 90, shot="half")],
          [S("ข้าก็ได้เลื่อนขั้นเป็นกรมแล้ว!", "yk")], w=1, cap="ยกกระบัตร",
          stamps=[{"text": "พ.ศ. 2436", "x": 50, "y": 86, "size": 56, "rot": -6}]),
        P(HT("#eef7ff", "#bcdcff"), [C("ct", None, 50, 90, shot="half")],
          [S("งั้นอัยการก็คือยกกระบัตรยุคใหม่สินะ เมี้ยว?", "ct")], w=1.1, cap="แมวอธิบาย")], slant=30),
    R(1.3, [
        P(FOCUS(50, 50), [C("un", None, 50, 90, shot="half")],
          [S("ประวัติศาสตร์ให้เห็นพัฒนาการ… แต่ข้อสอบต้องตอบตาม “ตัวบทปัจจุบัน”!", "un", t="shout", size=28)], w=1.5, cap="ลุงคูล",
          stamps=[{"text": "ดูตัวบท", "x": 50, "y": 86, "size": 52, "rot": -6}]),
        P(HT("#fff", "#d6d6d6"), [C("cp", None, 50, 90, shot="half")],
          [S("จดแล้วครับ ตัวบทปัจจุบัน!", "cp")], w=1)], slant=-30)]})

# ---- P6 ม.2(5) + ม.28(1)
pages.append({"rows": [
    BOX("ม.2(5) พนักงานอัยการ = เจ้าพนักงานผู้มีหน้าที่ฟ้องผู้ต้องหาต่อศาล (ข้าราชการกรมอัยการ หรือเจ้าพนักงานอื่นที่มีอำนาจฟ้องคดีอาญาเพื่อรัฐ) · ม.28(1) ผู้มีอำนาจฟ้องคดีอาญา = พนักงานอัยการ (อีกคนคือ (2) ผู้เสียหาย)", "ฉาก 5 · เปิดตัวบท", 24),
    R(1.3, [
        P(HT("#eef7ff", "#bcdcff"), [C("pf", None, 50, 90, shot="half")],
          [S("ถ้าเปิดตัวบท พนักงานอัยการหมายถึงใคร?", "pf")], w=1, cap="อาจารย์นกฮูก"),
        P(RAYS("#fff", "#dff5d8", 50, 55, 6), [C("cp", None, 50, 90, shot="half")],
          [S("เจ้าพนักงานผู้มีหน้าที่ฟ้องผู้ต้องหาต่อศาลครับ!", "cp", t="shout", size=28)], w=1.2, cap="คาปิ")], slant=30),
    R(1.2, [
        P(HT("#fffbe0", "#ffe27a"), [C("pf", None, 50, 90, shot="half")],
          [S("ถูก! และรวมเจ้าพนักงานอื่นที่มีอำนาจฟ้องเพื่อรัฐด้วย", "pf")], w=1.2,
          stamps=[{"text": "ถูกต้อง!", "x": 50, "y": 86, "size": 56, "rot": -6}]),
        P(FOCUS(50, 50), [C("ct", None, 50, 90, shot="half")],
          [S("ผู้เสียหายก็ฟ้องเองได้ตาม ม.28(2) นะเมี้ยว", "ct")], w=1, cap="แมวอธิบาย")], slant=-30)]})

# ---- P7 ม.120 + สรุป
pages.append({"rows": [
    BOX("ม.120: ห้ามพนักงานอัยการยื่นฟ้องคดีใดต่อศาล โดยมิได้มีการสอบสวนในความผิดนั้นก่อน · ม.140–143: คำสั่งฟ้อง/ไม่ฟ้อง", "ฉาก 6 · เงื่อนไขก่อนฟ้อง", 24),
    R(1.3, [
        P(HT("#fff2f2", "#ffc4c4"), [C("cp", None, 50, 90, shot="half")],
          [S("ฟ้องเลยไม่ต้องรอสอบสวนได้ไหมครับ!?", "cp", t="shout", size=28)], w=1.1, cap="คาปิ"),
        P(FOCUS(50, 50), [C("un", None, 50, 90, shot="half")],
          [S("ห้าม! ไม่มีการสอบสวน = ฟ้องไม่ได้ (ม.120)", "un", t="shout", size=28)], w=1.2, cap="ลุงคูล",
          stamps=[{"text": "ห้ามข้ามสอบสวน", "x": 50, "y": 86, "size": 46, "rot": -5}])], slant=30),
    R(1.3, [
        P(RAYS("#fff", "#ffe14d", 50, 58, 6), [C("un", None, 50, 90, shot="half")],
          [S("จำ 3 สเต็ป: ตำรวจสอบสวน → อัยการกลั่นกรอง+ฟ้อง → ศาลพิพากษา", "un")], w=1.5, cap="สรุปลุงคูล"),
        P(HT("#eef7ff", "#bcdcff"), [C("ct", None, 50, 90, shot="half")],
          [S("อัยการไม่ได้สอบสวนเองตั้งแต่แรก แต่คอยกรองสำนวน เมี้ยว", "ct")], w=1.1, cap="แมวอธิบาย")], slant=-30)]})

import math


def autobox(pg):
    rows = pg.get("rows", [])
    if len(rows) < 2:
        return
    r0 = rows[0]
    if len(r0["panels"]) != 1 or r0["panels"][0].get("chars") or not r0["panels"][0].get("bubbles") or r0["panels"][0]["bubbles"][0].get("t") != "box":
        return
    b = r0["panels"][0]["bubbles"][0]
    per = 0.94 * 1000 / (b.get("size", 25) * 0.56) - 4
    lines = sum(max(1, math.ceil(len(x) / per)) for x in b["text"].split("\n"))
    px = 40 + lines * b.get("size", 25) * 1.4 + 14
    others = sum(r.get("h", 1) for r in rows[1:])
    r0["h"] = round(px * others / max(200, 1258 - px - 16 * (len(rows) - 1)), 3)


for pg in pages:
    autobox(pg)

json.dump({"meta": meta, "cast": cast, "pages": pages}, open("episodes/crimpro_001_content.comic.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("pages", len(pages))
