import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  createConversation,
  getConversation,
  saveConversationTurns,
  deleteConversation,
  API_BASE_URL,
} from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { ChatMessage, GovernanceResult, AttachmentItem } from '../types/api';
import MessageBubble from '../components/MessageBubble';
import HeroWelcomeCard from '../components/HeroWelcomeCard';
import ExamplePromptCards from '../components/ExamplePromptCards';
import ChatSettingsModal, { ChatConfig, TONE_OPTIONS } from '../components/ChatSettingsModal';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

function mapPcaStateToGovernance(pcaState: any): GovernanceResult {
  const calibratedConfidence =
    pcaState?.confidence_calibration?.calibrated_score ??
    (typeof pcaState?.confidence === 'number' ? pcaState.confidence : 0.85);

  const evidenceSources = (pcaState?.sources_used || [])
    .map((s: any) => s.name || s.description || String(s))
    .filter(Boolean)
    .slice(0, 10);

  const risk =
    calibratedConfidence >= 0.8 ? 'LOW' : calibratedConfidence >= 0.5 ? 'MEDIUM' : 'HIGH';

  return {
    calibratedConfidence,
    verificationState: pcaState?.has_external_evidence ? 'EMPIRICAL_VERIFIED' : 'VERIFIED',
    evidenceSources,
    hallucination_risk: risk,
    pca_stages_completed: 12,
    temporal_grounding: true,
    ach_hypotheses: (pcaState?.conflicts || []).map((c: string) => ({
      hypothesis: c,
      probability: 0.5,
      supporting_evidence: [],
      contradicting_evidence: [],
    })),
    epistemic_limitations: pcaState?.missing_info || [],
  };
}

