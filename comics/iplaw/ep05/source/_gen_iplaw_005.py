"""iplaw ep5 — การละเมิดลิขสิทธิ์ขั้นต้น (ม.27-30) / ขั้นรอง (ม.31) / ค่าเสียหาย ม.64 / โทษอาญา ม.69-70 (manga mode)"""
import json


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
    for c in chars:
        if c.get("expr") and not c.get("big"):
            c["h"] = min(c["h"], 54 if len(chars) > 1 else 66)
    if len(list(bubbles)) >= 2:
        for c in chars:
            if not c.get("expr") and not c.get("big"):
                c["h"] = min(c["h"], 60)
    d = {"bg": bg, "chars": chars, "bubbles": list(bubbles), "w": w}
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


meta = {"id": "iplaw_005_content", "group": "content", "code": "iplaw", "style": "manga",
        "series": "ทรัพย์สินทางปัญญาฉบับลุงคูล",
        "footer": "iplaw ครั้งที่ 5 · ละเมิดลิขสิทธิ์ ขั้นต้น/ขั้นรอง · ค่าเสียหาย · โทษอาญา (เนื้อหา)"}
cast = {"ceo": "ghost_ceo", "mj": "ghost_idol_girl", "jh": "ghost_producer_boy", "zb": "lawyer_zombie", "lg": "lawyer_ghost_old",
        "gb": "robber_goblin", "pc": "police_cat", "hp": "lawyer_ghost_old"}
pages = []

# ---- P1 ปก
pages.append({"rows": [R(1, [{
    "bg": RAYS("#fff", "#ffe14d", 50, 62, 6),
    "chars": [C("gb", None, 14, 46, shot="full", sticker=True, tilt=-4), C("mj", "shocked", 38, 46, sticker=True, z=1),
              C("ceo", "sly", 64, 42, sticker=True, z=1), C("pc", None, 88, 46, shot="full", sticker=True, tilt=3)],
    "fx": [{"type": "sparkle", "x": 8, "y": 34, "s": 1.5}, {"type": "sparkle", "x": 92, "y": 30, "s": 1.3}],
    "bubbles": [{"t": "title", "text": "ทรัพย์สินทางปัญญา\nฉบับลุงคูล", "x": 4, "y": 4, "w": 92, "size": 86, "rot": -3},
                {"t": "label", "text": "ตอนที่ 5 · เปิดเพลงในร้าน แผ่นแท้ผิด แผ่นผีไม่ผิด?!", "x": 5, "y": 30, "w": 90, "size": 32, "rot": 2, "c": "#fff"},
                {"t": "label", "text": "ละเมิดขั้นต้น ม.27-30 · ขั้นรอง ม.31 · โทษ ม.64, 69, 70", "x": 7, "y": 38, "w": 86, "size": 26, "rot": -2, "c": "#ffe14d"}],
    "caption": "ตอนที่ 5 (เนื้อหา)  |  แจ๊ค(ท่านประธาน) · โจรก๊อบบิ้น · มินจู · ตำรวจแมว"}])]})

# ---- P2 สองชั้นของการละเมิด
pages.append({"rows": [
    BOX("ขั้นต้น (ม.27-30) = ลงมือทำตามสิทธิแต่ผู้เดียวเอง  |  ขั้นรอง (ม.31) = เอางานเถื่อนไป “ขยี้แผลซ้ำ”", "การละเมิด 2 ชั้น", 25, 0.42),
    R(1.3, [
        P(HT("#eefbe9", "#bfe6b0"), [C("gb", None, 30, 88, shot="full"), C("mj", "shocked", 76, 70)],
          [S("ก๊อปเพลงมินจู ขายแผ่นละ 20 บาท!", "gb"), S("เพลงหนูนะ! ใครให้ก๊อป!", "mj")], w=1.25, cap="ขั้นต้น: ทำซ้ำ + เผยแพร่เอง"),
        P(HT("#fff2f2", "#ffc4c4"), [C("ceo", "sly", 50, 66)],
          [S("ฉันแค่ซื้อแผ่นเขามาขายต่อ~", "ceo")], w=1, cap="ขั้นรอง: ต่อยอดงานเถื่อน")], slant=30),
    R(0.75, [
        P(FOCUS(65, 50), [C("zb", None, 78, 94, shot="half")],
          [S("ขั้นต้นมีแค่ 2 ข้อ: ทำการที่เป็นสิทธิของเจ้าของ + ไม่ได้รับอนุญาต", "zb")], w=1)])]})

