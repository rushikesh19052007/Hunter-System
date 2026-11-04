import React from 'react';
import {
  LayoutDashboard,
  Shield,
  Users,
  Sparkles,
  Award,
  Settings,
} from 'lucide-react';

export type AppTab = 'dashboard' | 'guilds' | 'friends' | 'leaderboard' | 'stats' | 'profile' | 'settings';

interface MobileNavBarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({ activeTab, onSelectTab }) => {
  const navItems: Array<{ id: AppTab; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'HUB', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'guilds', label: 'GUILDS', icon: <Shield className="w-5 h-5" /> },
    { id: 'friends', label: 'FRIENDS', icon: <Users className="w-5 h-5" /> },
    { id: 'stats', label: 'STATS', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'profile', label: 'PROFILE', icon: <Award className="w-5 h-5" /> },
    { id: 'settings', label: 'SETTINGS', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <nav
      className="mobile-bottom-nav md:hidden"
      aria-label="Mobile Navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '62px',
        backgroundColor: 'rgba(6, 9, 18, 0.94)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(0, 229, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.6)',
      }}
    >
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.id)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              color: isActive ? '#00e5ff' : '#64748b',
              cursor: 'pointer',
              padding: '6px 8px',
              minWidth: '48px',
              minHeight: '48px',
              transition: 'all 0.2s ease',
              position: 'relative',
            }}
          >
            {item.icon}
            <span
              style={{
                fontSize: '9px',
                fontWeight: isActive ? 900 : 700,
                letterSpacing: '0.8px',
                marginTop: '3px',
                fontFamily: "'Rajdhani', sans-serif",
              }}
            >
              {item.label}
            </span>
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  top: '0px',
                  width: '20px',
                  height: '2px',
                  backgroundColor: '#00e5ff',
                  boxShadow: '0 0 8px #00e5ff',
                  borderRadius: '2px',
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};

