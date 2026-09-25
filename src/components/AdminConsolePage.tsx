import React from 'react';
import { BusinessAdminPanel } from './BusinessAdminPanel';
import { TeamWorkspacePanel } from './TeamWorkspacePanel';
import { AdminUsageDashboard } from './AdminUsageDashboard';
import { useTheme } from '../context/ThemeContext';
import { AdminArticleStudio } from './AdminArticleStudio';

export const AdminConsolePage: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <main className={`min-h-screen px-3 py-6 sm:px-8 sm:py-8 ${isLight ? 'bg-slate-50 text-slate-950' : 'bg-[#07090D] text-white'}`}>
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-mono uppercase tracking-widest text-amber-400">FIREKEEPER ADMIN CONSOLE</p>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">ศูนย์ควบคุมสิทธิ์และ Governance</h1>
        <p className={`mt-2 text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>สำหรับผู้ดูแลระบบและการทดสอบสิทธิ์ Enterprise โดยไม่ต้องชำระเงิน</p>
        <div className="mt-8"><AdminUsageDashboard isAdmin={true} onNavigateToChat={() => { window.location.href = '/chat'; }} /></div>
        <div className="mt-8"><TeamWorkspacePanel isAdmin /></div>
        <div className="mt-6"><BusinessAdminPanel isAdmin /></div>
        <AdminArticleStudio />
      </div>
    </main>
  );
};