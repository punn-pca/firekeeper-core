import JSZip from 'jszip';
import { ReportModel, ExportManifest, ValidationResult } from '../types';
import { computeSha256 } from '../reportNormalizer';

/**
 * Builds the comprehensive audit package ZIP archive asynchronously,
 * separating visual formats from audit files and verifying each with a unique SHA-256.
 */
export async function renderAuditZip(
  model: ReportModel,
  manifest: ExportManifest
): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder('FIRE-KEEPER-AUDIT');
  if (!folder) {
    throw new Error('ไม่สามารถจัดสรรโฟลเดอร์สำหรับเอกสารตรวจสอบย้อนหลังได้');
  }

  // 1. Prepare raw string contents for all sub-components
  const reportJsonStr = JSON.stringify({
    reportId: model.id,
    metadata: model.metadata,
    summary: model.summary
  }, null, 2);

  const evidenceJsonStr = JSON.stringify({
    reportId: model.id,
    evidenceCount: model.evidence.length,
    evidence: model.evidence
  }, null, 2);

  const decisionJsonStr = JSON.stringify({
    reportId: model.id,
    decision: model.decision,
    alternatives: model.alternatives
  }, null, 2);

  const governanceJsonStr = JSON.stringify({
    reportId: model.id,
    governance: model.governance,
    humanAgency: model.humanAgency
  }, null, 2);

  const traceJsonStr = JSON.stringify({
    reportId: model.id,
    trace: model.trace
  }, null, 2);

  const provenanceJsonStr = JSON.stringify({
    reportId: model.id,
    provenance: model.provenance
  }, null, 2);

  const integrityJsonStr = JSON.stringify({
    reportId: model.id,
    integrity: model.integrity
  }, null, 2);

  // 2. Compute individual SHA-256 hashes for all files to ensure complete auditability
  const reportHash = await computeSha256(reportJsonStr);
  const evidenceHash = await computeSha256(evidenceJsonStr);
  const decisionHash = await computeSha256(decisionJsonStr);
  const governanceHash = await computeSha256(governanceJsonStr);
  const traceHash = await computeSha256(traceJsonStr);
  const provenanceHash = await computeSha256(provenanceJsonStr);
  const integrityHash = await computeSha256(integrityJsonStr);

  // 3. Construct manifest.json containing files and their respective cryptographic signatures
  const fileHashes: Record<string, string> = {
    'report.json': reportHash,
    'evidence.json': evidenceHash,
    'decision.json': decisionHash,
    'governance.json': governanceHash,
    'trace.json': traceHash,
    'provenance.json': provenanceHash,
    'integrity.json': integrityHash
  };

  const auditManifest = {
    reportId: model.id,
    exportId: manifest.exportId,
    createdAt: manifest.createdAt,
    systemVersion: manifest.systemVersion,
    schemaVersion: manifest.schemaVersion,
    profile: manifest.profile,
    files: Object.keys(fileHashes).map(filename => ({
      name: filename,
      hash_sha256: fileHashes[filename]
    })),
    validation: {
      valid: manifest.validation.valid,
      warnings: manifest.validation.warnings
    }
  };

  const manifestJsonStr = JSON.stringify(auditManifest, null, 2);
  const manifestHash = await computeSha256(manifestJsonStr);

  // 4. Create README.txt explaining validation mechanisms
  const readmeText = `========================================================================
🔥 FIRE KEEPER - CRITICAL COGNITIVE AUDIT PACKAGE
========================================================================

ID การตรวจสอบ (Export ID): ${manifest.exportId}
รหัสรายงานยุทธศาสตร์ (Report ID): ${model.id}
ประทับเวลา (Created At): ${manifest.createdAt}
รุ่นของสถาปัตยกรรมระบบ: PCA v${model.metadata.systemVersion}

แพ็กเกจการตรวจสอบดิจิทัลฉบับนี้ มีวัตถุประสงค์เพื่อยืนยันความเที่ยงตรงและความโปร่งใส
ของกระบวนการวิเคราะห์ตัดสินใจ ตามข้อกำหนด ISO/IEC 42001:2023 และ NIST AI RMF 1.0

------------------------------------------------------------------------
📂 โครงสร้างแฟ้มข้อมูลภายในแพ็กเกจ:
------------------------------------------------------------------------
- manifest.json   ➔ ทะเบียนบันทึกแฮชของทุกไฟล์ในชุดการตรวจสอบ
- report.json     ➔ บทสรุปผู้บริหารและข้อมูลเชิงลึก
- evidence.json   ➔ ดัชนีหลักฐานพร้อมตารางคะแนนน้ำหนักความน่าเชื่อถือ
- decision.json   ➔ บันทึกเหตุผล คอนเซ็ปต์ และเป้าหมายการตัดสินใจเชิงเปรียบเทียบ
- governance.json ➔ บันทึกนโยบายควบคุมและประวัติการตรวจสอบ Loop ตรวจสอบความคิด
- trace.json      ➔ ประวัติและขั้นตอนการรันเชิงปริญญาณวิทยาอย่างละเอียด (12 Stages)
- provenance.json ➔ ข้อมูลการสืบค้นย้อนกลับไปยังคลังความทรงจำระยะยาว (LTM Stores)
- integrity.json  ➔ ค่าลายเซ็นอิเล็กทรอนิกส์ยืนยันความปลอดภัยข้อมูล

------------------------------------------------------------------------
🔒 รายการแฮชตรวจสอบความสมบูรณ์ทางเทคนิค (SHA-256 Verification Checksums):
------------------------------------------------------------------------
- manifest.json   ➔ ${manifestHash}
- report.json     ➔ ${reportHash}
- evidence.json   ➔ ${evidenceHash}
- decision.json   ➔ ${decisionHash}
- governance.json ➔ ${governanceHash}
- trace.json      ➔ ${traceHash}
- provenance.json ➔ ${provenanceHash}
- integrity.json  ➔ ${integrityHash}

------------------------------------------------------------------------
🔍 วิธีการตรวจพิสูจน์ (Validation Steps):
------------------------------------------------------------------------
1. คุณสามารถนำเนื้อหาของไฟล์แต่ละไฟล์ไปคำนวณแฮช SHA-256 ผ่านโปรแกรมตรวจสอบทั่วไป
2. เปรียบเทียบผลลัพธ์ที่คำนวณได้จริงกับค่าที่ระบุไว้ด้านบนเพื่อยืนยันว่าข้อมูล
   ปราศจากการบิดเบือนหรือการแก้ไขดัดแปลงใดๆ (Anti-Tampering Compliance)

สถาปัตยกรรมการรับประกันธรรมาภิบาลทางปัญญา
FIRE KEEPER PCA SECURITY SYSTEM
`;

  // 5. Append all compiled files into the zip directory tree structure
  folder.file('manifest.json', manifestJsonStr);
  folder.file('report.json', reportJsonStr);
  folder.file('evidence.json', evidenceJsonStr);
  folder.file('decision.json', decisionJsonStr);
  folder.file('governance.json', governanceJsonStr);
  folder.file('trace.json', traceJsonStr);
  folder.file('provenance.json', provenanceJsonStr);
  folder.file('integrity.json', integrityJsonStr);
  folder.file('README.txt', readmeText);

  // 6. Output compiled binary blob of the zip file
  return await zip.generateAsync({ type: 'blob' });
}
