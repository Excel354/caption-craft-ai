import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, DailyUsage, PlanTier, SystemAnnouncement, UpgradeRequest } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  usage: DailyUsage | null;
  loading: boolean;
  isGuest: boolean;
  announcement: SystemAnnouncement | null;
  dismissAnnouncement: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  updateUsage: (newUsage: DailyUsage) => void;
  refreshUsage: () => Promise<void>;
  requestUpgrade: (plan: 'pro' | 'premium', transferReference: string, senderName?: string, notes?: string) => Promise<UpgradeRequest>;
  isAuthModalOpen: boolean;
  openAuthModal: (mode?: 'login' | 'register', reason?: string) => void;
  closeAuthModal: () => void;
  authModalMode: 'login' | 'register';
  authModalReason: string | null;
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
  const [announcement, setAnnouncement] = useState<SystemAnnouncement | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authModalReason, setAuthModalReason] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const fetchAnnouncement = async () => {
    try {
      const res = await fetch('/api/announcement');
      if (res.ok) {
        const data = await res.json();
        if (data.announcement) {
          const dismissedId = localStorage.getItem('dismissed_announcement_id');
          if (dismissedId !== data.announcement.id) {
            setAnnouncement(data.announcement);
          }
        }
      }
    } catch {
      // Non-critical
    }
  };

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
        // Token expired/invalid - remove and stay as guest
        localStorage.removeItem('caption_token');
        setToken(null);
        setUser(null);
        await fetchGuestUsage();
      }
    } catch {
      await fetchGuestUsage();
    } finally {
      setLoading(false);
    }
  };

  const fetchGuestUsage = async () => {
    try {
      const res = await fetch('/api/user/usage');
      if (res.ok) {
        const data = await res.json();
        setUsage(data.usage);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncement();
    if (token) {
      fetchCurrentUser(token);
    } else {
      fetchGuestUsage();
    }
  }, []);

  const dismissAnnouncement = () => {
    if (announcement) {
      localStorage.setItem('dismissed_announcement_id', announcement.id);
      setAnnouncement(null);
    }
  };

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
    setAuthModalReason(null);
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
    setAuthModalReason(null);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('caption_token');
    fetchGuestUsage();
  };

  const updateUsage = (newUsage: DailyUsage) => {
    setUsage(newUsage);
  };

  const refreshUsage = async () => {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const res = await fetch('/api/user/usage', { headers });
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

  const requestUpgrade = async (
    plan: 'pro' | 'premium',
    transferReference: string,
    senderName?: string,
    notes?: string
  ): Promise<UpgradeRequest> => {
    if (!token || !user) {
      openAuthModal('register', 'Please create an account or sign in to upgrade to Pro.');
      throw new Error('Please log in or create an account to request an upgrade.');
    }

    const res = await fetch('/api/upgrade/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        plan,
        transferReference,
        senderName,
        notes,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to submit upgrade request');
    }

    if (data.user) {
      setUser(data.user);
    }
    return data.request;
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login', reason?: string) => {
    setAuthModalMode(mode);
    setAuthModalReason(reason || null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthModalReason(null);
  };

  const openUpgradeModal = () => {
    if (!user || !token) {
      openAuthModal('register', 'Please log in or create a free account to upgrade to Pro or Premium.');
      return;
    }
    setIsUpgradeModalOpen(true);
  };

  const closeUpgradeModal = () => setIsUpgradeModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        usage,
        loading,
        isGuest: !user,
        announcement,
        dismissAnnouncement,
        login,
        register,
        logout,
        updateUsage,
        refreshUsage,
        requestUpgrade,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authModalMode,
        authModalReason,
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
