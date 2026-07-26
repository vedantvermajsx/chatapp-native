import AsyncStorage from '@react-native-async-storage/async-storage';

export const DB_PREFIX = 'gatherup_db:';
export const MAX_MESSAGES_PER_CHAT = 100;

export const STORES = {
  rooms: 'rooms',
  joinedRooms: 'joinedRooms',
  privateChats: 'privateChats',
  messages: 'messages',
  pendingMessages: 'pendingMessages',
  pendingFiles: 'pendingFiles',
  unreadCounts: 'unreadCounts',
};

const key = (...parts) => DB_PREFIX + parts.join(':');

export const readJSON = async (storeKey, fallback) => {
  try {
    const raw = await AsyncStorage.getItem(storeKey);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const writeJSON = async (storeKey, value) => {
  try {
    await AsyncStorage.setItem(storeKey, JSON.stringify(value));
  } catch (error) {
    console.error('[localDB] Failed to write', storeKey, error);
  }
};

export const removeKey = async (storeKey) => {
  try {
    await AsyncStorage.removeItem(storeKey);
  } catch (error) {
    console.error('[localDB] Failed to remove', storeKey, error);
  }
};

export const messagesKey = (chatKey) => key(STORES.messages, chatKey);
export const roomsKey = (searchQuery = '') => key(STORES.rooms, searchQuery || '__all__');
export const joinedRoomsKey = () => key(STORES.joinedRooms);
export const privateChatsKey = () => key(STORES.privateChats);
export const pendingMessagesKey = () => key(STORES.pendingMessages);
export const pendingFilesKey = () => key(STORES.pendingFiles);
export const unreadCountsKey = () => key(STORES.unreadCounts);

export const clearAllData = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const dbKeys = allKeys.filter((k) => k.startsWith(DB_PREFIX));
    if (dbKeys.length) await AsyncStorage.multiRemove(dbKeys);
  } catch (error) {
    console.error('[localDB] Failed to clear data', error);
  }
};
