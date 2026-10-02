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


meta = {"id": "crimpro_003_content", "group": "content", "code": "crimpro", "style": "manga",
        "series": "วิธีพิจารณาความอาญาฉบับลุงคูล",
        "footer": "crimpro ตอนที่ 3 · สืบสวน-สอบสวน · เขตอำนาจสอบสวน (ม.16, 18–21)"}
cast = {"un": "uncle_wolf", "cp": "capy_prosecutor", "ct": "cat_narrator", "pf": "owl_professor",
        "gk": "golden_kid", "cu": "culprit_black", "as": "alsatian_cop", "rt": "rottweiler_cop",
        "cone": "props_crime", "gun": "props_crime", "bag": "props_crime", "cuff": "props_crime"}
pages = []

# ---- P1 ปก
pages.append({"rows": [R(1, [{
    "bg": RAYS("#fff", "#ffe14d", 50, 62, 6),
    "chars": [C("as", None, 18, 54, shot="full", sticker=True, tilt=-3), C("rt", None, 44, 50, shot="full", sticker=True, z=1),
              C("ct", None, 70, 46, shot="full", sticker=True), C("cu", None, 91, 38, shot="full", sticker=True, tilt=4, view=2)],
    "fx": [{"type": "sparkle", "x": 8, "y": 36, "s": 1.5}, {"type": "sparkle", "x": 92, "y": 30, "s": 1.3}],
    "bubbles": [{"t": "title", "text": "วิ.อาญา\nฉบับลุงคูล", "x": 4, "y": 4, "w": 92, "size": 86, "rot": -3},
                {"t": "label", "text": "ตอนที่ 3 · ตำรวจท้องที่ไหนมีอำนาจ?", "x": 5, "y": 30, "w": 90, "size": 34, "rot": 2, "c": "#fff"}],
    "caption": "ตอนที่ 3 (เนื้อหา)  |  ตำรวจคู่หู · แมวอธิบาย · ฮันนินซัง"}])]})

# ---- P2 สืบสวน vs สอบสวน
pages.append({"rows": [
    BOX("สืบสวน (ม.16) = ป้องกัน/หาข้อเท็จจริงเบื้องต้น ทำได้ทั่วราชอาณาจักร 24 ชม. · สอบสวน = รวบรวมพยานหลักฐานหลังรู้ตัวผู้กระทำ จำกัดเขตท้องที่", "ฉาก 1 · สืบสวน vs สอบสวน", 23),
    R(1.3, [
        P(HT("#eef7ff", "#bcdcff"), [C("as", None, 50, 90, shot="half")],
          [S("ผมเป็น “พนักงานสอบสวน” ครับ กฎหมายให้อำนาจทำสำนวนในเขตของผม", "as")], w=1.3, cap="ตำรวจนายพันธุ์"),
        P(RAYS("#fff", "#fff3c4", 50, 55, 6), [C("rt", None, 50, 90, shot="half")],
          [S("ส่วนผมสืบสวนได้ทั่วประเทศ… แต่ผมสอบสวนเองไม่ได้ ฮือ (กินโดนัท)", "rt")], w=1.3, cap="ตำรวจนายล่ำ")], slant=30),
    R(1.3, [
        P(HT("#fff2f2", "#ffc4c4"), [C("rt", None, 28, 80, shot="half"), C("cu", "sneer", 74, 62)],
          [S("เห็นคนร้ายต่อหน้าแล้วเดินผ่านเฉย ๆ", "rt"), S("ฮึๆ ขอบใจนะ", "cu")], w=1.5, cap="เพิกเฉย = ผิด ม.157 ป.อ."),
        P(FOCUS(50, 50), [C("ct", None, 50, 90, shot="half")],
          [S("ตำรวจเห็นความผิดซึ่งหน้าแล้วเพิกเฉย อาจผิดฐานละเว้นตาม ป.อ. ม.157", "ct")], w=1.3, cap="แมวอธิบาย")], slant=-30)]})

# ---- P3 ม.18 ท้องที่เดียว (ภาพเดียวเล่ายาว + ของประกอบฉาก)
pages.append({"rows": [
    BOX("ม.18 ความผิดเกิดท้องที่เดียว: กรุงเทพฯ = ตำรวจนครบาล · ต่างจังหวัด = ตำรวจภูธร ท้องที่ที่ความผิดเกิด (หรือที่พบ/ที่จับ ตามตัวบท) สอบสวนได้", "ฉาก 2 · เหตุเกิดที่เดียว", 23),
    R(3, [P(RAYS("#fff", "#dfe9ff", 50, 70, 6),
            [C("as", None, 18, 66, shot="full"), C("rt", None, 42, 58, shot="full"),
             C("cone", None, 66, 26, shot="full", view=0), C("bag", None, 80, 22, shot="full", view=2), C("gun", None, 92, 18, shot="full", view=1)],
            [S("เหตุเกิดในเขตผม ผมสอบสวนเอง ม.18 ครับ", "as"),
             S("กรุงเทพฯ = นครบาล ต่างจังหวัด = ภูธรนะครับ!", "rt", t="shout", size=28)],
            w=1, cap="กรวย · ถุงหลักฐาน · ปืน — ที่เกิดเหตุ = ท้องที่ของ พงส.")])]})

