import {useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import roomService from '../services/room.service';
import messageService from '../services/message.service';
import { useUnreadCounts } from '../contexts/UnreadCountsContext';
import { showApiError } from '../utils/toast';
import { generateRsaKeyPairPem } from '../utils/crypto';
import SidebarHeader from '../components/room/SidebarHeader';
import RoomSearch from '../components/room/RoomSearch';
import RoomTabBar from '../components/room/RoomTabBar';
import SidebarFooter from '../components/room/SidebarFooter';
import CreateRoomModal from '../components/room/CreateRoomModal';
import { useRoomsList } from '../hooks/room/useRoomsList';
import ChatsTab from '../components/room/ChatsTab';
import ExploreTab from '../components/room/ExploreTab';

export default function RoomListScreen({ navigation }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { unreadCounts, loadUnread } = useUnreadCounts();

  const accent = theme.primary || theme.myMessageBubble || '#008080';
  const borderColor = theme.isLight ? '#797f89ff' : '#374151';

  const {
    joinedRooms, setJoinedRooms,
    globalRooms,
    privateChats, setPrivateChats,
    activeTab, setActiveTab,
    searchQuery, setSearchQuery,
    refreshing, setRefreshing,
    showCreateRoom, setShowCreateRoom,
    newRoomName, setNewRoomName,
    newRoomDesc, setNewRoomDesc,
    creatingRoom, setCreatingRoom,
    loadingRooms,
    loadingGlobal,
    loadingPrivate,
    joiningRoomId, setJoiningRoomId,
    userResults,
    searchingUsers,
    loadJoined, loadGlobal, loadPrivate,
    handleStartPrivateChat, emitJoinRoom,
    isUserSearch, filteredJoined, filteredGlobal, filteredPrivate
  } = useRoomsList({ user });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadJoined(), loadGlobal(), loadPrivate(), loadUnread()]);
    setRefreshing(false);
  };

  const handleJoinRoom = async (room) => {
    try {
      setJoiningRoomId(room._id);
      const data = {
        roomId: room._id,
        message: `${user.username} joined the room`,
        media: null,
        isSystemMessage: true,
        systemType: 'member-joined',
        userId: user._id || user.id,
        username: user.username,
      };
      await roomService.joinRoom(room._id, data);
      emitJoinRoom(data);

      setJoinedRooms((prev) => (prev.some((r) => r._id === room._id) ? prev : [...prev, { ...room, __optimistic: true }]));

      setActiveTab('chats');
      navigation.navigate('Chat', { room });
    } catch (e) {
      showApiError(e, 'Failed to join room');
    } finally {
      setJoiningRoomId(null);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      Alert.alert('Missing name', 'Enter a room name');
      return;
    }
    setCreatingRoom(true);
    try {
      const { publicKeyPem, privateKeyPem } = await generateRsaKeyPairPem();
      const data = await roomService.createRoom(
        newRoomName.trim(),
        newRoomDesc.trim(),
        publicKeyPem,
        privateKeyPem
      );
      const newRoom = data.room;
      setShowCreateRoom(false);
      setNewRoomName('');
      setNewRoomDesc('');
      if (newRoom) {
        setJoinedRooms((prev) => (prev.some((r) => r._id === newRoom._id) ? prev : [...prev, newRoom]));
        loadJoined();
        loadGlobal();
        navigation.navigate('Chat', { room: newRoom });
      }
    } catch (e) {
      showApiError(e, 'Failed to create room');
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleDeletePrivateChat = (otherUserId) => {
    Alert.alert('Delete chat', 'Delete this private chat?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await messageService.deletePrivateChat(otherUserId);
            setPrivateChats((prev) => prev.filter((c) => (c.otherUser.id || c.otherUser._id) !== otherUserId));
          } catch (e) {
            showApiError(e, 'Failed to delete chat');
          }
        },
      },
    ]);
  };

  const myChatsUnread = useMemo(
    () => Object.values(unreadCounts).reduce((sum, n) => sum + (n || 0), 0),
    [unreadCounts]
  );

  const renderNewRoomBtn = () => {
    if (activeTab !== 'chats' || user?.role === 'guest') return null;
    return (
      <View style={[styles.newRoomWrap, { borderTopColor: borderColor }]}>
        <TouchableOpacity
          style={[styles.newRoomBtn, { backgroundColor: theme.isLight ? '#d5dbe1ff' : '#141b25ff' }]}
          onPress={() => setShowCreateRoom(true)}
          activeOpacity={0.6}
        >
          <View style={[styles.newRoomIcon, { backgroundColor: `${accent}18` }]}>
            <Ionicons name="add" size={20} color={accent} />
          </View>
          <Text style={[styles.newRoomText, { color: theme.otherMessageText }]}>Create new room</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={theme.isLight ? 'dark' : 'light'} backgroundColor={theme.background} />
      <SafeAreaView style={{ flex: 0, backgroundColor: theme.background }} edges={['top']} />
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['bottom']}>
        <View style={[styles.root, { backgroundColor: theme.background }]}>
          <SidebarHeader />
          <RoomSearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            placeholder={activeTab === 'explore' ? 'Search groups or @username...' : 'Search...'}
          />
          <RoomTabBar activeTab={activeTab} setActiveTab={setActiveTab} myChatsUnread={myChatsUnread} />
          <View style={{ flex: 1 }}>
            {activeTab === 'chats' && (
              <ChatsTab
                theme={theme}
                accent={accent}
                refreshing={refreshing}
                onRefresh={onRefresh}
                loadingRooms={loadingRooms}
                filteredJoined={filteredJoined}
                unreadCounts={unreadCounts}
                navigation={navigation}
                handleJoinRoom={handleJoinRoom}
                loadingPrivate={loadingPrivate}
                filteredPrivate={filteredPrivate}
                handleDeletePrivateChat={handleDeletePrivateChat}
              />
            )}
            {activeTab === 'explore' && (
              <ExploreTab
                theme={theme}
                accent={accent}
                isUserSearch={isUserSearch}
                user={user}
                userResults={userResults}
                searchingUsers={searchingUsers}
                navigation={navigation}
                handleStartPrivateChat={handleStartPrivateChat}
                refreshing={refreshing}
                onRefresh={onRefresh}
                loadingGlobal={loadingGlobal}
                filteredGlobal={filteredGlobal}
                unreadCounts={unreadCounts}
                handleJoinRoom={handleJoinRoom}
              />
            )}
          </View>
          {renderNewRoomBtn()}
          <SidebarFooter navigation={navigation} />

          <CreateRoomModal
            visible={showCreateRoom}
            onClose={() => setShowCreateRoom(false)}
            newRoomName={newRoomName}
            setNewRoomName={setNewRoomName}
            newRoomDesc={newRoomDesc}
            setNewRoomDesc={setNewRoomDesc}
            creatingRoom={creatingRoom}
            handleCreateRoom={handleCreateRoom}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  newRoomWrap: { paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1 },
  newRoomBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13, borderRadius: 16, borderWidth: 0 },
  newRoomIcon: { width: 28, height: 28, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  newRoomText: { flex: 1, fontSize: 12, fontWeight: '700' },
});
