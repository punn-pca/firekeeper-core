import React, { useEffect, useState } from 'react';

export const BusinessAdminPanel: React.FC<{ isAdmin?: boolean }> = ({ isAdmin = false }) => {
  const [plan, setPlan] = useState('free');
  const [policy, setPolicy] = useState({ allowedProviders: ['deepseek'], approvalRequired: false, restrictedTopics: [] as string[] });
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; created_at?: string; logging_level?: string; user_input?: string }>>([]);
  const canUse = ['business', 'enterprise'].includes(plan);

  const load = async () => {
    const p = await fetch('/api/account/plan', { credentials: 'include' });
    const pd = p.ok ? await p.json() : null;
    const current = isAdmin || pd?.isAdmin === true ? 'enterprise' : String(pd?.plan || 'free');
    setPlan(current);
    if (!['business', 'enterprise'].includes(current)) return;
    const [pr, dr] = await Promise.all([
      fetch('/api/admin/policy', { credentials: 'include' }),
      fetch('/api/admin/governance-dashboard', { credentials: 'include' })
    ]);
    if (pr.ok) { const d = await pr.json(); if (d.policy) setPolicy(d.policy); }
    if (dr.ok) { const d = await dr.json(); if (d.approvalCounts) setStats(d.approvalCounts); }
    const ar = await fetch('/api/admin/audit?limit=20', { credentials: 'include' });
    if (ar.ok) { const d = await ar.json(); setAuditLogs(d.logs || []); }
  };
  useEffect(() => { void load(); }, []);

  const save = async () => {
    const r = await fetch('/api/admin/policy', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(policy) });
    setMessage(r.ok ? 'บันทึก Policy แล้ว' : 'ไม่สามารถบันทึก Policy ได้');
  };
  const addTopic = () => { const value = topic.trim(); if (value && !policy.restrictedTopics.includes(value)) setPolicy({ ...policy, restrictedTopics: [...policy.restrictedTopics, value] }); setTopic(''); };

  return <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
    <div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-widest text-sky-400">Business Governance</p><h2 className="mt-1 text-xl font-bold">Admin Policy & Dashboard</h2></div><span className="rounded-full border border-sky-500/30 px-3 py-1 text-xs text-sky-300">{plan}</span></div>
    {!canUse ? <p className="mt-4 text-sm text-slate-400">ฟีเจอร์นี้ใช้ได้ตั้งแต่แพ็กเกจ Business ขึ้นไป</p> : <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <div className="space-y-4"><div><p className="text-sm font-semibold">Allowed Providers</p><div className="mt-2 flex flex-wrap gap-2">{['deepseek','openai','anthropic','gemini','ollama'].map(provider => <button key={provider} onClick={() => setPolicy({ ...policy, allowedProviders: policy.allowedProviders.includes(provider) ? policy.allowedProviders.filter(p => p !== provider) : [...policy.allowedProviders, provider] })} className={`rounded-full border px-3 py-1 text-xs ${policy.allowedProviders.includes(provider) ? 'border-emerald-400 text-emerald-300' : 'border-white/10 text-slate-500'}`}>{provider}</button>)}</div></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={policy.approvalRequired} onChange={e => setPolicy({ ...policy, approvalRequired: e.target.checked })} /> บังคับ Approval ก่อนใช้ Decision</label>
        <div><p className="text-sm font-semibold">Restricted Topics</p><div className="mt-2 flex gap-2"><input value={topic} onChange={e => setTopic(e.target.value)} placeholder="เช่น financial-risk" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm" /><button onClick={addTopic} className="rounded-lg border border-sky-500/40 px-3 text-sky-300">เพิ่ม</button></div><div className="mt-2 flex flex-wrap gap-2">{policy.restrictedTopics.map(t => <span key={t} className="rounded-full bg-rose-500/10 px-2 py-1 text-xs text-rose-300">{t}</span>)}</div></div>
        <button onClick={save} className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-bold text-black">บันทึก Policy</button>
      </div>
      <div><p className="text-sm font-semibold">Audit Log</p><div className="mt-3 max-h-56 space-y-2 overflow-y-auto">{auditLogs.length ? auditLogs.map(log => <div key={log.id} className="rounded-lg border border-white/10 p-3 text-xs"><div className="flex justify-between gap-2"><span className="text-slate-300">{log.logging_level || 'AUDIT'}</span><span className="text-slate-500">{log.created_at ? new Date(log.created_at).toLocaleString('th-TH') : '-'}</span></div><p className="mt-1 truncate text-slate-400">{log.user_input || log.id}</p></div>) : <p className="text-xs text-slate-500">ยังไม่มี Audit Log</p>}</div></div>
      <div><p className="text-sm font-semibold">Governance Overview</p><div className="mt-3 grid grid-cols-2 gap-3">{[['ทั้งหมด',stats.total],['รอตรวจ',stats.pending],['อนุมัติ',stats.approved],['ปฏิเสธ',stats.rejected]].map(([label,value]) => <div key={String(label)} className="rounded-xl border border-white/10 p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>)}</div></div>
    </div>}
    {message && <p className="mt-3 text-xs text-sky-300">{message}</p>}
  </section>;
};
