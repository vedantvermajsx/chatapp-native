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
}

export default new UserService();
