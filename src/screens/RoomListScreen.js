import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, RefreshControl, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import roomService from '../services/room.service';
import messageService from '../services/message.service';
import userService from '../services/user.service';
import { useChatSocket, getActiveChatKey } from '../hooks/useChatSocket';
import Spinner from '../components/common/Spinner';
import { dbService } from '../services/localDB.service';
import { showApiError } from '../utils/toast';
import { generateRsaKeyPairPem } from '../utils/crypto';

import SidebarHeader from '../components/room/SidebarHeader';
import RoomSearch from '../components/room/RoomSearch';
import RoomTabBar from '../components/room/RoomTabBar';
import RoomRow from '../components/room/RoomRow';
import PrivateChatRow from '../components/room/PrivateChatRow';
import UserSearchRow from '../components/room/UserSearchRow';
import SidebarFooter from '../components/room/SidebarFooter';
import CreateRoomModal from '../components/room/CreateRoomModal';

export default function RoomListScreen({ navigation }) {
  const { user} = useAuth();
  const { theme } = useTheme();
  const [joinedRooms, setJoinedRooms] = useState([]);
  const [globalRooms, setGlobalRooms] = useState([]);
  const [privateChats, setPrivateChats] = useState([]);
  const [activeTab, setActiveTab] = useState('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [loadingPrivate, setLoadingPrivate] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [userResults, setUserResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const accent = theme.primary || theme.myMessageBubble || '#008080';
  const borderColor = theme.isLight ? '#797f89ff' : '#374151';

  const loadJoined = useCallback(async () => {
    const cached = await dbService.getCachedJoinedRooms();
    if (cached.length) setJoinedRooms((prev) => (prev.length ? prev : cached));

    setLoadingRooms(true);
    try {
      const data = await roomService.getJoinedRooms();
      const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : (data.rooms || []));
      setJoinedRooms((prev) => {
        const serverIds = new Set(list.map((r) => r._id));
        const notYetOnServer = prev.filter((r) => !serverIds.has(r._id) && r.__optimistic);
        return [...list, ...notYetOnServer];
      });
      await dbService.saveJoinedRooms(list);
    } catch (e) {
      if (!cached.length) {
        setJoinedRooms([]);
        showApiError(e, 'Could not load rooms');
      }
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  const loadGlobal = useCallback(async () => {
    const cached = await dbService.getRooms('');
    if (cached.length) setGlobalRooms((prev) => (prev.length ? prev : cached));

    setLoadingGlobal(true);
    try {
      const data = await roomService.getAllRooms();
      const list = Array.isArray(data) ? data : (data.rooms || []);
      setGlobalRooms(list);
      await dbService.saveRooms(list, '');
    } catch (e) {
      if (!cached.length) {
        setGlobalRooms([]);
        showApiError(e, 'Could not load rooms');
      }
    } finally {
      setLoadingGlobal(false);
    }
  }, []);

  const loadPrivate = useCallback(async () => {
    const cached = await dbService.getPrivateChats();
    if (cached.length) setPrivateChats((prev) => (prev.length ? prev : cached));

    setLoadingPrivate(true);
    try {
      const data = await messageService.getPrivateChats();
      const list = Array.isArray(data) ? data : (data.chats || []);
      setPrivateChats(list);
      await dbService.savePrivateChats(list);
    } catch (e) {
      if (!cached.length) {
        setPrivateChats([]);
        showApiError(e, 'Could not load chats');
      }
    } finally {
      setLoadingPrivate(false);
    }
  }, []);

  const handleRoomEvent = useCallback((evt) => {
    if (!evt) return;
    if (evt.type === 'new') {
      loadJoined();
      loadGlobal();
    } else if (evt.type === 'updated' && evt.room) {
      const id = evt.room._id || evt.room.id;
      setJoinedRooms((prev) => prev.map((r) => (r._id === id ? { ...r, ...evt.room } : r)));
      setGlobalRooms((prev) => prev.map((r) => (r._id === id ? { ...r, ...evt.room } : r)));
    } else if (evt.type === 'deleted' && evt.roomId) {
      setJoinedRooms((prev) => prev.filter((r) => r._id !== evt.roomId));
      setGlobalRooms((prev) => prev.filter((r) => r._id !== evt.roomId));
    }
  }, [loadJoined, loadGlobal]);

  const handlePrivateMessage = useCallback((msg) => {
    const myId = user?._id || user?.id;
    const isOwnMessage = msg.senderId === myId;
    const otherUserId = isOwnMessage ? msg.receiverId : msg.senderId;
    if (!otherUserId) return;

    let isBrandNew = false;
    setPrivateChats((prev) => {
      const idx = prev.findIndex((c) => (c.otherUser?.id || c.otherUser?._id) === otherUserId);
      const lastMessage = { content: msg.content, timestamp: msg.timestamp || new Date().toISOString() };

      if (idx !== -1) {
        const updated = [...prev];
        const [existing] = updated.splice(idx, 1);
        const next = [{ ...existing, lastMessage }, ...updated];
        dbService.savePrivateChats(next);
        return next;
      }

      isBrandNew = true;

      if (!isOwnMessage) {
        const otherUser = {
          id: otherUserId,
          username: msg.senderUsername || msg.username || 'Unknown',
          role: (msg.senderModel?.toLowerCase() || 'user'),
          avatar: msg.avatar || null,
          isOnline: msg.isOnline,
        };
        const next = [{ otherUser, lastMessage }, ...prev];
        dbService.savePrivateChats(next);
        return next;
      }

      return prev;
    });

    if (isOwnMessage && isBrandNew) {
      loadPrivate();
    }
  }, [user, loadPrivate]);

  const loadUnread = useCallback(async () => {
    const cached = await dbService.loadUnreadCounts();
    if (Object.keys(cached).length) setUnreadCounts((prev) => (Object.keys(prev).length ? prev : cached));

    try {
      const counts = await roomService.getUnreadCounts();
      const next = counts && typeof counts === 'object' ? { ...counts } : {};
      const activeKey = getActiveChatKey();
      if (activeKey) delete next[activeKey];
      setUnreadCounts(next);
      await dbService.saveUnreadCounts(next);
    } catch (e) {
      
    }
  }, []);

  const handleUnreadUpdate = useCallback(({ chatKey } = {}) => {
    if (!chatKey || chatKey === getActiveChatKey()) return;
    setUnreadCounts((prev) => {
      const next = { ...prev, [chatKey]: (prev[chatKey] || 0) + 1 };
      dbService.saveUnreadCounts(next);
      return next;
    });
  }, []);

  const handleRoomReadAck = useCallback(({ roomId }) => {
    if (!roomId) return;
    setUnreadCounts((prev) => {
      const key = `room_${roomId}`;
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      dbService.saveUnreadCounts(next);
      return next;
    });
  }, []);

  const { emitJoinRoom } = useChatSocket(user, {
    onRoomEvent: handleRoomEvent,
    onPrivateMessage: handlePrivateMessage,
    onUnreadUpdate: handleUnreadUpdate,
    onRoomReadAck: handleRoomReadAck,
  });

  useEffect(() => {
    loadJoined();
    loadGlobal();
    loadPrivate();
    loadUnread();
  }, [loadJoined, loadGlobal, loadPrivate, loadUnread]);

  useFocusEffect(
    useCallback(() => {
      loadJoined();
      loadUnread();
      loadPrivate();
    }, [loadJoined, loadUnread, loadPrivate])
  );

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

  const isUserSearch = activeTab === 'explore' && searchQuery.trim().startsWith('@');

  useEffect(() => {
    if (!isUserSearch) {
      setUserResults([]);
      return;
    }
    const q = searchQuery.trim().slice(1);
    if (!q) {
      setUserResults([]);
      return;
    }
    setSearchingUsers(true);
    const t = setTimeout(async () => {
      try {
        const results = await userService.searchUsers(q, 5);
        setUserResults(Array.isArray(results) ? results.slice(0, 5) : []);
      } catch (e) {
        setUserResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [isUserSearch, searchQuery]);

  const filteredJoined = useMemo(() => {
    if (!searchQuery) return joinedRooms;
    const q = searchQuery.toLowerCase();
    return joinedRooms.filter(r => (r.groupName || r.name || '').toLowerCase().includes(q));
  }, [joinedRooms, searchQuery]);

  const filteredGlobal = useMemo(() => {
    const joinedIds = new Set(joinedRooms.map(r => r._id));
    let list = globalRooms.filter(r => !joinedIds.has(r._id));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => (r.groupName || r.name || '').toLowerCase().includes(q));
    }
    return list;
  }, [globalRooms, joinedRooms, searchQuery]);

  const filteredPrivate = useMemo(() => {
    if (!searchQuery) return privateChats;
    const q = searchQuery.toLowerCase();
    return privateChats.filter(c => (c.otherUser?.username || '').toLowerCase().includes(q));
  }, [privateChats, searchQuery]);

  const myChatsUnread = useMemo(
    () => Object.values(unreadCounts).reduce((sum, n) => sum + (n || 0), 0),
    [unreadCounts]
  );

  const renderSectionHeader = (label) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.otherUsernameColor }]}>{label}</Text>
    </View>
  );

  const renderChatsList = () => (
    <ScrollView
      refreshControl={<RefreshControl tintColor={accent} refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {renderSectionHeader('Groups')}
      {loadingRooms && filteredJoined.length === 0 ? (
        <View style={{ padding: 24 }}><Spinner size="large" /></View>
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
        <View style={{ padding: 24 }}><Spinner size="large" /></View>
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

  const renderExploreList = () => {
    if (isUserSearch) {
      const myId = user?._id || user?.id;
      const people = userResults.filter((u) => (u.id || u._id) !== myId);
      return (
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {renderSectionHeader('People')}
          {searchingUsers && people.length === 0 ? (
            <View style={{ padding: 24 }}><Spinner size="large" /></View>
          ) : people.length === 0 ? (
            <Text style={styles.emptyInline}>No users found</Text>
          ) : (
            people.map((u) => (
              <UserSearchRow key={u.id || u._id} user={u} navigation={navigation} />
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
          <View style={{ padding: 24 }}><Spinner size="large" /></View>
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
  };

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
            {activeTab === 'chats' && renderChatsList()}
            {activeTab === 'explore' && renderExploreList()}
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
  sectionHeader: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  emptyInline: { paddingHorizontal: 16, paddingVertical: 8, color: '#9ca3af', fontSize: 12.5 },
  newRoomWrap: { paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1 },
  newRoomBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13, borderRadius: 16, borderWidth: 0 },
  newRoomIcon: { width: 28, height: 28, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  newRoomText: { flex: 1, fontSize: 12, fontWeight: '700' },
});
