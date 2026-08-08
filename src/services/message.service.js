import api from './api';
import { toMediaPayload } from './message/mediaPayload';
import { uploadAsset } from './message/upload';
import userService from './user.service.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import keyManager from './keyManager.js';
import {
  encryptForRoom, decryptForRoom,
  encryptPrivateMessage, decryptPrivateMessage,
} from '../utils/crypto.js';

class MessageService {
  basePath = '/messages';

  constructor() {
    this._publicKeyCache = new Map();
  }

  async _getPublicKey(userId) {
    if (this._publicKeyCache.has(userId)) return this._publicKeyCache.get(userId);
    try {
      const profile = await userService.getUserProfile(userId);
      const publicKey = profile?.publicKey || null;
      if (publicKey) this._publicKeyCache.set(userId, publicKey);
      return publicKey;
    } catch (err) {
      console.error('[messageService] failed to fetch public key:', err.message);
      return null;
    }
  }

  async _getSelfPublicKey() {
    try {
      const userStr = await AsyncStorage.getItem('user');
      const selfUser = userStr ? JSON.parse(userStr) : null;
      if (selfUser?.publicKey) return selfUser.publicKey;
    } catch {}

    try {
      const res = await userService.getProfile();
      const profile = res?.user || res;
      if (profile?.publicKey) {
        try {
          const userStr = await AsyncStorage.getItem('user');
          const existing = userStr ? JSON.parse(userStr) : {};
          const updated = { ...existing, publicKey: profile.publicKey };
          await AsyncStorage.setItem('user', JSON.stringify(updated));
        } catch {}
        return profile.publicKey;
      }
    } catch (err) {
      console.error('[messageService] failed to fetch self public key:', err.message);
    }
    return null;
  }

  async _decryptRoomMessages(messages, roomPrivateKeyPem) {
    if (!messages?.length) return messages;
    if (!roomPrivateKeyPem) return messages;

    return Promise.all(messages.map(async (msg) => {
      if (!msg.iv || !msg.wrappedKey) return msg;
      const { iv, wrappedKey, ...clean } = msg;
      try {
        const text = await decryptForRoom(msg.text, iv, wrappedKey, roomPrivateKeyPem);
        return { ...clean, text };
      } catch (err) {
        console.error('[messageService] room decrypt failed:', err.message);
        return { ...clean, text: 'Unable to decrypt message' };
      }
    }));
  }

  async _decryptPrivateMessages(messages, otherUserId) {
    if (!messages?.length) return messages;
    const selfId = keyManager.getSelfId();
    const privateKeyPem = await keyManager.getSelfPrivateKey();
    if (!privateKeyPem) return messages;

    return Promise.all(messages.map(async (msg) => {
      if (!msg.iv) return msg;
      const { iv, senderKeyWrapped, receiverKeyWrapped, ...clean } = msg;
      const isOwn = String(msg.senderId) === String(selfId);
      const wrappedKeyForMe = isOwn ? senderKeyWrapped : receiverKeyWrapped;
      if (!wrappedKeyForMe) return { ...clean, text: 'Unable to decrypt message' };
      try {
        const text = await decryptPrivateMessage(msg.text ?? msg.content, iv, wrappedKeyForMe, privateKeyPem);
        return { ...clean, text };
      } catch (err) {
        console.error('[messageService] private decrypt failed:', err.message);
        return { ...clean, text: 'Unable to decrypt message' };
      }
    }));
  }

  async sendRoomMessage({ roomId, text, media, uuid, roomPublicKey, replyTo, taggedUser, skipToast = false }) {
    try {
      const body = {
        roomId,
        media: toMediaPayload(media),
        uuid,
        replyTo: replyTo?.messageId,
        taggedUser,
      };

      if (text && roomPublicKey) {
        const { content, iv, wrappedKey } = await encryptForRoom(text, roomPublicKey);
        body.message = content;
        body.iv = iv;
        body.wrappedKey = wrappedKey;
      } else {
        body.message = text;
      }

      const res = await api.post(`${this.basePath}/send`, body);
      return res.data;
    } catch (error) {
      throw error;
    }
  }

  async sendPrivateMessage({ receiverId, content, receiverModel = 'User', media, uuid, isSystemMessage, systemType, replyTo, taggedUser, skipToast = false }) {
    try {
      const body = {
        receiverId,
        receiverModel,
        media: toMediaPayload(media),
        uuid,
        ...(isSystemMessage && { isSystemMessage: true, systemType }),
        replyTo: replyTo?.messageId,
        taggedUser,
      };

      if (content && !isSystemMessage) {
        const selfPublicKey = await this._getSelfPublicKey();
        const receiverPublicKey = await this._getPublicKey(receiverId);

        if (selfPublicKey && receiverPublicKey) {
          const { content: enc, iv, senderKeyWrapped, receiverKeyWrapped } =
            await encryptPrivateMessage(content, selfPublicKey, receiverPublicKey);
          body.content = enc;
          body.iv = iv;
          body.senderKeyWrapped = senderKeyWrapped;
          body.receiverKeyWrapped = receiverKeyWrapped;
        } else {
          console.warn('[messageService] Missing public key for encryption.', { selfPublicKey: !!selfPublicKey, receiverPublicKey: !!receiverPublicKey });
          body.content = content;
        }
      } else {
        body.content = content;
      }

      const res = await api.post(`${this.basePath}/private/send`, body);
      return res.data;
    } catch (error) {
      throw error;
    }
  }

  async getRoomMessages(roomId, limit = 20, before = null, after = null, roomPrivateKey = null) {
    const params = new URLSearchParams({ limit });
    if (before) params.set('before', before);
    if (after)  params.set('after', after);
    const res = await api.get(`${this.basePath}/room/${roomId}?${params}`);
    const data = res.data;
    data.messages = await this._decryptRoomMessages(data.messages, roomPrivateKey);
    return data;
  }

  async getPrivateMessages(otherUserId, limit = 20, before = null, after = null) {
    const params = new URLSearchParams({ limit });
    if (before) params.set('before', before);
    if (after)  params.set('after', after);
    const res = await api.get(`${this.basePath}/private/${otherUserId}?${params}`);
    const data = res.data;
    data.messages = await this._decryptPrivateMessages(data.messages, otherUserId);
    return data;
  }

  async getLastReadStatus(otherUserId) {
    const res = await api.get(`${this.basePath}/private/${otherUserId}/last-seen`);
    return res.data;
  }

  async getPrivateChats() {
    const res = await api.get(`${this.basePath}/private`);
    return res.data;
  }

  async deletePrivateChat(otherUserId) {
    const res = await api.delete(`${this.basePath}/private/${otherUserId}`);
    return res.data;
  }

  async uploadFile(asset, folder = 'data', onProgress = null) {
    return uploadAsset(api, this.basePath, asset, folder, onProgress);
  }
}

export default new MessageService();
