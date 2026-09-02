import React from 'react';
import { InformationTaxonomyType, getTaxonomyMeta, normalizeTaxonomyType } from '../utils/taxonomyTokens';

export interface TaxonomyTagProps {
  type: InformationTaxonomyType | string;
  variant?: 'badge' | 'text' | 'chip';
  className?: string;
  showBracket?: boolean;
  customLabel?: string;
}

export const TaxonomyTag: React.FC<TaxonomyTagProps> = ({
  type,
  variant = 'badge',
  className = '',
  showBracket = true,
  customLabel,
}) => {
  const meta = getTaxonomyMeta(type);

  if (!meta) {
    // Fallback for unmapped tags
    const fallbackText = customLabel || (showBracket ? `[${type}]` : type);
    return (
      <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded border border-slate-500/30 text-slate-400 bg-slate-500/10 ${className}`}>
        {fallbackText}
      </span>
    );
  }

  const labelText = customLabel || (showBracket ? meta.label : meta.name);

  if (variant === 'text') {
    return (
      <span className={`font-mono font-bold text-xs ${meta.textClass} ${className}`}>
        {labelText}
      </span>
    );
  }

  if (variant === 'chip') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold font-mono shadow-sm transition-colors ${meta.badgeClass} ${className}`}>
        <span>{labelText}</span>
        <span className="text-[10px] opacity-75 font-sans">({meta.thLabel})</span>
      </span>
    );
  }

  return (
    <span className={`taxonomy-badge ${meta.badgeClass} ${className}`}>
      {labelText}
    </span>
  );
};
