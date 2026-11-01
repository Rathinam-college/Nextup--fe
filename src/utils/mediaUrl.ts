/**
 * Normalizes task attachment and media image URLs for NextUp web frontend.
 * Ensures images resolve correctly whether hosted under /nextup subpath,
 * custom domains (rguedu.in), or local development proxies.
 */
export function getCleanMediaUrl(rawUrl?: string | null): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // Data URIs and blob URLs are already local and complete
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // If already an absolute HTTP/HTTPS URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      if (typeof window !== 'undefined') {
        const currentOrigin = window.location.origin;
        const isNextup = window.location.pathname.startsWith('/nextup');

        let path = url.pathname;
        // Inject /nextup prefix if running under /nextup subpath and not already present
        if (isNextup && !path.startsWith('/nextup/')) {
          path = `/nextup${path.startsWith('/') ? path : '/' + path}`;
        }
        return `${currentOrigin}${path}${url.search}`;
      }
      return trimmed;
    } catch {
      return trimmed;
    }
  }

  // If it's a relative path like /media/task_attachments/...
  if (typeof window !== 'undefined') {
    const isNextup = window.location.pathname.startsWith('/nextup');
    let path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    if (isNextup && !path.startsWith('/nextup/')) {
      path = `/nextup${path}`;
    }
    return `${window.location.origin}${path}`;
  }

  return trimmed;
}
