import React, { useEffect, useState } from 'react';

type Workspace = { id: string; name: string; members?: Array<{ userId: string; role: string }> };
type Approval = { id: string; decisionId: string; status: string; requestedBy: string; createdAt: string };

export const TeamWorkspacePanel: React.FC<{ isAdmin?: boolean }> = ({ isAdmin = false }) => {
  const [plan, setPlan] = useState('free');
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [name, setName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [role, setRole] = useState('analyst');
  const [decisionId, setDecisionId] = useState('');
  const [message, setMessage] = useState('');

  const canUse = ['team', 'business', 'enterprise'].includes(plan);
  const load = async () => {
    const p = await fetch('/api/account/plan', { credentials: 'include' });
    const pd = p.ok ? await p.json() : null;
    const currentPlan = isAdmin || pd?.isAdmin === true ? 'enterprise' : String(pd?.plan || 'free');
    setPlan(currentPlan);
    if (!['team', 'business', 'enterprise'].includes(currentPlan)) return;
    const r = await fetch('/api/workspaces', { credentials: 'include' });
    if (!r.ok) return;
    const data = await r.json();
    const first = data.workspaces?.[0] || null;
    setWorkspace(first);
    if (first) {
      const a = await fetch(`/api/workspaces/${first.id}/approvals`, { credentials: 'include' });
      if (a.ok) setApprovals((await a.json()).approvals || []);
    }
  };
  useEffect(() => { void load(); }, []);

  const createWorkspace = async () => {
    setMessage('');
    const r = await fetch('/api/workspaces', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    const data = await r.json();
    if (!r.ok) return setMessage(data.message || data.error || 'สร้าง Workspace ไม่สำเร็จ');
    setName('');
    setMessage('สร้าง Workspace แล้ว');
    await load();
  };

  const addMember = async () => {
    if (!workspace) return;
    const r = await fetch(`/api/workspaces/${workspace.id}/members`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: memberId, role }) });
    const data = await r.json();
    if (!r.ok) return setMessage(data.error || 'เพิ่มสมาชิกไม่สำเร็จ');
    setMemberId('');
    setMessage('เพิ่มสมาชิกแล้ว');
    await load();
  };

  const requestApproval = async () => {
    if (!workspace) return;
    const r = await fetch(`/api/workspaces/${workspace.id}/approvals`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decisionId }) });
    const data = await r.json();
    if (!r.ok) return setMessage(data.error || 'สร้าง Approval ไม่สำเร็จ');
    setDecisionId('');
    setMessage('ส่ง Approval แล้ว');
    await load();
  };

  const review = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    if (!workspace) return;
    await fetch(`/api/workspaces/${workspace.id}/approvals/${id}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    await load();
  };

  return (
    <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-xs uppercase tracking-widest text-amber-400">Team Governance</p><h2 className="mt-1 text-xl font-bold">Workspace & Approval</h2></div>
        <span className="rounded-full border border-amber-500/30 px-3 py-1 text-xs text-amber-300">{plan}</span>
      </div>
      {!canUse ? <p className="mt-4 text-sm text-slate-400">ฟีเจอร์นี้ใช้ได้ตั้งแต่แพ็กเกจ Team ขึ้นไป</p> : !workspace ? (
        <div className="mt-5 flex gap-2"><input value={name} onChange={e => setName(e.target.value)} placeholder="ชื่อ Workspace" className="flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm" /><button onClick={createWorkspace} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-black">สร้าง Workspace</button></div>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div><h3 className="font-semibold">{workspace.name}</h3><p className="mt-1 text-xs text-slate-400">สมาชิก {workspace.members?.length || 0} คน</p>
            <div className="mt-4 flex gap-2"><input value={memberId} onChange={e => setMemberId(e.target.value)} placeholder="User ID สมาชิก" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm" /><select value={role} onChange={e => setRole(e.target.value)} className="rounded-lg border border-white/10 bg-slate-900 px-2 text-sm"><option value="reviewer">Reviewer</option><option value="analyst">Analyst</option><option value="viewer">Viewer</option></select><button onClick={addMember} className="rounded-lg border border-amber-500/40 px-3 text-sm text-amber-300">เพิ่ม</button></div>
          </div>
          <div><h3 className="font-semibold">Approval Queue</h3><div className="mt-3 flex gap-2"><input value={decisionId} onChange={e => setDecisionId(e.target.value)} placeholder="Decision ID" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm" /><button onClick={requestApproval} className="rounded-lg bg-amber-500 px-3 text-sm font-bold text-black">ส่งตรวจ</button></div><div className="mt-3 space-y-2">{approvals.map(a => <div key={a.id} className="flex items-center justify-between rounded-lg border border-white/10 p-3 text-xs"><span>{a.decisionId} · {a.status}</span>{a.status === 'PENDING' && <span className="flex gap-1"><button onClick={() => review(a.id, 'APPROVED')} className="text-emerald-400">อนุมัติ</button><button onClick={() => review(a.id, 'REJECTED')} className="text-rose-400">ตีกลับ</button></span>}</div>)}</div></div>
        </div>
      )}
      {message && <p className="mt-4 text-xs text-amber-300">{message}</p>}
    </section>
  );
};
