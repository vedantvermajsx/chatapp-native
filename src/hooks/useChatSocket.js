import { useEffect, useRef, useState } from 'react';
import { ensureSocket, disconnectSocket } from '../events/chatSocketEvents';

export { disconnectSocket };
let activeChatKey = null;
export function setActiveChatKey(key) {
  activeChatKey = key || null;
}
export function getActiveChatKey() {
  return activeChatKey;
}

export const useChatSocket = (user, {
  currentRoom,
  currentPrivateChat,
  onRoomMessage,
  onPrivateMessage,
  onReadReceipt,
  onRoomEvent,
  onPresence,
  onRoomReadAck,
  onUnreadUpdate,
} = {}) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});

  const currentRoomRef = useRef(currentRoom);
  useEffect(() => { currentRoomRef.current = currentRoom; }, [currentRoom]);

  const cbRef = useRef({});
  useEffect(() => {
    cbRef.current = { onRoomMessage, onPrivateMessage, onReadReceipt, onRoomEvent, onPresence, onRoomReadAck, onUnreadUpdate };
  });

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    let socket;
    const handlers = {};

    (async () => {
      socket = await ensureSocket(user);
      if (!mounted) return;
      socketRef.current = socket;
      setConnected(socket.connected);

      if (currentRoomRef.current?._id) {
        socket.emit('joinRoom', currentRoomRef.current._id);
      }

      handlers.connect = () => mounted && setConnected(true);
      handlers.disconnect = () => mounted && setConnected(false);
      handlers.newMessage = (msg) => cbRef.current.onRoomMessage?.(msg);
      handlers.newPrivateMessage = (msg) => cbRef.current.onPrivateMessage?.(msg);
      handlers.readReceipt = (data) => cbRef.current.onReadReceipt?.(data);
      handlers.roomReadAck = (data) => cbRef.current.onRoomReadAck?.(data);
      handlers.unreadUpdate = (data) => cbRef.current.onUnreadUpdate?.(data);
      handlers.newRoom = (room) => cbRef.current.onRoomEvent?.({ type: 'new', room });
      handlers.roomUpdated = (room) => cbRef.current.onRoomEvent?.({ type: 'updated', room });
      handlers.roomDeleted = (data) => cbRef.current.onRoomEvent?.({ type: 'deleted', ...data });
      handlers.userOnline = ({ userId }) => cbRef.current.onPresence?.({ userId, isOnline: true });
      handlers.userOffline = ({ userId }) => cbRef.current.onPresence?.({ userId, isOnline: false, lastSeen: new Date().toISOString() });

      handlers.typingRoom = ({ roomId, count }) => {
        if (!roomId) return;
        setTypingUsers((prev) => ({ ...prev, [`room_${roomId}`]: count }));
      };
      handlers.stopTypingRoom = ({ roomId, count }) => {
        if (!roomId) return;
        setTypingUsers((prev) => {
          const key = `room_${roomId}`;
          if (!count) {
            if (!(key in prev)) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
          }
          return { ...prev, [key]: count };
        });
      };
      handlers.typingPrivate = ({ senderId, username, charCount }) => {
        if (!senderId) return;
        setTypingUsers((prev) => ({ ...prev, [`private_${senderId}`]: { username: username || 'Someone', charCount } }));
      };
      handlers.stopTypingPrivate = ({ senderId }) => {
        if (!senderId) return;
        setTypingUsers((prev) => {
          const key = `private_${senderId}`;
          if (!(key in prev)) return prev;
          const next = { ...prev };
          delete next[key];
          return next;
        });
      };

      Object.entries(handlers).forEach(([event, fn]) => socket.on(event, fn));
    })();

    return () => {
      mounted = false;
      if (socket) {
        Object.entries(handlers).forEach(([event, fn]) => socket.off(event, fn));
      }
    };
  }, [user?._id || user?.id]);

  useEffect(() => {
    if (currentRoom?._id && socketRef.current?.connected) {
      socketRef.current.emit('joinRoom', currentRoom._id);
    }
  }, [currentRoom?._id]);

  const emitTyping = (payload) => socketRef.current?.emit('typing', payload);
  const emitStopTyping = (payload) => socketRef.current?.emit('stopTyping', payload);
  const emitMarkRead = (payload) => socketRef.current?.emit('markRead', payload);
  const emitMarkRoomRead = (payload) => socketRef.current?.emit('markRoomRead', payload);
  const emitLeaveRoom = (roomId) => socketRef.current?.emit('leaveRoom', roomId);
  const emitJoinRoom = (payload) => socketRef.current?.emit('joinRoom', payload);

  return {
    connected,
    socket: socketRef.current,
    typingUsers,
    emitTyping,
    emitStopTyping,
    emitMarkRead,
    emitMarkRoomRead,
    emitLeaveRoom,
    emitJoinRoom,
  };
};
