import { useEffect, useState } from 'react';
import { getCachedUri, cacheMedia } from '../utils/mediaCache';

/**
 * Renders remoteUrl immediately (so UI never blocks), then silently
 * swaps to the on-disk cached copy once available — downloading it
 * first if this is the first time we've seen it.
 *
 * kind: 'images' | 'stickers' (own folder per kind)
 */
export function useCachedMediaUri(remoteUrl, kind) {
  const [uri, setUri] = useState(remoteUrl);

  useEffect(() => {
    let cancelled = false;
    setUri(remoteUrl);
    if (!remoteUrl) return;

    (async () => {
      const cached = await getCachedUri(remoteUrl, kind);
      if (cached) {
        if (!cancelled) setUri(cached);
        return;
      }
      const local = await cacheMedia(remoteUrl, kind);
      if (!cancelled && local && local !== remoteUrl) setUri(local);
    })();

    return () => { cancelled = true; };
  }, [remoteUrl, kind]);

  return uri;
}
