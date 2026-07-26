import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../../common/Avatar';
import { useCall } from '../../../contexts/CallContext';

export default function IncomingCallScreen() {
  const { incomingCall, acceptCall, rejectCall } = useCall();

  if (!incomingCall) return null;
  const caller = incomingCall.callerData;

  return (
    <Modal visible animationType="fade" transparent onRequestClose={rejectCall}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.glow} />
          <Avatar url={caller?.avatar} name={caller?.username} size={112} style={{ marginBottom: 20 }} />
          <Text style={styles.name}>{caller?.username}</Text>
          <Text style={styles.sub}>Incoming {incomingCall.isVideo ? 'Video' : 'Audio'} Call</Text>

          <View style={styles.actions}>
            <View style={styles.actionCol}>
              <TouchableOpacity style={styles.declineBtn} onPress={rejectCall}>
                <Ionicons name="call" size={26} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
              </TouchableOpacity>
              <Text style={styles.actionLabel}>Decline</Text>
            </View>

            <View style={styles.actionCol}>
              <TouchableOpacity style={styles.acceptBtn} onPress={acceptCall}>
                <Ionicons name={incomingCall.isVideo ? 'videocam' : 'call'} size={26} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.actionLabel}>Accept</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    backgroundColor: '#17151f',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.25)',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(168,85,247,0.18)',
  },
  name: { color: '#f5f3ff', fontSize: 22, fontWeight: '700' },
  sub: { color: '#c4b5fd', fontSize: 13, fontWeight: '600', marginTop: 6, marginBottom: 36 },
  actions: { flexDirection: 'row', gap: 40 },
  actionCol: { alignItems: 'center', gap: 8 },
  declineBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e11d48',
  },
  acceptBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
  },
  actionLabel: { color: '#c4b5fd', fontSize: 12, fontWeight: '600' },
});
