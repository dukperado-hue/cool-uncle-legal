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


meta = {"id": "crimgen_001_content", "group": "content", "code": "crimgen", "style": "manga",
        "series": "อาญาภาคทั่วไปฉบับลุงคูล",
        "footer": "crimgen ครั้งที่ 1 · ม.1 นิยาม · ม.2 ไม่มีกฎหมายไม่มีความผิด · ม.3 กฎหมายใหม่เป็นคุณ (เนื้อหา)"}
cast = {"bs": "crime_boss", "lw": "defense_lawyer", "pr": "prosecutor", "jd": "judge", "ct": "courtroom_cat",
        "bk": "biker_gunman", "dl": "delinquent", "ld": "landlord", "tn": "tenant", "ru": "rural_uncle",
        "wf": "wife", "hb": "husband", "gh": "ghost_looking_man", "cs": "civil_servant"}
pages = []

# ---- P1 ปก
pages.append({"rows": [R(1, [{
    "bg": RAYS("#fff", "#ffe14d", 50, 62, 6),
    "chars": [C("bk", "aim45", 14, 58, sticker=True, tilt=-4), C("lw", None, 36, 52, shot="full", sticker=True, z=1),
              C("bs", "worm", 62, 56, sticker=True, z=1), C("ct", None, 88, 40, shot="full", sticker=True, tilt=3)],
    "fx": [{"type": "sparkle", "x": 8, "y": 34, "s": 1.5}, {"type": "sparkle", "x": 92, "y": 30, "s": 1.3}],
    "bubbles": [{"t": "title", "text": "อาญาภาคทั่วไป\nฉบับลุงคูล", "x": 4, "y": 4, "w": 92, "size": 86, "rot": -3},
                {"t": "label", "text": "ตอนที่ 1 · ไม่มีกฎหมาย = ไม่มีความผิด! (จริงเหรอ?)", "x": 5, "y": 30, "w": 90, "size": 32, "rot": 2, "c": "#fff"},
                {"t": "label", "text": "ม.1 นิยาม · ม.2 หลักความชอบด้วยกฎหมาย · ม.3 กฎหมายใหม่เป็นคุณ", "x": 6, "y": 38, "w": 88, "size": 25, "rot": -2, "c": "#ffe14d"}],
    "caption": "ตอนที่ 1 (เนื้อหา)  |  บอสสายเทา · ทนายสาว · แมวศาล · ไบเกอร์"}])]})

# ---- P2 ม.2 วรรคแรก + 4 หลักประกัน
pages.append({"rows": [
    BOX("ม.2 ว.1: จะรับโทษอาญาได้ ต่อเมื่อ “กฎหมายที่ใช้ในขณะกระทำ” บัญญัติเป็นความผิดและกำหนดโทษไว้", "Nullum crimen, nulla poena sine lege", 25, 0.5),
    R(1.3, [
        P(RAYS("#fff", "#ffd7d7", 50, 55, 6), [C("bs", "worm", 50, 86)],
          [S("ผมจะทำอะไรก็ได้ ถ้าไม่มีกฎหมายห้าม!", "bs", t="shout", size=28)], w=1.15, cap="บอสสายเทา"),
        P(HT("#fff", "#d6d6d6"), [C("lw", None, 50, 90, shot="half")],
          [S("ถูกครึ่งเดียวค่ะ… แต่ศาลก็ห้ามตีความเกินตัวบทด้วยนะคะ", "lw")], w=1.0, cap="ทนายสาว")], slant=30),
    R(0.9, [
        P(FOCUS(50, 50), [C("ct", None, 50, 92, shot="half")],
          [S("หลักประกัน 4 ข้อ ห้าม ① จารีตประเพณี ② เทียบเคียงกฎหมายใกล้เคียง ③ ย้อนหลัง ✚ ④ ตัวบทต้องชัดเจนแน่นอน เมี้ยว", "ct", size=27)], w=1, frame="heavy")])]})

pages += INFO(['crimgen_info_ม1-3_sq.png'], "ผังสรุป ม.2-3")

