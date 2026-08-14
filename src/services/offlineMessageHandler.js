import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { dbService } from './localDB.service';
import messageService from './message.service';
import roomService from './room.service';
import { showToast } from '../utils/toast';
import { catchUpNewerMessagesHandler } from '../handlers/chat.handlers';

function isOnlineSafe() {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    return navigator.onLine;
  }
  return true;
}

let isOnline = isOnlineSafe();
let isSending = false;
let dependencies = {
  messageCache: null,
  setUnreadCounts: null,
  setHasMoreNewerMessages: null,
  setMessages: null,
  currentRoom: null,
  currentPrivateChat: null
};

const _pendingListeners = new Set();

export function addPendingMessageSentListener(fn) {
  if (typeof fn === 'function') _pendingListeners.add(fn);
  return () => _pendingListeners.delete(fn);
}

function _emitPendingSent(payload) {
  for (const fn of _pendingListeners) {
    try { fn(payload); } catch (_) {}
  }
}

export const setOfflineHandlerDependencies = (deps) => {
  dependencies = { ...dependencies, ...deps };
};

export const sendPendingMessages = async () => {
  if (!isOnlineSafe() || isSending) return;
  isSending = true;

  try {
    if (dependencies.setUnreadCounts) {
      const unreadCounts = await roomService.getUnreadCounts();
      dependencies.setUnreadCounts(unreadCounts);
    }

    const pendingMessages = await dbService.getPendingMessages();
    if (!pendingMessages.length) return;

    const caughtUpChats = new Set();

    for (const pendingMsg of pendingMessages) {
      const tempId = pendingMsg.id || pendingMsg._id;
      const cacheKey = pendingMsg.type === 'room'
        ? `room_${pendingMsg.roomId}`
        : `private_${pendingMsg.receiverId}`;

      if (!caughtUpChats.has(cacheKey) && dependencies.messageCache) {
        const chatData = dependencies.messageCache.current[cacheKey];
        if (chatData?.messages && chatData.messages.length > 0) {
          const chatId = pendingMsg.type === 'room' ? pendingMsg.roomId : pendingMsg.receiverId;
          const type = pendingMsg.type;

          const setMessagesForCache = () => {
            const isCurrentRoom = type === 'room' && dependencies.currentRoom?._id === chatId;
            const isCurrentPrivate = type === 'private' && dependencies.currentPrivateChat?.id === chatId;
            return (isCurrentRoom || isCurrentPrivate) ? dependencies.setMessages : () => {};
          };

          const roomPk = type === 'room' && dependencies.currentRoom?._id === chatId
            ? dependencies.currentRoom?.privateKey ?? null
            : null;

          await catchUpNewerMessagesHandler(
            chatId,
            type,
            chatData.messages,
            setMessagesForCache(),
            dependencies.setHasMoreNewerMessages,
            dependencies.messageCache,
            dependencies.setUnreadCounts,
            roomPk
          );
          caughtUpChats.add(cacheKey);
        }
      }

      try {
        let finalMedia = pendingMsg.media || null;
        if (pendingMsg.mediaType && pendingMsg.mediaId) {
          const file = await dbService.getFile(pendingMsg.mediaId);
          if (file) {
            const isCurrentChat =
              (pendingMsg.type === 'room' && dependencies.currentRoom?._id === pendingMsg.roomId) ||
              (pendingMsg.type === 'private' && dependencies.currentPrivateChat?.id === pendingMsg.receiverId);

            const updateProgress = dependencies.setUploadProgress
              ? (progress) => {
                  if (isCurrentChat) dependencies.setUploadProgress(tempId, progress);
                }
              : null;

            const uploadResult = await messageService.uploadFile(file, 'data', updateProgress);
            finalMedia = {
              type: uploadResult.type,
              url: uploadResult.url,
              isPending: false
            };

            updateProgress?.(null);
          }
        }

        let response;
        if (pendingMsg.type === 'room') {
          response = await messageService.sendRoomMessage({
            roomId: pendingMsg.roomId,
            text: pendingMsg.text,
            media: finalMedia,
            uuid: tempId,
            roomPublicKey: pendingMsg.roomPublicKey || null,
            skipToast: true
          });
        } else if (pendingMsg.type === 'private') {
          response = await messageService.sendPrivateMessage({
            receiverId: pendingMsg.receiverId,
            receiverModel: pendingMsg.receiverModel,
            content: pendingMsg.text,
            media: finalMedia,
            uuid: tempId,
            skipToast: true
          });
        }

        if (response) {
          let currentUser = null;
          try {
            const userStr = await AsyncStorage.getItem('user');
            currentUser = userStr ? JSON.parse(userStr) : null;
          } catch {}

          const finalMessage = {
            id: response._id || tempId,
            text: pendingMsg.text,
            isOwn: true,
            timestamp: response.timestamp || pendingMsg.timestamp,
            media: finalMedia,
            isPending: false,
            username: pendingMsg.username || currentUser?.username,
            avatar: pendingMsg.avatar || currentUser?.avatar || null,
            gender: pendingMsg.gender || currentUser?.gender
          };

          await dbService.addMessage(cacheKey, finalMessage);
          if (finalMessage.id !== tempId) {
            await dbService.removeMessage(cacheKey, tempId);
          }

          _emitPendingSent({ cacheKey, tempId, message: finalMessage });
        }

        await dbService.removePendingMessage(tempId);
        if (pendingMsg.mediaId) await dbService.removeFile(pendingMsg.mediaId);
      } catch (error) {
        console.error('Failed to send pending message:', error);
      }
    }
  } catch (error) {
    console.error('Error sending pending messages:', error);
  } finally {
    isSending = false;
  }
};

let _offlineHandlerSetUp = false;

export const setupOfflineHandler = () => {
  if (_offlineHandlerSetUp) {
    sendPendingMessages();
    return;
  }
  _offlineHandlerSetUp = true;

  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('online', async () => {
      isOnline = true;
      const pending = await dbService.getPendingMessages();
      if (pending.length > 0) {
        showToast.success('Back online! Sending pending messages...');
      }
      sendPendingMessages();
    });

    window.addEventListener('offline', () => {
      isOnline = false;
      showToast.info('You are offline. Messages will be sent when you are back online.');
    });
  }

  if (typeof AppState !== 'undefined' && AppState.addEventListener) {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        isOnline = isOnlineSafe();
        sendPendingMessages();
      }
    });
  }

  sendPendingMessages();
};