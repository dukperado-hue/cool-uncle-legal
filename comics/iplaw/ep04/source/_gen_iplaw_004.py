"""iplaw ep4 — โอนลิขสิทธิ์ ม.17 + ธรรมสิทธิ์ ม.18 (manga mode). รัน: python _gen_iplaw_004.py"""
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
def TONE(a, st="gradient"): return {"style": st, "c1": a, "c2": a}
def RAYS(a="#fff", b="#ffe14d", x=50, y=55, ang=6): return {"style": "rays", "c1": a, "c2": b, "x": x, "y": y, "a": ang}
def FOCUS(x=50, y=45): return {"style": "manga", "c1": "#fff", "c2": "#cfcfcf", "x": x, "y": y}
def HT(a="#fff", b="#c9c9c9", dot=14): return {"style": "halftone", "c1": a, "c2": b, "dot": dot}


def BOX(text, name, size=25, h=0.36):
    return R(h, [{"bg": FLAT("#fff"), "frame": "none", "bubbles": [{"t": "box", "name": name, "size": size, "text": text, "x": 3, "y": 12, "w": 94}]}])


meta = {"id": "iplaw_004_content", "group": "content", "code": "iplaw", "style": "manga",
        "series": "ทรัพย์สินทางปัญญาฉบับลุงคูล",
        "footer": "iplaw ครั้งที่ 4 · โอนลิขสิทธิ์ ม.17 · ธรรมสิทธิ์ ม.18 (เนื้อหา)"}
cast = {"ceo": "ghost_ceo", "mj": "ghost_idol_girl", "jh": "ghost_producer_boy", "zb": "lawyer_zombie",
        "cb": "ghost_contract_boss", "lg": "lawyer_ghost_old", "cba": "ghost_contract_boss_attack"}
pages = []

# ---- P1 ปก
pages.append({"rows": [R(1, [{
    "bg": RAYS("#fff", "#ffe14d", 50, 62, 6),
    "chars": [C("zb", None, 13, 44, shot="full", sticker=True, tilt=-3), C("mj", "joy", 38, 48, sticker=True, z=1),
              C("ceo", "sly", 63, 42, sticker=True, z=1), C("cb", None, 88, 40, shot="full", sticker=True, tilt=4)],
    "fx": [{"type": "sparkle", "x": 8, "y": 34, "s": 1.5}, {"type": "sparkle", "x": 92, "y": 30, "s": 1.3}],
    "bubbles": [{"t": "title", "text": "ทรัพย์สินทางปัญญา\nฉบับลุงคูล", "x": 4, "y": 4, "w": 92, "size": 86, "rot": -3},
                {"t": "label", "text": "ตอนที่ 4 · จับมือตกลงแล้ว… ขายเพลงได้จริงไหม?", "x": 6, "y": 30, "w": 88, "size": 32, "rot": 2, "c": "#fff"},
                {"t": "label", "text": "โอนลิขสิทธิ์ ม.17 · ธรรมสิทธิ์ ม.18", "x": 8, "y": 38, "w": 84, "size": 28, "rot": -2, "c": "#ffe14d"}],
    "caption": "ตอนที่ 4 (เนื้อหา)  |  มินจู · แจฮยอน · ท่านประธานค่าย · ทนายซอมบี้ · บอสสัญญา (cameo)"}])]})

# ---- P2 จับมือ = ขายแล้ว?
pages.append({"rows": [
    R(1.25, [
        P(HT("#fff2f8", "#ffc1dc"), [C("ceo", "sly", 30, 80), C("mj", "joy", 72, 72)],
          [S("เพลงนี้ประธานขอซื้อ! สิบล้านวอน จับมือตกลง!", "ceo"), S("ตกลงค่ะท่านประธาน!", "mj")], w=1.35,
          fx=[{"type": "sparkle", "x": 52, "y": 55, "s": 1.3}]),
        P(FLAT("#fff"), [C("ceo", "smug", 50, 82)], [S("จบ! เพลงเป็นของฉันแล้ว ฮ่าๆๆๆ", "ceo")], w=1, frame="heavy")], slant=30),
    R(1.0, [
        P(FOCUS(70, 40), [C("zb", None, 72, 90, shot="half"), C("jh", "confused", 26, 70)],
          [S("เดี๋ยวครับ! ตกลงกันด้วยปากเปล่า… โอนลิขสิทธิ์ไม่ได้นะครับ", "zb"), S("ซอมบี้โผล่มาจากไหนอะ!?", "jh")], w=1,
          bubble_note="ทนายซอมบี้ cameo")])]})

