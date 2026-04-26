import { create } from "zustand";

type CascadeDirection = "down" | "up" | null;

interface ThemeState {
  aiMode: boolean;
  cascade: CascadeDirection;
  enterAiMode: () => void;
  exitAiMode: () => void;
  cancelCascade: () => void;
}

const DOWN_MS = 800;
const UP_MS = 400;

const applyInitialTheme = () => {
  if (typeof document === "undefined") return true;
  document.documentElement.classList.add("dark");
  return true;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  aiMode: applyInitialTheme(),
  cascade: null,

  enterAiMode: () => {
    if (get().aiMode) return;
    set({ cascade: "down" });
    // Apply dark class slightly after the overlay starts sweeping so the
    // page underneath is already dark by the time the overlay passes.
    setTimeout(() => {
      document.documentElement.classList.add("dark");
    }, 200);
    setTimeout(() => {
      set({ aiMode: true, cascade: null });
    }, DOWN_MS);
  },

  exitAiMode: () => {
    if (!get().aiMode && get().cascade === null) return;
    set({ cascade: "up" });
    setTimeout(() => {
      document.documentElement.classList.remove("dark");
    }, 50);
    setTimeout(() => {
      set({ aiMode: false, cascade: null });
    }, UP_MS);
  },

  cancelCascade: () => {
    // Instant flicker back to light
    document.documentElement.classList.remove("dark");
    set({ aiMode: false, cascade: null });
  },
}));
