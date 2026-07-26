// Cloudinary can re-serve any uploaded asset in a different format just by
// swapping the file extension in the URL. The web app stores/serves avatars
// and media as `.avif`, which React Native's <Image> can't decode on most
// devices/OS versions (no native AVIF support), so images silently fail to
// render. This coerces any Cloudinary URL to a broadly-supported format
// before handing it to <Image>.
export function toDisplayUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('cloudinary.com')) return url;
  return url.replace(/\.(avif|webp)(\?.*)?$/i, '.jpg$2');
}
