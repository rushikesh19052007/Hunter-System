import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Zap,
  Flame,
  Brain,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { audioService } from '@/lib/audio-service';
import type { HunterStat } from '@/lib/game-engine';

interface AffinityConfig {
  title: string;
  desc: string;
  color: string;
  icon: React.ReactNode;
  stat: HunterStat;
}

const AFFINITY_DETAILS: Record<string, AffinityConfig> = {
  STR: {
    title: 'Monarch of Destruction',
    desc: 'Overwhelming kinetic force, trials of brute iron. (+5 STR)',
    color: '#ef4444',
    icon: <Flame className="w-5 h-5 text-red-500" />,
    stat: 'STR',
  },
  AGI: {
    title: 'Shadow Step Assassin',
    desc: 'Sub-second reflexes, phantom speed & rapid strikes. (+5 AGI)',
    color: '#00e5ff',
    icon: <Zap className="w-5 h-5 text-cyan-400" />,
    stat: 'AGI',
  },
  VIT: {
    title: 'Immortal Vanguard',
    desc: 'Unbreakable stamina, maximum durability & steel defense. (+5 VIT)',
    color: '#10b981',
    icon: <Shield className="w-5 h-5 text-emerald-400" />,
    stat: 'VIT',
  },
  INT: {
    title: 'Monarch of Shadows',
    desc: 'Cognitive dominance, tactical strategy & LeetCode focus. (+5 INT)',
    color: '#a855f7',
    icon: <Brain className="w-5 h-5 text-purple-400" />,
    stat: 'INT',
  },
  PERC: {
    title: "Ruler's Authority",
    desc: 'Spatial mindfulness, razor-sharp discipline & vision. (+5 PERC)',
    color: '#f59e0b',
    icon: <Eye className="w-5 h-5 text-amber-400" />,
    stat: 'PERC',
  },
};

