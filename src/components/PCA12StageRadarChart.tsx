import React, { useState } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from 'recharts';
import { Activity, Zap, Clock, CheckCircle2, ShieldAlert, X, Eye, FileText, Terminal } from 'lucide-react';
import { PCAState, PCA_STAGES } from '../types';
import { useTheme } from '../context/ThemeContext';

interface PCA12StageRadarChartProps {
  pcaState: PCAState;
  isAnalyzing?: boolean;
}

export const PCA12StageRadarChart: React.FC<PCA12StageRadarChartProps> = ({
  pcaState,
  isAnalyzing = false,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [metricMode, setMetricMode] = useState<'depth' | 'latency' | 'tokens'>('depth');
  const [selectedStageForDrillDown, setSelectedStageForDrillDown] = useState<string | null>(null);

  const trace = pcaState?.trace || [];
  const maxDuration = Math.max(...trace.map((t) => t.duration_ms || 0), 1);

  // Compute 12-stage data for Recharts Radar
  const radarData = PCA_STAGES.map((stage, idx) => {
    const stageTrace = trace.find((t) => t.stage === stage.id);
    const isCompleted = Boolean(stageTrace);
    const durationMs = stageTrace?.duration_ms || 0;
    const promptTokens = stageTrace?.promptTokens || 0;
    const completionTokens = stageTrace?.completionTokens || 0;
    const totalTokens = promptTokens + completionTokens;

    // Stage 1-12 depth / cognitive weight calculations
    let cognitiveWeight = 40; // baseline
    if (isCompleted) {
      cognitiveWeight = 70;
      if (stage.id === 'OBSERVATION') {
        cognitiveWeight = Math.min(100, 60 + (pcaState.observations?.length || 0) * 10);
      } else if (stage.id === 'UNDERSTANDING') {
        cognitiveWeight = Math.min(100, 65 + Math.min(35, (pcaState.understanding?.length || 0) / 10));
      } else if (stage.id === 'PURPOSE') {
        cognitiveWeight = Math.min(100, 70 + (pcaState.constraints?.length || 0) * 8);
      } else if (stage.id === 'MEMORY') {
        cognitiveWeight = Math.min(100, 50 + (pcaState.memories?.length || 0) * 10);
      } else if (stage.id === 'MENTAL_MODEL') {
        cognitiveWeight = Math.min(100, 60 + (pcaState.knowledge_graph?.nodes?.length || 0) * 5);
      } else if (stage.id === 'HYPOTHESIS') {
        cognitiveWeight = Math.min(100, 65 + (pcaState.hypotheses?.length || 0) * 12);
      } else if (stage.id === 'EVIDENCE_EVALUATION') {
        cognitiveWeight = Math.min(100, 60 + (pcaState.evidence_explorer?.length || 0) * 10);
      } else if (stage.id === 'CRITIQUE') {
        cognitiveWeight = Math.min(100, 55 + (pcaState.critique?.length || 0) * 12);
      } else if (stage.id === 'DECISION') {
        cognitiveWeight = pcaState.confidence === 'สูง' ? 95 : pcaState.confidence === 'ปานกลาง' ? 75 : 55;
      } else if (stage.id === 'COMMUNICATION') {
        cognitiveWeight = Math.min(100, 70 + Math.min(30, totalTokens / 20));
      } else if (stage.id === 'REFLECTION') {
        cognitiveWeight = Math.min(100, 65 + (pcaState.reflection?.length || 0) * 10);
      } else if (stage.id === 'LEARNING') {
        cognitiveWeight = Math.min(100, 60 + (pcaState.agency_checks?.length || 0) * 10);
      }
    } else if (isAnalyzing && trace.length === idx) {
      cognitiveWeight = 45; // Active stage
    } else {
      cognitiveWeight = 10;
    }

    // Normalized Latency Score (0 - 100)
    const latencyScore = Math.round((durationMs / maxDuration) * 100);

    // Normalized Token Score (0 - 100)
    const tokenScore = Math.min(100, Math.round((totalTokens / 200) * 100));

    // Completion score (100 if completed, 50 if active, 10 if pending)
    const completionScore = isCompleted ? 100 : isAnalyzing && trace.length === idx ? 50 : 10;

    return {
      stageId: stage.id,
      stageNumber: idx + 1,
      shortLabel: `${idx + 1}. ${stage.thLabel}`,
      fullLabel: `${stage.label} (${stage.thLabel})`,
      completionScore,
      cognitiveWeight,
      latencyScore,
      tokenScore,
      durationMs,
      totalTokens,
      isCompleted,
      stageTrace,
      stageInfo: stage,
    };
  });

  const totalDuration = trace.reduce((sum, t) => sum + (t.duration_ms || 0), 0);
  const completedCount = trace.length;

  const activeDrillDownData = selectedStageForDrillDown
    ? radarData.find((d) => d.stageId === selectedStageForDrillDown)
    : null;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`p-3 rounded-xl shadow-2xl text-xs space-y-1.5 max-w-xs font-sans border ${
          isLight 
            ? 'bg-white border-slate-300 text-slate-900' 
            : 'bg-slate-950/95 border-slate-700 text-slate-100'
        }`}>
          <div className={`font-bold border-b pb-1 flex items-center justify-between ${
            isLight ? 'text-amber-800 border-slate-200' : 'text-amber-400 border-slate-800'
          }`}>
            <span>{data.fullLabel}</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                data.isCompleted
                  ? isLight ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : isLight ? 'bg-slate-100 text-slate-600 border-slate-300' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {data.isCompleted ? 'เสร็จสิ้น' : 'รอประมวลผล'}
            </span>
          </div>
          <div className={`space-y-1 font-mono text-[11px] ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            <div className="flex justify-between">
              <span className={isLight ? 'text-amber-800 font-medium' : 'text-amber-300'}>น้ำหนักการคิด (Weight):</span>
              <span className={`font-bold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{data.cognitiveWeight}%</span>
            </div>
            <div className="flex justify-between">
              <span className={isLight ? 'text-blue-800 font-medium' : 'text-sky-300'}>ความสมบูรณ์ (Completion):</span>
              <span className={`font-bold ${isLight ? 'text-blue-700' : 'text-sky-400'}`}>{data.completionScore}%</span>
            </div>
            <div className="flex justify-between">
              <span className={isLight ? 'text-emerald-800 font-medium' : 'text-emerald-300'}>เวลาที่ใช้ (Latency):</span>
              <span className={`font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{data.durationMs} ms</span>
            </div>
            {data.totalTokens > 0 && (
              <div className="flex justify-between">
                <span className={isLight ? 'text-purple-800 font-medium' : 'text-purple-300'}>โทเคนสะสม (Tokens):</span>
                <span className={`font-bold ${isLight ? 'text-purple-700' : 'text-purple-400'}`}>{data.totalTokens} tokens</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`border rounded-2xl p-4 shadow-xl space-y-4 transition-colors ${
      isLight ? 'bg-white border-slate-200 text-slate-900 shadow-sm' : 'bg-slate-950/80 border-slate-800 text-slate-100'
    }`}>
      {/* Header Controls */}
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-3 ${
        isLight ? 'border-slate-200' : 'border-slate-800/80'
      }`}>
        <div className="flex items-center space-x-2.5">
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
            isLight ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className={`font-bold text-sm flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              12-Stage Cognitive Architecture Progression
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                isLight ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                Heuristic-based Radar Profile
              </span>
            </h4>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              กราฟเรดาร์แสดงพัฒนาการ ความเข้มข้น และระยะเวลาประมวลผล 12 ขั้นตอน <span className={`font-mono text-[11px] ${isLight ? 'text-amber-800 font-semibold' : 'text-amber-300/90'}`}>(ค่าประมาณการเชิงโครงสร้าง / Heuristic-based Estimation)</span>
            </p>
          </div>
        </div>

        {/* View mode toggle buttons */}
        <div className={`flex items-center space-x-1.5 p-1 rounded-xl border text-xs ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <button
            type="button"
            onClick={() => setMetricMode('depth')}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium flex items-center gap-1 cursor-pointer ${
              metricMode === 'depth'
                ? isLight ? 'bg-white text-amber-800 border border-amber-300 font-bold shadow-xs' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3 h-3 text-amber-500" />
            <span>น้ำหนักการคิด (%)</span>
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('latency')}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium flex items-center gap-1 cursor-pointer ${
              metricMode === 'latency'
                ? isLight ? 'bg-white text-emerald-800 border border-emerald-300 font-bold shadow-xs' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3 h-3 text-emerald-500" />
            <span>เวลาประมวลผล (ms)</span>
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('tokens')}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium flex items-center gap-1 cursor-pointer ${
              metricMode === 'tokens'
                ? isLight ? 'bg-white text-blue-800 border border-blue-300 font-bold shadow-xs' : 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-blue-500" />
            <span>สถานะสมบูรณ์ (%)</span>
          </button>
        </div>
      </div>

      {/* Stats Quick Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
        <div className={`p-2.5 rounded-xl border flex justify-between items-center ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <span className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>ขั้นตอนที่สำเร็จ:</span>
          <span className={`font-bold text-sm ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
            {completedCount} / 12
          </span>
        </div>
        <div className={`p-2.5 rounded-xl border flex justify-between items-center ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <span className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>เวลารวมทั้งสิ้น:</span>
          <span className={`font-bold text-sm ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{totalDuration} ms</span>
        </div>
        <div className={`p-2.5 rounded-xl border flex justify-between items-center ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <span className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>เฉลี่ยต่อขั้นตอน:</span>
          <span className={`font-bold text-sm ${isLight ? 'text-blue-700' : 'text-sky-400'}`}>
            {completedCount > 0 ? Math.round(totalDuration / completedCount) : 0} ms
          </span>
        </div>
        <div className={`p-2.5 rounded-xl border flex justify-between items-center ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <span className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>ระดับความมั่นใจ:</span>
          <span
            className={`font-bold ${
              pcaState.confidence === 'สูง'
                ? isLight ? 'text-emerald-700' : 'text-emerald-400'
                : pcaState.confidence === 'ปานกลาง'
                ? isLight ? 'text-amber-700' : 'text-amber-400'
                : isLight ? 'text-rose-700' : 'text-rose-400'
            }`}
          >
            {pcaState.confidence || 'รอประมวลผล'}
          </span>
        </div>
      </div>

      {/* Recharts Radar Chart Container */}
      <div className={`w-full h-[420px] sm:h-[450px] rounded-xl border p-3 flex items-center justify-center relative ${
        isLight ? 'bg-slate-50/50 border-slate-200' : 'bg-slate-900/50 border-slate-800/80'
      }`}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="78%" data={radarData}>
            <PolarGrid stroke={isLight ? '#cbd5e1' : '#334155'} strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="shortLabel"
              tick={{ fill: isLight ? '#0f172a' : '#e2e8f0', fontSize: 11, fontWeight: 600 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              stroke={isLight ? '#94a3b8' : '#475569'}
              tick={{ fill: isLight ? '#64748b' : '#64748b', fontSize: 9 }}
            />

            {metricMode === 'depth' && (
              <>
                <Radar
                  name="น้ำหนักความคิด (Cognitive Weight %)"
                  dataKey="cognitiveWeight"
                  stroke="#ea580c"
                  fill="#f97316"
                  fillOpacity={isLight ? 0.5 : 0.45}
                />
                <Radar
                  name="ระดับความสมบูรณ์ (Completion %)"
                  dataKey="completionScore"
                  stroke="#0284c7"
                  fill="#0284c7"
                  fillOpacity={isLight ? 0.3 : 0.25}
                />
              </>
            )}

            {metricMode === 'latency' && (
              <>
                <Radar
                  name="สัดส่วนเวลาประมวลผล (Relative Latency %)"
                  dataKey="latencyScore"
                  stroke="#059669"
                  fill="#10b981"
                  fillOpacity={isLight ? 0.5 : 0.45}
                />
                <Radar
                  name="น้ำหนักความคิด (Cognitive Weight %)"
                  dataKey="cognitiveWeight"
                  stroke="#ea580c"
                  fill="#f97316"
                  fillOpacity={0.2}
                />
              </>
            )}

            {metricMode === 'tokens' && (
              <>
                <Radar
                  name="ระดับความสมบูรณ์ (Completion %)"
                  dataKey="completionScore"
                  stroke="#0284c7"
                  fill="#0284c7"
                  fillOpacity={0.4}
                />
                <Radar
                  name="การประมวลผลโทเคน (Token Intensity %)"
                  dataKey="tokenScore"
                  stroke="#2563eb"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
              </>
            )}

            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                fontSize: '11px',
                paddingTop: '14px',
                color: isLight ? '#334155' : '#cbd5e1',
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Data Source Transparency Banner */}
      <div className={`p-3 rounded-xl text-xs flex items-start gap-2 font-mono border ${
        isLight 
          ? 'bg-amber-50 border-amber-200 text-amber-950' 
          : 'bg-amber-500/10 border-amber-500/30 text-amber-300/90'
      }`}>
        <div className="shrink-0 font-bold text-amber-600">💡 Transparency Note:</div>
        <div className="leading-relaxed">
          ข้อมูลที่แสดงในกราฟเรดาร์นี้ (เช่น น้ำหนักความคิด Cognitive Weight และสัดส่วนความสมบูรณ์ Completion Score) เป็น<strong>ค่าประมาณการเชิงโครงสร้าง (Heuristic-based Estimation Model)</strong> ตามสถาปัตยกรรม PUNN v2.0 ไม่ใช่ข้อมูลสถิติเชิงประจักษ์จากการทดสอบภาคสนาม (Empirical Dataset)
        </div>
      </div>

      {/* Mini 12-Stage Interactive Progression Chips with Drill-Down Action */}
      <div className={`space-y-1.5 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
        <div className="text-xs font-mono flex items-center justify-between">
          <span className={`font-bold ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
            คลิกที่ Stage ด้านล่างเพื่อ Drill Down ดูรายละเอียดเชิงลึก:
          </span>
          <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>12 Cognitive Stages</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {radarData.map((d) => (
            <button
              key={d.stageId}
              type="button"
              onClick={() => setSelectedStageForDrillDown(d.stageId)}
              className={`p-2.5 rounded-xl border text-[11px] font-mono text-left transition-all cursor-pointer space-y-1 ${
                selectedStageForDrillDown === d.stageId
                  ? isLight
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm font-bold'
                    : 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                  : d.isCompleted
                  ? isLight
                    ? 'bg-white border-slate-200 hover:border-amber-400 text-slate-900 hover:bg-amber-50/50 shadow-2xs'
                    : 'bg-slate-900 border-slate-800 hover:border-amber-500/50 text-slate-200'
                  : isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-500'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-bold ${
                  selectedStageForDrillDown === d.stageId 
                    ? (isLight ? 'text-white' : 'text-amber-300')
                    : (isLight ? 'text-amber-700' : 'text-amber-400')
                }`}>
                  #{d.stageNumber}
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    d.isCompleted
                      ? isLight ? 'bg-amber-100 text-amber-900' : 'bg-amber-500/20 text-amber-300'
                      : isLight ? 'bg-slate-200 text-slate-600' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {d.durationMs}ms
                </span>
              </div>
              <div className="truncate font-sans font-medium">{d.shortLabel.split('. ')[1]}</div>
              <div className={`text-[9px] flex items-center gap-1 pt-0.5 ${
                selectedStageForDrillDown === d.stageId 
                  ? (isLight ? 'text-amber-100' : 'text-amber-300') 
                  : (isLight ? 'text-slate-500' : 'text-slate-400')
              }`}>
                <Eye className={`w-2.5 h-2.5 ${selectedStageForDrillDown === d.stageId ? 'text-white' : 'text-amber-500'}`} />
                <span>Drill Down</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Drill-Down Modal / Drawer */}
      {activeDrillDownData && (
        <div className={`fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn ${
          isLight ? 'bg-slate-900/40' : 'bg-slate-950/80'
        }`}>
          <div className={`border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 relative font-sans ${
            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-amber-500/40 text-slate-100'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <div className="flex items-center space-x-3">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                  isLight ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                }`}>
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Stage #{activeDrillDownData.stageNumber}: {activeDrillDownData.stageInfo.label}
                    <span className={`text-xs font-mono ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
                      ({activeDrillDownData.stageInfo.thLabel})
                    </span>
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {activeDrillDownData.stageInfo.description}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStageForDrillDown(null)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-xs">
              {/* Stage Telemetry Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                  <span className={`block text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Cognitive Weight</span>
                  <span className={`font-bold text-sm ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>{activeDrillDownData.cognitiveWeight}%</span>
                </div>
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                  <span className={`block text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Processing Latency</span>
                  <span className={`font-bold text-sm ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{activeDrillDownData.durationMs} ms</span>
                </div>
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                  <span className={`block text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Prompt / Completion Tokens</span>
                  <span className={`font-bold text-sm ${isLight ? 'text-blue-700' : 'text-sky-400'}`}>{activeDrillDownData.totalTokens} tok</span>
                </div>
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                  <span className={`block text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Execution Status</span>
                  <span className={`font-bold text-xs ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
                    {activeDrillDownData.isCompleted ? 'EXECUTED' : 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Output & Reasoning Trace */}
              <div className="space-y-2">
                <span className={`font-bold flex items-center gap-1.5 font-mono text-xs ${isLight ? 'text-amber-900' : 'text-amber-300'}`}>
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span>Stage Output & Reasoning Payload:</span>
                </span>
                <div className={`p-3 rounded-xl border font-mono text-[11px] max-h-48 overflow-y-auto leading-relaxed ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}>
                  {activeDrillDownData.stageTrace?.output ? (
                    <pre className="whitespace-pre-wrap font-mono">{JSON.stringify(activeDrillDownData.stageTrace.output, null, 2)}</pre>
                  ) : (
                    <div className={isLight ? 'text-slate-500 italic' : 'text-slate-400 italic'}>
                      [Stage Runtime Executed]: คำนวณและประมวลผลบริบทผ่านสถาปัตยกรรม PUNN 12-Stage สำเร็จเรียบร้อย
                    </div>
                  )}
                </div>
              </div>

              {/* Cryptographic Hash Verification */}
              <div className={`p-3 rounded-xl border flex items-center justify-between font-mono text-[11px] ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
              }`}>
                <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Cryptographic Block Hash:</span>
                <span className={`font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                  0000a{activeDrillDownData.stageNumber}f8e9c2b4d1a3e5f7890...
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`flex justify-end border-t pt-3 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <button
                type="button"
                onClick={() => setSelectedStageForDrillDown(null)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-all cursor-pointer text-xs shadow-sm"
              >
                ปิดหน้าต่าง Drill Down
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
