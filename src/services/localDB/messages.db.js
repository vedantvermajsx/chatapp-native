import { readJSON, writeJSON, removeKey, messagesKey, MAX_MESSAGES_PER_CHAT } from './core';

const emptyMeta = (chatKey) => ({ chatKey, messages: [], hasMore: false, latestTimestamp: null, scrollTop: null });

export const dbMessages = {
  async getLatestTimestamp(chatKey) {
    const data = await readJSON(messagesKey(chatKey), null);
    return data?.latestTimestamp ?? null;
  },

  async getChatMeta(chatKey) {
    return readJSON(messagesKey(chatKey), null);
  },

  async getScrollPosition(chatKey) {
    const data = await readJSON(messagesKey(chatKey), null);
    return data?.scrollTop ?? null;
  },

  async saveScrollPosition(chatKey, scrollTop) {
    const data = await readJSON(messagesKey(chatKey), emptyMeta(chatKey));
    await writeJSON(messagesKey(chatKey), { ...data, scrollTop });
  },

  async saveMessages(chatKey, messages, hasMore = false) {
    if (!messages?.length) return;
    const toSave = messages.slice(-MAX_MESSAGES_PER_CHAT);
    const latestTimestamp = toSave[toSave.length - 1]?.timestamp ?? null;
    await writeJSON(messagesKey(chatKey), {
      chatKey,
      messages: toSave,
      hasMore,
      latestTimestamp,
    });
  },

  async mergeNewMessages(chatKey, newMessages) {
    if (!newMessages?.length) return;
    const data = await readJSON(messagesKey(chatKey), emptyMeta(chatKey));
    const existingIds = new Set(data.messages.map((m) => String(m.id)));
    const merged = [...data.messages, ...newMessages.filter((m) => !existingIds.has(String(m.id)))];
    const capped = merged.slice(-MAX_MESSAGES_PER_CHAT);
    const latestTimestamp = capped[capped.length - 1]?.timestamp ?? data.latestTimestamp;
    await writeJSON(messagesKey(chatKey), { ...data, messages: capped, latestTimestamp });
  },

  async getMessages(chatKey) {
    const data = await readJSON(messagesKey(chatKey), null);
    if (!data) return { messages: [], hasMore: false, latestTimestamp: null };
    const sorted = [...data.messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    return { messages: sorted, hasMore: data.hasMore ?? false, latestTimestamp: data.latestTimestamp ?? null };
  },

  async addMessage(chatKey, message) {
    const id = message?.id || message?._id;
    if (!id) return;
    const data = await readJSON(messagesKey(chatKey), emptyMeta(chatKey));
    const idx = data.messages.findIndex((m) => String(m.id) === String(id));
    const next = [...data.messages];
    if (idx !== -1) next[idx] = { ...message, id };
    else next.push({ ...message, id });
    const capped = next.slice(-MAX_MESSAGES_PER_CHAT);
    const latestTimestamp =
      !data.latestTimestamp || message.timestamp > data.latestTimestamp ? message.timestamp : data.latestTimestamp;
    await writeJSON(messagesKey(chatKey), { ...data, messages: capped, latestTimestamp });
  },

  async removeMessage(chatKey, id) {
    if (!id) return;
    const data = await readJSON(messagesKey(chatKey), null);
    if (!data) return;
    await writeJSON(messagesKey(chatKey), { ...data, messages: data.messages.filter((m) => String(m.id) !== String(id)) });
  },

  async deleteMessages(chatKey) {
    await removeKey(messagesKey(chatKey));
  },
};
