/**
 * chatBackground.js
 *
 * Lets a (registered) user pick a personal background image for the chat
 * screen. The image is copied into permanent on-device storage and never
 * uploaded anywhere, so it's visible only to that user on that device — it
 * has no effect on what anyone else sees in the conversation.
 *
 * API:
 *   getChatBackgroundUri()      -> local file:// URI if one is set, else null
 *   setChatBackground(pickedUri) -> copies the picked image into place, returns its file:// URI
 *   clearChatBackground()        -> removes the saved background
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
  ensureDir();
  clearChatBackground();
  const dest = new File(BG_DIR, `${BG_BASENAME}.${extensionFromUri(pickedUri)}`);
  new File(pickedUri).copy(dest);
  return dest.uri;
}

export function clearChatBackground() {
  try {
    if (BG_DIR.exists) BG_DIR.delete();
  } catch {
    // nothing to clear
  }
}
