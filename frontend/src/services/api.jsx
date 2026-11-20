import axios from 'axios';

const isDev = import.meta.env.DEV;
const baseURL = isDev
  ? '/api'
  : `${window.location.protocol}//${window.location.hostname}:8080/api`;

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---- Silent refresh logic ----
let isRefreshing = false;
let pendingQueue = [];

const onRefreshed = (newToken) => {
  pendingQueue.forEach(({ resolve, original }) => {
    original.headers = original.headers || {};
    original.headers.Authorization = `Bearer ${newToken}`;
    resolve(api(original));
  });
  pendingQueue = [];
};

const onRefreshFailed = (error) => {
  pendingQueue.forEach(({ reject }) => reject(error));
  pendingQueue = [];
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  // Redirect to login preserving role
  const path = window.location.pathname;
  if (!path.includes('/login')) {
    window.location.href = '/ntc-system/staff/login';
  }
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    // Skip refresh for auth endpoints themselves
    const isAuthEndpoint = original.url?.includes('/auth/login') ||
                           original.url?.includes('/auth/refresh') ||
                           original.url?.includes('/auth/logout');

    if (status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        onRefreshFailed(error);
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject, original });
        });
      }

      isRefreshing = true;
      try {
        const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
        const { token, refreshToken: newRefresh } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', newRefresh);
        onRefreshed(token);
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (refreshErr) {
        onRefreshFailed(refreshErr);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;