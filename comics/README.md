# comics/ — โฟลเดอร์การ์ตูน Cool Uncle Comics (ที่เดียว)

```
comics/<วิชา>/ep<NN>/
    content/   ภาพเนื้อหา (png ต้นฉบับ, ไม่ขึ้น git)
    exam/      ภาพข้อสอบ/เฉลย (ไม่ขึ้น git)
    toon/      ชุด infographic แบบ toon_build (ไม่ขึ้น git)
    source/    episode json + _gen_*.py (ขึ้น git)
    web/       jpg ย่อสำหรับเว็บ (ขึ้น git)  เช่น comics/crimpro/ep01/web/p1.jpg
```
- `comic_build.py` เรนเดอร์แล้วคัดลอก png เข้า `content|exam/` อัตโนมัติ (scratch: `toon-pipeline/out/`)
- ของเก่าคัดลอกด้วย `toon-pipeline/migrate_comics.py` (ไม่ลบต้นฉบับ) — constproc ep01-06 เอาเวอร์ชันล่าสุด (ep04 = v1 + v2 ทับ), ep06 ผสม content+exam
- ep05b = เฉลยข้อสอบ constproc ครั้งที่ 5
