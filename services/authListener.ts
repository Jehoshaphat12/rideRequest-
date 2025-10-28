// services/authListener.ts
import { auth, db } from '@/lib/firebaseConfig';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { registerForPushNotificationsAsync } from './notifications';

export type UserRole = 'passenger' | 'rider' | null;
export type AuthStateCallback = (user: User | null, role: UserRole) => void;

// Store active listeners to avoid duplicates
const activeListeners = new Set<AuthStateCallback>();

// Store the current user and role for quick access
let currentUser: User | null = null;
let currentUserRole: UserRole = null;
let userUnsubscribe: Unsubscribe | null = null;

// useEffect(() => {
//   if(auth.currentUser) {
//     registerForPushNotificationsAsync()
//   }
// }, [auth.currentUser])

/**
 * Main function to listen to authentication state changes
 * @param callback - Function to call when auth state changes
 * @returns Unsubscribe function
 */
export const listenToAuthChanges = (callback: AuthStateCallback): Unsubscribe => {
  // Add callback to active listeners
  activeListeners.add(callback);

  // Set up the auth state listener (only once)
  if (activeListeners.size === 1) {
    setupAuthListener();
  } else {
    // If listener already exists, immediately call callback with current state
    callback(currentUser, currentUserRole);
  }

  // Return unsubscribe function for this specific callback
  return () => {
    activeListeners.delete(callback);
    
    // If no more listeners, clean up
    if (activeListeners.size === 0) {
      cleanupAuthListener();
    }
  };
};

/**
 * Set up the Firebase auth state listener
 */
const setupAuthListener = (): void => {
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    
    if (user) {
      // User is signed in, listen to their role document
      await setupUserRoleListener(user.uid);
      registerForPushNotificationsAsync()
    } else {
      // User is signed out
      currentUserRole = null;
      cleanupUserRoleListener();
      notifyAllListeners(null, null);
    }
  });
};

/**
 * Set up listener for user role document
 */
const setupUserRoleListener = async (userId: string): Promise<void> => {
  // Clean up previous listener if exists
  cleanupUserRoleListener();

  const userDocRef = doc(db, 'users', userId);
  
  try {
    // First try to get the document immediately
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      currentUserRole = userData.role || null;
    } else {
      currentUserRole = null;
    }
    
    // Then set up real-time listener for role changes
    userUnsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        currentUserRole = userData.role || null;
      } else {
        currentUserRole = null;
      }
      notifyAllListeners(currentUser, currentUserRole);
    });
    
    notifyAllListeners(currentUser, currentUserRole);
  } catch (error) {
    console.error('Error setting up role listener:', error);
    currentUserRole = null;
    notifyAllListeners(currentUser, null);
  }
};

/**
 * Clean up user role listener
 */
const cleanupUserRoleListener = (): void => {
  if (userUnsubscribe) {
    userUnsubscribe();
    userUnsubscribe = null;
  }
};

/**
 * Clean up all auth listeners
 */
const cleanupAuthListener = (): void => {
  cleanupUserRoleListener();
  currentUser = null;
  currentUserRole = null;
};

/**
 * Notify all active listeners of auth state change
 */
const notifyAllListeners = (user: User | null, role: UserRole): void => {
  activeListeners.forEach(callback => {
    try {
      callback(user, role);
    } catch (error) {
      console.error('Error in auth listener callback:', error);
    }
  });
};

/**
 * Get current user and role (synchronous)
 */
export const getCurrentAuthState = (): { user: User | null; role: UserRole } => {
  return { user: currentUser, role: currentUserRole };
};

/**
 * Force refresh of auth state
 */
export const refreshAuthState = async (): Promise<void> => {
  if (currentUser) {
    await currentUser.reload();
    // The auth state change will be picked up by onAuthStateChanged
  }
};

/**
 * Sign out and clean up listeners
 */
export const signOutAndCleanup = async (): Promise<void> => {
  try {
    await signOut(auth);
    cleanupAuthListener();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Check if user has specific role
 */
export const hasRole = (requiredRole: UserRole): boolean => {
  return currentUserRole === requiredRole;
};

/**
 * Wait for auth state to be determined
 */
export const waitForAuthState = (timeoutMs: number = 5000): Promise<{ user: User | null; role: UserRole }> => {
  return new Promise((resolve, reject) => {
    if (currentUser !== undefined) {
      // Already have auth state
      resolve({ user: currentUser, role: currentUserRole });
      return;
    }

    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error('Auth state timeout'));
    }, timeoutMs);

    const unsubscribe = listenToAuthChanges((user, role) => {
      clearTimeout(timeout);
      unsubscribe();
      resolve({ user, role });
    });
  });
};