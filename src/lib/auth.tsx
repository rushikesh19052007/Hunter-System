import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { playSystemChime } from './notifications';
import { trackEvent, AnalyticsEvent } from './analytics';
import { Shield, Sparkles, AlertCircle, LogIn, UserCheck, Radio } from 'lucide-react';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface StoredSession {
  user: AuthUser;
  createdAt: number;
  expiresAt: number;
  provider?: string;
}

const STORAGE_SESSION_KEY = 'hunter_auth_session';

// 5 years in milliseconds: 5 years * 365.25 days * 24 hours * 60 min * 60 sec * 1000 ms
export const FIVE_YEARS_MS = 5 * 365.25 * 24 * 60 * 60 * 1000;

/**
 * Restores session from localStorage and auto-deletes if older than 5 years.
 */
export function initializeAuth(): { user: AuthUser | null; isExpired: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_SESSION_KEY);
    if (!raw) {
      return { user: null, isExpired: false };
    }

    const session: StoredSession = JSON.parse(raw);
    const now = Date.now();

    // Check if session has exceeded 5-year expiration
    if (!session.createdAt || now > session.expiresAt || (now - session.createdAt > FIVE_YEARS_MS)) {
      clearAuthSession();
      console.warn('[Hunter Auth] Session expired after 5-year retention limit.');
      return { user: null, isExpired: true };
    }

    return { user: session.user, isExpired: false };
  } catch (err) {
    console.error('[Hunter Auth] Failed to parse session:', err);
    clearAuthSession();
    return { user: null, isExpired: false };
  }
}

/**
 * Saves auth session to localStorage with 5-year expiration timestamp.
 */
export function saveAuthSession(user: AuthUser, provider: string = 'google'): StoredSession {
  const now = Date.now();
  const session: StoredSession = {
    user,
    createdAt: now,
    expiresAt: now + FIVE_YEARS_MS,
    provider,
  };

  try {
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('[Hunter Auth] Error saving session to localStorage:', err);
  }

  return session;
}

/**
 * Clears auth session on logout or expiry.
 */