pages.append(TH("1/2", "ธรรมนูญของอาชญากร: ที่มาและเหตุผลของ ม.2", [
    ("ที่มา (Nullum crimen, nulla poena sine lege)", "#7a3cff", "ภาษิตละติน “ไม่มีความผิด ไม่มีโทษ โดยไม่มีกฎหมาย” ผู้วางหลักเป็นระบบคือ Anselm von Feuerbach (ค.ศ. 1801) เยอรมันเรียกว่า “ธรรมนูญของอาชญากร” (Magna Carta of the Criminal) = หลักประกันขั้นต่ำสุดของผู้ถูกกล่าวหา"),
    ("รากฐาน: หลักนิติรัฐ (Rechtsstaat)", "#1f6fe0", "เป้าหมายคือ “จำกัดอำนาจรัฐ” ไม่ให้ใช้อำนาจตามอำเภอใจ\n• ประชาชน: ทำได้ทุกอย่างที่กฎหมายไม่ห้าม\n• รัฐ: ทำได้เท่าที่กฎหมายให้อำนาจชัดเจนเท่านั้น"),
    ("ผลที่ตามมา = หลักประกัน 4 ข้อ (ม.2 ว.1)", "#ff7a1a", "ห้ามจารีต · ห้ามเทียบเคียง · ห้ามย้อนหลัง · ต้องชัดเจนแน่นอน  ทุกข้อห้าม “เฉพาะในทางที่เป็นโทษ” ถ้าเป็นคุณแก่ผู้ต้องหา ใช้ได้ (เช่น เทียบเคียง/ย้อนหลังเป็นคุณ)")]))

pages.append(TH("2/2", "ทำไมต้องห้าม 4 อย่างนี้? (เหตุผลรายข้อ)", [
    ("① ห้ามจารีตประเพณี (lege scripta)", "#7a3cff", "จารีตไม่ได้ตราเป็นลายลักษณ์อักษรโดยฝ่ายนิติบัญญัติ (ตัวแทนประชาชน) ไม่แน่นอน และเปลี่ยนไปตามกาลเวลา"),
    ("② ห้ามเทียบเคียง (lege stricta)", "#1f6fe0", "กฎหมายอาญากระทบเสรีภาพและโทษร้ายแรง ต้องตีความเคร่งครัดตามตัวอักษร ถ้าเทียบเคียงลงโทษ = ศาลสร้างความผิดเอง (อ้างความเห็น Georges Padoux)"),
    ("③ ห้ามย้อนหลัง (lege praevia)", "#ff7a1a", "ประชาชนต้องประเมินผลทางกฎหมายล่วงหน้าตอนตัดสินใจกระทำ ถ้ารัฐย้อนลงโทษอดีตได้ จะไม่มีความมั่นคงในชีวิตและเสรีภาพ"),
    ("④ ต้องชัดเจนแน่นอน (lege certa)", "#e0254a", "ตัวบทคลุมเครือ = ผู้บังคับใช้ตีความตามใจ Hans Welzel ชี้ว่าเป็นอันตรายที่แท้จริงต่อหลักประกันของกฎหมายอาญา")], "pr", "sly"))

# ---- P3 ม.1 นิยาม
pages.append({"rows": [
    BOX("ม.1(1) “โดยทุจริต” = เพื่อแสวงหาประโยชน์ที่มิควรได้โดยชอบด้วยกฎหมาย สำหรับตนเองหรือผู้อื่น\nมีนิยามในกฎหมาย → ใช้ตามนิยามก่อน ห้ามเอาพจนานุกรมมาขยายโทษ", "ม.1 บทนิยามศัพท์", 24, 0.58),
    R(1.35, [
        P(FOCUS(40, 45), [C("pr", None, 28, 90, shot="half"), C("bs", "shove", 76, 80)],
          [S("ทุจริตคือโกงๆ แหละ! จับ!", "pr", t="shout", size=28), S("คุณเปิดพจนานุกรมมาจากไหนครับ…", "bs")], w=1.4),
        P(HT("#fffbe0", "#ffe27a"), [C("lw", None, 50, 90, shot="half")],
          [S("ต้องดูนิยาม ม.1 ก่อน ไม่งั้นความผิดขยายเกินตัวบทค่ะ", "lw")], w=1, frame="heavy",
          stamps=[{"text": "ดู ม.1 ก่อน", "x": 50, "y": 86, "size": 52, "rot": -6}])], slant=-30)]})

