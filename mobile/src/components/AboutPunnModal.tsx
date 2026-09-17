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

interface Props {
  visible: boolean;
  onClose: () => void;
}

const CANONICAL_STAGES = [
  {
    num: '01',
    phase: 'Thinking',
    phaseColor: '#38bdf8',
    nameEn: 'Intent Definition',
    nameTh: 'การระบุเจตนาและความต้องการ',
    icon: '🎯',
    description: 'ถอดรหัสความต้องการที่แท้จริงของผู้ใช้ ระบุเป้าหมาย สัญญาณความต้องการ จัดระเบียบความคาดหวัง และแยกแยะคำสั่งเชิงยุทธศาสตร์ออกจากคำถามทั่วไป',
  },
  {
    num: '02',
    phase: 'Thinking',
    phaseColor: '#38bdf8',
    nameEn: 'Context Understanding',
    nameTh: 'การทำความเข้าใจบริบทและข้อจำกัด',
    icon: '🌐',
    description: 'วิเคราะห์บริบทแวดล้อม เงื่อนไขเฉพาะ กฎหมาย/ข้อบังคับอุตสาหกรรม กรอบเวลา งบประมาณ และระบุตัวแสดงหลัก (Stakeholder Boundaries)',
  },
  {
    num: '03',
    phase: 'Thinking',
    phaseColor: '#38bdf8',
    nameEn: 'Purpose & Scope',
    nameTh: 'การกำหนดวัตถุประสงค์และขอบเขต',
    icon: '📐',
    description: 'กำหนดขอบเขตของการวิเคราะห์ (In-Scope vs. Out-of-Scope) ป้องกัน Scope Creep และกำหนดเกณฑ์ความสำเร็จ (Success Criteria)',
  },
  {
    num: '04',
    phase: 'Reasoning',
    phaseColor: '#a855f7',
    nameEn: 'Data Structuring & LTM',
    nameTh: 'การจัดโครงสร้างข้อมูลและการดึงความจำ',
    icon: '🗄️',
    description: 'จัดระเบียบข้อมูลนำเข้าเป็นคลังสารสนเทศที่มีโครงสร้าง ดึงข้อมูลหน่วยความจำระยะยาว (Long-Term Memory) ผ่าน Hard Relevance Gate เพื่อป้องกัน Memory Pollution',
  },
  {
    num: '05',
    phase: 'Reasoning',
    phaseColor: '#a855f7',
    nameEn: 'Relationship Modeling & DAG',
    nameTh: 'แบบจำลองความสัมพันธ์เชิงตรรกะ',
    icon: '🕸️',
    description: 'สร้างกราฟ Directed Acyclic Graph (DAG) และแบบจำลองความสัมพันธ์เชิงเหตุผล (Causal Modeling) ระหว่างตัวแปร ปัจจัยขับเคลื่อน และผลกระทบ',
  },
  {
    num: '06',
    phase: 'Reasoning',
    phaseColor: '#a855f7',
    nameEn: 'Hypothesis Formation (ACH)',
    nameTh: 'สมมติฐานทางเลือกคู่ขนาน ACH',
    icon: '⚖️',
    description: 'สร้างชุดสมมติฐานทางเลือกคู่ขนาน (H1, H2, H3) ตามระเบียบวิธี Analysis of Competing Hypotheses พร้อมคำนวณ Prior Probability เพื่อป้องกัน Confirmation Bias',
  },
  {
    num: '07',
    phase: 'Decision',
    phaseColor: '#f59e0b',
    nameEn: 'Evidence Evaluation & Taxonomy',
    nameTh: 'ประเมินและจำแนกหลักฐานเชิงประจักษ์',
    icon: '🔍',
    description: 'ตรวจสอบความถูกต้องของหลักฐาน ถ่วงน้ำหนักความน่าเชื่อถือ และติดป้ายกำกับตาม Epistemic Taxonomy ([FACT], [INFERENCE], [UNKNOWN] ฯลฯ)',
  },
  {
    num: '08',
    phase: 'Decision',
    phaseColor: '#f59e0b',
    nameEn: 'Risk & Critique Analysis',
    nameTh: 'วิเคราะห์ความเสี่ยงและจุดวิพากษ์',
    icon: '🛡️',
    description: 'จำลองการโจมตีเชิงตรรกะ (Red Team AI / Vulnerability Critique) ระบุจุดบอด (Blind Spots) และประเมินความเสี่ยงขาลง (Downside Risks)',
  },
  {
    num: '09',
    phase: 'Decision',
    phaseColor: '#f59e0b',
    nameEn: 'Strategic Options & Calibration',
    nameTh: 'สังเคราะห์ทางเลือกเชิงยุทธศาสตร์',
    icon: '📊',
    description: 'เปรียบเทียบทางเลือกเชิงยุทธศาสตร์ วิเคราะห์ Trade-offs คำนวณ Calibrated Confidence Score แบบ Bayesian และประเมินความคุ้มค่า (Expected Value)',
  },
  {
    num: '10',
    phase: 'Reflecting',
    phaseColor: '#10b981',
    nameEn: 'Analysis Communication',
    nameTh: 'การสื่อสารบทวิเคราะห์ผู้บริหาร',
    icon: '📑',
    description: 'สังเคราะห์บทวิเคราะห์เป็น Executive Decision Dossier สื่อสารชัดเจน กระชับ พร้อม Real-time Epistemic Transparency Stream และ Actionable Next Steps',
  },
  {
    num: '11',
    phase: 'Reflecting',
    phaseColor: '#10b981',
    nameEn: 'Review & Verification',
    nameTh: 'การทบทวนและตรวจสอบความสอดคล้อง',
    icon: '✅',
    description: 'ทบทวนกระบวนการคิดทั้งหมด (Meta-Reflection) ตรวจสอบความถูกต้องตามกฎ Anti-Fabrication และความสอดคล้องกับมาตรฐาน ISO 42001 & NIST AI RMF',
  },
  {
    num: '12',
    phase: 'Reflecting',
    phaseColor: '#10b981',
    nameEn: 'Continuous Improvement & Human Gate',
    nameTh: 'ปรับปรุงอย่างต่อเนื่องและเคารพ Human Agency',
    icon: '🔥',
    description: 'บันทึกบทเรียนเพื่อพัฒนาองค์ความรู้ และหยุดรอการตัดสินใจขั้นสุดท้ายจากมนุษย์ (Level-3 Hard Stop Safety Gate) สงวนอำนาจการตัดสินใจไว้ที่มนุษย์ 100%',
  },
];

