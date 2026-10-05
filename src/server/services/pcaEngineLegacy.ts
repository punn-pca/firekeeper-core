import { sanitizeErrorForLog } from '../security/sanitizeError';
import crypto from 'crypto';
import { PDFParse } from 'pdf-parse';
import JSZip from 'jszip';
import Tesseract from 'tesseract.js';
import { ConversationTurn, MemoryItem, PCAState } from '../../types';
import { countTokens } from '../utils/text';
import { WebSearchExecutionResult } from './webSearch';

export type MemoryRecord = MemoryItem;

export interface ParsedAttachmentChunk {
  source: string;
  content: string;
  mimeType: string;
  chunkIndex: number;
  locator: string;
}

export interface AttachmentParseResult {
  success: boolean;
  filename: string;
  mimeType: string;
  chunks: ParsedAttachmentChunk[];
  error?: string;
}

export interface PCAStateInternal extends PCAState {
  // Additional internal-only fields if any
  web_search_results?: WebSearchExecutionResult;
}

const THAI_REGEX = /[\u0E00-\u0E7F]/;
export async function runStage(
  state: PCAStateInternal,
  stageId: string,
  stageNumber: number,
  stageThLabel: string,
  runStartMs: number,
  fn: () => Record<string, unknown> | Promise<Record<string, unknown>>,
  stageTypeOptions?: {
    promptTokens?: number;
    completionTokens?: number;
    executionType?: 'LLM_GENERATION' | 'SEMANTIC_RERANKER' | 'BAYESIAN_COMPUTATION' | 'HEURISTIC_EVAL' | 'RULE_CHECK' | 'AUDIT_LOGIC';
  }
): Promise<Record<string, unknown>> {
  if (Date.now() - runStartMs > 120_000) {
    throw new Error('Request exceeded max execution time');
  }
  const stageStartMs = Date.now();
  try {
    const output = await fn();
    const stageEndMs = Date.now();
    state.trace.push({
      stage: stageId,
      stage_number: stageNumber,
      stage_th_label: stageThLabel,
      timestamp: new Date(stageEndMs).toISOString(),
      duration_ms: Math.max(1, stageEndMs - stageStartMs),
      executionType: stageTypeOptions?.executionType,
      output: output || {},
    });
    return output || {};
  } catch (err: any) {
    console.error(`[PCA Engine] Stage ${stageId} failed:`, sanitizeErrorForLog(err));
    const failedAtMs = Date.now();
    state.trace.push({ stage: stageId, stage_number: stageNumber, stage_th_label: stageThLabel, timestamp: new Date(failedAtMs).toISOString(), duration_ms: Math.max(1, failedAtMs - stageStartMs), executionType: stageTypeOptions?.executionType, output: { error: err.message } });
    throw err;
  }
}

