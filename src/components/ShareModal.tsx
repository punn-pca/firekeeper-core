import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  ShieldCheck, 
  Globe
} from 'lucide-react';
import { copyToClipboard } from '../utils/fileUtils';
import { getSafeOrigin } from '../utils/safeLocation';
import { ShareCoverGenerator } from './ShareCoverGenerator';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = getSafeOrigin();
  const shareTitle = 'FIRE KEEPER PCA — PUNN Cognitive Architecture & Executive Decision Intelligence';
  const shareDescription = '“We don\'t replace judgment. We illuminate it.” Enterprise AI Decision Intelligence Platform powered by 12-Stage PUNN Predictive Cognitive Architecture (PCA).';

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      const success = await copyToClipboard(shareUrl);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) {
      // Suppress clipboard errors in restricted iframe
    }
  };

  const handleDownloadCover = async () => {
    try {
      const response = await fetch('/share-cover.png');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fire-keeper-pca-cover.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      const a = document.createElement('a');
      a.href = '/share-cover.png';
      a.download = 'fire-keeper-pca-cover.png';
      a.target = '_blank';
      a.click();
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && window.isSecureContext && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareDescription,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed or insecure context
      }
    } else {
      handleCopyLink();
    }
  };

  const shareOptions = [
    {
      name: 'X (Twitter)',
      icon: '𝕏',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle + '\n' + shareDescription)}&url=${encodeURIComponent(shareUrl)}`,
      color: 'hover:bg-slate-800 text-slate-200'
    },
    {
      name: 'LINE',
      icon: '🟢',
      url: `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`,
      color: 'hover:bg-emerald-950/60 text-emerald-400'
    },
    {
      name: 'Facebook',
      icon: '📘',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      color: 'hover:bg-blue-950/60 text-blue-400'
    },
    {
      name: 'LinkedIn',
      icon: '💼',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      color: 'hover:bg-indigo-950/60 text-indigo-400'
    },
    {
      name: 'Telegram',
      icon: '✈️',
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
      color: 'hover:bg-cyan-950/60 text-cyan-400'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-[#090C12] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0E131E]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md">
              <Share2 className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                แชร์ลิงก์ระบบ FIRE KEEPER PCA
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Open Graph & Social Share
                </span>
              </h2>
              <p className="text-xs text-slate-400">รูปภาพหน้าปกและพรีวิวลิงก์ระดับผู้บริหาร (Executive Cover Preview)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Social Share Preview Card (Book Cover Presentation) */}
          <div className="rounded-xl border border-amber-500/30 bg-gradient-to-b from-[#13100B] to-[#0A0C10] p-4 shadow-xl">
            <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400/90 font-bold mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Live Link Sharing Preview (Card Representation)
              </span>
              <span className="text-slate-400 font-normal">1200 x 630 / 16:9 HD</span>
            </div>

            {/* Visual Cover Display - Component Based */}
            <div className="relative rounded-xl overflow-hidden border border-slate-700/80 bg-black group aspect-[1.91/1] sm:aspect-[16/9] flex items-center justify-center">
              <div className="w-full h-full group-hover:scale-[1.02] transition-transform duration-500 origin-center">
                <ShareCoverGenerator />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 pointer-events-none" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs pointer-events-none">
                <div className="flex items-center space-x-1.5 text-amber-300 font-mono font-semibold drop-shadow-md">
                </div>
                <button
                  onClick={handleDownloadCover}
                  className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold font-mono text-[11px] flex items-center space-x-1.5 shadow-lg pointer-events-auto cursor-pointer transition-all"
                  title="ดาวน์โหลดภาพหน้าปก PNG สำหรับแชร์"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลดภาพหน้าปก PNG</span>
                </button>
              </div>
            </div>

            {/* Metadata Preview Snippet */}
            <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-1">
              <div className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <Globe className="w-3 h-3" /> firekeeper.site
              </div>
              <h3 className="text-sm font-bold text-slate-100">{shareTitle}</h3>
              <p className="text-xs text-slate-400 line-clamp-2">{shareDescription}</p>
            </div>
          </div>

          {/* Copy Link Input Bar */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>ลิงก์สำหรับแชร์ (Shareable URL):</span>
              {copied && <span className="text-emerald-400 text-xs font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> คัดลอกสำเร็จ!</span>}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 shadow-sm ${
                  copied 
                    ? 'bg-emerald-500 text-slate-950 font-bold' 
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'คัดลอกลิงก์'}</span>
              </button>
            </div>
          </div>

          {/* Quick Share Buttons */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-slate-300">แชร์ไปยังโซเชียลมีเดีย:</div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {shareOptions.map((opt) => (
                <a
                  key={opt.name}
                  href={opt.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#0F1420] border border-slate-800 transition-all ${opt.color} text-center group`}
                >
                  <span className="text-lg mb-1 group-hover:scale-110 transition-transform">{opt.icon}</span>
                  <span className="text-[11px] font-semibold">{opt.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Native Web Share API trigger */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-amber-400" />
              <span>แชร์ผ่านหน้าต่างแชร์ของอุปกรณ์ (Native Device Share)</span>
            </button>
          )}

          {/* Governance & Open Graph Compliance Badge */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start space-x-2.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300">SEO & Social Meta Tag Verified:</span>{' '}
              ระบบติดตั้ง Open Graph (`og:image`, `og:title`, `og:description`), Twitter Large Image Card, และ Schema.org Structured Data เรียบร้อยแล้ว เมื่อนำลิงก์ไปวางบนแพลตฟอร์มใดๆ ภาพหน้าปกสมุดหนังสีดำทอง Firekeeper PCA จะแสดงผลอัตโนมัติ
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
