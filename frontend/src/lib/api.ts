import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// Injecte le token JWT automatiquement
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('irve_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const isAuthRoute = err.config?.url?.includes('/auth/login') ||
                        err.config?.url?.includes('/auth/verify-email') ||
                        err.config?.url?.includes('/auth/resend-verification') ||
                        err.config?.url?.includes('/auth/forgot-password') ||
                        err.config?.url?.includes('/auth/reset-password');
    if (err.response?.status === 401 && !isAuthRoute && typeof window !== 'undefined') {
      localStorage.removeItem('irve_token');
      localStorage.removeItem('irve_user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(err);
  },
);

// ─── Auth ────────────────────────────────
export const authApi = {
  register:           (data: any)                        => api.post('/auth/register', data),
  login:              (data: any)                        => api.post('/auth/login', data),
  me:                 ()                                 => api.get('/auth/me'),
  verifyEmail:        (token: string)                    => api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`),
  resendVerification: (email: string)                    => api.post('/auth/resend-verification', { email }),
  forgotPassword:     (email: string)                    => api.post('/auth/forgot-password', { email }),
  resetPassword:      (token: string, password: string)  => api.post('/auth/reset-password', { token, password }),
};
// ─── Demandes ────────────────────────────
export const requestsApi = {
  create: (data: any)  => api.post('/requests', data),
  list:   ()           => api.get('/requests'),
  get:    (id: string) => api.get(`/requests/${id}`),
  remove: (id: string) => api.delete(`/requests/${id}`), // ← ajout
};

// ─── Installateurs ───────────────────────
export const installersApi = {
  search:        (params: any) => api.get('/installers/search', { params }),
  get:           (id: string)  => api.get(`/installers/${id}`),
  createProfile: (data: any)   => api.post('/installers/profile', data),
  myProfile:     ()            => api.get('/installers/me/profile'),
  updateProfile: (data: any)   => api.patch('/installers/profile', data),
};

// ─── Devis ───────────────────────────────
export const quotesApi = {
  create:       (data: any)   => api.post('/quotes', data),
  forClient:    ()            => api.get('/quotes/client'),
  forInstaller: ()            => api.get('/quotes/installer'),
  getOne:       (id: string)  => api.get(`/quotes/${id}`),
  accept:       (id: string)  => api.patch(`/quotes/${id}/accept`),
  refuse:       (id: string)  => api.patch(`/quotes/${id}/refuse`),
  complete:     (id: string)  => api.patch(`/quotes/${id}/complete`),
};

// ─── Matching / Leads ────────────────────
export const matchingApi = {
  match: (requestId: string) => api.post(`/matching/request/${requestId}`),
  leads: ()                  => api.get('/matching/leads'),
  lead:  (id: string)        => api.get(`/matching/leads/${id}`),
};

// ─── Admin ───────────────────────────────
export const adminApi = {
  stats:               ()           => api.get('/admin/stats'),
  users:               (page = 1)   => api.get('/admin/users',      { params: { page } }),
  installers:          (page = 1)   => api.get('/admin/installers', { params: { page } }),
  requests:            (page = 1)   => api.get('/admin/requests',   { params: { page } }),
  verifyInstaller:     (id: string) => api.patch(`/admin/installers/${id}/verify`),
  deactivateInstaller: (id: string) => api.patch(`/admin/installers/${id}/deactivate`),
};