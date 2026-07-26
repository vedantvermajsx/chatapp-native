import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { toDisplayUrl } from '../../utils/imageUrl';



export default function Avatar({ url, name, size = 40, isOnline, style }) {
  const { theme } = useTheme();
  const accent = theme.primary || theme.myMessageBubble || '#008080';
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';

  return (
    <View style={[{ width: size, height: size }, style]}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: `${accent}22`,
          },
        ]}
      >
        {url ? (
          <Image source={{ uri: toDisplayUrl(url) }} style={{ width: size, height: size, borderRadius: size / 2 }} />
        ) : (
          <Text style={{ color: accent, fontWeight: '700', fontSize: size * 0.4 }}>{initial}</Text>
        )}
      </View>
      {typeof isOnline === 'boolean' && (
        <View
          style={[
            styles.dot,
            {
              backgroundColor: isOnline ? '#22c55e' : '#9ca3af',
              borderColor: theme.background,
              width: Math.max(10, size * 0.28),
              height: Math.max(10, size * 0.28),
              borderRadius: Math.max(5, size * 0.14),
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  dot: { position: 'absolute', bottom: -1, right: -1, borderWidth: 2 },
});
