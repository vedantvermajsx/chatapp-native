/**
 * chatBackground.js
 *
 * Lets a (registered) user pick a personal background image for the chat
 * screen. The image is copied into permanent on-device storage.
 */

import { File, Directory, Paths } from 'expo-file-system';

const BG_DIR = new Directory(Paths.document, 'chat-background');
const BG_BASENAME = 'background';

function ensureDir() {
  if (!BG_DIR.exists) BG_DIR.create({ intermediates: true });
}

function extensionFromUri(uri) {
  const clean = uri.split('?')[0];
  const ext = clean.split('.').pop();
  return ext && ext.length <= 5 ? ext.toLowerCase() : 'jpg';
}

export function getChatBackgroundUri() {
  try {
    if (!BG_DIR.exists) return null;
    const entry = BG_DIR.list().find((e) => e instanceof File && e.name.startsWith(BG_BASENAME));
    return entry?.exists ? entry.uri : null;
  } catch {
    return null;
  }
}

export function setChatBackground(pickedUri) {
  if (!pickedUri) return null;
  clearChatBackground();
  ensureDir();
  const dest = new File(BG_DIR, `${BG_BASENAME}.${extensionFromUri(pickedUri)}`);
  new File(pickedUri).copy(dest);
  return dest.uri;
}

export function clearChatBackground() {
  try {
    if (BG_DIR.exists) BG_DIR.delete();
  } catch {
  }
}
