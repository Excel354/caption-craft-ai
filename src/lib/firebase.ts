import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
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
import { SavedItem, User, UpgradeRequest, PlanTier, SupportMessage } from '../types';

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

      // Refresh name or email if updated in provider
      const patch: Record<string, any> = { id: fbUser.uid, updatedAt: nowIso };
      let needsUpdate = false;
      if (fbUser.displayName && fbUser.displayName !== data.name) {
        patch.name = fbUser.displayName;
        needsUpdate = true;
      }
      if (fbUser.email && fbUser.email !== data.email) {
        patch.email = fbUser.email;
        needsUpdate = true;
      }
      if (needsUpdate) {
        await setDoc(userDocRef, patch, { merge: true });
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

      const docPayload: Record<string, any> = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        plan: newUser.plan,
        createdAt: newUser.createdAt,
        updatedAt: nowIso,
        hasSeenOnboarding: newUser.hasSeenOnboarding,
        lastReadAnnouncementTime: newUser.lastReadAnnouncementTime,
      };
      if (newUser.dismissedAnnouncementId) {
        docPayload.dismissedAnnouncementId = newUser.dismissedAnnouncementId;
      }

      await setDoc(userDocRef, docPayload);

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
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return;
  }
  try {
    const userDocRef = doc(db, 'users', userId);
    const sanitizedUpdates: Record<string, any> = {
      id: userId,
      updatedAt: new Date().toISOString(),
    };
    if (updates.hasSeenOnboarding !== undefined) {
      sanitizedUpdates.hasSeenOnboarding = updates.hasSeenOnboarding;
    }
    if (updates.lastReadAnnouncementTime !== undefined) {
      sanitizedUpdates.lastReadAnnouncementTime = updates.lastReadAnnouncementTime;
    }
    if (updates.dismissedAnnouncementId !== undefined && updates.dismissedAnnouncementId !== null) {
      sanitizedUpdates.dismissedAnnouncementId = updates.dismissedAnnouncementId;
    }
    if (updates.plan !== undefined) {
      sanitizedUpdates.plan = updates.plan;
    }
    await setDoc(userDocRef, sanitizedUpdates, { merge: true });
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
  // Only attach onSnapshot listener if authenticated and UID matches
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return () => {};
  }

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
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return;
  }
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
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return;
  }
  try {
    const ref = doc(db, 'users', userId, 'savedCaptions', captionId);
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function toggleCaptionFavoriteInFirestore(userId: string, captionId: string, isFavorite: boolean): Promise<void> {
  const path = `users/${userId}/savedCaptions/${captionId}`;
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return;
  }
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
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return;
  }
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
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    const errorCode = error?.code || '';
    const errorMsg = error?.message || '';

    // Handle Render / external domain not authorized in Firebase Auth
    if (errorCode === 'auth/unauthorized-domain' || errorMsg.includes('unauthorized-domain')) {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'your domain';
      const enhancedError = new Error(
        `Google Sign-In requires "${currentHost}" to be added to Firebase Authorized Domains.\n\n` +
        `How to fix:\n` +
        `1. Open Firebase Console -> Authentication -> Settings -> Authorized Domains\n` +
        `2. Click "Add domain" and paste: ${currentHost}\n` +
        `3. Or sign in instantly using email below.`
      );
      (enhancedError as any).code = 'auth/unauthorized-domain';
      (enhancedError as any).unauthorizedHost = currentHost;
      throw enhancedError;
    }

    // If popup was blocked by browser on Render, suggest redirect mode
    if (errorCode === 'auth/popup-blocked') {
      const enhancedError = new Error('Sign-in popup was blocked by browser. Please allow popups or use redirect mode.');
      (enhancedError as any).code = 'auth/popup-blocked';
      throw enhancedError;
    }

    throw error;
  }
}

export async function signInWithGoogleRedirect(): Promise<void> {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error: any) {
    if (error?.code === 'auth/unauthorized-domain') {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'your domain';
      const enhancedError = new Error(
        `Domain "${currentHost}" is not authorized for Google OAuth in Firebase Console. Add it under Authentication > Settings > Authorized Domains.`
      );
      (enhancedError as any).code = 'auth/unauthorized-domain';
      (enhancedError as any).unauthorizedHost = currentHost;
      throw enhancedError;
    }
    throw error;
  }
}

export async function checkRedirectAuthResult(): Promise<FirebaseUser | null> {
  try {
    const result = await getRedirectResult(auth);
    return result ? result.user : null;
  } catch (error) {
    console.warn('Redirect auth check notice:', error);
    return null;
  }
}

export async function saveSupportMessageToFirestore(userId: string, msg: SupportMessage): Promise<void> {
  const path = `users/${userId}/supportMessages/${msg.id}`;
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return;
  }
  try {
    const ref = doc(db, 'users', userId, 'supportMessages', msg.id);
    await setDoc(ref, {
      id: msg.id,
      conversationId: msg.conversationId,
      senderRole: msg.senderRole,
      senderId: msg.senderId,
      senderName: msg.senderName,
      senderEmail: msg.senderEmail || '',
      recipientId: msg.recipientId,
      subject: msg.subject || 'Support Message',
      message: msg.message,
      createdAt: msg.createdAt,
      readByUser: msg.readByUser,
      readByAdmin: msg.readByAdmin,
    });
  } catch (error) {
    console.warn('Could not sync support message to Firestore (using backend persistence):', error);
  }
}

export async function signOutFirebase(): Promise<void> {
  await signOut(auth);
}

