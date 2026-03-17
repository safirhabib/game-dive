import { API_BASE } from '../config';

export const proxyImageUrl = (url: string): string => {
  // Only proxy images from external domains
  if (url.startsWith('http://localhost') || url.startsWith('https://localhost')) {
    return url;
  }

  // Encode the URL to be used in the proxy route
  const encodedUrl = encodeURIComponent(url);
  return `${API_BASE}/proxy/image/${encodedUrl}`;
};