export const HunterAuthScreen: React.FC = () => {
  const { loginWithEmail, signUpWithEmail, loginWithGoogle, loginAsGuest, resetPassword } = useAuth();

  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [selectedAffinity, setSelectedAffinity] = useState<string>('AGI');

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [resetEmail, setResetEmail] = useState<string>('');

  const cleanFirebaseError = (error: unknown): string => {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('user-not-found') || msg.includes('invalid-credential')) {
      return 'No Hunter found with these credentials or passcode is invalid.';
    }
    if (msg.includes('wrong-password')) {
      return 'Incorrect Hunter passcode. Please re-verify.';
    }
    if (msg.includes('email-already-in-use')) {
      return 'This email is already registered. Please switch to Log In.';
    }
    if (msg.includes('weak-password')) {
      return 'Passcode is too weak. Please use at least 6 characters.';
    }
    if (msg.includes('invalid-email')) {
      return 'Invalid email address format.';
    }
    if (msg.includes('network-request-failed')) {
      return 'Network communication failure. Please check your internet connection.';
    }
    if (msg.includes('popup-closed-by-user') || msg.includes('cancelled') || msg.includes('canceled')) {
      return 'Google sign-in was canceled.';
    }
    if (msg.includes('popup-blocked')) {
      return 'Sign-in popup was blocked by your browser. Please allow popups or try again.';
    }
    if (msg.includes('operation-not-allowed') || msg.includes('configuration-not-found')) {
      return 'Google Sign-In is not enabled in Firebase Console for hunter-x-guild. Enable Google under Firebase Console > Authentication > Sign-in method, or use Email / Guest mode.';
    }
    if (msg.includes('unauthorized-domain')) {
      return 'This domain is not authorized in Firebase Console. Add localhost under Authentication > Settings > Authorized domains.';
    }
    return msg.replace(/\[.*?\]/g, '').trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid Hunter email address.');
      audioService.playClick();
      return;
    }

    if (cleanPassword.length < 6) {
      setErrorMessage('Security passcode must be at least 6 characters.');
      audioService.playClick();
      return;
    }

    if (isSignUp) {
      const cleanName = name.trim();
      if (!cleanName) {
        setErrorMessage('Please enter your Hunter Designation Name.');
        audioService.playClick();
        return;
      }
      if (cleanPassword !== confirmPassword.trim()) {
        setErrorMessage('Passcodes do not match. Please verify.');
        audioService.playClick();
        return;
      }

      setIsLoading(true);
      try {
        await signUpWithEmail(cleanName, cleanEmail, cleanPassword, selectedAffinity);
      } catch (err) {
        setErrorMessage(cleanFirebaseError(err));
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(true);
      try {
        await loginWithEmail(cleanEmail, cleanPassword);
      } catch (err) {
        setErrorMessage(cleanFirebaseError(err));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setErrorMessage(cleanFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestAwakening = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await loginAsGuest();
    } catch (err) {
      setErrorMessage(cleanFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setErrorMessage('Enter a valid email address to receive password reset directive.');
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword(resetEmail.trim());
      setSuccessMessage('System transmission sent. Check your inbox for recovery instructions.');
      setShowForgotPassword(false);
    } catch (err) {
      setErrorMessage(cleanFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const activeAffinity = AFFINITY_DETAILS[selectedAffinity] || AFFINITY_DETAILS['AGI'];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#060812',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Ambient Dungeon Glow Orbs */}
      <div
        style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 229, 255, 0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-60px',
          left: '-60px',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: '480px', width: '100%', zIndex: 10 }}>
        {/* Animated System Directive Badge */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <motion.div
            animate={{
              boxShadow: [
                '0 0 10px rgba(0, 229, 255, 0.2)',
                '0 0 25px rgba(0, 229, 255, 0.6)',
                '0 0 10px rgba(0, 229, 255, 0.2)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '24px',
              backgroundColor: 'rgba(0, 229, 255, 0.08)',
              border: '1.5px solid rgba(0, 229, 255, 0.6)',
            }}
          >
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin-slow" />
            <span
              style={{
                color: '#00e5ff',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}
            >
              System Directive: Hunter Awakening
            </span>
          </motion.div>

          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 900,
              letterSpacing: '2px',
              marginTop: '16px',
              marginBottom: '6px',
              textShadow: '0 0 20px rgba(0, 229, 255, 0.4)',
            }}
          >
            HUNTR ASSOCIATION
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            {isSignUp
              ? 'Register your Hunter License to awaken and track progression'
              : 'Synchronize your Hunter profile across mobile & web'}
          </p>
        </div>

        {/* Tab Toggle: LOG IN / SIGN UP */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#0c1020',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid #1c253d',
            marginBottom: '20px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              audioService.playClick();
              setIsSignUp(false);
              setErrorMessage(null);
            }}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: !isSignUp ? '#00e5ff' : 'transparent',
              color: !isSignUp ? '#000' : '#94a3b8',
              fontWeight: 800,
              fontSize: '13px',
              letterSpacing: '1px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            LOG IN
          </button>
          <button
            type="button"
            onClick={() => {
              audioService.playClick();
              setIsSignUp(true);
              setErrorMessage(null);
            }}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isSignUp ? '#00e5ff' : 'transparent',
              color: isSignUp ? '#000' : '#94a3b8',
              fontWeight: 800,
              fontSize: '13px',
              letterSpacing: '1px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            SIGN UP
          </button>
        </div>

        {/* Error / Success Notifications */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.6)',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#fca5a5',
              fontSize: '0.85rem',
            }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.6)',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#6ee7b7',
              fontSize: '0.85rem',
            }}
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </motion.div>
        )}

        {/* Auth Form Card */}
        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: '#0c1020',
            borderRadius: '16px',
            border: '1px solid #1c253d',
            padding: '24px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
          }}
        >
          {/* Sign Up: Hunter Designation Name */}
          {isSignUp && (
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  color: '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '1px',
                  marginBottom: '6px',
                }}
              >
                HUNTER DESIGNATION (NAME)
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#060812',
                  border: '1px solid #1e293b',
                  borderRadius: '10px',
                  padding: '10px 14px',
                }}
              >
                <User className="w-4 h-4 text-cyan-400 mr-2" />
                <input
                  type="text"
                  placeholder="e.g. Sung Jin-Woo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#fff',
                    outline: 'none',
                    width: '100%',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                color: '#94a3b8',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '1px',
                marginBottom: '6px',
              }}
            >
              HUNTER EMAIL IDENTIFIER
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#060812',
                border: '1px solid #1e293b',
                borderRadius: '10px',
                padding: '10px 14px',
              }}
            >
              <Mail className="w-4 h-4 text-cyan-400 mr-2" />
              <input
                type="email"
                placeholder="hunter@guild.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#fff',
                  outline: 'none',
                  width: '100%',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: isSignUp ? '16px' : '8px' }}>
            <label
              style={{
                display: 'block',
                color: '#94a3b8',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '1px',
                marginBottom: '6px',
              }}
            >
              SECURITY PASSCODE
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#060812',
                border: '1px solid #1e293b',
                borderRadius: '10px',
                padding: '10px 14px',
              }}
            >
              <Lock className="w-4 h-4 text-cyan-400 mr-2" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#fff',
                  outline: 'none',
                  width: '100%',
                  fontSize: '14px',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (Sign Up only) */}
          {isSignUp && (
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  color: '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '1px',
                  marginBottom: '6px',
                }}
              >
                CONFIRM PASSCODE
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#060812',
                  border: '1px solid #1e293b',
                  borderRadius: '10px',
                  padding: '10px 14px',
                }}
              >
                <Lock className="w-4 h-4 text-cyan-400 mr-2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#fff',
                    outline: 'none',
                    width: '100%',
                    fontSize: '14px',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Forgot Password link (Log In only) */}
          {!isSignUp && (
            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(!showForgotPassword);
                  setResetEmail(email);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#67e8f9',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Forgot passcode?
              </button>
            </div>
          )}

          {/* Sign Up: Affinity Selection Grid */}
          {isSignUp && (
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  color: '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '1px',
                  marginBottom: '10px',
                }}
              >
                SELECT COMBAT AFFINITY (AWAKENING PATH)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                {Object.keys(AFFINITY_DETAILS).map((aff) => {
                  const cfg = AFFINITY_DETAILS[aff];
                  const isSel = selectedAffinity === aff;
                  return (
                    <button
                      key={aff}
                      type="button"
                      onClick={() => {
                        audioService.playClick();
                        setSelectedAffinity(aff);
                      }}
                      style={{
                        padding: '12px 6px',
                        borderRadius: '10px',
                        border: isSel ? `1.5px solid ${cfg.color}` : '1px solid #1e293b',
                        backgroundColor: isSel ? 'rgba(0, 229, 255, 0.1)' : '#060812',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ color: cfg.color, fontWeight: 900, fontSize: '14px' }}>{aff}</span>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>+5</span>
                    </button>
                  );
                })}
              </div>

              {/* Affinity Details Lore Card */}
              <div
                style={{
                  marginTop: '12px',
                  padding: '12px 16px',
                  backgroundColor: '#060812',
                  borderRadius: '10px',
                  borderLeft: `3px solid ${activeAffinity.color}`,
                }}
              >
                <div style={{ color: activeAffinity.color, fontWeight: 800, fontSize: '13px' }}>
                  {activeAffinity.title}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>
                  {activeAffinity.desc}
                </div>
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#00e5ff',
              color: '#000',
              fontWeight: 900,
              fontSize: '14px',
              letterSpacing: '1.5px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 0 20px rgba(0, 229, 255, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? 'INITIALIZE HUNTER AWAKENING' : 'ACCESS HUNTER SYSTEM'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '20px 0',
            color: '#475569',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '1px',
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: '#1e293b' }} />
          <span style={{ padding: '0 12px' }}>ALTERNATIVE PROTOCOLS</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#1e293b' }} />
        </div>

        {/* Google Authentication Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid #1e293b',
            backgroundColor: '#0c1020',
            color: '#fff',
            fontWeight: 700,
            fontSize: '13px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '10px',
            transition: 'all 0.15s ease',
          }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
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

        {/* Quick Trial / Guest Mode Button */}
        <button
          type="button"
          onClick={handleGuestAwakening}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            backgroundColor: 'rgba(0, 229, 255, 0.05)',
            color: '#67e8f9',
            fontWeight: 700,
            fontSize: '13px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
          }}
        >
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>QUICK TRIAL / OFFLINE GUEST MODE</span>
        </button>

        {/* Forgot Password Inline Modal */}
        <AnimatePresence>
          {showForgotPassword && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                marginTop: '16px',
                padding: '16px',
                backgroundColor: '#0c1020',
                borderRadius: '12px',
                border: '1px solid #1c253d',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: '13px' }}>RECOVER PASSCODE</span>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '10px' }}>
                Enter your registered Hunter email. The system will dispatch a security reset link.
              </p>
              <form onSubmit={handlePasswordResetSubmit} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="email"
                  placeholder="hunter@guild.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: '#060812',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#00e5ff',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  SEND
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HunterAuthScreen;
