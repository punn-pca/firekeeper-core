import React from 'react';
import { Flame, Brain, Activity, ShieldCheck, Layers, Sparkles } from 'lucide-react';

export interface MessageSkeletonProps {
  streamingStage?: string;
}

export const MessageSkeleton: React.FC<MessageSkeletonProps> = ({ streamingStage }) => {
  return (
    <div className="flex flex-col items-start my-4 w-full max-w-4xl mx-auto animate-pulse">
      {/* Role Avatar & Label Header */}
      <div className="flex items-center space-x-2 mb-2 px-1">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500/40 via-orange-600/40 to-red-600/40 flex items-center justify-center text-white border border-amber-500/30">
          <Flame className="w-4 h-4 text-amber-300 animate-spin" />
        </div>
        <span className="text-xs font-semibold text-amber-300 flex items-center gap-2">
          FIRE KEEPER <span className="text-slate-400 font-mono text-[11px]">({streamingStage || 'กำลังวิเคราะห์ข้อมูล...'})</span>
        </span>
      </div>

      {/* Message Bubble Body Skeleton */}
      <div className="relative w-full max-w-3xl rounded-2xl rounded-tl-none p-5 sm:p-6 bg-slate-900/90 border border-amber-500/30 shadow-2xl space-y-4">
        {/* Strategic Decision Callout Box Skeleton */}
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/20 flex items-start space-x-3">
          <div className="w-5 h-5 rounded bg-amber-500/20 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-amber-500/20 rounded w-1/4" />
            <div className="h-3 bg-amber-500/10 rounded w-5/6" />
          </div>
        </div>

        {/* Text paragraph line skeletons */}
        <div className="space-y-2.5 pt-1">
          <div className="h-4 bg-slate-800 rounded-md w-11/12" />
          <div className="h-4 bg-slate-800 rounded-md w-full" />
          <div className="h-4 bg-slate-800 rounded-md w-4/5" />
        </div>

        {/* Table / Grid Block Skeleton */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3 my-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <div className="h-3.5 bg-slate-800 rounded w-1/3" />
            <div className="h-3 bg-slate-800/80 rounded w-1/6" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="h-8 bg-slate-900 rounded border border-slate-800/80" />
            <div className="h-8 bg-slate-900 rounded border border-slate-800/80" />
            <div className="h-8 bg-slate-900 rounded border border-slate-800/80" />
          </div>
        </div>

        {/* Paragraph 2 lines */}
        <div className="space-y-2 pt-1">
          <div className="h-4 bg-slate-800 rounded-md w-3/4" />
          <div className="h-4 bg-slate-800 rounded-md w-2/3" />
        </div>
      </div>
    </div>
  );
};

export const PCAStateSkeleton: React.FC = () => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 animate-pulse">
      {/* Header Banner Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Brain className="w-5 h-5 text-amber-400" />
          </div>
          <div className="space-y-1.5">
            <div className="h-4 bg-slate-800 rounded w-52" />
            <div className="h-3 bg-slate-800/60 rounded w-72" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-7 w-24 bg-slate-800 rounded-lg" />
          <div className="h-7 w-32 bg-slate-800 rounded-lg" />
        </div>
      </div>

      {/* Navigation Tabs Bar Skeleton */}
      <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-2 overflow-x-auto">
        <div className="h-9 w-32 bg-amber-500/20 border border-amber-500/40 rounded-lg shrink-0" />
        <div className="h-9 w-28 bg-slate-800 rounded-lg shrink-0" />
        <div className="h-9 w-28 bg-slate-800 rounded-lg shrink-0" />
        <div className="h-9 w-28 bg-slate-800 rounded-lg shrink-0" />
        <div className="h-9 w-28 bg-slate-800 rounded-lg shrink-0" />
        <div className="h-9 w-28 bg-slate-800 rounded-lg shrink-0" />
      </div>

      {/* Executive Metric Cards Skeleton Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 bg-slate-800 rounded w-1/2" />
              <div className="w-5 h-5 bg-slate-800 rounded" />
            </div>
            <div className="h-6 bg-slate-800 rounded w-3/4" />
            <div className="h-2.5 bg-slate-800/60 rounded w-full" />
          </div>
        ))}
      </div>

      {/* Main Content & Matrix Skeleton Block */}
      <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-slate-800 rounded w-1/3" />
          <div className="h-3 bg-slate-800/60 rounded w-1/5" />
        </div>
        <div className="space-y-2">
          <div className="h-3.5 bg-slate-800/80 rounded w-full" />
          <div className="h-3.5 bg-slate-800/80 rounded w-11/12" />
          <div className="h-3.5 bg-slate-800/80 rounded w-4/5" />
        </div>

        {/* Grid Table Columns Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80">
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
              <div className="h-3 bg-slate-800 rounded w-1/2" />
              <div className="h-5 bg-slate-800/90 rounded w-3/4" />
              <div className="h-2.5 bg-slate-800/60 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
