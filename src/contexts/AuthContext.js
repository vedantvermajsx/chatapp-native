import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { disconnectSocket } from '../hooks/useChatSocket';
import authService from '../services/auth.service';
import { dbService } from '../services/localDB.service';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) setUser(JSON.parse(userStr));
      setLoading(false);
    })();
  }, []);

  const persist = async (res) => {
    await AsyncStorage.setItem('token', res.token);
    await AsyncStorage.setItem('user', JSON.stringify(res.user));
    setUser(res.user);
  };

  const login = async (username, password) => {
    try {
      const res = await authService.login({ username, password });
      await persist(res);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (username, email, gender, password) => {
    try {
      const res = await authService.register({ username, email, gender, password });
      await persist(res);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    }
  };

  const guestLogin = async (username, gender) => {
    try {
      const res = await authService.guestLogin({ username, gender });
      await persist(res);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Guest login failed' };
    }
  };

  const logout = async () => {
    disconnectSocket();
    await AsyncStorage.multiRemove(['token', 'user']);
    await dbService.clearAllData();
    setUser(null);
  };

  const updateUser = async (userData) => {
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, guestLogin, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
