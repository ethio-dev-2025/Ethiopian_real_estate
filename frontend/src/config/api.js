// Centralized API and WebSocket configuration
const defaultRemoteBackend = 'https://ethiopian-real-estate-api.onrender.com';
const rawApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '');

const apiUrl = rawApiUrl || (import.meta.env.PROD ? `${defaultRemoteBackend}/api` : 'http://localhost:8000/api');
const apiOrigin = apiUrl.replace(/\/api$/i, '');

export const API_ORIGIN = apiOrigin;
export const API_BASE_URL = `${apiOrigin}/api`;

const rawWsUrl = import.meta.env.VITE_WS_URL?.trim().replace(/\/+$/, '');
export const WS_ORIGIN = rawWsUrl || apiOrigin.replace(/^http/i, 'ws');
export const WS_BASE_URL = `${WS_ORIGIN}/ws`;
