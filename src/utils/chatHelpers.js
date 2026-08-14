import messageService from '../services/message.service';
import { dbService } from '../services/localDB.service';
import { applyLastRead } from './applyLastRead';
import { showApiError } from './toast';
import { syncUnreadFromResponse } from './syncUnreadCount';

function mergeAndDedupe(setMessages, buildNormalized) {
  setMessages((prev) => {
    const normalized = buildNormalized();
    const prevIds = new Set(prev.map((m) => String(m.id ?? m.uuid)));
    const toAdd = normalized.filter((m) => !prevIds.has(String(m.id ?? m.uuid)));
    return dedupeMessages([...prev, ...toAdd]);
  });
}

export async function _refreshLastReadStatus(otherUserId, myId, setMessages) {
  try {
    const { lastRead } = await messageService.getLastReadStatus(otherUserId);
    if (!lastRead) return;
    setMessages((prev) => applyLastRead(prev, lastRead));
  } catch (e) {
  }
}

const CATCH_UP_PAGE_SIZE = 20;

export async function _fetchNewRoomMessages(roomId, cacheKey, existingRaw, myId, setMessages, { onBatch, onError } = {}, roomPrivateKey = null, setUnreadCounts = null) {
  let merged = existingRaw;
  let latestTimestamp = merged[merged.length - 1]?.timestamp;
  if (!latestTimestamp) return merged;

  let hasMore = true;
  let lastUnreadCount;
  try {
    while (hasMore) {
      const res = await messageService.getRoomMessages(roomId, CATCH_UP_PAGE_SIZE, null, latestTimestamp, roomPrivateKey);
      hasMore = res.hasMore || false;
      lastUnreadCount = res.unreadCount;
      if (!res.messages?.length) break;

      const existingIds = new Set(merged.map((m) => String(m._id || m.id)));
      const reallyNew = res.messages.filter((m) => !existingIds.has(String(m._id || m.id)));
      if (!reallyNew.length) break;

      merged = [...merged, ...reallyNew];
      const normalizedNew = reallyNew.map((m) => normalizeIncomingRoomMessage(m, myId));
      await dbService.mergeNewMessages(cacheKey, normalizedNew);
      latestTimestamp = merged[merged.length - 1]?.timestamp || latestTimestamp;

      const normalized = merged.map((m) => normalizeIncomingRoomMessage(m, myId));
      mergeAndDedupe(setMessages, () => normalized);
      onBatch?.({ normalized, addedCount: reallyNew.length, hasMore });
    }
    syncUnreadFromResponse(setUnreadCounts, cacheKey, lastUnreadCount);
  } catch (e) {
    showApiError(e, 'Could not load new messages');
    onError?.(e);
  }
  return merged;
}

/**
 * for private chats: pages forward, applies read-state,
 * and reports each batch so the UI can update incrementally.
 */
