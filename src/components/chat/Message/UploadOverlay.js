import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export function UploadOverlay({ progress }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.dim} />
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#fff" />
        {typeof progress === 'number' && progress > 0 ? (
          <Text style={styles.pct}>{progress}%</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  pct: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
