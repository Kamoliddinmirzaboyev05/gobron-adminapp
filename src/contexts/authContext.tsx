
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { authStorage } from '../utils/authStorage'; // Yo'lni tekshiring
import apiClient from '../services/apiClient'; // Yo'lni tekshiring

// Foydalanuvchi ma'lumotlari uchun interfeys (o'zingizga moslab o'zgartiring)
interface User {
  id: string;
  fullName: string;
  login: string;
  role: string;
}

// Kontekstning tipi
interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

// Kontekstni yaratamiz
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider komponenti
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Dastlab yuklanish holatida bo'ladi

  // Ilova ilk ochilganda autentifikatsiya holatini tekshirish
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { accessToken } = await authStorage.getTokens();
        if (accessToken) {
          // Token mavjud bo'lsa, foydalanuvchi tizimga kirgan deb hisoblaymiz
          // Bu yerda backend'dan foydalanuvchi ma'lumotlarini olishingiz mumkin
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Auth status check failed:', error);
      } finally {
        // Tekshiruv tugagach, yuklanish holatini o'chiramiz
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (credentials: any) => {
    const response = await apiClient.post('/auth/login', credentials);
    const { accessToken, refreshToken, user: userData } = response.data;
    await authStorage.setTokens({ accessToken, refreshToken });
    setUser(userData);
    setIsLoggedIn(true);
  };

  const register = async (data: any) => {
    const response = await apiClient.post('/auth/register', { ...data, role: 'admin' });
    const { accessToken, refreshToken, user: userData } = response.data;
    await authStorage.setTokens({ accessToken, refreshToken });
    setUser(userData);
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await authStorage.clearTokens();
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// `useAuth` hook'i
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
