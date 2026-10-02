"""crimgen ep3 exam — การละเมิดลิขสิทธิ์ขั้นต้น (ม.27-30) / ขั้นรอง (ม.31) / ค่าเสียหาย ม.64 / โทษอาญา ม.69-70 (manga mode)"""
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
        out.append({"rows": [BOX(f"{label} ({i + 1}/{len(files)}) — ผังสรุปจาก NotebookLM", "ผังอธิบาย", 24, 0.22),
                             R(3, [{"bg": FLAT("#fff"), "chars": [], "frame": "heavy", "w": 1,
                                    "photo": {"file": "pics/toon/props/" + f, "fit": "contain", "pos": "50% 0%"}}])]})
    return out

def TH(n, title, secs, who="lw", expr="smug"):
    return {"kind": "explain", "badge_kind": "t", "badge": f"ทฤษฎี {n}", "title": title,
            "sections": [{"h": h, "c": c, "t": t} for h, c, t in secs],
            "char": {"who": who, "expr": expr} if has_sheet(cast[who]) else {"who": who, "shot": "half"}}


meta = {"id": "crimgen_003_exam", "group": "exam", "code": "crimgen", "style": "manga",
        "series": "อาญาภาคทั่วไปฉบับลุงคูล",
        "footer": "crimgen ครั้งที่ 3 · โจทย์-เฉลย ม.59-63 (ชื่อในโจทย์ดัดแปลง)"}
cast = {"bs": "crime_boss", "lw": "defense_lawyer", "pr": "prosecutor", "jd": "judge", "ct": "courtroom_cat",
        "bk": "biker_gunman", "dl": "delinquent", "mm": "muscular_man", "wf": "wife", "hb": "husband",
        "sc": "elegant_socialite", "dc": "doctor", "dv": "driver", "nb": "driver_female", "ew": "elderly_woman", "hg": "hero_girl",
        "ru": "rural_uncle", "cs": "civil_servant", "ld": "landlord", "tn": "tenant"}
pages = []
GREEN = lambda: HT("#eefbe9", "#bfe6b0")
BLUE = lambda: HT("#eef7ff", "#bcdcff")
RED = lambda: HT("#fff2f2", "#ffc4c4")
YEL = lambda: HT("#fffbe0", "#ffe27a")


def Q(n, badge, title, facts, ask, hint, who="pr"):
    ch = {"who": who, "expr": "sly"} if has_sheet(cast[who]) else {"who": who, "shot": "half"}
    return {"kind": "explain", "badge_kind": "q", "badge": f"โจทย์ ข้อ {n}  ({badge})", "title": title,
            "sections": [{"h": "ข้อเท็จจริง (ย่อ)", "c": "#ff7a1a", "t": facts}, {"h": "คำถาม", "c": "#1f6fe0", "t": ask},
                         {"h": "คิดตามทีละขั้น", "c": "#8a4fe0", "t": hint}], "char": ch}


def A(box, name, rows, size=22, h=1.0):
    return {"rows": [BOX(box, name, size, h)] + rows}


pages.append({"rows": [R(1, [{
    "bg": RAYS("#fff", "#ffd7d7", 50, 62, 6),
    "chars": [C("bk", None, 14, 50, shot="full", sticker=True, tilt=-4), C("bs", None, 40, 52, shot="full", sticker=True, z=1),
              C("lw", None, 66, 50, shot="full", sticker=True, z=1), C("ct", None, 90, 40, shot="full", sticker=True, tilt=3)],
    "bubbles": [{"t": "title", "text": "โจทย์-เฉลย\nวิ่งราว ชิง ปล้น", "x": 4, "y": 4, "w": 92, "size": 80, "rot": -3},
                {"t": "label", "text": "ม.59-63: ไม่รู้ข้อเท็จจริง · สำคัญผิดตัว · พลาด · ผลธรรมดา · เหตุแทรกแซง", "x": 4, "y": 30, "w": 92, "size": 24, "rot": 2, "c": "#fff"},
                {"t": "label", "text": "ชื่อตัวละครในโจทย์ดัดแปลงจากข้อสอบเก่า", "x": 10, "y": 37, "w": 80, "size": 22, "rot": -2, "c": "#ffe14d"}],
    "caption": "ครั้งที่ 3 (ข้อสอบ) | 5 ข้อ: วิ่งราว · ชิง · ปล้น · ยิงผิดตัวแล้วพลาด · แทงแล้วไปรักษาน้ำมนต์"}])]})

