import { CONFIG } from '../config/constants';

/**
 * Resolves a media URL from the backend to a full, valid URL for img/video tags.
 * Handles both relative and absolute paths, and ensures the /uploads prefix is correctly managed.
 */
export const getMediaUrl = (path: string | null | undefined): string => {
  if (!path) return 'https://placehold.co/1200x600/181824/white?text=No+Media';

  // If it's already a full URL, blob, or data URL, return it
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }

  // Ensure path starts with a slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Get base URL (protocol + domain)
  // Example: if ASSET_URL is "https://api.ticketliv.com/uploads", baseUrl becomes "https://api.ticketliv.com"
  const baseUrl = CONFIG.ASSET_URL.replace(/\/uploads\/?$/, '');
  
  // If the path already has /uploads, append it to baseUrl
  if (cleanPath.startsWith('/uploads')) {
    return `${baseUrl}${cleanPath}`;
  }

  // Otherwise, ensure ASSET_URL doesn't have a double slash when joining
  const baseAssetUrl = CONFIG.ASSET_URL.replace(/\/$/, '');
  return `${baseAssetUrl}${cleanPath}`;
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
