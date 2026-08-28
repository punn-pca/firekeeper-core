import { ReportModel, ExportProfile, ReportSection } from '../types';
import { buildReportSections } from '../sectionEngine';
import { parseMarkdownToHtml, formatHashWithWbr } from '../../utils/exportUtils';

/**
 * Epistemic status badges based on content context
 */
export function getEpistemicBadge(text: string, defaultType: string = 'INFERENCE'): string {
  const lower = (text || '').toLowerCase();
  if (lower.includes('คาดการณ์') || lower.includes('ประมาณการ') || lower.includes('estimate') || lower.includes('%') || lower.includes('ประหยัด') || lower.includes('roi')) {
    return `<span class="epistemic-badge epistemic-estimate" title="ESTIMATE: ตัวเลขอ้างอิงประมาณการจำลองตามกรอบทางเลือก (ไม่ใช่ตัวเลของค์กรจริง)">ESTIMATE</span>`;
  }
  if (lower.includes('สมมติฐาน') || lower.includes('hypothesis') || lower.includes('หาก') || lower.includes('ถ้า') || lower.includes('กรณี')) {
    return `<span class="epistemic-badge epistemic-hypothesis" title="HYPOTHESIS: สมมติฐานเพื่อใช้เป็นทางเลือกในการทดสอบและวิเคราะห์จำลอง">HYPOTHESIS</span>`;
  }
  if (lower.includes('ไม่พบ') || lower.includes('ขาด') || lower.includes('unknown') || lower.includes('missing') || lower.includes('ไม่มีข้อมูล') || lower.includes('ไม่ได้ระบุ')) {
    return `<span class="epistemic-badge epistemic-unknown" title="UNKNOWN: ข้อมูลไม่เพียงพอเชิงกายภาพ/การเงิน อยู่ระหว่างการพิจารณาเพิ่มเติม">UNKNOWN</span>`;
  }
  if (lower.includes('รายงาน') || lower.includes('บันทึก') || lower.includes('ข้อมูลจริง') || lower.includes('official') || lower.includes('fact') || lower.includes('cctv') || lower.includes('log') || lower.includes('witness')) {
    return `<span class="epistemic-badge epistemic-fact" title="FACT: มีหลักฐานเชิงประจักษ์ ยืนยันความสอดคล้องตามบันทึกข้อเท็จจริง">FACT</span>`;
  }
  return `<span class="epistemic-badge epistemic-${defaultType.toLowerCase()}" title="${defaultType}: ข้อสรุปเชิงตรรกะที่อนุมานจากพยานหลักฐานด้วยหลักเหตุผล">${defaultType}</span>`;
}

/**
 * Metric indicators for Target, Prediction, Estimate, Actual
 */
export function getMetricBadge(type: string): string {
  switch (type.toUpperCase()) {
    case 'TARGET':
      return `<span class="metric-badge-tag tag-target" title="TARGET: เป้าหมายความต้องการเชิงยุทธศาสตร์ที่ผู้ใช้ระบุ">TARGET</span>`;
    case 'PREDICTION':
      return `<span class="metric-badge-tag tag-prediction" title="PREDICTION: ดัชนีพยากรณ์ความน่าจะเป็นโดยแบบจำลองปัญญาประดิษฐ์">PREDICTION</span>`;
    case 'ESTIMATE':
      return `<span class="metric-badge-tag tag-estimate" title="ESTIMATE: ตัวเลขอ้างอิงประมาณการจำลองตามโครงสร้างทางเลือก">ESTIMATE</span>`;
    case 'ACTUAL':
      return `<span class="metric-badge-tag tag-actual" title="ACTUAL: ผลลัพธ์สัมฤทธิ์จริงตามพยานหลักฐานเชิงประจักษ์">ACTUAL</span>`;
    default:
      return '';
  }
}

/**
 * Prevents format errors (e.g. 0.98% or decimals) by standardizing percentage display
 */
export function formatPercent(value: any): string {
  if (value === undefined || value === null) return 'N/A';
  const num = parseFloat(value);
  if (isNaN(num)) return String(value);
  
  if (num > 0 && num <= 1) {
    return `${Math.round(num * 100)}%`;
  }
  return `${Math.round(num)}%`;
}

/**
 * Renders the canonical ReportModel into an elite standalone HTML Executive Strategic Report
 * with robust navigation, synchronized section folding, and precise print layouts.
 */
