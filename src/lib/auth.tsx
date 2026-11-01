import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInAnonymously,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { audioService } from './audio-service';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  isAnonymous?: boolean;
}

export interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: User | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string, affinity: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Process redirect sign-in results if returned from redirect flow
    getRedirectResult(auth)
      .then((cred) => {
        if (cred?.user) {
          audioService.playLevelUp();
          setFirebaseUser(cred.user);
          setUser({
            id: cred.user.uid,
            email: cred.user.email || '',
            name: cred.user.displayName || cred.user.email?.split('@')[0],
            avatarUrl: cred.user.photoURL || undefined,
            isAnonymous: false,
          });
        }
      })
      .catch((err) => {
        console.warn('[Auth] Redirect result notice:', err);
      });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setFirebaseUser(currentUser);
        setUser({
          id: currentUser.uid,
          email: currentUser.email || (currentUser.isAnonymous ? 'guest@hunter.guild' : ''),
          name: currentUser.displayName || (currentUser.isAnonymous ? 'Guest Hunter' : currentUser.email?.split('@')[0]),
          avatarUrl: currentUser.photoURL || undefined,
          isAnonymous: currentUser.isAnonymous,
        });
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    audioService.playClick();
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    audioService.playLevelUp();
    if (cred.user) {
      setFirebaseUser(cred.user);
      setUser({
        id: cred.user.uid,
        email: cred.user.email || '',
        name: cred.user.displayName || cred.user.email?.split('@')[0],
        avatarUrl: cred.user.photoURL || undefined,
        isAnonymous: cred.user.isAnonymous,
      });
    }
  };

  const signUpWithEmail = async (name: string, email: string, password: string, affinity: string) => {
    audioService.playClick();
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name.trim() });
      audioService.playAwakening();
      setFirebaseUser(cred.user);
      setUser({
        id: cred.user.uid,
        email: cred.user.email || '',
        name: name.trim(),
        avatarUrl: undefined,
        isAnonymous: false,
      });
      // Store preferred affinity in local storage temporarily for initial profile creation
      try {
        localStorage.setItem('hunter_preferred_affinity', affinity);
      } catch {}
    }
  };

  const loginWithGoogle = async () => {
    audioService.playClick();
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      audioService.playLevelUp();
      if (cred.user) {
        setFirebaseUser(cred.user);
        setUser({
          id: cred.user.uid,
          email: cred.user.email || '',
          name: cred.user.displayName || cred.user.email?.split('@')[0],
          avatarUrl: cred.user.photoURL || undefined,
          isAnonymous: false,
        });
      }
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      console.warn('[Auth] Google sign in event:', e);
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') {
        return;
      }
      if (e.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      throw err;
    }
  };

  const loginAsGuest = async () => {
    audioService.playClick();
    const cred = await signInAnonymously(auth);
    audioService.playAwakening();
    if (cred.user) {
      setFirebaseUser(cred.user);
      setUser({
        id: cred.user.uid,
        email: 'guest@hunter.guild',
        name: 'Guest Hunter',
        isAnonymous: true,
      });
    }
  };

  const resetPassword = async (email: string) => {
    audioService.playClick();
    await sendPasswordResetEmail(auth, email.trim());
  };

  const logout = async () => {
    audioService.playClick();
    await firebaseSignOut(auth);
    setFirebaseUser(null);
    setUser(null);
  };

  const deleteAccount = async () => {
    audioService.playClick();
    if (firebaseUser) {
      await deleteUser(firebaseUser);
      setFirebaseUser(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        loginWithEmail,
        signUpWithEmail,
        loginWithGoogle,
        loginAsGuest,
        resetPassword,
        logout,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


