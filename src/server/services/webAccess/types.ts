/**
 * PUNN Predictive Cognitive Architecture (PCA v3.0)
 * Web Access Layer & Deep Web Retrieval Types
 */

export type EvidenceState =
  | 'DISCOVERED'
  | 'IDENTIFIED'
  | 'FETCHED'
  | 'RENDERED'
  | 'CONTENT_EXTRACTED'
  | 'DATE_VERIFIED'
  | 'SOURCE_VERIFIED'
  | 'CROSS_CHECKED'
  | 'SUMMARY_ELIGIBLE'
  | 'TITLE_ONLY'
  | 'ACCESS_RESTRICTED'
  | 'EXTRACTION_FAILED'
  | 'DATE_MISMATCH'
  | 'INSUFFICIENT_EVIDENCE';

export type ContentType =
  | 'article'
  | 'index'
  | 'category'
  | 'search_page'
  | 'rss_feed'
  | 'general';

export interface ResolvedArticle {
  id: string;
  original_url: string;
  canonical_url: string;
  title: string;
  author?: string;
  publisher: string;
  source_domain: string;
  published_at?: string;
  updated_at?: string;
  raw_date_string?: string;
  body: string;
  snippet: string;
  language: string;
  content_type: ContentType;
  content_quality: number; // 0.0 - 1.0
  word_count: number;
  char_count: number;
  evidence_state: EvidenceState;
  summary_eligible: boolean;
  retrieval_method: 'HTTP_GET' | 'CANONICAL_RESOLVED' | 'JS_RENDER_FALLBACK' | 'RSS_FALLBACK' | 'LINK_FOLLOWED';
  retrieval_timestamp: string;
  extracted_links?: Array<{ url: string; title: string }>;
  is_date_verified: boolean;
  is_source_verified: boolean;
  security_sanitized: boolean;
}

export interface EventEvidenceSource {
  publisher: string;
  sourceDomain: string;
  url: string;
  published_at?: string;
  retrieval_timestamp: string;
  extracted_content: string;
  evidence_id: string;
  title: string;
  content_quality: number;
}

export interface EventGroup {
  event_id: string;
  topic: string;
  sources: EventEvidenceSource[];
  key_facts: string[];
  cross_checked: boolean;
  primary_date?: string;
}

export interface ProvenanceObject {
  claim_id: string;
  claim_text?: string;
  evidence_ids: string[];
  source_urls: string[];
  publishers: string[];
  published_timestamps: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  verification_status: 'verified' | 'unverified' | 'contradicted';
}

export type TraceStage =
  | 'SEARCH'
  | 'URL_FOUND'
  | 'URL_OPEN'
  | 'HTTP_FETCH'
  | 'BROWSER_FALLBACK'
  | 'JS_RENDER'
  | 'CONTENT_EXTRACT'
  | 'DATE_VERIFY'
  | 'SOURCE_VERIFY'
  | 'EVIDENCE_CREATED'
  | 'CROSS_CHECK'
  | 'SUMMARY_ELIGIBLE';

export interface RetrievalTraceStep {
  stage: TraceStage;
  timestamp: string;
  detail: string;
  url?: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'SKIPPED' | 'INFO';
  metadata?: Record<string, any>;
}

export interface DateResolutionContext {
  targetDateISO?: string; // YYYY-MM-DD
  targetDateFormatted?: string;
  targetYear?: number;
  targetMonth?: number;
  targetDay?: number;
  isDateSpecificQuery: boolean;
  timezone: string;
  temporalScope: 'CURRENT_STATUS' | 'HISTORICAL' | 'FUTURE_PREDICTION' | 'TIMELESS';
}

export interface DeepWebRetrievalOptions {
  maxSearchResults?: number;
  maxArticlesToFetch?: number;
  targetDateISO?: string;
  followIndexLinks?: boolean;
  allowJsFallback?: boolean;
  timeoutMs?: number;
  forceFresh?: boolean;
}

export interface DeepWebRetrievalResult {
  success: boolean;
  query: string;
  targetDate?: string;
  articles: ResolvedArticle[];
  events: EventGroup[];
  provenance: ProvenanceObject[];
  trace: RetrievalTraceStep[];
  summaryEligibleCount: number;
  hasSummaryEligibleEvidence: boolean;
  retrievedAt: string;
  statusMessage: string;
  governanceBlock: string;
  evidenceModelText: string;
}
