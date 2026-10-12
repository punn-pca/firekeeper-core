import { ChatComposerSurface } from './ChatComposerSurface';
import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, ChevronDown, Paperclip, Globe, X, Sparkles, Sliders, Sun, Moon, FileText, FileSpreadsheet, FileCode, Image as ImageIcon, File as FileGeneric, ShieldCheck, Zap } from 'lucide-react';
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
  // Compact label for narrow mobile toolbars; keep the full model ID in accessibility text.
  const compactModelLabel = (() => {
    const id = (selectedModel || 'deepseek-chat').trim();
    if (id === 'deepseek-chat') return 'DeepSeek';
    if (id === 'deepseek-reasoner') return 'DS R1';
    if (id.startsWith('deepseek-')) return 'DeepSeek';
    if (id.startsWith('gemini-')) return 'Gemini';
    if (id.startsWith('claude-')) return 'Claude';
    if (id.startsWith('gpt-')) return id.replace(/^gpt-/, 'GPT ');
    return id.length > 12 ? id.slice(0, 11) + '…' : id;
  })();


  const [prompt, setPrompt] = useState(() => {
    try {
      return externalPrompt ?? safeLocalStorage.getItem(getDraftPromptStorageKey(currentUid)) ?? '';
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
    if (externalPrompt !== undefined) {
      setPrompt(externalPrompt);
      const draftKey = getDraftPromptStorageKey(auth.currentUser?.uid || null);
      if (externalPrompt) safeLocalStorage.setItem(draftKey, externalPrompt);
      else safeLocalStorage.removeItem(draftKey);
    }
  }, [externalPrompt]);

  // Auto-resize textarea upwards up to 35vh max height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const maxHeight = Math.floor(window.innerHeight * 0.28); // 28% of screen height max
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${Math.max(48, newHeight)}px`;
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
    <div className="w-full min-w-0 select-none">
      {/* Hidden File Uploader */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files && processFileList(e.target.files)}
        multiple
        accept=".pdf,.doc,.docx,.txt,.csv,.json,.md,.js,.ts,.tsx,.py,.png,.jpg,.jpeg,.xlsx,.xls"
        className="hidden"
      />

      <ChatComposerSurface
        as="form"
        light={isLight}
        onSubmit={handleSubmit}
        className="flex flex-col"
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
          placeholder="พิมพ์ข้อความหรือคำถาม..."
          rows={1}
          className={`w-full bg-transparent px-3 py-3 text-base outline-none resize-none font-sans min-h-[48px] max-h-[28vh] overflow-y-auto leading-relaxed ${
            isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-white placeholder:text-slate-500'
          }`}
          onKeyDown={(e) => {
            // Enter inserts a newline; Ctrl/Cmd+Enter sends the message.
            // Never submit while an IME is composing text.
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !e.nativeEvent.isComposing) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        {/* Balanced responsive composer toolbar: tools / primary PCA action / model settings */}
        <div className={`min-w-0 border-t px-2 py-2 sm:px-3 ${isLight ? 'border-slate-200 bg-slate-50/50' : 'border-white/10 bg-[#171717]'}`}>
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="แนบไฟล์" title="แนบไฟล์" className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 text-amber-500 hover:bg-white/10"><Paperclip className="h-4 w-4" /></button>
              {onToggleMode && <button type="button" onClick={() => onToggleMode(mode === 'governed' ? 'normal' : 'governed')} aria-label={mode === 'governed' ? 'โหมด Governed เปลี่ยนเป็น Normal' : 'โหมด Normal เปลี่ยนเป็น Governed'} title={mode === 'governed' ? 'Governed' : 'Normal'} className={`flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border ${mode === 'governed' ? 'border-amber-500/40 bg-amber-500/10 text-amber-400' : 'border-sky-500/40 bg-sky-500/10 text-sky-400'}`}>{mode === 'governed' ? <ShieldCheck className="h-4 w-4" /> : <Zap className="h-4 w-4" />}</button>}
              <button type="button" onClick={onToggleWebSearch} aria-label={webSearch ? 'ปิดค้นหาเว็บ' : 'เปิดค้นหาเว็บ'} aria-pressed={webSearch} title="ค้นหาเว็บ" className={`flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border ${webSearch ? 'border-sky-500/40 bg-sky-500/10 text-sky-400' : 'border-white/10 text-slate-400'}`}><Globe className="h-4 w-4" /></button>
              <button type="button" onClick={toggleTheme} aria-label={isLight ? 'เปลี่ยนเป็นโหมดมืด' : 'เปลี่ยนเป็นโหมดสว่าง'} className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 text-slate-400">{isLight ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
            </div>
            {isLoading ? <button type="button" onClick={onCancel} className="flex h-11 min-w-0 flex-1 items-center justify-center gap-1 rounded-xl border border-rose-500/40 bg-rose-500/10 px-2 text-rose-400" aria-label="หยุดประมวลผล"><X className="h-4 w-4" /><span className="text-xs font-semibold">หยุด</span></button> : <button type="submit" disabled={!hasContent} title="ส่งข้อความ (Ctrl+Enter)" className={`flex h-11 min-w-0 flex-1 items-center justify-center gap-1 rounded-xl px-3 text-xs font-bold ${hasContent ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950' : 'bg-white/10 text-slate-500 cursor-not-allowed'}`}>{mode === 'governed' ? <><ShieldCheck className="h-4 w-4" />PCA</> : <ArrowUp className="h-4 w-4" />}</button>}
          </div>
          <div className="mt-2 flex min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <button type="button" onClick={onOpenSettings} aria-label={`เลือกโมเดล ปัจจุบัน: ${selectedModel}`} title={`เลือกโมเดล: ${selectedModel}`} className="flex h-10 min-w-0 flex-1 items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 text-xs font-medium text-amber-400"><span className="truncate">{compactModelLabel}</span><ChevronDown className="h-3 w-3 shrink-0" /></button>
              <button type="button" onClick={onOpenSettings} aria-label="เปิดการตั้งค่า AI" title="ตั้งค่า AI Engine" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-slate-400 hover:bg-white/10"><Sliders className="h-4 w-4" /></button>
            </div>
            <span className="truncate text-[10px] text-slate-500">{mode === 'governed' ? 'PUNN-PCA v3.0' : 'Normal AI'}</span>
          </div>
        </div>
      </ChatComposerSurface>
    </div>
  );
};
