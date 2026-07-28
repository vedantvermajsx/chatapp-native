import { View, Text, TouchableOpacity } from 'react-native';
import Avatar from '../common/Avatar';
import { useTheme } from '../../contexts/ThemeContext';
import { styles } from './styles';

export default function RoomRow({
  item,
  isJoined,
  unreadCounts,
  navigation,
  handleJoinRoom,
}) {
  const { theme } = useTheme();
  const accent = theme.primary || theme.myMessageBubble || '#008080';

  const name = item.groupName || item.name || 'Room';
  const desc = item.groupDescription || '';
  const unread = isJoined ? (unreadCounts[`room_${item._id}`] || 0) : 0;

  return (
    <TouchableOpacity
      style={styles.roomItem}
      onPress={() =>
        isJoined
          ? navigation.navigate('Chat', { room: item, unreadCount: unread })
          : handleJoinRoom(item)
      }
      activeOpacity={0.5}
      disabled={!!item.isDeleted && isJoined}
    >
      <Avatar url={item.groupPic} name={name} size={44} />
      <View style={styles.roomInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[styles.roomName, { color: theme.otherMessageText, flexShrink: 1 }]} numberOfLines={1}>
            {name}
          </Text>
          {!isJoined && (
            <Text style={[styles.memberCountText, { color: theme.otherUsernameColor }]}>
              {item.memberCount ?? item.members?.length ?? 0}
            </Text>
          )}
        </View>
        <Text style={[styles.roomDesc, { color: item.isDeleted ? '#ef4444' : '#9ca3af' }]} numberOfLines={1}>
          {item.isDeleted
            ? 'This room has been deleted'
            : desc || (isJoined ? 'No description' : 'Tap to join')}
        </Text>
      </View>
      {unread > 0 && (
        <View style={[styles.unreadBadge, { backgroundColor: accent }]}>
          <Text style={styles.unreadBadgeText}>{unread > 99 ? '99+' : unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
