import type { Express, Request, Response } from 'express';
import fs from 'node:fs';
import { requireAuth } from '../middleware/auth';

const THAI_FONTS = [
  '/usr/share/fonts/truetype/tlwg/Garuda.ttf',
  '/usr/share/fonts/truetype/tlwg/Loma.ttf',
  '/usr/share/fonts/truetype/tlwg/Norasi.ttf',
];

export function registerDirectPdfExport(app: Express): void {
  app.post('/api/export/pdf', requireAuth, (req: Request, res: Response) => {
    const { title, content } = req.body || {};
    if (typeof content !== 'string' || !content.trim() || content.length > 120_000 ||
        (title !== undefined && (typeof title !== 'string' || title.length > 160))) {
      return res.status(400).json({ error: 'INVALID_PDF_CONTENT' });
    }
    const font = THAI_FONTS.find((candidate) => fs.existsSync(candidate));
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
      doc.font(font).fontSize(17).fillColor('#1f2937').text(String(title || 'FIREKEEPER Report'), { lineGap: 4 });
      doc.moveDown(0.7);
      doc.fontSize(10).fillColor('#334155');
      for (const paragraph of content.replace(/\r\n?/g, '\n').split(/\n\s*\n/)) {
        if (!paragraph.trim()) continue;
        doc.text(paragraph.trim(), { lineGap: 3, paragraphGap: 7, breakLine: true });
      }
      doc.end();
    } catch {
      if (!res.headersSent) res.status(500).json({ error: 'PDF_GENERATION_FAILED' });
      else res.destroy();
    }
  });
}
