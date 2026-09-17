import React, { useState } from 'react';
import { Shield, Lock, FileText, Activity, ExternalLink } from 'lucide-react';
import { GovernanceDashboard } from './GovernanceDashboard';

type TrustTab = 'security' | 'privacy';

const PRIVACY_CONTENT = `
# Privacy & Data Governance

This page documents privacy and data handling based on the current Firekeeper implementation. It is informational documentation, not a contractual Terms of Service.

## Current implementation

- Authentication uses Firebase Authentication when cloud mode is enabled.
- Conversation and memory data may be persisted through the application's configured repositories and authenticated backend.
- Local/offline mode uses local storage and an offline-local identity.
- API credentials intended for server-side use must remain server-side; client-side storage is used only where the application explicitly supports user-provided configuration.
- Users can manage conversation and memory data through the application's available controls.

## Important boundary

Privacy guarantees must follow the deployed configuration and implementation. Do not interpret this page as a promise of absolute privacy, universal encryption properties, or zero third-party processing.

For authoritative technical details, consult the source repository and deployment configuration.
`;

export const PrivacyTermsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TrustTab>('security');

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-100 font-display tracking-tight">Trust, Privacy & Security</h1>
              <p className="text-slate-400 text-sm font-mono uppercase tracking-widest mt-1">Implementation-backed project information</p>
            </div>
          </div>

          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
            <button onClick={() => setActiveTab('security')} className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-2 ${activeTab === 'security' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-slate-200'}`}>
              <Activity className="w-3.5 h-3.5" /> Security & Governance
            </button>
            <button onClick={() => setActiveTab('privacy')} className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-2 ${activeTab === 'privacy' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-slate-200'}`}>
              <Lock className="w-3.5 h-3.5" /> Privacy & Data
            </button>
          </div>
        </div>

        {activeTab === 'security' && (
          <section className="space-y-6">
            <GovernanceDashboard />
            <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-6 space-y-3">
              <div className="flex items-center gap-2 text-amber-500 font-semibold uppercase tracking-wide text-sm">
                <Shield className="w-5 h-5" /><span>Governance boundary</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                Firekeeper is designed around epistemic transparency, evidence-aware reasoning, deterministic validation and human decision authority.
                These are system design principles, not claims of legal certification or independent audit.
              </p>
              <p className="text-slate-400 text-xs leading-relaxed">
                References to ISO/IEC 42001 or NIST AI RMF describe documented design alignment/reference points; they must not be read as certification.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                <h3 className="font-semibold text-slate-200">Human decision authority</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">The system supports analysis and structured reasoning. Final decisions remain with the human user.</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                <h3 className="font-semibold text-slate-200">Security assessment status</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">Do not represent the project as independently certified or audited unless the repository explicitly provides that evidence.</p>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'privacy' && (
          <section className="bg-slate-900/30 p-8 rounded-3xl border border-slate-800/50">
            <div className="flex items-center gap-2 text-slate-300 mb-5">
              <FileText className="w-5 h-5 text-amber-500" /><span className="font-mono text-xs uppercase tracking-widest">Privacy documentation</span>
            </div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{PRIVACY_CONTENT}</div>
          </section>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold text-slate-200">Open Source License</h2>
            <p className="text-sm text-slate-400 mt-1">The repository is distributed under Apache License 2.0.</p>
          </div>
          <a href="https://github.com/punn-pca/firekeeper-core/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-xs font-mono text-slate-300 hover:text-white hover:border-amber-500/40 transition-colors">
            View LICENSE <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>
    </div>
  );
};
