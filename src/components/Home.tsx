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
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Volume2,
  ChevronDown
} from 'lucide-react';
import { AttachedFile, ToneMode, ReasoningProfile } from '../types';
import { formatFileSize, getFileCategory, readFileAsAttachedFile, SAMPLE_ATTACHMENTS } from '../utils/fileUtils';
import { safeLocalStorage } from '../utils/safeStorage';

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
  isLight = false,
}) => {
  const [prompt, setPrompt] = useState(() => {
    try {
      return safeLocalStorage.getItem('fire_keeper_draft_prompt') || '';
    } catch {
      return '';
    }
  });

  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<'th-TH' | 'en-US'>('th-TH');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [showSampleFiles, setShowSampleFiles] = useState(false);
  const [showQuickSettings, setShowQuickSettings] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const baselinePromptRef = useRef<string>('');

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

    // Attempt to request microphone access first to grant browser permissions
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (permErr: any) {
      console.warn('Microphone permission request warning:', permErr);
      if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
        setMicError('กรุณาอนุญาตการเข้าถึงไมโครโฟนในเบราว์เซอร์ (Microphone permission denied)');
        return;
      }
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = speechLang;
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
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setMicError('ไมโครโฟนถูกบล็อก กรุณากดรูปกุญแจ/การตั้งค่าที่แถบ URL เพื่อเปิดไมค์');
        } else if (event.error === 'no-speech') {
          // Normal timeout if no speech heard
        } else {
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
      console.error('Failed to start speech recognition:', err);
      setMicError('ไม่สามารถเริ่มการฟังเสียงได้: ' + (err.message || 'โปรดตรวจสอบไมโครโฟน'));
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

  const handleAddSampleAttachment = (sample: (typeof SAMPLE_ATTACHMENTS)[0]) => {
    setAttachments((prev) => [...prev, sample.file]);
    setShowSampleFiles(false);
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

  const getFileIcon = (category: string) => {
    switch (category) {
      case 'pdf':
        return <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case 'data':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'code':
        return <FileCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      default:
        return <FileGeneric className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[82vh] w-full px-3 sm:px-4 text-slate-100 max-w-4xl mx-auto py-6">
      {/* Hidden Native File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files && processFileList(e.target.files)}
        multiple
        accept=".pdf,.doc,.docx,.txt,.csv,.json,.md,.js,.ts,.tsx,.py,.png,.jpg,.jpeg,.xlsx,.xls"
        className="hidden"
        id="home-file-uploader"
      />

      {/* Header Info */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-mono tracking-widest text-slate-200 mb-2 flex items-center justify-center gap-2">
          <span>FIRE KEEPER</span>
        </h1>
        <div className="text-[11px] sm:text-xs text-slate-400 font-mono tracking-wider uppercase flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>PUNN Cognitive Architecture (PCA v2) • 12-Stage Strategic Intelligence</span>
        </div>
      </div>

      {/* Central Flame Icon */}
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full opacity-60 animate-pulse"></div>
        <Flame className="w-14 h-14 sm:w-16 sm:h-16 text-orange-500 stroke-[1.5] relative z-10 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
      </div>

      {/* Interaction Box Area */}
      <div className="w-full max-w-2xl space-y-4">
        {/* Main Prompt and File Drag Box */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-2xl border transition-all ${
            isDragging
              ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_25px_rgba(249,115,22,0.3)]'
              : 'border-white/10 bg-[#0B1017]/80 shadow-2xl backdrop-blur-md focus-within:border-orange-500/50'
          }`}
        >
          {/* Active Listening Wave Indicator */}
          {isListening && (
            <div className="flex items-center justify-between px-4 py-2 bg-rose-500/15 border-b border-rose-500/30 text-rose-300 text-xs font-mono rounded-t-2xl animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span>กำลังฟังเสียง ({speechLang === 'th-TH' ? 'ภาษาไทย' : 'English'})... พูดได้เลย</span>
              </div>
              <button
                type="button"
                onClick={handleToggleListening}
                className="text-[10px] bg-rose-500/30 hover:bg-rose-500/50 px-2 py-0.5 rounded font-bold transition-all text-white"
              >
                หยุดบันทึก
              </button>
            </div>
          )}

          {/* Microphone Error Banner */}
          {micError && (
            <div className="flex items-center justify-between px-4 py-2 bg-amber-500/15 border-b border-amber-500/30 text-amber-300 text-xs rounded-t-2xl">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{micError}</span>
              </div>
              <button
                type="button"
                onClick={() => setMicError(null)}
                className="text-slate-400 hover:text-white text-xs ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Attached Files List Pills */}
          {attachments.length > 0 && (
            <div className="p-3 border-b border-white/5 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/80 text-xs text-slate-200 shadow-xs"
                >
                  {getFileIcon(getFileCategory(att.type, att.name))}
                  <span className="font-mono text-[11px] truncate max-w-[140px]" title={att.name}>
                    {att.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">({formatFileSize(att.size)})</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(att.id)}
                    className="p-0.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors ml-0.5"
                    title="ลบไฟล์"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setAttachments([])}
                className="text-[10px] text-rose-400 hover:underline px-1 py-0.5"
              >
                ลบทั้งหมด ({attachments.length})
              </button>
            </div>
          )}

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              safeLocalStorage.setItem('fire_keeper_draft_prompt', e.target.value);
            }}
            placeholder={
              isDragging
                ? 'วางไฟล์เอกสาร/โค้ด/รูปภาพที่นี่...'
                : 'พิมพ์คำถามเชิงยุทธศาสตร์, ให้วิเคราะห์เอกสาร หรือสั่งการตัดสินใจ (หรือแนบไฟล์ / กดไมโครโฟน)...'
            }
            className="w-full bg-transparent p-4 sm:p-5 text-sm sm:text-base text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all min-h-[120px] resize-none font-mono"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />

          {/* Input Action Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-t border-white/5 bg-[#070B12]/60 rounded-b-2xl">
            {/* Left Tools: Attachment, Mic, Sample Files, Language */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Upload File Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                title="แนบไฟล์ (PDF, Word, CSV, Code, Text, Images)"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-orange-400 hover:bg-white/5 border border-transparent hover:border-orange-500/30 transition-all cursor-pointer"
              >
                <Paperclip className="w-4 h-4" />
                <span className="hidden xs:inline">แนบไฟล์</span>
                {attachments.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-orange-500 text-black text-[10px] font-bold flex items-center justify-center ml-0.5">
                    {attachments.length}
                  </span>
                )}
              </button>

              {/* Microphone Speech Recognition Button */}
              <button
                type="button"
                onClick={handleToggleListening}
                title={isListening ? 'กดเพื่อหยุดการบันทึกเสียง' : 'กดเพื่อพูดสั่งการ (Speech-to-Text)'}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 animate-pulse'
                    : 'text-slate-400 hover:text-sky-400 hover:bg-white/5 border border-transparent hover:border-sky-500/30'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span className="hidden xs:inline">{isListening ? 'หยุดฟัง' : 'พูด'}</span>
              </button>

              {/* Speech Language Switcher Chip */}
              <button
                type="button"
                onClick={() => setSpeechLang((prev) => (prev === 'th-TH' ? 'en-US' : 'th-TH'))}
                title="สลับภาษาการฟังเสียง (ไทย / English)"
                className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] font-mono border border-slate-700 transition-all"
              >
                {speechLang === 'th-TH' ? '🇹🇭 TH' : '🇺🇸 EN'}
              </button>

              {/* Sample Files Dropdown Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSampleFiles(!showSampleFiles)}
                  title="โหลดเอกสารตัวอย่างเพื่อทดสอบ"
                  className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-mono text-slate-400 hover:text-amber-400 hover:bg-white/5 transition-all"
                >
                  <span>📑 ตัวอย่างไฟล์</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showSampleFiles && (
                  <div className="absolute left-0 bottom-full mb-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 space-y-1">
                    <div className="px-2 py-1 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      เลือกเอกสารตัวอย่างทดสอบ
                    </div>
                    {SAMPLE_ATTACHMENTS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleAddSampleAttachment(s)}
                        className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 transition-all flex items-start gap-2"
                      >
                        <span className="text-sm shrink-0">📄</span>
                        <div className="truncate">
                          <div className="text-xs font-semibold truncate">{s.title}</div>
                          <div className="text-[10px] text-slate-400 truncate">{s.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Tools: Chat Settings Button & Execute */}
            <div className="flex items-center gap-2">
              {/* Settings Trigger Button */}
              <button
                type="button"
                onClick={onOpenSettings}
                title="ตั้งค่าโมเดล, โทนเสียง, และกระบวนการคิด (Chat Configuration)"
                className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-white/5 border border-transparent hover:border-amber-500/30 transition-all cursor-pointer"
              >
                <Sliders className="w-4 h-4" />
              </button>

              {/* Quick Config Toggle Pill */}
              <button
                type="button"
                onClick={() => setShowQuickSettings(!showQuickSettings)}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono bg-slate-800/80 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
              >
                <span>{selectedModel.replace('gemini-', 'Gemini ')}</span>
                <span>•</span>
                <span>{tone.split(' ')[0]}</span>
              </button>

              {/* Submit / Execute Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!prompt.trim() && attachments.length === 0}
                className={`px-4 py-2 font-bold font-mono text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  !prompt.trim() && attachments.length === 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                    : 'bg-orange-500 text-black hover:bg-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                }`}
              >
                <span>EXECUTE</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Settings Expandable Card */}
        {showQuickSettings && (
          <div className="p-3.5 rounded-xl border border-amber-500/20 bg-[#060A16] shadow-xl space-y-3 font-mono animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-bold text-amber-400 border-b border-white/5 pb-2">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                การตั้งค่าคำสั่งด่วน (Quick Parameters)
              </span>
              <button
                type="button"
                onClick={() => setShowQuickSettings(false)}
                className="text-slate-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              {/* Model */}
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">AI Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200 outline-none"
                >
                  <option value="gemini-3.6-flash">Gemini 3.6 Flash</option>
                  <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite</option>
                  <option value="gpt-4o">OpenAI GPT-4o</option>
                </select>
              </div>

              {/* Tone */}
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Tone & Voice</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as ToneMode)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200 outline-none"
                >
                  <option value="Formal Architect">Formal Architect</option>
                  <option value="Executive Brief">Executive Brief</option>
                  <option value="Deep Analytical">Deep Analytical</option>
                </select>
              </div>

              {/* Reasoning Profile */}
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">PCA Profile</label>
                <select
                  value={reasoningProfile}
                  onChange={(e) => setReasoningProfile(e.target.value as ReasoningProfile)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200 outline-none"
                >
                  <option value="Auto">Auto (12-Stage PCA)</option>
                  <option value="Chain-of-Thought">Chain-of-Thought</option>
                  <option value="First Principles">First Principles</option>
                  <option value="Monte Carlo Risk">Monte Carlo Risk</option>
                </select>
              </div>
            </div>

            {/* Deep Reasoning Toggle */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-300">⚡ 12-Stage Deep Reasoning Verification</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={deepReasoning}
                  onChange={(e) => setDeepReasoning(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* System Status Footer */}
      <div className="mt-8 text-center text-xs text-slate-500 font-mono tracking-widest flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span>PUNN COGNITIVE ARCHITECTURE • READY</span>
      </div>
    </div>
  );
};

