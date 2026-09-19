import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getConversations, deleteConversation, Conversation } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Conversations'>;

export default function ConversationsScreen({ navigation }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (err) {
      console.warn('[Conversations] Load error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Reload conversations whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      load(true);
    }, [])
  );

  const handleDelete = (id: string, title: string) => {
    Alert.alert('ลบประวัติการสนทนา', `คุณต้องการลบ "${title || 'เซสชันนี้'}" ใช่หรือไม่?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteConversation(id);
            setConversations(prev => prev.filter(c => c.id !== id));
          } catch {
            Alert.alert('ข้อผิดพลาด', 'ไม่สามารถลบการสนทนาได้');
          }
        },
      },
    ]);
  };

  const handleClearAll = () => {
    if (conversations.length === 0) return;
    Alert.alert(
      'ล้างประวัติการสนทนาทั้งหมด',
      'คุณแน่ใจหรือไม่ว่าต้องการลบประวัติการสนทนาทั้งหมดออกจากเครื่องและระบบ? การกระทำนี้ไม่สามารถย้อนกลับได้',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ล้างทั้งหมด',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const c of conversations) {
                await deleteConversation(c.id);
              }
              setConversations([]);
            } catch {
              Alert.alert('ข้อผิดพลาด', 'ไม่สามารถลบประวัติทั้งหมดได้');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Action Header Row */}
      <View style={styles.topActionsRow}>
        <TouchableOpacity
          style={styles.newChatBtn}
          onPress={() => navigation.navigate('Chat', {})}
          activeOpacity={0.8}
        >
          <Text style={styles.newChatIcon}>＋</Text>
          <Text style={styles.newChatText}>New Analysis</Text>
        </TouchableOpacity>

        {conversations.length > 0 && (
          <TouchableOpacity
            style={styles.clearAllBtn}
            onPress={handleClearAll}
            activeOpacity={0.7}
          >
            <Text style={styles.clearAllIcon}>🗑️</Text>
            <Text style={styles.clearAllText}>ล้างทั้งหมด</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={conversations}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => { setIsRefreshing(true); load(true); }}
            tintColor="#f97316"
          />
        }
        renderItem={({ item }) => (
          <View style={styles.convCard}>
            <TouchableOpacity
              style={styles.convCardMain}
              onPress={() => navigation.navigate('Chat', { conversationId: item.id, conversationTitle: item.title })}
              activeOpacity={0.7}
            >
              <View style={styles.convIcon}>
                <Text style={styles.convIconText}>💬</Text>
              </View>
              <View style={styles.convInfo}>
                <Text style={styles.convTitle} numberOfLines={1}>{item.title || 'Untitled Session'}</Text>
                <Text style={styles.convMeta}>
                  {item.turns?.length ? `${item.turns.length} messages · ` : ''}
                  {new Date(item.updated_at || item.created_at || item.updatedAt || item.createdAt || Date.now()).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cardDeleteBtn}
              onPress={() => handleDelete(item.id, item.title)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Text style={styles.cardDeleteIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔥</Text>
            <Text style={styles.emptyText}>No conversations yet.{'\n'}Start a new analysis above.</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
      <Text style={styles.hint}>แตะที่ 🗑️ เพื่อลบประวัติ หรือกดค้างที่การ์ดเพื่อลบ</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  loader: { flex: 1, backgroundColor: '#0f0f0f', justifyContent: 'center', alignItems: 'center' },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  newChatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    backgroundColor: '#f97316',
    borderRadius: 12,
  },
  newChatIcon: { color: '#fff', fontSize: 20, fontWeight: '700' },
  newChatText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#1e1b2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7f1d1d',
  },
  clearAllIcon: { fontSize: 16 },
  clearAllText: { color: '#ef4444', fontSize: 13, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2d2d2d',
    overflow: 'hidden',
  },
  convCardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  cardDeleteBtn: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e1010',
    borderLeftWidth: 1,
    borderLeftColor: '#3a1a1a',
  },
  cardDeleteIcon: {
    fontSize: 16,
  },
  convIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1c1007', justifyContent: 'center', alignItems: 'center' },
  convIconText: { fontSize: 20 },
  convInfo: { flex: 1 },
  convTitle: { color: '#ffffff', fontWeight: '600', fontSize: 15, marginBottom: 4 },
  convMeta: { color: '#6b7280', fontSize: 12 },
  chevron: { color: '#4b5563', fontSize: 22 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: '#6b7280', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  hint: { textAlign: 'center', color: '#374151', fontSize: 11, paddingBottom: 12 },
});
