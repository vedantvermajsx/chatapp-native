import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCall } from '../../../contexts/CallContext';

export default function CallControls({ isVideo }) {
  const { endCall, isMuted, isVideoOff, toggleMute, toggleVideo } = useCall();

  return (
    <View style={styles.bar}>
      <TouchableOpacity
        style={[styles.btn, isMuted && styles.btnActive]}
        onPress={toggleMute}
      >
        <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={22} color={isMuted ? '#f87171' : '#fff'} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.endBtn} onPress={endCall}>
        <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
      </TouchableOpacity>

      {isVideo ? (
        <TouchableOpacity
          style={[styles.btn, isVideoOff && styles.btnActive]}
          onPress={toggleVideo}
        >
          <Ionicons name={isVideoOff ? 'videocam-off' : 'videocam'} size={22} color={isVideoOff ? '#f87171' : '#fff'} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 50 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 110,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 26,
    backgroundColor: 'rgba(10,10,15,0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  btn: {
    width: 50,
    height: 50,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActive: { backgroundColor: 'rgba(239,68,68,0.2)' },
  endBtn: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
