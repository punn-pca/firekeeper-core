import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, FileText } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { FULL_WHITEPAPER_MARKDOWN, WHITEPAPER_METADATA } from '../data/whitepaperData';

interface WhitepaperPageProps {
  onBack?: () => void;
}

export const WhitepaperPage: React.FC<WhitepaperPageProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="mb-5 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${isLight ? 'border-slate-300 hover:bg-slate-100' : 'border-slate-700 hover:bg-slate-800'}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Documentation
          </button>
          <div className="inline-flex items-center gap-2 text-xs text-amber-500">
            <FileText className="w-4 h-4" />
            Whitepaper v{WHITEPAPER_METADATA.version}
          </div>
        </div>

        <article className={`rounded-2xl border p-5 sm:p-8 lg:p-10 ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'}`}>
          <div className="publication-reader-prose markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {FULL_WHITEPAPER_MARKDOWN}
            </ReactMarkdown>
          </div>
        </article>
      </div>
    </div>
  );
};
