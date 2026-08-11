import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../common/Avatar';
import { styles } from './styles';

const FALLBACK_AVATAR = 'https://res.cloudinary.com/dfxi4ihfs/image/upload/w_50,h_50,c_fill/v1782369805/male_g68rxt.avif';

export default function CallContent({
  isVideo,
  isConnecting,
  isMinimized,
  isLost,
  remoteStream,
  localStream,
  target,
  durationStr,
}) {
  const showRemoteVideo = isVideo && remoteStream && !isConnecting;

  const pulse = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isMinimized) return;
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    glowLoop.start();
    return () => glowLoop.stop();
  }, [isMinimized, pulse]);

  useEffect(() => {
    if (isMinimized || !isConnecting) return;
    const ringLoop = Animated.loop(
      Animated.timing(ring, { toValue: 1, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: true })
    );
    ringLoop.start();
    return () => ringLoop.stop();
  }, [isMinimized, isConnecting, ring]);

  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const ringScale = ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const ringOpacity = ring.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  return (
    <View style={styles.contentWrap}>
      {showRemoteVideo && (
        <RTCView streamURL={remoteStream.toURL()} style={StyleSheet.absoluteFill} objectFit="cover" />
      )}

      {!showRemoteVideo && (
        <View style={isMinimized ? styles.centerFillDark : styles.centerColumn}>
          {!isMinimized && (
            <Animated.View style={[styles.glow, { transform: [{ scale: glowScale }], opacity: glowOpacity }]} />
          )}
          {!isMinimized && isConnecting && (
            <Animated.View style={[styles.connectingRing, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
          )}
          <Avatar
            url={target?.avatar || FALLBACK_AVATAR}
            name={target?.username}
            size={isMinimized ? 64 : 112}
            style={isMinimized ? undefined : { marginBottom: 16 }}
          />
          {!isMinimized && (
            <View style={styles.textWrap}>
              <Text style={styles.contentName}>{target?.username}</Text>
              <Text style={styles.contentStatus}>
                {isConnecting ? 'Calling\u2026' : isVideo ? `Video call \u00b7 ${durationStr}` : `Audio call \u00b7 ${durationStr}`}
              </Text>
            </View>
          )}
        </View>
      )}

      {isVideo && localStream && (
        <View style={isMinimized ? styles.localPreviewMini : styles.localPreview}>
          <RTCView
            streamURL={localStream.toURL()}
            style={StyleSheet.absoluteFill}
            objectFit="cover"
            mirror
            zOrder={1}
          />
        </View>
      )}

      {!isMinimized && isLost && (
        <View style={styles.lostBadge}>
          <Ionicons name="wifi-outline" size={14} color="#fff" />
          <Text style={styles.lostText}>Connection Lost</Text>
        </View>
      )}
    </View>
  );
}
