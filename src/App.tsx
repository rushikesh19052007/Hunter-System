import React, { useState, useEffect } from 'react';
import { HunterProvider, useHunter } from '@/lib/hunter-store';
import { SystemAwakening } from '@/routes/onboarding/system-awakening';
import { HunterHub } from '@/routes/dashboard/hunter-hub';
import {
  subscribeToNotifications,
  type HunterNotification,
} from '@/lib/notifications';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Bell, X, ShieldAlert } from 'lucide-react';
import './index.css';

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

// Route Controller handling navigation between Onboarding and Hub
const HunterAppContent: React.FC = () => {
  const { isOnboarded } = useHunter();
  const [currentRoute, setCurrentRoute] = useState<'onboarding' | 'dashboard'>(() => {
    // If user has already awakened, route to dashboard, else onboarding
    return isOnboarded ? 'dashboard' : 'onboarding';
  });

  // Keep route synced if profile changes
  useEffect(() => {
    if (isOnboarded && currentRoute === 'onboarding') {
      setCurrentRoute('dashboard');
    } else if (!isOnboarded && currentRoute === 'dashboard') {
      setCurrentRoute('onboarding');
    }
  }, [isOnboarded]);

  return (
    <div className="hunter-system-app">
      <SystemNotificationOverlay />

      <AnimatePresence mode="wait">
        {currentRoute === 'onboarding' ? (
          <motion.div
            key="onboarding-route"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <SystemAwakening onComplete={() => setCurrentRoute('dashboard')} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard-route"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <HunterHub onReplayAwakening={() => setCurrentRoute('onboarding')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function App() {
  return (
    <HunterProvider>
      <HunterAppContent />
    </HunterProvider>
  );
}

export default App;
