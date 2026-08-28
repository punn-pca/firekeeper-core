import { getAnalytics, isSupported, logEvent, setUserId, setUserProperties, Analytics } from 'firebase/analytics';
import { app } from './firebase';
import config from '../../firebase-applet-config.json';

/**
 * Firebase Analytics & Telemetry Layer for Fire Keeper
 * Strictly respects user privacy (Zero-PII transmission)
 */

let analyticsInstance: Analytics | null = null;
let isInitAttempted = false;

export async function initAnalytics(): Promise<Analytics | null> {
  if (isInitAttempted) return analyticsInstance;
  isInitAttempted = true;

  if (typeof window === 'undefined') return null;

  try {
    const supported = await isSupported();
    // Only initialize if supported and measurementId is present (or in development/preview)
    const measurementId = config.measurementId || (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID;

    if (supported) {
      try {
        if (measurementId) {
          analyticsInstance = getAnalytics(app);
          console.log('[Analytics] Firebase Analytics (GA4) initialized successfully with Measurement ID:', measurementId);
        } else {
          // Safe fallback without measurement ID
          try {
            analyticsInstance = getAnalytics(app);
            console.log('[Analytics] Firebase Analytics initialized with default app instance.');
          } catch (e) {
            console.info('[Analytics] Firebase Analytics ready (measurementId not yet configured in console).');
          }
        }
      } catch (networkErr) {
        console.info('[Analytics] Firebase Analytics network fetch blocked or unavailable in sandbox environment (ignored safely).');
        analyticsInstance = null;
      }
    } else {
      console.info('[Analytics] Firebase Analytics is not supported in this runtime environment (e.g. cookies disabled or sandboxed).');
    }
  } catch (err) {
    console.warn('[Analytics] Graceful catch: Failed to initialize Firebase Analytics:', err);
    analyticsInstance = null;
  }

  return analyticsInstance;
}

// Auto-initialize analytics asynchronously
initAnalytics().catch(() => {});

/**
 * Associate authenticated user UID with Analytics user identity
 * CRITICAL: Strictly uses Firebase UID only. Never transmits email or PII.
 */
export function identifyUserInAnalytics(uid: string | null): void {
  try {
    if (!analyticsInstance) return;
    if (uid) {
      setUserId(analyticsInstance, uid);
      setUserProperties(analyticsInstance, {
        user_type: 'authenticated_member',
      });
    } else {
      setUserId(analyticsInstance, null as any);
    }
  } catch (err) {
    console.warn('[Analytics] Safe catch in identifyUserInAnalytics:', err);
  }
}

/**
 * Generic safe event logging function
 */
export function trackEvent(eventName: string, eventParams?: Record<string, any>): void {
  try {
    if (analyticsInstance) {
      logEvent(analyticsInstance, eventName, eventParams);
    }
    if ((import.meta as any).env?.DEV) {
      console.log(`[Analytics Event] 📊 ${eventName}`, eventParams || '');
    }
  } catch (err) {
    console.warn(`[Analytics] Failed to log event ${eventName}:`, err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Specific strongly-typed event trackers (Strictly Zero-PII)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. signup event
 */
export function trackSignUp(method: 'email_password' | 'google' | 'other' = 'email_password'): void {
  trackEvent('signup', {
    method,
    timestamp: Date.now(),
  });
}

/**
 * 2. login event
 */
export function trackLogin(method: 'email_password' | 'google' | 'other' = 'email_password'): void {
  trackEvent('login', {
    method,
    timestamp: Date.now(),
  });
}

/**
 * 3. logout event
 */
export function trackLogout(): void {
  trackEvent('logout', {
    timestamp: Date.now(),
  });
}

/**
 * 4. analysis_started event
 * Transmits only metadata (counts, flags, profiles) - NO prompt texts or confidential files
 */
export function trackAnalysisStarted(params: {
  tone?: string;
  deepReasoning?: boolean;
  reasoningProfile?: string;
  attachmentCount?: number;
  hasPdf?: boolean;
}): void {
  trackEvent('analysis_started', {
    tone: params.tone || 'balanced',
    deep_reasoning: !!params.deepReasoning,
    reasoning_profile: params.reasoningProfile || 'executive',
    attachment_count: params.attachmentCount || 0,
    has_pdf: !!params.hasPdf,
    timestamp: Date.now(),
  });
}

/**
 * 5. analysis_completed event
 */
export function trackAnalysisCompleted(params: {
  tone?: string;
  deepReasoning?: boolean;
  reasoningProfile?: string;
  totalTokens?: number;
  isPdf?: boolean;
  durationMs?: number;
}): void {
  trackEvent('analysis_completed', {
    tone: params.tone || 'balanced',
    deep_reasoning: !!params.deepReasoning,
    reasoning_profile: params.reasoningProfile || 'executive',
    total_tokens: params.totalTokens || 0,
    is_pdf: !!params.isPdf,
    duration_ms: params.durationMs || 0,
    timestamp: Date.now(),
  });
}

/**
 * 6. analysis_failed event
 */
export function trackAnalysisFailed(params: {
  errorType: string;
  errorCode?: string;
}): void {
  trackEvent('analysis_failed', {
    error_type: params.errorType,
    error_code: params.errorCode || 'UNKNOWN',
    timestamp: Date.now(),
  });
}

/**
 * 7. pdf_uploaded event
 * Strictly no PDF content, only sanitized size & file count metrics
 */
export function trackPdfUploaded(params: {
  fileSizeKb?: number;
  count?: number;
}): void {
  trackEvent('pdf_uploaded', {
    file_size_kb: Math.round(params.fileSizeKb || 0),
    file_count: params.count || 1,
    timestamp: Date.now(),
  });
}

/**
 * 8. question_submitted event
 * Strictly records character length and flags, NEVER the actual private question string
 */
export function trackQuestionSubmitted(params: {
  questionLength: number;
  hasAttachments: boolean;
}): void {
  trackEvent('question_submitted', {
    question_length: params.questionLength,
    has_attachments: params.hasAttachments,
    timestamp: Date.now(),
  });
}

/**
 * 9. page_view event
 */
export function trackPageView(pageTitle: string, pagePath: string): void {
  trackEvent('page_view', {
    page_title: pageTitle,
    page_location: pagePath,
    timestamp: Date.now(),
  });
}
