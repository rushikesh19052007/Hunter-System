import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  type Profile,
  type Quest,
  type DifficultyGrade,
  type QuestCategory,
  type StatXpType,
  DIFFICULTY_XP,
  DIFFICULTY_STAT_XP,
  calculateLevel,
  calculateRank,
  calculateMaxHp,
  calculateMaxMp,
  HP_BY_RANK,
  MP_BY_RANK,
  generateHunterId,
  getStatXpType,
  getStreakBonusMultiplier,
  RANK_TITLES,
  PROFILE_FRAMES,
  migrateProfile,
  migrateDifficulty,
  createDefaultProfile,
} from './game-engine';
import QUEST_LIBRARY from './quest-library';
import { checkNewAchievements, type NewUnlock } from './achievements';
import {
  generateDailyPool,
  loadTodayDailyState,
  completeDungeonBreak as markDungeonComplete,
  dismissDungeonBreak as markDungeonDismissed,
  completeBonusQuestInState,
  calculateStreakUpdate,
  type DungeonBreak,
} from './daily-system';
import { scheduleNotification } from './notifications';
import { trackEvent, AnalyticsEvent } from './analytics';
import { supabase, isSupabaseConfigured } from './supabase';

// ============================================================
// CONTEXT TYPE
// ============================================================

export interface HunterContextType {
  profile: Profile | null;
  quests: Quest[];
  isOnboarded: boolean;
  primaryAffinity: string | null;
  unlockedAchievements: string[];
  activeBonus: Quest | null;
  activeDungeon: DungeonBreak | null;

  // Actions
  saveAwakenedProfile: (name: string, primaryStat: string) => Promise<Profile>;
  completeQuest: (questId: string) => void;
  incrementProgress: (questId: string, amount?: number) => void;
  addXp: (amount: number, source?: string) => void;
  allocateStatPoint: (stat: string, points?: number) => void;
  updateProfile: (updates: Partial<Profile>) => void;
  resetHunter: () => void;
  addCustomQuest: (quest: Omit<Quest, 'id' | 'user_id' | 'progress' | 'completed'>) => void;
  completeBonusQuest: () => void;
  completeDungeonBreak: () => void;
  dismissDungeonBreak: () => void;
  equipTitle: (title: string) => void;
  allocateSkillPoint: (skill: keyof Profile['skill_points']) => void;
  refreshDaily: () => void;
  // Legacy compatibility
  auth: { isAuthenticated: boolean; user: { id: string; email: string } | null };
}

const HunterContext = createContext<HunterContextType | undefined>(undefined);

// ============================================================
// STORAGE KEYS
// ============================================================

const STORAGE_PROFILE_KEY = 'hunter_system_profile';
const STORAGE_QUESTS_KEY = 'hunter_system_quests';
const STORAGE_AUTH_KEY = 'hunter_system_auth';
const STORAGE_AFFINITY_KEY = 'hunter_system_affinity';
const STORAGE_ACHIEVEMENTS_KEY = 'hunter_system_achievements';

// ============================================================
// MIGRATION HELPERS
// ============================================================

