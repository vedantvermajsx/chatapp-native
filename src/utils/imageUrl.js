





export function toDisplayUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('cloudinary.com')) return url;
  return url.replace(/\.(avif|webp)(\?.*)?$/i, '.jpg$2');
}



export function addAttachmentFlag(url, filename) {
  if (!url || !url.includes('/upload/')) return url;
  const encodedName = encodeURIComponent(filename);
  return url.replace(
    /\/upload\/((?:(?!\/v\d+\/).)*)?(\/v\d+\/)/,
    (_, transformations = '', version) => {
      const prefix = transformations
        ? `fl_attachment:${encodedName},${transformations}`
        : `fl_attachment:${encodedName}`;
      return `/upload/${prefix}${version}`;
    }
  );
}
