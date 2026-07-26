import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import { BASE_URL } from '../services/api';

const SOCKET_URL = BASE_URL.replace('/api', '');

// A single physical socket connection is shared across every screen that
// calls useChatSocket (RoomListScreen, ChatScreen, ...). Each screen still
// attaches/detaches its own listeners, but they all ride the same
// connection instead of opening a new one per screen.
let sharedSocket = null;
let sharedUserId = null;
let connectingPromise = null;

async function ensureSocket(user) {
  const uid = user?._id || user?.id;
  if (sharedSocket && sharedUserId === uid) return sharedSocket;
  if (connectingPromise) return connectingPromise;

  connectingPromise = (async () => {
    if (sharedSocket) {
      sharedSocket.disconnect();
      sharedSocket = null;
    }
    const token = await AsyncStorage.getItem('token');
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      auth: { token },
    });
    sharedSocket = socket;
    sharedUserId = uid;

    socket.on('connect', () => {
      socket.emit('join', {
        userId: uid,
        role: user.role,
        username: user.username,
        gender: user.gender,
      });
    });

    return socket;
  })();

  const result = await connectingPromise;
  connectingPromise = null;
  return result;
}

export function disconnectSocket() {
  sharedSocket?.disconnect();
  sharedSocket = null;
  sharedUserId = null;
}

// Tracks which chat (room_x / private_y) is the actively open ChatScreen,
// shared across screens the same way sharedSocket is. Lets RoomListScreen
// avoid flashing a badge for the chat the user is currently sitting in
// while still catching up correctly once they navigate away.
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
