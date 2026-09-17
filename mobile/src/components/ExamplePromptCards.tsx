import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export interface SamplePrompt {
  id: string;
  title: string;
  subtitle: string;
  prompt: string;
  icon: string;
  tag: string;
  tagColor: string;
  tagBg: string;
  tagBorder: string;
}

export const SAMPLE_PROMPTS: SamplePrompt[] = [
  {
    id: 'analyze-decision',
    title: 'Analyze Decision',
    subtitle: 'วิเคราะห์การตัดสินใจลงทุนและข้อแลกเปลี่ยน',
    prompt: 'โปรดวิเคราะห์การตัดสินใจลงทุนโครงสร้างพื้นฐาน AI ข้ามภูมิภาค โดยประเมินความเสี่ยง ผลตอบแทน และข้อแลกเปลี่ยนทางกลยุทธ์ตามกรอบ PCA',
    icon: '🧠',
    tag: 'Strategic',
    tagColor: '#fbbf24',
    tagBg: '#f59e0b1a',
    tagBorder: '#f59e0b40',
  },
  {
    id: 'red-team',
    title: 'Red Team Attack',
    subtitle: 'จำลองการโจมตี Stress-Test และประเมินจุดอ่อน',
    prompt: 'ทำการจำลอง Red Team Stress-Test แผนงานโครงการสำคัญ เพื่อหาจุดอ่อนช่องโหว่ความเสี่ยงสูงสุดและแนวทางป้องกัน',
    icon: '🛡️',
    tag: 'Risk Audit',
    tagColor: '#f87171',
    tagBg: '#ef44441a',
    tagBorder: '#ef444440',
  },
  {
    id: 'thai-law',
    title: 'Thai Law & PDPA',
    subtitle: 'ตรวจสอบกฎหมายและกฎระเบียบคณะกรรมการไทย',
    prompt: 'วิเคราะห์ข้อกฎหมาย พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA), กฎหมายไซเบอร์ และธรรมาภิบาล AI ตามบริบทกฎหมายประเทศไทย',
    icon: '🏛️',
    tag: 'Compliance',
    tagColor: '#c084fc',
    tagBg: '#a855f71a',
    tagBorder: '#a855f740',
  },
  {
    id: 'analyze-report',
    title: 'Analyze Report',
    subtitle: 'สังเคราะห์และสอบทานรายงานผลประกอบการ',
    prompt: 'โปรดสังเคราะห์และตรวจสอบความถูกต้องของรายงานผลประกอบการประจำไตรมาส พร้อมสกัดประเด็นสำคัญและข้อเสนอแนะระดับผู้บริหาร',
    icon: '📊',
    tag: 'Executive',
    tagColor: '#38bdf8',
    tagBg: '#0284c71a',
    tagBorder: '#0284c740',
  },
  {
    id: 'business-strategy',
    title: 'Business Strategy',
    subtitle: 'วางแผนกลยุทธ์ Business Model Pivot',
    prompt: 'วางแผนกลยุทธ์การปรับเปลี่ยนโมเดลธุรกิจ (Business Model Pivot) เพื่อรับมือกับการแข่งขันในตลาดดิจิทัลและข้อกำกับดูแลใหม่',
    icon: '📈',
    tag: 'Growth',
    tagColor: '#34d399',
    tagBg: '#10b9811a',
    tagBorder: '#10b98140',
  },
  {
    id: 'framework-mapping',
    title: 'Framework Mapping',
    subtitle: 'แมปปิ้งสถาปัตยกรรม ISO 42001 & NIST AI RMF',
    prompt: 'จัดทำแผนผัง Framework Mapping เชื่อมโยง ISO 42001, NIST AI RMF และสถาปัตยกรรมระบบองค์กรของ FIRE KEEPER',
    icon: '🧱',
    tag: 'Governance',
    tagColor: '#818cf8',
    tagBg: '#6366f11a',
    tagBorder: '#6366f140',
  },
];

interface Props {
  onSelectPrompt: (promptText: string) => void;
}

export default function ExamplePromptCards({ onSelectPrompt }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerIcon}>✨</Text>
        <Text style={styles.headerTitle}>QUICK COMMAND PRESETS (เทมเพลตคำสั่งด่วน)</Text>
      </View>
      <Text style={styles.headerSubtitle}>1-Click Executive Templates จากระบบเว็บ</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {SAMPLE_PROMPTS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => onSelectPrompt(item.prompt)}
            activeOpacity={0.75}
          >
            <View style={styles.cardTop}>
              <Text style={styles.cardIcon}>{item.icon}</Text>
              <View
                style={[
                  styles.tagBadge,
                  {
                    backgroundColor: item.tagBg,
                    borderColor: item.tagBorder,
                  },
                ]}
              >
                <Text style={[styles.tagText, { color: item.tagColor }]}>{item.tag}</Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle} numberOfLines={2}>
              {item.subtitle}
            </Text>

            <View style={styles.cardBottom}>
              <Text style={styles.actionPromptText}>คลิกเพื่อวิเคราะห์ →</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 2,
  },
  headerIcon: {
    fontSize: 13,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9ca3af',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: 210,
    backgroundColor: '#141720',
    borderWidth: 1,
    borderColor: '#242e42',
    borderRadius: 14,
    padding: 14,
    justifyContent: 'space-between',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardIcon: {
    fontSize: 22,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  cardBottom: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 8,
    marginTop: 'auto',
  },
  actionPromptText: {
    color: '#f97316',
    fontSize: 11,
    fontWeight: '700',
  },
});
