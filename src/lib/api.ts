import { useAuthStore } from "../stores/authStore";

const API_HOST = import.meta.env.VITE_API_URL || "";
const API_BASE = API_HOST ? `${API_HOST}/api/v1` : "/api/v1";

// Prevent multiple 401 redirects from parallel requests
let redirecting = false;

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "request failed";
    throw new Error(`Network error calling ${path}: ${detail}`);
  }

  if (res.status === 401) {
    // Single-flight: first 401 clears token and navigates; concurrent calls
    // still throw so react-query can set error state without racing navigation.
    if (!redirecting) {
      redirecting = true;
      useAuthStore.getState().clearToken();
      // Preserve current path so the sign-in page can send the user back.
      const next = window.location.pathname + window.location.search;
      const target = next && next !== "/sign-in" ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in";
      window.location.href = target;
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err: any = await res.json().catch(() => ({ detail: res.statusText }));
    // POAW error shape is { error: { code, message, details } }; tolerate both.
    const msg =
      err?.error?.message ||
      err?.detail ||
      err?.message ||
      res.statusText ||
      `${res.status}`;
    throw new Error(msg);
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
