import React from 'react';
import { ShieldCheck, AlertOctagon, CheckCircle2, Lock, AlertTriangle, FileText } from 'lucide-react';
import { GovernancePolicy, ConflictResolutionItem, HumanAgencyEnforcement } from '../types';

interface GovernancePoliciesViewerProps {
  policies?: GovernancePolicy[];
  conflicts?: ConflictResolutionItem[];
  agencyEnforcement?: HumanAgencyEnforcement;
}

export const GovernancePoliciesViewer: React.FC<GovernancePoliciesViewerProps> = ({
  policies = [],
  conflicts = [],
  agencyEnforcement,
}) => {
  const defaultPolicies: GovernancePolicy[] = [
    {
      id: 'GOV-01',
      name: 'Human Agency Control Protocol (ISO 42001)',
      category: 'Agency',
      status: 'PASSED',
      description: 'รับประกันสิทธิและทางเลือกของมนุษย์ในการควบคุม ปรับเปลี่ยน หรือระงับการตัดสินใจของ AI',
      ruleEnforced: 'Mandatory Human Oversight token required for high-risk domains.',
    },
    {
      id: 'GOV-02',
      name: 'NIST AI RMF Safety & Reliability Boundary',
      category: 'Safety',
      status: 'PASSED',
      description: 'ตรวจสอบความปลอดภัยทางเทคนิคและการจำกัดความเสี่ยงในระบบประมวลผล',
      ruleEnforced: 'Risk Score must remain under 35% before final output synthesis.',
    },
    {
      id: 'GOV-03',
      name: 'Factuality & Citation Provenance Standard',
      category: 'Factuality',
      status: 'GUARDED',
      description: 'ตรวจสอบว่าทุกสมมติฐานและโฆษณาอ้างอิงมีคลังหลักฐานรองรับเกิน 80%',
      ruleEnforced: 'Must cite primary evidence quotes for factual claims.',
    },
    {
      id: 'GOV-04',
      name: 'Executive Tone & Neutrality Policy',
      category: 'Tone',
      status: 'PASSED',
      description: 'รักษาความเป็นกลางทางการ ภาษาทางการ และไม่มีความลำเอียงเชิงบวกหรือลบเกินจริง',
      ruleEnforced: 'Maintain balanced executive tone and highlight trade-offs.',
    },
  ];

  const activePolicies = policies.length > 0 ? policies : defaultPolicies;
  const passedCount = activePolicies.filter((p) => p.status === 'PASSED').length;
  const allPassed = passedCount === activePolicies.length;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-emerald-300 flex items-center gap-2">
              Governance & Safety Policy Guard Matrix
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                allPassed
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-950 text-amber-300 border-amber-500/40'
              }`}>
                {passedCount}/{activePolicies.length} POLICIES PASSED
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              ระบบตรวจสอบกรอบนโยบายธรรมาภิบาลปัญญาประดิษฐ์ (ISO 42001 & NIST AI RMF) และความมั่นใจเชิงจริยธรรม
            </p>
          </div>
        </div>

        {agencyEnforcement && (
          <div className="text-right shrink-0">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Agency Protection Level</span>
            <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
              {agencyEnforcement.levelName}
            </span>
          </div>
        )}
      </div>

      {/* Policies List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {activePolicies.map((pol) => {
          const isPassed = pol.status === 'PASSED';
          const isGuarded = pol.status === 'GUARDED';

          return (
            <div
              key={pol.id}
              className={`p-3.5 rounded-xl border space-y-2 transition-all ${
                isPassed
                  ? 'bg-slate-950/70 border-emerald-500/30 hover:border-emerald-500/50'
                  : isGuarded
                  ? 'bg-slate-950/70 border-amber-500/30 hover:border-amber-500/50'
                  : 'bg-slate-950/70 border-rose-500/30 hover:border-rose-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  {pol.id} • {pol.category}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                    isPassed
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                      : isGuarded
                      ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                      : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {isPassed ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                  )}
                  {pol.status}
                </span>
              </div>

              <div>
                <h5 className="font-bold text-xs text-slate-200">{pol.name}</h5>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{pol.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                <FileText className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="text-slate-300 font-medium">กฎเกณฑ์: {pol.ruleEnforced}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Conflict Resolutions Engine Output */}
      {conflicts.length > 0 && (
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-2">
          <span className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-amber-400" />
            การแก้ไขข้อขัดแย้งเชิงนโยบายและตรรกะ (Policy Conflict Resolutions Engine)
          </span>
          <div className="space-y-2 pt-1">
            {conflicts.map((c) => (
              <div key={c.id} className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-200">{c.conflictDescription}</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    RESOLVED
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  <span className="text-slate-300 font-semibold">ทางออกที่เลือก:</span> {c.resolutionChoice}
                </p>
                <p className="text-[10px] text-slate-500 italic">เหตุผล: {c.rationale}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
