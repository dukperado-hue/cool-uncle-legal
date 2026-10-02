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


meta = {"id": "crimpro_002_content", "group": "content", "code": "crimpro", "style": "manga",
        "series": "วิธีพิจารณาความอาญาฉบับลุงคูล",
        "footer": "crimpro ตอนที่ 2 · ผู้เสียหายโดยนิตินัย · ผู้จัดการแทน · ผู้เยาว์"}
cast = {"un": "uncle_wolf", "cp": "capy_prosecutor", "ct": "cat_narrator", "pf": "owl_professor",
        "gk": "golden_kid", "cu": "culprit_black", "as": "alsatian_cop", "rt": "rottweiler_cop",
        "cone": "props_crime", "gun": "props_crime", "bag": "props_crime", "cuff": "props_crime"}
pages = []

# ---- P1 ปก (ภาพเดียวเต็มหน้า)
pages.append({"rows": [R(1, [{
    "bg": RAYS("#fff", "#ffe14d", 50, 62, 6),
    "chars": [C("gk", None, 17, 46, shot="full", sticker=True, tilt=-3), C("un", None, 42, 58, shot="full", sticker=True, z=1),
              C("cp", None, 68, 48, shot="full", sticker=True), C("cu", None, 91, 40, shot="full", sticker=True, tilt=4, view=0)],
    "fx": [{"type": "sparkle", "x": 8, "y": 36, "s": 1.5}, {"type": "sparkle", "x": 92, "y": 30, "s": 1.3}],
    "bubbles": [{"t": "title", "text": "วิ.อาญา\nฉบับลุงคูล", "x": 4, "y": 4, "w": 92, "size": 86, "rot": -3},
                {"t": "label", "text": "ตอนที่ 2 · ผู้เสียหายต้อง “มือสะอาด”", "x": 5, "y": 30, "w": 90, "size": 34, "rot": 2, "c": "#fff"}],
    "caption": "ตอนที่ 2 (เนื้อหา)  |  ลุงคูล · กะปิ · จอจี้ · ฮันนินซัง"}])]})

# ---- P2 มือสะอาด
pages.append({"rows": [
    BOX("ผู้เสียหายโดยนิตินัย (ม.2(4)) ต้อง “มือสะอาด” — ไม่ได้ร่วม/ยินยอม/จ้างวานให้เกิดความผิด · ผู้มาศาลต้องมาด้วยมือที่สะอาด (Clean Hands)", "ฉาก 1 · มือสะอาด", 24),
    R(1.3, [
        P(HT("#eef7ff", "#bcdcff"), [C("pf", None, 50, 90, shot="half")],
          [S("จะเป็นผู้เสียหายฟ้องเองได้ ต้อง “มือสะอาด”", "pf")], w=1.1, cap="อาจารย์นกฮูก"),
        P(RAYS("#fff", "#dff5d8", 50, 55, 6), [C("gk", None, 50, 90, shot="half")],
          [S("ผมล้างมือแล้วนะครับ… (น้ำในอ่างเป็นสีดำ)", "gk")], w=1.2, cap="จอจี้")], slant=30),
    R(1.3, [
        P(HT("#fff2f2", "#ffc4c4"), [C("un", None, 28, 80, shot="half"), C("cu", None, 74, 72, shot="half", view=1)],
          [S("ยอมเสียดอกเบี้ยเกิน 15% มาแต่แรก… มือเปื้อนแล้วจ้ะ", "un"), S("ฮึๆๆ ตกลงกันเองนี่นา", "cu")], w=1.6, cap="ตามแนวฎีกา"),
        P(FOCUS(50, 50), [C("cp", None, 50, 90, shot="half")],
          [S("แม้ในทางปฏิบัติจะเสียเปรียบ ก็ฟ้องเองไม่ได้ครับ", "cp")], w=1.2, cap="กะปิ")], slant=-30)]})

