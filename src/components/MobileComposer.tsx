import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, ArrowRight, Paperclip, Globe, X, Sparkles, Sliders, Sun, Moon, FileText, FileSpreadsheet, FileCode, Image as ImageIcon, File as FileGeneric, ShieldCheck, Zap } from 'lucide-react';
import { AttachedFile, ToneMode, ReasoningProfile, ChatMode } from '../types';
import { readFileAsAttachedFile, formatFileSize, getFileCategory, extractImagesFromClipboardEvent, MAX_ATTACHMENT_SIZE_BYTES } from '../utils/fileUtils';
import { safeLocalStorage, getDraftPromptStorageKey } from '../utils/safeStorage';
import { auth } from '../lib/firebase';
import { useTheme } from '../context/ThemeContext';
import { useModel } from '../context/ModelContext';

interface MobileComposerProps {
  onSendPrompt: (
    prompt: string,
    tone?: ToneMode,
    deepReasoning?: boolean,
    attachments?: AttachedFile[],
    reasoningProfile?: ReasoningProfile
  ) => void;
  isLoading: boolean;
  onCancel: () => void;
  tone: ToneMode;
  deepReasoning: boolean;
  webSearch: boolean;
  onToggleWebSearch: () => void;
  reasoningProfile: ReasoningProfile;
  selectedModel?: string;
  onOpenSettings: () => void;
  isAuthenticated: boolean;
  onOpenAuth: () => void;
  externalPrompt?: string;
  mode?: ChatMode;
  onToggleMode?: (newMode: ChatMode) => void;
}

