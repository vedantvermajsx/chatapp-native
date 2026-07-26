import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../common/Avatar';

export default function CallScreen({ visible, target, isVideo, onEnd }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!visible) {
      setSeconds(0);
      setIsMuted(false);
      setIsVideoOff(false);
      return;
    }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [visible]);

  const durationStr = () => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onEnd}>
      <View style={styles.screen}>
        <View style={styles.content}>
          <View style={styles.glow} />
          <Avatar url={target?.avatar} name={target?.username} size={112} style={{ marginBottom: 20 }} />
          <Text style={styles.name}>{target?.username}</Text>
          <Text style={styles.status}>
            {seconds < 1 ? 'Calling\u2026' : isVideo ? `Video call \u00b7 ${durationStr()}` : `Audio call \u00b7 ${durationStr()}`}
          </Text>

          {isVideo && !isVideoOff && (
            <View style={styles.selfPreview}>
              <Ionicons name="person" size={26} color="rgba(255,255,255,0.5)" />
            </View>
          )}
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
            onPress={() => setIsMuted((v) => !v)}
          >
            <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={22} color={isMuted ? '#f87171' : '#fff'} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.endBtn} onPress={onEnd}>
            <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>

          {isVideo ? (
            <TouchableOpacity
              style={[styles.controlBtn, isVideoOff && styles.controlBtnActive]}
              onPress={() => setIsVideoOff((v) => !v)}
            >
              <Ionicons name={isVideoOff ? 'videocam-off' : 'videocam'} size={22} color={isVideoOff ? '#f87171' : '#fff'} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 50 }} />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(99,102,241,0.15)',
  },
  name: { color: '#fff', fontSize: 22, fontWeight: '600' },
  status: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 },
  selfPreview: {
    position: 'absolute',
    bottom: 130,
    right: 24,
    width: 90,
    height: 130,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    height: 110,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 26,
    backgroundColor: 'rgba(10,10,15,0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  controlBtn: {
    width: 50,
    height: 50,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnActive: { backgroundColor: 'rgba(239,68,68,0.2)' },
  endBtn: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
