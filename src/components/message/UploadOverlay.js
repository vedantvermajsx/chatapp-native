import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { styles } from './styles';

export function UploadOverlay({ progress }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.uploadDim} />
      <View style={styles.uploadCenter}>
        <ActivityIndicator size="small" color="#fff" />
        {typeof progress === 'number' && progress > 0 ? (
          <Text style={styles.uploadPct}>{progress}%</Text>
        ) : null}
      </View>
    </View>
  );
}
