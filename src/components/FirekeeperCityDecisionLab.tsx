import React, { useMemo, useRef, useState } from 'react';
import { auth } from '../lib/firebase';
import { getApiEndpoint } from '../config/env';
import { fetchWithAuthorization } from '../config/authFetch';
import {
  Activity, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, CircleDot,
  Database, FileCheck2, GitBranch, MapPin, ShieldCheck, Target, UserCheck,
  XCircle, ArrowLeft, RotateCcw
} from 'lucide-react';

type EvidenceStatus = 'VERIFIED' | 'UNVERIFIED' | 'UNKNOWN';

interface EvidenceItem {
  id: string;
  label: string;
  value: string;
  status: EvidenceStatus;
  source: string;
}

const evidence: EvidenceItem[] = [
  { id: 'E1', label: 'อุบัติเหตุย้อนหลัง', value: 'เกิดเหตุซ้ำในจุดเสี่ยงช่วง 16:00–19:00', status: 'UNVERIFIED', source: 'ข้อมูลสาธิต · ไม่มีแหล่งข้อมูลภาคสนามยืนยัน' },
  { id: 'E2', label: 'ปริมาณการจราจร', value: 'ความหนาแน่นสูงในช่วงเวลาเร่งด่วน', status: 'UNVERIFIED', source: 'ข้อมูลสาธิต · ไม่มีแหล่งข้อมูลภาคสนามยืนยัน' },
  { id: 'E3', label: 'สถานศึกษาใกล้เคียง', value: 'มีสถานศึกษาอยู่ในรัศมี 500 เมตร', status: 'UNVERIFIED', source: 'ข้อมูลสาธิต · ต้องตรวจสอบพิกัดและแหล่งข้อมูลจริง' },
  { id: 'E4', label: 'ความเร็วเฉลี่ย', value: 'ยังไม่มีข้อมูลความเร็วรายช่วงเวลาที่เพียงพอ', status: 'UNKNOWN', source: 'Data gap' },
];

const options = [
  {
    id: 'A',
    title: 'ปรับสัญญาณไฟจราจร',
    summary: 'จัดจังหวะสัญญาณใหม่เพื่อลดคอขวดช่วงเร่งด่วน',
    impact: 'MEDIUM',
    reversibility: 'สูง',
    evidence: 'MODERATE',
  },
  {
    id: 'B',
    title: 'เพิ่มมาตรการควบคุมความเร็ว',
    summary: 'เพิ่มมาตรการลดความเร็วและการเฝ้าระวังในจุดเสี่ยง',
    impact: 'MEDIUM',
    reversibility: 'สูง',
    evidence: 'MODERATE',
  },
  {
    id: 'C',
    title: 'ดำเนินการ A + B ร่วมกัน',
    summary: 'จัดการทั้งการไหลของจราจรและปัจจัยด้านความเร็ว',
    impact: 'HIGH',
    reversibility: 'สูง',
    evidence: 'STRONG',
  },
];

const stages = [
  ['01', 'Intent Definition', 'ระบุโจทย์: จัดลำดับพื้นที่ที่ควรได้รับการแก้ไขก่อน'],
  ['02', 'Context Understanding', 'ช่วงเวลา พื้นที่ ผู้ใช้ถนน และข้อจำกัด'],
  ['03', 'Purpose & Scope', 'กำหนดเป้าหมายเป็นการลดความเสี่ยง ไม่ใช่การสั่งการอัตโนมัติ'],
  ['04', 'Data Structuring', 'จัดข้อมูลอุบัติเหตุ จราจร สถานที่ และช่องว่างข้อมูล'],
  ['05', 'Relationship Modeling', 'เชื่อมความสัมพันธ์ระหว่างเวลา ปริมาณรถ และความเสี่ยง'],
  ['06', 'Evidence Evaluation', 'แยกหลักฐานที่ตรวจสอบได้ออกจากข้อสันนิษฐาน'],
  ['07', 'Hypothesis Formation', 'สร้างทางเลือก A/B/C เพื่อเปรียบเทียบ'],
  ['08', 'Risk & Critique Analysis', 'ตรวจความเสี่ยงและข้อมูลที่ยังไม่เพียงพอ'],
  ['09', 'Strategic Options', 'จัดอันดับทางเลือกตามผลกระทบ ความเสี่ยง และหลักฐาน'],
  ['10', 'Analysis Communication', 'สร้าง Decision Brief ที่อ่านได้โดยผู้มีอำนาจตัดสินใจ'],
  ['11', 'Review & Verification', 'ตรวจความสอดคล้องและห้ามยกระดับช่องว่างเป็นข้อเท็จจริง'],
  ['12', 'Human Agency', 'ส่ง Recommendation ให้มนุษย์อนุมัติ/ปฏิเสธ'],
];