# ---- P4 ม.19 หลายท้องที่ (คนร้ายวิ่ง)
pages.append({"rows": [
    BOX("ม.19 เกี่ยวพันหลายท้องที่ (ไม่แน่ใจที่เกิดเหตุ · ต่อเนื่องหลายท้องที่ · เกิดระหว่างเดินทาง ม.19(5)-(6)) → พนักงานสอบสวนทุกท้องที่ที่เกี่ยวข้องมีอำนาจร่วมกัน", "ฉาก 3 · หลายท้องที่", 23),
    R(1.2, [
        P(HT("#fff2f2", "#ffc4c4"), [C("cu", "scheme", 50, 62)],
          [S("ขโมยแล้วหนีข้ามอำเภอ ข้ามจังหวัด~", "cu")], w=1, cap="ฮันนินซัง"),
        P(RAYS("#fff", "#fff3c4", 50, 55, 6), [C("as", None, 50, 90, shot="half")],
          [S("ไม่รู้ว่าเกิดเหตุที่ไหนแน่? ทุกท้องที่ที่เกี่ยวข้องสอบสวนได้ครับ", "as")], w=1.3, cap="ม.19")], slant=30),
    R(1.2, [
        P(HT("#eef7ff", "#bcdcff"), [C("rt", None, 50, 90, shot="half")],
          [S("แปลว่าผมกับเพื่อนอีกสิบโรงพัก ต่างมีอำนาจ… ใครจะทำสำนวน?", "rt")], w=1.3, cap="ตำรวจนายล่ำ"),
        P(FOCUS(50, 50), [C("ct", None, 50, 90, shot="half")],
          [S("จับตัวได้แล้ว → ท้องที่ที่จับได้ก่อนรับผิดชอบ · ยังจับไม่ได้ → ท้องที่ที่พบก่อน", "ct")], w=1.5, cap="แมวอธิบาย")], slant=-30)]})

# ---- P5 คดีรถไฟ ตอน 1 (ภาพเดียวเล่ายาว)
pages.append({"rows": [
    BOX("กรณีศึกษา “คดีบนรถไฟ” (ข่าวจริงที่อาจารย์ยกสอน ไม่ใช่เลขฎีกา): ผู้เสียหายหญิงถูกล่วงละเมิดบนรถไฟตู้นอน กรุงเทพฯ → หาดใหญ่ แจ้งความระหว่างทางไม่ได้", "ฉาก 4 · คดีบนรถไฟ (1)", 22),
    R(3, [P({"style": "train", "v": 0},
            [C("ct", None, 24, 70, shot="full"), C("as", None, 76, 70, shot="full")],
            [S("รถไฟตู้นอนจากกรุงเทพฯ ไปหาดใหญ่ กลางดึก… ผู้เสียหายลงแจ้งความกลางทางไม่ได้", "ct"),
             S("แจ้งความกลางทางไม่ได้… ต้องรอไปถึงปลายทางก่อนครับ", "as")],
            w=1, cap="ตอนที่ 1 — ลงไม่ได้ต้องนั่งต่อ")])]})

# ---- P6 คดีรถไฟ ตอน 2: ตำรวจหาดใหญ่ปัด
pages.append({"rows": [
    BOX("ตำรวจปลายทางปฏิเสธรับแจ้งความ อ้างว่าไม่ใช่เขตตน → ไม่ชอบ! ม.19(5)-(6): ทุกท้องที่ต้นทาง ระหว่างทาง ปลายทาง มีอำนาจสอบสวนร่วมกัน", "ฉาก 5 · คดีบนรถไฟ (2)", 23),
    R(1.3, [
        P(HT("#fff2f2", "#ffc4c4"), [C("rt", None, 50, 90, shot="half")],
          [S("ขอโทษครับ ไม่ใช่เขตผม ไปแจ้งที่อื่นนะ", "rt")], w=1.1, cap="ตำรวจปลายทาง",
          stamps=[{"text": "เขตนี้ไม่รับ", "x": 50, "y": 62, "size": 44, "rot": -5}]),
        P(RAYS("#fff", "#dff5d8", 50, 55, 6), [C("as", None, 50, 90, shot="half")],
          [S("ปฏิเสธไม่ได้ครับ! ม.19(5)-(6) ปลายทางก็มีอำนาจ", "as", t="shout", size=28)], w=1.2, cap="ตำรวจนายพันธุ์")], slant=30),
    R(1.3, [
        P(HT("#fffbe0", "#ffe27a"), [C("ct", None, 50, 90, shot="half")],
          [S("จับตัวได้แล้ว → ท้องที่ที่จับได้ก่อนรับผิดชอบสำนวน", "ct")], w=1.2, cap="จับได้แล้ว"),
        P(FOCUS(50, 50), [C("un", None, 50, 90, shot="half")],
          [S("ยังจับไม่ได้ → ท้องที่ที่มีการแจ้งความ/พบก่อน ทำไปพลาง", "un")], w=1.2, cap="ลุงคูล")], slant=-30)]})

