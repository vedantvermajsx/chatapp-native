import { readJSON, writeJSON, pendingMessagesKey, pendingFilesKey } from './core';

export const dbPendingMessages = {
  async addPendingMessage(pendingMsg) {
    const list = await readJSON(pendingMessagesKey(), []);
    const idx = list.findIndex((m) => m.id === pendingMsg.id);
    if (idx !== -1) list[idx] = pendingMsg;
    else list.push(pendingMsg);
    await writeJSON(pendingMessagesKey(), list);
  },

  async getPendingMessages() {
    const list = await readJSON(pendingMessagesKey(), []);
    return [...list].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  },

  async removePendingMessage(id) {
    const list = await readJSON(pendingMessagesKey(), []);
    await writeJSON(pendingMessagesKey(), list.filter((m) => m.id !== id));
  },

  async addFile(id, file) {
    const files = await readJSON(pendingFilesKey(), {});
    files[id] = file;
    await writeJSON(pendingFilesKey(), files);
  },

  async getFile(id) {
    const files = await readJSON(pendingFilesKey(), {});
    return files[id] ?? null;
  },

  async removeFile(id) {
    const files = await readJSON(pendingFilesKey(), {});
    delete files[id];
    await writeJSON(pendingFilesKey(), files);
  },
};