# ---- P3 ตัวอย่างฎีกา 3 ข้อ
pages.append({"rows": [
    BOX("ตัวอย่าง ① ยินยอมทำแท้ง แนวฎีกา — ผู้จัดการแทนมีสิทธิไม่เกินตัวการ · ② ติดสินบน แนวฎีกา · ③ ขับรถชนกันต่างประมาท แนวฎีกา", "ฉาก 2 · ฎีกา 3 ข้อ", 23),
    R(1.2, [
        P(HT("#fff2f2", "#ffc4c4"), [C("un", None, 50, 90, shot="half")],
          [S("① ยินยอมให้ทำผิดเอง → ไม่ใช่ผู้เสียหาย ผู้จัดการแทนก็ไม่มีสิทธิกว่าตัวการ", "un")], w=1.2, cap="ข้อ 1"),
        P(RAYS("#fff", "#fff3c4", 50, 55, 6), [C("cu", None, 50, 88, shot="half", view=1)],
          [S("② จ่ายสินบนไปแล้วอยากได้คืน? ฟ้องไม่ได้นะ", "cu")], w=1, cap="ข้อ 2")], slant=30),
    R(1.35, [
        P(HT("#eef7ff", "#bcdcff"), [C("cone", None, 20, 52, shot="full", view=0), C("ct", None, 74, 86, shot="half")],
          [S("③ ต่างฝ่ายต่างประมาท → ฟ้องเองไม่ได้ แต่ “รัฐ” ฟ้องได้ เพราะเป็นคดีอาญาแผ่นดิน", "ct")], w=1.7, cap="ข้อ 3 · ชนกันตรงกรวย",
          stamps=[{"text": "รัฐยังฟ้องได้", "x": 28, "y": 64, "size": 40, "rot": -5}])], slant=0)]})

# ---- P4 ผู้จัดการแทน ม.5-6 (ภาพเดียวเล่ายาว)
pages.append({"rows": [
    BOX("ม.5(1) ผู้แทนโดยชอบธรรม/ผู้อนุบาล · ม.5(2) บุพการี-ผู้สืบสันดาน-คู่สมรส เมื่อผู้เสียหายตายหรือบาดเจ็บจนจัดการเองไม่ได้ · ม.6 ผู้แทนเฉพาะคดี (ศาลตั้ง)", "ฉาก 3 · ใครแทนใครได้", 23),
    R(3, [P(RAYS("#fff", "#fff3c4", 50, 70, 6),
            [C("gk", None, 18, 52, shot="full"), C("cp", None, 48, 60, shot="full"), C("un", None, 82, 70, shot="full")],
            [S("ม.5(1): ผมยังเด็ก พ่อแม่ (ผู้แทนโดยชอบธรรม) ฟ้องแทนได้ครับ", "gk"),
             S("ม.5(2): ถ้าผู้เสียหายตายหรือหมดสติ พ่อแม่ ลูก คู่สมรส จัดการแทนได้", "cp"),
             S("ม.6: ถ้าไม่มีผู้แทน/ผลประโยชน์ขัดกัน (เช่น พ่อเลี้ยงทำร้ายลูกแต่แม่ไม่แจ้งความ) ญาติร้องขอให้ศาลตั้งผู้แทนเฉพาะคดี", "un")],
            w=1, cap="ภาพเดียวจบ — ใครจัดการแทนได้บ้าง")])]})

