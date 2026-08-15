import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

const BACKGROUND_BLUR_RADIUS = 1;

export function ChatAreaBackground({ uri, children }) {
  if (!uri) {
    return <View style={{ flex: 1 }}>{children}</View>;
  }
  return (
    <View style={{ flex: 1 }}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        blurRadius={BACKGROUND_BLUR_RADIUS}
      />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}