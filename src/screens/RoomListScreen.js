import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, RefreshControl, Alert, TextInput, Modal, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import roomService from '../services/room.service';
import messageService from '../services/message.service';
import { useChatSocket, getActiveChatKey } from '../hooks/useChatSocket';
import Avatar from '../components/common/Avatar';
import Spinner from '../components/common/Spinner';
import UserSettingsModal from '../components/chat/Modals/UserSettingsModal';
import { dbService } from '../services/localDB.service';

const TABS = [
  { id: 'chats', label: 'Chats' },
  { id: 'explore', label: 'Explore' }
];

export default function RoomListScreen({ navigation }) {
  const { user, logout, updateUser } = useAuth();
  const { theme, THEMES, setTheme } = useTheme();
  const [joinedRooms, setJoinedRooms] = useState([]);
  const [globalRooms, setGlobalRooms] = useState([]);
  const [privateChats, setPrivateChats] = useState([]);
  const [activeTab, setActiveTab] = useState('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [loadingPrivate, setLoadingPrivate] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  const accent = theme.primary || theme.myMessageBubble || '#008080';
  const borderColor = theme.isLight ? '#e5e7eb' : '#374151';

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
      if (!cached.length) setJoinedRooms([]);
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
      if (!cached.length) setGlobalRooms([]);
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
      if (!cached.length) setPrivateChats([]);
    } finally {
      setLoadingPrivate(false);
    }
  }, []);

  // Keep the Groups/Explore lists in sync with server-pushed room events
  // (a room I just joined, someone renaming/deleting a room, etc.) instead
  // of only refreshing on manual pull-to-refresh.
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
      loadUnread();
    }, [loadUnread])
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
      Alert.alert('Failed to join', e?.response?.data?.message || 'Could not join room');
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
      const data = await roomService.createRoom(newRoomName.trim(), newRoomDesc.trim());
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
      Alert.alert('Failed', e?.response?.data?.message || 'Could not create room');
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
            Alert.alert('Failed', 'Could not delete chat');
          }
        },
      },
    ]);
  };

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

  // ---- Sub-renders -------------------------------------------------

  const renderSidebarHeader = () => (
    <View style={[styles.sidebarHeader, { borderBottomColor: borderColor }]}>
      <View style={styles.sidebarHeaderInner}>
        <Text style={[styles.appName, { color: theme.otherMessageText }]}>GatherUp</Text>
      </View>
    </View>
  );

  const renderSearch = () => (
    <View style={styles.searchWrapper}>
      <View style={[styles.searchInputRow, { backgroundColor: theme.isLight ? '#f3f4f6' : '#1f2937' }]}>
        <Ionicons name="search" size={16} color={theme.otherUsernameColor} style={{ opacity: 0.7 }} />
        <TextInput
          placeholder="Search..."
          placeholderTextColor={theme.otherUsernameColor}
          style={[styles.searchInput, { color: theme.otherMessageText }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color={theme.otherUsernameColor} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderTabBar = () => (
    <View style={[styles.tabBar, { borderBottomColor: borderColor }]}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.id;
        const badge = tab.id === 'chats' && myChatsUnread > 0 ? myChatsUnread : 0;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, isActive && { borderBottomColor: accent }]}
            onPress={() => setActiveTab(tab.id)}
          >
            <View style={styles.tabContent}>
              <Text style={[styles.tabText, { color: isActive ? accent : theme.otherMessageText, opacity: isActive ? 1 : 0.8 }]}>
                {tab.label}
              </Text>
              {badge > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{badge > 99 ? '99+' : badge}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderRoomRow = (item, isJoined) => {
    const isJoining = joiningRoomId === item._id;
    const name = item.groupName || item.name || 'Room';
    const desc = item.groupDescription || '';
    const unread = isJoined ? (unreadCounts[`room_${item._id}`] || 0) : 0;
    return (
      <TouchableOpacity
        key={item._id}
        style={styles.roomItem}
        onPress={() => isJoined ? navigation.navigate('Chat', { room: item, unreadCount: unread }) : handleJoinRoom(item)}
        activeOpacity={0.5}
        disabled={!!item.isDeleted && isJoined}
      >
        <Avatar url={item.groupPic} name={name} size={44} />
        <View style={styles.roomInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[styles.roomName, { color: theme.otherMessageText, flexShrink: 1 }]} numberOfLines={1}>{name}</Text>
            {!isJoined && (
              <Text style={[styles.memberCountText, { color: theme.otherUsernameColor }]}>
                {item.memberCount ?? item.members?.length ?? 0}
              </Text>
            )}
          </View>
          <Text style={[styles.roomDesc, { color: item.isDeleted ? '#ef4444' : '#9ca3af' }]} numberOfLines={1}>
            {item.isDeleted ? 'This room has been deleted' : (desc || (isJoined ? 'No description' : 'Tap to join'))}
          </Text>
        </View>
        {unread > 0 && (
          <View style={[styles.unreadBadge, { backgroundColor: accent }]}>
            <Text style={styles.unreadBadgeText}>{unread > 99 ? '99+' : unread}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderPrivateChatRow = (chat) => {
    const other = chat.otherUser || {};
    const otherId = other.id || other._id;
    const lastText = (chat.lastMessage?.content || '').replace('__SYSTEM_CALL__', '');
    const unread = unreadCounts[`private_${otherId}`] || 0;
    return (
      <TouchableOpacity
        key={otherId}
        style={styles.roomItem}
        onPress={() => navigation.navigate('Chat', { privateChat: { ...other, id: otherId }, unreadCount: unread })}
        activeOpacity={0.5}
      >
        <Avatar url={other.avatar} name={other.username} size={44} isOnline={other.isOnline} />
        <View style={styles.roomInfo}>
          <Text style={[styles.roomName, { color: theme.otherMessageText }]} numberOfLines={1}>{other.username}</Text>
          <Text style={[styles.roomDesc, { color: '#9ca3af' }]} numberOfLines={1}>
            {lastText || 'Start a conversation'}
          </Text>
        </View>
        {unread > 0 && (
          <View style={[styles.unreadBadge, { backgroundColor: accent }]}>
            <Text style={styles.unreadBadgeText}>{unread > 99 ? '99+' : unread}</Text>
          </View>
        )}
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeletePrivateChat(otherId)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="trash-outline" size={16} color="#ef4444" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

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
      {loadingRooms ? (
        <View style={{ padding: 24 }}><Spinner size="large" /></View>
      ) : filteredJoined.length === 0 ? (
        <Text style={styles.emptyInline}>Join a group from Explore</Text>
      ) : (
        filteredJoined.map((r) => renderRoomRow(r, true))
      )}

      {renderSectionHeader('Private Chats')}
      {loadingPrivate ? (
        <View style={{ padding: 24 }}><Spinner size="large" /></View>
      ) : filteredPrivate.length === 0 ? (
        <Text style={styles.emptyInline}>No private chats yet</Text>
      ) : (
        filteredPrivate.map(renderPrivateChatRow)
      )}
    </ScrollView>
  );

  const renderExploreList = () => (
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
        filteredGlobal.map((r) => renderRoomRow(r, false))
      )}
    </ScrollView>
  );

  const renderNewRoomBtn = () => {
    if (activeTab !== 'chats' || user?.role === 'guest') return null;
    return (
      <View style={[styles.newRoomWrap, { borderTopColor: borderColor }]}>
        <TouchableOpacity
          style={[styles.newRoomBtn, { backgroundColor: theme.isLight ? '#f9fafb' : '#1f2937', borderColor }]}
          onPress={() => setShowCreateRoom(true)}
          activeOpacity={0.6}
        >
          <View style={[styles.newRoomIcon, { backgroundColor: `${accent}18` }]}>
            <Ionicons name="add" size={16} color={accent} />
          </View>
          <Text style={[styles.newRoomText, { color: theme.otherMessageText }]}>New Room</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSidebarFooter = () => (
    <View style={[styles.sidebarFooter, { borderTopColor: borderColor }]}>
      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 }} onPress={() => user?.role !== 'guest' && setShowUserSettings(true)}>
        <Avatar url={user?.avatar} name={user?.username} size={32} />
        <Text style={[styles.footerUsername, { color: theme.otherMessageText }]} numberOfLines={1}>{user?.username || 'Guest'}</Text>
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {user?.role !== 'guest' && (
          <TouchableOpacity style={styles.footerIconBtn} onPress={() => setShowUserSettings(true)}>
            <Ionicons name="settings-outline" size={22} color={theme.otherUsernameColor} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.footerIconBtn} onPress={() => setShowThemePicker(true)}>
          <Ionicons name="color-palette-outline" size={22} color={theme.otherUsernameColor} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerIconBtn}
          onPress={() => Alert.alert('Logout', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout }
          ])}
        >
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={theme.isLight ? 'dark' : 'light'} backgroundColor={theme.background} />
      <SafeAreaView style={{ flex: 0, backgroundColor: theme.background }} edges={['top']} />
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['bottom']}>
        <View style={[styles.root, { backgroundColor: theme.background }]}>
          {renderSidebarHeader()}
          {renderSearch()}
          {renderTabBar()}
          <View style={{ flex: 1 }}>
            {activeTab === 'chats' && renderChatsList()}
            {activeTab === 'explore' && renderExploreList()}
          </View>
          {renderNewRoomBtn()}
          {renderSidebarFooter()}

          {}
          <Modal visible={showCreateRoom} animationType="fade" transparent onRequestClose={() => setShowCreateRoom(false)}>
            <Pressable style={styles.modalBackdrop} onPress={() => setShowCreateRoom(false)}>
              <View style={[styles.modalCard, { backgroundColor: theme.background, borderColor }]}>
                <Text style={[styles.modalTitle, { color: theme.otherMessageText }]}>Create a new room</Text>
                <View style={[styles.modalInput, { backgroundColor: theme.isLight ? '#f3f4f6' : '#1f2937', borderColor: 'transparent' }]}>
                  <Ionicons name="people-circle-outline" size={18} color="#9ca3af" />
                  <TextInput
                    placeholder="Room name"
                    placeholderTextColor="#9ca3af"
                    value={newRoomName}
                    onChangeText={setNewRoomName}
                    autoFocus
                    style={[styles.modalInputText, { color: theme.otherMessageText }]}
                  />
                </View>
                <View style={[styles.modalInput, { backgroundColor: theme.isLight ? '#f3f4f6' : '#1f2937', borderColor: 'transparent' }]}>
                  <Ionicons name="document-text-outline" size={18} color="#9ca3af" />
                  <TextInput
                    placeholder="Description (optional)"
                    placeholderTextColor="#9ca3af"
                    value={newRoomDesc}
                    onChangeText={setNewRoomDesc}
                    style={[styles.modalInputText, { color: theme.otherMessageText }]}
                  />
                </View>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnSecondary, { borderColor }]}
                    onPress={() => setShowCreateRoom(false)}
                    disabled={creatingRoom}
                  >
                    <Text style={[styles.modalBtnTextSecondary, { color: theme.otherMessageText }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnPrimary, { backgroundColor: accent, opacity: creatingRoom ? 0.6 : 1 }]}
                    onPress={handleCreateRoom}
                    disabled={creatingRoom}
                  >
                    {creatingRoom ? (
                      <Spinner size="small" color="#fff" />
                    ) : (
                      <Text style={styles.modalBtnTextPrimary}>Create</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </Pressable>
          </Modal>

          {}
          <Modal visible={showThemePicker} animationType="slide" transparent onRequestClose={() => setShowThemePicker(false)}>
            <View style={[styles.modalBackdrop, { backgroundColor: 'transparent' }]}>
              <View style={[styles.themeCard, { backgroundColor: theme.background, borderColor, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}>
                <View style={styles.themeHeader}>
                  <Text style={[styles.modalTitle, { color: theme.otherMessageText }]}>Appearance</Text>
                  <TouchableOpacity style={{ padding: 8, borderRadius: 20, backgroundColor: 'transparent' }} onPress={() => setShowThemePicker(false)}>
                    <Ionicons name="close" size={28} color={theme.otherMessageText} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ maxHeight: 420, paddingVertical: 10 }} showsVerticalScrollIndicator={false}>
                  <View style={styles.themeGrid}>
                    {THEMES.map(t => {
                      const selected = t.id === theme.id;
                      return (
                        <TouchableOpacity
                          key={t.id}
                          style={[
                            styles.themeCardItem,
                            { backgroundColor: t.background, borderColor: selected ? accent : (theme.isLight ? '#e5e7eb' : '#374151') },
                            selected && { borderWidth: 1 }
                          ]}
                          onPress={() => setTheme(t)}
                          activeOpacity={0}
                        >
                          <View style={styles.themePreviewRow}>
                            <View style={[styles.bubblePreview, styles.bubbleOther, { backgroundColor: t.otherMessageBubble }]}>
                              <Text style={{ fontSize: 6, color: t.otherMessageText }}>Hey</Text>
                            </View>
                            <View style={[styles.bubblePreview, styles.bubbleMine, { backgroundColor: t.myMessageBubble }]}>
                              <Text style={{ fontSize: 6, color: t.myMessageText }}>Hi</Text>
                            </View>
                          </View>
                          <Text style={[styles.themeName, { color: t.isLight ? '#111827' : '#fff' }]} numberOfLines={1}>
                            {t.name}
                          </Text>
                          {selected && (
                            <View style={[styles.themeSelectedBadge, { backgroundColor: accent }]}>
                              <Ionicons name="checkmark" size={12} color="#fff" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>

          <UserSettingsModal
            visible={showUserSettings}
            user={user}
            onClose={() => setShowUserSettings(false)}
            onUpdated={updateUser}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  sidebarHeader: { alignItems: 'center', justifyContent: 'center', paddingTop: 12, paddingBottom: 12, borderBottomWidth: 0 },
  sidebarHeaderInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appIconBadge: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 20, fontWeight: '700', letterSpacing: 0.8 },
  searchWrapper: { paddingHorizontal: 16, paddingVertical: 12 },
  searchInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 2 },
  searchInput: { flex: 1, fontSize: 12 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  tabBadge: { minWidth: 16, height: 16, borderRadius: 999, backgroundColor: '#ef4444', paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  tabBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  roomItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  roomInfo: { flex: 1, minWidth: 0 },
  roomName: { fontSize: 14, fontWeight: '600' },
  roomDesc: { fontSize: 12.5, marginTop: 2 },
  memberCountText: { fontSize: 12, fontWeight: '700', marginLeft: 8 },
  unreadBadge: { minWidth: 20, height: 20, borderRadius: 999, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  unreadBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  joinBadge: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { padding: 6 },
  emptyInline: { paddingHorizontal: 16, paddingVertical: 8, color: '#9ca3af', fontSize: 12.5 },
  newRoomWrap: { paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1 },
  newRoomBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13, borderRadius: 16, borderWidth: 1 },
  newRoomIcon: { width: 28, height: 28, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  newRoomText: { flex: 1, fontSize: 12, fontWeight: '700' },
  sidebarFooter: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  footerUsername: { fontSize: 13, fontWeight: '600', marginLeft: 8, flexShrink: 1 },
  footerIconBtn: { width: 32, height: 32, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 380, borderRadius: 18, padding: 20, borderWidth: 1, gap: 14 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  modalInput: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1 },
  modalInputText: { flex: 1, fontSize: 14 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modalBtnSecondary: { backgroundColor: 'transparent', borderWidth: 1 },
  modalBtnPrimary: {},
  modalBtnTextSecondary: { fontWeight: '600', fontSize: 14 },
  modalBtnTextPrimary: { color: '#fff', fontWeight: '700', fontSize: 14 },
  themeCard: { width: '100%', maxWidth: 420, borderRadius: 20, padding: 15, borderWidth: 1 },
  themeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  themeCardItem: { width: '30%', aspectRatio: 1, borderRadius: 14, padding: 10, borderWidth: 1, alignItems: 'center', position: 'relative' },
  themePreviewRow: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  bubblePreview: { minWidth: 26, maxWidth: 34, height: 18, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  bubbleOther: { borderTopLeftRadius: 2, alignSelf: 'flex-start' },
  bubbleMine: { borderTopRightRadius: 2, alignSelf: 'flex-end' },
  themeName: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  themeSelectedBadge: { position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }
});
