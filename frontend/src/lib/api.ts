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
    const isAuthRoute =
      err.config?.url?.includes('/auth/login')               ||
      err.config?.url?.includes('/auth/verify-email')        ||
      err.config?.url?.includes('/auth/resend-verification') ||
      err.config?.url?.includes('/auth/forgot-password')     ||
      err.config?.url?.includes('/auth/reset-password');

    if (err.response?.status === 401 && !isAuthRoute && typeof window !== 'undefined') {
      localStorage.removeItem('irve_token');
      localStorage.removeItem('irve_user');
      window.location.href = '/auth/login';
    }

    if (err.response?.status === 403 && !isAuthRoute && typeof window !== 'undefined') {
      const currentUrl = window.location.pathname + window.location.search;
      window.location.href = `/auth/login?redirect=${encodeURIComponent(currentUrl)}`;
    }
    return Promise.reject(err);
  },
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register:           (data: any)                       => api.post('/auth/register', data),
  login:              (data: any)                       => api.post('/auth/login', data),
  me:                 ()                                => api.get('/auth/me'),
  verifyEmail:        (token: string)                   => api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`),
  resendVerification: (email: string)                   => api.post('/auth/resend-verification', { email }),
  forgotPassword:     (email: string)                   => api.post('/auth/forgot-password', { email }),
  resetPassword:      (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
};

// ─── UUID guard helper ────────────────────────────────────────────────────────
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Retourne une Promise rejetée au lieu de throw synchrone
function safeUuid(id: string | undefined, label: string): Promise<never> | null {
  if (!id || !UUID_RE.test(id)) {
    return Promise.reject(new Error(`${label}: invalid id "${id}"`));
  }
  return null;
}

// ─── Demandes ─────────────────────────────────────────────────────────────────
export const requestsApi = {
  create:              (data: any)  => api.post('/requests', data),
  list:                ()           => api.get('/requests'),
  get:                 (id: string) => api.get(`/requests/${id}`),
  remove:              (id: string) => api.delete(`/requests/${id}`),
  getInstallerPending: ()           => api.get('/requests/installer/pending'),
  respond: (
    id:       string,
    action:   'ACCEPT' | 'DECLINE',
    message?: string,
  ) => safeUuid(id, 'requestsApi.respond') ?? api.patch(`/requests/${id}/respond`, { action, message }),
  getOne: (id: string) => {
    if (!id || !UUID_RE.test(id)) {
      return Promise.reject(new Error(`requestsApi.getOne: invalid id "${id}"`));
    }
    return api.get(`/requests/${id}`);
  },
  updateStatus: (id: string, status: string) =>
    api.patch(`/requests/${id}/status`, { status }),
};

// ─── Installateurs ────────────────────────────────────────────────────────────
export const installersApi = {
  search: (params: {
    address:        string;
    projectType?:   string;
    certification?: string;
    radius?:        string;
  }) => api.get('/installers/search', { params }),
  get:           (id: string) => safeUuid(id, 'installersApi.get') ?? api.get(`/installers/${id}`),
  myProfile:     ()           => api.get('/installers/me/profile'),
  createProfile: (data: any)  => api.post('/installers/profile', data),
  updateProfile: (data: any)  => api.patch('/installers/profile', data),
};

// ─── Devis ────────────────────────────────────────────────────────────────────
export const quotesApi = {
  create:       (data: any)  => api.post('/quotes', data),
  forClient:    ()           => api.get('/quotes/client'),
  forInstaller: ()           => api.get('/quotes/installer'),

  // Route client : GET /quotes/:id
  getOne: (id: string) =>
    safeUuid(id, 'quotesApi.getOne') ?? api.get(`/quotes/${id}`),

  // Route installateur : GET /quotes/installer/:id
  getOneForInstaller: (id: string) =>
    safeUuid(id, 'quotesApi.getOneForInstaller') ?? api.get(`/quotes/installer/${id}`),

  accept: (id: string) =>
    safeUuid(id, 'quotesApi.accept') ?? api.patch(`/quotes/${id}/accept`),

  refuse: (id: string) =>
    safeUuid(id, 'quotesApi.refuse') ?? api.patch(`/quotes/${id}/refuse`),
};

// ─── Matching / Leads ─────────────────────────────────────────────────────────
export const matchingApi = {
  match: (requestId: string) => api.post(`/matching/request/${requestId}`),
  leads: ()                  => api.get('/matching/leads'),
  lead:  (id: string)        => api.get(`/matching/leads/${id}`),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  stats:               ()           => api.get('/admin/stats'),
  users:               (page = 1)   => api.get('/admin/users',      { params: { page } }),
  installers:          (page = 1)   => api.get('/admin/installers', { params: { page } }),
  requests:            (page = 1)   => api.get('/admin/requests',   { params: { page } }),
  verifyInstaller:     (id: string) => api.patch(`/admin/installers/${id}/verify`),
  deactivateInstaller: (id: string) => api.patch(`/admin/installers/${id}/deactivate`),
  activateInstaller: (id: string) => api.patch(`/admin/installers/${id}/activate`),
};

export const reviewsApi = {
  create: (data: {
    requestId:   string;
    installerId: string;
    rating:      number;
    comment?:    string;
  }) => api.post('/reviews', data),

  forInstaller: (installerId: string) =>
    api.get(`/reviews/installer/${installerId}`),
};
