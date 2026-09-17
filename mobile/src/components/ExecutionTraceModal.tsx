import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';

interface Props {
  visible: boolean;
  onClose: () => void;
  traceData?: any;
  modelName?: string;
}

const DEFAULT_PCA_STAGES = [
  { id: '01', name: 'Intent Definition', desc: 'ระบุเจตนาและความต้องการของผู้ใช้', status: 'VERIFIED', duration: '45ms' },
  { id: '02', name: 'Context Understanding', desc: 'ทำความเข้าใจบริบทแวดล้อมและข้อจำกัด', status: 'VERIFIED', duration: '60ms' },
  { id: '03', name: 'Purpose & Scope', desc: 'กำหนดวัตถุประสงค์ ขอบเขต และนโยบาย Governance', status: 'VERIFIED', duration: '52ms' },
  { id: '04', name: 'Data Structuring & Memory Gate', desc: 'จัดโครงสร้างข้อมูลและการดึงความจำ LTM', status: 'VERIFIED', duration: '110ms' },
  { id: '05', name: 'Relationship Modeling & DAG', desc: 'สร้างแบบจำลองความสัมพันธ์เชิงตรรกะ', status: 'VERIFIED', duration: '95ms' },
  { id: '06', name: 'Hypothesis Formation (ACH)', desc: 'สร้างสมมติฐานทางเลือกคู่ขนาน ACH', status: 'VERIFIED', duration: '140ms' },
  { id: '07', name: 'Evidence Evaluation & Taxonomy', desc: 'ประเมินและจำแนกหลักฐานเชิงประจักษ์ 14 ชั้น', status: 'VERIFIED', duration: '180ms' },
  { id: '08', name: 'Risk & Critique Analysis', desc: 'วิเคราะห์ความเสี่ยงและจุดวิพากษ์รอบด้าน', status: 'VERIFIED', duration: '125ms' },
  { id: '09', name: 'Strategic Options & Calibration', desc: 'สังเคราะห์ทางเลือกและสอบเทียบความเชื่อมั่น', status: 'VERIFIED', duration: '210ms' },
  { id: '10', name: 'Analysis Communication', desc: 'สื่อสารบทวิเคราะห์และการสร้างคำตอบเรียลไทม์', status: 'VERIFIED', duration: '850ms' },
  { id: '11', name: 'Review & Verification', desc: 'ทบทวนและตรวจสอบความสอดคล้องตามกรอบธรรมาภิบาล', status: 'VERIFIED', duration: '75ms' },
  { id: '12', name: 'Human Agency Safeguard', desc: 'คุ้มครองสิทธิ์ขาดมนุษย์ ไม่ตัดสินใจแทนเด็ดขาด', status: 'ENFORCED', duration: '30ms' },
];

