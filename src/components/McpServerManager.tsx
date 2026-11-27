import React, { useCallback, useEffect, useState } from 'react';
import { fetchWithAuthorization } from '../config/authFetch';
type Permission = 'read' | 'write' | 'execute';
type Server = { id: string; name: string; url: string; enabled: boolean; permissions: Permission[] };
export const McpServerManager: React.FC = () => {
  const [servers, setServers] = useState<Server[]>([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [permissions, setPermissions] = useState<Permission[]>(['read']);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const load = useCallback(async () => {
    const res = await fetchWithAuthorization('/api/admin/mcp/servers');
    if (!res.ok) throw new Error('ไม่สามารถโหลดรายการ MCP ได้');
    setServers((await res.json()).servers || []);
  }, []);
  useEffect(() => { void load().catch(e => setNotice(e.message)); }, [load]);
  const request = async (path: string, method: string, body?: unknown) => {
    setBusy(true); setNotice('');
    try {
      const res = await fetchWithAuthorization(path, { method, headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ดำเนินการไม่สำเร็จ');
      await load(); return data;
    } catch (e) { setNotice(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด'); return null; }
    finally { setBusy(false); }
  };
  return <section className="space-y-4 text-sm" aria-label="จัดการ MCP Server">
    <p className="text-xs opacity-70">เฉพาะผู้ดูแลระบบ • Streamable HTTP (HTTPS) • โหมดเตรียมพร้อม: ยังไม่รองรับการเรียกเครื่องมือ MCP จากแชท จึงไม่สามารถเปิดใช้งานเซิร์ฟเวอร์ได้</p>
    <p className="text-xs opacity-70">สิทธิ์ read/write/execute ในหน้านี้เป็นเพียงการตั้งค่าล่วงหน้า ยังไม่อนุญาตให้ AI เรียกเครื่องมือ</p>
    <form className="space-y-2 rounded-xl border border-slate-500/30 p-3" onSubmit={async e => { e.preventDefault(); const result = await request('/api/admin/mcp/servers', 'POST', { name, url, permissions }); if (result) { setName(''); setUrl(''); setNotice('เพิ่มเซิร์ฟเวอร์แล้ว'); } }}>
      <input aria-label="ชื่อ MCP Server" required maxLength={80} value={name} onChange={e => setName(e.target.value)} placeholder="ชื่อเซิร์ฟเวอร์" className="w-full rounded-lg border border-slate-500/40 bg-transparent p-3" />
      <input aria-label="HTTPS Endpoint" required type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/mcp" className="w-full rounded-lg border border-slate-500/40 bg-transparent p-3" />
      <div className="flex flex-wrap gap-3">{(['read','write','execute'] as Permission[]).map(p => <label key={p} className="flex items-center gap-1"><input type="checkbox" checked={permissions.includes(p)} onChange={e => setPermissions(old => e.target.checked ? [...old,p] : old.filter(x => x !== p))} />{p}</label>)}</div>
      <button disabled={busy} className="min-h-11 rounded-lg bg-amber-500 px-4 font-semibold text-black">เพิ่ม MCP Server</button>
    </form>
    {notice && <p role="status" className="text-amber-500">{notice}</p>}
    {servers.map(server => <div key={server.id} className="space-y-2 rounded-xl border border-slate-500/30 p-3">
      <div className="flex items-center justify-between gap-2"><strong className="break-all">{server.name}</strong><label className="flex items-center gap-2"><input type="checkbox" disabled checked={false} title="ยังไม่รองรับการเปิดใช้งาน MCP" />ยังไม่พร้อมใช้งาน</label></div>
      <p className="break-all text-xs opacity-60">{server.url}</p>
      <div className="flex flex-wrap gap-3">{(['read','write','execute'] as Permission[]).map(p => <label key={p} className="flex items-center gap-1"><input type="checkbox" disabled={busy} checked={server.permissions.includes(p)} onChange={e => void request('/api/admin/mcp/servers/'+server.id,'PATCH',{permissions:e.target.checked ? [...server.permissions,p] : server.permissions.filter(x=>x!==p)})} />{p}</label>)}</div>
      <div className="flex gap-2"><button disabled={busy} className="min-h-11 rounded-lg border border-slate-500/40 px-3" onClick={async () => { const data = await request('/api/admin/mcp/servers/'+server.id+'/test','POST'); if(data) setNotice(data.ok ? 'ตอบกลับ HTTP '+data.status+' — ตรวจเฉพาะ Initialize ยังไม่พร้อมใช้เครื่องมือ' : 'ตรวจ Initialize ไม่ผ่าน (HTTP '+data.status+')'); }}>ทดสอบการเชื่อมต่อ</button><button disabled={busy} className="min-h-11 rounded-lg border border-rose-500/40 px-3" onClick={() => { if(window.confirm('ลบเซิร์ฟเวอร์นี้?')) void request('/api/admin/mcp/servers/'+server.id,'DELETE'); }}>ลบ</button></div>
    </div>)}
  </section>;
};
