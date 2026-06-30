/**
 * api.ts — Pure HTTP client mapped exactly to the backend routes.
 *
 * Auth:    /api/v1/users/*
 * Pins:    /api/v1/pins/*
 * Boards:  /api/v1/boards/* (controller stubs exist, will respond when implemented)
 */

// ─── Log System ───────────────────────────────────────────────────────────────

export interface ApiLog {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  status?: number;
  requestData?: unknown;
  responseData?: unknown;
  error?: string;
  durationMs?: number;
}

type LogListener = (logs: ApiLog[]) => void;
const logListeners = new Set<LogListener>();
let apiLogs: ApiLog[] = [];

export const getApiLogs = (): ApiLog[] => [...apiLogs];
export const clearApiLogs = () => { apiLogs = []; notifyLogListeners(); };
export const subscribeToLogs = (fn: LogListener) => {
  logListeners.add(fn);
  return () => logListeners.delete(fn);
};
const notifyLogListeners = () => logListeners.forEach(fn => fn([...apiLogs]));

// ─── Token Management ─────────────────────────────────────────────────────────

const TOKEN_KEY = 'pinterest_access_token';
let _accessToken: string | null = localStorage.getItem(TOKEN_KEY);

export const getAccessToken = () => _accessToken;
export const setAccessToken = (token: string | null) => {
  _accessToken = token;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

// ─── Core Fetch ───────────────────────────────────────────────────────────────

let _isRefreshing = false;

async function coreFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {};
  if (!(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (_accessToken) {
    headers['Authorization'] = `Bearer ${_accessToken}`;
  }
  return fetch(url, { ...init, credentials: 'include', headers });
}

async function request<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const startTime = Date.now();
  const logEntry = {
    method,
    url,
    requestData: body instanceof FormData ? '[FormData]' : body,
  };

  const init: RequestInit = { method };
  if (body instanceof FormData) init.body = body;
  else if (body !== undefined) init.body = JSON.stringify(body);

  let res = await coreFetch(url, init);

  // Auto-refresh on 401/403
  if ((res.status === 401 || res.status === 403) && !_isRefreshing) {
    _isRefreshing = true;
    try {
      const refreshRes = await fetch('/api/v1/users/refresh', { credentials: 'include' });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setAccessToken(refreshData.accessToken);
        res = await coreFetch(url, init);
      } else {
        setAccessToken(null);
      }
    } finally {
      _isRefreshing = false;
    }
  }

  const text = await res.text();
  let data: unknown;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  const log: ApiLog = {
    id: Math.random().toString(36).slice(2, 9),
    timestamp: new Date().toLocaleTimeString(),
    ...logEntry,
    status: res.status,
    responseData: data,
    durationMs: Date.now() - startTime,
  };
  apiLogs = [log, ...apiLogs].slice(0, 100);
  notifyLogListeners();

  if (!res.ok) {
    const msg = (data as any)?.message || `HTTP ${res.status}`;
    const err = new Error(msg) as Error & { status: number };
    err.status = res.status;
    if (res.status === 401) setAccessToken(null);
    throw err;
  }

  return data as T;
}

const GET  = <T>(url: string)                   => request<T>('GET',    url);
const POST = <T>(url: string, body?: unknown)   => request<T>('POST',   url, body);
const PATCH = <T>(url: string, body?: unknown)  => request<T>('PATCH',  url, body);
const DEL  = <T>(url: string)                   => request<T>('DELETE', url);

// ─── API Surface ──────────────────────────────────────────────────────────────

