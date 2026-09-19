import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  score: number; // 0.0 – 1.0
  compact?: boolean;
}

function getColor(score: number): string {
  if (score >= 0.8) return '#22c55e';  // green
  if (score >= 0.6) return '#84cc16';  // lime
  if (score >= 0.4) return '#f59e0b';  // amber
  if (score >= 0.2) return '#f97316';  // orange
  return '#ef4444';                     // red
}

export default function ConfidenceBar({ score, compact = false }: Props) {
  const clampedScore = Math.max(0, Math.min(1, score));
  const color = getColor(clampedScore);
  const percent = (clampedScore * 100).toFixed(compact ? 0 : 1);

  return (
    <View style={styles.container}>
      {!compact && (
        <View style={styles.header}>
          <Text style={styles.label}>Calibrated Confidence</Text>
          <Text style={[styles.percent, { color }]}>{percent}%</Text>
        </View>
      )}
      <View style={[styles.track, compact && styles.trackCompact]}>
        <View
          style={[
            styles.fill,
            compact && styles.fillCompact,
            { width: `${clampedScore * 100}%`, backgroundColor: color },
          ]}
        />
      </View>
      {compact && (
        <Text style={[styles.percentCompact, { color }]}>{percent}%</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: '#9ca3af', fontSize: 12 },
  percent: { fontSize: 14, fontWeight: '700' },
  track: { height: 10, backgroundColor: '#374151', borderRadius: 5, overflow: 'hidden' },
  trackCompact: { height: 6, borderRadius: 3 },
  fill: { height: '100%', borderRadius: 5 },
  fillCompact: { borderRadius: 3 },
  percentCompact: { fontSize: 11, fontWeight: '700', marginTop: 3 },
});
