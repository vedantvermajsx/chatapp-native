import { ImageBackground, View } from 'react-native';

/**
 * Wraps the message-list area of ChatScreen. When the user has set a chat
 * background (registered users only — see contexts/ThemeContext.js), it's
 * rendered behind the messages; otherwise this is just a transparent flex
 * container and the screen's normal theme background shows through.
 */
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