# ---- ข้อ 1 วิ่งราว
pages.append(Q(1, "วิ่งราว · ลักทรัพย์ · ไม่รู้ข้อเท็จจริง", "เชิดกระเป๋าในรถ แล้วกระชากสร้อยจนกระจกแตก",
    "จำเลยเห็นกระเป๋าสะพายอยู่ในรถ จึงหลอกเจ้าของรถลงไปซื้อน้ำ แล้วขับรถเชิดกระเป๋าหนีไป ต่อมากระชากสร้อยคอทองคำของอีกคนแล้ววิ่งหนี สร้อยขาดหลุดกระเด็นไปถูกกระจกรถของบุคคลที่สามแตก",
    "จำเลยรับผิดฐานใดบ้าง ต่อกระเป๋า สร้อย และกระจกรถ",
    "เอาไปขณะเจ้าของไม่อยู่ = ลักทรัพย์ หรือ วิ่งราว (ฉกฉวยซึ่งหน้า) → กระจกแตก: เจตนาทำให้เสียทรัพย์ไหม (ม.59 ว.3) ม.60 โอนได้ไหม (วัตถุต่างประเภท) มีประมาททำให้เสียทรัพย์ไหม", "bk"))
pages.append(A("• กระเป๋า: ฉวยโอกาสเอาไปขณะเจ้าของไม่อยู่ ไม่ใช่ซึ่งหน้า = ลักทรัพย์ ม.334\n• สร้อย: ฉกฉวยเอาไปซึ่งหน้าขณะสวมอยู่แล้ววิ่งหนี = วิ่งราวทรัพย์ ม.336 ว.แรก\n• กระจกรถ: เจตนาที่มีคือ “ฉกฉวยทรัพย์” ไม่ใช่ “ทำลายทรัพย์” ไม่มีเจตนาทำให้เสียทรัพย์ (ม.59) ม.60 โอนเจตนาไม่ได้ (เจตนาและผลคนละลักษณะ) และไม่มี “ประมาททำให้เสียทรัพย์” → ไม่ผิดอาญาต่อกระจก", "เฉลย ข้อ 1", [
    R(1.2, [
        P(RED(), [C("bk", None, 28, 90, shot="half"), C("hg", None, 78, 80, shot="half")],
          [S("กระชากสร้อย! วิ่งงงง!", "bk", t="shout", size=28), S("สร้อยฉัน! ช่วยด้วย!", "hg", t="shout", size=26)], w=1.5, fx=[{"type": "speed", "x": 30, "y": 50, "s": 1.0}]),
        P(YEL(), [C("dv", None, 50, 90, shot="half")], [S("กระจกรถผมแตก! ใครทำ!", "dv", t="shout", size=26)], w=1, stamps=[{"text": "ไม่ผิดอาญา", "x": 50, "y": 87, "size": 40, "rot": -6}])], slant=30),
    R(0.9, [
        P(FOCUS(50, 50), [C("lw", None, 50, 90, shot="half")], [S("เชิดในรถ = ลักทรัพย์ · กระชากซึ่งหน้า = วิ่งราว · กระจก = ไม่ผิดค่ะ", "lw")], w=1)])], 21, 1.2))

# ---- ข้อ 2 ชิงทรัพย์ ม.63
pages.append(Q(2, "ชิงทรัพย์ · ผลธรรมดา ม.63", "จี้คอด้วยมีด ถามรหัสตู้เซฟ",
    "นายสองใช้มีดปลายแหลมจี้คอนายห้า ถามรหัสเปิดตู้เซฟ พยายามระวังไม่ให้มีดบาด แต่นายห้าตกใจดิ้นจนคมมีดบาดเส้นประสาทที่คอ ได้รับอันตรายสาหัส",
    "นายสองรับผิดฐานใด และต้องรับโทษหนักขึ้นเพราะผลสาหัสหรือไม่",
    "จี้ด้วยมีดเพื่อเอาทรัพย์ = ชิงทรัพย์ (ม.339) → ผลสาหัสเกิดโดยไม่เจตนา ต้องรับโทษหนักขึ้นไหม (ม.63 ผลธรรมดา: วิญญูชนคาดหมายได้ไหม)", "bs"))
