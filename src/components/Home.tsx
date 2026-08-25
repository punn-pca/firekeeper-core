import React, { useState, useRef, useEffect } from 'react';
import {
  Flame,
  Mic,
  MicOff,
  Paperclip,
  Sparkles,
  X,
  Sliders,
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  File as FileGeneric,
  AlertCircle,
  ChevronDown,
  Activity,
  Layers,
  Server,
  BookOpen,
  ShieldCheck,
  Clock,
  ChevronRight,
  ShieldAlert,
  Scale,
  Users,
  Target,
  Workflow,
  Grid,
  History,
  Lock,
  CheckCircle,
  Zap,
  Share2,
  UserCheck,
  Sun,
  Moon
} from 'lucide-react';
import { AttachedFile, ToneMode, ReasoningProfile } from '../types';
import { formatFileSize, getFileCategory, readFileAsAttachedFile } from '../utils/fileUtils';
import { safeLocalStorage } from '../utils/safeStorage';
import { useConversation } from '../context/ConversationContext';
import { useTheme } from '../context/ThemeContext';
import { getThemeTokens } from '../utils/themeTokens';

interface HomeProps {
  onExecute: (
    prompt: string,
    attachments?: AttachedFile[],
    tone?: ToneMode,
    deepReasoning?: boolean,
    reasoningProfile?: ReasoningProfile
  ) => void;
  isAuthenticated: boolean;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
  onViewArchitecture: () => void;
  onLearnPCA: () => void;
  onSelectActivity: (id: string) => void;
  tone: ToneMode;
  setTone: (tone: ToneMode) => void;
  deepReasoning: boolean;
  setDeepReasoning: (deep: boolean) => void;
  reasoningProfile: ReasoningProfile;
  setReasoningProfile: (profile: ReasoningProfile) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isLight?: boolean;
}

