import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  getDocFromServer,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { SavedItem, User, UpgradeRequest, PlanTier } from '../types';

// Initialize Firebase app once
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore with the exact database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Test connection on boot as mandated
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Firestore connected successfully to database:', firebaseConfig.firestoreDatabaseId);
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// -------------------------------------------------------------
// FIRESTORE USER PROFILE OPERATIONS
// -------------------------------------------------------------

export async function syncFirebaseUserProfile(fbUser: FirebaseUser, existingProfile?: Partial<User>): Promise<User> {
  const userDocRef = doc(db, 'users', fbUser.uid);
  const path = `users/${fbUser.uid}`;

  try {
    const snap = await getDoc(userDocRef);
    const nowIso = new Date().toISOString();

    if (snap.exists()) {
      const data = snap.data();
      const updatedUser: User = {
        id: fbUser.uid,
        email: fbUser.email || data.email || '',
        name: fbUser.displayName || data.name || 'Creator',
        plan: (data.plan as PlanTier) || 'free',
        createdAt: data.createdAt || nowIso,
        hasSeenOnboarding: data.hasSeenOnboarding ?? false,
        lastReadAnnouncementTime: data.lastReadAnnouncementTime ?? 0,
        dismissedAnnouncementId: data.dismissedAnnouncementId ?? null,
      };

      // Refresh name if updated in provider
      if (fbUser.displayName && fbUser.displayName !== data.name) {
        await setDoc(userDocRef, { name: fbUser.displayName, updatedAt: nowIso }, { merge: true });
      }

      return updatedUser;
    } else {
      // Create new user profile document
      const newUser: User = {
        id: fbUser.uid,
        email: fbUser.email || '',
        name: fbUser.displayName || 'Creator',
        plan: (existingProfile?.plan as PlanTier) || 'free',
        createdAt: nowIso,
        hasSeenOnboarding: existingProfile?.hasSeenOnboarding ?? false,
        lastReadAnnouncementTime: existingProfile?.lastReadAnnouncementTime ?? 0,
        dismissedAnnouncementId: existingProfile?.dismissedAnnouncementId ?? null,
      };

      await setDoc(userDocRef, {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        plan: newUser.plan,
        createdAt: newUser.createdAt,
        updatedAt: nowIso,
        hasSeenOnboarding: newUser.hasSeenOnboarding,
        lastReadAnnouncementTime: newUser.lastReadAnnouncementTime,
        dismissedAnnouncementId: newUser.dismissedAnnouncementId,
      });

      return newUser;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserFirestorePreferences(
  userId: string,
  updates: Partial<Pick<User, 'hasSeenOnboarding' | 'lastReadAnnouncementTime' | 'dismissedAnnouncementId' | 'plan'>>
): Promise<void> {
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, { ...updates, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// -------------------------------------------------------------
// FIRESTORE SAVED CAPTIONS (HISTORY & FAVORITES)
// -------------------------------------------------------------

export function subscribeUserCaptions(
  userId: string,
  onData: (items: SavedItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colPath = `users/${userId}/savedCaptions`;
  const q = query(collection(db, 'users', userId, 'savedCaptions'), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: SavedItem[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as SavedItem);
      });
      onData(items);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
      handleFirestoreError(error, OperationType.GET, colPath);
    }
  );
}

export async function saveCaptionToFirestore(userId: string, item: SavedItem): Promise<void> {
  const path = `users/${userId}/savedCaptions/${item.id}`;
  try {
    const ref = doc(db, 'users', userId, 'savedCaptions', item.id);
    await setDoc(ref, {
      id: item.id,
      userId,
      topic: item.topic.slice(0, 500),
      platform: item.platform,
      caption: item.caption.slice(0, 10000),
      hashtags: (item.hashtags || []).slice(0, 50),
      createdAt: item.createdAt,
      isFavorite: !!item.isFavorite,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteCaptionFromFirestore(userId: string, captionId: string): Promise<void> {
  const path = `users/${userId}/savedCaptions/${captionId}`;
  try {
    const ref = doc(db, 'users', userId, 'savedCaptions', captionId);
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function toggleCaptionFavoriteInFirestore(userId: string, captionId: string, isFavorite: boolean): Promise<void> {
  const path = `users/${userId}/savedCaptions/${captionId}`;
  try {
    const ref = doc(db, 'users', userId, 'savedCaptions', captionId);
    await setDoc(ref, { isFavorite }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// -------------------------------------------------------------
// FIRESTORE UPGRADE REQUESTS
// -------------------------------------------------------------

export async function submitUpgradeRequestToFirestore(userId: string, req: UpgradeRequest): Promise<void> {
  const path = `users/${userId}/upgradeRequests/${req.id}`;
  try {
    const ref = doc(db, 'users', userId, 'upgradeRequests', req.id);
    await setDoc(ref, {
      id: req.id,
      userId,
      userEmail: req.userEmail.slice(0, 256),
      userName: req.userName.slice(0, 128),
      plan: req.plan,
      transferReference: req.transferReference.slice(0, 128),
      senderName: req.senderName.slice(0, 128),
      notes: (req.notes || '').slice(0, 1000),
      status: 'pending',
      requestedAt: req.requestedAt,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function signInWithGooglePopup(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutFirebase(): Promise<void> {
  await signOut(auth);
}
