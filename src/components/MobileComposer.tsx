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
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
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
          className={`w-full bg-transparent px-3 py-3 text-base outline-none resize-none font-sans min-h-[48px] max-h-[28vh] overflow-y-auto fk-composer-textarea leading-relaxed ${
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
        <div className={`min-w-0 border-t px-2 py-2 sm:px-3 ${isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-[#171717]'}`}>
          <div className="grid grid-cols-4 lg:flex lg:flex-nowrap min-w-0 items-stretch gap-2">
            <div className="contents lg:flex lg:min-w-0 lg:items-center lg:gap-1.5">
              <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="แนบไฟล์" title="แนบไฟล์" className={`flex h-12 lg:h-10 min-w-0 w-full px-1 lg:w-auto lg:px-3 lg:shrink-0 items-center justify-center gap-1 lg:gap-2 rounded-xl border text-amber-500 ${isLight ? 'border-slate-300 hover:bg-slate-100' : 'border-white/10 hover:bg-white/10'}`}><Paperclip className="h-4 w-4" /><span className="inline whitespace-nowrap text-[10px] sm:text-xs">แนบไฟล์</span></button>
              {onToggleMode && <button type="button" onClick={() => onToggleMode(mode === 'governed' ? 'normal' : 'governed')} aria-label={mode === 'governed' ? 'โหมด Governed เปลี่ยนเป็น Normal' : 'โหมด Normal เปลี่ยนเป็น Governed'} title={mode === 'governed' ? 'Governed' : 'Normal'} className={`flex h-12 lg:h-10 min-w-0 w-full px-1 lg:w-auto lg:px-3 lg:shrink-0 gap-2 items-center justify-center rounded-xl border ${mode === 'governed' ? isLight ? 'border-amber-600/50 bg-amber-500/10 text-amber-800' : 'border-amber-500/40 bg-amber-500/10 text-amber-300' : isLight ? 'border-slate-300 bg-white text-slate-700' : 'border-white/20 bg-white/5 text-slate-200'}`}>{mode === 'governed' ? <ShieldCheck className="h-4 w-4" /> : <Zap className="h-4 w-4" />}<span className="inline whitespace-nowrap text-[10px] sm:text-xs">{mode === 'governed' ? 'Governance' : 'Normal'}</span></button>}
              <button type="button" onClick={onToggleWebSearch} aria-label={webSearch ? 'ปิดค้นหาเว็บ' : 'เปิดค้นหาเว็บ'} aria-pressed={webSearch} title="ค้นหาเว็บ" className={`flex h-12 lg:h-10 min-w-0 w-full px-1 lg:w-auto lg:px-3 lg:shrink-0 gap-2 items-center justify-center rounded-xl border ${webSearch ? isLight ? 'border-sky-500/40 bg-sky-500/10 text-sky-700' : 'border-sky-500/40 bg-sky-500/10 text-sky-300' : isLight ? 'border-slate-300 text-slate-600' : 'border-white/10 text-slate-400'}`}><Globe className="h-4 w-4" /><span className="inline whitespace-nowrap text-[10px] sm:text-xs">ค้นเว็บ</span></button>
              <button type="button" onClick={toggleTheme} aria-label={isLight ? 'เปลี่ยนเป็นโหมดมืด' : 'เปลี่ยนเป็นโหมดสว่าง'} className={`flex h-12 lg:h-10 min-w-0 w-full px-1 lg:w-auto lg:px-3 lg:shrink-0 gap-2 items-center justify-center rounded-xl border ${isLight ? 'border-slate-300 text-slate-600 hover:bg-slate-100' : 'border-white/10 text-slate-400 hover:bg-white/10'}`}>{isLight ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}<span className="inline whitespace-nowrap text-[10px] sm:text-xs">ธีม</span></button>
            </div>
            <div className="contents lg:flex lg:min-w-0 lg:items-center lg:gap-2">
              <button type="button" onClick={() => setModelMenuOpen((open) => !open)} aria-expanded={modelMenuOpen} aria-label={`เลือกโมเดล ปัจจุบัน: ${selectedModel}`} title={`เลือกโมเดล: ${selectedModel}`} className="col-span-2 lg:col-span-1 flex h-12 lg:h-10 w-full min-w-0 lg:w-[140px] lg:min-w-[140px] lg:max-w-[140px] items-center justify-between gap-1 lg:gap-2 rounded-xl border border-slate-300 bg-transparent px-3 text-xs font-medium text-current"><span className="truncate">{compactModelLabel}</span><ChevronDown className="h-3 w-3 shrink-0" /></button>
              <button type="button" onClick={onOpenSettings} aria-label="เปิดการตั้งค่า AI" title="ตั้งค่า AI Engine" className={`flex h-12 lg:h-10 min-w-0 w-full px-1 lg:w-auto lg:px-3 lg:shrink-0 items-center justify-center gap-1 lg:gap-2 rounded-xl border ${isLight ? 'border-slate-300 text-slate-600 hover:bg-slate-100' : 'border-white/10 text-slate-400 hover:bg-white/10'}`}><Sliders className="h-4 w-4" /><span className="inline whitespace-nowrap text-[10px] sm:text-xs">ตั้งค่า</span></button>
            </div>
            <div className="col-span-1 min-w-0 lg:ml-auto lg:shrink-0">
            {isLoading ? <button type="button" onClick={onCancel} className="flex h-12 w-full min-w-0 lg:h-12 lg:w-[130px] lg:shrink-0 items-center justify-center gap-1 lg:gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 text-rose-400" aria-label="หยุดประมวลผล"><X className="h-4 w-4" /><span className="text-xs font-semibold">หยุด</span></button> : <button type="submit" disabled={!hasContent} title={mode === "governed" ? "วิเคราะห์ (Ctrl+Enter)" : "ส่งข้อความ (Ctrl+Enter)"} className={`flex h-12 w-full min-w-0 lg:h-12 lg:w-[130px] lg:shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold ${hasContent ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : isLight ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white/10 text-slate-500 cursor-not-allowed'}`}>{mode === 'governed' ? <><ShieldCheck className="h-4 w-4" /><span>วิเคราะห์</span></> : <><ArrowUp className="h-4 w-4" /><span>ส่ง</span></>}</button>}
            </div>
          </div>
          {modelMenuOpen && (
            <div className={`mt-2 max-h-52 overflow-y-auto rounded-xl border p-1 ${isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-[#252525]'}`} role="listbox" aria-label="เลือกโมเดล AI">
              {modelContext.availableModels.map((option) => (
                <button key={option.id} type="button" role="option" aria-selected={selectedModel === option.id}
                  onClick={() => {
                    if (option.provider !== modelContext.activeProvider) modelContext.setActiveProvider(option.provider);
                    modelContext.setSelectedModel(option.id);
                    setModelMenuOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-amber-500/10 ${selectedModel === option.id ? 'text-amber-400' : isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                  <span className="min-w-0 truncate">{option.displayName || option.name}</span>
                  <span className="shrink-0 text-[10px] opacity-60">{option.provider}</span>
                </button>
              ))}
              {modelContext.availableModels.length === 0 && <p className="px-3 py-2 text-xs text-slate-400">ไม่มีโมเดลที่พร้อมให้เลือก</p>}
            </div>
          )}
        </div>
      </ChatComposerSurface>
    </div>
  );
};
