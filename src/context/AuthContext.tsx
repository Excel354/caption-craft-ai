import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, DailyUsage, SystemAnnouncement, UpgradeRequest, SavedItem } from '../types';
import {
  auth,
  signInWithGooglePopup,
  signOutFirebase,
  syncFirebaseUserProfile,
  updateUserFirestorePreferences,
  subscribeUserCaptions,
  saveCaptionToFirestore,
  deleteCaptionFromFirestore,
  toggleCaptionFavoriteInFirestore,
  submitUpgradeRequestToFirestore,
} from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  usage: DailyUsage | null;
  loading: boolean;
  isGuest: boolean;
  isFirebaseConnected: boolean;
  savedCaptions: SavedItem[];
  announcement: SystemAnnouncement | null;
  announcements: SystemAnnouncement[];
  unreadAnnouncementsCount: number;
  markAnnouncementsAsRead: () => void;
  isAnnouncementsOpen: boolean;
  openAnnouncements: () => void;
  closeAnnouncements: () => void;
  dismissAnnouncement: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  updateUsage: (newUsage: DailyUsage) => void;
  refreshUsage: () => Promise<void>;
  requestUpgrade: (plan: 'pro' | 'premium', transferReference: string, senderName: string, notes?: string) => Promise<UpgradeRequest>;
  saveCaption: (item: SavedItem) => Promise<void>;
  deleteCaption: (id: string) => Promise<void>;
  toggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
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

