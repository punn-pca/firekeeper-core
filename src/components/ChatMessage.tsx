import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { Flame, Paperclip } from 'lucide-react';
import { Turn } from '../types';
import { AuditDrawer } from './AuditDrawer';
import { preprocessMarkdown } from '../utils/markdownPreprocessor';
import { useTheme } from '../context/ThemeContext';

interface ChatMessageProps {
  turn: Turn;
  turnIndex?: number;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ turn, turnIndex }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const processedContent = turn.content ? preprocessMarkdown(turn.content) : '';

  if (turn.role === 'user') {
    return (
      <div className="py-1">
        <div className="flex justify-end">
          <div className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 border text-sm font-sans shadow-sm ${
            isLight
              ? 'bg-slate-800 text-white border-slate-700'
              : 'bg-amber-500/15 text-amber-100 border-amber-500/30'
          }`}>
            {turn.attachments && turn.attachments.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5 pb-2 border-b border-white/10">
                {turn.attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-black/30 border border-white/10">
                    <Paperclip className="w-3 h-3 text-amber-400" />
                    <span className="truncate max-w-[120px]">{att.name}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="whitespace-pre-wrap leading-relaxed break-words">{turn.content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-1">
      <div className="flex items-start gap-3 text-left">
        <div className="w-8 h-8 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
          <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className={`font-bold tracking-wider uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>
              FIRE KEEPER
            </span>
            {turn.model && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {turn.model}
              </span>
            )}
            <span className="text-[10px] text-slate-500 ml-auto font-mono">
              Governed by PCA v3.0
            </span>
          </div>

          <div className={`prose max-w-none text-sm leading-relaxed ${
            isLight ? 'prose-slate text-slate-800' : 'prose-invert text-slate-200'
          }`}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex, rehypeRaw]}
              components={{
                p: ({ node, ...props }) => <p className="mb-3 leading-relaxed break-words" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                h1: ({ node, ...props }) => <h1 className="text-lg font-bold font-mono text-amber-500 mt-4 mb-2" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-base font-bold font-mono text-amber-400 mt-3 mb-2" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-sm font-bold font-mono text-amber-300 mt-3 mb-1" {...props} />,
                code: ({ node, inline, className, children, ...props }: any) => {
                  if (inline) {
                    return (
                      <code className="px-1.5 py-0.5 rounded font-mono text-[12px] bg-amber-500/10 text-amber-300 border border-amber-500/20" {...props}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <div className="my-3 overflow-x-auto rounded-xl border border-white/10 bg-[#040812] p-3 font-mono text-xs">
                      <pre className="text-slate-200 leading-relaxed">{children}</pre>
                    </div>
                  );
                },
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-2 border-amber-500 pl-3 my-3 italic text-slate-400" {...props} />
                ),
              }}
            >
              {processedContent}
            </ReactMarkdown>
          </div>

          <AuditDrawer pcaState={turn.pcaState} turn={turn} isLight={isLight} />
        </div>
      </div>
    </div>
  );
};