pages.append(A("• ใช้มีดจี้ขู่เข็ญเพื่อเอาทรัพย์ = ชิงทรัพย์โดยมีอาวุธ ม.339\n• ผลสาหัสไม่ต้องเจตนา แต่ต้องเป็น “ผลธรรมดา” ตาม ม.63 (ทฤษฎีเหตุเหมาะสม): จี้มีดที่คอ เหยื่อตกใจดิ้นจนถูกบาดสาหัส = วิญญูชนคาดหมายได้\n• จึงรับโทษหนักขึ้น ชิงทรัพย์เป็นเหตุให้ผู้อื่นได้รับอันตรายสาหัส ม.339 ว.ท้าย ประกอบ ม.63", "เฉลย ข้อ 2", [
    R(1.2, [
        P(RED(), [C("bs", None, 28, 90, shot="half"), C("cs", None, 78, 80, shot="half")],
          [S("รหัสตู้เซฟคือเลขอะไร!", "bs"), S("อย่า! ผมกลัว! (ดิ้น)", "cs", t="shout", size=26)], w=1.5, fx=[{"type": "sweat", "x": 82, "y": 22, "s": 1.0}]),
        P(FOCUS(50, 50), [C("jd", None, 50, 90, shot="half")], [S("ผลสาหัสคาดหมายได้ รับโทษหนัก", "jd")], w=1, stamps=[{"text": "ม.339+63", "x": 50, "y": 87, "size": 44, "rot": -6}])], slant=-30),
    R(0.9, [
        P(YEL(), [C("pr", None, 50, 90, shot="half")], [S("ไม่ได้เจตนาให้สาหัส แต่ ม.63 บอกว่าผลธรรมดาก็ต้องรับ!", "pr")], w=1)])], 22, 1.0))

# ---- ข้อ 3 ปล้น
pages.append(Q(3, "ปล้นทรัพย์ · พลาด ม.60 · ผลธรรมดา ม.63", "ยิงขู่พื้นปูน กระสุนแฉลบถูกคนตาย",
    "นายดำ นายแดง นายเหลือง ร่วมกันถือปืนและมีดเข้าปล้นบ้าน ขณะขนของ เจ้าของตื่น นายแดงยิงขู่ลงพื้นปูนเพื่อไม่ให้ขัดขืน กระสุนแฉลบพลาดไปถูกนายขาวที่ยืนใกล้ตาย",
    "ทั้งสามรับผิดฐานใด โดยเฉพาะต่อความตายของนายขาว",
    "ร่วมกัน 3 คน มีอาวุธ ขู่เข็ญ = ปล้นทรัพย์ (ม.340+83) → ความตายเป็นผลธรรมดา ม.63 ของการปล้นไหม → ตัวการร่วมรับทุกคนหรือเปล่า (เหตุลักษณะคดี)", "bs"))
pages.append(A("• ร่วมกันปล้นทรัพย์โดยมีอาวุธ ม.340 ประกอบ ม.83\n• การยิงขู่ในที่เกิดเหตุปล้นแล้วมีคนตายเป็น “ผลธรรมดา” ม.63 ที่คาดหมายได้ (และเป็นเหตุลักษณะคดี) ตัวการร่วมทุกคนรับผิดเหมือนกัน\n• ร่วมกันปล้นทรัพย์เป็นเหตุให้ผู้อื่นถึงแก่ความตาย ม.340 ว.ท้าย ประกอบ ม.63, 83 (ตามแนวเฉลยใน notebook)", "เฉลย ข้อ 3", [
    R(1.2, [
        P(RAYS("#fff", "#ffd7d7", 50, 55, 6), [C("bs", None, 24, 90, shot="half"), C("bk", "aim_side", 76, 86)],
          [S("ขนเร็วๆ!", "bs"), S("ขัดขืนเหรอ? ปัง! (ยิงพื้น)", "bk", t="shout", size=26)], w=1.5, fx=[{"type": "shock", "x": 82, "y": 20, "s": 1.0}]),
        P(RED(), [C("ru", None, 50, 90, shot="half")], [S("กระสุนแฉลบ… (ล้ม)", "ru", t="thought")], w=1, stamps=[{"text": "ตาย", "x": 50, "y": 87, "size": 56, "rot": -6}])], slant=30),
    R(0.9, [
        P(FOCUS(50, 50), [C("pr", None, 50, 90, shot="half")], [S("ปล้นทั้งแก๊ง ผลธรรมดา ม.63 รับร่วมกันทุกคน!", "pr")], w=1)])], 21, 1.05))

# ---- ข้อ 4 ยิงผิดตัว + พลาด
pages.append(Q(4, "ยิง · สำคัญผิดตัว ม.61 · พลาด ม.60", "ซุ่มยิงคนผิด แล้วกระสุนไปถูกเป้าหมายจริง",
    "นายริ้นแค้นนายยุง ซุ่มรอฆ่าโดยไตร่ตรองไว้ก่อน คืนเกิดเหตุเห็นนายเรือดเดินผ่าน คิดว่าเป็นนายยุง ยิงเฉียดแขนนายเรือดบาดเจ็บ และกระสุนพลาดไปถูกนายยุงที่ยืนอยู่ห่างออกไปตาย",
    "นายริ้นรับผิดอย่างไรต่อนายเรือดและนายยุง",
    "นายเรือด: ผิดตัว ม.61 + บาดเจ็บ ไม่ตาย = พยายามหรือไม่ → นายยุง: เป้าหมายจริง แต่ผลมาจากการยิงพลาด ม.60 → ไตร่ตรองไว้ก่อน ม.289(4) โอนไปได้ไหม", "pr"))
