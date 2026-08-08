import roomService from '../../services/room.service.js';
import { showToast } from '../../utils/toast';

export const joinRoomHandler = async (
  roomId,
  joinedRooms,
  user,
  setCurrentRoom,
  setCurrentPrivateChat,
  setMessages,
  socket,
  setLoadingJoinRoom,
  setLoadingMessages,
  messageCache,
  CACHE_TTL,
  currentRoom,
  roomObject = null
) => {
  if (currentRoom && currentRoom._id === roomId) return;

  
  const alreadyJoined = joinedRooms.some(r => r._id === roomId);
let room = joinedRooms.find(r => r._id === roomId) || roomObject || null;


  if (room) setCurrentRoom(room);
  setCurrentPrivateChat(null);

  const cacheKey = `room_${roomId}`;
  const inMemory = messageCache.current[cacheKey];
  if (!inMemory?.messages?.length) {
    setMessages([]);
    setLoadingMessages(true);
  }

  const data = {
    roomId,
    message: `${user.username} joined the room`,
    media: null,
    isSystemMessage: true,
    systemType: 'member-joined',
    userId: user._id || user.id,
    username: user.username,
  };

  if (alreadyJoined) {
    socket.emit('joinRoom', data);
    return;
  }

  setLoadingJoinRoom(true);
  try {
    const res = await roomService.joinRoom(roomId, data);

    // No plaintext key comes back anymore — the server asks currently-online
    // members to wrap the room's AES key for us (see useChatSocket.js's
    // 'roomKeyNeeded' handler). Until one of them does, message decryption
    // will just show a locked placeholder; it resolves itself once a grant
    // lands, no action needed here.

    if (!room) {
      const serverRoom = res?.room || res?.data?.room || null;
      if (serverRoom) {
        setCurrentRoom(serverRoom);
        room = serverRoom;
      }
    }

    socket.emit('joinRoom', data);
  } catch (error) {
    showToast.error(error.response?.data?.message || 'Failed to join room');
  } finally {
    setLoadingJoinRoom(false);
  }
};