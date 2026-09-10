import React, { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, ExternalLink, Share2, Globe, ShieldAlert, Lock, RefreshCw, Twitter } from 'lucide-react';
import { ConversationTurn, PCAState } from '../types';
import { generateHtmlChatReport } from '../utils/exportUtils';
import { APP_CONFIG } from '../config/env';
import { useTheme } from '../context/ThemeContext';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getPublicShareUrl } from '../shared/shareUtils';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  turn: ConversationTurn;
  pcaState: PCAState | null;
  analysisSeqNum: number;
  targetElementId: string;
}

type ShareStatus = 'unpublished' | 'publishing' | 'published' | 'unpublishing' | 'error';

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeoutMs))
  ]);
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  turn,
  pcaState,
  analysisSeqNum,
  targetElementId,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [status, setStatus] = useState<ShareStatus>('publishing');
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [storageUploaded, setStorageUploaded] = useState<boolean>(false);
  const [firestorePersisted, setFirestorePersisted] = useState<boolean>(false);
  const [isSharingToX, setIsSharingToX] = useState<boolean>(false);
  const [xSharedSuccess, setXSharedSuccess] = useState<boolean>(false);

  const publishingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sharingToXRef = useRef<boolean>(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setXSharedSuccess(false);
      return;
    }

    if (publishingRef.current) return;

    // Reset publishing states when modal is opened afresh
    setStatus('publishing');
    setPublicUrl(null);
    setShareId(null);
    setErrorMessage(null);
    setStorageUploaded(false);
    setFirestorePersisted(false);
    setXSharedSuccess(false);

    executePublish();
  }, [isOpen]);

  const executePublish = async () => {
    if (publishingRef.current) return;
    publishingRef.current = true;

    console.log('[SHARE_PUBLISH] START');

    if (!auth.currentUser) {
      console.warn('[SHARE_PUBLISH] ERROR: Authentication required - currentUser is null');
      setStatus('error');
      setErrorMessage('กรุณาเข้าสู่ระบบก่อนแชร์รายงาน HTML (Authentication Required)');
      publishingRef.current = false;
      return;
    }

    setStatus('publishing');
    setErrorMessage(null);

    // Create abort controller for fetch request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      console.log('[SHARE_PUBLISH] HTML_GENERATION: Generating HTML report...');
      const htmlContent = await withTimeout(
        generateHtmlChatReport(
          [turn],
          pcaState,
          [],
          undefined,
          `FIRE-KEEPER-Turn-${turn.timestamp || Date.now()}`,
          analysisSeqNum,
          targetElementId
        ),
        10000,
        'ไม่สามารถสร้างรายงาน HTML ได้ภายในเวลาที่กำหนด'
      );

      if (!isMountedRef.current) return;
      console.log('[SHARE_PUBLISH] HTML_GENERATION: SUCCESS, length:', htmlContent?.length || 0);

      const title = `Firekeeper Report #${analysisSeqNum}`;
      const proposedShareId = `share-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;

      // Client-side Firestore direct persistence (Non-blocking background attempt)
      let clientFirestoreSuccess = false;
      if (db && auth.currentUser) {
        console.log('[SHARE_PUBLISH] FIREBASE: Attempting background Client SDK Firestore write...');
        setDoc(doc(db, 'publicShares', proposedShareId), {
          shareId: proposedShareId,
          ownerId: auth.currentUser.uid,
          storagePath: `public-html/${auth.currentUser.uid}/${proposedShareId}/index.html`,
          title,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isPublic: true,
          published: true,
          contentType: 'text/html',
          htmlContent,
          source: 'firestore',
          storageUploaded: false
        }, { merge: true }).then(() => {
          console.log('[SHARE_PUBLISH] FIREBASE: Background Client SDK Firestore write SUCCESS');
          clientFirestoreSuccess = true;
        }).catch((err) => {
          console.warn('[SHARE_PUBLISH] FIREBASE: Background Client SDK Firestore write FAILED:', err?.message || err);
        });
      }

      console.log('[SHARE_PUBLISH] BACKEND: Preparing backend /api/shares/publish request...');
      let idToken = '';
      try {
        idToken = await withTimeout(
          auth.currentUser.getIdToken(),
          5000,
          'การเชื่อมต่อเพื่อยืนยันตัวตนล้มเหลว (Token generation timed out)'
        );
      } catch (tokenErr: any) {
        console.warn('[SHARE_PUBLISH] ERROR: Failed to obtain ID token:', tokenErr?.message);
        if (isMountedRef.current) {
          setStatus('error');
          setErrorMessage(tokenErr?.message || 'การเชื่อมต่อเพื่อยืนยันตัวตนล้มเหลว');
        }
        publishingRef.current = false;
        return;
      }

      if (!isMountedRef.current) return;

      const publishUrl = APP_CONFIG.API_BASE_URL.replace(/\/+$/, '') === '/api'
        ? '/api/shares/publish'
        : `${APP_CONFIG.API_BASE_URL.replace(/\/+$/, '')}/api/shares/publish`;

      console.log('[SHARE_PUBLISH] BACKEND: Sending POST request to', publishUrl);

      const timeoutId = setTimeout(() => controller.abort(), 45000);

      try {
        const response = await fetch(publishUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            htmlContent,
            title,
            shareId: proposedShareId,
            clientFirestorePersisted: clientFirestoreSuccess
          }),
          signal: controller.signal
        });

        if (!isMountedRef.current) return;

        console.log('[SHARE_PUBLISH] BACKEND: Received status', response.status);
        let result: any = {};
        const responseText = await response.text().catch(() => '');
        try {
          result = responseText ? JSON.parse(responseText) : {};
        } catch (parseErr) {
          console.warn('[SHARE_PUBLISH] BACKEND: Response is not JSON:', responseText.slice(0, 200));
          result = { error: `HTTP ${response.status}: ${response.statusText || 'Non-JSON server response'}` };
        }

        const isSuccess = response.ok === true &&
          result.success === true &&
          result.published === true &&
          Boolean(result.shareId);

        if (isSuccess) {
          console.log('[SHARE_PUBLISH] SUCCESS:', result);

          const isProduction = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production' 
            || (import.meta as any).env?.PROD 
            || (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1'));

          const canonicalUrl = result.publicUrl || getPublicShareUrl(result.shareId);

          if (isProduction) {
            try {
              const urlObj = new URL(canonicalUrl);
              if (urlObj.hostname !== 'firekeeper.site') {
                throw new Error(`Invalid hostname: ${urlObj.hostname}. Expected: firekeeper.site`);
              }
            } catch (urlErr: any) {
              const errorMsg = `ข้อผิดพลาดด้านระบบรักษาความปลอดภัย: เซิร์ฟเวอร์ส่งโดเมนที่ไม่ถูกต้องกลับมา (${urlErr.message})`;
              console.error('[SHARE_PUBLISH] ERROR:', errorMsg);
              setStatus('error');
              setErrorMessage(errorMsg);
              return;
            }
          }

          setStatus('published');
          setShareId(result.shareId);
          setPublicUrl(canonicalUrl);

          setStorageUploaded(Boolean(result.storageUploaded));
          setFirestorePersisted(Boolean(result.firestorePersisted || clientFirestoreSuccess));
          setErrorMessage(null);
        } else {
          const errorMsg = result.message || result.error || `เกิดข้อผิดพลาดในการเผยแพร่ (HTTP ${response.status})`;
          console.error('[SHARE_PUBLISH] ERROR:', errorMsg);
          setStatus('error');
          setErrorMessage(errorMsg);
        }
      } catch (fetchErr: any) {
        if (!isMountedRef.current) return;
        if (fetchErr.name === 'AbortError') {
          console.error('[SHARE_PUBLISH] ERROR: Request timed out');
          setStatus('error');
          setErrorMessage('การเผยแพร่ใช้เวลานานเกินกำหนด กรุณาลองใหม่อีกครั้ง');
        } else {
          console.error('[SHARE_PUBLISH] ERROR:', fetchErr);
          setStatus('error');
          setErrorMessage(fetchErr?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
        }
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err: any) {
      console.error('[SHARE_PUBLISH] ERROR:', err);
      if (isMountedRef.current) {
        setStatus('error');
        setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการเผยแพร่');
        setPublicUrl(null);
      }
    } finally {
      publishingRef.current = false;
      if (isMountedRef.current) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleUnpublish = async () => {
    if (!shareId) return;
    console.log('[SHARE DEBUG] unpublish clicked', { shareId });
    setStatus('unpublishing');
    setErrorMessage(null);

    // Client-side Firestore update (background attempt)
    if (db && auth.currentUser) {
      const docRef = doc(db, 'publicShares', shareId);
      setDoc(docRef, { isPublic: false, published: false, updatedAt: new Date().toISOString() }, { merge: true })
        .then(() => console.log('[SHARE DEBUG] client unpublish firestore: success'))
        .catch((e) => console.warn('[SHARE DEBUG] client unpublish firestore warning:', e?.message));
    }

    try {
      let idToken = '';
      try {
        idToken = await auth.currentUser?.getIdToken() || '';
      } catch {}

      const unpublishUrl = APP_CONFIG.API_BASE_URL.replace(/\/+$/, '') === '/api'
        ? '/api/shares/unpublish'
        : `${APP_CONFIG.API_BASE_URL.replace(/\/+$/, '')}/api/shares/unpublish`;

      const response = await fetch(unpublishUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({ shareId }),
      });

      if (!isMountedRef.current) return;

      if (response.ok) {
        console.log('[SHARE DEBUG] frontend unpublish state: unpublished');
        setStatus('unpublished');
        setPublicUrl(null);
      } else {
        throw new Error('Unpublish confirmation failed');
      }
    } catch (err: any) {
      console.error('[SHARE DEBUG] unpublish error', err);
      if (isMountedRef.current) {
        setStatus('unpublished');
        setPublicUrl(null);
      }
    }
  };

  const handleShareToX = async () => {
    if (!shareId || !publicUrl) return;
    if (sharingToXRef.current) return;

    sharingToXRef.current = true;
    setIsSharingToX(true);
    setXSharedSuccess(false);
    setErrorMessage(null);

    console.log('[SHARE_X] START:', { shareId });

    try {
      if (!auth.currentUser) {
        throw new Error('กรุณาเข้าสู่ระบบก่อนใช้งาน X API (Authentication Required)');
      }

      console.log('[SHARE_X] Obtaining ID token...');
      const idToken = await withTimeout(
        auth.currentUser.getIdToken(),
        5000,
        'การเชื่อมต่อเพื่อยืนยันตัวตนล้มเหลว (Token generation timed out)'
      );

      const xUrl = APP_CONFIG.API_BASE_URL.replace(/\/+$/, '') === '/api'
        ? '/api/shares/x'
        : `${APP_CONFIG.API_BASE_URL.replace(/\/+$/, '')}/api/shares/x`;

      console.log('[SHARE_X] API_REQUEST:', { xUrl });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(xUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ shareId }),
          signal: controller.signal
        });

        if (!isMountedRef.current) return;

        const responseText = await response.text().catch(() => '');
        let result: any = {};
        try {
          result = responseText ? JSON.parse(responseText) : {};
        } catch {
          result = { error: `HTTP ${response.status}: ${response.statusText}` };
        }

        if (response.ok && result.success) {
          console.log('[SHARE_X] SUCCESS:', result);
          setXSharedSuccess(true);
          if (result.postUrl) {
            window.open(result.postUrl, '_blank');
          }
        } else {
          const errMsg = result.message || result.error || 'เกิดข้อผิดพลาดในการแชร์ไปยัง X';
          throw new Error(errMsg);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err: any) {
      console.error('[SHARE_X] ERROR:', err?.message || err);
      if (isMountedRef.current) {
        setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการแชร์ไปยัง X');
      }
    } finally {
      sharingToXRef.current = false;
      if (isMountedRef.current) {
        setIsSharingToX(false);
      }
    }
  };

  const handleCopy = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrorMessage('ไม่สามารถคัดลอกลิงก์ได้');
    }
  };

  if (!isOpen) return null;

  const isPublished = status === 'published' && Boolean(publicUrl);
  const isPublishing = status === 'publishing';
  const isUnpublishing = status === 'unpublishing';
  const isUnpublished = status === 'unpublished';
  const isError = status === 'error' && !firestorePersisted;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div 
        className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative overflow-hidden transition-all ${
          isLight 
            ? 'bg-white/90 border-slate-200 text-[#172033]' 
            : 'bg-slate-900/90 border-slate-700/80 text-white'
        }`}
        style={{
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 35%, rgba(255,255,255,0.00) 60%, rgba(255,255,255,0.04) 100%)'
        }}
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-500">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Share HTML Report</h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                เผยแพร่รายงานผ่าน Firebase Storage (เข้าถึงได้โดยไม่ต้อง Login)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-colors ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {(isPublishing || isUnpublishing) ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
            <p className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              {isPublishing ? 'กำลังเผยแพร่และตรวจสอบสถานะ Firebase...' : 'กำลังยกเลิกการเผยแพร่...'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  สถานะการเผยแพร่ (Firebase Verified)
                </span>
                <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] flex items-center space-x-1 ${
                  isPublished 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : isError 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  <Globe className="w-3 h-3" />
                  <span>{isPublished ? 'Public Active' : isError ? 'Error / Unpublished' : 'Unpublished'}</span>
                </span>
              </div>

              {isPublished && publicUrl ? (
                <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 font-mono text-xs ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950/60 border-slate-800 text-slate-200'
                }`}>
                  <span className="truncate select-all">{publicUrl}</span>
                  <span className="text-[10px] text-emerald-500 font-sans shrink-0">Live</span>
                </div>
              ) : (
                <div className={`p-4 rounded-xl border text-center text-xs ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950/40 border-slate-800 text-slate-400'
                }`}>
                  <Lock className="w-5 h-5 mx-auto mb-1 opacity-50 text-amber-500" />
                  {isError ? 'การเผยแพร่ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' : 'ยังไม่ได้เผยแพร่ (Unpublished)'}
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                {isPublished && publicUrl && (
                  <>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                        copied
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : isLight
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-500" />}
                      <span>{copied ? 'Copied' : 'Copy Link'}</span>
                    </button>

                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                        isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                    >
                      <ExternalLink className="w-4 h-4 text-amber-500" />
                      <span>Open</span>
                    </a>

                    <button
                      type="button"
                      disabled={isSharingToX}
                      onClick={handleShareToX}
                      className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                        isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      } ${isSharingToX ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      <Twitter className="w-4 h-4 text-sky-500" />
                      <span>{isSharingToX ? 'Sharing...' : (xSharedSuccess ? 'Shared to X' : 'Share to X')}</span>
                    </button>
                  </>
                )}
              </div>

              <div>
                {isPublished ? (
                  <button
                    type="button"
                    onClick={handleUnpublish}
                    className="px-3.5 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-all cursor-pointer"
                  >
                    Unpublish
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={executePublish}
                    className="px-3.5 py-2 rounded-xl border border-amber-500/30 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-medium transition-all cursor-pointer"
                  >
                    Publish Report
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
