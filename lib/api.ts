import { mockRequest } from "./mock";
import type { Paginated, TokenPair, User } from "./types";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, "") ?? "";
/** No backend configured → serve the built-in sample dataset. */
export const USE_MOCK = API_BASE === "";

const ACCESS_KEY = "etqan.access";
const REFRESH_KEY = "etqan.refresh";

class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function readToken(key: string) {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeToken(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (value) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  } catch {
    /* private mode — tokens stay in memory for this session only */
  }
}

export const tokens = {
  get access() {
    return readToken(ACCESS_KEY);
  },
  get refresh() {
    return readToken(REFRESH_KEY);
  },
  set(pair: { access?: string | null; refresh?: string | null }) {
    if (pair.access !== undefined) writeToken(ACCESS_KEY, pair.access);
    if (pair.refresh !== undefined) writeToken(REFRESH_KEY, pair.refresh);
  },
  clear() {
    writeToken(ACCESS_KEY, null);
    writeToken(REFRESH_KEY, null);
  },
};

/** Flatten a DRF error body into one readable line. */
export function formatError(data: any): string {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (data.detail) return String(data.detail);
  return Object.entries(data)
    .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
    .join(" · ");
}

export function qs(params?: Record<string, string | number | boolean | undefined | null>) {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") search.append(k, String(v));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

interface RequestOptions {
  method?: string;
  body?: any;
}

async function refreshAccessToken(): Promise<boolean> {
  const refresh = tokens.refresh;
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    // rotation is enabled server-side, so store the new refresh too
    tokens.set({ access: data.access, refresh: data.refresh ?? refresh });
    return true;
  } catch {
    return false;
  }
}

export async function request<T = any>(
  path: string,
  opts: RequestOptions = {},
  allowRetry = true,
): Promise<T> {
  if (USE_MOCK) return mockRequest(path, { method: opts.method || "GET", body: opts.body }) as Promise<T>;

  const headers: Record<string, string> = {};
  const access = tokens.access;
  if (access) headers.Authorization = `Bearer ${access}`;

  let body = opts.body;
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, { method: opts.method || "GET", headers, body });

  if (res.status === 401 && allowRetry && tokens.refresh) {
    if (await refreshAccessToken()) return request<T>(path, opts, false);
  }
  if (res.status === 204 || res.status === 205) return null as T;

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { detail: text };
  }
  if (!res.ok) throw new ApiError(formatError(data) || `HTTP ${res.status}`, res.status, data);
  return data as T;
}

export const api = {
  list: <T>(path: string, params?: Parameters<typeof qs>[0]) => request<Paginated<T>>(path + qs(params)),
  get: <T>(path: string, params?: Parameters<typeof qs>[0]) => request<T>(path + qs(params)),
  post: <T>(path: string, body?: any) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: any) => request<T>(path, { method: "PATCH", body }),
  remove: (path: string) => request<null>(path, { method: "DELETE" }),
};

/* ---------------- auth ---------------- */

export async function login(loginId: string, password: string): Promise<TokenPair> {
  const data = await request<TokenPair>("/api/auth/login/", {
    method: "POST",
    body: { login: loginId, password },
  });
  tokens.set({ access: data.access, refresh: data.refresh });
  return data;
}

export async function logout() {
  try {
    const refresh = tokens.refresh;
    if (refresh && !USE_MOCK) await request("/api/auth/logout/", { method: "POST", body: { refresh } });
  } catch {
    /* a dead refresh token is not worth blocking sign-out */
  }
  tokens.clear();
}

export const me = () => request<User>("/api/auth/me/");