export default function AboutPunnModal({ visible, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'about' | 'architecture' | 'governance'>('about');

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.logoBox}>
                <Text style={styles.logoIcon}>🔥</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>PUNN Cognitive Architecture</Text>
                <Text style={styles.headerSubtitle}>Decision Intelligence & AI Governance</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'about' && styles.tabBtnActive]}
              onPress={() => setActiveTab('about')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'about' && styles.tabBtnTextActive]}>
                🏛️ About PUNN
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'architecture' && styles.tabBtnActive]}
              onPress={() => setActiveTab('architecture')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'architecture' && styles.tabBtnTextActive]}>
                ⚙️ 12-Stage Pipeline
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'governance' && styles.tabBtnActive]}
              onPress={() => setActiveTab('governance')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'governance' && styles.tabBtnTextActive]}>
                🛡️ AI Governance
              </Text>
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
            {activeTab === 'about' && (
              <View style={styles.section}>
                <View style={styles.cardHighlight}>
                  <Text style={styles.cardHighlightTitle}>วิสัยทัศน์ของ PUNN & FIRE KEEPER</Text>
                  <Text style={styles.cardHighlightDesc}>
                    <Text style={styles.bold}>PUNN (Practical Unified Neural & Non-neural architecture)</Text> คือสถาปัตยกรรมทางปัญญาประดิษฐ์และระบบการให้เหตุผลขั้นสูง ออกแบบมาเพื่อยกระดับ AI จากระบบถาม-ตอบทั่วไป (Chatbot) สู่ <Text style={styles.bold}>"ชั้นปัญญาการตัดสินใจและธรรมาภิบาลระดับองค์กร (Decision Intelligence & AI Governance Layer)"</Text>
                  </Text>
                </View>

                <View style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>🔥 ปรัชญาหลัก: ผู้ปกปักรักษาเปลวเพลิง</Text>
                  <Text style={styles.quoteText}>
                    "The Keeper Never Assumes Ownership of the Flame — ผู้ปกปักรักษาเปลวเพลิงมีหน้าที่คอยเติมเชื้อไฟและควบคุมความปลอดภัย แต่ไม่ยึดเปลวไฟมาเป็นของตนเอง"
                  </Text>
                  <Text style={styles.infoCardDesc}>
                    ระบบ FIRE KEEPER ทำหน้าที่เป็นเสมือนหัวหน้าฝ่ายกลยุทธ์ (Chief Strategy & Risk Officer) คอยให้เหตุผล วิเคราะห์จุดบอด และตรวจสอบหลักฐาน แต่จะไม่บังคับชี้นำ หรือตัดสินใจแทนมนุษย์ การตัดสินใจสูงสุด (Human Agency) ยังคงเป็นสิทธิ์ขาดของผู้ใช้ 100%
                  </Text>
                </View>

                <View style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>🎯 ความแตกต่างจาก AI ทั่วไป</Text>
                  <View style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>
                      <Text style={styles.bold}>แยกแยะข้อเท็จจริง vs สมมติฐาน:</Text> ติดป้ายกำกับสารสนเทศ 14 ชั้น ไม่ปะปนการคาดเดาเข้ากับข้อเท็จจริง
                    </Text>
                  </View>
                  <View style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>
                      <Text style={styles.bold}>ไม่เดาตัวเลขความมั่นใจ (Anti-Hallucination):</Text> หากไม่มีหลักฐานชัดเจน จะแจ้งสถานะ Epistemic Quarantine และระบุ N/A ตรงไปตรงมา
                    </Text>
                  </View>
                  <View style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>
                      <Text style={styles.bold}>ตรวจสอบย้อนกลับได้ทุกขั้นตอน:</Text> มีระบบบันทึกร่องรอยการตัดสินใจ (Execution Trace & Decision Audit Trail)
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'architecture' && (
              <View style={styles.section}>
                <Text style={styles.sectionHeaderTitle}>ผัง 12 ขั้นตอนการให้เหตุผลเชิงปัญญา (PCA 12-Stage Pipeline)</Text>
                <Text style={styles.sectionHeaderSub}>
                  แบ่งออกเป็น 4 ระยะการทำงานหลัก: Thinking ➔ Reasoning ➔ Decision ➔ Reflecting
                </Text>

                <View style={styles.stagesList}>
                  {CANONICAL_STAGES.map((s) => (
                    <View key={s.num} style={styles.stageItem}>
                      <View style={styles.stageTop}>
                        <View style={styles.stageIconBox}>
                          <Text style={styles.stageIcon}>{s.icon}</Text>
                        </View>
                        <View style={styles.stageTitleBox}>
                          <View style={styles.stageBadgeRow}>
                            <Text style={styles.stageNumber}>STAGE {s.num}</Text>
                            <View style={[styles.phaseBadge, { backgroundColor: s.phaseColor + '20', borderColor: s.phaseColor + '50' }]}>
                              <Text style={[styles.phaseBadgeText, { color: s.phaseColor }]}>{s.phase}</Text>
                            </View>
                          </View>
                          <Text style={styles.stageNameEn}>{s.nameEn}</Text>
                          <Text style={styles.stageNameTh}>{s.nameTh}</Text>
                        </View>
                      </View>
                      <Text style={styles.stageDescription}>{s.description}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {activeTab === 'governance' && (
              <View style={styles.section}>
                <View style={styles.cardHighlight}>
                  <Text style={styles.cardHighlightTitle}>กฎเหล็กของระบบธรรมาภิบาล (Core Invariant)</Text>
                  <Text style={styles.goldenRule}>IMPLEMENTED ≠ VERIFIED ≠ CERTIFIED</Text>
                  <Text style={styles.cardHighlightDesc}>
                    สิ่งที่ระบบ "เขียนขึ้นมาได้" ไม่ได้แปลว่า "ได้รับการตรวจสอบแล้ว" และสิ่งที่ "ตรวจสอบแล้ว" ไม่ได้แปลว่า "ได้รับการรับรองอย่างเป็นทางการ" ความน่าเชื่อถือของผลลัพธ์ขึ้นอยู่กับคุณภาพของหลักฐานเชิงประจักษ์เท่านั้น
                  </Text>
                </View>

                <View style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>🛡️ การปฏิบัติตามมาตรฐานสากล (Compliance Standards)</Text>
                  <View style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>1.</Text>
                    <Text style={styles.bulletText}>
                      <Text style={styles.bold}>ISO/IEC 42001:2023:</Text> มาตรฐานระบบการจัดการปัญญาประดิษฐ์ระดับสากล (Artificial Intelligence Management System - AIMS)
                    </Text>
                  </View>
                  <View style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>2.</Text>
                    <Text style={styles.bulletText}>
                      <Text style={styles.bold}>NIST AI Risk Management Framework (AI RMF 1.0):</Text> กรอบการบริหารจัดการความเสี่ยง AI ด้านความโปร่งใส ความถูกต้อง และความรับผิดชอบ
                    </Text>
                  </View>
                  <View style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>3.</Text>
                    <Text style={styles.bulletText}>
                      <Text style={styles.bold}>พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA):</Text> ปฏิบัติตามหลักเกณฑ์ความปลอดภัยของข้อมูลส่วนบุคคลและข้อมูลองค์กรอย่างเข้มงวด
                    </Text>
                  </View>
                </View>

                <View style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>⚖️ Epistemic Quarantine Protocol</Text>
                  <Text style={styles.infoCardDesc}>
                    หากคำสั่งนั้นยังไม่มีการยืนยันแหล่งที่มา หรือสารสนเทศสำคัญขาดหายไป ระบบจะเข้าสู่โหมด "กักกันเชิงญาณวิทยา" โดยไม่ผลิตคะแนนความมั่นใจขึ้นมาเอง พร้อมทั้งระบุข้อสรุปเป็น <Text style={styles.bold}>NOT VERIFIED</Text> เพื่อเตือนผู้บริหารให้สอบทานข้อเท็จจริงเพิ่มเติม
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Close */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.closeActionBtn} activeOpacity={0.7}>
              <Text style={styles.closeActionBtnText}>รับทราบและปิดหน้าต่าง</Text>
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
    gap: 10,
    flex: 1,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#f973161a',
    borderWidth: 1,
    borderColor: '#f9731640',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 1,
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
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#1e293b40',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
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
  section: {
    gap: 12,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
  },
  sectionHeaderSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: -4,
    marginBottom: 4,
  },
  cardHighlight: {
    backgroundColor: '#0c1a2e',
    borderWidth: 1,
    borderColor: '#0284c750',
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  cardHighlightTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38bdf8',
  },
  cardHighlightDesc: {
    fontSize: 11.5,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  goldenRule: {
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: '#f59e0b',
    letterSpacing: 1,
    marginVertical: 4,
  },
  bold: {
    fontWeight: '700',
    color: '#f8fafc',
  },
  infoCard: {
    backgroundColor: '#0c1322',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  infoCardTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#f8fafc',
  },
  infoCardDesc: {
    fontSize: 11.5,
    color: '#94a3b8',
    lineHeight: 17,
  },
  quoteText: {
    fontSize: 11.5,
    fontStyle: 'italic',
    color: '#fbbf24',
    lineHeight: 17,
    backgroundColor: '#f59e0b10',
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    padding: 8,
    borderRadius: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  bulletDot: {
    fontSize: 12,
    color: '#f59e0b',
    lineHeight: 17,
  },
  bulletText: {
    flex: 1,
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },
  stagesList: {
    gap: 10,
  },
  stageItem: {
    backgroundColor: '#0c1322',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  stageTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stageIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageIcon: {
    fontSize: 16,
  },
  stageTitleBox: {
    flex: 1,
  },
  stageBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  stageNumber: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: '#94a3b8',
  },
  phaseBadge: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  phaseBadgeText: {
    fontSize: 8.5,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  stageNameEn: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
  },
  stageNameTh: {
    fontSize: 10.5,
    color: '#64748b',
  },
  stageDescription: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
    marginTop: 2,
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: '#0c1322',
  },
  closeActionBtn: {
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
  closeActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
});
