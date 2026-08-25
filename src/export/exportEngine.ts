import { ConversationTurn, MemoryItem, PCAState } from '../types';
import { ReportModel, ExportProfile, ExportFormat, ExportResult, ValidationResult, ExportManifest } from './types';
import { normalizeReport, computeSha256 } from './reportNormalizer';
import { validateReportModel } from './reportValidator';
import { generateExportFilename } from './filename';
import { createExportManifest } from './manifest';
import { renderHtmlReport } from './renderers/htmlRenderer';
import { renderJsonReport } from './renderers/jsonRenderer';
import { renderCsvReport } from './renderers/csvRenderer';
import { renderAuditZip } from './renderers/auditRenderer';

/**
 * High-performance, single-model Export Engine.
 * It strictly coordinates Normalization -> Validation -> Rendering -> Packaging.
 */
export async function executeExport(
  history: ConversationTurn[],
  pcaState: PCAState | null,
  memories: MemoryItem[],
  profile: ExportProfile,
  format: ExportFormat,
  options?: {
    title?: string;
    pdfTheme?: 'light' | 'dark';
  }
): Promise<ExportResult> {
  // --- STAGE 1: NORMALIZATION ---
  const model = await normalizeReport(history, pcaState, memories, options?.title);

  // --- STAGE 2: VALIDATION ---
  const validation: ValidationResult = validateReportModel(model);
  if (!validation.valid) {
    const criticalMessages = validation.errors.map(err => `[${err.field}]: ${err.message}`).join(', ');
    throw new Error(`การตรวจสอบโมเดลล้มเหลว (Critical Validation Failed): ${criticalMessages}`);
  }

  // --- STAGE 3: HASHING ---
  const serializedModel = JSON.stringify(model);
  const contentHash = await computeSha256(serializedModel);

  // --- STAGE 4: FILENAME GENERATION ---
  const filename = generateExportFilename(model, profile, format);

  // Prepare standard file list for manifest record
  const fileList = [filename];
  if (format === 'zip') {
    fileList.push('manifest.json', 'report.json', 'evidence.json', 'decision.json', 'governance.json', 'trace.json', 'provenance.json', 'integrity.json', 'README.txt');
  }

  // --- STAGE 5: MANIFEST CREATION ---
  const manifest = createExportManifest(model, validation, profile, format, contentHash, fileList);

  // --- STAGE 6: RENDERING ---
  let fileContent: any;
  try {
    switch (format) {
      case 'json':
        fileContent = renderJsonReport(model);
        break;

      case 'html':
        fileContent = renderHtmlReport(model, profile, options?.pdfTheme || 'dark');
        break;

      case 'csv':
        fileContent = renderCsvReport(model);
        break;

      case 'zip':
        // Wait for JSZip binary assembly with verified individual file checksum hashes
        fileContent = await renderAuditZip(model, manifest);
        break;

      default:
        throw new Error(`รูปแบบไฟล์ '${format}' ไม่ได้รับการสนับสนุนจากระบบ`);
    }
  } catch (renderError: any) {
    throw new Error(`เกิดข้อผิดพลาดในการประมวลผลเรนเดอร์ไฟล์ (${format.toUpperCase()} Renderer Error): ${renderError.message}`);
  }

  return {
    manifest,
    filename,
    fileContent
  };
}
