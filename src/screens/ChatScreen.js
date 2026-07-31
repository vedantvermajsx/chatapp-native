import { useEffect, useLayoutEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Alert, Text, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useCall } from '../contexts/CallContext';
import { useChatSocket, setActiveChatKey } from '../hooks/useChatSocket';
import messageService from '../services/message.service';
import roomService from '../services/room.service';
import { applyLastRead } from '../utils/applyLastRead';
import { dbService } from '../services/localDB.service';
import { 
  _refreshLastReadStatus, 
  _fetchNewRoomMessages, 
  _fetchNewPrivateMessages, 
  normalizeIncomingRoomMessage, 
  normalizeIncomingPrivateMessage, 
  reconcileIncoming 
} from '../utils/chatHelpers';

import ChatHeader from '../components/chat/ChatHeader';
import MessageBubble, { SystemMessage, TypingIndicator } from '../components/message';
import ChatInput from '../components/chat/ChatInput';
import MembersPanel from '../components/chat/MembersPanel';
import GroupSettingsModal from '../components/modals/GroupSettingsModal';
import ImageZoomModal from '../components/modals/ImageZoomModal';
import Spinner from '../components/common/Spinner';

export default function ChatScreen({ route, navigation }) {
  const { room: initialRoom, privateChat: initialPrivateChat } = route.params || {};
  const { user } = useAuth();
  const { theme } = useTheme();
  const { startCall } = useCall();
  const [currentRoom, setCurrentRoom] = useState(initialRoom || null);
  const [currentPrivateChat, setCurrentPrivateChat] = useState(initialPrivateChat || null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(!!(initialRoom || initialPrivateChat));
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [pendingMedia, setPendingMedia] = useState(null);
  const [uploadProgresses, setUploadProgresses] = useState({});
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [zoomMedia, setZoomMedia] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const [topInset, setTopInset] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const unreadCountRef = useRef(route.params?.unreadCount || 0);
  const listRef = useRef(null);
  const typingTargetRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emitMarkReadRef = useRef(() => {});
  const emitMarkRoomReadRef = useRef(() => {});
  const isAtBottomRef = useRef(true);
  const lastMessageKeyRef = useRef(null);
  const roomId = currentRoom?._id;
  const otherUserId = currentPrivateChat?.id;
  const myId = user?._id || user?.id;
  const isRoomAdmin = !!currentRoom && (currentRoom.groupAdmin === myId);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    const nextRoom = route.params?.room || null;
    const nextPrivateChat = route.params?.privateChat || null;

    if (nextRoom && nextRoom._id !== currentRoom?._id) {
      unreadCountRef.current = route.params?.unreadCount || 0;
      setCurrentRoom(nextRoom);
      setCurrentPrivateChat(null);
      setMessages([]);
      setLoadingMessages(true);
      setHasMoreOlder(false);
    } else if (nextPrivateChat && nextPrivateChat.id !== currentPrivateChat?.id) {
      unreadCountRef.current = route.params?.unreadCount || 0;
      setCurrentPrivateChat(nextPrivateChat);
      setCurrentRoom(null);
      setMessages([]);
      setLoadingMessages(true);
      setHasMoreOlder(false);
    }
  }, [route.params]);

  
  
  const loadRoomMessages = useCallback(async () => {
    if (!roomId) return;
    const cacheKey = `room_${roomId}`;
    const unreadCount = unreadCountRef.current;

    const cached = await dbService.getMessages(cacheKey);
    if (cached?.messages?.length) {
      setMessages(cached.messages.map((m) => normalizeIncomingRoomMessage(m, myId)));
      setLoadingMessages(false);
      setHasMoreOlder(!!cached.hasMore);
      const last = cached.messages[cached.messages.length - 1];
      if (last) emitMarkRoomReadRef.current({ roomId, messageId: last.id, timestamp: last.timestamp });
      if (unreadCount > 0) await _fetchNewRoomMessages(roomId, cacheKey, cached.messages, myId, setMessages);
      return;
    }

    setLoadingMessages(true);
    try {
      const data = await messageService.getRoomMessages(roomId, 20);
      const list = data.messages || data || [];
      const normalized = list.map((m) => normalizeIncomingRoomMessage(m, myId));
      setMessages(normalized);
      setHasMoreOlder(!!data.hasMore);
      await dbService.saveMessages(cacheKey, normalized, data.hasMore);
      const last = normalized[normalized.length - 1];
      if (last) {
        emitMarkRoomReadRef.current({ roomId, messageId: last.id, timestamp: last.timestamp });
      }
    } catch (e) {
      
    } finally {
      setLoadingMessages(false);
    }
  }, [roomId, myId]);

  const loadPrivateMessages = useCallback(async () => {
    if (!otherUserId) return;
    const cacheKey = `private_${otherUserId}`;
    const unreadCount = unreadCountRef.current;

    const cached = await dbService.getMessages(cacheKey);
    if (cached?.messages?.length) {
      setMessages(cached.messages.map((m) => normalizeIncomingPrivateMessage(m, myId)));
      setLoadingMessages(false);
      setHasMoreOlder(!!cached.hasMore);
      _refreshLastReadStatus(otherUserId, myId, setMessages);
      if (unreadCount > 0) {
        await _fetchNewPrivateMessages(otherUserId, cacheKey, cached.messages, myId, setMessages, emitMarkReadRef);
      } else {
        const last = cached.messages[cached.messages.length - 1];
        if (last && !last.isOwn && !last.isSystemMessage) {
          emitMarkReadRef.current({ senderId: otherUserId, receiverId: myId, messageId: last.id, timestamp: last.timestamp });
        }
      }
      return;
    }

    setLoadingMessages(true);
    try {
      const data = await messageService.getPrivateMessages(otherUserId, 20);
      const list = data.messages || data || [];
      const normalized = list.map((m) => normalizeIncomingPrivateMessage(m, myId));
      const withRead = applyLastRead(normalized, data.lastRead);
      setMessages(withRead);
      setHasMoreOlder(!!data.hasMore);
      await dbService.saveMessages(cacheKey, withRead, data.hasMore);
      const last = withRead[withRead.length - 1];
      if (last && !last.isOwn && !last.isSystemMessage) {
        emitMarkReadRef.current({
          senderId: otherUserId,
          receiverId: myId,
          messageId: last.id,
          timestamp: last.timestamp,
        });
      }
    } catch (e) {
      
    } finally {
      setLoadingMessages(false);
    }
  }, [otherUserId, myId]);

  const loadMoreMessages = useCallback(async () => {
    if (loadingOlder || !hasMoreOlder) return;
    if (!roomId && !otherUserId) return;

    const oldest = messages.find((m) => !m.isPending);
    if (!oldest?.timestamp) return;

    setLoadingOlder(true);
    try {
      if (roomId) {
        const data = await messageService.getRoomMessages(roomId, 20, oldest.timestamp);
        const list = data.messages || data || [];
        const existingIds = new Set(messages.map((m) => String(m.id)));
        const older = list
          .map((m) => normalizeIncomingRoomMessage(m, myId))
          .filter((m) => !existingIds.has(String(m.id)));
        if (older.length) {
          setMessages((prev) => [...older, ...prev]);
        }
        setHasMoreOlder(!!data.hasMore);
      } else if (otherUserId) {
        const data = await messageService.getPrivateMessages(otherUserId, 20, oldest.timestamp);
        const list = data.messages || data || [];
        const existingIds = new Set(messages.map((m) => String(m.id)));
        const older = list
          .map((m) => normalizeIncomingPrivateMessage(m, myId))
          .filter((m) => !existingIds.has(String(m.id)));
        if (older.length) {
          setMessages((prev) => [...older, ...prev]);
        }
        setHasMoreOlder(!!data.hasMore);
      }
    } catch (e) {
      
    } finally {
      setLoadingOlder(false);
    }
  }, [roomId, otherUserId, myId, messages, loadingOlder, hasMoreOlder]);

  useEffect(() => {
    const key = roomId ? `room_${roomId}` : otherUserId ? `private_${otherUserId}` : null;
    setActiveChatKey(key);
    isAtBottomRef.current = true;
    lastMessageKeyRef.current = null;
    return () => setActiveChatKey(null);
  }, [roomId, otherUserId]);

  useEffect(() => {
    if (roomId) loadRoomMessages();
    else if (otherUserId) loadPrivateMessages();
  }, [roomId, otherUserId, loadRoomMessages, loadPrivateMessages]);

  const loadMembers = useCallback(
    async (search = '') => {
      if (!roomId) return;
      setLoadingMembers(true);
      try {
        const data = await roomService.getRoomMembers(roomId, 0, search);
        const list = Array.isArray(data) ? data : data.members || [];
        setMembers(list);
      } catch (e) {
        setMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    },
    [roomId]
  );

  // -- Socket --
  const onRoomMessage = useCallback(
    (msg) => {
      if (String(msg.roomId) !== String(roomId)) return;
      const incoming = normalizeIncomingRoomMessage(msg, myId);
      setMessages((prev) => reconcileIncoming(prev, incoming));
      dbService.addMessage(`room_${roomId}`, incoming);
      if (!incoming.isOwn && !incoming.isSystemMessage) {
        emitMarkRoomReadRef.current({ roomId, messageId: incoming.id, timestamp: incoming.timestamp });
      }
    },
    [roomId, myId]
  );

  const onPrivateMessage = useCallback(
    (msg) => {
      const otherId = msg.senderId === myId ? msg.receiverId : msg.senderId;
      if (String(otherId) !== String(otherUserId)) return;
      const incoming = normalizeIncomingPrivateMessage(msg, myId);
      setMessages((prev) => reconcileIncoming(prev, incoming));
      dbService.addMessage(`private_${otherId}`, incoming);

      if (!incoming.isOwn && !incoming.isSystemMessage) {
        emitMarkReadRef.current({
          senderId: msg.senderId,
          receiverId: myId,
          messageId: incoming.id,
          timestamp: incoming.timestamp,
        });
      }
    },
    [otherUserId, myId]
  );
  
  const onReadReceipt = useCallback(
    ({ receiverId, messageId, lastSeenAt }) => {
      if (String(receiverId) !== String(otherUserId)) return;
      setMessages((prev) =>
        prev.map((m) => {
          if (!m.isOwn || m.isSystemMessage) return m;
          if (m.id === messageId) return { ...m, isSeen: true, seenAt: lastSeenAt };
          if (m.isSeen) return { ...m, isSeen: false, seenAt: null };
          return m;
        })
      );
    },
    [otherUserId]
  );

  const onPresence = useCallback(
    ({ userId, isOnline, lastSeen }) => {
      if (otherUserId && String(userId) === String(otherUserId)) {
        setCurrentPrivateChat((prev) => (prev ? { ...prev, isOnline, lastSeen } : prev));
      }
      setMembers((prev) => prev.map((m) => (String(m._id || m.id) === String(userId) ? { ...m, isOnline } : m)));
    },
    [otherUserId]
  );

  const { socket, typingUsers, emitTyping, emitStopTyping, emitLeaveRoom, emitMarkRead, emitMarkRoomRead } = useChatSocket(user, {
    currentRoom,
    currentPrivateChat,
    onRoomMessage,
    onPrivateMessage,
    onReadReceipt,
    onPresence,
  });
  emitMarkReadRef.current = emitMarkRead;
  emitMarkRoomReadRef.current = emitMarkRoomRead;

  
  const handleTypingActivity = useCallback(
    (charCount) => {
      const payload = roomId ? { type: 'room', roomId } : { type: 'private', receiverId: otherUserId, charCount };
      typingTargetRef.current = payload;
      emitTyping(payload);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (typingTargetRef.current) emitStopTyping(typingTargetRef.current);
      }, 2000);
    },
    [roomId, otherUserId, emitTyping, emitStopTyping]
  );

  const handleStopTyping = useCallback(() => {
    clearTimeout(typingTimeoutRef.current);
    if (typingTargetRef.current) emitStopTyping(typingTargetRef.current);
  }, [emitStopTyping]);

  const typingIndicator = useMemo(() => {
    if (currentPrivateChat) {
      const data = typingUsers[`private_${otherUserId}`];
      if (!data) return null;
      return { avatar: currentPrivateChat.avatar, name: currentPrivateChat.username, charCount: data.charCount };
    }
    if (currentRoom) {
      const count = typingUsers[`room_${roomId}`];
      if (!count) return null;
      return { avatar: currentRoom.groupPic, name: currentRoom.groupName };
    }
    return null;
  }, [currentPrivateChat, currentRoom, typingUsers, otherUserId, roomId]);

  
  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd?.({ animated: true }));
  }, []);

  const handleContentSizeChange = useCallback(() => {
    const last = messages[messages.length - 1];
    const lastKey = last ? String(last.id || last.uuid) : null;
    if (lastKey !== lastMessageKeyRef.current) return; // handled by the effect below
    if (isAtBottomRef.current) scrollToEnd();
  }, [messages, scrollToEnd]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    const lastKey = last ? String(last.id || last.uuid) : null;
    const changed = lastKey !== lastMessageKeyRef.current;
    lastMessageKeyRef.current = lastKey;
    if (changed && isAtBottomRef.current) scrollToEnd();
    else if (typingIndicator && isAtBottomRef.current) scrollToEnd();
  }, [messages, typingIndicator, scrollToEnd]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(showEvent, () => scrollToEnd());
    return () => sub.remove();
  }, [scrollToEnd]);

  const sendOptimistic = (text, media) => {
    const uuid = uuidv4();
    const optimistic = {
      id: uuid,
      uuid,
      username: user.username,
      avatar: user.avatar,
      text: text || '',
      media: media || null,
      isOwn: true,
      isPending: true,
      timestamp: new Date().toISOString(),
    };
    
    const cacheKey = roomId ? `room_${roomId}` : otherUserId ? `private_${otherUserId}` : null;
    if (cacheKey) {
      dbService.addMessage(cacheKey, optimistic).catch(() => {});
    }

    setMessages((prev) => [...prev, optimistic]);
    scrollToEnd();
    return { uuid, optimistic };
  };

  const resolveOptimistic = useCallback((uuid, response, media, originalCacheKey) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.uuid === uuid || m.id === uuid);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        id: response?._id || response?.id || next[idx].id,
        media: media !== undefined ? media : next[idx].media,
        timestamp: response?.timestamp || next[idx].timestamp,
        isPending: false,
      };
      return next;
    });

    if (originalCacheKey) {
      (async () => {
        try {
          const resolvedMessage = {
            id: response?._id || response?.id || uuid,
            uuid,
            username: user.username,
            avatar: user.avatar,
            text: response?.message || response?.content || '',
            media: media || null,
            isOwn: true,
            isPending: false,
            timestamp: response?.timestamp || new Date().toISOString(),
          };
          await dbService.removeMessage(originalCacheKey, uuid);
          await dbService.addMessage(originalCacheKey, resolvedMessage);
        } catch (e) {
          console.error('Error resolving optimistic message in database:', e);
        }
      })();
    }
  }, [user]);

  const handleSend = async () => {
    const text = inputMessage.trim();
    if (!text && !pendingMedia) return;
    const localMedia = pendingMedia;
    setInputMessage('');
    setPendingMedia(null);

    const localPreview = localMedia ? { type: localMedia.type, url: localMedia.uri, duration: localMedia.duration, isPending: true } : null;
    const { uuid } = sendOptimistic(text, localPreview);
    const originalCacheKey = roomId ? `room_${roomId}` : otherUserId ? `private_${otherUserId}` : null;

    try {
      let finalMedia = null;
      if (localMedia) {
        setUploadProgresses((prev) => ({ ...prev, [uuid]: 0 }));
        finalMedia = await messageService.uploadFile(localMedia, 'data', (progress) => {
          setUploadProgresses((prev) => ({ ...prev, [uuid]: progress }));
        });
      }

      let response;
      if (roomId) {
        response = await messageService.sendRoomMessage({ roomId, text, media: finalMedia, uuid });
      } else if (otherUserId) {
        response = await messageService.sendPrivateMessage({
          receiverId: otherUserId,
          content: text,
          media: finalMedia,
          uuid,
          receiverModel: currentPrivateChat?.role === 'guest' ? 'Guest' : 'User',
        });
      }
      resolveOptimistic(uuid, response, finalMedia, originalCacheKey);
    } catch (e) {
      Alert.alert('Failed to send', e?.response?.data?.message || 'Message could not be delivered. It will stay marked as pending.');
    } finally {
      setUploadProgresses((prev) => {
        const next = { ...prev };
        delete next[uuid];
        return next;
      });
    }
  };

  const handleStickerSend = async (sticker) => {
    const { uuid } = sendOptimistic('', sticker);
    const originalCacheKey = roomId ? `room_${roomId}` : otherUserId ? `private_${otherUserId}` : null;
    try {
      let response;
      if (roomId) response = await messageService.sendRoomMessage({ roomId, text: '', media: sticker, uuid });
      else if (otherUserId) {
        response = await messageService.sendPrivateMessage({
          receiverId: otherUserId,
          content: '',
          media: sticker,
          uuid,
          receiverModel: currentPrivateChat?.role === 'guest' ? 'Guest' : 'User',
        });
      }
      resolveOptimistic(uuid, response, sticker, originalCacheKey);
    } catch (e) {}
  };

  
  const handleLeaveOrDelete = () => {
    if (!currentRoom) return;
    const isDelete = isRoomAdmin && !currentRoom.isDeleted;
    Alert.alert(
      isDelete ? 'Delete room' : 'Leave room',
      `Are you sure you want to ${isDelete ? 'delete' : 'leave'} "${currentRoom.groupName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isDelete ? 'Delete' : 'Leave',
          style: 'destructive',
          onPress: async () => {
            setLeaving(true);
            try {
              if (isDelete) await roomService.deleteRoom(currentRoom._id);
              else await roomService.leaveRoom(currentRoom._id);
              await dbService.removeJoinedRoom(currentRoom._id);
              emitLeaveRoom(currentRoom._id);
              navigation.goBack();
            } catch (e) {
              Alert.alert('Error', e?.response?.data?.message || 'Something went wrong');
            } finally {
              setLeaving(false);
            }
          },
        },
      ]
    );
  };

  const handleStartPrivateChatFromMember = (member) => {
    setShowMembers(false);
    navigation.push('Chat', {
      
      
      
      
      privateChat: {
        ...member,
        id: member.id || member._id,
      },
    });
  };

  
  const renderItem = ({ item }) => {
    if (item.isSystemMessage) {
      return <SystemMessage msg={item} isPrivateChat={!!currentPrivateChat} />;
    }
    return (
      <MessageBubble
        msg={item}
        isOwn={item.isOwn}
        isPrivateChat={!!currentPrivateChat}
        showUsername={!item.isOwn && !!currentRoom}
        topRadius={{ tl: 18, tr: 18 }}
        bottomRadius={{ bl: item.isOwn ? 18 : 4, br: item.isOwn ? 4 : 18 }}
        onImagePress={setZoomMedia}
        uploadProgress={uploadProgresses[item.uuid] ?? uploadProgresses[item.id]}
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={theme.isLight ? 'dark' : 'light'} backgroundColor={theme.background} />
      <SafeAreaView style={{ flex: 0, backgroundColor: theme.background }} edges={['top']} onLayout={(e) => setTopInset(e.nativeEvent.layout.height)} />
      <View onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
        <ChatHeader
          user={user}
          currentRoom={currentRoom}
          currentPrivateChat={currentPrivateChat}
          isRoomAdmin={isRoomAdmin}
          onBack={() => navigation.goBack()}
          onOpenMembers={() => {
            setShowMembers(true);
            loadMembers();
          }}
          onOpenGroupSettings={() => setShowGroupSettings(true)}
          onLeaveOrDelete={handleLeaveOrDelete}
          onStartCall={(isVideo) => otherUserId && startCall(otherUserId, isVideo, currentPrivateChat)}
          leaving={leaving}
        />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? topInset + headerHeight : 0}
      >
        {loadingMessages && messages.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Spinner size="large" color={theme.primary || theme.myMessageBubble || '#008080'} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item, i) => String(item.id || item.uuid || i)}
            renderItem={renderItem}
            onContentSizeChange={handleContentSizeChange}
            contentContainerStyle={{ paddingVertical: 12, flexGrow: 1 }}
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            onScroll={({ nativeEvent }) => {
              const { contentOffset, layoutMeasurement, contentSize } = nativeEvent;
              if (contentOffset.y < 80) loadMoreMessages();
              const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
              isAtBottomRef.current = distanceFromBottom < 120;
            }}
            scrollEventThrottle={100}
            ListHeaderComponent={
              loadingOlder ? (
                <View style={{ paddingVertical: 10 }}>
                  <Spinner size="small" color={theme.primary || theme.myMessageBubble || '#008080'} />
                </View>
              ) : null
            }
            ListFooterComponent={typingIndicator ? <TypingIndicator avatar={typingIndicator.avatar} name={typingIndicator.name} charCount={typingIndicator.charCount} /> : null}
            ListEmptyComponent={
              !loadingMessages ? (
                <View style={styles.emptyWrap}>
                  <Text style={[styles.emptyText, { color: theme.otherMessageText }]}>No messages yet</Text>
                  <Text style={styles.emptySub}>Be the first to say hi 👋</Text>
                </View>
              ) : null
            }
          />
        )}

        <ChatInput
          user={user}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          onSend={handleSend}
          disabled={!currentRoom && !currentPrivateChat}
          currentRoom={currentRoom}
          currentPrivateChat={currentPrivateChat}
          onTypingActivity={handleTypingActivity}
          onStopTyping={handleStopTyping}
          pendingMedia={pendingMedia}
          onRemoveMedia={() => setPendingMedia(null)}
          onFileSelect={setPendingMedia}
          onStickerSend={handleStickerSend}
        />
      </KeyboardAvoidingView>
      <SafeAreaView edges={['bottom']} style={{ backgroundColor: theme.background }} />

      {currentRoom && (
        <MembersPanel
          visible={showMembers}
          onClose={() => setShowMembers(false)}
          members={members}
          admin={currentRoom.groupAdmin}
          currentUserId={myId}
          loading={loadingMembers}
          onStartPrivateChat={handleStartPrivateChatFromMember}
        />
      )}

      {currentRoom && (
        <GroupSettingsModal
          visible={showGroupSettings}
          room={currentRoom}
          onClose={() => setShowGroupSettings(false)}
          onUpdated={(updated) => setCurrentRoom(updated)}
        />
      )}

      <ImageZoomModal
        visible={!!zoomMedia}
        url={zoomMedia?.url}
        media={zoomMedia?.media}
        mediaType={zoomMedia?.mediaType}
        onClose={() => setZoomMedia(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 4 },
  emptyText: { fontSize: 15, fontWeight: '600' },
  emptySub: { fontSize: 13, color: '#9ca3af' },
});
