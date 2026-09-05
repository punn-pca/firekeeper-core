import React, { Component, ErrorInfo, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { safeLocalStorage, safeSessionStorage } from './utils/safeStorage';
import { safeReload } from './utils/safeLocation';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[FIRE KEEPER] Uncaught React Root Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2.5rem 1.5rem',
          color: '#f8fafc',
          backgroundColor: '#060a16',
          minHeight: '100vh',
          fontFamily: "'IBM Plex Sans Thai', 'Plus Jakarta Sans', system-ui, sans-serif",
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}>
          <div style={{
            maxWidth: '640px',
            width: '100%',
            backgroundColor: '#0b1222',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔥</div>
            <h2 style={{ color: '#fb7185', fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
              เกิดข้อผิดพลาดในการประมวลผล (Application Runtime Notice)
            </h2>
            <p style={{ margin: '0 0 1.25rem 0', color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6 }}>
              ระบบพบข้อขัดข้องชั่วคราวในการโหลดส่วนต่อประสานเชิงโต้ตอบ คุณสามารถรีเฟรชหน้าเว็บ หรือเลือกกลับไปยังหน้าข้อมูลสาธารณะ (Public Information Layer) ได้ทันที
            </p>
            {this.state.error?.message && (
              <pre style={{
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                color: '#fda4af',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                overflowX: 'auto',
                textAlign: 'left',
                margin: '0 0 1.5rem 0'
              }}>
                {this.state.error.message}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => safeReload()}
                style={{
                  padding: '0.65rem 1.25rem',
                  background: '#ff8a00',
                  color: '#000',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.875rem'
                }}
              >
                🔄 รีเฟรชหน้าเว็บ
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    safeLocalStorage.clear();
                    safeSessionStorage.clear();
                  } catch {}
                  safeReload();
                }}
                style={{
                  padding: '0.65rem 1.25rem',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}
              >
                🧹 ล้างแคชและเริ่มใหม่
              </button>
              <a
                href="/"
                style={{
                  padding: '0.65rem 1.25rem',
                  background: 'transparent',
                  color: '#38bdf8',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
              >
                🏠 ไปยังหน้า Public Landing
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function installChatJsonDownload() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if ((window as any).__fireKeeperJsonDownloadInstalled) return;
  (window as any).__fireKeeperJsonDownloadInstalled = true;

  const downloadTurnJson = (turnElement: HTMLElement) => {
    const contentElement = turnElement.querySelector('.markdown-body');
    const content = contentElement?.textContent?.trim() || '';
    const timestamp = turnElement.id.replace('turn-container-', '') || String(Date.now());

    let governedPromptPackage: unknown = null;
    try {
      const parsed = JSON.parse(content);
      if (parsed && parsed.mode === 'GOVERNED_PROMPT') governedPromptPackage = parsed;
    } catch {}

    const payload = {
      schema: 'FIRE_KEEPER_CHAT_EXPORT',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      content,
      timestamp,
      pcaState: null,
      governedPromptPackage,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `FIRE-KEEPER-Turn-${timestamp.replace(/[^a-zA-Z0-9_-]/g, '-')}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const enhanceTurn = (turnElement: Element) => {
    if (!(turnElement instanceof HTMLElement)) return;
    if (turnElement.dataset.fireKeeperJsonReady === 'true') return;
    const actionBar = turnElement.querySelector('[data-export-ignore="true"]');
    if (!(actionBar instanceof HTMLElement)) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.exportIgnore = 'true';
    button.title = 'ดาวน์โหลด JSON';
    button.textContent = '↓ JSON';
    button.className = 'flex-1 sm:flex-none flex items-center justify-center space-x-1 px-3 py-2 rounded-lg border transition-all text-xs cursor-pointer min-h-[40px] bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700';
    button.addEventListener('click', () => downloadTurnJson(turnElement));
    actionBar.appendChild(button);
    turnElement.dataset.fireKeeperJsonReady = 'true';
  };

  const scan = () => document.querySelectorAll('[data-fire-keeper-turn="true"]').forEach(enhanceTurn);
  scan();
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
}

// Global safety net for unhandled errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.warn('[FIRE KEEPER Global Error Catch]:', event.error || event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('[FIRE KEEPER Unhandled Promise Catch]:', event.reason);
  });
}

function mountApplication() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('[FIRE KEEPER Bootstrap]: #root element not found in DOM');
    return;
  }

  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <RootErrorBoundary>
          <App />
        </RootErrorBoundary>
      </StrictMode>
    );
    installChatJsonDownload();
  } catch (err) {
    console.error('[FIRE KEEPER Bootstrap Fatal Mount Error]:', err);
  }
}

// Mount safely
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApplication);
} else {
  mountApplication();
}

