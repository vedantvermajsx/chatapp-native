import api from './api';

class UserService {
  basePath = '/users';

  async getProfile() {
    const res = await api.get(`${this.basePath}/profile`);
    return res.data;
  }

  async updateProfile(data) {
    const res = await api.put(`${this.basePath}/profile`, data);
    return res.data;
  }

  async getActivityStatus(userId) {
    const res = await api.get(`${this.basePath}/activity-status`, { params: { userId } });
    return res.data.data;
  }

  async getUserProfile(userId) {
    const res = await api.get(`${this.basePath}/${userId}/profile`);
    return res.data?.user;
  }

  async searchUsers(query, limit = 5) {
    const res = await api.get(`${this.basePath}/search`, { params: { q: query, limit } });
    const data = res.data;
    const list = Array.isArray(data) ? data : (data?.users || data?.data || []);
    return list.map((u) => ({
      id: u.userid || u.id || u._id,
      username: u.username,
      avatar: u.pfp ?? u.avatar ?? '',
      bio: u.bio ?? '',
      gender: u.gender,
    }));
  }

  async registerDeviceToken(token, platform = 'android') {
    const res = await api.post(`${this.basePath}/device-token`, { token, platform });
    return res.data;
  }

  async removeDeviceToken(token) {
    const res = await api.delete(`${this.basePath}/device-token`, { data: { token } });
    return res.data;
  }
}

export default new UserService();