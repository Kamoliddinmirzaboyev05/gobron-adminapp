import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Owner } from '../types';
import { backendApi } from '../services/backendApi';

interface AuthStore {
  owner: Owner | null;
  isLoggedIn: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  login: (owner: Owner) => void;
  loginWithBackend: (login: string, password: string) => Promise<void>;
  registerWithBackend: (fullName: string, login: string, password: string) => Promise<void>;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      owner: null,
      isLoggedIn: false,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      login: (owner) => set({ owner, isLoggedIn: true, error: null }),
      loginWithBackend: async (login, password) => {
        set({ isLoading: true, error: null });
        try {
          const result = await backendApi.login({ login, password });
          set({ 
            accessToken: result.accessToken, 
            refreshToken: result.refreshToken,
          });
          await get().fetchMe();
        } catch (error: any) {
          const message = error?.message || "Login failed";
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },
      registerWithBackend: async (fullName, login, password) => {
        set({ isLoading: true, error: null });
        try {
          const result = await backendApi.register({ fullName, login, password, role: 'admin' });
          set({ 
            accessToken: result.accessToken, 
            refreshToken: result.refreshToken,
          });
          await get().fetchMe();
        } catch (error: any) {
          const message = error?.message || "Registration failed";
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },
      fetchMe: async () => {
        const { accessToken } = get();
        if (!accessToken) return;
        
        set({ isLoading: true });
        try {
          const user = await backendApi.getMe(accessToken);
          set({
            isLoading: false,
            isLoggedIn: true,
            owner: {
              id: user.id,
              name: user.fullName || "Admin",
              phone: "",
              telegramId: String(user.id),
              telegramHandle: `@${user.login}`,
              location: "Toshkent",
              avatar: null,
              subscription: {
                plan: "Pro",
                isActive: true,
                startsAt: "",
                expiresAt: "",
                daysLeft: 30,
                totalDays: 30,
              },
              stats: {
                todayBookings: 0,
                monthBookings: 0,
                monthRevenue: 0,
                confirmRate: 0,
                cancelRate: 0,
                totalFields: 1,
              },
            },
          });
        } catch (error: any) {
          set({ isLoading: false, error: error?.message || "Failed to fetch profile" });
          throw error;
        }
      },
      logout: async () => {
        set({ 
          owner: null, 
          isLoggedIn: false, 
          accessToken: null, 
          refreshToken: null, 
          error: null 
        });
        try {
          await AsyncStorage.removeItem('auth-storage');
        } catch (e) {
          console.error('Failed to clear storage:', e);
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: (state) => {
        return () => {
          state?.setHasHydrated(true);
        };
      },
      partialize: (state) => ({ 
        accessToken: state.accessToken, 
        refreshToken: state.refreshToken,
        isLoggedIn: state.isLoggedIn,
        owner: state.owner,
      }),
    }
  )
);
