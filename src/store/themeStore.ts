import { create } from 'zustand';

interface ThemeStore {
  isDark: boolean;
  toggle: () => void;
  set: (dark: boolean) => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  isDark: false,
  toggle: () => set((s) => ({ isDark: !s.isDark })),
  set: (dark) => set({ isDark: dark }),
}));