pages.append(A("• นายเรือด: สำคัญผิดตัว ม.61 อ้างไม่เจตนาไม่ได้ → พยายามฆ่าโดยไตร่ตรองไว้ก่อน ม.289(4) ประกอบ ม.80, 61\n• นายยุง: กระสุนพลาดถูกยุงที่เป็นเป้าหมายเดิมตาย → เจตนาโอนตาม ม.60 → ฆ่าโดยไตร่ตรองไว้ก่อน ม.289(4) ประกอบ ม.60\n• ข้ออ้างว่าไม่มีเจตนาฆ่าใครเลยฟังไม่ขึ้น ถูกปิดปากด้วย ม.61 และ ม.60", "เฉลย ข้อ 4", [
    R(1.2, [
        P(GREEN(), [C("dl", None, 28, 90, shot="half"), C("mm", None, 78, 80, shot="half")],
          [S("นั่นแหละยุง! ปัง!", "dl"), S("ผมชื่อเรือดนะ!!", "mm", t="shout", size=26)], w=1.5, fx=[{"type": "shock", "x": 82, "y": 20, "s": 1.0}]),
        P(RED(), [C("hb", None, 50, 90, shot="half")], [S("ผมคือยุงตัวจริง… (ล้ม)", "hb", t="thought")], w=1, cap="เป้าหมายจริง")], slant=-30),
    R(0.9, [
        P(YEL(), [C("lw", None, 50, 90, shot="half")], [S("เรือด = พยายามฆ่า ม.61 · ยุง = ฆ่าโดยพลาด ม.60 ทั้งคู่ไตร่ตรองไว้ก่อนค่ะ", "lw")], w=1)])], 21, 0.95))

# ---- ข้อ 5 แทง/ตี + เหตุแทรกแซง
pages.append(Q(5, "ทำร้าย · ม.63 เหตุแทรกแซง", "ตีด้วยขาตั้งกล้อง แล้วเหยื่อรักษาด้วยน้ำมนต์",
    "นายแดงโกรธนางดำ แย่งขาตั้งกล้องมากระหน่ำตีจนบาดเจ็บที่แขนขา อีก 3 วันต่อมา นางดำเชื่อไสยศาสตร์ ไม่ไปหาแพทย์ ใช้วิธีดื่มและอาบน้ำมนต์ จนแผลติดเชื้อในกระแสเลือดตาย",
    "นายแดงรับผิดฐานใด",
    "เจตนาทำร้าย (ม.295) → ความตายมาจากการไม่ไปหาหมอ = เหตุแทรกแซงที่วิญญูชนคาดหมายได้ไหม → ผลธรรมดา ม.63 → ผิด ม.290 หรือ แค่ ม.295", "pr"))
pages.append(A("• นายแดงเจตนาทำร้ายร่างกาย ม.295\n• นางดำรักษาผิดวิธี/ไม่ไปหาแพทย์ = เหตุแทรกแซงที่วิญญูชนคาดหมายได้ (ชาวบ้านรักษาแผลผิดวิธีเป็นเรื่องธรรมดา) ไม่ตัดความสัมพันธ์\n• ความตายเป็นผลธรรมดา ม.63 → ทำร้ายร่างกายเป็นเหตุให้ผู้อื่นถึงแก่ความตาย ม.290 ประกอบ ม.63", "เฉลย ข้อ 5", [
    R(1.2, [
        P(RED(), [C("dl", None, 28, 90, shot="half"), C("sc", None, 78, 80, shot="half")],
          [S("ฟาดด้วยขาตั้งกล้อง!", "dl", t="shout", size=28), S("โอ๊ย! แขนฉัน!", "sc", t="shout", size=26)], w=1.5),
        P(GREEN(), [C("ew", None, 50, 90, shot="half")], [S("ดื่มน้ำมนต์ดีกว่าหมอ… (แผลติดเชื้อ)", "ew", t="thought")], w=1, cap="3 วันต่อมา")], slant=30),
    R(0.9, [
        P(FOCUS(50, 50), [C("lw", None, 50, 90, shot="half")], [S("รักษาผิดวิธี = คาดหมายได้ ไม่ตัดความสัมพันธ์ ผิด ม.290 ค่ะ", "lw")], w=1, stamps=[{"text": "ม.290+63", "x": 50, "y": 87, "size": 44, "rot": -6}])])], 21, 1.0))

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

json.dump({"meta": meta, "cast": cast, "pages": pages}, open("episodes/crimgen_003_exam.comic.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("pages", len(pages))
