/**
 * API base URL for backend. Set VITE_API_URL in .env for production.
 * Defaults to local backend in development.
 */
export const API_BASE =
  (import.meta.env.VITE_API_URL as string)?.replace(/\/$/, '') ||
  'http://localhost:5001/api/v1';

/** Support email shown in trust sections and delivery status. */
export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'support@yourdomain.com';

/** PayPal client ID for frontend SDK (same as backend PAYPAL_CLIENT_ID). */
export const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';
