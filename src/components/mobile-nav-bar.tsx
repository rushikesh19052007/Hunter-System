import React from 'react';
import {
  LayoutDashboard,
  Shield,
  Users,
  Trophy,
  Award,
  Settings,
} from 'lucide-react';

export type AppTab = 'dashboard' | 'guilds' | 'friends' | 'leaderboard' | 'stats' | 'profile' | 'settings';

interface MobileNavBarProps {
  activeTab: string;
  onSelectTab: (tab: AppTab) => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({ activeTab, onSelectTab }) => {
  const navItems: Array<{ id: AppTab; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'HUB', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'guilds', label: 'GUILDS', icon: <Shield className="w-5 h-5" /> },
    { id: 'friends', label: 'FRIENDS', icon: <Users className="w-5 h-5" /> },
    { id: 'leaderboard', label: 'LEADERBOARD', icon: <Trophy className="w-5 h-5" /> },
    { id: 'profile', label: 'PROFILE', icon: <Award className="w-5 h-5" /> },
    { id: 'settings', label: 'SETTINGS', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <nav
      className="hunter-system-bottom-nav"
      aria-label="Primary Navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '66px',
        backgroundColor: 'var(--bg-core)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -8px 30px rgba(0, 0, 0, 0.95)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '780px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '0 12px',
        }}
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id || (item.id === 'profile' && activeTab === 'stats');
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
                color: isActive ? '#ff1a40' : '#64748b',
                cursor: 'pointer',
                padding: '6px 12px',
                minWidth: '56px',
                minHeight: '52px',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              {item.icon}
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: isActive ? 900 : 700,
                  letterSpacing: '0.9px',
                  marginTop: '4px',
                  fontFamily: "'Rajdhani', sans-serif",
                }}
              >
                {item.label}
              </span>
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    width: '28px',
                    height: '3px',
                    backgroundColor: '#ff1a40',
                    boxShadow: '0 0 10px #ff1a40',
                    borderRadius: '3px',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

