import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { getConversations, deleteConversation, Conversation } from '../api/client';
import AboutPunnModal from '../components/AboutPunnModal';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

interface QuickExample {
  id: string;
  icon: string;
  title: string;
  description: string;
  prompt: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
}

const QUICK_EXAMPLES: QuickExample[] = [
  {
    id: 'market-expansion',
    icon: '🎯',
    title: 'กลยุทธ์ขยายสู่ตลาดใหม่',
    description: 'ประเมินต้นทุน กฎหมาย คู่แข่ง และความเสี่ยง',
    prompt:
      'วิเคราะห์ความเป็นไปได้เชิงกลยุทธ์ในการขยายบริการ B2B สู่ตลาดใหม่ เปรียบเทียบทางเลือกและประเมินความเสี่ยง จุดคุ้มทุน และปัจจัยที่ควรตรวจสอบก่อนตัดสินใจ',
    badge: 'Strategic',
    badgeColor: '#34d399',
    badgeBg: '#10b9811a',
    badgeBorder: '#10b98140',
  },
  {
    id: 'treasury-risk',
    icon: '🛡️',
    title: 'ความเสี่ยงสภาพคล่อง',
    description: 'เปรียบเทียบทางเลือกด้านเงินทุนและกระแสเงินสด',
    prompt:
      'ประเมินความเสี่ยงสภาพคล่องทางการเงินภายใต้ภาวะอัตราดอกเบี้ยผันผวน เปรียบเทียบทางเลือกการระดมทุนและผลกระทบต่อสภาพคล่อง',
    badge: 'Risk / Treasury',
    badgeColor: '#f87171',
    badgeBg: '#ef44441a',
    badgeBorder: '#ef444440',
  },
  {
    id: 'price-war',
    icon: '⚖️',
    title: 'รับมือสงครามราคา',
    description: 'วิเคราะห์ churn, margin และทางเลือกเชิงกลยุทธ์',
    prompt:
      'วิเคราะห์ผลกระทบเมื่อคู่แข่งลดราคา 20% ประเมิน churn rate ความยืดหยุ่นของกำไร และทางเลือกในการรับมือโดยไม่ทำลาย brand equity',
    badge: 'Competitive',
    badgeColor: '#fbbf24',
    badgeBg: '#f59e0b1a',
    badgeBorder: '#f59e0b40',
  },
  {
    id: 'automation-ops',
    icon: '🔄',
    title: 'เปลี่ยนผ่านสู่ระบบอัตโนมัติ',
    description: 'ประเมิน ROI ความพร้อม และผลกระทบต่อทีม',
    prompt:
      'ประเมินความพร้อมขององค์กรในการนำระบบอัตโนมัติมาทดแทนงาน routine วิเคราะห์ ROI ความเสี่ยงด้านการเปลี่ยนแปลง และแผนดำเนินการแบบเป็นระยะ',
    badge: 'Operations',
    badgeColor: '#38bdf8',
    badgeBg: '#0284c71a',
    badgeBorder: '#0284c740',
  },
];

const PCA_STAGES = [
  'Context Understanding',
  'Stakeholder Assessment',
  'Logical Chain Analysis',
  'Conflict Identification',
  'External Anchoring',
  'Multi-Hypothesis (ACH)',
  'Evidence & Confidence',
  'Vulnerability Critique',
  'Strategic Recommendation',
  'Concrete Action Plan',
  'Meta-Reflection',
  'Human Approval Gate',
];

