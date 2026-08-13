import React, { useState, useEffect } from 'react';
import { PCAState } from '../types';
import { useTheme } from '../context/ThemeContext';
import { getThemeTokens } from '../utils/themeTokens';
import {
  classifyPCAState,
  ReportPerspective,
  ClassificationResult,
  ALL_COMPOSER_WIDGETS,
} from '../utils/reportClassifier';

import { InspectorHeader, UserPersona } from './inspector/InspectorHeader';
import { InspectorSummary } from './inspector/InspectorSummary';
import { InspectorMetrics } from './inspector/InspectorMetrics';
import { InspectorAnalysis } from './inspector/InspectorAnalysis';
import { InspectorEvidence } from './inspector/InspectorEvidence';
import { InspectorLogs } from './inspector/InspectorLogs';
import { InspectorTimeline } from './inspector/InspectorTimeline';
import { InspectorActions } from './inspector/InspectorActions';
import { InspectorSettings } from './inspector/InspectorSettings';

export type { UserPersona };

interface DynamicWidgetComposerProps {
  pcaState: PCAState;
}

export const DynamicWidgetComposer: React.FC<DynamicWidgetComposerProps> = ({
  pcaState,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const tokens = getThemeTokens(isLight);

  const [classification, setClassification] = useState<ClassificationResult>(() =>
    classifyPCAState(pcaState)
  );
  const [activePerspective, setActivePerspective] = useState<ReportPerspective>('executive');
  const [activePersona, setActivePersona] = useState<UserPersona>('ceo');
  const [activeWidgetIds, setActiveWidgetIds] = useState<string[]>([]);
  const [showCustomizer, setShowCustomizer] = useState<boolean>(false);

  useEffect(() => {
    const res = classifyPCAState(pcaState);
    setClassification(res);
    setActivePerspective(res.perspective);
    setActiveWidgetIds(res.activeWidgetIds);
  }, [pcaState]);

  const handleSelectPerspective = (p: ReportPerspective) => {
    setActivePerspective(p);
    if (p === 'executive') {
      setActiveWidgetIds(['executive_brief', 'alternative_decisions', 'confidence_calibration']);
    } else if (p === 'strategic_decision') {
      setActiveWidgetIds(['executive_brief', 'alternative_decisions', 'bayesian_hypotheses']);
    } else if (p === 'evidence_investigation') {
      setActiveWidgetIds(['evidence_explorer', 'knowledge_graph', 'ranked_memories', 'bayesian_hypotheses']);
    } else if (p === 'governance_risk') {
      setActiveWidgetIds(['governance_policies', 'human_agency', 'metacognition']);
    } else if (p === 'technical_pipeline') {
      setActiveWidgetIds(['pipeline_machine', 'stage_radar', 'execution_trace']);
    } else if (p === 'diagnostic_calibration') {
      setActiveWidgetIds(['confidence_calibration', 'metacognition', 'empirical_benchmark']);
    } else {
      setShowCustomizer(true);
    }
  };

  const handleSelectPersona = (persona: UserPersona) => {
    setActivePersona(persona);
    if (persona === 'ceo') {
      setActivePerspective('executive');
      setActiveWidgetIds(['executive_brief', 'alternative_decisions', 'confidence_calibration']);
    } else if (persona === 'analyst') {
      setActivePerspective('evidence_investigation');
      setActiveWidgetIds(['evidence_explorer', 'knowledge_graph', 'ranked_memories', 'bayesian_hypotheses']);
    } else if (persona === 'auditor') {
      setActivePerspective('governance_risk');
      setActiveWidgetIds(['governance_policies', 'human_agency', 'metacognition']);
    } else if (persona === 'developer') {
      setActivePerspective('technical_pipeline');
      setActiveWidgetIds(['pipeline_machine', 'stage_radar', 'execution_trace', 'empirical_benchmark']);
    }
  };

  const toggleWidget = (wId: string) => {
    setActivePerspective('custom_composer');
    if (activeWidgetIds.includes(wId)) {
      setActiveWidgetIds(activeWidgetIds.filter((id) => id !== wId));
    } else {
      setActiveWidgetIds([...activeWidgetIds, wId]);
    }
  };

  return (
    <div className={`max-w-[1440px] mx-auto rounded-xl border ${tokens.shadow} overflow-hidden font-sans my-4 ${
      isLight ? 'bg-[#F8FAFC] text-[#111827] border-[#E5E7EB]' : 'bg-[#0B1220] text-white border-white/10'
    }`}>
      {/* 1. Header Navigation & Identity */}
      <InspectorHeader
        title={classification.title}
        subtitle={classification.subtitle}
        confidenceScore={classification.confidenceScore}
        confidenceLabel={pcaState.confidence || 'สูง'}
        executionTimeMs={pcaState.execution_time_ms}
        activePersona={activePersona}
        onSelectPersona={handleSelectPersona}
        activePerspective={activePerspective}
        onSelectPerspective={handleSelectPerspective}
        activeWidgetCount={activeWidgetIds.length}
        showCustomizer={showCustomizer}
        onToggleCustomizer={() => setShowCustomizer(!showCustomizer)}
      />

      {/* Main Content Body */}
      <div className="p-6 space-y-5">
        {/* 2. Executive/Persona Briefing Summary */}
        <InspectorSummary
          pcaState={pcaState}
          classification={classification}
          activePersona={activePersona}
        />

        {/* 3. Key Metrics KPI Cards */}
        <InspectorMetrics
          metrics={pcaState.executive_dashboard}
          calibration={pcaState.confidence_calibration}
          bayesian={pcaState.bayesian}
          conflictCount={pcaState.conflict_resolutions?.length || 0}
        />

        {/* 4. Report Action Toolbar */}
        <InspectorActions
          onToggleCustomizer={() => setShowCustomizer(!showCustomizer)}
          showCustomizer={showCustomizer}
          activeWidgetCount={activeWidgetIds.length}
        />

        {/* 5. Customizer Checklist Panel */}
        {showCustomizer && (
          <InspectorSettings
            activeWidgetIds={activeWidgetIds}
            onToggleWidget={toggleWidget}
            onSelectAll={() => setActiveWidgetIds(ALL_COMPOSER_WIDGETS.map((w) => w.id))}
            onClearAll={() => setActiveWidgetIds([])}
          />
        )}

        {/* 6. Active Report Widgets */}
        {activeWidgetIds.length === 0 ? (
          <div className={`p-8 text-center text-xs font-mono space-y-2 border border-dashed rounded-xl ${
            isLight ? 'bg-white border-[#E5E7EB] text-[#6B7280]' : 'bg-[#111827] border-white/10 text-slate-400'
          }`}>
            <p>ยังไม่ได้เลือก Widget ใดๆ กรุณาเลือก Persona หรือเปิดเมนู Customize Widgets ด้านบน</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Core Decision Analysis */}
            <InspectorAnalysis
              pcaState={pcaState}
              activeWidgetIds={activeWidgetIds}
            />

            {/* Evidence & Citation Provenance */}
            <InspectorEvidence
              pcaState={pcaState}
              activeWidgetIds={activeWidgetIds}
            />

            {/* Governance, Safety & Audit Logs */}
            <InspectorLogs
              pcaState={pcaState}
              activeWidgetIds={activeWidgetIds}
            />

            {/* Technical Pipeline & Timeline Trace */}
            <InspectorTimeline
              pcaState={pcaState}
              activeWidgetIds={activeWidgetIds}
            />
          </div>
        )}
      </div>
    </div>
  );
};
