import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { formatSeenAt } from '../../../utils/dateUtils';
import { SYSTEM_ICONS } from '../../common/SystemIcons';
import { styles } from './MessageStyles';

export function SystemMessage({ msg, isPrivateChat }) {
  const { theme } = useTheme();
  const icon = msg.systemType ? SYSTEM_ICONS[msg.systemType] : null;
  return (
    <View style={styles.systemWrap}>
      <View style={[styles.systemPill, { borderColor: theme.otherMessageBubble }]}>
        {icon && <Ionicons name={icon} size={13} color={theme.otherMessageText} style={{ marginRight: 6 }} />}
        <Text style={[styles.systemText, { color: theme.otherMessageText }]}>{msg.text}</Text>
      </View>
      {msg.isOwn && !msg.isPending && isPrivateChat && msg.isSeen && (
        <Text style={styles.seenText}>{formatSeenAt(msg.seenAt)}</Text>
      )}
    </View>
  );
}
