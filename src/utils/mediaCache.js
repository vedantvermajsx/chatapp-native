/**
 * mediaCache.js
 *
 * Generalized on-device cache for remote media (video / image / sticker / gif).
 * Downloads once into expo-file-system's cache directory, keyed directly by
 * the (sanitized) source URL, so subsequent plays/views/renders load from
 * disk with zero network. Downloads are staged in a temp file and only
 * moved into place on success, so an interrupted download (e.g. network
 * drops mid-download) can never leave a corrupt file at the cache path.
 *
 * API:
 *   getCachedUri(remoteUrl, kind)  -> local file:// URI if already cached, else null
 *   cacheMedia(remoteUrl, kind)    -> downloads (or reuses) and returns local file:// URI
 *   warmCache(remoteUrl, kind)     -> fire-and-forget background download
 *   clearCache(kind?)              -> wipe one kind's cache dir, or everything
 *   getCacheSize(kind?)            -> bytes used by one kind, or everything
 *
 * kind: 'videos' | 'images' | 'stickers'  (any string works, each gets its own folder)
 */

import { File, Directory, Paths } from 'expo-file-system';

const ROOT = new Directory(Paths.cache, 'media');

function cacheFilename(url) {
  const clean = url.split('?')[0];
  const ext = clean.split('.').pop()?.slice(0, 5) || 'bin';
  const safeName = encodeURIComponent(clean).slice(0, 180);
  return `${safeName}.${ext}`;
}

export function dirFor(kind) {
  return new Directory(ROOT, kind);
}

function ensureDir(dir) {
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
}

function isValidCacheFile(file) {
  if (!file.exists) return false;
  if ((file.size ?? 0) <= 0) {
    try { file.delete(); } catch { }
    return false;
  }
  return true;
}

export async function getCachedUri(remoteUrl, kind) {
  if (!remoteUrl || !kind) return null;
  try {
    const file = new File(dirFor(kind), cacheFilename(remoteUrl));
    return isValidCacheFile(file) ? file.uri : null;
  } catch {
    return null;
  }
}

const inFlight = new Map();

export async function cacheMedia(remoteUrl, kind) {
  if (!remoteUrl || !kind) return remoteUrl;
  const key = kind + '|' + remoteUrl;

  if (inFlight.has(key)) return inFlight.get(key);

  const task = (async () => {
    const dir = dirFor(kind);
    const filename = cacheFilename(remoteUrl);
    const destFile = new File(dir, filename);
    const tempFile = new File(dir, `.tmp-${Date.now()}-${filename}`);

    try {
      if (isValidCacheFile(destFile)) return destFile.uri;

      ensureDir(dir);

      const downloaded = await File.downloadFileAsync(remoteUrl, tempFile);

      if (!downloaded.exists || (downloaded.size ?? 0) <= 0) {
        try { downloaded.delete(); } catch { /* ignore */ }
        return remoteUrl;
      }

      if (destFile.exists) {
        try { destFile.delete(); } catch { /* ignore */ }
      }
      downloaded.move(destFile);

      return isValidCacheFile(destFile) ? destFile.uri : remoteUrl;
    } catch {
      try { if (tempFile.exists) tempFile.delete(); } catch { /* ignore */ }
      return remoteUrl;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, task);
  return task;
}

export function warmCache(remoteUrl, kind) {
  if (!remoteUrl || !kind) return;
  cacheMedia(remoteUrl, kind).catch(() => {});
}

export async function clearCache(kind) {
  const dir = kind ? dirFor(kind) : ROOT;
  try {
    if (dir.exists) dir.delete();
  } catch {
    // ignore
  }
}

export async function getCacheSize(kind) {
  const dir = kind ? dirFor(kind) : ROOT;
  try {
    if (!dir.exists) return 0;
    return sumDirSize(dir);
  } catch {
    return 0;
  }
}

export async function getCacheStats(kind) {
  const dir = dirFor(kind);
  try {
    if (!dir.exists) return { size: 0, count: 0 };
    let size = 0;
    let count = 0;
    for (const entry of dir.list()) {
      if (entry instanceof File) {
        if (entry.name.startsWith('.tmp-')) continue; 
        size += entry.size ?? 0;
        count += 1;
      }
    }
    return { size, count };
  } catch {
    return { size: 0, count: 0 };
  }
}

function sumDirSize(dir) {
  let total = 0;
  for (const entry of dir.list()) {
    if (entry instanceof Directory) {
      total += sumDirSize(entry);
    } else {
      total += entry.size ?? 0;
    }
  }
  return total;
}
