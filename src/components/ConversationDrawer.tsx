import React from 'react';
import { MessageSquare, Plus, Trash2, X, Clock, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useConversation } from '../context/ConversationContext';
import { useAuth } from '../context/AuthContext';

export const ConversationDrawer: React.FC = () => {
  const {
    conversations,
    currentConversationId,
    selectConversation,
    deleteConversation,
    createNewConversation,
    isDrawerOpen,
    closeDrawer,
  } = useConversation();
  const { user, openAuthModal, logout } = useAuth();

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={closeDrawer}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fadeIn"
      />

      {/* Drawer Panel */}
      <div className="relative w-80 max-w-[85vw] bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col h-full z-10 shadow-2xl animate-slideRight">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm text-white">ประวัติการสนทนา</span>
          </div>
          <button
            onClick={closeDrawer}
            className="px-2.5 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 flex items-center gap-1 text-xs font-semibold cursor-pointer transition-all"
            title="ปิดแถบประวัติการสนทนา"
          >
            <X className="w-4 h-4 text-rose-400" />
            <span>ปิด [X]</span>
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              createNewConversation();
              closeDrawer();
            }}
            className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl p-3 font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow-md"
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

        {/* Footer User Info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0 font-bold">
              {user?.isGuest ? 'G' : user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-white truncate block">
                {user?.name || 'Guest User'}
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {user?.isGuest ? 'Guest Mode (ไม่ได้ล็อกอิน)' : user?.email}
              </span>
            </div>
          </div>

          {user?.isGuest ? (
            <button
              onClick={openAuthModal}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] hover:bg-amber-400 transition-all"
            >
              Login
            </button>
          ) : (
            <button
              onClick={logout}
              className="text-slate-400 hover:text-rose-300 text-[11px]"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
