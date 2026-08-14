import React from 'react';
import { MessageSquare, Plus, Trash2, X, Clock, Sliders, Brain, Compass, Sparkles, DollarSign, Award, Zap, CheckCircle2 } from 'lucide-react';
import { useConversation } from '../context/ConversationContext';
import { ToneMode, ReasoningProfile } from '../types';
import { ReasoningProfileSelector } from './ReasoningProfileSelector';
import { useTheme } from '../context/ThemeContext';

interface ConversationDrawerProps {
  reasoningProfile: ReasoningProfile;
  setReasoningProfile: (profile: ReasoningProfile) => void;
  tone: ToneMode;
  setTone: (tone: ToneMode) => void;
  deepReasoning: boolean;
  setDeepReasoning: (enabled: boolean) => void;
}

export const ConversationDrawer: React.FC<ConversationDrawerProps> = ({
  reasoningProfile,
  setReasoningProfile,
  tone,
  setTone,
  deepReasoning,
  setDeepReasoning,
}) => {
  const {
    conversations,
    currentConversationId,
    selectConversation,
    deleteConversation,
    createNewConversation,
    isDrawerOpen,
    closeDrawer,
    drawerTab,
    setDrawerTab,
  } = useConversation();

  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={closeDrawer}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fadeIn"
      />

      {/* Drawer Panel */}
      <div className={`relative w-96 max-w-[90vw] border-r flex flex-col h-full z-10 shadow-2xl animate-slideRight ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0E1525] border-slate-800 text-slate-100'
      }`}>
        {/* Header with Tabs */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center space-x-1.5 bg-slate-950/40 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setDrawerTab('history')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                drawerTab === 'history'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>ประวัติแชท</span>
            </button>
            <button
              type="button"
              onClick={() => setDrawerTab('strategy')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                drawerTab === 'strategy'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Strategy & ยุทธศาสตร์</span>
            </button>
          </div>
          <button
            onClick={closeDrawer}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isLight ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab 1: Chat History */}
        {drawerTab === 'history' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* New Chat Button */}
            <div className="p-3">
              <button
                onClick={() => {
                  createNewConversation();
                  closeDrawer();
                }}
                className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl p-3 font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เริ่มต้นการวิเคราะห์ใหม่</span>
              </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-slate-500">ยังไม่มีประวัติการสนทนา</div>
              ) : (
                conversations.map((session) => {
                  const isActive = session.id === currentConversationId;
                  const turnCount = session.turns.filter((t) => t.role === 'user').length;

                  return (
                    <div
                      key={session.id}
                      onClick={() => selectConversation(session.id)}
                      className={`group relative rounded-xl p-3 cursor-pointer border transition-all flex items-center justify-between gap-2 ${
                        isActive
                          ? 'bg-slate-800/90 border-amber-500/50 text-amber-200'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <span className="font-medium text-xs truncate block font-sans">
                          {session.title || 'เซสชันการวิเคราะห์'}
                        </span>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(session.created_at).toLocaleDateString('th-TH')}</span>
                          <span>• {turnCount} คำถาม</span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(session.id);
                        }}
                        title="ลบเซสชันการสนทนานี้"
                        className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-all shrink-0 cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-[10px] font-bold">ลบ</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Strategy & Reasoning Settings */}
        {drawerTab === 'strategy' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Section 1: Reasoning Profile */}
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className="flex items-center space-x-2 text-amber-500">
                <Brain className="w-4 h-4" />
                <h3 className="font-bold text-xs sm:text-sm tracking-wide">
                  Reasoning Profile <span className="text-[11px] font-normal text-slate-400">(โปรไฟล์ยุทธศาสตร์)</span>
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                เลือกกฎการสกัดพยานหลักฐานและกรอบความคิดเฉพาะสาขา (เช่น ป.อ. ภาค 1, การเงิน, การแพทย์, ไอที)
              </p>
              <div className="pt-1">
                <ReasoningProfileSelector
                  selectedProfile={reasoningProfile}
                  onChange={setReasoningProfile}
                />
              </div>
            </div>

            {/* Section 2: Response Tone */}
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className="flex items-center space-x-2 text-purple-400">
                <Compass className="w-4 h-4" />
                <h3 className="font-bold text-xs sm:text-sm tracking-wide">
                  Response Tone <span className="text-[11px] font-normal text-slate-400">(ระดับน้ำเสียง)</span>
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                เลือกลักษณะการนำเสนอและรูปแบบรายงานผลลัพธ์
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { id: 'Formal Architect', label: 'Formal', desc: 'เป็นทางการ' },
                  { id: 'Empathetic Guide', label: 'Empathetic', desc: 'เข้าใจ แนะนำ' },
                  { id: 'Direct Expert', label: 'Direct', desc: 'ตรงประเด็น' },
                ].map((item) => {
                  const isSelected = tone === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTone(item.id as ToneMode)}
                      className={`p-2.5 rounded-xl text-center border transition-all cursor-pointer ${
                        isSelected
                          ? isLight
                            ? 'bg-purple-50 border-purple-500 text-purple-900 font-bold shadow-2xs'
                            : 'bg-purple-500/20 border-purple-500 text-white shadow-md'
                          : isLight
                            ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <div className="font-bold text-xs">{item.label}</div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Deep Reasoning Engine */}
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  <h3 className="font-bold text-xs sm:text-sm tracking-wide">
                    Deep Reasoning <span className="text-[11px] font-normal text-slate-400">(12-Stage FIRE)</span>
                  </h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={deepReasoning}
                    onChange={(e) => setDeepReasoning(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-emerald-600" />
                </label>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                ประมวลผลผ่าน 12-Stage Cognitive Matrix Engine พร้อมตรวจสอบความเสี่ยงระดับสูง
              </p>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] block text-slate-400 font-mono">Est. Cost</span>
                  <span className="font-black text-xs font-mono text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                    <DollarSign className="w-3 h-3" /> {deepReasoning ? '$0.0012' : '$0.0004'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] block text-slate-400 font-mono">Token Opt.</span>
                  <span className="font-black text-xs font-mono text-sky-400 flex items-center justify-center gap-0.5 mt-0.5">
                    <Zap className="w-3 h-3" /> -45%
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] block text-slate-400 font-mono">Rigor Score</span>
                  <span className="font-black text-xs font-mono text-amber-400 flex items-center justify-center gap-0.5 mt-0.5">
                    <Award className="w-3 h-3" /> {deepReasoning ? '99.4%' : '92.0%'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`p-3 border-t flex items-center justify-between text-xs ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-900 border-slate-800 text-slate-400'
        }`}>
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> บันทึกอัตโนมัติ
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow transition-all cursor-pointer"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
};
