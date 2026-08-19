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

export const ConversationDrawer: React.FC = () => {
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
          <h2 className="text-sm font-bold">ประวัติการสนทนา</h2>
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
