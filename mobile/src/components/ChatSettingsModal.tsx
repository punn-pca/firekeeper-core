import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  TextInput,
} from 'react-native';

export interface ChatConfig {
  model: string;
  tone: string;
  reasoningProfile: string;
  webSearch: boolean;
  deepReasoning: boolean;
  ltm: boolean;
  ollamaBaseUrl?: string;
}

export const AVAILABLE_MODELS = [
  {
    id: 'deepseek-chat',
    name: 'DeepSeek-V3 (Standard)',
    badge: 'Default · Fast',
    desc: 'โมเดลหลักสำหรับการตัดสินใจและประเมินผล รวดเร็วและแม่นยำสูง',
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek-R1 (Reasoner)',
    badge: 'Deep Thought',
    desc: 'โมเดลคิดวิเคราะห์เชิงลึก ให้เหตุผลรอบด้านสำหรับปัญหายากซับซ้อน',
  },
  {
    id: 'deepseek-v4-flash-vision-exp',
    name: 'DeepSeek Vision (v4 Flash)',
    badge: 'Vision Exp',
    desc: 'โมเดลความเร็วสูง รองรับข้อมูลภาพและเอกสารประกอบการตัดสินใจ',
  },
  {
    id: 'ollama:qwen3:4b',
    name: 'Ollama: Qwen 3 (4B)',
    badge: 'Local Engine · Ollama',
    desc: 'โมเดล Qwen 3 (4B) รันผ่าน Local / Ollama Endpoint (https://ollama.firekeeper.site)',
  },
  {
    id: 'ollama:qwen2.5:3b',
    name: 'Ollama: Qwen 2.5 (3B)',
    badge: 'Local Engine',
    desc: 'โมเดลขนาดกะทัดรัดสำหรับโหมดออฟไลน์หรือเซิร์ฟเวอร์ส่วนตัว',
  },
];

export const TONE_OPTIONS = [
  {
    id: 'Formal Architect',
    name: 'Formal Architect',
    desc: 'ภาษาทางการ สถาปนิกวิเคราะห์ มีโครงสร้างรัดกุม',
  },
  {
    id: 'Direct Expert',
    name: 'Direct Expert',
    desc: 'ตรงประเด็น สั้นกระชับ สรุปใจความและข้อตัดสินใจทันที',
  },
  {
    id: 'Empathetic Guide',
    name: 'Empathetic Guide',
    desc: 'เป็นมิตร เข้าอกเข้าใจ แนะนำทีละขั้นตอนอย่างละเอียด',
  },
];

