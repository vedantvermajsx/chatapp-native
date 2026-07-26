import { dbRooms } from './localDB/rooms.db.js';
import { dbPrivateChats } from './localDB/privateChats.db.js';
import { dbMessages } from './localDB/messages.db.js';
import { dbPendingMessages } from './localDB/pendingMessages.db.js';
import { dbUnreadCounts } from './localDB/unreadCounts.db.js';
import { clearAllData } from './localDB/core.js';

export const dbService = {
  ...dbRooms,
  ...dbPrivateChats,
  ...dbMessages,
  ...dbPendingMessages,
  ...dbUnreadCounts,
  clearAllData,
};
