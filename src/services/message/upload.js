import axios from 'axios';
import { getMediaMeta, _addQualities } from '../../utils/media.utils';

export const MAX_FILE_SIZE = 8 * 1024 * 1024;

export function assertFileSizeOk(asset) {
  if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
    throw new Error('File size exceeds the 8MB limit');
  }
}

export async function fetchUploadSignature(api, basePath, folder) {
  const res = await api.get(`${basePath}/upload-signature`, { params: { folder } });
  return res.data; // { signature, timestamp, api_key, cloud_name, folder }
}

export function buildUploadFormData({ asset, mimeType, signature, timestamp, api_key, folder }) {
  const ext = mimeType.split('/')[1] || 'jpg';
  const formData = new FormData();
  formData.append('file', {
    uri: asset.uri,
    name: asset.fileName || `upload.${ext}`,
    type: mimeType,
  });
  formData.append('api_key', api_key);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('folder', folder);
  return formData;
}

export async function uploadToCloudinary({ cloudName, resourceType, formData, onProgress }) {
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
  const res = await axios.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: ({ loaded, total }) => {
      if (!total) return;
      onProgress?.(Math.min(100, Math.round((loaded * 100) / total)));
    },
  });
  return res.data.secure_url;
}

/**
 * Runs the full "upload a local asset to Cloudinary" flow: fetch a signed
 * upload signature from our backend, build the multipart form, upload, and
 * shape the result into the media object the rest of the app expects.
 */
export async function uploadAsset(api, basePath, asset, folder, onProgress) {
  assertFileSizeOk(asset);

  const { signature, timestamp, api_key, cloud_name, folder: targetFolder } =
    await fetchUploadSignature(api, basePath, folder);

  const mimeType = asset.mimeType || 'image/jpeg';
  const { mediaType, resourceType } = getMediaMeta(mimeType);

  const formData = buildUploadFormData({
    asset, mimeType, signature, timestamp, api_key, folder: targetFolder,
  });

  const secureUrl = await uploadToCloudinary({
    cloudName: cloud_name, resourceType, formData, onProgress,
  });

  return _addQualities({ url: secureUrl, type: mediaType, duration: asset.duration });
}
