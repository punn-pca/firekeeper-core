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
  Sliders,
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
  onOpenStrategy?: () => void;
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
  onOpenStrategy,
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

      {/* Input Form as Strategic Command Terminal */}
      <form onSubmit={handleSubmit} className="flex flex-col rounded-2xl bg-[#060A16] border-2 border-amber-500/30 focus-within:border-[#FF8A00] focus-within:ring-2 focus-within:ring-[#FF8A00]/20 shadow-xl transition-all overflow-hidden">
        {/* Strategic Command Terminal Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0B1220] border-b border-white/10 text-xs w-full max-w-full">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Terminal Title Badge */}
            <div className="flex items-center space-x-1.5 text-amber-500 font-mono font-bold shrink-0">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 animate-pulse" />
              <span className="text-[11px] sm:text-xs tracking-wider uppercase">Strategic Console</span>
            </div>

            <span className="text-slate-600 hidden sm:inline">|</span>

            {/* Strategy / Tone Selector */}
            <div className="flex items-center space-x-1 text-slate-300">
              <span className="text-[11px] sm:text-xs font-mono uppercase text-slate-400 font-semibold">Tone:</span>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as ToneMode)}
                className="bg-[#121A2B] text-slate-100 text-xs px-2 py-1 rounded-lg border border-white/10 focus:outline-none focus:border-amber-500 cursor-pointer font-medium max-w-[130px] sm:max-w-none"
              >
                <option value="Formal Architect">Formal Architect</option>
                <option value="Executive Brief">Executive Brief</option>
                <option value="Deep Analytical">Deep Analytical</option>
                <option value="Risk Auditor">Risk Auditor</option>
                <option value="Creative Strategist">Creative Strategist</option>
              </select>
            </div>

            {/* Reasoning Profile Selector */}
            <div className="flex items-center space-x-1 text-slate-300 hidden md:flex">
              <span className="text-[11px] sm:text-xs font-mono uppercase text-slate-400 font-semibold">Reasoning:</span>
              <select
                value={reasoningProfile}
                onChange={(e) => setReasoningProfile(e.target.value as ReasoningProfile)}
                className="bg-[#121A2B] text-slate-100 text-xs px-2 py-1 rounded-lg border border-white/10 focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
              >
                <option value="Auto">Auto (12-Stage PCA)</option>
                <option value="Chain-of-Thought">Chain-of-Thought</option>
                <option value="First Principles">First Principles</option>
                <option value="Monte Carlo Risk">Monte Carlo Risk</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* STT Language Toggle */}
            <div className="flex items-center space-x-1 text-xs font-mono text-slate-300">
              <span className="text-slate-400 font-semibold hidden xs:inline">Lang:</span>
              <button
                type="button"
                onClick={() => setSpeechLang(speechLang === 'th-TH' ? 'en-US' : 'th-TH')}
                className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-[#121A2B] border border-amber-500/40 text-amber-400 font-bold text-[11px] sm:text-xs cursor-pointer hover:bg-amber-500/10 transition-colors"
              >
                {speechLang === 'th-TH' ? '🇹🇭 TH' : '🇺🇸 EN'}
              </button>
            </div>

            {/* Live Engine Status */}
            <div className="flex items-center space-x-1.5 text-[11px] font-mono text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30" title="PCA 12-Stage Engine & Memory Active">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Active</span>
            </div>
          </div>
        </div>

        {/* Live Processing Laser Scan Line */}
        {isLoading && (
          <div className="relative w-full h-1 bg-slate-900 overflow-hidden">
            <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300 animate-laser" />
          </div>
        )}

        {/* Command Textarea */}
        <div className="relative">
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
                ? `ระบุคำสั่งการวิเคราะห์เชิงยุทธศาสตร์ หรือคำถามสำหรับการประมวลผลไฟล์แนบ ${attachments.length} รายการนี้...`
                : "พิมพ์คำถามเชิงยุทธศาสตร์, จำลองสถานการณ์ Red Team, วิเคราะห์การตัดสินใจ หรือแนบเอกสารเพื่อรัน 12-Stage PCA..."
            }
            rows={4}
            disabled={isLoading}
            className="w-full bg-[#060A16] px-3.5 py-3.5 sm:px-5 sm:py-4.5 text-xs sm:text-base text-white placeholder-slate-400 focus:outline-none transition-all resize-y min-h-[120px] sm:min-h-[135px] leading-relaxed"
          />
        </div>

        {/* Command Console Bottom Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-3 sm:px-4 py-2 sm:py-3 bg-[#0A101D]">
          <div className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto no-scrollbar py-0.5">
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="แนบไฟล์เอกสาร, รูปภาพ, โค้ด หรือไฟล์ข้อมูล (Attach File)"
              className="flex items-center space-x-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#141E33] hover:bg-[#1E2D4D] text-amber-200 hover:text-white border border-amber-500/40 hover:border-amber-500 text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 shadow-sm"
            >
              <Paperclip className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span className="hidden xs:inline">แนบไฟล์</span>
              <span className="xs:hidden">แนบ</span>
            </button>

            {/* Sample Attachment Drawer Toggle */}
            <button
              type="button"
              onClick={() => setShowSampleDrawer(!showSampleDrawer)}
              title="เลือกไฟล์ตัวอย่างจำลองสถานการณ์ (Load Sample Files)"
              className="flex items-center space-x-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#1A1633] hover:bg-[#28224D] text-purple-200 hover:text-white border border-purple-400/40 hover:border-purple-400 text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-300" />
              <span className="hidden xs:inline">ไฟล์ตัวอย่าง</span>
              <span className="xs:hidden">ตัวอย่าง</span>
            </button>

            {/* Speech to Text Dictation Button */}
            <button
              type="button"
              onClick={toggleListening}
              disabled={isLoading}
              title="พูดเพื่อพิมพ์ข้อความด้วยเสียง (Voice Dictation)"
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 shadow-sm ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-300 animate-pulse shadow-rose-600/30 ring-2 ring-rose-400'
                  : 'bg-[#102233] hover:bg-[#18344D] text-sky-200 hover:text-white border-sky-400/40 hover:border-sky-400'
              }`}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" /> : <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-300" />}
              <span className="hidden xs:inline">{isListening ? 'กำลังฟัง...' : 'เสียง'}</span>
            </button>

            {/* Advanced Settings Gear Button */}
            {onOpenStrategy && (
              <button
                type="button"
                onClick={onOpenStrategy}
                title="ตั้งค่าขั้นสูง: Strategy, Reasoning, Memory, Temperature"
                className="p-1.5 sm:p-2 rounded-xl bg-[#141E33] hover:bg-[#1E2D4D] text-amber-400 hover:text-white border border-amber-500/40 transition-all cursor-pointer shrink-0 shadow-sm"
              >
                <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>

          {/* Right Action: Character count + Big Prominent Execute Button with Glow & Progress State */}
          <div className="flex items-center space-x-2 sm:space-x-4 shrink-0 ml-auto w-full xs:w-auto justify-end">
            {/* Keyboard shortcut hint */}
            <span className="text-xs font-mono text-slate-400 hidden lg:inline font-medium">
              กด <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold">↵ Enter</kbd>
            </span>

            {/* Primary Big Prominent Execute Button with Laser Glow & Active State */}
            <button
              type="submit"
              disabled={(!prompt.trim() && attachments.length === 0) || isLoading}
              className={`relative overflow-hidden flex-1 xs:flex-initial flex items-center justify-center space-x-2 px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer shadow-lg ${
                isLoading
                  ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 text-white shadow-amber-500/50 glow-active'
                  : 'bg-gradient-to-r from-[#FF8A00] via-amber-500 to-[#FF6B00] hover:from-[#FFA32B] hover:via-amber-400 hover:to-[#FF7A1A] text-slate-950 shadow-amber-500/30 hover:shadow-amber-500/60 hover:scale-[1.02] active:scale-[0.98] active:ring-4 active:ring-amber-400/40 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                  <span className="tracking-wider uppercase font-bold text-white">ANALYZING...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  <span className="tracking-wide">EXECUTE</span>
                </>
              )}
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