function statusClass(status: EvidenceStatus) {
  if (status === 'VERIFIED') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (status === 'UNKNOWN') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
}

export function FirekeeperCityDecisionLab({ onBack }: { onBack: () => void }) {
  const [liveAnalysis, setLiveAnalysis] = useState('');
  const [liveStage, setLiveStage] = useState('พร้อมวิเคราะห์');
  const [liveError, setLiveError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analysisRequestId = useRef<string | null>(null);
  const [decision, setDecision] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [workspaces, setWorkspaces] = useState<Array<{id:string;name:string;members?:Array<{userId:string;role:string}>}>>([]);
  const [workspaceId, setWorkspaceId] = useState('');
  const [approvals, setApprovals] = useState<Array<{id:string;decisionId:string;status:string;decision?:unknown;reviewedBy?:string}>>([]);
  const [approvalId, setApprovalId] = useState('');
  const [decisionId, setDecisionId] = useState('');
  const [auditId, setAuditId] = useState('');
  const [governanceMessage, setGovernanceMessage] = useState('');
  const [governanceBusy, setGovernanceBusy] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [showTrace, setShowTrace] = useState(false);
  const [selectedOption, setSelectedOption] = useState('C');

  const selected = useMemo(() => options.find(o => o.id === selectedOption) ?? options[2], [selectedOption]);
  const activeWorkspace = useMemo(() => workspaces.find(w => w.id === workspaceId) || null, [workspaces, workspaceId]);
  const currentRole = (activeWorkspace as any)?.ownerId === currentUserId ? 'owner' :
    activeWorkspace?.members?.find(m => m.userId === currentUserId)?.role || '';
  const canReview = currentRole === 'owner' || currentRole === 'reviewer';

  const buildDecisionObject = () => ({
    question: 'พื้นที่ตัวอย่างนี้ควรได้รับการแก้ไขปัญหาการเดินทางและความปลอดภัยก่อนหรือไม่ และควรเลือกมาตรการใด?',
    context: [
      'Bangkok City Decision Lab · Hackathon PoC · ใช้ชุดข้อมูลจำลอง ไม่ใช่ข้อมูลภาคสนามที่ยืนยันแล้ว',
      'พื้นที่ตัวอย่าง: ถนนสุขุมวิท · จุดเสี่ยง X',
      'ช่วงเวลาที่พิจารณา: 16:00–19:00 และช่วงเวลาเร่งด่วน',
      liveAnalysis ? 'ผลวิเคราะห์ PCA: ' + liveAnalysis.slice(0, 6000) : 'ยังไม่มีผลวิเคราะห์ Live PCA แนบอยู่'
    ],
    options: options.map(o => ({ id:o.id, text:o.title + ' — ' + o.summary, rationale:o.summary, isRecommended:o.id === selectedOption })),
    risks: [
      { id:'R-001', text:'ความเสี่ยงจากอุบัติเหตุซ้ำในช่วงเวลาเร่งด่วนตามข้อมูลจำลอง', severity:'HIGH' as const, relatedOptionIds:['A','B','C'] },
      { id:'R-002', text:'การประเมินประสิทธิผลเชิงปริมาณยังไม่แน่นอนเนื่องจากไม่มีข้อมูลความเร็วเฉลี่ยรายช่วงเวลา', severity:'MEDIUM' as const, relatedOptionIds:['A','B','C'] }
    ],
    uncertainties: [
      { id:'U-001', text:'ไม่มีข้อมูลความเร็วเฉลี่ยรายช่วงเวลาที่ตรวจสอบได้', importance:'HIGH' as const },
      { id:'U-002', text:'ข้อมูลทั้งหมดใน Demo เป็นข้อมูลจำลอง ต้องแทนที่ด้วยข้อมูลจากแหล่งที่ตรวจสอบได้ก่อนใช้งานจริง', importance:'HIGH' as const }
    ],
    consequences: [
      { id:'C-001', text:'การปรับสัญญาณไฟอาจเปลี่ยนการไหลของรถบริเวณทางแยก ต้องประเมินผลกระทบต่อถนนเชื่อมต่อ', timeframe:'ระยะสั้น' },
      { id:'C-002', text:'มาตรการควบคุมความเร็วอาจเพิ่มความปลอดภัย แต่ต้องตรวจสอบความเหมาะสมของพื้นที่และการบังคับใช้', timeframe:'ระยะสั้นถึงกลาง' }
    ],
    evidence: evidence.map(e => ({ id:e.id, text:e.value, sourceId:e.source, relevance:e.status === 'VERIFIED' ? 'RELEVANT' as const : 'UNKNOWN' as const })),
    assumptions: ['ข้อมูลอุบัติเหตุและการจราจรที่แสดงเป็นข้อมูลจำลองเพื่อการสาธิตเท่านั้น', 'ยังไม่สามารถสรุปผลลดอุบัติเหตุหรือประโยชน์เชิงตัวเลขได้'],
    confidence: { score:null, label:'UNKNOWN' as const, breakdown:{ data_quality:'DEMO_DATA', speed_data:'MISSING', live_pca: liveAnalysis ? 'AVAILABLE' : 'NOT_RUN' } },
    applicable_policies: [],
    policy_conflicts: [],
    escalation_required: false,
    controlLevel:'HIGH' as const,
    recommendation: { optionId:selectedOption, rationale:selected.summary + ' ทั้งนี้ต้องตรวจสอบข้อมูลภาคสนามและให้ผู้มีอำนาจอนุมัติก่อนดำเนินการ' },
    human_decision: { status:'PENDING' as const }
  });

  const loadGovernance = async (preferredWorkspaceId?: string) => {
    try {
      const user = auth.currentUser;
      setCurrentUserId(user?.uid || '');
      if (!user) return;
      const response = await fetchWithAuthorization('/api/workspaces');
      if (!response.ok) { setGovernanceMessage('ไม่สามารถอ่าน Workspace ได้: ' + response.status); return; }
      const data = await response.json();
      const list = data.workspaces || [];
      setWorkspaces(list);
      const chosen = list.find((w:any) => w.id === (preferredWorkspaceId || workspaceId)) || list[0];
      if (!chosen) { setWorkspaceId(''); setApprovals([]); setGovernanceMessage('ไม่พบ Workspace ที่บัญชีนี้เข้าถึงได้ หรือแพ็กเกจยังไม่รองรับ Workspace'); return; }
      setWorkspaceId(chosen.id);
      const queue = await fetchWithAuthorization('/api/workspaces/' + chosen.id + '/approvals');
      if (queue.ok) {
        setApprovals((await queue.json()).approvals || []);
      } else {
        setApprovals([]);
        const payload = await queue.json().catch(() => ({}));
        setGovernanceMessage(payload.message || payload.error || 'อ่าน Approval Queue ไม่สำเร็จ (HTTP ' + queue.status + ')');
      }
    } catch (error) {
      setGovernanceMessage(error instanceof Error ? error.message : 'โหลด Approval Queue ไม่สำเร็จ');
    }
  };

  const submitForApproval = async () => {
    if (!workspaceId) { setGovernanceMessage('ไม่พบ Workspace ที่ใช้งานได้ ต้องมี Workspace และแพ็กเกจที่รองรับ Approval Workflow'); return; }
    setGovernanceBusy(true); setGovernanceMessage('กำลังส่ง Decision Object ไปยัง Approval Backend…'); setAuditId('');
    try {
      const id = 'CITY-' + crypto.randomUUID();
      const decisionObject = buildDecisionObject();
      const response = await fetchWithAuthorization('/api/workspaces/' + workspaceId + '/approvals', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ decisionId:id, decision:decisionObject })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'ส่ง Approval ไม่สำเร็จ (HTTP ' + response.status + ')');
      setDecisionId(id); setApprovalId(data.approval?.id || '');
      setDecision('PENDING'); setGovernanceMessage('สร้าง Approval จริงแล้ว · ' + (data.approval?.id || 'รอโหลดรายการ'));
      await loadGovernance(workspaceId);
    } catch(error) {
      setGovernanceMessage(error instanceof Error ? error.message : 'ส่ง Approval ไม่สำเร็จ');
    } finally { setGovernanceBusy(false); }
  };

  const reviewApproval = async (id:string, status:'APPROVED'|'REJECTED') => {
    if (!workspaceId) return;
    setGovernanceBusy(true); setGovernanceMessage('กำลังส่งผลตรวจให้ Approval Backend…');
    try {
      const response = await fetchWithAuthorization('/api/workspaces/' + workspaceId + '/approvals/' + id, {
        method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status})
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'บันทึกผลอนุมัติไม่สำเร็จ');
      setDecision(status); setApprovalId(id);
      if (status === 'APPROVED') {
        const reviewedApproval = approvals.find(item => item.id === id);
        const decisionObject = reviewedApproval?.decision || buildDecisionObject();
        // Approval hash excludes human_decision, but every other Decision field must remain byte-for-byte equivalent.
        const audited = await fetchWithAuthorization(getApiEndpoint('/api/city-decision/audit'), {
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ decision:decisionObject, workspaceId, approvalId:id, conversationId:'city-decision-' + decisionId, metadata:{source:'Bangkok City Decision Lab', decisionId} })
        });
        const audit = await audited.json();
        if (!audited.ok) throw new Error(audit.message || audit.error || 'อนุมัติแล้ว แต่บันทึก Decision Audit ไม่สำเร็จ');
        setAuditId(audit.auditId || '');
        setGovernanceMessage('อนุมัติผ่าน Backend แล้ว และบันทึก Decision Audit สำเร็จ · ' + (audit.auditId || ''));
      } else {
        setGovernanceMessage('บันทึก REJECTED ผ่าน Backend แล้ว · ไม่มีการบันทึกเป็น Decision ที่อนุมัติ');
      }
      await loadGovernance(workspaceId);
    } catch(error) {
      setGovernanceMessage(error instanceof Error ? error.message : 'ดำเนินการ Approval ไม่สำเร็จ');
      await loadGovernance(workspaceId);
    } finally { setGovernanceBusy(false); }
  };


  const runLiveAnalysis = async () => {
    setIsAnalyzing(true);
    setLiveError('');
    setLiveAnalysis('');
    setLiveStage('กำลังเชื่อมต่อ FIRE KEEPER PCA…');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('กรุณาเข้าสู่ระบบหรือใช้ Guest Mode ก่อนวิเคราะห์');
      const token = await user.getIdToken(true);
      const requestId = crypto.randomUUID();
      analysisRequestId.current = requestId;
      const question = [
        'วิเคราะห์ปัญหาการเดินทางและความปลอดภัยของพื้นที่ตัวอย่างในกรุงเทพฯ สำหรับ Hackathon PoC',
        'เป้าหมายคือจัดลำดับความสำคัญของพื้นที่และเสนอทางเลือก ไม่ใช่สั่งการแทนเจ้าหน้าที่',
        'ใช้เฉพาะหลักฐานที่มีในบริบทนี้: อุบัติเหตุซ้ำช่วง 16:00–19:00, การจราจรหนาแน่นช่วงเร่งด่วน, มีสถานศึกษาในรัศมี 500 เมตร และยังไม่มีข้อมูลความเร็วเฉลี่ยที่เพียงพอ',
        'โปรดตอบเป็น Decision Brief ภาษาไทย โดยมี: Current Situation, Evidence, Risk, Options A/B/C, Recommendation, Uncertainty, Human Decision Required',
        'ห้ามสร้างตัวเลขหรืออ้างว่าเป็นข้อมูลกรุงเทพฯ จริง และ Recommendation ต้องไม่เท่ากับ Approval'
      ].join('\n');

      const response = await fetch(getApiEndpoint('/api/pca/stream'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          analysisRequestId: requestId,
          conversationId: `city-decision-${requestId}`,
          question,
          mission: 'Bangkok City Decision Intelligence Hackathon PoC',
          mode: 'governed',
          tone: 'professional',
          deepReasoning: true,
          webSearch: false,
          reasoningProfile: 'governed',
          provider: 'groq',
          model: '',
          apiKey: '',
          customBaseUrl: '',
          history: [],
          attachments: [],
          personalContext: ''
        })
      });

      if (!response.ok || !response.body) {
        let message = '';
        try { const data = await response.clone().json(); message = data.message || data.error || ''; } catch {}
        throw new Error(message || `PCA stream failed: HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let output = '';

      const handleEvent = (block: string) => {
        let eventName = 'message';
        let data = '';
        for (const line of block.split(/\\r?\\n/)) {
          if (line.startsWith('event:')) eventName = line.slice(6).trim();
          if (line.startsWith('data:')) data += line.slice(5).trim();
        }
        if (!data || data === '[DONE]') return;
        if (eventName === 'pipeline_stage') {
          try { const p = JSON.parse(data); setLiveStage(p.detail || p.stage || p.message || 'กำลังประมวลผล PCA…'); } catch {}
        } else if (eventName === 'token') {
          try {
            const p = JSON.parse(data);
            output += String(p.token ?? p.text ?? p.content ?? p.answer ?? p.chunk ?? p.delta ?? p.response ?? '');
          } catch { output += data; }
          setLiveAnalysis(output);
        } else if (eventName === 'complete') {
          setLiveStage('PCA วิเคราะห์เสร็จแล้ว · Recommendation พร้อมตรวจสอบ');
        } else if (eventName === 'error') {
          try { throw new Error(JSON.parse(data).message || JSON.parse(data).error || data); } catch (e) { if (e instanceof Error) throw e; }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split(/\\r?\\n\\r?\\n/);
        buffer = blocks.pop() || '';
        for (const block of blocks) handleEvent(block);
      }
      if (buffer.trim()) handleEvent(buffer);
      if (!output.trim()) setLiveStage('เชื่อมต่อสำเร็จ แต่ไม่มีข้อความผลลัพธ์จาก PCA');
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : 'ไม่สามารถเชื่อมต่อ PCA ได้');
      setLiveStage('การวิเคราะห์ไม่สำเร็จ');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setDecision('PENDING');
    setSelectedOption('C');
    setShowTrace(false);
    setLiveAnalysis('');
    setLiveError('');
    setLiveStage('พร้อมวิเคราะห์');
    setDecision('PENDING'); setDecisionId(''); setApprovalId(''); setAuditId(''); setGovernanceMessage('');
  };

  React.useEffect(() => { void loadGovernance(); }, []);

  return (
    <div className="min-h-[calc(100vh-80px)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-mono text-slate-300 hover:border-amber-500/40 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> BACK
          </button>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400">
            <CircleDot className="h-3 w-3" /> Hackathon PoC · Demo Dataset
          </div>
        </div>

        <header className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-slate-950 to-slate-950 p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-4xl">
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-400">FIRE KEEPER · CITY DECISION INTELLIGENCE</div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-4xl">Bangkok City Decision Lab</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                เปลี่ยนข้อมูลเมืองที่กระจัดกระจายให้เป็น <strong className="text-white">Evidence → Risk → Options → Recommendation</strong>
                โดยไม่ให้ AI กลายเป็นผู้ตัดสินใจแทนมนุษย์
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
              <div className="text-[10px] font-mono text-emerald-400">GOVERNANCE</div>
              <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-white"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Human Decision Authority</div>
            </div>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1.05fr_1.35fr_1fr]">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-sky-400">
              <Database className="h-4 w-4" /> 01 · CITY DATA
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white"><MapPin className="h-4 w-4 text-amber-400" /> ถนนสุขุมวิท · จุดเสี่ยง X</div>
              <p className="mt-2 text-xs leading-6 text-slate-400">โจทย์: พื้นที่ใดควรได้รับการแก้ไขปัญหาการเดินทางและความปลอดภัยก่อน?</p>
            </div>
            <div className="mt-4 space-y-2">
              {evidence.map(item => (
                <div key={item.id} className="rounded-xl border border-white/5 bg-black/10 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-200">{item.label}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-mono ${statusClass(item.status)}`}>{item.status}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{item.value}</p>
                  <p className="mt-1 text-[9px] font-mono text-slate-600">{item.id} · {item.source}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-400">
              <Activity className="h-4 w-4" /> 02 · FIRE KEEPER ANALYSIS
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-mono text-slate-500">PRIORITY</span>
                <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-[10px] font-mono text-rose-400">HIGH PRIORITY</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                หลักฐานปัจจุบันชี้ว่าจุดนี้มีความเสี่ยงสูงในช่วงเร่งด่วน แต่ยังขาดข้อมูลความเร็วเฉลี่ยรายช่วงเวลา
                จึงไม่ควรอ้างผลลัพธ์เชิงปริมาณที่ยังพิสูจน์ไม่ได้
              </p>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {options.map(option => (
                <button key={option.id} onClick={() => { setSelectedOption(option.id); setDecision('PENDING'); }}
                  className={`rounded-xl border p-3 text-left transition-all ${selectedOption === option.id ? 'border-amber-500/50 bg-amber-500/10' : 'border-white/10 bg-black/10 hover:border-white/20'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">OPTION {option.id}</span>
                    <span className="text-[9px] font-mono text-slate-500">{option.evidence}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-300">{option.title}</div>
                  <div className="mt-1 text-[10px] leading-4 text-slate-500">{option.summary}</div>
                </button>
              ))}
            </div>

            <button type="button" onClick={runLiveAnalysis} disabled={isAnalyzing}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-xs font-bold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60">
              <Activity className="h-4 w-4" /> {isAnalyzing ? 'FIRE KEEPER กำลังวิเคราะห์…' : 'RUN LIVE FIRE KEEPER ANALYSIS'}
            </button>
            <div className="mt-2 rounded-xl border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-[10px] font-mono text-sky-300">{liveStage}</div>
            {liveError && <div className="mt-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-[10px] leading-5 text-rose-300">{liveError}</div>}
            {liveAnalysis && (
              <div className="mt-3 max-h-80 overflow-auto rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="mb-2 text-[9px] font-mono uppercase tracking-widest text-sky-400">LIVE PCA OUTPUT</div>
                <pre className="whitespace-pre-wrap font-sans text-xs leading-6 text-slate-300">{liveAnalysis}</pre>
              </div>
            )}
            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">Recommendation</div>
              <div className="mt-1 text-sm font-bold text-white">{selected.title}</div>
              <p className="mt-1 text-xs leading-5 text-slate-400">{selected.summary}</p>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[10px] leading-5 text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span><strong>UNCERTAINTY:</strong> ยังไม่มีข้อมูลความเร็วเฉลี่ยรายช่วงเวลาเพียงพอ ต้องตรวจสอบก่อนประเมินผลเชิงปริมาณ</span>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-400">
              <UserCheck className="h-4 w-4" /> 03 · HUMAN DECISION
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-4">
              <div className="text-[10px] font-mono text-slate-500">SELECTED RECOMMENDATION</div>
              <div className="mt-2 text-base font-bold text-white">{selected.title}</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                <div className="rounded-lg border border-white/5 p-2"><span className="text-slate-500">Impact</span><div className="mt-1 text-slate-200">{selected.impact}</div></div>
                <div className="rounded-lg border border-white/5 p-2"><span className="text-slate-500">Reversibility</span><div className="mt-1 text-slate-200">{selected.reversibility}</div></div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-3">
              <div className="text-[10px] font-mono text-slate-500">SERVER-SIDE WORKSPACE APPROVAL</div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="text-xs text-slate-300">{activeWorkspace ? activeWorkspace.name : 'ไม่พบ Workspace ที่เข้าถึงได้'}</div>
                <button type="button" onClick={() => loadGovernance()} className="rounded-lg border border-white/10 px-2 py-1 text-[9px] text-slate-400">REFRESH</button>
              </div>
              {activeWorkspace && <div className="mt-1 text-[10px] text-slate-500">Role: {currentRole || 'member'} · Workspace: {workspaceId}</div>}
              <button onClick={submitForApproval} disabled={governanceBusy || !liveAnalysis || !workspaceId}
                className="mt-3 w-full rounded-xl bg-amber-500 px-3 py-3 text-xs font-bold text-slate-950 disabled:opacity-40">
                {governanceBusy ? 'กำลังดำเนินการ…' : 'SUBMIT DECISION OBJECT FOR APPROVAL'}
              </button>
              {!workspaceId && <p className="mt-2 text-[10px] leading-5 text-amber-300">ต้องเข้าสู่ระบบและมี Workspace ที่รองรับ Approval Workflow (แพ็กเกจ Team/Business/Enterprise ตามสิทธิ์ระบบ)</p>}
              {approvals.filter(a => a.status === 'PENDING').map(a => <div key={a.id} className="mt-3 rounded-lg border border-amber-500/20 p-3">
                <div className="text-[10px] text-slate-300">{a.decisionId} · PENDING</div>
                {canReview ? <div className="mt-2 flex gap-2">
                  <button disabled={governanceBusy} onClick={() => reviewApproval(a.id,'APPROVED')} className="flex-1 rounded-lg bg-emerald-500 px-2 py-2 text-[10px] font-bold text-slate-950">APPROVE</button>
                  <button disabled={governanceBusy} onClick={() => reviewApproval(a.id,'REJECTED')} className="flex-1 rounded-lg border border-rose-500/30 px-2 py-2 text-[10px] text-rose-300">REJECT</button>
                </div> : <p className="mt-1 text-[10px] text-slate-500">รอ Owner/Reviewer อนุมัติ</p>}
              </div>)}
              {governanceMessage && <p className="mt-3 text-[10px] leading-5 text-amber-300">{governanceMessage}</p>}
              {decisionId && <p className="mt-2 break-all text-[9px] text-slate-500">Decision ID: {decisionId}</p>}
              {approvalId && <p className="mt-1 break-all text-[9px] text-slate-500">Approval ID: {approvalId}</p>}
              {auditId && <p className="mt-1 break-all text-[9px] text-emerald-400">Audit ID: {auditId}</p>}
              <div className="mt-3 text-[10px] font-bold text-slate-300">STATUS: {decision}</div>
              <p className="mt-1 text-[9px] leading-5 text-slate-500">สถานะนี้อ่านจากผลตอบกลับของ Backend เท่านั้น ไม่ใช่สถานะจำลองในหน้าเว็บ</p>
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03]">
          <button onClick={() => setShowTrace(v => !v)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
            <div className="flex items-center gap-3">
              <GitBranch className="h-4 w-4 text-sky-400" />
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-sky-400">PUNN-PCA 12-STAGE TRACE</div>
                <div className="mt-1 text-[10px] text-slate-500">แสดงเส้นทางจากข้อมูล → การประเมินหลักฐาน → Recommendation → Human Agency</div>
              </div>
            </div>
            {showTrace ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
          </button>
          {showTrace && (
            <div className="border-t border-white/10 p-4">
              <div className="grid gap-2 md:grid-cols-2">
                {stages.map(([num, name, desc]) => (
                  <div key={num} className="flex gap-3 rounded-xl border border-white/5 bg-black/10 p-3">
                    <span className="text-[10px] font-mono text-amber-500">{num}</span>
                    <div><div className="text-xs font-semibold text-slate-200">{name}</div><div className="mt-1 text-[10px] leading-5 text-slate-500">{desc}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/10 bg-amber-500/[0.03] px-4 py-3">
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
            <FileCheck2 className="h-4 w-4 text-amber-500" />
            Evidence quality is separated from claims · Unknown stays Unknown · AI does not create approval
          </div>
          <button onClick={reset} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[10px] font-mono text-slate-400 hover:text-white">
            <RotateCcw className="h-3 w-3" /> RESET DEMO
          </button>
        </div>
      </div>
    </div>
  );
}
