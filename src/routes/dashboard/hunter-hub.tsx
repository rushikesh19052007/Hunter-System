import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Zap, Flame, Brain, Eye, Award, CheckCircle, PlusCircle,
  RotateCcw, Sparkles, Clock, Target, ChevronRight, TrendingUp,
  Sliders, Heart, Droplets, AlertTriangle, Star, Plus, X, BookOpen,
  Dumbbell, Code, GraduationCap, Lightbulb, Activity, Skull,
  Gift, Trophy, ChevronDown, ChevronUp, Scroll,
} from 'lucide-react';
import { useHunter } from '@/lib/hunter-store';
import {
  HUNTER_STATS,
  type HunterStat,
  getXpProgress,
  getRankBadgeInfo,
  DIFFICULTY_XP,
  DIFFICULTY_STAT_XP,
  getDifficultyColor,
  getDifficultyStars,
  getCategoryLabel,
  getStatXpType,
  type QuestCategory,
  type DifficultyGrade,
  type Quest,
} from '@/lib/game-engine';
import { getNotificationLogs, scheduleNotification, playSystemChime } from '@/lib/notifications';
import { ACHIEVEMENTS } from '@/lib/achievements';

interface HunterHubProps {
  onReplayAwakening: () => void;
}

// ============================================================
// CATEGORY FILTER CONFIG
// ============================================================

const CATEGORY_TABS = [
  { id: 'all', label: 'ALL', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'physical', label: 'PHYSICAL', icon: <Dumbbell className="w-3.5 h-3.5" /> },
  { id: 'fitness', label: 'FITNESS', icon: <Activity className="w-3.5 h-3.5" /> },
  { id: 'coding', label: 'CODING', icon: <Code className="w-3.5 h-3.5" /> },
  { id: 'study', label: 'STUDY', icon: <GraduationCap className="w-3.5 h-3.5" /> },
  { id: 'knowledge', label: 'KNOWLEDGE', icon: <Lightbulb className="w-3.5 h-3.5" /> },
  { id: 'mental', label: 'MENTAL', icon: <Brain className="w-3.5 h-3.5" /> },
  { id: 'health', label: 'HEALTH', icon: <Heart className="w-3.5 h-3.5" /> },
  { id: 'discipline', label: 'DISCIPLINE', icon: <Shield className="w-3.5 h-3.5" /> },
  { id: 'productivity', label: 'PRODUCTIVITY', icon: <Target className="w-3.5 h-3.5" /> },
];

// ============================================================
// CUSTOM QUEST MODAL
// ============================================================

const CUSTOM_CATEGORIES: QuestCategory[] = [
  'physical', 'mental', 'knowledge', 'coding', 'study', 'health',
  'discipline', 'productivity', 'social', 'creative', 'personal_development', 'custom'
];

const CUSTOM_DIFFICULTIES: DifficultyGrade[] = ['E', 'D', 'C', 'B', 'A', 'S'];

const MAX_XP_BY_RANK: Record<string, number> = {
  'E-Rank': 50, 'D-Rank': 100, 'C-Rank': 200, 'B-Rank': 350, 'A-Rank': 500, 'S-Rank': 1000,
};

interface CustomQuestModalProps {
  onClose: () => void;
  rank: string;
}