async function parseJsonResponse<T = any>(res: Response, defaultError: string): Promise<T> {
  const rawText = await res.text();
  let data: any;
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    if (!res.ok) {
      throw new Error(`Server returned error (${res.status}). Please try again.`);
    }
    throw new Error('Unexpected response format from server.');
  }

  if (!res.ok) {
    throw new Error(data?.error || defaultError);
  }

  return data as T;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('caption_token'));
  const [usage, setUsage] = useState<DailyUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);
  const [savedCaptions, setSavedCaptions] = useState<SavedItem[]>([]);
  const [announcement, setAnnouncement] = useState<SystemAnnouncement | null>(null);
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [isAnnouncementsOpen, setIsAnnouncementsOpen] = useState(false);
  const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authModalReason, setAuthModalReason] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const fetchAnnouncements = async (currentUser?: User | null) => {
    try {
      const [singleRes, allRes] = await Promise.all([
        fetch('/api/announcement'),
        fetch('/api/announcements'),
      ]);

      const activeUser = currentUser !== undefined ? currentUser : user;

      if (singleRes.ok) {
        const data = await parseJsonResponse(singleRes, 'Failed to fetch announcement');
        if (data?.announcement) {
          const dismissedId = activeUser?.dismissedAnnouncementId || localStorage.getItem('dismissed_announcement_id');
          if (dismissedId !== data.announcement.id) {
            setAnnouncement(data.announcement);
          } else {
            setAnnouncement(null);
          }
        }
      }

      if (allRes.ok) {
        const allData = await parseJsonResponse(allRes, 'Failed to fetch announcements list');
        const list = allData?.announcements || [];
        setAnnouncements(list);

        const lastReadTimestamp = activeUser?.lastReadAnnouncementTime || parseInt(localStorage.getItem('last_read_announcements_time') || '0', 10);
        const unread = list.filter((a: SystemAnnouncement) => {
          const itemTime = new Date(a.createdAt || a.updatedAt).getTime();
          return itemTime > lastReadTimestamp;
        }).length;
        setUnreadAnnouncementsCount(unread);
      }
    } catch {
      // Non-critical
    }
  };

  const markAnnouncementsAsRead = () => {
    const now = Date.now();
    localStorage.setItem('last_read_announcements_time', now.toString());
    setUnreadAnnouncementsCount(0);
    if (user?.id) {
      updateUserFirestorePreferences(user.id, { lastReadAnnouncementTime: now }).catch(() => {});
    }
    if (token) {
      fetch('/api/user/announcements/read', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  };

  const openAnnouncements = () => {
    markAnnouncementsAsRead();
    setIsAnnouncementsOpen(true);
  };

  const closeAnnouncements = () => {
    setIsAnnouncementsOpen(false);
  };

  const fetchCurrentUser = async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await parseJsonResponse(res, 'Session expired');
        setUser(data.user);
        setUsage(data.usage);
        fetchAnnouncements(data.user);
      } else {
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
        const data = await parseJsonResponse(res, 'Failed to fetch usage');
        if (data?.usage) {
          setUsage(data.usage);
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  // Real-time Firestore subscription for user's saved captions
  useEffect(() => {
    if (!user?.id) {
      setSavedCaptions([]);
      return;
    }

    try {
      const unsubscribe = subscribeUserCaptions(
        user.id,
        (items) => {
          setSavedCaptions(items);
        },
        (err) => {
          console.warn('Firestore captions subscription warning:', err);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Could not initialize captions subscription:', err);
    }
  }, [user?.id]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const profile = await syncFirebaseUserProfile(fbUser);
          const res = await fetch('/api/auth/firebase-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: fbUser.uid,
              email: fbUser.email,
              name: fbUser.displayName,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const fullUser = { ...profile, ...data.user };
            setUser(fullUser);
            setToken(data.token);
            setUsage(data.usage);
            localStorage.setItem('caption_token', data.token);
            fetchAnnouncements(fullUser);
          }
        } catch (err) {
          console.error('Failed to sync Firebase Auth user:', err);
        } finally {
          setLoading(false);
        }
      } else {
        // Not signed into Firebase Auth; check local token or guest
        if (token) {
          fetchCurrentUser(token);
        } else {
          fetchGuestUsage();
        }
      }
    });

    fetchAnnouncements();
    return () => unsubscribe();
  }, []);

  const dismissAnnouncement = () => {
    if (announcement) {
      const annId = announcement.id;
      localStorage.setItem('dismissed_announcement_id', annId);
      setAnnouncement(null);
      if (user?.id) {
        updateUserFirestorePreferences(user.id, { dismissedAnnouncementId: annId }).catch(() => {});
      }
      if (token) {
        fetch('/api/user/announcements/dismiss', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ announcementId: annId }),
        }).catch(() => {});
      }
    }
  };

  const loginWithGoogle = async () => {
    const fbUser = await signInWithGooglePopup();
    const firestoreUser = await syncFirebaseUserProfile(fbUser);

    const res = await fetch('/api/auth/firebase-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: fbUser.uid,
        email: fbUser.email,
        name: fbUser.displayName,
      }),
    });

    const data = await parseJsonResponse(res, 'Authentication failed');
    const fullUser: User = {
      ...firestoreUser,
      ...data.user,
      plan: firestoreUser.plan || data.user.plan || 'free',
    };

    setUser(fullUser);
    setToken(data.token);
    setUsage(data.usage);
    localStorage.setItem('caption_token', data.token);
    fetchAnnouncements(fullUser);
    setIsAuthModalOpen(false);
    setAuthModalReason(null);
  };

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await parseJsonResponse(res, 'Login failed. Please check your credentials.');
    setUser(data.user);
    setToken(data.token);
    setUsage(data.usage);
    localStorage.setItem('caption_token', data.token);
    fetchAnnouncements(data.user);
    setIsAuthModalOpen(false);
    setAuthModalReason(null);
  };

  const register = async (email: string, password: string, name?: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await parseJsonResponse(res, 'Registration failed. Please check your details.');
    setUser(data.user);
    setToken(data.token);
    setUsage(data.usage);
    localStorage.setItem('caption_token', data.token);
    fetchAnnouncements(data.user);
    setIsAuthModalOpen(false);
    setAuthModalReason(null);
  };

  const logout = async () => {
    try {
      await signOutFirebase();
    } catch {}

    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Ignore network errors on logout
      }
    }
    setUser(null);
    setToken(null);
    setSavedCaptions([]);
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
        const data = await parseJsonResponse(res, 'Failed to update usage');
        if (data?.usage) {
          setUsage(data.usage);
        }
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
    senderName: string,
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

    const data = await parseJsonResponse(res, 'Failed to submit upgrade request');
    if (!data.success) {
      throw new Error(data.error || 'Failed to submit upgrade request');
    }

    // Mirror to Firestore collection
    if (user?.id && data.request) {
      try {
        await submitUpgradeRequestToFirestore(user.id, data.request);
      } catch (err) {
        console.warn('Firestore upgrade request sync:', err);
      }
    }

    if (data.user) {
      setUser(data.user);
    }
    return data.request;
  };

  const saveCaption = async (item: SavedItem) => {
    if (!user) {
      openAuthModal('register', 'Sign in to save captions to your permanent cloud history.');
      return;
    }

    // Persist to Firestore
    try {
      await saveCaptionToFirestore(user.id, item);
    } catch (err) {
      console.warn('Firestore caption save fallback:', err);
    }

    // Also persist via server API if available
    if (token) {
      fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(item),
      }).catch(() => {});
    }
  };

  const deleteCaption = async (id: string) => {
    if (!user) return;

    // Optimistic UI update
    setSavedCaptions((prev) => prev.filter((item) => item.id !== id));

    // Delete from Firestore
    try {
      await deleteCaptionFromFirestore(user.id, id);
    } catch (err) {
      console.warn('Firestore caption delete:', err);
    }

    // Delete from server API
    if (token) {
      fetch(`/api/history/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  };

  const toggleFavorite = async (id: string, isFavorite: boolean) => {
    if (!user) return;
    try {
      await toggleCaptionFavoriteInFirestore(user.id, id, isFavorite);
    } catch (err) {
      console.warn('Firestore toggle favorite:', err);
    }
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
        isFirebaseConnected,
        savedCaptions,
        announcement,
        announcements,
        unreadAnnouncementsCount,
        markAnnouncementsAsRead,
        isAnnouncementsOpen,
        openAnnouncements,
        closeAnnouncements,
        dismissAnnouncement,
        login,
        register,
        loginWithGoogle,
        logout,
        updateUsage,
        refreshUsage,
        requestUpgrade,
        saveCaption,
        deleteCaption,
        toggleFavorite,
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