export default function HomeScreen({ navigation }: Props) {
  const { session, signOut, authMode } = useAuth();
  const [homePrompt, setHomePrompt] = useState('');
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  const authBadge =
    authMode === 'firebase'
      ? { label: '🔵 Google User', color: '#1d4ed8' }
      : { label: '👤 Guest Access', color: '#374151' };

  // Load recent conversations when screen is focused
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      (async () => {
        setIsLoadingHistory(true);
        try {
          const list = await getConversations();
          if (isMounted) {
            setRecentConversations(list.slice(0, 4));
          }
        } catch {
        } finally {
          if (isMounted) setIsLoadingHistory(false);
        }
      })();
      return () => {
        isMounted = false;
      };
    }, [])
  );

  const handleStartAnalysis = (promptText?: string) => {
    const textToSend = promptText || homePrompt.trim();
    if (textToSend) {
      setHomePrompt('');
      navigation.navigate('Chat', { initialPrompt: textToSend });
    } else {
      navigation.navigate('Chat', {});
    }
  };

  const handleDeleteSession = (id: string, title: string) => {
    Alert.alert('ลบประวัติการสนทนา', `คุณต้องการลบ "${title || 'เซสชันนี้'}" ใช่หรือไม่?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteConversation(id);
            setRecentConversations((prev) => prev.filter((c) => c.id !== id));
          } catch {
            Alert.alert('ข้อผิดพลาด', 'ไม่สามารถลบการสนทนาได้');
          }
        },
      },
    ]);
  };

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('th-TH', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Brand Hero Banner (Web-Parity 100%) */}
      <View style={styles.brandBanner}>
        <View style={styles.brandTopRow}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <View style={styles.brandTextContainer}>
            <Text style={styles.brandTaglineTop}>ENTERPRISE DECISION INTELLIGENCE</Text>
            <Text style={styles.brandTitle}>
              Think Deeper. <Text style={styles.brandTitleAmber}>Decide Safer.</Text>
            </Text>
          </View>
        </View>
        <Text style={styles.brandSubtitle}>
          Evidence-grounded AI สำหรับการตัดสินใจที่ซับซ้อน
        </Text>
        <Text style={styles.brandTagline}>
          พัฒนาบนฐาน PUNN Predictive Cognitive Architecture (PCA v3.0)
        </Text>

        {/* 4-Stage Horizontal Pipeline Flow (Web-Matching) */}
        <View style={styles.pipelineFlowRow}>
          <View style={[styles.pipelineStepBox, styles.pipelineStepContext]}>
            <Text style={[styles.pipelineStepTag, styles.pipelineTagCyan]}>CONTEXT</Text>
            <Text style={styles.pipelineStepText}>เข้าใจบริบท</Text>
          </View>
          <Text style={styles.pipelineArrow}>→</Text>
          <View style={[styles.pipelineStepBox, styles.pipelineStepEvidence]}>
            <Text style={[styles.pipelineStepTag, styles.pipelineTagAmber]}>EVIDENCE</Text>
            <Text style={styles.pipelineStepText}>ตรวจหลักฐาน</Text>
          </View>
          <Text style={styles.pipelineArrow}>→</Text>
          <View style={[styles.pipelineStepBox, styles.pipelineStepReasoning]}>
            <Text style={[styles.pipelineStepTag, styles.pipelineTagPurple]}>REASONING</Text>
            <Text style={styles.pipelineStepText}>คิดวิเคราะห์</Text>
          </View>
          <Text style={styles.pipelineArrow}>→</Text>
          <View style={[styles.pipelineStepBox, styles.pipelineStepDecision]}>
            <Text style={[styles.pipelineStepTag, styles.pipelineTagEmerald]}>DECISION</Text>
            <Text style={styles.pipelineStepText}>คุณตัดสินใจ</Text>
          </View>
        </View>
      </View>

      {/* User Status Card */}
      <View style={styles.userBadge}>
        <View style={styles.userAvatarBox}>
          <Text style={styles.userIcon}>👤</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{session?.user?.displayName ?? 'Guest User'}</Text>
          <View style={[styles.authBadge, { backgroundColor: authBadge.color }]}>
            <Text style={styles.authBadgeText}>{authBadge.label}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.signOutBtn} activeOpacity={0.7}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Quick Actions (ย้ายมาอยู่ด้านบนเหนือช่องแชท) */}
      <View style={styles.topActionsRow}>
        {/* 1. New Analysis */}
        <TouchableOpacity
          style={[styles.topActionCard, styles.topActionNewAnalysis]}
          onPress={() => navigation.navigate('Chat', {})}
          activeOpacity={0.75}
        >
          <View style={styles.topActionHeader}>
            <Text style={styles.topActionIcon}>💬</Text>
            <View style={styles.topActionBadge}>
              <Text style={styles.topActionBadgeText}>START NEW</Text>
            </View>
          </View>
          <Text style={styles.topActionTitle}>New Analysis</Text>
          <Text style={styles.topActionDesc}>เปิดเซสชันการให้เหตุผลใหม่</Text>
        </TouchableOpacity>

        {/* 2. Past Sessions */}
        <TouchableOpacity
          style={[styles.topActionCard, styles.topActionPastSessions]}
          onPress={() => navigation.navigate('Conversations')}
          activeOpacity={0.75}
        >
          <View style={styles.topActionHeader}>
            <Text style={styles.topActionIcon}>📜</Text>
            <View style={[styles.topActionBadge, styles.topActionBadgeHistory]}>
              <Text style={[styles.topActionBadgeText, styles.topActionBadgeTextHistory]}>HISTORY</Text>
            </View>
          </View>
          <Text style={styles.topActionTitle}>Past Sessions</Text>
          <Text style={styles.topActionDesc}>ดูประวัติการตัดสินใจย้อนหลัง</Text>
        </TouchableOpacity>

        {/* 3. About PUNN */}
        <TouchableOpacity
          style={[styles.topActionCard, styles.topActionAbout]}
          onPress={() => setIsAboutModalOpen(true)}
          activeOpacity={0.75}
        >
          <View style={styles.topActionHeader}>
            <Text style={styles.topActionIcon}>🏛️</Text>
            <View style={[styles.topActionBadge, styles.topActionBadgeAbout]}>
              <Text style={[styles.topActionBadgeText, styles.topActionBadgeTextAbout]}>PCA v3.0</Text>
            </View>
          </View>
          <Text style={styles.topActionTitle}>About PUNN</Text>
          <Text style={styles.topActionDesc}>สถาปัตยกรรมและธรรมาภิบาล</Text>
        </TouchableOpacity>
      </View>

      {/* Web-Style Direct Executive Prompt Box */}
      <View style={styles.promptCard}>
        <View style={styles.promptHeader}>
          <Text style={styles.promptHeaderIcon}>⚡</Text>
          <Text style={styles.promptHeaderTitle}>START EXECUTIVE ANALYSIS (เริ่มวิเคราะห์คำสั่งใหม่)</Text>
        </View>
        <TextInput
          style={styles.promptInput}
          placeholder="พิมพ์คำถาม ปัญหา หรือการตัดสินใจที่ต้องการวิเคราะห์..."
          placeholderTextColor="#64748b"
          value={homePrompt}
          onChangeText={setHomePrompt}
          multiline
        />
        <View style={styles.promptActionsRow}>
          <View style={styles.modelTag}>
            <Text style={styles.modelTagText}>🤖 DeepSeek-V3 PCA</Text>
          </View>
          <TouchableOpacity
            style={[styles.analyzeBtn, !homePrompt.trim() && styles.analyzeBtnEmpty]}
            onPress={() => handleStartAnalysis()}
            activeOpacity={0.8}
          >
            <Text style={styles.analyzeBtnText}>
              {homePrompt.trim() ? 'วิเคราะห์ทันที ➤' : 'เข้าสู่ห้องแชท ➤'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Chat Sessions (เลือกประวัติแชทได้โดยตรงจากหน้าจอปกติ) */}
      <View style={styles.recentSessionsSection}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <Text style={styles.sectionTitle}>RECENT SESSIONS (ประวัติแชทล่าสุด)</Text>
            <Text style={styles.sectionSubtitle}>แตะเพื่อเปิดอ่านหรือสนทนาต่อได้ทันที</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Conversations')}
            style={styles.viewAllBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllBtnText}>ดูทั้งหมด →</Text>
          </TouchableOpacity>
        </View>

        {isLoadingHistory ? (
          <View style={styles.historyLoader}>
            <ActivityIndicator size="small" color="#f59e0b" />
            <Text style={styles.historyLoaderText}>กำลังโหลดประวัติแชทล่าสุด...</Text>
          </View>
        ) : recentConversations.length > 0 ? (
          <View style={styles.recentList}>
            {recentConversations.map((c) => {
              const turnCount = c.turns?.length ?? c.messageCount ?? 0;
              const dateDisplay = formatTimestamp(c.updated_at || c.created_at || c.updatedAt || c.createdAt);
              return (
                <View key={c.id} style={styles.recentItem}>
                  <TouchableOpacity
                    style={styles.recentItemMain}
                    onPress={() =>
                      navigation.navigate('Chat', {
                        conversationId: c.id,
                        conversationTitle: c.title,
                      })
                    }
                    activeOpacity={0.75}
                  >
                    <View style={styles.recentItemLeft}>
                      <Text style={styles.recentItemIcon}>💬</Text>
                      <View style={styles.recentItemContent}>
                        <Text style={styles.recentItemTitle} numberOfLines={1}>
                          {c.title || 'Analysis Session'}
                        </Text>
                        <View style={styles.recentItemMeta}>
                          {dateDisplay ? (
                            <Text style={styles.recentItemTime}>{dateDisplay}</Text>
                          ) : null}
                          {turnCount > 0 ? (
                            <>
                              <Text style={styles.recentItemDot}>•</Text>
                              <Text style={styles.recentItemCount}>{turnCount} ข้อความ</Text>
                            </>
                          ) : null}
                        </View>
                      </View>
                    </View>
                    <Text style={styles.recentItemArrow}>›</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.recentItemDeleteBtn}
                    onPress={() => handleDeleteSession(c.id, c.title)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.recentItemDeleteIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyHistoryBox}>
            <Text style={styles.emptyHistoryText}>ยังไม่มีประวัติการวิเคราะห์ — เริ่มพิมพ์คำถามใหม่ได้ทันที</Text>
          </View>
        )}
      </View>

      {/* Quick Example Presets (จากหน้าเว็บ) */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderLeft}>
          <Text style={styles.sectionTitle}>EXECUTIVE DECISION PRESETS</Text>
          <Text style={styles.sectionSubtitle}>เทมเพลตกรณีศึกษาสำคัญจากระบบเว็บ</Text>
        </View>
      </View>
      <View style={styles.examplesGrid}>
        {QUICK_EXAMPLES.map((ex) => (
          <TouchableOpacity
            key={ex.id}
            style={styles.exampleCard}
            onPress={() => handleStartAnalysis(ex.prompt)}
            activeOpacity={0.75}
          >
            <View style={styles.exampleTop}>
              <Text style={styles.exampleIcon}>{ex.icon}</Text>
              <View
                style={[
                  styles.exampleBadge,
                  { backgroundColor: ex.badgeBg, borderColor: ex.badgeBorder },
                ]}
              >
                <Text style={[styles.exampleBadgeText, { color: ex.badgeColor }]}>{ex.badge}</Text>
              </View>
            </View>
            <Text style={styles.exampleTitle}>{ex.title}</Text>
            <Text style={styles.exampleDesc}>{ex.description}</Text>
            <Text style={styles.examplePromptAction}>แตะเพื่อวิเคราะห์กรณีนี้ →</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* PCA 12-Stage Pipeline */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderLeft}>
          <Text style={styles.sectionTitle}>PUNN Cognitive Architecture</Text>
          <Text style={styles.sectionSubtitle}>12-Stage Epistemic Reasoning Pipeline</Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsAboutModalOpen(true)}
          style={styles.readMoreBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.readMoreBtnText}>📖 อ่านสถาปัตยกรรมฉบับเต็ม →</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.pipelineCard}>
        {PCA_STAGES.map((stage, i) => (
          <View key={i} style={styles.stageRow}>
            <View style={styles.stageBadge}>
              <Text style={styles.stageNum}>{i + 1}</Text>
            </View>
            <Text style={styles.stageName}>{stage}</Text>
            {i < PCA_STAGES.length - 1 && <View style={styles.stageConnector} />}
          </View>
        ))}
      </View>

      {/* Core Principle Card */}
      <View style={styles.principleCard}>
        <Text style={styles.principleTitle}>Core Governance Principle</Text>
        <Text style={styles.principleText}>IMPLEMENTED ≠ VERIFIED ≠ CERTIFIED</Text>
        <Text style={styles.principleDesc}>
          Evidence quality determines confidence. Unknowns remain unknowns. Humans retain final decision authority.
        </Text>
        <TouchableOpacity
          onPress={() => setIsAboutModalOpen(true)}
          style={styles.learnMorePrincipleBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.learnMorePrincipleText}>รายละเอียดธรรมาภิบาลและการกำกับดูแล (ISO 42001) →</Text>
        </TouchableOpacity>
      </View>

      {/* About PUNN & Architecture Modal */}
      <AboutPunnModal
        visible={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070d18',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  brandBanner: {
    backgroundColor: '#0c1322',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  brandTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandLogo: {
    width: 44,
    height: 44,
  },
  brandTextContainer: {
    flex: 1,
  },
  brandTaglineTop: {
    fontSize: 9.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1.5,
  },
  brandTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  brandTitleAmber: {
    color: '#f59e0b',
  },
  brandSubtitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#e2e8f0',
    marginTop: 8,
  },
  brandTagline: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 16,
  },
  pipelineFlowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b80',
    gap: 4,
  },
  pipelineStepBox: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  pipelineStepContext: {
    backgroundColor: '#08334440',
    borderColor: '#06b6d440',
  },
  pipelineStepEvidence: {
    backgroundColor: '#451a0340',
    borderColor: '#f59e0b40',
  },
  pipelineStepReasoning: {
    backgroundColor: '#3b076440',
    borderColor: '#a855f740',
  },
  pipelineStepDecision: {
    backgroundColor: '#022c2240',
    borderColor: '#10b98140',
  },
  pipelineStepTag: {
    fontSize: 8.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pipelineTagCyan: { color: '#22d3ee' },
  pipelineTagAmber: { color: '#fbbf24' },
  pipelineTagPurple: { color: '#c084fc' },
  pipelineTagEmerald: { color: '#34d399' },
  pipelineStepText: {
    fontSize: 9.5,
    color: '#cbd5e1',
    marginTop: 2,
    fontWeight: '600',
  },
  pipelineArrow: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0c1322',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  userAvatarBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userIcon: {
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  authBadge: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    marginTop: 3,
  },
  authBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  signOutBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  signOutText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  topActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  topActionCard: {
    flex: 1,
    backgroundColor: '#0c1322',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 10,
    justifyContent: 'space-between',
    minHeight: 88,
  },
  topActionNewAnalysis: {
    borderColor: '#f9731640',
    backgroundColor: '#f9731610',
  },
  topActionPastSessions: {
    borderColor: '#0284c740',
    backgroundColor: '#0284c710',
  },
  topActionAbout: {
    borderColor: '#a855f740',
    backgroundColor: '#a855f710',
  },
  topActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  topActionIcon: {
    fontSize: 16,
  },
  topActionBadge: {
    backgroundColor: '#f9731620',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  topActionBadgeText: {
    fontSize: 7.5,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: '#f97316',
  },
  topActionBadgeHistory: {
    backgroundColor: '#0284c720',
  },
  topActionBadgeTextHistory: {
    color: '#38bdf8',
  },
  topActionBadgeAbout: {
    backgroundColor: '#a855f720',
  },
  topActionBadgeTextAbout: {
    color: '#c084fc',
  },
  topActionTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#f8fafc',
    marginTop: 2,
  },
  topActionDesc: {
    fontSize: 9.5,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 13,
  },
  promptCard: {
    backgroundColor: '#0c1322',
    borderWidth: 1,
    borderColor: '#f9731640',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  promptHeaderIcon: {
    fontSize: 14,
  },
  promptHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f97316',
    letterSpacing: 0.5,
  },
  promptInput: {
    backgroundColor: '#070d18',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    color: '#f8fafc',
    fontSize: 13,
    minHeight: 74,
    textAlignVertical: 'top',
  },
  promptActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modelTag: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modelTagText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#fbbf24',
    fontWeight: '700',
  },
  analyzeBtn: {
    backgroundColor: '#f97316',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  analyzeBtnEmpty: {
    backgroundColor: '#ea580c',
  },
  analyzeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  recentSessionsSection: {
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeaderLeft: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#e2e8f0',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 1,
  },
  viewAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewAllBtnText: {
    fontSize: 11,
    color: '#f97316',
    fontWeight: '700',
  },
  historyLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#0c1322',
    borderRadius: 10,
  },
  historyLoaderText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  recentList: {
    gap: 6,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c1322',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    overflow: 'hidden',
  },
  recentItemMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  recentItemDeleteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1016',
    borderLeftWidth: 1,
    borderLeftColor: '#331b26',
  },
  recentItemDeleteIcon: {
    fontSize: 15,
  },
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  recentItemIcon: {
    fontSize: 16,
  },
  recentItemContent: {
    flex: 1,
    minWidth: 0,
  },
  recentItemTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#f8fafc',
  },
  recentItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  recentItemTime: {
    fontSize: 10,
    color: '#64748b',
  },
  recentItemDot: {
    fontSize: 10,
    color: '#475569',
  },
  recentItemCount: {
    fontSize: 10,
    color: '#38bdf8',
    fontFamily: 'monospace',
  },
  recentItemArrow: {
    fontSize: 18,
    color: '#64748b',
    paddingLeft: 6,
  },
  emptyHistoryBox: {
    backgroundColor: '#0c1322',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 11,
    color: '#64748b',
  },
  examplesGrid: {
    gap: 8,
    marginBottom: 20,
  },
  exampleCard: {
    backgroundColor: '#0c1322',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
  },
  exampleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  exampleIcon: {
    fontSize: 18,
  },
  exampleBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  exampleBadgeText: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  exampleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  exampleDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  examplePromptAction: {
    fontSize: 10.5,
    color: '#f97316',
    fontWeight: '600',
    marginTop: 6,
  },
  readMoreBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  readMoreBtnText: {
    fontSize: 11,
    color: '#c084fc',
    fontWeight: '700',
  },
  pipelineCard: {
    backgroundColor: '#0c1322',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  stageBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f9731620',
    borderWidth: 1,
    borderColor: '#f9731660',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stageNum: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: '#f97316',
  },
  stageName: {
    fontSize: 11.5,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  stageConnector: {
    position: 'absolute',
    left: 10,
    top: 24,
    width: 2,
    height: 10,
    backgroundColor: '#1e293b',
  },
  principleCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#f59e0b40',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  principleTitle: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  principleText: {
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '900',
    color: '#f59e0b',
    marginVertical: 4,
    letterSpacing: 1,
  },
  principleDesc: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
  learnMorePrincipleBtn: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  learnMorePrincipleText: {
    fontSize: 10.5,
    color: '#38bdf8',
    fontWeight: '600',
  },
});