# ---- P3 ม.17 ว.3 เปิดกฎ
pages.append({"rows": [
    BOX("การโอนลิขสิทธิ์ ต้องทำเป็นหนังสือ ลงลายมือชื่อทั้งผู้โอนและผู้รับโอน — ไม่เช่นนั้นเป็นโมฆะ", "มาตรา 17 วรรคสาม", 27, 0.4),
    R(1.3, [
        P(HT("#fff", "#d9d9d9"), [C("zb", None, 35, 90, shot="half"), C("ceo", "shocked", 76, 70)],
          [S("ไม่มีหนังสือ = โมฆะครับ!", "zb"), S("โมฆะ?!", "ceo", t="shout", size=32)], w=1.4,
          stamps=[{"text": "โมฆะ", "x": 50, "y": 86, "size": 84, "rot": -10}],
          fx=[{"type": "shock", "x": 76, "y": 40, "s": 1.0}]),
        P(FLAT("#fff"), [C("mj", "sly", 50, 84)], [S("ปากเปล่าก็แค่ลมปากค่ะ~", "mj")], w=0.9, frame="thin")], slant=-34),
    R(0.9, [
        P(FLAT("#fff"), [C("ceo", "crying", 30, 82), C("jh", "joy", 74, 70)],
          [S("สิบล้านวอนที่จับมือไปล่ะ!?", "ceo", t="thought"), S("ผมเป็นพยาน! แต่ศาลไม่สน~", "jh")], w=1,
          fx=[{"type": "sweat", "x": 34, "y": 28, "s": 1.0}])])]})

# ---- P4 ทำหนังสือแล้ว แต่เซ็นไม่ครบ
pages.append({"rows": [
    R(1.0, [
        P(HT("#fffbe0", "#ffe27a"), [C("ceo", "joy", 50, 84)], [S("งั้นทำเป็นหนังสือ! ฉบับนี้ 300 หน้า!", "ceo")], w=1.1,
          bubbles_extra=None, fx=[{"type": "burst", "x": 50, "y": 50, "s": 1.0}]),
        P(HT("#fff", "#d9d9d9"), [C("zb", None, 50, 88, shot="half")], [S("ประธานเซ็นฝ่ายเดียว? ยังโมฆะครับ", "zb")], w=1, frame="heavy")], slant=-30),
    R(1.25, [
        P(FOCUS(40, 50), [C("ceo", "crying", 28, 80), C("mj", "sly", 74, 76)],
          [S("เซ็น… หน้า 299… มือจะขาด…", "ceo", t="thought"), S("หนูยังไม่เซ็นนะคะ~", "mj")], w=1.5,
          stamps=[{"text": "ยังโมฆะ!", "x": 52, "y": 90, "size": 64, "rot": 8}],
          fx=[{"type": "sweat", "x": 30, "y": 26, "s": 1.1}]),
        P(FLAT("#fff"), [C("jh", "confused", 50, 82)], [S("ปากกาวิ่งหนีไปแล้วครับ", "jh")], w=0.8, frame="thin")]),
    R(1.0, [
        P(RAYS("#fff", "#ffe9a0", 60, 55, 6), [C("jh", "confused", 24, 60), C("cb", None, 76, 92, shot="full")],
          [S("บอสสัญญามาเองเหรอ!?", "jh"), S("ต้องครบ: ลายมือชื่อผู้โอน + ผู้รับโอน!", "cb")], w=1)])]})

# ---- P5 ไม่ระบุเวลา = 10 ปี
pages.append({"rows": [
    R(1.0, [
        P(HT("#fff2f8", "#ffc1dc"), [C("ceo", "joy", 28, 78), C("mj", "smug", 72, 76)],
          [S("เซ็นครบสองฝ่ายแล้ว! เพลงเป็นของฉันตลอดไป!", "ceo"), S("(ยิ้มมีเลศนัย)", "mj", t="thought", size=26)], w=1.3,
          fx=[{"type": "sparkle", "x": 50, "y": 24, "s": 1.3}]),
        P(HT("#fff", "#d9d9d9"), [C("zb", None, 50, 90, shot="half")], [S("แต่สัญญาไม่ระบุเวลา… กฎหมายสันนิษฐานว่าโอนกัน 10 ปี", "zb")], w=1.1)], slant=30),
    R(1.3, [
        P({"style": "night", "c1": "#23252b", "c2": "#23252b"}, [C("cb", None, 27, 70, shot="full")],
          [], w=0.8, cap="10 ปีต่อมา…", frame="heavy",
          stamps=[{"text": "ครบ 10 ปี", "x": 60, "y": 80, "size": 48, "rot": -6}]),
        P(FOCUS(50, 50), [C("ceo", "shocked", 30, 80), C("mj", "joy", 74, 76)],
          [S("เพลงเด้งกลับไปไหนแล้ว!?", "ceo", t="shout", size=30), S("กลับบ้านแล้วจ้า~ สิทธิ์เด้งคืนเจ้าของเดิม", "mj")], w=1.6,
          fx=[{"type": "shock", "x": 30, "y": 40, "s": 1.0}, {"type": "sparkle", "x": 78, "y": 28, "s": 1.2}])]),
    R(0.55, [
        P(FLAT("#fff"), [C("jh", "joy", 50, 86)], [S("จำไว้: ไม่ระบุเวลา = 10 ปี (นักแสดง ม.51 = 3 ปี!)", "jh")], w=1, frame="none")])]})

