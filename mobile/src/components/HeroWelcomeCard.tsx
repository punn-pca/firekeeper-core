import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

interface Props {
  defaultCollapsed?: boolean;
}

export default function HeroWelcomeCard({ defaultCollapsed = false }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  if (isCollapsed) {
    return (
      <View style={styles.collapsedContainer}>
        <View style={styles.collapsedLeft}>
          <View style={styles.logoBadge}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoSmall}
              resizeMode="contain"
            />
          </View>
          <View>
            <Text style={styles.titleText}>FIRE KEEPER</Text>
            <Text style={styles.subText}>Decision Intelligence & AI Governance</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.toggleBtn}
          onPress={() => setIsCollapsed(false)}
          activeOpacity={0.7}
        >
          <Text style={styles.toggleBtnText}>DETAILS ▼</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cardHeader}>
        <View style={styles.logoBadgeLarge}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoMedium}
            resizeMode="contain"
          />
        </View>
        <View style={styles.headerTextCol}>
          <Text style={styles.titleLarge}>FIRE KEEPER</Text>
          <Text style={styles.tagline}>
            ชั้นการกำกับดูแลและปัญญาการตัดสินใจของ PUNN Cognitive Architecture (PCA)
          </Text>
        </View>
        <TouchableOpacity
          style={styles.toggleBtn}
          onPress={() => setIsCollapsed(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.toggleBtnText}>COLLAPSE ▲</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.descText}>
        จัดโครงสร้างการให้เหตุผล การใช้หลักฐานเชิงประจักษ์ (Empirical Evidence) การประเมินความไม่แน่นอน และระบบตรวจสอบความเสี่ยง 12 ขั้นตอน โดยมนุษย์ยังคงมีอำนาจตัดสินใจสูงสุดเสมอ
      </Text>

      <View style={styles.badgesRow}>
        <View style={styles.metaPill}>
          <Text style={styles.metaDot}>🟢</Text>
          <Text style={styles.metaPillText}>PCA 12-Stage Engine</Text>
        </View>
        <View style={styles.metaPill}>
          <Text style={styles.metaDot}>⚡</Text>
          <Text style={styles.metaPillText}>DeepSeek-V3 Reasoning</Text>
        </View>
        <View style={styles.metaPill}>
          <Text style={styles.metaDot}>🛡️</Text>
          <Text style={styles.metaPillText}>Epistemic Governance</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a0e17',
    borderWidth: 1,
    borderColor: '#21293a',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  logoBadgeLarge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f9731615',
    borderWidth: 1,
    borderColor: '#f9731633',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoMedium: {
    width: 28,
    height: 28,
  },
  headerTextCol: {
    flex: 1,
  },
  titleLarge: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: 11,
    color: '#f97316',
    marginTop: 2,
    fontWeight: '600',
  },
  descText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#94a3b8',
    marginBottom: 10,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131824',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  metaDot: {
    fontSize: 10,
  },
  metaPillText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  collapsedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0a0e17',
    borderWidth: 1,
    borderColor: '#21293a',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
  },
  collapsedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#f9731615',
    borderWidth: 1,
    borderColor: '#f9731633',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoSmall: {
    width: 18,
    height: 18,
  },
  titleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
  subText: {
    fontSize: 10,
    color: '#64748b',
  },
  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#151c2c',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#242f44',
  },
  toggleBtnText: {
    fontSize: 9,
    color: '#f97316',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
});
