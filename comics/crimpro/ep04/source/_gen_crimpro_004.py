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


meta = {"id": "crimpro_004_content", "group": "content", "code": "crimpro", "style": "manga",
        "series": "วิธีพิจารณาความอาญาฉบับลุงคูล",
        "footer": "crimpro ตอนที่ 4 · เขตอำนาจศาล · โอนคดี · โจทก์ร่วม · ระงับคดี"}
cast = {"un": "uncle_wolf", "cp": "capy_prosecutor", "ct": "cat_narrator", "pf": "owl_professor",
        "gk": "golden_kid", "cu": "culprit_black", "as": "alsatian_cop", "rt": "rottweiler_cop",
        "cone": "props_crime", "gun": "props_crime", "bag": "props_crime", "cuff": "props_crime"}
pages = []

# ---- P1 ปก
pages.append({"rows": [R(1, [{
    "bg": RAYS("#fff", "#ffe14d", 50, 62, 6),
    "chars": [C("cp", None, 17, 50, shot="full", sticker=True, tilt=-3), C("un", None, 42, 58, shot="full", sticker=True, z=1),
              C("gk", None, 66, 44, shot="full", sticker=True), C("cu", None, 90, 40, shot="full", sticker=True, tilt=4, view=1)],
    "fx": [{"type": "sparkle", "x": 8, "y": 36, "s": 1.5}, {"type": "sparkle", "x": 92, "y": 30, "s": 1.3}],
    "bubbles": [{"t": "title", "text": "วิ.อาญา\nฉบับลุงคูล", "x": 4, "y": 4, "w": 92, "size": 86, "rot": -3},
                {"t": "label", "text": "ตอนที่ 4 · ฟ้องที่ศาลไหน ย้ายได้ไหม คดีจบยังไง", "x": 5, "y": 30, "w": 90, "size": 30, "rot": 2, "c": "#fff"}],
    "caption": "ตอนที่ 4 (เนื้อหา)  |  ลุงคูล · กะปิ · จอจี้ · ฮันนินซัง"}])]})

# ---- P2 เขตอำนาจศาล ม.22
pages.append({"rows": [
    BOX("ม.22 เขตอำนาจศาล: ฟ้องได้ที่ศาล ① ที่ความผิดเกิด ② ที่จำเลยมีที่อยู่/ถูกจับ ③ ที่พนักงานสอบสวนสอบสวน — ต้อง “ล้อ” กับเขตสอบสวนเสมอ", "ฉาก 1 · ฟ้องที่ศาลไหน", 23),
    R(1.3, [
        P(HT("#eef7ff", "#bcdcff"), [C("ct", None, 50, 90, shot="half")],
          [S("ฟ้องได้ 3 ที่: ที่เกิดเหตุ · ที่จำเลยอยู่/ถูกจับ · ที่พนักงานสอบสวนสอบสวน", "ct")], w=1.3, cap="ม.22"),
        P(RAYS("#fff", "#fff3c4", 50, 55, 6), [C("gk", None, 50, 90, shot="half")],
          [S("งั้นผมขอฟ้องศาลไกล ๆ ที่ชอบเที่ยวได้ไหมครับ?", "gk")], w=1.2, cap="จอจี้")], slant=30),
    R(1.3, [
        P(FOCUS(50, 50), [C("cp", None, 50, 90, shot="half")],
          [S("ไม่ได้ครับ! ตำรวจจังหวัดไหนทำสำนวน อัยการจังหวัดนั้นก็ฟ้องศาลจังหวัดนั้น", "cp", t="shout", size=26)], w=1.4, cap="กะปิ",
          stamps=[{"text": "ล้อกับเขตสอบสวน", "x": 50, "y": 66, "size": 40, "rot": -5}]),
        P(HT("#fffbe0", "#ffe27a"), [C("pf", None, 50, 90, shot="half")],
          [S("นอกราชอาณาจักร (ม.22(2)) → ศาลอาญา รัชดาภิเษก หรือศาลที่สอบสวนในเขตนั้น", "pf")], w=1.3, cap="อาจารย์นกฮูก")], slant=-30)]})

