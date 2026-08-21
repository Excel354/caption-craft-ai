import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, DailyUsage, PlanTier } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  usage: DailyUsage | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  updateUsage: (newUsage: DailyUsage) => void;
  changePlan: (plan: PlanTier) => Promise<void>;
  refreshUsage: () => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  authModalMode: 'login' | 'register';
  isUpgradeModalOpen: boolean;
  openUpgradeModal: () => void;
  closeUpgradeModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('caption_token'));
  const [usage, setUsage] = useState<DailyUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const fetchCurrentUser = async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setUsage(data.usage);
      } else {
        // If token invalid, auto-login or seed demo user
        await loginWithDemo();
      }
    } catch {
      await loginWithDemo();
    } finally {
      setLoading(false);
    }
  };

  const loginWithDemo = async () => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'creator@example.com', password: 'password123' }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(data.token);
        setUsage(data.usage);
        localStorage.setItem('caption_token', data.token);
      }
    } catch (err) {
      console.error('Demo login fallback error:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    } else {
      loginWithDemo().finally(() => setLoading(false));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    setUser(data.user);
    setToken(data.token);
    setUsage(data.usage);
    localStorage.setItem('caption_token', data.token);
    setIsAuthModalOpen(false);
  };

  const register = async (email: string, password: string, name?: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    setUser(data.user);
    setToken(data.token);
    setUsage(data.usage);
    localStorage.setItem('caption_token', data.token);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setUsage(null);
    localStorage.removeItem('caption_token');
    // auto-relog as demo or prompt login
    loginWithDemo();
  };

  const updateUsage = (newUsage: DailyUsage) => {
    setUsage(newUsage);
  };

  const refreshUsage = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/user/usage', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsage(data.usage);
        if (user && data.plan) {
          setUser({ ...user, plan: data.plan });
        }
      }
    } catch (err) {
      console.error('Failed to refresh usage:', err);
    }
  };

  const changePlan = async (plan: PlanTier) => {
    if (!token) return;
    const res = await fetch('/api/user/plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update plan');
    }
    setUser(data.user);
    setUsage(data.usage);
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);
  const openUpgradeModal = () => setIsUpgradeModalOpen(true);
  const closeUpgradeModal = () => setIsUpgradeModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        usage,
        loading,
        login,
        register,
        logout,
        updateUsage,
        changePlan,
        refreshUsage,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authModalMode,
        isUpgradeModalOpen,
        openUpgradeModal,
        closeUpgradeModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
