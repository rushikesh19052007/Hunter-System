import React, { useState, useEffect } from 'react';
import { HunterProvider, useHunter } from '@/lib/hunter-store';
import { AuthProvider, useAuth } from '@/lib/auth';
import { HunterAuthScreen } from '@/components/hunter-auth-screen';
import { SystemAwakening } from '@/routes/onboarding/system-awakening';
import { HunterHub } from '@/routes/dashboard/hunter-hub';
import { ProfilePage } from '@/routes/dashboard/profile-page';
import { StatAllocationPage } from '@/routes/dashboard/stat-allocation-page';
import { AccountSettingsPage } from '@/routes/dashboard/account-settings-page';
import { Leaderboard } from '@/components/leaderboard';
import {
  subscribeToNotifications,
  type HunterNotification,
} from '@/lib/notifications';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  CheckCircle,
  Bell,
  X,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import { NotificationCenterModal } from '@/components/notification-center-modal';
import { SystemSettingsModal } from '@/components/system-settings-modal';
import { LevelUpDialog } from '@/components/level-up-dialog';
import './index.css';
import './App.css';

// ============================================================
// SYSTEM ERROR BOUNDARY
// Prevents blank screens on any unexpected client runtime exception
// ============================================================
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class SystemErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[System Error Boundary Intercepted]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: '#040714',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: "'Inter', sans-serif",
            textAlign: 'center',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              padding: '32px 24px',
              backgroundColor: '#0a0e20',
              borderRadius: '16px',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              boxShadow: '0 0 30px rgba(239, 68, 68, 0.2)',
            }}
          >
            <div
              style={{
                color: '#ef4444',
                fontSize: '13px',
                fontWeight: 900,
                letterSpacing: '2px',
                marginBottom: '10px',
                textTransform: 'uppercase',
              }}
            >
              [SYSTEM ANOMALY DETECTED]
            </div>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px', lineHeight: 1.5 }}>
              The Hunter Interface encountered an unexpected state error:
              <br />
              <code
                style={{
                  color: '#f87171',
                  fontSize: '11px',
                  display: 'inline-block',
                  marginTop: '8px',
                  backgroundColor: '#050814',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #1f293d',
                }}
              >
                {this.state.error?.message || 'Unknown runtime error'}
              </code>
            </p>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem('local_hunter_profile');
                } catch {}
                window.location.reload();
              }}
              style={{
                padding: '12px 24px',
                backgroundColor: '#00e5ff',
                color: '#040714',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '12px',
                letterSpacing: '1px',
                cursor: 'pointer',
              }}
            >
              REBOOT HUNTER SYSTEM
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// In-App Notification Toast Overlay
const SystemNotificationOverlay: React.FC = () => {
  const [activeToasts, setActiveToasts] = useState<HunterNotification[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToNotifications((notification) => {
      setActiveToasts((prev) => [notification, ...prev.slice(0, 3)]);

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setActiveToasts((current) => current.filter((t) => t.id !== notification.id));
      }, 6000);
    });

    return unsubscribe;
  }, []);

  const dismissToast = (id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="system-toast-container">
      <AnimatePresence>
        {activeToasts.map((toast) => {
          const isUrgent = toast.priority === 'urgent' || toast.priority === 'high';
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className={`system-toast-card ${isUrgent ? 'urgent' : ''}`}
            >
              <div className="toast-icon-side">
                {toast.category === 'level_up' || toast.category === 'quest' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : isUrgent ? (
                  <ShieldAlert className="w-5 h-5 text-amber-400 animate-pulse" />
                ) : (
                  <Bell className="w-5 h-5 text-cyan-400" />
                )}
              </div>

              <div className="toast-body">
                <div className="toast-header-line">
                  <span className="toast-system-tag">[SYSTEM TRANSMISSION]</span>
                  <span className="toast-title">{toast.title}</span>
                </div>
                <p className="toast-message">{toast.message}</p>
              </div>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="toast-close-btn"
                title="Dismiss"
              >
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// Route and Tab Controller
const HunterAppContent: React.FC = () => {
  const {
    profile,
    isLoading: isHunterLoading,
    showLevelUpModal,
    leveledUpTo,
    newRankAchieved,
    dismissLevelUpModal,
  } = useHunter();
  const { logout } = useAuth();

  const [replayAwakening, setReplayAwakening] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stats' | 'profile' | 'leaderboard' | 'settings'>('dashboard');
  const [showNotifCenter, setShowNotifCenter] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('hunter_theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  // Apply theme class to document body
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    try {
      localStorage.setItem('hunter_theme', theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // While Firestore data is initially synchronizing and no profile cached
  if (isHunterLoading && !profile) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#040714',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#00e5ff',
          fontFamily: "'Orbitron', 'Inter', sans-serif",
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '3px solid rgba(0, 229, 255, 0.2)',
            borderTopColor: '#00e5ff',
            animation: 'spin 1s linear infinite',
          }}
        />
        <div style={{ letterSpacing: '2px', fontWeight: 800, fontSize: '13px' }}>
          SYNCHRONIZING HUNTER DATABASE...
        </div>
      </div>
    );
  }

  // Determine if in awakening sequence (only if no profile exists or user requested replay)
  const isAwakening = !profile || replayAwakening;

  return (
    <div className="hunter-system-app">
      <SystemNotificationOverlay />

      {/* Top Application Header when user has awakened */}
      {!isAwakening && (
        <header className="app-main-header">
          <div className="app-header-left">
            <div className="app-brand">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-spin-slow" />
              <span className="brand-text">HUNTER SYSTEM</span>
              {profile?.current_rank && (
                <span className="header-rank-tag">{profile.current_rank}</span>
              )}
            </div>

            {/* Navigation Tabs */}
            <nav className="header-nav-tabs" aria-label="Main Navigation">
              <button
                type="button"
                id="nav-tab-dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`header-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                aria-current={activeTab === 'dashboard' ? 'page' : undefined}
              >
                <LayoutDashboard className="w-4 h-4 mr-1.5" />
                <span>DASHBOARD</span>
              </button>

              <button
                type="button"
                id="nav-tab-stats"
                onClick={() => setActiveTab('stats')}
                className={`header-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
                aria-current={activeTab === 'stats' ? 'page' : undefined}
              >
                <Sparkles className="w-4 h-4 mr-1.5 text-cyan-400" />
                <span>STATS</span>
              </button>

              <button
                type="button"
                id="nav-tab-profile"
                onClick={() => setActiveTab('profile')}
                className={`header-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                aria-current={activeTab === 'profile' ? 'page' : undefined}
              >
                <Sparkles className="w-4 h-4 mr-1.5 text-amber-400" />
                <span>PROFILE</span>
              </button>

              <button
                type="button"
                id="nav-tab-leaderboard"
                onClick={() => setActiveTab('leaderboard')}
                className={`header-tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
                aria-current={activeTab === 'leaderboard' ? 'page' : undefined}
              >
                <Sparkles className="w-4 h-4 mr-1.5 text-pink-400" />
                <span>LEADERBOARD</span>
              </button>

              <button
                type="button"
                id="nav-tab-settings"
                onClick={() => setActiveTab('settings')}
                className={`header-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                aria-current={activeTab === 'settings' ? 'page' : undefined}
              >
                <Settings className="w-4 h-4 mr-1.5 text-slate-300" />
                <span>SETTINGS</span>
              </button>
            </nav>
          </div>

          <div className="app-header-right">
            {/* System Logs Trigger */}
            <button
              type="button"
              id="btn-header-notifications"
              onClick={() => setShowNotifCenter(true)}
              className="btn-header-action"
              title="System Transmissions Archive"
              aria-label="Transmissions"
            >
              <Bell className="w-4 h-4 text-cyan-400" />
              <span className="hidden-mobile">LOGS</span>
            </button>

            {/* System Settings */}
            <button
              type="button"
              id="btn-header-settings"
              onClick={() => setShowSettings(true)}
              className="btn-header-action"
              title="System Control Panel & Audio"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4 text-slate-300" />
              <span className="hidden-mobile">SETTINGS</span>
            </button>

            {/* Theme Toggle (Light / Dark) */}
            <button
              type="button"
              id="btn-header-theme"
              onClick={toggleTheme}
              className="btn-header-action"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-cyan-500" />
              )}
              <span className="hidden-mobile">{theme === 'dark' ? 'LIGHT' : 'DARK'}</span>
            </button>

            {/* Logout Button */}
            <button
              type="button"
              id="btn-logout"
              onClick={logout}
              className="btn-header-action logout"
              title="Log Out Session"
              aria-label="Log Out"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span className="hidden-mobile">LOGOUT</span>
            </button>
          </div>
        </header>
      )}

      {/* Main View Transition */}
      <main className="app-main-body">
        <AnimatePresence mode="wait">
          {isAwakening ? (
            <motion.div
              key="onboarding-route"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <SystemAwakening onComplete={() => setReplayAwakening(false)} />
            </motion.div>
          ) : activeTab === 'dashboard' ? (
            <motion.div
              key="dashboard-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <HunterHub onReplayAwakening={() => setReplayAwakening(true)} />
            </motion.div>
          ) : activeTab === 'stats' ? (
            <motion.div
              key="stats-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <StatAllocationPage />
            </motion.div>
          ) : activeTab === 'profile' ? (
            <motion.div
              key="profile-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ProfilePage />
            </motion.div>
          ) : activeTab === 'leaderboard' ? (
            <motion.div
              key="leaderboard-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Leaderboard />
            </motion.div>
          ) : (
            <motion.div
              key="settings-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AccountSettingsPage />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Notification Center Modal */}
      <AnimatePresence>
        {showNotifCenter && (
          <NotificationCenterModal onClose={() => setShowNotifCenter(false)} />
        )}
      </AnimatePresence>

      {/* System Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <SystemSettingsModal
            onClose={() => setShowSettings(false)}
            onReplayAwakening={() => setReplayAwakening(true)}
          />
        )}
      </AnimatePresence>

      {/* Level Up Celebration Dialog */}
      <AnimatePresence>
        {showLevelUpModal && (
          <LevelUpDialog
            newLevel={leveledUpTo}
            newRank={newRankAchieved}
            onDismiss={dismissLevelUpModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Top-level Auth Barrier
const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#040714',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#00e5ff',
          fontFamily: "'Orbitron', 'Inter', sans-serif",
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '3px solid rgba(0, 229, 255, 0.2)',
            borderTopColor: '#00e5ff',
            animation: 'spin 1s linear infinite',
          }}
        />
        <div style={{ letterSpacing: '2px', fontWeight: 800, fontSize: '13px' }}>
          INITIALIZING HUNTER SYSTEM...
        </div>
      </div>
    );
  }

  if (!user) {
    return <HunterAuthScreen />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <SystemErrorBoundary>
      <AuthProvider>
        <AuthGate>
          <HunterProvider>
            <HunterAppContent />
          </HunterProvider>
        </AuthGate>
      </AuthProvider>
    </SystemErrorBoundary>
  );
}

export default App;
