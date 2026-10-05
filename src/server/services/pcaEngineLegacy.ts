import { sanitizeErrorForLog } from '../security/sanitizeError';
import crypto from 'crypto';
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
