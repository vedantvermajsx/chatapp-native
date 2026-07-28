import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, PanResponder, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCall } from '../../contexts/CallContext';
import CallContent from './CallContent';
import { styles } from './styles';

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
      style={[styles.miniWrap, { transform: pos.getTranslateTransform() }]}
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

      <View style={styles.miniFooter}>
        <View style={styles.miniFooterText}>
          <Text style={styles.miniName} numberOfLines={1}>{target?.username}</Text>
          <Text style={styles.miniStatus} numberOfLines={1}>
            {isConnecting ? 'Calling...' : isVideo ? `Video \u00b7 ${durationStr}` : `Audio \u00b7 ${durationStr}`}
          </Text>
        </View>
        <View style={styles.miniFooterActions}>
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