# ---- P3 คดีเกี่ยวพัน ม.24-25 (ภาพเดียว)
pages.append({"rows": [
    BOX("ม.24 คดีเกี่ยวพัน (ชั้นศาล) ฟ้องรวมกันได้ที่ศาลซึ่งพิจารณาคดีโทษสูงสุด; เท่ากันหมด → ศาลที่รับฟ้องไว้ก่อน · ม.25: การรวมพิจารณาเป็นดุลพินิจของศาล", "ฉาก 2 · ฟ้องรวมหลายกระทง", 22),
    R(3, [P(RAYS("#fff", "#dfe9ff", 50, 70, 6),
            [C("cu", None, 14, 62, shot="full", view=0), C("cp", None, 52, 62, shot="full"), C("pf", None, 86, 54, shot="full")],
            [S("ลักรถด้วย หมิ่นประมาทด้วย… ยัดสองกระทงใส่กระสอบเดียว", "cu"),
             S("ฟ้องรวมที่ศาลโทษสูงสุด ถ้าเท่ากัน → ศาลที่รับฟ้องก่อนครับ", "cp"),
             S("จะรวมหรือไม่ เป็นดุลพินิจศาลโดยแท้ (ตามแนวฎีกา)", "pf")],
            w=1, cap="ม.24 ต่างจาก ม.19: ม.24 = เกี่ยวพันในชั้นศาล · ม.19 = ชั้นสอบสวน")])]})

# ---- P4 โอนคดี ม.23 / ม.26
pages.append({"rows": [
    BOX("ม.23 โอนคดีตามปกติ: ศาลหลัก ↔ ศาลยกเว้น (ฟ้องศาลยกเว้น → ขอโอนกลับได้ทั้งโจทก์/จำเลย · ฟ้องศาลหลัก → ขอโอนไปศาลยกเว้นได้เฉพาะ “โจทก์”) · ม.26 โอนกรณีพิเศษ ยื่นตรงประธานศาลฎีกา", "ฉาก 3 · ย้ายศาล", 21),
    R(1.3, [
        P(HT("#eef7ff", "#bcdcff"), [C("ct", None, 50, 90, shot="half")],
          [S("ฟ้องศาลหลักแล้วอยากย้าย? เฉพาะโจทก์เท่านั้นที่ขอโอนไปศาลยกเว้นได้ ต้องอ้างความสะดวก", "ct")], w=1.3, cap="ม.23"),
        P(HT("#fff2f2", "#ffc4c4"), [C("cu", "gleam", 50, 62)],
          [S("ฉันมีลูกน้องเพียบ ขู่พยานหน้าศาลจังหวัดนี้แหละ ฮึๆ", "cu")], w=1.2, cap="ผู้มีอิทธิพล")], slant=30),
    R(1.3, [
        P(RAYS("#fff", "#fff3c4", 50, 55, 6), [C("un", None, 50, 90, shot="half")],
          [S("คดีสะเทือนขวัญ/ผู้มีอิทธิพล → ยื่นขอโอนตรงต่อประธานศาลฎีกา (แก้ไข 2559) โอนไปศาลใดก็ได้ คำสั่งเป็นที่สุด", "un")], w=1.6, cap="ม.26",
          stamps=[{"text": "ยื่นตรงประธานศาลฎีกา", "x": 50, "y": 66, "size": 36, "rot": -5}]),
        P(HT("#fffbe0", "#ffe27a"), [C("pf", None, 50, 90, shot="half")],
          [S("ส่วนใหญ่โอนมาศาลอาญา รัชดาฯ เพราะมาตรการรักษาความปลอดภัยเข้มกว่า", "pf")], w=1.3, cap="อาจารย์นกฮูก")], slant=-30)]})

# ---- P5 โจทก์ร่วม ม.30-31
pages.append({"rows": [
    BOX("ม.30 ผู้เสียหายขอเป็นโจทก์ร่วมกับอัยการ: ยื่นคำร้องก่อนศาลชั้นต้นพิพากษา เฉพาะฐานที่ตนเป็นผู้เสียหาย · ม.31 อัยการขอร่วมกับผู้เสียหาย: ก่อนคดีเสร็จเด็ดขาด เฉพาะคดีอาญาแผ่นดิน", "ฉาก 4 · โจทก์ร่วม", 21),
    R(1.3, [
        P(RAYS("#fff", "#dff5d8", 50, 55, 6), [C("gk", None, 50, 90, shot="half")],
          [S("อัยการฟ้องแล้ว ผมขอเข้าเป็นโจทก์ร่วมครับ!", "gk")], w=1.1, cap="ม.30 · ผู้เสียหายร่วมอัยการ"),
        P(HT("#fffbe0", "#ffe27a"), [C("cp", None, 50, 90, shot="half")],
          [S("ร่วมได้เฉพาะฐานที่คุณเป็นผู้เสียหายนะ ข้อหาอาวุธปืนเป็นความผิดต่อรัฐ ต้องยกคำร้อง", "cp")], w=1.4, cap="กะปิ")], slant=30),
    R(1.3, [
        P(HT("#eef7ff", "#bcdcff"), [C("ct", None, 50, 90, shot="half")],
          [S("ย้อนกลับ ม.31: ผู้เสียหายฟ้องเองก่อน อัยการค่อยมาร่วม ได้เฉพาะคดีอาญาแผ่นดิน", "ct")], w=1.3, cap="ม.31 · อัยการร่วมผู้เสียหาย"),
        P(FOCUS(50, 50), [C("un", None, 50, 90, shot="half")],
          [S("ห้ามร่วมในคดีความผิดต่อส่วนตัวเด็ดขาด — ในทางปฏิบัติพบน้อยมาก", "un")], w=1.2, cap="ลุงคูล")], slant=-30)]})

