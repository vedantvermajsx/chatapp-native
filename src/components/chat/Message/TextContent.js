import { Text } from 'react-native';
import { styles } from './MessageStyles';

export function TextContent({ text, textColor, bubbleBg }) {
  if (!text) return null;
  const parts = text.split(/(@[a-zA-Z0-9_.-]+)/g);
  return (
    <Text style={[styles.msgText, { color: textColor }]}>
      {parts.map((part, i) =>
        part.startsWith('@') ? (
          <Text key={i} style={{ fontWeight: '700', color: bubbleBg, backgroundColor: textColor }}>
            {' '}{part}{' '}
          </Text>
        ) : (
          part
        )
      )}
    </Text>
  );
}
