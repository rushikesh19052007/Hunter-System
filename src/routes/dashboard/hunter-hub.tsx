import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Zap,
  Flame,
  Brain,
  Eye,
  Award,
  CheckCircle,
  PlusCircle,
  RotateCcw,
  Sparkles,
  Bell,
  Clock,
  Target,
  ChevronRight,
  TrendingUp,
  Sliders,
} from 'lucide-react';
import { useHunter } from '@/lib/hunter-store';
import {
  HUNTER_STATS,
  type HunterStat,
  getXpProgress,
  getRankBadgeInfo,
  DIFFICULTY_XP,
} from '@/lib/game-engine';
import {
  getNotificationLogs,
  scheduleNotification,
  playSystemChime,
} from '@/lib/notifications';

interface HunterHubProps {
  onReplayAwakening: () => void;
}

export const HunterHub: React.FC<HunterHubProps> = ({ onReplayAwakening }) => {
  const {
    profile,
    quests,
    completeQuest,
    incrementProgress,
    allocateStatPoint,
    resetHunter,
  } = useHunter();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showLogsModal, setShowLogsModal] = useState<boolean>(false);

  if (!profile) {
    return null;
  }

  const xpMeta = getXpProgress(profile.total_xp);
  const rankInfo = getRankBadgeInfo(profile.current_rank);
  const notificationLogs = getNotificationLogs();

  const filteredQuests = quests.filter((q) => {
    if (activeCategory === 'all') return true;
    return q.category === activeCategory;
  });

  const completedCount = quests.filter((q) => q.completed).length;

  const statIcons: Record<HunterStat, React.ReactNode> = {
    STR: <Flame className="w-5 h-5 text-red-500" />,
    AGI: <Zap className="w-5 h-5 text-cyan-400" />,
    VIT: <Shield className="w-5 h-5 text-emerald-400" />,
    INT: <Brain className="w-5 h-5 text-purple-400" />,
    PERC: <Eye className="w-5 h-5 text-amber-400" />,
  };

  const handleTestNotification = () => {
    scheduleNotification({
      title: 'DUNGEON BREAK DETECTED',
      message: 'A red gate has manifested nearby. Prepare your hunter party.',
      priority: 'urgent',
      category: 'warning',
      playSound: true,
    });
  };

  return (
    <div className="hub-container">
      {/* Background Ambience */}
      <div className="hub-bg-mesh" />

      {/* Top Navigation */}
      <header className="hub-header">
        <div className="hub-brand">
          <Sparkles className="w-6 h-6 text-cyan-400 animate-spin-slow" />
          <span className="brand-title">HUNTER SYSTEM // ARCHITECT INTERFACE</span>
        </div>

        <div className="hub-header-actions">
          <button
            type="button"
            onClick={handleTestNotification}
            className="btn-header-action"
            title="Trigger System Ping"
          >
            <Bell className="w-4 h-4 text-cyan-300" />
            <span>SYSTEM PING</span>
          </button>

          <button
            type="button"
            onClick={() => setShowLogsModal(true)}
            className="btn-header-action"
          >
            <Clock className="w-4 h-4 text-slate-300" />
            <span>LOGS ({notificationLogs.length})</span>
          </button>

          <button
            type="button"
            onClick={onReplayAwakening}
            className="btn-header-action accent"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>REPLAY AWAKENING</span>
          </button>
        </div>
      </header>

      {/* Main Grid: Left Status Window, Right Quest Board */}
      <div className="hub-layout-grid">
        {/* Left Column: Player Status Window */}
        <aside className="hub-profile-panel">
          <div className="status-window-card">
            {/* Hunter Title & Rank Badge */}
            <div className="status-header">
              <div className="hunter-identity">
                <span className="system-subtitle">AWAKENED HUNTER</span>
                <h1 className="hunter-name">{profile.display_name}</h1>
                <span className="hunter-id">ID: {profile.id}</span>
              </div>

              <div
                className="rank-badge-display"
                style={{ borderColor: rankInfo.color, color: rankInfo.color }}
              >
                {rankInfo.label}
              </div>
            </div>

            {/* Level & XP Gauge */}
            <div className="level-xp-container">
              <div className="level-row">
                <div className="level-tag">
                  LEVEL <span className="level-num">{profile.current_level}</span>
                </div>
                <div className="xp-details">
                  <span>{xpMeta.currentProgressXp} / {xpMeta.xpNeededForNext} XP</span>
                  <span className="xp-pct">({xpMeta.percentage}%)</span>
                </div>
              </div>

              <div className="xp-progress-bar">
                <motion.div
                  className="xp-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpMeta.percentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <div className="xp-lifetime">Cumulative Lifetime XP: {profile.total_xp}</div>
            </div>

            {/* Simulated HP / MP Gauges */}
            <div className="vital-gauges">
              <div className="vital-bar hp">
                <div className="vital-label">
                  <span>HP</span>
                  <span>100% [RESTORED]</span>
                </div>
                <div className="vital-track">
                  <div className="vital-fill hp-fill" />
                </div>
              </div>
              <div className="vital-bar mp">
                <div className="vital-label">
                  <span>MANA</span>
                  <span>100% [AWAKENED]</span>
                </div>
                <div className="vital-track">
                  <div className="vital-fill mp-fill" />
                </div>
              </div>
            </div>

            {/* Hunter Attributes Window */}
            <div className="stats-section">
              <div className="section-title-row">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h3>ATTRIBUTES & STATS</h3>
              </div>

              <div className="stats-list">
                {(Object.keys(HUNTER_STATS) as HunterStat[]).map((statKey) => {
                  const statDef = HUNTER_STATS[statKey];
                  const value = profile.stats[statKey] || 10;

                  return (
                    <div key={statKey} className="stat-row-item">
                      <div className="stat-left">
                        <div className="stat-icon-wrapper">{statIcons[statKey]}</div>
                        <div>
                          <span className="stat-code" style={{ color: statDef.color }}>
                            {statDef.code}
                          </span>
                          <span className="stat-subname">({statDef.name})</span>
                        </div>
                      </div>

                      <div className="stat-right">
                        <span className="stat-val">{value}</span>
                        <button
                          type="button"
                          onClick={() => {
                            allocateStatPoint(statKey, 1);
                            playSystemChime('quest');
                          }}
                          className="btn-stat-plus"
                          title="Allocate Stat Point"
                        >
                          +1
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Streak & Achievements Counter */}
            <div className="quick-metrics-row">
              <div className="metric-box">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <div className="metric-val">{profile.clean_days} DAYS</div>
                <div className="metric-sub">DISCIPLINE STREAK</div>
              </div>
              <div className="metric-box">
                <Target className="w-4 h-4 text-cyan-400" />
                <div className="metric-val">{completedCount} / {quests.length}</div>
                <div className="metric-sub">TRIALS CLEARED</div>
              </div>
            </div>

            <div className="status-footer">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Initiate System Reboot? This will reset your profile and restart the Awakening sequence.')) {
                    resetHunter();
                    onReplayAwakening();
                  }
                }}
                className="btn-reboot"
              >
                SYSTEM REBOOT / FULL RESET
              </button>
            </div>
          </div>
        </aside>

        {/* Right Column: Quest Board */}
        <section className="hub-quest-panel">
          <div className="quest-board-header">
            <div className="quest-header-title">
              <Award className="w-6 h-6 text-amber-400" />
              <h2>SYSTEM QUEST BOARD</h2>
              <span className="quest-count-tag">{filteredQuests.length} ACTIVE TRIALS</span>
            </div>

            {/* Category Filter Tabs */}
            <div className="category-tabs">
              {[
                { id: 'all', label: 'ALL QUESTS' },
                { id: 'fitness', label: 'FITNESS' },
                { id: 'learning', label: 'LEARNING' },
                { id: 'health', label: 'HEALTH' },
                { id: 'productivity', label: 'PRODUCTIVITY' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id)}
                  className={`category-tab-btn ${activeCategory === tab.id ? 'active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quests List */}
          <div className="quests-grid">
            <AnimatePresence>
              {filteredQuests.map((quest) => {
                const isDone = quest.completed;
                const xpGain = quest.xp_reward || DIFFICULTY_XP[quest.difficulty] || 20;
                const progressPct = Math.min(100, Math.round((quest.progress / quest.target) * 100));

                return (
                  <motion.div
                    key={quest.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`quest-card ${isDone ? 'completed-card' : ''}`}
                  >
                    <div className="quest-top-meta">
                      <span className={`quest-category-badge ${quest.category || 'general'}`}>
                        {(quest.category || 'QUEST').toUpperCase()}
                      </span>
                      <div className="quest-diff-stars">
                        {'★'.repeat(quest.difficulty)}
                        <span className="diff-val">DIFF {quest.difficulty}</span>
                      </div>
                      <span className="quest-xp-tag">+{xpGain} XP</span>
                    </div>

                    <h3 className="quest-name">{quest.name}</h3>
                    <p className="quest-desc">{quest.description}</p>

                    <div className="quest-progress-section">
                      <div className="progress-labels">
                        <span>PROGRESS</span>
                        <span>
                          {quest.progress} / {quest.target} ({progressPct}%)
                        </span>
                      </div>
                      <div className="quest-track">
                        <div
                          className="quest-fill"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="quest-actions-row">
                      <span className="stat-reward-hint">REWARD: +{quest.difficulty} {quest.stat}</span>

                      {isDone ? (
                        <div className="cleared-pill">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>QUEST CLEARED</span>
                        </div>
                      ) : (
                        <div className="action-buttons-group">
                          <button
                            type="button"
                            onClick={() => {
                              const stepIncrement = Math.max(1, Math.round(quest.target / 5));
                              incrementProgress(quest.id, stepIncrement);
                              playSystemChime('quest');
                            }}
                            className="btn-advance-progress"
                          >
                            <PlusCircle className="w-4 h-4 mr-1" />
                            <span>STEP</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => completeQuest(quest.id)}
                            className="btn-complete-instant"
                          >
                            <span>CLEAR</span>
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </section>
      </div>

      {/* Notification Logs Modal */}
      {showLogsModal && (
        <div className="modal-backdrop" onClick={() => setShowLogsModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>SYSTEM TRANSMISSION ARCHIVE</h3>
              <button
                type="button"
                onClick={() => setShowLogsModal(false)}
                className="btn-modal-close"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {notificationLogs.length === 0 ? (
                <p className="empty-logs">No system communications recorded yet.</p>
              ) : (
                <div className="logs-list">
                  {notificationLogs.map((log) => (
                    <div key={log.id} className={`log-entry ${log.priority}`}>
                      <div className="log-top">
                        <span className="log-title">{log.title}</span>
                        <span className="log-time">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="log-msg">{log.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HunterHub;
