import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useChatSocket, getActiveChatKey } from '../hooks/useChatSocket';
import roomService from '../services/room.service';
import { dbService } from '../services/localDB.service';
import { syncUnreadFromResponse } from '../utils/syncUnreadCount';

const UnreadCountsContext = createContext(null);

export const UnreadCountsProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadCounts, setUnreadCounts] = useState({});

  const loadUnread = useCallback(async () => {
    const cached = await dbService.loadUnreadCounts();
    if (Object.keys(cached).length) setUnreadCounts((prev) => (Object.keys(prev).length ? prev : cached));

    try {
      const counts = await roomService.getUnreadCounts();
      const next = counts && typeof counts === 'object' ? { ...counts } : {};
      const activeKey = getActiveChatKey();
      if (activeKey) delete next[activeKey];
      setUnreadCounts(next);
      await dbService.saveUnreadCounts(next);
    } catch (e) {
    }
  }, []);

  const handleUnreadUpdate = useCallback(({ chatKey } = {}) => {
    if (!chatKey || chatKey === getActiveChatKey()) return;
    setUnreadCounts((prev) => {
      const next = { ...prev, [chatKey]: (prev[chatKey] || 0) + 1 };
      dbService.saveUnreadCounts(next);
      return next;
    });
  }, []);

  const handleRoomReadAck = useCallback(({ roomId }) => {
    if (!roomId) return;
    setUnreadCounts((prev) => {
      const key = `room_${roomId}`;
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      dbService.saveUnreadCounts(next);
      return next;
    });
  }, []);

  const { connected } = useChatSocket(user, {
    onUnreadUpdate: handleUnreadUpdate,
    onRoomReadAck: handleRoomReadAck,
  });

  useEffect(() => {
    if (!connected) return;
    loadUnread();
  }, [connected, loadUnread]);

  const setUnreadCountsPersisted = useCallback((updater) => {
    setUnreadCounts((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      dbService.saveUnreadCounts(next);
      return next;
    });
  }, []);

  const syncUnreadCount = useCallback((chatKey, unreadCount) => {
    syncUnreadFromResponse(setUnreadCountsPersisted, chatKey, unreadCount);
  }, [setUnreadCountsPersisted]);

  return (
    <UnreadCountsContext.Provider
      value={{ unreadCounts, setUnreadCounts: setUnreadCountsPersisted, syncUnreadCount, loadUnread }}
    >
      {children}
    </UnreadCountsContext.Provider>
  );
};

export const useUnreadCounts = () => {
  const ctx = useContext(UnreadCountsContext);
  if (!ctx) throw new Error('useUnreadCounts must be used within UnreadCountsProvider');
  return ctx;
};
