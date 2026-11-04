import api from './api';
import { STORAGE_KEYS } from '../utils/constants';

export const authService = {
  async login(identifier, password) {
    try {
      const response = await api.post('/auth/login', {
        identifier,
        email: identifier,
        password,
      });
      const payload = response.data?.data || response.data;
      const { token, user } = payload;
      if (token) localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      if (user) localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
      return { token, user };
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Invalid Roll No. / Email or password.';
      throw new Error(msg);
    }
  },

  async register({ name, email, studentId, password, role }) {
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        studentId,
        rollNo: studentId,
        password,
        role,
      });
      const payload = response.data?.data || response.data;
      const { token, user } = payload;
      if (token) localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      if (user) localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
      return { token, user };
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Registration failed.';
      throw new Error(msg);
    }
  },

  getCurrentUser() {
    const rawUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (!rawUser) return null;
    try {
      return JSON.parse(rawUser);
    } catch {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  },
};

export default authService;