export const REASONING_PROFILES = [
  {
    id: 'Auto',
    name: 'Auto · 12-Stage PCA',
    desc: 'ใช้กลไกวิเคราะห์ 12 ขั้นตอนของ PUNN Cognitive Architecture เต็มรูปแบบ',
  },
  {
    id: 'Chain-of-Thought',
    name: 'Chain-of-Thought',
    desc: 'แจกแจงขั้นตอนทางความคิดเป็นขั้นเป็นตอนอย่างเป็นระบบ',
  },
  {
    id: 'First Principles',
    name: 'First Principles',
    desc: 'วิเคราะห์แยกย่อยถึงสัจพจน์และแก่นข้อเท็จจริงพื้นฐาน',
  },
  {
    id: 'Monte Carlo Risk',
    name: 'Monte Carlo Risk',
    desc: 'จำลองฉากทัศน์ความเสี่ยงและทางเลือกได้เสียรอบด้าน',
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  config: ChatConfig;
  onChangeConfig: (newConfig: Partial<ChatConfig>) => void;
}

export default function ChatSettingsModal({
  visible,
  onClose,
  config,
  onChangeConfig,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconBox}>
                <Text style={styles.headerIcon}>⚙️</Text>
              </View>
              <View>
                <Text style={styles.title}>CHAT CONFIGURATION</Text>
                <Text style={styles.subtitle}>ปรับแต่งโมเดล โทนการตอบ และการคิดวิเคราะห์</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
            {/* 1. Model Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>1. AI MODEL (เลือกโมเดล AI)</Text>
              {AVAILABLE_MODELS.map((m) => {
                const isSelected = config.model === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    onPress={() => onChangeConfig({ model: m.id })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionTop}>
                      <Text style={[styles.optionName, isSelected && styles.optionNameSelected]}>
                        {m.name}
                      </Text>
                      <View style={[styles.badge, isSelected && styles.badgeSelected]}>
                        <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>
                          {m.badge}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.optionDesc}>{m.desc}</Text>
                  </TouchableOpacity>
                );
              })}

              {/* Ollama Endpoint Config */}
              {config.model.startsWith('ollama:') && (
                <View style={styles.ollamaBox}>
                  <View style={styles.ollamaHeader}>
                    <Text style={styles.ollamaTitle}>⚡ OLLAMA ENDPOINT</Text>
                    <TouchableOpacity
                      onPress={() => onChangeConfig({ ollamaBaseUrl: 'https://ollama.firekeeper.site' })}
                      style={styles.resetBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.resetBtnText}>Reset Default</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.ollamaInput}
                    value={config.ollamaBaseUrl || 'https://ollama.firekeeper.site'}
                    onChangeText={(val) => onChangeConfig({ ollamaBaseUrl: val })}
                    placeholder="https://ollama.firekeeper.site"
                    placeholderTextColor="#64748b"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text style={styles.ollamaNote}>
                    เชื่อมต่อไปยัง Ollama Server ที่ {config.ollamaBaseUrl || 'https://ollama.firekeeper.site'} สำหรับรันโมเดล {config.model.replace(/^ollama:/i, '')}
                  </Text>
                </View>
              )}
            </View>

            {/* 2. Tone Mode */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>2. TONE & PERSONA (โทนการตอบ)</Text>
              {TONE_OPTIONS.map((t) => {
                const isSelected = config.tone === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    onPress={() => onChangeConfig({ tone: t.id })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionTop}>
                      <Text style={[styles.optionName, isSelected && styles.optionNameSelected]}>
                        {t.name}
                      </Text>
                      {isSelected && <Text style={styles.checkmark}>✓ เลือกอยู่</Text>}
                    </View>
                    <Text style={styles.optionDesc}>{t.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 3. Reasoning Profile */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>3. REASONING PROFILE (การให้เหตุผล)</Text>
              {REASONING_PROFILES.map((rp) => {
                const isSelected = config.reasoningProfile === rp.id;
                return (
                  <TouchableOpacity
                    key={rp.id}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    onPress={() => onChangeConfig({ reasoningProfile: rp.id })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionTop}>
                      <Text style={[styles.optionName, isSelected && styles.optionNameSelected]}>
                        {rp.name}
                      </Text>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.optionDesc}>{rp.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 4. Feature Toggles */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>4. COGNITIVE CAPABILITIES (ฟังก์ชันเสริม)</Text>

              {/* Web Search */}
              <View style={styles.toggleRow}>
                <View style={styles.toggleTextCol}>
                  <Text style={styles.toggleTitle}>🌐 Live Web Search</Text>
                  <Text style={styles.toggleDesc}>
                    ดึงข้อมูลสดจากอินเทอร์เน็ตแบบเรียลไทม์เพื่อเพิ่มน้ำหนักหลักฐาน
                  </Text>
                </View>
                <Switch
                  value={config.webSearch}
                  onValueChange={(val) => onChangeConfig({ webSearch: val })}
                  trackColor={{ false: '#334155', true: '#0284c7' }}
                  thumbColor={config.webSearch ? '#38bdf8' : '#94a3b8'}
                />
              </View>

              {/* Deep Reasoning */}
              <View style={styles.toggleRow}>
                <View style={styles.toggleTextCol}>
                  <Text style={styles.toggleTitle}>⚡ Deep Reasoning Mode</Text>
                  <Text style={styles.toggleDesc}>
                    เปิดโหมดวิเคราะห์ขยายมิติความคิด พร้อมทดสอบสมมติฐานแข่งขัน (ACH)
                  </Text>
                </View>
                <Switch
                  value={config.deepReasoning}
                  onValueChange={(val) => onChangeConfig({ deepReasoning: val })}
                  trackColor={{ false: '#334155', true: '#b45309' }}
                  thumbColor={config.deepReasoning ? '#fbbf24' : '#94a3b8'}
                />
              </View>

              {/* LTM (Long-Term Memory) Mode */}
              <View style={styles.toggleRow}>
                <View style={styles.toggleTextCol}>
                  <View style={styles.toggleTitleRow}>
                    <Text style={styles.toggleTitle}>🧠 LTM Mode (Long-Term Memory)</Text>
                    <View style={styles.ltmBadge}>
                      <Text style={styles.ltmBadgeText}>PCA Stage 04</Text>
                    </View>
                  </View>
                  <Text style={styles.toggleDesc}>
                    ดึงและจัดโครงสร้างความจำระยะยาว LTM คัดกรองผ่าน Hard Relevance Gate
                  </Text>
                </View>
                <Switch
                  value={config.ltm}
                  onValueChange={(val) => onChangeConfig({ ltm: val })}
                  trackColor={{ false: '#334155', true: '#7c3aed' }}
                  thumbColor={config.ltm ? '#a855f7' : '#94a3b8'}
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>บันทึกและใช้งาน (Save & Close)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0b1120',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f59e0b1a',
    borderWidth: 1,
    borderColor: '#f59e0b33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: { fontSize: 16 },
  title: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
  },
  scrollBody: {
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingVertical: 14,
    gap: 18,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    color: '#f97316',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  optionCard: {
    backgroundColor: '#0e1526',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  optionCardSelected: {
    borderColor: '#f59e0b',
    backgroundColor: '#161e33',
  },
  optionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  optionName: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
  },
  optionNameSelected: {
    color: '#fbbf24',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#1e293b',
  },
  badgeSelected: {
    backgroundColor: '#f59e0b26',
  },
  badgeText: {
    color: '#94a3b8',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  badgeTextSelected: {
    color: '#fbbf24',
    fontWeight: '700',
  },
  optionDesc: {
    color: '#64748b',
    fontSize: 11,
    lineHeight: 15,
  },
  checkmark: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0e1526',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  toggleTextCol: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  toggleDesc: {
    color: '#64748b',
    fontSize: 11,
    lineHeight: 15,
  },
  ollamaBox: {
    backgroundColor: '#0c1322',
    borderWidth: 1,
    borderColor: '#f59e0b50',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  ollamaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ollamaTitle: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },
  resetBtn: {
    backgroundColor: '#f59e0b15',
    borderWidth: 1,
    borderColor: '#f59e0b40',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  resetBtnText: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    color: '#fbbf24',
    fontWeight: '700',
  },
  ollamaInput: {
    backgroundColor: '#060a14',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#f8fafc',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  ollamaNote: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 6,
    lineHeight: 14,
  },
  toggleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  ltmBadge: {
    backgroundColor: '#7c3aed26',
    borderWidth: 1,
    borderColor: '#7c3aed66',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  ltmBadgeText: {
    color: '#c084fc',
    fontSize: 10,
    fontWeight: '700',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: '#080d18',
  },
  saveBtn: {
    backgroundColor: '#f97316',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
