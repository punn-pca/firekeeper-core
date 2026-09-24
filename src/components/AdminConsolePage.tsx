import React from 'react';
import { BusinessAdminPanel } from './BusinessAdminPanel';
import { TeamWorkspacePanel } from './TeamWorkspacePanel';

export const AdminConsolePage: React.FC = () => (
  <main className="min-h-screen bg-[#07090D] px-4 py-8 text-white sm:px-8">
    <div className="mx-auto max-w-6xl">
      <p className="text-xs font-mono uppercase tracking-widest text-amber-400">FIREKEEPER ADMIN CONSOLE</p>
      <h1 className="mt-2 text-3xl font-black">ศูนย์ควบคุมสิทธิ์และ Governance</h1>
      <p className="mt-2 text-sm text-slate-400">สำหรับผู้ดูแลระบบและการทดสอบสิทธิ์ Enterprise โดยไม่ต้องชำระเงิน</p>
      <div className="mt-8"><TeamWorkspacePanel /></div>
      <div className="mt-6"><BusinessAdminPanel /></div>
    </div>
  </main>
);
