import React, { useState } from 'react';
import {
  Briefcase,
  BarChart3,
  ShieldCheck,
  Code2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Layers,
  LayoutGrid,
  Settings,
  Cpu,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
} from 'lucide-react';
import { DashboardLayer } from './LayeredRoleSelector';
import { useTheme } from '../context/ThemeContext';
import { getThemeTokens } from '../utils/themeTokens';

interface EnterpriseSidebarProps {
  currentLayer: DashboardLayer;
  setLayer: (layer: DashboardLayer) => void;
  widgetVisibility: {
    pipelineProgress: boolean;
    heroWelcome: boolean;
    configurationPanel: boolean;
    examplePrompts: boolean;
    kpiCards: boolean;
  };
  setWidgetVisibility: React.Dispatch<React.SetStateAction<{
    pipelineProgress: boolean;
    heroWelcome: boolean;
    configurationPanel: boolean;
    examplePrompts: boolean;
    kpiCards: boolean;
  }>>;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const EnterpriseSidebar: React.FC<EnterpriseSidebarProps> = ({
  currentLayer,
  setLayer,
  widgetVisibility,
  setWidgetVisibility,
  isCollapsed,
  setIsCollapsed,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  const tokens = getThemeTokens(isLight);

  // Section collapse states
  const [architectureOpen, setArchitectureOpen] = useState(true);
  const [analysisOpen, setAnalysisOpen] = useState(true);
  const [widgetsOpen, setWidgetsOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true);

  const layers: { id: DashboardLayer; label: string; sublabel: string; icon: React.ReactNode }[] = [
    {
      id: 'executive',
      label: 'Executive View',
      sublabel: 'Summary & Decisions',
      icon: <Briefcase className="w-4 h-4 text-amber-500" />,
    },
    {
      id: 'analyst',
      label: 'Analyst View',
      sublabel: 'KPIs & Data Graphs',
      icon: <BarChart3 className="w-4 h-4 text-blue-500" />,
    },
    {
      id: 'auditor',
      label: 'Auditor View',
      sublabel: 'Governance & Trust',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
    },
    {
      id: 'developer',
      label: 'Developer View',
      sublabel: 'Pipeline Trace & Logs',
      icon: <Code2 className="w-4 h-4 text-purple-500" />,
    },
  ];

  const handleLayerChange = (layer: DashboardLayer) => {
    setLayer(layer);
    if (layer === 'executive') {
      setWidgetVisibility({
        pipelineProgress: false,
        heroWelcome: true,
        configurationPanel: false,
        examplePrompts: false,
        kpiCards: true,
      });
    } else if (layer === 'analyst') {
      setWidgetVisibility({
        pipelineProgress: true,
        heroWelcome: true,
        configurationPanel: true,
        examplePrompts: true,
        kpiCards: true,
      });
    } else if (layer === 'auditor') {
      setWidgetVisibility({
        pipelineProgress: true,
        heroWelcome: true,
        configurationPanel: false,
        examplePrompts: false,
        kpiCards: true,
      });
    } else if (layer === 'developer') {
      setWidgetVisibility({
        pipelineProgress: true,
        heroWelcome: false,
        configurationPanel: true,
        examplePrompts: false,
        kpiCards: true,
      });
    }
  };

  const widgetList = [
    { key: 'pipelineProgress', label: '12-Stage Pipeline', desc: 'Real-time trace' },
    { key: 'heroWelcome', label: 'Executive Welcome', desc: 'System status & briefing' },
    { key: 'configurationPanel', label: 'Reasoning Engine', desc: 'Tone & profiles' },
    { key: 'examplePrompts', label: 'Strategic Prompts', desc: 'Preset prompts' },
    { key: 'kpiCards', label: 'KPI Summary Cards', desc: 'Risk & confidence' },
  ];

  if (isCollapsed) {
    return (
      <aside className={`w-14 border-r flex flex-col items-center py-4 space-y-4 shrink-0 transition-all ${
        isLight ? 'bg-white border-[#E5E7EB]' : 'bg-[#0B1220] border-white/10'
      }`}>
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          title="Expand Sidebar"
          className={`p-2 rounded-lg border transition-all cursor-pointer ${
            isLight
              ? 'bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] border-[#E5E7EB]'
              : 'bg-white/5 hover:bg-white/10 text-amber-500 border-white/10'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center space-y-3 pt-2">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500" title="Architecture">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500" title="Analysis">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500" title="Widgets">
            <LayoutGrid className="w-4 h-4" />
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className={`w-[240px] border-r flex flex-col h-full shrink-0 transition-all ${
      isLight ? 'bg-white border-[#E5E7EB]' : 'bg-[#0B1220] border-white/10'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b flex items-center justify-between ${
        isLight ? 'border-[#E5E7EB]' : 'border-white/10'
      }`}>
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-[#111827]' : 'text-white'}`}>
              FIRE KEEPER
            </h2>
            <p className={`text-[10px] ${isLight ? 'text-[#6B7280]' : 'text-slate-400'}`}>
              Governance OS
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          title="Collapse Sidebar"
          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
            isLight
              ? 'bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] border-[#E5E7EB]'
              : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Main Sections List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs font-sans">
        
        {/* GROUP 1: ARCHITECTURE */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setArchitectureOpen(!architectureOpen)}
            className={`w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-wider transition-colors ${
              isLight ? 'text-[#6B7280] hover:text-[#111827]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-amber-500" />
              <span>Architecture</span>
            </span>
            {architectureOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {architectureOpen && (
            <div className={`p-3 rounded-xl border ${tokens.shadow} space-y-3 ${
              isLight ? 'bg-white border-[#E5E7EB]' : 'bg-[#111827] border-white/10'
            }`}>
              <div className="flex items-center justify-between text-xs font-medium">
                <span className={tokens.textPrimary}>PCA Engine</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                  isLight
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  ● Healthy
                </span>
              </div>
              <p className={`text-[11px] ${tokens.textSecondary}`}>12-Stage Cognitive Pipeline Active</p>
              
              <button
                type="button"
                onClick={toggleTheme}
                className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors text-xs ${
                  isLight ? 'bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827]' : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
              >
                <span>Theme Mode</span>
                {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* GROUP 2: ANALYSIS (ROLE LAYERS) */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setAnalysisOpen(!analysisOpen)}
            className={`w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-wider transition-colors ${
              isLight ? 'text-[#6B7280] hover:text-[#111827]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-500" />
              <span>Analysis Views</span>
            </span>
            {analysisOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {analysisOpen && (
            <div className="space-y-1">
              {layers.map((l) => {
                const isActive = currentLayer === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => handleLayerChange(l.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all cursor-pointer ${
                      isActive
                        ? isLight
                          ? 'bg-amber-50 text-[#F59E0B] border border-[#F59E0B] font-semibold'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium'
                        : isLight
                          ? 'text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827] border border-transparent'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {l.icon}
                      <div className="truncate">
                        <div className="font-medium text-xs leading-tight">{l.label}</div>
                      </div>
                    </div>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* GROUP 3: WIDGETS MANAGER */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setWidgetsOpen(!widgetsOpen)}
            className={`w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-wider transition-colors ${
              isLight ? 'text-[#6B7280] hover:text-[#111827]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4 text-emerald-500" />
              <span>Widgets</span>
            </span>
            {widgetsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {widgetsOpen && (
            <div className="space-y-1.5">
              {widgetList.map((w) => {
                const isChecked = widgetVisibility[w.key as keyof typeof widgetVisibility];
                return (
                  <label
                    key={w.key}
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                      isChecked
                        ? isLight
                          ? 'bg-white border-[#E5E7EB] text-[#111827] shadow-2xs'
                          : 'bg-[#111827] border-white/10 text-slate-200'
                        : 'bg-transparent border-transparent text-[#6B7280] hover:text-[#111827]'
                    }`}
                  >
                    <span className="text-xs font-normal truncate">{w.label}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        setWidgetVisibility({ ...widgetVisibility, [w.key]: e.target.checked })
                      }
                      className="rounded border-[#E5E7EB] text-[#F59E0B] focus:ring-[#F59E0B] h-3.5 w-3.5 cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* GROUP 4: SETTINGS */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={`w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-wider transition-colors ${
              isLight ? 'text-[#6B7280] hover:text-[#111827]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-purple-500" />
              <span>Settings</span>
            </span>
            {settingsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {settingsOpen && (
            <div className={`p-3 rounded-xl border ${tokens.shadow} space-y-2 ${
              isLight ? 'bg-white border-[#E5E7EB] text-[#111827]' : 'bg-[#111827] border-white/10 text-slate-300'
            }`}>
              <div className="flex items-center justify-between text-xs pt-1">
                <span>Governance</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">ISO 42001</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </aside>
  );
};
