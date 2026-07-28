import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../common/Avatar';
import { useTheme } from '../../contexts/ThemeContext';
import { styles } from './styles';

export default function PrivateChatRow({
  chat,
  unreadCounts,
  navigation,
  handleDeletePrivateChat,
}) {
  const { theme } = useTheme();
  const accent = theme.primary || theme.myMessageBubble || '#008080';

  const other = chat.otherUser || {};
  const otherId = other.id || other._id;
  const lastText = (chat.lastMessage?.content || '').replace('__SYSTEM_CALL__', '');
  const unread = unreadCounts[`private_${otherId}`] || 0;

  return (
    <TouchableOpacity
      style={styles.roomItem}
      onPress={() =>
        navigation.navigate('Chat', {
          privateChat: { ...other, id: otherId },
          unreadCount: unread,
        })
      }
      activeOpacity={0.5}
    >
      <Avatar url={other.avatar} name={other.username} size={44} isOnline={other.isOnline} />
      <View style={styles.roomInfo}>
        <Text style={[styles.roomName, { color: theme.otherMessageText }]} numberOfLines={1}>
          {other.username}
        </Text>
        <Text style={[styles.roomDesc, { color: '#9ca3af' }]} numberOfLines={1}>
          {lastText || 'Start a conversation'}
        </Text>
      </View>
      {unread > 0 && (
        <View style={[styles.unreadBadge, { backgroundColor: accent }]}>
          <Text style={styles.unreadBadgeText}>{unread > 99 ? '99+' : unread}</Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDeletePrivateChat(otherId)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={16} color="#ef4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
