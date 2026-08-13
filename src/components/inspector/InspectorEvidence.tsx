import React from 'react';
import { Search, Database } from 'lucide-react';
import { PCAState } from '../../types';
import { InspectorCard } from './InspectorCard';
import { EvidenceExplorer } from '../EvidenceExplorer';
import { MemoryEvolutionViewer } from '../MemoryEvolutionViewer';

interface InspectorEvidenceProps {
  pcaState: PCAState;
  activeWidgetIds: string[];
}

export const InspectorEvidence: React.FC<InspectorEvidenceProps> = ({
  pcaState,
  activeWidgetIds,
}) => {
  const renderEvidence = activeWidgetIds.includes('evidence_explorer');
  const renderMemories = activeWidgetIds.includes('ranked_memories');

  if (!renderEvidence && !renderMemories) return null;

  return (
    <div className="space-y-6">
      {/* Evidence Explorer & Citations */}
      {renderEvidence && (
        <InspectorCard
          title="Evidence Explorer & Citation Provenance"
          description="Source evidence, confidence levels, and citations"
          icon={<Search className="w-4 h-4 text-emerald-400" />}
        >
          <EvidenceExplorer
            evidenceList={pcaState.evidence_explorer}
            conflictResolutions={pcaState.conflict_resolutions}
          />
        </InspectorCard>
      )}

      {/* Memory Evolution & Reranking */}
      {renderMemories && (
        <InspectorCard
          title="Memory Evolution & Cross-Encoder Reranking"
          description="Retrieval relevance score & LTM memory impact"
          icon={<Database className="w-4 h-4 text-purple-400" />}
        >
          <MemoryEvolutionViewer
            memoryEvolution={pcaState.memory_evolution}
            rankedMemories={pcaState.ranked_memories}
            memoryImpacts={pcaState.memory_impacts}
          />
        </InspectorCard>
      )}
    </div>
  );
};
