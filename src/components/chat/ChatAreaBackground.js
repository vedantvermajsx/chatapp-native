import { ImageBackground, View } from 'react-native';

export function ChatAreaBackground({ uri, children }) {
  if (!uri) {
    return <View style={{ flex: 1 }}>{children}</View>;
  }
  return (
    <ImageBackground source={{ uri }} style={{ flex: 1 }} resizeMode="cover">
      {children}
    </ImageBackground>
  );
}
