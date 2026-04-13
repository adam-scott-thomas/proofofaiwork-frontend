import { useAuthStore } from "../stores/authStore";

const API_HOST = import.meta.env.VITE_API_URL || "";
const API_BASE = API_HOST ? `${API_HOST}/api/v1` : "/api/v1";

// Prevent multiple 401 redirects from parallel requests
let redirecting = false;

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 && !redirecting) {
    redirecting = true;
    useAuthStore.getState().clearToken();
    window.location.href = "/sign-in";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || err.message || `${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

export function apiDelete(path: string): Promise<void> {
  return apiFetch(path, { method: "DELETE" });
}
