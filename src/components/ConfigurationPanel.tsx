import React, { useState } from 'react';
import { Compass, Brain, Sparkles, DollarSign, Award, Zap, ChevronDown, ChevronUp, Sliders, Globe } from 'lucide-react';
import { ToneMode, ReasoningProfile } from '../types';
import { ReasoningProfileSelector } from './ReasoningProfileSelector';
import { useTheme } from '../context/ThemeContext';
import { getThemeTokens } from '../utils/themeTokens';

interface ConfigurationPanelProps {
  reasoningProfile: ReasoningProfile;
  setReasoningProfile: (profile: ReasoningProfile) => void;
  tone: ToneMode;
  setTone: (tone: ToneMode) => void;
  deepReasoning: boolean;
  setDeepReasoning: (enabled: boolean) => void;
  webSearch?: boolean;
  setWebSearch?: (enabled: boolean) => void;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  reasoningProfile,
  setReasoningProfile,
  tone,
  setTone,
  deepReasoning,
  setDeepReasoning,
  webSearch = true,
  setWebSearch,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  return (
    <div className={`rounded-2xl transition-all ${
      isLight ? 'bg-white border border-slate-200' : 'bg-[#0E1525] border border-slate-800'
    } p-3.5 sm:p-4`}>
      {/* Advanced Toggle Header */}
      <button
        type="button"
        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
        className="w-full flex items-center justify-between text-xs sm:text-sm font-semibold cursor-pointer group"
      >
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-amber-500" />
          <span className={isLight ? 'text-slate-900 group-hover:text-amber-600' : 'text-white group-hover:text-amber-400'}>
            Advanced Configuration (โปรไฟล์ยุทธศาสตร์ & ระดับการประมวลผล)
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
          <span>{isAdvancedOpen ? 'ซ่อนการตั้งค่า' : 'ตั้งค่าเพิ่มเติม'}</span>
          {isAdvancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Collapsible Content */}
      {isAdvancedOpen && (
        <div className="mt-4 pt-4 border-t border-slate-800/60 space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reasoning Profile */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-amber-500">
                <Brain className="w-4 h-4" />
                <h4 className="font-bold text-xs">Reasoning Profile (โปรไฟล์ยุทธศาสตร์)</h4>
              </div>
              <ReasoningProfileSelector
                selectedProfile={reasoningProfile}
                onChange={setReasoningProfile}
              />
            </div>

            {/* Response Tone - Segmented Control */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-amber-500">
                <Compass className="w-4 h-4" />
                <h4 className="font-bold text-xs">Response Tone (ระดับน้ำเสียง)</h4>
              </div>
              <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 h-[38px] items-center">
                {[
                  { id: 'Formal Architect', label: 'Formal' },
                  { id: 'Direct Expert', label: 'Direct' },
                  { id: 'Empathetic Guide', label: 'Coach' },
                ].map((item) => {
                  const isSelected = tone === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTone(item.id as ToneMode)}
                      className={`h-[30px] rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Deep Reasoning & Compact Metrics */}
          <div className="pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-bold text-xs text-white block">Deep Reasoning (12-Stage FIRE)</span>
                <span className="text-[11px] text-slate-400">ประมวลผล 12 ขั้นตอนเชิงลึก</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 font-mono text-xs">
                <span className="text-slate-400">Rigor: <strong className="text-amber-400">{deepReasoning ? '99.4%' : '92.0%'}</strong></span>
                <span className="text-slate-400">Cost: <strong className="text-emerald-400">{deepReasoning ? '$0.0012' : '$0.0004'}</strong></span>
                <span className="text-slate-400">Token: <strong className="text-sky-400">-45%</strong></span>
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
          </div>

          {/* DeepSeek + Live Web Search */}
          <div className="pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Globe className="w-4 h-4 text-sky-400" />
              <div>
                <span className="font-bold text-xs text-white flex items-center gap-1.5">
                  <span>DeepSeek + Live Web Search</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold font-mono">
                    LIVE
                  </span>
                </span>
                <span className="text-[11px] text-slate-400">สืบค้นข้อมูลสดจากเว็บแบบเรียลไทม์</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={webSearch}
                  onChange={(e) => setWebSearch?.(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-sky-500" />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
