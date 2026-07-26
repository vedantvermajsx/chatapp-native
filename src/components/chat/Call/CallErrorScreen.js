import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCall } from '../../../contexts/CallContext';
import { useTheme } from '../../../contexts/ThemeContext';

export default function CallErrorScreen() {
  const { callError, setCallError } = useCall();
  const { theme } = useTheme();

  if (!callError) return null;

  return (
    <Modal visible animationType="fade" transparent onRequestClose={() => setCallError(null)}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.isLight ? '#fecaca' : '#7f1d1d' }]}>
          <View style={styles.iconWrap}>
            <Ionicons name="call" size={26} color="#f87171" style={{ transform: [{ rotate: '135deg' }] }} />
          </View>
          <Text style={[styles.title, { color: theme.otherMessageText }]}>Call Failed</Text>
          <Text style={[styles.message, { color: theme.otherMessageText }]}>{callError}</Text>
          <TouchableOpacity style={styles.dismissBtn} onPress={() => setCallError(null)}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  card: { width: '100%', maxWidth: 360, borderRadius: 24, borderWidth: 1, paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center' },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: { fontSize: 19, fontWeight: '700', marginBottom: 8 },
  message: { fontSize: 13, opacity: 0.7, textAlign: 'center', marginBottom: 26 },
  dismissBtn: { width: '100%', paddingVertical: 13, borderRadius: 14, backgroundColor: '#ef4444', alignItems: 'center' },
  dismissText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
