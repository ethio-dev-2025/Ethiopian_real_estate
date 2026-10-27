const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '');

if (import.meta.env.PROD && !configuredApiUrl) {
  throw new Error('VITE_API_URL must be configured with the deployed backend URL.');
}

const apiOrigin = configuredApiUrl
  ? configuredApiUrl.replace(/\/api$/i, '')
  : import.meta.env.DEV
    ? 'http://localhost:8000'
    : '';

export const API_ORIGIN = apiOrigin;
export const API_BASE_URL = `${apiOrigin}/api`;
export const WS_ORIGIN = import.meta.env.VITE_WS_URL?.trim().replace(/\/+$/, '')
  || apiOrigin.replace(/^http/i, 'ws');
export const WS_BASE_URL = `${WS_ORIGIN}/ws`;
