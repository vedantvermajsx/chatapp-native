import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export function SkeletonBlock({ width = '100%', height = 12, radius = 6, style }) {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  const base = theme.skeletonBase || theme.otherUsernameColor || '#9ca3af';

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: base, opacity },
        style,
      ]}
    />
  );
}

export function RoomRowSkeleton() {
  return (
    <View style={styles.roomItem}>
      <SkeletonBlock width={44} height={44} radius={22} />
      <View style={styles.roomInfo}>
        <SkeletonBlock width="55%" height={13} style={{ marginBottom: 8 }} />
        <SkeletonBlock width="80%" height={11} />
      </View>
    </View>
  );
}

export function RoomListSkeleton({ rows = 5 }) {
  return (
    <View>
      {Array.from({ length: rows }).map((_, i) => (
        <RoomRowSkeleton key={i} />
      ))}
    </View>
  );
}

export function MessageBubbleSkeleton({ mine = false, width = '55%' }) {
  return (
    <View style={[styles.bubbleRow, mine && { justifyContent: 'flex-end' }]}>
      {!mine && <SkeletonBlock width={28} height={28} radius={14} style={{ marginRight: 8 }} />}
      <SkeletonBlock width={width} height={38} radius={14} />
    </View>
  );
}

export function ChatMessagesSkeleton() {
  const pattern = [
    { mine: false, width: '50%' },
    { mine: false, width: '65%' },
    { mine: true, width: '45%' },
    { mine: false, width: '40%' },
    { mine: true, width: '58%' },
    { mine: true, width: '35%' },
  ];
  return (
    <View style={styles.messagesWrap}>
      {pattern.map((p, i) => (
        <MessageBubbleSkeleton key={i} mine={p.mine} width={p.width} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  roomItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, gap: 12, height: 68 },
  roomInfo: { flex: 1, minWidth: 0 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, marginVertical: 6 },
  messagesWrap: { flex: 1, justifyContent: 'flex-end', paddingBottom: 12 },
});