# ---- P4 ห้ามจารีต/เทียบเคียง
pages.append({"rows": [
    BOX("แพ่ง: ป.พ.พ. ม.4 ใช้จารีตประเพณี/กฎหมายใกล้เคียงอุดช่องว่างได้\nอาญา: ห้ามใช้ “ในทางที่เป็นโทษ” (ใช้ในทางเป็นคุณได้)", "แพ่ง VS อาญา", 24, 0.5),
    R(1.4, [
        P(HT("#eef7ff", "#bcdcff"), [C("ct", None, 50, 90, shot="half")],
          [S("แพ่งอุดช่องว่างได้ อาญาห้ามอุดทับโทษ~ เมี้ยว", "ct")], w=1, cap="แมวศาลสรุป"),
        P(FOCUS(50, 50), [C("pr", None, 28, 90, shot="half"), C("lw", None, 76, 90, shot="half")],
          [S("แต่มันคล้ายผิดมากนะ ขอเทียบเคียงหน่อย!", "pr"), S("เทียบเคียงเพื่อลงโทษ = ห้ามค่ะ!", "lw", t="shout", size=28)], w=1.5,
          stamps=[{"text": "ห้ามเทียบเคียง", "x": 50, "y": 86, "size": 52, "rot": -6}])], slant=30)]})

# ---- P5 ตอกไม้ห้องเช่า
pages.append({"rows": [
    BOX("ตัวอย่าง: ผู้เช่าค้างค่าเช่า เจ้าของเอาไม้ตอกขวางประตู/เอาแม่กุญแจคล้องห้อง ผิดบุกรุก ม.364 ไหม?", "โจทย์ที่ 1", 25, 0.45),
    R(1.2, [
        P(HT("#fff2f2", "#ffc4c4"), [C("ld", None, 26, 90, shot="half"), C("tn", None, 76, 80, shot="half")],
          [S("ไม่จ่ายค่าเช่า ตอกไม้ล็อกเลย!", "ld", t="shout", size=28), S("เข้าห้องไม่ได้!!", "tn", t="shout", size=28)], w=1.4,
          fx=[{"type": "anger", "x": 14, "y": 22, "s": 1.0}]),
        P(FOCUS(50, 50), [C("pr", None, 50, 90, shot="half")], [S("ขวางประตูก็รบกวนครอบครอง = บุกรุก!", "pr")], w=1)], slant=-30),
    R(1.15, [
        P(RAYS("#fff", "#dff5d8", 50, 55, 6), [C("lw", None, 28, 90, shot="half"), C("ct", None, 78, 80, shot="half")],
          [S("ม.364 ต้อง “เข้าไป” เจ้าของไม่ได้เข้า ไม่ผิดค่ะ", "lw"), S("ผิดแค่ละเมิดทางแพ่ง เมี้ยว", "ct")], w=1.4,
          stamps=[{"text": "ไม่ผิดบุกรุก", "x": 50, "y": 86, "size": 52, "rot": -6}]),
        P(HT("#fff", "#d6d6d6"), [C("bs", None, 50, 90, shot="half")],
          [S("งั้นเปิดเพลงดังตีสามก็บุกรุก!?", "bs", t="thought")], w=1)], slant=30)]})

# ---- P6 ลักกระแสไฟ
pages.append({"rows": [
    BOX("ตัวอย่าง: แอบพ่วงสายไฟหน้าบ้านเข้าบ้านตัวเอง ผิดลักทรัพย์ ม.334 ไหม?  (ไฟฟ้า = พลังงาน ไม่มีรูปร่าง)", "โจทย์ที่ 2", 25, 0.45),
    R(1.25, [
        P(FOCUS(40, 45), [C("ru", None, 28, 90, shot="half"), C("dl", None, 78, 80, shot="half")],
          [S("จั๊มสายไฟ ประหยัด!", "ru"), S("ไฟฟ้าก็ไม่ใช่ “ทรัพย์” นี่ครับ", "dl")], w=1.4,
          fx=[{"type": "sparkle", "x": 12, "y": 24, "s": 1.2}]),
        P(HT("#fffbe0", "#ffe27a"), [C("jd", None, 50, 90, shot="half")],
          [S("เยอรมัน: พลังงานไม่ใช่ทรัพย์ ยกฟ้อง → ต้องแก้กฎหมาย", "jd")], w=1.1, cap="ต่างประเทศ")], slant=30),
    R(1.1, [
        P(RAYS("#fff", "#ffd7d7", 50, 55, 6), [C("pr", None, 28, 90, shot="half"), C("lw", None, 78, 80, shot="half")],
          [S("ฎีกาไทยว่าลักไฟ = ลักทรัพย์ ม.334 แนวฎีกา 872/2510, 481/2549", "pr"), S("ทั้งที่วิชาการยังเถียงว่าเทียบเคียงหรือเปล่า…", "lw", t="thought")], w=1.5,
          stamps=[{"text": "ผิด ม.334", "x": 50, "y": 86, "size": 56, "rot": -6}])])]})

