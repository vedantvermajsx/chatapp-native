import { readJSON, writeJSON, removeKey, DB_PREFIX, STORES } from './core.js';

const keysKey = () => `${DB_PREFIX}${STORES.keys}`;

async function getAllKeys() {
  const all = await readJSON(keysKey(), {});
  return all || {};
}

async function writeAllKeys(obj) {
  await writeJSON(keysKey(), obj);
}

export const dbKeys = {
  async savePrivateKey(id, privateKeyPem) {
    const all = await getAllKeys();
    all[id] = { id, privateKeyPem };
    await writeAllKeys(all);
  },

  async getPrivateKey(id) {
    try {
      const all = await getAllKeys();
      const record = all[id];
      return record?.privateKeyPem ?? null;
    } catch {
      return null;
    }
  },

  async deletePrivateKey(id) {
    const all = await getAllKeys();
    if (id in all) {
      delete all[id];
      await writeAllKeys(all);
    }
  },

  async clearAllKeys() {
    await removeKey(keysKey());
  },
};
