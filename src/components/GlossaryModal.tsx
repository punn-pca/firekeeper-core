import React, { useState } from 'react';
import { BookOpen, Search, X, HelpCircle, ShieldCheck, Brain, Lock, Layers } from 'lucide-react';
import { GLOSSARY_TERMS, GlossaryTerm } from './PlainLanguageTooltip';
import { useTheme } from '../context/ThemeContext';

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlossaryModal: React.FC<GlossaryModalProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'Governance', 'Reasoning', 'Security', 'Architecture'];

  const allTerms = Object.entries(GLOSSARY_TERMS).map(([key, item]) => ({
    key,
    ...item,
  }));

  const filteredTerms = allTerms.filter((term) => {
    const matchesSearch =
      term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.thaiLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.simpleExplanation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.practicalValue.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || term.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-3xl max-h-[85vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0B1220] border-white/10 text-white'
        }`}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg font-mono tracking-tight flex items-center gap-2">
                Executive & Technical Glossary
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
                  ภาษาไทยเข้าใจง่าย
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                คู่มืออธิบายคำศัพท์ทางเทคนิค ระบบธรรมาภิบาล และสถาปัตยกรรม PCA v2.0
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-white/10 space-y-3 bg-slate-50 dark:bg-[#0E1525]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาคำศัพท์ เช่น Hypotheses Engine, ECE, AIIA, WORM Ledger..."
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm border focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                  : 'bg-[#151D2E] border-white/10 text-white placeholder:text-slate-500'
              }`}
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-xs'
                    : 'bg-white dark:bg-[#151D2E] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-amber-500/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Terms List Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 divide-y divide-slate-100 dark:divide-white/5">
          {filteredTerms.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-mono text-xs">
              ไม่พบคำศัพท์ที่ตรงกับการค้นหา
            </div>
          ) : (
            filteredTerms.map((term) => (
              <div key={term.key} className="pt-3.5 first:pt-0 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {term.category}
                    </span>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      {term.thaiLabel}
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-medium">
                    {term.term}
                  </span>
                </div>

                <div className="text-xs space-y-1.5">
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                    <strong>ความหมาย:</strong> {term.simpleExplanation}
                  </p>
                  <div className="p-2 rounded-lg bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
                    <strong>ประโยชน์ต่อผู้บริหาร:</strong> {term.practicalValue}
                  </div>
                  {term.standardRef && (
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      มาตรฐานอ้างอิง: <span className="text-slate-700 dark:text-slate-300 font-semibold">{term.standardRef}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0E1525] flex items-center justify-between text-xs font-mono text-slate-500">
          <span>FIRE KEEPER · Powered by PUNN Cognitive Architecture v2.0</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
