import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

function getShareIdFromPath(): string | null {
  if (typeof window === 'undefined') return null;
  const match = window.location.pathname.match(/^\/shared\/([^/?#]+)$/i);
  return match ? decodeURIComponent(match[1]) : null;
}

const shellStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#060a16',
  color: '#f8fafc',
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  padding: '24px',
  boxSizing: 'border-box',
};

export default function PublicSharePage() {
  const [html, setHtml] = useState<string | null>(null);
  const [title, setTitle] = useState('Firekeeper Shared Report');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const shareId = getShareIdFromPath();

    if (!shareId || !/^[a-zA-Z0-9_-]{1,128}$/.test(shareId)) {
      setError('ลิงก์แชร์ไม่ถูกต้องหรือไม่มีอยู่');
      return () => { cancelled = true; };
    }

    (async () => {
      try {
        const snapshot = await getDoc(doc(db, 'publicShares', shareId));
        if (cancelled) return;

        if (!snapshot.exists()) {
          setError('ไม่พบรายงานที่แชร์นี้');
          return;
        }

        const record = snapshot.data() as Record<string, any>;
        if (record.isPublic !== true && record.published !== true) {
          setError('รายงานนี้ไม่ได้เปิดเผยต่อสาธารณะแล้ว');
          return;
        }

        const htmlContent = typeof record.htmlContent === 'string' ? record.htmlContent : '';
        if (!htmlContent) {
          setError('ไม่พบเนื้อหา HTML ของรายงาน');
          return;
        }

        setTitle(typeof record.title === 'string' && record.title.trim() ? record.title : 'Firekeeper Shared Report');
        setHtml(htmlContent);
        document.title = typeof record.title === 'string' && record.title.trim() ? record.title : 'Firekeeper Shared Report';
      } catch (err: any) {
        if (!cancelled) {
          console.error('[PUBLIC_SHARE] Firestore read failed:', err);
          setError('ไม่สามารถโหลดรายงานสาธารณะได้ กรุณาลองใหม่อีกครั้ง');
        }
      }
    })();

    return () => { cancelled = true; };
  }, []);

  if (html) {
    return (
      <iframe
        title={title}
        srcDoc={html}
        sandbox="allow-scripts allow-forms allow-modals allow-popups"
        style={{
          display: 'block',
          width: '100vw',
          height: '100vh',
          border: 0,
          margin: 0,
          padding: 0,
          background: '#fff',
        }}
      />
    );
  }

  return (
    <div style={shellStyle}>
      <div style={{ maxWidth: 560, width: '100%', textAlign: 'center', background: '#0b1222', border: '1px solid rgba(148,163,184,.2)', borderRadius: 16, padding: 32, boxSizing: 'border-box' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔥</div>
        <h1 style={{ margin: '0 0 10px', fontSize: 22 }}>{error ? 'ไม่สามารถเปิดรายงาน' : 'กำลังโหลดรายงาน…'}</h1>
        <p style={{ margin: 0, color: '#94a3b8', lineHeight: 1.7 }}>{error || 'กำลังดึงรายงานจากฐานข้อมูลสาธารณะ'}</p>
        {error && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ marginTop: 20, padding: '10px 18px', border: 0, borderRadius: 10, background: '#FF6A00', color: '#000', fontWeight: 700, cursor: 'pointer' }}
          >
            ลองใหม่
          </button>
        )}
      </div>
    </div>
  );
}