# ---- P3 ม.27-30 + Strict Liability
pages.append({"rows": [
    BOX("ม.27 งานทั่วไป: ทำซ้ำ/ดัดแปลง · เผยแพร่   ม.28 โสตทัศนวัสดุ/ภาพยนตร์/เสียง: + ให้เช่า\nม.29 งานแพร่เสียงแพร่ภาพ   ม.30 โปรแกรมคอมพิวเตอร์: + ให้เช่า", "ตัวบทขั้นต้น", 24, 0.55),
    R(1.3, [
        P(FOCUS(35, 45), [C("ceo", "shocked", 28, 66), C("zb", None, 76, 92, shot="half")],
          [S("ผมไม่รู้ว่าผิดนี่นา!", "ceo", t="shout", size=30), S("แพ่ง = Strict Liability ไม่ต้องพิสูจน์เจตนาครับ", "zb")], w=1.4,
          stamps=[{"text": "ผิดทันที", "x": 50, "y": 86, "size": 76, "rot": -8}]),
        P(FLAT("#fff"), [C("mj", "smug", 50, 72)], [S("ศาลฎีกาว่าไว้แล้วค่ะ~", "mj")], w=1.0, cap="ฎ.10657/2559 · 5073/2560", frame="thin")], slant=-30)]})

# ---- P4 ม.64 ค่าเสียหาย x2
pages.append({"rows": [
    BOX("ม.64: ศาลกำหนดค่าเสียหายตามสมควร (ความร้ายแรง · ประโยชน์ที่เสียไป · ค่าใช้จ่ายบังคับสิทธิ)\nถ้าจงใจ/ให้งานแพร่หลาย → เพิ่มได้ไม่เกิน 2 เท่า (Punitive Damages)", "ค่าเสียหายทางแพ่ง", 24, 0.58),
    R(1.35, [
        P(RAYS("#fff", "#ffd7d7", 50, 50, 6), [C("mj", "joy", 28, 66), C("gb", "", 76, 88, shot="full")],
          [S("จงใจก๊อปให้แพร่หลายใช่ไหม~ ค่าเสียหาย x2!", "mj"), S("เงินในถุง STOLEN ปลิวหมดแล้ว…", "gb", t="thought")], w=1.5,
          fx=[{"type": "sweat", "x": 74, "y": 30, "s": 1.0}]),
        P(HT("#fff", "#d6d6d6"), [C("zb", None, 50, 92, shot="half")], [S("แพ่งแต่มีกลิ่นอาญา เส้นแบ่งเริ่มพร่าเลือน", "zb")], w=0.95, frame="heavy")], slant=30)]})

# ---- P5 ม.31 ต้องครบ 4 ข้อ
pages.append({"rows": [
    BOX("ม.31 ละเมิดขั้นรอง ต้องครบ 4 ข้อ (ฎ.8493/2558)", "องค์ประกอบ", 27, 0.36),
    R(1.0, [
        P(HT("#fffbe0", "#ffe27a"), [C("gb", None, 50, 90, shot="full")],
          [S("ขายแผ่นละ 20! นำเข้า แจกจ่ายก็ได้!", "gb")], w=1, cap="① กระทำตาม ม.31(1)-(4)"),
        P(FOCUS(50, 50), [C("jh", "confused", 50, 66)], [S("แผ่นนี้ทำขึ้นโดยละเมิดลิขสิทธิ์", "jh")], w=1, cap="② วัตถุ = งานเถื่อน")], slant=30),
    R(1.0, [
        P(FOCUS(50, 50), [C("ceo", "confused", 50, 66)], [S("ก็ราคาแค่ 20 บาท… ใครจะไปรู้", "ceo")], w=1, cap="③ รู้ หรือมีเหตุอันควรรู้"),
        P(HT("#eefbe9", "#bfe6b0"), [C("gb", None, 50, 90, shot="full")], [S("ขายเอากำไรครับเฮีย!", "gb")], w=1, cap="④ เพื่อหากำไร")], slant=-30)]})

