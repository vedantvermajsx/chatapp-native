import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../common/Avatar';
import { useCall } from '../../contexts/CallContext';

export default function IncomingCallModal() {
  const { callState, peer, isVideo, acceptCall, declineCall } = useCall();

  if (callState !== 'incoming') return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={declineCall}>
      <View style={styles.screen}>
        <View style={styles.content}>
          <Avatar url={peer?.avatar} name={peer?.username} size={100} />
          <Text style={styles.name}>{peer?.username || 'Unknown'}</Text>
          <Text style={styles.status}>
            Incoming {isVideo ? 'video' : 'audio'} call{'\u2026'}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.declineBtn]} onPress={declineCall}>
            <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={acceptCall}>
            <Ionicons name="call" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0a0a0f', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 80 },
  content: { alignItems: 'center', gap: 8, marginTop: 60 },
  name: { color: '#fff', fontSize: 22, fontWeight: '600', marginTop: 16 },
  status: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  actions: { flexDirection: 'row', gap: 60 },
  btn: { width: 64, height: 64, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  declineBtn: { backgroundColor: '#ef4444' },
  acceptBtn: { backgroundColor: '#22c55e' },
});