const CustomQuestModal: React.FC<CustomQuestModalProps> = ({ onClose, rank }) => {
  const { addCustomQuest } = useHunter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<QuestCategory>('physical');
  const [difficulty, setDifficulty] = useState<DifficultyGrade>('E');
  const [stat, setStat] = useState<HunterStat>('STR');
  const [target, setTarget] = useState(1);
  const [unit, setUnit] = useState('reps');

  const maxXp = MAX_XP_BY_RANK[rank] || 50;
  const baseXp = Math.min(DIFFICULTY_XP[difficulty] || 15, maxXp);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addCustomQuest({
      name: name.trim(),
      description: description.trim(),
      category,
      difficulty,
      stat,
      target,
      xp_reward: baseXp,
      stat_xp_reward: DIFFICULTY_STAT_XP[difficulty] || 10,
      stat_xp_type: getStatXpType(category),
      quest_type: 'normal',
      repeatable: 'always',
    });
    playSystemChime('quest');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div
        className="modal-card quest-creator-modal"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
      >
        <div className="modal-header">
          <div className="modal-title-row">
            <Plus className="w-5 h-5 text-cyan-400" />
            <h3>CREATE CUSTOM QUEST</h3>
          </div>
          <button type="button" onClick={onClose} className="btn-modal-close"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="quest-creator-form">
          <div className="form-group">
            <label className="form-label">QUEST NAME <span className="text-rose-400">*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Morning Run"
              className="system-text-input"
              maxLength={60}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">DESCRIPTION</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What exactly does this quest involve?"
              className="system-text-input"
              rows={2}
              maxLength={200}
            />
          </div>

          <div className="form-row-two">
            <div className="form-group">
              <label className="form-label">CATEGORY</label>
              <select value={category} onChange={e => setCategory(e.target.value as QuestCategory)} className="system-text-input">
                {CUSTOM_CATEGORIES.map(c => (
                  <option key={c} value={c}>{getCategoryLabel(c)}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">DIFFICULTY</label>
              <div className="diff-selector">
                {CUSTOM_DIFFICULTIES.map(d => (
                  <button
                    key={d} type="button"
                    onClick={() => setDifficulty(d)}
                    className={`diff-btn ${difficulty === d ? 'selected' : ''}`}
                    style={difficulty === d ? { borderColor: getDifficultyColor(d), color: getDifficultyColor(d) } : {}}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-row-two">
            <div className="form-group">
              <label className="form-label">PRIMARY STAT</label>
              <select value={stat} onChange={e => setStat(e.target.value as HunterStat)} className="system-text-input">
                {Object.keys(HUNTER_STATS).map(s => (
                  <option key={s} value={s}>{s} — {HUNTER_STATS[s as HunterStat].name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">TARGET / UNIT</label>
              <div className="target-unit-row">
                <input
                  type="number"
                  min={1} max={9999}
                  value={target}
                  onChange={e => setTarget(Number(e.target.value))}
                  className="system-text-input target-input"
                />
                <input
                  type="text"
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  placeholder="reps"
                  className="system-text-input unit-input"
                  maxLength={20}
                />
              </div>
            </div>
          </div>

          <div className="quest-creator-preview">
            <div className="preview-xp-row">
              <span className="preview-label">XP REWARD:</span>
              <span className="preview-xp-val">+{baseXp} XP</span>
              <span className="preview-statxp">
                +{DIFFICULTY_STAT_XP[difficulty] || 10} {getStatXpType(category) !== 'none' ? getStatXpType(category).toUpperCase() : ''} Stat XP
              </span>
            </div>
            <div className="preview-diff-row">
              <span style={{ color: getDifficultyColor(difficulty) }}>{getDifficultyStars(difficulty)}</span>
              <span className="preview-category">{getCategoryLabel(category)}</span>
            </div>
            <div className="preview-max-note">Max XP for {rank}: {maxXp} XP per quest</div>
          </div>

          <div className="form-btn-row">
            <button type="button" onClick={onClose} className="btn-system-secondary">CANCEL</button>
            <button type="submit" className="btn-system-primary" disabled={!name.trim()}>
              <Plus className="w-4 h-4 mr-1" />
              REGISTER QUEST
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ============================================================
// DUNGEON BREAK BANNER
// ============================================================

interface DungeonBannerProps {
  dungeon: NonNullable<ReturnType<typeof useHunter>['activeDungeon']>;
  onComplete: () => void;
  onDismiss: () => void;
}

const DungeonBanner: React.FC<DungeonBannerProps> = ({ dungeon, onComplete, onDismiss }) => {
  const timeLeft = Math.max(0, dungeon.expires_at - Date.now());
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const minsLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <motion.div
      className="dungeon-break-banner"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="dungeon-header">
        <Skull className="w-6 h-6 text-rose-400 animate-pulse" />
        <span className="dungeon-title">⚠️ DUNGEON BREAK DETECTED</span>
        <div className="dungeon-timer">
          <Clock className="w-3.5 h-3.5" />
          <span>{hoursLeft}h {minsLeft}m remaining</span>
        </div>
      </div>
      <p className="dungeon-challenge">{dungeon.challenge}</p>
      <div className="dungeon-rewards">
        <span>Rewards:</span>
        <span className="reward-pill">+{dungeon.xp_reward.toLocaleString()} XP</span>
        <span className="reward-pill">+{dungeon.stat_xp_reward} Stat XP</span>
        <span className="reward-pill">💀 "Dungeon Survivor" Badge</span>
      </div>
      <div className="dungeon-actions">
        <button type="button" onClick={onComplete} className="btn-dungeon-accept">
          <CheckCircle className="w-4 h-4 mr-1" /> MARK COMPLETE
        </button>
        <button type="button" onClick={onDismiss} className="btn-dungeon-dismiss">
          <X className="w-3.5 h-3.5 mr-1" /> Dismiss
        </button>
      </div>
    </motion.div>
  );
};

// ============================================================
// BONUS QUEST CARD
// ============================================================

interface BonusQuestCardProps {
  quest: Quest;
  onComplete: () => void;
}

const BonusQuestCard: React.FC<BonusQuestCardProps> = ({ quest, onComplete }) => {
  const timeLeft = quest.expires_at ? Math.max(0, quest.expires_at - Date.now()) : 0;
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));

  return (
    <motion.div
      className="bonus-quest-card"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <div className="bonus-header">
        <Gift className="w-4 h-4 text-amber-400 animate-pulse" />
        <span className="bonus-label">🌟 BONUS QUEST</span>
        <span className="bonus-timer">{hoursLeft}h left</span>
      </div>
      <div className="bonus-name">{quest.name}</div>
      <p className="bonus-desc">{quest.description}</p>
      <div className="bonus-rewards">
        <span className="bonus-xp">+{quest.xp_reward} XP</span>
        {quest.stat_xp_reward && <span className="bonus-statxp">+{quest.stat_xp_reward} Stat XP</span>}
      </div>
      <button type="button" onClick={onComplete} className="btn-bonus-complete">
        <CheckCircle className="w-3.5 h-3.5 mr-1" /> COMPLETE
      </button>
    </motion.div>
  );
};

// ============================================================
// SYSTEM LOG PANEL
// ============================================================

const SystemLogPanel: React.FC = () => {
  const { profile } = useHunter();
  const [expanded, setExpanded] = useState(false);

  const logs = profile?.system_log || [];
  const displayLogs = expanded ? logs.slice(0, 15) : logs.slice(0, 5);

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'quest_complete': return '✅';
      case 'level_up': return '⬆️';
      case 'rank_up': return '👑';
      case 'hp_increase': return '❤️';
      case 'mp_increase': return '💧';
      case 'achievement': return '🏆';
      case 'dungeon': return '💀';
      case 'bonus_quest': return '🌟';
      case 'streak': return '🔥';
      default: return '📋';
    }
  };

  return (
    <div className="system-log-panel">
      <div className="log-panel-header">
        <Scroll className="w-4 h-4 text-cyan-400" />
        <span>SYSTEM LOG</span>
        <button type="button" onClick={() => setExpanded(!expanded)} className="log-expand-btn">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className="log-entries">
        {displayLogs.length === 0 ? (
          <div className="log-empty">No system events recorded yet.</div>
        ) : (
          displayLogs.map(log => (
            <div key={log.id} className="log-entry-item">
              <span className="log-icon">{getLogIcon(log.event_type)}</span>
              <div className="log-content">
                <span className="log-message">{log.message}</span>
                <span className="log-time">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================
// MAIN HUNTER HUB
// ============================================================

export const HunterHub: React.FC<HunterHubProps> = ({ onReplayAwakening }) => {
  const {
    profile,
    quests,
    completeQuest,
    incrementProgress,
    allocateStatPoint,
    resetHunter,
    activeBonus,
    activeDungeon,
    completeBonusQuest,
    completeDungeonBreak,
    dismissDungeonBreak,
    unlockedAchievements,
  } = useHunter();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showQuestCreator, setShowQuestCreator] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [questFilter, setQuestFilter] = useState<'active' | 'all'>('active');

  if (!profile) return null;

  const xpMeta = getXpProgress(profile.total_xp);
  const rankInfo = getRankBadgeInfo(profile.current_rank);

  const hpPct = Math.round((profile.hp / (profile.max_hp || 100)) * 100);
  const mpPct = Math.round((profile.mp / (profile.max_mp || 100)) * 100);

  const statIcons: Record<HunterStat, React.ReactNode> = {
    STR: <Flame className="w-4 h-4 text-red-500" />,
    AGI: <Zap className="w-4 h-4 text-cyan-400" />,
    VIT: <Shield className="w-4 h-4 text-emerald-400" />,
    INT: <Brain className="w-4 h-4 text-purple-400" />,
    PERC: <Eye className="w-4 h-4 text-amber-400" />,
  };

  // Filtered quests
  const filteredQuests = useMemo(() => {
    return quests.filter(q => {
      const catMatch = activeCategory === 'all' || q.category === activeCategory;
      const statusMatch = questFilter === 'all' || !q.completed;
      return catMatch && statusMatch;
    });
  }, [quests, activeCategory, questFilter]);

  const completedCount = quests.filter(q => q.completed).length;
  const activeCount = quests.filter(q => !q.completed).length;

  const streakBonusPct = profile.streak >= 7
    ? (profile.streak >= 100 ? 200 : profile.streak >= 60 ? 150 : profile.streak >= 30 ? 100 : profile.streak >= 14 ? 50 : 20)
    : 0;

  return (
    <div className="hub-container">
      <div className="hub-bg-mesh" />

      {/* Dungeon Break Banner */}
      <AnimatePresence>
        {activeDungeon && (
          <DungeonBanner
            dungeon={activeDungeon}
            onComplete={completeDungeonBreak}
            onDismiss={dismissDungeonBreak}
          />
        )}
      </AnimatePresence>

      {/* Main Grid */}
      <div className="hub-layout-grid">
        {/* ==================== LEFT PANEL: STATUS WINDOW ==================== */}
        <aside className="hub-profile-panel">
          <div className="status-window-card">
            {/* Hunter Identity */}
            <div className="status-header">
              <div className="hunter-identity">
                <span className="system-subtitle">AWAKENED HUNTER // {profile.affinity || 'CORE'}</span>
                <h1 className="hunter-name">{profile.display_name}</h1>
                {profile.equipped_title && (
                  <span className="equipped-title-badge">〔{profile.equipped_title}〕</span>
                )}
                <span className="hunter-id">ID: {profile.hunter_id || profile.id}</span>
              </div>

              <div className="rank-badge-display" style={{ borderColor: rankInfo.color, color: rankInfo.color }}>
                {rankInfo.label}
              </div>
            </div>

            {/* Level & XP */}
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
              <div className="xp-lifetime">Lifetime XP: {profile.total_xp.toLocaleString()}</div>
            </div>

            {/* HP / MP Bars (REAL) */}
            <div className="vital-gauges">
              <div className="vital-bar hp">
                <div className="vital-label">
                  <div className="vital-label-left">
                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                    <span>HP</span>
                  </div>
                  <span>{profile.hp} / {profile.max_hp}</span>
                </div>
                <div className="vital-track">
                  <motion.div
                    className="vital-fill hp-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${hpPct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                <div className="vital-sub-info">
                  Physical XP: {profile.physical_xp.toLocaleString()} • Threshold: {Math.floor(profile.physical_xp / 500) * 500}→{(Math.floor(profile.physical_xp / 500) + 1) * 500}
                </div>
              </div>

              <div className="vital-bar mp">
                <div className="vital-label">
                  <div className="vital-label-left">
                    <Droplets className="w-3.5 h-3.5 text-blue-400" />
                    <span>MP</span>
                  </div>
                  <span>{profile.mp} / {profile.max_mp}</span>
                </div>
                <div className="vital-track">
                  <motion.div
                    className="vital-fill mp-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${mpPct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                <div className="vital-sub-info">
                  Mental XP: {profile.mental_xp.toLocaleString()} • Complete mental quests to increase MP
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="stats-section">
              <div className="section-title-row">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h3>ATTRIBUTES</h3>
              </div>
              <div className="stats-list">
                {(Object.keys(HUNTER_STATS) as HunterStat[]).map(statKey => {
                  const statDef = HUNTER_STATS[statKey];
                  const value = profile.stats[statKey] || 10;
                  return (
                    <div key={statKey} className="stat-row-item">
                      <div className="stat-left">
                        <div className="stat-icon-wrapper">{statIcons[statKey]}</div>
                        <div>
                          <span className="stat-code" style={{ color: statDef.color }}>{statDef.code}</span>
                          <span className="stat-subname">({statDef.name})</span>
                        </div>
                      </div>
                      <div className="stat-right">
                        <span className="stat-val">{value}</span>
                        <button
                          type="button"
                          onClick={() => { allocateStatPoint(statKey, 1); playSystemChime('quest'); }}
                          className="btn-stat-plus"
                          title="Allocate Stat Point"
                        >+1</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="quick-metrics-row">
              <div className="metric-box">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <div className="metric-val">{profile.streak || 0} DAYS</div>
                <div className="metric-sub">STREAK</div>
                {streakBonusPct > 0 && <div className="streak-bonus-tag">+{streakBonusPct}% XP</div>}
              </div>
              <div className="metric-box">
                <Target className="w-4 h-4 text-cyan-400" />
                <div className="metric-val">{completedCount} / {quests.length}</div>
                <div className="metric-sub">CLEARED</div>
              </div>
              <div className="metric-box">
                <Trophy className="w-4 h-4 text-amber-400" />
                <div className="metric-val">{unlockedAchievements.length}</div>
                <div className="metric-sub">ACHIEVEMENTS</div>
              </div>
            </div>

            {/* Achievements Preview */}
            {profile.badges && profile.badges.length > 0 && (
              <div className="badges-mini-row">
                {profile.badges.slice(0, 6).map(badge => (
                  <div key={badge} className="badge-mini" title={badge}>
                    {badge === 'dungeon_survivor' ? '💀' : badge === 'relentless' ? '🔥' :
                     badge === 'elite_hunter' ? '⚔️' : badge === 'first_blood' ? '🏆' : '🎖️'}
                  </div>
                ))}
              </div>
            )}

            {/* Skill Points */}
            {(profile.available_skill_points || 0) > 0 && (
              <div className="skill-points-alert">
                <Star className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>{profile.available_skill_points} Skill Points available! Go to Profile to allocate.</span>
              </div>
            )}

            {/* System Log */}
            <SystemLogPanel />

            {/* Footer */}
            <div className="status-footer">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Initiate System Reboot? This will reset your profile.')) {
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

        {/* ==================== RIGHT PANEL: QUEST BOARD ==================== */}
        <section className="hub-quest-panel">
          {/* Bonus Quest */}
          <AnimatePresence>
            {activeBonus && !activeBonus.completed && (
              <BonusQuestCard quest={activeBonus} onComplete={completeBonusQuest} />
            )}
          </AnimatePresence>

          {/* Quest Board Header */}
          <div className="quest-board-header">
            <div className="quest-header-title">
              <Award className="w-6 h-6 text-amber-400" />
              <h2>SYSTEM QUEST BOARD</h2>
              <span className="quest-count-tag">{activeCount} ACTIVE</span>
            </div>

            <div className="quest-board-controls">
              <div className="quest-filter-pills">
                <button
                  type="button"
                  onClick={() => setQuestFilter('active')}
                  className={`filter-pill ${questFilter === 'active' ? 'active' : ''}`}
                >ACTIVE</button>
                <button
                  type="button"
                  onClick={() => setQuestFilter('all')}
                  className={`filter-pill ${questFilter === 'all' ? 'active' : ''}`}
                >ALL</button>
              </div>

              <button
                type="button"
                onClick={() => setShowQuestCreator(true)}
                className="btn-create-quest"
                title="Create Custom Quest"
              >
                <Plus className="w-4 h-4 mr-1" />
                <span>CREATE QUEST</span>
              </button>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="category-tabs">
            {CATEGORY_TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`category-tab-btn ${activeCategory === tab.id ? 'active' : ''}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Quest Cards */}
          <div className="quests-grid">
            <AnimatePresence>
              {filteredQuests.map((quest) => {
                const isDone = quest.completed;
                const xpGain = quest.xp_reward || DIFFICULTY_XP[quest.difficulty] || 20;
                const statXpGain = quest.stat_xp_reward || DIFFICULTY_STAT_XP[quest.difficulty] || 10;
                const progressPct = Math.min(100, Math.round((quest.progress / quest.target) * 100));
                const diffColor = getDifficultyColor(quest.difficulty);

                return (
                  <motion.div
                    key={quest.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`quest-card ${isDone ? 'completed-card' : ''} ${quest.is_bonus ? 'bonus-card' : ''}`}
                  >
                    <div className="quest-top-meta">
                      <span className={`quest-category-badge cat-${quest.category || 'general'}`}>
                        {getCategoryLabel(quest.category || 'physical')}
                      </span>
                      <div className="quest-diff-badge" style={{ color: diffColor, borderColor: diffColor }}>
                        <span className="diff-letter">{quest.difficulty}</span>
                        <span className="diff-stars">{getDifficultyStars(quest.difficulty)}</span>
                      </div>
                      <div className="quest-xp-group">
                        <span className="quest-xp-tag">+{xpGain} XP</span>
                        {quest.stat_xp_type && quest.stat_xp_type !== 'none' && (
                          <span className={`quest-statxp-tag ${quest.stat_xp_type}`}>
                            +{statXpGain} {quest.stat_xp_type === 'physical' ? 'PHY' : quest.stat_xp_type === 'mental' ? 'MEN' : 'B'}
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="quest-name">{quest.name}</h3>
                    <p className="quest-desc">{quest.description}</p>

                    {/* Progress */}
                    <div className="quest-progress-section">
                      <div className="progress-labels">
                        <span>PROGRESS</span>
                        <span>{quest.progress} / {quest.target} ({progressPct}%)</span>
                      </div>
                      <div className="quest-track">
                        <motion.div
                          className="quest-fill"
                          animate={{ width: `${progressPct}%` }}
                          transition={{ duration: 0.4 }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="quest-actions-row">
                      <span className="stat-reward-hint">STAT: {quest.stat}</span>

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
                              const step = Math.max(1, Math.round(quest.target / 5));
                              incrementProgress(quest.id, step);
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

            {filteredQuests.length === 0 && (
              <div className="empty-quests-state">
                <BookOpen className="w-10 h-10 text-slate-600 mb-3" />
                <p>No quests in this category.</p>
                <button
                  type="button"
                  onClick={() => setShowQuestCreator(true)}
                  className="btn-system-primary mt-3"
                >
                  <Plus className="w-4 h-4 mr-1" /> Create a Quest
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Custom Quest Creator Modal */}
      <AnimatePresence>
        {showQuestCreator && (
          <CustomQuestModal
            onClose={() => setShowQuestCreator(false)}
            rank={profile.current_rank}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default HunterHub;
