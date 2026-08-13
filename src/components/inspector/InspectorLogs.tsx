import React from 'react';
import { ShieldCheck, AlertOctagon, Scale } from 'lucide-react';
import { PCAState } from '../../types';
import { InspectorCard } from './InspectorCard';
import { GovernancePoliciesViewer } from '../GovernancePoliciesViewer';
import { HumanAgencyEnforcer } from '../HumanAgencyEnforcer';
import { ConfidenceCalibrationViewer } from '../ConfidenceCalibrationViewer';

interface InspectorLogsProps {
  pcaState: PCAState;
  activeWidgetIds: string[];
}

export const InspectorLogs: React.FC<InspectorLogsProps> = ({
  pcaState,
  activeWidgetIds,
}) => {
  const renderGovernance = activeWidgetIds.includes('governance_policies');
  const renderHumanAgency = activeWidgetIds.includes('human_agency');
  const renderConfidence = activeWidgetIds.includes('confidence_calibration');

  if (!renderGovernance && !renderHumanAgency && !renderConfidence) return null;

  return (
    <div className="space-y-6">
      {/* Governance & Policies */}
      {renderGovernance && (
        <InspectorCard
          title="Governance & Safety Policy Guard"
          description="Compliance verification with ISO 42001 & NIST AI RMF"
          icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
        >
          <GovernancePoliciesViewer
            policies={pcaState.governance_policies}
            conflicts={pcaState.conflict_resolutions}
            agencyEnforcement={pcaState.human_agency_enforcement}
          />
        </InspectorCard>
      )}

      {/* Human Agency Enforcer */}
      {renderHumanAgency && (
        <InspectorCard
          title="Enforced Human Agency Guard"
          description="Ensuring decision authority remains with human operator"
          icon={<AlertOctagon className="w-4 h-4 text-rose-400" />}
        >
          <HumanAgencyEnforcer pcaState={pcaState} />
        </InspectorCard>
      )}

      {/* Confidence Calibration */}
      {renderConfidence && (
        <InspectorCard
          title="Confidence Calibration & Uncertainty Diagnostics"
          description="ECE error metrics & model uncertainty evaluation"
          icon={<Scale className="w-4 h-4 text-sky-400" />}
        >
          <ConfidenceCalibrationViewer
            calibration={pcaState.confidence_calibration}
            uncertainty={pcaState.uncertainty_detection}
            rawConfidenceLabel={pcaState.confidence}
          />
        </InspectorCard>
      )}
    </div>
  );
};
