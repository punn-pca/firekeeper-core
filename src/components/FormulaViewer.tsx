import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Calculator, Info, Sparkles } from 'lucide-react';

interface FormulaViewerProps {
  formula: string;
  title?: string;
  description?: string;
  explanation?: string;
  variables?: Array<{ symbol: string; meaning: string }>;
  inline?: boolean;
  className?: string;
}

export const FormulaViewer: React.FC<FormulaViewerProps> = ({
  formula,
  title,
  description,
  explanation,
  variables,
  inline = false,
  className = '',
}) => {
  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  // Safe KaTeX renderer
  const renderFormulaHtml = (latex: string) => {
    try {
      // Clean up common unescaped string patterns
      let cleanLatex = latex
        .replace(/\\/g, '\\')
        .replace(/\$+/g, '')
        .trim();

      if (!cleanLatex) return null;

      return {
        __html: katex.renderToString(cleanLatex, {
          displayMode: !inline,
          throwOnError: false,
        }),
      };
    } catch (e) {
      console.warn('KaTeX render error:', e);
      return { __html: `<span class="font-mono text-amber-300">${escapeHtml(formula)}</span>` };
    }
  };

  const htmlContent = renderFormulaHtml(formula);

  if (inline) {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 font-mono text-sky-300 ${className}`}
        dangerouslySetInnerHTML={htmlContent || { __html: escapeHtml(formula) }}
      />
    );
  }

  return (
    <div className={`bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3 ${className}`}>
      {/* Title & Description Header */}
      {(title || description) && (
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <Calculator className="w-4 h-4 text-sky-400 shrink-0" />
            <h5 className="font-bold text-xs font-mono text-slate-200 uppercase tracking-wider">
              {title || 'สูตรการคำนวณทางคณิตศาสตร์ (Readable Formula)'}
            </h5>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-300">
            KaTeX Verified
          </span>
        </div>
      )}

      {description && <p className="text-xs text-slate-400">{description}</p>}

      {/* Primary Mathematical Display Box */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-lg p-3 text-center overflow-x-auto shadow-inner text-slate-100 flex items-center justify-center min-h-[50px]">
        {htmlContent ? (
          <div className="text-base sm:text-lg text-sky-200 tracking-wide font-sans py-1" dangerouslySetInnerHTML={htmlContent} />
        ) : (
          <div className="font-mono text-amber-300 text-sm">{formula}</div>
        )}
      </div>

      {/* Explanation Box */}
      {explanation && (
        <div className="flex items-start space-x-2 text-xs text-slate-300 bg-sky-950/20 border border-sky-500/20 p-2.5 rounded-lg">
          <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{explanation}</div>
        </div>
      )}

      {/* Variable Definitions Table */}
      {variables && variables.length > 0 && (
        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400 font-mono block">
            คำอธิบายสัญลักษณ์ในสูตร (Variable Glossary):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {variables.map((v, i) => (
              <div
                key={i}
                className="flex items-center space-x-2 text-xs bg-slate-900/80 border border-slate-800 px-2.5 py-1.5 rounded-md"
              >
                <span className="font-mono font-bold text-sky-400 shrink-0 px-1.5 py-0.5 bg-sky-500/10 rounded border border-sky-500/30">
                  {v.symbol}
                </span>
                <span className="text-slate-300 leading-normal break-words">{v.meaning}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