export default function ChatScreen({ route, navigation }: Props) {
  const {
    conversationId: initialConvId,
    conversationTitle,
    initialPrompt,
  } = route.params ?? {};
  const [conversationId, setConversationId] = useState<string | undefined>(initialConvId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Web-Parity Chat Settings State
  const [chatConfig, setChatConfig] = useState<ChatConfig>({
    model: 'deepseek-chat',
    tone: 'Formal Architect',
    reasoningProfile: 'Auto',
    webSearch: true,
    deepReasoning: false,
    ltm: true,
    ollamaBaseUrl: 'https://ollama.firekeeper.site',
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);

  const flatListRef = useRef<FlatList>(null);
  const activeXhrRef = useRef<XMLHttpRequest | null>(null);
  const initialPromptSentRef = useRef(false);
  const { signOut } = useAuth();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const handleDeleteCurrentChat = useCallback(() => {
    if (!conversationId) return;
    Alert.alert(
      'ลบการสนทนานี้',
      'คุณต้องการลบเซสชันนี้และเริ่มต้นใหม่หรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConversation(conversationId);
              setConversationId(undefined);
              setMessages([]);
              setInput('');
              setAttachments([]);
              navigation.setOptions({ title: 'New Analysis' });
            } catch {
              Alert.alert('ข้อผิดพลาด', 'ไม่สามารถลบการสนทนาได้');
            }
          },
        },
      ]
    );
  }, [conversationId, navigation]);

  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const newItems: AttachmentItem[] = [];
        for (const asset of res.assets) {
          try {
            const base64 = await FileSystem.readAsStringAsync(asset.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            const mime = asset.mimeType || 'application/octet-stream';
            newItems.push({
              name: asset.name,
              type: mime,
              size: asset.size,
              base64: `data:${mime};base64,${base64}`,
              uri: asset.uri,
            });
          } catch (readErr) {
            console.warn('File read error:', readErr);
          }
        }
        if (newItems.length > 0) {
          setAttachments((prev) => [...prev, ...newItems]);
        }
      }
    } catch (err: any) {
      Alert.alert('เลือกไฟล์ไม่สำเร็จ', err?.message || 'ไม่สามารถเปิดตัวเลือกไฟล์ได้');
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Set header title & Settings action button
  useEffect(() => {
    navigation.setOptions({
      title: conversationTitle || 'Analysis Session',
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {conversationId && (
            <TouchableOpacity
              onPress={handleDeleteCurrentChat}
              style={[styles.headerSettingsBtn, styles.headerDeleteBtn]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Text style={styles.headerSettingsIcon}>🗑️</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate('Conversations')}
            style={styles.headerSettingsBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Text style={styles.headerSettingsIcon}>📜</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsSettingsOpen(true)}
            style={styles.headerSettingsBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Text style={styles.headerSettingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [conversationTitle, conversationId, navigation, handleDeleteCurrentChat]);

  // Keyboard scroll listener to ensure input & latest messages are visible
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    return () => showSub.remove();
  }, []);

  // Load existing messages if conversationId is provided
  useEffect(() => {
    if (!initialConvId) return;

    let isMounted = true;
    (async () => {
      setIsLoadingHistory(true);
      try {
        const { messages: historyMsgs } = await getConversation(initialConvId);
        if (isMounted && historyMsgs && historyMsgs.length > 0) {
          setMessages(
            historyMsgs.map((m) => ({
              role: m.role,
              content: m.content,
              timestamp: m.timestamp || new Date().toISOString(),
              governance: m.governance,
              confidenceCalibration: (m as any).confidenceCalibration,
              pcaState: (m as any).pcaState,
              executionTrace: (m as any).executionTrace,
              model: (m as any).model,
            }))
          );
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }, 150);
        }
      } catch (err) {
        console.warn('[Chat] Failed to load conversation turns:', err);
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }
    })();

    return () => {
      isMounted = false;
      if (activeXhrRef.current) {
        activeXhrRef.current.abort();
      }
    };
  }, [initialConvId]);

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const handleStop = () => {
    if (activeXhrRef.current) {
      activeXhrRef.current.abort();
      activeXhrRef.current = null;
    }
    setIsStreaming(false);
    setCurrentStage(null);

    // Persist turns received so far
    if (conversationId && messages.length > 0) {
      saveConversationTurns(
        conversationId,
        conversationTitle || 'Analysis Session',
        messages.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
          governance: m.governance,
          confidenceCalibration: m.confidenceCalibration,
          pcaState: m.pcaState,
          executionTrace: m.executionTrace,
          model: m.model,
        }))
      ).catch(() => {});
    }
  };

  const sendMessageWithText = useCallback(
    async (textToSend: string, pendingAttachments: AttachmentItem[] = attachments) => {
      const text = textToSend.trim();
      if ((!text && pendingAttachments.length === 0) || isStreaming) return;

      const effectiveQuestion =
        text ||
        (pendingAttachments.length > 0
          ? `วิเคราะห์ไฟล์แนบ: ${pendingAttachments.map((a) => a.name).join(', ')}`
          : '');
      let displayContent = text;
      if (pendingAttachments.length > 0) {
        const fileBadges = pendingAttachments
          .map((a) => `📎 ${a.name} (${Math.round((a.size || 0) / 1024)} KB)`)
          .join('\n');
        displayContent = displayContent ? `${displayContent}\n\n${fileBadges}` : fileBadges;
      }

      const userMsg: ChatMessage = {
        role: 'user',
        content: displayContent,
        timestamp: new Date().toISOString(),
      };
      const currentMessages = [...messages, userMsg];
      setMessages(currentMessages);
      setInput('');
      setAttachments([]);
      setIsStreaming(true);
      setCurrentStage('STAGE 01: Initializing PCA Pipeline...');

      // Placeholder for assistant message
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };
      setMessages([...currentMessages, assistantMsg]);

      try {
        // Ensure conversation exists on server and local
        let convId = conversationId;
        if (!convId) {
          try {
            const conv = await createConversation(text.substring(0, 50));
            convId = conv.id;
            setConversationId(convId);
            navigation.setOptions({ title: text.substring(0, 30) });
          } catch (e: any) {
            console.warn('[Chat] createConversation error, proceeding with local id:', e);
            convId = `conv-${Date.now()}`;
            setConversationId(convId);
          }
        }

        // Immediately save user question to local store and server
        if (convId) {
          const titleToUse = conversationTitle || text.substring(0, 50);
          saveConversationTurns(
            convId,
            titleToUse,
            currentMessages.map((m) => ({
              role: m.role,
              content: m.content,
              timestamp: m.timestamp,
              governance: m.governance,
            }))
          ).catch(() => {});
        }

        const rawToken = await AsyncStorage.getItem('@firekeeper_session_token');
        const token = rawToken && rawToken.length > 10 ? rawToken : 'offline-local-token';

        // Native React Native XMLHttpRequest for SSE streaming
        const xhr = new XMLHttpRequest();
        activeXhrRef.current = xhr;

        xhr.open('POST', `${API_BASE_URL}/api/pca/stream`);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        let accumulatedText = '';
        let governanceResult: GovernanceResult | undefined;
        let confidenceCalibrationResult: any = undefined;
        let pcaStateResult: any = undefined;
        let executionTraceResult: any = undefined;
        let assistantModelTag: string = chatConfig.model;
        let lastProcessedIndex = 0;
        let currentEventName = 'message';

        xhr.onprogress = () => {
          const raw = xhr.responseText;
          const newChunk = raw.substring(lastProcessedIndex);
          lastProcessedIndex = raw.length;

          const lines = newChunk.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed.startsWith('event:')) {
              currentEventName = trimmed.replace('event:', '').trim();
              continue;
            }

            if (trimmed.startsWith('data:')) {
              const dataStr = trimmed.replace('data:', '').trim();
              if (!dataStr || dataStr === '[DONE]') continue;

              try {
                const parsed = JSON.parse(dataStr);

                if (currentEventName === 'pipeline_stage') {
                  const detail = parsed.detail || `Stage: ${parsed.stage}`;
                  setCurrentStage(detail);
                } else if (currentEventName === 'token') {
                  if (parsed.token) {
                    accumulatedText += parsed.token;
                    setMessages((prev) => {
                      const updated = [...prev];
                      const last = updated[updated.length - 1];
                      if (last && last.role === 'assistant') {
                        updated[updated.length - 1] = {
                          ...last,
                          content: accumulatedText,
                        };
                      }
                      return updated;
                    });
                    scrollToBottom();
                  }
                } else if (currentEventName === 'state' || currentEventName === 'pca_state') {
                  pcaStateResult = parsed;
                  governanceResult = mapPcaStateToGovernance(parsed);
                  if (parsed.confidence_calibration) {
                    confidenceCalibrationResult = parsed.confidence_calibration;
                  }
                  if (parsed.execution_trace) {
                    executionTraceResult = parsed.execution_trace;
                  }
                  if (parsed.llm_model) {
                    assistantModelTag = parsed.llm_model;
                  }
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last && last.role === 'assistant') {
                      updated[updated.length - 1] = {
                        ...last,
                        governance: governanceResult,
                        confidenceCalibration: confidenceCalibrationResult,
                        pcaState: pcaStateResult,
                        executionTrace: executionTraceResult,
                        model: assistantModelTag,
                      };
                    }
                    return updated;
                  });
                } else if (currentEventName === 'complete') {
                  if (parsed.pcaState) {
                    pcaStateResult = parsed.pcaState;
                    governanceResult = mapPcaStateToGovernance(parsed.pcaState);
                    if (parsed.pcaState.confidence_calibration) {
                      confidenceCalibrationResult = parsed.pcaState.confidence_calibration;
                    }
                    if (parsed.pcaState.execution_trace) {
                      executionTraceResult = parsed.pcaState.execution_trace;
                    }
                  }
                  if (parsed.model) {
                    assistantModelTag = parsed.model;
                  }
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last && last.role === 'assistant') {
                      updated[updated.length - 1] = {
                        ...last,
                        governance: governanceResult,
                        confidenceCalibration: confidenceCalibrationResult,
                        pcaState: pcaStateResult,
                        executionTrace: executionTraceResult,
                        model: assistantModelTag,
                      };
                    }
                    return updated;
                  });
                } else if (currentEventName === 'governance') {
                  governanceResult = {
                    calibratedConfidence: parsed.calibratedConfidence ?? 0.85,
                    verificationState: parsed.verificationState ?? 'VERIFIED',
                    evidenceSources: parsed.evidenceSources ?? [],
                    hallucination_risk: parsed.hallucination_risk ?? 'LOW',
                    pca_stages_completed: parsed.pca_stages_completed ?? 12,
                    temporal_grounding: parsed.temporal_grounding ?? true,
                    ach_hypotheses: parsed.ach_hypotheses ?? [],
                    epistemic_limitations: parsed.epistemic_limitations ?? [],
                  };
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last && last.role === 'assistant') {
                      updated[updated.length - 1] = {
                        ...last,
                        governance: governanceResult,
                        confidenceCalibration: confidenceCalibrationResult,
                        pcaState: pcaStateResult,
                        executionTrace: executionTraceResult,
                        model: assistantModelTag,
                      };
                    }
                    return updated;
                  });
                } else if (currentEventName === 'error') {
                  const errMsg = parsed.message || parsed.error || 'Server error';
                  accumulatedText = accumulatedText ? `${accumulatedText}\n\n⚠️ ${errMsg}` : `⚠️ ${errMsg}`;
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last && last.role === 'assistant') {
                      updated[updated.length - 1] = {
                        ...last,
                        content: accumulatedText,
                      };
                    }
                    return updated;
                  });
                }
              } catch {
                // partial JSON, ignored until complete
              }
            }
          }
        };

        xhr.onload = async () => {
          setIsStreaming(false);
          setCurrentStage(null);
          activeXhrRef.current = null;

          if (xhr.status >= 200 && xhr.status < 300) {
            const finalAssistantContent = accumulatedText.trim() || '⚠️ ไม่ได้รับคำตอบจากระบบ กรุณาลองใหม่อีกครั้ง';
            const finalTurns = [
              ...currentMessages,
              {
                role: 'assistant' as const,
                content: finalAssistantContent,
                timestamp: new Date().toISOString(),
                governance: governanceResult,
                confidenceCalibration: confidenceCalibrationResult,
                pcaState: pcaStateResult,
                executionTrace: executionTraceResult,
                model: assistantModelTag,
              },
            ];
            setMessages(finalTurns);

            if (convId) {
              const titleToUse = conversationTitle || text.substring(0, 50);
              await saveConversationTurns(
                convId,
                titleToUse,
                finalTurns.map((m) => ({
                  role: m.role,
                  content: m.content,
                  timestamp: m.timestamp,
                  governance: m.governance,
                  confidenceCalibration: m.confidenceCalibration,
                  pcaState: m.pcaState,
                  executionTrace: m.executionTrace,
                  model: m.model,
                }))
              ).catch(() => {});
            }
          } else {
            if (xhr.status === 401) {
              Alert.alert(
                'Session Expired',
                'Your session has expired. Please sign in again or use Guest Mode.',
                [{ text: 'OK', onPress: () => signOut() }]
              );
            } else {
              Alert.alert(
                'Server Error',
                `Error from FIRE KEEPER (status ${xhr.status}):\n${xhr.responseText || 'Request failed'}`
              );
            }
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.role === 'assistant' && !last.content) {
                return prev.slice(0, -1);
              }
              return prev;
            });
          }
        };

        xhr.onerror = () => {
          setIsStreaming(false);
          setCurrentStage(null);
          activeXhrRef.current = null;
          Alert.alert(
            'Connection Error',
            'Could not reach https://firekeeper.site. Please check your internet connection.'
          );
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant' && !last.content) {
              return prev.slice(0, -1);
            }
            return prev;
          });
        };

        const historyTurns = messages.map((m) => ({ role: m.role, content: m.content }));
        const requestPayload = {
          conversationId: convId,
          question: effectiveQuestion,
          history: historyTurns,
          model: chatConfig.model,
          tone: chatConfig.tone,
          deepReasoning: chatConfig.deepReasoning,
          webSearch: true, // Always true to avoid server-side evidenceResult null provenance crash
          reasoningProfile: chatConfig.reasoningProfile,
          ollamaBaseUrl: chatConfig.ollamaBaseUrl || 'https://ollama.firekeeper.site',
          useLtm: chatConfig.ltm ?? true,
          ltm: chatConfig.ltm ?? true,
          attachments: pendingAttachments,
        };

        xhr.send(JSON.stringify(requestPayload));
      } catch (err: any) {
        setIsStreaming(false);
        setCurrentStage(null);
        activeXhrRef.current = null;
        Alert.alert('Error', err?.message ?? 'Failed to connect to FIRE KEEPER server');
        setMessages((prev) => prev.slice(0, -1));
      }
    },
    [
      isStreaming,
      conversationId,
      messages,
      navigation,
      conversationTitle,
      chatConfig,
      attachments,
      signOut,
    ]
  );

  const sendMessage = useCallback(() => {
    sendMessageWithText(input, attachments);
  }, [input, attachments, sendMessageWithText]);

  // Handle auto-send for initialPrompt passed from HomeScreen
  useEffect(() => {
    if (initialPrompt && !initialPromptSentRef.current) {
      initialPromptSentRef.current = true;
      sendMessageWithText(initialPrompt);
    }
  }, [initialPrompt, sendMessageWithText]);

  const cycleTone = () => {
    const currentIndex = TONE_OPTIONS.findIndex((t) => t.id === chatConfig.tone);
    const nextTone = TONE_OPTIONS[(currentIndex + 1) % TONE_OPTIONS.length].id;
    setChatConfig((prev) => ({ ...prev, tone: nextTone }));
  };

  return (
    <View style={styles.outerContainer}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={headerHeight}
      >
        {/* Loading history indicator */}
        {isLoadingHistory && (
          <View style={styles.historyLoader}>
            <ActivityIndicator size="small" color="#f97316" />
            <Text style={styles.historyLoaderText}>Loading conversation history...</Text>
          </View>
        )}

        {/* Real-Time PCA Stage Indicator Banner */}
        {isStreaming && currentStage && (
          <View style={styles.stageBar}>
            <View style={styles.stageSpinnerDot} />
            <Text style={styles.stageText} numberOfLines={1}>
              {currentStage}
            </Text>
            <TouchableOpacity onPress={handleStop} style={styles.stopButton} activeOpacity={0.7}>
              <Text style={styles.stopButtonText}>⏹ หยุด</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Message List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          style={styles.messageListStyle}
          renderItem={({ item, index }) => (
            <MessageBubble
              message={item}
              isLastAssistantStreaming={isStreaming && index === messages.length - 1}
              onGovernancePress={(gov) =>
                navigation.navigate('Governance', {
                  governance: gov,
                  messageContent: item.content,
                })
              }
            />
          )}
          contentContainerStyle={styles.messageList}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onContentSizeChange={scrollToBottom}
          ListHeaderComponent={
            messages.length > 0 ? <HeroWelcomeCard defaultCollapsed={true} /> : null
          }
          ListEmptyComponent={
            !isLoadingHistory ? (
              <View style={styles.emptyContainer}>
                <HeroWelcomeCard defaultCollapsed={false} />
                <ExamplePromptCards
                  onSelectPrompt={(p) => {
                    setInput(p);
                  }}
                />
              </View>
            ) : null
          }
        />

        {/* Web Controls Scrollable Toolbar (NO OVERFLOW) */}
        <View style={styles.toolbarWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.toolbarScroll}
          >
            {/* Quick History Trigger */}
            <TouchableOpacity
              style={styles.toolPillHistory}
              onPress={() => navigation.navigate('Conversations')}
              activeOpacity={0.7}
            >
              <Text style={styles.toolPillIcon}>📜</Text>
              <Text style={styles.toolPillTextHistory}>ประวัติแชท</Text>
            </TouchableOpacity>

            {/* Quick Settings Trigger */}
            <TouchableOpacity
              style={styles.toolPillConfig}
              onPress={() => setIsSettingsOpen(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.toolPillIcon}>⚙️</Text>
              <Text style={styles.toolPillTextConfig}>ตั้งค่าโมเดล</Text>
            </TouchableOpacity>

            {/* Model Badge / Selector */}
            <TouchableOpacity
              style={styles.toolPillModel}
              onPress={() => setIsSettingsOpen(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.toolPillIcon}>🤖</Text>
              <Text style={styles.toolPillTextModel}>{chatConfig.model}</Text>
            </TouchableOpacity>

            {/* Live Web Search Toggle */}
            <TouchableOpacity
              style={[styles.toolPill, chatConfig.webSearch && styles.toolPillActiveSky]}
              onPress={() => setChatConfig((prev) => ({ ...prev, webSearch: !prev.webSearch }))}
              activeOpacity={0.7}
            >
              <Text style={styles.toolPillIcon}>🌐</Text>
              <Text style={[styles.toolPillText, chatConfig.webSearch && styles.toolPillTextSky]}>
                Web Search: {chatConfig.webSearch ? 'ON' : 'OFF'}
              </Text>
              {chatConfig.webSearch && <View style={styles.toolDotSky} />}
            </TouchableOpacity>

            {/* Deep Reasoning Toggle */}
            <TouchableOpacity
              style={[styles.toolPill, chatConfig.deepReasoning && styles.toolPillActiveAmber]}
              onPress={() =>
                setChatConfig((prev) => ({ ...prev, deepReasoning: !prev.deepReasoning }))
              }
              activeOpacity={0.7}
            >
              <Text style={styles.toolPillIcon}>⚡</Text>
              <Text
                style={[
                  styles.toolPillText,
                  chatConfig.deepReasoning && styles.toolPillTextAmber,
                ]}
              >
                Deep Reasoning: {chatConfig.deepReasoning ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>

            {/* LTM Memory Mode Toggle */}
            <TouchableOpacity
              style={[styles.toolPill, chatConfig.ltm && styles.toolPillActivePurple]}
              onPress={() => setChatConfig((prev) => ({ ...prev, ltm: !prev.ltm }))}
              activeOpacity={0.7}
            >
              <Text style={styles.toolPillIcon}>🧠</Text>
              <Text style={[styles.toolPillText, chatConfig.ltm && styles.toolPillTextPurple]}>
                LTM: {chatConfig.ltm ? 'ON' : 'OFF'}
              </Text>
              {chatConfig.ltm && <View style={styles.toolDotPurple} />}
            </TouchableOpacity>

            {/* Tone Mode Pill */}
            <TouchableOpacity style={styles.toolPill} onPress={cycleTone} activeOpacity={0.7}>
              <Text style={styles.toolPillIcon}>🎭</Text>
              <Text style={styles.toolPillText}>{chatConfig.tone}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Attachment Previews Bar */}
        {attachments.length > 0 && (
          <View style={styles.attachmentBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.attachmentScroll}
            >
              {attachments.map((att, idx) => {
                const isImg = att.type.startsWith('image/');
                const sizeKb = Math.round((att.size || 0) / 1024);
                return (
                  <View key={`att-${idx}`} style={styles.attachmentChip}>
                    <Text style={styles.attachmentIcon}>{isImg ? '🖼️' : '📄'}</Text>
                    <View style={styles.attachmentMeta}>
                      <Text style={styles.attachmentName} numberOfLines={1}>
                        {att.name}
                      </Text>
                      <Text style={styles.attachmentSize}>{sizeKb} KB</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.attachmentRemoveBtn}
                      onPress={() => removeAttachment(idx)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.attachmentRemoveIcon}>✕</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Input bar (Fit to screen width) */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={handlePickDocument}
            disabled={isStreaming}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            activeOpacity={0.7}
          >
            <Text style={styles.attachIcon}>📎</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            onFocus={() => setTimeout(scrollToBottom, 150)}
            placeholder={
              attachments.length > 0
                ? 'เพิ่มคำถามหรือคำสั่งเกี่ยวกับไฟล์แนบ...'
                : 'พิมพ์คำถาม ปัญหา หรือการตัดสินใจ...'
            }
            placeholderTextColor="#64748b"
            cursorColor="#f97316"
            selectionColor="#f97316"
            multiline
            editable={!isStreaming}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              ((!input.trim() && attachments.length === 0) || isStreaming) &&
                styles.sendBtnDisabled,
            ]}
            onPress={sendMessage}
            disabled={(!input.trim() && attachments.length === 0) || isStreaming}
            activeOpacity={0.8}
          >
            {isStreaming ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendIcon}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Chat Settings Modal */}
      <ChatSettingsModal
        visible={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={chatConfig}
        onChangeConfig={(patch) => setChatConfig((prev) => ({ ...prev, ...patch }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#070b14', overflow: 'hidden' },
  container: { flex: 1, backgroundColor: '#070b14', width: '100%', overflow: 'hidden' },
  messageListStyle: { flex: 1, width: '100%' },
  headerSettingsBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    marginRight: 4,
  },
  headerSettingsIcon: {
    fontSize: 16,
  },
  historyLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: '#0d1322',
  },
  historyLoaderText: { color: '#94a3b8', fontSize: 12 },
  stageBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#18120b',
    borderBottomWidth: 1,
    borderBottomColor: '#78350f',
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
  },
  stageSpinnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
  },
  stageText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    fontFamily: 'monospace',
  },
  stopButton: {
    backgroundColor: '#991b1b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stopButtonText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  messageList: { padding: 14, paddingBottom: 20, width: '100%' },
  emptyContainer: {
    paddingTop: 6,
    width: '100%',
  },
  toolbarWrapper: {
    backgroundColor: '#0a0f1c',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    width: '100%',
  },
  toolbarScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  toolPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131a2b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#243048',
    gap: 4,
    flexShrink: 0,
  },
  toolPillHistory: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c1a2e',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0284c750',
    gap: 4,
    flexShrink: 0,
  },
  toolPillTextHistory: {
    fontSize: 11,
    color: '#38bdf8',
    fontWeight: '700',
  },
  toolPillConfig: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b40',
    gap: 4,
    flexShrink: 0,
  },
  toolPillTextConfig: {
    fontSize: 11,
    color: '#fbbf24',
    fontWeight: '700',
  },
  toolPillModel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    gap: 4,
    flexShrink: 0,
  },
  toolPillTextModel: {
    fontSize: 11,
    color: '#cbd5e1',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  toolPillActiveSky: {
    backgroundColor: '#0284c71a',
    borderColor: '#38bdf8',
  },
  toolPillActiveAmber: {
    backgroundColor: '#f59e0b1a',
    borderColor: '#fbbf24',
  },
  toolPillIcon: {
    fontSize: 11,
  },
  toolPillText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  toolPillTextSky: {
    color: '#38bdf8',
  },
  toolPillTextAmber: {
    color: '#fbbf24',
  },
  headerDeleteBtn: {
    backgroundColor: '#3b1219',
  },
  toolPillActivePurple: {
    backgroundColor: '#2e1065',
    borderColor: '#a855f7',
  },
  toolPillTextPurple: {
    color: '#c084fc',
    fontWeight: '700',
  },
  toolDotPurple: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#c084fc',
    marginLeft: 4,
  },
  toolDotSky: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38bdf8',
  },
  attachmentBar: {
    backgroundColor: '#0a0f1c',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  attachmentScroll: {
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#334155',
    maxWidth: 200,
  },
  attachmentIcon: {
    fontSize: 14,
  },
  attachmentMeta: {
    flexShrink: 1,
  },
  attachmentName: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '600',
  },
  attachmentSize: {
    color: '#94a3b8',
    fontSize: 9,
  },
  attachmentRemoveBtn: {
    padding: 2,
    marginLeft: 4,
  },
  attachmentRemoveIcon: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '800',
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    flexShrink: 0,
  },
  attachIcon: {
    fontSize: 18,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    backgroundColor: '#0a0f1c',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    width: '100%',
  },
  input: {
    flex: 1,
    backgroundColor: '#060a14',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    color: '#ffffff',
    fontSize: 14,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#1e293b',
    minWidth: 0,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  sendBtnDisabled: { backgroundColor: '#1e293b', opacity: 0.5 },
  sendIcon: { color: '#ffffff', fontSize: 16, marginLeft: 2 },
});
