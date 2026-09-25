import React, { useState } from 'react';
import { fetchWithAuthorization } from '../config/authFetch';
import { ArrowLeft, CloudRain, Map, RefreshCw, ShieldAlert, Sparkles, Wind } from 'lucide-react';

type WeatherState = any;

export const FloodAiLab: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [location, setLocation] = useState('');
  const [weather, setWeather] = useState<WeatherState>(null);
  const [analysis, setAnalysis] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

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

  const publishAnalysis = async () => {
    if (!analysis || !weather) { setStatus('ต้องให้ AI วิเคราะห์ก่อนโพสต์'); return; }
    setPublishing(true); setStatus('กำลังสร้างและเผยแพร่บทความ…');
    try {
      const draftResponse = await fetchWithAuthorization('/api/admin/articles/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic: `วิเคราะห์สถานการณ์น้ำท่วม ${weather.location?.name || location}`, sourceText: analysis, language: 'th' }) });
      const draft = await draftResponse.json();
      if (!draftResponse.ok) throw new Error(draft.message || 'สร้างร่างบทความไม่สำเร็จ');
      const publishResponse = await fetchWithAuthorization('/api/admin/articles/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: draft.title, slug: draft.slug, markdown: draft.markdown }) });
      const published = await publishResponse.json();
      if (!publishResponse.ok) throw new Error(published.message || 'เผยแพร่บทความไม่สำเร็จ');
      setStatus('เผยแพร่บทความแล้ว'); 
    } catch (error: any) { setStatus(error?.message || 'โพสต์บทความไม่สำเร็จ'); }
    finally { setPublishing(false); }
  };

  const current = weather?.current;
  const daily = weather?.daily;
  const lat = Number(weather?.location?.latitude);
  const lon = Number(weather?.location?.longitude);
  const mapSrc = Number.isFinite(lat) && Number.isFinite(lon)
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.15}%2C${lat - 0.15}%2C${lon + 0.15}%2C${lat + 0.15}&layer=mapnik&marker=${lat}%2C${lon}`
    : '';

  return <div className="min-h-screen bg-slate-950 text-slate-100">
    <header className="border-b border-slate-800 bg-slate-950/95">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4">
        <button onClick={onBack} className="rounded-lg border border-slate-700 p-2"><ArrowLeft className="h-4 w-4" /></button>
        <CloudRain className="h-6 w-6 text-cyan-400" />
        <div><div className="text-xs font-mono tracking-widest text-cyan-400">FIREKEEPER · FLOOD AI</div><h1 className="text-xl font-black">Flood Situation Dashboard</h1></div>
      </div>
    </header>
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input value={location} onChange={e => setLocation(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void loadWeather(); }} placeholder="ค้นหาจังหวัดหรืออำเภอ เช่น อุบลราชธานี" className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3" />
          <button onClick={() => void loadWeather()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />{loading ? 'กำลังดึงข้อมูล' : 'ดึงข้อมูลพื้นที่'}</button>
        </div>
        {status && <div className="mt-3 text-sm text-slate-400">{status}</div>}
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

      <section className="rounded-2xl border border-violet-400/30 bg-violet-400/5 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-bold text-violet-200"><ShieldAlert className="h-4 w-4" />AI วิเคราะห์สถานการณ์</h2><div className="flex flex-wrap gap-2"><button onClick={() => void analyze()} disabled={analyzing} className="inline-flex items-center gap-2 rounded-xl bg-violet-400 px-4 py-2 font-bold text-slate-950 disabled:opacity-50"><Sparkles className="h-4 w-4" />{analyzing ? 'กำลังวิเคราะห์…' : 'วิเคราะห์ด้วย AI'}</button>{analysis&&<button onClick={() => void publishAnalysis()} disabled={publishing} className="rounded-xl border border-amber-400/60 px-4 py-2 font-bold text-amber-200 disabled:opacity-50">{publishing ? 'กำลังโพสต์…' : 'โพสต์เป็นบทความ'}</button>}</div></div>{analysis ? <div className="mt-4 whitespace-pre-wrap rounded-xl border border-violet-400/20 bg-slate-950/50 p-4 text-sm leading-7">{analysis}</div> : <p className="mt-3 text-sm text-slate-400">AI จะวิเคราะห์จากข้อมูลพยากรณ์ที่ดึงได้เท่านั้น ไม่สร้างประกาศเตือนภัยเอง</p>}</section>

      <section className="rounded-xl border border-slate-800 p-4 text-xs leading-6 text-slate-500"><Wind className="mr-1 inline h-3 w-3" />แหล่งข้อมูลปัจจุบัน: Open-Meteo และ OpenStreetMap · ข้อมูลใช้ประกอบการวิเคราะห์ ไม่แทนที่ประกาศจากหน่วยงานรัฐ · การโพสต์บทความสงวนสำหรับผู้ดูแลระบบ</section>
      </>}
    </main>
  </div>;
};