export async function parseAttachmentSingle(att: any): Promise<AttachmentParseResult> {
  const filename = att.name || 'unnamed_file';
  const mimeType = att.type || 'text/plain';

  try {
    let text = '';

    if (att.base64) {
      const rawBase64 = String(att.base64).replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(rawBase64, 'base64');

      if (mimeType === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')) {
        try {
          // pdf-parse v2 exposes a PDFParse class, not a callable default export.
          // Calling the module directly caused "pdfParser is not a function" for PDFs.
          const pdfParser = new PDFParse({ data: buffer });
          try {
            const parsed = await pdfParser.getText();
            text = parsed.text || '';
          } finally {
            await pdfParser.destroy();
          }
          if (!text.trim()) {
            throw new Error('PDF extracted text is empty (might be scanned/image-only PDF)');
          }
        } catch (pdfErr: any) {
          throw new Error(`PDF Parsing Error: ${pdfErr.message || pdfErr}`);
        }
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        filename.toLowerCase().endsWith('.docx')
      ) {
        try {
          const zip = await JSZip.loadAsync(buffer);
          const docXmlFile = zip.file('word/document.xml');
          if (!docXmlFile) {
            throw new Error('Missing word/document.xml inside DOCX file structure');
          }
          const docXmlText = await docXmlFile.async('string');
          const textMatches = docXmlText.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
          if (textMatches) {
            text = textMatches.map((val) => val.replace(/<[^>]+>/g, '')).join(' ');
          } else {
            text = docXmlText.replace(/<[^>]+>/g, ' ');
          }
          if (!text.trim()) {
            throw new Error('DOCX extracted text is empty');
          }
        } catch (docxErr: any) {
          throw new Error(`DOCX Parsing Error: ${docxErr.message || docxErr}`);
        }
      } else if (mimeType.startsWith('image/') || filename.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/)) {
        try {
          // Attempt OCR text extraction if possible
          const { data: { text: ocrText } } = await Tesseract.recognize(buffer, 'tha+eng');
          if (ocrText && ocrText.trim()) {
            text = `[รูปภาพแนบ: ${filename} (OCR ข้อความที่ตรวจพบ)]: ${ocrText.trim()}`;
          } else {
            text = `[รูปภาพแนบ: ${filename} (${mimeType}) - ส่งต่อไปยัง DeepSeek Vision Model เพื่อประมวลผลเชิงทัศนศาสตร์]`;
          }
        } catch {
          // If OCR fails (e.g. non-text photo or environment limit), still allow image to pass to Vision Model
          text = `[รูปภาพแนบ: ${filename} (${mimeType}) - ส่งต่อไปยัง DeepSeek Vision Model เพื่อประมวลผลเชิงทัศนศาสตร์]`;
        }
      } else {
        // Fallback for TXT, markdown, JSON, CSV
        text = buffer.toString('utf8');
      }
    } else if (att.textContent) {
      text = att.textContent;
    } else {
      throw new Error('Missing file data (neither base64 nor textContent is provided)');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('No readable text content extracted from file');
    }

    // Chunk the text
    const chunks: ParsedAttachmentChunk[] = [];
    const normalizedText = text.replace(/\s+/g, ' ').trim();
    const chunkSize = 800;
    const overlap = 150;
    
    let index = 0;
    let chunkIdx = 0;
    while (index < normalizedText.length) {
      const chunkText = normalizedText.slice(index, index + chunkSize);
      chunks.push({
        source: filename,
        content: chunkText,
        mimeType,
        chunkIndex: chunkIdx,
        locator: `${filename} (Chunk ${chunkIdx + 1})`
      });
      index += chunkSize - overlap;
      chunkIdx++;
    }
    
    return { success: true, filename, mimeType, chunks };
  } catch (err: any) {
    return { success: false, filename, mimeType, chunks: [], error: err.message };
  }
}

export function rerankAndFilterEvidence(
  chunks: ParsedAttachmentChunk[],
  query: string,
  maxTop: number = 12
): { selected: ParsedAttachmentChunk[]; totalRetrieved: number; totalSelected: number } {
  const totalRetrieved = chunks.length;
  if (totalRetrieved <= maxTop) {
    return { selected: chunks, totalRetrieved, totalSelected: totalRetrieved };
  }

  const queryLower = query.toLowerCase();
  const terms = queryLower
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);

  const thaiKeywords = ['พ.ร.บ.', 'กฎหมาย', 'pdpa', 'iso', 'nist', 'มาตรฐาน', 'ระเบียบ', 'สิทธิ์', 'ลงทะเบียน', 'สำเร็จ', 'วันที่', 'เปิดระบบ', 'ราคา', 'ค่า', 'บาท', 'tor', 'pay', 'nvidia', 'pathumma', 'learn', 'earn', 'plern'];
  const matchedThaiKeywords = thaiKeywords.filter(kw => queryLower.includes(kw));
  const allSearchTerms = Array.from(new Set([...terms, ...matchedThaiKeywords]));

  const scoredChunks = chunks.map(chunk => {
    let score = 0;
    const contentLower = chunk.content.toLowerCase();
    const sourceLower = chunk.source.toLowerCase();

    allSearchTerms.forEach(term => {
      const matches = contentLower.split(term).length - 1;
      if (matches > 0) {
        score += matches * 2.5;
      }
      if (sourceLower.includes(term)) {
        score += 6.0; 
      }
    });

    return { chunk, score };
  });

  scoredChunks.sort((a, b) => b.score - a.score);
  const selected = scoredChunks.slice(0, maxTop).map(sc => sc.chunk);
  return { selected, totalRetrieved, totalSelected: selected.length };
}

export interface Evidence {
  id: string;
  claim: string;
  source: string;
  title?: string;
  url?: string;
  sourceType: "official" | "institutional" | "primary" | "news" | "general" | "social";
  publishedAt?: string;
  retrievedAt: string;
  temporalStatus: "CURRENT" | "HISTORICAL" | "UNKNOWN" | "CONFLICTING";
  verificationStatus: "VERIFIED" | "PARTIALLY_VERIFIED" | "UNVERIFIED" | "CONFLICTING";
  confidence: number;
}

