import api from './api';

class AuthService {
  basePath = '/auth';

  async checkUsername(username) {
    const res = await api.get(`${this.basePath}/check-username?username=${encodeURIComponent(username)}`);
    return res.data;
  }
  async login(credentials) {
    const res = await api.post(`${this.basePath}/login`, credentials);
    return res.data;
  }
  async register(userData) {
    const res = await api.post(`${this.basePath}/register`, userData);
    return res.data;
  }
  async guestLogin(guestData) {
    const res = await api.post(`${this.basePath}/guest`, guestData);
    return res.data;
  }
  async logout() {
    await api.post(`${this.basePath}/logout`);
  }
}

export default new AuthService();
