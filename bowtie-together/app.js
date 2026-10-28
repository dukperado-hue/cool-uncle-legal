/* Bowtie Together — collaborative edition of Bowtie888, local persistence and PDF export */
(() => {
  'use strict';
  const STORAGE_KEY = 'bowtie-together-v1';
  const LEGACY_STORAGE_KEY = 'bowtie888-v2';
  const LANG_KEY = 'bowtie888-language';
  const LEGACY_LANG_KEY = 'bowtie-studio-language';
  const $ = (id) => document.getElementById(id);
  const uid = () => (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  const dict = {
    en: {
      brandCaption:'RISK ANALYSIS WORKSPACE',workspace:'WORKSPACE',overview:'Overview',myAnalyses:'MY ANALYSES',yourDataStaysHere:'Your data stays here',privacyDescription:'Saved in this browser. Export JSON to back up or move your work.',offlineFirst:'Local-first workspace',bowtieAnalysis:'BowTie Analysis',allChangesSaved:'All changes saved',safetyWorkspace:'SAFETY MANAGEMENT WORKSPACE',importJson:'Import JSON',backupJson:'Backup JSON',exportPdf:'Export PDF',threats:'Threats',preventiveControls:'Preventive controls',recoveryControls:'Recovery controls',consequences:'Consequences',visualAnalysis:'VISUAL ANALYSIS',bowtieDiagram:'BowTie Diagram',diagramHelper:'Select any item to edit. Use + to add paths and controls.',addThreat:'Add threat',addConsequence:'Add consequence',preventive:'Prevention',recovery:'Recovery',centralEvent:'Central event',preventionPath:'Prevention path',recoveryPath:'Recovery path',effective:'Effective',needsReview:'Needs review',planned:'Planned',scrollToExplore:'Scroll horizontally to explore →',analysisContext:'ANALYSIS CONTEXT',hazardAndEvent:'Hazard & Top Event',editDetails:'Edit details ↗',hazard:'Hazard',topEvent:'Top event',quickStart:'QUICK ACTIONS',keepBuilding:'Keep building',quickCopy:'Capture hazards, map preventive and recovery barriers, then export a complete analysis report.',addThreatPath:'Add a new threat path',addConsequencePath:'Add a new consequence path',createAnotherAnalysis:'Create another analysis',madeForRisk:'Made for thoughtful risk management',offlinePrivate:'Private by design · Stored on this device',delete:'Delete',cancel:'Cancel',saveChanges:'Save changes',threat:'Threat',consequence:'Consequence',preventiveControl:'Preventive control',recoveryControl:'Recovery control',addControl:'+ Add barrier',noControls:'No barriers yet',eventHelper:'Loss of control',editAnalysis:'Analysis settings',editHazard:'Edit hazard',editTopEvent:'Edit top event',editThreat:'Edit threat',editConsequence:'Edit consequence',editPreventive:'Edit preventive barrier',editRecovery:'Edit recovery barrier',analysisTitle:'Analysis title',subtitle:'Subtitle / context',owner:'Owner / department',version:'Version',itemTitle:'Title',description:'Description / notes',controlStatus:'Barrier effectiveness',escalation:'Escalation factor',escalationHint:'What might reduce or defeat the effectiveness of this barrier?',escalationControl:'Escalation factor control',escalationControlHint:'What prevents the escalation factor from undermining this barrier?',ownerHint:'Optional person or responsible department',projectHint:'Your analysis is saved in this browser automatically whenever you make a change.',newAnalysis:'New analysis',newAnalysisSubtitle:'Create a BowTie risk and barrier analysis',newHazard:'Define the hazardous activity or condition',newEvent:'Define the moment control is lost',newThreat:'New threat',newConsequence:'New consequence',newPreventive:'New preventive barrier',newRecovery:'New recovery barrier',analysis:'Analysis',updated:'Updated',today:'today',justNow:'just now',sample:'Example',created:'Analysis created',saved:'Changes saved',deleted:'Item deleted',imported:'Analysis imported',downloaded:'Backup downloaded',exported:'PDF report downloaded',unexpectedFile:'Could not read this JSON file.',invalidProject:'This file is not a valid Bowtie888 project.',confirmDelete:'Delete this item? This cannot be undone.',confirmDeleteProject:'Permanently delete “{name}”? All associated threats, barriers, escalation factors and controls will be lost. This cannot be undone.',deleteProject:'Delete project',projectDeleted:'Project deleted',cannotDeleteLast:'Keep at least one analysis. Create another before deleting this one.',localStorageFail:'Browser storage is unavailable. Export JSON to keep a copy.',pdfFail:'Could not generate the PDF report.',removeAnalysis:'Delete analysis',duplicateAnalysis:'Duplicate this analysis',duplicated:'Analysis duplicated',untitled:'Untitled analysis',pdfOverview:'ANALYSIS OVERVIEW',pdfReport:'BOWTIE SAFETY REPORT',pdfThreatDetail:'THREAT & PREVENTION',pdfConsequenceDetail:'CONSEQUENCE & RECOVERY',pdfDetails:'PATH DETAIL',pdfPath:'PATH',pdfControls:'BARRIERS',pdfNoControl:'No barriers recorded',pdfNoDesc:'No description provided',pdfAdditional:'Additional paths are included on the following pages',pdfPage:'Page',pdfStatus:'Status',pdfEscalation:'Escalation factor',pdfEscalationControl:'Escalation factor control',pdfNotes:'Notes',pdfPrepared:'Prepared',copy:'Copy',empty:'No items recorded',confirmImport:'Import project from this file?',zoomTip:'Click cards to edit', statusEffective:'Effective',statusNeedsReview:'Needs review',statusPlanned:'Planned',escalationFactors:'Escalation factors',escalationControls:'Escalation controls',escalationFactor:'Escalation factor',addEscalationFactor:'+ Add escalation factor',addEscalationControl:'+ Add escalation control',editEscalationFactor:'Edit escalation factor',editEscalationControl:'Edit escalation control',newEscalationFactor:'New escalation factor',newEscalationControl:'New escalation control',escalationExplanation:'Factors that could weaken this barrier — and the controls that prevent that.',escalationVisual:'Escalation branches',hideEscalation:'Hide escalation',showEscalation:'Show escalation',barrierWeakness:'What could defeat this barrier?',mitigationExplanation:'How this escalation factor is controlled',noEscalationControls:'No escalation controls yet',escalationAdded:'Escalation factor added',escalationControlsHint:'Add controls to mitigate this escalation factor.',pdfEscalationDetail:'ESCALATION BRANCHES',pdfEscalationFactor:'ESCALATION FACTOR',pdfEscalationControl:'ESCALATION CONTROL',pdfControlCount:'Control',statusLegend:'Barrier status',clickDefineHazard:'Click to define hazard',clickDefineEvent:'Click to define top event',emptyThreatHint:'Add your first threat',emptyConsequenceHint:'Add your first consequence',emptyBarriersHint:'Your barriers will appear here',blankCanvasTip:'Start with a hazard, then add threats and consequences',addBarrierShort:'Add barrier',fitDiagram:'Fit',centerDiagram:'Top event',touchHint:'Swipe to explore · Pinch to zoom',zoomIn:'Zoom in',zoomOut:'Zoom out',diagramRegion:'Scrollable BowTie diagram',riskSectionEyebrow:'SAFETY RISK EVALUATION',riskAssessment:'Risk Assessment',riskDescription:'Assess each consequence using the 5×5 Risk Matrix (1–5 / A–E).',riskMatrixTitle:'Risk Matrix',riskMatrixFormula:'Risk index: probability (1–5) / severity (A–E)',riskLikelihood:'Likelihood',riskSeverityAxis:'Severity →',riskSeverity:'Severity',riskInitial:'Initial',riskResidual:'Residual',riskRegister:'Consequence Risk Register',riskAssessed:'assessed',riskUnassessed:'Not assessed',riskAssess:'Assess',riskLow:'Low',riskMedium:'Medium',riskHigh:'High',riskExtreme:'Extreme',riskScore:'Risk score',riskRating:'Rating',riskDetails:'Risk assessment',riskCriteria:'Risk evaluation criteria',riskThresholdHelp:'The matrix uses illustrative risk categories. Apply your organisation’s approved criteria when making safety decisions.',riskGuidance:'Risk colours are illustrative and do not constitute automatic risk acceptance. Check imported ratings against severity definitions; barriers do not automatically reduce risk.',riskRationale:'Risk assessment rationale / evidence',riskRationaleHint:'Record assumptions, sources, existing barriers and justification of residual likelihood and severity.',riskSelect:'— Not assessed —',riskLikelihood1:'1 — Extremely unlikely',riskLikelihood2:'2 — Unlikely',riskLikelihood3:'3 — Possible',riskLikelihood4:'4 — Likely',riskLikelihood5:'5 — Frequent',riskSeverity1:'1 — Negligible',riskSeverity2:'2 — Minor',riskSeverity3:'3 — Moderate',riskSeverity4:'4 — Major',riskSeverity5:'5 — Catastrophic',riskThresholdError:'Thresholds must be increasing whole numbers: 1 ≤ Low < Medium < High ≤ 24.',riskPDF:'RISK ASSESSMENT',riskPDFHint:'This risk matrix is illustrative. Use your organisation’s approved risk acceptance criteria.',riskNoConsequences:'Add a consequence to begin risk assessment.',riskWorst:'Highest residual risk index',riskNoRating:'Not assessed',riskMatrixHelp:'Select Initial or Residual, then tap a matrix cell to set likelihood and severity.',riskMatrixPick:'Select risk stage',riskAssessPrompt:'Assess risk →',riskDiagramHint:'Initial and residual risk shown per consequence',riskAcceptable:'Acceptable',riskTolerable:'Tolerable',riskIntolerable:'Intolerable',riskSelected:'Selected index',riskClear:'Clear rating',riskLegendDetails:'Probability & severity definitions',riskIndexNote:'Illustrative 5×5 risk matrix',icaoProbability5:'Frequent',icaoProbability4:'Occasional',icaoProbability3:'Remote',icaoProbability2:'Improbable',icaoProbability1:'Extremely improbable',icaoSeverityA:'Catastrophic',icaoSeverityB:'Hazardous',icaoSeverityC:'Major',icaoSeverityD:'Minor',icaoSeverityE:'Negligible'
    },
    th: {
      brandCaption:'พื้นที่ทำงานวิเคราะห์ความเสี่ยง',workspace:'พื้นที่ทำงาน',overview:'ภาพรวม',myAnalyses:'รายการวิเคราะห์',yourDataStaysHere:'ข้อมูลอยู่กับคุณ',privacyDescription:'บันทึกในเบราว์เซอร์นี้ ส่งออก JSON เพื่อสำรองหรือย้ายข้อมูล',offlineFirst:'ใช้งานบนเครื่องของคุณ',bowtieAnalysis:'วิเคราะห์แบบ BowTie',allChangesSaved:'บันทึกข้อมูลแล้ว',safetyWorkspace:'ระบบบริหารจัดการความปลอดภัย',importJson:'นำเข้า JSON',backupJson:'สำรอง JSON',exportPdf:'ส่งออก PDF',threats:'ภัยคุกคาม',preventiveControls:'มาตรการป้องกัน',recoveryControls:'มาตรการลดผลกระทบ',consequences:'ผลกระทบ',visualAnalysis:'การวิเคราะห์เชิงภาพ',bowtieDiagram:'แผนภาพ BowTie',diagramHelper:'คลิกที่รายการเพื่อแก้ไข กด + เพื่อเพิ่มเส้นทางหรือมาตรการ',addThreat:'เพิ่มภัยคุกคาม',addConsequence:'เพิ่มผลกระทบ',preventive:'การป้องกัน',recovery:'การลดผลกระทบ',centralEvent:'เหตุการณ์ศูนย์กลาง',preventionPath:'เส้นทางการป้องกัน',recoveryPath:'เส้นทางลดผลกระทบ',effective:'มีประสิทธิผล',needsReview:'ต้องทบทวน',planned:'อยู่ระหว่างวางแผน',scrollToExplore:'เลื่อนแนวนอนเพื่อดูทั้งหมด →',analysisContext:'บริบทการวิเคราะห์',hazardAndEvent:'สภาวะอันตรายและเหตุการณ์ศูนย์กลาง',editDetails:'แก้ไขข้อมูล ↗',hazard:'สภาวะอันตราย',topEvent:'เหตุการณ์ศูนย์กลาง',quickStart:'ทางลัด',keepBuilding:'ต่อยอดการวิเคราะห์',quickCopy:'ระบุสภาวะอันตราย กำหนดมาตรการป้องกันและลดผลกระทบ แล้วส่งออกรายงานการวิเคราะห์',addThreatPath:'เพิ่มเส้นทางภัยคุกคาม',addConsequencePath:'เพิ่มเส้นทางผลกระทบ',createAnotherAnalysis:'สร้างรายการวิเคราะห์ใหม่',madeForRisk:'สร้างเพื่อการจัดการความเสี่ยงอย่างรอบคอบ',offlinePrivate:'ข้อมูลเป็นส่วนตัว · บันทึกในอุปกรณ์นี้',delete:'ลบ',cancel:'ยกเลิก',saveChanges:'บันทึกการแก้ไข',threat:'ภัยคุกคาม',consequence:'ผลกระทบ',preventiveControl:'มาตรการป้องกัน',recoveryControl:'มาตรการลดผลกระทบ',addControl:'+ เพิ่มมาตรการ',noControls:'ยังไม่มีมาตรการ',eventHelper:'สูญเสียการควบคุม',editAnalysis:'ตั้งค่าการวิเคราะห์',editHazard:'แก้ไขสภาวะอันตราย',editTopEvent:'แก้ไขเหตุการณ์ศูนย์กลาง',editThreat:'แก้ไขภัยคุกคาม',editConsequence:'แก้ไขผลกระทบ',editPreventive:'แก้ไขมาตรการป้องกัน',editRecovery:'แก้ไขมาตรการลดผลกระทบ',analysisTitle:'ชื่อการวิเคราะห์',subtitle:'คำอธิบาย / บริบท',owner:'ผู้รับผิดชอบ / หน่วยงาน',version:'รุ่นเอกสาร',itemTitle:'ชื่อรายการ',description:'รายละเอียด / หมายเหตุ',controlStatus:'ประสิทธิผลของมาตรการ',escalation:'ปัจจัยลดประสิทธิผลของมาตรการ',escalationHint:'มีปัจจัยใดที่ทำให้มาตรการนี้อ่อนแอลงหรือใช้งานไม่ได้?',escalationControl:'มาตรการควบคุมปัจจัยลดประสิทธิผล',escalationControlHint:'จะป้องกันไม่ให้ปัจจัยดังกล่าวลดประสิทธิผลได้อย่างไร?',ownerHint:'ระบุบุคคลหรือหน่วยงานผู้รับผิดชอบ (ไม่บังคับ)',projectHint:'ระบบบันทึกข้อมูลไว้ในเบราว์เซอร์นี้โดยอัตโนมัติเมื่อมีการแก้ไข',newAnalysis:'การวิเคราะห์ใหม่',newAnalysisSubtitle:'สร้างการวิเคราะห์ความเสี่ยงแบบ BowTie',newHazard:'ระบุกิจกรรมหรือสภาวะที่มีอันตราย',newEvent:'ระบุเหตุการณ์ที่เกิดการสูญเสียการควบคุม',newThreat:'ภัยคุกคามใหม่',newConsequence:'ผลกระทบใหม่',newPreventive:'มาตรการป้องกันใหม่',newRecovery:'มาตรการลดผลกระทบใหม่',analysis:'การวิเคราะห์',updated:'แก้ไข',today:'วันนี้',justNow:'เมื่อสักครู่',sample:'ตัวอย่าง',created:'สร้างการวิเคราะห์แล้ว',saved:'บันทึกการแก้ไขแล้ว',deleted:'ลบรายการแล้ว',imported:'นำเข้าการวิเคราะห์แล้ว',downloaded:'ดาวน์โหลดไฟล์สำรองแล้ว',exported:'ดาวน์โหลดรายงาน PDF แล้ว',unexpectedFile:'ไม่สามารถอ่านไฟล์ JSON นี้ได้',invalidProject:'ไฟล์นี้ไม่ใช่ข้อมูล Bowtie888 ที่ถูกต้อง',confirmDelete:'ต้องการลบรายการนี้หรือไม่? ไม่สามารถย้อนกลับได้',confirmDeleteProject:'ต้องการลบโครงการ “{name}” อย่างถาวรหรือไม่? ภัยคุกคาม มาตรการ และข้อมูลปัจจัยลดประสิทธิผลทั้งหมดจะถูกลบและไม่สามารถย้อนกลับได้',deleteProject:'ลบโครงการ',projectDeleted:'ลบโครงการแล้ว',cannotDeleteLast:'ต้องมีอย่างน้อยหนึ่งรายการ กรุณาสร้างรายการใหม่ก่อนลบรายการนี้',localStorageFail:'เบราว์เซอร์ไม่สามารถจัดเก็บข้อมูลได้ โปรดสำรองข้อมูลเป็น JSON',pdfFail:'ไม่สามารถสร้างรายงาน PDF ได้',removeAnalysis:'ลบการวิเคราะห์นี้',duplicateAnalysis:'ทำสำเนาการวิเคราะห์',duplicated:'ทำสำเนาการวิเคราะห์แล้ว',untitled:'การวิเคราะห์ไม่มีชื่อ',pdfOverview:'ภาพรวมการวิเคราะห์',pdfReport:'รายงานวิเคราะห์ความเสี่ยงแบบ BOWTIE',pdfThreatDetail:'ภัยคุกคามและมาตรการป้องกัน',pdfConsequenceDetail:'ผลกระทบและมาตรการลดผลกระทบ',pdfDetails:'รายละเอียดเส้นทาง',pdfPath:'เส้นทาง',pdfControls:'มาตรการควบคุม',pdfNoControl:'ไม่ได้ระบุมาตรการ',pdfNoDesc:'ไม่ได้ระบุคำอธิบาย',pdfAdditional:'รายการที่เหลืออยู่ในหน้ารายละเอียดถัดไป',pdfPage:'หน้า',pdfStatus:'สถานะ',pdfEscalation:'ปัจจัยลดประสิทธิผล',pdfEscalationControl:'มาตรการควบคุมปัจจัยลดประสิทธิผล',pdfNotes:'หมายเหตุ',pdfPrepared:'จัดทำ',copy:'สำเนา',empty:'ยังไม่มีข้อมูล',confirmImport:'ต้องการนำเข้าการวิเคราะห์จากไฟล์นี้หรือไม่?',zoomTip:'คลิกการ์ดเพื่อแก้ไข',statusEffective:'มีประสิทธิผล',statusNeedsReview:'ต้องทบทวน',statusPlanned:'วางแผน',escalationFactors:'ปัจจัยลดประสิทธิผล',escalationControls:'มาตรการควบคุมปัจจัย',escalationFactor:'ปัจจัยลดประสิทธิผล',addEscalationFactor:'+ เพิ่มปัจจัยลดประสิทธิผล',addEscalationControl:'+ เพิ่มมาตรการควบคุมปัจจัย',editEscalationFactor:'แก้ไขปัจจัยลดประสิทธิผล',editEscalationControl:'แก้ไขมาตรการควบคุมปัจจัย',newEscalationFactor:'ปัจจัยลดประสิทธิผลใหม่',newEscalationControl:'มาตรการควบคุมปัจจัยใหม่',escalationExplanation:'ปัจจัยที่อาจทำให้มาตรการหลักใช้ไม่ได้ และมาตรการที่ช่วยป้องกันปัจจัยนั้น',escalationVisual:'แสดงปัจจัยลดประสิทธิผล',hideEscalation:'ซ่อนปัจจัย',showEscalation:'แสดงปัจจัย',barrierWeakness:'อะไรที่อาจทำให้มาตรการนี้ใช้ไม่ได้?',mitigationExplanation:'ควบคุมปัจจัยลดประสิทธิผลนี้อย่างไร',noEscalationControls:'ยังไม่มีมาตรการควบคุมปัจจัย',escalationAdded:'เพิ่มปัจจัยแล้ว',escalationControlsHint:'เพิ่มมาตรการป้องกันปัจจัยที่ลดประสิทธิผล',pdfEscalationDetail:'ปัจจัยลดประสิทธิผลและมาตรการควบคุม',pdfEscalationFactor:'ปัจจัยลดประสิทธิผล',pdfEscalationControl:'มาตรการควบคุมปัจจัย',pdfControlCount:'มาตรการ',statusLegend:'สถานะมาตรการ',clickDefineHazard:'คลิกเพื่อระบุสภาวะอันตราย',clickDefineEvent:'คลิกเพื่อระบุเหตุการณ์ศูนย์กลาง',emptyThreatHint:'เพิ่มภัยคุกคามรายการแรก',emptyConsequenceHint:'เพิ่มผลกระทบรายการแรก',emptyBarriersHint:'มาตรการจะแสดงที่นี่',blankCanvasTip:'เริ่มจากสภาวะอันตราย แล้วเพิ่มภัยคุกคามและผลกระทบ',addBarrierShort:'เพิ่มมาตรการ',fitDiagram:'พอดีจอ',centerDiagram:'เหตุการณ์หลัก',touchHint:'ปัดเพื่อเลื่อน · จีบสองนิ้วเพื่อซูม',zoomIn:'ขยาย',zoomOut:'ย่อ',diagramRegion:'แผนภาพ BowTie ที่เลื่อนดูได้',riskSectionEyebrow:'การประเมินความเสี่ยงด้านความปลอดภัย',riskAssessment:'การประเมินความเสี่ยง',riskDescription:'ประเมินผลกระทบด้วยตารางความเสี่ยง 5×5 (1–5 / A–E)',riskMatrixTitle:'ตารางความเสี่ยง',riskMatrixFormula:'ดัชนีความเสี่ยง: โอกาสเกิด (1–5) / ความรุนแรง (A–E)',riskLikelihood:'โอกาสเกิด',riskSeverityAxis:'ความรุนแรง →',riskSeverity:'ความรุนแรง',riskInitial:'ก่อนควบคุม',riskResidual:'หลังควบคุม',riskRegister:'ทะเบียนความเสี่ยงตามผลกระทบ',riskAssessed:'ประเมินแล้ว',riskUnassessed:'ยังไม่ประเมิน',riskAssess:'ประเมิน',riskLow:'ต่ำ',riskMedium:'ปานกลาง',riskHigh:'สูง',riskExtreme:'สูงมาก',riskScore:'คะแนนความเสี่ยง',riskRating:'ระดับความเสี่ยง',riskDetails:'การประเมินความเสี่ยง',riskCriteria:'เกณฑ์การประเมินความเสี่ยง',riskThresholdHelp:'การแบ่งระดับความเสี่ยงเป็นตัวอย่าง โปรดใช้เกณฑ์ที่องค์กรอนุมัติในการตัดสินใจด้านความปลอดภัย',riskGuidance:'สีระดับความเสี่ยงเป็นตัวอย่าง ไม่ใช่การอนุมัติยอมรับความเสี่ยงโดยอัตโนมัติ โปรดทบทวนข้อมูลเดิมตามนิยาม A–E และประเมินผลของมาตรการตามหลักฐาน',riskRationale:'เหตุผล / หลักฐานประกอบการประเมิน',riskRationaleHint:'บันทึกสมมติฐาน แหล่งข้อมูล มาตรการ และเหตุผลของคะแนนความเสี่ยงหลังควบคุม',riskSelect:'— ยังไม่ประเมิน —',riskLikelihood1:'1 — แทบเป็นไปไม่ได้',riskLikelihood2:'2 — โอกาสน้อย',riskLikelihood3:'3 — อาจเกิดขึ้น',riskLikelihood4:'4 — มีโอกาสมาก',riskLikelihood5:'5 — เกิดบ่อย',riskSeverity1:'1 — ไม่มีนัยสำคัญ',riskSeverity2:'2 — เล็กน้อย',riskSeverity3:'3 — ปานกลาง',riskSeverity4:'4 — รุนแรง',riskSeverity5:'5 — ร้ายแรงมาก',riskThresholdError:'เกณฑ์ต้องเป็นจำนวนเต็มเรียงจากน้อยไปมาก: 1 ≤ ต่ำ < ปานกลาง < สูง ≤ 24',riskPDF:'การประเมินความเสี่ยง',riskPDFHint:'ตารางนี้เป็นเพียงตัวอย่าง โปรดใช้เกณฑ์ยอมรับความเสี่ยงที่องค์กรอนุมัติ',riskNoConsequences:'เพิ่มผลกระทบเพื่อเริ่มประเมินความเสี่ยง',riskWorst:'ดัชนีความเสี่ยงหลังควบคุมสูงสุด',riskNoRating:'ยังไม่ประเมิน',riskMatrixHelp:'เลือกก่อนหรือหลังควบคุม แล้วแตะช่องตารางเพื่อกำหนดโอกาสเกิดและความรุนแรง',riskMatrixPick:'เลือกช่วงการประเมิน',riskAssessPrompt:'ประเมินความเสี่ยง →',riskDiagramHint:'แสดงความเสี่ยงก่อนและหลังควบคุมของแต่ละผลกระทบ',riskAcceptable:'ยอมรับได้',riskTolerable:'พอยอมรับได้',riskIntolerable:'ยอมรับไม่ได้',riskSelected:'ดัชนีที่เลือก',riskClear:'ล้างค่า',riskLegendDetails:'ความหมายของโอกาสเกิดและความรุนแรง',riskIndexNote:'เกณฑ์ตัวอย่างของตารางความเสี่ยง 5×5',icaoProbability5:'เกิดบ่อย',icaoProbability4:'เกิดเป็นครั้งคราว',icaoProbability3:'เกิดได้น้อยแต่เป็นไปได้',icaoProbability2:'แทบไม่เกิด',icaoProbability1:'แทบเป็นไปไม่ได้เลย',icaoSeverityA:'หายนะ',icaoSeverityB:'อันตรายรุนแรง',icaoSeverityC:'รุนแรงมาก',icaoSeverityD:'เล็กน้อย',icaoSeverityE:'แทบไม่มีผลกระทบ'
    }
  };
  // v1.7.0: workspace-only interface labels; no changes to saved analysis format.
  Object.assign(dict.en,{moduleLabel:'ANALYSIS STUDIO',projectWorkspace:'Private workspace',projectAutoSave:'Changes saved on this device'});
  Object.assign(dict.th,{moduleLabel:'สตูดิโอวิเคราะห์',projectWorkspace:'พื้นที่ทำงานส่วนตัว',projectAutoSave:'บันทึกข้อมูลในอุปกรณ์นี้'});
  // Desktop sidebar state is device-local and never changes analysis data.
  const SIDEBAR_KEY = 'bowtie888-sidebar-collapsed';
  const sidebarMedia = window.matchMedia('(max-width: 1000px)');
  let sidebarCollapsed = localStorageSafeGet(SIDEBAR_KEY) === 'true';
  Object.assign(dict.en,{sidebarShow:'Show sidebar',sidebarHide:'Hide sidebar',sidebarClose:'Close navigation'});
  Object.assign(dict.th,{sidebarShow:'แสดงแถบด้านข้าง',sidebarHide:'ซ่อนแถบด้านข้าง',sidebarClose:'ปิดเมนูนำทาง'});
  // Interface appearance is device-local; never stored in a safety analysis project.
  const THEME_KEY = 'bowtie888-appearance';
  const THEME_OPTIONS = ['system','pearl','midnight','ocean','rose'];
  const themeMedia = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const savedTheme = (() => { try { return localStorage.getItem(THEME_KEY); } catch { return null; } })();
  let chosenTheme = THEME_OPTIONS.includes(savedTheme) ? savedTheme : 'pearl';
  function appliedTheme() { return chosenTheme === 'system' ? (themeMedia?.matches ? 'midnight' : 'pearl') : chosenTheme; }
  function applyTheme() {
    const next = appliedTheme();
    document.documentElement.dataset.theme = next;
    document.documentElement.dataset.themeChoice = chosenTheme;
    document.documentElement.style.colorScheme = next === 'midnight' ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', ({pearl:'#f7f8fa',midnight:'#101923',ocean:'#edf5f8',rose:'#faf5f1'})[next]);
    document.querySelectorAll('[data-theme-option]').forEach(button => {
      const selected = button.dataset.themeOption === chosenTheme;
      button.setAttribute('aria-checked',String(selected));
      button.classList.toggle('selected',selected);
    });
    const trigger = document.getElementById('themeTrigger');
    if(trigger) trigger.setAttribute('aria-label',(lang === 'th' ? 'ธีม' : 'Theme')+': '+(dict[lang]['theme'+chosenTheme.charAt(0).toUpperCase()+chosenTheme.slice(1)] || chosenTheme));
  }
  function closeThemeMenu() {
    const menu=document.getElementById('themeMenu'),button=document.getElementById('themeTrigger');
    if(!menu || !button)return;
    menu.hidden=true;button.setAttribute('aria-expanded','false');
  }
  function setTheme(choice) {
    if(!THEME_OPTIONS.includes(choice))return;
    chosenTheme=choice;
    try { localStorage.setItem(THEME_KEY,choice); } catch {}
    applyTheme();closeThemeMenu();
    requestAnimationFrame(()=>{if(typeof drawConnectors==='function')drawConnectors();});
  }
  Object.assign(dict.en,{
    appearance:'Appearance',themeChoose:'Choose your theme',themePersonal:'YOUR PERSONAL WORKSPACE',themeSystem:'System',themeSystemDesc:'Match device setting',
    themePearl:'Pearl',themePearlDesc:'Soft, clean & refined',themeMidnight:'Midnight',themeMidnightDesc:'Deep navy & subtle glow',
    themeOcean:'Ocean',themeOceanDesc:'Cool blues & teal accents',themeRose:'Rose Gold',themeRoseDesc:'Warm neutrals & bronze',themeSaved:'Saved automatically on this device'
  });
  Object.assign(dict.th,{
    appearance:'ธีม',themeChoose:'เลือกธีมที่ชอบ',themePersonal:'พื้นที่ทำงานในสไตล์คุณ',themeSystem:'ตามอุปกรณ์',themeSystemDesc:'ตามการตั้งค่าระบบ',
    themePearl:'เพิร์ล',themePearlDesc:'สว่าง สะอาด เรียบหรู',themeMidnight:'มิดไนต์',themeMidnightDesc:'สีน้ำเงินเข้ม สบายตา',
    themeOcean:'โอเชียน',themeOceanDesc:'สีฟ้าและเขียวอมฟ้า',themeRose:'โรสโกลด์',themeRoseDesc:'โทนอุ่นทองแดง',themeSaved:'บันทึกธีมในอุปกรณ์นี้อัตโนมัติ'
  });
  let lang = (localStorageSafeGet(LANG_KEY) || localStorageSafeGet(LEGACY_LANG_KEY)) === 'th' ? 'th' : 'en';
  const t = (key) => dict[lang][key] || dict.en[key] || key;
  const ICAO_UNACCEPTABLE = new Set(['5A','5B','5C','4A','4B','3A']);
  const ICAO_TOLERABLE = new Set(['5D','5E','4C','4D','4E','3B','3C','3D','2A','2B','2C','1A']);
  const ICAO_SEVERITIES = ['A','B','C','D','E'];
  let state = loadState();
  let editorCtx = null;
  let toastTimer = null;
  let showEscalation = true;
  // Number labels are derived, never saved as IDs. This keeps legacy JSON compatible,
  // and re-numbers every category in visual order after add, delete or duplication.
  let numberIndex = new Map();
  function buildNumberIndex(project) {
    const index=new Map(),counts=Object.create(null);
    const set=(type,item)=>{if(item&&typeof item==='object'){
      counts[type]=(counts[type]||0)+1;
      index.set(item,`${type}-${String(counts[type]).padStart(2,'0')}`);
    }};
    set('H',project.hazard);set('TE',project.topEvent);
    for(const [pathType,barrierType,paths] of [
      ['T','PB',project.threats],['C','RB',project.consequences]
    ]){
      for(const path of paths){
        set(pathType,path);
        for(const barrier of path.barriers){
          set(barrierType,barrier);
          for(const factor of (barrier.escalationFactors||[])){
            set('EF',factor);
            for(const control of (factor.controls||[]))set('EC',control);
          }
        }
      }
    }
    return index;
  }
  function numberOf(object){return numberIndex.get(object)||'';}
  function numberLabel(object){const number=numberOf(object);return number?number+' · ':'';}

  function localStorageSafeGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
  function safeText(value, max = 3000) { return typeof value === 'string' ? value.slice(0, max) : ''; }
  function makeEscalationControl(title, status='planned', owner='', description=''){return {id:uid(),title,status,owner,description};}
  function makeEscalationFactor(title, controls=[], description=''){return {id:uid(),title,description,controls};}
  function makeBarrier(title,status='effective',owner='',description='',escalation='',escalationControl=''){
    const escalationFactors=escalation||escalationControl?[makeEscalationFactor(escalation||'Unspecified escalation factor',escalationControl?[makeEscalationControl(escalationControl,'effective')]:[])]:[];
    return {id:uid(),title,status,owner,description,escalationFactors};
  }
  function makePath(title, description, barriers) { return { id:uid(), title, description, barriers }; }
  function exampleProject() {
    return {
      id:uid(), title:'Runway Excursion During Landing', subtitle:'Aviation Safety · Flight Operations · Example analysis', owner:'Safety Management Team', version:'1.0', updatedAt:new Date().toISOString(),
      hazard:{title:'Aircraft landing operations',description:'Aircraft operating on or approaching an active runway during landing.'},
      topEvent:{title:'Loss of directional control on landing',description:'The aircraft departs the intended landing path or runway surface.'},
      threats:[
        makePath('Unstable approach','Approach speed, alignment or descent profile outside stabilized criteria.',[
          makeBarrier('Stabilized approach criteria','effective','Flight Operations','Monitor compliance with established gates and go-around triggers.'),
          makeBarrier('Go-around decision policy','needs-review','Training Department','Reinforce timely go-around decisions.','Continuation bias under high workload','Scenario-based recurrent training')]),
        makePath('Adverse runway conditions','Reduced braking action caused by water or contamination.',[
          makeBarrier('Runway condition assessment','effective','Airport Operations','Assess and communicate runway surface conditions.','Outdated runway reports','Cross-check reports with current ATIS and operational observations'),
          makeBarrier('Landing performance calculation','effective','Flight Crew','Calculate landing distance using reported runway conditions.')]),
        makePath('Strong crosswind','Crosswind or gusts outside limits or crew handling capability.',[
          makeBarrier('Crosswind operating limits','effective','Flight Operations','Publish and apply aircraft and crew limits.'),
          makeBarrier('Weather briefing and monitoring','planned','Dispatch','Update crosswind and gust information before landing.')])
      ],
      consequences:[
        makePath('Aircraft damage','Damage to landing gear, structure or systems.',[
          makeBarrier('Runway end safety area (RESA)','effective','Aerodrome Operator','Provide a graded area to reduce the severity of an overrun.'),
          makeBarrier('Emergency response procedures','effective','Airport Emergency Services','Coordinate fast on-scene response.')]),
        makePath('Injury to occupants','Passengers or crew could sustain injuries.',[
          makeBarrier('Cabin crew emergency training','effective','Cabin Operations','Practice evacuation and passenger management.','Skill fade due to infrequent practice','Scenario-based recurrent drills'),
          makeBarrier('Aircraft rescue and firefighting','effective','Airport Emergency Services','Maintain readiness and response capability.')]),
        makePath('Runway closure','Runway becomes unavailable during recovery and investigation.',[
          makeBarrier('Contingency traffic plan','needs-review','Air Traffic Services','Implement alternative traffic or capacity management measures.'),
          makeBarrier('Aircraft recovery plan','planned','Aerodrome Operator','Coordinate removal and recovery resources.')])
      ]
    };
  }
  function blankProject() {return {id:uid(),title:t('newAnalysis'),subtitle:t('newAnalysisSubtitle'),owner:'',version:'1.0',riskBands:defaultBands(),updatedAt:new Date().toISOString(),hazard:{title:'',description:''},topEvent:{title:'',description:''},threats:[],consequences:[]};}
  function loadState() {try {const raw=localStorageSafeGet(STORAGE_KEY)||localStorageSafeGet(LEGACY_STORAGE_KEY);if(raw){const data=JSON.parse(raw);if(data && Array.isArray(data.projects) && data.projects.length){const projects=data.projects.map(normalizeProject).filter(Boolean);if(projects.length){
          let activeId=projects.some(p=>p.id===data.activeId)?data.activeId:projects[0].id;
          const current=projects.find(p=>p.id===activeId);
          // One-time upgrade from the previously preloaded demonstration project:
          // start with an empty workspace but keep the prior example editable in My Analyses.
          if(current?.title==='Runway Excursion During Landing' && /Example analysis/i.test(current.subtitle)){
            const fresh=blankProject();projects.push(fresh);activeId=fresh.id;
          }
          return {projects,activeId};
        }}}}catch(e){console.warn('Saved state could not be loaded:',e);}const project=blankProject();return {projects:[project],activeId:project.id};}
  function normalizeProject(raw) {
    if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
    const statuses=['effective','needs-review','planned'];
    const normControl=c=>({id:safeText(c?.id,120)||uid(),title:safeText(c?.title,400)||'Untitled escalation control',description:safeText(c?.description),owner:safeText(c?.owner,300),status:statuses.includes(c?.status)?c.status:'planned'});
    const normFactor=f=>({id:safeText(f?.id,120)||uid(),title:safeText(f?.title,400)||'Untitled escalation factor',description:safeText(f?.description),controls:(Array.isArray(f?.controls)?f.controls.slice(0,80):[]).map(normControl)});
    const normBarrier=b=>{
      const legacyFactors=(!Array.isArray(b?.escalationFactors)&&(b?.escalation||b?.escalationControl))?[{title:safeText(b.escalation)||'Unspecified escalation factor',controls:b.escalationControl?[{title:safeText(b.escalationControl),status:'effective'}]:[]}]:[];
      return {id:safeText(b?.id,120)||uid(),title:safeText(b?.title,400)||'Untitled barrier',description:safeText(b?.description),owner:safeText(b?.owner,300),status:statuses.includes(b?.status)?b.status:'planned',escalationFactors:(Array.isArray(b?.escalationFactors)?b.escalationFactors.slice(0,80):legacyFactors).map(normFactor)};
    };
    const normPath=(p,kind)=>({...{id:safeText(p?.id,120)||uid(),title:safeText(p?.title,400)||'Untitled path',description:safeText(p?.description),barriers:(Array.isArray(p?.barriers)?p.barriers.slice(0,80):[]).map(normBarrier)},...(kind==='consequence'?{risk:normaliseRisk(p?.risk)}:{})});
    return {id:safeText(raw.id,120)||uid(),title:safeText(raw.title,400)||'Untitled analysis',subtitle:safeText(raw.subtitle,700),owner:safeText(raw.owner,300),version:safeText(raw.version,100)||'1.0',riskBands:normaliseBands(raw.riskBands),updatedAt:!isNaN(Date.parse(raw.updatedAt))?raw.updatedAt:new Date().toISOString(),hazard:{title:safeText(raw.hazard?.title,500),description:safeText(raw.hazard?.description)},topEvent:{title:safeText(raw.topEvent?.title,500),description:safeText(raw.topEvent?.description)},threats:(Array.isArray(raw.threats)?raw.threats.slice(0,80):[]).map(path=>normPath(path,'threat')),consequences:(Array.isArray(raw.consequences)?raw.consequences.slice(0,80):[]).map(path=>normPath(path,'consequence'))};
  }
  // ICAO Doc 9859 (4th ed.), example 5×5 risk index: probability 5–1 and severity A–E.
  // The tolerability zones below are EXAMPLES, not mandatory acceptance criteria.
  // Historic numeric severity values 1–5 are migrated as E–A respectively.
  function defaultBands(){return {low:4,medium:9,high:16};} // kept for old JSON compatibility
  function normaliseBands(raw){const v=raw||{},a=[v.low,v.medium,v.high].map(Number);
    return a.every(Number.isInteger)&&a[0]>=1&&a[0]<a[1]&&a[1]<a[2]&&a[2]<=24?{low:a[0],medium:a[1],high:a[2]}:defaultBands();}
  function riskNumber(v){return [1,2,3,4,5].includes(Number(v))&&v!==''&&v!==null&&v!==undefined?Number(v):0;}
  function riskSeverityCode(value){
    if(typeof value==='string'&&ICAO_SEVERITIES.includes(value.toUpperCase()))return value.toUpperCase();
    const legacy=riskNumber(value);
    return legacy?ICAO_SEVERITIES[5-legacy]:'';
  }
  function normaliseRating(raw){return {likelihood:riskNumber(raw?.likelihood),severity:riskSeverityCode(raw?.severity)};}
  function normaliseRisk(raw){return {initial:normaliseRating(raw?.initial),residual:normaliseRating(raw?.residual),rationale:safeText(raw?.rationale,3000)};}
  function riskScore(rating){const l=riskNumber(rating?.likelihood),s=riskSeverityCode(rating?.severity);return l&&s?`${l}${s}`:null;}
  function riskBand(index){
    if(!index||!/^([1-5])[A-E]$/.test(String(index)))return 'unassessed';
    return ICAO_UNACCEPTABLE.has(index)?'extreme':ICAO_TOLERABLE.has(index)?'medium':'low';
  }
  function riskLabel(band){return t(({low:'riskAcceptable',medium:'riskTolerable',extreme:'riskIntolerable',unassessed:'riskUnassessed'})[band]);}
  function riskWeight(index){
    if(!index)return -1;
    const zone={extreme:3,medium:2,low:1}[riskBand(index)]||0;
    const p=Number(index[0]),s=5-ICAO_SEVERITIES.indexOf(index[1]);
    return zone*100+p*5+s;
  }
  function riskPill(rating, options={}){
    const index=typeof rating==='string'?rating:riskScore(rating),level=riskBand(index);
    return `<span class="risk-pill risk-${level}${options?.scoreOnly?' risk-score-only':''}" title="${escapeHtml(riskLabel(level))}">${index===null?'—':escapeHtml(index)}${options?.scoreOnly?'':` <small>${escapeHtml(riskLabel(level))}</small>`}</span>`;
  }
  function renderRiskAssessment(){
    const p=activeProject(),bands=p.riskBands||defaultBands(),paths=p.consequences;
    const list=$('riskRegister');list.replaceChildren();
    const assessed=paths.filter(path=>riskScore(path.risk?.residual)!==null).length;
    $('riskCount').textContent=`${assessed} / ${paths.length} ${t('riskAssessed')}`;
    const overall=paths.map(path=>riskScore(path.risk?.residual)).filter(v=>v!==null);
    const highest=overall.length?overall.sort((a,b)=>riskWeight(b)-riskWeight(a))[0]:null;
    $('riskSummary').innerHTML=`<small>${escapeHtml(t('riskWorst'))}</small>${riskPill(highest,bands)}`;
    if(!paths.length){const empty=document.createElement('div');empty.className='risk-empty';empty.textContent=t('riskNoConsequences');list.append(empty);}
    paths.forEach(path=>{const row=document.createElement('div');row.className='risk-register-row';row.innerHTML=`<strong title="${escapeHtml(path.title)}"><span class="ref-code">${escapeHtml(numberOf(path))}</span> ${escapeHtml(path.title)}</strong><div>${riskPill(path.risk?.initial,bands)}</div><div>${riskPill(path.risk?.residual,bands)}</div><span class="risk-edit-arrow">↗</span>`;row.tabIndex=0;row.setAttribute('role','button');row.setAttribute('aria-label',t('riskAssess')+': '+path.title);row.addEventListener('click',()=>openEditor('consequence',path.id));row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openEditor('consequence',path.id);}});list.append(row);});
  }
  const mobileView = () => window.matchMedia('(max-width: 680px)').matches;
  const tabletView = () => window.matchMedia('(max-width: 1100px)').matches;
  let diagramZoom = mobileView() ? 0.8 : (tabletView() ? 0.9 : 1);
  const minZoom = 0.05, maxZoom = 1.5;
  const clampZoom = value => Math.max(minZoom, Math.min(maxZoom, value));
  function zoomStage(value, anchor = null){
    const scroller=$('diagramScroll'),stage=$('diagramStage'),board=$('diagramBoard');
    if(!scroller||!stage||!board)return;
    const before=diagramZoom, z=clampZoom(value);
    const rect=scroller.getBoundingClientRect();
    const x=anchor?.x??scroller.clientWidth/2, y=anchor?.y??Math.min(scroller.clientHeight/2, 280);
    const diagramX=(scroller.scrollLeft+x)/before, diagramY=(scroller.scrollTop+y)/before;
    diagramZoom=z;
    board.style.transform=`scale(${z})`;
    // Do not use getBoundingClientRect: transforms distort native layout metrics.
    stage.style.width=Math.ceil(board.offsetWidth*z)+'px';
    stage.style.height=Math.ceil(board.offsetHeight*z)+'px';
    $('zoomValue').textContent=Math.round(z*100)+'%';
    $('zoomOut').disabled=z<=minZoom+0.001;
    $('zoomIn').disabled=z>=maxZoom-0.001;
    scroller.scrollLeft=Math.max(0,diagramX*z-x);
    scroller.scrollTop=Math.max(0,diagramY*z-y);
    drawConnectors();
  }
  function fitDiagram(){
    const scroller=$('diagramScroll'),board=$('diagramBoard');
    const available=scroller.clientWidth-8;
    if(available>0)zoomStage(available/board.offsetWidth,{x:0,y:0});
    scroller.scrollLeft=0;scroller.scrollTop=0;
  }
  function centerDiagram(){
    const node=$('topEventNode'),scroller=$('diagramScroll'),board=$('diagramBoard');
    if(!node)return;
    const rect=node.getBoundingClientRect(),origin=board.getBoundingClientRect();
    const x=(rect.left+rect.width/2-origin.left)/diagramZoom;
    const y=(rect.top+rect.height/2-origin.top)/diagramZoom;
    scroller.scrollLeft=Math.max(0,x*diagramZoom-scroller.clientWidth/2);
    scroller.scrollTop=Math.max(0,y*diagramZoom-scroller.clientHeight/2);
  }
  function activeProject(){return state.projects.find(p=>p.id===state.activeId)||state.projects[0];}
  function persist(){const p=activeProject();if(p)p.updatedAt=new Date().toISOString();try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{toast(t('localStorageFail'));}updateIndicator();window.bowtieCollab?.onLocalChange();}
  function updateIndicator(){$('saveIndicator').querySelector('span:last-child').textContent=t('allChangesSaved');}
  function toast(message){const e=$('toast');e.textContent=message;e.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('show'),2800);}
  function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function statusLabel(v){return t(({effective:'statusEffective','needs-review':'statusNeedsReview',planned:'statusPlanned'})[v]||'statusPlanned');}
  function translateUI(){document.documentElement.lang=lang==='th'?'th':'en';applyTheme();document.querySelectorAll('[data-i18n]').forEach(node=>{node.textContent=t(node.dataset.i18n);});$('langEN').classList.toggle('active',lang==='en');$('langTH').classList.toggle('active',lang==='th');document.title='Bowtie Together — '+t('bowtieAnalysis');$('diagramScroll').setAttribute('aria-label',t('diagramRegion'));$('zoomIn').setAttribute('aria-label',t('zoomIn'));$('zoomOut').setAttribute('aria-label',t('zoomOut'));updateSidebarUI();updateIndicator();}
  function relativeDate(p){const d=Date.parse(p.updatedAt);if(!Number.isFinite(d))return '';const today=new Date();if(new Date(d).toDateString()===today.toDateString())return t('today');return new Date(d).toLocaleDateString(lang==='th'?'th-TH':'en-US',{month:'short',day:'numeric'});}
  function renderSidebar(){
    const list=$('projectList');list.replaceChildren();
    state.projects.forEach(p=>{
      // Keep the select and delete controls separate, never nest interactive elements.
      const row=document.createElement('div');row.className='project-row'+(p.id===state.activeId?' selected':'');
      const select=document.createElement('button');select.className='project-entry'+(p.id===state.activeId?' selected':'');select.type='button';
      select.setAttribute('aria-label',p.title);
      select.innerHTML='<span class="project-figure">◇</span><span class="entry-text"><strong>'+escapeHtml(p.title)+'</strong><small>'+escapeHtml(t('updated'))+' '+escapeHtml(relativeDate(p))+'</small></span>';
      select.addEventListener('click',()=>{state.activeId=p.id;persist();closeDrawer();closeMobileMenu();render();});
      const remove=document.createElement('button');remove.className='project-delete';remove.type='button';
      remove.title=t('deleteProject')+' — '+p.title;remove.setAttribute('aria-label',remove.title);
      remove.innerHTML='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v6m4-6v6"/></svg>';
      remove.addEventListener('click',()=>deleteProject(p.id));
      row.append(select,remove);list.append(row);
    });
  }
  function renderHeader(){const p=activeProject();$('projectTitle').textContent=p.title;$('projectSubtitle').textContent=[p.subtitle,p.owner ? `${t('owner')}: ${p.owner}` : ''].filter(Boolean).join('  ·  ');$('hazardSummary').textContent=numberLabel(p.hazard)+(p.hazard.title||'—');$('hazardDesc').textContent=p.hazard.description||'—';$('eventSummary').textContent=numberLabel(p.topEvent)+(p.topEvent.title||'—');$('eventDesc').textContent=p.topEvent.description||'—';const prev=p.threats.reduce((n,v)=>n+v.barriers.length,0);const rec=p.consequences.reduce((n,v)=>n+v.barriers.length,0);$('threatCount').textContent=p.threats.length;$('preventiveCount').textContent=prev;$('recoveryCount').textContent=rec;$('consequenceCount').textContent=p.consequences.length;}
  function createPathCard(item,kind,index){const b=document.createElement('button');b.type='button';b.className='path-card '+(kind==='consequence'?'consequence-card':'');b.dataset.anchor='path';b.dataset.kind=kind;b.dataset.pid=item.id;b.innerHTML='<span class="card-icon">'+(kind==='threat'?'↘':'↗')+'</span><span class="card-body"><small>'+escapeHtml(t(kind).toUpperCase())+' <span class="ref-code">'+escapeHtml(numberOf(item))+'</span>'+'</small><strong>'+escapeHtml(item.title)+'</strong>'+(kind==='consequence'?`<span class="diagram-risk-pair"><span class="diagram-risk-row"><span class="diagram-risk-label">${escapeHtml(t('riskInitial'))}</span>${riskPill(item.risk?.initial,{scoreOnly:true})}</span><span class="diagram-risk-row"><span class="diagram-risk-label">${escapeHtml(t('riskResidual'))}</span>${riskPill(item.risk?.residual,{scoreOnly:true})}</span></span><span class="diagram-risk-action">${escapeHtml(t('riskAssessPrompt'))}</span>`:'')+'</span><span class="card-chevron">›</span>';b.addEventListener('click',()=>openEditor(kind,item.id));return b;}
  function createControlCard(barr,kind,parent,index){
    const b=document.createElement('button');b.type='button';b.className='control-card '+(kind==='recovery'?'recovery-card':'');b.dataset.anchor='barrier';b.dataset.kind=kind;b.dataset.parent=parent;b.dataset.bid=barr.id;
    b.innerHTML='<span class="control-icon">'+(kind==='recovery'?'✧':'✓')+'</span><span class="card-body"><small>'+escapeHtml(kind==='recovery'?t('recovery'):t('preventive'))+' <span class="ref-code">'+escapeHtml(numberOf(barr))+'</span>'+'</small><strong>'+escapeHtml(barr.title)+'</strong></span><span class="control-status '+escapeHtml(barr.status)+'" title="'+escapeHtml(statusLabel(barr.status))+'"></span>';
    b.addEventListener('click',()=>openEditor(kind,barr.id,parent));return b;
  }
  function addEscalationFactor(kind,pathId,barrierId){
    const barrier=findBarrier(kind,pathId,barrierId);if(!barrier)return;
    const f=makeEscalationFactor(t('newEscalationFactor'));barrier.escalationFactors.push(f);showEscalation=true;persist();render();openEditor('escalationFactor',f.id,pathId,barrierId);
  }
  function addEscalationControl(kind,pathId,barrierId,factorId){
    const f=findBarrier(kind,pathId,barrierId)?.escalationFactors.find(v=>v.id===factorId);if(!f)return;
    const c=makeEscalationControl(t('newEscalationControl'));f.controls.push(c);showEscalation=true;persist();render();openEditor('escalationControl',c.id,pathId,barrierId,factorId);
  }
  function findBarrier(kind,pathId,barrierId){
    const paths=(kind==='preventive'||kind==='threat')?activeProject().threats:activeProject().consequences;
    return paths.find(p=>p.id===pathId)?.barriers.find(b=>b.id===barrierId);
  }
  function compactPlus(label, className, action) {
    const b=document.createElement('button');b.type='button';b.className='micro-add '+(className||'');
    b.textContent='+';b.title=label;b.setAttribute('aria-label',label);b.addEventListener('click',action);return b;
  }
  function createEscalationTree(barrier,kind,pathId){
    const tree=document.createElement('div');tree.className='escalation-tree';
    const heading=document.createElement('div');heading.className='escalation-tree-heading';
    heading.innerHTML='<span class="branch-stem"></span><span>'+escapeHtml(t('escalationFactors'))+'</span><span class="branch-count">'+barrier.escalationFactors.length+'</span>';
    heading.append(compactPlus(t('addEscalationFactor'),'factor-add',()=>addEscalationFactor(kind,pathId,barrier.id)));
    tree.append(heading);
    barrier.escalationFactors.forEach((f,index)=>{
      const row=document.createElement('div');row.className='escalation-factor-row';
      const fact=document.createElement('button');fact.type='button';fact.className='escalation-factor-card';
      fact.dataset.anchor='escalationFactor';fact.dataset.bid=barrier.id;fact.dataset.fid=f.id;
      fact.innerHTML='<span class="micro-kicker">'+escapeHtml(t('escalationFactor'))+' <span class="ref-code">'+escapeHtml(numberOf(f))+'</span>'+'</span><strong>'+escapeHtml(f.title)+'</strong>';
      fact.addEventListener('click',()=>openEditor('escalationFactor',f.id,pathId,barrier.id));row.append(fact);
      const controls=document.createElement('div');controls.className='escalation-controls-column';
      f.controls.forEach((c,k)=>{
        const card=document.createElement('button');card.type='button';card.className='escalation-control-card';
        card.dataset.anchor='escalationControl';card.dataset.fid=f.id;card.dataset.ecid=c.id;
        card.innerHTML='<span class="micro-kicker">'+escapeHtml(t('escalationControl'))+' <span class="ref-code">'+escapeHtml(numberOf(c))+'</span>'+'</span><span class="branch-control-main"><strong>'+escapeHtml(c.title)+'</strong><i class="control-status '+escapeHtml(c.status)+'" title="'+escapeHtml(statusLabel(c.status))+'"></i></span>';
        card.addEventListener('click',()=>openEditor('escalationControl',c.id,pathId,barrier.id,f.id));controls.append(card);
      });
      controls.append(compactPlus(t('addEscalationControl'),'control-add',()=>addEscalationControl(kind,pathId,barrier.id,f.id)));
      row.append(controls);tree.append(row);
    });
    return tree;
  }
  function renderSide(pathKind){
    const p=activeProject(),left=pathKind==='threat',paths=left?p.threats:p.consequences,kind=left?'preventive':'recovery';
    const pathCol=$(left?'threatNodes':'consequenceNodes'),barCol=$(left?'preventionNodes':'recoveryNodes');
    pathCol.replaceChildren();barCol.replaceChildren();pathCol.style.justifyContent='flex-start';barCol.style.justifyContent='flex-start';
    if(!paths.length){
      const empty=document.createElement('div');empty.className='empty-path';
      const label=document.createElement('span');label.textContent=t(left?'emptyThreatHint':'emptyConsequenceHint');
      empty.append(label);pathCol.append(empty);
      const blank=document.createElement('div');blank.className='empty-barrier-lane';blank.textContent=t('emptyBarriersHint');barCol.append(blank);
    }
    paths.forEach((item,i)=>{
      const pathRow=document.createElement('div');pathRow.className='stream-group';pathRow.append(createPathCard(item,pathKind,i));pathCol.append(pathRow);
      const barrierRow=document.createElement('div');barrierRow.className='stream-group barrier-stream';
      item.barriers.forEach((barrier,j)=>{
        const unit=document.createElement('div');unit.className='barrier-unit';unit.append(createControlCard(barrier,kind,item.id,j));
        if(showEscalation)unit.append(createEscalationTree(barrier,kind,item.id));
        barrierRow.append(unit);
      });
      if(!item.barriers.length){const hint=document.createElement('span');hint.className='empty-control';hint.textContent=t('noControls');barrierRow.append(hint);}
      barrierRow.append(compactPlus(t('addBarrierShort'),left?'barrier-add':'barrier-add recovery-add',()=>addBarrier(kind,item.id)));
      barCol.append(barrierRow);
    });
    // Allow barriers to flow horizontally, increasing the board width as needed.
    const maxBarriers=Math.max(0,...paths.map(item=>item.barriers.length));
    const width=Math.max(246,maxBarriers*222+52);
    $('diagramBoard').style.setProperty(left?'--left-barriers':'--right-barriers',width+'px');
  }
  // Keep the vertical centre of every card on one pathway aligned.
  // A consequence includes two risk pills and can be far taller than a barrier;
  // each barrier's escalation branches can also make its containing row taller.
  // Align the cards themselves (not their entire row wrappers), then give both
  // columns the same row height. This produces genuinely horizontal connectors
  // even with different title lengths, zoom, translations and risk badges.
  function syncPathHeights(){
    for(const [pathsId,barriersId] of [['threatNodes','preventionNodes'],['consequenceNodes','recoveryNodes']]){
      const paths=[...$(pathsId).querySelectorAll(':scope > .stream-group')];
      const bars=[...$(barriersId).querySelectorAll(':scope > .stream-group')];
      paths.forEach((path,i)=>{
        const barrier=bars[i];if(!barrier)return;
        path.style.minHeight='';barrier.style.minHeight='';
        path.style.paddingTop='16px';
        const card=path.querySelector(':scope > [data-anchor="path"]');
        const units=[...barrier.querySelectorAll(':scope > .barrier-unit')];
        units.forEach(unit=>{unit.style.marginTop='0px';});
        const barriers=units.map(unit=>unit.querySelector(':scope > [data-anchor="barrier"]'));
        const heights=[card?.offsetHeight||0,...barriers.map(el=>el?.offsetHeight||0)];
        const tallest=Math.max(...heights);
        // The first card's top margin is the baseline for this pathway.
        // Centre shorter cards vertically against the tallest card.
        if(card)path.style.paddingTop=(16+(tallest-card.offsetHeight)/2)+'px';
        units.forEach((unit,j)=>{
          if(barriers[j])unit.style.marginTop=Math.max(0,(tallest-barriers[j].offsetHeight)/2)+'px';
        });
        const h=Math.max(154,barrier.offsetHeight,path.offsetHeight);
        path.style.minHeight=h+'px';barrier.style.minHeight=h+'px';
      });
    }
  }
  function renderDiagram(){
    const p=activeProject();renderSide('threat');renderSide('consequence');$('diagramPlot').style.minHeight='405px';
    const c=$('centerNodes');c.replaceChildren();
    const hazard=document.createElement('button');hazard.type='button';hazard.className='central-card hazard-card'+(!p.hazard.title?' is-placeholder':'');
    hazard.innerHTML='<span class="center-icon">⚠</span><small>'+escapeHtml(t('hazard').toUpperCase())+' <span class="ref-code">'+escapeHtml(numberOf(p.hazard))+'</span></small><strong>'+escapeHtml(p.hazard.title||t('clickDefineHazard'))+'</strong>';
    hazard.addEventListener('click',()=>openEditor('hazard'));c.append(hazard);
    const stem=document.createElement('div');stem.className='central-connector';c.append(stem);
    const event=document.createElement('button');event.type='button';event.className='central-card top-event-card'+(!p.topEvent.title?' is-placeholder':'');event.id='topEventNode';
    event.innerHTML='<span class="center-icon">◇</span><small>'+escapeHtml(t('topEvent').toUpperCase())+' <span class="ref-code">'+escapeHtml(numberOf(p.topEvent))+'</span></small><strong>'+escapeHtml(p.topEvent.title||t('clickDefineEvent'))+'</strong><span class="center-helper">'+escapeHtml(p.topEvent.title?t('eventHelper'):t('blankCanvasTip'))+'</span>';
    event.addEventListener('click',()=>openEditor('topEvent'));
    // Keep both path-creation buttons anchored to the Top Event instead of
    // placing duplicate controls above/below the individual pathway columns.
    // The wrapper does not replace #topEventNode, so connector geometry stays
    // attached to the card, never to the '+' buttons.
    const shell=document.createElement('div');shell.className='top-event-shell';
    const addThreat=compactPlus(t('addThreat'),'top-event-add threat-add',()=>addPath('threat'));
    addThreat.id='addThreatInDiagram';addThreat.dataset.side='left';
    const addConsequence=compactPlus(t('addConsequence'),'top-event-add consequence-add',()=>addPath('consequence'));
    addConsequence.id='addConsequenceInDiagram';addConsequence.dataset.side='right';
    shell.append(addThreat,event,addConsequence);c.append(shell);
    $('toggleEscalation').textContent=showEscalation?'− '+t('hideEscalation'):'+ '+t('showEscalation');$('toggleEscalation').setAttribute('aria-pressed',String(showEscalation));
    requestAnimationFrame(()=>requestAnimationFrame(()=>{syncPathHeights();zoomStage(diagramZoom);drawConnectors();}));
  }
  // Geometry-based connectors, scoped to the actual DOM row and barrier unit.
  // Threat --> preventive barrier 1 --> barrier 2 --> junction --> top event
  // Top event --> junction --> recovery barrier 1 --> barrier 2 --> consequence
  // A separate, vertical tree is drawn for each barrier's escalation factors.
  function drawConnectors(){
    const plot=$('diagramPlot'),svg=$('connectorLayer'),event=$('topEventNode');
    if(!plot||!svg||!event)return;
    const pr=plot.getBoundingClientRect();
    if(!pr.width||!pr.height)return;
    // Element rects report transformed positions, but SVG paths use unscaled
    // coordinates within the board. Divide out the scale to keep all links exact.
    const sx=plot.offsetWidth/pr.width, sy=plot.offsetHeight/pr.height;
    svg.replaceChildren();
    svg.setAttribute('viewBox',`0 0 ${plot.offsetWidth} ${plot.offsetHeight}`);
    svg.setAttribute('preserveAspectRatio','none');
    const ns='http://www.w3.org/2000/svg';
    const point=el=>{const r=el.getBoundingClientRect();return {
      left:(r.left-pr.left)*sx,right:(r.right-pr.left)*sx,top:(r.top-pr.top)*sy,bottom:(r.bottom-pr.top)*sy,
      x:(r.left-pr.left+r.width/2)*sx,y:(r.top-pr.top+r.height/2)*sy
    };};
    const ev=point(event);
    function line(points,color,width=2,dashed=false,role=''){
      const path=document.createElementNS(ns,'path');
      path.setAttribute('d',points.map((p,i)=>(i?'L ':'M ')+p[0].toFixed(2)+' '+p[1].toFixed(2)).join(' '));
      path.setAttribute('fill','none');path.setAttribute('stroke',color);
      path.setAttribute('stroke-width',width);path.setAttribute('stroke-linecap','round');
      path.setAttribute('stroke-linejoin','round');
      if(dashed)path.setAttribute('stroke-dasharray','4 5');
      if(role)path.setAttribute('data-connector',role);
      svg.append(path);
    }
    function endpoint(x,y,color,role){
      const dot=document.createElementNS(ns,'circle');
      dot.setAttribute('cx',x);dot.setAttribute('cy',y);dot.setAttribute('r',3);
      dot.setAttribute('fill','#fff');dot.setAttribute('stroke',color);
      dot.setAttribute('stroke-width','1.6');dot.setAttribute('data-connector',role);
      svg.append(dot);
    }
    const sides=[
      {pathColumn:'threatNodes',barrierColumn:'preventionNodes',left:true,color:'#74b9a5'},
      {pathColumn:'consequenceNodes',barrierColumn:'recoveryNodes',left:false,color:'#86afd5'}
    ];
    for(const side of sides){
      const pathRows=[...$(side.pathColumn).querySelectorAll(':scope > .stream-group')];
      const barrierRows=[...$(side.barrierColumn).querySelectorAll(':scope > .stream-group')];
      const pairs=[];
      pathRows.forEach((pathRow,index)=>{
        const barrierRow=barrierRows[index],pathNode=pathRow.querySelector('[data-anchor="path"]');
        if(!pathNode||!barrierRow)return;
        // Only this path's barriers: never query by ID globally across columns.
        const units=[...barrierRow.querySelectorAll(':scope > .barrier-unit')];
        const bars=units.map(u=>u.querySelector(':scope > [data-anchor="barrier"]')).filter(Boolean);
        const path=point(pathNode),positions=bars.map(point);
        // One shared centreline per pathway: no diagonal segments from cards
        // of differing heights or subpixel rounding after scaling.
        const laneY=path.y;
        if(side.left){
          let previous=path;
          for(let i=0;i<positions.length;i++){
            const current=positions[i];
            line([[previous.right,laneY],[current.left,laneY]],side.color,2,false,'main-path');
            previous=current;
          }
          pairs.push({exit:previous.right,y:laneY});
        }else{
          for(let i=0;i<positions.length-1;i++){
            const a=positions[i],b=positions[i+1];
            line([[a.right,laneY],[b.left,laneY]],side.color,2,false,'main-path');
          }
          if(positions.length){
            const last=positions[positions.length-1];
            line([[last.right,laneY],[path.left,laneY]],side.color,2,false,'main-path');
          }
          pairs.push({entry:positions.length?positions[0].left:path.left,y:laneY});
        }
        if(!showEscalation)return;
        units.forEach(unit=>{
          const barrier=unit.querySelector(':scope > [data-anchor="barrier"]');
          const factorRows=[...unit.querySelectorAll(':scope > .escalation-tree > .escalation-factor-row')];
          if(!barrier||!factorRows.length)return;
          const b=point(barrier),factors=factorRows.map(row=>row.querySelector(':scope > [data-anchor="escalationFactor"]')).filter(Boolean).map(point);
          if(!factors.length)return;
          const trunkX=b.left+7,first=factors[0],last=factors[factors.length-1];
          line([[trunkX,b.bottom],[trunkX,last.y]],'#d7a16b',1.8,true,'escalation-trunk');
          factorRows.forEach(row=>{
            const factor=row.querySelector(':scope > [data-anchor="escalationFactor"]');
            if(!factor)return;
            const f=point(factor);
            line([[trunkX,f.y],[f.left,f.y]],'#d7a16b',1.8,true,'escalation-branch');
            endpoint(trunkX,f.y,'#d7a16b','escalation-junction');
            const controls=[...row.querySelectorAll(':scope > .escalation-controls-column > [data-anchor="escalationControl"]')].map(point);
            if(!controls.length)return;
            const ctrlX=controls[0].left-7;
            line([[f.left+7,f.bottom],[ctrlX,f.bottom],[ctrlX,controls[controls.length-1].y]],'#a58bbe',1.8,true,'control-trunk');
            controls.forEach(c=>{
              line([[ctrlX,c.y],[c.left,c.y]],'#a58bbe',1.8,true,'control-branch');
              endpoint(ctrlX,c.y,'#a58bbe','control-junction');
            });
          });
        });
      });
      if(!pairs.length)continue;
      // A shared junction in the empty column gap replaces dozens of crossing
      // barrier-to-event Bezier curves. All row stubs are short and horizontal.
      const barrierRect=$(side.barrierColumn).getBoundingClientRect();
      const laneEdge=side.left?(barrierRect.right-pr.left)*sx:(barrierRect.left-pr.left)*sx;
      const busX=side.left?(laneEdge+ev.left)/2:(ev.right+laneEdge)/2;
      const ys=pairs.map(pair=>pair.y);
      const minY=Math.min(ev.y,...ys),maxY=Math.max(ev.y,...ys);
      line([[busX,minY],[busX,maxY]],side.color,2.25,false,'main-trunk');
      if(side.left){
        pairs.forEach(pair=>{
          line([[pair.exit,pair.y],[busX,pair.y]],side.color,2,false,'main-junction');
          endpoint(busX,pair.y,side.color,'main-node');
        });
        line([[busX,ev.y],[ev.left,ev.y]],side.color,2.25,false,'top-event-link');
      }else{
        line([[ev.right,ev.y],[busX,ev.y]],side.color,2.25,false,'top-event-link');
        pairs.forEach(pair=>{
          line([[busX,pair.y],[pair.entry,pair.y]],side.color,2,false,'main-junction');
          endpoint(busX,pair.y,side.color,'main-node');
        });
      }
      endpoint(busX,ev.y,side.color,'event-junction');
    }
  }
  function render(){numberIndex=buildNumberIndex(activeProject());translateUI();renderSidebar();renderHeader();renderRiskAssessment();renderDiagram();window.bowtieCollab?.onRender();}
  function addProject(){const p=blankProject();state.projects.push(p);state.activeId=p.id;persist();render();openEditor('project');toast(t('created'));}
  function addPath(kind){const arr=kind==='threat'?activeProject().threats:activeProject().consequences;const path=makePath(kind==='threat'?t('newThreat'):t('newConsequence'),'',[]);if(kind==='consequence')path.risk=normaliseRisk();arr.push(path);persist();render();openEditor(kind,path.id);}
  function addBarrier(kind,parentId){const paths=kind==='preventive'?activeProject().threats:activeProject().consequences;const parent=paths.find(p=>p.id===parentId);if(!parent)return;const b=makeBarrier(kind==='preventive'?t('newPreventive'):t('newRecovery'),'planned');parent.barriers.push(b);persist();render();openEditor(kind,b.id,parentId);}
  function locateEditorTarget(ctx){
    const p=activeProject();if(!ctx)return null;
    if(ctx.kind==='project')return p;if(ctx.kind==='hazard')return p.hazard;if(ctx.kind==='topEvent')return p.topEvent;
    if(ctx.kind==='threat'||ctx.kind==='consequence')return (ctx.kind==='threat'?p.threats:p.consequences).find(v=>v.id===ctx.id);
    if(['preventive','recovery','escalationFactor','escalationControl'].includes(ctx.kind)){
      const kind=ctx.kind==='preventive'||ctx.kind==='recovery'?ctx.kind:ctx.side;
      const b=findBarrier(kind,ctx.parentId,ctx.kind==='preventive'||ctx.kind==='recovery'?ctx.id:ctx.barrierId);
      if(ctx.kind==='preventive'||ctx.kind==='recovery')return b;
      const factor=b?.escalationFactors.find(f=>f.id===(ctx.kind==='escalationFactor'?ctx.id:ctx.factorId));
      return ctx.kind==='escalationFactor'?factor:factor?.controls.find(c=>c.id===ctx.id);
    }
    return null;
  }
  function addEditorField({name,label,value='',type='text',hint='',maxLength=2000,options=[]}){const wrapper=document.createElement('div');wrapper.className='field';const labelEl=document.createElement('label');labelEl.setAttribute('for','form-'+name);labelEl.textContent=label;wrapper.append(labelEl);let input;if(type==='textarea'){input=document.createElement('textarea');input.rows=4;input.value=value;}else if(type==='select'){input=document.createElement('select');options.forEach(o=>{const option=document.createElement('option');option.value=o.value;option.textContent=o.label;option.selected=o.value===value;input.append(option);});}else{input=document.createElement('input');input.type=type==='number'?'number':'text';if(type==='number'){input.min=1;input.max=24;input.step=1;}input.value=value;}input.id='form-'+name;input.name=name;input.maxLength=maxLength;if(name==='title')input.required=true;wrapper.append(input);if(hint){const note=document.createElement('div');note.className='field-hint';note.textContent=hint;wrapper.append(note);}return wrapper;}
  function openEditor(kind,id=null,parentId=null,barrierId=null,factorId=null,side=null){editorCtx={kind,id,parentId,barrierId,factorId,side:side||((kind==='escalationFactor'||kind==='escalationControl')?(activeProject().threats.find(p=>p.id===parentId)?'preventive':'recovery'):null)};const obj=locateEditorTarget(editorCtx);if(!obj)return;const fields=$('editorFields');fields.replaceChildren();$('drawerOverline').textContent=t('analysis').toUpperCase()+(numberOf(obj)?' · '+numberOf(obj):'');$('drawerTitle').textContent=t(({project:'editAnalysis',hazard:'editHazard',topEvent:'editTopEvent',threat:'editThreat',consequence:'editConsequence',preventive:'editPreventive',recovery:'editRecovery',escalationFactor:'editEscalationFactor',escalationControl:'editEscalationControl'})[kind]);
    const field=(name,label,value,type='text',hint='',maxLength=2000,options=[])=>fields.append(addEditorField({name,label,value,type,hint,maxLength,options}));
    if(kind==='project'){
      field('title',t('analysisTitle'),obj.title,'text','',400);field('subtitle',t('subtitle'),obj.subtitle,'textarea','',700);field('owner',t('owner'),obj.owner,'text',t('ownerHint'),300);field('version',t('version'),obj.version,'text',t('projectHint'),100);
      const group=document.createElement('h3');group.className='field-group-title';group.textContent=t('riskCriteria');fields.append(group);
      const hint=document.createElement('p');hint.className='editor-note';hint.textContent=t('riskThresholdHelp');fields.append(hint);
      const duplicate=document.createElement('button');duplicate.className='btn secondary';duplicate.type='button';duplicate.textContent='⧉  '+t('duplicateAnalysis');duplicate.addEventListener('click',duplicateProject);fields.append(duplicate);
    }else if(kind==='hazard'||kind==='topEvent'||kind==='threat'||kind==='consequence'){
      field('title',t('itemTitle'),obj.title,'text','',500);field('description',t('description'),obj.description,'textarea','',3000);
      if(kind==='consequence'){
        obj.risk ||= normaliseRisk();
        const sep=document.createElement('hr');sep.className='field-separator';fields.append(sep);
        const title=document.createElement('h3');title.className='field-group-title';title.textContent=t('riskDetails');fields.append(title);
        const assessor=document.createElement('section');assessor.className='risk-assessor icao-assessor';
        assessor.setAttribute('aria-label',t('riskMatrixTitle'));
        assessor.innerHTML=`<div class="risk-assessor-head"><strong>${escapeHtml(t('riskMatrixTitle'))}</strong><span class="icao-mark">5 × 5</span></div><p class="risk-assessor-help">${escapeHtml(t('riskMatrixHelp'))}</p><div class="risk-assessor-tabs" role="group" aria-label="${escapeHtml(t('riskMatrixPick'))}"><button class="risk-stage-btn active" type="button" data-stage="initial">${escapeHtml(t('riskInitial'))}</button><button class="risk-stage-btn" type="button" data-stage="residual">${escapeHtml(t('riskResidual'))}</button></div><div class="icao-current"><div class="icao-current-label">${escapeHtml(t('riskSelected'))}</div><div class="icao-current-risk" aria-live="polite"></div><button type="button" class="icao-clear">${escapeHtml(t('riskClear'))}</button></div><div class="risk-matrix-layout"><span class="matrix-axis-title matrix-y">${escapeHtml(t('riskLikelihood'))}</span><div class="risk-matrix-grid" role="group" aria-label="${escapeHtml(t('riskMatrixTitle'))}"></div></div><div class="matrix-bottom-axis">${escapeHtml(t('riskSeverityAxis'))}</div><div class="matrix-legend"></div><details class="icao-criteria"><summary>${escapeHtml(t('riskLegendDetails'))}</summary><div class="icao-definitions"><div class="icao-probability"></div><div class="icao-severity"></div></div></details>`;
        fields.append(assessor);
        // These four hidden values remain part of the existing save/JSON workflow.
        for(const phase of ['initial','residual']){
          const rating=normaliseRating(obj.risk[phase]);
          for(const axis of ['likelihood','severity']){
            const hidden=document.createElement('input');hidden.type='hidden';hidden.id=`form-risk_${phase}_${axis}`;
            hidden.name=`risk_${phase}_${axis}`;hidden.value=rating[axis]||'';fields.append(hidden);
          }
        }
        let stage='initial';
        const grid=assessor.querySelector('.risk-matrix-grid');
        const corner=document.createElement('div');corner.className='matrix-corner';corner.textContent='P / S';grid.append(corner);
        for(const sev of ICAO_SEVERITIES){const h=document.createElement('div');h.className='matrix-header';h.textContent=sev;h.title=t('icaoSeverity'+sev);grid.append(h);}
        const riskCells=[];
        for(let l=5;l>=1;l--){
          const h=document.createElement('div');h.className='matrix-header';h.textContent=l;h.title=t('icaoProbability'+l);grid.append(h);
          for(const sev of ICAO_SEVERITIES){
            const index=`${l}${sev}`,band=riskBand(index);
            const cell=document.createElement('button');cell.type='button';cell.className=`risk-matrix-cell matrix-${band}`;
            cell.innerHTML=`<strong>${index}</strong>`;
            cell.dataset.l=String(l);cell.dataset.s=sev;
            cell.title=`${t('icaoProbability'+l)} · ${t('icaoSeverity'+sev)} · ${riskLabel(band)}`;
            cell.setAttribute('aria-label',`${index} — ${t('icaoProbability'+l)}, ${t('icaoSeverity'+sev)}; ${riskLabel(band)}`);
            cell.addEventListener('click',()=>{
              $('form-risk_'+stage+'_likelihood').value=String(l);
              $('form-risk_'+stage+'_severity').value=sev;
              updateRiskPreview();
            });
            riskCells.push(cell);grid.append(cell);
          }
        }
        const legend=assessor.querySelector('.matrix-legend');
        for(const band of ['extreme','medium','low']){
          const el=document.createElement('span');el.className=`risk-key risk-${band}`;el.textContent=riskLabel(band);legend.append(el);
        }
        for(let l=5;l>=1;l--){const p=document.createElement('p');p.textContent=`${l} — ${t('icaoProbability'+l)}`;assessor.querySelector('.icao-probability').append(p);}
        for(const sev of ICAO_SEVERITIES){const p=document.createElement('p');p.textContent=`${sev} — ${t('icaoSeverity'+sev)}`;assessor.querySelector('.icao-severity').append(p);}
        function updateRiskPreview(){
          const rating={likelihood:$('form-risk_'+stage+'_likelihood').value,severity:$('form-risk_'+stage+'_severity').value};
          assessor.querySelector('.icao-current-risk').innerHTML=riskPill(rating);
          riskCells.forEach(cell=>{
            const current=Number(rating.likelihood)===Number(cell.dataset.l)&&rating.severity===cell.dataset.s;
            cell.classList.toggle('is-selected',current);cell.setAttribute('aria-pressed',String(current));
          });
          assessor.querySelectorAll('.risk-stage-btn').forEach(button=>{
            const active=button.dataset.stage===stage;
            button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
          });
        }
        assessor.querySelectorAll('.risk-stage-btn').forEach(btn=>btn.addEventListener('click',()=>{stage=btn.dataset.stage;updateRiskPreview();}));
        assessor.querySelector('.icao-clear').addEventListener('click',()=>{
          $('form-risk_'+stage+'_likelihood').value='';$('form-risk_'+stage+'_severity').value='';updateRiskPreview();
        });
        updateRiskPreview();
        field('riskRationale',t('riskRationale'),obj.risk.rationale,'textarea',t('riskRationaleHint'),3000);
        const advice=document.createElement('p');advice.className='editor-note risk-editor-note';advice.textContent=t('riskGuidance');fields.append(advice);

      }
    }else if(kind==='escalationFactor'){
      field('title',t('escalationFactor'),obj.title,'text',t('barrierWeakness'),400);
      field('description',t('description'),obj.description,'textarea',t('escalationHint'),3000);
      const hint=document.createElement('div');hint.className='editor-note';hint.textContent=t('escalationControlsHint');fields.append(hint);
      const add=document.createElement('button');add.className='micro-add control-add editor-micro-add';add.type='button';add.textContent='+';add.title=t('addEscalationControl');add.setAttribute('aria-label',t('addEscalationControl'));add.addEventListener('click',()=>addEscalationControl(editorCtx.side,editorCtx.parentId,editorCtx.barrierId,editorCtx.id));fields.append(add);
    }else{
      field('title',t('itemTitle'),obj.title,'text','',400);
      field('owner',t('owner'),obj.owner,'text',t('ownerHint'),300);
      field('status',t('controlStatus'),obj.status,'select','',100,[{value:'effective',label:t('effective')},{value:'needs-review',label:t('needsReview')},{value:'planned',label:t('planned')}]);
      field('description',t('description'),obj.description,'textarea',kind==='escalationControl'?t('mitigationExplanation'):'',3000);
      if(kind==='preventive'||kind==='recovery'){
        const sep=document.createElement('hr');sep.className='field-separator';fields.append(sep);
        const h=document.createElement('h3');h.className='field-group-title';h.textContent=t('escalationFactors')+' ('+obj.escalationFactors.length+')';fields.append(h);
        const note=document.createElement('p');note.className='editor-note';note.textContent=t('escalationExplanation');fields.append(note);
        const add=document.createElement('button');add.className='micro-add factor-add editor-micro-add';add.type='button';add.textContent='+';add.title=t('addEscalationFactor');add.setAttribute('aria-label',t('addEscalationFactor'));add.addEventListener('click',()=>addEscalationFactor(kind,editorCtx.parentId,editorCtx.id));fields.append(add);
      }
    }
    $('deleteItemButton').classList.toggle('hidden',kind==='hazard'||kind==='topEvent');$('editorDrawer').classList.add('open');$('editorDrawer').setAttribute('aria-hidden','false');$('drawerScrim').classList.add('show');document.body.style.overflow='hidden';setTimeout(()=>{if(window.matchMedia('(pointer:fine)').matches)$('editorFields').querySelector('input,textarea,select')?.focus();},180);
  }
  function closeDrawer(){editorCtx=null;$('editorFields').replaceChildren();$('editorDrawer').classList.remove('open');$('editorDrawer').setAttribute('aria-hidden','true');$('drawerScrim').classList.remove('show');document.body.style.overflow='';}
  function saveEditor(event){event.preventDefault();const obj=locateEditorTarget(editorCtx);if(!obj)return;const data=new FormData(event.currentTarget);const title=safeText((data.get('title')||'').toString().trim(),500);if(!title){$('form-title')?.focus();return;}  if(editorCtx.kind==='consequence'){
    obj.risk ||= normaliseRisk();
    for(const phase of ['initial','residual'])obj.risk[phase]={likelihood:riskNumber(data.get('risk_'+phase+'_likelihood')),severity:riskSeverityCode(data.get('risk_'+phase+'_severity'))};
    obj.risk.rationale=safeText(String(data.get('riskRationale')||''),3000);
  }
  for(const [k,value] of data){if(['title','subtitle','owner','version','description','status'].includes(k))obj[k]=safeText(value.toString().trim());}persist();closeDrawer();render();toast(t('saved'));}
  function deleteProject(projectId){
    // Deleting here only removes the local workspace reference. The shared room remains on the server.
    const index=state.projects.findIndex(p=>p.id===projectId);
    if(index<0)return;
    const project=state.projects[index];
    if(!window.confirm(t('confirmDeleteProject').replace('{name}',project.title)))return;
    const deletingActive=state.activeId===projectId;
    state.projects.splice(index,1);
    if(state.projects.length===0){
      // A new empty workspace is always available, even after deleting the last project.
      const empty=blankProject();state.projects.push(empty);state.activeId=empty.id;
    }else if(deletingActive){
      state.activeId=state.projects[Math.min(index,state.projects.length-1)].id;
    }
    persist();closeDrawer();closeMobileMenu();render();toast(t('projectDeleted'));
  }
  function deleteCurrent(){const ctx=editorCtx;if(!ctx)return;if(ctx.kind==='project'){
      deleteProject(state.activeId);return;
    }else if(ctx.kind==='hazard'||ctx.kind==='topEvent')return;
    else{if(!confirm(t('confirmDelete')))return;const p=activeProject();if(ctx.kind==='threat'||ctx.kind==='consequence'){const k=ctx.kind==='threat'?'threats':'consequences';p[k]=p[k].filter(item=>item.id!==ctx.id);}else if(ctx.kind==='escalationFactor'||ctx.kind==='escalationControl'){
        const barrier=findBarrier(ctx.side,ctx.parentId,ctx.barrierId);
        if(barrier){if(ctx.kind==='escalationFactor')barrier.escalationFactors=barrier.escalationFactors.filter(f=>f.id!==ctx.id);
          else{const factor=barrier.escalationFactors.find(f=>f.id===ctx.factorId);if(factor)factor.controls=factor.controls.filter(c=>c.id!==ctx.id);}}
      }else{const collection=ctx.kind==='preventive'?p.threats:p.consequences;const parent=collection.find(item=>item.id===ctx.parentId);if(parent)parent.barriers=parent.barriers.filter(item=>item.id!==ctx.id);}}
    persist();closeDrawer();render();toast(t('deleted'));
  }
  function duplicateProject(){const source=activeProject();const copy=normalizeProject({...source,id:uid(),title:source.title+' ('+t('copy')+')'});copy.id=uid();state.projects.push(copy);state.activeId=copy.id;persist();closeDrawer();render();toast(t('duplicated'));}
  function slug(name){return (name||'bowtie').trim().replace(/[^\p{L}\p{N}\-_]+/gu,'-').replace(/^-+|-+$/g,'').slice(0,90)||'bowtie';}
  function downloadBlob(blob,name){const href=URL.createObjectURL(blob);const a=document.createElement('a');a.href=href;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),12000);}
  function exportJson(){const data={format:'bowtie888',schemaVersion:4,exportedAt:new Date().toISOString(),project:activeProject()};downloadBlob(new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'}),slug(activeProject().title)+'.bowtie.json');toast(t('downloaded'));}
  async function importJson(file){if(!file)return;try{if(file.size>5*1024*1024)throw Error('File too large');const raw=JSON.parse(await file.text());let record=raw?.project||raw;if(Array.isArray(raw?.projects))record=raw.projects[0];if(!record||typeof record!=='object'||!('topEvent' in record)||!('hazard' in record)||!('threats' in record)||!('consequences' in record))throw Error('Invalid BowTie project');const p=normalizeProject(record);if(!p)throw Error('Invalid project');p.id=uid();state.projects.push(p);state.activeId=p.id;persist();render();toast(t('imported'));}catch(err){console.error('Import error',err);toast(t('invalidProject'));}finally{$('jsonInput').value='';}}
  function updateSidebarUI(){
    const mobile=sidebarMedia.matches;
    const sidebar=$('sidebar');
    const open=mobile?sidebar.classList.contains('mobile-open'):!sidebarCollapsed;
    document.body.classList.toggle('sidebar-collapsed',!mobile&&sidebarCollapsed);
    if(!mobile)sidebar.classList.remove('mobile-open');
    $('mobileScrim').classList.toggle('show',mobile&&open);
    sidebar.inert=!open;
    sidebar.setAttribute('aria-hidden',String(!open));
    const toggle=$('menuBtn');
    toggle.setAttribute('aria-expanded',String(open));
    const label=t(open?'sidebarHide':'sidebarShow');
    toggle.setAttribute('aria-label',label);
    toggle.title=label;
    $('sidebarCloseBtn').setAttribute('aria-label',t(mobile?'sidebarClose':'sidebarHide'));
    $('sidebarCloseBtn').title=t(mobile?'sidebarClose':'sidebarHide');
  }
  function closeMobileMenu(){
    const sidebar=$('sidebar');
    if(sidebarMedia.matches&&sidebar.contains(document.activeElement))$('menuBtn').focus();
    sidebar.classList.remove('mobile-open');
    updateSidebarUI();
  }
  function toggleSidebar(){
    if(sidebarMedia.matches){$('sidebar').classList.toggle('mobile-open');}
    else {
      if(!sidebarCollapsed&&$('sidebar').contains(document.activeElement))$('menuBtn').focus();
      sidebarCollapsed=!sidebarCollapsed;
      try{localStorage.setItem(SIDEBAR_KEY,String(sidebarCollapsed));}catch{}
    }
    updateSidebarUI();
    // The diagram retains its zoom while its available viewport expands.
    requestAnimationFrame(()=>{drawConnectors();});
  }
  function closeSidebar(){
    if(sidebarMedia.matches)closeMobileMenu();
    else if(!sidebarCollapsed)toggleSidebar();
  }
  function installEvents(){
    $('newProjectSide').addEventListener('click',addProject);$('quickProject').addEventListener('click',addProject);
    ['addThreatTop','quickThreat'].forEach(id=>$(id).addEventListener('click',()=>addPath('threat')));
    ['addConsequenceTop','quickConsequence'].forEach(id=>$(id).addEventListener('click',()=>addPath('consequence')));
    ['editProjectTitle','editProjectAvatar'].forEach(id=>$(id).addEventListener('click',()=>openEditor('project')));
    $('editContext').addEventListener('click',()=>openEditor('hazard'));
    $('exportJsonButton').addEventListener('click',exportJson);
    $('deleteProjectButton').addEventListener('click',()=>deleteProject(state.activeId));
    $('exportPdfButton').addEventListener('click',exportPdf);
    $('toggleEscalation').addEventListener('click',()=>{showEscalation=!showEscalation;renderDiagram();});
    $('importButton').addEventListener('click',()=>$('jsonInput').click());
    $('jsonInput').addEventListener('change',e=>importJson(e.target.files?.[0]));
    $('themeTrigger').addEventListener('click',()=>{
      const menu=$('themeMenu');menu.hidden=!menu.hidden;
      $('themeTrigger').setAttribute('aria-expanded',String(!menu.hidden));
    });
    document.querySelectorAll('[data-theme-option]').forEach(button=>button.addEventListener('click',()=>setTheme(button.dataset.themeOption)));
    document.addEventListener('click',e=>{if(!$('themePicker').contains(e.target))closeThemeMenu();});
    $('themeMenu').addEventListener('keydown',e=>{
      if(e.key==='Escape'){closeThemeMenu();$('themeTrigger').focus();}
      if(e.key==='ArrowDown'||e.key==='ArrowUp'){
        const buttons=[...document.querySelectorAll('[data-theme-option]')];const current=buttons.indexOf(document.activeElement);
        const step=e.key==='ArrowDown'?1:-1;
        buttons[(current+step+buttons.length)%buttons.length].focus();e.preventDefault();
      }
    });
    themeMedia?.addEventListener?.('change',()=>{if(chosenTheme==='system')applyTheme();});
    $('langEN').addEventListener('click',()=>setLang('en'));
    $('langTH').addEventListener('click',()=>setLang('th'));
    $('editorForm').addEventListener('submit',saveEditor);
    $('deleteItemButton').addEventListener('click',deleteCurrent);
    ['closeDrawer','cancelEditButton','drawerScrim'].forEach(id=>$(id).addEventListener('click',closeDrawer));
    $('menuBtn').addEventListener('click',toggleSidebar);
    $('sidebarCloseBtn').addEventListener('click',closeSidebar);
    sidebarMedia.addEventListener?.('change',()=>{closeMobileMenu();updateSidebarUI();requestAnimationFrame(drawConnectors);});
    $('mobileScrim').addEventListener('click',closeMobileMenu);
    $('navOverview').addEventListener('click',()=>{closeMobileMenu();window.scrollTo({top:0,behavior:'smooth'});});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeThemeMenu();closeDrawer();closeMobileMenu();}if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='s'){e.preventDefault();if(editorCtx)$('editorForm').requestSubmit();else{persist();toast(t('saved'));}}});
    let pending=false;const queueDraw=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;drawConnectors();});};
    window.addEventListener('resize',queueDraw);
    $('diagramScroll').addEventListener('scroll',queueDraw,{passive:true});
    $('zoomIn').addEventListener('click',()=>zoomStage(diagramZoom*1.2));
    $('zoomOut').addEventListener('click',()=>zoomStage(diagramZoom/1.2));
    $('zoomFit').addEventListener('click',fitDiagram);
    $('zoomCenter').addEventListener('click',centerDiagram);
    let pinchStart=null;
    const distance=touches=>Math.hypot(touches[0].clientX-touches[1].clientX,touches[0].clientY-touches[1].clientY);
    $('diagramScroll').addEventListener('touchstart',e=>{
      if(e.touches.length===2){
        const r=$('diagramScroll').getBoundingClientRect();
        pinchStart={distance:distance(e.touches),zoom:diagramZoom,
          x:(e.touches[0].clientX+e.touches[1].clientX)/2-r.left,
          y:(e.touches[0].clientY+e.touches[1].clientY)/2-r.top};
      }
    },{passive:true});
    $('diagramScroll').addEventListener('touchmove',e=>{
      if(e.touches.length===2&&pinchStart){
        e.preventDefault();
        zoomStage(pinchStart.zoom*distance(e.touches)/Math.max(1,pinchStart.distance),pinchStart);
      }
    },{passive:false});
    $('diagramScroll').addEventListener('touchend',e=>{if(e.touches.length<2)pinchStart=null;},{passive:true});
    $('diagramScroll').addEventListener('touchcancel',()=>{pinchStart=null;},{passive:true});
    // Reflow after orientation changes, without unexpectedly discarding user zoom.
    let lastWidth=window.innerWidth;
    window.addEventListener('resize',()=>{
      if(Math.abs(lastWidth-window.innerWidth)>40){lastWidth=window.innerWidth;requestAnimationFrame(()=>zoomStage(diagramZoom));}
    });
    if(typeof ResizeObserver!=='undefined')new ResizeObserver(queueDraw).observe($('diagramPlot'));
    document.fonts?.ready.then(()=>{syncPathHeights();zoomStage(diagramZoom);}).catch(()=>{});
  }
  function setLang(next){lang=next;try{localStorage.setItem(LANG_KEY,lang);}catch{}render();if(editorCtx){const ctx={...editorCtx};openEditor(ctx.kind,ctx.id,ctx.parentId,ctx.barrierId,ctx.factorId,ctx.side);}}
  // PDF export is fully local: high-resolution Canvas pages embedded in a PDF file.
  // Rasterizing in the browser preserves Thai glyphs without third-party PDF services.
  const PW=2100, PH=1485;
  const palette={navy:'#192a3d',ink:'#26384a',muted:'#7e8d9d',line:'#e6edf1',bg:'#f6f8fa',teal:'#e8f5f0',tealDark:'#247c70',blue:'#eaf2fb',blueDark:'#547faf',orange:'#fff0e6',orangeDark:'#a96a45',purple:'#f4edf9',purpleDark:'#8971a6',hazard:'#fcf4e5',event:'#faeeec'};
  function newCanvas(){const c=document.createElement('canvas');c.width=PW;c.height=PH;return c;}
  function font(ctx,size=25,weight=500){ctx.font=`${weight} ${size}px "Noto Sans Thai", "Manrope", Tahoma, sans-serif`;}
  function txt(ctx,str,x,y,size=24,color=palette.ink,weight=500){ctx.save();font(ctx,size,weight);ctx.fillStyle=color;ctx.textBaseline='top';ctx.fillText(String(str??''),x,y);ctx.restore();}
  function rrect(ctx,x,y,w,h,r,fill,border=null){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(border){ctx.strokeStyle=border;ctx.lineWidth=2;ctx.stroke();}}
  function splitWords(s){const text=String(s??'');if(typeof Intl.Segmenter==='function'){try{return [...new Intl.Segmenter(lang==='th'?'th':'en',{granularity:'word'}).segment(text)].map(v=>v.segment);}catch{}}return text.split(/(?<=\s)/u);}
  function wrapLines(ctx,value,maxWidth){const lines=[];const paragraphs=String(value??'').split(/\r?\n/);for(const paragraph of paragraphs){if(!paragraph){lines.push('');continue;}const bits=splitWords(paragraph);let line='';for(const bit of bits){if(ctx.measureText(line+bit).width<=maxWidth){line+=bit;continue;}if(line){lines.push(line.trim());line='';}if(ctx.measureText(bit).width<=maxWidth){line=bit;continue;}for(const char of bit){if(ctx.measureText(line+char).width>maxWidth&&line){lines.push(line.trim());line='';}line+=char;}}if(line)lines.push(line.trim());}return lines;}
  function wrapped(ctx,value,x,y,maxWidth,size=22,color=palette.ink,weight=500,lineHeight=1.45,maxLines=3){ctx.save();font(ctx,size,weight);ctx.fillStyle=color;ctx.textBaseline='top';const lines=wrapLines(ctx,value,maxWidth);let count=Math.min(lines.length,maxLines);for(let i=0;i<count;i++){let content=lines[i];if(i===maxLines-1&&lines.length>maxLines){while(ctx.measureText(content+'…').width>maxWidth&&content.length)content=content.slice(0,-1);content+='…';}ctx.fillText(content,x,y+i*size*lineHeight);}ctx.restore();return count*size*lineHeight;}
  function pageBase(ctx,section,sub='',pageNo=1){ctx.fillStyle=palette.bg;ctx.fillRect(0,0,PW,PH);ctx.fillStyle=palette.navy;ctx.fillRect(0,0,PW,200);txt(ctx,'◈  Bowtie Together',90,38,26,'#e9c68f',800);wrapped(ctx,section,90,83,1520,45,'#ffffff',800,1.25,1);wrapped(ctx,sub,90,144,1510,22,'#b8c8d5',500,1.3,1);txt(ctx,new Date().toLocaleDateString(lang==='th'?'th-TH':'en-US',{year:'numeric',month:'short',day:'numeric'}),1760,55,22,'#cfdae2',600);
    ctx.strokeStyle=palette.line;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(90,1390);ctx.lineTo(2010,1390);ctx.stroke();txt(ctx,'Bowtie Together  •  '+t('pdfReport'),90,1410,17,palette.muted,500);txt(ctx,t('pdfPage')+' '+pageNo,1900,1410,18,palette.muted,600);
  }
  function pdfMetric(ctx,x,y,w,label,val,fill){rrect(ctx,x,y,w,118,17,'#fff',palette.line);rrect(ctx,x+22,y+23,65,68,13,fill);txt(ctx,String(val),x+43,y+37,29,palette.ink,800);wrapped(ctx,label,x+105,y+40,w-127,22,palette.muted,700,1.3,2);}
  function pdfCard(ctx,x,y,w,h,fill,title,body,accent){rrect(ctx,x,y,w,h,14,fill,palette.line);txt(ctx,title,x+23,y+19,18,accent,800);wrapped(ctx,body,x+23,y+53,w-46,22,palette.ink,750,1.35,3);}
  function pdfPathCard(ctx,path,x,y,fill,accent,index,kind){
    rrect(ctx,x,y,340,156,14,'#fff',palette.line);rrect(ctx,x+16,y+16,48,48,11,fill);
    txt(ctx,kind==='threat'?'↘':'↗',x+27,y+23,25,accent,700);
    txt(ctx,`${t(kind).toUpperCase()} · ${numberOf(path)}`,x+79,y+20,16,palette.muted,800);
    wrapped(ctx,path.title,x+79,y+49,236,20,palette.ink,800,1.25,kind==='consequence'?2:3);
    if(kind==='consequence'){
      const drawSmall=(phase,y2)=>{
        const value=riskScore(path.risk?.[phase]),band=riskBand(value,activeProject().riskBands);
        const fills={low:'#ddf3e8',medium:'#fff3d2',high:'#ffebd6',extreme:'#f9dde3',unassessed:'#eef1f4'};
        const inks={low:'#287c59',medium:'#94742d',high:'#a35a24',extreme:'#a23546',unassessed:'#83919d'};
        txt(ctx,t(phase==='initial'?'riskInitial':'riskResidual'),x+20,y2+3,13,palette.muted,700);
        rrect(ctx,x+146,y2,63,21,5,fills[band]);txt(ctx,value??'—',x+159,y2+1,14,inks[band],800);
        // Diagram overview intentionally shows the risk index only. Detailed risk pages retain the level.
      };
      drawSmall('initial',y+104);drawSmall('residual',y+130);
    }
  }
  function pdfBarriersCard(ctx,path,x,y,fill,accent){rrect(ctx,x,y,330,156,14,fill,palette.line);txt(ctx,`${t('pdfControls')} · ${path.barriers.length}`,x+18,y+13,16,accent,800);if(!path.barriers.length){wrapped(ctx,t('pdfNoControl'),x+19,y+58,292,21,palette.muted,500,1.3,2);return;}
    const visible=path.barriers.slice(0,3);visible.forEach((b,j)=>{rrect(ctx,x+17,y+48+j*32,9,9,4,{effective:'#5cb390','needs-review':'#dfa35c',planned:'#a3aebb'}[b.status]);wrapped(ctx,numberLabel(b)+b.title,x+38,y+42+j*32,268,18,palette.ink,600,1.2,1);});if(path.barriers.length>3)txt(ctx,'+'+(path.barriers.length-3),x+283,y+129,18,accent,800);
  }
  function pdfOverviewPage(p,pageNo){const canvas=newCanvas(),ctx=canvas.getContext('2d');pageBase(ctx,t('pdfOverview'),p.title,pageNo);
    const countP=p.threats.reduce((s,it)=>s+it.barriers.length,0),countR=p.consequences.reduce((s,it)=>s+it.barriers.length,0);
    const labels=[t('threats'),t('preventiveControls'),t('recoveryControls'),t('consequences')],vals=[p.threats.length,countP,countR,p.consequences.length],fills=[palette.orange,palette.teal,palette.blue,palette.purple];for(let i=0;i<4;i++)pdfMetric(ctx,90+i*495,225,475,labels[i],vals[i],fills[i]);
    const x=[90,465,860,1305,1670];const ys=[475,677,879,1081];
    [t('threats'),t('preventive'),t('centralEvent'),t('recovery'),t('consequences')].forEach((label,i)=>wrapped(ctx,label,x[i],375,i===2?380:330,22,palette.muted,800,1.3,2));
    // Connector paths under the diagram cards.
    const yc=943;ctx.lineWidth=3;ctx.lineCap='round';
    function link(x1,y1,x2,y2,color){ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
    function pdfBus(items,busX,fromX,toX,eventX,color){
      if(!items.length)return;
      const centers=ys.slice(0,Math.min(4,items.length)).map(y=>y+78);
      link(busX,Math.min(yc,...centers),busX,Math.max(yc,...centers),color);
      link(busX,yc,eventX,yc,color);
      centers.forEach(y=>{link(fromX,y,toX,y,color);link(toX,y,busX,y,color);});
    }
    pdfBus(p.threats,817,430,795,838,'#95c8b8');
    // Recovery flows left-to-right: event -> recovery barriers -> consequence.
    if(p.consequences.length){
      const centers=ys.slice(0,Math.min(4,p.consequences.length)).map(y=>y+78);
      link(1284,Math.min(yc,...centers),1284,Math.max(yc,...centers),'#a3c4e1');
      link(1263,yc,1284,yc,'#a3c4e1');
      centers.forEach(y=>{link(1284,y,1305,y,'#a3c4e1');link(1635,y,1670,y,'#a3c4e1');});
    }
    p.threats.slice(0,4).forEach((path,i)=>{pdfPathCard(ctx,path,x[0],ys[i],palette.orange,palette.orangeDark,i,'threat');pdfBarriersCard(ctx,path,x[1],ys[i],palette.teal,palette.tealDark);});
    p.consequences.slice(0,4).forEach((path,i)=>{pdfBarriersCard(ctx,path,x[3],ys[i],palette.blue,palette.blueDark);pdfPathCard(ctx,path,x[4],ys[i],palette.purple,palette.purpleDark,i,'consequence');});
    pdfCard(ctx,838,585,425,161,palette.hazard,t('hazard').toUpperCase()+' · '+numberOf(p.hazard),p.hazard.title||t('clickDefineHazard'),'#a58247');
    ctx.strokeStyle='#cbb48d';ctx.lineWidth=3;ctx.setLineDash([8,10]);ctx.beginPath();ctx.moveTo(1050,747);ctx.lineTo(1050,841);ctx.stroke();ctx.setLineDash([]);
    pdfCard(ctx,838,841,425,205,palette.event,t('topEvent').toUpperCase()+' · '+numberOf(p.topEvent),p.topEvent.title||t('clickDefineEvent'),'#b36e63');
    if(p.threats.length>4||p.consequences.length>4)wrapped(ctx,t('pdfAdditional'),110,1336,1600,20,palette.muted,500,1.2,1);
    return canvas;
  }
  function pdfDetailPage(p,path,kind,index,chunk,chunkIndex,totalChunks,pageNo){const c=newCanvas(),ctx=c.getContext('2d');const left=kind==='threat';const accent=left?palette.tealDark:palette.blueDark,light=left?palette.teal:palette.blue;
    pageBase(ctx,left?t('pdfThreatDetail'):t('pdfConsequenceDetail'),p.title,pageNo);
    rrect(ctx,90,235,1920,180,17,'#fff',palette.line);rrect(ctx,118,262,280,44,10,light);txt(ctx,(left?t('threat'):t('consequence')).toUpperCase()+' · '+numberOf(path),134,270,18,accent,800);
    wrapped(ctx,path.title,125,325,710,31,palette.ink,800,1.2,2);
    txt(ctx,t('description'),900,265,18,palette.muted,800);wrapped(ctx,path.description||t('pdfNoDesc'),900,306,1045,23,palette.ink,500,1.35,3);
    txt(ctx,t('pdfControls').toUpperCase()+` (${path.barriers.length})`,99,447,22,accent,800);
    if(!chunk.length){rrect(ctx,90,494,1920,180,15,'#fff',palette.line);txt(ctx,t('pdfNoControl'),132,553,29,palette.muted,500);}
    chunk.forEach((b,j)=>{const y=494+j*207;rrect(ctx,90,y,1920,188,14,'#fff',palette.line);rrect(ctx,112,y+24,14,136,7,light);
      wrapped(ctx,numberLabel(b)+b.title,146,y+24,1110,26,palette.ink,800,1.22,1);
      const status=statusLabel(b.status);rrect(ctx,1680,y+23,296,45,10,b.status==='effective'?'#e8f6ee':b.status==='needs-review'?'#fff1e0':'#f0f2f4');wrapped(ctx,status,1698,y+33,257,20,b.status==='effective'?'#298365':b.status==='needs-review'?'#a97631':'#7f8d9e',700,1.25,1);
      txt(ctx,t('owner')+': '+(b.owner||'—'),146,y+77,19,palette.muted,600);
      wrapped(ctx,b.description||'—',146,y+111,825,19,palette.ink,500,1.25,2);
      const ef=b.escalationFactors||[],ec=ef.reduce((n,f)=>n+f.controls.length,0);
      txt(ctx,`${t('escalationFactors')}: ${ef.length}`,1030,y+80,20,'#a47c4b',800);
      wrapped(ctx,ef.map(f=>numberLabel(f)+f.title).join('  •  ')||'—',1030,y+108,820,18,palette.ink,500,1.25,2);
      txt(ctx,`${t('escalationControls')}: ${ec}`,1030,y+155,17,'#8373a5',800);
    });
    if(totalChunks>1)txt(ctx,`${chunkIndex+1} / ${totalChunks}`,90,1340,19,palette.muted,600);
    return c;
  }
  function pdfEscalationPage(p,path,barrier,kind,index,barrierIndex,rows,pageNo,part,total){
    const c=newCanvas(),ctx=c.getContext('2d'),left=kind==='threat';
    pageBase(ctx,t('pdfEscalationDetail'),p.title,pageNo);
    rrect(ctx,90,232,1920,206,16,'#ffffff',palette.line);
    rrect(ctx,116,259,18,150,8,left?palette.teal:palette.blue);
    txt(ctx,(left?t('preventiveControl'):t('recoveryControl')).toUpperCase()+' · '+numberOf(barrier),156,263,21,left?palette.tealDark:palette.blueDark,800);
    wrapped(ctx,barrier.title,156,302,1220,33,palette.ink,800,1.27,2);
    txt(ctx,t('pdfStatus')+': '+statusLabel(barrier.status),156,390,19,palette.muted,600);
    wrapped(ctx,`${t('pdfPath')}: ${numberLabel(path)}${path.title}`,1480,277,465,20,palette.muted,600,1.3,3);
    wrapped(ctx,(barrier.description||'—'),1480,367,460,19,palette.ink,500,1.25,3);
    const cardStarts=[508,907];
    rows.forEach((row,j)=>{
      const y=cardStarts[j],f=row.factor,controls=row.controls;
      rrect(ctx,90,y,1920,350,16,'#fff',palette.line);
      // Vertical escalation hierarchy: orange factor above purple factor controls.
      txt(ctx,`${t('pdfEscalationFactor')} · ${numberOf(f)}`,125,y+18,21,'#a97943',800);
      rrect(ctx,125,y+57,1850,107,13,'#fff4e8','#ebdbbe');
      wrapped(ctx,f.title,153,y+77,1110,25,'#775834',800,1.25,2);
      wrapped(ctx,f.description||'',1280,y+77,655,18,'#99876e',500,1.24,3);
      txt(ctx,t('pdfEscalationControl')+(controls.length>1?'S':''),125,y+170,19,'#8571a5',800);
      if(!controls.length){
        rrect(ctx,125,y+205,1850,115,13,'#faf9fc','#e6e1ee');
        wrapped(ctx,t('noEscalationControls'),161,y+241,1700,22,palette.muted,600,1.25,2);
      }
      controls.forEach((co,i)=>{
        const n=controls.length,x=125+i*(1850/n+12/n),w=1850/n-12*(n-1)/n;
        ctx.strokeStyle='#af97c8';ctx.lineWidth=3;ctx.setLineDash([7,7]);
        ctx.beginPath();ctx.moveTo(x+w/2,y+164);ctx.lineTo(x+w/2,y+205);ctx.stroke();ctx.setLineDash([]);
        rrect(ctx,x,y+205,w,115,12,'#f4f0fb','#e6dcef');
        wrapped(ctx,numberLabel(co)+co.title,x+21,y+217,w-44,21,'#6f5a8e',800,1.25,2);
        wrapped(ctx,t('pdfStatus')+': '+statusLabel(co.status),x+21,y+270,w-40,16,palette.muted,700,1.2,1);
        wrapped(ctx,co.owner?(t('owner')+': '+co.owner):co.description||'',x+21,y+295,w-40,15,palette.ink,500,1.2,1);
      });
    });
    if(total>1)txt(ctx,`${part+1} / ${total}`,1650,1345,20,palette.muted,600);
    return c;
  }
  function pdfRiskPages(p,offset){
    const pages=[],bands=p.riskBands||defaultBands(),perPage=8;
    const paths=p.consequences;
    const groups=paths.length?Array.from({length:Math.ceil(paths.length/perPage)},(_,i)=>paths.slice(i*perPage,(i+1)*perPage)):[[]];
    groups.forEach((group,index)=>{
      const c=newCanvas(),ctx=c.getContext('2d');
      pageBase(ctx,t('riskPDF'),p.title,offset+pages.length+1);
      rrect(ctx,90,238,965,995,18,'#ffffff',palette.line);
      txt(ctx,t('riskMatrixTitle'),125,267,27,palette.ink,800);
      wrapped(ctx,t('riskMatrixFormula'),125,312,860,21,palette.muted,500,1.2,1);
      const unit=132,left=202,top=409;
      // Higher likelihood appears at the top, higher severity to the right.
      for(let l=5;l>=1;l--){const y=top+(5-l)*unit;
        txt(ctx,String(l),157,y+40,23,palette.muted,800);
        for(let s=1;s<=5;s++){
          const x=left+(s-1)*unit,index=`${l}${ICAO_SEVERITIES[s-1]}`,band=riskBand(index);
          const fills={low:'#dbf4e9',medium:'#fff2c9',high:'#ffe0ba',extreme:'#f9d4d9'};
          const colors={low:'#237655',medium:'#8a6c1d',high:'#9f5721',extreme:'#9b303d'};
          rrect(ctx,x,y,unit-7,unit-7,11,fills[band]);txt(ctx,index,x+34,y+40,31,colors[band],800);
        }
      }
      for(let s=1;s<=5;s++)txt(ctx,ICAO_SEVERITIES[s-1],left+(s-1)*unit+48,top-44,22,palette.muted,800);
      txt(ctx,t('riskLikelihood'),130,1115,23,palette.muted,700);
      txt(ctx,t('riskSeverityAxis'),510,1115,23,palette.muted,700);
      rrect(ctx,1080,238,930,995,18,'#ffffff',palette.line);
      txt(ctx,t('riskRegister'),1114,270,28,palette.ink,800);
      txt(ctx,t('consequence'),1116,329,19,palette.muted,700);
      txt(ctx,t('riskInitial'),1650,329,17,palette.muted,700);
      txt(ctx,t('riskResidual'),1830,329,17,palette.muted,700);
      const drawRating=(rating,x,y)=>{const score=riskScore(rating),band=riskBand(score,bands);const fills={low:'#dff3e8',medium:'#fff1cb',high:'#ffe3c9',extreme:'#f9d8df',unassessed:'#eef2f5'};const colors={low:'#227756',medium:'#977324',high:'#9b5a24',extreme:'#a53c49',unassessed:'#7e8b98'};rrect(ctx,x,y,152,49,9,fills[band]);txt(ctx,score===null?'—':`${score}  ${riskLabel(band)}`,x+9,y+12,score===null?22:17,colors[band],750);};
      if(!group.length)wrapped(ctx,t('riskNoConsequences'),1120,429,800,24,palette.muted,600,1.3,3);
      group.forEach((path,i)=>{
        const y=370+i*101;
        if(i%2===0)rrect(ctx,1105,y,875,97,10,'#f7fafb');
        wrapped(ctx,numberLabel(path)+path.title,1118,y+9,500,23,palette.ink,700,1.2,2);
        drawRating(path.risk?.initial,1648,y+19);drawRating(path.risk?.residual,1826,y+19);
        if(path.risk?.rationale)wrapped(ctx,path.risk.rationale,1118,y+63,496,14,palette.muted,500,1.05,1);
      });
      wrapped(ctx,`${t('riskIntolerable')}  /  ${t('riskTolerable')}  /  ${t('riskAcceptable')}   ·   ${t('riskIndexNote')}`,110,1272,1840,20,palette.ink,700,1.25,2);
      wrapped(ctx,t('riskPDFHint'),110,1325,1820,17,palette.muted,500,1.25,2);
      pages.push(c);
    });
    return pages;
  }
  function allReportPages(){
    const p=activeProject();numberIndex=buildNumberIndex(p);const pages=[pdfOverviewPage(p,1)];
    pages.push(...pdfRiskPages(p,pages.length));
    for(const kind of ['threat','consequence']){
      const paths=kind==='threat'?p.threats:p.consequences;
      paths.forEach((path,index)=>{
        const chunks=[];for(let i=0;i<path.barriers.length;i+=4)chunks.push(path.barriers.slice(i,i+4));if(!chunks.length)chunks.push([]);
        chunks.forEach((chunk,ci)=>pages.push(pdfDetailPage(p,path,kind,index,chunk,ci,chunks.length,pages.length+1)));
        path.barriers.forEach((barrier,barrierIndex)=>{
          const rows=[];
          (barrier.escalationFactors||[]).forEach((factor,factorNumber)=>{
            if(!factor.controls.length)rows.push({factor,factorNumber,controls:[]});
            else for(let i=0;i<factor.controls.length;i+=3)rows.push({factor,factorNumber,controls:factor.controls.slice(i,i+3)});
          });
          if(!rows.length)return;
          const num=Math.ceil(rows.length/2);
          for(let k=0;k<num;k++)pages.push(pdfEscalationPage(p,path,barrier,kind,index,barrierIndex,rows.slice(k*2,k*2+2),pages.length+1,k,num));
        });
      });
    }
    return pages;
  }
  function encodePdf(canvases){const te=new TextEncoder();const parts=[];const offsets=[0];let length=0;
    function append(value){const bytes=typeof value==='string'?te.encode(value):value;parts.push(bytes);length+=bytes.byteLength;}
    function startObject(id){offsets[id]=length;append(`${id} 0 obj\n`);}
    const count=canvases.length;append('%PDF-1.4\n%\xC2\xB5\xC2\xB5\n');
    startObject(1);append('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    startObject(2);append(`<< /Type /Pages /Count ${count} /Kids [${canvases.map((_,i)=>`${3+3*i} 0 R`).join(' ')}] >>\nendobj\n`);
    canvases.forEach((c,i)=>{
      const pg=3+3*i,im=pg+1,ct=pg+2;
      startObject(pg);append(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 1190.55 841.89] /Resources << /ProcSet [/PDF /ImageC] /XObject << /Im1 ${im} 0 R >> >> /Contents ${ct} 0 R >>\nendobj\n`);
      const b64=c.toDataURL('image/jpeg',.89).split(',')[1];const data=atob(b64);const bytes=new Uint8Array(data.length);for(let j=0;j<data.length;j++)bytes[j]=data.charCodeAt(j);
      startObject(im);append(`<< /Type /XObject /Subtype /Image /Width ${c.width} /Height ${c.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.byteLength} >>\nstream\n`);append(bytes);append('\nendstream\nendobj\n');
      const content='q\n1190.55 0 0 841.89 0 0 cm\n/Im1 Do\nQ\n';startObject(ct);append(`<< /Length ${te.encode(content).byteLength} >>\nstream\n`);append(content);append('endstream\nendobj\n');
    });
    const startXref=length;const objectCount=2+3*count;append(`xref\n0 ${objectCount+1}\n0000000000 65535 f \n`);
    for(let i=1;i<=objectCount;i++)append(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);
    append(`trailer\n<< /Size ${objectCount+1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`);
    return new Blob(parts,{type:'application/pdf'});
  }
  async function exportPdf(){const button=$('exportPdfButton');if(button.disabled)return;button.disabled=true;try{await document.fonts?.ready;const pages=allReportPages();const pdf=encodePdf(pages);downloadBlob(pdf,slug(activeProject().title)+'-Bowtie-Together-Report.pdf');toast(t('exported'));}catch(error){console.error('PDF export error:',error);toast(t('pdfFail'));}finally{button.disabled=false;}}

  Object.assign(dict.en,{projectHint:'Private analyses stay in your browser; shared analyses synchronise through your room server.',yourDataStaysHere:'Local & shared analyses',offlineFirst:'Collaboration workspace',privacyDescription:'Private analyses stay on this device; live rooms are saved on the server.',offlinePrivate:'Private projects stay on-device · Shared rooms sync through the server'});
  Object.assign(dict.th,{projectHint:'งานส่วนตัวอยู่ในเบราว์เซอร์ ห้องร่วมงานซิงก์กับเซิร์ฟเวอร์',yourDataStaysHere:'งานส่วนตัวและงานร่วมกัน',offlineFirst:'พื้นที่ทำงานร่วมกัน',privacyDescription:'งานส่วนตัวอยู่บนอุปกรณ์ ห้องทำงานร่วมกันบันทึกบนเซิร์ฟเวอร์',offlinePrivate:'งานส่วนตัวอยู่บนเครื่อง · ห้องร่วมงานซิงก์กับเซิร์ฟเวอร์'});
  window.bowtieCollab=window.BowtieTogether({
    lang:()=>lang,
    getProject:()=>activeProject(),
    saveLocal:()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{}},
    replaceProject:p=>{const idx=state.projects.findIndex(x=>x.id===p.id);if(idx>=0)state.projects[idx]=normalizeProject(p);},
    upsertProject:p=>{const normalized=normalizeProject(p);const idx=state.projects.findIndex(x=>x.id===normalized.id);if(idx>=0)state.projects[idx]=normalized;else state.projects.push(normalized);state.activeId=normalized.id;try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{}},
    render:()=>render()
  });
  installEvents();applyTheme();updateSidebarUI();persist();render();window.bowtieCollab.init();
})();
