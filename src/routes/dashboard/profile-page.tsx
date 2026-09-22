import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Heart, Droplets, TrendingUp, Award, Star, Shield,
  Zap, Flame, Brain, Eye, Trophy, Target, ChevronRight,
  Sparkles, Crown, Code, Dumbbell, BookOpen,
} from 'lucide-react';
import { useHunter } from '@/lib/hunter-store';
import {
  HUNTER_STATS,
  type HunterStat,
  getXpProgress,
  getRankBadgeInfo,
  HP_BY_RANK,
  MP_BY_RANK,
} from '@/lib/game-engine';
import { ACHIEVEMENTS, getBadgeLabel } from '@/lib/achievements';

export const ProfilePage: React.FC = () => {
  const {
    profile,
    unlockedAchievements,
    equipTitle,
    allocateSkillPoint,
  } = useHunter();

  const [activeSection, setActiveSection] = useState<'stats' | 'achievements' | 'titles' | 'skills'>('stats');

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

  const nextRankHp = HP_BY_RANK[profile.current_rank] || 100;
  const nextRankMp = MP_BY_RANK[profile.current_rank] || 100;
  const physicalXpToNextThreshold = 500 - (profile.physical_xp % 500);
  const mentalXpToNextThreshold = 500 - (profile.mental_xp % 500);

  const skillKeys = Object.keys(profile.skill_points) as (keyof typeof profile.skill_points)[];

  const SKILL_LABELS: Record<keyof typeof profile.skill_points, { label: string; desc: string; icon: React.ReactNode }> = {
    strength: { label: 'Strength', desc: '+5% Physical Quest rewards', icon: <Dumbbell className="w-4 h-4 text-red-400" /> },
    intelligence: { label: 'Intelligence', desc: '+5% Mental Quest rewards', icon: <Brain className="w-4 h-4 text-purple-400" /> },
    endurance: { label: 'Endurance', desc: '+5% Streak bonuses', icon: <TrendingUp className="w-4 h-4 text-emerald-400" /> },
    discipline: { label: 'Discipline', desc: '+5% Consistency bonuses', icon: <Shield className="w-4 h-4 text-cyan-400" /> },
    focus: { label: 'Focus', desc: '+5% Daily quest rewards', icon: <Target className="w-4 h-4 text-amber-400" /> },
    agility: { label: 'Agility', desc: '+5% Time-based quest bonuses', icon: <Zap className="w-4 h-4 text-sky-400" /> },
  };

  return (
    <div className="profile-page">
      <div className="profile-bg-mesh" />

      {/* Profile Hero Card */}
      <div className="profile-hero-card">
        <div className={`profile-frame-wrapper ${profile.profile_frame || 'default'}`}>
          <div className="profile-avatar-large">
            <User className="w-10 h-10 text-cyan-300" />
            <div className="profile-rank-ring" style={{ borderColor: rankInfo.color }} />
          </div>
        </div>

        <div className="profile-hero-info">
          <div className="hero-rank-badge" style={{ color: rankInfo.color, borderColor: rankInfo.color }}>
            {rankInfo.label}
          </div>
          <h1 className="hero-name">{profile.display_name}</h1>
          {profile.equipped_title && (
            <div className="hero-title">〔{profile.equipped_title}〕</div>
          )}
          <div className="hero-id">{profile.hunter_id}</div>

          <div className="hero-stats-pills">
            <span className="hero-pill">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              LVL {profile.current_level}
            </span>
            <span className="hero-pill">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              {profile.total_xp.toLocaleString()} XP
            </span>
            <span className="hero-pill">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              {profile.streak}d streak
            </span>
            <span className="hero-pill">
              <Target className="w-3.5 h-3.5 text-purple-400" />
              {profile.quests_completed} quests
            </span>
          </div>
        </div>

        {/* XP Bar */}
        <div className="hero-xp-section">
          <div className="hero-xp-labels">
            <span>LEVEL PROGRESS</span>
            <span>{xpMeta.currentProgressXp.toLocaleString()} / {xpMeta.xpNeededForNext.toLocaleString()} XP</span>
          </div>
          <div className="hero-xp-bar">
            <motion.div
              className="hero-xp-fill"
              initial={{ width: 0 }}
              animate={{ width: `${xpMeta.percentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* HP / MP Cards */}
      <div className="profile-vital-cards">
        <div className="vital-card hp-card">
          <div className="vital-card-header">
            <Heart className="w-5 h-5 text-rose-400" />
            <span>PHYSICAL CAPACITY (HP)</span>
          </div>
          <div className="vital-numbers">
            <span className="vital-current">{profile.hp}</span>
            <span className="vital-sep">/</span>
            <span className="vital-max">{profile.max_hp}</span>
          </div>
          <div className="vital-bar-large hp">
            <motion.div
              className="vital-fill-large hp-fill"
              initial={{ width: 0 }}
              animate={{ width: `${hpPct}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <div className="vital-details">
            <div>Physical XP: <strong>{profile.physical_xp.toLocaleString()}</strong></div>
            <div>Next HP increase in: <strong>{physicalXpToNextThreshold} Physical XP</strong></div>
            <div>Rank base HP: <strong>{nextRankHp}</strong></div>
            <div>Physical quests: <strong>{profile.physical_quests_completed}</strong></div>
          </div>
        </div>

        <div className="vital-card mp-card">
          <div className="vital-card-header">
            <Droplets className="w-5 h-5 text-blue-400" />
            <span>MENTAL CAPACITY (MP)</span>
          </div>
          <div className="vital-numbers">
            <span className="vital-current">{profile.mp}</span>
            <span className="vital-sep">/</span>
            <span className="vital-max">{profile.max_mp}</span>
          </div>
          <div className="vital-bar-large mp">
            <motion.div
              className="vital-fill-large mp-fill"
              initial={{ width: 0 }}
              animate={{ width: `${mpPct}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <div className="vital-details">
            <div>Mental XP: <strong>{profile.mental_xp.toLocaleString()}</strong></div>
            <div>Next MP increase in: <strong>{mentalXpToNextThreshold} Mental XP</strong></div>
            <div>Rank base MP: <strong>{nextRankMp}</strong></div>
            <div>Mental quests: <strong>{profile.mental_quests_completed}</strong></div>
          </div>
        </div>
      </div>

      {/* Streak Cards */}
      <div className="profile-streak-cards">
        {[
          { label: 'Daily Streak', val: profile.streak, icon: <TrendingUp className="w-4 h-4 text-emerald-400" />, color: '#10b981' },
          { label: 'Longest Streak', val: profile.longest_streak, icon: <Star className="w-4 h-4 text-amber-400" />, color: '#f59e0b' },
          { label: 'Physical Streak', val: profile.physical_streak, icon: <Dumbbell className="w-4 h-4 text-red-400" />, color: '#ef4444' },
          { label: 'Mental Streak', val: profile.mental_streak, icon: <Brain className="w-4 h-4 text-purple-400" />, color: '#8b5cf6' },
          { label: 'Coding Streak', val: profile.coding_streak, icon: <Code className="w-4 h-4 text-cyan-400" />, color: '#06b6d4' },
          { label: 'Perfect Days', val: profile.perfect_day_streak, icon: <Trophy className="w-4 h-4 text-amber-300" />, color: '#fbbf24' },
        ].map(({ label, val, icon, color }) => (
          <div key={label} className="streak-mini-card" style={{ borderColor: `${color}30` }}>
            {icon}
            <div className="streak-val" style={{ color }}>{val}</div>
            <div className="streak-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Section Navigation */}
      <div className="profile-section-nav">
        {(['stats', 'achievements', 'titles', 'skills'] as const).map(section => (
          <button
            key={section}
            type="button"
            onClick={() => setActiveSection(section)}
            className={`profile-nav-btn ${activeSection === section ? 'active' : ''}`}
          >
            {section === 'stats' && <Shield className="w-4 h-4" />}
            {section === 'achievements' && <Trophy className="w-4 h-4" />}
            {section === 'titles' && <Crown className="w-4 h-4" />}
            {section === 'skills' && <Star className="w-4 h-4" />}
            {section.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div className="profile-section-content">
        {/* STATS */}
        {activeSection === 'stats' && (
          <div className="profile-stats-grid">
            {(Object.keys(HUNTER_STATS) as HunterStat[]).map(statKey => {
              const statDef = HUNTER_STATS[statKey];
              const value = profile.stats[statKey] || 10;
              const barPct = Math.min(100, (value / 200) * 100);

              return (
                <div key={statKey} className="profile-stat-card" style={{ borderColor: `${statDef.color}30` }}>
                  <div className="pstat-header">
                    {statIcons[statKey]}
                    <span className="pstat-code" style={{ color: statDef.color }}>{statDef.code}</span>
                    <span className="pstat-name">{statDef.name}</span>
                    <span className="pstat-val" style={{ color: statDef.color }}>{value}</span>
                  </div>
                  <p className="pstat-desc">{statDef.description}</p>
                  <div className="pstat-bar-track">
                    <motion.div
                      className="pstat-bar-fill"
                      style={{ background: statDef.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${barPct}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Quest breakdown */}
            <div className="profile-quest-breakdown">
              <h3>QUEST STATISTICS</h3>
              <div className="breakdown-grid">
                <div><BookOpen className="w-4 h-4 text-slate-400" /><span>Total Quests</span><strong>{profile.quests_completed}</strong></div>
                <div><Dumbbell className="w-4 h-4 text-red-400" /><span>Physical</span><strong>{profile.physical_quests_completed}</strong></div>
                <div><Brain className="w-4 h-4 text-purple-400" /><span>Mental</span><strong>{profile.mental_quests_completed}</strong></div>
                <div><Code className="w-4 h-4 text-cyan-400" /><span>Coding</span><strong>{profile.coding_quests_completed}</strong></div>
              </div>
            </div>
          </div>
        )}

        {/* ACHIEVEMENTS */}
        {activeSection === 'achievements' && (
          <div className="achievements-grid">
            {ACHIEVEMENTS.map(ach => {
              const isUnlocked = unlockedAchievements.includes(ach.id);
              return (
                <div key={ach.id} className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
                  <div className="ach-icon">{isUnlocked ? ach.icon : '🔒'}</div>
                  <div className="ach-info">
                    <div className="ach-name">{isUnlocked ? ach.name : '???'}</div>
                    <div className="ach-desc">{isUnlocked ? ach.description : 'Unknown condition'}</div>
                    <div className="ach-reward">+{ach.xp_reward} XP</div>
                  </div>
                  {isUnlocked && <div className="ach-unlocked-tag">UNLOCKED</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* TITLES */}
        {activeSection === 'titles' && (
          <div className="titles-section">
            <div className="titles-equipped">
              <h3>EQUIPPED TITLE</h3>
              <div className="equipped-title-display">
                {profile.equipped_title ? (
                  <span className="title-equipped-pill">〔{profile.equipped_title}〕</span>
                ) : (
                  <span className="no-title">No title equipped</span>
                )}
              </div>
            </div>

            <div className="titles-available">
              <h3>AVAILABLE TITLES</h3>
              {profile.titles.length === 0 ? (
                <p className="no-titles">Earn titles by reaching new ranks and completing achievements.</p>
              ) : (
                <div className="titles-list">
                  {profile.titles.map(title => (
                    <div key={title} className={`title-item ${profile.equipped_title === title ? 'equipped' : ''}`}>
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>{title}</span>
                      {profile.equipped_title !== title && (
                        <button
                          type="button"
                          onClick={() => equipTitle(title)}
                          className="btn-equip-title"
                        >
                          Equip <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </button>
                      )}
                      {profile.equipped_title === title && (
                        <span className="equipped-badge">EQUIPPED</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="badges-section">
              <h3>BADGES EARNED</h3>
              {profile.badges.length === 0 ? (
                <p className="no-badges">Complete quests and achievements to earn badges.</p>
              ) : (
                <div className="badges-list">
                  {profile.badges.map(badge => (
                    <div key={badge} className="badge-item">
                      <span className="badge-icon">
                        {badge === 'dungeon_survivor' ? '💀' : badge === 'relentless' ? '🔥' :
                         badge === 'elite_hunter' ? '⚔️' : badge === 'first_blood' ? '🏆' :
                         badge === 'high_rank' ? '👑' : badge === 'monarch' ? '🌟' : '🎖️'}
                      </span>
                      <span className="badge-label">{getBadgeLabel(badge)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SKILL POINTS */}
        {activeSection === 'skills' && (
          <div className="skills-section">
            <div className="skill-points-header">
              <Star className="w-5 h-5 text-amber-400" />
              <h3>SKILL POINTS</h3>
              <span className="available-pts">{profile.available_skill_points || 0} available</span>
            </div>
            <p className="skill-desc">
              Allocate skill points to boost specific quest rewards. Earn 5 points per rank promotion.
            </p>

            <div className="skills-grid">
              {skillKeys.map(skill => {
                const info = SKILL_LABELS[skill];
                const value = profile.skill_points[skill] || 0;
                const canAllocate = (profile.available_skill_points || 0) > 0;

                return (
                  <div key={skill} className="skill-card">
                    <div className="skill-header">
                      {info.icon}
                      <span className="skill-name">{info.label}</span>
                      <span className="skill-val">{value}</span>
                    </div>
                    <p className="skill-desc-small">{info.desc}</p>
                    <div className="skill-bar">
                      <motion.div
                        className="skill-bar-fill"
                        animate={{ width: `${Math.min(100, value * 10)}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => allocateSkillPoint(skill)}
                      disabled={!canAllocate}
                      className={`btn-allocate-skill ${!canAllocate ? 'disabled' : ''}`}
                    >
                      +1 {info.label}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="skill-info-box">
              <p>🎯 Earn skill points by promoting to a new rank (E→D→C→B→A→S).</p>
              <p>Each rank grants <strong>+5 skill points</strong>.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
