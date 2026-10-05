import { MemoryItem, PCAState } from '../../types';
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

