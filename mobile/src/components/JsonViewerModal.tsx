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
  data: any;
  title?: string;
}

export default function JsonViewerModal({ visible, onClose, data, title = 'Turn JSON Payload' }: Props) {
  const [copied, setCopied] = useState(false);

  const jsonString = (() => {
    try {
      return JSON.stringify(data || {}, null, 2);
    } catch {
      return '{}';
    }
  })();

  const handleCopy = async () => {
    await Clipboard.setStringAsync(jsonString);
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
              <Text style={styles.icon}>📄</Text>
              <Text style={styles.title}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* JSON Scroll */}
          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollInner}>
            <Text selectable style={styles.jsonText}>{jsonString}</Text>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleCopy} style={styles.copyBtn} activeOpacity={0.7}>
              <Text style={styles.copyBtnText}>{copied ? '✓ คัดลอกแล้ว' : '📋 คัดลอก JSON ทั้งหมด'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeActionBtn} activeOpacity={0.7}>
              <Text style={styles.closeActionBtnText}>ปิด</Text>
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
    gap: 8,
  },
  icon: {
    fontSize: 18,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
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
  scrollArea: {
    flex: 1,
    backgroundColor: '#040711',
  },
  scrollInner: {
    padding: 14,
  },
  jsonText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#38bdf8',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: '#0c1322',
    gap: 10,
  },
  copyBtn: {
    flex: 2,
    backgroundColor: '#0284c7',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeActionBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
});