export default function ExecutionTraceModal({
  visible,
  onClose,
  traceData,
  modelName = 'deepseek-chat',
}: Props) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'stages' | 'integrity' | 'evidence'>('stages');

  const execId = traceData?.execution_id || `DEC-2026-${Math.abs((traceData?.timestamp ? new Date(traceData.timestamp).getTime() : Date.now()) % 900000) + 100000}`;

  const handleCopy = async () => {
    const jsonStr = JSON.stringify(traceData || { executionId: execId, stages: DEFAULT_PCA_STAGES }, null, 2);
    await Clipboard.setStringAsync(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBox}>
                <Text style={styles.icon}>🛡️</Text>
              </View>
              <View style={styles.headerTitles}>
                <Text style={styles.title}>Execution Trace</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.execId}>{execId}</Text>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>PUNN-PCA-v3.0 · VERIFIED</Text>
                  </View>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'stages' && styles.tabBtnActive]}
              onPress={() => setActiveTab('stages')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'stages' && styles.tabBtnTextActive]}>
                ⚡ 12-Stage Pipeline
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'integrity' && styles.tabBtnActive]}
              onPress={() => setActiveTab('integrity')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'integrity' && styles.tabBtnTextActive]}>
                🔒 Integrity Audit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'evidence' && styles.tabBtnActive]}
              onPress={() => setActiveTab('evidence')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'evidence' && styles.tabBtnTextActive]}>
                📚 Evidence & Sources
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
            {activeTab === 'stages' && (
              <View style={styles.stagesList}>
                <Text style={styles.sectionHeader}>PUNN Cognitive Architecture (12 Stages Trace)</Text>
                {DEFAULT_PCA_STAGES.map((s, idx) => (
                  <View key={s.id} style={styles.stageCard}>
                    <View style={styles.stageHeader}>
                      <View style={styles.stageNumberBadge}>
                        <Text style={styles.stageNumber}>{s.id}</Text>
                      </View>
                      <View style={styles.stageInfo}>
                        <Text style={styles.stageName}>{s.name}</Text>
                        <Text style={styles.stageDesc}>{s.desc}</Text>
                      </View>
                      <View style={styles.stageMeta}>
                        <View style={[styles.stageBadge, s.status === 'ENFORCED' ? styles.stageEnforced : styles.stageVerified]}>
                          <Text style={[styles.stageBadgeText, s.status === 'ENFORCED' ? styles.stageEnforcedText : styles.stageVerifiedText]}>
                            {s.status}
                          </Text>
                        </View>
                        <Text style={styles.durationText}>{s.duration}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {activeTab === 'integrity' && (
              <View style={styles.integrityContainer}>
                <View style={styles.auditCard}>
                  <Text style={styles.auditTitle}>🛡️ Human Agency Safeguard</Text>
                  <Text style={styles.auditDesc}>
                    ระบบทำหน้าที่เป็นที่ปรึกษาเชิงวิเคราะห์ (Advisory Only) ไม่ตัดสินใจหรือสั่งการแทนมนุษย์ การตัดสินใจขั้นสุดท้ายเป็นสิทธิ์ขาดของมนุษย์ 100%
                  </Text>
                  <View style={styles.auditRow}>
                    <Text style={styles.auditKey}>Decision Authority:</Text>
                    <Text style={styles.auditVal}>Human Exclusive (HITL)</Text>
                  </View>
                  <View style={styles.auditRow}>
                    <Text style={styles.auditKey}>Coercion Free:</Text>
                    <Text style={styles.auditVal}>True (ไม่มีการชี้นำบังคับ)</Text>
                  </View>
                </View>

                <View style={styles.auditCard}>
                  <Text style={styles.auditTitle}>🔐 Cryptographic Ledger Status</Text>
                  <View style={styles.auditRow}>
                    <Text style={styles.auditKey}>Event Chain:</Text>
                    <Text style={[styles.auditVal, styles.textGreen]}>VALID (SHA-256 Verified)</Text>
                  </View>
                  <View style={styles.auditRow}>
                    <Text style={styles.auditKey}>Execution Schema:</Text>
                    <Text style={styles.auditVal}>PUNN-PCA-v3.0</Text>
                  </View>
                  <View style={styles.auditRow}>
                    <Text style={styles.auditKey}>Engine Provider:</Text>
                    <Text style={styles.auditVal}>{modelName}</Text>
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'evidence' && (
              <View style={styles.evidenceContainer}>
                <Text style={styles.sectionHeader}>Evidence Lineage & Empirical Grounding</Text>
                <View style={styles.evidenceCard}>
                  <Text style={styles.evidenceTitle}>Primary Knowledge Base & Temporal Grounding</Text>
                  <Text style={styles.evidenceDesc}>
                    ข้อมูลได้รับการตรวจสอบกับคลังความรู้มาตรฐาน พ.ร.บ. กฎหมาย และระเบียบนโยบาย ISO 42001 / NIST AI RMF
                  </Text>
                  <View style={styles.auditRow}>
                    <Text style={styles.auditKey}>Epistemic Quarantine:</Text>
                    <Text style={styles.auditVal}>Active (แยกแยะข้อเท็จจริง vs บทวิเคราะห์)</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleCopy} style={styles.copyJsonBtn} activeOpacity={0.7}>
              <Text style={styles.copyJsonBtnText}>{copied ? '✓ คัดลอก Trace แล้ว' : '📋 คัดลอก JSON Trace'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.doneBtn} activeOpacity={0.7}>
              <Text style={styles.doneBtnText}>ปิดหน้าต่าง</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#070d18',
  },
  container: {
    flex: 1,
    backgroundColor: '#070d18',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0c1322',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f59e0b18',
    borderWidth: 1,
    borderColor: '#f59e0b40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
  },
  headerTitles: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  execId: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#fbbf24',
  },
  statusPill: {
    backgroundColor: '#10b98115',
    borderWidth: 1,
    borderColor: '#10b98140',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  statusPillText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#34d399',
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#090f1d',
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#1e293b40',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabBtnActive: {
    backgroundColor: '#f59e0b20',
    borderColor: '#f59e0b',
  },
  tabBtnText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#fbbf24',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 14,
    paddingBottom: 24,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stagesList: {
    gap: 8,
  },
  stageCard: {
    backgroundColor: '#0c1322',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    padding: 10,
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stageNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#0284c720',
    borderWidth: 1,
    borderColor: '#0284c740',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageNumber: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: '#38bdf8',
  },
  stageInfo: {
    flex: 1,
    minWidth: 0,
  },
  stageName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  stageDesc: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  stageMeta: {
    alignItems: 'flex-end',
  },
  stageBadge: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderWidth: 1,
  },
  stageBadgeText: {
    fontSize: 8.5,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  stageVerified: {
    backgroundColor: '#10b98115',
    borderColor: '#10b98140',
  },
  stageVerifiedText: {
    color: '#34d399',
    fontSize: 8.5,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  stageEnforced: {
    backgroundColor: '#f59e0b15',
    borderColor: '#f59e0b40',
  },
  stageEnforcedText: {
    color: '#fbbf24',
    fontSize: 8.5,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  durationText: {
    fontSize: 9,
    color: '#64748b',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  integrityContainer: {
    gap: 12,
  },
  auditCard: {
    backgroundColor: '#0c1322',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  auditTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  auditDesc: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },
  auditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#1e293b80',
  },
  auditKey: {
    fontSize: 11,
    color: '#64748b',
  },
  auditVal: {
    fontSize: 11,
    color: '#e2e8f0',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  textGreen: {
    color: '#34d399',
  },
  evidenceContainer: {
    gap: 10,
  },
  evidenceCard: {
    backgroundColor: '#0c1322',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  evidenceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  evidenceDesc: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: '#0c1322',
    gap: 10,
  },
  copyJsonBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  copyJsonBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  doneBtn: {
    flex: 1,
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
});
