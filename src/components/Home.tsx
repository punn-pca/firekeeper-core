import React, { useState, useRef } from 'react';
import {
  Activity,
  ChevronRight,
  FileText,
  Flame,
  Globe,
  History,
  Layers,
  Paperclip,
  ShieldAlert,
  ShieldCheck,
  Target,
  UserCheck,
  Workflow,
  X,
  Lock,
  Send,
  ExternalLink,
  ArrowRight,
  Settings2,
} from 'lucide-react';
import { AttachedFile as Attachment, ToneMode, ReasoningProfile } from '../types';

interface HomeProps {
  onExecute: (prompt: string, attachments: Attachment[], tone?: ToneMode, deep?: boolean, profile?: ReasoningProfile) => void;
  isAuthenticated: boolean;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
  onViewArchitecture: () => void;
  onLearnPCA: () => void;
  onSelectActivity: (id: string) => void;
  onNavigateDocs: (section: string) => void;
  tone: ToneMode;
  setTone: (tone: ToneMode) => void;
  deepReasoning: boolean;
  setDeepReasoning: (deep: boolean) => void;
  reasoningProfile: ReasoningProfile;
  setReasoningProfile: (profile: ReasoningProfile) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  webSearch: boolean;
  onToggleWebSearch: () => void;
  isAnalyzing: boolean;
  isLight: boolean;
}

