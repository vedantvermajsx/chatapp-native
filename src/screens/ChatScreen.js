import { useEffect, useLayoutEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Alert, Text, Keyboard, TouchableOpacity, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import { showApiError } from '../utils/toast';
import { dbService } from '../services/localDB.service';
import keyManager from '../services/keyManager';
import { decryptForRoom, decryptPrivateMessage } from '../utils/crypto';
import { 
  _refreshLastReadStatus, 
  _fetchNewRoomMessages, 
  _fetchNewPrivateMessages, 
  normalizeIncomingRoomMessage, 
  normalizeIncomingPrivateMessage, 
  reconcileIncoming, 
  dedupeMessages 
} from '../utils/chatHelpers';

import ChatHeader from '../components/chat/ChatHeader';
import MessageBubble, { SystemMessage, TypingIndicator, SwipeToReply } from '../components/message';
import ChatInput from '../components/chat/ChatInput';
import { ChatAreaBackground } from '../components/chat/ChatAreaBackground';
import MembersPanel from '../components/chat/MembersPanel';
import GroupSettingsModal from '../components/modals/GroupSettingsModal';
import ImageZoomModal from '../components/modals/ImageZoomModal';
import Spinner from '../components/common/Spinner';

export default function ChatScreen({ route, navigation }) {
  const { room: initialRoom, privateChat: initialPrivateChat } = route.params || {};
  const { user } = useAuth();
  const { theme, chatBackgroundUri } = useTheme();
  const { startCall } = useCall();
  const [currentRoom, setCurrentRoom] = useState(initialRoom || null);
  const [currentPrivateChat, setCurrentPrivateChat] = useState(initialPrivateChat || null);
  const [messages, setMessages] = useState([]);
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
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [loadingNewMessages, setLoadingNewMessages] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const NEW_MESSAGES_BUTTON_THRESHOLD = 20;
  const unreadCountRef = useRef(route.params?.unreadCount || 0);
  const listRef = useRef(null);
  const typingTargetRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emitMarkReadRef = useRef(() => {});
  const emitMarkRoomReadRef = useRef(() => {});
  const emitClearActiveRoomRef = useRef(() => {});
  const isAtBottomRef = useRef(true);
  const lastMessageKeyRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const roomId = currentRoom?._id;
  const otherUserId = currentPrivateChat?.id;
  const myId = user?._id || user?.id;
  const isRoomAdmin = !!currentRoom && (currentRoom.groupAdmin === myId);
  const roomPrivateKey = currentRoom?.privateKey || null;
  const roomPublicKey = currentRoom?.publicKey || null;

  const decryptRoomMsg = useCallback(async (raw) => {
    if (!raw.iv || !raw.wrappedKey || !roomPrivateKey) return raw;
    try {
      const text = await decryptForRoom(raw.text ?? raw.message ?? '', raw.iv, raw.wrappedKey, roomPrivateKey);
      const { iv, wrappedKey, ...rest } = raw;
      return { ...rest, text };
    } catch (err) {
      console.error('[ChatScreen] room decrypt error:', err.message);
      return { ...raw, text: 'Unable to decrypt message' };
    }
  }, [roomPrivateKey]);

  const decryptPrivateMsg = useCallback(async (raw) => {
    if (!raw.iv) return raw;
    const privateKeyPem = await keyManager.getSelfPrivateKey();
    if (!privateKeyPem) return raw;
    const isOwn = String(raw.senderId) === String(myId);
    const wrappedKeyForMe = isOwn ? raw.senderKeyWrapped : raw.receiverKeyWrapped;
    if (!wrappedKeyForMe) return raw;
    try {
      const text = await decryptPrivateMessage(raw.text ?? raw.content ?? '', raw.iv, wrappedKeyForMe, privateKeyPem);
      const { iv, senderKeyWrapped, receiverKeyWrapped, ...rest } = raw;
      return { ...rest, text };
    } catch (err) {
      console.error('[ChatScreen] private decrypt error:', err.message);
      return { ...raw, text: 'Unable to decrypt message' };
    }
  }, [myId]);

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
      setNewMessagesCount(0);
      setLoadingNewMessages(false);
      setReplyingTo(null);
    } else if (nextPrivateChat && nextPrivateChat.id !== currentPrivateChat?.id) {
      unreadCountRef.current = route.params?.unreadCount || 0;
      setCurrentPrivateChat(nextPrivateChat);
      setCurrentRoom(null);
      setMessages([]);
      setLoadingMessages(true);
      setHasMoreOlder(false);
      setNewMessagesCount(0);
      setLoadingNewMessages(false);
      setReplyingTo(null);
    }
  }, [route.params]);

  
  
  const scrollToEnd = useCallback((animated = true) => {
    requestAnimationFrame(() => listRef.current?.scrollToOffset?.({ offset: 0, animated }));
  }, []);

  const reversedMessages = useMemo(() => dedupeMessages([...messages].reverse()), [messages]);

  const loadRoomMessages = useCallback(async () => {
    if (!roomId) return;
    const cacheKey = `room_${roomId}`;
    const unreadCount = unreadCountRef.current;

    const cached = await dbService.getMessages(cacheKey);
    if (cached?.messages?.length) {
      const decryptedCached = await Promise.all(cached.messages.map(decryptRoomMsg));
      setMessages(decryptedCached.map((m) => normalizeIncomingRoomMessage(m, myId)));
      setLoadingMessages(false);
      setHasMoreOlder(!!cached.hasMore);

      if (unreadCount > NEW_MESSAGES_BUTTON_THRESHOLD) {
        setNewMessagesCount(unreadCount);
      } else {
        const last = cached.messages[cached.messages.length - 1];
        if (last) emitMarkRoomReadRef.current({ roomId, messageId: last.id, timestamp: last.timestamp });
        if (unreadCount > 0) {
          setLoadingNewMessages(true);
          const merged = await _fetchNewRoomMessages(roomId, cacheKey, cached.messages, myId, setMessages, undefined, roomPrivateKey);
          setLoadingNewMessages(false);
          const newLast = merged[merged.length - 1];
          if (newLast) emitMarkRoomReadRef.current({ roomId, messageId: newLast.id, timestamp: newLast.timestamp });
        }
      }
      return;
    }

    setLoadingMessages(true);
    try {
      const data = await messageService.getRoomMessages(roomId, 20, null, null, roomPrivateKey);
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
      showApiError(e, 'Could not load messages');
    } finally {
      setLoadingMessages(false);
    }
  }, [roomId, myId, roomPrivateKey, decryptRoomMsg]);

  const loadPrivateMessages = useCallback(async () => {
    if (!otherUserId) return;
    const cacheKey = `private_${otherUserId}`;
    const unreadCount = unreadCountRef.current;

    const cached = await dbService.getMessages(cacheKey);
    if (cached?.messages?.length) {
      const decryptedCached = await Promise.all(cached.messages.map(decryptPrivateMsg));
      setMessages(decryptedCached.map((m) => normalizeIncomingPrivateMessage(m, myId)));
      setLoadingMessages(false);
      setHasMoreOlder(!!cached.hasMore);
      _refreshLastReadStatus(otherUserId, myId, setMessages);

      if (unreadCount > NEW_MESSAGES_BUTTON_THRESHOLD) {
        // Big backlog: don't block/auto-fetch, let the user trigger it via the jump-to-new button.
        setNewMessagesCount(unreadCount);
      } else if (unreadCount > 0) {
        setLoadingNewMessages(true);
        await _fetchNewPrivateMessages(otherUserId, cacheKey, cached.messages, myId, setMessages, emitMarkReadRef);
        setLoadingNewMessages(false);
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
      showApiError(e, 'Could not load messages');
    } finally {
      setLoadingMessages(false);
    }
  }, [otherUserId, myId, decryptPrivateMsg]);

  const handleLoadNewMessages = useCallback(async () => {
    if (loadingNewMessages) return;
    setLoadingNewMessages(true);
    isAtBottomRef.current = true;

    try {
      if (roomId) {
        const cacheKey = `room_${roomId}`;
        const cached = await dbService.getMessages(cacheKey);
        const existingRaw = cached?.messages || [];
        const merged = await _fetchNewRoomMessages(roomId, cacheKey, existingRaw, myId, setMessages, {
          onBatch: ({ addedCount }) => {
            setNewMessagesCount((prev) => Math.max(0, prev - addedCount));
            scrollToEnd();
          },
        }, roomPrivateKey);
        const last = merged[merged.length - 1];
        if (last) emitMarkRoomReadRef.current({ roomId, messageId: last.id, timestamp: last.timestamp });
      } else if (otherUserId) {
        const cacheKey = `private_${otherUserId}`;
        const cached = await dbService.getMessages(cacheKey);
        const existingRaw = cached?.messages || [];
        await _fetchNewPrivateMessages(otherUserId, cacheKey, existingRaw, myId, setMessages, emitMarkReadRef, {
          onBatch: ({ addedCount }) => {
            setNewMessagesCount((prev) => Math.max(0, prev - addedCount));
            scrollToEnd();
          },
        });
      }
    } finally {
      setNewMessagesCount(0);
      setLoadingNewMessages(false);
      scrollToEnd();
    }
  }, [roomId, otherUserId, myId, loadingNewMessages, scrollToEnd]);

  const loadMoreMessages = useCallback(async () => {
    if (loadingOlder || !hasMoreOlder) return;
    if (!roomId && !otherUserId) return;

    const oldest = messages.find((m) => !m.isPending);
    if (!oldest?.timestamp) return;

    setLoadingOlder(true);
    try {
      if (roomId) {
        const data = await messageService.getRoomMessages(roomId, 20, oldest.timestamp, null, roomPrivateKey);
        const list = data.messages || data || [];
        const normalizedOlder = list.map((m) => normalizeIncomingRoomMessage(m, myId));
        setMessages((prev) => {
          const prevIds = new Set(prev.map((m) => String(m.id ?? m.uuid)));
          const older = normalizedOlder.filter((m) => !prevIds.has(String(m.id ?? m.uuid)));
          return dedupeMessages([...older, ...prev]);
        });
        setHasMoreOlder(!!data.hasMore);
      } else if (otherUserId) {
        const data = await messageService.getPrivateMessages(otherUserId, 20, oldest.timestamp);
        const list = data.messages || data || [];
        const normalizedOlder = list.map((m) => normalizeIncomingPrivateMessage(m, myId));
        setMessages((prev) => {
          const prevIds = new Set(prev.map((m) => String(m.id ?? m.uuid)));
          const older = normalizedOlder.filter((m) => !prevIds.has(String(m.id ?? m.uuid)));
          return dedupeMessages([...older, ...prev]);
        });
        setHasMoreOlder(!!data.hasMore);
      }
    } catch (e) {
      showApiError(e, 'Could not load older messages');
    } finally {
      setLoadingOlder(false);
    }
  }, [roomId, otherUserId, myId, messages, loadingOlder, hasMoreOlder]);

  useEffect(() => {
    const key = roomId ? `room_${roomId}` : otherUserId ? `private_${otherUserId}` : null;
    setActiveChatKey(key);
    isAtBottomRef.current = true;
    lastMessageKeyRef.current = null;
    isInitialLoadRef.current = true;
    return () => {
      setActiveChatKey(null);
      if (roomId) emitClearActiveRoomRef.current();
    };
  }, [roomId, otherUserId]);

  useEffect(() => {
    if (roomId) loadRoomMessages();
    else if (otherUserId) loadPrivateMessages();
  }, [roomId, otherUserId, loadRoomMessages, loadPrivateMessages]);

  useEffect(() => {
    if (!roomId) return undefined;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        emitClearActiveRoomRef.current();
      } else if (nextState === 'active') {
        const last = messages[messages.length - 1];
        if (last) emitMarkRoomReadRef.current({ roomId, messageId: last.id, timestamp: last.timestamp });
      }
    });
    return () => subscription.remove();
  }, [roomId, messages]);

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
        showApiError(e, 'Could not load members');
      } finally {
        setLoadingMembers(false);
      }
    },
    [roomId]
  );

  // -- Socket --
  const onRoomMessage = useCallback(
    async (msg) => {
      if (String(msg.roomId) !== String(roomId)) return;
      const decrypted = await decryptRoomMsg(msg);
      const incoming = normalizeIncomingRoomMessage(decrypted, myId);
      setMessages((prev) => reconcileIncoming(prev, incoming));
      dbService.addMessage(`room_${roomId}`, incoming);
      if (!incoming.isOwn && !incoming.isSystemMessage) {
        emitMarkRoomReadRef.current({ roomId, messageId: incoming.id, timestamp: incoming.timestamp });
      }
    },
    [roomId, myId, decryptRoomMsg]
  );

  const onPrivateMessage = useCallback(
    async (msg) => {
      const otherId = msg.senderId === myId ? msg.receiverId : msg.senderId;
      if (String(otherId) !== String(otherUserId)) return;
      const decrypted = await decryptPrivateMsg(msg);
      const incoming = normalizeIncomingPrivateMessage(decrypted, myId);
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
    [otherUserId, myId, decryptPrivateMsg]
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

  const { socket, typingUsers, emitTyping, emitStopTyping, emitLeaveRoom, emitMarkRead, emitMarkRoomRead, emitClearActiveRoom } = useChatSocket(user, {
    currentRoom,
    currentPrivateChat,
    onRoomMessage,
    onPrivateMessage,
    onReadReceipt,
    onPresence,
  });
  emitMarkReadRef.current = emitMarkRead;
  emitMarkRoomReadRef.current = emitMarkRoomRead;
  emitClearActiveRoomRef.current = emitClearActiveRoom;

  
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

  
  useEffect(() => {
    const last = messages[messages.length - 1];
    const lastKey = last ? String(last.id || last.uuid) : null;
    const changed = lastKey !== lastMessageKeyRef.current;
    lastMessageKeyRef.current = lastKey;
    if (changed && !isInitialLoadRef.current && isAtBottomRef.current) scrollToEnd();
    else if (typingIndicator && isAtBottomRef.current) scrollToEnd();
    isInitialLoadRef.current = false;
  }, [messages, typingIndicator, scrollToEnd]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(showEvent, () => scrollToEnd());
    return () => sub.remove();
  }, [scrollToEnd]);

  const sendOptimistic = (text, media, replyTo, taggedUserId) => {
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
      replyTo: replyTo || null,
      taggedUser: taggedUserId || null,
    };
    
    const cacheKey = roomId ? `room_${roomId}` : otherUserId ? `private_${otherUserId}` : null;
    if (cacheKey) {
      dbService.addMessage(cacheKey, optimistic).catch(() => {});
    }

    setMessages((prev) => [...prev, optimistic]);
    scrollToEnd();
    return { uuid, optimistic };
  };

  const resolveOptimistic = useCallback((uuid, response, media, originalCacheKey, replyTo, taggedUserId) => {
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
            replyTo: replyTo || null,
            taggedUser: taggedUserId || null,
          };
          await dbService.removeMessage(originalCacheKey, uuid);
          await dbService.addMessage(originalCacheKey, resolvedMessage);
        } catch (e) {
          console.error('Error resolving optimistic message in database:', e);
        }
      })();
    }
  }, [user]);

  const handleSend = async (text = '', mentionTaggedUserId = null) => {
    text = text.trim();
    if (!text && !pendingMedia) return;
    const localMedia = pendingMedia;
    const replySnapshot = replyingTo
      ? { messageId: replyingTo.id, text: replyingTo.text, username: replyingTo.username, media: replyingTo.media, senderId: replyingTo.senderId }
      : null;
    const taggedUserId = replySnapshot?.senderId || mentionTaggedUserId || null;
    setPendingMedia(null);
    setReplyingTo(null);

    const localPreview = localMedia ? { type: localMedia.type, url: localMedia.uri, duration: localMedia.duration, isPending: true } : null;
    const { uuid } = sendOptimistic(text, localPreview, replySnapshot, taggedUserId);
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
        response = await messageService.sendRoomMessage({ roomId, text, media: finalMedia, uuid, roomPublicKey, replyTo: replySnapshot, taggedUser: taggedUserId });
      } else if (otherUserId) {
        response = await messageService.sendPrivateMessage({
          receiverId: otherUserId,
          content: text,
          media: finalMedia,
          uuid,
          receiverModel: currentPrivateChat?.role === 'guest' ? 'Guest' : 'User',
          replyTo: replySnapshot,
          taggedUser: taggedUserId,
        });
      }
      resolveOptimistic(uuid, response, finalMedia, originalCacheKey, replySnapshot, taggedUserId);
    } catch (e) {
      showApiError(e, 'Message not delivered (still pending)');
    } finally {
      setUploadProgresses((prev) => {
        const next = { ...prev };
        delete next[uuid];
        return next;
      });
    }
  };

  const handleStickerSend = async (sticker) => {
    const replySnapshot = replyingTo
      ? { messageId: replyingTo.id, text: replyingTo.text, username: replyingTo.username, media: replyingTo.media, senderId: replyingTo.senderId }
      : null;
    setReplyingTo(null);
    const { uuid } = sendOptimistic('', sticker, replySnapshot);
    const originalCacheKey = roomId ? `room_${roomId}` : otherUserId ? `private_${otherUserId}` : null;
    try {
      let response;
      if (roomId) response = await messageService.sendRoomMessage({ roomId, text: '', media: sticker, uuid, roomPublicKey, replyTo: replySnapshot, taggedUser: replySnapshot?.senderId });
      else if (otherUserId) {
        response = await messageService.sendPrivateMessage({
          receiverId: otherUserId,
          content: '',
          media: sticker,
          uuid,
          receiverModel: currentPrivateChat?.role === 'guest' ? 'Guest' : 'User',
          replyTo: replySnapshot,
          taggedUser: replySnapshot?.senderId,
        });
      }
      resolveOptimistic(uuid, response, sticker, originalCacheKey, replySnapshot);
    } catch (e) {
      showApiError(e, 'Sticker not delivered (still pending)');
    }
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
              showApiError(e, isDelete ? 'Could not delete room' : 'Could not leave room');
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

  
  const handleJumpToReply = useCallback((replyTo) => {
    if (!replyTo?.messageId) return;
    const idx = reversedMessages.findIndex((m) => String(m.id) === String(replyTo.messageId));
    if (idx === -1) return;
    listRef.current?.scrollToIndex?.({ index: idx, animated: true, viewPosition: 0.5 });
  }, [reversedMessages]);

  const handleReplyToItem = useCallback((item) => setReplyingTo(item), []);

  const renderItem = useCallback(
    ({ item }) => {
      if (item.isSystemMessage) {
        return <SystemMessage msg={item} isPrivateChat={!!currentPrivateChat} />;
      }
      return (
        <SwipeToReply disabled={item.isPending} isOwn={item.isOwn} onReply={() => handleReplyToItem(item)}>
          <MessageBubble
            msg={item}
            isOwn={item.isOwn}
            isPrivateChat={!!currentPrivateChat}
            showUsername={!item.isOwn && !!currentRoom}
            isTagged={!item.isOwn && !!item.taggedUser && String(item.taggedUser) === String(myId)}
            topRadius={{ tl: 18, tr: 18 }}
            bottomRadius={{ bl: item.isOwn ? 18 : 4, br: item.isOwn ? 4 : 18 }}
            onImagePress={setZoomMedia}
            uploadProgress={uploadProgresses[item.uuid] ?? uploadProgresses[item.id]}
            onReplyPress={handleJumpToReply}
          />
        </SwipeToReply>
      );
    },
    [currentPrivateChat, currentRoom, myId, uploadProgresses, handleJumpToReply, handleReplyToItem]
  );

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
        <ChatAreaBackground uri={chatBackgroundUri}>
        {loadingMessages && messages.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Spinner size="large" color={theme.primary || theme.myMessageBubble || '#008080'} />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <FlatList
              ref={listRef}
              data={reversedMessages}
              inverted
              keyExtractor={(item, i) => String(item.id || item.uuid || i)}
              renderItem={renderItem}
              contentContainerStyle={{ paddingVertical: 12, flexGrow: 1 }}
              onScroll={({ nativeEvent }) => {
                const { contentOffset, layoutMeasurement, contentSize } = nativeEvent;
                const wasAtBottom = isAtBottomRef.current;
                const distanceFromTop = contentSize.height - layoutMeasurement.height - contentOffset.y;
                if (distanceFromTop < 80 && !wasAtBottom) loadMoreMessages();
                isAtBottomRef.current = contentOffset.y < 120;
              }}
              scrollEventThrottle={100}
              onScrollToIndexFailed={() => {}}
              ListHeaderComponent={
                <>
                  {loadingNewMessages && (
                    <View style={{ paddingVertical: 10 }}>
                      <Spinner size="small" color={theme.primary || theme.myMessageBubble || '#008080'} />
                    </View>
                  )}
                  {typingIndicator ? (
                    <TypingIndicator avatar={typingIndicator.avatar} name={typingIndicator.name} charCount={typingIndicator.charCount} />
                  ) : null}
                </>
              }
              ListFooterComponent={
                loadingOlder ? (
                  <View style={{ paddingVertical: 10 }}>
                    <Spinner size="small" color={theme.primary || theme.myMessageBubble || '#008080'} />
                  </View>
                ) : null
              }
              ListEmptyComponent={
                !loadingMessages ? (
                  <View style={styles.emptyWrap}>
                    <Text style={[styles.emptyText, { color: theme.otherMessageText }]}>No messages yet</Text>
                    <Text style={styles.emptySub}>Be the first to say hi 👋</Text>
                  </View>
                ) : null
              }
            />

            {newMessagesCount > 0 && (
              <TouchableOpacity
                style={[styles.jumpButton, { backgroundColor: theme.primary || theme.myMessageBubble || '#008080' }]}
                onPress={handleLoadNewMessages}
                disabled={loadingNewMessages}
                activeOpacity={0.85}
              >
                {loadingNewMessages ? (
                  <Spinner size="small" color="#fff" />
                ) : (
                  <Ionicons name="arrow-down" size={16} color="#fff" />
                )}
                <Text style={styles.jumpButtonText}>
                  {loadingNewMessages ? 'Loading…' : `${newMessagesCount > 99 ? '99+' : newMessagesCount} new`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        </ChatAreaBackground>

        <ChatInput
          user={user}
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
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
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
  jumpButton: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  jumpButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});