# ---- P7 ม.20 นอกราชอาณาจักร
pages.append({"rows": [
    BOX("ม.20 ความผิดนอกราชอาณาจักร (ป.อ. ม.4 ว.2, 5–9) → อัยการสูงสุดรับผิดชอบหลัก · กรณีคาบเกี่ยว (ทำในไทยผลเกิดนอกประเทศ/กลับกัน) ปัจจุบันเข้า ม.20 ทั้งหมด", "ฉาก 6 · ข้ามแดน", 23),
    R(1.3, [
        P(RAYS("#fff", "#dfe9ff", 50, 60, 6), [C("cu", "giggle", 50, 62)],
          [S("หนีข้ามประเทศแล้ว~ ตำรวจไทยตามไม่ถึงหรอก", "cu")], w=1.1, cap="ฮันนินซัง"),
        P(HT("#eef7ff", "#bcdcff"), [C("cp", None, 50, 90, shot="half")],
          [S("ต้องให้อัยการสูงสุดรับผิดชอบ และขอความร่วมมือระหว่างประเทศ (MLAT) ครับ", "cp")], w=1.4, cap="กะปิ")], slant=30),
    R(1.3, [
        P(HT("#fffbe0", "#ffe27a"), [C("as", None, 28, 80, shot="half"), C("rt", None, 74, 80, shot="half")],
          [S("ตำรวจสองประเทศจับมือกัน!", "as"), S("(โดนัทแบ่งกันคนละครึ่ง)", "rt")], w=1.5, cap="ความร่วมมือข้ามแดน"),
        P(FOCUS(50, 50), [C("pf", None, 50, 90, shot="half")],
          [S("แนวใหม่: ผลคาบเกี่ยวไทย/ต่างประเทศ เข้า ม.20 ไม่ใช่ ม.19 แล้ว", "pf")], w=1.3, cap="อาจารย์นกฮูก")], slant=-30)]})

# ---- P8 ม.21 ผู้ชี้ขาด (explain)
pages.append(TH("1/1", "ม.21: ถ้าตำรวจเถียงกันเรื่องเขต ใครชี้ขาด?", [
    ("ม.21 — ไม่แน่ว่าพนักงานสอบสวนคนใดรับผิดชอบ", "#7a3cff", "ในจังหวัดเดียวกัน → ผู้ว่าราชการจังหวัดชี้ขาด · หลายจังหวัด (รวมกรุงเทพฯ) → อัยการสูงสุดชี้ขาด · รอคำชี้ขาดไม่ทำให้งดการสอบสวน"),
    ("ม.21/1 — การสอบสวนที่อยู่ในความรับผิดชอบของตำรวจ", "#1f6fe0", "ไม่แน่ใจในจังหวัดเดียวกันหรือกองบัญชาการเดียวกัน → ผู้บัญชาการซึ่งเป็นผู้บังคับบัญชาของพนักงานสอบสวนนั้นชี้ขาด"),
    ("จำง่าย", "#ff7a1a", "คนละจังหวัดหรือรวมกรุงเทพฯ → อัยการสูงสุด · ในตำรวจเองในจังหวัด/กองบัญชาการเดียวกัน → ผู้บัญชาการ")],
    who="ct", expr="smug"))

# ---- P9 สรุป
pages.append({"rows": [
    BOX("สรุปตอนที่ 3: เขตอำนาจสอบสวน = ม.16 (สืบสวน) · ม.18 (ท้องที่เดียว) · ม.19 (หลายท้องที่ รวม 19(5)-(6)) · ม.20 (นอกราชอาณาจักร) · ม.21 และ ม.21/1 (ผู้ชี้ขาด)", "ฉาก 7 · สรุป", 23),
    R(1.4, [
        P(RAYS("#fff", "#ffe14d", 50, 58, 6), [C("un", None, 50, 90, shot="half")],
          [S("จำง่าย ๆ: ม.18 ที่เดียว · ม.19 หลายที่ · ม.20 นอกประเทศ · ม.21 ใครชี้ขาด", "un")], w=1.5, cap="สรุปลุงคูล"),
        P(HT("#eef7ff", "#bcdcff"), [C("ct", None, 50, 90, shot="half")],
          [S("ตำรวจปัดว่าไม่ใช่เขตตัวเอง ระวัง… อาจไม่ชอบ เมี้ยว", "ct")], w=1.2, cap="แมวอธิบาย")], slant=30),
    R(1.2, [
        P(HT("#fff", "#d6d6d6"), [C("as", None, 28, 80, shot="half"), C("rt", None, 74, 80, shot="half"), C("gk", None, 52, 52, shot="half")],
          [S("แล้วเจอกันตอนหน้า!", "as")], w=1.6, cap="ตำรวจคู่หู + จอจี้")], slant=0)]})

pages += INFO(["crimpro_info_ep03_sq.png"], "ผังเขตอำนาจสอบสวน")

import math


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

json.dump({"meta": meta, "cast": cast, "pages": pages}, open("episodes/crimpro_003_content.comic.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("pages", len(pages))