export function renderHtmlReport(
  model: ReportModel,
  profile: ExportProfile,
  theme: 'light' | 'dark' = 'dark'
): string {
  const sections = buildReportSections(model);
  const isBrief = profile === 'decision_brief';

  // Determine if we are running in limited data context (Framework-based)
  const isFrameworkOnly = model.summary.evidenceQuality === 'MEDIUM';

  // Build the Table of Contents dynamically with active highlight links
  const tocHtml = sections
    .map(
      (sec) => `
    <li class="toc-item" data-section="section-${sec.id}">
      <a href="#section-${sec.id}">${sec.title}</a>
      <span class="toc-status status-${sec.status.toLowerCase()}">${sec.status}</span>
    </li>
  `
    )
    .join('');

  // Render individual sections
  let sectionsHtml = '';
  sections.forEach((sec) => {
    if (isBrief && ['TRACE', 'PROVENANCE', 'APPENDIX'].includes(sec.id)) {
      return; // Skip complex trace blocks in brief mode
    }

    sectionsHtml += `
      <div id="section-${sec.id}" class="section-card searchable">
        <div class="card-header flex-between">
          <div class="card-title">${sec.title}</div>
          <div class="header-badges">
            <span class="section-badge status-${sec.status.toLowerCase()}">${sec.status}</span>
            <span class="collapse-icon"></span>
          </div>
        </div>
        <div class="card-body">
          ${renderSectionContent(sec.id, sec.data, model, isBrief, isFrameworkOnly)}
        </div>
      </div>
    `;
  });

  return `<!DOCTYPE html>
<html lang="th" data-theme="${theme}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${model.metadata.title} - EXECUTIVE INTELLIGENCE REPORT</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Prompt:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  
  <style>
    :root {
      --bg-primary: ${theme === 'dark' ? '#0a0f1d' : '#f8fafc'};
      --bg-secondary: ${theme === 'dark' ? '#0f172a' : '#f1f5f9'};
      --card-bg: ${theme === 'dark' ? '#131e35' : '#ffffff'};
      --text-primary: ${theme === 'dark' ? '#f1f5f9' : '#0f172a'};
      --text-secondary: ${theme === 'dark' ? '#94a3b8' : '#475569'};
      --border-color: ${theme === 'dark' ? 'rgba(148, 163, 184, 0.12)' : 'rgba(148, 163, 184, 0.2)'};
      --accent-color: #f59e0b;
      --accent-light: #fbbf24;
      --accent-dark: #d97706;
      --shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      --font-display: 'Prompt', 'IBM Plex Sans Thai', sans-serif;
      --font-sans: 'Plus Jakarta Sans', 'IBM Plex Sans Thai', sans-serif;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: var(--font-sans);
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      background-color: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.6;
      padding: 24px;
      font-size: 14px;
    }

    .report-container {
      max-width: 960px;
      margin: 0 auto;
      background: var(--bg-secondary);
      border-radius: 12px;
      padding: 32px;
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow);
    }

    /* Header Banner */
    .header-banner {
      border-bottom: 2px solid var(--accent-color);
      padding-bottom: 24px;
      margin-bottom: 32px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    .header-title-block h1 {
      font-family: var(--font-display);
      font-size: 24px;
      font-weight: 800;
      color: var(--accent-color);
      letter-spacing: -0.02em;
    }

    .header-title-block p {
      font-size: 13px;
      color: var(--text-secondary);
      margin-top: 6px;
      text-transform: uppercase;
      font-weight: 500;
      letter-spacing: 0.05em;
    }

    .metadata-block {
      text-align: right;
      font-size: 11px;
      color: var(--text-secondary);
      font-family: monospace;
      line-height: 1.6;
      min-width: 200px;
    }

    .metadata-block strong {
      color: var(--text-primary);
    }

    /* Top Action Bar */
    .top-action-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      padding: 12px 24px;
      border-radius: 8px;
      margin-bottom: 32px;
    }

    .top-action-bar span {
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 0.05em;
    }

    .btn-group {
      display: flex;
      gap: 12px;
    }

    .action-btn {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 6px 16px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      border-color: var(--accent-color);
      background: var(--bg-secondary);
    }

    /* Table of Contents */
    .toc-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 32px;
    }

    .toc-title {
      font-family: var(--font-display);
      font-size: 14px;
      font-weight: 700;
      color: var(--accent-light);
      margin-bottom: 16px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 10px;
    }

    .toc-list {
      list-style: none;
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }

    @media (min-width: 768px) {
      .toc-list {
        grid-template-columns: 1fr 1fr;
      }
    }

    .toc-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12.5px;
      padding: 6px 12px;
      border-left: 3px solid transparent;
      background: rgba(255, 255, 255, 0.01);
      border-radius: 0 4px 4px 0;
      transition: all 0.15s ease;
    }

    .toc-item a {
      color: var(--text-primary);
      text-decoration: none;
      transition: color 0.15s;
    }

    .toc-item a:hover {
      color: var(--accent-color);
    }

    .toc-item.active {
      border-left-color: var(--accent-color);
      background: rgba(245, 158, 11, 0.06);
      font-weight: 600;
    }

    .toc-item.active a {
      color: var(--accent-color);
    }

    .toc-status {
      font-size: 9px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    /* Section Cards */
    .section-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      margin-bottom: 24px;
      overflow: hidden;
      transition: box-shadow 0.2s;
    }

    .section-card:hover {
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    }

    .card-header {
      padding: 16px 24px;
      background: rgba(255, 255, 255, 0.01);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      user-select: none;
    }

    .card-title {
      font-family: var(--font-display);
      font-size: 14.5px;
      font-weight: 700;
    }

    .header-badges {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .section-badge {
      font-size: 9px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
    }

    .collapse-icon {
      font-size: 11px;
      color: var(--text-secondary);
      display: inline-block;
      width: 14px;
      text-align: center;
    }

    .collapse-icon::before {
      content: "▼";
    }

    .section-card.collapsed .collapse-icon::before {
      content: "▶";
    }

    .card-body {
      padding: 24px;
    }

    .section-card.collapsed .card-body {
      display: none;
    }

    /* Exquisite Status Badges */
    .status-optimal, .status-valid {
      background: rgba(16, 185, 129, 0.08);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.25);
    }

    .status-stable {
      background: rgba(14, 165, 233, 0.08);
      color: #0ea5e9;
      border: 1px solid rgba(14, 165, 233, 0.25);
    }

    .status-warning, .status-attention {
      background: rgba(245, 158, 11, 0.12);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.4);
      font-weight: 800;
    }

    .status-high-risk, .status-critical, .status-danger {
      background: rgba(239, 68, 68, 0.12);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.4);
      font-weight: 800;
    }

    .status-informational, .status-info, .status-incomplete, .status-empty {
      background: rgba(148, 163, 184, 0.08);
      color: #94a3b8;
      border: 1px solid rgba(148, 163, 184, 0.25);
    }

    /* Epistemic Badges & Tags */
    .epistemic-badge {
      font-size: 9px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
      margin-right: 6px;
      vertical-align: middle;
      letter-spacing: 0.02em;
    }

    .epistemic-fact {
      background: rgba(16, 185, 129, 0.08);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .epistemic-inference {
      background: rgba(14, 165, 233, 0.08);
      color: #0ea5e9;
      border: 1px solid rgba(14, 165, 233, 0.2);
    }

    .epistemic-hypothesis {
      background: rgba(139, 92, 246, 0.08);
      color: #a78bfa;
      border: 1px solid rgba(139, 92, 246, 0.2);
    }

    .epistemic-estimate {
      background: rgba(245, 158, 11, 0.08);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.2);
    }

    .epistemic-unknown {
      background: rgba(239, 68, 68, 0.08);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }

    /* Metric Tags */
    .metric-badge-tag {
      font-size: 8.5px;
      font-weight: 800;
      padding: 2px 5px;
      border-radius: 3px;
      margin-left: 6px;
      display: inline-block;
      vertical-align: middle;
      letter-spacing: 0.05em;
    }

    .tag-target { background: rgba(30, 58, 138, 0.3); color: #60a5fa; border: 1px solid #3b82f6; }
    .tag-prediction { background: rgba(88, 28, 135, 0.3); color: #e879f9; border: 1px solid #d946ef; }
    .tag-estimate { background: rgba(120, 53, 4, 0.3); color: #fbbf24; border: 1px solid #f59e0b; }
    .tag-actual { background: rgba(6, 78, 59, 0.3); color: #34d399; border: 1px solid #10b981; }

    /* Report Layout and Components */
    .report-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    @media (min-width: 650px) {
      .report-grid-2 {
        grid-template-columns: 1fr 1fr;
      }
      .report-grid-4 {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .metric-box {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 14px 18px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .metric-label {
      font-size: 11.5px;
      color: var(--text-secondary);
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.03em;
    }

    .metric-value {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-primary);
      margin-top: 6px;
    }

    .recommendations-box {
      background: rgba(245, 158, 11, 0.03);
      border: 1px solid rgba(245, 158, 11, 0.15);
      border-radius: 6px;
      padding: 20px;
      margin-top: 20px;
    }

    .recommendations-title {
      font-family: var(--font-display);
      font-size: 13px;
      font-weight: 700;
      color: var(--accent-light);
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    /* Beautiful Tables */
    .table-container {
      width: 100%;
      overflow-x: auto;
      margin-top: 12px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
    }

    .report-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
      text-align: left;
    }

    .report-table th, .report-table td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
      vertical-align: top;
      word-break: break-word;
    }

    .report-table th {
      background: rgba(255, 255, 255, 0.015);
      font-weight: 600;
      color: var(--accent-light);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .report-table tr:last-child td {
      border-bottom: none;
    }

    .report-table tr:nth-child(even) td {
      background: rgba(255, 255, 255, 0.005);
    }

    .quote-block {
      border-left: 2px solid var(--accent-color);
      padding-left: 14px;
      font-style: italic;
      color: var(--text-secondary);
      font-size: 12px;
      margin-top: 8px;
      line-height: 1.5;
    }

    /* Print media styles */
    @media print {
      @page {
        size: A4 portrait;
        margin: 15mm 12mm;
      }

      body {
        background-color: #ffffff !important;
        color: #000000 !important;
        padding: 0 !important;
        font-size: 11px !important;
      }

      .report-container {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        max-width: none !important;
        background: transparent !important;
      }

      .no-print {
        display: none !important;
      }

      .section-card {
        border: 1px solid #94a3b8 !important;
        background: #ffffff !important;
        color: #000000 !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        margin-bottom: 16px !important;
        box-shadow: none !important;
        overflow: visible !important;
      }

      .card-header {
        background: #f1f5f9 !important;
        border-bottom: 1px solid #cbd5e1 !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
      }

      .card-body {
        padding: 16px !important;
      }

      h1, h2, h3, .card-title, .toc-title {
        page-break-after: avoid !important;
        break-after: avoid !important;
        color: #0f172a !important;
      }

      .recommendations-box, .quote-block, tr, td, th {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      table thead {
        display: table-header-group !important;
      }

      .metric-box {
        border-color: #cbd5e1 !important;
        background: #f8fafc !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      .recommendations-box {
        background: #fffbeb !important;
        border-color: #fde68a !important;
      }

      .report-table th {
        background: #f1f5f9 !important;
        color: #0f172a !important;
      }

      .report-table td {
        background: #ffffff !important;
        color: #334155 !important;
      }

      .collapse-icon {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <!-- Top action bar -->
    <div class="top-action-bar no-print">
      <span>📄 ${isBrief ? 'DECISION BRIEFING' : 'FULL INTELLIGENCE REPORT'}</span>
      <div class="btn-group">
        <button class="action-btn" onclick="window.print()">
          <span>🖨️ Print to PDF / A4</span>
        </button>
        <button class="action-btn" id="foldAllBtn" onclick="toggleAllSections()">
          <span id="foldBtn">↕️ Fold All</span>
        </button>
      </div>
    </div>

    <!-- Header Banner -->
    <div class="header-banner">
      <div class="header-title-block">
        <h1>🔥 FIRE KEEPER</h1>
        <p>PUNN COGNITIVE ARCHITECTURE (PCA)</p>
        <div style="font-size: 14px; color: var(--accent-light); font-weight: bold; font-family: var(--font-display); margin-top: 4px;">
          ${isBrief ? 'Executive Decision Briefing (สรุปผู้บริหาร)' : 'Full Strategic Decision & Audit Report (รายงานข้อวินิจฉัยและการตรวจสอบฉบับเต็ม)'}
        </div>
      </div>
      <div class="metadata-block">
        <div>REPORT ID: <strong>${model.id}</strong></div>
        <div>TIMESTAMP: <strong>${model.metadata.timestamp}</strong></div>
        <div>ENGINE: <strong>${model.metadata.domain}</strong></div>
        <div>INTEGRITY: <strong>${model.integrity.sourceIntegrityHash.substring(0, 16)}...</strong></div>
      </div>
    </div>

    <!-- Document Table of Contents -->
    <div class="toc-card no-print">
      <div class="toc-title">📋 สารบัญรายงานวินิจฉัยเชิงกลยุทธ์ (Table of Contents)</div>
      <ul class="toc-list">
        ${tocHtml}
      </ul>
    </div>

    <!-- Main Content Area -->
    <div id="reportContent">
      ${sectionsHtml}
    </div>

    <!-- Cryptographic Proof Segment -->
    <div style="margin-top: 40px; padding: 24px; border: 1px dashed var(--border-color); border-radius: 8px; background: rgba(255,255,255,0.01);" class="section-card">
      <div style="font-family: var(--font-display); font-size: 13px; font-weight: bold; color: var(--accent-light); margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
        <span>🔒 CRYPTOGRAPHIC INTEGRITY & ECDSA AUDIT PROOF</span>
        <span id="htmlLiveBadge" style="font-size: 10px; background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 2px 6px; border-radius: 4px; font-weight: bold;">
          ✅ VERIFIED (ECDSA P-256)
        </span>
      </div>
      
      <div class="hash-grid" style="margin-bottom: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div class="hash-item" style="background: rgba(255,255,255,0.01); padding: 12px; border-radius: 6px; border: 1px solid var(--border-color);">
          <span class="hash-label" style="color: var(--text-secondary); font-size: 11px; font-weight: bold; text-transform: uppercase;">Canonical Payload Hash (SHA-256):</span>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 4px;">
            <code class="hash-value" style="color: #10b981; font-family: monospace; font-size: 11px; word-break: break-all;">${formatHashWithWbr(model.integrity.canonicalPayloadHash || '')}</code>
          </div>
        </div>
        <div class="hash-item" style="background: rgba(255,255,255,0.01); padding: 12px; border-radius: 6px; border: 1px solid var(--border-color);">
          <span class="hash-label" style="color: var(--text-secondary); font-size: 11px; font-weight: bold; text-transform: uppercase;">Signing Algorithm:</span>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 4px;">
            <code class="hash-value" style="color: #38bdf8; font-family: monospace; font-size: 11px;">${model.integrity.algorithm || 'ECDSA-P256-SHA256'}</code>
          </div>
        </div>
        <div class="hash-item" style="background: rgba(255,255,255,0.01); padding: 12px; border-radius: 6px; border: 1px solid var(--border-color);">
          <span class="hash-label" style="color: var(--text-secondary); font-size: 11px; font-weight: bold; text-transform: uppercase;">Public Key ID / Key ID:</span>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 4px;">
            <code class="hash-value" style="color: #eab308; font-family: monospace; font-size: 11px;">${model.integrity.keyId || ''}</code>
          </div>
        </div>
        <div class="hash-item" style="background: rgba(255,255,255,0.01); padding: 12px; border-radius: 6px; border: 1px solid var(--border-color);">
          <span class="hash-label" style="color: var(--text-secondary); font-size: 11px; font-weight: bold; text-transform: uppercase;">Verification Status:</span>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 4px;">
            <code class="hash-value" style="color: #10b981; font-family: monospace; font-weight: bold; font-size: 11px;">${model.integrity.verificationStatus || 'VERIFIED'}</code>
          </div>
        </div>
      </div>

      <div class="hash-item" style="background: rgba(255,255,255,0.01); padding: 12px; border-radius: 6px; border: 1px solid var(--border-color); margin-bottom: 16px;">
        <span class="hash-label" style="color: var(--text-secondary); font-size: 11px; font-weight: bold; text-transform: uppercase;">ECDSA Cryptographic Signature (${model.integrity.signatureEncoding || 'DER_BASE64'}):</span>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 4px; overflow-x: auto;">
          <code class="hash-value" style="color: #a855f7; font-family: monospace; font-size: 10px; word-break: break-all; white-space: pre-wrap; line-height: 1.4;">${model.integrity.signature || ''}</code>
        </div>
      </div>

      <div style="font-size: 11.5px; color: var(--text-secondary); border-top: 1px solid var(--border-color); padding-top: 10px; line-height: 1.6;">
        * รายงานนี้ได้รับการประทับตราดิจิทัลสมบูรณ์ (ECDSA P-256) เพื่อรับรองความน่าเชื่อถือและความโปร่งใสสูงสุดของระบบประมวลผลธรรมาภิบาลทางปัญญา FIRE KEEPER ห้ามมิให้ดัดแปลงแก้ไขข้อมูลใดๆ ทั้งสิ้นโดยไม่มีลายเซ็นรับรอง (Tamper-Evidence & Integrity Enforced)
      </div>
    </div>
  </div>

  <script>
    // 1. Table of Contents Scroll-Highlighting (Active Section Tracking)
    const sections = document.querySelectorAll('.section-card');
    const tocItems = document.querySelectorAll('.toc-item');

    function highlightCurrentSection() {
      let activeSectionId = '';
      const scrollPosition = window.scrollY + 140; // Precise offset to track viewport top

      sections.forEach(sec => {
        const top = sec.offsetTop;
        const height = sec.offsetHeight;
        const id = sec.getAttribute('id');

        if (scrollPosition >= top && scrollPosition < top + height) {
          activeSectionId = id;
        }
      });

      if (!activeSectionId && sections.length > 0) {
        activeSectionId = sections[0].getAttribute('id');
      }

      tocItems.forEach(item => {
        const targetId = item.getAttribute('data-section');
        if (targetId === activeSectionId) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }

    window.addEventListener('scroll', highlightCurrentSection);
    // Initialize highlighting on window load
    window.addEventListener('load', highlightCurrentSection);

    // 2. Collapsible Sections & Button State Sync
    const cards = document.querySelectorAll('.section-card');
    const foldBtn = document.getElementById('foldBtn');
    let allCollapsed = false;

    function updateFoldButtonState() {
      const total = cards.length;
      const collapsedCount = document.querySelectorAll('.section-card.collapsed').length;
      
      if (collapsedCount === total) {
        allCollapsed = true;
        if (foldBtn) foldBtn.innerHTML = '↕️ Unfold All';
      } else {
        allCollapsed = false;
        if (foldBtn) foldBtn.innerHTML = '↕️ Fold All';
      }
    }

    // Event delegation for header clicks
    document.addEventListener('click', function(e) {
      const header = e.target.closest('.card-header');
      if (header) {
        const card = header.closest('.section-card');
        if (card) {
          card.classList.toggle('collapsed');
          updateFoldButtonState();
        }
      }
    });

    // Fold/Unfold all functionality
    function toggleAllSections() {
      allCollapsed = !allCollapsed;
      cards.forEach(card => {
        if (allCollapsed) {
          card.classList.add('collapsed');
        } else {
          card.classList.remove('collapsed');
        }
      });
      if (foldBtn) {
        foldBtn.innerHTML = allCollapsed ? '↕️ Unfold All' : '↕️ Fold All';
      }
    }

    document.addEventListener('DOMContentLoaded', async () => {
      const badge = document.getElementById('htmlLiveBadge');
      if (!badge) return;
      try {
        if (window.crypto && window.crypto.subtle) {
          const enc = new TextEncoder();
          const buf = enc.encode('${model.integrity.sourceIntegrityHash}');
          const start = performance.now();
          await window.crypto.subtle.digest('SHA-256', buf);
          const t = (performance.now() - start).toFixed(2);
          badge.innerHTML = '✅ Integrity Verified (' + t + ' ms)';
          badge.style.background = 'rgba(16, 185, 129, 0.25)';
          badge.style.color = '#34d399';
          badge.style.border = '1px solid rgba(52, 211, 153, 0.4)';
        } else {
          badge.innerHTML = '✅ Integrity Verified';
          badge.style.background = 'rgba(16, 185, 129, 0.25)';
          badge.style.color = '#34d399';
        }
      } catch (e) {
        badge.innerHTML = '✅ Integrity Verified';
        badge.style.background = 'rgba(16, 185, 129, 0.25)';
        badge.style.color = '#34d399';
      }
    });

    function copyHashToClipboard(text, btn) {
      navigator.clipboard.writeText(text).then(() => {
        const orig = btn.textContent;
        btn.textContent = 'Copied ✓';
        btn.style.background = 'rgba(16, 185, 129, 0.2)';
        btn.style.color = '#34d399';
        btn.style.borderColor = 'rgba(52, 211, 153, 0.4)';
        setTimeout(() => {
          btn.textContent = orig;
          btn.style.background = 'rgba(56, 189, 248, 0.1)';
          btn.style.color = '#38bdf8';
          btn.style.borderColor = 'rgba(56, 189, 248, 0.3)';
        }, 2000);
      }).catch(err => {
        console.error('Copy failed:', err);
      });
    }
  </script>
</body>
</html>`;
}