export const MobileComposer: React.FC<MobileComposerProps> = ({
  onSendPrompt,
  isLoading,
  onCancel,
  tone,
  deepReasoning,
  webSearch,
  onToggleWebSearch,
  reasoningProfile,
  selectedModel: selectedModelProp,
  onOpenSettings,
  isAuthenticated,
  onOpenAuth,
  externalPrompt,
  mode = 'governed',
  onToggleMode,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  const modelContext = useModel();
  const selectedModel = selectedModelProp || modelContext.selectedModel;
  const currentUid = auth.currentUser?.uid || null;

  const [prompt, setPrompt] = useState(() => {
    try {
      return externalPrompt || safeLocalStorage.getItem(getDraftPromptStorageKey(currentUid)) || '';
    } catch {
      return '';
    }
  });

  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync draft prompt when externalPrompt changes
  useEffect(() => {
    if (externalPrompt !== undefined && externalPrompt !== '') {
      setPrompt(externalPrompt);
      safeLocalStorage.setItem(getDraftPromptStorageKey(auth.currentUser?.uid || null), externalPrompt);
    }
  }, [externalPrompt]);

  // Auto-resize textarea upwards up to 35vh max height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const maxHeight = Math.floor(window.innerHeight * 0.35); // 35% of screen height max
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${Math.max(104, newHeight)}px`;
  }, [prompt]);

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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!prompt.trim() && attachments.length === 0) || isLoading) return;
    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }
    onSendPrompt(prompt, tone, deepReasoning, attachments, reasoningProfile);
    setPrompt('');
    setAttachments([]);
    safeLocalStorage.removeItem(getDraftPromptStorageKey(auth.currentUser?.uid || null));

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const hasContent = Boolean(prompt.trim() || attachments.length > 0);

  return (
    <div className="w-full select-none">
      {/* Hidden File Uploader */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files && processFileList(e.target.files)}
        multiple
        accept=".pdf,.doc,.docx,.txt,.csv,.json,.md,.js,.ts,.tsx,.py,.png,.jpg,.jpeg,.xlsx,.xls"
        className="hidden"
      />

      <form
        onSubmit={handleSubmit}
        className={`flex flex-col rounded-xl sm:rounded-2xl border transition-all duration-300 shadow-2xl backdrop-blur-xl focus-within:border-amber-500/40 ${
          isLight
            ? 'bg-white border-slate-200 shadow-slate-200/50'
            : 'bg-[#0a0f1d] border-white/10 shadow-black/60'
        }`}
      >
        {/* Attached Files Bar */}
        {attachments.length > 0 && (
          <div className="p-2 border-b border-white/5 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs bg-white/5 border-white/10"
              >
                <Paperclip className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="font-mono text-[11px] truncate max-w-[120px]">{att.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(att.id)}
                  className="p-0.5 text-slate-400 hover:text-rose-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Auto-Growing Upward Textarea Input */}
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => {
            const val = e.target.value;
            setPrompt(val);
            safeLocalStorage.setItem(getDraftPromptStorageKey(auth.currentUser?.uid || null), val);
          }}
          placeholder="ถามคำถามเชิงกลยุทธ์ วิเคราะห์การตัดสินใจ..."
          rows={3}
          className={`w-full bg-transparent p-4 text-base outline-none resize-none font-sans min-h-[104px] max-h-[35vh] overflow-y-auto leading-relaxed ${
            isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-white placeholder:text-slate-500'
          }`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        {/* Bottom Toolbar: Attachment ＋, Web ◉, Model Badge ◈, Send ↑ */}
        <div className={`flex items-center justify-between px-3 py-2.5 border-t text-xs font-mono gap-2 ${
          isLight ? 'border-slate-100 bg-slate-50/50' : 'border-white/5 bg-white/[0.02]'
        }`}>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0">
            {/* Attachment ＋ */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`min-h-11 min-w-11 p-2.5 rounded-lg transition-colors flex items-center justify-center ${
                isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-white/10 text-slate-400'
              }`}
              title="แนบไฟล์ (PDF, Code, Text, Images)"
            >
              <Paperclip className="w-4 h-4 text-amber-500" />
            </button>



            {/* Mode Selector (Mobile: Governed <-> Normal) */}
            {onToggleMode && (
              <button
                type="button"
                onClick={() => onToggleMode(mode === 'governed' ? 'normal' : 'governed')}
                className={`flex items-center gap-1 min-h-[38px] rounded-xl border px-2.5 py-1.5 transition-all shrink-0 font-mono text-xs font-semibold ${
                  mode === 'governed'
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                    : 'border-sky-500/40 bg-sky-500/10 text-sky-400'
                }`}
                title={mode === 'governed' ? 'โหมดปัจจุบัน: Governed (คลิกเพื่อเปลี่ยนเป็น Normal)' : 'โหมดปัจจุบัน: Normal (คลิกเพื่อเปลี่ยนเป็น Governed)'}
              >
                {mode === 'governed' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    <span>Governed</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-sky-400" />
                    <span>Normal</span>
                  </>
                )}
              </button>
            )}

            <div className="h-4 w-px bg-white/10 shrink-0" />
            <button
              type="button"
              onClick={onToggleWebSearch}
              className={`flex items-center gap-1.5 min-h-[38px] rounded-xl border px-2.5 py-1.5 transition-all shrink-0 ${webSearch ? 'border-sky-500/40 bg-sky-500/10 text-sky-400' : 'border-white/10 bg-white/5 text-slate-400'}`}
              title={webSearch ? 'ค้นหาเว็บสด (เปิดใช้งานอยู่)' : 'เปิดใช้งานการค้นหาเว็บสด'}
            >
              <Globe className="w-4 h-4" />
              <span className="text-xs font-medium font-mono">ค้นหาเว็บ</span>
              <span className={`h-1.5 w-1.5 rounded-full ${webSearch ? 'bg-sky-400 animate-pulse' : 'bg-slate-600'}`} />
            </button>
            <div className="h-4 w-px bg-white/10 shrink-0" />
            <button
              type="button"
              onClick={toggleTheme}
              className={`min-h-[38px] min-w-[38px] rounded-xl border px-2.5 py-1.5 flex items-center justify-center ${isLight ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-white/10 bg-white/5 text-slate-300'}`}
              title={isLight ? 'เปลี่ยนเป็นโหมดมืด' : 'เปลี่ยนเป็นโหมดสว่าง'}
            >
              {isLight ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-sky-300" />}
            </button>
            <div className="h-4 w-px bg-white/10 shrink-0" />

            {/* Model Badge ◈ / Settings Button */}
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label={`ตั้งค่าโมเดล: ${selectedModel}`}
              title={`ตั้งค่าโมเดล & AI Engine: ${selectedModel}`}
              className="flex items-center gap-1.5 min-h-[38px] px-2.5 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-mono font-medium shrink-0 transition-all cursor-pointer whitespace-nowrap shadow-[0_0_10px_rgba(245,158,11,0.1)]"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="max-w-[130px] sm:max-w-none truncate">
                {selectedModel || 'deepseek-chat'}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="hidden sm:inline text-[9px] text-slate-500 font-mono">
              Governed by PCA v3.0
            </span>

            {/* Send Button ↑ */}
            {isLoading ? (
              <button
                type="button"
                onClick={onCancel}
                className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold text-sm"
                title="ยกเลิกการวิเคราะห์"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!hasContent}
                className={`min-h-[44px] min-w-[116px] px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  hasContent
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-105'
                    : isLight ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white/10 text-slate-600 cursor-not-allowed'
                }`}
                title="ส่งข้อความ (Enter)"
              >
                <span className="font-bold tracking-wide">ประมวลผล</span><ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
