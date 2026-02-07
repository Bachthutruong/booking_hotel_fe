import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add auth token; với FormData thì bỏ Content-Type để axios tự set multipart/form-data + boundary
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