# ---- P7 คลื่นโทรศัพท์
pages.append({"rows": [
    BOX("ตัวอย่าง: แอบใช้สัญญาณโทรศัพท์/คลื่นแม่เหล็กไฟฟ้า ไม่ใช่กระแสไฟในสายไฟ  → ฎ.2286/2545 ไม่ผิดลักทรัพย์", "โจทย์ที่ 3", 25, 0.5),
    R(1.3, [
        P(HT("#eef7ff", "#bcdcff"), [C("bk", "run_away", 28, 82), C("cs", None, 78, 80, shot="half")],
          [S("ขอแอบใช้สัญญาณหน่อย~ ", "bk"), S("นั่นก็เหมือนไฟฟ้านะ จับ!", "cs", t="shout", size=28)], w=1.4),
        P(FOCUS(50, 50), [C("ct", None, 50, 90, shot="half")],
          [S("คลื่นฟุ้งในอากาศ ไม่มีขดลวดเหมือนไฟ ศาลไม่เทียบเคียง เมี้ยว", "ct")], w=1, frame="heavy",
          stamps=[{"text": "ยกฟ้อง", "x": 50, "y": 86, "size": 60, "rot": -8}])], slant=-30),
    R(0.8, [
        P(RAYS("#fff", "#dff5d8", 50, 55, 6), [C("lw", None, 50, 90, shot="half")],
          [S("จำง่ายๆ: เส้นแบ่งอยู่ที่ “ตัวบทเอื้อมถึงไหม” ไม่ใช่ “ใกล้เคียงไหม” ค่ะ", "lw")], w=1)])]})

# ---- P8 Lex certa
pages.append({"rows": [
    BOX("④ ตัวบทอาญาต้องชัดเจนแน่นอน (Lex Certa): ประชาชนต้องรู้ล่วงหน้าว่าอะไรผิด", "ความชัดเจนแน่นอน", 26, 0.4),
    R(1.3, [
        P(FOCUS(50, 45), [C("jd", None, 50, 90, shot="half")],
          [S("“ใครทำการอันสมควรถูกลงโทษตามความรู้สึกอันดีของประชาชน จำคุก!”", "jd", t="shout", size=26)], w=1.2, cap="ตัวบทยุคนาซีเยอรมนี"),
        P(HT("#fff2f2", "#ffc4c4"), [C("bs", "shove", 28, 80), C("dl", None, 78, 80, shot="half")],
          [S("แล้วผมทำอะไรผิดล่ะ…", "bs", t="thought"), S("ใครจะรู้ล่ะครับ!", "dl", t="shout", size=26)], w=1.2,
          fx=[{"type": "sweat", "x": 20, "y": 24, "s": 1.0}])], slant=30),
    R(0.9, [
        P(RAYS("#fff", "#fff1b0", 50, 55, 6), [C("lw", None, 28, 90, shot="half"), C("ct", None, 78, 80, shot="half")],
          [S("แบบนี้ขัดหลักชัดเจนแน่นอน ศาลตีความอย่างไรก็ได้ค่ะ", "lw"), S("พ.ร.บ.คอมฯ “ขัดศีลธรรมอันดี” ก็ยังถกเถียงกัน เมี้ยว", "ct")], w=1)])]})

# ---- P9 ห้ามย้อนหลัง
pages.append({"rows": [
    BOX("③ ห้ามใช้กฎหมายย้อนหลังเป็นโทษ: ใช้กฎหมาย “ขณะกระทำ” (ม.2 ว.1)", "ห้ามย้อนหลัง", 26, 0.4),
    R(1.4, [
        P(HT("#fffbe0", "#ffe27a"), [C("wf", None, 26, 90, shot="half"), C("hb", "surrender", 76, 84)],
          [S("เมื่อวานกินบะหมี่ก่อนเที่ยงอร่อยจัง!", "hb"), S("วันนี้ออกกฎหมายห้ามพอดีนะคะ!", "wf", t="shout", size=28)], w=1.4,
          fx=[{"type": "shock", "x": 78, "y": 20, "s": 1.0}]),
        P(FOCUS(50, 50), [C("pr", None, 24, 90, shot="half"), C("hb", "run_away", 76, 84)], [S("จับเลย! ผิดแน่!", "pr", t="shout", size=28)], w=1)], slant=-30),
    R(1.0, [
        P(RAYS("#fff", "#dff5d8", 50, 55, 6), [C("lw", None, 28, 90, shot="half"), C("jd", None, 78, 80, shot="half")],
          [S("ขณะทำยังไม่ผิด กฎหมายใหม่ย้อนมาลงโทษไม่ได้ค่ะ", "lw"), S("ยกฟ้อง ไปกินบะหมี่ต่อ", "jd")], w=1.4,
          stamps=[{"text": "ไม่ผิด", "x": 50, "y": 86, "size": 60, "rot": -8}])])]})

