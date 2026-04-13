import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      setToken: (token) => set({ token }),
      clearToken: () => {
        // Clear the legacy key too in case it was set by older builds
        try { localStorage.removeItem("poaw-token"); } catch {}
        set({ token: null });
      },
      isAuthenticated: () => !!get().token,
    }),
    { name: "poaw-auth" }
  )
);
