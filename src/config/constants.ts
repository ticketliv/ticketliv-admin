/**
 * Application-wide configuration and environment variables
 */

export const CONFIG = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  ASSET_URL: import.meta.env.VITE_ASSET_URL || 'http://localhost:5000/uploads',
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
