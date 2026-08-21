import React from 'react';
import { Compass, GitMerge, Scale, Network, Landmark, BarChart3, Activity, Brain } from 'lucide-react';
import { PCAState } from '../../types';
import { InspectorCard } from './InspectorCard';
import { AlternativeDecisionsViewer } from '../AlternativeDecisionsViewer';
import { DecisionGraphViewer } from '../DecisionGraphViewer';
import { HypothesisBayesianViewer } from '../HypothesisBayesianViewer';
import { KnowledgeGraphViewer } from '../KnowledgeGraphViewer';
import { PCAv2Dashboard } from '../PCAv2Dashboard';
import { ExecutiveKpiDeck } from '../ExecutiveKpiDeck';
import { WhiteBoxInspector } from '../WhiteBoxInspector';

interface InspectorAnalysisProps {
  pcaState: PCAState;
  activeWidgetIds: string[];
}

export const InspectorAnalysis: React.FC<InspectorAnalysisProps> = ({
  pcaState,
  activeWidgetIds,
}) => {
  return (
    <div className="space-y-6">
      {/* 6-CORE EXECUTIVE KPI DECK */}
      {(activeWidgetIds.includes('executive_kpi_deck') || activeWidgetIds.includes('executive_brief')) && (
        <ExecutiveKpiDeck
          pcaState={pcaState}
          metrics={pcaState.executive_dashboard}
          calibration={pcaState.confidence_calibration}
        />
      )}

      {/* WHITE-BOX EXPLAINABILITY INSPECTOR */}
      {(activeWidgetIds.includes('whitebox_inspector') || activeWidgetIds.includes('bayesian_hypotheses')) && (
        <WhiteBoxInspector pcaState={pcaState} />
      )}

      {/* EXECUTIVE BRIEF & DASHBOARD */}
      {activeWidgetIds.includes('executive_brief') && (
        <InspectorCard
          title="Executive Cognitive Dashboard"
          description="High-level cognitive metrics, conflict resolution overview, and performance metrics"
          icon={<BarChart3 className="w-4 h-4 text-amber-500" />}
        >
          <PCAv2Dashboard
            pcaState={pcaState}
            metrics={pcaState.executive_dashboard}
            bayesian={pcaState.bayesian}
            reflection={pcaState.reflection_loop}
            confidenceCalibration={pcaState.confidence_calibration}
            conflictResolutions={pcaState.conflict_resolutions}
            memoryImpacts={pcaState.memory_impacts}
          />
        </InspectorCard>
      )}

      {/* STRATEGIC ALTERNATIVE DECISIONS */}
      {activeWidgetIds.includes('alternative_decisions') && (
        <InspectorCard
          title="Strategic Alternative Decisions & Trade-offs"
          description="Counterfactual analysis and evaluated decision alternatives"
          icon={<Compass className="w-4 h-4 text-amber-500" />}
        >
          <AlternativeDecisionsViewer
            alternativeDecisions={pcaState.alternative_decisions}
            conflictResolutions={pcaState.conflict_resolutions}
            purpose={pcaState.purpose}
            understanding={pcaState.understanding}
          />
        </InspectorCard>
      )}

      {/* DECISION GRAPH */}
      {activeWidgetIds.includes('decision_graph') && (
        <InspectorCard
          title="Decision Graph & Feedback Loops"
          description="Visual DAG representation of decision steps and causal relationships"
          icon={<GitMerge className="w-4 h-4 text-amber-500" />}
        >
          <DecisionGraphViewer graphData={pcaState.decision_graph} />
        </InspectorCard>
      )}

      {/* BAYESIAN HYPOTHESES */}
      {activeWidgetIds.includes('bayesian_hypotheses') && (
        <InspectorCard
          title="Hypotheses Matrix & Bayesian Belief Shift"
          description="Probabilistic prior to posterior belief progression"
          icon={<Scale className="w-4 h-4 text-amber-500" />}
        >
          <HypothesisBayesianViewer
            hypotheses={pcaState.hypotheses_v2}
            bayesian={pcaState.bayesian}
          />
        </InspectorCard>
      )}

      {/* KNOWLEDGE GRAPH */}
      {activeWidgetIds.includes('knowledge_graph') && (
        <InspectorCard
          title="Knowledge Graph Network Matrix"
          description="Entity relationships and memory citations"
          icon={<Network className="w-4 h-4 text-amber-500" />}
        >
          <KnowledgeGraphViewer graphData={pcaState.knowledge_graph} />
        </InspectorCard>
      )}
    </div>
  );
};
