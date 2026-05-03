import axios from 'axios';

/**
 * Shared Axios instance used by all API modules.
 *
 * In development, Vite proxies requests to localhost:3000 so the baseURL
 * is just an empty string (relative URLs work fine).
 * In production, VITE_API_URL points to the deployed Render backend.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60_000,
});

// ── Request interceptor: attach JWT automatically ─────────────────────────────
// Every outgoing request will include the token from localStorage if present.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('crypto_jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle global errors ────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the server returns 401, the token is invalid — clear it and reload.
    if (error.response?.status === 401) {
      localStorage.removeItem('crypto_jwt');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default apiClient;
