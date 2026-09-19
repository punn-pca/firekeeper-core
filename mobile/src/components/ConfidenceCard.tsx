import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ConfidenceCalibration } from '../types/api';

interface Props {
  confidence?: ConfidenceCalibration | null;
  defaultExpanded?: boolean;
}

export default function ConfidenceCard({ confidence, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Defaults matching web authoritative behavior
  const conf: ConfidenceCalibration = confidence || {
    scorePercent: null,
    label: 'ไม่สามารถประเมินได้',
    formula: 'Posterior = Prior * (EvidenceQuality * SourceReliability) - ConflictPenalty - MissingInfoPenalty',
    evidenceQuality: null,
    sourceReliability: null,
    evidenceCoverage: 0,
    conflictPenalty: 0,
    missingInfoPenalty: null,
    epistemicQuarantineActive: true,
    quarantineReason: 'Strict Multi-Criteria Evidence Calibration: สารสนเทศยังไม่ครบถ้วน จึงถูกกักกันเชิงญาณวิทยา',
    empiricalCalibrationNote: 'Strict Evidence Boundary Calibration: ความเชื่อมั่นถูกสอบเทียบกับหลักฐานที่มีอยู่บางส่วน แต่ยังมีข้อจำกัดด้านความสมบูรณ์',
    verificationState: 'PARTIALLY_VERIFIED',
    verificationStatus: 'NOT_VERIFIED',
  };

  const rawStatus = conf.verificationState || conf.verificationStatus || 'PARTIALLY_VERIFIED';

  const formatStatus = (status: string, type: 'evidence' | 'conclusion' = 'evidence') => {
    if (type === 'conclusion') {
      const isHighConfidence = conf.scorePercent !== null && conf.scorePercent !== undefined && conf.scorePercent >= 75 && conf.label === 'สูง';
      if (isHighConfidence) return 'VERIFIED';
      return 'NOT VERIFIED';
    }

    switch (status) {
      case 'EMPIRICAL_VERIFIED':
      case 'VERIFIED':
        return 'VERIFIED';
      case 'PARTIALLY_VERIFIED':
        return 'PARTIAL';
      case 'SOURCE_CHECKED':
        return 'CHECKED';
      case 'SOURCE_FOUND':
        return 'SOURCE FOUND';
      case 'INSUFFICIENT_EVIDENCE':
        return 'INSUFFICIENT';
      case 'MODEL_KNOWLEDGE':
        return 'MODEL BASE';
      case 'STALE':
        return 'STALE';
      case 'CONFLICTED':
        return 'CONFLICTED';
      default:
        return status;
    }
  };

  const conclusionStatus = formatStatus(rawStatus, 'conclusion');
  const isConclusionVerified = conclusionStatus === 'VERIFIED';

  const formatMetric = (val: number | null | undefined, isPercent = false, isPenalty = false) => {
    if (val === null || val === undefined) return 'N/A';
    const num = isPercent ? (val * 100).toFixed(0) : val.toString();
    if (isPenalty && typeof val === 'number' && val > 0) return `-${num}%`;
    return `${num}%`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.gaugeIconBox}>
            <Text style={styles.gaugeIcon}>📐</Text>
          </View>
          <View style={styles.headerTitles}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Calibrated Confidence</Text>
              <View style={styles.pillEvidence}>
                <Text style={styles.pillEvidenceText}>EVIDENCE: {formatStatus(rawStatus, 'evidence')}</Text>
              </View>
              <View style={[styles.pillConclusion, isConclusionVerified ? styles.pillVerified : styles.pillNotVerified]}>
                <Text style={[styles.pillConclusionText, isConclusionVerified ? styles.pillVerifiedText : styles.pillNotVerifiedText]}>
                  CONCLUSION: {conclusionStatus}
                </Text>
              </View>
              {conf.epistemicQuarantineActive && (
                <View style={styles.pillQuarantine}>
                  <Text style={styles.pillQuarantineText}>🛡️ Epistemic Quarantine</Text>
                </View>
              )}
            </View>
            <Text style={styles.subtitle}>Strict Multi-Criteria Evidence Calibration</Text>
          </View>
        </View>

        {/* Score pill & expand toggle */}
        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          style={styles.scorePill}
          activeOpacity={0.7}
        >
          <Text style={styles.scorePillText}>
            {conf.scorePercent !== null && conf.scorePercent !== undefined ? `${conf.scorePercent}%` : 'N/A'} ({conf.label || 'ไม่สามารถประเมินได้'})
          </Text>
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>
      </View>

      {/* Expandable Section - Details, Metrics & Trace */}
      {expanded && (
        <View style={styles.expandedSection}>
          {conf.formula && (
            <View style={styles.formulaBox}>
              <Text style={styles.formulaLabel}>Formula:</Text>
              <Text style={styles.formulaText}>{conf.formula}</Text>
            </View>
          )}
          {conf.mathematicalProof && (
            <View style={styles.mathTraceBox}>
              <Text style={styles.mathTraceLabel}>Math Trace</Text>
              <Text style={styles.mathTraceText}>{conf.mathematicalProof}</Text>
            </View>
          )}
          {conf.epistemicQuarantineActive && conf.quarantineReason && (
            <View style={styles.quarantineBox}>
              <Text style={styles.quarantineLabel}>Quarantine</Text>
              <Text style={styles.quarantineText}>{conf.quarantineReason}</Text>
            </View>
          )}

          {/* 5 Metric Cards (Horizontal Scroll for Responsive 0-overflow) */}
          <View style={styles.metricsWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.metricsScroll}
            >
              {/* 1. Evidence Quality */}
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Evidence Quality</Text>
                <Text style={styles.metricValue}>
                  {formatMetric(conf.evidenceQuality, true)}
                </Text>
              </View>

              {/* 2. Source Reliability */}
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Source Reliability</Text>
                <Text style={styles.metricValue}>
                  {formatMetric(conf.sourceReliability, true)}
                </Text>
              </View>

              {/* 3. Evidence Coverage */}
              <View style={styles.metricCard}>
                <View style={styles.metricLabelRow}>
                  <Text style={styles.metricLabel}>Evidence Coverage</Text>
                  <Text style={styles.infoIcon}>ℹ️</Text>
                </View>
                <Text style={styles.metricValue}>
                  {formatMetric(conf.evidenceCoverage ?? (conf as any).evidenceCompleteness, true)}
                </Text>
              </View>

              {/* 4. Conflict Penalty */}
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Conflict Penalty</Text>
                <Text style={[styles.metricValue, styles.metricRose]}>
                  {formatMetric(conf.conflictPenalty, true, true)}
                </Text>
              </View>

              {/* 5. Missing Info Penalty */}
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Missing Info Penalty</Text>
                <Text style={[styles.metricValue, styles.metricRose]}>
                  {formatMetric(conf.missingInfoPenalty, true, true)}
                </Text>
              </View>
            </ScrollView>
          </View>

          {/* Evidence Validation Trace Box */}
          <View style={styles.traceBox}>
            <View style={styles.traceHeaderRow}>
              <View style={styles.traceBadge}>
                <Text style={styles.traceBadgeText}>⚖️ EVIDENCE VALIDATION TRACE</Text>
              </View>
              <Text style={styles.traceHeaderRight}>
                Confidence derived from calibrated weighting.
              </Text>
            </View>
            <Text style={styles.traceBody}>
              {conf.empiricalCalibrationNote ||
                'Strict Evidence Boundary Calibration: ความเชื่อมั่นถูกสอบเทียบกับหลักฐานที่มีอยู่จริงตามกรอบ PCA'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#07101e',
    borderColor: '#0284c740',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    width: '100%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b80',
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  gaugeIconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#0284c720',
    borderWidth: 1,
    borderColor: '#0284c750',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  gaugeIcon: {
    fontSize: 14,
  },
  headerTitles: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  title: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.2,
  },
  pillEvidence: {
    backgroundColor: '#f59e0b15',
    borderWidth: 1,
    borderColor: '#f59e0b40',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  pillEvidenceText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#fbbf24',
  },
  pillConclusion: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  pillNotVerified: {
    backgroundColor: '#f59e0b15',
    borderColor: '#f59e0b40',
  },
  pillVerified: {
    backgroundColor: '#10b98115',
    borderColor: '#10b98140',
  },
  pillConclusionText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  pillNotVerifiedText: {
    color: '#fbbf24',
  },
  pillVerifiedText: {
    color: '#34d399',
  },
  pillQuarantine: {
    backgroundColor: '#f59e0b15',
    borderWidth: 1,
    borderColor: '#f59e0b40',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  pillQuarantineText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#fbbf24',
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0c4a6e30',
    borderWidth: 1,
    borderColor: '#0284c750',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
  },
  scorePillText: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#38bdf8',
  },
  chevron: {
    fontSize: 8,
    color: '#38bdf8',
  },
  expandedSection: {
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b80',
  },
  formulaBox: {
    backgroundColor: '#03071280',
    borderWidth: 1,
    borderColor: '#0284c730',
    borderRadius: 6,
    padding: 6,
  },
  formulaLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  formulaText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#7dd3fc',
    marginTop: 2,
  },
  mathTraceBox: {
    backgroundColor: '#064e3b20',
    borderWidth: 1,
    borderColor: '#05966940',
    borderRadius: 6,
    padding: 6,
  },
  mathTraceLabel: {
    fontSize: 9,
    color: '#34d399',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  mathTraceText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#a7f3d0',
    marginTop: 2,
  },
  quarantineBox: {
    backgroundColor: '#78350f20',
    borderWidth: 1,
    borderColor: '#d9770640',
    borderRadius: 6,
    padding: 6,
  },
  quarantineLabel: {
    fontSize: 9,
    color: '#fbbf24',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  quarantineText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#fde68a',
    marginTop: 2,
  },
  metricsWrapper: {
    marginVertical: 10,
  },
  metricsScroll: {
    gap: 8,
    flexDirection: 'row',
  },
  metricCard: {
    width: 104,
    height: 64,
    backgroundColor: '#090f1d',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'space-between',
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  infoIcon: {
    fontSize: 9,
  },
  metricValue: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#f1f5f9',
  },
  metricRose: {
    color: '#f43f5e',
  },
  decisionStatusBox: {
    backgroundColor: '#0284c712',
    borderWidth: 1,
    borderColor: '#0284c735',
    borderRadius: 8,
    padding: 9,
    marginBottom: 8,
  },
  decisionStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  decisionStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  shieldIcon: {
    fontSize: 13,
  },
  decisionStatusTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7dd3fc',
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusBadgeNotVerified: {
    backgroundColor: '#f59e0b20',
    borderColor: '#f59e0b60',
  },
  statusBadgeVerified: {
    backgroundColor: '#10b98120',
    borderColor: '#10b98160',
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  statusBadgeNotVerifiedText: {
    color: '#fbbf24',
  },
  statusBadgeVerifiedText: {
    color: '#34d399',
  },
  decisionStatusNote: {
    fontSize: 9.5,
    fontStyle: 'italic',
    color: '#94a3b8',
    marginTop: 5,
    lineHeight: 14,
  },
  traceBox: {
    backgroundColor: '#0c4a6e20',
    borderWidth: 1,
    borderColor: '#0284c740',
    borderRadius: 8,
    padding: 9,
  },
  traceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  traceBadge: {
    backgroundColor: '#0284c730',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  traceBadgeText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#38bdf8',
  },
  traceHeaderRight: {
    fontSize: 9,
    color: '#38bdf8',
    fontStyle: 'italic',
  },
  traceBody: {
    fontSize: 10.5,
    color: '#bae6fd',
    lineHeight: 15,
  },
});
