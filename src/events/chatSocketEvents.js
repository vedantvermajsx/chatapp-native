import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import { BASE_URL } from '../services/api';

const SOCKET_URL = BASE_URL.replace('/api', '');

let sharedSocket = null;
let sharedUserId = null;
let connectingPromise = null;

export async function ensureSocket(user) {
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
