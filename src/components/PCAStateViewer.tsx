import React from 'react';
import { PCAState } from '../types';
import { PCAStateSkeleton } from './Skeletons';
import { DynamicWidgetComposer } from './DynamicWidgetComposer';

interface PCAStateViewerProps {
  pcaState: PCAState;
}

export const PCAStateViewer: React.FC<PCAStateViewerProps> = ({ pcaState }) => {
  if (!pcaState) {
    return <PCAStateSkeleton />;
  }

  return (
    <DynamicWidgetComposer pcaState={pcaState} />
  );
};
