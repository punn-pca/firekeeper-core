import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Paperclip,
  X,
  Upload,
  Zap,
  Lock,
  Sliders,
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  File as FileGeneric,
  AlertCircle,
  Sun,
  Moon,
  Square,
  Clock,
  Cpu,
  Globe,
} from 'lucide-react';
import { AttachedFile, ToneMode, ReasoningProfile } from '../types';
import { SamplePrompt } from '../data/pcaDefaults';
import { formatFileSize, getFileCategory, readFileAsAttachedFile } from '../utils/fileUtils';
import { safeLocalStorage } from '../utils/safeStorage';
import { auth } from '../lib/firebase';
import { useTheme } from '../context/ThemeContext';

interface ChatInputProps {
  onSend: (
    prompt: string,
    tone: ToneMode,
    deepReasoning: boolean,
    attachments: AttachedFile[],
    reasoningProfile: ReasoningProfile
  ) => void;
  isLoading: boolean;
  onCancel?: () => void;
  tone: ToneMode;
  deepReasoning: boolean;
  webSearch?: boolean;
  onToggleWebSearch?: () => void;
  reasoningProfile: ReasoningProfile;
  selectedModel: string;
  onSelectSample?: (sample: SamplePrompt) => void;
  onOpenSettings: () => void;
  isAuthenticated?: boolean;
  onOpenAuth?: () => void;
  externalPrompt?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  isLoading,
  onCancel,
  tone,
  deepReasoning,
  webSearch = true,
  onToggleWebSearch,
  reasoningProfile,
  selectedModel,
  onOpenSettings,
  isAuthenticated = false,
  onOpenAuth,
  externalPrompt,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  const [prompt, setPrompt] = useState(() => {
    try {
      return externalPrompt || safeLocalStorage.getItem('fire_keeper_draft_prompt') || '';
    } catch {
      return '';
    }
  });
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimerRef = useRef<number | null>(null);

