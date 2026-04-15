import { CONFIG } from '../config/constants';

/**
 * Resolves a media URL from the backend to a full, valid URL for img/video tags.
 * Handles both relative and absolute paths, and ensures the /uploads prefix is correctly managed.
 */
export const getMediaUrl = (path: string | null | undefined): string => {
  if (!path) return 'https://placehold.co/1200x600/181824/white?text=No+Media';

  // If it's already a full URL, return it
  if (path.startsWith('http')) {
    return path;
  }

  // Ensure path starts with a slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // If path already contains /uploads, we need to be careful with CONFIG.ASSET_URL
  // CONFIG.ASSET_URL is usually https://api.ticketliv.com/uploads
  
  const baseUrl = CONFIG.ASSET_URL.replace(/\/uploads$/, '');
  
  // If the path starts with /uploads, just prepend the base URL
  if (cleanPath.startsWith('/uploads')) {
    return `${baseUrl}${cleanPath}`;
  }

  // Otherwise, prepend the full ASSET_URL
  return `${CONFIG.ASSET_URL}${cleanPath}`;
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
