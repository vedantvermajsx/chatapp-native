import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import RoomRow from './RoomRow';
import UserSearchRow from './UserSearchRow';
import { RoomListSkeleton } from '../common/Skeleton';

export default function ExploreTab({
  theme,
  accent,
  isUserSearch,
  user,
  userResults,
  searchingUsers,
  navigation,
  handleStartPrivateChat,
  refreshing,
  onRefresh,
  loadingGlobal,
  filteredGlobal,
  unreadCounts,
  handleJoinRoom,
}) {
  const renderSectionHeader = (label) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.otherUsernameColor }]}>{label}</Text>
    </View>
  );

  if (isUserSearch) {
    const myId = user?._id || user?.id;
    const people = userResults.filter((u) => (u.id || u._id) !== myId);
    return (
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {renderSectionHeader('People')}
        {searchingUsers && people.length === 0 ? (
          <RoomListSkeleton rows={3} />
        ) : people.length === 0 ? (
          <Text style={styles.emptyInline}>No users found</Text>
        ) : (
          people.map((u) => (
            <UserSearchRow key={u.id || u._id} user={u} navigation={navigation} onStartChat={handleStartPrivateChat} />
          ))
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      refreshControl={<RefreshControl tintColor={accent} refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {renderSectionHeader('All Groups')}
      {loadingGlobal ? (
        <RoomListSkeleton rows={5} />
      ) : filteredGlobal.length === 0 ? (
        <Text style={styles.emptyInline}>You've joined every available room</Text>
      ) : (
        filteredGlobal.map((r) => (
          <RoomRow
            key={r._id}
            item={r}
            isJoined={false}
            unreadCounts={unreadCounts}
            navigation={navigation}
            handleJoinRoom={handleJoinRoom}
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