# ---- P5 ม.4 ว.2 + ม.29 + มอบอำนาจ (explain)
pages.append(TH("1/2", "สามี-ภริยา · คู่สมรส · ม.29 · มอบอำนาจ", [
    ("ม.4 ว.2: สามีจัดการแทนภริยา", "#7a3cff", "สามีจัดการแทนภริยาได้เมื่อภริยา “อนุญาตโดยชัดแจ้ง” (วาจาก็ได้ แต่ควรมีหลักฐาน) · ภริยาฟ้องคดีอาญาเองได้เสมอ ไม่ต้องขออนุญาตสามี"),
    ("สมรสเท่าเทียม (พ.ร.บ.แก้ ป.พ.พ. พ.ศ. 2568)", "#1f6fe0", "ม.5(2) และ ม.29 ใช้คำว่า “สามีหรือภริยา” → คู่สมรสทุกเพศใช้ได้ทันที · ม.4 ว.2 ให้สิทธิสามีฝ่ายเดียว → คู่สมรสเพศเดียวกันยังใช้ไม่ได้ (ม.67 ว.2) จนกว่าจะแก้ตัวบท"),
    ("ม.29 สวมสิทธิ + มอบอำนาจ", "#ff7a1a", "ม.29: ผู้เสียหาย “ฟ้องไว้แล้ว” แล้วตายระหว่างคดี → บุพการี/ผู้สืบสันดาน/คู่สมรสเข้าแทนได้ · มอบอำนาจ (ตามแนวฎีกา) ทำได้ แต่จำกัดเท่าที่ระบุ: มอบแค่ “ร้องทุกข์” ก็ฟ้องแทนไม่ได้")],
    who="ct", expr="smug"))

# ---- P6 มุกหนังสือมอบอำนาจ + ทายาท
pages.append({"rows": [
    BOX("ทรัพย์: สิทธิร้องทุกข์เป็นสิทธิทางทรัพย์สิน ตกทอดทายาทได้ (ป.พ.พ. ม.1600) · แต่ “ริเริ่มฟ้องเอง” ไม่ใช่ — ยกเว้นเข้า ม.29 (ผู้ตายฟ้องไว้ก่อนตาย)", "ฉาก 4 · มรดกสิทธิ", 23),
    R(1.3, [
        P(HT("#fffbe0", "#ffe27a"), [C("cp", None, 50, 90, shot="half")],
          [S("หนังสือมอบอำนาจเขียนว่า “ร้องทุกข์” ผมขอฟ้องแทนเลยนะครับ!", "cp")], w=1.2, cap="กะปิ"),
        P(FOCUS(50, 50), [C("un", None, 50, 90, shot="half")],
          [S("ตัวหนังสือ “ฟ้อง” ไม่มีในกระดาษ… มันบินหนีไปแล้ว", "un")], w=1.1, cap="ลุงคูล",
          stamps=[{"text": "ไม่ได้รับมอบ", "x": 50, "y": 70, "size": 46, "rot": -5}])], slant=30),
    R(1.3, [
        P(HT("#eef7ff", "#bcdcff"), [C("pf", None, 50, 90, shot="half")],
          [S("ผู้เสียหายตายก่อนฟ้อง คดีทรัพย์ → ทายาทร้องทุกข์ได้ แต่ฟ้องเองไม่ได้", "pf")], w=1.3, cap="อาจารย์นกฮูก"),
        P(RAYS("#fff", "#dff5d8", 50, 55, 6), [C("gk", None, 50, 90, shot="half")],
          [S("ถ้าผมฟ้องไว้ก่อน แล้วมีคนเข้ามาแทนต่อได้ใช่ไหมครับ?", "gk")], w=1.2, cap="จอจี้")], slant=-30)]})

# ---- P7 จอจี้ผู้เยาว์ (ภาพเดียวเต็มหน้า)
pages.append({"rows": [
    BOX("ผู้เยาว์: ร้องทุกข์เองได้ (ไม่ใช่นิติกรรม · แนวฎีกา แนวราว 14 ปีขึ้นไป) แต่ฟ้อง/เป็นโจทก์ร่วมต้องผ่านผู้แทนโดยชอบธรรม (ตามแนวฎีกา)", "ฉาก 5 · จอจี้ยื่นฟ้อง", 23),
    R(3, [P(HT("#fff", "#e0e0e0"),
            [C("gk", None, 22, 74, shot="full"), C("as", None, 70, 80, shot="full")],
            [S("ผมไปร้องทุกข์เองได้เลยครับ ไม่ต้องขออนุญาตใคร", "gk"),
             S("รับคำร้องทุกข์ครับ… ส่วนฟ้องต่อศาล ต้องให้พ่อแม่ (ผู้แทนโดยชอบธรรม) ยื่นแทนนะ", "as"),
            ],
            w=1, cap="ฟ้องด้วยปากกาสีเทียน ศาลไม่รับ — ต่อให้พ่อแม่เซ็นยินยอมก็ไม่พอ",
            stamps=[{"text": "ร้องทุกข์ ✔  ฟ้อง ✘", "x": 50, "y": 94, "size": 44, "rot": -3}])])]})