# ---- P6 สิทธิโจทก์ร่วม ม.32-33
pages.append({"rows": [
    BOX("ม.32 โจทก์ร่วมมีสิทธิเหมือนโจทก์ แต่ ✘ แก้/เพิ่มคำฟ้องเกินกรอบอัยการไม่ได้ (ตามแนวฎีกา) ✘ ถอนฟ้องอัยการไม่ได้ · ม.33 ผู้เสียหายด้วยกันร่วมกันเองไม่ได้ (ตามแนวฎีกา)", "ฉาก 5 · สิทธิโจทก์ร่วม", 22),
    R(1.3, [
        P(HT("#fff2f2", "#ffc4c4"), [C("gk", None, 50, 90, shot="half")],
          [S("เป็นโจทก์ร่วมแล้ว ขอแก้ฟ้องให้ลงโทษตามบทอื่นเลยนะครับ", "gk")], w=1.2, cap="โจทก์ร่วม"),
        P(FOCUS(50, 50), [C("cp", None, 50, 90, shot="half")],
          [S("แก้ฟ้องเกินกรอบอัยการไม่ได้ และถอนฟ้องของอัยการก็ไม่ได้ ถอนได้แค่ “คำร้องขอร่วม” ของตัวเอง", "cp")], w=1.5, cap="กะปิ",
          stamps=[{"text": "ถอนได้แค่คำร้องขอร่วม", "x": 50, "y": 66, "size": 34, "rot": -5}])], slant=30),
    R(1.3, [
        P(HT("#eef7ff", "#bcdcff"), [C("ct", None, 50, 90, shot="half")],
          [S("ผู้เสียหายสิบคนจากรถชน คนแรกฟ้องแล้ว คนอื่นขอเข้าร่วมกับเขาไม่ได้ (ม.33)", "ct")], w=1.3, cap="ม.33"),
        P(RAYS("#fff", "#dff5d8", 50, 55, 6), [C("un", None, 50, 90, shot="half")],
          [S("ต้องฟ้องเป็นคดีใหม่ตาม ม.28 แล้วขอให้ศาลสั่งรวมพิจารณา ตัดปัญหาคำพิพากษาขัดกัน", "un")], w=1.4, cap="ลุงคูล")], slant=-30)]})

# ---- P7 ถอนฟ้อง ม.35-36
pages.append({"rows": [
    BOX("ม.35 ถอนฟ้องเป็นดุลพินิจของศาล: ถอนก่อนจำเลยให้การ → อนุญาตได้เลย · ถอนหลังให้การ → จำเลยคัดค้านศาลต้องยกคำร้อง · ม.36 ถอนแล้วฟ้องเดิมซ้ำไม่ได้ (มีข้อยกเว้น)", "ฉาก 6 · ถอนฟ้อง", 22),
    R(1.3, [
        P(HT("#fffbe0", "#ffe27a"), [C("cp", None, 50, 90, shot="half")],
          [S("ขอถอนฟ้องก่อนจำเลยให้การ ศาลอนุญาตได้เลยครับ", "cp")], w=1.1, cap="ถอนก่อนให้การ"),
        P(HT("#fff2f2", "#ffc4c4"), [C("cu", "evil", 50, 62)],
          [S("ฉันบริสุทธิ์! ไม่ให้ถอน ขอให้ศาลยกฟ้องล้างมลทิน!", "cu")], w=1.2, cap="ถอนหลังให้การ · จำเลยคัดค้าน",
          stamps=[{"text": "ศาลต้องยกคำร้อง", "x": 50, "y": 64, "size": 38, "rot": -5}])], slant=30),
    R(1.3, [
        P(HT("#eef7ff", "#bcdcff"), [C("ct", None, 50, 90, shot="half")],
          [S("ถอนแล้วห้ามฟ้องข้อหาเดิมอีก ยกเว้น: คดีแผ่นดิน อัยการถอนไม่ตัดสิทธิผู้เสียหาย และกลับกัน", "ct")], w=1.4, cap="ม.36"),
        P(FOCUS(50, 50), [C("pf", None, 50, 90, shot="half")],
          [S("แนวฎีกา: ขอถอนฟ้องตอนไต่สวนมูลฟ้อง ก็นับเป็นถอนแล้วและตัดสิทธิฟ้องใหม่", "pf")], w=1.4, cap="อาจารย์นกฮูก")], slant=-30)]})

