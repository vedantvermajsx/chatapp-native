import { useState, useCallback, useRef } from 'react';
import messageService from '../../services/message.service';
import { dbService } from '../../services/localDB.service';
import { applyLastRead } from '../../utils/applyLastRead';
import { showApiError } from '../../utils/toast';
import { 
  _refreshLastReadStatus, 
  _fetchNewRoomMessages, 
  _fetchNewPrivateMessages, 
  normalizeIncomingRoomMessage, 
  normalizeIncomingPrivateMessage, 
  dedupeMessages 
} from '../../utils/chatHelpers';

const NEW_MESSAGES_BUTTON_THRESHOLD = 20;

export const useChatMessages = ({
  roomId,
  otherUserId,
  myId,
  roomPrivateKey,
  decryptRoomMsg,
  decryptPrivateMsg,
  setUnreadCounts,
  syncUnreadCount,
  unreadCountRef,
  emitMarkRoomReadRef,
  emitMarkReadRef,
  scrollToEnd,
  isAtBottomRef
}) => {
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(!!(roomId || otherUserId));
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [loadingNewMessages, setLoadingNewMessages] = useState(false);

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
          const merged = await _fetchNewRoomMessages(roomId, cacheKey, cached.messages, myId, setMessages, undefined, roomPrivateKey, setUnreadCounts);
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
      syncUnreadCount(cacheKey, data.unreadCount);
      const last = normalized[normalized.length - 1];
      if (last) {
        emitMarkRoomReadRef.current({ roomId, messageId: last.id, timestamp: last.timestamp });
      }
    } catch (e) {
      showApiError(e, 'Could not load messages');
    } finally {
      setLoadingMessages(false);
    }
  }, [roomId, myId, roomPrivateKey, decryptRoomMsg, setUnreadCounts, syncUnreadCount]);

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
        setNewMessagesCount(unreadCount);
      } else if (unreadCount > 0) {
        setLoadingNewMessages(true);
        await _fetchNewPrivateMessages(otherUserId, cacheKey, cached.messages, myId, setMessages, emitMarkReadRef, undefined, setUnreadCounts);
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
      syncUnreadCount(cacheKey, data.unreadCount);
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
  }, [otherUserId, myId, decryptPrivateMsg, setUnreadCounts, syncUnreadCount]);

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
        }, roomPrivateKey, setUnreadCounts);
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
        }, setUnreadCounts);
      }
    } finally {
      setNewMessagesCount(0);
      setLoadingNewMessages(false);
      scrollToEnd();
    }
  }, [roomId, otherUserId, myId, loadingNewMessages, scrollToEnd, setUnreadCounts]);

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

  return {
    messages,
    setMessages,
    loadingMessages,
    setLoadingMessages,
    hasMoreOlder,
    setHasMoreOlder,
    loadingOlder,
    newMessagesCount,
    setNewMessagesCount,
    loadingNewMessages,
    setLoadingNewMessages,
    loadRoomMessages,
    loadPrivateMessages,
    handleLoadNewMessages,
    loadMoreMessages
  };
};