# ---- P6 แจ๊ค 1
pages.append({"rows": [
    BOX("โจทย์ข้อ 1 — “แจ๊ค” (ท่านประธานรับบท) ซื้อ DVD เถื่อนจากแผงลอย แล้วก๊อปไฟล์ลงคอมส่วนตัว", "โจทย์สไลด์ 31", 25, 0.36),
    R(1.2, [
        P(HT("#eefbe9", "#bfe6b0"), [C("ceo", "joy", 24, 60), C("gb", None, 76, 74, shot="full")],
          [S("ซื้อแผ่นผีมาดูเองนะ!", "ceo"), S("แผ่นละ 20 ครับเฮีย!", "gb")], w=1.2, cap="ซื้อมาใช้เอง = ไม่ผิด",
          stamps=[{"text": "ไม่ผิด", "x": 50, "y": 86, "size": 60, "rot": -8}]),
        P(FOCUS(50, 50), [C("ceo", "shocked", 26, 56), C("zb", None, 78, 80, shot="half")],
          [S("ก๊อปลงคอมก็ผิดด้วยเหรอ!?", "ceo"), S("ทำซ้ำ ม.28(1) ขั้นต้นครับ แม้จากแผ่นผี!", "zb")], w=1.3, cap="ก๊อปลงคอม = ทำซ้ำ")], slant=30)]})

# ---- P7 โจทย์ข้อ 2-3: เปิดซีดีเถื่อน
pages.append({"rows": [
    BOX("โจทย์ข้อ 2 และ 3 — แจ๊คเปิด “ซีดีเถื่อน” โดยไม่ขออนุญาต: (ก) ในงานแต่งงาน แขกพันคน (ข) ในร้านอาหารของตัวเอง", "โจทย์สไลด์ 33, 35", 25, 0.4),
    R(1.1, [
        P(RAYS("#fff", "#ffe9a0", 40, 55, 6), [C("ceo", "joy", 50, 66)],
          [S("เปิดซีดีเถื่อนในงานแต่ง แขกพันคน!", "ceo")], w=1, cap="(ก) งานแต่งงาน"),
        P(HT("#fff", "#d6d6d6"), [C("ceo", "smug", 50, 66)],
          [S("เปิดในร้านอาหารด้วย ไม่เก็บเงินเพิ่มนะ~", "ceo")], w=1, cap="(ข) ร้านอาหาร")], slant=-30),
    R(0.95, [
        P(FOCUS(65, 50), [C("zb", None, 24, 92, shot="half"), C("lg", None, 76, 92, shot="half")],
          [S("ผลลัพธ์: ทั้งสองกรณี “ไม่ผิด” ครับ เพราะใช้แผ่นเถื่อน จึงดูแค่ ม.31", "zb"),
           S("เหตุผล: ม.31 ต้อง “เพื่อหากำไร” โดยตรง ฎ.8220/2553 จ้ะ", "lg")], w=1)])]})

# ---- P8 แจ๊ค 4 แผ่นแท้
pages.append({"rows": [
    BOX("แจ๊ค 4: ซื้อซีดีเพลงแท้จากห้าง แล้วเปิดในร้านอาหารโดยไม่ขออนุญาต", "โจทย์สไลด์ 37", 26, 0.4),
    R(1.4, [
        P(HT("#fff2f8", "#ffc1dc"), [C("ceo", "smug", 28, 66), C("mj", "sly", 76, 68)],
          [S("งั้นซื้อแผ่นแท้มาเปิดเลย!", "ceo"), S("เปิดในร้านต้องขออนุญาตเผยแพร่ค่ะ~", "mj")], w=1.35, cap="แผ่นแท้ → ขั้นต้น ม.27(2)"),
        P(FOCUS(50, 45), [C("ceo", "shocked", 50, 66)], [S("ผิดทันทีเหรอ!?", "ceo", t="shout", size=30)], w=1, frame="heavy",
          stamps=[{"text": "ผิดทันที", "x": 52, "y": 86, "size": 66, "rot": -10}])], slant=30),
    R(0.85, [
        P(RAYS("#fff", "#dff5d8", 50, 55, 6), [C("gb", None, 75, 92, shot="full")],
          [S("ฮ่าๆ เห็นไหม ใช้แผ่นผีดีกว่า!", "gb")], w=1, cap="ฎ.5073/2560 · Strict Liability ไม่ต้องหากำไร")])]})

