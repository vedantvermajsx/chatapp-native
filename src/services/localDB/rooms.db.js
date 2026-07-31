import { readJSON, writeJSON, roomsKey, joinedRoomsKey } from './core';

export const dbRooms = {
  async saveRooms(rooms, searchQuery = '') {
    await writeJSON(roomsKey(searchQuery), rooms);
  },

  async getRooms(searchQuery = '') {
    return readJSON(roomsKey(searchQuery), []);
  },

  async saveJoinedRooms(rooms) {
    await writeJSON(joinedRoomsKey(), rooms);
  },

  async getCachedJoinedRooms() {
    return readJSON(joinedRoomsKey(), []);
  },

  async removeJoinedRoom(roomId) {
    const rooms = await readJSON(joinedRoomsKey(), []);
    await writeJSON(joinedRoomsKey(), rooms.filter((r) => r._id !== roomId));
  },
};
