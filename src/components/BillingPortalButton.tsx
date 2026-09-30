import React, { useState } from 'react';
import { fetchWithAuthorization } from '../config/authFetch';

export const BillingPortalButton: React.FC = () => {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const openPortal = async () => {
    setBusy(true); setMessage('');
    try {
      const response = await fetchWithAuthorization('/api/billing/create-portal-session', { method: 'POST' });
      const data = await response.json();
      if (response.ok && data.url) window.location.assign(data.url);
      else setMessage(response.status === 401 ? 'กรุณาเข้าสู่ระบบก่อน' : response.status === 404 ? 'บัญชีนี้ยังไม่มีข้อมูลสมาชิกแบบชำระเงิน' : 'ยังเปิดหน้าจัดการสมาชิกไม่ได้ กรุณาลองใหม่');
    } catch { setMessage('เชื่อมต่อระบบชำระเงินไม่ได้'); }
    finally { setBusy(false); }
  };
  return <div className="mt-6"><button type="button" disabled={busy} onClick={openPortal} className="min-h-11 rounded-lg border border-amber-500/40 px-4 py-2 text-sm text-amber-300 disabled:opacity-50">{busy ? 'กำลังเปิด…' : 'จัดการสมาชิก / วิธีชำระเงิน'}</button>{message && <p role="status" className="mt-2 text-sm text-slate-300">{message}</p>}</div>;
};