# ---- P8 ผู้ต้องหา vs จำเลย
pages.append({"rows": [
    BOX("ผู้ต้องหา = ถูกกล่าวหาต่อพนักงานสอบสวน แต่ยังไม่ถูกฟ้อง · จำเลย = ถูกฟ้องต่อศาลแล้ว · อัยการฟ้อง → เป็นจำเลยทันที · ราษฎรฟ้อง → รอศาลประทับฟ้องก่อน", "ฉาก 6 · ผู้ต้องหา vs จำเลย", 23),
    R(1.3, [
        P(HT("#fff2f2", "#ffc4c4"), [C("cuff", None, 24, 28, shot="full", view=3), C("cu", None, 70, 80, shot="half", view=0)],
          [S("ตำรวจกล่าวหาฉัน… ตอนนี้ฉันเป็น “ผู้ต้องหา”", "cu")], w=1.3, cap="ผู้ต้องหา"),
        P(RAYS("#fff", "#fff3c4", 50, 55, 6), [C("cp", None, 50, 90, shot="half")],
          [S("ผมฟ้องแล้วครับ → เปลี่ยนเป็น “จำเลย” ทันที", "cp", t="shout", size=28)], w=1.2, cap="อัยการเป็นโจทก์")], slant=30),
    R(1.3, [
        P(HT("#eef7ff", "#bcdcff"), [C("gk", None, 50, 90, shot="half")],
          [S("แต่ถ้าราษฎรฟ้องเอง ต้องรอศาลไต่สวนมูลฟ้องก่อน", "gk")], w=1.1, cap="ราษฎรเป็นโจทก์"),
        P(FOCUS(50, 50), [C("un", None, 50, 90, shot="half")],
          [S("ศาล “ประทับฟ้อง” เมื่อไหร่ ถึงเป็นจำเลยสมบูรณ์ (กันแกล้งฟ้อง)", "un")], w=1.3, cap="ลุงคูล")], slant=-30)]})

# ---- P9 สรุป
pages.append(TH("2/2", "สรุปตอนที่ 2: ผู้เสียหายที่ฟ้องเองได้", [
    ("เช็กลิสต์ 3 ข้อ", "#7a3cff", "① มือสะอาด ไม่ร่วม/ยินยอม/จ้างวาน (ข้อยกเว้นคุ้มครองเด็ก แนวฎีกา) ② เป็นผู้ถูกกระทบโดยตรงตาม ม.2(4) ③ ถ้าตนเองจัดการไม่ได้ ดู ม.4–6, 29"),
    ("ผู้เยาว์ & มอบอำนาจ", "#1f6fe0", "ร้องทุกข์เองได้ · ฟ้อง/โจทก์ร่วมผ่านผู้แทน · มอบอำนาจจำกัดเท่าที่ระบุ"),
    ("คดีอาญาแผ่นดิน", "#ff7a1a", "แม้ผู้เสียหายฟ้องเองไม่ได้ (เช่น ต่างฝ่ายประมาท) รัฐ (พนักงานสอบสวน/อัยการ) ยังฟ้องได้")],
    who="un", expr="smug"))

pages += INFO(["crimpro_info_ep02_sq.png"], "ผังผู้เสียหายและผู้จัดการแทน")

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

json.dump({"meta": meta, "cast": cast, "pages": pages}, open("episodes/crimpro_002_content.comic.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("pages", len(pages))
