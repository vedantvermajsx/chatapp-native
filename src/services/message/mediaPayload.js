/**
 * Shapes a local media object (which may carry extra client-only fields such
 * as `isPending` or blob metadata) into the minimal shape the backend
 * expects. Returns `null` when there's no media, which the `toJson` cleanup
 * in the axios request interceptor (see services/api.js) will omit from the
 * outgoing payload entirely.
 */
export function toMediaPayload(media) {
  if (!media) return null;
  return { url: media.url, type: media.type, duration: media.duration };
}
