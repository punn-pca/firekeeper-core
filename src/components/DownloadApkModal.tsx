import React, { useState } from 'react';
import { Smartphone, Download, QrCode, ExternalLink, X, ShieldCheck, CheckCircle2, AlertTriangle, Copy, Check, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface DownloadApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const APK_DOWNLOAD_URL = 'https://github.com/punn-pca/firekeeper-core/releases/download/v1.0.0-mobile/firekeeper-standalone.apk';

export const DownloadApkModal: React.FC<DownloadApkModalProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(true);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(APK_DOWNLOAD_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(APK_DOWNLOAD_URL)}&bgcolor=${isLight ? 'ffffff' : '0d1117'}&color=${isLight ? '000000' : 'f59e0b'}&margin=10`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-fadeIn" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity" 
      />

      {/* Modal Container */}
      <div className={`relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden z-10 my-auto ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#09090b] border-white/10 text-white'
      }`}>
        {/* Header */}
        <div className={`p-4 sm:p-6 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'border-slate-200 bg-slate-50/70' : 'border-white/[0.08] bg-white/[0.02]'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl border border-amber-500/40 bg-amber-500/10 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Smartphone className="w-5 h-5 text-amber-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-mono tracking-tight truncate">
                  FIRE KEEPER Android
                </h3>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 font-bold shrink-0">
                  v1.0.0
                </span>
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                แอพพลิเคชันมือถือ Android พร้อมใช้งาน
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-white/10 text-slate-400'
            }`}
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Main Action Banner */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isLight ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-500/[0.04] border-amber-500/20'
          }`}>
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-mono text-amber-500 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>OFFICIAL STANDALONE APK</span>
              </div>
              <div className="text-sm font-semibold">
                ดาวน์โหลดไฟล์ติดตั้งสำหรับ Android
              </div>
              <div className="text-xs text-slate-500 font-mono">
                ขนาดไฟล์ ~179 MB · รองรับ Android 8.0 ขึ้นไป
              </div>
            </div>

            <a
              href={APK_DOWNLOAD_URL}
              download="firekeeper-standalone.apk"
              className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-sm shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลด APK ทันที</span>
            </a>
          </div>

          {/* QR Code Scan section (Great for desktop users) */}
          <div className={`p-4 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/[0.08]'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider font-mono">
                  สแกนเพื่อดาวน์โหลดลงมือถือ
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowQr(!showQr)}
                className="text-[11px] text-amber-500 hover:underline font-mono cursor-pointer"
              >
                {showQr ? 'ซ่อน QR' : 'แสดง QR'}
              </button>
            </div>

            {showQr && (
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                <div className={`p-2 rounded-xl border shadow-inner shrink-0 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#0d1117] border-amber-500/20'
                }`}>
                  <img
                    src={qrImageUrl}
                    alt="QR Code สำหรับดาวน์โหลด Firekeeper APK"
                    className="w-36 h-36 rounded-lg object-contain"
                  />
                </div>
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    เปิดกล้องมือถือ Android สแกน QR Code นี้ เพื่อเริ่มดาวน์โหลดไฟล์ติดตั้งลงในสมาร์ทโฟนได้ทันที
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                        copied
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                          : isLight
                            ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                            : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300'
                      }`}
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'คัดลอกลิงก์แล้ว' : 'คัดลอกลิงก์ดาวน์โหลด'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Features Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/[0.06]'
            }`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">In-App Google Sign-In</span>
                <span className="text-slate-400 text-[11px]">ล็อกอินบัญชี Google ภายในแอพได้ทันที</span>
              </div>
            </div>
            <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/[0.06]'
            }`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">แสดงผลเหมือนหน้าเว็บ 100%</span>
                <span className="text-slate-400 text-[11px]">พร้อมตรึง Header แถบเมนู และแถมสถานะชัดเจน</span>
              </div>
            </div>
            <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/[0.06]'
            }`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">PCA Decision Intelligence</span>
                <span className="text-slate-400 text-[11px]">ระบบวิเคราะห์เจตนาและหลักฐานระดับองค์กร</span>
              </div>
            </div>
            <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/[0.06]'
            }`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Open Source & Verified</span>
                <span className="text-slate-400 text-[11px]">โค้ดเนทีฟอยู่ในโฟลเดอร์ mobile/ ตรวจสอบได้</span>
              </div>
            </div>
          </div>

          {/* Installation Guide */}
          <div className={`p-4 rounded-xl border text-xs space-y-2.5 ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/[0.02] border-white/[0.08] text-slate-300'
          }`}>
            <div className="flex items-center gap-1.5 font-bold font-mono text-amber-500 uppercase tracking-wider text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>คำแนะนำการติดตั้งบนมือถือ Android</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed text-slate-400 pl-1">
              <li>เมื่อกดดาวน์โหลด หากเบราว์เซอร์แจ้งเตือน <strong className={isLight ? 'text-slate-900' : 'text-white'}>"File might be harmful"</strong> ให้แตะ <strong className="text-amber-500">Download anyway</strong> (ดาวน์โหลดต่อไป)</li>
              <li>เมื่อดาวน์โหลดเสร็จ กดแตะเปิดไฟล์ <code className="text-amber-500">firekeeper-standalone.apk</code></li>
              <li>หากระบบขึ้นแจ้งเตือนความปลอดภัย ให้เลือก <strong className={isLight ? 'text-slate-900' : 'text-white'}>การตั้งค่า (Settings)</strong> แล้วเปิดสิทธิ์ <strong className="text-amber-500">"อนุญาตจากแหล่งที่มานี้ (Allow from this source)"</strong></li>
              <li>กด <strong className="text-emerald-500">"ติดตั้ง (Install)"</strong> และเริ่มใช้งานได้ทันที</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0 ${
          isLight ? 'border-slate-200 bg-slate-50/70' : 'border-white/[0.08] bg-white/[0.02]'
        }`}>
          <a
            href="https://github.com/punn-pca/firekeeper-core/tree/main/mobile"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-amber-500 transition-colors font-mono"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ดูซอร์สโค้ด Mobile บน GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className={`w-full sm:w-auto px-4 py-1.5 rounded-lg border text-xs font-mono font-medium transition-colors cursor-pointer ${
              isLight
                ? 'border-slate-300 hover:bg-slate-200 text-slate-700'
                : 'border-white/10 hover:bg-white/10 text-slate-300'
            }`}
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
