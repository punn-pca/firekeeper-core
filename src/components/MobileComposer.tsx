import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Paperclip, Globe, X, Sparkles, Sliders, FileText, FileSpreadsheet, FileCode, Image as ImageIcon, File as FileGeneric } from 'lucide-react';
import { AttachedFile, ToneMode, ReasoningProfile } from '../types';
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
}) => {
  const { theme } = useTheme();
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
    textarea.style.height = `${Math.max(n => n || 40, newHeight)}px`;
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
        className={`flex flex-col rounded-2xl border transition-all shadow-lg ${
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
          placeholder="ถาม Firekeeper..."
          rows={1}
          className={`w-full bg-transparent px-3 py-2.5 text-sm outline-none resize-none font-sans min-h-[40px] max-h-[35vh] overflow-y-auto leading-relaxed ${
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
        <div className={`flex items-center justify-between px-2.5 py-1.5 border-t text-xs font-mono ${
          isLight ? 'border-slate-100 bg-slate-50/50' : 'border-white/5 bg-white/[0.02]'
        }`}>
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Attachment ＋ */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
                isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-white/10 text-slate-400'
              }`}
              title="แนบไฟล์ (PDF, Code, Text, Images)"
            >
              <Paperclip className="w-4 h-4 text-amber-500" />
            </button>



            {/* Model Badge ◈ */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="px-2 py-1 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400 text-[10px] font-mono truncate max-w-[110px]"
            >
              ◈ {selectedModel.slice(0, 10)}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[9px] text-slate-500 font-mono">
              Governed by PCA v3.0
            </span>

            {/* Send Button ↑ */}
            {isLoading ? (
              <button
                type="button"
                onClick={onCancel}
                className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center font-bold text-xs animate-pulse"
                title="ยกเลิกการวิเคราะห์"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!hasContent}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  hasContent
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-105'
                    : isLight ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white/10 text-slate-600 cursor-not-allowed'
                }`}
                title="ส่งข้อความ (Enter)"
              >
                <ArrowUp className="w-4 h-4 stroke-[3]" />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
