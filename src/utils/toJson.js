/**
 * toJson
 * ------
 * Recursively strips `null` and `undefined` values from a value before it is
 * sent to the backend. Many call sites build payloads with optional fields
 * using `value || null`, which means axios (via JSON.stringify) would
 * otherwise serialize those fields as explicit `null`s instead of omitting
 * them. Centralizing the cleanup here means individual services don't need
 * to hand-roll conditional spreads (`...(x && { x })`) to keep payloads clean.
 *
 * - Plain objects: keys whose value is null/undefined are dropped; nested
 *   objects/arrays are cleaned recursively.
 * - Arrays: null/undefined entries are dropped; remaining entries are
 *   cleaned recursively (array shape/order of remaining items is preserved).
 * - Dates, FormData, Blobs/Files and other non-plain objects are returned
 *   untouched, since they aren't safe (or meaningful) to walk as plain data.
 * - Primitives are returned as-is.
 */

function isFormDataLike(value) {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

function isBlobLike(value) {
  return typeof Blob !== 'undefined' && value instanceof Blob;
}

function isPlainObject(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !isFormDataLike(value) &&
    !isBlobLike(value)
  );
}

export function toJson(input) {
  if (input === null || input === undefined) return input;

  if (Array.isArray(input)) {
    return input
      .filter((item) => item !== null && item !== undefined)
      .map((item) => toJson(item));
  }

  if (isPlainObject(input)) {
    return Object.entries(input).reduce((cleaned, [key, value]) => {
      if (value === null || value === undefined) return cleaned;
      cleaned[key] = toJson(value);
      return cleaned;
    }, {});
  }

  return input;
}

export default toJson;
