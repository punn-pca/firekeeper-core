import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { GovernanceResult, VERIFICATION_COLORS, VERIFICATION_LABELS } from '../types/api';
import ConfidenceBar from '../components/ConfidenceBar';

type Props = NativeStackScreenProps<RootStackParamList, 'Governance'>;

export default function GovernanceScreen({ route }: Props) {
  const gov = route.params.governance as GovernanceResult;
  const messageContent = route.params.messageContent as string;

  const riskColor = gov.hallucination_risk === 'LOW' ? '#22c55e' : gov.hallucination_risk === 'MEDIUM' ? '#f59e0b' : '#ef4444';
  const stateColor = VERIFICATION_COLORS[gov.verificationState] ?? '#6b7280';
  const stateLabel = VERIFICATION_LABELS[gov.verificationState] ?? gov.verificationState;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Summary cards */}
      <View style={styles.row}>
        <View style={[styles.metricCard, { borderColor: stateColor }]}>
          <Text style={styles.metricLabel}>Verification State</Text>
          <Text style={[styles.metricValue, { color: stateColor }]}>{stateLabel}</Text>
        </View>
        <View style={[styles.metricCard, { borderColor: riskColor }]}>
          <Text style={styles.metricLabel}>Hallucination Risk</Text>
          <Text style={[styles.metricValue, { color: riskColor }]}>{gov.hallucination_risk}</Text>
        </View>
      </View>

      {/* Confidence */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Calibrated Confidence Score</Text>
        <ConfidenceBar score={gov.calibratedConfidence} />
        <Text style={styles.scoreText}>{(gov.calibratedConfidence * 100).toFixed(1)}%</Text>
      </View>

      {/* PCA Progress */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>PCA Pipeline Progress</Text>
        <Text style={styles.cardSubtitle}>{gov.pca_stages_completed} / 12 stages completed</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(gov.pca_stages_completed / 12) * 100}%` }]} />
        </View>
      </View>

      {/* Temporal grounding */}
      {gov.temporal_grounding !== undefined && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Temporal Grounding</Text>
          <Text style={[styles.pill, { backgroundColor: gov.temporal_grounding ? '#14532d' : '#1f2937', color: gov.temporal_grounding ? '#22c55e' : '#9ca3af' }]}>
            {gov.temporal_grounding ? '✓ Temporally Anchored' : '○ No Temporal Sensitivity'}
          </Text>
        </View>
      )}

      {/* Evidence sources */}
      {gov.evidenceSources && gov.evidenceSources.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Evidence Sources</Text>
          {gov.evidenceSources.map((src, i) => (
            <View key={i} style={styles.sourceRow}>
              <Text style={styles.sourceDot}>•</Text>
              <Text style={styles.sourceText}>{src}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ACH Hypotheses */}
      {gov.ach_hypotheses && gov.ach_hypotheses.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ACH — Alternative Competing Hypotheses</Text>
          {gov.ach_hypotheses.map((hyp, i) => (
            <View key={i} style={styles.hypothesisCard}>
              <View style={styles.hypHeader}>
                <Text style={styles.hypText}>{hyp.hypothesis}</Text>
                <Text style={styles.hypProb}>{(hyp.probability * 100).toFixed(0)}%</Text>
              </View>
              <View style={styles.probBar}>
                <View style={[styles.probFill, { width: `${hyp.probability * 100}%` }]} />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Epistemic limitations */}
      {gov.epistemic_limitations && gov.epistemic_limitations.length > 0 && (
        <View style={[styles.card, styles.warningCard]}>
          <Text style={[styles.cardTitle, { color: '#f59e0b' }]}>⚠ Epistemic Limitations</Text>
          {gov.epistemic_limitations.map((lim, i) => (
            <Text key={i} style={styles.limitationText}>• {lim}</Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  content: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  metricCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricLabel: { color: '#9ca3af', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  metricValue: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  card: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2d2d2d' },
  warningCard: { borderColor: '#78350f', backgroundColor: '#1c1007' },
  cardTitle: { color: '#ffffff', fontWeight: '700', fontSize: 14, marginBottom: 8 },
  cardSubtitle: { color: '#6b7280', fontSize: 12, marginBottom: 8 },
  scoreText: { color: '#f97316', fontSize: 28, fontWeight: '900', textAlign: 'center', marginTop: 4 },
  progressBar: { height: 8, backgroundColor: '#374151', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#f97316', borderRadius: 4 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, fontSize: 13, fontWeight: '600', alignSelf: 'flex-start' },
  sourceRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  sourceDot: { color: '#f97316', fontSize: 16 },
  sourceText: { color: '#d1d5db', fontSize: 13, flex: 1, lineHeight: 20 },
  hypothesisCard: { backgroundColor: '#111111', borderRadius: 8, padding: 12, marginBottom: 8 },
  hypHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  hypText: { color: '#d1d5db', fontSize: 13, flex: 1, marginRight: 8 },
  hypProb: { color: '#f97316', fontWeight: '700', fontSize: 14 },
  probBar: { height: 6, backgroundColor: '#374151', borderRadius: 3, overflow: 'hidden' },
  probFill: { height: '100%', backgroundColor: '#f97316', borderRadius: 3 },
  limitationText: { color: '#fbbf24', fontSize: 13, lineHeight: 20, marginBottom: 4 },
});
