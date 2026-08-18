import { useState, useCallback, useEffect, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import roomService from '../../services/room.service';
import messageService from '../../services/message.service';
import userService from '../../services/user.service';
import { dbService } from '../../services/localDB.service';
import { showApiError } from '../../utils/toast';
import { useChatSocket } from '../useChatSocket';
import { onPrivateChatUpdated } from '../../events/privateChatEvents';

export const useRoomsList = ({ user }) => {
  const [joinedRooms, setJoinedRooms] = useState([]);
  const [globalRooms, setGlobalRooms] = useState([]);
  const [privateChats, setPrivateChats] = useState([]);
  const [activeTab, setActiveTab] = useState('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [loadingPrivate, setLoadingPrivate] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState(null);
  const [userResults, setUserResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const loadJoined = useCallback(async () => {
    const cached = await dbService.getCachedJoinedRooms();
    if (cached.length) setJoinedRooms((prev) => (prev.length ? prev : cached));

    setLoadingRooms(true);
    try {
      const data = await roomService.getJoinedRooms();
      const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : (data.rooms || []));
      setJoinedRooms((prev) => {
        const serverIds = new Set(list.map((r) => r._id));
        const notYetOnServer = prev.filter((r) => !serverIds.has(r._id) && r.__optimistic);
        return [...list, ...notYetOnServer];
      });
      await dbService.saveJoinedRooms(list);
    } catch (e) {
      if (!cached.length) {
        setJoinedRooms([]);
        showApiError(e, 'Could not load rooms');
      }
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  const loadGlobal = useCallback(async () => {
    const cached = await dbService.getRooms('');
    if (cached.length) setGlobalRooms((prev) => (prev.length ? prev : cached));

    setLoadingGlobal(true);
    try {
      const data = await roomService.getAllRooms();
      const list = Array.isArray(data) ? data : (data.rooms || []);
      setGlobalRooms(list);
      await dbService.saveRooms(list, '');
    } catch (e) {
      if (!cached.length) {
        setGlobalRooms([]);
        showApiError(e, 'Could not load rooms');
      }
    } finally {
      setLoadingGlobal(false);
    }
  }, []);

  const mergePrivateChats = (serverList, localList) => {
    const byId = new Map();
    serverList.forEach((c) => {
      const id = c.otherUser?.id || c.otherUser?._id;
      if (id) byId.set(id, c);
    });
    localList.forEach((c) => {
      const id = c.otherUser?.id || c.otherUser?._id;
      if (!id) return;
      const serverEntry = byId.get(id);
      if (!serverEntry) {
        byId.set(id, c);
        return;
      }
      const serverTs = new Date(serverEntry.lastMessage?.timestamp || 0).getTime();
      const localTs = new Date(c.lastMessage?.timestamp || 0).getTime();
      if (localTs > serverTs) {
        byId.set(id, { ...serverEntry, lastMessage: c.lastMessage });
      }
    });
    return Array.from(byId.values()).sort(
      (a, b) => new Date(b.lastMessage?.timestamp || 0) - new Date(a.lastMessage?.timestamp || 0)
    );
  };

  const loadPrivate = useCallback(async () => {
    const cached = await dbService.getPrivateChats();
    if (cached.length) setPrivateChats((prev) => (prev.length ? prev : cached));

    setLoadingPrivate(true);
    try {
      const data = await messageService.getPrivateChats();
      const list = Array.isArray(data) ? data : (data.chats || []);
      setPrivateChats((prev) => {
        const merged = mergePrivateChats(list, prev);
        dbService.savePrivateChats(merged).catch(() => {});
        return merged;
      });
    } catch (e) {
      if (!cached.length) {
        setPrivateChats([]);
        showApiError(e, 'Could not load chats');
      }
    } finally {
      setLoadingPrivate(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onPrivateChatUpdated((otherUser, lastMessage) => {
      setPrivateChats((prev) => {
        const idx = prev.findIndex((c) => (c.otherUser?.id || c.otherUser?._id) === otherUser.id);
        let next;
        if (idx !== -1) {
          const existing = prev[idx];
          const updated = { ...existing, otherUser: { ...existing.otherUser, ...otherUser }, lastMessage };
          next = [updated, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
        } else {
          next = [{ otherUser, lastMessage }, ...prev];
        }
        dbService.savePrivateChats(next).catch(() => {});
        return next;
      });
    });
    return unsubscribe;
  }, []);

  const handleRoomEvent = useCallback((evt) => {
    if (!evt) return;
    if (evt.type === 'new') {
      loadJoined();
      loadGlobal();
    } else if (evt.type === 'updated' && evt.room) {
      const id = evt.room._id || evt.room.id;
      setJoinedRooms((prev) => prev.map((r) => (r._id === id ? { ...r, ...evt.room } : r)));
      setGlobalRooms((prev) => prev.map((r) => (r._id === id ? { ...r, ...evt.room } : r)));
    } else if (evt.type === 'deleted' && evt.roomId) {
      setJoinedRooms((prev) => prev.filter((r) => r._id !== evt.roomId));
      setGlobalRooms((prev) => prev.filter((r) => r._id !== evt.roomId));
    }
  }, [loadJoined, loadGlobal]);

  const handleStartPrivateChat = useCallback((otherUser) => {
    const otherUserId = otherUser.id || otherUser._id;
    if (!otherUserId) return;

    setPrivateChats((prev) => {
      const idx = prev.findIndex((c) => (c.otherUser?.id || c.otherUser?._id) === otherUserId);
      if (idx !== -1) {
        const updated = [...prev];
        const [existing] = updated.splice(idx, 1);
        const next = [existing, ...updated];
        dbService.savePrivateChats(next);
        return next;
      }

      const next = [{ otherUser: { ...otherUser, id: otherUserId }, lastMessage: null }, ...prev];
      dbService.savePrivateChats(next);
      return next;
    });
  }, []);

  const handlePrivateMessage = useCallback(async (msg) => {
    const myId = user?._id || user?.id;
    const isOwnMessage = msg.senderId === myId;
    const otherUserId = isOwnMessage ? msg.receiverId : msg.senderId;
    if (!otherUserId) return;

    const previewText = await messageService.decryptChatPreview(msg);

    let isBrandNew = false;
    setPrivateChats((prev) => {
      const idx = prev.findIndex((c) => (c.otherUser?.id || c.otherUser?._id) === otherUserId);
      const lastMessage = { content: previewText, timestamp: msg.timestamp || new Date().toISOString() };

      if (idx !== -1) {
        const updated = [...prev];
        const [existing] = updated.splice(idx, 1);
        const next = [{ ...existing, lastMessage }, ...updated];
        dbService.savePrivateChats(next);
        return next;
      }

      isBrandNew = true;

      const otherUser = isOwnMessage
        ? {
            id: otherUserId,
            username: msg.receiverUsername || msg.username || 'Unknown',
            role: (msg.receiverModel?.toLowerCase() || 'user'),
            avatar: msg.receiverAvatar || null,
            isOnline: msg.isOnline,
          }
        : {
            id: otherUserId,
            username: msg.senderUsername || msg.username || 'Unknown',
            role: (msg.senderModel?.toLowerCase() || 'user'),
            avatar: msg.avatar || null,
            isOnline: msg.isOnline,
          };
      const next = [{ otherUser, lastMessage }, ...prev];
      dbService.savePrivateChats(next);
      return next;
    });

    if (isBrandNew) {
      loadPrivate();
    }
  }, [user, loadPrivate]);

  const { emitJoinRoom } = useChatSocket(user, {
    onRoomEvent: handleRoomEvent,
    onPrivateMessage: handlePrivateMessage,
  });

  useEffect(() => {
    loadJoined();
    loadGlobal();
    loadPrivate();
  }, [loadJoined, loadGlobal, loadPrivate]);

  useFocusEffect(
    useCallback(() => {
      loadJoined();
      loadPrivate();
    }, [loadJoined, loadPrivate])
  );

  const isUserSearch = activeTab === 'explore' && searchQuery.trim().startsWith('@');

  useEffect(() => {
    if (!isUserSearch) {
      setUserResults([]);
      return;
    }
    const q = searchQuery.trim().slice(1);
    if (!q) {
      setUserResults([]);
      return;
    }
    setSearchingUsers(true);
    const t = setTimeout(async () => {
      try {
        const results = await userService.searchUsers(q, 5);
        setUserResults(Array.isArray(results) ? results.slice(0, 5) : []);
      } catch (e) {
        setUserResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [isUserSearch, searchQuery]);

  const filteredJoined = useMemo(() => {
    if (!searchQuery) return joinedRooms;
    const q = searchQuery.toLowerCase();
    return joinedRooms.filter(r => (r.groupName || r.name || '').toLowerCase().includes(q));
  }, [joinedRooms, searchQuery]);

  const filteredGlobal = useMemo(() => {
    const joinedIds = new Set(joinedRooms.map(r => r._id));
    let list = globalRooms.filter(r => !joinedIds.has(r._id));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => (r.groupName || r.name || '').toLowerCase().includes(q));
    }
    return list;
  }, [globalRooms, joinedRooms, searchQuery]);

  const filteredPrivate = useMemo(() => {
    if (!searchQuery) return privateChats;
    const q = searchQuery.toLowerCase();
    return privateChats.filter(c => (c.otherUser?.username || '').toLowerCase().includes(q));
  }, [privateChats, searchQuery]);

  return {
    joinedRooms, setJoinedRooms,
    globalRooms, setGlobalRooms,
    privateChats, setPrivateChats,
    activeTab, setActiveTab,
    searchQuery, setSearchQuery,
    refreshing, setRefreshing,
    showCreateRoom, setShowCreateRoom,
    newRoomName, setNewRoomName,
    newRoomDesc, setNewRoomDesc,
    creatingRoom, setCreatingRoom,
    loadingRooms, setLoadingRooms,
    loadingGlobal, setLoadingGlobal,
    loadingPrivate, setLoadingPrivate,
    joiningRoomId, setJoiningRoomId,
    userResults, setUserResults,
    searchingUsers, setSearchingUsers,
    loadJoined, loadGlobal, loadPrivate,
    handleStartPrivateChat, emitJoinRoom,
    isUserSearch, filteredJoined, filteredGlobal, filteredPrivate
  };
};
