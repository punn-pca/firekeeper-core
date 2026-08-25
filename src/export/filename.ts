import { ReportModel, ExportProfile, ExportFormat } from './types';

/**
 * Deterministically generates a filename according to the standard pattern:
 * FIREKEEPER_<PROFILE_UPPER>_<REPORT_ID>_<YYYYMMDD_HHmmss>.<EXT>
 */
export function generateExportFilename(
  model: ReportModel,
  profile: ExportProfile,
  format: ExportFormat
): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const timestamp = `${datePart}_${timePart}`;

  const profileName = profile.toUpperCase();
  // Safe report ID (removing spaces or slashes)
  const safeReportId = model.id.replace(/[^a-zA-Z0-9_-]/g, '');

  let ext = format === 'zip' ? 'zip' : format === 'json' ? 'json' : format === 'html' ? 'html' : format === 'csv' ? 'csv' : 'txt';

  return `FIREKEEPER_${profileName}_${safeReportId}_${timestamp}.${ext}`;
}
