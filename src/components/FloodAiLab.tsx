import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchWithAuthorization } from '../config/authFetch';
import { ArrowLeft, CloudRain, Map, RefreshCw, ShieldAlert, Sparkles, Wind } from 'lucide-react';

type WeatherState = any;

export const FloodAiLab: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [location, setLocation] = useState('');
  const [locationChoices, setLocationChoices] = useState<any[]>([]);
  const [weather, setWeather] = useState<WeatherState>(null);
  const [analysis, setAnalysis] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [followUp, setFollowUp] = useState(''); const [followUpLoading, setFollowUpLoading] = useState(false);
  const [hydrology, setHydrology] = useState<any>(null); const [hydrologyLoading, setHydrologyLoading] = useState(false);

  const loadWeather = async () => {
    const name = location.trim();
    if (name.length < 2) { setStatus('กรุณาระบุจังหวัดหรืออำเภอ'); return; }
    setLoading(true); setStatus('กำลังค้นหาพิกัดและพยากรณ์อากาศ…'); setAnalysis('');
    try {
      const response = await fetchWithAuthorization('/api/flood/weather', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'ไม่สามารถดึงข้อมูลได้');
      setWeather(data); setStatus(`อัปเดตข้อมูลแล้ว · ${new Date(data.retrievedAt || Date.now()).toLocaleString('th-TH')}`);
    } catch (error: any) {
      setWeather(null); setStatus(error?.message || 'ดึงข้อมูลไม่สำเร็จ');
    } finally { setLoading(false); }
  };

  const loadHydrology = async () => {
    setHydrologyLoading(true);
    try {
      const response = await fetchWithAuthorization('/api/flood/hydrology', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'ดึงข้อมูลอุทกวิทยาไม่สำเร็จ');
      setHydrology(data);
    } catch (error: any) { setStatus(error?.message || 'ดึงข้อมูลอุทกวิทยาไม่สำเร็จ'); }
    finally { setHydrologyLoading(false); }
  };

  const analyze = async () => {
    if (!weather) { setStatus('ต้องดึงข้อมูลพื้นที่ก่อนให้ AI วิเคราะห์'); return; }
    setAnalyzing(true); setAnalysis('');
    try {
      const response = await fetchWithAuthorization('/api/flood/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, weather, risk: 'คัดกรองจากข้อมูลอากาศ' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'AI วิเคราะห์ไม่สำเร็จ');
      setAnalysis(typeof data.analysis === 'string' ? data.analysis : JSON.stringify(data.analysis || 'ไม่พบผลวิเคราะห์', null, 2));
    } catch (error: any) { setAnalysis(error?.message || 'AI วิเคราะห์ไม่สำเร็จ'); }
    finally { setAnalyzing(false); }
  };

  const askFollowUp = async () => {
    if (!followUp.trim() || !analysis) return;
    setFollowUpLoading(true);
    try {
      const response = await fetchWithAuthorization('/api/flood/follow-up', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: followUp, context: analysis }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'ต่อยอดรายงานไม่สำเร็จ');
      setAnalysis(data.response || analysis); setFollowUp('');
    } catch (error: any) { setStatus(error?.message || 'ต่อยอดรายงานไม่สำเร็จ'); }
    finally { setFollowUpLoading(false); }
  };

  const publishAnalysis = async () => {
    if (!analysis || !weather) { setStatus('ต้องให้ AI วิเคราะห์ก่อนสร้างโพสต์'); return; }
    setPublishing(true); setStatus('กำลังสร้าง Preview บทความ…');
    try {
      const response = await fetchWithAuthorization('/api/admin/articles/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic: `วิเคราะห์สถานการณ์น้ำท่วม ${weather.location?.name || location}`, sourceText: analysis, language: 'th' }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'สร้าง Preview ไม่สำเร็จ');
      setPreview(data); setStatus('ตรวจสอบ Preview ก่อนเผยแพร่');
    } catch (error: any) { setStatus(error?.message || 'สร้าง Preview ไม่สำเร็จ'); }
    finally { setPublishing(false); }
  };

  const confirmPublish = async () => {
    if (!preview) return;
    setPublishing(true); setPublishError(''); setStatus('กำลังเผยแพร่บทความ…');
    try {
      const response = await fetchWithAuthorization('/api/admin/articles/publish', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Refresh-Token': 'true' }, body: JSON.stringify({ title: preview.title, slug: preview.slug, markdown: preview.markdown }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'เผยแพร่บทความไม่สำเร็จ');
      setPreview(null); setStatus(data.url ? `เผยแพร่แล้ว: ${data.url}` : 'เผยแพร่บทความแล้ว');
    } catch (error: any) { const message = error?.message || 'เผยแพร่บทความไม่สำเร็จ'; setPublishError(message); setStatus(message); }
    finally { setPublishing(false); }
  };

  const current = weather?.current;
  const daily = weather?.daily;
  const lat = Number(weather?.location?.latitude);
  const lon = Number(weather?.location?.longitude);
  const mapSrc = Number.isFinite(lat) && Number.isFinite(lon)
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.15}%2C${lat - 0.15}%2C${lon + 0.15}%2C${lat + 0.15}&layer=mapnik&marker=${lat}%2C${lon}`
    : '';
  const rain24 = Number(daily?.precipitation_sum?.[0] || 0);
  const floodRisk = !weather ? 'ยังไม่มีข้อมูล' : rain24 >= 100 ? 'วิกฤต' : rain24 >= 50 ? 'เฝ้าระวังพิเศษ' : rain24 >= 20 ? 'ปานกลาง' : 'ต่ำ';
  const riskClass = floodRisk === 'วิกฤต' ? 'border-red-400/60 bg-red-400/10 text-red-200' : floodRisk === 'เฝ้าระวังพิเศษ' ? 'border-amber-400/60 bg-amber-400/10 text-amber-200' : floodRisk === 'ปานกลาง' ? 'border-yellow-400/60 bg-yellow-400/10 text-yellow-200' : 'border-emerald-400/60 bg-emerald-400/10 text-emerald-200';
  const hydrologyRows = (hydrology?.sources || []).flatMap((source: any) => {
    const rawRows = Array.isArray(source.data?.data) ? source.data.data : Array.isArray(source.data) ? source.data : [];
    const rows = rawRows.flatMap((group: any) => {
      if (Array.isArray(group?.dam)) return group.dam.map((row: any) => ({ ...row, region: group.region }));
      if (Array.isArray(group?.reservoir)) return group.reservoir.map((row: any) => ({ ...row, region: group.region }));
      if (Array.isArray(group?.stations)) return group.stations.map((row: any) => ({ ...row, region: group.region }));
      return group && (group.name || group.id) ? [group] : [];
    });
    return rows.slice(0, 12).map((row: any) => ({ ...row, source: source.name }));
  });

  return <div className="min-h-screen bg-slate-950 text-slate-100">
    <header className="border-b border-slate-800 bg-slate-950/95">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4">
        <button onClick={onBack} className="rounded-lg border border-slate-700 p-2"><ArrowLeft className="h-4 w-4" /></button>
        <CloudRain className="h-6 w-6 text-cyan-400" />
        <div><div className="text-xs font-mono tracking-widest text-cyan-400">FIREKEEPER · FLOOD AI</div><h1 className="text-xl font-black">Flood Situation Dashboard</h1></div>
      </div>
    </header>
    {preview&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"><div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl border border-slate-700 bg-slate-900 p-5"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black">Preview ก่อนเผยแพร่</h2><button onClick={()=>setPreview(null)} className="text-slate-400">ปิด</button></div><h3 className="mt-5 text-lg font-bold">{preview.title}</h3><div className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-950 p-4 text-sm leading-7 text-slate-200">{preview.markdown}</div><div className="mt-4 text-xs text-slate-500">ผู้เขียน: FIREKEEPER · แหล่งต้นฉบับ: ผลวิเคราะห์จาก Flood AI Lab</div>{publishError&&<div className="mt-4 rounded-lg border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-200">{publishError}</div>}<div className="mt-5 flex justify-end gap-2"><button type="button" onClick={()=>setPreview(null)} className="rounded-xl border border-slate-700 px-4 py-2">แก้ไขภายหลัง</button><button type="button" onClick={()=>void confirmPublish()} disabled={publishing} className="rounded-xl bg-amber-400 px-4 py-2 font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60">{publishing?'กำลังเผยแพร่…':'Publish'}</button></div></div></div>}
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      {floodRisk === 'วิกฤต' && <div className="rounded-xl border border-red-400/70 bg-red-500/15 p-4 text-red-100"><div className="font-black">แจ้งเตือนความเสี่ยงสูง</div><div className="mt-1 text-sm">ปริมาณฝนคาดการณ์ 24 ชั่วโมงอยู่ในระดับที่ควรติดตามประกาศจากหน่วยงานรัฐและเตรียมแผนฉุกเฉิน</div></div>}
      <section className="grid gap-4 md:grid-cols-3">
        <div className={`rounded-xl border p-4 ${riskClass}`}><div className="text-xs uppercase tracking-wider opacity-70">สถานะคัดกรอง</div><div className="mt-2 text-2xl font-black">{floodRisk}</div><div className="mt-1 text-xs opacity-70">ประเมินจากฝนคาดการณ์เท่านั้น</div></div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><div className="text-xs text-slate-500">Executive Summary</div><div className="mt-2 text-sm leading-6 text-slate-300">{!weather ? 'ค้นหาพื้นที่เพื่อเริ่มติดตาม' : `พื้นที่ ${weather.location?.name || location} มีฝนคาดการณ์ประมาณ ${rain24} มม. ใน 24 ชั่วโมงถัดไป ควรตรวจสอบระดับน้ำและประกาศทางการประกอบ`}</div></div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><div className="text-xs text-slate-500">ผู้รับผิดชอบการยืนยัน</div><div className="mt-2 text-sm leading-6 text-slate-300">หน่วยงานพื้นที่และผู้มีอำนาจตัดสินใจต้องยืนยันก่อนแจ้งเตือนหรือสั่งการ</div></div>
      </section>
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input value={location} onChange={e => setLocation(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void loadWeather(); }} placeholder="ค้นหาจังหวัดหรืออำเภอ เช่น อุบลราชธานี" className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3" />

          <button onClick={() => void loadWeather()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />{loading ? 'กำลังดึงข้อมูล' : 'ดึงข้อมูลพื้นที่'}</button>
        </div>
        {locationChoices.length > 1 && <div className="mt-3 rounded-lg border border-slate-700 bg-slate-950/70 p-3"><div className="mb-2 text-xs text-slate-400">พื้นที่ที่พบจากการค้นหา ({locationChoices.length})</div><div className="flex flex-wrap gap-2">{locationChoices.map((place: any, index: number) => <button key={`${place.latitude}-${place.longitude}-${index}`} type="button" onClick={() => setLocation(place.name)} className="rounded-lg border border-slate-700 px-3 py-2 text-left text-xs hover:border-cyan-400"><span className="block text-cyan-300">{place.name}</span><span className="text-slate-500">{place.admin1 || place.country || 'พื้นที่'}</span></button>)}</div></div>}
        {status && <div className="mt-3 text-sm text-slate-400">{status}}
      </section>

      {!weather && <section className="rounded-2xl border border-dashed border-slate-700 p-12 text-center"><Map className="mx-auto h-10 w-10 text-slate-600" /><h2 className="mt-4 text-xl font-bold">เริ่มจากเลือกพื้นที่</h2><p className="mt-2 text-sm text-slate-500">ระบบจะหาพิกัดและดึงพยากรณ์อากาศจริงก่อนแสดง Dashboard</p></section>}

      {weather && <><section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/5 p-5"><div className="text-sm text-slate-400">พื้นที่</div><div className="mt-2 text-xl font-black">{weather.location?.name}</div><div className="mt-1 text-xs text-slate-500">{weather.location?.admin1 || weather.location?.country}</div></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><div className="text-sm text-slate-400">อุณหภูมิ</div><div className="mt-2 text-3xl font-black">{current?.temperature_2m ?? '-'}°C</div><div className="mt-1 text-xs text-slate-500">ความชื้น {current?.relative_humidity_2m ?? '-'}%</div></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><div className="text-sm text-slate-400">ฝนขณะนี้</div><div className="mt-2 text-3xl font-black">{current?.precipitation ?? 0}<span className="text-base"> มม.</span></div><div className="mt-1 text-xs text-slate-500">ลม {current?.wind_speed_10m ?? 0} กม./ชม.</div></div>
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5"><div className="text-sm text-slate-400">สถานะข้อมูล</div><div className="mt-2 text-xl font-black text-amber-300">อัปเดตแล้ว</div><div className="mt-1 text-xs text-slate-500">ยังไม่มีระดับน้ำจากเซนเซอร์</div></div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60"><div className="flex items-center gap-2 border-b border-slate-800 p-4 font-bold"><Map className="h-4 w-4 text-cyan-400" />แผนที่พื้นที่</div>{mapSrc ? <iframe title="แผนที่พื้นที่" src={mapSrc} className="h-[360px] w-full" loading="lazy" /> : <div className="p-12 text-center text-slate-500">ไม่มีพิกัด</div>}</div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><h2 className="flex items-center gap-2 font-bold"><CloudRain className="h-4 w-4 text-cyan-400" />พยากรณ์ 3 วัน</h2><div className="mt-4 space-y-3">{daily?.time?.slice(0, 3).map((day: string, i: number) => <div key={day} className="flex items-center justify-between rounded-xl border border-slate-800 p-3 text-sm"><span>{day}</span><span>สูง {daily.temperature_2m_max?.[i]}° / ต่ำ {daily.temperature_2m_min?.[i]}°</span><span className="text-cyan-300">{daily.precipitation_sum?.[i] ?? 0} มม.</span></div>)}</div></div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><div className="flex items-center justify-between"><h2 className="font-bold">ข้อมูลอุทกวิทยาและการแจ้งเตือน</h2><button onClick={()=>void loadHydrology()} disabled={hydrologyLoading} className="rounded-lg border border-cyan-400/50 px-3 py-2 text-xs text-cyan-300">{hydrologyLoading?'กำลังดึงข้อมูล…':'ดึงข้อมูลทางการ'}</button></div>{hydrology?<><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-lg border border-slate-700 p-3"><div className="text-slate-500">กรมชลประทาน · เขื่อน</div><div className="mt-2 text-emerald-300">{hydrology.sources?.[0]?.ok?'เชื่อมต่อแล้ว':'ไม่พร้อมใช้งาน'}</div></div><div className="rounded-lg border border-slate-700 p-3"><div className="text-slate-500">กรมชลประทาน · อ่างเก็บน้ำ</div><div className="mt-2 text-emerald-300">{hydrology.sources?.[1]?.ok?'เชื่อมต่อแล้ว':'ไม่พร้อมใช้งาน'}</div></div></div>{hydrologyRows.length>0?<div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{hydrologyRows.map((row:any,index:number)=><div key={`${row.id||row.name||'row'}-${index}`} className="rounded-lg border border-slate-700 p-3 text-sm"><div className="font-semibold text-cyan-300">{row.name||row.id||'สถานี/แหล่งน้ำ'}</div><div className="mt-2 text-xs text-slate-400">ปริมาณ: {row.volume ?? row.storage ?? '-'} · {row.percent_storage ?? '-'}%</div><div className="mt-1 text-xs text-slate-500">ไหลเข้า {row.inflow ?? '-'} · ระบาย {row.outflow ?? '-'}</div></div>)}</div>:<p className="mt-4 text-sm text-amber-200">เชื่อมต่อ API ได้ แต่ไม่พบรายการข้อมูลในรูปแบบที่แสดงผลได้</p>}</>:<p className="mt-4 text-sm text-slate-400">กดดึงข้อมูลเพื่ออ่านค่าจาก API กรมชลประทานโดยตรง</p>}<div className="mt-4 flex flex-wrap gap-3 text-xs">{hydrology?.officialLinks?.map((link:any)=><a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="text-cyan-300 underline">{link.name}</a>)}</div></section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><h2 className="font-bold">ข้อมูลดาวเทียม</h2><p className="mt-3 text-sm leading-6 text-slate-400">การเชื่อมต่อภาพดาวเทียมแบบอัตโนมัติอยู่ระหว่างปรับปรุง ระบบจะแสดงพิกัด แผนที่ และพยากรณ์อากาศจากแหล่งข้อมูลสาธารณะก่อน โดยไม่ต้องใช้ Planet API Key</p><div className="mt-4 grid gap-2 sm:grid-cols-3 text-xs"><div className="rounded-lg border border-slate-700 p-3"><div className="font-semibold text-cyan-300">Sentinel-1/2</div><div className="mt-1 text-slate-500">แหล่งภาพสำหรับตรวจพื้นที่น้ำท่วม</div></div><div className="rounded-lg border border-slate-700 p-3"><div className="font-semibold text-cyan-300">GISTDA</div><div className="mt-1 text-slate-500">ข้อมูลภูมิสารสนเทศของไทย</div></div><div className="rounded-lg border border-slate-700 p-3"><div className="font-semibold text-cyan-300">NASA</div><div className="mt-1 text-slate-500">ข้อมูลสำรวจโลกสาธารณะ</div></div></div></section>

      <section className="rounded-2xl border border-violet-400/30 bg-violet-400/5 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-bold text-violet-200"><ShieldAlert className="h-4 w-4" />AI วิเคราะห์สถานการณ์</h2><div className="flex flex-wrap gap-2"><button onClick={() => void analyze()} disabled={analyzing} className="inline-flex items-center gap-2 rounded-xl bg-violet-400 px-4 py-2 font-bold text-slate-950 disabled:opacity-50"><Sparkles className="h-4 w-4" />{analyzing ? 'กำลังวิเคราะห์…' : 'วิเคราะห์ด้วย AI'}</button>{analysis&&<button onClick={() => void publishAnalysis()} disabled={publishing} className="rounded-xl border border-amber-400/60 px-4 py-2 font-bold text-amber-200 disabled:opacity-50">{publishing ? 'กำลังโพสต์…' : 'สร้าง Preview โพสต์'}</button>}</div></div>{analysis ? <><div className="prose prose-invert mt-4 max-w-none rounded-xl border border-violet-400/20 bg-slate-950/50 p-5 text-sm leading-7"><ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown></div><div className="mt-4 flex gap-2"><input value={followUp} onChange={e=>setFollowUp(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')void askFollowUp();}} placeholder="ถามต่อหรือขอเพิ่มรายละเอียด…" className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"/><button onClick={()=>void askFollowUp()} disabled={followUpLoading} className="rounded-xl border border-violet-400/60 px-4 py-2 text-violet-200">{followUpLoading?'กำลังคิด…':'ส่ง'}</button></div></> : <p className="mt-3 text-sm text-slate-400">AI จะวิเคราะห์จากข้อมูลพยากรณ์ที่ดึงได้เท่านั้น ไม่สร้างประกาศเตือนภัยเอง</p>}</section>

      <section className="rounded-xl border border-slate-800 p-4 text-xs leading-6 text-slate-500"><Wind className="mr-1 inline h-3 w-3" />แหล่งข้อมูลปัจจุบัน: Open-Meteo และ OpenStreetMap · ข้อมูลใช้ประกอบการวิเคราะห์ ไม่แทนที่ประกาศจากหน่วยงานรัฐ · การโพสต์บทความสงวนสำหรับผู้ดูแลระบบ</section>
      </>}
    </main>
  </div>;
};
