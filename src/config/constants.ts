/**
 * Application-wide configuration and environment variables
 */

const getApiUrl = () => {
  // Hard-coded production URL for the production build
  // This prevents any localhost leakage if build-args fail
  if (import.meta.env.MODE === 'production' || import.meta.env.PROD) {
    return 'https://api.ticketliv.com/api';
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
};

export const CONFIG = {
  API_URL: getApiUrl(),
  ASSET_URL: (import.meta.env.MODE === 'production' || import.meta.env.PROD || getApiUrl().includes('ticketliv.com')) 
    ? 'https://api.ticketliv.com/uploads' 
    : 'http://localhost:5000/uploads',
  ENV: import.meta.env.MODE || 'development',
  IS_PROD: import.meta.env.PROD,
  APP_NAME: 'TicketLiv Admin',
  VERSION: '2.5.0',
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'adminToken',
  USER_DATA: 'adminUser',
  SETTINGS: 'adminSettings',
  EVENT_DRAFT: 'ticketliv_event_draft',
};
