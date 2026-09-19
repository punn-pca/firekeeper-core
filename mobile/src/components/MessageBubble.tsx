import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ChatMessage, GovernanceResult, VERIFICATION_COLORS, VERIFICATION_LABELS } from '../types/api';
import MarkdownRenderer from './MarkdownRenderer';
import ConfidenceCard from './ConfidenceCard';
import ExecutionTraceModal from './ExecutionTraceModal';
import JsonViewerModal from './JsonViewerModal';

interface Props {
  message: ChatMessage;
  onGovernancePress?: (gov: GovernanceResult) => void;
  isLastAssistantStreaming?: boolean;
}

export default function MessageBubble({ message, onGovernancePress, isLastAssistantStreaming = false }: Props) {
  const isUser = message.role === 'user';
  const gov = message.governance;
  const [copied, setCopied] = useState(false);
  const [isTraceOpen, setIsTraceOpen] = useState(false);
  const [isJsonOpen, setIsJsonOpen] = useState(false);

  const assistantModelName = message.model || (message.pcaState as any)?.llm_model || 'DeepSeek-V3';

  const handleCopy = async () => {
    if (!message.content) return;
    await Clipboard.setStringAsync(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async () => {
    try {
      const textToShare = `🔥 FIRE KEEPER Executive Analysis Report\nModel: ${assistantModelName}\nTimestamp: ${formattedTime}\n\n${message.content}\n\n---\nGovernance: Human Agency Advisory · PUNN Cognitive Architecture (PCA)`;
      await Share.share({
        title: 'FIRE KEEPER Analysis Report',
        message: textToShare,
      });
    } catch {}
  };

  const formattedTime = (() => {
    try {
      const d = message.timestamp ? new Date(message.timestamp) : new Date();
      return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  })();

  const conclusionStatus = message.confidenceCalibration?.verificationStatus || gov?.verificationState || 'NOT_VERIFIED';
  const isConclusionVerified = conclusionStatus === 'VERIFIED' || conclusionStatus === 'EMPIRICAL_VERIFIED';

  return (
    <View style={[styles.wrapper, isUser ? styles.wrapperUser : styles.wrapperAssistant]}>
      {/* Header row */}
      {isUser ? (
        <View style={styles.headerRowUser}>
          <Text style={styles.roleLabelUser}>You</Text>
          {formattedTime ? <Text style={styles.timeLabel}>{formattedTime}</Text> : null}
          <TouchableOpacity
            onPress={handleCopy}
            style={styles.copyBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Text style={styles.copyBtnText}>{copied ? '✓ คัดลอกแล้ว' : '📋 คัดลอก'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.headerRowAssistant}>
          {/* Flame Logo Avatar */}
          <View style={styles.avatarBox}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.avatarImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.headerAssistantMeta}>
            <View style={styles.nameRow}>
              <Text style={styles.roleLabelAssistant}>FIRE KEEPER</Text>
              <View style={styles.modelBadge}>
                <Text style={styles.modelBadgeText}>{assistantModelName}</Text>
              </View>
              {isLastAssistantStreaming && !message.content && (
                <View style={styles.processingBadge}>
                  <Text style={styles.processingDot}>●</Text>
                  <Text style={styles.processingText}>กำลังประมวลผล</Text>
                </View>
              )}
            </View>
            {formattedTime ? <Text style={styles.timeLabel}>{formattedTime}</Text> : null}
          </View>

          <TouchableOpacity
            onPress={handleCopy}
            style={styles.copyBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Text style={styles.copyBtnText}>{copied ? '✓ คัดลอกแล้ว' : '📋 คัดลอก'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bubble Body */}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        {message.content ? (
          <MarkdownRenderer content={message.content} isUser={isUser} />
        ) : (
          /* Web-matching Loading State */
          <View style={styles.loadingBox}>
            <View style={styles.loadingHeader}>
              <ActivityIndicator size="small" color="#f59e0b" />
              <Text style={styles.loadingTitle}>🔥 FIRE KEEPER — กำลังวิเคราะห์ข้อมูล…</Text>
            </View>
            <Text style={styles.loadingDesc}>
              กำลังตรวจสอบประเด็น เชื่อมโยงหลักฐาน และประเมินผลกระทบตามกรอบ PCA
            </Text>
          </View>
        )}
      </View>

      {/* Assistant Components: Calibrated Confidence, Conclusion Alert & Full Action Footer */}
      {!isUser && message.content ? (
        <View style={styles.assistantMetaContainer}>
          {/* 1. Epistemic Calibrated Confidence Card (Collapsible, Web-Parity) */}
          <ConfidenceCard confidence={message.confidenceCalibration} defaultExpanded={false} />

          {/* 2. Conclusion Decision Status Alert Bar */}
          <View style={styles.conclusionSummaryBox}>
            <Text style={[styles.conclusionSummaryTitle, isConclusionVerified ? styles.conclusionVerifiedTitle : styles.conclusionNotVerifiedTitle]}>
              {isConclusionVerified ? '✓ CONCLUSION: VERIFIED' : '? CONCLUSION: NOT VERIFIED'}
            </Text>
            <Text style={styles.conclusionSummaryQuote}>
              {isConclusionVerified
                ? '“ข้อสรุปผ่านการสอบทานกับหลักฐานเชิงประจักษ์อย่างสมบูรณ์ตามกรอบธรรมาภิบาล PCA”'
                : '“แหล่งข้อมูลผ่านการตรวจสอบ แต่ข้อสรุปยังไม่ควรตีความว่าเป็นข้อเท็จจริงที่ยืนยันแล้ว (Conclusion remains uncalibrated)”'}
            </Text>
          </View>

          {/* 3. Bottom Action Footer Bar */}
          <View style={styles.assistantFooter}>
            {/* Left Status Badges */}
            <View style={styles.footerBadges}>
              <View style={styles.humanAgencyBadge}>
                <Text style={styles.humanAgencyText}>🛡️ Human Agency: Advisory</Text>
              </View>
              <View style={styles.modelPill}>
                <Text style={styles.modelPillIcon}>🔲</Text>
                <Text style={styles.modelPillText}>{assistantModelName}</Text>
              </View>
            </View>

            {/* Right Action Buttons */}
            <View style={styles.footerActions}>
              <TouchableOpacity
                style={styles.traceBtn}
                onPress={() => setIsTraceOpen(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.traceBtnText}>🛡️ Trace</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleExport}
                activeOpacity={0.7}
              >
                <Text style={styles.actionBtnText}>📄 Export</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleCopy}
                activeOpacity={0.7}
              >
                <Text style={styles.actionBtnText}>{copied ? '✓ คัดลอก' : '📋 คัดลอก'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.jsonBtn]}
                onPress={() => setIsJsonOpen(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.jsonBtnText}>↓ JSON</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}

      {/* Execution Trace Modal */}
      <ExecutionTraceModal
        visible={isTraceOpen}
        onClose={() => setIsTraceOpen(false)}
        traceData={message.executionTrace || message.pcaState}
        modelName={assistantModelName}
      />

      {/* JSON Viewer Modal */}
      <JsonViewerModal
        visible={isJsonOpen}
        onClose={() => setIsJsonOpen(false)}
        data={{
          role: message.role,
          content: message.content,
          timestamp: message.timestamp,
          model: assistantModelName,
          confidence_calibration: message.confidenceCalibration,
          governance: message.governance,
          pcaState: message.pcaState,
        }}
        title="Turn Governance & State JSON"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
    width: '100%',
  },
  wrapperUser: {
    alignItems: 'flex-end',
  },
  wrapperAssistant: {
    alignItems: 'flex-start',
  },
  headerRowUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  headerRowAssistant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    width: '100%',
  },
  avatarBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f973161a',
    borderWidth: 1,
    borderColor: '#f9731640',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 20,
    height: 20,
  },
  headerAssistantMeta: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleLabelUser: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  roleLabelAssistant: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f97316',
    letterSpacing: 1,
  },
  modelBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modelBadgeText: {
    fontSize: 10,
    color: '#fbbf24',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  processingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f59e0b1a',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#f59e0b40',
  },
  processingDot: {
    fontSize: 8,
    color: '#f59e0b',
  },
  processingText: {
    fontSize: 10,
    color: '#f59e0b',
    fontWeight: '600',
  },
  timeLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  copyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    marginLeft: 'auto',
    flexShrink: 0,
  },
  copyBtnText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  bubble: {
    maxWidth: '96%',
    borderRadius: 16,
    padding: 14,
    width: '100%',
  },
  bubbleUser: {
    backgroundColor: '#1e3a8a',
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: '#2563eb',
    maxWidth: '92%',
  },
  bubbleAssistant: {
    backgroundColor: '#0b1120',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  loadingBox: {
    paddingVertical: 6,
    gap: 6,
  },
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingTitle: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '700',
  },
  loadingDesc: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    paddingLeft: 24,
  },
  assistantMetaContainer: {
    width: '100%',
    maxWidth: '96%',
    marginTop: 4,
  },
  conclusionSummaryBox: {
    marginTop: 8,
    backgroundColor: '#0f172a80',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    padding: 10,
  },
  conclusionSummaryTitle: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '800',
    marginBottom: 4,
  },
  conclusionNotVerifiedTitle: {
    color: '#f59e0b',
  },
  conclusionVerifiedTitle: {
    color: '#10b981',
  },
  conclusionSummaryQuote: {
    fontSize: 10.5,
    fontStyle: 'italic',
    color: '#cbd5e1',
    lineHeight: 15,
  },
  assistantFooter: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b80',
    flexDirection: 'column',
    gap: 8,
  },
  footerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  humanAgencyBadge: {
    backgroundColor: '#064e3b30',
    borderWidth: 1,
    borderColor: '#05966950',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  humanAgencyText: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#34d399',
  },
  modelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  modelPillIcon: {
    fontSize: 9,
  },
  modelPillText: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#fbbf24',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  traceBtn: {
    backgroundColor: '#f59e0b18',
    borderWidth: 1,
    borderColor: '#f59e0b60',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  traceBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#fbbf24',
  },
  actionBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  actionBtnText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  jsonBtn: {
    backgroundColor: '#0c4a6e25',
    borderColor: '#0284c750',
  },
  jsonBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#7dd3fc',
    fontFamily: 'monospace',
  },
});