  const [currentTime, setCurrentTime] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (externalPrompt !== undefined && externalPrompt !== '') {
      setPrompt(externalPrompt);
      safeLocalStorage.setItem('fire_keeper_draft_prompt', externalPrompt);
      textareaRef.current?.focus();
    }
  }, [externalPrompt]);

  const processFileList = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const fileArray = Array.from(files);
      const parsedFiles = await Promise.all(fileArray.map((f) => readFileAsAttachedFile(f)));
      setAttachments((prev) => [...prev, ...parsedFiles]);
    } catch (err) {
      console.error('Failed to parse attachments:', err);
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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!prompt.trim() && attachments.length === 0) || isLoading) return;
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    onSend(prompt, tone, deepReasoning, attachments, reasoningProfile);
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
    <div className="relative p-2 sm:p-3 rounded-xl bg-transparent">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files && processFileList(e.target.files)}
        multiple
        accept=".pdf,.doc,.docx,.txt,.csv,.json,.md,.js,.ts,.tsx,.py,.png,.jpg,.jpeg,.xlsx,.xls"
        className="hidden"
        id="chat-file-uploader"
      />

      <form
        onSubmit={handleSubmit}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col rounded-xl border transition-all ${
          isDragging
            ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
            : 'border-white/10 bg-[#060A16]'
        }`}
      >
        {/* Attached Files List Pills */}
        {attachments.length > 0 && (
          <div className="p-2 border-b border-white/5 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200"
              >
                {getFileIcon(getFileCategory(att.type, att.name))}
                <span className="font-mono text-[11px] truncate max-w-[120px]" title={att.name}>
                  {att.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">({formatFileSize(att.size)})</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(att.id)}
                  className="p-0.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors ml-0.5"
                  title="ลบไฟล์"
                >
                  <X className="w-3 h-3" />
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

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => {
            const val = e.target.value;
            setPrompt(val);
            safeLocalStorage.setItem('fire_keeper_draft_prompt', val);

            setIsTyping(true);
            if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
            typingTimerRef.current = window.setTimeout(() => setIsTyping(false), 1400);
          }}
          placeholder={
            isDragging
              ? 'วางไฟล์เพื่อแนบ...'
              : 'พิมพ์คำถามหรือข้อสั่งการ (หรือแนบไฟล์เอกสารเพื่อวิเคราะห์)...'
          }
          className={`w-full bg-transparent p-3 text-sm resize-none outline-none min-h-[80px] font-mono ${
            isLight ? 'text-[#172033] placeholder:text-slate-400' : 'text-white placeholder:text-slate-500'
          }`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              setIsTyping(false);
              handleSubmit();
            } else {
              setIsTyping(true);
              if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
              typingTimerRef.current = window.setTimeout(() => setIsTyping(false), 1400);
            }
          }}
        />

        {/* Action Controls Bar */}
        <div className={`flex items-center justify-between gap-2 px-2.5 py-2 border-t rounded-b-xl ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#080E1A]/80 border-white/5'
        }`}>
          <div className="flex items-center gap-1.5">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isLight ? "สลับเป็นโหมดมืด (Dark Mode)" : "สลับเป็นโหมดสว่าง (Light Mode)"}
              className={`p-1.5 rounded-lg transition-all duration-300 ease-out hover:scale-105 active:scale-95 flex items-center justify-center ${
                isLight ? 'text-amber-600 hover:bg-amber-100/60' : 'text-amber-400 hover:bg-white/10'
              }`}
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title="แนบไฟล์ (PDF, Word, CSV, Code, Text)"
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-all duration-300 ease-out hover:scale-105 active:scale-95 flex items-center gap-1"
            >
              <Paperclip className="w-4 h-4" />
              {attachments.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center justify-center">
                  {attachments.length}
                </span>
              )}
            </button>

            {/* Live Web Search Toggle Button (DeepSeek + Web Search) */}
            <button
              type="button"
              onClick={onToggleWebSearch}
              title={webSearch ? "ระบบสืบค้นเว็บสดเปิดใช้งาน (DeepSeek + Web Search ON) - คลิกเพื่อปิด" : "เปิดใช้งานการสืบค้นเว็บสด (DeepSeek + Web Search OFF) - คลิกเพื่อเปิด"}
              className={`p-1.5 rounded-lg transition-all duration-300 ease-out hover:scale-105 active:scale-95 flex items-center gap-1.5 text-xs font-mono ${
                webSearch
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-[0_0_12px_rgba(14,165,233,0.3)]'
                  : 'text-slate-400 hover:text-sky-400 hover:bg-white/5'
              }`}
            >
              <Globe className={`w-4 h-4 ${webSearch ? 'text-sky-400 animate-spin-slow' : ''}`} />
              <span className="hidden md:inline text-[11px] font-semibold">
                {webSearch ? 'Web Search' : 'Web Search'}
              </span>
              {webSearch && (
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
              )}
            </button>

            {/* Chat Configuration Trigger */}
            <button
              type="button"
              onClick={onOpenSettings}
              title="ตั้งค่าโมเดลและโทน (Chat Configuration)"
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-all duration-300 ease-out hover:scale-105 active:scale-95"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>

          {/* Center Info: Current Time & Active Model Badge */}
          <div 
            onClick={onOpenSettings}
            title="โมเดลที่เลือกใช้งานและเวลาปัจจุบัน (คลิกเพื่อเปลี่ยนโมเดล)"
            className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono border transition-all cursor-pointer select-none ${
              isLight 
                ? 'bg-slate-200/70 border-slate-300/80 text-slate-700 hover:bg-slate-200' 
                : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-amber-500/40 hover:text-amber-300'
            }`}
          >
            <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400 font-semibold">
              <Cpu className="w-3.5 h-3.5" />
              <span>{selectedModel}</span>
            </div>
            <span className="text-slate-400">•</span>
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Clock className="w-3 h-3" />
              <span>{currentTime}</span>
            </div>
          </div>

          {/* Action / Submit Button */}
          {isLoading ? (
            <div
              className={`px-3.5 py-2 font-mono rounded-lg text-xs flex items-center gap-1.5 select-none ${
                isLight ? 'bg-slate-200 text-slate-500' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>กำลังวิเคราะห์...</span>
            </div>
          ) : (() => {
            const hasContent = Boolean(prompt.trim() || attachments.length > 0);
            const isBlinking = hasContent && isTyping;

            return (
              <div className="relative inline-flex items-center">
                {isBlinking && (
                  <span
                    className="absolute -inset-1 rounded-xl bg-amber-400/40 blur-sm animate-ping pointer-events-none"
                    aria-hidden="true"
                  />
                )}
                <button
                  type="submit"
                  disabled={!hasContent}
                  title={!hasContent ? "กรุณากรอกข้อความก่อนส่ง" : "คลิกเพื่อส่งคำสั่ง (Execute)"}
                  className={`relative z-10 px-4 py-2 font-bold font-mono rounded-xl text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                    !hasContent
                      ? (isLight ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-800 text-slate-500 cursor-not-allowed')
                      : isBlinking
                      ? 'border-amber-300 bg-amber-400 text-slate-950 shadow-[0_0_28px_rgba(245,158,11,0.9)] animate-[fk-execute-blink_0.75s_ease-in-out_infinite]'
                      : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-[pulse_2.2s_ease-in-out_infinite] hover:scale-105 active:scale-95'
                  }`}
                >
                  <span>EXECUTE</span>
                  <Sparkles className={`w-3.5 h-3.5 transition-transform ${isBlinking ? 'animate-[fk-flame-flicker_0.4s_infinite]' : ''}`} />
                </button>
              </div>
            );
          })()}
        </div>
      </form>
    </div>
  );
};

