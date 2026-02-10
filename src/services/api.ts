import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

function getStoredToken(): string | null {
  const fromStore = useAuthStore.getState().token;
  if (fromStore) return fromStore;
  const fromKey = localStorage.getItem('token');
  if (fromKey) return fromKey;
  try {
    const raw = localStorage.getItem('auth-storage');
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { token?: string } };
      if (parsed?.state?.token) return parsed.state.token;
    }
  } catch (_) {}
  return null;
}

// Request interceptor: add auth token; đọc store -> localStorage 'token' -> raw 'auth-storage'
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: 401 → clear token; không redirect khi đang trên trang thanh toán đặt phòng
// (POST /bookings, GET /bookings/:id, PUT /bookings/:id/proof, POST /bookings/:id/pay-wallet, POST /bookings/:id/pay-deposit-wallet)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = (error.config?.url ?? '').split('?')[0];
      const method = (error.config?.method ?? '').toLowerCase();
      const isGuestBooking = url === '/bookings' && method === 'post';
      const isGetBooking = method === 'get' && /^\/bookings\/[^/]+$/.test(url);
      const isPutProof = method === 'put' && /^\/bookings\/[^/]+\/proof$/.test(url);
      const isPayWallet = method === 'post' && /^\/bookings\/[^/]+\/pay-wallet$/.test(url);
      const isPayDepositWallet = method === 'post' && /^\/bookings\/[^/]+\/pay-deposit-wallet$/.test(url);
      const isUpload = method === 'post' && url === '/upload';
      const isUploadProof = method === 'post' && /^\/bookings\/[^/]+\/upload-proof$/.test(url);
      const skipRedirect = isGuestBooking || isGetBooking || isPutProof || isPayWallet || isPayDepositWallet || isUpload || isUploadProof;
      if (!skipRedirect) {
        // Clear both localStorage token AND zustand persisted state (auth-storage)
        // so that after redirect+reload the app doesn't rehydrate with stale token and loop.
        useAuthStore.getState().logout();
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
