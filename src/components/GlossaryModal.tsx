import React, { useState } from 'react';
import { BookOpen, Search, X, Shield, Brain, Lock, Layers, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const categories = ['All', 'Governance', 'Reasoning', 'Security', 'Architecture'];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Reasoning':
        return <Brain className="w-4 h-4 text-amber-400" />;
      case 'Governance':
        return <Shield className="w-4 h-4 text-emerald-400" />;
      case 'Security':
        return <Lock className="w-4 h-4 text-purple-400" />;
      case 'Architecture':
        return <Layers className="w-4 h-4 text-cyan-400" />;
      default:
        return <BookOpen className="w-4 h-4 text-amber-400" />;
    }
  };

  const allTerms = Object.entries(GLOSSARY_TERMS).map(([key, item]) => ({
    key,
    ...item,
    examples: item.examples || [
      'การใช้ประกอบการตัดสินใจโครงการลงทุนขนาดใหญ่ (CAPEX)',
      'การตรวจสอบข้อเท็จจริงและความเสี่ยงก่อนเสนอคณะกรรมการบริหาร (Board of Directors)',
    ],
    useCases: item.useCases || [
      'ใช้ในสเตจการวิเคราะห์สมมติฐานแข่งขัน (ACH) เพื่อลดอคติ',
      'ใช้ตรวจสอบย้อนกลับหลักฐานและมาตรฐานธรรมาภิบาลสากล',
    ],
    relatedConcepts: item.relatedConcepts || ['PUNN Predictive Cognitive Architecture (PCA v3.0)', 'White-Box Audit', 'Human Agency'],
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

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-7xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
          isLight ? 'bg-white border-slate-200 text-slate-950' : 'bg-[#0B1220] border-white/15 text-white'
        }`}
      >
        {/* Modal Header */}
        <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-4 shrink-0 bg-gradient-to-r from-[#0E1525] to-[#0B1220]">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-[28px] font-bold tracking-tight text-white flex items-center gap-3">
                Executive & Technical Glossary
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                  ภาษาไทยเข้าใจง่ายสำหรับผู้บริหาร
                </span>
              </h2>
              <p className="text-base font-normal text-slate-300 mt-1">
                คู่มืออธิบายคำศัพท์ทางเทคนิค ระบบธรรมาภิบาล และสถาปัตยกรรม AI เชิงยุทธศาสตร์
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="ปิดหน้าต่าง"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-6 border-b border-slate-200 dark:border-white/10 space-y-4 bg-[#0E1525] shrink-0">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search concepts... (e.g. Hypothesis, AIIA, WORM, Knowledge Graph)"
              className="w-full h-14 pl-12 pr-4 rounded-2xl text-base font-medium border bg-[#151D2E] border-white/15 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-inner"
            />
          </div>

          {/* Category Filter Pills (Height 42px, padding 20px) */}
          <div className="flex flex-wrap items-center gap-3 font-medium text-sm">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{ height: '42px', paddingLeft: '20px', paddingRight: '20px' }}
                  className={`rounded-xl border transition-all cursor-pointer flex items-center gap-2 min-h-[44px] ${
                    isSelected
                      ? 'bg-[#FF8A00] text-slate-950 font-semibold border-[#FF8A00] shadow-md shadow-amber-500/20'
                      : 'bg-[#181F2B] text-slate-200 border-white/10 hover:border-[#FF8A00]/50 hover:bg-[#202838]'
                  }`}
                >
                  {cat !== 'All' && getCategoryIcon(cat)}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card List Body (Responsive: Mobile 1 col, Tablet 2 cols, Desktop 3 cols) */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-[#090E17]">
          {filteredTerms.length === 0 ? (
            <div className="p-16 text-center text-slate-300 font-medium text-base">
              ไม่พบคำศัพท์ที่ตรงกับการค้นหา กรุณาลองใหม่อีกครั้ง
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTerms.map((term) => {
                const isExpanded = !!expandedKeys[term.key];
                return (
                  <div
                    key={term.key}
                    className="rounded-2xl p-6 bg-[#151D2E] border border-white/10 shadow-xl flex flex-col justify-between hover:border-amber-500/40 transition-all duration-300 group"
                  >
                    <div>
                      {/* Category Badge & English Term */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                          {getCategoryIcon(term.category)}
                          <span>{term.category}</span>
                        </div>
                        <span className="text-xs font-mono font-medium text-slate-300">
                          {term.term}
                        </span>
                      </div>

                      {/* Thai Title (22px SemiBold) */}
                      <h3 className="text-[22px] font-semibold text-white mb-2 leading-snug group-hover:text-amber-400 transition-colors">
                        {term.thaiLabel}
                      </h3>

                      {/* Description (16px Regular, Line-height 1.7) */}
                      <p className="text-base font-normal text-slate-200 leading-[1.7] mb-5">
                        {term.simpleExplanation}
                      </p>

                      {/* Executive Benefit Panel (#181F2B background, 4px solid #F5A623 left border, 16px padding) */}
                      <div className="bg-[#181F2B] border-l-4 border-[#F5A623] p-4 rounded-r-xl mb-5 space-y-1.5 shadow-sm">
                        <div className="text-xs font-semibold text-[#F5A623] uppercase tracking-wider flex items-center gap-1.5">
                          <span>✓</span>
                          <span>Executive Benefit</span>
                        </div>
                        <p className="text-base font-normal text-slate-100 leading-[1.7]">
                          {term.practicalValue}
                        </p>
                      </div>

                      {/* Expandable Details Section */}
                      {isExpanded && (
                        <div className="pt-4 border-t border-white/10 space-y-4 mb-5 text-sm font-normal text-slate-200 animate-fadeIn">
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 block mb-1">
                              📌 ตัวอย่างการใช้งานจริง (Examples)
                            </span>
                            <ul className="list-disc list-inside space-y-1 text-slate-300">
                              {term.examples.map((ex: string, i: number) => (
                                <li key={i}>{ex}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 block mb-1">
                              🎯 กรณีศึกษา (Use Cases)
                            </span>
                            <ul className="list-disc list-inside space-y-1 text-slate-300">
                              {term.useCases.map((uc: string, i: number) => (
                                <li key={i}>{uc}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 block mb-1">
                              🔗 แนวคิดที่เกี่ยวข้อง (Related Concepts)
                            </span>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {term.relatedConcepts.map((rc: string, i: number) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-1 rounded-md bg-[#0F172A] border border-white/10 text-xs font-mono text-slate-300"
                                >
                                  {rc}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Footer: Reference Standard & Expand Button */}
                    <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3 mt-auto">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                          Reference Standard
                        </span>
                        <span className="text-xs font-semibold text-slate-200 font-mono">
                          {term.standardRef || 'PUNN Cognitive Architecture v2.0 / Enterprise Standard'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleExpand(term.key)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#202838] hover:bg-[#283248] text-amber-400 text-xs font-semibold transition-all cursor-pointer min-h-[44px] shrink-0"
                      >
                        <span>{isExpanded ? 'Show Less' : 'Learn More'}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-white/10 bg-[#0E1525] flex flex-wrap items-center justify-between gap-4 shrink-0 text-sm font-medium text-slate-300">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>FIRE KEEPER · Strategic Governance AI & Decision Intelligence OS</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#FF8A00] hover:bg-[#FFA32B] text-slate-950 font-bold transition-all cursor-pointer shadow-md min-h-[44px]"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
