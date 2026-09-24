/* ข้อสอบช่วยจำ — ศัพท์กฎหมายแพ่งและพาณิชย์ภาษาอังกฤษ (LA270 ครั้งที่ 6, อ.กรศุทธิ์)
   แหล่งข้อมูล: สไลด์ "LA270 Dr Korrasut's Handout" + เสียงบรรยายครั้งที่ 6 (12 ก.ย. 2569) ผ่าน NotebookLM
   รูปแบบ: 4 ตัวเลือก ก ข ค ง — คำศัพท์ (สร้างตัวเลือกลวงจากหมวดเดียวกัน) + ข้อกับดักการแปล (เขียนมือ + คำอธิบาย) */
(function () {
  'use strict';

  /* ---------- 1) คลังคำศัพท์: [ไทย, อังกฤษ, อ้างอิง] แยกตามหมวด ---------- */
  var GROUPS = [
    { id: 'general', name: 'บททั่วไป · บุคคล (ม.4–34)', items: [
      ['การใช้กฎหมาย', 'Application of law', 'ม.4'],
      ['จารีตประเพณี', 'Custom', 'ม.4'],
      ['เทียบเคียง', 'Analogy', 'ม.4'],
      ['หลักกฎหมายทั่วไป', 'General principles of law', 'ม.4'],
      ['หลักสุจริต', 'Good faith', 'ม.5, 6'],
      ['ดอกเบี้ย', 'Interest', 'ม.7'],
      ['เหตุสุดวิสัย', 'Force majeure', 'ม.8'],
      ['หนังสือ', 'Writing', 'ม.9'],
      ['แกงได', 'Cross', 'ม.9'],
      ['เอกสาร', 'Document', 'ม.10, 12–14'],
      ['สภาพบุคคล', 'Personality', 'ม.15'],
      ['บรรลุนิติภาวะ', 'Sui juris', 'ม.19'],
      ['ผู้เยาว์', 'Minor', 'ม.20'],
      ['ผู้แทนโดยชอบธรรม', 'Legal representative', 'ม.21'],
      ['คนไร้ความสามารถ', 'Persons adjudged to be incompetent', 'ม.27'],
      ['คนเสมือนไร้ความสามารถ', 'Persons adjudged to be quasi-incompetent', 'ม.34']
    ]},
    { id: 'juristic', name: 'นิติกรรม (ม.149–193)', items: [
      ['นิติกรรม', 'Juristic act', 'ม.149'],
      ['ใจสมัคร', 'Voluntary', 'ม.149'],
      ['นิติสัมพันธ์', 'Juristic relation', 'ม.149'],
      ['วัตถุประสงค์', 'Object', 'ม.150'],
      ['ต้องห้ามชัดแจ้งโดยกฎหมาย', 'Expressly prohibited by law', 'ม.150'],
      ['พ้นวิสัย', 'Impossible', 'ม.150'],
      ['ความสงบเรียบร้อย', 'Public order', 'ม.150'],
      ['ศีลธรรมอันดีของประชาชน', 'Good moral', 'ม.150'],
      ['แบบ', 'Form', 'ม.152'],
      ['ความสามารถ', 'Capacity', 'ม.153'],
      ['สำคัญผิด', 'Mistake', 'ม.156, 157'],
      ['สาระสำคัญแห่งนิติกรรม', 'Essential element of juristic act', 'ม.156'],
      ['คุณสมบัติ', 'Quality', 'ม.157'],
      ['ประมาทเลินเล่ออย่างร้ายแรง', 'Gross negligence', 'ม.158'],
      ['กลฉ้อฉล', 'Fraud', 'ม.159'],
      ['กลฉ้อฉลโดยการนิ่ง', 'Fraud by silence', 'ม.162'],
      ['นิติกรรมสองฝ่าย', 'Bilateral juristic act', 'ม.162'],
      ['ข่มขู่', 'Duress', 'ม.164'],
      ['นับถือยำเกรง', 'Reverential fear', 'ม.165'],
      ['พฤติการณ์และสภาพแวดล้อม', 'Circumstance and environment', 'ม.167'],
      ['การแสดงเจตนา', 'Declaration of intention', 'ม.168'],
      ['บุคคลซึ่งอยู่เฉพาะหน้า', 'Person in his presence', 'ม.168'],
      ['บุคคลซึ่งไม่อยู่เฉพาะหน้า', 'Person not in his presence', 'ม.169'],
      ['เจตนาที่แท้จริง', 'True intention', 'ม.171'],
      ['การตีความการแสดงเจตนา', 'Interpretation of a declaration of intention', 'ม.171'],
      ['ถ้อยคำสำนวนหรือตัวอักษร', 'Literal meaning of the words or expression', 'ม.171'],
      ['โมฆะ', 'Void', 'ม.172'],
      ['โมฆียะ', 'Voidable', 'ม.176'],
      ['บอกล้างโมฆียะกรรม', '(To) avoid a voidable act', 'ม.175'],
      ['การให้สัตยาบัน', 'Ratification', 'ม.178'],
      ['เงื่อนไข', 'Condition', 'ม.182'],
      ['เงื่อนไขบังคับก่อน', 'Condition precedent', 'ม.183'],
      ['เงื่อนไขบังคับหลัง', 'Condition subsequent', 'ม.183'],
      ['เงื่อนเวลาเริ่มต้น', 'Time of commencement', 'ม.191'],
      ['เงื่อนเวลาสิ้นสุด', 'Time of ending', 'ม.191']
    ]},
    { id: 'contract', name: 'สัญญา (ม.354–391)', items: [
      ['คำเสนอ', 'Offer', 'ม.354–356'],
      ['บอกถอน', 'Withdraw', 'ม.354'],
      ['อยู่ห่างโดยระยะทาง', 'At a distance', 'ม.355'],
      ['อยู่เฉพาะหน้า', '(Is) present', 'ม.356'],
      ['สิ้นความผูกพัน', 'Cease to be binding', 'ม.357'],
      ['ถูกบอกปัด', 'Is refused', 'ม.357'],
      ['เพิ่มเติม มีข้อจำกัด หรือมีข้อแก้ไขอย่างอื่น', 'Additions, restrictions or other modifications', 'ม.359'],
      ['เกิด (เป็นสัญญา) ขึ้น', 'Comes into existence', 'ม.361'],
      ['ข้อความแห่งสัญญา', 'Points of a contract', 'ม.366'],
      ['สมบูรณ์', 'Valid', 'ม.367'],
      ['ตีความสัญญา', 'Interpretation of contract', 'ม.368'],
      ['ปรกติประเพณี', 'Ordinary usage', 'ม.368'],
      ['สัญญาต่างตอบแทน', 'Reciprocal contract', 'ม.369'],
      ['ทรัพยสิทธิ', 'Real right', 'ม.370'],
      ['ทรัพย์เฉพาะสิ่ง', 'Specific thing', 'ม.370'],
      ['สูญหาย', 'Lost', 'ม.370'],
      ['เสียหาย', 'Damaged', 'ม.370'],
      ['เลิกสัญญา', 'Rescission of contract', 'ม.386'],
      ['กลับสู่ฐานะเดิม', 'Restore to former condition', 'ม.391'],
      ['การงาน', 'Service', 'ม.391'],
      ['คำสนอง', 'Acceptance', 'Code civil'],
      ['ผู้เสนอ', 'Offeror', ''],
      ['ผู้รับคำเสนอ', 'Offeree', ''],
      ['ผู้ให้คำมั่น', 'Promisor', ''],
      ['ผู้รับคำมั่น', 'Promisee', '']
    ]},
    { id: 'obligation', name: 'หนี้ (ม.194–353)', items: [
      ['หนี้', 'Obligation', 'ม.194'],
      ['ลูกหนี้', 'Debtor', 'ม.194'],
      ['เจ้าหนี้', 'Creditor', 'ม.194'],
      ['การชำระหนี้', 'Performance of obligation', 'ม.194'],
      ['การงดเว้น', 'Forbearance', 'ม.194'],
      ['เวลาอันจะพึงชำระหนี้', 'Time for performance', 'ม.203'],
      ['ผิดนัด', 'In default', 'ม.204'],
      ['บังคับชำระหนี้', 'Compulsory performance', 'ม.213'],
      ['ค่าเสียหาย', 'Damages', 'ม.215'],
      ['รับช่วงสิทธิ', 'Subrogation', 'ม.226'],
      ['การใช้สิทธิเรียกร้องของลูกหนี้', "Exercising debtor's claims", 'ม.233'],
      ['เพิกถอนการฉ้อฉล', 'Cancellation of fraudulent acts', 'ม.237'],
      ['สิทธิยึดหน่วง', 'Right of retention', 'ม.241'],
      ['บุริมสิทธิ', 'Preferential rights', 'ม.251'],
      ['ลูกหนี้และเจ้าหนี้หลายคน', 'Plurality of debtors and creditors', 'หมวด 3'],
      ['ลูกหนี้ร่วม', 'Joint debtor', 'ม.292'],
      ['หนี้แบ่งชำระได้', 'Divisible claim', 'ม.297'],
      ['เจ้าหนี้ร่วม', 'Joint creditor', 'ม.298'],
      ['หนี้แบ่งชำระมิได้', 'Indivisible claim', 'ม.301'],
      ['โอนสิทธิเรียกร้อง', 'Transfer of claims', 'ม.303'],
      ['ปลดหนี้', 'Release of obligation', 'ม.340'],
      ['หักกลบลบหนี้', 'Set-off', 'ม.341'],
      ['แปลงหนี้ใหม่', 'Novation', 'ม.349'],
      ['หนี้เกลื่อนกลืนกัน', 'Merger', 'ม.353']
    ]},
    { id: 'specific', name: 'เอกเทศสัญญา (ม.453–526)', items: [
      ['ซื้อขาย', 'Sale', 'ม.453'],
      ['คำมั่นว่าจะซื้อ / คำมั่นว่าจะขาย', 'Promise to buy / Promise to sell', 'ม.454'],
      ['คำมั่นในการซื้อขาย', 'Promise of sale', 'ม.456'],
      ['สัญญาจะขายหรือจะซื้อ', 'Agreement to sell or to buy', 'ม.456'],
      ['ชำรุดบกพร่อง', 'Defect', 'ม.472'],
      ['รอนสิทธิ', 'Eviction', 'ม.475'],
      ['ข้อสัญญาว่าจะไม่ต้องรับผิด', 'Clause for nonliability', 'ม.483'],
      ['ขายฝาก', 'Sale with right of redemption', 'ม.491'],
      ['ขายทอดตลาด', 'Auction', 'ม.509'],
      ['ให้ (สัญญาให้)', 'Gift', 'ม.523'],
      ['ผู้ให้ (ในสัญญาให้)', 'Donor', 'ม.523'],
      ['ผู้รับ (ในสัญญาให้)', 'Donee', 'ม.523'],
      ['คำมั่นว่าจะให้', 'Promise of a gift', 'ม.526']
    ]},
    { id: 'property', name: 'ทรัพย์สิน (ม.137–147, 1336–1402)', items: [
      ['ทรัพย์', 'Thing', 'ม.137'],
      ['ทรัพย์สิน', 'Property', 'ม.138'],
      ['อสังหาริมทรัพย์', 'Immovable property', 'ม.139'],
      ['สังหาริมทรัพย์', 'Movable property', 'ม.140'],
      ['ส่วนควบ', 'Component part', 'ม.144'],
      ['อุปกรณ์', 'Accessories', 'ม.147'],
      ['กรรมสิทธิ์', 'Ownership', 'ม.1336'],
      ['สิทธิครอบครอง', 'Possessory right', 'ม.1367'],
      ['ภาระจำยอม', 'Servitude', 'ม.1387'],
      ['อาศัย (สิทธิอาศัย)', 'Habitation', 'ม.1402']
    ]},
    { id: 'family', name: 'ครอบครัว (ม.1435–1598/24)', items: [
      ['หมั้น', 'Betrothal', 'ม.1435'],
      ['ของหมั้น', 'Khongman', 'ม.1437'],
      ['สินสอด', 'Sinsod', 'ม.1437'],
      ['ผิดสัญญาหมั้น', 'Breach of betrothal agreement', 'ม.1438'],
      ['ค่าทดแทน', 'Compensation', 'ม.1440'],
      ['ชายคู่หมั้น', 'Betrothed man', 'ม.1441'],
      ['หญิงคู่หมั้น', 'Betrothed woman', 'ม.1442'],
      ['สมรส', 'Marriage', 'ม.1448'],
      ['คู่สมรส', 'Spouse', 'ม.1452'],
      ['ความยินยอม', 'Consent', 'ม.1456'],
      ['สินส่วนตัว', 'Sin Suan Tua', 'ม.1470'],
      ['สินสมรส', 'Sin Somros', 'ม.1470'],
      ['อำนาจปกครอง', 'Parental power', 'ม.1571'],
      ['ความปกครอง', 'Guardianship', 'ม.1585'],
      ['ผู้ปกครอง', 'Guardian', 'ม.1586'],
      ['การรับบุตรบุญธรรม', 'Adoption', 'ม.1598/20'],
      ['ผู้รับบุตรบุญธรรม', 'Adopter', 'ม.1598/24'],
      ['บุตรบุญธรรม', 'Adopted child', 'ม.1598/24']
    ]},
    { id: 'succession', name: 'มรดก (ม.1599–1657)', items: [
      ['มรดก', 'Estate', 'ม.1599'],
      ['กองมรดก', 'Estate of a deceased', 'ม.1600'],
      ['ทายาท', 'Heir', 'ม.1601'],
      ['ทายาทโดยธรรม', 'Statutory heirs', 'ม.1603'],
      ['ผู้ทำพินัยกรรม', 'Testator', 'ม.1603'],
      ['ผู้รับพินัยกรรม', 'Legatee', 'ม.1603'],
      ['พินัยกรรม', 'Will', 'ม.1646'],
      ['ผู้จัดการมรดก', 'Administrator of an estate', 'ม.1649'],
      ['ข้อกำหนดพินัยกรรม', 'Testamentary disposition', 'ม.1651'],
      ['พินัยกรรมแบบเขียนเองทั้งฉบับ', 'Holograph document will', 'ม.1657']
    ]},
    { id: 'concept', name: 'ศัพท์แนวคิดที่อาจารย์สอนในคาบ', items: [
      ['การรับกฎหมายต่างประเทศมาใช้', 'Reception of law', ''],
      ['สิ่งตอบแทน (ในกฎหมายอังกฤษ)', 'Consideration', ''],
      ['คำมั่นที่ปราศจากสิ่งตอบแทน', 'Bare promise', ''],
      ['มีผลผูกพันตามกฎหมาย', 'Legally binding', ''],
      ['ระบบคอมมอนลอว์', 'Common law', ''],
      ['ระบบซีวิลลอว์', 'Civil law system', ''],
      ['เจตนาซ่อนเร้น', 'Mental reservation', 'BGB §116'],
      ['ความไร้ความสามารถในการทำสัญญา', 'Incapacity to contract', 'BGB §104'],
      ['คำมั่นฝ่ายเดียว', 'Unilateral promise', 'Code civil 1124'],
      ['ผู้รับประโยชน์', 'Beneficiary', 'Code civil 1124'],
      ['สิทธิเลือกเข้าทำสัญญา', 'Option to conclude a contract', 'Code civil 1124'],
      ['การบอกถอน (คำมั่น)', 'Revocation', 'Code civil 1124'],
      ['การชำระหนี้โดยเฉพาะเจาะจง', 'Performance in kind', 'Code civil 1221'],
      ['หน้าที่ในการชำระหนี้', 'Duty of performance', 'BGB §241'],
      ['กฎหมายว่าด้วยหนี้', 'Law of Obligations', ''],
      ['เบี้ยปรับ', 'Stipulated penalty', 'ม.377'],
      ['มัดจำ', 'Earnest', 'ม.377'],
      ['เงินค่าเช่าล่วงหน้า', 'Advance payment', 'สัญญาเช่า'],
      ['การไม่ชำระหนี้ / การไม่ปฏิบัติตามสัญญา', 'Non-performance / Non-observance', 'สัญญาเช่า'],
      ['คืนเงิน', 'Refund', 'สัญญาเช่า'],
      ['สัญญาปฏิบัติแล้ว', 'Contract is executed', ''],
      ['ชำระหนี้ตามสัญญาครบถ้วนเสร็จสิ้น', 'Contract is completed', ''],
      ['การยุติสัญญาเฉพาะในอนาคต', 'Termination', ''],
      ['หนี้เงิน', 'Debt', ''],
      ['หน้าที่', 'Duty', '']
    ]}
  ];

  /* ---------- 2) ข้อกับดักการแปล (เขียนมือ): q, ตัวเลือก (ข้อแรก = ถูก), คำอธิบาย ---------- */
  var TRAPS = [
    ['"หนี้เงิน" (ภาษาพูด/สื่อเฉพาะหนี้เงิน) ตรงกับคำภาษาอังกฤษใด', ['Debt', 'Obligation', 'Duty', 'Liability'], 'Debt = หนี้เงินเท่านั้น ส่วน Obligation ครอบคลุมหนี้ทุกประเภท (กระทำการ งดเว้น โอนกรรมสิทธิ์)'],
    ['วิชา "กฎหมายว่าด้วยหนี้" ควรแปลเป็นภาษาอังกฤษว่าอย่างไร', ['Law of Obligations', 'Law of Debts', 'Law of Duties', 'Law of Contracts'], 'ต้องใช้ Law of Obligations ไม่ใช่ Law of Debts เพราะหนี้ไม่ได้มีแต่หนี้เงิน'],
    ['ข้อใดคือสิ่งที่ Obligation ครอบคลุม แต่ Debt ไม่ครอบคลุม', ['หนี้กระทำการ งดเว้นกระทำการ และโอนกรรมสิทธิ์', 'เฉพาะหนี้เงินกู้', 'เฉพาะหนี้ที่เกิดจากละเมิด', 'เฉพาะหนี้ที่มีเบี้ยปรับ'], 'Obligation คือหนี้ทุกประเภท ส่วน Debt สื่อถึงหนี้เงิน'],
    ['Consideration ในกฎหมายอังกฤษ แปลว่าอะไร', ['สิ่งตอบแทน / ค่าตอบแทน', 'การพิจารณา', 'การไตร่ตรอง', 'ความยินยอม'], 'Consideration = สิ่งตอบแทน (ไม่ใช่ "การพิจารณา") สัญญาใน Common Law ต้องมี consideration เสมอ'],
    ['Reception of Law แปลว่าอะไร', ['การรับกฎหมายต่างประเทศมาใช้', 'กฎหมายเกี่ยวกับพนักงานต้อนรับ', 'การรับรองกฎหมาย', 'การประกาศใช้กฎหมาย'], 'มุกของอาจารย์: ผู้เข้าสอบ ป.เอก เคยแปลผิดเป็น "กฎหมายเกี่ยวกับพนักงานต้อนรับ" (สับสนกับ reception ของโรงแรม)'],
    ['"Promise" ในกฎหมายแพ่งแปลว่าอะไร', ['คำมั่น', 'สัญญา', 'ข้อตกลง', 'คำเสนอ'], 'Promise = คำมั่น (นิติกรรมฝ่ายเดียว) ไม่ใช่ "สัญญา" ส่วน Contract = สัญญา, Agreement = ข้อตกลง'],
    ['"Contract" แปลว่าอะไร (นิติกรรมตั้งแต่สองฝ่ายขึ้นไป)', ['สัญญา', 'คำมั่น', 'คำเสนอ', 'ค่าตอบแทน'], 'Contract = สัญญา, Promise = คำมั่น, Agreement = ข้อตกลง'],
    ['ในบริบทกฎหมายไทย "Offer" และ "Promise" ใช้แทนกันได้หรือไม่ (ประเด็นที่อาจารย์เคยออกสอบ)', ['ใช้แทนกันไม่ได้ เพราะ Offer = คำเสนอ (เรื่องสัญญา) ส่วน Promise = คำมั่น (นิติกรรมฝ่ายเดียว)', 'ใช้แทนกันได้เสมอ เพราะแปลว่าสัญญาเหมือนกัน', 'ใช้แทนกันได้เฉพาะในสัญญาเช่า', 'ใช้แทนกันได้เมื่อมี Consideration'], 'ในกฎหมายอังกฤษสองคำนี้แทนกันได้เพราะอิงหลัก Consideration แต่ในกฎหมายไทยแทนกันไม่ได้'],
    ['Google Translate แปลคำอธิบาย ม.21 "อำนาจปกครองบุตร" เป็น Administrative power คำที่ถูกต้องคือ', ['Parental power', 'Parental duty', 'Guardian authority', 'Family jurisdiction'], 'Administrative power = อำนาจตามกฎหมายปกครอง แปลผิดบริบท คำที่ถูกคือ Parental power'],
    ['ในบทความเปรียบเทียบระบบกฎหมาย "Common law" ไม่ควรแปลว่า "กฎหมายทั่วไป" แต่ควรแปลว่า', ['ระบบคอมมอนลอว์', 'กฎหมายจารีตประเพณีเท่านั้น', 'กฎหมายมหาชน', 'กฎหมายแพ่ง'], 'Common law / Civil law ในบริบทนี้คือ "ระบบ" กฎหมาย ไม่ใช่ "กฎหมายทั่วไป" / "กฎหมายแพ่ง"'],
    ['คำว่า "Jurisdiction" ในบทความ Walton เรื่อง Quebec, Louisiana, Scotland หมายถึง', ['ระบบกฎหมาย (legal system)', 'เขตอำนาจศาล', 'เขตอำนาจสอบสวน', 'ศาลชั้นต้น'], 'Google Translate แปลเป็น "เขตอำนาจศาล" ทั้งที่บริบทหมายถึงระบบกฎหมาย'],
    ['เงินประกันความเสียหายในสัญญาเช่า ที่ภาคปฏิบัติเรียกว่า Deposit ตามกฎหมายแพ่งไทยมีลักษณะเป็นอะไร (ม.377)', ['เบี้ยปรับ (Stipulated penalty)', 'มัดจำ (Earnest)', 'ค่าทดแทน (Compensation)', 'ดอกเบี้ย (Interest)'], 'ไม่ใช่มัดจำตาม ม.377 แต่เป็นเบี้ยปรับ เพื่อประกันความเสียหายกรณีลูกหนี้ชำระหนี้ไม่ถูกต้อง'],
    ['"สัญญาเช่า" ในทางวิชาการนิยมใช้ศัพท์ใด', ['Hire of Property', 'Rental Agreement', 'Landlord Contract', 'Tenancy Deposit'], 'วิชาการ: Hire of Property หรือ Lease / ภาคปฏิบัติ: Lease หรือ Rental Agreement'],
    ['"ผู้ให้เช่า" ในภาคปฏิบัติ (แบบฟอร์มสัญญาเช่าทั่วไป) ใช้ว่า', ['Landlord', 'Lessor', 'Lessee', 'Tenant'], 'ภาคปฏิบัติ: Landlord/Tenant, ทางวิชาการ: Lessor/Lessee'],
    ['"ผู้เช่า" ในทางวิชาการใช้ว่า', ['Lessee', 'Tenant', 'Lessor', 'Landlord'], 'Lessor (ผู้ให้เช่า) / Lessee (ผู้เช่า) เป็นศัพท์ทางวิชาการ'],
    ['"นิติกรรม" ในประมวลกฎหมายแพ่งเยอรมัน (BGB) ใช้คำว่า', ['Legal transaction', 'Juridical act', 'Juristic act', 'Legal act of will'], 'BGB = Legal transaction, Code civil = Juridical act, ตำราไทยส่วนใหญ่ = Juristic act (ตำรา ศ.ไชยยศ ใช้ Legal transaction)'],
    ['"นิติกรรม" ในประมวลกฎหมายแพ่งฝรั่งเศส (Code civil) ใช้คำว่า', ['Juridical act', 'Legal transaction', 'Juristic act', 'Declaration of intent'], 'Code civil = Juridical act'],
    ['"นิติกรรม" ที่ตำรากฎหมายไทยส่วนใหญ่นิยมใช้คือ', ['Juristic act', 'Legal transaction', 'Juridical act', 'Business deal'], 'ตำราไทยส่วนใหญ่ใช้ Juristic Act (ยกเว้นตำรา ศ.ไชยยศ ที่ใช้ Legal transaction)'],
    ['"การแสดงเจตนา" ใน BGB ใช้คำว่า', ['Declaration of intent', 'Manifestation of will', 'Expression of purpose', 'Statement of offer'], 'BGB = Declaration of intent, Code civil = Manifestation of will'],
    ['"การแสดงเจตนา" ใน Code civil (ฝรั่งเศส) ใช้คำว่า', ['Manifestation of will', 'Declaration of intent', 'Mental reservation', 'Acceptance'], 'Code civil = Manifestation of will'],
    ['"เจ้าหนี้ / ลูกหนี้" ใน BGB (เยอรมัน) ตรงตามรากศัพท์ Obligation ใช้คำว่า', ['Obligee / Obligor', 'Creditor / Debtor', 'Promisee / Promisor', 'Lessor / Lessee'], 'BGB ใช้ Obligee/Obligor ขณะที่ฝรั่งเศสและไทยนิยมใช้ Creditor/Debtor'],
    ['ตาม BGB มาตรา 104 บุคคลต้องมีอายุเท่าใดจึงจะทำนิติกรรมได้ (ไม่ถือว่า Incapacity to contract)', ['7 ขวบขึ้นไป', '10 ขวบขึ้นไป', '15 ปีขึ้นไป', '20 ปีบริบูรณ์'], 'BGB §104 กำหนดชัดเจนที่ 7 ขวบ ต่างจากกฎหมายไทยที่ตีความตามความรู้สึกผิดชอบเป็นรายกรณี'],
    ['"Mental reservation" (BGB §116) ตรงกับเรื่องใดในกฎหมายไทย', ['เจตนาซ่อนเร้น (ม.154)', 'สำคัญผิด (ม.156)', 'กลฉ้อฉล (ม.159)', 'ข่มขู่ (ม.164)'], 'Mental reservation = เจตนาซ่อนเร้น'],
    ['ม.4 (นิติวิธี) ฉบับกฤษฎีกาใช้ "either under the letter or the intent" อาจารย์ชี้ว่าผิดเพราะอะไร', ['"either…or" สื่อว่าเลือกตัวอักษรหรือเจตนารมณ์อย่างใดอย่างหนึ่งได้ ทั้งที่ต้องใช้ทั้งสองประกอบกัน', 'ใช้คำว่า letter ผิด ต้องใช้ word', 'ไม่ได้กล่าวถึงจารีตประเพณี', 'ใช้ shall แทน must'], 'ศ.กมลใช้ "letter and spirit … must be applied" ถูกหลักนิติวิธีที่สุด'],
    ['ม.4 ฉบับ ศ.กมล สนธิเกษตริน ใช้วลีใด', ['letter and spirit … must be applied', 'letter or spirit … shall be applied', 'come either under the letter or the intent', 'text and purpose … is applied'], 'ศ.กมล: letter and spirit / ศ.เข็มชัย: letter or spirit / กฤษฎีกา: either…or'],
    ['ม.241 (สิทธิยึดหน่วง) ฉบับใดใช้ "obligation in his favour" ซึ่งอาจารย์ว่าตรงที่สุด', ['ฉบับ ศ.กมล (possessor)', 'ฉบับ ศ.เข็มชัย (holder)', 'ฉบับกฤษฎีกา (has a claim that has arisen)', 'ไม่มีฉบับใด'], 'in his favour ชี้ชัดว่าหนี้ต้องเป็นประโยชน์แก่ผู้ครองทรัพย์โดยตรง'],
    ['ม.361 (การเกิดสัญญา) ฉบับใดที่อาจารย์ชี้ว่าคลาดเคลื่อนเพราะใช้ "shall be bound"', ['ฉบับ ศ.เข็มชัย', 'ฉบับ ศ.กมล', 'ฉบับกฤษฎีกา', 'ทั้งสามฉบับ'], '"shall be bound" พูดถึงผลผูกพันของสัญญา ไม่ใช่ขณะที่สัญญาเกิดขึ้น (ศ.กมล: comes into existence, กฤษฎีกา: shall be formed)'],
    ['"Contract is executed" หมายความว่าอย่างไร', ['ปฏิบัติตามสัญญาแล้ว (ไม่ได้แปลว่าสัญญาเกิดขึ้น)', 'สัญญาเกิดขึ้นแล้ว', 'สัญญาตกเป็นโมฆะ', 'สัญญาถูกเลิกแล้ว'], 'executed = ปฏิบัติตามสัญญาแล้ว ส่วน completed = ชำระหนี้ครบถ้วนเสร็จสิ้น ไม่ใช่การเกิดสัญญา'],
    ['"Contract is completed" หมายความว่าอย่างไร', ['ชำระหนี้ตามสัญญาครบถ้วนเสร็จสิ้นแล้ว', 'สัญญาเกิดขึ้นแล้ว', 'คู่สัญญาตกลงกันได้แล้ว', 'สัญญาถูกบอกล้าง'], 'completed = ชำระหนี้ครบถ้วน'],
    ['ม.386 (การเลิกสัญญา) ฉบับใดใช้คำว่า "terminate/termination"', ['ฉบับกฤษฎีกา', 'ฉบับ ศ.กมล', 'ฉบับ ศ.เข็มชัย', 'ทั้งฉบับ ศ.กมล และ ศ.เข็มชัย'], 'ศ.กมลและ ศ.เข็มชัยใช้ rescission/rescind ตรงกัน ส่วนกฤษฎีกาใช้ termination'],
    ['Rescission ต่างจาก Termination อย่างไร', ['Rescission ทำให้คู่สัญญากลับสู่ฐานะเดิม (ม.391) ส่วน Termination ยุติสัญญามีผลเฉพาะไปข้างหน้า', 'Rescission มีผลเฉพาะไปข้างหน้า ส่วน Termination ย้อนหลังถึงวันทำสัญญา', 'ไม่ต่างกัน ใช้แทนกันได้', 'Rescission ใช้เฉพาะสัญญาเช่า'], 'Termination ใช้กับสัญญาต่อเนื่อง เช่น สัญญาเช่า สัญญาจ้างแรงงาน'],
    ['ม.479 (การรอนสิทธิ) ฉบับกฤษฎีกาแปลว่า Infringement ซึ่งคลาดเคลื่อน เพราะเหตุใด', ['Infringement ปกติใช้กับการละเมิดทรัพย์สินทางปัญญา', 'Infringement แปลว่าการซื้อขาย', 'Infringement ใช้เฉพาะสัญญาเช่า', 'Infringement เป็นภาษาละติน'], 'คำที่ถูกคือ Eviction / Liability for eviction (ศ.กมล และ ศ.เข็มชัย)'],
    ['"การรอนสิทธิ" ฉบับ ศ.กมล ใช้คำว่า', ['Eviction', 'Infringement', 'Trespass', 'Defect'], 'Eviction / liability for eviction'],
    ['ม.1437 "สินสอด" ฉบับกฤษฎีกาแปลว่า Bride price ซึ่งอาจารย์ชี้ว่าเป็นอย่างไร', ['คำแปลที่อาจทำให้เข้าใจผิดทางวัฒนธรรมมากที่สุด (ฟังเหมือนราคาซื้อขายเจ้าสาว)', 'คำแปลที่ตรงที่สุด', 'คำที่ ศ.กมลใช้', 'คำที่ใช้กับ "ของหมั้น"'], 'ศ.กมลทับศัพท์ Khongman/Sinsod เพื่อรักษาอัตลักษณ์จารีตไทย, ศ.เข็มชัยใช้ betrothal gift / marriage gift'],
    ['ศ.กมล สนธิเกษตริน แปล "สินสอด" (ม.1437) ว่าอย่างไร', ['Sinsod (ทับศัพท์)', 'Bride price', 'Marriage gift (Sin-Sod)', 'Dowry'], 'ศ.กมลทับศัพท์ตรงตัว ส่วน ศ.เข็มชัยใช้ marriage gift (Sin-Sod) และกฤษฎีกาใช้ bride price'],
    ['"การหมั้น" (ม.1435) ฉบับกฤษฎีกาใช้คำว่า', ['Engagement', 'Betrothal', 'Promise of marriage', 'Marriage gift'], 'ศ.กมล/ศ.เข็มชัยใช้ Betrothal, กฤษฎีกาใช้ Engagement'],
    ['"Promise of marriage" เคยใช้ในกฎหมายอังกฤษ แต่ถูกยกเลิกสถานะทางกฎหมายโดยกฎหมายฉบับใด', ['Law Reform Act 1970', 'Law Reform Act 1984', 'Marriage Act 1949', 'Civil Code 1804'], 'Law Reform Act 1970 (อังกฤษ) — ส่วนสกอตแลนด์คือ 1984 ในกฎหมายไทยจะแปลว่า "คำมั่นว่าจะสมรส" ซึ่งบังคับไม่ได้'],
    ['ตำรา "Juristic Acts, Contracts and Promises" เป็นตำราของใคร', ['รศ.ดร.กรศุทธิ์ ขอพ่วงกลาง (ผู้สอนคาบนี้)', 'ศ.ไชยยศ เหมรัชตะ', 'ผศ.ดร.กิติภพ วังคีรี', 'ศ.ดร.ปีติ เอี่ยมแชมรุญลาภ'], 'แปลจากตำรานิติกรรม สัญญา และคำมั่น / Contract Law in Thailand = ศ.ดร.ปีติ / Tort Law in Thailand = ศ.ดร.ศักดา / Family Law in Thailand Vol.1 = ผศ.ดร.กิติภพ'],
    ['ตำราใดที่ใช้ "Legal transaction" แทน "Juristic Act"', ['An Introduction to Legal Transaction and Contract (ศ.ไชยยศ)', 'Juristic Acts, Contracts and Promises', 'Contract Law in Thailand', 'Tort Law in Thailand'], 'ตำรา ศ.ไชยยศ ใช้ Legal transaction'],
    ['"Faculty of Law" กับ "Law School" ใช้ฝั่งใด', ['Faculty of Law = ฝั่งอังกฤษ / Law School = ฝั่งสหรัฐฯ', 'Faculty of Law = ฝั่งสหรัฐฯ / Law School = ฝั่งอังกฤษ', 'ใช้ได้ทั้งสองฝั่งไม่มีความต่าง', 'ทั้งสองคำเป็นศัพท์ฝรั่งเศส'], 'ป้ายคณะนิติศาสตร์ ธรรมศาสตร์ปรับมาใช้ "Thammasat Law School"'],
    ['สัญญาให้เปล่าโดยปราศจากค่าตอบแทน (Bare promise) ในกฎหมายอังกฤษมีผลอย่างไร', ['ไม่มีผลผูกพันตามกฎหมาย เพราะขาด consideration', 'มีผลผูกพันเต็มที่', 'เป็นโมฆียะ บอกล้างได้', 'ต้องจดทะเบียนก่อนจึงมีผล'], 'สัญญาใน Common Law ต้องมี consideration เสมอ ต่างจากที่กฎหมายไทยยอมรับสัญญาให้เปล่า'],
    ['ม.362 (คำมั่นโฆษณาว่าจะให้รางวัล) ฉบับ ศ.กมล ใช้วลีใด', ['promises that he will give a reward', 'issued an advertisement promises', 'places an advertisement to promise', 'offers a prize by notice'], 'ศ.เข็มชัย: issued an advertisement promises / กฤษฎีกา: places an advertisement to promise'],
    ['ม.171 หลักการตีความสัญญาของศาลไทย ต้องตีความตามสิ่งใดยิ่งกว่าถ้อยคำสำนวน', ['เจตนาที่แท้จริง (True intention)', 'ปรกติประเพณี (Ordinary usage)', 'สิ่งตอบแทน (Consideration)', 'ความสงบเรียบร้อย (Public order)'], 'ม.171: True intention over literal meaning of the words or expression'],
    ['ประเภทข้อสอบที่อาจารย์แจ้งสำหรับการสอบเก็บคะแนนหัวข้อนี้ (26 ก.ย. 2569) คือ', ['ตัวเลือก เติมคำ ถูก-ผิด ประมาณ 20 ข้อ ข้อละ 0.5 คะแนน', 'ข้อเขียนบรรยายยาว 3 ข้อ', 'แปลบทความภาษาอังกฤษทั้งหน้า', 'ปากเปล่าตัวต่อตัว'], 'สอบ 1 ชั่วโมง (11.00–12.00 น.) รวม 10 คะแนน ไม่มีข้อเขียนบรรยายยาว']
  ];

  var LABELS = ['ก', 'ข', 'ค', 'ง'];

  /* ---------- 3) ตัวช่วยสุ่ม/สร้างข้อสอบ ---------- */
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function clash(a, b) {
    a = a.toLowerCase(); b = b.toLowerCase();
    return a === b || a.indexOf(b) >= 0 || b.indexOf(a) >= 0;
  }
  var ALL_ITEMS = [];
  GROUPS.forEach(function (g) {
    g.items.forEach(function (it) { ALL_ITEMS.push({ th: it[0], en: it[1], ref: it[2], g: g.id, gname: g.name }); });
  });

  function makeVocabQ(item, dir) {
    /* dir: 'th2en' | 'en2th' */
    var pool = ALL_ITEMS.filter(function (x) { return x !== item && x.g === item.g; });
    var other = ALL_ITEMS.filter(function (x) { return x !== item && x.g !== item.g; });
    var key = dir === 'th2en' ? 'en' : 'th';
    var qkey = dir === 'th2en' ? 'th' : 'en';
    var chosen = [];
    function take(list) {
      shuffle(list).forEach(function (x) {
        if (chosen.length >= 3) return;
        if (clash(x[key], item[key]) || clash(x[qkey], item[qkey])) return;
        if (chosen.some(function (c) { return clash(c[key], x[key]); })) return;
        chosen.push(x);
      });
    }
    take(pool); if (chosen.length < 3) take(other);
    var opts = shuffle([item].concat(chosen)).map(function (x) { return x[key]; });
    var refTxt = item.ref ? ' (' + item.ref + ')' : '';
    return {
      type: 'vocab', group: item.gname,
      q: dir === 'th2en' ? '“' + item.th + '”' + refTxt + ' แปลเป็นภาษาอังกฤษว่าอะไร' : '“' + item.en + '”' + refTxt + ' แปลว่าอะไร',
      opts: opts, a: opts.indexOf(item[key]),
      exp: item.th + ' = ' + item.en
    };
  }
  function makeTrapQ(t) {
    var opts = shuffle(t[1].map(function (o, i) { return { o: o, ok: i === 0 }; }));
    return { type: 'trap', group: 'กับดักการแปล · ประเด็นที่อาจารย์เน้น', q: t[0], opts: opts.map(function (x) { return x.o; }), a: opts.findIndex(function (x) { return x.ok; }), exp: t[2] };
  }

  function buildSet(mode, dirPref, groupId) {
    function dir() { return dirPref === 'mix' ? (Math.random() < 0.5 ? 'th2en' : 'en2th') : dirPref; }
    var qs = [];
    if (mode === 'exam') {
      /* จำลองสอบ 20 ข้อ: กับดัก 8 + ศัพท์ 12 (กระจายหมวด) */
      shuffle(TRAPS).slice(0, 8).forEach(function (t) { qs.push(makeTrapQ(t)); });
      shuffle(ALL_ITEMS).slice(0, 12).forEach(function (it) { qs.push(makeVocabQ(it, dir())); });
      return shuffle(qs);
    }
    if (mode === 'trap') return shuffle(TRAPS).map(makeTrapQ);
    if (mode === 'group') {
      shuffle(ALL_ITEMS.filter(function (x) { return x.g === groupId; })).forEach(function (it) { qs.push(makeVocabQ(it, dir())); });
      return qs;
    }
    /* all */
    ALL_ITEMS.forEach(function (it) { qs.push(makeVocabQ(it, dir())); });
    TRAPS.forEach(function (t) { qs.push(makeTrapQ(t)); });
    return shuffle(qs);
  }

  /* ---------- 4) UI ---------- */
  var css = '' +
    '.vq{margin:10px 0 40px}' +
    '.vq h2{font-size:18px;margin:6px 0 4px;color:var(--ink)}' +
    '.vq .vq-sub{font-size:13px;color:var(--ink-soft);margin:0 0 14px;line-height:1.6}' +
    '.vq-card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow);padding:16px;margin:12px 0}' +
    '.vq-row{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}' +
    '.vq-btn{font-family:inherit;font-size:14px;font-weight:700;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:12px;padding:10px 14px;cursor:pointer;transition:all .15s}' +
    '.vq-btn:hover{border-color:var(--gold)}' +
    '.vq-btn.on{background:var(--accent);border-color:var(--accent);color:#fff}' +
    '.vq-btn.go{background:var(--gold);border-color:var(--gold);color:#fff}' +
    '.vq-lab{font-size:12.5px;font-weight:800;color:var(--gold);margin:14px 0 4px}' +
    '.vq-bar{height:6px;background:var(--line);border-radius:99px;overflow:hidden;margin:6px 0 12px}' +
    '.vq-bar>i{display:block;height:100%;background:var(--accent);transition:width .25s}' +
    '.vq-meta{display:flex;justify-content:space-between;gap:8px;font-size:12.5px;color:var(--ink-soft);flex-wrap:wrap}' +
    '.vq-q{font-size:17px;font-weight:800;line-height:1.55;margin:10px 0 12px;color:var(--ink)}' +
    '.vq-opt{display:flex;gap:10px;align-items:flex-start;width:100%;text-align:left;font-family:inherit;font-size:15px;line-height:1.5;border:1.5px solid var(--line);background:var(--card);color:var(--ink);border-radius:12px;padding:11px 13px;margin:8px 0;cursor:pointer;transition:all .12s}' +
    '.vq-opt:hover:not([disabled]){border-color:var(--accent)}' +
    '.vq-opt b{flex:0 0 26px;height:26px;border-radius:50%;background:var(--gold-soft);color:var(--gold);display:flex;align-items:center;justify-content:center;font-size:13px}' +
    '.vq-opt.ok{border-color:var(--ok);background:var(--ok-bg)}' +
    '.vq-opt.bad{border-color:var(--bad);background:var(--bad-bg)}' +
    '.vq-exp{margin-top:10px;padding:10px 13px;border-radius:12px;background:var(--gold-soft);font-size:13.5px;line-height:1.65;color:var(--ink)}' +
    '.vq-score{font-size:34px;font-weight:900;color:var(--accent);margin:4px 0}' +
    '.vq-wrong{font-size:13.5px;line-height:1.65;border-top:1px dashed var(--line);padding:8px 0}' +
    '.vq-wrong small{color:var(--ink-soft)}' +
    '@media(max-width:520px){.vq-btn{flex:1 1 100%}.vq-q{font-size:16px}}';

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var root, state = { mode: 'exam', dir: 'mix', group: GROUPS[0].id };
  var run = null;

  function best() { try { return JSON.parse(localStorage.getItem('legaleng-vq-best') || 'null'); } catch (e) { return null; } }
  function saveBest(pct, mode) {
    if (mode !== 'exam') return;
    try { var b = best(); if (!b || pct > b.pct) localStorage.setItem('legaleng-vq-best', JSON.stringify({ pct: pct })); } catch (e) {}
  }

  function renderSetup() {
    var b = best();
    var h = '<div class="vq"><h2>🧠 ข้อสอบช่วยจำ — ศัพท์กฎหมายแพ่งและพาณิชย์ (ครั้งที่ 6)</h2>' +
      '<p class="vq-sub">คำศัพท์ ' + ALL_ITEMS.length + ' คำ (สไลด์ Handout อ.กรศุทธิ์ + คำที่อาจารย์เน้นในคาบ) และข้อกับดักการแปล ' + TRAPS.length + ' ข้อ · ปรนัย 4 ตัวเลือก ก ข ค ง · ตอบแล้วเห็นเฉลยทันที' +
      (b ? ' · คะแนนสูงสุดโหมดจำลองสอบ: <b>' + b.pct + '%</b>' : '') + '</p>' +
      '<div class="vq-card"><div class="vq-lab">โหมด</div><div class="vq-row" id="vq-modes">' +
      [['exam', '📝 จำลองสอบ 20 ข้อ'], ['trap', '⚠️ กับดักการแปล'], ['group', '📚 ฝึกทีละหมวด'], ['all', '🔁 ทุกคำ ทุกข้อ']].map(function (m) {
        return '<button type="button" class="vq-btn' + (state.mode === m[0] ? ' on' : '') + '" data-mode="' + m[0] + '">' + m[1] + '</button>';
      }).join('') + '</div>' +
      '<div id="vq-groupbox" style="display:' + (state.mode === 'group' ? 'block' : 'none') + '"><div class="vq-lab">หมวด</div><div class="vq-row">' +
      GROUPS.map(function (g) { return '<button type="button" class="vq-btn' + (state.group === g.id ? ' on' : '') + '" data-group="' + g.id + '">' + esc(g.name) + ' · ' + g.items.length + '</button>'; }).join('') + '</div></div>' +
      '<div class="vq-lab">ทิศทางของโจทย์ศัพท์</div><div class="vq-row">' +
      [['mix', 'สลับไทย↔อังกฤษ'], ['th2en', 'ไทย → อังกฤษ'], ['en2th', 'อังกฤษ → ไทย']].map(function (d) {
        return '<button type="button" class="vq-btn' + (state.dir === d[0] ? ' on' : '') + '" data-dir="' + d[0] + '">' + d[1] + '</button>';
      }).join('') + '</div>' +
      '<div class="vq-row" style="margin-top:16px"><button type="button" class="vq-btn go" id="vq-start">เริ่มทำข้อสอบ ▶</button></div></div>' +
      '<p class="vq-sub">หมายเหตุ: จัดทำโดย AI จากสไลด์และเสียงบรรยาย ตรวจสอบกับสไลด์อีกครั้งก่อนสอบ · ข้อสอบจริง (เสาร์ 26 ก.ย. 2569 11.00–12.00 น.) ประมาณ 20 ข้อ ข้อละ 0.5 คะแนน ตัวเลือก/เติมคำ/ถูก-ผิด</p></div>';
    root.innerHTML = h;
    root.querySelectorAll('[data-mode]').forEach(function (b) { b.onclick = function () { state.mode = b.dataset.mode; renderSetup(); }; });
    root.querySelectorAll('[data-group]').forEach(function (b) { b.onclick = function () { state.group = b.dataset.group; renderSetup(); }; });
    root.querySelectorAll('[data-dir]').forEach(function (b) { b.onclick = function () { state.dir = b.dataset.dir; renderSetup(); }; });
    document.getElementById('vq-start').onclick = function () { start(buildSet(state.mode, state.dir, state.group), state.mode); };
  }

  function start(qs, mode) {
    run = { qs: qs, i: 0, score: 0, wrong: [], mode: mode, answered: false };
    renderQ();
  }

  function renderQ() {
    var q = run.qs[run.i], n = run.qs.length;
    var h = '<div class="vq"><div class="vq-meta"><span>ข้อ ' + (run.i + 1) + ' / ' + n + ' · ' + esc(q.group) + '</span><span>ถูก ' + run.score + '</span></div>' +
      '<div class="vq-bar"><i style="width:' + (run.i / n * 100) + '%"></i></div>' +
      '<div class="vq-card"><div class="vq-q">' + esc(q.q) + '</div><div id="vq-opts">' +
      q.opts.map(function (o, k) { return '<button type="button" class="vq-opt" data-k="' + k + '"><b>' + LABELS[k] + '</b><span>' + esc(o) + '</span></button>'; }).join('') +
      '</div><div id="vq-fb"></div></div>' +
      '<div class="vq-row"><button type="button" class="vq-btn" id="vq-quit">← กลับหน้าตั้งค่า</button></div></div>';
    root.innerHTML = h;
    run.answered = false;
    root.querySelectorAll('.vq-opt').forEach(function (b) { b.onclick = function () { answer(+b.dataset.k); }; });
    document.getElementById('vq-quit').onclick = renderSetup;
  }

  function answer(k) {
    if (run.answered) return;
    run.answered = true;
    var q = run.qs[run.i], ok = k === q.a;
    if (ok) run.score++; else run.wrong.push({ q: q, picked: k });
    root.querySelectorAll('.vq-opt').forEach(function (b, idx) {
      b.disabled = true;
      if (idx === q.a) b.classList.add('ok');
      else if (idx === k) b.classList.add('bad');
    });
    var last = run.i === run.qs.length - 1;
    document.getElementById('vq-fb').innerHTML =
      '<div class="vq-exp">' + (ok ? '✅ ถูกต้อง' : '❌ ตอบผิด — เฉลย: ' + LABELS[q.a] + '. ' + esc(q.opts[q.a])) + '<br>' + esc(q.exp) + '</div>' +
      '<div class="vq-row"><button type="button" class="vq-btn go" id="vq-next">' + (last ? 'ดูผลคะแนน' : 'ข้อต่อไป ▶') + '</button></div>';
    var nx = document.getElementById('vq-next'); nx.onclick = next; nx.focus();
  }

  function next() {
    if (run.i < run.qs.length - 1) { run.i++; renderQ(); } else renderResult();
  }

  function renderResult() {
    var n = run.qs.length, pct = Math.round(run.score / n * 100);
    saveBest(pct, run.mode);
    var h = '<div class="vq"><div class="vq-card"><h2>ผลคะแนน</h2><div class="vq-score">' + run.score + ' / ' + n + ' (' + pct + '%)</div>' +
      '<div class="vq-sub">' + (pct >= 90 ? 'แม่นมาก พร้อมสอบ 🎯' : pct >= 70 ? 'ดีแล้ว ทบทวนข้อที่ผิดอีกรอบ' : 'ลองทำซ้ำ โดยเฉพาะข้อกับดักการแปล') + '</div>' +
      '<div class="vq-row"><button type="button" class="vq-btn go" id="vq-again">ทำใหม่ (สุ่มชุดใหม่)</button>' +
      (run.wrong.length ? '<button type="button" class="vq-btn" id="vq-retry">ทำเฉพาะข้อที่ผิดซ้ำ (' + run.wrong.length + ')</button>' : '') +
      '<button type="button" class="vq-btn" id="vq-home">กลับหน้าตั้งค่า</button></div></div>';
    if (run.wrong.length) {
      h += '<div class="vq-card"><div class="vq-lab">ข้อที่ตอบผิด</div>' + run.wrong.map(function (w) {
        return '<div class="vq-wrong"><b>' + esc(w.q.q) + '</b><br>✅ ' + esc(w.q.opts[w.q.a]) + '<br><small>❌ ที่คุณตอบ: ' + esc(w.q.opts[w.picked]) + ' · ' + esc(w.q.exp) + '</small></div>';
      }).join('') + '</div>';
    }
    h += '</div>';
    root.innerHTML = h;
    document.getElementById('vq-again').onclick = function () { start(buildSet(state.mode, state.dir, state.group), state.mode); };
    document.getElementById('vq-home').onclick = renderSetup;
    var r = document.getElementById('vq-retry');
    if (r) r.onclick = function () { start(shuffle(run.wrong.map(function (w) { return w.q; })), 'retry'); };
  }

  document.addEventListener('keydown', function (e) {
    if (!run || !root || !root.offsetParent) return;
    if (run.answered) { if (e.key === 'Enter') { var nx = document.getElementById('vq-next'); if (nx) next(); } return; }
    var k = '1234'.indexOf(e.key);
    if (k >= 0 && document.querySelector('.vq-opt')) answer(k);
  });

  function init() {
    root = document.getElementById('vocab-quiz-root');
    if (!root) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    renderSetup();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.LEGALENG_VQ = { items: ALL_ITEMS.length, traps: TRAPS.length, buildSet: buildSet };
})();
