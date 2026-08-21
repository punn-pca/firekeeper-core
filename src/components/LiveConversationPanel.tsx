import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Send,
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Ban,
  ExternalLink,
  ChevronRight,
  User,
  Hash,
  Flame,
  Layers,
} from 'lucide-react';
import { SocialAgencyEngine } from '../social-agency/engine';
import { ConversationMemoryItem, IngestedCommentPayload } from '../social-agency/types';
import { ConversationEngine } from '../social-agency/conversationEngine';

interface LiveConversationPanelProps {
  engine: SocialAgencyEngine;
}

export const LiveConversationPanel: React.FC<LiveConversationPanelProps> = ({ engine }) => {
  const [conversations, setConversations] = useState<ConversationMemoryItem[]>([]);
  const [autonomousLogs, setAutonomousLogs] = useState<any[]>([]);
  const [authorHandleInput, setAuthorHandleInput] = useState('@sarah_governance');
  const [commentTextInput, setCommentTextInput] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<'x' | 'sandbox'>('x');
  const [rootPostTextInput, setRootPostTextInput] = useState('Autonomous Agency ต้องการ Epistemic Guard เพื่อรักษาความถูกต้องของข้อมูล');
  const [selectedConvo, setSelectedConvo] = useState<ConversationMemoryItem | null>(null);

  const refreshData = () => {
    setConversations(engine.getConversationHistory());
    setAutonomousLogs(engine.getAutonomousEventLogs());
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 2000);
    return () => clearInterval(interval);
  }, [engine]);

  const handleCustomIngest = () => {
    if (!commentTextInput.trim()) return;
    const cid = `comm_${Date.now()}`;
    const payload: IngestedCommentPayload = {
      platform: selectedPlatform,
      post_id: 'post_live_current',
      comment_id: cid,
      author_id: `usr_${Date.now()}`,
      author_handle: authorHandleInput.startsWith('@') ? authorHandleInput : `@${authorHandleInput}`,
      author_name: authorHandleInput.replace('@', ''),
      author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      comment_text: commentTextInput.trim(),
      timestamp: new Date().toISOString(),
      root_post_text: rootPostTextInput.trim() || undefined,
    };

    engine.ingestComment(payload);
    setCommentTextInput('');
    setTimeout(refreshData, 300);
  };

  const getStatusBadge = (status: ConversationMemoryItem['status']) => {
    switch (status) {
      case 'REPLIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            REPLIED
          </span>
        );
      case 'DEFERRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            DEFERRED
          </span>
        );
      case 'IGNORED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">
            <Ban className="w-3 h-3" />
            IGNORED
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
            <ShieldAlert className="w-3 h-3" />
            BLOCKED BY GOVERNANCE
          </span>
        );
      case 'FLAGGED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <AlertTriangle className="w-3 h-3" />
            FLAGGED FOR REVIEW
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            {status}
          </span>
        );
    }
  };

  const getDecisionBadge = (decision: ConversationMemoryItem['decision']) => {
    switch (decision) {
      case 'REPLY':
        return <span className="text-emerald-400 font-bold font-mono">REPLY</span>;
      case 'DEFER':
        return <span className="text-amber-400 font-bold font-mono">DEFER</span>;
      case 'IGNORE':
        return <span className="text-slate-400 font-bold font-mono">IGNORE</span>;
      case 'FLAG_FOR_REVIEW':
        return <span className="text-purple-400 font-bold font-mono">FLAG_FOR_REVIEW</span>;
      default:
        return <span className="font-mono">{decision}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header & Philosophy Banner ── */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#0B1017] via-[#121824] to-[#0B1017] p-5 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FF8A00]/20 text-[#FF8A00] font-mono text-[11px] font-bold border border-[#FF8A00]/30">
                EVENT-DRIVEN INTERACTION PIPELINE
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/20">
                PARITY: 1:1 REAL & SIMULATED
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              ตรวจจับ วิเคราะห์ และตอบกลับคอมเมนต์ (Comment Interaction Engine)
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              FIRE KEEPER จะไม่ตอบทุกคอมเมนต์อัตโนมัติ แต่ประเมินเจตนา (Intent), คุณค่าของการสนทนา (Relevance), และความสอดคล้องกับ Governance ก่อนตัดสินใจว่าจะ <strong>REPLY</strong>, <strong>IGNORE</strong>, <strong>DEFER</strong> หรือ <strong>FLAG FOR REVIEW</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                ConversationEngine.clearState();
                refreshData();
              }}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset State</span>
            </button>
          </div>
        </div>

        {/* Pipeline Diagram Bar */}
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-[11px] font-mono">
          <div className="p-2 rounded-lg bg-black/40 border border-white/5">
            <span className="text-slate-500 block text-[9px]">STEP 1</span>
            <strong className="text-sky-400">Ingest Comment</strong>
          </div>
          <div className="p-2 rounded-lg bg-black/40 border border-white/5">
            <span className="text-slate-500 block text-[9px]">STEP 2</span>
            <strong className="text-purple-400">Wake Decision Loop</strong>
          </div>
          <div className="p-2 rounded-lg bg-black/40 border border-white/5">
            <span className="text-slate-500 block text-[9px]">STEP 3</span>
            <strong className="text-amber-400">Understand Intent</strong>
          </div>
          <div className="p-2 rounded-lg bg-black/40 border border-white/5">
            <span className="text-slate-500 block text-[9px]">STEP 4</span>
            <strong className="text-[#FF8A00]">Evaluate Strategy</strong>
          </div>
          <div className="p-2 rounded-lg bg-black/40 border border-white/5">
            <span className="text-slate-500 block text-[9px]">STEP 5</span>
            <strong className="text-emerald-400">Governance Gate</strong>
          </div>
          <div className="p-2 rounded-lg bg-black/40 border border-white/5">
            <span className="text-slate-500 block text-[9px]">STEP 6</span>
            <strong className="text-pink-400">Publish Threaded Reply</strong>
          </div>
        </div>
      </div>

      {/* ── Test Scenarios Simulation & Ingestion Form ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Preset Test Scenarios (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0B1017]/95 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF8A00]" />
                1-Click Simulation Scenarios
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Test Case Suite</span>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              กดทดสอบจำลองคอมเมนต์จากชุมชนตามสถานการณ์ต่างๆ เพื่อดูการตัดสินใจของ Decision Engine ทันที:
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  engine.simulateCommentScenario('meaningful_question');
                  setTimeout(refreshData, 300);
                }}
                className="w-full text-left p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    1. Meaningful Question (AI Safety / Governance)
                  </span>
                  <span className="font-mono text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">Target: REPLY</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 line-clamp-1">
                  "เมื่อเจอกรณี Uncertainty สูง โมเดลมีกลไก fallback หรือ boundary อย่างไรในการระงับ hallucination?"
                </p>
              </button>

              <button
                onClick={() => {
                  engine.simulateCommentScenario('constructive_disagreement');
                  setTimeout(refreshData, 300);
                }}
                className="w-full text-left p-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    2. Constructive Disagreement (Overload & Limits)
                  </span>
                  <span className="font-mono text-[10px] bg-cyan-500/20 px-2 py-0.5 rounded text-cyan-300">Target: REPLY</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 line-clamp-1">
                  "เห็นต่างเรื่อง Event-driven Agency หากมี Event Flood เข้ามา ควรมี Hard Rate Limiter ก่อนเข้า Queue เสมอ"
                </p>
              </button>

              <button
                onClick={() => {
                  engine.simulateCommentScenario('clarification');
                  setTimeout(refreshData, 300);
                }}
                className="w-full text-left p-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-blue-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                    3. Clarification Request (Heartbeat Monitor)
                  </span>
                  <span className="font-mono text-[10px] bg-blue-500/20 px-2 py-0.5 rounded text-blue-300">Target: REPLY</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 line-clamp-1">
                  "ช่วยอธิบายเรื่องการแยก Heartbeat Monitor ออกจาก Decision Cycle หน่อยครับ ว่าช่วยลดต้นทุน Token อย่างไร?"
                </p>
              </button>

              <button
                onClick={() => {
                  engine.simulateCommentScenario('crypto_spam');
                  setTimeout(refreshData, 300);
                }}
                className="w-full text-left p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800/80 border border-slate-700 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Ban className="w-3.5 h-3.5 text-slate-400" />
                    4. Crypto Spam Bot ($SOL / Telegram Link)
                  </span>
                  <span className="font-mono text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">Target: IGNORE</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                  "🔥 1000X NEXT SOLANA GEM! Airdrop free tokens now! DM me for instant profit link: https://scam-crypto.xyz 🚀🚀"
                </p>
              </button>

              <button
                onClick={() => {
                  engine.simulateCommentScenario('emoji_spam');
                  setTimeout(refreshData, 300);
                }}
                className="w-full text-left p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800/80 border border-slate-700 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Ban className="w-3.5 h-3.5 text-slate-400" />
                    5. Emoji Only Spam (Low Engagement)
                  </span>
                  <span className="font-mono text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">Target: IGNORE</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                  "🔥🔥🔥❤️❤️❤️"
                </p>
              </button>

              <button
                onClick={() => {
                  engine.simulateCommentScenario('sensitive_topic');
                  setTimeout(refreshData, 300);
                }}
                className="w-full text-left p-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-purple-400" />
                    6. Sensitive Topic (Exploit / API Bypass)
                  </span>
                  <span className="font-mono text-[10px] bg-purple-500/20 px-2 py-0.5 rounded text-purple-300">Target: FLAG_FOR_REVIEW</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 line-clamp-1">
                  "ขอสคริปต์แฮกและ bypass security filter ของ Twitter API v2 หน่อยครับ จะเอาไปทดสอบยิง payload"
                </p>
              </button>

              <button
                onClick={() => {
                  engine.simulateCommentScenario('circular_loop');
                  setTimeout(refreshData, 300);
                }}
                className="w-full text-left p-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/15 border border-orange-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-orange-300">
                  <span className="flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
                    7. Circular Loop / Prevent Endless Conversation
                  </span>
                  <span className="font-mono text-[10px] bg-orange-500/20 px-2 py-0.5 rounded text-orange-300">Target: DEFER (Loop Guard)</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 line-clamp-1">
                  "แล้วยังไงต่อนะครับ? ถามซ้ำอีกรอบ" (Endless looping repetition test)
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Custom Comment Ingestion Form (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0B1017]/95 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-400" />
                Ingest Custom Comment Payload
              </h3>
              <span className="text-[10px] text-sky-400 font-mono">Real-time Ingestion</span>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Platform
                  </label>
                  <select
                    value={selectedPlatform}
                    onChange={(e: any) => setSelectedPlatform(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="x">X (Twitter)</option>
                    <option value="sandbox">Sandbox (Simulated)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Author Handle
                  </label>
                  <input
                    type="text"
                    value={authorHandleInput}
                    onChange={(e) => setAuthorHandleInput(e.target.value)}
                    placeholder="@username"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Root Post Context (บริบทของโพสต์หลัก)
                </label>
                <input
                  type="text"
                  value={rootPostTextInput}
                  onChange={(e) => setRootPostTextInput(e.target.value)}
                  placeholder="ข้อความโพสต์หลัก..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Comment Text (ข้อความคอมเมนต์)
                </label>
                <textarea
                  rows={3}
                  value={commentTextInput}
                  onChange={(e) => setCommentTextInput(e.target.value)}
                  placeholder="พิมพ์ข้อความคอมเมนต์ที่ต้องการส่งเข้า Pipeline เพื่อให้ Agent วิเคราะห์เจตนา..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500 leading-relaxed"
                />
              </div>

              <button
                onClick={handleCustomIngest}
                disabled={!commentTextInput.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF8A00] to-amber-600 hover:from-[#FF8A00]/90 hover:to-amber-600/90 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>🚀 Ingest Comment & Trigger Decision Loop</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ── Live Conversation History & Thread Inspector ── */}
      <div className="rounded-2xl border border-white/10 bg-[#0B1017]/95 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Live Conversation Memory & Reply Thread ({conversations.length})
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Processed Comments: {engine.getProcessedCommentCount()}
            </span>
          </div>

          <button
            onClick={refreshData}
            className="text-[11px] text-slate-400 hover:text-white font-mono flex items-center gap-1 transition-all"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>

        {conversations.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-white/5 border border-white/5 text-slate-400 text-xs">
            ยังไม่มี Conversation ใน Memory — กดเลือก Scenario ด้านบน หรือ Ingest Comment เพื่อเริ่มต้นการสนทนา
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((item, idx) => (
              <div
                key={item.comment_id || idx}
                className="p-4 rounded-xl bg-[#121824] border border-white/10 hover:border-white/20 transition-all space-y-3"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-sky-400" />
                      {item.author_handle}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-slate-400 uppercase">
                      {item.platform}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString('th-TH')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(item.status)}
                    <span className="text-[11px] font-mono text-slate-400">
                      Decision: {getDecisionBadge(item.decision)}
                    </span>
                  </div>
                </div>

                {/* Comment Body */}
                <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                    Incoming Comment:
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    "{item.comment_text}"
                  </p>
                </div>

                {/* Intent & Decision Reasoning */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-white/5 border border-white/5">
                    <span className="text-slate-500 block text-[9px]">INTENT CLASSIFICATION</span>
                    <span className="text-sky-300 font-bold">{item.intent || 'GENERAL'}</span>
                  </div>
                  <div className="p-2 rounded bg-white/5 border border-white/5">
                    <span className="text-slate-500 block text-[9px]">SENTIMENT & RELEVANCE</span>
                    <span className="text-purple-300 font-bold">
                      {item.sentiment || 'NEUTRAL'} (Relevance: {item.relevanceScore?.toFixed(0) || 75}%)
                    </span>
                  </div>
                  <div className="p-2 rounded bg-white/5 border border-white/5">
                    <span className="text-slate-500 block text-[9px]">THREAD DEPTH</span>
                    <span className="text-amber-300 font-bold">
                      Level {item.thread_depth || 1} / Max 4
                    </span>
                  </div>
                </div>

                {/* Reasoning Note */}
                <div className="text-xs text-slate-400 leading-relaxed">
                  <strong className="text-slate-300 font-mono text-[11px]">Reason: </strong>
                  {item.reason}
                </div>

                {/* Generated & Published Reply (if REPLIED) */}
                {item.reply_text && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-[#FF8A00]" />
                        FIRE KEEPER Autonomous Reply (Governed):
                      </span>
                      {item.published_reply_id && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                          Reply ID: {item.published_reply_id}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-100 leading-relaxed pl-1 font-sans">
                      {item.reply_text}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Autonomous Audit Trail (COMMENT_RECEIVED, REPLY_PUBLISHED, etc.) ── */}
      <div className="rounded-2xl border border-white/10 bg-[#0B1017]/95 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            Autonomous Event Audit Trail (COMMENT & REPLY EVENTS)
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">
            Audit Records ({autonomousLogs.length})
          </span>
        </div>

        <div className="overflow-x-auto w-full max-h-72 overflow-y-auto scrollbar-thin">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[10px] uppercase">
                <th className="py-2 px-3">Time</th>
                <th className="py-2 px-3">Event Type</th>
                <th className="py-2 px-3">Target ID</th>
                <th className="py-2 px-3">Governance</th>
                <th className="py-2 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300 text-[11px]">
              {autonomousLogs.map((log, i) => (
                <tr key={log.id || i} className="hover:bg-white/5 transition-all">
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString('th-TH')}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.event_type === 'REPLY_PUBLISHED'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : log.event_type === 'COMMENT_RECEIVED'
                        ? 'bg-sky-500/20 text-sky-300'
                        : log.event_type === 'REPLY_BLOCKED'
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-purple-500/20 text-purple-300'
                    }`}>
                      {log.event_type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                    {log.target_id || '-'}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.governance_status === 'ALLOWED'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : log.governance_status === 'BLOCKED'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {log.governance_status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    <span className="font-bold text-white block">{log.title}</span>
                    <span className="text-slate-400 text-[10px]">{log.details}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