export async function _fetchNewPrivateMessages(otherUserId, cacheKey, existingRaw, myId, setMessages, emitMarkReadRef, { onBatch, onError } = {}, setUnreadCounts = null) {
  let merged = existingRaw;
  let latestTimestamp = merged[merged.length - 1]?.timestamp;
  if (!latestTimestamp) return merged;

  let hasMore = true;
  let lastRead = null;
  let lastUnreadCount;
  try {
    while (hasMore) {
      const res = await messageService.getPrivateMessages(otherUserId, CATCH_UP_PAGE_SIZE, null, latestTimestamp);
      hasMore = res.hasMore || false;
      lastRead = res.lastRead ?? lastRead;
      lastUnreadCount = res.unreadCount;

      const existingIds = new Set(merged.map((m) => String(m._id || m.id)));
      const reallyNew = (res.messages || []).filter((m) => !existingIds.has(String(m._id || m.id)));
      if (!reallyNew.length) break;

      merged = [...merged, ...reallyNew];
      let normalized = merged.map((m) => normalizeIncomingPrivateMessage(m, myId));
      if (lastRead) normalized = applyLastRead(normalized, lastRead);

      const normalizedNewIds = new Set(reallyNew.map((m) => String(m._id || m.id)));
      const normalizedNew = normalized.filter((m) => normalizedNewIds.has(String(m.id)));
      await dbService.mergeNewMessages(cacheKey, normalizedNew);
      latestTimestamp = merged[merged.length - 1]?.timestamp || latestTimestamp;

      setMessages((prev) => {
        const prevIds = new Set(prev.map((m) => String(m.id ?? m.uuid)));
        const toAdd = normalized.filter((m) => !prevIds.has(String(m.id ?? m.uuid)));
        let next = dedupeMessages([...prev, ...toAdd]);
        if (lastRead) next = applyLastRead(next, lastRead);
        return next;
      });

      const last = normalized[normalized.length - 1];
      if (last && !last.isOwn && !last.isSystemMessage) {
        emitMarkReadRef.current({ senderId: otherUserId, receiverId: myId, messageId: last.id, timestamp: last.timestamp });
      }
      onBatch?.({ normalized, addedCount: reallyNew.length, hasMore });
    }
    syncUnreadFromResponse(setUnreadCounts, cacheKey, lastUnreadCount);
  } catch (e) {
    showApiError(e, 'Could not load new messages');
    onError?.(e);
  }
  return merged;
}

export function normalizeIncomingRoomMessage(m, myId) {
  const senderId = m.userId || m.senderId || m.sender?._id;
  return {
    id: m._id || m.id,
    senderId,
    username: m.username || m.sender?.username,
    avatar: m.avatar || m.sender?.avatar,
    text: m.text ?? m.message ?? '',
    media: m.media || null,
    isOwn: m.isOwn ?? (senderId ? String(senderId) === String(myId) : false),
    timestamp: m.timestamp || m.createdAt || new Date().toISOString(),
    isSystemMessage: !!m.isSystemMessage,
    systemType: m.systemType || null,
    replyTo: m.replyTo || null,
    taggedUser: m.taggedUser || null,
    isPending: false,
    iv: m.iv || undefined,
    wrappedKey: m.wrappedKey || undefined,
  };
}

export function normalizeIncomingPrivateMessage(m, myId) {
  const senderId = m.senderId;
  return {
    id: m._id || m.id,
    senderId,
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
    replyTo: m.replyTo || null,
    taggedUser: m.taggedUser || null,
    isPending: false,
    iv: m.iv || undefined,
    senderKeyWrapped: m.senderKeyWrapped || undefined,
    receiverKeyWrapped: m.receiverKeyWrapped || undefined,
  };
}

export function replaceAndDedupe(prev, tempId, finalMessage) {
  const finalId = finalMessage.id ?? finalMessage._id;
  const replaced = prev.map((msg) => {
    const msgId = msg.id ?? msg._id;
    return msgId === tempId || msgId === finalId ? finalMessage : msg;
  });
  const seen = new Set();
  return replaced.filter((msg) => {
    const key = msg.id ?? msg._id;
    if (key == null) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function reconcileIncoming(prev, incoming) {
  const key = incoming.id ?? incoming.uuid;
  if (key != null && prev.some((m) => String(m.id ?? m.uuid) === String(key))) return prev;
  let optimisticIdx = prev.findIndex(
    (m) => m.isOwn && m.isPending && m.text === incoming.text && !!m.media === !!incoming.media
  );
  if (incoming.isOwn && optimisticIdx === -1) {
    optimisticIdx = prev.findIndex((m) => m.isOwn && m.isPending && !!m.media === !!incoming.media);
  }
  if (incoming.isOwn && optimisticIdx !== -1) {
    const next = [...prev];
    next[optimisticIdx] = incoming;
    return next;
  }
  return [...prev, incoming];
}

export function dedupeMessages(list) {
  const seen = new Set();
  const result = [];
  for (const m of list) {
    const key = m.id ?? m.uuid;
    if (key == null) {
      result.push(m);
      continue;
    }
    const strKey = String(key);
    if (seen.has(strKey)) continue;
    seen.add(strKey);
    result.push(m);
  }
  return result;
}