import messageService from '../services/message.service';
import { dbService } from '../services/localDB.service';
import { applyLastRead } from './applyLastRead';

export async function _refreshLastReadStatus(otherUserId, myId, setMessages) {
  try {
    const { lastRead } = await messageService.getLastReadStatus(otherUserId);
    if (!lastRead) return;
    setMessages((prev) => applyLastRead(prev, lastRead));
  } catch (e) {
    
  }
}

export async function _fetchNewRoomMessages(roomId, cacheKey, existingRaw, myId, setMessages) {
  try {
    let merged = existingRaw;
    let latestTimestamp = merged[merged.length - 1]?.timestamp;
    if (!latestTimestamp) return;

    let hasMore = true;
    while (hasMore) {
      const res = await messageService.getRoomMessages(roomId, 20, null, latestTimestamp);
      hasMore = res.hasMore || false;
      if (!res.messages?.length) break;

      const existingIds = new Set(merged.map((m) => String(m._id || m.id)));
      const reallyNew = res.messages.filter((m) => !existingIds.has(String(m._id || m.id)));
      if (!reallyNew.length) break;

      merged = [...merged, ...reallyNew];
      await dbService.mergeNewMessages(cacheKey, reallyNew);
      latestTimestamp = merged[merged.length - 1]?.timestamp || latestTimestamp;
    }

    setMessages(merged.map((m) => normalizeIncomingRoomMessage(m, myId)));
  } catch (e) {
    
  }
}

export async function _fetchNewPrivateMessages(otherUserId, cacheKey, existingRaw, myId, setMessages, emitMarkReadRef) {
  try {
    let merged = existingRaw;
    let latestTimestamp = merged[merged.length - 1]?.timestamp;
    if (!latestTimestamp) return;

    let hasMore = true;
    let lastRead = null;
    while (hasMore) {
      const res = await messageService.getPrivateMessages(otherUserId, 20, null, latestTimestamp);
      hasMore = res.hasMore || false;
      lastRead = res.lastRead ?? lastRead;

      const existingIds = new Set(merged.map((m) => String(m._id || m.id)));
      const reallyNew = (res.messages || []).filter((m) => !existingIds.has(String(m._id || m.id)));
      if (!reallyNew.length) break;

      merged = [...merged, ...reallyNew];
      await dbService.mergeNewMessages(cacheKey, reallyNew);
      latestTimestamp = merged[merged.length - 1]?.timestamp || latestTimestamp;
    }

    let normalized = merged.map((m) => normalizeIncomingPrivateMessage(m, myId));
    if (lastRead) normalized = applyLastRead(normalized, lastRead);
    setMessages(normalized);

    const last = normalized[normalized.length - 1];
    if (last && !last.isOwn && !last.isSystemMessage) {
      emitMarkReadRef.current({ senderId: otherUserId, receiverId: myId, messageId: last.id, timestamp: last.timestamp });
    }
  } catch (e) {
    
  }
}

export function normalizeIncomingRoomMessage(m, myId) {
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

export function normalizeIncomingPrivateMessage(m, myId) {
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

export function reconcileIncoming(prev, incoming) {
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