# ---- P6 ข้อสอบหลอก: มรดก / จดแจ้ง / อนุญาต
pages.append({"rows": [
    BOX("ข้อยกเว้นและจุดที่ข้อสอบชอบหลอก", "ม.17 ต้องแยกให้ออก", 27, 0.34),
    R(1.2, [
        P(HT("#fff", "#dedede"), [C("jh", "sly", 50, 84)], [S("ตกทอดทางมรดก ไม่ต้องทำหนังสือ ไม่มี 10 ปี!", "jh")], w=1),
        P(FLAT("#fff"), [C("zb", None, 50, 90, shot="half")], [S("จดแจ้งกับกรมฯ ไม่ใช่แบบของการโอนครับ", "zb")], w=1, frame="heavy")], slant=-30),
    R(1.3, [
        P(FOCUS(35, 45), [C("ceo", "sly", 30, 80), C("mj", "smug", 74, 76)],
          [S("งั้นขอ ‘ใช้’ เพลงนะ ปากเปล่าพอ!", "ceo"), S("ได้ค่ะ อนุญาตใช้ไม่มีแบบ… แต่เพลงยังเป็นของหนู", "mj")], w=1,
          cap="ม.15(5) อนุญาตใช้สิทธิ ≠ โอน")])]})

# ---- P7 ม.18 ธรรมสิทธิ์ 2 ข้อ
pages.append({"rows": [
    BOX("ธรรมสิทธิ์: ① แสดงตนเป็นผู้สร้างสรรค์  ② ห้ามบิดเบือนงานจนเสียชื่อเสียงเกียรติคุณ", "มาตรา 18", 26, 0.4),
    R(1.25, [
        P(HT("#fff2f8", "#ffc1dc"), [C("ceo", "smug", 28, 80), C("mj", "shocked", 74, 76)],
          [S("เจ้าของแล้ว! ตัดชื่อมินจูออก ใส่ชื่อฉัน!", "ceo"), S("ชื่อหนูหายไปไหน!?", "mj", t="shout", size=30)], w=1.3,
          stamps=[{"text": "ผู้แต่ง: ท่านประธาน", "x": 50, "y": 74, "size": 38, "rot": -6}],
          cap="สิทธิแสดงตนเป็นผู้สร้างสรรค์"),
        P(HT("#fff", "#d9d9d9"), [C("zb", None, 50, 90, shot="half")], [S("ทำแบบนี้ละเมิด ม.18 ครับ", "zb")], w=0.9)], slant=30),
    R(1.2, [
        P(FOCUS(60, 45), [C("mj", "crying", 28, 80), C("ceo", "joy", 74, 74)],
          [S("เพลงรักของหนู… กลายเป็นโฆษณาแชมพูขจัดรังแค…", "mj", t="thought"), S("ขายดีจริงนะ ฮ่าๆ", "ceo")], w=1.4,
          fx=[{"type": "sweat", "x": 30, "y": 26, "s": 1.0}]),
        P(HT("#fff", "#d9d9d9"), [C("cb", None, 50, 88, shot="full")], [S("ต้องเสียหายต่อชื่อเสียงเกียรติคุณด้วย ถึงจะผิด!", "cb")], w=1, frame="thin")])]})

# ---- P8 โอนไม่ได้ + ทายาท
pages.append({"rows": [
    R(1.2, [
        P(HT("#fffbe0", "#ffe27a"), [C("ceo", "sly", 28, 80), C("mj", "confused", 74, 76)],
          [S("ซื้อธรรมสิทธิ์ด้วยเลย! อีกสิบล้านวอน!", "ceo"), S("ขายไม่ได้ค่ะ ติดตัวหนูตลอดชีวิต", "mj")], w=1.5,
          stamps=[{"text": "โอนไม่ได้", "x": 52, "y": 74, "size": 70, "rot": -10}]),
        P(FLAT("#fff"), [C("ceo", "crying", 50, 82)], [S("ซื้อไม่ได้อีกแล้ว…", "ceo", t="thought")], w=0.9, frame="thin")], slant=-30),
    R(1.3, [
        P(FOCUS(50, 45), [C("mj", "sly", 28, 78), C("jh", "joy", 74, 76)],
          [S("ถ้าหนูตาย… อุ๊บ ตายแล้วนี่นา~", "mj"), S("ทายาทฟ้องแทนได้ตลอดอายุคุ้มครองลิขสิทธิ์!", "jh")], w=1.4,
          cap="ทายาทฟ้องบังคับธรรมสิทธิ์ได้"),
        P(HT("#fff", "#d9d9d9"), [C("lg", None, 50, 90, shot="half")], [S("เว้นแต่ตกลงเป็นลายลักษณ์อักษรนะจ๊ะ", "lg")], w=0.9)])]})

