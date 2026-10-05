import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Upload, Trash2, RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react';
import { auth } from '../lib/firebase';
import { getApiEndpoint } from '../config/env';
import { useTheme } from '../context/ThemeContext';

type DocumentKind = 'REGULATION' | 'POLICY' | 'SOP' | 'MANUAL' | 'INTERNAL_FILE';

interface DocumentResource {
  id: string;
  filename: string;
  mimeType: string;
  kind: DocumentKind;
  authorityScore: number;
  chunkCount: number;
  createdAt: string;
}

const KIND_LABELS: Record<DocumentKind, string> = {
  REGULATION: 'ระเบียบ / ข้อบังคับ',
  POLICY: 'นโยบาย',
  SOP: 'SOP / วิธีปฏิบัติงาน',
  MANUAL: 'คู่มือ',
  INTERNAL_FILE: 'เอกสารภายในทั่วไป',
};

async function authFetch(path: string, init: RequestInit = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error('กรุณาเข้าสู่ระบบก่อนจัดการคลังเอกสาร');
  const token = await user.getIdToken();
  return fetch(getApiEndpoint(path), {
    ...init,
    headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` },
  });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
    reader.onload = () => {
      const value = String(reader.result || '');
      resolve(value.includes(',') ? value.split(',')[1] : value);
    };
    reader.readAsDataURL(file);
  });
}

export const DocumentResourcesPage: React.FC<{ onOpenAuth?: () => void; onGoToChat?: () => void }> = ({ onOpenAuth, onGoToChat }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const inputRef = useRef<HTMLInputElement>(null);
  const [resources, setResources] = useState<DocumentResource[]>([]);
  const [kind, setKind] = useState<DocumentKind>('MANUAL');
  const [authorityScore, setAuthorityScore] = useState(80);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string>('');

  const load = useCallback(async () => {
    if (!auth.currentUser) return setResources([]);
    setLoading(true);
    try {
      const response = await authFetch('/api/document-resources');
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'โหลดคลังเอกสารไม่สำเร็จ');
      setResources(Array.isArray(data.resources) ? data.resources : []);
    } catch (error: any) {
      setMessage(error?.message || 'โหลดคลังเอกสารไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const uploadFile = async (file: File) => {
    if (!auth.currentUser) { onOpenAuth?.(); return; }
    const allowed = ['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type) && !/\.(pdf|txt|md|docx)$/i.test(file.name)) {
      setMessage('รองรับ PDF, DOCX, TXT และ Markdown');
      return;
    }
    setUploading(true);
    setMessage('');
    try {
      const base64 = await fileToBase64(file);
      const response = await authFetch('/api/document-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attachment: { name: file.name, type: file.type || 'application/octet-stream', size: file.size, base64 },
          kind,
          authorityScore,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'นำเข้าเอกสารไม่สำเร็จ');
      setMessage(`เพิ่ม “${file.name}” เข้าคลังหลักฐานแล้ว`);
      if (inputRef.current) inputRef.current.value = '';
      await load();
    } catch (error: any) {
      setMessage(error?.message || 'นำเข้าเอกสารไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  };

  const remove = async (resource: DocumentResource) => {
    if (!window.confirm(`ลบ “${resource.filename}” ออกจากคลังหลักฐาน?`)) return;
    try {
      const response = await authFetch(`/api/document-resources/${encodeURIComponent(resource.id)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('ลบเอกสารไม่สำเร็จ');
      setResources((current) => current.filter((item) => item.id !== resource.id));
      setMessage(`ลบ “${resource.filename}” แล้ว`);
    } catch (error: any) {
      setMessage(error?.message || 'ลบเอกสารไม่สำเร็จ');
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full p-3 sm:p-6">
      <div className={`rounded-2xl border overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-white/10'}`}>
        <div className="p-5 sm:p-7 border-b border-slate-500/15">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center"><FileText className="w-5 h-5 text-amber-500" /></div>
            <div><h1 className="text-xl sm:text-2xl font-bold">Document Resources</h1><p className="text-xs sm:text-sm text-slate-500 mt-1">คลังเอกสารภายในสำหรับใช้เป็นหลักฐานในการวิเคราะห์</p></div>
          </div>
        </div>

        <div className="p-5 sm:p-7 space-y-5">
          {!auth.currentUser && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-center justify-between gap-3">
              <span className="text-sm">กรุณาเข้าสู่ระบบเพื่อใช้คลังเอกสารส่วนตัว</span>
              <button onClick={onOpenAuth} className="px-3 py-2 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold">เข้าสู่ระบบ</button>
            </div>
          )}

          <div className={`rounded-xl border p-4 sm:p-5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.025] border-white/10'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-3 mb-4">
              <label className="text-xs font-semibold">ประเภทเอกสาร
                <select value={kind} onChange={(e) => setKind(e.target.value as DocumentKind)} className={`mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm ${isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'}`}>
                  {Object.entries(KIND_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold">Authority Score
                <input type="number" min={0} max={100} value={authorityScore} onChange={(e) => setAuthorityScore(Math.max(0, Math.min(100, Number(e.target.value))))} className={`mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm ${isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'}`} />
              </label>
            </div>
            <input ref={inputRef} type="file" accept=".pdf,.docx,.txt,.md,application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && void uploadFile(e.target.files[0])} />
            <button disabled={uploading || !auth.currentUser} onClick={() => inputRef.current?.click()} className="w-full min-h-14 rounded-xl border-2 border-dashed border-amber-500/35 bg-amber-500/5 hover:bg-amber-500/10 disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-semibold">
              {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'กำลังอ่านและจัดทำดัชนี...' : 'เลือก PDF / DOCX / TXT / MD'}
            </button>
            <p className="mt-3 text-[11px] text-slate-500 flex gap-2"><ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />เอกสารแยกตามบัญชีผู้ใช้ และจะถูกใช้เป็น Evidence candidate ไม่ถูกยกเป็น VERIFIED อัตโนมัติ</p>
          </div>

          {message && <div className="text-xs rounded-lg border border-sky-500/20 bg-sky-500/5 p-3 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0 text-sky-500" />{message}</div>}

          <div className="flex items-center justify-between"><h2 className="font-bold text-sm">เอกสารของฉัน <span className="text-slate-500 font-normal">({resources.length})</span></h2><button onClick={() => void load()} disabled={loading} className="p-2 rounded-lg border border-slate-500/20" title="รีเฟรช"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button></div>

          <div className="space-y-2">
            {resources.length === 0 && !loading && <div className="py-10 text-center text-sm text-slate-500">ยังไม่มีเอกสารในคลัง</div>}
            {resources.map((resource) => (
              <div key={resource.id} className={`rounded-xl border p-4 flex items-center gap-3 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                <FileText className="w-5 h-5 text-amber-500 shrink-0" />
                <div className="min-w-0 flex-1"><div className="font-semibold text-sm truncate">{resource.filename}</div><div className="text-[10px] text-slate-500 mt-1">{KIND_LABELS[resource.kind] || resource.kind} · Authority {resource.authorityScore} · {resource.chunkCount} chunks · {new Date(resource.createdAt).toLocaleDateString('th-TH')}</div></div>
                <button onClick={() => void remove(resource)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10" title="ลบเอกสาร"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          {resources.length > 0 && <button onClick={onGoToChat} className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 text-sm">ไปถาม Firekeeper จากเอกสารเหล่านี้ →</button>}
        </div>
      </div>
    </div>
  );
};