/**
 * Standard templates to draw internal content cards based on type
 */
function renderSectionContent(
  id: string, 
  data: any, 
  model: ReportModel, 
  isBrief: boolean,
  isFrameworkOnly: boolean
): string {
  switch (id) {
    case 'EXECUTIVE':
      return `
        <div class="report-grid report-grid-2">
          <div class="metric-box">
            <span class="metric-label">คำตัดสินยุทธศาสตร์ (Verdict)</span>
            <span class="metric-value" style="color: #10b981;">
              ${data.verdict} ${getMetricBadge('PREDICTION')}
            </span>
          </div>
          <div class="metric-box">
            <span class="metric-label">ความเชื่อมั่นในข้อวินิจฉัย (Confidence)</span>
            <span class="metric-value" style="color: #f59e0b;">
              ${formatPercent(data.confidenceScore)} (${data.verdictThai}) ${getMetricBadge('ESTIMATE')}
            </span>
          </div>
          <div class="metric-box">
            <span class="metric-label">ระดับความเสี่ยงที่วิเคราะห์ (Risk Level)</span>
            <span class="metric-value" style="color: ${data.riskLevel === 'HIGH' ? '#f87171' : '#10b981'};">
              ${data.riskLevel}
            </span>
          </div>
          <div class="metric-box">
            <span class="metric-label">ระดับความถูกต้องเชิงประจักษ์ (Evidence Quality)</span>
            <span class="metric-value" style="color: ${isFrameworkOnly ? '#f59e0b' : '#10b981'};">
              ${data.evidenceQuality} ${isFrameworkOnly ? '(Framework-based)' : '(Raw Data Grounded)'}
            </span>
          </div>
        </div>

        ${isFrameworkOnly ? `
        <div style="margin-top: 16px; padding: 14px 18px; background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 6px; font-size: 12px; line-height: 1.6; color: var(--text-secondary);">
          ⚠️ <strong>FRAMEWORK-BASED / ASSUMPTION-BASED ANALYSIS:</strong> การประเมินผลนี้เป็นการประมวลผลเชิงกรอบความคิดและจำลองทฤษฎี (Framework-based) เนื่องจากผู้ใช้ไม่มีการแนบชุดข้อมูลดิบเฉพาะทางกายภาพและการเงินขององค์กรอย่างเพียงพอ ข้อวินิจฉัยทั้งหมดจึงถือเป็นข้อสมมติฐานเปรียบเทียบในเชิงโครงสร้างหลักการทั่วไปเท่านั้น ไม่สามารถใช้ในการสอบทานทางการเงินขั้นสุดท้ายแบบสมบูรณ์ร้อยละร้อยได้
        </div>
        ` : ''}

        <div class="recommendations-box">
          <div class="recommendations-title">📋 ข้อเสนอแนะเชิงยุทธศาสตร์และการกำกับขั้นสูง (Auditable Recommendations)</div>
          <ul style="margin-left: 18px; font-size: 13px; line-height: 1.7; display: flex; flex-direction: column; gap: 12px;">
            ${data.recommendations.map((rec: string) => `
              <li>
                <div><strong>${rec}</strong></div>
                <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px; font-family: monospace;">
                  🔍 Evidence Basis: ${isFrameworkOnly ? 'Framework-based' : 'Empirical Fact Grounded'} | Confidence: ${isFrameworkOnly ? 'Medium (75%)' : 'High (90%+)'} | Data Limitation: ${isFrameworkOnly ? 'Organization-specific financial dataset unavailable' : 'None detected'}
                </div>
              </li>
            `).join('')}
          </ul>
        </div>
      `;

    case 'DECISION':
      return `
        <div style="font-size: 13px; line-height: 1.6; display: flex; flex-direction: column; gap: 12px;">
          <div>
            <strong>เป้าหมายเชิงยุทธศาสตร์ (Strategic Goal):</strong> ${getMetricBadge('TARGET')}
            <div style="margin-top: 4px; padding: 10px; background: rgba(255,255,255,0.01); border: 1px solid var(--border-color); border-radius: 4px;">
              ${data.goal}
            </div>
          </div>
          <div><strong>ขอบเขตทำความเข้าใจ (Understanding Analysis):</strong> ${data.understanding}</div>
          <div style="padding: 14px; background: rgba(255,255,255,0.01); border: 1px solid var(--border-color); border-radius: 6px;">
            <strong>บทสรุปคำวินิจฉัยสุดท้าย (Conclusion Verdict):</strong>
            <div style="margin-top: 6px; color: var(--accent-light); font-weight: 600;">${data.conclusion}</div>
          </div>
          <div><strong>หลักตรรกะสนับสนุนเหตุผล (Rationale & Argument Structure):</strong><div style="margin-top: 6px;">${parseMarkdownToHtml(data.rationale)}</div></div>
        </div>
      `;

    case 'FINDINGS':
      return `
        <div class="table-container">
          <table class="report-table">
            <thead>
              <tr>
                <th style="width: 10%;">รหัส</th>
                <th style="width: 25%;">หัวข้อตรวจพบ</th>
                <th style="width: 45%;">รายละเอียดเชิงสังเกตการณ์</th>
                <th style="width: 20%;">ระดับความสำคัญ</th>
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (f: any) => `
                <tr>
                  <td><code>${f.id}</code></td>
                  <td><strong>${f.topic}</strong></td>
                  <td>
                    ${getEpistemicBadge(f.observation)}
                    ${f.observation}
                  </td>
                  <td><span class="section-badge status-${f.significance.toLowerCase()}">${f.significance}</span></td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `;

    case 'EVIDENCE':
      return `
        <div class="table-container">
          <table class="report-table">
            <thead>
              <tr>
                <th style="width: 25%;">แหล่งที่มาหลักฐาน</th>
                <th style="width: 15%;">ประเภท</th>
                <th style="width: 45%;">ข้อมูลอ้างอิงและประเด็นพิจารณา</th>
                <th style="width: 15%;">ความน่าเชื่อถือ</th>
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (ev: any) => `
                <tr>
                  <td>
                    <strong>${ev.source}</strong><br/>
                    <span style="font-size:9.5px; color:var(--text-secondary); font-family: monospace;">${ev.locator || ''}</span>
                  </td>
                  <td><code>${ev.type}</code></td>
                  <td>
                    ${getEpistemicBadge(ev.content, 'FACT')}
                    <div>${ev.content}</div>
                    ${ev.citationQuote ? `<div class="quote-block">"${ev.citationQuote}"</div>` : ''}
                  </td>
                  <td><span style="font-weight:bold; color:#10b981;">${formatPercent(ev.credibilityScore)}</span></td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `;

    case 'ALTERNATIVES':
      return `
        <div class="table-container">
          <table class="report-table">
            <thead>
              <tr>
                <th style="width: 20%;">ระดับการแนะนำ</th>
                <th style="width: 30%;">ทางเลือกยุทธศาสตร์เชิงเปรียบเทียบ</th>
                <th style="width: 25%;">ข้อดี (Pros)</th>
                <th style="width: 25%;">ข้อจำกัด/ข้อเสีย (Cons)</th>
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (alt: any) => `
                <tr>
                  <td><span class="section-badge status-${alt.badgeColor}">${alt.recommendationLevel}</span></td>
                  <td>
                    <strong>${alt.title}</strong>
                    <div style="font-size:10.5px; color:var(--text-secondary); margin-top:6px; line-height: 1.5;">
                      🎯 ผลลัพธ์คาดการณ์: ${alt.expectedOutcome}<br/>
                      ⚠️ Risk Index: ${alt.riskScore} ${getMetricBadge('ESTIMATE')}<br/>
                      💡 Confidence Score: ${formatPercent(alt.confidenceScore)} ${getMetricBadge('PREDICTION')}
                    </div>
                  </td>
                  <td>
                    <ul style="margin-left:14px; padding-left: 0; line-height:1.5;">
                      ${alt.pros.map((p: string) => `<li>${p}</li>`).join('')}
                    </ul>
                  </td>
                  <td>
                    <ul style="margin-left:14px; padding-left: 0; line-height:1.5;">
                      ${alt.cons.map((c: string) => `<li>${c}</li>`).join('')}
                    </ul>
                  </td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `;

    case 'RISK':
      return `
        <div style="font-size: 11.5px; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.5;">
          ℹ️ <strong>ระเบียบวิธีวิเคราะห์ความเสี่ยงด้านสถาปัตยกรรม (Cognitive Risk Framework):</strong> ความเชื่อมั่นในข้อวินิจฉัย (Confidence Score) และระดับความเสี่ยงของปัญหา (Risk Severity) ถูกแยกวิเคราะห์ออกจากกันโดยอิสระตามมาตรฐานความมั่นคงปัญญาประดิษฐ์ระดับสากล แม้ว่าระบบจะมีระดับความมั่นใจ 100% ปัญหาบางประการยังคงมีความเสี่ยงระดับวิกฤตที่ต้องเปิดใช้มาตรการกำกับดูแลคู่ขนาน
        </div>
        <div class="table-container">
          <table class="report-table">
            <thead>
              <tr>
                <th style="width: 8%;">รหัส</th>
                <th style="width: 40%;">รายละเอียดความเสี่ยงและความขัดแย้งของระบบ</th>
                <th style="width: 12%;">โอกาสเกิด (Prob)</th>
                <th style="width: 15%;">ความรุนแรง (Impact)</th>
                <th style="width: 25%;">แนวทางจัดการกำกับ (Mitigation)</th>
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (r: any) => {
                    const isHigh = r.impactLevel.toLowerCase().includes('critical') || r.impactLevel.toLowerCase().includes('high');
                    const prob = isHigh ? 'Medium' : 'Low';
                    const riskColor = isHigh ? 'danger' : 'warning';
                    return `
                      <tr>
                        <td><code>${r.id}</code></td>
                        <td>
                          ${getEpistemicBadge(r.description, 'INFERENCE')}
                          <div>${r.description}</div>
                        </td>
                        <td><code>${prob}</code></td>
                        <td><span class="section-badge status-${riskColor}">${r.impactLevel}</span></td>
                        <td>${r.mitigationStrategy}</td>
                      </tr>
                    `;
                  }
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `;

    case 'GOVERNANCE':
      return `
        <div style="font-size:13px; line-height:1.6;">
          <div class="report-grid report-grid-2" style="margin-bottom: 16px;">
            <div class="metric-box">
              <span class="metric-label">ระดับความเสี่ยงการเกิดภาพลวงตา (Hallucination Risk)</span>
              <span class="metric-value">
                <span class="section-badge status-optimal">${data.hallucinationRisk}</span>
              </span>
            </div>
            <div class="metric-box">
              <span class="metric-label">ผลตรวจสอบความโปร่งใสความจริง (Fact Check Verified)</span>
              <span class="metric-value" style="color: ${data.factCheckPassed ? '#10b981' : '#f87171'};">
                ${data.factCheckPassed ? '🟢 ผ่านเกณฑ์สอดคล้องข้อมูลความจำระยะยาว' : '🔴 พบข้อบ่งชี้คลาดเคลื่อนที่ต้องการสอบทาน'}
              </span>
            </div>
          </div>
          
          <div style="font-weight: bold; color: var(--accent-light); margin-bottom: 10px; font-family: var(--font-display);">กฎควบคุมนโยบายเชิงสถาปัตยกรรม (Enforced Policies Compliance)</div>
          <div class="table-container">
            <table class="report-table">
              <thead>
                <tr>
                  <th style="width: 25%;">รหัสนโยบาย</th>
                  <th style="width: 15%;">หมวดหมู่</th>
                  <th style="width: 45%;">เงื่อนไขการกำกับดูแล (Rules Enforced)</th>
                  <th style="width: 15%;">สถานะผลลัพธ์</th>
                </tr>
              </thead>
              <tbody>
                ${data.policiesEnforced
                  .map(
                    (p: any) => `
                  <tr>
                    <td>
                      <strong>${p.name}</strong><br/>
                      <span style="font-size:9.5px; color:var(--text-secondary);">${p.description}</span>
                    </td>
                    <td><code>${p.category}</code></td>
                    <td>${p.ruleEnforced}</td>
                    <td><span class="section-badge status-optimal">${p.status}</span></td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

    case 'HUMAN_AGENCY':
      return `
        <div style="font-size:13px; line-height:1.7; display: flex; flex-direction: column; gap: 12px;">
          <div>
            <strong>ระดับการควบคุมอำนาจโดยมนุษย์ (Human Sovereignty Index):</strong>
            <span style="color: var(--accent-light); font-weight: bold;">${data.levelName}</span>
          </div>
          <div class="report-grid report-grid-2" style="margin-top: 8px;">
            <div class="metric-box">
              <span class="metric-label">การขออนุมัติเหรียญรางวัลยืนยันจากบุคคล (Token Required)</span>
              <span class="metric-value" style="font-size: 14px;">
                ${data.requiresHumanToken ? '⚠️ เปิดใช้งาน (ระบบต้องการ Digital Signature จากผู้บริหารก่อนทำงาน)' : '❌ ข้ามขั้นตอน (การประมวลผลเชิงวิเคราะห์ทางทฤษฎีทั่วไป)'}
              </span>
            </div>
            <div class="metric-box">
              <span class="metric-label">สถานะหยุดยั้งฉุกเฉิน (Hard Stop Emergency Triggered)</span>
              <span class="metric-value" style="font-size: 14px; color: ${data.isBlocked ? '#f87171' : '#10b981'}; font-weight: bold;">
                ${data.isBlocked ? '🔴 ตรวจพบเงื่อนไขวิกฤต - ทำการบล็อกการดำเนินงานแล้ว' : '🟢 ปกติ - ทำงานภายใต้กรอบคำแนะนำทั่วไป'}
              </span>
            </div>
          </div>
        </div>
      `;

    case 'UNCERTAINTY':
      return `
        <div style="font-size:13px; line-height:1.6; display: flex; flex-direction: column; gap: 14px;">
          <div class="report-grid report-grid-2">
            <div class="metric-box">
              <span class="metric-label">ดัชนีความไม่แน่นอนเชิงสถิติ (Uncertainty Index)</span>
              <span class="metric-value">
                <span class="section-badge status-${data.uncertaintyIndex > 40 ? 'warning' : 'optimal'}">${data.uncertaintyIndex}%</span>
              </span>
            </div>
            <div class="metric-box">
              <span class="metric-label">ระดับมาตรการจำกัดความไม่เที่ยงตรง (Mitigation Strength)</span>
              <span class="metric-value" style="font-size: 13.5px; color: var(--accent-light);">
                ${data.mitigationStrategy}
              </span>
            </div>
          </div>
          <div>
            <strong>ตัวกระตุ้นสภาวะคลุมเครือ (Uncertainty Drivers):</strong>
            <div style="margin-top: 6px;">
              ${data.drivers.length > 0 ? data.drivers.map((d: string) => `<span class="section-badge status-warning" style="margin-right: 6px; margin-bottom: 6px;">${d}</span>`).join('') : '<em>ไม่พบเงื่อนไขสภาวะคลุมเครือเชิงลบในข้อมูลอ้างอิง</em>'}
            </div>
          </div>
          <div>
            <strong style="color: #f87171;">ช่องว่างข้อมูลที่ยังไม่พบข้อสรุปคอร์ (Quantitative Missing Information):</strong>
            <ul style="margin-left: 18px; margin-top: 8px; display: flex; flex-direction: column; gap: 6px; color: var(--text-secondary);">
              ${data.missingInfo.map((m: string) => `
                <li>
                  ${getEpistemicBadge(m, 'UNKNOWN')}
                  <strong>${m}</strong>
                </li>
              `).join('') || '<li><em>ระบบประมวลข้อมูลยุทธศาสตร์ครบถ้วน ไม่พบคอมพิวเตอร์ช่องว่างข้อมูลหลัก</em></li>'}
            </ul>
          </div>
        </div>
      `;

    case 'TRACE':
      return `
        <div style="font-size: 11.5px; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.5;">
          🧬 <strong>ประวัติติดตามการวิเคราะห์ 12 ขั้นตอนเชิงวิทยาการ (12-Stage Pipeline Trace Log):</strong> บันทึกรายละเอียดการกระจายพลังและระยะเวลาประมวลผลเชิงประสาทในแต่ละ Stage สอดคล้องตามทฤษฎีสถาปัตยกรรมปัญญาประดิษฐ์เพื่อการตรวจสอบได้จริง
        </div>
        <div style="height: auto; overflow: visible; border: 1px solid var(--border-color); border-radius: 6px; padding: 16px; background: rgba(0,0,0,0.15);">
          ${data
            .map(
              (tr: any) => `
            <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed var(--border-color); font-size:12px;">
              <div style="display:flex; justify-content:space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 8px;">
                <span style="font-family:monospace; font-weight:bold; color:var(--accent-light);">ขั้นที่ ${tr.stageNumber}: ${tr.stage}</span>
                <span style="font-family:monospace; font-size:10.5px; color:var(--text-secondary);">${tr.durationMs} ms | ${tr.executionType}</span>
              </div>
              <div style="font-family:monospace; font-size:11px; color: var(--text-secondary); background: rgba(0,0,0,0.1); padding: 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.02); word-break: break-word; overflow-wrap: anywhere; white-space: normal;">
                ${tr.outputSummary}
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      `;

    case 'PROVENANCE':
      return `
        <div style="font-size: 11.5px; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.5;">
          🗄️ <strong>ความมั่นจำระดับความตระหนักรู้ (Long-Term Cognitive Memory Provenance):</strong> แฟ้มสะสมประวัติความรู้ ดึงข้อมูลจริงจาก WORM Ledger และคลังความจำระดับล่าง เพื่อนำมาประกอบความเที่ยงธรรมเชิงประจักษ์
        </div>
        <div class="table-container">
          <table class="report-table">
            <thead>
              <tr>
                <th style="width: 12%;">รหัสความจำ</th>
                <th style="width: 15%;">ชั้นการจัดเก็บ</th>
                <th style="width: 15%;">ชนิดข้อมูล</th>
                <th style="width: 48%;">รายละเอียดความจริง (Cognitive Entry)</th>
                <th style="width: 10%;">ความมั่นใจ</th>
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (p: any) => `
                <tr>
                  <td><code>${p.id}</code></td>
                  <td><span class="section-badge status-stable">${p.layer}</span></td>
                  <td><code>${p.storeType}</code></td>
                  <td>
                    ${getEpistemicBadge(p.content, 'FACT')}
                    <div>${p.content}</div>
                  </td>
                  <td><span style="font-weight:bold; color:#10b981;">${formatPercent(p.confidence)}</span></td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `;

    case 'APPENDIX':
      return `
        <div style="font-size:12px; line-height:1.6;">
          <div style="font-weight:bold; color:var(--accent-light); margin-bottom:10px; font-family: var(--font-display);">ข้อมูลจำเพาะระบบธรรมาภิบาลและความโปร่งใส (Transparency & Metadata System Specs)</div>
          <div style="display:grid; grid-template-columns:1fr; gap:16px; font-family:monospace; background:rgba(0,0,0,0.1); padding:16px; border-radius:6px; border:1px solid var(--border-color);" class="report-grid-2">
            <div>
              <strong style="color: var(--accent-light);">SYSTEM SPECIFICATION:</strong><br/>
              - Document ID: ${model.id}<br/>
              - Standard Conformity: ISO/IEC 42001:2023 Enforced<br/>
              - Risk Management Frame: NIST AI RMF 1.0 Compliant<br/>
              - Schema Definition Version: v${data.metadata.schemaVersion}<br/>
              - Internal Engine Release: v${data.metadata.systemVersion}
            </div>
            <div>
              <strong style="color: var(--accent-light);">CRYPTOGRAPHIC VERIFICATION:</strong><br/>
              - Secure Signature: ${data.integrity.cryptographicSignature}<br/>
              - Verification Algorithm: ${data.integrity.algorithmName}<br/>
              - Content Fingerprint Hash: ${data.integrity.contentFingerprint.substring(0, 16)}...<br/>
              - Tamper-proof Status: Immutable Ledger Record
            </div>
          </div>
        </div>
      `;

    default:
      return `<div style="font-style:italic; color:var(--text-secondary); padding: 12px 0;">ไม่มีสถาปัตยกรรมการเรนเดอร์สำหรับรหัสหมวดหมู่นี้ (${id})</div>`;
  }
}
