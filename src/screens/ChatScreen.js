import React, { useEffect, useLayoutEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Alert, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useChatSocket, setActiveChatKey } from '../hooks/useChatSocket';
import messageService from '../services/message.service';
import roomService from '../services/room.service';
import { applyLastRead } from '../utils/applyLastRead';

import ChatHeader from '../components/chat/ChatHeader';
import MessageBubble, { SystemMessage, TypingIndicator } from '../components/chat/Message';
import ChatInput from '../components/chat/ChatInput';
import MembersPanel from '../components/chat/MembersPanel';
import GroupSettingsModal from '../components/chat/Modals/GroupSettingsModal';
import ImageZoomModal from '../components/chat/Modals/ImageZoomModal';
import CallScreen from '../components/chat/CallScreen';

export default function ChatScreen({ route, navigation }) {
  const { room: initialRoom, privateChat: initialPrivateChat } = route.params || {};
  const { user } = useAuth();
  const { theme } = useTheme();

  const [currentRoom, setCurrentRoom] = useState(initialRoom || null);
  const [currentPrivateChat, setCurrentPrivateChat] = useState(initialPrivateChat || null);

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(!!(initialRoom || initialPrivateChat));
  const [pendingMedia, setPendingMedia] = useState(null);

  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [zoomUrl, setZoomUrl] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const [call, setCall] = useState({ visible: false, isVideo: false });
  const [topInset, setTopInset] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);

  const listRef = useRef(null);
  const typingTargetRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emitMarkReadRef = useRef(() => {});
  const emitMarkRoomReadRef = useRef(() => {});

  const roomId = currentRoom?._id;
  const otherUserId = currentPrivateChat?.id;
  const myId = user?._id || user?.id;
  const isRoomAdmin = !!currentRoom && (currentRoom.groupAdmin === myId);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // When this screen is already mounted and the user taps into a different
  // room/private chat, React Navigation may reuse this same screen instance
  // and just update route.params instead of remounting it. Without this,
  // `currentRoom`/`currentPrivateChat` (seeded once from the initial params)
  // would stay stuck on the old chat, so the previous chat's messages would
  // keep showing (or vanish) instead of loading the newly selected chat.
  useEffect(() => {
    const nextRoom = route.params?.room || null;
    const nextPrivateChat = route.params?.privateChat || null;

    if (nextRoom && nextRoom._id !== currentRoom?._id) {
      setCurrentRoom(nextRoom);
      setCurrentPrivateChat(null);
      setMessages([]);
      setLoadingMessages(true);
    } else if (nextPrivateChat && nextPrivateChat.id !== currentPrivateChat?.id) {
      setCurrentPrivateChat(nextPrivateChat);
      setCurrentRoom(null);
      setMessages([]);
      setLoadingMessages(true);
    }
  }, [route.params]);

  // ---- Data loading -------------------------------------------------
  const loadRoomMessages = useCallback(async () => {
    if (!roomId) return;
    setLoadingMessages(true);
    try {
      const data = await messageService.getRoomMessages(roomId, 20);
      const list = data.messages || data || [];
      const normalized = list.map((m) => normalizeIncomingRoomMessage(m, myId));
      setMessages(normalized);
      const last = normalized[normalized.length - 1];
      if (last) {
        emitMarkRoomReadRef.current({ roomId, messageId: last.id, timestamp: last.timestamp });
      }
    } catch (e) {
      // keep empty
    } finally {
      setLoadingMessages(false);
    }
  }, [roomId, myId]);

  const loadPrivateMessages = useCallback(async () => {
    if (!otherUserId) return;
    setLoadingMessages(true);
    try {
      const data = await messageService.getPrivateMessages(otherUserId, 20);
      const list = data.messages || data || [];
      const normalized = list.map((m) => normalizeIncomingPrivateMessage(m, myId));
      const withRead = applyLastRead(normalized, data.lastRead);
      setMessages(withRead);
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
      // keep empty
    } finally {
      setLoadingMessages(false);
    }
  }, [otherUserId, myId]);

  useEffect(() => {
    const key = roomId ? `room_${roomId}` : otherUserId ? `private_${otherUserId}` : null;
    setActiveChatKey(key);
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

  // ---- Socket ---------------------------------------------------------
  const onRoomMessage = useCallback(
    (msg) => {
      if (String(msg.roomId) !== String(roomId)) return;
      const incoming = normalizeIncomingRoomMessage(msg, myId);
      setMessages((prev) => reconcileIncoming(prev, incoming));
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

      // Let the sender know we've seen it, mirroring the web app — without
      // this the "seen" tick under our own sent messages never appears.
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

  // Update our own messages with the seen tick once the other person's
  // client reports back that they've read up to a given message.
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

  // ---- Typing ----------------------------------------------------------
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

  // ---- Sending -----------------------------------------------------
  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd?.({ animated: true }));
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages.length, typingIndicator, scrollToEnd]);

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
    setMessages((prev) => [...prev, optimistic]);
    scrollToEnd();
    return { uuid, optimistic };
  };

  // Flip the optimistic bubble from "pending" (clock icon) to "sent" using
  // the REST response we already have, instead of waiting for the socket to
  // echo the message back — for room messages the server only broadcasts
  // `newMessage` to other members, not back to the sender, so relying on it
  // left the clock icon stuck on every message the user sent in a group.
  const resolveOptimistic = useCallback((uuid, response, media) => {
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
  }, []);

  const handleSend = async () => {
    const text = inputMessage.trim();
    if (!text && !pendingMedia) return;
    const localMedia = pendingMedia;
    setInputMessage('');
    setPendingMedia(null);

    // Show the message immediately using the local file (if any) as a
    // preview; the real upload happens in the background below.
    const localPreview = localMedia ? { type: localMedia.type, url: localMedia.uri, isPending: true } : null;
    const { uuid } = sendOptimistic(text, localPreview);

    try {
      let finalMedia = null;
      if (localMedia) {
        finalMedia = await messageService.uploadFile(localMedia, 'data');
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
      resolveOptimistic(uuid, response, finalMedia);
    } catch (e) {
      Alert.alert('Failed to send', e?.response?.data?.message || 'Message could not be delivered. It will stay marked as pending.');
    }
  };

  const handleStickerSend = async (sticker) => {
    // sticker: { type: 'sticker' | 'gif', url } from the Klipy picker,
    // sent as message media just like an uploaded image/video.
    const { uuid } = sendOptimistic('', sticker);
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
      resolveOptimistic(uuid, response, sticker);
    } catch (e) {}
  };

  // ---- Room actions --------------------------------------------------
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
      // Spread first so `role` (and anything else the members API returns,
      // e.g. for guest users) survives instead of being dropped by
      // whitelisting fields here — role is required to pick the correct
      // receiverModel ('Guest' vs 'User') when sending, see handleSend.
      privateChat: {
        ...member,
        id: member.id || member._id,
      },
    });
  };

  // ---- Render ---------------------------------------------------------
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
        onImagePress={setZoomUrl}
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
          onStartCall={(isVideo) => setCall({ visible: true, isVideo })}
          leaving={leaving}
        />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? topInset + headerHeight : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item, i) => String(item.id || item.uuid || i)}
          renderItem={renderItem}
          onContentSizeChange={scrollToEnd}
          contentContainerStyle={{ paddingVertical: 12, flexGrow: 1 }}
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

      <ImageZoomModal visible={!!zoomUrl} url={zoomUrl} onClose={() => setZoomUrl(null)} />

      <CallScreen
        visible={call.visible}
        target={currentPrivateChat}
        isVideo={call.isVideo}
        onEnd={() => setCall({ visible: false, isVideo: false })}
      />
    </View>
  );
}

