import api from './api';

class RoomService {
  basePath = '/rooms';

  async getAllRooms(searchQuery = '') {
    const res = await api.get(this.basePath, { params: { search: searchQuery } });
    return res.data;
  }

  async getAllRoomsPaginated(searchQuery = '', page = 0, limit = 20) {
    const res = await api.get(this.basePath, {
      params: { search: searchQuery, skip: page * limit, limit },
    });
    const data = res.data;
    if (Array.isArray(data)) {
      return { rooms: data, hasMore: data.length === limit };
    }
    return data;
  }

  async getJoinedRooms() {
    const res = await api.get(`${this.basePath}/joined`);
    return res.data;
  }

  async getUnreadCounts() {
    try {
      const res = await api.get(`${this.basePath}/unread`);
      return res.data;
    } catch {
      return {};
    }
  }

  async createRoom(groupName, groupDescription) {
    const res = await api.post(`${this.basePath}/create`, { groupName, groupDescription });
    return res.data;
  }

  async joinRoom(roomId, req) {
    const res = await api.post(`${this.basePath}/join`, { roomId, req });
    return res.data;
  }

  async leaveRoom(roomId) {
    if (!roomId) return;
    const res = await api.post(`${this.basePath}/leave`, { roomId });
    return res.data;
  }

  async getRoomMembers(roomId, skip = 0, search = '') {
    const res = await api.get(`${this.basePath}/${roomId}/members`, {
      params: { skip, limit: 20, search },
    });
    return res.data;
  }

  async searchRoomMembers(roomId, query, limit = 6) {
    const res = await api.get(`${this.basePath}/${roomId}/members`, {
      params: { search: query, skip: 0, limit },
    });
    const raw = res.data;
    return Array.isArray(raw) ? raw : (raw.members ?? []);
  }

  async deleteRoom(roomId) {
    const res = await api.delete(`${this.basePath}/${roomId}`);
    return res.data;
  }

  async updateRoom(roomId, roomData) {
    const res = await api.put(`${this.basePath}/${roomId}`, roomData);
    return res.data;
  }
}

export default new RoomService();
