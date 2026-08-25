import { ReportModel, ExportManifest, ExportProfile, ExportFormat, ValidationResult } from './types';

/**
 * Creates an ExportManifest for a specific export transaction.
 */
export function createExportManifest(
  model: ReportModel,
  validation: ValidationResult,
  profile: ExportProfile,
  format: ExportFormat,
  contentHash: string,
  fileList: string[]
): ExportManifest {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  const exportId = `EXP-${dateStr}-${timeStr}-${randomSuffix}`;

  return {
    exportId,
    reportId: model.id,
    profile,
    format,
    createdAt: now.toISOString(),
    systemVersion: model.metadata.systemVersion,
    schemaVersion: '1.0',
    contentHash,
    files: fileList,
    validation: {
      valid: validation.valid,
      warnings: validation.warnings.map(w => `[${w.field}] ${w.message}`)
    }
  };
}
