import { checkUsernameAvailable } from '@/lib/social-service';
import { normalizeUsername, isValidUsername } from '@/lib/game-engine';
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
    icon: <Flame size={18} color="#ef4444" style={{ flexShrink: 0 }} />,
    stat: 'STR',
  },
  AGI: {
    title: 'Shadow Step Assassin',
    desc: 'Sub-second reflexes, phantom speed & rapid strikes. (+5 AGI)',
    color: '#ff1a40',
    icon: <Zap size={18} color="#ff1a40" style={{ flexShrink: 0 }} />,
    stat: 'AGI',
  },
  VIT: {
    title: 'Immortal Vanguard',
    desc: 'Unbreakable stamina, maximum durability & steel defense. (+5 VIT)',
    color: '#10b981',
    icon: <Shield size={18} color="#10b981" style={{ flexShrink: 0 }} />,
    stat: 'VIT',
  },
  INT: {
    title: 'Monarch of Shadows',
    desc: 'Cognitive dominance, tactical strategy & LeetCode focus. (+5 INT)',
    color: '#a855f7',
    icon: <Brain size={18} color="#a855f7" style={{ flexShrink: 0 }} />,
    stat: 'INT',
  },
  PERC: {
    title: "Ruler's Authority",
    desc: 'Spatial mindfulness, razor-sharp discipline & vision. (+5 PERC)',
    color: '#f59e0b',
    icon: <Eye size={18} color="#f59e0b" style={{ flexShrink: 0 }} />,
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

  // Input focus tracking for cyber-glow border effects
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
      return 'This domain is not authorized in Firebase Console. Add your deployment URL under Authentication > Settings > Authorized domains.';
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
      const cleanUsername = normalizeUsername(name);
      if (!cleanUsername || cleanUsername.length < 3) {
        setErrorMessage('Username must be 3-20 lowercase alphanumeric characters (a-z, 0-9, _).');
        audioService.playClick();
        return;
      }
      if (!isValidUsername(cleanUsername)) {
        setErrorMessage('Username must contain lowercase characters only.');
        audioService.playClick();
        return;
      }

      try {
        const isAvail = await checkUsernameAvailable(cleanUsername);
        if (!isAvail) {
          setErrorMessage(`The username "@${cleanUsername}" is already claimed by another hunter.`);
          audioService.playClick();
          return;
        }
      } catch (_) {}
      if (cleanPassword !== confirmPassword.trim()) {
        setErrorMessage('Passcodes do not match. Please verify.');
        audioService.playClick();
        return;
      }

      setIsLoading(true);
      try {
        await signUpWithEmail(cleanUsername, cleanEmail, cleanPassword, selectedAffinity);
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

  const getInputContainerStyle = (field: string) => ({
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#050814',
    border: focusedField === field ? '1.5px solid #ff1a40' : '1px solid #1c2742',
    boxShadow: focusedField === field ? '0 0 14px rgba(255, 26, 64, 0.25)' : 'none',
    borderRadius: '10px',
    padding: '0 14px',
    height: '46px',
    transition: 'all 0.2s ease',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#04060f',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '32px 16px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Ambient Cyber Orbs */}
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 26, 64, 0.16) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-80px',
          left: '-80px',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.16) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: '440px', width: '100%', zIndex: 10 }}>
        {/* Animated System Directive Badge */}
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <motion.div
            animate={{
              boxShadow: [
                '0 0 10px rgba(255, 26, 64, 0.2)',
                '0 0 22px rgba(255, 26, 64, 0.55)',
                '0 0 10px rgba(255, 26, 64, 0.2)',
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '24px',
              backgroundColor: 'rgba(255, 26, 64, 0.08)',
              border: '1.5px solid rgba(255, 26, 64, 0.5)',
            }}
          >
            <Sparkles size={14} color="#ff1a40" style={{ flexShrink: 0 }} />
            <span
              style={{
                color: '#ff1a40',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}
            >
              System Directive: Hunter Awakening
            </span>
          </motion.div>

          <h1
            style={{
              fontSize: '1.85rem',
              fontWeight: 900,
              letterSpacing: '2.5px',
              marginTop: '14px',
              marginBottom: '6px',
              fontFamily: "'Orbitron', 'Inter', sans-serif",
              background: 'linear-gradient(135deg, #ffffff 40%, #ff1a40 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 25px rgba(255, 26, 64, 0.35)',
            }}
          >
            HUNTR ASSOCIATION
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', letterSpacing: '0.3px', margin: 0 }}>
            {isSignUp
              ? 'Register your Hunter License to awaken and track progression'
              : 'Synchronize your Hunter profile across mobile & web'}
          </p>
        </div>

        {/* Tab Toggle: LOG IN / SIGN UP */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#090d1c',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid #1a233a',
            marginBottom: '16px',
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
              padding: '9px 0',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: !isSignUp ? '#ff1a40' : 'transparent',
              color: !isSignUp ? '#000000' : '#94a3b8',
              fontWeight: 800,
              fontSize: '12px',
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
              padding: '9px 0',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isSignUp ? '#ff1a40' : 'transparent',
              color: isSignUp ? '#000000' : '#94a3b8',
              fontWeight: 800,
              fontSize: '12px',
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
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              borderRadius: '10px',
              padding: '10px 14px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#fca5a5',
              fontSize: '0.82rem',
            }}
          >
            <AlertCircle size={18} color="#f87171" style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              borderRadius: '10px',
              padding: '10px 14px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#6ee7b7',
              fontSize: '0.82rem',
            }}
          >
            <CheckCircle2 size={18} color="#34d399" style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </motion.div>
        )}

        {/* Auth Form Card */}
        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: '#0a0e20',
            borderRadius: '16px',
            border: '1px solid rgba(255, 26, 64, 0.18)',
            padding: '22px',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.7), 0 0 20px rgba(255, 26, 64, 0.05)',
          }}
        >
          {/* Sign Up: Hunter Designation Name */}
          {isSignUp && (
            <div style={{ marginBottom: '14px' }}>
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
                UNIQUE USERNAME (LOWERCASE ONLY)
              </label>
              <div style={getInputContainerStyle('name')}>
                <User size={16} color="#ff1a40" style={{ flexShrink: 0, marginRight: '10px' }} />
                <input
                  type="text"
                  placeholder="e.g. mahesh, hunter_x, kavya123"
                  value={name}
                  onChange={(e) => {
                    const lower = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                    setName(lower);
                  }}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#fff',
                    outline: 'none',
                    width: '100%',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div style={{ marginBottom: '14px' }}>
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
            <div style={getInputContainerStyle('email')}>
              <Mail size={16} color="#ff1a40" style={{ flexShrink: 0, marginRight: '10px' }} />
              <input
                type="email"
                placeholder="hunter@guild.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#fff',
                  outline: 'none',
                  width: '100%',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: isSignUp ? '14px' : '6px' }}>
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
            <div style={getInputContainerStyle('password')}>
              <Lock size={16} color="#ff1a40" style={{ flexShrink: 0, marginRight: '10px' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#fff',
                  outline: 'none',
                  width: '100%',
                  fontSize: '13px',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                }}
              >
                {showPassword ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#64748b" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (Sign Up only) */}
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
                CONFIRM PASSCODE
              </label>
              <div style={getInputContainerStyle('confirmPassword')}>
                <Lock size={16} color="#ff1a40" style={{ flexShrink: 0, marginRight: '10px' }} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#fff',
                    outline: 'none',
                    width: '100%',
                    fontSize: '13px',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#64748b" />}
                </button>
              </div>
            </div>
          )}

          {/* Forgot Password link (Log In only) */}
          {!isSignUp && (
            <div style={{ textAlign: 'right', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(!showForgotPassword);
                  setResetEmail(email);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ff1a40',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontWeight: 600,
                }}
              >
                Forgot passcode?
              </button>
            </div>
          )}

          {/* Sign Up: Affinity Selection Grid */}
          {isSignUp && (
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  color: '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '1px',
                  marginBottom: '8px',
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
                        padding: '10px 4px',
                        borderRadius: '10px',
                        border: isSel ? `1.5px solid ${cfg.color}` : '1px solid #1a233a',
                        backgroundColor: isSel ? 'rgba(255, 26, 64, 0.12)' : '#050814',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease',
                        boxShadow: isSel ? `0 0 12px ${cfg.color}40` : 'none',
                      }}
                    >
                      <span style={{ color: cfg.color, fontWeight: 900, fontSize: '13px' }}>{aff}</span>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>+5</span>
                    </button>
                  );
                })}
              </div>

              {/* Affinity Details Lore Card */}
              <div
                style={{
                  marginTop: '10px',
                  padding: '10px 14px',
                  backgroundColor: '#050814',
                  borderRadius: '10px',
                  borderLeft: `3px solid ${activeAffinity.color}`,
                  borderTop: '1px solid #1a233a',
                  borderRight: '1px solid #1a233a',
                  borderBottom: '1px solid #1a233a',
                }}
              >
                <div style={{ color: activeAffinity.color, fontWeight: 800, fontSize: '12px' }}>
                  {activeAffinity.title}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '3px' }}>
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
              height: '46px',
              padding: '0 16px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#ff1a40',
              color: '#000000',
              fontWeight: 900,
              fontSize: '13px',
              letterSpacing: '1.2px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 0 20px rgba(255, 26, 64, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            {isLoading ? (
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: '2.5px solid #000000',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            ) : (
              <>
                <span>{isSignUp ? 'INITIALIZE HUNTER AWAKENING' : 'ACCESS HUNTER SYSTEM'}</span>
                <ArrowRight size={16} color="#000000" style={{ flexShrink: 0 }} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '18px 0',
            color: '#475569',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '1px',
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: '#1a233a' }} />
          <span style={{ padding: '0 12px' }}>ALTERNATIVE PROTOCOLS</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#1a233a' }} />
        </div>

        {/* Google Authentication Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isLoading}
          style={{
            width: '100%',
            height: '46px',
            padding: '0 16px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            backgroundColor: '#0a0e20',
            color: '#f8fafc',
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '0.5px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '10px',
            transition: 'all 0.18s ease',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 26, 64, 0.5)';
            e.currentTarget.style.backgroundColor = '#0e142c';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            e.currentTarget.style.backgroundColor = '#0a0e20';
          }}
        >
          <svg
            style={{
              width: '18px',
              height: '18px',
              minWidth: '18px',
              minHeight: '18px',
              flexShrink: 0,
              display: 'block',
            }}
            viewBox="0 0 24 24"
            width={18}
            height={18}
          >
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
            height: '46px',
            padding: '0 16px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 26, 64, 0.3)',
            backgroundColor: 'rgba(255, 26, 64, 0.05)',
            color: '#ff1a40',
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '0.5px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#ff1a40';
            e.currentTarget.style.backgroundColor = 'rgba(255, 26, 64, 0.12)';
            e.currentTarget.style.boxShadow = '0 0 16px rgba(255, 26, 64, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 26, 64, 0.3)';
            e.currentTarget.style.backgroundColor = 'rgba(255, 26, 64, 0.05)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <Zap size={16} color="#ff1a40" style={{ flexShrink: 0 }} />
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
                backgroundColor: '#0a0e20',
                borderRadius: '12px',
                border: '1px solid rgba(255, 26, 64, 0.25)',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.6)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <span style={{ color: '#fff', fontWeight: 800, fontSize: '13px', letterSpacing: '0.5px' }}>
                  RECOVER PASSCODE
                </span>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '16px',
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '10px', lineHeight: 1.4 }}>
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
                    backgroundColor: '#050814',
                    border: '1px solid #1a233a',
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
                    padding: '8px 16px',
                    backgroundColor: '#ff1a40',
                    color: '#000000',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '12px',
                    letterSpacing: '0.5px',
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
