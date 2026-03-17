import { API_BASE } from '../config';

type ApiFetchInit = Omit<RequestInit, 'headers'> & {
  headers?: HeadersInit;
};

function shouldSkipNgrokWarning(base: string) {
  try {
    const url = new URL(base);
    return url.hostname.endsWith('ngrok-free.dev');
  } catch {
    return false;
  }
}

/**
 * fetch() wrapper that:
 * - prefixes relative paths with API_BASE
 * - adds ngrok bypass header when using ngrok-free.dev (ERR_NGROK_6024)
 */
export async function apiFetch(path: string, init: ApiFetchInit = {}) {
  const isAbsolute = /^https?:\/\//i.test(path);
  const url = isAbsolute ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  };

  if (!headers['Content-Type'] && init.body && !(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // ngrok's free tier shows an interstitial warning page to browsers unless this header is present.
  if (shouldSkipNgrokWarning(API_BASE)) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  return fetch(url, { ...init, headers });
}

