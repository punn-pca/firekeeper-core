import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Brain,
  Compass,
  Mic,
  MicOff,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  FileCode,
  Database,
  Upload,
  FileCheck,
  Zap,
} from 'lucide-react';
import { AttachedFile, ToneMode, ReasoningProfile } from '../types';
import { SAMPLE_PROMPTS, SamplePrompt } from '../data/pcaDefaults';
import { formatFileSize, getFileCategory, readFileAsAttachedFile, SAMPLE_ATTACHMENTS } from '../utils/fileUtils';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface ChatInputProps {
  onSend: (
    prompt: string,
    tone: ToneMode,
    deepReasoning: boolean,
    attachments: AttachedFile[],
    reasoningProfile: ReasoningProfile
  ) => void;
  isLoading: boolean;
  tone: ToneMode;
  setTone: (tone: ToneMode) => void;
  deepReasoning: boolean;
  setDeepReasoning: (enabled: boolean) => void;
  reasoningProfile: ReasoningProfile;
  setReasoningProfile: (profile: ReasoningProfile) => void;
  onSelectSample?: (sample: SamplePrompt) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  isLoading,
  tone,
  setTone,
  deepReasoning,
  setDeepReasoning,
  reasoningProfile,
  setReasoningProfile,
  onSelectSample,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<'th-TH' | 'en-US'>('th-TH');
  const [speechError, setSpeechError] = useState<string | null>(null);

  // File Attachment State
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSampleDrawer, setShowSampleDrawer] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const baselinePromptRef = useRef<string>('');

  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus();
    }
  }, [isLoading]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    setSpeechError(null);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('เบราว์เซอร์นี้ไม่รองรับระบบสั่งการด้วยเสียง (Web Speech API)');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = speechLang;
      recognition.continuous = true;
      recognition.interimResults = true;

      baselinePromptRef.current = prompt;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        const base = baselinePromptRef.current;
        setPrompt(base ? `${base} ${transcript}` : transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('กรุณาอนุญาตสิทธิ์ใช้งานไมโครโฟนในเบราว์เซอร์ของคุณ');
        } else if (event.error !== 'no-speech') {
          setSpeechError(`เกิดข้อผิดพลาดในการรับสัญญาณเสียง (${event.error})`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setSpeechError('ไม่สามารถเริ่มระบบถอดความเสียงได้');
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
      console.error('Error parsing files:', err);
      setSpeechError('เกิดข้อผิดพลาดในการอ่านไฟล์แนบ');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFileList(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileList(e.dataTransfer.files);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddSampleAttachment = (sampleFile: AttachedFile) => {
    if (!attachments.some((a) => a.name === sampleFile.name)) {
      setAttachments((prev) => [...prev, sampleFile]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!prompt.trim() && attachments.length === 0) || isLoading) return;
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const finalPrompt =
      prompt.trim() ||
      `กรุณาวิเคราะห์และประมวลผลเชิงยุทธศาสตร์ตามกรอบ PCA v2.0 สำหรับไฟล์แนบทั้ง ${attachments.length} รายการนี้`;

    onSend(finalPrompt, tone, deepReasoning, attachments, reasoningProfile);
    setPrompt('');
    setAttachments([]);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative enterprise-card rounded-3xl p-4 sm:p-5 shadow-2xl text-white transition-all ${
        isDragging
          ? 'border-[#FF8A00] bg-[#FF8A00]/10 ring-2 ring-[#FF8A00]/50'
          : 'border-[rgba(255,255,255,0.08)]'
      }`}
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept="image/*,.pdf,.txt,.md,.csv,.json,.js,.ts,.tsx,.jsx,.py,.html,.css,.sql,.doc,.docx,.xml,.log"
        className="hidden"
      />

      {/* Drag & Drop Overlay Indicator */}
      {isDragging && (
        <div className="absolute inset-0 bg-[#060A16]/95 rounded-3xl z-20 flex flex-col items-center justify-center border-2 border-dashed border-[#FF8A00] pointer-events-none p-6 text-center animate-fadeIn">
          <Upload className="w-12 h-12 text-[#FF8A00] animate-bounce mb-2" />
          <p className="text-white font-bold text-lg">วางไฟล์เพื่อแนบเข้าสู่กระบวนการวิเคราะห์ PCA</p>
          <p className="text-slate-400 text-xs mt-1">
            รองรับไฟล์รูปภาพ, PDF, เอกสาร, โค้ดโปรแกรม และชุดข้อมูล CSV/JSON
          </p>
        </div>
      )}

      {/* Active Voice Recording Indicator Strip */}
      {isListening && (
        <div className="mb-3 px-4 py-2.5 bg-rose-950/80 border border-rose-600/60 rounded-2xl text-xs text-rose-200 flex items-center justify-between animate-fadeIn shadow-lg">
          <div className="flex items-center space-x-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <span className="font-semibold text-rose-200">
              กำลังบันทึกเสียงและถอดความ ({speechLang === 'th-TH' ? 'ภาษาไทย' : 'English'})... พูดแล้วข้อความจะปรากฏทันที
            </span>
          </div>
          <button
            type="button"
            onClick={toggleListening}
            className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
          >
            <MicOff className="w-3.5 h-3.5" />
            <span>หยุดฟัง</span>
          </button>
        </div>
      )}

      {/* Attached Files Tray (Display uploaded files) */}
      {attachments.length > 0 && (
        <div className="mb-3 p-3 bg-[#060A16] border border-[#FF8A00]/30 rounded-2xl animate-fadeIn">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-semibold text-[#FF8A00] flex items-center gap-1.5">
              <Paperclip className="w-4 h-4 text-[#FF8A00]" />
              ไฟล์แนบเพื่อการวิเคราะห์ ({attachments.length} รายการ):
            </span>
            <button
              type="button"
              onClick={() => setAttachments([])}
              className="text-[11px] text-slate-400 hover:text-rose-400 transition-all font-medium cursor-pointer"
            >
              ลบทั้งหมด
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {attachments.map((att) => {
              const category = getFileCategory(att.type, att.name);
              return (
                <div
                  key={att.id}
                  className="flex items-center gap-2.5 bg-[#0E1525] border border-[rgba(255,255,255,0.1)] hover:border-[#FF8A00]/50 p-2.5 rounded-xl text-xs shadow-md transition-all group max-w-xs"
                >
                  {category === 'image' && att.dataUrl ? (
                    <img
                      src={att.dataUrl}
                      alt={att.name}
                      className="w-9 h-9 rounded-lg object-cover border border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-[#1A2338] border border-[rgba(255,255,255,0.08)] flex items-center justify-center shrink-0">
                      {category === 'pdf' && <FileText className="w-4 h-4 text-rose-400" />}
                      {category === 'code' && <FileCode className="w-4 h-4 text-emerald-400" />}
                      {category === 'data' && <Database className="w-4 h-4 text-[#FF8A00]" />}
                      {category === 'doc' && <FileText className="w-4 h-4 text-sky-400" />}
                      {category === 'text' && <FileText className="w-4 h-4 text-slate-300" />}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate text-xs">{att.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <span>{formatFileSize(att.size)}</span>
                      <span>•</span>
                      <span className="uppercase text-[#FF8A00]">{category}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(att.id)}
                    className="p-1.5 rounded-lg bg-[#1A2338] hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-all cursor-pointer shrink-0"
                    title="ลบไฟล์แนบนี้"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex flex-col rounded-2xl bg-[#060A16] border border-[rgba(255,255,255,0.08)] focus-within:border-[#FF8A00] focus-within:ring-1 focus-within:ring-[#FF8A00] transition-all overflow-hidden">
        {/* Compact Strategy Configuration Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-[#0F131A] border-b border-[rgba(255,255,255,0.06)] text-xs">
          <div className="flex items-center space-x-3">
            {/* Strategy / Tone Selector */}
            <div className="flex items-center space-x-1.5 text-[#9AA5B1]">
              <span className="text-[10px] font-mono uppercase text-[#6B7280]">Strategy:</span>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as ToneMode)}
                className="bg-[#07090D] text-[#F5F7FA] text-xs px-2.5 py-1 rounded-xl border border-[rgba(255,255,255,0.06)] focus:outline-none focus:border-[#FF8A00] cursor-pointer"
              >
                <option value="Formal Architect">Formal Architect</option>
                <option value="Executive Brief">Executive Brief</option>
                <option value="Deep Analytical">Deep Analytical</option>
                <option value="Risk Auditor">Risk Auditor</option>
                <option value="Creative Strategist">Creative Strategist</option>
              </select>
            </div>

            {/* Reasoning Profile Selector */}
            <div className="flex items-center space-x-1.5 text-[#9AA5B1] hidden sm:flex">
              <span className="text-[10px] font-mono uppercase text-[#6B7280]">Reasoning:</span>
              <select
                value={reasoningProfile}
                onChange={(e) => setReasoningProfile(e.target.value as ReasoningProfile)}
                className="bg-[#07090D] text-[#F5F7FA] text-xs px-2.5 py-1 rounded-xl border border-[rgba(255,255,255,0.06)] focus:outline-none focus:border-[#FF8A00] cursor-pointer"
              >
                <option value="Auto">Auto (PCA)</option>
                <option value="Chain-of-Thought">Chain-of-Thought</option>
                <option value="First Principles">First Principles</option>
                <option value="Monte Carlo Risk">Monte Carlo Risk</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Language Selection */}
            <div className="flex items-center space-x-1.5 text-[10px] font-mono text-[#9AA5B1]">
              <span className="text-[#6B7280]">Lang:</span>
              <button
                type="button"
                onClick={() => setSpeechLang(speechLang === 'th-TH' ? 'en-US' : 'th-TH')}
                className="px-2 py-0.5 rounded-lg bg-[#07090D] border border-[rgba(255,255,255,0.06)] text-[#FF8A00] font-bold cursor-pointer hover:border-[#FF8A00]"
              >
                {speechLang === 'th-TH' ? 'TH' : 'EN'}
              </button>
            </div>

            {/* Memory Status */}
            <div className="flex items-center space-x-1 text-[10px] font-mono text-[#22C55E]" title="Memory System Active">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="hidden md:inline">Memory ●</span>
            </div>
          </div>
        </div>

        <textarea
          ref={textareaRef}
          autoFocus
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder={
            attachments.length > 0
              ? `Ask a strategic question or describe instructions for these ${attachments.length} attachments...`
              : "Ask a strategic question, upload files, paste reports or describe a complex decision..."
          }
          rows={3}
          disabled={isLoading}
          className="w-full bg-transparent p-3 sm:p-4 text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none transition-all resize-y min-h-[90px]"
        />

        {/* Bottom Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[rgba(255,255,255,0.08)] px-3 py-2.5 bg-[#060A16]">
          <div className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto no-scrollbar">
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="แนบไฟล์เอกสาร, รูปภาพ, โค้ด หรือไฟล์ข้อมูล (Attach File)"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#182338] hover:bg-[#243556] text-amber-200 hover:text-white border border-[#FF8A00]/50 hover:border-[#FF8A00] text-xs font-bold transition-all cursor-pointer shrink-0 shadow-sm"
            >
              <Paperclip className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF8A00]" />
              <span className="text-xs font-bold">Attach File</span>
            </button>

            {/* Sample Attachment Drawer Toggle */}
            <button
              type="button"
              onClick={() => setShowSampleDrawer(!showSampleDrawer)}
              title="เลือกไฟล์ตัวอย่างจำลองสถานการณ์ (Load Sample Files)"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#1E1938] hover:bg-[#2E2756] text-purple-200 hover:text-white border border-purple-400/50 hover:border-purple-400 text-xs font-bold transition-all cursor-pointer shrink-0 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span className="text-xs font-bold">Samples</span>
            </button>

            {/* Speech to Text Dictation Button */}
            <button
              type="button"
              onClick={toggleListening}
              disabled={isLoading}
              title="พูดเพื่อพิมพ์ข้อความด้วยเสียง (Voice Dictation)"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 shadow-sm ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-300 animate-pulse shadow-rose-600/30 ring-2 ring-rose-400'
                  : 'bg-[#12283A] hover:bg-[#1C3A54] text-sky-200 hover:text-white border-sky-400/50 hover:border-sky-400'
              }`}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5 text-white" /> : <Mic className="w-3.5 h-3.5 text-sky-300" />}
              <span className="text-xs font-bold">Voice</span>
            </button>

            {/* STT Language Selector */}
            <div className="flex items-center bg-[#182338] rounded-xl border border-slate-500/80 p-0.5 text-[10px] font-mono shrink-0 shadow-sm">
              <button
                type="button"
                onClick={() => setSpeechLang('th-TH')}
                title="สลับเป็นภาษาไทยสำหรับสั่งการด้วยเสียง"
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  speechLang === 'th-TH' ? 'bg-[#FF8A00] text-slate-950 font-black shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                TH
              </button>
              <button
                type="button"
                onClick={() => setSpeechLang('en-US')}
                title="Switch to English Speech Dictation"
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  speechLang === 'en-US' ? 'bg-[#FF8A00] text-slate-950 font-black shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0 ml-auto">
            {/* Character Counter */}
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline font-medium">
              {prompt.length} chars
            </span>

            {/* Primary Send Button */}
            <button
              type="submit"
              disabled={(!prompt.trim() && attachments.length === 0) || isLoading}
              className="flex items-center space-x-1.5 px-4 sm:px-6 py-2 rounded-xl bg-gradient-to-r from-[#FF8A00] to-amber-500 hover:from-[#E67C00] hover:to-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-xl hover:shadow-[#FF8A00]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <span className="uppercase tracking-wider">Execute</span>
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Expandable Sample Attachments Tray */}
      {showSampleDrawer && (
        <div className="mt-3 p-4 bg-[#060A16] rounded-2xl border border-[rgba(255,255,255,0.08)] animate-fadeIn">
          <span className="text-xs font-semibold text-[#FF8A00] mb-2 block">
            คลิกเพื่อแนบไฟล์ตัวอย่างสำหรับการทดสอบระบบวิเคราะห์ Multimodal:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {SAMPLE_ATTACHMENTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  handleAddSampleAttachment(s.file);
                  if (!prompt) {
                    setPrompt(`วิเคราะห์ข้อมูลสำคัญและระบุข้อเสนอแนะเชิงยุทธศาสตร์จากไฟล์ "${s.file.name}"`);
                  }
                }}
                className="text-left p-3 rounded-xl bg-[#0E1525] hover:bg-[#1A2338] border border-[rgba(255,255,255,0.08)] hover:border-[#FF8A00]/50 transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#FF8A00] group-hover:text-amber-300 truncate">
                    {s.title}
                  </span>
                  <FileCheck className="w-3.5 h-3.5 text-[#FF8A00] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">{s.description}</p>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                  📄 {s.file.name} ({formatFileSize(s.file.size)})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
