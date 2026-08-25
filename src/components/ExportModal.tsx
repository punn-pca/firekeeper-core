import React, { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  Archive,
  ShieldCheck,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  AlertTriangle,
  Clock,
  Activity,
  Settings,
  Database,
  FlaskConical,
  Check
} from 'lucide-react';
import { ConversationTurn, MemoryItem, PCAState } from '../types';
import { executeExport } from '../export/exportEngine';
import { runExportTestSuite, TestResult } from '../export/testSuite';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationHistory: ConversationTurn[];
  pcaState: PCAState | null;
  memories: MemoryItem[];
  isLight?: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  conversationHistory,
  pcaState,
  memories,
  isLight = false,
}) => {
  // Profiles: 'decision_brief' (executive), 'full_intelligence' (full analytics), 'audit_package' (ZIP structure)
  const [activeProfile, setActiveProfile] = useState<'decision_brief' | 'full_intelligence' | 'audit_package'>('decision_brief');
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'html' | 'json' | 'zip'>('csv');
  const [pdfTheme, setPdfTheme] = useState<'light' | 'dark'>('light');
  const [customTitle, setCustomTitle] = useState<string>('');
  
  const [showCustomize, setShowCustomize] = useState<boolean>(false);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [diagnosticsResults, setDiagnosticsResults] = useState<TestResult[]>([]);
  const [isRunningDiag, setIsRunningDiag] = useState<boolean>(false);
  
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [exportHistory, setExportHistory] = useState<any[]>([]);

  // Load history from localStorage on mount/open
  useEffect(() => {
    if (isOpen) {
      const history = JSON.parse(localStorage.getItem('fk_export_history') || '[]');
      setExportHistory(history);
    }
  }, [isOpen]);

  // Dynamically restrict and adapt formats when activeProfile changes
  useEffect(() => {
    if (activeProfile === 'audit_package') {
      setSelectedFormat('zip');
    } else {
      if (selectedFormat === 'zip') {
        setSelectedFormat('csv');
      }
    }
  }, [activeProfile]);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    setErrorMessage(null);

    try {
      const profile = activeProfile === 'audit_package' ? 'full_intelligence' : activeProfile;
      const format = activeProfile === 'audit_package' ? 'zip' : selectedFormat;

      const result = await executeExport(
        conversationHistory,
        pcaState,
        memories,
        profile as any,
        format,
        {
          pdfTheme,
          title: customTitle.trim() || undefined
        }
      );

      // Save success entry in local history database
      const historyEntry = {
        timestamp: new Date().toISOString(),
        profile: activeProfile,
        format,
        filename: result.filename,
        integrityHash: result.manifest.contentHash,
        exportId: result.manifest.exportId,
        valid: result.manifest.validation.valid
      };
      
      const currentHistory = JSON.parse(localStorage.getItem('fk_export_history') || '[]');
      const updatedHistory = [historyEntry, ...currentHistory].slice(0, 5);
      localStorage.setItem('fk_export_history', JSON.stringify(updatedHistory));
      setExportHistory(updatedHistory);

      // Trigger standard client-side download
      const isBlob = result.fileContent instanceof Blob;
      const downloadBlob = isBlob ? result.fileContent : new Blob([result.fileContent], {
        type: format === 'json' ? 'application/json' : format === 'csv' ? 'text/csv;charset=utf-8;' : 'text/html'
      });

      const url = URL.createObjectURL(downloadBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Export center execution failed:', err);
      setErrorMessage(err.message || 'พบข้อผิดพลาดที่ไม่ทราบสาเหตุระหว่างการรัน Export Engine');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRunDiagnostics = async () => {
    setIsRunningDiag(true);
    try {
      const tests = await runExportTestSuite();
      setDiagnosticsResults(tests);
    } catch (err: any) {
      console.error('Diagnostics execution failure:', err);
    } finally {
      setIsRunningDiag(false);
    }
  };

  const clearHistory = () => {
    localStorage.removeItem('fk_export_history');
    setExportHistory([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-[calc(100vw-24px)] md:w-[calc(100vw-48px)] lg:w-[900px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-slate-950/80 flex flex-col overflow-hidden"
        style={{ maxHeight: '90vh', height: 'auto' }}
      >
        
        {/* Header Block */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/60 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center space-x-3 min-w-0 flex-1 mr-4">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-slate-100 tracking-tight truncate">EXPORT SECURITY CENTER</h2>
              <p className="text-xs text-slate-400 truncate">ระบบปรุงและแปลงเอกสารความมั่นคงทางสติปัญญาเชิงคริปโตกราฟี</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer flex items-center justify-center min-w-[36px] min-h-[36px] flex-shrink-0"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Center Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Step 1: Profile Selection Cards */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 tracking-wider uppercase block">1. เลือกข้อมูลรายงาน (Report Profile)</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              {/* Decision Brief */}
              <button
                onClick={() => setActiveProfile('decision_brief')}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer relative ${
                  activeProfile === 'decision_brief'
                    ? 'bg-amber-500/5 border-amber-500/50 shadow-lg shadow-amber-500/5'
                    : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  {activeProfile === 'decision_brief' && (
                    <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
                    </div>
                  )}
                </div>
                <h4 className="mt-3 text-xs font-bold text-slate-200">Decision Brief</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">สำหรับผู้บริหาร / สรุปสาระสำคัญ การเยียวยาความเสี่ยง และ Human Agency</p>
              </button>

              {/* Full Intelligence */}
              <button
                onClick={() => setActiveProfile('full_intelligence')}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer relative ${
                  activeProfile === 'full_intelligence'
                    ? 'bg-amber-500/5 border-amber-500/50 shadow-lg shadow-amber-500/5'
                    : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="p-1.5 bg-sky-500/10 rounded-lg text-sky-400">
                    <Database className="w-4 h-4" />
                  </div>
                  {activeProfile === 'full_intelligence' && (
                    <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
                    </div>
                  )}
                </div>
                <h4 className="mt-3 text-xs font-bold text-slate-200">Full Intelligence</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">วิเคราะห์ครอบคลุมเต็มระบบ แสดงตารางพยานหลักฐาน ข้อขัดแย้ง และ Trace การคิด 12 ขั้น</p>
              </button>

              {/* Evidence & Audit Package */}
              <button
                onClick={() => setActiveProfile('audit_package')}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer relative ${
                  activeProfile === 'audit_package'
                    ? 'bg-amber-500/5 border-amber-500/50 shadow-lg shadow-amber-500/5'
                    : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="p-1.5 bg-purple-500/10 rounded-lg text-purple-400">
                    <Archive className="w-4 h-4" />
                  </div>
                  {activeProfile === 'audit_package' && (
                    <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
                    </div>
                  )}
                </div>
                <h4 className="mt-3 text-xs font-bold text-slate-200">Audit & Evidence</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">ชุดตรวจสอบย้อนหลังแบบ ZIP บรรจุข้อมูลแยกเป็นสัดส่วน (JSON) พร้อมลายเซ็น SHA-256</p>
              </button>

            </div>
          </div>

          {/* Step 2: Format Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 tracking-wider uppercase block">2. เลือกรูปแบบไฟล์ (Output Format)</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              
              <button
                type="button"
                disabled={activeProfile === 'audit_package'}
                onClick={() => setSelectedFormat('csv')}
                className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  selectedFormat === 'csv'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950/30 border-slate-800 text-slate-300 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed'
                }`}
              >
                <span>📊 CSV Worksheet</span>
              </button>

              <button
                type="button"
                disabled={activeProfile === 'audit_package'}
                onClick={() => setSelectedFormat('html')}
                className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  selectedFormat === 'html'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950/30 border-slate-800 text-slate-300 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed'
                }`}
              >
                <span>🌐 HTML Standalone</span>
              </button>

              <button
                type="button"
                disabled={activeProfile === 'audit_package'}
                onClick={() => setSelectedFormat('json')}
                className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  selectedFormat === 'json'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950/30 border-slate-800 text-slate-300 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed'
                }`}
              >
                <span>📦 Schema JSON</span>
              </button>

              <button
                type="button"
                disabled={activeProfile !== 'audit_package'}
                onClick={() => setSelectedFormat('zip')}
                className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  selectedFormat === 'zip'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950/30 border-slate-800 text-slate-300 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed'
                }`}
              >
                <span>🤐 Cryptographic ZIP</span>
              </button>

            </div>
          </div>

          {/* Customize Section Toggle */}
          <div className="border-t border-slate-800/80 pt-4">
            <button
              onClick={() => setShowCustomize(!showCustomize)}
              className="flex items-center justify-between w-full text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <span className="flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                <span>ปรับแต่งการแสดงผลขั้นสูง (Customize Report)</span>
              </span>
              {showCustomize ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showCustomize && (
              <div className="mt-4 p-4 bg-slate-950/50 border border-slate-800/60 rounded-xl space-y-4 animate-slideDown">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 block">กำหนดชื่อหัวข้อรายงานเอง (Custom Report Title)</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder={pcaState?.purpose || 'FIRE KEEPER Decision & Intelligence Report'}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Engine Diagnostics (Testing Suite) Toggle */}
          <div className="border-t border-slate-800/80 pt-4">
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="flex items-center justify-between w-full text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <span className="flex items-center space-x-2">
                <FlaskConical className="w-4 h-4 text-slate-400" />
                <span>รันชุดตรวจสอบสถาปัตยกรรม (Engine Diagnostics - 15 Unit Tests)</span>
              </span>
              {showDiagnostics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showDiagnostics && (
              <div className="mt-4 p-4 bg-slate-950/50 border border-slate-800/60 rounded-xl space-y-4 animate-slideDown">
                <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
                  <div 
                    className="text-[11px] text-slate-400 leading-relaxed flex-1"
                    style={{ overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: 0 }}
                  >
                    ตรวจวัดคุณภาพการทำงานของ Export Engine ปัจจุบัน ผ่านกล่องทดสอบคณิตศาสตร์ 15 สคริปต์
                  </div>
                  <button
                    onClick={handleRunDiagnostics}
                    disabled={isRunningDiag}
                    className="w-full lg:w-auto flex-shrink-0 text-center py-2 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isRunningDiag ? 'กำลังทดสอบ...' : 'รันการทดสอบทันที'}
                  </button>
                </div>

                {diagnosticsResults.length > 0 && (
                  <div className="max-h-[280px] overflow-y-auto space-y-2 border border-slate-800/80 rounded-lg p-3 bg-slate-950">
                    {diagnosticsResults.map(test => (
                      <div 
                        key={test.id} 
                        className="p-3 border-b border-slate-900 last:border-b-0 flex flex-col sm:flex-row justify-between items-start gap-3 bg-slate-900/20 hover:bg-slate-900/40 rounded-lg transition-all"
                      >
                        <div className="space-y-1 min-w-0 flex-1 w-full">
                          <div 
                            className="font-bold text-slate-200 text-xs sm:text-sm"
                            style={{ overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: 0 }}
                          >
                            {test.name}
                          </div>
                          <div 
                            className="text-[11px] text-slate-400 leading-relaxed"
                            style={{ overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: 0 }}
                          >
                            {test.details}
                          </div>
                        </div>
                        <div className="self-end sm:self-center flex-shrink-0 mt-1 sm:mt-0">
                          <span className={`text-[10px] sm:text-xs font-mono font-bold px-2.5 py-1 rounded border ${
                            test.passed 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                          }`}>
                            {test.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Export History (Recent Exports) */}
          {exportHistory.length > 0 && (
            <div className="border-t border-slate-800/80 pt-4 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="flex items-center space-x-2 text-xs font-bold text-slate-400">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>บันทึกประวัติความเที่ยงตรงล่าสุด (Integrity Log - Local Cache)</span>
                </span>
                <button 
                  onClick={clearHistory}
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                >
                  ล้างประวัติ
                </button>
              </div>
              <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1 border border-slate-800/30 rounded-xl p-2 bg-slate-950/20">
                {exportHistory.map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-950/40 border border-slate-800/50 rounded-xl flex justify-between items-center text-[11px] leading-relaxed">
                    <div className="space-y-1 min-w-0 flex-1 mr-4">
                      <div 
                        className="font-semibold text-slate-300"
                        style={{ overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: 0 }}
                      >
                        {item.filename}
                      </div>
                      <div className="text-slate-500 text-[10px] flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                        <span className="text-slate-700">•</span>
                        <span style={{ overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: 0 }}>
                          SHA-256: <code className="text-emerald-500/80">{item.integrityHash.substring(0, 12)}...</code>
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-amber-400 bg-amber-400/5 border border-amber-400/10 px-2 py-0.5 rounded-md uppercase flex-shrink-0">
                      {item.profile.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Trigger Block */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium leading-relaxed animate-fadeIn space-y-1.5">
              <div className="flex items-center space-x-2 font-bold text-rose-200">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>เกิดอุปสรรคระหว่างปรุงรูปเล่ม (Export Error)</span>
              </div>
              <div style={{ overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: 0 }}><strong>รายละเอียด:</strong> {errorMessage}</div>
              <div className="text-[10.5px] text-slate-400 pt-1 border-t border-rose-500/10">
                💡 คำแนะนำ: สำหรับข้อมูลที่ซับซ้อนอย่างยิ่ง แนะนำให้เปลี่ยนรูปแบบการดาวน์โหลดเป็น <strong>HTML Standalone</strong> ซึ่งใช้หน่วยความจำเบราว์เซอร์ต่ำกว่ามาก จากนั้นเปิดไฟล์แล้วใช้คำสั่งพิมพ์ (Print to PDF) ของเบราว์เซอร์เพื่อคุณภาพคมชัดสูงสุด
              </div>
            </div>
          )}

          {/* Clear prominent download action */}
          <div className="pt-2">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-sm flex items-center justify-center space-x-2.5 shadow-xl shadow-orange-950/40 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  <span>กำลังรวบรวมพยานหลักฐานและจัดรูปเล่มยุทธศาสตร์...</span>
                </>
              ) : exportSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-slate-950 stroke-[3]" />
                  <span>ผลิตรายงานและดาวน์โหลดเรียบร้อยแล้ว!</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 text-slate-950 stroke-[2.5]" />
                  <span>
                    ดาวน์โหลดรายงาน (Download {
                      activeProfile === 'audit_package' ? 'ZIP' : selectedFormat.toUpperCase()
                    })
                  </span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Footer specifications */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 text-center text-[10px] text-slate-500 leading-relaxed flex-shrink-0">
          * ระบบรับประกันความเที่ยงตรงด้วยกระบวนการตรวจวิเคราะห์ Bayesian & Heuristic Reranker (WORM Ledger compliant)<br/>
          ออกแบบเพื่อรักษาอำนาจการกำกับดูแลสูงสุดของมนุษย์ (Level 1-3 Human-in-the-loop Governance)
        </div>

      </div>
    </div>
  );
};
