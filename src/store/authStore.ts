import { create } from 'zustand';
import { authStorage } from '../utils/authStorage';
import apiClient from '../services/apiClient';

interface User {
  id: string;
  fullName: string;
  name?: string;
  login: string;
  role: string;
  email?: string;
  phone?: string;
  stats?: any;
  subscription?: any;
  telegramHandle?: string;
  location?: string;
}

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  user: null,
  isLoading: true,

  checkAuthStatus: async () => {
    try {
      set({ isLoading: true });
      const tokens = await authStorage.getTokens();
      if (tokens && tokens.accessToken) {
        set({ isLoggedIn: true });
        try {
          const response = await apiClient.get('/auth/me');
          set({ user: response.data?.user || response.data });
        } catch (e) {
          console.error('Failed to fetch user data on startup', e);
        }
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMe: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      set({ user: response.data?.user || response.data, isLoggedIn: true });
    } catch (error) {
      console.error('fetchMe failed:', error);
    }
  },

  login: async (credentials: any) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const { accessToken, refreshToken, user: userData } = response.data;
      await authStorage.setTokens({ accessToken, refreshToken });
      set({ user: userData, isLoggedIn: true });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Login failed. Please try again.';
      throw new Error(errorMsg);
    }
  },

  register: async (data: any) => {
    try {
      // doim default holatda admin rolini yuboramiz
      const payload = { ...data, role: 'admin' };
      const response = await apiClient.post('/auth/register', payload);
      const { accessToken, refreshToken, user: userData } = response.data;
      await authStorage.setTokens({ accessToken, refreshToken });
      set({ user: userData, isLoggedIn: true });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Registration failed. Please try again.';
      throw new Error(errorMsg);
    }
  },

  logout: async () => {
    await authStorage.clearTokens();
    set({ isLoggedIn: false, user: null });
  },
}));
