import { View, Text } from 'react-native';
import Avatar from '../common/Avatar';
import { useTheme } from '../../contexts/ThemeContext';
import { styles } from './styles';

export function TypingIndicator({ avatar, name, charCount }) {
  const { theme } = useTheme();
  return (
    <View style={styles.rowStart}>
      <Avatar url={avatar} name={name} size={30} style={{ marginRight: 8 }} />
      <View style={[styles.typingBubble, { backgroundColor: theme.otherMessageBubble }]}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.typingDot, { backgroundColor: theme.otherUsernameColor, opacity: 0.6, marginRight: i < 2 ? 4 : 0 }]} />
        ))}
        {typeof charCount === 'number' && (
          <Text style={{ fontSize: 10, marginLeft: 6, opacity: 0.7, color: theme.otherUsernameColor }}>{charCount}</Text>
        )}
      </View>
    </View>
  );
}