# ---- P8 ยอมความ/ถอนคำร้องทุกข์/เปรียบเทียบ
pages.append({"rows": [
    BOX("ม.126 ถอนคำร้องทุกข์: ถอนต่อพนักงานสอบสวนหรือต่อศาลก็ได้ ระงับเฉพาะ “ความผิดต่อส่วนตัว” · ยอมความอาญาไม่มีแบบ (ตามแนวฎีกา) · ม.37-38 เปรียบเทียบปรับ", "ฉาก 7 · ยอมความ", 21),
    R(1.3, [
        P(HT("#eef7ff", "#bcdcff"), [C("ct", None, 50, 90, shot="half")],
          [S("ตกลงด้วยวาจาต่อหน้าพยานก็ยอมความอาญาสมบูรณ์ ไม่เหมือนแพ่งที่ต้องมีหนังสือ", "ct")], w=1.3, cap="ตามแนวฎีกา"),
        P(HT("#fff2f2", "#ffc4c4"), [C("un", None, 50, 90, shot="half")],
          [S("แต่ยอมความล่วงหน้าก่อนเกิดเหตุเป็นโมฆะ (ตามแนวฎีกา)", "un")], w=1.1, cap="ลุงคูล")], slant=30),
    R(1.3, [
        P(HT("#fffbe0", "#ffe27a"), [C("gk", None, 50, 90, shot="half")],
          [S("จะยอมความต่อเมื่อได้เงินครบ (ตามแนวฎีกา) และเขียนว่า “ไม่ติดใจทั้งแพ่งและอาญา” (ตามแนวฎีกา)", "gk")], w=1.5, cap="จอจี้จดไว้"),
        P(RAYS("#fff", "#dff5d8", 50, 55, 6), [C("as", None, 50, 90, shot="half")],
          [S("เปรียบเทียบปรับ: จ่ายค่าปรับครบ 15 วัน คดีอาญาจบ แม้ไม่จ่ายค่าเสียหายแพ่งก็ตาม (ม.38(2))", "as")], w=1.5, cap="ตำรวจนายพันธุ์")], slant=-30)]})

# ---- P9 ม.39 + โจทย์ท้ายคาบ (explain)
pages.append(TH("1/1", "ม.39 เหตุระงับคดี · จำหน่ายคดี vs ยกฟ้อง", [
    ("ม.39 มี 7 เหตุ", "#7a3cff", "(1) ผู้กระทำผิดตาย (2) คดีต่อส่วนตัว: ถอนคำร้องทุกข์/ถอนฟ้อง/ยอมความ (3) เปรียบเทียบปรับ (4) ฟ้องซ้ำ (5) ยกเลิกความผิด (6) ขาดอายุความ (7) ยกเว้นโทษ"),
    ("ศาลสั่งต่างกัน", "#1f6fe0", "ม.39(1)-(2) → “จำหน่ายคดี” (ไม่ต้องวินิจฉัยเนื้อหา) · ม.39(3)-(7) → “พิพากษายกฟ้อง” (ก้าวล่วงเนื้อหาแล้ว ต้องปล่อยจำเลย ม.185)"),
    ("โจทย์ท้ายคาบ: ลักรถ + หมิ่นประมาท", "#ff7a1a", "อัยการฟ้องสองฐาน ผู้เสียหายยอมความด้วยวาจา แล้วถอนคำร้องทุกข์ต่อศาล → หมิ่นประมาท (ต่อส่วนตัว) ระงับ ศาลจำหน่ายคดีข้อหานี้ · ลักทรัพย์ (แผ่นดิน) ไม่ระงับ คดีอัยการเดินต่อ (ม.126 ว.2)")],
    who="ct", expr="smug"))

pages += INFO(["crimpro_info_ep04_sq.png"], "ผังเขตอำนาจศาล โอนคดี โจทก์ร่วม ระงับคดี")

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

json.dump({"meta": meta, "cast": cast, "pages": pages}, open("episodes/crimpro_004_content.comic.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("pages", len(pages))
