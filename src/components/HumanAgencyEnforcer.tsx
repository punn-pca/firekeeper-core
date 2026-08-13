import React, { useState } from 'react';
import { ShieldAlert, AlertOctagon, CheckCircle2, UserCheck, Lock, Shield, FileCheck2, Key, Zap, Eye } from 'lucide-react';
import { PCAState } from '../types';

interface HumanAgencyEnforcerProps {
  pcaState: PCAState;
}

export const HumanAgencyEnforcer: React.FC<HumanAgencyEnforcerProps> = ({ pcaState }) => {
  const [currentLevel, setCurrentLevel] = useState<1 | 2 | 3>(
    pcaState.human_agency_enforcement?.level || (pcaState.confidence === 'ต่ำ' ? 2 : 1)
  );
  const [domain, setDomain] = useState<'General' | 'Financial' | 'Medical' | 'Legal' | 'Safety'>('Financial');
  const [tokenApproved, setTokenApproved] = useState(false);
  const [approvedBy, setApprovedBy] = useState<string>('');

  // Probing Parameters State
  const [txVolume, setTxVolume] = useState('150,000 transactions / day');
  const [riskAppetite, setRiskAppetite] = useState('Error Rate < 0.01% (SLA 99.95%)');
  const [hitlBudget, setHitlBudget] = useState('฿1,800,000 / yr (3 Senior HITL Reviewers)');

  // Anti-Automation Bias & Systemic Mitigations Toggles
  const [enableDynamicScaling, setEnableDynamicScaling] = useState(true);
  const [enableDiffHighlighting, setEnableDiffHighlighting] = useState(true);
  const [enableHybridEvaluator, setEnableHybridEvaluator] = useState(true);
  const [selectedIntentMode, setSelectedIntentMode] = useState<'DEEP_REASONING' | 'FACT_LOOKUP' | 'QUICK_CHAT'>('DEEP_REASONING');

  const riskScore = pcaState.executive_dashboard?.riskScore || (currentLevel === 3 ? 88 : currentLevel === 2 ? 72 : 25);

  const handleSimulateLevel = (lvl: 1 | 2 | 3) => {
    setCurrentLevel(lvl);
    setTokenApproved(false);
    setApprovedBy('');
  };

  const handleApproveToken = () => {
    setTokenApproved(true);
    setApprovedBy('Human Officer (Risk & Legal Oversight)');
  };

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              Enforced Human Agency Guard (3-Tier Governance Control)
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                currentLevel === 3
                  ? 'bg-rose-950 text-rose-300 border-rose-800'
                  : currentLevel === 2
                  ? 'bg-amber-950 text-amber-300 border-amber-800'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-800'
              }`}>
                Level {currentLevel}: {currentLevel === 3 ? 'Hard Stop' : currentLevel === 2 ? 'Escalation' : 'Advisory'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              กลไกควบคุมสิทธิเด็ดขาดของมนุษย์ (Human-in-the-Loop) พร้อม Diff Highlighting ป้องกัน Alert Fatigue
            </p>
          </div>
        </div>

        {/* Level Switcher Buttons */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 font-mono text-xs">
          <button
            onClick={() => handleSimulateLevel(1)}
            className={`px-2.5 py-1 rounded-lg transition-all font-bold cursor-pointer ${
              currentLevel === 1 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400'
            }`}
          >
            L1 Advisory
          </button>
          <button
            onClick={() => handleSimulateLevel(2)}
            className={`px-2.5 py-1 rounded-lg transition-all font-bold cursor-pointer ${
              currentLevel === 2 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400'
            }`}
          >
            L2 Escalation
          </button>
          <button
            onClick={() => handleSimulateLevel(3)}
            className={`px-2.5 py-1 rounded-lg transition-all font-bold cursor-pointer ${
              currentLevel === 3 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400'
            }`}
          >
            L3 Hard Stop
          </button>
        </div>
      </div>

      {/* Domain Selection & Intent Scaling Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center space-x-2">
          <span className="text-slate-400 font-bold">โดเมนประเมินความเสี่ยง:</span>
          {(['General', 'Financial', 'Medical', 'Legal', 'Safety'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDomain(d)}
              className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                domain === d
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <span className="text-[10px] text-amber-300 font-bold px-1.5 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> Intent Scaling:
          </span>
          {(['DEEP_REASONING', 'FACT_LOOKUP', 'QUICK_CHAT'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setSelectedIntentMode(m)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                selectedIntentMode === m
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Intent Scaling Note */}
      {selectedIntentMode !== 'DEEP_REASONING' && (
        <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs text-amber-300 font-mono flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <strong>Dynamic Output Scaling Active ({selectedIntentMode}):</strong> ข้ามโครงสร้างรายงานเต็มรูปแบบ แสดงคำตอบสั้นเพื่อประหยัด Token และ Latency
          </span>
          <span className="text-[10px] bg-amber-900 px-2 py-0.5 rounded border border-amber-700">Short Output Mode</span>
        </div>
      )}

      {/* Dynamic Status Card based on Level */}
      {currentLevel === 1 && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-emerald-300 font-mono">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Level 1: Advisory Mode (ความเสี่ยงต่ำ = {riskScore}%)
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-700 text-[10px]">
              Autonomous Output Permitted
            </span>
          </div>
          <p className="text-slate-300 leading-relaxed font-sans">
            AI ให้คำแนะนำเชิงยุทธศาสตร์ พร้อมแสดงระดับความมั่นใจ มนุษย์มีอิสระในการพิจารณาเลือกแนวทาง หรือดำเนินการต่อโดยอัตโนมัติ
          </p>
        </div>
      )}

      {currentLevel === 2 && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 space-y-3 text-xs">
          <div className="flex items-center justify-between font-bold text-amber-300 font-mono">
            <span className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-amber-400" />
              Level 2: Escalation Required (Risk Score = {riskScore}% &gt; Threshold 70%)
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-900/60 border border-amber-700 text-[10px]">
              AI Answer Output Paused
            </span>
          </div>

          {/* Diff Highlighting Dashboard */}
          {enableDiffHighlighting && (
            <div className="p-3 bg-slate-900 rounded-xl border border-amber-500/30 space-y-2 font-sans">
              <div className="flex items-center justify-between font-mono text-[11px] font-bold text-amber-300 border-b border-slate-800 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  HITL Dashboard — Diff Highlight View (ลด Alert Fatigue)
                </span>
                <span className="text-[10px] text-slate-400">ไฮไลต์เฉพาะจุดที่ไม่มั่นใจ/สุ่มเสี่ยง</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                "วางสถาปัตยกรรมกำกับดูแลตาม ISO/IEC 42001:2023 โดยคาดการณ์อัตรา Hallucination{' '}
                <mark className="bg-amber-500/30 text-amber-200 border border-amber-500/60 px-1 rounded font-mono">
                  [ต่ำกว่า 0.01% - สุ่มเสี่ยง Hallucination]
                </mark>{' '}
                และมาตรการ{' '}
                <mark className="bg-rose-500/30 text-rose-200 border border-rose-500/60 px-1 rounded font-mono">
                  [อนุมัติโดยอัตโนมัติแบบไม่มีเงื่อนไข - Entity Mismatch]
                </mark>{' '}
                ในธุรกรรมทางการเงิน"
              </p>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-3 pt-1">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-amber-400 inline-block"></span> จุดไม่มั่นใจ (Low Confidence Span)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-rose-400 inline-block"></span> ข้อความสุ่มเสี่ยง (Risk Discrepancy)
                </span>
              </div>
            </div>
          )}

          {!tokenApproved ? (
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-2 font-mono">
              <span className="text-amber-300 text-[11px]">
                ต้องการการยืนยันจาก Human Reviewer เพื่อปลดล็อกคำตอบ
              </span>
              <button
                onClick={handleApproveToken}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-all flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Approve & Release Answer</span>
              </button>
            </div>
          ) : (
            <div className="p-3 bg-emerald-950/60 rounded-lg border border-emerald-500/50 font-mono text-emerald-300 text-xs flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ได้รับการอนุมัติเรียบร้อยโดย: <strong>{approvedBy}</strong>
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">RELEASED</span>
            </div>
          )}
        </div>
      )}

      {currentLevel === 3 && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/60 space-y-3 text-xs">
          <div className="flex items-center justify-between font-bold text-rose-300 font-mono">
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400 animate-pulse" />
              Level 3: HARD STOP ENFORCED (High-Risk Domain: {domain})
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-900/80 border border-rose-700 text-[10px] text-rose-200">
              AI Generation Disabled
            </span>
          </div>

          {!tokenApproved ? (
            <div className="p-3.5 bg-slate-900 rounded-lg border border-rose-800/80 space-y-2 font-mono">
              <div className="text-rose-300 text-[11px] font-bold">
                🔒 Security Protocol: สิทธิการปล่อยคำตอบถูกปิดกั้น ต้องใช้ Encrypted Human Approval Token
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-400 text-[10px]">ผู้มีอำนาจลงนาม: Senior Executive / Domain Specialist</span>
                <button
                  onClick={handleApproveToken}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Sign & Release Approval Token</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-950/60 rounded-lg border border-emerald-500/50 font-mono text-emerald-300 text-xs flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                ยืนยันการอนุมัติและรับรองความเสี่ยงโดย: <strong>{approvedBy}</strong>
              </span>
              <span className="text-[10px] bg-emerald-900 px-2 py-0.5 rounded border border-emerald-600 font-bold">
                TOKEN RELEASED
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Governance Parameter Calibration Matrix ── */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-3 font-sans text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="font-bold text-amber-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Governance Parameter Calibration (การปรับจูนค่า Threshold บริบทองค์กร)
          </span>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono border border-amber-500/40">
            Missing Signal Probing
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <label className="text-[10px] font-bold text-amber-400 font-mono block">1. Transaction Volume</label>
            <input
              type="text"
              value={txVolume}
              onChange={(e) => setTxVolume(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-white font-mono focus:border-amber-500 focus:outline-none"
              placeholder="เช่น 100,000 tx/day"
            />
            <span className="text-[9.5px] text-slate-400 block">ปริมาณธุรกรรมต่อวัน/เดือน เพื่อกำหนด Throughput</span>
          </div>

          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <label className="text-[10px] font-bold text-amber-400 font-mono block">2. Risk Appetite Threshold</label>
            <input
              type="text"
              value={riskAppetite}
              onChange={(e) => setRiskAppetite(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-white font-mono focus:border-amber-500 focus:outline-none"
              placeholder="เช่น SLA 99.9% / Error < 0.01%"
            />
            <span className="text-[9.5px] text-slate-400 block">ระดับความเสี่ยงที่ยอมรับได้ ก่อน Escalate</span>
          </div>

          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <label className="text-[10px] font-bold text-amber-400 font-mono block">3. HITL Operations Budget</label>
            <input
              type="text"
              value={hitlBudget}
              onChange={(e) => setHitlBudget(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-white font-mono focus:border-amber-500 focus:outline-none"
              placeholder="เช่น งบ 1.5M / 3 Reviewers"
            />
            <span className="text-[9.5px] text-slate-400 block">งบประมาณและกำลังพลสำหรับตรวจทานมนุษย์</span>
          </div>
        </div>
      </div>

      {/* ── Systemic Risk Mitigation Matrix ── */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-sky-500/30 space-y-3 font-sans text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="font-bold text-sky-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-400" />
            Systemic Risk Mitigation Matrix (มาตรการลดทอนความเสี่ยงเชิงระบบ)
          </span>
          <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-mono border border-sky-500/40">
            NIST AI RMF Compliant
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 text-[11px]">1. Dynamic Output Scaling</span>
              <input
                type="checkbox"
                checked={enableDynamicScaling}
                onChange={(e) => setEnableDynamicScaling(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
            <p className="text-[10.5px] text-slate-300 leading-relaxed">
              ปรับสเกลความยาวการตอบอัตโนมัติตาม Intent (เช่น FACT_LOOKUP แสดงคำตอบสั้นตรงประเด็น) ช่วยลด Latency และ Token Cost
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 text-[11px]">2. Diff Highlighting (HITL)</span>
              <input
                type="checkbox"
                checked={enableDiffHighlighting}
                onChange={(e) => setEnableDiffHighlighting(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 cursor-pointer"
              />
            </div>
            <p className="text-[10.5px] text-slate-300 leading-relaxed">
              ป้องกัน Alert Fatigue ในอินเทอร์เฟซ HITL โดยแสดงเฉพาะจุดที่ไม่มั่นใจหรือสุ่มเสี่ยง แทนการให้เจ้าหน้าที่อ่านข้อความทั้งหมด
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-400 text-[11px]">3. Hybrid C(x) Evaluator</span>
              <input
                type="checkbox"
                checked={enableHybridEvaluator}
                onChange={(e) => setEnableHybridEvaluator(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-purple-500 focus:ring-purple-500 cursor-pointer"
              />
            </div>
            <p className="text-[10.5px] text-slate-300 leading-relaxed">
              ผสมผสานการวัดแบบ Deterministic (N-gram Overlap, ROUGE/BLEU, Entity Match) เข้ากับ LLM Faithfulness เพื่อความแม่นยำสูงสุด
            </p>
          </div>
        </div>

        {/* Case Study Transparency Note */}
        <div className="p-2.5 bg-slate-950/80 rounded-lg border border-purple-500/30 flex items-center justify-between font-mono text-[10.5px] text-purple-300">
          <span className="flex items-center gap-1.5">
            <FileCheck2 className="w-3.5 h-3.5 text-purple-400" />
            <strong>Case Baseline Tagging:</strong> กรณีศึกษา Q3/2025 ถูกกำหนดเป็น <i>[สมมติฐานเชิงประวัติศาสตร์ (Fictional Historical Baseline)]</i> เพื่อป้องกันความสับสนกับข้อมูลจริง
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 border border-purple-700 text-purple-200">
            Transparency Verified
          </span>
        </div>
      </div>
    </div>
  );
};

