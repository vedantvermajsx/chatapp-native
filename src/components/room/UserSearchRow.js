import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Avatar from '../common/Avatar';
import { useTheme } from '../../contexts/ThemeContext';
import { styles } from './styles';

export default function UserSearchRow({ user, navigation }) {
  const { theme } = useTheme();
  const accent = theme.primary || theme.myMessageBubble || '#008080';
  const userId = user.id || user._id;

  const handleStartChat = () => {
    navigation.navigate('Chat', {
      privateChat: { ...user, id: userId },
    });
  };

  return (
    <View style={styles.roomItem}>
      <Avatar url={user.avatar} name={user.username} size={44} isOnline={user.isOnline} />
      <View style={styles.roomInfo}>
        <Text style={[styles.roomName, { color: theme.otherMessageText }]} numberOfLines={1}>
          {user.username}
        </Text>
        {!!user.bio && (
          <Text style={[styles.roomDesc, { color: '#9ca3af' }]} numberOfLines={1}>
            {user.bio}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={[userSearchStyles.chatBtn, { backgroundColor: accent }]}
        onPress={handleStartChat}
        activeOpacity={0.8}
      >
        <Text style={userSearchStyles.chatBtnText}>Chat</Text>
      </TouchableOpacity>
    </View>
  );
}

const userSearchStyles = StyleSheet.create({
  chatBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  chatBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
