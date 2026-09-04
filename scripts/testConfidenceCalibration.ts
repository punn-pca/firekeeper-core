import { calculateStrictCalibratedConfidence } from '../src/server/services/evidenceGovernance';
import type { EvidenceItem } from '../src/types';

function runTests() {
  console.log('================================================================');
  console.log('       CONFIDENCE CALIBRATION AUDIT & TEST VERIFICATION         ');
  console.log('================================================================\n');

  let allPassed = true;

  // -------------------------------------------------------------
  // Test Case 1: ไม่มี evidence (No evidence at all)
  // -------------------------------------------------------------
  console.log('--- TEST CASE 1: ไม่มี evidence ---');
  const res1 = calculateStrictCalibratedConfidence('คำถามทั่วไปที่ไม่มีหลักฐาน', 0, [], [], [], []);
  console.log('Result 1:', {
    scorePercent: res1.scorePercent,
    label: res1.label,
    evidenceQuality: res1.evidenceQuality,
    sourceReliability: res1.sourceReliability,
    evidenceCompleteness: res1.evidenceCompleteness,
    calibrationStatus: res1.calibrationStatus,
    isDeterminable: res1.isDeterminable
  });
  const pass1 =
    res1.scorePercent === null &&
    res1.evidenceQuality === null &&
    res1.sourceReliability === null &&
    res1.evidenceCompleteness === null &&
    res1.label === 'ไม่สามารถประเมินได้' &&
    res1.calibrationStatus === 'NOT_VERIFIED' &&
    !res1.isDeterminable;
  console.log(`Test Case 1 Passed: ${pass1 ? '✅ YES' : '❌ NO'}\n`);
  if (!pass1) allPassed = false;

  // -------------------------------------------------------------
  // Test Case 2: evidence มีแต่ source reliability ไม่มี
  // -------------------------------------------------------------
  console.log('--- TEST CASE 2: evidence มีแต่ source reliability ไม่มี ---');
  const evidenceNoCred: EvidenceItem[] = [
    {
      id: 'ev-1',
      source: 'Market_Doc',
      type: 'Empirical',
      content: 'ตลาดมีแนวโน้มเติบโต 15% ต่อปีในภูมิภาคเอเชียตะวันออกเฉียงใต้',
      strength: 'Medium',
      // credibilityScore is deliberately omitted / undefined!
    } as any
  ];
  const res2 = calculateStrictCalibratedConfidence('แนวโน้มตลาดเป็นอย่างไร', 1, [], [], [], evidenceNoCred);
  console.log('Result 2:', {
    scorePercent: res2.scorePercent,
    label: res2.label,
    evidenceQuality: res2.evidenceQuality,
    sourceReliability: res2.sourceReliability,
    evidenceCompleteness: res2.evidenceCompleteness,
    calibrationStatus: res2.calibrationStatus
  });
  const pass2 =
    res2.sourceReliability === null &&
    res2.evidenceQuality !== null &&
    res2.calibrationStatus === 'NOT_VERIFIED' &&
    res2.label !== 'สูง' && // Cannot be high
    res2.scorePercent !== null;
  console.log(`Test Case 2 Passed: ${pass2 ? '✅ YES' : '❌ NO'}\n`);
  if (!pass2) allPassed = false;

  // -------------------------------------------------------------
  // Test Case 3: evidence + reliability ครบ
  // -------------------------------------------------------------
  console.log('--- TEST CASE 3: evidence + reliability ครบ ---');
  const fullEvidence: EvidenceItem[] = [
    {
      id: 'ev-emp-1',
      source: 'attachment',
      type: 'Empirical',
      content: 'ยอดขายจริงไตรมาส 4 อยู่ที่ 45.2 ล้านบาท เติบโต 18.5% YoY',
      strength: 'High',
      credibilityScore: 0.95,
      locator: 'หน้า 12 ตารางที่ 4',
      citationQuote: 'ยอดขายจริงไตรมาส 4 อยู่ที่ 45.2 ล้านบาท เติบโต 18.5% YoY',
      sourceUrl: 'https://internal-audit.example.com/report-q4.pdf'
    },
    {
      id: 'ev-emp-2',
      source: 'research_institute',
      type: 'Empirical',
      content: 'ดัชนีความเชื่อมั่นผู้บริโภคขยายตัวต่อเนื่องเป็นเดือนที่ 5',
      strength: 'High',
      credibilityScore: 0.92,
      locator: 'หัวข้อ 3.1',
      citationQuote: 'ดัชนีความเชื่อมั่นผู้บริโภคขยายตัวต่อเนื่องเป็นเดือนที่ 5',
      sourceUrl: 'https://research.example.com/cci-index'
    }
  ];
  const res3 = calculateStrictCalibratedConfidence('สรุปผลประกอบการและทิศทางธุรกิจ', 2, [], [], [], fullEvidence);
  console.log('Result 3:', {
    scorePercent: res3.scorePercent,
    label: res3.label,
    evidenceQuality: res3.evidenceQuality,
    sourceReliability: res3.sourceReliability,
    evidenceCompleteness: res3.evidenceCompleteness,
    conflictPenalty: res3.conflictPenalty,
    missingInfoPenalty: res3.missingInfoPenalty,
    calibrationStatus: res3.calibrationStatus,
    formula: res3.formula
  });
  const pass3 =
    res3.scorePercent !== null &&
    res3.scorePercent >= 75 &&
    res3.label === 'สูง' &&
    res3.calibrationStatus === 'EMPIRICAL_VERIFIED' &&
    res3.evidenceQuality !== null &&
    res3.sourceReliability !== null;
  console.log(`Test Case 3 Passed: ${pass3 ? '✅ YES' : '❌ NO'}\n`);
  if (!pass3) allPassed = false;

  // -------------------------------------------------------------
  // Test Case 4: มี conflict
  // -------------------------------------------------------------
  console.log('--- TEST CASE 4: มี conflict ---');
  const conflicts = ['ตัวเลขยอดขายในรายงานขัดแย้งกับสถิติกระแสเงินสดในธนาคาร'];
  const res4 = calculateStrictCalibratedConfidence('สรุปผลประกอบการและทิศทางธุรกิจ', 2, [], [], conflicts, fullEvidence);
  console.log('Result 4:', {
    scorePercent: res4.scorePercent,
    label: res4.label,
    conflictPenalty: res4.conflictPenalty,
    calibrationStatus: res4.calibrationStatus,
    scoreDiffWithCase3: (res3.scorePercent || 0) - (res4.scorePercent || 0)
  });
  const pass4 =
    res4.conflictPenalty === 0.15 &&
    res4.calibrationStatus === 'NOT_VERIFIED' &&
    (res4.scorePercent || 0) < (res3.scorePercent || 0) &&
    res4.label !== 'สูง';
  console.log(`Test Case 4 Passed: ${pass4 ? '✅ YES' : '❌ NO'}\n`);
  if (!pass4) allPassed = false;

  // -------------------------------------------------------------
  // Test Case 5: มี missing information
  // -------------------------------------------------------------
  console.log('--- TEST CASE 5: มี missing information ---');
  const missing = ['ไม่พบข้อมูลต้นทุนสินค้า (COGS)', 'ไม่พบประมาณการค่าใช้จ่ายในการดำเนินงาน'];
  const res5 = calculateStrictCalibratedConfidence('สรุปผลประกอบการและทิศทางธุรกิจ', 2, [], missing, [], fullEvidence);
  console.log('Result 5:', {
    scorePercent: res5.scorePercent,
    label: res5.label,
    missingInfoPenalty: res5.missingInfoPenalty,
    evidenceCompleteness: res5.evidenceCompleteness,
    calibrationStatus: res5.calibrationStatus,
    scoreDiffWithCase3: (res3.scorePercent || 0) - (res5.scorePercent || 0)
  });
  const pass5 =
    res5.missingInfoPenalty === 0.20 &&
    res5.calibrationStatus === 'NOT_VERIFIED' &&
    (res5.evidenceCompleteness || 0) < (res3.evidenceCompleteness || 0) &&
    (res5.scorePercent || 0) < (res3.scorePercent || 0);
  console.log(`Test Case 5 Passed: ${pass5 ? '✅ YES' : '❌ NO'}\n`);
  if (!pass5) allPassed = false;

  // -------------------------------------------------------------
  // Test Case 6: calibrationStatus = NOT_VERIFIED
  // -------------------------------------------------------------
  console.log('--- TEST CASE 6: calibrationStatus = NOT_VERIFIED (Label Invariant Rule) ---');
  const nonEmpiricalEvidence: EvidenceItem[] = [
    {
      id: 'ev-spec-1',
      source: 'Spec_Sheet',
      type: 'User Context',
      content: 'สเปกเครื่องจักรมาตรฐานอุตสาหกรรมรุ่นปี 2024',
      strength: 'Medium',
      credibilityScore: 0.82
    }
  ];
  const res6 = calculateStrictCalibratedConfidence('ควรเลือกเครื่องจักรตัวนี้หรือไม่', 1, [], [], [], nonEmpiricalEvidence);
  console.log('Result 6:', {
    scorePercent: res6.scorePercent,
    label: res6.label,
    calibrationStatus: res6.calibrationStatus
  });
  const pass6 =
    res6.calibrationStatus === 'NOT_VERIFIED' &&
    res6.label !== 'สูง'; // Rule: Invariant! Unverified calibration cannot show 'สูง'
  console.log(`Test Case 6 Passed: ${pass6 ? '✅ YES' : '❌ NO'}\n`);
  if (!pass6) allPassed = false;

  // -------------------------------------------------------------
  // Test Case 7: calibrationStatus = EMPIRICAL_VERIFIED
  // -------------------------------------------------------------
  console.log('--- TEST CASE 7: calibrationStatus = EMPIRICAL_VERIFIED ---');
  const res7 = calculateStrictCalibratedConfidence('ตรวจสอบสถานะทางสถิติ', 2, [], [], [], fullEvidence);
  console.log('Result 7:', {
    scorePercent: res7.scorePercent,
    label: res7.label,
    calibrationStatus: res7.calibrationStatus,
    evidenceQuality: res7.evidenceQuality,
    sourceReliability: res7.sourceReliability
  });
  const pass7 =
    res7.calibrationStatus === 'EMPIRICAL_VERIFIED' &&
    res7.label === 'สูง';
  console.log(`Test Case 7 Passed: ${pass7 ? '✅ YES' : '❌ NO'}\n`);
  if (!pass7) allPassed = false;

  // -------------------------------------------------------------
  // Detailed Mathematical Breakdown Example (Formula & Pre-rounding)
  // -------------------------------------------------------------
  console.log('================================================================');
  console.log('           MATHEMATICAL FORMULA & PRE-ROUNDING AUDIT             ');
  console.log('================================================================');
  const sampleEvidence: EvidenceItem[] = [
    {
      id: 'ev-audit-1',
      source: 'attachment',
      type: 'Empirical',
      content: 'ผลการดำเนินงานจริง',
      strength: 'High',
      credibilityScore: 0.94,
      locator: 'P.10',
      sourceUrl: 'https://audit.example.com'
    }
  ];
  // 1 missing signal (-0.10)
  const sampleMissing = ['รายละเอียดประมาณการภาษี'];
  const sampleRes = calculateStrictCalibratedConfidence('คำนวณสมการตัวอย่าง', 1, [], sampleMissing, [], sampleEvidence);
  
  const wComp = 0.40;
  const wRel = 0.35;
  const wQual = 0.25;
  const comp = sampleRes.evidenceCompleteness!;
  const rel = sampleRes.sourceReliability!;
  const qual = sampleRes.evidenceQuality!;
  const cPen = sampleRes.conflictPenalty;
  const mPen = sampleRes.missingInfoPenalty;
  const preRound = (wComp * comp + wRel * rel + wQual * qual) - cPen - mPen;
  const postRound = Math.round(preRound * 100);

  console.log(`Inputs:`);
  console.log(`  - Evidence Completeness : ${comp} (weight: ${wComp}) -> Contribution: ${(wComp * comp).toFixed(4)}`);
  console.log(`  - Source Reliability    : ${rel} (weight: ${wRel}) -> Contribution: ${(wRel * rel).toFixed(4)}`);
  console.log(`  - Evidence Quality      : ${qual} (weight: ${wQual}) -> Contribution: ${(wQual * qual).toFixed(4)}`);
  console.log(`  - Conflict Penalty      : -${cPen}`);
  console.log(`  - Missing Info Penalty  : -${mPen}`);
  console.log(`  - Pre-rounding Result   : ${preRound.toFixed(4)} (${(preRound * 100).toFixed(2)}%)`);
  console.log(`  - Final Rounded Score   : ${postRound}%`);
  console.log(`  - Formula String        : ${sampleRes.formula}`);
  console.log(`  - Calibration Status    : ${sampleRes.calibrationStatus}`);
  console.log(`  - Label                 : ${sampleRes.label}`);
  console.log('================================================================\n');

  if (allPassed) {
    console.log('🎉 ALL 7 TEST CASES PASSED PERFECTLY!');
  } else {
    console.error('❌ SOME TEST CASES FAILED!');
    process.exit(1);
  }
}

runTests();
