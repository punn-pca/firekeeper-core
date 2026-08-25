import React, { useState } from 'react';
import { Shield, CheckCircle2, AlertTriangle, Clock, FileText, Server, Lock, Cpu, Database, Globe } from 'lucide-react';

export interface CapabilityItem {
  capability: string;
  status: 'VERIFIED' | 'IMPLEMENTED' | 'BEHAVIORAL_ONLY' | 'CODE_READY' | 'NOT_PROVISIONED' | 'NOT_VERIFIED' | 'UNKNOWN' | 'CLAIM_ONLY';
  evidenceType: 'SOURCE_CODE' | 'CONFIGURATION' | 'EXECUTION_TRACE' | 'NONE' | 'THEORETICAL';
  sourceFiles: string[];
  verificationLevel: 'CODE_REVIEWED' | 'TESTED' | 'NOT_VERIFIED' | 'EXTERNAL_AUDIT_PENDING';
  limitations: string;
}

const CAPABILITIES: CapabilityItem[] = [
  {
    capability: 'Firebase Backend & Firestore',
    status: 'IMPLEMENTED',
    evidenceType: 'SOURCE_CODE',
    sourceFiles: ['src/lib/firebase.ts', 'server.ts'],
    verificationLevel: 'CODE_REVIEWED',
    limitations: 'Configured and connected via Firebase Admin SDK.'
  },
  {
    capability: 'Firebase Authentication',
    status: 'IMPLEMENTED',
    evidenceType: 'SOURCE_CODE',
    sourceFiles: ['src/lib/firebase.ts', 'firestore.rules'],
    verificationLevel: 'CODE_REVIEWED',
    limitations: 'Token verification active on server API routes.'
  },
  {
    capability: 'RBAC & Firestore Security Rules',
    status: 'IMPLEMENTED',
    evidenceType: 'CONFIGURATION',
    sourceFiles: ['firestore.rules'],
    verificationLevel: 'CODE_REVIEWED',
    limitations: 'Strict ownership and role validation rules enforced at database layer.'
  },
  {
    capability: 'Evidence Governance & Validation',
    status: 'IMPLEMENTED',
    evidenceType: 'SOURCE_CODE',
    sourceFiles: ['src/server/services/evidenceGovernance.ts'],
    verificationLevel: 'CODE_REVIEWED',
    limitations: 'Enforces invariants (No Evidence -> No Fact).'
  },
  {
    capability: 'Governance Gate (Layer A & B)',
    status: 'IMPLEMENTED',
    evidenceType: 'SOURCE_CODE',
    sourceFiles: ['src/social-agency/governanceGate.ts', 'server.ts'],
    verificationLevel: 'CODE_REVIEWED',
    limitations: 'Combines heuristic checks with Gemini semantic evaluation.'
  },
  {
    capability: 'Autonomous Worker Loop',
    status: 'IMPLEMENTED',
    evidenceType: 'SOURCE_CODE',
    sourceFiles: ['src/social-agency/executionPipeline.ts'],
    verificationLevel: 'CODE_REVIEWED',
    limitations: 'Runs autonomous cycles with drive evaluations.'
  },
  {
    capability: 'X (Twitter) API Integration',
    status: 'IMPLEMENTED',
    evidenceType: 'SOURCE_CODE',
    sourceFiles: ['src/server/services/xApi.ts'],
    verificationLevel: 'CODE_REVIEWED',
    limitations: 'Requires API keys configured in environment.'
  },
  {
    capability: 'Application Audit Logging',
    status: 'IMPLEMENTED',
    evidenceType: 'SOURCE_CODE',
    sourceFiles: ['src/utils/auditSanitizer.ts', 'src/utils/auditExport.ts'],
    verificationLevel: 'CODE_REVIEWED',
    limitations: 'Cryptographic hash chains implemented in application memory.'
  },
  {
    capability: 'Human Agency Enforcement',
    status: 'NOT_VERIFIED',
    evidenceType: 'SOURCE_CODE',
    sourceFiles: ['src/components/HumanAgencyEnforcer.tsx'],
    verificationLevel: 'NOT_VERIFIED',
    limitations: 'Approval UI implemented; full backend enforcement across all paths pending external audit.'
  },
  {
    capability: 'Confidence Calibration (ECE / Brier)',
    status: 'NOT_VERIFIED',
    evidenceType: 'THEORETICAL',
    sourceFiles: ['src/server/services/evidenceGovernance.ts'],
    verificationLevel: 'NOT_VERIFIED',
    limitations: 'Heuristic confidence score implemented; empirical calibration dataset pending.'
  },
  {
    capability: 'Long-Term Memory (LTM)',
    status: 'IMPLEMENTED',
    evidenceType: 'SOURCE_CODE',
    sourceFiles: ['src/services/memoryRepository.ts'],
    verificationLevel: 'CODE_REVIEWED',
    limitations: 'Local persistent memory & application memory layer active (not external vector DB).'
  },
  {
    capability: 'WORM Immutable Storage',
    status: 'NOT_PROVISIONED',
    evidenceType: 'NONE',
    sourceFiles: [],
    verificationLevel: 'NOT_VERIFIED',
    limitations: 'Google Cloud Storage WORM bucket not provisioned.'
  },
  {
    capability: 'RFC 3161 Timestamping',
    status: 'NOT_VERIFIED',
    evidenceType: 'NONE',
    sourceFiles: [],
    verificationLevel: 'NOT_VERIFIED',
    limitations: 'Time-stamping authority integration pending.'
  },
  {
    capability: 'ISO 42001 & PDPA Compliance',
    status: 'NOT_VERIFIED',
    evidenceType: 'THEORETICAL',
    sourceFiles: ['src/data/whitepaperData.ts'],
    verificationLevel: 'NOT_VERIFIED',
    limitations: 'Aligned with reference principles; independent certification not performed.'
  }
];

