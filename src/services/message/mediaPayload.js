export function toMediaPayload(media) {
  if (!media) return null;
  return { url: media.url, type: media.type, duration: media.duration };
}