function loadAndMigrateProfile(): Profile | null {
  try {
    const saved = localStorage.getItem(STORAGE_PROFILE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    // Migrate old profile format to v2
    return migrateProfile(parsed);
  } catch {
    return null;
  }
}

function loadAndMigrateQuests(): Quest[] {
  try {
    const saved = localStorage.getItem(STORAGE_QUESTS_KEY);
    if (!saved) return [];
    const parsed: Quest[] = JSON.parse(saved);
    // Migrate numeric difficulty to letter grades
    return parsed.map(q => ({
      ...q,
      difficulty: migrateDifficulty(q.difficulty as unknown as number | string),
      category: (q.category || 'physical') as QuestCategory,
      stat_xp_type: q.stat_xp_type || getStatXpType((q.category || 'physical') as QuestCategory),
    }));
  } catch {
    return [];
  }
}

// ============================================================
// PROVIDER
// ============================================================

export const HunterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<Profile | null>(loadAndMigrateProfile);
  const [quests, setQuests] = useState<Quest[]>(loadAndMigrateQuests);
  const [primaryAffinity, setPrimaryAffinity] = useState<string | null>(() => {
    try { return localStorage.getItem(STORAGE_AFFINITY_KEY) || null; } catch { return null; }
  });
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ACHIEVEMENTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [activeBonus, setActiveBonus] = useState<Quest | null>(null);
  const [activeDungeon, setActiveDungeon] = useState<DungeonBreak | null>(null);

  // Legacy auth state
  const [auth] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_AUTH_KEY);
      return saved ? JSON.parse(saved) : { isAuthenticated: false, user: null };
    } catch { return { isAuthenticated: false, user: null }; }
  });

  // Sync to localStorage
  useEffect(() => {
    if (profile) localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));
    else localStorage.removeItem(STORAGE_PROFILE_KEY);
  }, [profile]);

  useEffect(() => {
    if (quests.length > 0) localStorage.setItem(STORAGE_QUESTS_KEY, JSON.stringify(quests));
  }, [quests]);

  useEffect(() => {
    if (primaryAffinity) localStorage.setItem(STORAGE_AFFINITY_KEY, primaryAffinity);
    else localStorage.removeItem(STORAGE_AFFINITY_KEY);
  }, [primaryAffinity]);

  useEffect(() => {
    localStorage.setItem(STORAGE_ACHIEVEMENTS_KEY, JSON.stringify(unlockedAchievements));
  }, [unlockedAchievements]);

  // Load daily state on mount
  useEffect(() => {
    const dailyState = loadTodayDailyState();
    if (dailyState) {
      if (dailyState.bonusQuest && !dailyState.bonusQuest.completed) {
        setActiveBonus(dailyState.bonusQuest);
      }
      if (dailyState.dungeonBreak && !dailyState.dungeonBreak.completed && !dailyState.dungeonBreak.dismissed) {
        setActiveDungeon(dailyState.dungeonBreak);
      }
    } else if (profile) {
      // Generate fresh daily pool
      const { bonusQuest, dungeonBreak } = generateDailyPool(profile, profile.id);
      if (bonusQuest) setActiveBonus(bonusQuest);
      if (dungeonBreak) {
        setActiveDungeon(dungeonBreak);
        scheduleNotification({
          title: '⚠️ DUNGEON BREAK DETECTED',
          message: `An unstable gate has appeared. ${dungeonBreak.challenge.slice(0, 60)}...`,
          priority: 'urgent',
          category: 'warning',
          playSound: true,
        });
      }
    }
  }, []);

  // ============================================================
  // ADD XP (with level-up, rank-up, HP/MP scaling)
  // ============================================================

  const addXpLegacy = (amount: number, source: string = 'General') => {
    if (!profile) return;

    const prevLevel = profile.current_level;
    const prevRank = profile.current_rank;
    const newTotalXp = profile.total_xp + amount;
    const newLevel = calculateLevel(newTotalXp);
    const newRank = calculateRank(newLevel);
    const levelDiff = newLevel - prevLevel;
    const rankChanged = newRank !== prevRank;

    const updatedStats = { ...profile.stats };
    if (levelDiff > 0) {
      Object.keys(updatedStats).forEach(key => { updatedStats[key] += levelDiff * 2; });
      if (primaryAffinity && updatedStats[primaryAffinity] !== undefined) {
        updatedStats[primaryAffinity] += levelDiff;
      }
    }

    // Rank-based HP/MP base
    const rankHpBase = HP_BY_RANK[newRank] || 100;
    const rankMpBase = MP_BY_RANK[newRank] || 100;

    // Recalculate max HP/MP with current physical/mental XP
    const newMaxHp = Math.max(rankHpBase, calculateMaxHp(profile.physical_xp, newRank));
    const newMaxMp = Math.max(rankMpBase, calculateMaxMp(profile.mental_xp, newRank));

    // New titles on rank up
    const newTitles = [...(profile.titles || [])];
    let newFrame = profile.profile_frame;
    let newSkillPoints = profile.available_skill_points || 0;

    if (rankChanged) {
      const rankTitles = RANK_TITLES[newRank] || [];
      rankTitles.forEach(t => { if (!newTitles.includes(t)) newTitles.push(t); });
      const frame = PROFILE_FRAMES[newRank];
      if (frame) newFrame = frame;
      newSkillPoints += 5; // +5 skill points on rank promotion
    }

    const logEntry = {
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      event_type: 'quest_complete' as const,
      message: `+${amount} XP from ${source}`,
      xp: amount,
    };

    const updatedProfile: Profile = {
      ...profile,
      total_xp: newTotalXp,
      current_level: newLevel,
      current_rank: newRank,
      stats: updatedStats,
      max_hp: newMaxHp,
      max_mp: newMaxMp,
      hp: Math.min(profile.hp, newMaxHp),
      mp: Math.min(profile.mp, newMaxMp),
      titles: newTitles,
      profile_frame: newFrame,
      available_skill_points: newSkillPoints,
      system_log: [logEntry, ...(profile.system_log || [])].slice(0, 20),
    };

    setProfile(updatedProfile);

    trackEvent(AnalyticsEvent.QUEST_PROGRESS, { xpGained: amount, source, totalXp: newTotalXp, level: newLevel });

    if (newLevel > prevLevel) {
      trackEvent(AnalyticsEvent.LEVEL_UP, { previousLevel: prevLevel, newLevel });
      scheduleNotification({
        title: `LEVEL UP: LEVEL ${newLevel}!`,
        message: `Your spiritual density has expanded. All attributes boosted by +${levelDiff * 2}.`,
        priority: 'high',
        category: 'level_up',
        playSound: true,
      });
    }

    if (rankChanged) {
      trackEvent(AnalyticsEvent.RANK_PROMOTION, { previousRank: prevRank, newRank });
      scheduleNotification({
        title: `⬆️ RANK PROMOTION: ${newRank.toUpperCase()}!`,
        message: `"RANK PROMOTION COMPLETE. Your existence has been acknowledged by the system." You are now ${newRank}. +5 Skill Points granted.`,
        priority: 'urgent',
        category: 'rank_up',
        playSound: true,
      });
    }

    return updatedProfile;
  };

  // ============================================================
  // ADD STAT XP (Physical / Mental) with HP/MP threshold checking
  // ============================================================

  const addStatXp = (
    statXpType: StatXpType,
    amount: number,
    currentProfile: Profile
  ): { updatedProfile: Profile; hpIncreased: boolean; mpIncreased: boolean } => {
    let hpIncreased = false;
    let mpIncreased = false;

    const prevPhysXp = currentProfile.physical_xp;
    const prevMentXp = currentProfile.mental_xp;

    const newPhysXp = statXpType === 'physical' || statXpType === 'both'
      ? prevPhysXp + amount
      : prevPhysXp;
    const newMentXp = statXpType === 'mental' || statXpType === 'both'
      ? prevMentXp + amount
      : prevMentXp;

    const newMaxHp = calculateMaxHp(newPhysXp, currentProfile.current_rank);
    const newMaxMp = calculateMaxMp(newMentXp, currentProfile.current_rank);

    if (newMaxHp > currentProfile.max_hp) hpIncreased = true;
    if (newMaxMp > currentProfile.max_mp) mpIncreased = true;

    const updatedProfile: Profile = {
      ...currentProfile,
      physical_xp: newPhysXp,
      mental_xp: newMentXp,
      max_hp: newMaxHp,
      max_mp: newMaxMp,
      hp: Math.min(currentProfile.hp, newMaxHp),
      mp: Math.min(currentProfile.mp, newMaxMp),
    };

    return { updatedProfile, hpIncreased, mpIncreased };
  };

  // ============================================================
  // COMPLETE QUEST
  // ============================================================

  const completeQuest = (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.completed) return;
    if (!profile) return;

    const baseXp = quest.xp_reward || DIFFICULTY_XP[quest.difficulty] || 25;
    const statXpAmount = quest.stat_xp_reward || DIFFICULTY_STAT_XP[quest.difficulty] || 10;
    const statXpType = quest.stat_xp_type || getStatXpType(quest.category);

    // Apply streak bonus
    const streakMultiplier = getStreakBonusMultiplier(profile.streak || 0);
    const xpEarned = Math.round(baseXp * streakMultiplier);

    // Mark quest complete
    setQuests(prev =>
      prev.map(q => q.id === questId ? { ...q, progress: q.target, completed: true } : q)
    );

    // Update stat for quest
    let updatedProfile: Profile = { ...profile };

    if (quest.stat && updatedProfile.stats[quest.stat] !== undefined) {
      updatedProfile = {
        ...updatedProfile,
        stats: {
          ...updatedProfile.stats,
          [quest.stat]: (updatedProfile.stats[quest.stat] || 10) + 1,
        },
      };
    }

    // Quest type counters
    const isPhysical = ['physical', 'fitness', 'health'].includes(quest.category);
    const isMental = ['mental', 'knowledge', 'learning', 'coding', 'study'].includes(quest.category);
    const isCoding = quest.category === 'coding';

    updatedProfile = {
      ...updatedProfile,
      quests_completed: (updatedProfile.quests_completed || 0) + 1,
      physical_quests_completed: isPhysical
        ? (updatedProfile.physical_quests_completed || 0) + 1
        : updatedProfile.physical_quests_completed || 0,
      mental_quests_completed: isMental
        ? (updatedProfile.mental_quests_completed || 0) + 1
        : updatedProfile.mental_quests_completed || 0,
      coding_quests_completed: isCoding
        ? (updatedProfile.coding_quests_completed || 0) + 1
        : updatedProfile.coding_quests_completed || 0,
    };

    // Add stat XP and check HP/MP thresholds
    const { updatedProfile: afterStatXp, hpIncreased, mpIncreased } = addStatXp(
      statXpType,
      statXpAmount,
      updatedProfile
    );
    updatedProfile = afterStatXp;

    // Build system log entries
    const newLogEntries = [];
    newLogEntries.push({
      id: `log-${Date.now()}-qc`,
      timestamp: Date.now(),
      event_type: 'quest_complete' as const,
      message: `Quest cleared: "${quest.name}"`,
      xp: xpEarned,
    });

    if (statXpType !== 'none') {
      newLogEntries.push({
        id: `log-${Date.now()}-sx`,
        timestamp: Date.now() + 1,
        event_type: statXpType === 'physical' ? 'hp_increase' as const : 'mp_increase' as const,
        message: `+${statXpAmount} ${statXpType === 'physical' ? 'Physical' : 'Mental'} XP earned`,
        stat_xp: statXpAmount,
      });
    }

    if (hpIncreased) {
      newLogEntries.push({
        id: `log-${Date.now()}-hp`,
        timestamp: Date.now() + 2,
        event_type: 'hp_increase' as const,
        message: `Physical Capacity Improved. Max HP: ${profile.max_hp} → ${updatedProfile.max_hp}`,
      });
      scheduleNotification({
        title: 'HP INCREASED',
        message: `Physical capacity improved. Max HP: ${profile.max_hp} → ${updatedProfile.max_hp}`,
        priority: 'normal',
        category: 'system',
      });
    }

    if (mpIncreased) {
      newLogEntries.push({
        id: `log-${Date.now()}-mp`,
        timestamp: Date.now() + 3,
        event_type: 'mp_increase' as const,
        message: `Mental Capacity Improved. Max MP: ${profile.max_mp} → ${updatedProfile.max_mp}`,
      });
      scheduleNotification({
        title: 'MP INCREASED',
        message: `Mental capacity improved. Max MP: ${profile.max_mp} → ${updatedProfile.max_mp}`,
        priority: 'normal',
        category: 'system',
      });
    }

    // Streak update
    const streakUpdate = calculateStreakUpdate(
      updatedProfile,
      true,
      isPhysical,
      isMental
    );

    const prevStreak = updatedProfile.streak || 0;
    updatedProfile = { ...updatedProfile, ...streakUpdate };

    if ((updatedProfile.streak || 0) > prevStreak && updatedProfile.streak !== undefined) {
      if ([7, 14, 30, 60, 100].includes(updatedProfile.streak)) {
        newLogEntries.push({
          id: `log-${Date.now()}-str`,
          timestamp: Date.now() + 4,
          event_type: 'streak' as const,
          message: `🔥 Streak milestone: ${updatedProfile.streak} days!`,
        });
      }
    }

    updatedProfile = {
      ...updatedProfile,
      system_log: [...newLogEntries, ...(updatedProfile.system_log || [])].slice(0, 20),
    };

    setProfile(updatedProfile);

    // Now add XP
    const finalProfile = addXpToProfile(updatedProfile, xpEarned, `Quest: ${quest.name}`);

    // Check achievements on updated profile
    if (finalProfile) {
      checkAndUnlockAchievements(finalProfile, quests);
    }

    trackEvent(AnalyticsEvent.QUEST_COMPLETED, {
      questId,
      name: quest.name,
      difficulty: quest.difficulty,
      xpEarned,
      statXpType,
      statXpAmount,
    });

    scheduleNotification({
      title: 'QUEST CLEARED',
      message: `[${quest.name}] +${xpEarned} XP${statXpType !== 'none' ? ` +${statXpAmount} ${statXpType === 'physical' ? 'Physical' : 'Mental'} XP` : ''}`,
      priority: 'normal',
      category: 'quest',
      playSound: true,
    });
  };

  // Internal: add XP directly to a profile object
  const addXpToProfile = (currentProfile: Profile, amount: number, source: string): Profile | null => {
    const prevLevel = currentProfile.current_level;
    const prevRank = currentProfile.current_rank;
    const newTotalXp = currentProfile.total_xp + amount;
    const newLevel = calculateLevel(newTotalXp);
    const newRank = calculateRank(newLevel);
    const levelDiff = newLevel - prevLevel;
    const rankChanged = newRank !== prevRank;

    const updatedStats = { ...currentProfile.stats };
    if (levelDiff > 0) {
      Object.keys(updatedStats).forEach(key => { updatedStats[key] += levelDiff * 2; });
      if (primaryAffinity && updatedStats[primaryAffinity] !== undefined) {
        updatedStats[primaryAffinity] += levelDiff;
      }
    }

    const newMaxHp = Math.max(HP_BY_RANK[newRank] || 100, calculateMaxHp(currentProfile.physical_xp, newRank));
    const newMaxMp = Math.max(MP_BY_RANK[newRank] || 100, calculateMaxMp(currentProfile.mental_xp, newRank));

    const newTitles = [...(currentProfile.titles || [])];
    let newFrame = currentProfile.profile_frame;
    let newSkillPoints = currentProfile.available_skill_points || 0;

    if (rankChanged) {
      const rankTitles = RANK_TITLES[newRank] || [];
      rankTitles.forEach(t => { if (!newTitles.includes(t)) newTitles.push(t); });
      const frame = PROFILE_FRAMES[newRank];
      if (frame) newFrame = frame;
      newSkillPoints += 5;

      trackEvent(AnalyticsEvent.RANK_PROMOTION, { previousRank: prevRank, newRank });
      scheduleNotification({
        title: `⬆️ RANK PROMOTION: ${newRank.toUpperCase()}!`,
        message: `"RANK PROMOTION COMPLETE. Your existence has been acknowledged by the system." You are now ${newRank}. +5 Skill Points granted.`,
        priority: 'urgent',
        category: 'rank_up',
        playSound: true,
      });
    }

    if (newLevel > prevLevel) {
      trackEvent(AnalyticsEvent.LEVEL_UP, { previousLevel: prevLevel, newLevel });
      scheduleNotification({
        title: `LEVEL UP: LEVEL ${newLevel}!`,
        message: `Attributes boosted by +${levelDiff * 2}. Total XP: ${newTotalXp.toLocaleString()}`,
        priority: 'high',
        category: 'level_up',
        playSound: true,
      });
    }

    const updatedProfile: Profile = {
      ...currentProfile,
      total_xp: newTotalXp,
      current_level: newLevel,
      current_rank: newRank,
      stats: updatedStats,
      max_hp: newMaxHp,
      max_mp: newMaxMp,
      hp: Math.min(currentProfile.hp, newMaxHp),
      mp: Math.min(currentProfile.mp, newMaxMp),
      titles: newTitles,
      profile_frame: newFrame,
      available_skill_points: newSkillPoints,
    };

    setProfile(updatedProfile);
    return updatedProfile;
  };

  // ============================================================
  // ACHIEVEMENT CHECKS
  // ============================================================

  const checkAndUnlockAchievements = (currentProfile: Profile, currentQuests: Quest[]) => {
    const newUnlocks = checkNewAchievements(currentProfile, currentQuests, unlockedAchievements);
    if (newUnlocks.length === 0) return;

    const newIds = newUnlocks.map(u => u.id);
    setUnlockedAchievements(prev => [...prev, ...newIds]);

    // Apply rewards and notify
    newUnlocks.forEach((unlock: NewUnlock) => {
      scheduleNotification({
        title: `${unlock.icon} ACHIEVEMENT UNLOCKED`,
        message: `"${unlock.name}" — ${unlock.description} +${unlock.xp_reward} XP`,
        priority: 'high',
        category: 'system',
        playSound: true,
      });

      // Add XP for achievement
      setProfile(prev => {
        if (!prev) return prev;
        const newTitles = [...(prev.titles || [])];
        if (unlock.title_unlock && !newTitles.includes(unlock.title_unlock)) {
          newTitles.push(unlock.title_unlock);
        }
        const newBadges = [...(prev.badges || [])];
        if (unlock.badge_id && !newBadges.includes(unlock.badge_id)) {
          newBadges.push(unlock.badge_id);
        }
        const logEntry = {
          id: `log-${Date.now()}-ach`,
          timestamp: Date.now(),
          event_type: 'achievement' as const,
          message: `${unlock.icon} Achievement: "${unlock.name}" unlocked! +${unlock.xp_reward} XP`,
          xp: unlock.xp_reward,
        };
        return {
          ...prev,
          total_xp: prev.total_xp + unlock.xp_reward,
          current_level: calculateLevel(prev.total_xp + unlock.xp_reward),
          current_rank: calculateRank(calculateLevel(prev.total_xp + unlock.xp_reward)),
          titles: newTitles,
          badges: newBadges,
          system_log: [logEntry, ...(prev.system_log || [])].slice(0, 20),
        };
      });
    });
  };

  // ============================================================
  // COMPLETE BONUS QUEST
  // ============================================================

  const completeBonusQuest = () => {
    if (!activeBonus || !profile) return;

    const xpEarned = activeBonus.xp_reward || 200;
    const statXpEarned = activeBonus.stat_xp_reward || 50;
    const statXpType = activeBonus.stat_xp_type || 'none';

    completeBonusQuestInState();
    setActiveBonus(null);

    setProfile(prev => {
      if (!prev) return prev;
      const { updatedProfile } = addStatXp(statXpType, statXpEarned, prev);
      const logEntry = {
        id: `log-${Date.now()}-bq`,
        timestamp: Date.now(),
        event_type: 'bonus_quest' as const,
        message: `🌟 Bonus Quest cleared: "${activeBonus.name}" +${xpEarned} XP`,
        xp: xpEarned,
        stat_xp: statXpEarned,
      };
      return {
        ...updatedProfile,
        system_log: [logEntry, ...(updatedProfile.system_log || [])].slice(0, 20),
      };
    });

    setTimeout(() => addXp(xpEarned, `Bonus Quest: ${activeBonus.name}`), 50);

    scheduleNotification({
      title: '🌟 BONUS QUEST COMPLETE',
      message: `"${activeBonus.name}" cleared! +${xpEarned} XP, +${statXpEarned} Stat XP`,
      priority: 'high',
      category: 'quest',
      playSound: true,
    });
  };

  // ============================================================
  // DUNGEON BREAK
  // ============================================================

  const completeDungeonBreak = () => {
    if (!activeDungeon || !profile) return;

    markDungeonComplete();
    setActiveDungeon(null);

    const xpEarned = activeDungeon.xp_reward;
    const statXpEarned = activeDungeon.stat_xp_reward;

    // Add special dungeon badge
    setProfile(prev => {
      if (!prev) return prev;
      const newBadges = [...(prev.badges || [])];
      if (!newBadges.includes('dungeon_survivor')) newBadges.push('dungeon_survivor');

      const { updatedProfile } = addStatXp('both', Math.floor(statXpEarned / 2), prev);

      const logEntry = {
        id: `log-${Date.now()}-db`,
        timestamp: Date.now(),
        event_type: 'dungeon' as const,
        message: `💀 DUNGEON BREAK cleared! +${xpEarned} XP earned`,
        xp: xpEarned,
        stat_xp: statXpEarned,
      };
      return {
        ...updatedProfile,
        badges: newBadges,
        system_log: [logEntry, ...(updatedProfile.system_log || [])].slice(0, 20),
      };
    });

    // Also update quests to mark any dungeon quest complete
    setQuests(prev => prev.map(q => q.is_dungeon ? { ...q, completed: true } : q));

    setTimeout(() => addXp(xpEarned, 'Dungeon Break'), 100);
    setTimeout(() => {
      if (profile) checkAndUnlockAchievements(profile, quests);
    }, 200);

    scheduleNotification({
      title: '💀 DUNGEON BREAK CLEARED',
      message: `The gate has been closed. +${xpEarned} XP, +${statXpEarned} Stat XP. Badge "Dungeon Survivor" earned!`,
      priority: 'urgent',
      category: 'system',
      playSound: true,
    });
  };

  const dismissDungeonBreak = () => {
    markDungeonDismissed();
    setActiveDungeon(null);
  };

  // ============================================================
  // REFRESH DAILY POOL
  // ============================================================

  const refreshDaily = () => {
    if (!profile) return;
    const { bonusQuest, dungeonBreak } = generateDailyPool(profile, profile.id);
    if (bonusQuest) setActiveBonus(bonusQuest);
    if (dungeonBreak) {
      setActiveDungeon(dungeonBreak);
      scheduleNotification({
        title: '⚠️ DUNGEON BREAK DETECTED',
        message: `An unstable gate has appeared. ${dungeonBreak.challenge.slice(0, 60)}...`,
        priority: 'urgent',
        category: 'warning',
        playSound: true,
      });
    }
  };

  // ============================================================
  // INCREMENT PROGRESS
  // ============================================================

  const incrementProgress = (questId: string, amount: number = 1) => {
    setQuests(prev =>
      prev.map(q => {
        if (q.id !== questId || q.completed) return q;
        const newProgress = Math.min(q.target, q.progress + amount);
        const isDone = newProgress >= q.target;
        return { ...q, progress: newProgress, completed: isDone };
      })
    );

    const quest = quests.find(q => q.id === questId);
    if (quest && quest.progress + amount >= quest.target && !quest.completed) {
      completeQuest(questId);
    }
  };

  // ============================================================
  // SAVE AWAKENED PROFILE
  // ============================================================

  const saveAwakenedProfile = async (name: string, stat: string): Promise<Profile> => {
    const userUid = 'hunter-' + Math.random().toString(36).substring(2, 9);
    const newProfile = createDefaultProfile(userUid, name.trim() || 'Awakened Hunter', stat);

    // Create initial quests from library (first 12 from varied categories)
    const initialQuestIds = ['phys-001', 'phys-003', 'phys-006', 'code-001', 'study-001',
      'know-001', 'prod-001', 'disc-001', 'hlth-001', 'hlth-004', 'phys-009', 'study-002'];
    const initialQuests: Quest[] = QUEST_LIBRARY
      .filter(lq => initialQuestIds.includes(lq.id))
      .map(lq => ({
        id: `quest-${lq.id}`,
        user_id: userUid,
        name: lq.name,
        difficulty: lq.difficulty,
        progress: 0,
        target: lq.target,
        stat: lq.stat,
        category: lq.category,
        stat_xp_type: getStatXpType(lq.category),
        description: lq.description,
        completed: false,
        xp_reward: DIFFICULTY_XP[lq.difficulty] || 15,
        stat_xp_reward: DIFFICULTY_STAT_XP[lq.difficulty] || 10,
        repeatable: lq.repeatable,
      }));

    setProfile(newProfile);
    setQuests(initialQuests);
    setPrimaryAffinity(stat);
    setUnlockedAchievements([]);

    // Supabase sync
    if (isSupabaseConfigured && supabase) {
      Promise.resolve(
        supabase.from('profiles').upsert({
          id: userUid,
          hunter_id: newProfile.hunter_id,
          display_name: newProfile.display_name,
          total_xp: newProfile.total_xp,
          current_level: newProfile.current_level,
          stats: newProfile.stats,
          clean_days: newProfile.clean_days,
          current_rank: newProfile.current_rank,
          affinity: stat,
          hp: newProfile.hp,
          mp: newProfile.mp,
          max_hp: newProfile.max_hp,
          max_mp: newProfile.max_mp,
          physical_xp: 0,
          mental_xp: 0,
        })
      ).catch((err: unknown) => console.warn('[Hunter Store] Supabase error:', err));
    }

    trackEvent(AnalyticsEvent.SYSTEM_AWAKENED, {
      hunterUid: userUid,
      hunterId: newProfile.hunter_id,
      name: newProfile.display_name,
      affinity: stat,
      level: 1,
    });

    await scheduleNotification({
      title: 'SYSTEM AWAKENING VERIFIED',
      message: `Welcome, Hunter ${newProfile.display_name} [${newProfile.hunter_id}]. Rank E assigned. The System watches.`,
      priority: 'urgent',
      category: 'system',
      playSound: true,
    });

    return newProfile;
  };

  // ============================================================
  // MISC ACTIONS
  // ============================================================

  const allocateStatPoint = (stat: string, points: number = 1) => {
    if (!profile || profile.stats[stat] === undefined) return;
    setProfile({ ...profile, stats: { ...profile.stats, [stat]: profile.stats[stat] + points } });
    trackEvent(AnalyticsEvent.STAT_SELECTED, { stat, pointsAdded: points });
  };

  const updateProfile = (updates: Partial<Profile>) => {
    if (!profile) return;
    setProfile({ ...profile, ...updates });
  };

  const addCustomQuest = (questData: Omit<Quest, 'id' | 'user_id' | 'progress' | 'completed'>) => {
    if (!profile) return;
    const newQuest: Quest = {
      ...questData,
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      user_id: profile.id,
      progress: 0,
      completed: false,
      stat_xp_type: questData.stat_xp_type || getStatXpType(questData.category),
    };
    setQuests(prev => [newQuest, ...prev]);
    scheduleNotification({
      title: 'CUSTOM QUEST REGISTERED',
      message: `"${questData.name}" has been added to your quest board.`,
      priority: 'normal',
      category: 'quest',
    });
  };

  const equipTitle = (title: string) => {
    if (!profile) return;
    if (!profile.titles.includes(title)) return;
    setProfile({ ...profile, equipped_title: title });
  };

  const allocateSkillPoint = (skill: keyof Profile['skill_points']) => {
    if (!profile || (profile.available_skill_points || 0) <= 0) return;
    setProfile({
      ...profile,
      available_skill_points: (profile.available_skill_points || 0) - 1,
      skill_points: {
        ...profile.skill_points,
        [skill]: (profile.skill_points[skill] || 0) + 1,
      },
    });
  };

  const addXp = (amount: number, source: string = 'General') => {
    if (!profile) return;
    addXpToProfile(profile, amount, source);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void addXpLegacy; // legacy — kept for reference

  const resetHunter = () => {
    localStorage.removeItem(STORAGE_PROFILE_KEY);
    localStorage.removeItem(STORAGE_QUESTS_KEY);
    localStorage.removeItem(STORAGE_AUTH_KEY);
    localStorage.removeItem(STORAGE_AFFINITY_KEY);
    localStorage.removeItem(STORAGE_ACHIEVEMENTS_KEY);
    setProfile(null);
    setQuests([]);
    setPrimaryAffinity(null);
    setUnlockedAchievements([]);
    setActiveBonus(null);
    setActiveDungeon(null);
    trackEvent(AnalyticsEvent.HUNTER_RESET);
  };

  const isOnboarded = Boolean(profile && profile.display_name);

  const value = useMemo(
    () => ({
      profile,
      quests,
      auth,
      isOnboarded,
      primaryAffinity,
      unlockedAchievements,
      activeBonus,
      activeDungeon,
      saveAwakenedProfile,
      completeQuest,
      incrementProgress,
      addXp,
      allocateStatPoint,
      updateProfile,
      resetHunter,
      addCustomQuest,
      completeBonusQuest,
      completeDungeonBreak,
      dismissDungeonBreak,
      equipTitle,
      allocateSkillPoint,
      refreshDaily,
    }),
    [profile, quests, auth, isOnboarded, primaryAffinity, unlockedAchievements, activeBonus, activeDungeon]
  );

  return <HunterContext.Provider value={value}>{children}</HunterContext.Provider>;
};

export const useHunter = (): HunterContextType => {
  const context = useContext(HunterContext);
  if (!context) throw new Error('useHunter must be used within a HunterProvider');
  return context;
};
