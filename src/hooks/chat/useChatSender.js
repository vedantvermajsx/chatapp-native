import { useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from '../../services/localDB.service';
import messageService from '../../services/message.service';
import { emitPrivateChatUpdated } from '../../events/privateChatEvents';
import { showApiError } from '../../utils/toast';

export const useChatSender = ({
  user,
  roomId,
  otherUserId,
  currentPrivateChat,
  roomPublicKey,
  setMessages,
  scrollToEnd,
  setPendingMedia,
  setReplyingTo,
  setUploadProgresses
}) => {
  const sendOptimistic = useCallback((text, media, replyTo, taggedUserId) => {
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

    if (otherUserId && currentPrivateChat) {
      emitPrivateChatUpdated(
        { ...currentPrivateChat, id: otherUserId },
        { content: media ? (media.type === 'sticker' ? '🎭' : text || 'Media') : text, timestamp: optimistic.timestamp }
      );
    }

    return { uuid, optimistic };
  }, [roomId, otherUserId, user, currentPrivateChat, setMessages, scrollToEnd]);

  const resolveOptimistic = useCallback((uuid, response, media, originalCacheKey, replyTo, taggedUserId, text) => {
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
            text: text ?? '',
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
  }, [user, setMessages]);

  const handleSend = useCallback(async (text = '', mentionTaggedUserId = null, pendingMedia = null, replyingTo = null) => {
    text = text.trim();
    if (!text && !pendingMedia) return;
    const localMedia = pendingMedia;
    const replySnapshot = replyingTo
      ? { messageId: replyingTo.id, text: replyingTo.text, username: replyingTo.username, media: replyingTo.media, senderId: replyingTo.senderId }
      : null;
    const taggedUserId = replySnapshot?.senderId || mentionTaggedUserId || null;
    setPendingMedia?.(null);
    setReplyingTo?.(null);

    const localPreview = localMedia ? { type: localMedia.type, url: localMedia.uri, duration: localMedia.duration, isPending: true } : null;
    const { uuid } = sendOptimistic(text, localPreview, replySnapshot, taggedUserId);
    const originalCacheKey = roomId ? `room_${roomId}` : otherUserId ? `private_${otherUserId}` : null;

    const pendingMessageData = {
      id: uuid,
      text,
      media: localPreview,
      mediaType: localPreview?.type || null,
      mediaId: localMedia ? uuid : null,
      timestamp: new Date().toISOString(),
      username: user.username,
      avatar: user.avatar || null,
      gender: user.gender,
      type: roomId ? 'room' : 'private',
      roomId: roomId || undefined,
      roomPublicKey: roomId ? roomPublicKey : undefined,
      receiverId: otherUserId || undefined,
      receiverModel: otherUserId ? (currentPrivateChat?.role === 'guest' ? 'Guest' : 'User') : undefined,
    };
    try {
      await dbService.addPendingMessage(pendingMessageData);
      if (localMedia) await dbService.addFile(uuid, localMedia);
    } catch (persistErr) {
      console.error('Failed to queue message for retry:', persistErr);
    }

    try {
      let finalMedia = null;
      if (localMedia) {
        setUploadProgresses?.((prev) => ({ ...prev, [uuid]: 0 }));
        finalMedia = await messageService.uploadFile(localMedia, 'data', (progress) => {
          setUploadProgresses?.((prev) => ({ ...prev, [uuid]: progress }));
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
      resolveOptimistic(uuid, response, finalMedia, originalCacheKey, replySnapshot, taggedUserId, text);

      dbService.removePendingMessage(uuid).catch(() => {});
      if (localMedia) dbService.removeFile(uuid).catch(() => {});
    } catch (e) {
      showApiError(e, 'Message not delivered (still pending)');
    } finally {
      setUploadProgresses?.((prev) => {
        const next = { ...prev };
        delete next[uuid];
        return next;
      });
    }
  }, [roomId, otherUserId, user, roomPublicKey, currentPrivateChat, sendOptimistic, resolveOptimistic, setPendingMedia, setReplyingTo, setUploadProgresses]);

  const handleStickerSend = useCallback(async (sticker, replyingTo = null) => {
    const replySnapshot = replyingTo
      ? { messageId: replyingTo.id, text: replyingTo.text, username: replyingTo.username, media: replyingTo.media, senderId: replyingTo.senderId }
      : null;
    setReplyingTo?.(null);
    const { uuid } = sendOptimistic('', sticker, replySnapshot);
    const originalCacheKey = roomId ? `room_${roomId}` : otherUserId ? `private_${otherUserId}` : null;

    try {
      await dbService.addPendingMessage({
        id: uuid,
        text: '',
        media: sticker,
        mediaType: null,
        mediaId: null,
        timestamp: new Date().toISOString(),
        username: user.username,
        avatar: user.avatar || null,
        gender: user.gender,
        type: roomId ? 'room' : 'private',
        roomId: roomId || undefined,
        roomPublicKey: roomId ? roomPublicKey : undefined,
        receiverId: otherUserId || undefined,
        receiverModel: otherUserId ? (currentPrivateChat?.role === 'guest' ? 'Guest' : 'User') : undefined,
      });
    } catch (persistErr) {
      console.error('Failed to queue sticker for retry:', persistErr);
    }

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
      dbService.removePendingMessage(uuid).catch(() => {});
    } catch (e) {
      showApiError(e, 'Sticker not delivered (still pending)');
    }
  }, [roomId, otherUserId, user, roomPublicKey, currentPrivateChat, sendOptimistic, resolveOptimistic, setReplyingTo]);

  return { sendOptimistic, resolveOptimistic, handleSend, handleStickerSend };
};
