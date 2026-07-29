import { getCachedUri as getCached, cacheMedia, warmCache as warm } from './mediaCache';

export const getCachedUri = (remoteUrl) => getCached(remoteUrl, 'videos');
export const cacheVideo = (remoteUrl) => cacheMedia(remoteUrl, 'videos');
export const warmCache = (remoteUrl) => warm(remoteUrl, 'videos');
