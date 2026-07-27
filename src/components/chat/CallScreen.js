import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RTCView } from 'react-native-webrtc';
import Avatar from '../common/Avatar';
import { useCall } from '../../contexts/CallContext';

export default function CallScreen() {
  const {
    callState,
    isVideo,
    peer,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    error,
    clearError,
    endCall,
    toggleMute,
    toggleCamera,
    switchCamera,
  } = useCall();

  const [seconds, setSeconds] = useState(0);
  const visible = callState === 'outgoing' || callState === 'connected';

  useEffect(() => {
    if (callState !== 'connected') {
      setSeconds(0);
      return;
    }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [callState]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(clearError, 3000);
      return () => clearTimeout(t);
    }
  }, [error, clearError]);

  if (!visible) return null;

  const durationStr = () => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const statusText =
    callState === 'outgoing'
      ? 'Calling\u2026'
      : isVideo
      ? `Video call \u00b7 ${durationStr()}`
      : `Audio call \u00b7 ${durationStr()}`;

  const showRemoteVideo = isVideo && remoteStream && callState === 'connected';
  const showLocalVideo = isVideo && localStream && !isCameraOff;

  return (
    <Modal visible animationType="fade" transparent={false} onRequestClose={endCall}>
      <View style={styles.screen}>
        {showRemoteVideo ? (
          <RTCView streamURL={remoteStream.toURL()} style={StyleSheet.absoluteFill} objectFit="cover" />
        ) : (
          <View style={styles.content}>
            <View style={styles.glow} />
            <Avatar url={peer?.avatar} name={peer?.username} size={112} style={{ marginBottom: 20 }} />
            <Text style={styles.name}>{peer?.username}</Text>
            <Text style={styles.status}>{statusText}</Text>
          </View>
        )}

        {showRemoteVideo && (
          <View style={styles.topOverlay}>
            <Text style={styles.overlayName}>{peer?.username}</Text>
            <Text style={styles.overlayStatus}>{durationStr()}</Text>
          </View>
        )}

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {showLocalVideo && (
          <TouchableOpacity style={styles.selfPreview} onPress={switchCamera} activeOpacity={0.85}>
            <RTCView streamURL={localStream.toURL()} style={StyleSheet.absoluteFill} objectFit="cover" mirror />
          </TouchableOpacity>
        )}
        {isVideo && !showLocalVideo && !showRemoteVideo && (
          <View style={styles.selfPreview}>
            <Ionicons name="videocam-off" size={22} color="rgba(255,255,255,0.5)" />
          </View>
        )}

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
            onPress={toggleMute}
          >
            <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={22} color={isMuted ? '#f87171' : '#fff'} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.endBtn} onPress={endCall}>
            <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>

          {isVideo ? (
            <TouchableOpacity
              style={[styles.controlBtn, isCameraOff && styles.controlBtnActive]}
              onPress={toggleCamera}
            >
              <Ionicons name={isCameraOff ? 'videocam-off' : 'videocam'} size={22} color={isCameraOff ? '#f87171' : '#fff'} />
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
  topOverlay: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  overlayName: { color: '#fff', fontSize: 16, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 4 },
  overlayStatus: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 4 },
  errorBanner: {
    position: 'absolute',
    top: 56,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(239,68,68,0.9)',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  errorText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  selfPreview: {
    position: 'absolute',
    bottom: 130,
    right: 24,
    width: 90,
    height: 130,
    borderRadius: 18,
    overflow: 'hidden',
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