export const Home: React.FC<HomeProps> = ({ 
  onExecute,
  isAuthenticated,
  onOpenAuth,
  onOpenSettings,
  onViewArchitecture,
  onLearnPCA,
  onSelectActivity,
  onNavigateDocs,
  tone,
  setTone,
  deepReasoning,
  setDeepReasoning,
  reasoningProfile,
  setReasoningProfile,
  selectedModel,
  setSelectedModel,
  webSearch,
  onToggleWebSearch,
  isAnalyzing,
  isLight
}) => {
  const [prompt, setPrompt] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const card = isLight ? 'fk-surface border-slate-200 shadow-sm' : 'fk-surface border-white/10 backdrop-blur-xl';
  const cardInteractive = isLight
    ? 'fk-surface border-slate-200 hover:border-amber-500/50 hover:shadow-md transition-all cursor-pointer'
    : 'fk-surface border-white/10 hover:border-amber-500/30 hover:bg-white/[0.05] transition-all cursor-pointer';

  const processFileList = (files: FileList) => {
    const newAttachments: Attachment[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handleSubmit = () => {
    if (!prompt.trim() && attachments.length === 0) return;
    onExecute(prompt, attachments, tone, deepReasoning, reasoningProfile);
    setPrompt('');
    setAttachments([]);
  };

  const systemItems = [
    { label: 'PCA v3.0 Core', icon: Workflow },
    { label: 'Evidence Engine', icon: ShieldCheck },
    { label: 'Governance Guard', icon: Lock },
    { label: 'Memory Bank', icon: Layers },
  ];

  const recentDecisions = [
    { title: 'Market Expansion APAC', time: '2h ago', status: 'VERIFIED', statusColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' },
    { title: 'Q4 Capex Allocation', time: '5h ago', status: 'ADVISORY', statusColor: 'border-amber-500/30 text-amber-400 bg-amber-500/5' },
    { title: 'Supply Chain Audit', time: '1d ago', status: 'VERIFIED', statusColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' },
  ];

  return (
    <div className="relative min-w-0 flex-1 overflow-x-hidden px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Workspace Layout */}
      <div className="relative z-10 mx-auto grid w-full max-w-[1780px] items-start gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">

        {/* Primary workspace — navigation is owned by NavigationDrawer */}
        {/* CENTER CONTENT AREA */}
        <div className="flex min-w-0 flex-col gap-5 sm:gap-8">
          <section className="flex flex-col gap-5 pt-4 sm:pt-10 pb-8 sm:pb-16 text-center relative overflow-hidden rounded-3xl">
            {/* Header Background Glow */}
            <div className="absolute inset-0 z-0 opacity-20">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[200px] sm:h-[300px] bg-amber-500/20 blur-[80px] sm:blur-[120px] rounded-full" />
            </div>

            <div className="flex flex-col gap-4 relative z-10 items-center px-4">
              <div className="flex items-center gap-3">
                 <span className="h-px w-6 sm:w-12 bg-amber-500/50" />
                 <span className="font-mono text-[9px] sm:text-[11px] font-bold tracking-[0.2em] sm:tracking-[0.4em] text-amber-500 uppercase">PCA v3.0 / Sovereign Intelligence</span>
                 <span className="h-px w-6 sm:w-12 bg-amber-500/50" />
              </div>
              <h1 className="font-sans text-[clamp(2rem,9vw,3.75rem)] font-medium tracking-tight text-white sm:text-6xl lg:text-8xl">
                คิดให้ลึกซึ้ง <br />
                <span className="text-amber-400">ตัดสินใจให้ปลอดภัย</span>
              </h1>
              <p className="mt-2 sm:mt-4 max-w-2xl px-2 text-sm leading-6 sm:px-0 sm:text-xl text-[var(--fk-text-secondary)] leading-relaxed mx-auto font-medium">
                AI ที่เน้นหลักฐานเป็นฐานสำหรับการตัดสินใจในระดับองค์กรที่ซับซ้อน <br />
                <span className="text-slate-500 text-xs sm:text-base font-normal">สร้างขึ้นบนสถาปัตยกรรมการคิดเชิงทำนาย PUNN (PCA)</span>
              </p>
            </div>
          </section>

          <section className="w-full sticky top-[56px] sm:top-[76px] z-30 -mx-3 px-3 sm:mx-0 sm:px-0">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && processFileList(e.target.files)}
            />
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files.length) processFileList(e.dataTransfer.files);
              }}
              className={`overflow-hidden rounded-2xl border transition-all duration-300 fk-surface-elevated backdrop-blur-xl shadow-2xl focus-within:border-amber-500/40 focus-within:shadow-[0_0_50px_rgba(245,158,11,0.15)] ${isDragging ? 'border-amber-500 bg-amber-500/10' : isLight ? 'bg-white border-slate-200' : 'border-white/10'}`}
            >
              <div className="relative">
                {attachments.length > 0 && (
                  <div className="flex max-h-24 flex-wrap gap-2 overflow-y-auto border-b border-white/5 p-2 bg-[var(--fk-overlay-subtle)]">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-200">
                        <Paperclip className="h-3 w-3 text-slate-400" />
                        <span className="max-w-[100px] truncate">{attachment.name}</span>
                        <button onClick={() => setAttachments(prev => prev.filter(a => a.id !== attachment.id))} className="text-slate-500 hover:text-rose-400">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="ถามคำถามเชิงกลยุทธ์ วิเคราะห์การตัดสินใจ..."
                  className="fk-input w-full bg-transparent p-3.5 sm:p-6 text-base sm:text-xl outline-none min-h-[96px] sm:min-h-[160px] resize-none leading-relaxed"
                  autoFocus
                />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-white/[0.06] bg-[var(--fk-overlay)] px-4 py-3 gap-3">
                  <div className="flex items-center justify-between sm:justify-start gap-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                        title="แนบไฟล์"
                      >
                        <Paperclip className="h-5 w-5" />
                      </button>
                      <div className="h-6 w-px bg-white/10 mx-1" />
                      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                        <Globe className="h-4 w-4 text-cyan-400" />
                        <span className="text-[10px] sm:text-xs font-medium text-slate-300">ค้นหาเว็บ</span>
                        <div 
                          onClick={onToggleWebSearch}
                          className={`relative h-4 w-7 sm:h-5 sm:w-9 rounded-full transition-colors cursor-pointer ${webSearch ? 'bg-cyan-500' : 'bg-slate-700'}`}
                        >
                          <div className={`absolute top-0.5 sm:top-1 h-3 w-3 rounded-full bg-white transition-all ${webSearch ? 'left-3.5 sm:left-5' : 'left-0.5 sm:left-1'}`} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
                    <button 
                      onClick={onOpenSettings}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[10px] sm:text-xs font-medium text-slate-400 hover:bg-white/5 transition-all"
                    >
                      <Settings2 className="h-4 w-4" />
                      <span className="hidden xs:inline">ตั้งค่าขั้นสูง</span>
                    </button>
                    <button 
                      onClick={handleSubmit}
                      disabled={isAnalyzing || (!prompt.trim() && attachments.length === 0)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-black hover:bg-amber-400 transition-all active:scale-[0.98] shadow-[0_0_25px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <span className="group-hover:translate-x-[-2px] transition-transform uppercase">ประมวลผล PCA</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-[2px] transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
            {[
              { 
                title: 'ที่ปรึกษาเชิงกลยุทธ์', 
                desc: 'วิเคราะห์กลยุทธ์และโอกาสในการเติบโต', 
                img: '/src/assets/images/strategy_card_visual_1789391908739.jpg',
                color: 'text-cyan-400',
                prompt: 'ช่วยวิเคราะห์กลยุทธ์การขยายตลาดในปีหน้าให้หน่อย'
              },
              { 
                title: 'ความเสี่ยงและธรรมาภิบาล', 
                desc: 'ประเมินความเสี่ยงและผลกระทบทางการเงิน', 
                img: '/src/assets/images/risk_card_visual_1789391922361.jpg',
                color: 'text-rose-400',
                prompt: 'ประเมินความเสี่ยงด้านการลงทุนในโครงการใหม่นี้'
              },
              { 
                title: 'ข้อมูลเชิงแข่งขัน', 
                desc: 'ข้อมูลการตลาดเชิงลึกและเรดาร์คู่แข่ง', 
                img: '/src/assets/images/competitive_card_visual_1789391935900.jpg',
                color: 'text-amber-400',
                prompt: 'สรุปความเคลื่อนไหวล่าสุดของคู่แข่งหลักในอุตสาหกรรม'
              },
              { 
                title: 'การดำเนินงานและ ROI', 
                desc: 'กระบวนการ ผลตอบแทน และการประมวลผล', 
                img: '/src/assets/images/operations_card_visual_1789391948369.jpg',
                color: 'text-emerald-400',
                prompt: 'วิเคราะห์ ROI ของการปรับปรุงกระบวนการดำเนินงานปัจจุบัน'
              },
            ].map((feature, i) => (
              <div 
                key={i} 
                className={`group relative overflow-hidden rounded-2xl border p-0 ${cardInteractive}`}
                onClick={() => {
                  setPrompt(feature.prompt);
                  textareaRef.current?.focus();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                 <div className="aspect-video w-full overflow-hidden">
                    <img 
                      src={feature.img} 
                      alt={feature.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--fk-surface-elevated)] via-[#0c1122]/40 to-transparent" />
                 </div>
                 <div className="relative -mt-12 sm:-mt-16 p-4 sm:p-6">
                    <h3 className={`text-lg sm:text-xl font-bold ${feature.color}`}>{feature.title}</h3>
                    <p className="mt-1 text-xs sm:text-sm text-slate-400">{feature.desc}</p>
                    <button className="mt-3 sm:mt-4 flex items-center gap-2 text-[10px] sm:text-xs font-bold text-white/50 group-hover:text-amber-400 transition-colors uppercase tracking-widest">
                       <span>สำรวจ</span>
                       <ChevronRight className="h-3 w-3" />
                    </button>
                 </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT CONTEXT PANEL */}
        <aside className="hidden min-w-0 flex-col gap-6 lg:flex">
          <div className={`rounded-2xl border p-6 ${card} sticky top-[84px]`}>
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-bold text-white uppercase tracking-widest">สถาปัตยกรรมระบบ</h3>
               <Layers className="h-4 w-4 text-slate-500" />
            </div>
            <div className="aspect-square w-full relative mb-6">
               <img 
                src="/src/assets/images/architecture_isometric_stack_1789391564103.jpg" 
                alt="Architecture Stack"
                className="w-full h-full object-contain rounded-xl opacity-90 drop-shadow-[0_0_20px_rgba(245,158,11,0.2)]"
               />
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_50%,rgba(4,7,18,0.4))]" />
            </div>
            <div className="space-y-3">
              {systemItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-1 w-1 rounded-full bg-amber-500/60" />
                  <span className="text-xs text-slate-400 font-medium">{item.label}</span>
                </div>
              ))}
            </div>
            <button onClick={onViewArchitecture} className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all">
              <span>รายละเอียดสถาปัตยกรรม</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className={`rounded-2xl border p-6 ${card}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">ประวัติการตัดสินใจ</h3>
              <History className="h-4 w-4 text-slate-500" />
            </div>

            <div className="flex flex-col gap-4">
              {recentDecisions.map((decision, i) => (
                <div key={i} className="group flex items-center justify-between gap-3 cursor-pointer">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-amber-400 transition-colors">{decision.title}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{decision.time}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded border text-[8px] font-black tracking-wider shrink-0 ${decision.statusColor}`}>
                    {decision.status}
                  </span>
                </div>
              ))}
            </div>
            <button className="mt-6 w-full flex items-center justify-center gap-2 py-1 text-[10px] font-black text-slate-500 hover:text-amber-400 transition-colors uppercase tracking-[0.2em]">
              ดูประวัติการตรวจสอบทั้งหมด
            </button>
          </div>

          <div className={`rounded-2xl border p-6 bg-emerald-500/[0.02] border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]`}>
             <div className="flex items-center gap-3 mb-3">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Trust Layer</h3>
             </div>
             <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                การตัดสินใจดำเนินงานถูกกำกับโดยมาตรฐาน ISO/IEC 42001 และโปรโตคอลการตรวจสอบโดยมนุษย์ (Human-in-the-loop)
             </p>
             <div className="flex items-center justify-between text-[9px] font-mono font-bold text-emerald-500/60">
                <span>ENCRYPTED</span>
                <span>AUDITED</span>
                <span>PRIVATE</span>
             </div>
          </div>
        </aside>
      </div>

    </div>
  );
};
