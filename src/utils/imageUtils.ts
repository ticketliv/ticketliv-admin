import { CONFIG } from '../config/constants';

/**
 * Resolves a media URL from the backend to a full, valid URL for img/video tags.
 * Handles both relative and absolute paths, and ensures the /uploads prefix is correctly managed.
 */
export const getMediaUrl = (path: string | null | undefined): string => {
  const PLACEHOLDER = 'https://placehold.co/1200x600/181824/white?text=No+Media';
  if (!path) return PLACEHOLDER;

  // 1. If it's already an absolute URL (http/https), a blob, or data URL, return as is
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;

  // 2. Identify the base asset domain
  // We want the base domain without trailing slashes or /uploads (e.g., https://api.ticketliv.com)
  const baseAssetServer = CONFIG.ASSET_URL.replace(/\/uploads\/?$/, '').replace(/\/$/, '');

  // 3. Extract the clean relative path starting from /uploads
  // This handles:
  // - Full URLs: "https://some-ip.com/uploads/images/foo.jpg" -> "/uploads/images/foo.jpg"
  // - Portional paths: "/api/uploads/images/foo.jpg" -> "/uploads/images/foo.jpg"
  // - Clean paths: "/uploads/images/foo.jpg" -> "/uploads/images/foo.jpg"
  let relativePath = path;

  // If path contains /uploads, strip everything before it
  if (path.includes('/uploads')) {
    const uploadsIndex = path.indexOf('/uploads');
    relativePath = path.substring(uploadsIndex);
  } else {
    // If it doesn't contain /uploads, ensure it starts with / and we'll append /uploads
    if (!relativePath.startsWith('/')) relativePath = '/' + relativePath;
    // Special case: if it already starts with images/ or videos/, we need to prepend /uploads
    if (relativePath.startsWith('/images') || relativePath.startsWith('/videos')) {
      relativePath = '/uploads' + relativePath;
    }
  }

  // 4. Sanitize backslashes (common in DB records from Windows servers) and double slashes
  const cleanPath = relativePath.replace(/\\/g, '/').replace(/\/+/g, '/');

  // 5. Build the final absolute URL
  const finalUrl = `${baseAssetServer}${cleanPath}`;

  // Log only in non-prod
  if (import.meta.env.DEV) {
    if (path !== finalUrl) {
      console.debug(`[MediaResolve] ${path} -> ${finalUrl}`);
    }
  }

  return finalUrl;
};

/**
 * Checks if a path or filename corresponds to a video format
 */
export const isMediaVideo = (path: string | null | undefined): boolean => {
  if (!path) return false;
  const cleanPath = path.toLowerCase().split('?')[0];
  
  // Check common video extensions
  if (cleanPath.match(/\.(mp4|webm|mov|ogg|quicktime|m4v|avi)$/)) return true;
  
  // Check for YouTube/Vimeo signatures
  if (path.includes('youtube.com') || path.includes('youtu.be') || path.includes('vimeo.com')) return true;
  
  return false;
};

/**
 * Returns a high-quality placeholder for different ad types
 */
export const getAdPlaceholder = (type: 'image' | 'video') => {
  if (type === 'video') {
    return 'https://placehold.co/1200x600/181824/white?text=Video+Preview';
  }
  return 'https://placehold.co/1200x600/181824/white?text=Ad+Banner+Preview';
};