export const CapabilityStatusPanel: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<CapabilityItem | null>(null);

  const getStatusBadge = (status: CapabilityItem['status']) => {
    switch (status) {
      case 'VERIFIED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">VERIFIED</span>;
      case 'IMPLEMENTED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/30">IMPLEMENTED</span>;
      case 'NOT_PROVISIONED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/30">NOT PROVISIONED</span>;
      case 'NOT_VERIFIED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">NOT VERIFIED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-slate-950/95 border border-sky-500/30 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-sky-300">FIREKEEPER CAPABILITY STATUS & EVIDENCE MODEL</h3>
            <p className="text-xs text-slate-400">
              สถานะความพร้อมและระดับหลักฐานพิสูจน์ตามหลัก Implementation Reality (IMPLEMENTED ≠ VERIFIED)
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {CAPABILITIES.map((item, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedItem(item)}
            className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/40 transition cursor-pointer flex flex-col justify-between space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-xs text-slate-200">{item.capability}</span>
              {getStatusBadge(item.status)}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono">
              <span>Evidence: {item.evidenceType}</span>
              <span className="text-sky-400">Inspect Metadata →</span>
            </div>
          </div>
        ))}
      </div>

      {selectedItem && (
        <div className="p-4 rounded-xl bg-slate-950 border border-sky-500/40 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-sky-300">🔍 Evidence Metadata: {selectedItem.capability}</span>
            <button
              onClick={() => setSelectedItem(null)}
              className="text-slate-400 hover:text-slate-200 text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-800"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
            <div><strong>Status:</strong> {selectedItem.status}</div>
            <div><strong>Evidence Type:</strong> {selectedItem.evidenceType}</div>
            <div><strong>Verification Level:</strong> {selectedItem.verificationLevel}</div>
            <div><strong>Source Files:</strong> {selectedItem.sourceFiles.length > 0 ? selectedItem.sourceFiles.join(', ') : 'None'}</div>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[11px]">
            <strong>Limitations & Scope Note:</strong> {selectedItem.limitations}
          </div>
        </div>
      )}
    </div>
  );
};
