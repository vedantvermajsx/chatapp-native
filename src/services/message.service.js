import axios from 'axios';
import api from './api';
import { getMediaMeta, _addQualities } from '../utils/media.utils';

class MessageService {
  basePath = '/messages';

  async sendRoomMessage({ roomId, text, media, uuid }) {
    const strippedMedia = media ? { url: media.url, type: media.type } : null;
    const res = await api.post(`${this.basePath}/send`, {
      roomId,
      message: text,
      media: strippedMedia,
      uuid,
    });
    return res.data;
  }

  async sendPrivateMessage({ receiverId, content, receiverModel = 'User', media, uuid, isSystemMessage, systemType }) {
    const strippedMedia = media ? { url: media.url, type: media.type } : null;
    const res = await api.post(`${this.basePath}/private/send`, {
      receiverId,
      content,
      receiverModel,
      media: strippedMedia,
      uuid,
      ...(isSystemMessage && { isSystemMessage: true, systemType }),
    });
    return res.data;
  }

  async getRoomMessages(roomId, limit = 20, before = null, after = null) {
    const params = new URLSearchParams({ limit });
    if (before) params.set('before', before);
    if (after) params.set('after', after);
    const res = await api.get(`${this.basePath}/room/${roomId}?${params}`);
    return res.data;
  }

  async getPrivateMessages(otherUserId, limit = 20, before = null, after = null) {
    const params = new URLSearchParams({ limit });
    if (before) params.set('before', before);
    if (after) params.set('after', after);
    const res = await api.get(`${this.basePath}/private/${otherUserId}?${params}`);
    return res.data;
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

  // Mirrors the web app's signed-upload flow: fetch a Cloudinary signature
  // from our backend, then upload the picked asset straight to Cloudinary.
  // `asset` is the object returned by expo-image-picker:
  // { uri, mimeType, fileName, fileSize }
  async uploadFile(asset, folder = 'data', onProgress = null) {
    const MAX_FILE_SIZE = 8 * 1024 * 1024;
    if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
      throw new Error('File size exceeds the 8MB limit');
    }

    const sigResponse = await api.get(`${this.basePath}/upload-signature`, { params: { folder } });
    const { signature, timestamp, api_key, cloud_name, folder: targetFolder } = sigResponse.data;

    const mimeType = asset.mimeType || 'image/jpeg';
    const { mediaType, resourceType } = getMediaMeta(mimeType);
    const ext = mimeType.split('/')[1] || 'jpg';

    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      name: asset.fileName || `upload.${ext}`,
      type: mimeType,
    });
    formData.append('api_key', api_key);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', targetFolder);

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/${resourceType}/upload`;
    const uploadResponse = await axios.post(cloudinaryUrl, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: ({ loaded, total }) => {
        if (!total) return;
        onProgress?.(Math.min(100, Math.round((loaded * 100) / total)));
      },
    });

    const result = { url: uploadResponse.data.secure_url, type: mediaType };
    return _addQualities(result);
  }
}

export default new MessageService();
