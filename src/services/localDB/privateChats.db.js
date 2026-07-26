import { readJSON, writeJSON, privateChatsKey } from './core';

export const dbPrivateChats = {
  async savePrivateChats(privateChats) {
    const list = privateChats.map((chat) => ({ ...chat, id: chat.otherUser?.id }));
    await writeJSON(privateChatsKey(), list);
  },

  async getPrivateChats() {
    return readJSON(privateChatsKey(), []);
  },

  async deletePrivateChat(id) {
    const list = await readJSON(privateChatsKey(), []);
    await writeJSON(privateChatsKey(), list.filter((c) => c.id !== id));
  },
};
