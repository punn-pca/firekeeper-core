import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Mic,
  MicOff,
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
} from 'lucide-react';
import { AttachedFile, ToneMode, ReasoningProfile } from '../types';
import { SamplePrompt } from '../data/pcaDefaults';
import { formatFileSize, getFileCategory, readFileAsAttachedFile } from '../utils/fileUtils';
import { safeLocalStorage } from '../utils/safeStorage';
import { auth } from '../lib/firebase';

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
  deepReasoning: boolean;
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
  tone,
  deepReasoning,
  reasoningProfile,
  selectedModel,
  onOpenSettings,
  isAuthenticated = false,
  onOpenAuth,
  externalPrompt,
}) => {
  const [prompt, setPrompt] = useState(() => {
    try {
      return externalPrompt || safeLocalStorage.getItem('fire_keeper_draft_prompt') || '';
    } catch {
      return '';
    }
  });
  const [isListening, setIsListening] = useState(false);
  const [speechLang] = useState<'th-TH' | 'en-US'>('th-TH');
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const baselinePromptRef = useRef<string>('');

  useEffect(() => {
    if (externalPrompt !== undefined && externalPrompt !== '') {
      setPrompt(externalPrompt);
      safeLocalStorage.setItem('fire_keeper_draft_prompt', externalPrompt);
      textareaRef.current?.focus();
    }
  }, [externalPrompt]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const toggleListening = async () => {
    setMicError(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicError('เบราว์เซอร์ไม่รองรับ Speech Recognition กรุณาใช้ Chrome หรือ Edge');
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
      console.warn('Microphone permission request:', permErr);
      if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
        setMicError('ไมโครโฟนถูกบล็อก กรุณาอนุญาตการเข้าถึงไมค์ในเบราว์เซอร์');
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
        } else if (event.error !== 'no-speech') {
          setMicError(`ข้อผิดพลาดของไมโครโฟน (${event.error})`);
        }
        setIsListening(false);
      };

      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Speech recognition start failed:', err);
      setMicError('ไม่สามารถเริ่มระบบเสียงได้');
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
        {/* Listening Active Wave Indicator */}
        {isListening && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-rose-500/15 border-b border-rose-500/30 text-rose-300 text-xs font-mono rounded-t-xl animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>กำลังฟังเสียง...</span>
            </div>
            <button
              type="button"
              onClick={toggleListening}
              className="text-[10px] bg-rose-500/30 hover:bg-rose-500/50 px-2 py-0.5 rounded text-white font-bold"
            >
              หยุด
            </button>
          </div>
        )}

        {/* Microphone Error Notice */}
        {micError && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-amber-500/15 border-b border-amber-500/30 text-amber-300 text-xs rounded-t-xl">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
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
            setPrompt(e.target.value);
            safeLocalStorage.setItem('fire_keeper_draft_prompt', e.target.value);
          }}
          placeholder={
            isDragging
              ? 'วางไฟล์เพื่อแนบ...'
              : 'พิมพ์คำถามหรือข้อสั่งการ (หรือแนบไฟล์ / กดไมค์เพื่อพูด)...'
          }
          className="w-full bg-transparent p-3 text-sm text-white resize-none outline-none min-h-[80px] font-mono"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        {/* Action Controls Bar */}
        <div className="flex items-center justify-between gap-2 px-2.5 py-2 border-t border-white/5 bg-[#080E1A]/80 rounded-b-xl">
          <div className="flex items-center gap-1.5">
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title="แนบไฟล์ (PDF, Word, CSV, Code, Text)"
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-all flex items-center gap-1"
            >
              <Paperclip className="w-4 h-4" />
              {attachments.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center justify-center">
                  {attachments.length}
                </span>
              )}
            </button>

            {/* Speech Recognition Mic Button */}
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? 'กดเพื่อหยุดฟัง' : 'กดเพื่อพูดสั่งการ'}
              className={`p-1.5 rounded-lg transition-all ${
                isListening
                  ? 'text-rose-400 bg-rose-500/20 animate-pulse'
                  : 'text-slate-400 hover:text-sky-400 hover:bg-white/5'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>


            {/* Chat Configuration Trigger */}
            <button
              type="button"
              onClick={onOpenSettings}
              title="ตั้งค่าโมเดลและโทน (Chat Configuration)"
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-all"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || (!prompt.trim() && attachments.length === 0)}
            className={`px-4 py-2 font-bold font-mono rounded-lg text-xs transition-all flex items-center gap-1.5 ${
              !prompt.trim() && attachments.length === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-amber-500 text-black hover:bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
            }`}
          >
            <span>EXECUTE</span>
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};

