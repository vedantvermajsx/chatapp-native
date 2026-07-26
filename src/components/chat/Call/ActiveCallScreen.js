import React, { useState, useEffect } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCall } from '../../../contexts/CallContext';
import CallControls from './CallControls';
import CallContent from './CallContent';
import MinimizedView from './MinimizedView';

export default function ActiveCallScreen() {
  const {
    activeCall,
    localStream,
    remoteStream,
    connectionState,
    isMinimized,
    toggleMinimize,
    callConnectedTime,
  } = useCall();

  const [durationStr, setDurationStr] = useState('00:00:00');

  useEffect(() => {
    if (!callConnectedTime || connectionState !== 'connected') {
      setDurationStr('00:00:00');
      return;
    }
    const tick = () => {
      const secs = Math.floor((Date.now() - callConnectedTime) / 1000);
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      setDurationStr(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [callConnectedTime, connectionState]);

  if (!activeCall) return null;

  const isVideo = activeCall.isVideo;
  const isConnecting = activeCall.status === 'calling';
  const isLost = connectionState === 'disconnected' || connectionState === 'failed';
  const target = activeCall.targetData;

  const sharedProps = {
    isVideo,
    isConnecting,
    isLost,
    remoteStream,
    localStream,
    target,
    durationStr,
  };

  if (isMinimized) {
    return <MinimizedView {...sharedProps} />;
  }

  return (
    <Modal visible animationType="fade" transparent={false} onRequestClose={toggleMinimize}>
      <View style={styles.screen}>
        <TouchableOpacity style={styles.minimizeBtn} onPress={toggleMinimize}>
          <Ionicons name="contract-outline" size={22} color="#fff" />
        </TouchableOpacity>

        <CallContent {...sharedProps} isMinimized={false} />
        <CallControls isVideo={isVideo} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0a0a0f' },
  minimizeBtn: {
    position: 'absolute',
    top: 48,
    left: 20,
    zIndex: 30,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
});
