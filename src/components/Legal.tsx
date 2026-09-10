import React, { useState } from 'react';
import { Shield, Lock, Eye, Trash2, UserCheck, Globe, Info, FileText, Activity } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GovernanceDashboard } from './GovernanceDashboard';

const PRIVACY_POLICY_CONTENT = `
# Privacy Policy & Data Governance

**Last Updated:** September 2026

## 1. Executive Summary & Epistemic Trust
Firekeeper ("we", "our", or "platform") operates under strict Data Governance and Epistemic Integrity directives. We respect your autonomy, privacy, and sovereignty over your proprietary data and reasoning workflows.

## 2. Information We Collect
- **Authentication Credentials:** Firebase Auth UID, verified email address, and authentication session metadata.
- **Cognitive Session Data:** User conversation logs, document attachments (PDF/text), long-term memories, and structured PCA reasoning traces.
- **Telemetry & Operational Metrics:** Anonymized token counts, latency measurements, and system audit logs.

## 3. Strict Account Isolation & Zero Cross-Contamination
- **Tenant Isolation:** All conversations, memory items, and private LLM contextual windows are cryptographically and logically isolated by verified User ID (\`userId\`).
- **Zero Training Data Re-use:** Your prompts, uploads, and reasoning records are **never** used to train public foundation models or shared with unauthorized third parties.
- **Client-Scoped Persistence:** Storage tokens and keys are securely scoped in isolated local and session vaults.

## 4. Third-Party AI Processors
When executing reasoning tasks, Firekeeper proxies calls through secure, enterprise-tier API endpoints (e.g. Google Gemini, DeepSeek). All API keys remain strictly server-side, never exposed to client browsers.

## 5. User Rights & Data Erasure
- **Right to Access:** You may view and export your entire conversation history and memory records at any time.
- **Right to Erasure (Forget Me):** You have the irrevocable right to delete individual conversations, clear your Memory Bank, or purge local cache storage instantly.

## 6. Security & Encryption Standards
- **In Transit:** TLS 1.3 encryption across all client-server communication channels.
- **At Rest:** AES-256 cloud encryption backed by granular Firestore Security Rules.
`;

const TERMS_OF_SERVICE_CONTENT = `
# Terms of Service & AI Governance Agreement

**Last Updated:** September 2026

## 1. Acceptance of Terms
By accessing or utilizing Firekeeper, you agree to be bound by these Terms of Service and our AI Governance Framework.

## 2. PUNN Cognitive Architecture & Human Agency
- **AI Assists. Human Decides:** Firekeeper provides cognitive intelligence, structured epistemic reasoning (PCA), and evidence assessment. Final decision authority, strategic execution, and accountability reside strictly with the human user ("Human Agency").
- **Attribution & Identity:** PUNN is the Creator Identity and Human Architect behind Firekeeper. Firekeeper is the cognitive AI framework.

## 3. Epistemic Transparency
- Firekeeper categorizes information into verifiable tiers: **[FACT]** (ground truth / confirmed), **[EVIDENCE]** (retrieved documents / web data), **[INFERENCE]** (reasoning models), and **[UNKNOWN]** (epistemic boundary).
- Users agree to review reasoning chains and not treat unverified inferences as guaranteed legal, medical, or financial counsel.

## 4. Acceptable Use
Users agree not to:
- Attempt privilege escalation or circumvent cross-account data isolation boundaries.
- Transmit malicious payloads, automated attacks, or illicit content through the reasoning engine.
- Misrepresent AI-generated inferences as official state or institutional edicts.

## 5. Service Availability & Offline Operations
Firekeeper supports both cloud-synchronized and local offline-isolated modes for uninterrupted analytical continuity.

## 6. Contact & Support
For governance inquiries or security disclosures, reach out to the project maintainers via official platform channels.
`;

export const PrivacyTermsPage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'privacy' | 'terms' | 'governance'>('governance');

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-100 font-display tracking-tight">Security & Governance</h1>
              <p className="text-slate-400 text-sm font-mono uppercase tracking-widest mt-1">Trust Framework 1.0</p>
            </div>
          </div>

          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveSubTab('governance')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-2 ${
                activeSubTab === 'governance' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Security Audit
            </button>
            <button
              onClick={() => setActiveSubTab('privacy')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-2 ${
                activeSubTab === 'privacy' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Privacy Policy
            </button>
            <button
              onClick={() => setActiveSubTab('terms')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-2 ${
                activeSubTab === 'terms' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Terms
            </button>
          </div>
        </div>

        {activeSubTab === 'governance' && <GovernanceDashboard />}

        {activeSubTab !== 'governance' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/50 space-y-3 hover:border-amber-500/30 transition-colors">
              <Lock className="w-6 h-6 text-amber-500" />
              <h3 className="font-semibold text-slate-200">Account Isolation</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                สถาปัตยกรรมแยกส่วนข้อมูลระดับ UID (Strict UID Isolation) มั่นใจได้ว่าข้อมูลของคุณเข้าถึงได้เฉพาะคุณเท่านั้น
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/50 space-y-3 hover:border-amber-500/30 transition-colors">
              <Eye className="w-6 h-6 text-amber-500" />
              <h3 className="font-semibold text-slate-200">Transparency</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                เปิดเผยกระบวนการคิดของ AI ในทุกขั้นตอน (PCA 12-Stages) เพื่อให้คุณตรวจสอบที่มาของเหตุผลได้จริง
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/50 space-y-3 hover:border-amber-500/30 transition-colors">
              <UserCheck className="w-6 h-6 text-amber-500" />
              <h3 className="font-semibold text-slate-200">Human Agency</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                ยึดหลักมนุษย์เป็นศูนย์กลางในการตัดสินใจ AI ทำหน้าที่เป็นเพียงผู้ช่วยวิเคราะห์ข้อมูลและหลักฐาน
              </p>
            </div>
          </div>
        )}
      </section>

      {activeSubTab === 'privacy' && (
        <section className="prose prose-invert prose-slate max-w-none bg-slate-900/30 p-8 rounded-3xl border border-slate-800/50 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <ReactMarkdown>{PRIVACY_POLICY_CONTENT}</ReactMarkdown>
        </section>
      )}

      {activeSubTab === 'terms' && (
        <section className="prose prose-invert prose-slate max-w-none bg-slate-900/30 p-8 rounded-3xl border border-slate-800/50 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <ReactMarkdown>{TERMS_OF_SERVICE_CONTENT}</ReactMarkdown>
        </section>
      )}

      <section className="bg-amber-500/5 border border-amber-500/10 p-8 rounded-3xl space-y-4">
        <div className="flex items-center gap-2 text-amber-500 font-semibold italic uppercase tracking-tighter">
          <Shield className="w-5 h-5" />
          <span>AI Governance Statement</span>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">
          Firekeeper ได้รับการออกแบบโดยอ้างอิงกรอบมาตรฐาน **ISO/IEC 42001 (AI Management System)** และ **NIST AI Risk Management Framework** เพื่อมุ่งเน้นความเป็นธรรม (Fairness), ความน่าเชื่อถือ (Reliability) และความโปร่งใส (Transparency) ของระบบปัญญาประดิษฐ์ในระดับสากล
        </p>
        <div className="pt-4 border-t border-amber-500/10 flex flex-wrap gap-4 text-[10px] font-mono text-amber-500/60 uppercase tracking-widest">
          <span>• AES-256 REST ENCRYPTION</span>
          <span>• TLS 1.3 TRANSIT</span>
          <span>• STRICT UID ISOLATION</span>
          <span>• NO AI TRAINING DATA RE-USE</span>
        </div>
      </section>
    </div>
  );
};