// ---- Helpers -----------------------------------------------------------

function normalizeIncomingRoomMessage(m, myId) {
  const senderId = m.userId || m.senderId || m.sender?._id;
  return {
    id: m._id || m.id,
    username: m.username || m.sender?.username,
    avatar: m.avatar || m.sender?.avatar,
    text: m.text ?? m.message ?? '',
    media: m.media || null,
    isOwn: m.isOwn ?? (senderId ? String(senderId) === String(myId) : false),
    timestamp: m.timestamp || m.createdAt || new Date().toISOString(),
    isSystemMessage: !!m.isSystemMessage,
    systemType: m.systemType || null,
    isPending: false,
  };
}

function normalizeIncomingPrivateMessage(m, myId) {
  const senderId = m.senderId;
  return {
    id: m._id || m.id,
    username: m.senderUsername || m.username,
    avatar: m.avatar,
    text: m.text ?? m.content ?? '',
    media: m.media || null,
    isOwn: m.isOwn ?? (senderId ? String(senderId) === String(myId) : false),
    timestamp: m.timestamp || m.createdAt || new Date().toISOString(),
    isSystemMessage: !!m.isSystemMessage,
    systemType: m.systemType || null,
    isSeen: m.isSeen,
    seenAt: m.seenAt,
    isPending: false,
  };
}

function reconcileIncoming(prev, incoming) {
  if (incoming.id && prev.some((m) => String(m.id) === String(incoming.id))) return prev;
  const optimisticIdx = prev.findIndex(
    (m) => m.isOwn && m.isPending && m.text === incoming.text && !!m.media === !!incoming.media
  );
  if (incoming.isOwn && optimisticIdx !== -1) {
    const next = [...prev];
    next[optimisticIdx] = incoming;
    return next;
  }
  return [...prev, incoming];
}

const styles = StyleSheet.create({
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 4 },
  emptyText: { fontSize: 15, fontWeight: '600' },
  emptySub: { fontSize: 13, color: '#9ca3af' },
});