export const Home: React.FC<HomeProps> = ({
  onExecute,
  isAuthenticated,
  onOpenAuth,
  onOpenSettings,
  tone,
  setTone,
  deepReasoning,
  setDeepReasoning,
  reasoningProfile,
  setReasoningProfile,
  selectedModel,
  setSelectedModel,
  onViewArchitecture,
  onLearnPCA,
  onSelectActivity,
}) => {
  const { conversations, selectConversation, openDrawer } = useConversation();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  const tokens = getThemeTokens(isLight);
  
  const [prompt, setPrompt] = useState(() => {
    try {
      return safeLocalStorage.getItem('fire_keeper_draft_prompt') || '';
    } catch {
      return '';
    }
  });

  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const baselinePromptRef = useRef<string>('');

  const getTimeAgo = (dateString: string | undefined) => {
    if (!dateString) return 'Just now';
    const time = new Date(dateString).getTime();
    const now = Date.now();
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr ago`;
    return `${Math.floor(diffInSeconds / 86400)} day ago`;
  };

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Auto-focus the textarea on mount (requested for mobile "ready to type" state)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Focus if it's a mobile device (or always, as it's useful for desktop too)
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleToggleListening = async () => {
    setMicError(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicError('เบราว์เซอร์ไม่รองรับ Web Speech API กรุณาใช้ Chrome หรือ Edge');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsListening(false);
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (permErr: any) {
      console.warn('Microphone permission request warning:', permErr);
      if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
        setMicError('กรุณาอนุญาตการเข้าถึงไมโครโฟนในเบราว์เซอร์');
        return;
      }
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'th-TH';
      recognition.continuous = true;
      recognition.interimResults = true;
      baselinePromptRef.current = prompt;

      recognition.onstart = () => {
        setIsListening(true);
        setMicError(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        const updated = baselinePromptRef.current
          ? `${baselinePromptRef.current.trim()} ${transcript}`
          : transcript;
        setPrompt(updated);
        safeLocalStorage.setItem('fire_keeper_draft_prompt', updated);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setMicError('ไมโครโฟนถูกบล็อก กรุณากดเปิดไมค์ที่ URL Bar');
        } else if (event.error !== 'no-speech') {
          setMicError(`ข้อผิดพลาดของไมโครโฟน (${event.error})`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setMicError('ไม่สามารถเริ่มการฟังเสียงได้: ' + (err.message || ''));
      setIsListening(false);
    }
  };

  const processFileList = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const fileArray = Array.from(files);
      const parsedFiles = await Promise.all(fileArray.map((f) => readFileAsAttachedFile(f)));
      setAttachments((prev) => [...prev, ...parsedFiles]);
    } catch (err) {
      console.error('Failed to parse uploaded files:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileList(e.dataTransfer.files);
    }
  };

  const handleSubmit = () => {
    if ((!prompt.trim() && attachments.length === 0)) return;

    if (!isAuthenticated) {
      safeLocalStorage.setItem('fire_keeper_draft_prompt', prompt);
      onOpenAuth();
      return;
    }

    onExecute(prompt, attachments, tone, deepReasoning, reasoningProfile);
    setPrompt('');
    setAttachments([]);
    safeLocalStorage.removeItem('fire_keeper_draft_prompt');
  };

  const handleQuickExecute = (quickPrompt: string) => {
    if (!isAuthenticated) {
      setPrompt(quickPrompt);
      safeLocalStorage.setItem('fire_keeper_draft_prompt', quickPrompt);
      onOpenAuth();
      return;
    }
    onExecute(quickPrompt, attachments, tone, deepReasoning, reasoningProfile);
    setPrompt('');
    setAttachments([]);
    safeLocalStorage.removeItem('fire_keeper_draft_prompt');
  };

  const getFileIcon = (category: string) => {
    switch (category) {
      case 'pdf': return <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case 'data': return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'code': return <FileCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
      case 'image': return <ImageIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      default: return <FileGeneric className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    }
  };

  return (
    <div className="w-full min-h-[85vh] flex flex-col justify-between text-slate-200 px-4 sm:px-8 py-6 font-sans">
      
      {/* Main 3-Column Layout */}
      <div className="flex flex-col xl:flex-row gap-6 items-stretch w-full mb-12">
        
        {/* LEFT COLUMN: SYSTEM OVERVIEW & QUICK EXAMPLES */}
        <div className="w-full xl:w-72 shrink-0 flex flex-col gap-4 order-2 xl:order-1">
          <div className={`${isLight ? 'bg-white border-[#DCE2EA] shadow-[0_2px_12px_rgba(0,0,0,0.04)] text-[#172033]' : 'bg-[#0B1017]/80 border-slate-800/80 text-slate-200'} border rounded-2xl p-5 shadow-2xl flex flex-col`}>
            <div className={`flex items-center gap-2 mb-6 ${isLight ? 'text-[#172033]' : 'text-slate-300'}`}>
              <Activity className="w-4 h-4 text-amber-500" />
              <h2 className="text-[11px] font-mono tracking-widest uppercase font-bold">System Overview</h2>
            </div>
            
            <div className="space-y-5 flex-1">
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-3 ${isLight ? 'text-[#526074]' : 'text-slate-400'}`}>
                  <Layers className="w-4 h-4" />
                  <span className="text-xs font-medium">Architecture</span>
                </div>
                <span className={`text-xs font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>PCA v2.0</span>
              </div>
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-3 ${isLight ? 'text-[#526074]' : 'text-slate-400'}`}>
                  <Server className="w-4 h-4" />
                  <span className="text-xs font-medium">Stages Online</span>
                </div>
                <span className={`text-xs font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>12 / 12</span>
              </div>
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-3 ${isLight ? 'text-[#526074]' : 'text-slate-400'}`}>
                  <BookOpen className="w-4 h-4" />
                  <span className="text-xs font-medium">Knowledge Base</span>
                </div>
                <span className={`text-xs font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>Active</span>
              </div>
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-3 ${isLight ? 'text-[#526074]' : 'text-slate-400'}`}>
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-xs font-medium">Integrity Guard</span>
                </div>
                <span className={`text-xs font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>Active</span>
              </div>
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-3 ${isLight ? 'text-[#526074]' : 'text-slate-400'}`}>
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-medium">Last Updated</span>
                </div>
                <span className={`text-xs font-mono ${isLight ? 'text-[#7B8798]' : 'text-slate-500'}`}>1 min ago</span>
              </div>
            </div>

            <button onClick={onViewArchitecture} className={`w-full mt-6 py-2.5 px-4 rounded-xl border flex items-center justify-between text-xs transition-colors ${isLight ? 'bg-[#F8FAFC] hover:bg-[#F1F5F9] border-[#DCE2EA] text-[#172033]' : 'bg-white/5 hover:bg-white/15 border-white/5 text-slate-300'}`}>
              <span>View Architecture</span>
              <ChevronRight className={`w-3.5 h-3.5 ${isLight ? 'text-[#7B8798]' : 'text-slate-500'}`} />
            </button>
          </div>

          {/* Quick Examples */}
          <div className={`${isLight ? 'bg-white border-[#DCE2EA] shadow-[0_2px_12px_rgba(0,0,0,0.04)] text-[#172033]' : 'bg-[#0B1017]/80 border-slate-800/80 text-slate-200'} border rounded-2xl p-5 shadow-2xl flex flex-col flex-1`}>
            <div className={`flex items-center gap-2 mb-5 ${isLight ? 'text-[#172033]' : 'text-slate-300'}`}>
              <Zap className="w-4 h-4 text-amber-500" />
              <h2 className="text-[11px] font-mono tracking-widest uppercase font-bold">Quick Examples</h2>
            </div>
            
            <div className="flex flex-col gap-3">
              {[
                { 
                  icon: <Target className="w-4 h-4 text-emerald-500" />, 
                  problem: 'ต้นทุนดำเนินงานสูง', 
                  analysis: 'วิเคราะห์โครงสร้างต้นทุนด้วย PCA 12 stages', 
                  decision: 'เสนอแนวทางลดต้นทุน 15% โดยไม่กระทบคุณภาพ',
                  fullText: 'ใช้กระบวนการ PCA วิเคราะห์โครงสร้างต้นทุน (Cost Structure) เสนอแนวทางลดต้นทุน 15% โดยไม่กระทบคุณภาพ พร้อมระบุความเสี่ยง'
                },
                { 
                  icon: <ShieldAlert className="w-4 h-4 text-rose-500" />, 
                  problem: 'ความเสี่ยงข้อมูลรั่วไหล', 
                  analysis: 'ประเมินภัยคุกคามและช่องโหว่ระบบ', 
                  decision: 'ร่างกรอบการตอบสนองภาวะวิกฤตภายใน 24 ชม.',
                  fullText: 'ร่างกรอบการตอบสนองภาวะวิกฤต (Crisis Management Protocol) กรณีข้อมูลลูกค้ารั่วไหล พร้อมลำดับการสื่อสารภายใน 24 ชม. แรก'
                },
                { 
                  icon: <Scale className="w-4 h-4 text-amber-500" />, 
                  problem: 'คู่แข่งลดราคา 20%', 
                  analysis: 'จำลอง Scenario Planning & Impact', 
                  decision: 'กำหนดมาตรการตอบโต้ระยะสั้นและยาว',
                  fullText: 'ประเมิน Scenario Planning: หากคู่แข่งหลักปรับลดราคาลง 20% เราควรมีมาตรการตอบโต้ทั้งระยะสั้นและระยะยาวอย่างไร?'
                },
                { 
                  icon: <Workflow className="w-4 h-4 text-sky-500" />, 
                  problem: 'การเปลี่ยนผ่านสู่ระบบ AI', 
                  analysis: 'วิเคราะห์ ROI และความท้าทายองค์กร', 
                  decision: 'จัดทำแผนรองรับการปรับตัวบุคลากร',
                  fullText: 'วิเคราะห์ผลกระทบ (Impact Assessment) จากการนำ AI มาใช้แทนกระบวนการเดิม ประเมินด้าน ROI และความท้าทายในการปรับตัว'
                }
              ].map((ex, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickExecute(ex.fullText)}
                  className={`${isLight ? 'bg-[#F8FAFC] hover:bg-[#F1F5F9] border-[#DCE2EA] hover:border-orange-500/50' : 'bg-[#0B1017]/60 hover:bg-[#121A25] border-slate-800/80 hover:border-orange-500/50'} border rounded-xl p-3 flex flex-col gap-1.5 text-left transition-all group cursor-pointer`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {ex.icon}
                      <span className={`text-[11px] font-bold ${isLight ? 'text-[#172033] group-hover:text-orange-600' : 'text-slate-200 group-hover:text-amber-400'} transition-colors`}>{ex.problem}</span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 ${isLight ? 'text-[#7B8798] group-hover:text-orange-600' : 'text-slate-600 group-hover:text-amber-400'} shrink-0`} />
                  </div>
                  <div className={`text-[10px] font-mono ${isLight ? 'text-[#526074]' : 'text-slate-400'} space-y-0.5 pl-6 border-l ${isLight ? 'border-[#DCE2EA]' : 'border-slate-800'} ml-1`}>
                    <div><span className={isLight ? 'text-[#7B8798]' : 'text-slate-500'}>Analysis:</span> {ex.analysis}</div>
                    <div><span className={`${isLight ? 'text-[#172033]' : 'text-slate-300'} font-medium`}>Decision:</span> {ex.decision}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* CENTER COLUMN: HERO & INPUT (High Priority & Focal Point) */}
        <div className="flex-[1.25] flex flex-col items-center justify-start pt-2 xl:pt-6 px-0 sm:px-2 order-1 xl:order-2">
          
          {/* Large Center Logo */}
          <div className="relative flex items-center justify-center w-28 h-28 mb-3 select-none">
            {/* Concentric Circles */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full rounded-full border border-dashed border-orange-500/20 animate-[spin_60s_linear_infinite]"></div>
            </div>
            <div className="absolute inset-4 flex items-center justify-center">
              <div className="w-full h-full rounded-full border border-dotted border-orange-500/25 animate-[spin_40s_linear_infinite_reverse]"></div>
            </div>
            <div className="absolute inset-0 bg-orange-500/10 blur-[40px] rounded-full mix-blend-screen pointer-events-none"></div>
            <Flame className="w-10 h-10 text-orange-500 stroke-[1.5] relative z-10 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
          </div>

          <h1 className={`text-2xl sm:text-3xl md:text-4xl font-medium tracking-[0.3em] ml-[0.3em] mb-2 ${isLight ? 'text-[#172033]' : 'text-white'} text-center`}>
            FIRE KEEPER
          </h1>

          <div className="text-center mb-6">
            <div className={`flex items-center justify-center gap-2 text-[11px] font-mono font-bold tracking-[0.25em] ${isLight ? 'text-[#526074]' : 'text-slate-300'}`}>
              <span>INFORM</span>
              <span className="text-orange-500">•</span>
              <span>ANALYZE</span>
              <span className="text-orange-500">•</span>
              <span>EMPOWER</span>
            </div>
          </div>

          {/* Search Input Box (Primary Interaction) */}
          <div className="w-full max-w-2xl mb-8">
            {/* Hidden Native File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && processFileList(e.target.files)}
              multiple
              accept=".pdf,.doc,.docx,.txt,.csv,.json,.md,.js,.ts,.tsx,.py,.png,.jpg,.jpeg,.xlsx,.xls"
              className="hidden"
            />
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-xl border transition-all duration-200 flex flex-col ${
                isDragging
                  ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_25px_rgba(249,115,22,0.25)]'
                  : isLight
                    ? 'border-[#DCE2EA] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] focus-within:border-orange-500/60 focus-within:shadow-[0_0_20px_rgba(249,115,22,0.12)]'
                    : 'border-slate-700/60 bg-[#0B1017]/95 shadow-xl backdrop-blur-md focus-within:border-orange-500/60 focus-within:shadow-[0_0_20px_rgba(249,115,22,0.12)]'
              }`}
            >
              {micError && (
                <div className="flex items-center justify-between px-4 py-2 bg-amber-500/15 border-b border-amber-500/30 text-amber-300 text-xs rounded-t-xl">
                  <div className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4 shrink-0" /><span>{micError}</span></div>
                  <button onClick={() => setMicError(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>
              )}
              {attachments.length > 0 && (
                <div className={`p-2.5 border-b ${isLight ? 'border-[#DCE2EA]' : 'border-white/5'} flex flex-wrap gap-2 max-h-28 overflow-y-auto`}>
                  {attachments.map((att) => (
                    <div key={att.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs ${isLight ? 'bg-[#F1F5F9] border-[#DCE2EA] text-[#172033]' : 'bg-slate-800/90 border-slate-700 text-slate-200'}`}>
                      {getFileIcon(getFileCategory(att.type, att.name))}
                      <span className="font-mono text-[11px] truncate max-w-[130px]">{att.name}</span>
                      <button onClick={() => handleRemoveAttachment(att.id)} className="p-0.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 ml-0.5"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
              
              <textarea
                ref={textareaRef}
                autoFocus
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  safeLocalStorage.setItem('fire_keeper_draft_prompt', e.target.value);
                }}
                placeholder={isDragging ? 'วางไฟล์ที่นี่...' : 'ป้อนประเด็นเชิงกลยุทธ์ คำถาม หรือแนบเอกสารเพื่อเริ่มต้นการวิเคราะห์...'}
                className={`w-full bg-transparent p-4 text-sm ${isLight ? 'text-[#172033] placeholder:text-[#7B8798]' : 'text-slate-100 placeholder:text-slate-500'} focus:outline-none transition-all min-h-[92px] resize-none font-sans leading-relaxed`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
                }}
              />

              {/* Bottom Toolbar of Input */}
              <div className={`flex items-center justify-between gap-2 px-3.5 py-2.5 border-t rounded-b-xl ${isLight ? 'border-[#DCE2EA] bg-[#F8FAFC]' : 'border-slate-800/70 bg-black/30'}`}>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    title={isLight ? "สลับเป็นโหมดมืด (Dark Mode)" : "สลับเป็นโหมดสว่าง (Light Mode)"}
                    className={`p-2 rounded-lg transition-all duration-300 ease-out hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center ${
                      isLight ? 'text-amber-600 hover:bg-amber-100/60' : 'text-amber-400 hover:bg-white/10'
                    }`}
                  >
                    {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className={`p-2 rounded-lg transition-all duration-300 ease-out hover:scale-105 active:scale-95 cursor-pointer ${isLight ? 'text-[#526074] hover:text-[#172033] hover:bg-[#E2E8F0]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`} title="แนบเอกสาร (PDF, Word, Code, รูปภาพ)">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button onClick={handleToggleListening} className={`p-2 rounded-lg transition-all duration-300 ease-out hover:scale-105 active:scale-95 cursor-pointer ${isListening ? 'bg-rose-500/20 text-rose-400 animate-pulse' : isLight ? 'text-[#526074] hover:text-[#172033] hover:bg-[#E2E8F0]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`} title={isListening ? "กดเพื่อหยุดการฟังเสียง" : "พิมพ์ด้วยเสียง (Voice Command)"}>
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <div className={`w-px h-4 mx-1 ${isLight ? 'bg-[#DCE2EA]' : 'bg-slate-800'}`}></div>
                  <button onClick={onOpenSettings} className={`p-2 rounded-lg transition-all duration-300 ease-out hover:scale-105 active:scale-95 cursor-pointer ${isLight ? 'text-[#526074] hover:text-[#172033] hover:bg-[#E2E8F0]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`} title="ตั้งค่าระบบ / โมเดล AI">
                    <Sliders className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center">
                  <button
                    onClick={handleSubmit}
                    disabled={!prompt.trim() && attachments.length === 0}
                    title={!prompt.trim() && attachments.length === 0 ? "กรุณากรอกข้อความหรือแนบเอกสารก่อนรันคำสั่ง" : "คลิกเพื่อประมวลผลคำสั่งเชิงกลยุทธ์ (Execute)"}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg border text-xs font-mono font-bold tracking-widest transition-all duration-300 ease-out cursor-pointer ${
                      !prompt.trim() && attachments.length === 0
                        ? 'bg-slate-800/50 border-slate-700/50 text-slate-500 cursor-not-allowed'
                        : 'bg-orange-600 hover:bg-orange-500 text-white border-orange-400/80 shadow-[0_0_22px_rgba(249,115,22,0.6)] animate-pulse hover:scale-105 active:scale-95'
                    }`}
                  >
                    <span>EXECUTE</span>
                    <Flame className="w-3.5 h-3.5 text-amber-200" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Glowing Separator */}
          <div className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent mb-5 mt-4 relative">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-[2px] bg-amber-400/80 shadow-[0_0_6px_rgba(251,191,36,0.8)] rounded-full"></div>
          </div>

          <div className="text-center mb-5 space-y-1.5">
            <h2 className={`text-xs font-mono tracking-widest uppercase ${isLight ? 'text-[#526074]' : 'text-slate-400'}`}>
              PUNN COGNITIVE ARCHITECTURE (PCA V2)
            </h2>
            <h3 className={`text-[10px] font-mono tracking-widest uppercase ${isLight ? 'text-[#7B8798]' : 'text-slate-500'}`}>
              12-STAGE STRATEGIC INTELLIGENCE
            </h3>
          </div>

          {/* PCA Real Status Card (Refined Compact Size) */}
          <div className={`w-full max-w-sm border rounded-xl p-3.5 shadow-lg flex flex-col mb-4 ${isLight ? 'bg-white border-[#DCE2EA] shadow-[0_2px_12px_rgba(0,0,0,0.04)]' : 'bg-[#0B1017]/70 border-slate-800/70'}`}>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className={`text-[10px] font-mono tracking-widest uppercase font-bold ${isLight ? 'text-[#172033]' : 'text-slate-300'}`}>PCA Status & Integrity</h2>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-mono font-bold tracking-wider ${isLight ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'}`}>
                SYSTEM INTEGRITY: VERIFIED
              </span>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className={isLight ? 'text-slate-200' : 'text-slate-800'}
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500"
                    strokeWidth="3.5"
                    strokeDasharray="100, 100"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`font-bold font-mono text-[11px] ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>12/12</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-0.5">
                <span className={`text-xs font-bold ${isLight ? 'text-[#172033]' : 'text-white'}`}>12 / 12 STAGES READY</span>
                <span className={`text-[10px] ${isLight ? 'text-[#526074]' : 'text-slate-400'}`}>ระบบประมวลผลพร้อมปฏิบัติการเต็มรูปแบบ</span>
              </div>
            </div>
          </div>

          {/* Trust badges moved to right column */}





        </div>

        {/* RIGHT COLUMN: CAPABILITIES & ACTIVITY */}
        <div className="w-full xl:w-80 shrink-0 flex flex-col gap-4 order-3">
          
          {/* Recent Activity */}
          <div className={`${isLight ? 'bg-white border-[#DCE2EA] shadow-[0_2px_12px_rgba(0,0,0,0.04)] text-[#172033]' : 'bg-[#0B1017]/80 border-slate-800/80 text-slate-200'} border rounded-2xl p-5 flex flex-col shadow-xl`}>
             <div className={`flex items-center gap-2 mb-5 ${isLight ? 'text-[#172033]' : 'text-slate-300'}`}>
              <History className={`w-4 h-4 ${isLight ? 'text-[#526074]' : 'text-slate-400'}`} />
              <h2 className="text-[11px] font-mono tracking-widest uppercase font-bold">Recent Activity</h2>
            </div>
            
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[220px] pr-2">
              {conversations.map((act) => (
                <div key={act.id} onClick={() => { selectConversation(act.id); onSelectActivity(act.id); }} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-2 overflow-hidden pr-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span>
                    <span className={`text-xs ${isLight ? 'text-[#172033] group-hover:text-orange-600' : 'text-slate-300 group-hover:text-white'} truncate font-medium transition-colors`}>{act.title || 'ไม่มีชื่อการสนทนา'}</span>
                  </div>
                  <span className={`text-[11px] ${isLight ? 'text-[#7B8798]' : 'text-slate-400'} font-mono shrink-0`}>{getTimeAgo(act.updated_at || act.created_at)}</span>
                </div>
              ))}
              {conversations.length === 0 && (
                <div className={`text-xs ${isLight ? 'text-[#7B8798]' : 'text-slate-500'} flex items-center justify-center py-4`}>No recent activity</div>
              )}
            </div>

            <button onClick={() => openDrawer('history')} className={`w-full mt-5 py-2.5 px-4 rounded-xl border flex items-center justify-between text-xs transition-colors ${isLight ? 'bg-[#F8FAFC] hover:bg-[#F1F5F9] border-[#DCE2EA] text-[#172033]' : 'bg-white/5 hover:bg-white/15 border-white/5 text-slate-300'}`}>
              <span>View All History</span>
              <ChevronRight className={`w-3.5 h-3.5 ${isLight ? 'text-[#7B8798]' : 'text-slate-500'}`} />
            </button>
          </div>

          {/* Core Capabilities */}
          <div className={`${isLight ? 'bg-white border-[#DCE2EA] shadow-[0_2px_12px_rgba(0,0,0,0.04)] text-[#172033]' : 'bg-[#0B1017]/80 border-slate-800/80 text-slate-200'} border rounded-2xl p-5 flex flex-col shadow-xl`}>
            <div className={`flex items-center gap-2 mb-5 ${isLight ? 'text-[#172033]' : 'text-slate-300'}`}>
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-[11px] font-mono tracking-widest uppercase font-bold">Core Capabilities</h2>
            </div>
            
            <div className="space-y-4">
              {[
                { icon: <Target className="w-4 h-4 text-amber-500" />, title: 'Strategic Analysis', desc: 'วิเคราะห์เชิงกลยุทธ์เชิงลึก' },
                { icon: <Workflow className="w-4 h-4 text-amber-500" />, title: 'Evidence Synthesis', desc: 'รวบรวมและสังเคราะห์หลักฐาน' },
                { icon: <AlertCircle className="w-4 h-4 text-amber-500" />, title: 'Risk & Impact Assessment', desc: 'ประเมินความเสี่ยงและผลกระทบ' },
                { icon: <Grid className="w-4 h-4 text-amber-500" />, title: 'Scenario Intelligence', desc: 'จำลองสถานการณ์เชิงกลยุทธ์' },
                { icon: <Lock className="w-4 h-4 text-amber-500" />, title: 'Governance Check', desc: 'ตรวจสอบความสอดคล้องเชิงธรรมาภิบาล' }
              ].map((cap, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-lg border ${isLight ? 'border-amber-300 bg-amber-50' : 'border-amber-500/20 bg-amber-500/5'} mt-0.5 shrink-0`}>
                    {cap.icon}
                  </div>
                  <div>
                    <div className={`text-xs font-semibold ${isLight ? 'text-[#172033]' : 'text-slate-200'}`}>{cap.title}</div>
                    <div className={`text-[11px] ${isLight ? 'text-[#526074]' : 'text-slate-400'} mt-0.5 leading-relaxed`}>{cap.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <button onClick={onLearnPCA} className={`w-full mt-6 py-2.5 px-4 rounded-xl border flex items-center justify-between text-xs transition-colors ${isLight ? 'bg-[#F8FAFC] hover:bg-[#F1F5F9] border-[#DCE2EA] text-[#172033]' : 'bg-white/5 hover:bg-white/15 border-white/5 text-slate-300'}`}>
              <span>Learn about PCA</span>
              <ChevronRight className={`w-3.5 h-3.5 ${isLight ? 'text-[#7B8798]' : 'text-slate-500'}`} />
            </button>
          </div>

          {/* TRUST BADGES */}
          <div className={`${isLight ? 'bg-white border-[#DCE2EA] shadow-[0_2px_12px_rgba(0,0,0,0.04)] text-[#172033]' : 'bg-[#0B1017]/80 border-slate-800/80 text-slate-200'} border rounded-2xl p-5 shadow-xl`}>
            <div className="flex flex-col gap-5">
               <div className="flex flex-row items-center justify-start text-left gap-3">
                 <div className={`p-2 rounded-xl border ${isLight ? 'border-emerald-300 bg-emerald-50' : 'border-emerald-500/20 bg-emerald-500/5'} shrink-0`}>
                   <ShieldCheck className="w-5 h-5 text-emerald-500" />
                 </div>
                 <div>
                   <div className={`text-xs font-bold font-mono tracking-widest uppercase ${isLight ? 'text-[#172033]' : 'text-slate-200'} mb-1`}>Trusted Intelligence</div>
                   <div className={`text-[11px] ${isLight ? 'text-[#526074]' : 'text-slate-400'} mt-0.5 leading-relaxed`}>ข้อมูลเชื่อถือได้จากหลายแหล่ง</div>
                 </div>
               </div>
               
               <div className="flex flex-row items-center justify-start text-left gap-3">
                 <div className={`p-2 rounded-xl border ${isLight ? 'border-slate-300 bg-slate-100' : 'border-slate-500/20 bg-slate-500/5'} shrink-0`}>
                   <Target className={`w-5 h-5 ${isLight ? 'text-[#526074]' : 'text-slate-400'}`} />
                 </div>
                 <div>
                   <div className={`text-xs font-bold font-mono tracking-widest uppercase ${isLight ? 'text-[#172033]' : 'text-slate-200'} mb-1`}>Transparent Process</div>
                   <div className={`text-[11px] ${isLight ? 'text-[#526074]' : 'text-slate-400'} mt-0.5 leading-relaxed`}>กระบวนการคิดเปิดเผย ตรวจสอบได้</div>
                 </div>
               </div>

               <div className="flex flex-row items-center justify-start text-left gap-3">
                 <div className={`p-2 rounded-xl border ${isLight ? 'border-amber-300 bg-amber-50' : 'border-amber-500/20 bg-amber-500/5'} shrink-0`}>
                   <Share2 className="w-5 h-5 text-amber-500" />
                 </div>
                 <div>
                   <div className={`text-xs font-bold font-mono tracking-widest uppercase ${isLight ? 'text-[#172033]' : 'text-slate-200'} mb-1`}>Ethical by Design</div>
                   <div className={`text-[11px] ${isLight ? 'text-[#526074]' : 'text-slate-400'} mt-0.5 leading-relaxed`}>ยึดมั่นจริยธรรมและความเป็นธรรม</div>
                 </div>
               </div>

               <div className="flex flex-row items-center justify-start text-left gap-3">
                 <div className={`p-2 rounded-xl border ${isLight ? 'border-amber-300 bg-amber-50' : 'border-amber-500/20 bg-amber-500/5'} shrink-0`}>
                   <UserCheck className="w-5 h-5 text-amber-500" />
                 </div>
                 <div>
                   <div className={`text-xs font-bold font-mono tracking-widest uppercase ${isLight ? 'text-[#172033]' : 'text-slate-200'} mb-1`}>Human-Centered</div>
                   <div className={`text-[11px] ${isLight ? 'text-[#526074]' : 'text-slate-400'} mt-0.5 leading-relaxed`}>สนับสนุนการตัดสินใจของคุณ</div>
                 </div>
               </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};


