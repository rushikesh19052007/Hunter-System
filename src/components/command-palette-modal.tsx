import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  LayoutDashboard,
  Shield,
  Users,
  Sparkles,
  Award,
  Settings,
  Clock,
  Target,
  Globe,
  FileText,
  Sun,
  Moon,
  Plus,
  X,
  Compass,
} from 'lucide-react';
import { type AppTab } from './mobile-nav-bar';

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Directives' | 'Productivity' | 'System';
  icon: React.ReactNode;
  action: () => void;
}

interface CommandPaletteModalProps {
  onClose: () => void;
  onSelectTab: (tab: AppTab) => void;
  onOpenCreateQuest: () => void;
  onOpenFocusChamber: () => void;
  onOpenGoalBuilder: () => void;
  onOpenWorldMap: () => void;
  onOpenWeeklyReport: () => void;
  onOpenTimeCapsule: () => void;
  toggleTheme: () => void;
  currentTheme: 'dark' | 'light';
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  onClose,
  onSelectTab,
  onOpenCreateQuest,
  onOpenFocusChamber,
  onOpenGoalBuilder,
  onOpenWorldMap,
  onOpenWeeklyReport,
  onOpenTimeCapsule,
  toggleTheme,
  currentTheme,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    {
      id: 'nav-dashboard',
      title: 'Go to Hunter Hub (Dashboard)',
      category: 'Navigation',
      icon: <LayoutDashboard className="w-4 h-4 text-cyan-400" />,
      action: () => { onSelectTab('dashboard'); onClose(); },
    },
    {
      id: 'nav-guilds',
      title: 'Go to Guild Headquarters',
      category: 'Navigation',
      icon: <Shield className="w-4 h-4 text-purple-400" />,
      action: () => { onSelectTab('guilds'); onClose(); },
    },
    {
      id: 'nav-friends',
      title: 'Go to Hunter Squad (Friends)',
      category: 'Navigation',
      icon: <Users className="w-4 h-4 text-cyan-400" />,
      action: () => { onSelectTab('friends'); onClose(); },
    },
    {
      id: 'nav-stats',
      title: 'Stat Allocation Matrix',
      category: 'Navigation',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      action: () => { onSelectTab('stats'); onClose(); },
    },
    {
      id: 'nav-profile',
      title: 'Hunter Profile & Records',
      category: 'Navigation',
      icon: <Award className="w-4 h-4 text-pink-400" />,
      action: () => { onSelectTab('profile'); onClose(); },
    },
    {
      id: 'nav-leaderboard',
      title: 'Global Hunter Leaderboard',
      category: 'Navigation',
      icon: <Sparkles className="w-4 h-4 text-pink-400" />,
      action: () => { onSelectTab('leaderboard'); onClose(); },
    },
    {
      id: 'nav-settings',
      title: 'System Settings & Security',
      category: 'Navigation',
      icon: <Settings className="w-4 h-4 text-slate-400" />,
      action: () => { onSelectTab('settings'); onClose(); },
    },
    {
      id: 'act-create-quest',
      title: 'Create Custom Directive / Quest',
      category: 'Directives',
      icon: <Plus className="w-4 h-4 text-emerald-400" />,
      action: () => { onOpenCreateQuest(); onClose(); },
    },
    {
      id: 'act-goal-builder',
      title: 'Smart Goal-to-Mission Breakdown Builder',
      category: 'Directives',
      icon: <Target className="w-4 h-4 text-cyan-400" />,
      action: () => { onOpenGoalBuilder(); onClose(); },
    },
    {
      id: 'act-focus',
      title: 'Enter Focus Chamber (Pomodoro Session)',
      category: 'Productivity',
      icon: <Clock className="w-4 h-4 text-cyan-400" />,
      action: () => { onOpenFocusChamber(); onClose(); },
    },
    {
      id: 'act-world-map',
      title: 'Open Living World Map & HQ',
      category: 'Productivity',
      icon: <Globe className="w-4 h-4 text-purple-400" />,
      action: () => { onOpenWorldMap(); onClose(); },
    },
    {
      id: 'act-weekly-report',
      title: 'View Weekly Hunter Debrief Report',
      category: 'Productivity',
      icon: <FileText className="w-4 h-4 text-amber-400" />,
      action: () => { onOpenWeeklyReport(); onClose(); },
    },
    {
      id: 'act-time-capsule',
      title: 'Write Future Time Capsule',
      category: 'Productivity',
      icon: <Compass className="w-4 h-4 text-indigo-400" />,
      action: () => { onOpenTimeCapsule(); onClose(); },
    },
    {
      id: 'act-theme',
      title: `Toggle Theme (Currently ${currentTheme.toUpperCase()})`,
      category: 'System',
      icon: currentTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />,
      action: () => { toggleTheme(); onClose(); },
    },
  ];

  const filtered = commands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filtered, selectedIndex, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        backgroundColor: 'rgba(4, 7, 20, 0.85)',
        backdropFilter: 'blur(10px)',
        paddingLeft: '16px',
        paddingRight: '16px',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: -20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#090d1f',
          borderRadius: '16px',
          border: '1.5px solid rgba(0, 229, 255, 0.35)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 229, 255, 0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Search input header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '14px 18px',
            borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
            gap: '12px',
          }}
        >
          <Search style={{ width: '18px', height: '18px', color: '#00e5ff' }} />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type directive or jump to tab... (ESC to exit)"
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f8fafc',
              fontSize: '14px',
              fontFamily: "'Inter', sans-serif",
            }}
          />
          <span
            style={{
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              color: '#94a3b8',
              letterSpacing: '1px',
            }}
          >
            ESC
          </span>
        </div>

        {/* Results list */}
        <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '8px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              No directives match &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? 'rgba(0, 229, 255, 0.12)' : 'transparent',
                    border: isSelected ? '1px solid rgba(0, 229, 255, 0.3)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
                      {item.icon}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: isSelected ? 800 : 600, color: isSelected ? '#00e5ff' : '#e2e8f0' }}>
                      {item.title}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                    }}
                  >
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div
          style={{
            padding: '8px 18px',
            backgroundColor: 'rgba(6, 9, 18, 0.8)',
            borderTop: '1px solid rgba(56, 189, 248, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#64748b',
            fontWeight: 700,
          }}
        >
          <span>↑↓ to navigate</span>
          <span>↵ to execute</span>
        </div>
      </motion.div>
    </div>
  );
};
