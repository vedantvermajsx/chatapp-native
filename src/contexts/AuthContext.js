import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { disconnectSocket } from '../hooks/useChatSocket';
import authService from '../services/auth.service';
import { dbService } from '../services/localDB.service';
import keyManager from '../services/keyManager';
import { generateRsaKeyPairPem } from '../utils/crypto';
import { onSessionExpired } from '../events/sessionEvents';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const storedUser = JSON.parse(userStr);
        if (storedUser?._id) {
          await keyManager.loadSelfPrivateKey(storedUser._id).catch(() => {});
        }
        setUser(storedUser);
      }
      setLoading(false);
    })();
  }, []);

  const persist = async (res) => {
    await AsyncStorage.setItem('token', res.token);
    await AsyncStorage.setItem('user', JSON.stringify(res.user));
    setUser(res.user);
    if (res.privateKey && res.user?._id) {
      await keyManager.setSelfPrivateKey(res.user._id, res.privateKey);
    }
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
      const { publicKeyPem, privateKeyPem } = await generateRsaKeyPairPem();
      const res = await authService.guestLogin({ username, gender, publicKey: publicKeyPem });
      await persist(res);
      if (res.user?._id && privateKeyPem) {
        await keyManager.setSelfPrivateKey(res.user._id, privateKeyPem);
      }
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Guest login failed' };
    }
  };

  const logout = async () => {
    disconnectSocket();
    await AsyncStorage.multiRemove(['token', 'user']);
    setUser(null);
    try {
      await keyManager.clear();
    } catch (err) {
      console.error('Error clearing keys on logout:', err);
    }
    try {
      await dbService.clearAllData();
    } catch (err) {
      console.error('Error clearing local DB on logout:', err);
    }
  };

  useEffect(() => {
    return onSessionExpired(logout);
  }, []);

  const updateUser = async (userData) => {
    const merged = { ...(user || {}), ...userData };
    if (user?.publicKey && !userData?.publicKey) {
      merged.publicKey = user.publicKey;
    }
    await AsyncStorage.setItem('user', JSON.stringify(merged));
    setUser(merged);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, guestLogin, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