# ---- P10 ม.2 ว.2 ยกเลิกความผิด
pages.append({"rows": [
    BOX("ม.2 ว.2: ถ้ากฎหมายใหม่ทำให้การกระทำนั้น “ไม่เป็นความผิดอีก” → พ้นจากการเป็นผู้กระทำผิด\n• คดีถึงที่สุดแล้ว → ถือว่าไม่เคยต้องคำพิพากษา  • กำลังรับโทษ → สิ้นสุดลงทันที", "ยกเลิกความผิด (ย้อนเป็นคุณ)", 23, 0.7),
    R(1.3, [
        P(HT("#eefbe9", "#bfe6b0"), [C("bs", "run_away", 28, 84), C("cs", None, 78, 80, shot="half")],
          [S("ติดคุกอยู่ดีๆ กฎหมายยกเลิกความผิดแล้วเหรอ!", "bs", t="shout", size=28), S("เปิดประตู! ออกได้ทันทีครับ", "cs")], w=1.5,
          fx=[{"type": "sparkle", "x": 12, "y": 22, "s": 1.3}]),
        P(FOCUS(50, 50), [C("ct", None, 50, 90, shot="half")],
          [S("ประวัติอาชญากรรมก็ถูกล้างด้วย เมี้ยว~", "ct")], w=1, cap="ผลร้ายแรงที่สุดของ ม.2 ว.2")], slant=30)]})

# ---- P11 ม.3 ว.1
pages.append({"rows": [
    BOX("ม.3 ว.1: กฎหมายใหม่ไม่ได้ยกเลิกความผิด แต่ต่างจากกฎหมายเก่า → ใช้กฎหมาย “ในส่วนที่เป็นคุณแก่ผู้กระทำ” (ตามแนวที่อาจารย์สอน เลือกส่วนที่เบาจากทั้งสองฉบับมาผสมได้)", "ม.3 กฎหมายใหม่เป็นคุณ", 24, 0.65),
    R(1.3, [
        P(HT("#fffbe0", "#ffe27a"), [C("pr", None, 28, 90, shot="half"), C("lw", None, 78, 80, shot="half")],
          [S("เก่า 1–5 ปี ใหม่ 6 ด.–10 ปี", "pr"), S("ต่ำสุดเอาใหม่ สูงสุดเอาเก่า", "lw")], w=1.5),
        P(RAYS("#fff", "#dff5d8", 50, 55, 6), [C("ct", None, 50, 90, shot="half")],
          [S("คำตอบ: จำคุก 6 เดือน–5 ปี เมี้ยว~", "ct")], w=1, stamps=[{"text": "6 เดือน–5 ปี", "x": 50, "y": 86, "size": 44, "rot": -6}])], slant=-30),
    R(0.9, [
        P(FOCUS(65, 50), [C("bs", None, 24, 90, shot="half"), C("jd", None, 76, 90, shot="half")],
          [S("เหมือนบุฟเฟต์ เลือกเฉพาะส่วนที่ถูกใจ!", "bs"), S("เฉพาะส่วนที่เป็นคุณเท่านั้นนะ", "jd")], w=1)])]})

