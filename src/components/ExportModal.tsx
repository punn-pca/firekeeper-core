import React, { useState } from 'react';
import {
  Download,
  FileText,
  FileSpreadsheet,
  Printer,
  X,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Globe,
  SlidersHorizontal,
  ShieldCheck,
} from 'lucide-react';
import { ConversationTurn, MemoryItem, PCAState } from '../types';
import {
  downloadTextFile,
  exportToHtmlReport,
  generateHtmlChatReport,
  generateTextReport,
  ExportOptions,
  ReportCategory,
} from '../utils/exportUtils';
import { generateCryptographicAuditPackage } from '../utils/auditExport';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationHistory: ConversationTurn[];
  pcaState: PCAState | null;
  memories: MemoryItem[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  conversationHistory,
  pcaState,
  memories,
}) => {
  const [format, setFormat] = useState<'html' | 'json' | 'audit_zip'>('html');
  const [reportType, setReportType] = useState<'executive_summary' | 'full_combined'>('executive_summary');
  const [selectedDomain, setSelectedDomain] = useState<ReportCategory>('full_combined');
  const [customPrefix, setCustomPrefix] = useState<string>('FIRE-KEEPER-PCA');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  
  const [options, setOptions] = useState<ExportOptions>({
    includeConversation: false,
    includePcaState: true,
    includeMemories: true,
    includeTrace: true,
    reportCategory: 'executive_summary',
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  const getComputedFilename = (ext: string): string => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const hh = pad(now.getHours());
    const min = pad(now.getMinutes());
    const ss = pad(now.getSeconds());

    const cleanPrefix = (customPrefix.trim() || 'FIRE-KEEPER-PCA').replace(/[/\\?%*:|"<>]/g, '-');
    const typeTag = reportType === 'executive_summary' ? '_EXECUTIVE' : '_FULL';
    return `${cleanPrefix}${typeTag}_${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}.${ext}`;
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const ext = format;
      const fullFilename = getComputedFilename(ext);
      const activeReportCategory: ReportCategory = reportType === 'executive_summary' ? 'executive_summary' : selectedDomain;
      const activeOptions = { ...options, reportCategory: activeReportCategory };

      if (format === 'html') {
        const htmlReport = await generateHtmlChatReport(
          conversationHistory,
          pcaState,
          memories,
          activeOptions,
          fullFilename
        );
        downloadTextFile(fullFilename, htmlReport, 'text/html;charset=utf-8');
      } else if (format === 'json') {
        const jsonData = {
          system: 'FIRE KEEPER PUNN Cognitive Architecture v2.0',
          reportType,
          domain: selectedDomain,
          exported_at: new Date().toISOString(),
          conversationHistory: options.includeConversation ? conversationHistory : [],
          latestPcaState: options.includePcaState ? pcaState : null,
          memoryBank: options.includeMemories ? memories : [],
        };
        downloadTextFile(
          fullFilename,
          JSON.stringify(jsonData, null, 2),
          'application/json;charset=utf-8'
        );
      } else if (format === 'audit_zip') {
        const prefix = (customPrefix.trim() || 'FIRE-KEEPER-PCA').replace(/[/\\?%*:|"<>]/g, '-');
        await generateCryptographicAuditPackage(
          conversationHistory,
          pcaState,
          memories,
          activeOptions,
          prefix
        );
      }

      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        setIsExporting(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Export failed:', err);
      setIsExporting(false);
    }
  };

  const handleOpenPrintView = async () => {
    const activeReportCategory: ReportCategory = reportType === 'executive_summary' ? 'executive_summary' : selectedDomain;
    const activeOptions = { ...options, reportCategory: activeReportCategory };
    const fullFilename = getComputedFilename('html');
    await exportToHtmlReport(conversationHistory, pcaState, memories, activeOptions, fullFilename);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-3.5 sm:space-y-4 text-slate-100 relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 sm:top-4 right-3 sm:right-4 px-2 sm:px-2.5 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 flex items-center gap-1 text-xs font-semibold cursor-pointer transition-all shadow-sm"
          title="ปิดหน้าต่าง"
        >
          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
          <span>ปิด</span>
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 border-b border-slate-800/80 pb-2.5 sm:pb-3 pr-16 sm:pr-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm sm:text-base text-white truncate">ศูนย์ส่งออกรายงาน</h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
              Executive Export Center
            </p>
          </div>
        </div>

        {/* ① Report Type */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center justify-between">
            <span>① รูปแบบรายงาน (Report Type)</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold flex items-center gap-1">
              ⭐ Recommended
            </span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setReportType('executive_summary')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                reportType === 'executive_summary'
                  ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-xs font-bold text-white">Executive Brief</div>
              <p className="text-[10.5px] text-slate-400 mt-0.5">สรุปสาระสำคัญ อ่านกระชับ 2-3 นาที</p>
            </button>
            <button
              onClick={() => setReportType('full_combined')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                reportType === 'full_combined'
                  ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-xs font-bold text-white">Full Report</div>
              <p className="text-[10.5px] text-slate-400 mt-0.5">รายงานฉบับสมบูรณ์ ครบทุกมิติ</p>
            </button>
          </div>
        </div>

        {/* ② Domain Template Selector */}
        {reportType === 'full_combined' && (
          <div className="space-y-1.5 animate-fadeIn">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
              ② หมวดหมู่สายงานธุรกิจ (Domain Category)
            </label>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value as ReportCategory)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-medium focus:outline-none cursor-pointer"
            >
              <option value="full_combined">📚 Full Combined Report (รายงานฉบับสมบูรณ์รวมทุกมิติ)</option>
              <option value="strategic_decision">🎯 General Strategy & Decision Analysis</option>
              <option value="legal_compliance">⚖️ กฎหมาย & ข้อบังคับ (Legal & Compliance)</option>
              <option value="financial_investment">💼 การเงิน & การลงทุน (Financial & Investment)</option>
              <option value="medical_healthcare">🏥 การแพทย์ & สาธารณสุข (Medical & Healthcare)</option>
              <option value="tech_cybersecurity">🛡️ ไอที & ไซเบอร์ซีเคียวริตี้ (IT & Cybersecurity)</option>
              <option value="commercial_marketing">🚀 การตลาด & การค้า (Commercial & Marketing)</option>
              <option value="public_policy">🏛️ นโยบายภาครัฐ & ยุทธศาสตร์ (Public Policy)</option>
            </select>
          </div>
        )}

        {/* ③ Export Format */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
            ③ รูปแบบไฟล์ส่งออก (Export Format)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => setFormat('html')}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                format === 'html'
                  ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-4 h-4 mx-auto mb-1 text-amber-400" />
              <div className="text-xs font-bold text-white">HTML Report</div>
              <div className="text-[9.5px] text-slate-400">Interactive A4</div>
            </button>

            <button
              onClick={() => setFormat('json')}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                format === 'json'
                  ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 mx-auto mb-1 text-purple-400" />
              <div className="text-xs font-bold text-white">JSON Archive</div>
              <div className="text-[9.5px] text-slate-400">Data Payload</div>
            </button>

            <button
              onClick={() => setFormat('audit_zip')}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                format === 'audit_zip'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
              <div className="text-xs font-bold text-white">Audit Zip (.zip)</div>
              <div className="text-[9.5px] text-slate-400">SHA-256 / Sig Bundle</div>
            </button>
          </div>

          {format === 'audit_zip' && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-[11px] text-emerald-300/90 leading-relaxed font-mono">
              <span className="font-bold text-emerald-400">ℹ️ Enterprise Notice:</span> This audit package provides a tamper-evident execution record intended for traceability and audit support. It is not intended to replace legally recognized digital notarization or certified timestamping services.
            </div>
          )}
        </div>

        {/* ④ Advanced Options (Collapsible) */}
        <div className="border border-slate-800 rounded-xl bg-slate-950/40 overflow-hidden">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-mono text-slate-300 hover:bg-slate-800/50 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-1.5 font-bold">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>④ Advanced Options (ตั้งค่าขั้นสูง)</span>
            </span>
            {showAdvanced ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showAdvanced && (
            <div className="p-3.5 border-t border-slate-800 space-y-3 bg-slate-950/80 text-xs animate-fadeIn">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-mono">ชื่อไฟล์ (Filename Prefix):</label>
                <input
                  type="text"
                  value={customPrefix}
                  onChange={(e) => setCustomPrefix(e.target.value)}
                  placeholder="FIRE-KEEPER-PCA"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-1.5 text-slate-100 font-mono text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-slate-400 font-mono block">เนื้อหาเพิ่มเติมในรายงาน (Report Inclusions):</span>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.includeConversation}
                      onChange={(e) => setOptions({ ...options, includeConversation: e.target.checked })}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500/30"
                    />
                    <span>แนบประวัติแชทดิบ ({conversationHistory.length})</span>
                  </label>

                  <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.includePcaState}
                      onChange={(e) => setOptions({ ...options, includePcaState: e.target.checked })}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500/30"
                    />
                    <span>PCA State</span>
                  </label>

                  <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.includeMemories}
                      onChange={(e) => setOptions({ ...options, includeMemories: e.target.checked })}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500/30"
                    />
                    <span>Long-Term Memories</span>
                  </label>

                  <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.includeTrace}
                      onChange={(e) => setOptions({ ...options, includeTrace: e.target.checked })}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500/30"
                    />
                    <span>Execution Trace</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Print A4 & Full View Links */}
        <div className="flex items-center justify-between text-xs pt-1 px-1">
          <button
            onClick={() => {
              onClose();
              setTimeout(() => window.print(), 100);
            }}
            className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์ A4 หน้านี้ทันที</span>
          </button>
          <button
            onClick={handleOpenPrintView}
            className="text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>เปิดดูรายงาน A4 ฉบับเต็ม</span>
          </button>
        </div>

        {/* Prominent EXPORT Action Button */}
        <div className="pt-2">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-sm flex items-center justify-center space-x-2 shadow-xl shadow-orange-950/50 transition-all cursor-pointer disabled:opacity-50"
          >
            {exportSuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-slate-950" />
                <span>ส่งออกรายงานสำเร็จแล้ว!</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5 text-slate-950" />
                <span>EXPORT REPORT ({format.toUpperCase()})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
