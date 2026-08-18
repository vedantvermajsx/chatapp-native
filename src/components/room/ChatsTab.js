import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import RoomRow from './RoomRow';
import PrivateChatRow from './PrivateChatRow';
import { RoomListSkeleton } from '../common/Skeleton';

export default function ChatsTab({
  theme,
  accent,
  refreshing,
  onRefresh,
  loadingRooms,
  filteredJoined,
  unreadCounts,
  navigation,
  handleJoinRoom,
  loadingPrivate,
  filteredPrivate,
  handleDeletePrivateChat,
}) {
  const renderSectionHeader = (label) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.otherUsernameColor }]}>{label}</Text>
    </View>
  );

  return (
    <ScrollView
      refreshControl={<RefreshControl tintColor={accent} refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {renderSectionHeader('Groups')}
      {loadingRooms && filteredJoined.length === 0 ? (
        <RoomListSkeleton rows={3} />
      ) : filteredJoined.length === 0 ? (
        <Text style={styles.emptyInline}>Join a group from Explore</Text>
      ) : (
        filteredJoined.map((r) => (
          <RoomRow
            key={r._id}
            item={r}
            isJoined={true}
            unreadCounts={unreadCounts}
            navigation={navigation}
            handleJoinRoom={handleJoinRoom}
          />
        ))
      )}

      {renderSectionHeader('Private Chats')}
      {loadingPrivate && filteredPrivate.length === 0 ? (
        <RoomListSkeleton rows={3} />
      ) : filteredPrivate.length === 0 ? (
        <Text style={styles.emptyInline}>No private chats yet</Text>
      ) : (
        filteredPrivate.map((c) => (
          <PrivateChatRow
            key={c.otherUser?.id || c.otherUser?._id}
            chat={c}
            unreadCounts={unreadCounts}
            navigation={navigation}
            handleDeletePrivateChat={handleDeletePrivateChat}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  emptyInline: { paddingHorizontal: 16, paddingVertical: 8, color: '#9ca3af', fontSize: 12.5 },
});
