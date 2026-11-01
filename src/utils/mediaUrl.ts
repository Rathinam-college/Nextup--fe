/**
 * Normalizes task attachment and media image URLs for NextUp web frontend.
 * Ensures images resolve correctly through the reverse-proxied /nextup/api/media/ endpoint,
 * preventing 404s or index.html fallback from SPA routing.
 */
export function getCleanMediaUrl(rawUrl?: string | null): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // Data URIs and blob URLs are already local and complete
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Already a complete correct API media URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (trimmed.includes('/nextup/api/media/')) {
      return trimmed.replace('http://', 'https://');
    }
  }

  // Extract relative file path after /media/
  let subPath = trimmed;
  if (subPath.includes('/media/')) {
    subPath = subPath.substring(subPath.indexOf('/media/') + '/media/'.length);
  } else if (subPath.startsWith('/')) {
    subPath = subPath.substring(1);
  }

  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const isNextup = window.location.pathname.startsWith('/nextup');
    const prefix = isNextup ? '/nextup/api/media/' : '/api/media/';
    return `${origin}${prefix}${subPath}`;
  }

  return `https://www.rguedu.in/nextup/api/media/${subPath}`;
}