export const api = {

  // ── Auth & Me (/api/v1/users) ─────────────────────────────────────────────

  auth: {
    /** POST /api/v1/users/signup */
    signup: (body: { name: string; email: string; password: string; avatar?: string }) =>
      POST<{ status: string; accessToken: string; data: User }>('/api/v1/users/signup', body),

    /** POST /api/v1/users/login */
    login: (body: { email: string; password: string }) =>
      POST<{ status: string; accessToken: string; data: User }>('/api/v1/users/login', body),

    /** GET /api/v1/users/refresh — uses httpOnly refreshToken cookie */
    refresh: () =>
      GET<{ status: string; accessToken: string }>('/api/v1/users/refresh'),

    /** GET /api/v1/users/me */
    getMe: () =>
      GET<{ status: string; data: { user: User } }>('/api/v1/users/me'),

    /** PATCH /api/v1/users/updateMe  (multipart: field "name", file "image") */
    updateMe: (formData: FormData) =>
      request<{ status: string; data: { updatedUser: User } }>('PATCH', '/api/v1/users/updateMe', formData),

    /** DELETE /api/v1/users/deleteMe */
    deleteMe: () =>
      DEL<{ status: string }>('/api/v1/users/deleteMe'),

    /** Client-side logout */
    logout: () => { setAccessToken(null); },
  },

  // ── Social (/api/v1/users/:id/…) ─────────────────────────────────────────

  social: {
    /** POST /api/v1/users/:id/follow */
    follow: (userId: string) =>
      POST<{ status: string; message: string }>(`/api/v1/users/${userId}/follow`),

    /** DELETE /api/v1/users/:id/unfollow */
    unfollow: (userId: string) =>
      DEL<{ status: string; message: string }>(`/api/v1/users/${userId}/unfollow`),

    /** GET /api/v1/users/:id/followers */
    getFollowers: (userId: string) =>
      GET<{ status: string; results: number; data: User[] }>(`/api/v1/users/${userId}/followers`),

    /** GET /api/v1/users/:id/following */
    getFollowing: (userId: string) =>
      GET<{ status: string; results: number; data: User[] }>(`/api/v1/users/${userId}/following`),
  },

  // ── Pins (/api/v1/pins) ───────────────────────────────────────────────────

  pins: {
    /** GET /api/v1/pins  (public) */
    getAll: (params?: { page?: number; limit?: number }) => {
      const qs = params
        ? '?' + new URLSearchParams(
            Object.entries(params)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => [k, String(v)])
          )
        : '';
      return GET<{ status: string; data: Pin[] }>(`/api/v1/pins${qs}`);
    },

    /** GET /api/v1/pins/search?query=  (public, text-index) */
    search: (query: string) =>
      GET<{ status: string; data: Pin[] }>(`/api/v1/pins/search?query=${encodeURIComponent(query)}`),

    /** GET /api/v1/pins/:id  (public, populates comments) */
    getById: (id: string) =>
      GET<{ status: string; data: Pin }>(`/api/v1/pins/${id}`),

    /** POST /api/v1/pins  (protected) body: { title, imageURL, description? } */
    create: (body: { title: string; imageURL: string; description?: string }) =>
      POST<{ status: string; data: Pin }>('/api/v1/pins', body),

    /** PATCH /api/v1/pins/:id  (owner only) */
    update: (id: string, body: { description?: string }) =>
      PATCH<{ status: string; data: Pin }>(`/api/v1/pins/${id}`, body),

    /** DELETE /api/v1/pins/:id  (owner only) */
    delete: (id: string) =>
      DEL<{ status: string; data: Pin }>(`/api/v1/pins/${id}`),

    // ── Likes ──

    /** POST /api/v1/pins/:id/like */
    like: (id: string) =>
      POST<{ status: string; data: Pin }>(`/api/v1/pins/${id}/like`),

    /** DELETE /api/v1/pins/:id/like */
    unlike: (id: string) =>
      DEL<{ status: string; data: Pin }>(`/api/v1/pins/${id}/like`),

    /** GET /api/v1/pins/:id/like — paginated list of users who liked */
    getLikes: (id: string) =>
      GET<{ status: string; data: User[] }>(`/api/v1/pins/${id}/like`),

    // ── Saves ──

    /** POST /api/v1/pins/:id/save — adds pin to user.savedPins */
    save: (id: string) =>
      POST<{ status: string; data: User }>(`/api/v1/pins/${id}/save`),

    /** DELETE /api/v1/pins/:id/save */
    unsave: (id: string) =>
      DEL<{ status: string; data: User }>(`/api/v1/pins/${id}/save`),

    /** GET /api/v1/pins/me/save — returns current user's saved pins (populated) */
    getSaved: () =>
      GET<{ status: string; data: Pin[] }>(`/api/v1/pins/me/save`),


    // ── Comments ──

    /** GET /api/v1/pins/:id/comments */
    getComments: (id: string, params?: { page?: number; limit?: number }) => {
      const qs = params
        ? '?' + new URLSearchParams(
            Object.entries(params)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => [k, String(v)])
          )
        : '';
      return GET<{ status: string; data: Comment[] }>(`/api/v1/pins/${id}/comments${qs}`);
    },

    /** POST /api/v1/pins/:id/comments  body: { text } */
    addComment: (id: string, text: string) =>
      POST<{ status: string; data: Comment }>(`/api/v1/pins/${id}/comments`, { text }),
  },

  // ── Boards (/api/v1/boards) ───────────────────────────────────────────────
  // Routes + controller stubs exist. Functions will hang until controller is
  // implemented — callers must handle errors gracefully.

  boards: {
    /** GET /api/v1/boards/my-boards */
    getMyBoards: () =>
      GET<{ status: string; data: Board[] }>('/api/v1/boards/my-boards'),

    /** POST /api/v1/boards  body: { name, description?, secret? } */
    create: (body: { name: string; description?: string; secret?: boolean }) =>
      POST<{ status: string; data: Board }>('/api/v1/boards', body),

    /** GET /api/v1/boards/:id */
    getById: (id: string) =>
      GET<{ status: string; data: Board }>(`/api/v1/boards/${id}`),

    /** PATCH /api/v1/boards/:id */
    update: (id: string, body: { name?: string; secret?: boolean }) =>
      PATCH<{ status: string; data: Board }>(`/api/v1/boards/${id}`, body),

    /** DELETE /api/v1/boards/:id */
    delete: (id: string) =>
      DEL<{ status: string }>(`/api/v1/boards/${id}`),

    /** POST /api/v1/boards/:id/pins/:pinId */
    addPin: (boardId: string, pinId: string) =>
      POST<{ status: string; data: Board }>(`/api/v1/boards/${boardId}/pins/${pinId}`),

    /** DELETE /api/v1/boards/:id/pins/:pinId */
    removePin: (boardId: string, pinId: string) =>
      DEL<{ status: string; data: Board }>(`/api/v1/boards/${boardId}/pins/${pinId}`),
  },
};

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;        // filename, served at /uploads/users/:_id/:filename
  role?: string;
  followers?: string[];
  followings?: string[];
  savedPins?: string[];  // array of pin _ids
  active?: boolean;
  createdAt?: string;
}

export interface Pin {
  _id: string;
  title: string;
  description?: string;
  imageURL: string;
  createdBy: { _id: string; name: string; avatar: string } | string;
  likedBy?: string[];
  comments?: Comment[] | string[];
  createdAt?: string;
}

export interface Comment {
  _id: string;
  text: string;
  madeBy?: { _id: string; name: string; avatar: string } | string;
  createdAt?: string;
  likedBy?: string[];
}

export interface Board {
  _id: string;
  name: string;
  description?: string;
  secret?: boolean;
  createdBy: { _id: string; name: string; avatar: string } | string;
  pins?: (Pin | string)[];
  createdAt?: string;
}