export function clearAuthSession(): void {
  try {
    localStorage.removeItem(STORAGE_SESSION_KEY);
  } catch (err) {
    console.error('[Hunter Auth] Error clearing session:', err);
  }
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isExpired: boolean;
  login: (email: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  handleAuthCallback: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check local stored session first for instantaneous direct login
    const init = initializeAuth();
    if (init.user) {
      setUser(init.user);
      setIsExpired(false);
      setLoading(false);
    } else if (init.isExpired) {
      setIsExpired(true);
      setLoading(false);
    } else {
      setLoading(false);
    }

    // 2. If Supabase is configured, listen for OAuth redirect or state changes
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || 'hunter@system.io',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            avatarUrl: session.user.user_metadata?.avatar_url,
          };
          setUser(authUser);
          setIsExpired(false);
          saveAuthSession(authUser, 'google');
        }
      }).catch((err) => {
        console.warn('[Hunter Auth] Supabase getSession fallback:', err);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || 'hunter@system.io',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            avatarUrl: session.user.user_metadata?.avatar_url,
          };
          setUser(authUser);
          setIsExpired(false);
          saveAuthSession(authUser, 'google');
        } else if (_event === 'SIGNED_OUT') {
          clearAuthSession();
          setUser(null);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    setIsExpired(false);
    playSystemChime('quest');

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) throw error;
      } catch (err: unknown) {
        console.warn('[Hunter Auth] Google OAuth redirect error, falling back to local Google simulation:', err);
        // Fallback simulated Google Hunter session for seamless local testing
        const fallbackUser: AuthUser = {
          id: 'google-' + Math.random().toString(36).substring(2, 10),
          email: 'hunter.solo@gmail.com',
          name: 'Sung Jin-Woo',
        };
        saveAuthSession(fallbackUser, 'google');
        setUser(fallbackUser);
      } finally {
        setLoading(false);
      }
    } else {
      // Local fallback Google sign-in
      const mockUser: AuthUser = {
        id: 'google-' + Math.random().toString(36).substring(2, 10),
        email: 'hunter.solo@gmail.com',
        name: 'Sung Jin-Woo',
      };
      saveAuthSession(mockUser, 'google');
      setUser(mockUser);
      setLoading(false);
    }
  };

  const login = async (email: string, name?: string) => {
    setLoading(true);
    setIsExpired(false);
    playSystemChime('quest');

    const cleanEmail = email.trim() || 'candidate@hunter.system';
    const cleanName = name?.trim() || cleanEmail.split('@')[0];
    const generatedId = 'usr-' + Math.random().toString(36).substring(2, 10);

    const newUser: AuthUser = {
      id: generatedId,
      email: cleanEmail,
      name: cleanName,
    };

    saveAuthSession(newUser, 'password');
    setUser(newUser);
    setLoading(false);
  };

  const logout = async () => {
    playSystemChime('alert');
    clearAuthSession();
    setUser(null);
    setIsExpired(false);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[Hunter Auth] SignOut error:', err);
      }
    }
  };

  const handleAuthCallback = async () => {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        const authUser: AuthUser = {
          id: data.session.user.id,
          email: data.session.user.email || '',
          name: data.session.user.user_metadata?.full_name,
          avatarUrl: data.session.user.user_metadata?.avatar_url,
        };
        saveAuthSession(authUser, 'google');
        setUser(authUser);
        setIsExpired(false);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isExpired,
        login,
        loginWithGoogle,
        logout,
        handleAuthCallback,
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

/**
 * AuthGate component: Wraps application and shows login terminal if no active session.
 */
export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isExpired, loginWithGoogle, login } = useAuth();
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [showDirectForm, setShowDirectForm] = useState(false);

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-box">
          <Radio className="w-8 h-8 text-cyan-400 animate-pulse mb-3" />
          <div className="auth-loading-text">AUTHENTICATING HUNTER SOUL SIGNATURE...</div>
          <div className="auth-loading-sub">Connecting to Hunter Association Mana Database</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-gate-container">
        <div className="awakening-bg-effects">
          <div className="grid-overlay" />
          <div className="scanline-overlay" />
          <div className="glow-sphere cyan" />
          <div className="glow-sphere purple" />
        </div>

        <div className="auth-card">
          <div className="auth-badge">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>HUNTER ASSOCIATION SECURITY GATEWAY</span>
          </div>

          <h1 className="auth-title">SYSTEM AUTHORIZATION</h1>
          <p className="auth-subtitle">
            Access to the Real-Life Hunter System requires an active soul token registration.
          </p>

          {isExpired && (
            <div className="auth-expired-alert">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <strong>Your session expired.</strong>
                <p>The 5-year security retention period has concluded. Re-authenticate to resume your progression.</p>
              </div>
            </div>
          )}

          <div className="auth-actions-stack">
            {/* Primary Google Sign-In */}
            <button
              type="button"
              id="btn-google-login"
              onClick={loginWithGoogle}
              className="btn-google-auth"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>CONTINUE WITH GOOGLE</span>
            </button>

            {/* Direct Hunter Access */}
            {!showDirectForm ? (
              <button
                type="button"
                id="btn-direct-access"
                onClick={() => setShowDirectForm(true)}
                className="btn-system-secondary w-full justify-center"
              >
                <LogIn className="w-4 h-4 mr-2" />
                <span>DIRECT HUNTER PASSKEY LOGIN</span>
              </button>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  login(guestEmail || 'hunter@system.io', guestName || 'Awakened Hunter');
                }}
                className="direct-login-form"
              >
                <div className="input-group">
                  <label className="input-label">HUNTER ALIAS</label>
                  <input
                    type="text"
                    placeholder="e.g. Sung Jin-Woo"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="system-text-input"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">COMMUNICATION CODEX (EMAIL)</label>
                  <input
                    type="email"
                    placeholder="hunter@system.io"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="system-text-input"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDirectForm(false)}
                    className="btn-system-secondary shrink-0"
                  >
                    BACK
                  </button>
                  <button
                    type="submit"
                    id="btn-submit-direct"
                    className="btn-system-primary flex-1 justify-center"
                  >
                    <UserCheck className="w-4 h-4 mr-1" />
                    <span>INITIALIZE SESSION (5-YEAR RETENTION)</span>
                  </button>
                </div>
              </form>
            )}

            {/* Instant Demo Hunter shortcut */}
            <div className="auth-demo-shortcut">
              <span>Quick Test Candidate?</span>
              <button
                type="button"
                id="btn-quick-demo"
                onClick={() => login('jinwoo@hunter.system', 'Sung Jin-Woo')}
                className="link-btn"
              >
                Instant Sovereign Login
              </button>
            </div>
          </div>

          <div className="auth-footer-notice">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>SESSION VALIDITY: 5 YEARS AUTO-EXTENDED PERSISTENCE</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
