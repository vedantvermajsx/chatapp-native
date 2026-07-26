import { readJSON, writeJSON, unreadCountsKey } from './core';

export const dbUnreadCounts = {
  async saveUnreadCounts(counts = {}) {
    const toSave = {};
    Object.entries(counts).forEach(([chatKey, count]) => {
      if (count > 0) toSave[chatKey] = count;
    });
    await writeJSON(unreadCountsKey(), toSave);
  },

  async loadUnreadCounts() {
    return readJSON(unreadCountsKey(), {});
  },
};