# ---- P9 ผลแปลก
pages.append({"rows": [
    BOX("ใช้แผ่นเถื่อน → ล็อกไว้ที่ ม.31 เท่านั้น หลุดแล้วย้อนฟ้อง ม.27/28 ไม่ได้ (กัน Absurd Result: โทษขั้นต้นหนักกว่าขั้นรอง)", "ผลทางกฎหมายที่แปลกประหลาด", 24, 0.58),
    R(1.15, [
        P(HT("#fff2f8", "#ffc1dc"), [C("mj", "furious", 26, 54), C("zb", None, 78, 80, shot="half")],
          [S("งั้นฟ้องขั้นต้นแทน!", "mj"), S("ไม่ได้ครับ! ศาลล็อกไว้", "zb")], w=1.3,
          stamps=[{"text": "ฟ้องย้อนไม่ได้", "x": 50, "y": 86, "size": 48, "rot": -6}]),
        P(FOCUS(50, 55), [C("hp", None, 50, 88, shot="half")], [S("ทุกคนเห็นอยู่ แต่ไม่มีใครพูด…", "hp", t="thought")], w=1, cap="ช้างในห้อง (Elephant in the Room)")], slant=-30),
    R(0.75, [
        P(RAYS("#fff", "#dff5d8", 50, 55, 6), [C("gb", None, 24, 92, shot="full"), C("ceo", "confused", 76, 60)],
          [S("ไม่อยากจ่ายค่าลิขสิทธิ์ ใช้แผ่นผีสิ!", "gb"), S("ตลกร้ายชะมัด…", "ceo")], w=1)])]})

# ---- P10 โทษอาญา
pages.append({"rows": [
    BOX("ม.69 (ขั้นต้น): ปรับ 20,000–200,000 · เพื่อการค้า จำคุก 6 เดือน–4 ปี หรือปรับ 100,000–800,000 หรือทั้งจำทั้งปรับ\nม.70 (ขั้นรอง): ปรับ 10,000–100,000 · เพื่อการค้า จำคุก 3 เดือน–2 ปี หรือปรับ 50,000–400,000 หรือทั้งจำทั้งปรับ", "โทษอาญา", 23, 0.68),
    R(1.3, [
        P(FOCUS(40, 50), [C("pc", None, 28, 92, shot="full"), C("ceo", "crying", 76, 60)],
          [S("ขอตัวไปโรงพักค่ะ!", "pc"), S("ผมไม่มีเจตนานะ!", "ceo")], w=1.3, fx=[{"type": "sweat", "x": 78, "y": 28, "s": 1.0}]),
        P(HT("#fff", "#d6d6d6"), [C("zb", None, 50, 92, shot="half")], [S("อาญาต้องพิสูจน์เจตนา (ป.อาญา ม.59) ต่างจากแพ่งครับ", "zb")], w=1, frame="heavy")], slant=30)]})

# ---- P11 สรุป
pages.append({"rows": [
    R(0.78, [{"bg": FLAT("#fff"), "frame": "none", "bubbles": [{"t": "box", "name": "สรุปตอนที่ 5", "size": 26, "x": 3, "y": 8, "w": 94,
                "text": "① ขั้นต้น ม.27-30: ทำสิทธิของเจ้าของ + ไม่ได้รับอนุญาต (แพ่ง Strict Liability)\n② ขั้นรอง ม.31: 4 ข้อ ต้อง “รู้” + “เพื่อหากำไร” กับงานเถื่อน\n③ ใช้แผ่นเถื่อน → ม.31 เท่านั้น ย้อน ม.27 ไม่ได้ · ใช้แผ่นแท้ → ขั้นต้น\n④ ม.64 x2 ถ้าจงใจ · ม.69 โทษหนักกว่า ม.70 · อาญาต้องมีเจตนา"}]}]),
    R(1.45, [
        P(RAYS("#fff", "#ffe14d", 50, 55, 6), [C("ceo", "crying", 26, 56), C("gb", None, 76, 74, shot="full")],
          [S("ซื้อแผ่นแท้ก็ผิด แผ่นผีก็ไม่ผิด… ผมควรทำไงดี", "ceo", t="thought"), S("แผ่นผีไหมครับเฮีย~", "gb")], w=1.4,
          stamps=[{"text": "อย่านะ!", "x": 52, "y": 84, "size": 64, "rot": -8}]),
        P(HT("#fff", "#d6d6d6"), [C("pc", None, 50, 68, shot="full")], [S("ได้ยินนะคะ!", "pc")], w=0.8, cap="ตอนจบ", frame="thin")])]})

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

json.dump({"meta": meta, "cast": cast, "pages": pages}, open("episodes/iplaw_005_content.comic.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("pages", len(pages))
