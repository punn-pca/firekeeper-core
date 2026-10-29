import type { Express, Request, Response } from 'express';
import fs from 'node:fs';
import { requireAuth } from '../middleware/auth';

// Prefer Thai-capable Unicode fonts. Keep multiple distro paths because the
// runtime image and local deployments may expose the same font in different places.
const THAI_FONTS = [
  '/usr/share/fonts/truetype/tlwg/Garuda.ttf',
  '/usr/share/fonts/truetype/tlwg/Loma.ttf',
  '/usr/share/fonts/truetype/tlwg/Norasi.ttf',
  '/usr/share/fonts/opentype/tlwg/Garuda.otf',
  '/usr/share/fonts/opentype/tlwg/Loma.otf',
  '/usr/share/fonts/truetype/noto/NotoSansThai-Regular.ttf',
  '/usr/share/fonts/truetype/noto/NotoSansThaiUI-Regular.ttf',
];

function findThaiPdfFont(): string | undefined {
  for (const candidate of THAI_FONTS) {
    try {
      // Ignore missing, unreadable, or empty font files instead of selecting
      // a path that will later make PDFKit emit a broken document.
      const stat = fs.statSync(candidate);
      if (stat.isFile() && stat.size > 10_000 && fs.accessSync(candidate, fs.constants.R_OK) === undefined) {
        return candidate;
      }
    } catch {
      // Try the next installed Thai font.
    }
  }
  return undefined;
}

export function registerDirectPdfExport(app: Express): void {
  app.post('/api/export/pdf', requireAuth, (req: Request, res: Response) => {
    const { title, content, format } = req.body || {};
    if (typeof content !== 'string' || !content.trim() || content.length > 120_000 ||
        (title !== undefined && (typeof title !== 'string' || title.length > 160)) ||
        (format !== undefined && !['conversation', 'decision_record'].includes(format))) {
      return res.status(400).json({ error: 'INVALID_PDF_CONTENT' });
    }
    const font = findThaiPdfFont();
    if (!font) return res.status(503).json({ error: 'THAI_PDF_FONT_UNAVAILABLE' });
    let PDFDocument: any;
    try {
      // Loaded only on PDF requests. Deployment requires the PDFKit installation workflow.
      PDFDocument = require('pdfkit');
    } catch {
      return res.status(503).json({ error: 'PDF_EXPORT_NOT_INSTALLED' });
    }
    try {
      const doc = new PDFDocument({
        size: 'A4', margins: { top: 28, right: 30, bottom: 32, left: 30 },
        bufferPages: false, autoFirstPage: true, compress: true,
      });
      const safeName = String(title || 'FIREKEEPER-Report').replace(/[\\/"<>:*?|\r\n]/g, '-').slice(0, 80);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);
      res.setHeader('Cache-Control', 'no-store');
      doc.on('error', () => { if (!res.headersSent) res.status(500).end(); else res.destroy(); });
      doc.pipe(res);
      const isDecisionRecord = format === 'decision_record';
      doc.font(font).fontSize(17).fillColor(isDecisionRecord ? '#c2410c' : '#1f2937')
        .text(String(title || 'FIREKEEPER Report'), { lineGap: 4 });
      doc.moveDown(0.35);
      if (isDecisionRecord) {
        doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y)
          .lineWidth(1.5).strokeColor('#ea580c').stroke();
        doc.moveDown(0.6);
        doc.fontSize(8).fillColor('#64748b').text('FIREKEEPER CORE  •  DECISION INTELLIGENCE RECORD', { characterSpacing: 0.5 });
        doc.moveDown(0.5);
      } else {
        doc.moveDown(0.35);
      }
      for (const paragraph of content.replace(/\r\n?/g, '\n').split(/\n\s*\n/)) {
        const block = paragraph.trim();
        if (!block) continue;
        if (isDecisionRecord && block.startsWith('# ')) {
          doc.fontSize(15).fillColor('#c2410c').text(block.replace(/^#\s+/, ''), { lineGap: 3, paragraphGap: 5 });
          doc.moveDown(0.25);
          continue;
        }
        if (isDecisionRecord && block.startsWith('## ')) {
          doc.moveDown(0.3);
          doc.fontSize(11).fillColor('#0369a1').text(block.replace(/^##\s+/, ''), { lineGap: 2, paragraphGap: 4 });
          doc.moveTo(doc.page.margins.left, doc.y + 2).lineTo(doc.page.width - doc.page.margins.right, doc.y + 2)
            .lineWidth(0.45).strokeColor('#cbd5e1').stroke();
          doc.moveDown(0.45);
          continue;
        }
        if (isDecisionRecord && /^\[(VERIFIED|UNVERIFIED|PARTIALLY_VERIFIED|CONFLICTING|INFERENCE|QUARANTINE)\]/i.test(block)) {
          const status = block.match(/^\[([^\]]+)\]/)?.[1]?.toUpperCase() || 'UNVERIFIED';
          const statusColor = status === 'VERIFIED' ? '#047857'
            : status === 'CONFLICTING' || status === 'QUARANTINE' ? '#b91c1c'
            : status === 'INFERENCE' ? '#6d28d9' : '#b45309';
          doc.fontSize(9.5).fillColor(statusColor).text(status, { continued: true, lineGap: 3 });
          doc.fillColor('#334155').text('  ' + block.replace(/^\[[^\]]+\]\s*/, ''), { lineGap: 3, paragraphGap: 6 });
          continue;
        }
        doc.fontSize(9.5).fillColor('#334155').text(block, { lineGap: 3, paragraphGap: 6, breakLine: true });
      }
      doc.end();
    } catch {
      if (!res.headersSent) res.status(500).json({ error: 'PDF_GENERATION_FAILED' });
      else res.destroy();
    }
  });
}
