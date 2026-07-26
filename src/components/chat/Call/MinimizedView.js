import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, PanResponder, Animated, Dimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCall } from '../../../contexts/CallContext';
import CallContent from './CallContent';

const MINIMIZED_W = 150;
const MINIMIZED_H = 220;
const EDGE_PADDING = 12;

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

export default function MinimizedView({ target, isVideo, isConnecting, isLost, remoteStream, localStream, durationStr }) {
  const { isMuted, toggleMute, endCall, toggleMinimize } = useCall();

  const win = Dimensions.get('window');
  const pos = useRef(
    new Animated.ValueXY({
      x: win.width - MINIMIZED_W - EDGE_PADDING,
      y: win.height - MINIMIZED_H - 140,
    })
  ).current;
  const posValue = useRef({
    x: win.width - MINIMIZED_W - EDGE_PADDING,
    y: win.height - MINIMIZED_H - 140,
  });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
      onPanResponderMove: (_, gesture) => {
        const nextX = clamp(posValue.current.x + gesture.dx, EDGE_PADDING, win.width - MINIMIZED_W - EDGE_PADDING);
        const nextY = clamp(posValue.current.y + gesture.dy, EDGE_PADDING, win.height - MINIMIZED_H - EDGE_PADDING);
        pos.setValue({ x: nextX, y: nextY });
      },
      onPanResponderRelease: (_, gesture) => {
        posValue.current = {
          x: clamp(posValue.current.x + gesture.dx, EDGE_PADDING, win.width - MINIMIZED_W - EDGE_PADDING),
          y: clamp(posValue.current.y + gesture.dy, EDGE_PADDING, win.height - MINIMIZED_H - EDGE_PADDING),
        };
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[styles.wrap, { transform: pos.getTranslateTransform() }]}
    >
      <TouchableOpacity style={styles.expandBadge} onPress={toggleMinimize}>
        <Ionicons name="expand-outline" size={14} color="rgba(255,255,255,0.85)" />
      </TouchableOpacity>

      <CallContent
        isVideo={isVideo}
        isConnecting={isConnecting}
        isMinimized
        isLost={isLost}
        remoteStream={remoteStream}
        localStream={localStream}
        target={target}
        durationStr={durationStr}
      />

      <View style={styles.footer}>
        <View style={styles.footerText}>
          <Text style={styles.name} numberOfLines={1}>{target?.username}</Text>
          <Text style={styles.status} numberOfLines={1}>
            {isConnecting ? 'Calling...' : isVideo ? `Video \u00b7 ${durationStr}` : `Audio \u00b7 ${durationStr}`}
          </Text>
        </View>
        <View style={styles.footerActions}>
          <TouchableOpacity style={[styles.miniBtn, isMuted && styles.miniBtnActive]} onPress={toggleMute}>
            <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={14} color={isMuted ? '#f87171' : '#fff'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.miniEndBtn} onPress={endCall}>
            <Ionicons name="call" size={14} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: MINIMIZED_W,
    height: MINIMIZED_H,
    zIndex: 999,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0a0a0f',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  expandBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 30,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  footer: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    backgroundColor: '#111318',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  footerText: { flex: 1, minWidth: 0, marginRight: 6 },
  name: { color: '#fff', fontSize: 12, fontWeight: '600' },
  status: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 1 },
  footerActions: { flexDirection: 'row', gap: 6 },
  miniBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  miniBtnActive: { backgroundColor: 'rgba(239,68,68,0.2)' },
  miniEndBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
  },
});
