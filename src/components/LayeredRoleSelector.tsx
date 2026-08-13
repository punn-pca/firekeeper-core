import React from 'react';
import { Briefcase, BarChart3, ShieldCheck, Code2, Sparkles } from 'lucide-react';

export type DashboardLayer = 'executive' | 'analyst' | 'auditor' | 'developer';

interface LayeredRoleSelectorProps {
  currentLayer: DashboardLayer;
  setLayer: (layer: DashboardLayer) => void;
}

export const LayeredRoleSelector: React.FC<LayeredRoleSelectorProps> = ({ currentLayer, setLayer }) => {
  const layers: { id: DashboardLayer; label: string; sublabel: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'executive',
      label: 'Executive View',
      sublabel: 'ผู้บริหาร (สรุปใน 10 วินาที)',
      icon: <Briefcase className="w-4 h-4" />,
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/50 text-amber-300',
    },
    {
      id: 'analyst',
      label: 'Analyst View',
      sublabel: 'นักวิเคราะห์ (KPIs & Metrics)',
      icon: <BarChart3 className="w-4 h-4" />,
      color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/50 text-blue-300',
    },
    {
      id: 'auditor',
      label: 'Auditor View',
      sublabel: 'ผู้ตรวจสอบ (Governance & Trust)',
      icon: <ShieldCheck className="w-4 h-4" />,
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/50 text-emerald-300',
    },
    {
      id: 'developer',
      label: 'Developer View',
      sublabel: 'นักพัฒนา (Technical Trace & Pipeline)',
      icon: <Code2 className="w-4 h-4" />,
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/50 text-purple-300',
    },
  ];

  return (
    <div className="bg-[#0E1525] border border-[rgba(255,255,255,0.1)] p-3 rounded-2xl shadow-lg">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
          <Sparkles className="w-4 h-4 text-[#FF8A00]" />
          <span>มุมมองตามบทบาท (Layered Role-Based Dashboard)</span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          ลด Cognitive Load กว่า 50%
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {layers.map((l) => {
          const isActive = currentLayer === l.id;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => setLayer(l.id)}
              className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                isActive
                  ? `bg-gradient-to-br ${l.color} shadow-md ring-1 ring-amber-500/30`
                  : 'bg-[#060A16] border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-slate-200 hover:bg-[#11192d]'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1">
                <span className={isActive ? 'text-amber-400' : 'text-slate-400'}>{l.icon}</span>
                <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-200'}`}>
                  {l.label}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 line-clamp-1">{l.sublabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