# ---- P9 คดีห่านป่า (Flight Stop) + อุลตร้าแมน
pages.append({"rows": [
    BOX("Michael Snow v. Eaton Centre (แคนาดา 1982) — ประติมากรรมฝูงห่านป่า “Flight Stop” แขวนในห้าง ถูกห้างผูกริบบิ้นแดงที่คอห่านทุกตัวช่วงคริสต์มาส", "คดีห่านป่า", 24, 0.46),
    R(1.5, [
        P(FLAT("#fff"), [], [], w=0.9, cap="Flight Stop — Michael Snow (ภาพจากบทเรียน iplaw)",
          photo={"file": "pics/codex/ip4_michael_snow_flightstop.jpg", "credit": "ภาพ: จากบทเรียน iplaw", "pos": "50% 40%"}),
        P(HT("#ffeeee", "#ffbcbc"), [C("ceo", "joy", 28, 78), C("mj", "shocked", 74, 76)],
          [S("ห้างผูกริบบิ้นแดงที่คอห่านทุกตัว!", "ceo"), S("ผลงานหนูเสียชื่อเสียง!", "mj")], w=1.2,
          cap="ท่านประธาน = ห้าง · มินจู = ศิลปิน")], slant=30),
    R(0.72, [
        P(HT("#fff", "#d6d6d6"), [C("zb", None, 78, 92, shot="half")],
          [S("ศาลดูความรู้สึกศิลปินก่อน (Subjective) แล้วตบด้วยมุมมองคนทั่วไป (Objective) — ศิลปินชนะ!", "zb")], w=1)]),
    R(1.1, [
        P(FOCUS(30, 50), [C("jh", "joy", 30, 80, tilt=-6)],
          [S("Ultraman Millennium ล่ำ + มวยไทย!", "jh")], w=1.2, cap="ฎ.15453-15454/2558 อุลตร้าแมน"),
        P(HT("#fff", "#d6d6d6"), [C("lg", None, 50, 90, shot="half")], [S("ยังเป็นฮีโร่พิทักษ์โลกเหมือนเดิม = ไม่บิดเบือน ไม่ละเมิดจ้ะ", "lg")], w=1.3)], slant=-30)]})

# ---- P10 สรุป
pages.append({"rows": [
    R(0.62, [{"bg": FLAT("#fff"), "frame": "none", "bubbles": [{"t": "box", "name": "สรุป ม.17", "size": 27, "x": 3, "y": 10, "w": 94,
                "text": "① โอนต้องเป็นหนังสือ + ลงชื่อผู้โอนและผู้รับโอน ไม่งั้นโมฆะ\n② ไม่ระบุเวลา = 10 ปี (ม.51 นักแสดง = 3 ปี)\n③ มรดก / จดแจ้ง ไม่เกี่ยว   ④ อนุญาตใช้ ไม่มีแบบ"}]}]),
    R(0.72, [{"bg": FLAT("#fff"), "frame": "none", "bubbles": [{"t": "box", "name": "สรุป ม.18", "size": 27, "x": 3, "y": 8, "w": 94,
                "text": "① แสดงตนเป็นผู้สร้างสรรค์   ② ห้ามบิดเบือนจนเสียชื่อเสียง\n③ โอนไม่ได้ ติดตัวตลอดชีวิต\n④ ทายาทฟ้องได้ตลอดอายุคุ้มครอง\n⑤ ตกลงเป็นลายลักษณ์อักษรได้ (ตีความจำกัด)"}]}]),
    R(1.5, [
        P(RAYS("#fff", "#ffe14d", 50, 55, 6), [C("ceo", "crying", 26, 82), C("mj", "joy", 74, 74)],
          [S("หน้าที่ 1,000… ขอเซ็นอีกฉบับ…", "ceo", t="thought"), S("ท่านประธานคะ เพลงหน้าค่อยซื้อใหม่นะคะ~", "mj")], w=1.3,
          fx=[{"type": "sweat", "x": 28, "y": 34, "s": 1.1}]),
        P(FLAT("#fff"), [C("cb", None, 50, 76, shot="full")], [], w=0.6, cap="ตอนจบ (cameo: บอสสัญญา)", frame="thin")])]})

json.dump({"meta": meta, "cast": cast, "pages": pages}, open("episodes/iplaw_004_content.comic.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("pages", len(pages))
