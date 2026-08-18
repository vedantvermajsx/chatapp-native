import { createNavigationContainerRef } from '@react-navigation/native';
import roomService from './room.service';
import userService from './user.service';

export const navigationRef = createNavigationContainerRef();

function extractRoomList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.rooms)) return data.rooms;
  return [];
}

function waitForNavigationReady(timeoutMs = 8000) {
  return new Promise((resolve) => {
    if (navigationRef.isReady()) return resolve(true);
    const start = Date.now();
    const interval = setInterval(() => {
      if (navigationRef.isReady()) {
        clearInterval(interval);
        resolve(true);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        resolve(false);
      }
    }, 150);
  });
}

export async function navigateToNotificationTarget(remoteMessage) {
  const data = remoteMessage?.data || {};

  const ready = await waitForNavigationReady();
  if (!ready || !navigationRef.isReady()) return;

  try {
    if (data.type === 'private' && data.senderId) {
      const other = await userService.getUserProfile(data.senderId);
      if (!other) return;
      navigationRef.navigate('Chat', {
        privateChat: { ...other, id: other._id || other.id || data.senderId },
      });
      return;
    }

    if (data.type === 'room' && data.roomId) {
      const joined = await roomService.getJoinedRooms();
      const rooms = extractRoomList(joined);
      const room = rooms.find((r) => String(r._id) === String(data.roomId));

      navigationRef.navigate('Chat', {
        room: room || { _id: data.roomId },
      });
    }
  } catch (err) {
  }
}