# ---- P12 ปรับ + เปลี่ยนประเภทโทษ
pages.append({"rows": [
    BOX("โจทย์ปรับ: เก่า 20,000–100,000 · ใหม่ 5,000–100,000 → ใหม่เบากว่าทั้งหมด = ปรับ 5,000–100,000\nประเภทโทษ: จำคุก→ปรับ (เบาลง) · “ทั้งจำและปรับ”→“จำหรือปรับ” (เบาลง) ล้วนเป็นคุณ ม.3", "ม.3 ตัวอย่างอื่นๆ", 23, 0.75),
    R(1.3, [
        P(HT("#eef7ff", "#bcdcff"), [C("wf", None, 26, 90, shot="half"), C("hb", "cower", 76, 80)],
          [S("เมื่อก่อนโดนจำคุก ตอนนี้ปรับอย่างเดียวแล้วนะ!", "hb"), S("ดีใจจัง! (แต่ตอนทำผิดไม่ได้นะคะ)", "wf", t="shout", size=26)], w=1.5),
        P(FOCUS(50, 45), [C("lw", None, 50, 90, shot="half")], [S("จำคุก→ปรับ เบากว่า = กฎหมายใหม่เป็นคุณค่ะ", "lw")], w=1, frame="heavy")], slant=30)]})

# ---- P13 ม.3 ว.2 ถึงที่สุด
pages.append({"rows": [
    BOX("ม.3 ว.2: คดีถึงที่สุดแล้ว ยังรับโทษอยู่ แต่โทษตามคำพิพากษาหนักกว่ากฎหมายใหม่ → ศาลกำหนดโทษใหม่ตามกฎหมายใหม่\nถ้ารับโทษมาแล้วเท่ากับ/เกินโทษตามกฎหมายใหม่ → ปล่อยตัว (ว.3: ศาลคำนึงถึงพฤติการณ์ทั้งปวง)", "คดีถึงที่สุดแล้วก็ยังได้คุณ", 22, 0.85),
    R(1.3, [
        P(FOCUS(40, 45), [C("bs", "shove", 28, 82), C("jd", None, 78, 80, shot="half")],
          [S("ผมติดมา 3 ปี กฎหมายใหม่โทษสูงสุด 2 ปี!", "bs", t="shout", size=28), S("งั้นรับโทษเกินแล้ว ปล่อยตัวไป", "jd")], w=1.5,
          fx=[{"type": "sparkle", "x": 12, "y": 22, "s": 1.3}]),
        P(HT("#fff", "#d6d6d6"), [C("ct", None, 50, 90, shot="half")],
          [S("จำง่าย: ยังไม่หมดโทษ = ยังขอได้ หมดแล้ว = จบเมี้ยว", "ct")], w=1, cap="เป็นข้อสอบบ่อย")], slant=-30)]})

# ---- P14 สรุป
pages.append({"rows": [
    R(0.9, [{"bg": FLAT("#fff"), "frame": "none", "bubbles": [{"t": "box", "name": "สรุปตอนที่ 1 + วิธีตอบข้อสอบ", "size": 25, "x": 3, "y": 8, "w": 94,
                "text": "① ม.1 ดูนิยามก่อน  ② ม.2 ว.1: ห้ามจารีต/เทียบเคียง/ย้อนหลัง + ต้องชัดเจน (ลักไฟ=ผิด, คลื่น=ไม่ผิด, ตอกไม้≠บุกรุก)\n③ ม.2 ว.2: ยกเลิกความผิด → ล้างประวัติ/ยุติโทษ  ④ ม.3: กฎหมายเปลี่ยนบางส่วน → เลือกส่วนที่เป็นคุณ\nตอบข้อสอบ: (1) กฎหมายขณะทำ (2) กฎหมายใหม่ต่างอย่างไร (3) ยกเลิกทั้งหมด→ม.2 ว.2 / เบากว่าบางส่วน→ม.3 (4) ตอบผลเป็นช่วงโทษ"}]}]),
    R(1.45, [
        P(RAYS("#fff", "#ffe14d", 50, 55, 6), [C("bs", "worm", 28, 84), C("lw", None, 78, 80, shot="half")],
          [S("สรุปแล้วผมทำอะไรก็ได้ ถ้าไม่มีกฎหมายใช่ไหม!", "bs", t="shout", size=28), S("เปล่าค่ะ ต้องไม่มีกฎหมาย “ขณะนั้น” เท่านั้น", "lw")], w=1.4,
          stamps=[{"text": "ตอนหน้า ม.59!", "x": 52, "y": 84, "size": 48, "rot": -8}]),
        P(HT("#fff", "#d6d6d6"), [C("ct", None, 50, 90, shot="half")], [S("ตอนหน้า: โครงสร้างความรับผิด + เจตนา ม.59 เมี้ยว", "ct")], w=0.9, cap="ตอนจบ", frame="thin")])]})

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

json.dump({"meta": meta, "cast": cast, "pages": pages}, open("episodes/crimgen_001_content.comic.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("pages", len(pages))
