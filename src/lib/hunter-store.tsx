import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  type Profile,
  type Quest,
  DIFFICULTY_XP,
  calculateLevel,
  calculateRank,
} from './game-engine';
import { DEFAULT_QUESTS } from './default-quests';
import { scheduleNotification } from './notifications';
import { trackEvent, AnalyticsEvent } from './analytics';

export interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
  } | null;
}

export interface HunterContextType {
  profile: Profile | null;
  quests: Quest[];
  auth: AuthState;
  isOnboarded: boolean;
  primaryAffinity: string | null;
  saveAwakenedProfile: (name: string, primaryStat: string) => Promise<Profile>;
  completeQuest: (questId: string) => void;
  incrementProgress: (questId: string, amount?: number) => void;
  addXp: (amount: number, source?: string) => void;
  allocateStatPoint: (stat: string, points?: number) => void;
  updateProfile: (updates: Partial<Profile>) => void;
  resetHunter: () => void;
}

const HunterContext = createContext<HunterContextType | undefined>(undefined);

const STORAGE_PROFILE_KEY = 'hunter_system_profile';
const STORAGE_QUESTS_KEY = 'hunter_system_quests';
const STORAGE_AUTH_KEY = 'hunter_system_auth';
const STORAGE_AFFINITY_KEY = 'hunter_system_affinity';

export const HunterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<Profile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROFILE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [quests, setQuests] = useState<Quest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_QUESTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [auth, setAuth] = useState<AuthState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_AUTH_KEY);
      return saved
        ? JSON.parse(saved)
        : { isAuthenticated: false, user: null };
    } catch {
      return { isAuthenticated: false, user: null };
    }
  });

  const [primaryAffinity, setPrimaryAffinity] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_AFFINITY_KEY) || null;
    } catch {
      return null;
    }
  });

  // Sync profile to localStorage
  useEffect(() => {
    if (profile) {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(STORAGE_PROFILE_KEY);
    }
  }, [profile]);

  // Sync quests to localStorage
  useEffect(() => {
    if (quests.length > 0) {
      localStorage.setItem(STORAGE_QUESTS_KEY, JSON.stringify(quests));
    }
  }, [quests]);

  // Sync auth to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(auth));
  }, [auth]);

  // Sync affinity to localStorage
  useEffect(() => {
    if (primaryAffinity) {
      localStorage.setItem(STORAGE_AFFINITY_KEY, primaryAffinity);
    } else {
      localStorage.removeItem(STORAGE_AFFINITY_KEY);
    }
  }, [primaryAffinity]);

  /**
   * Complete Awakening Ceremony
   */
  const saveAwakenedProfile = async (name: string, stat: string): Promise<Profile> => {
    const hunterId = 'hunter-' + Math.random().toString(36).substring(2, 9);

    const initialStats: Record<string, number> = {
      STR: 10,
      AGI: 10,
      VIT: 10,
      INT: 10,
      PERC: 10,
    };
    // Bonus on chosen affinity
    if (initialStats[stat] !== undefined) {
      initialStats[stat] += 5;
    }

    const newProfile: Profile = {
      id: hunterId,
      display_name: name.trim() || 'Awakened Hunter',
      total_xp: 15, // Initial awakening bonus
      current_level: 1,
      stats: initialStats,
      clean_days: 1,
      current_rank: 'E-Rank',
    };

    // Instantiate default quests for this hunter
    const initialQuests: Quest[] = DEFAULT_QUESTS.map((dq) => ({
      id: dq.id,
      user_id: hunterId,
      name: dq.name,
      difficulty: dq.difficulty,
      progress: 0,
      target: dq.target,
      stat: dq.stat,
      category: dq.category,
      description: dq.description,
      completed: false,
      xp_reward: DIFFICULTY_XP[dq.difficulty] || 15,
    }));

    setProfile(newProfile);
    setQuests(initialQuests);
    setPrimaryAffinity(stat);
    setAuth({
      isAuthenticated: true,
      user: {
        id: hunterId,
        email: `${name.toLowerCase().replace(/\s+/g, '')}@hunter.system`,
      },
    });

    trackEvent(AnalyticsEvent.SYSTEM_AWAKENED, {
      hunterId,
      name: newProfile.display_name,
      affinity: stat,
      level: 1,
    });

    await scheduleNotification({
      title: 'SYSTEM AWAKENING VERIFIED',
      message: `Welcome, Hunter ${newProfile.display_name}. You have been assigned Rank E. The System will now monitor your growth.`,
      priority: 'urgent',
      category: 'system',
      playSound: true,
    });

    return newProfile;
  };

  /**
   * Add XP with automatic Level Up and Rank Up detection
   */
  const addXp = (amount: number, source: string = 'General') => {
    if (!profile) return;

    const prevLevel = profile.current_level;
    const prevRank = profile.current_rank;
    const newTotalXp = profile.total_xp + amount;
    const newLevel = calculateLevel(newTotalXp);
    const newRank = calculateRank(newLevel);

    const levelDiff = newLevel - prevLevel;
    const updatedStats = { ...profile.stats };

    // Grant automatic stat increase upon level up
    if (levelDiff > 0) {
      Object.keys(updatedStats).forEach((key) => {
        updatedStats[key] += levelDiff * 2;
      });
      if (primaryAffinity && updatedStats[primaryAffinity] !== undefined) {
        updatedStats[primaryAffinity] += levelDiff;
      }
    }

    const updatedProfile: Profile = {
      ...profile,
      total_xp: newTotalXp,
      current_level: newLevel,
      current_rank: newRank,
      stats: updatedStats,
    };

    setProfile(updatedProfile);

    trackEvent(AnalyticsEvent.QUEST_PROGRESS, {
      xpGained: amount,
      source,
      totalXp: newTotalXp,
      level: newLevel,
    });

    // Level-up notification & sound
    if (newLevel > prevLevel) {
      trackEvent(AnalyticsEvent.LEVEL_UP, {
        previousLevel: prevLevel,
        newLevel,
      });

      scheduleNotification({
        title: `LEVEL UP: LEVEL ${newLevel}!`,
        message: `Your spiritual density has expanded. All attributes boosted by +${levelDiff * 2}.`,
        priority: 'high',
        category: 'level_up',
        playSound: true,
      });
    }

    // Rank-up celebration
    if (newRank !== prevRank) {
      trackEvent(AnalyticsEvent.RANK_PROMOTION, {
        previousRank: prevRank,
        newRank,
      });

      scheduleNotification({
        title: `RANK PROMOTION: ${newRank.toUpperCase()}!`,
        message: `The Hunter Association has recognized your awakening to ${newRank}!`,
        priority: 'urgent',
        category: 'rank_up',
        playSound: true,
      });
    }
  };

  /**
   * Complete a specific quest
   */
  const completeQuest = (questId: string) => {
    const quest = quests.find((q) => q.id === questId);
    if (!quest || quest.completed) return;

    const xpEarned = quest.xp_reward || DIFFICULTY_XP[quest.difficulty] || 25;

    // Mark quest completed
    setQuests((prev) =>
      prev.map((q) =>
        q.id === questId ? { ...q, progress: q.target, completed: true } : q
      )
    );

    // Boost the associated stat
    if (profile && quest.stat && profile.stats[quest.stat] !== undefined) {
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              stats: {
                ...prev.stats,
                [quest.stat]: (prev.stats[quest.stat] || 10) + quest.difficulty,
              },
            }
          : prev
      );
    }

    addXp(xpEarned, `Quest: ${quest.name}`);

    trackEvent(AnalyticsEvent.QUEST_COMPLETED, {
      questId,
      name: quest.name,
      difficulty: quest.difficulty,
      xpEarned,
      statBoosted: quest.stat,
    });

    scheduleNotification({
      title: 'QUEST CLEARED',
      message: `[${quest.name}] completed! +${xpEarned} XP gained. ${quest.stat} +${quest.difficulty}.`,
      priority: 'normal',
      category: 'quest',
      playSound: true,
    });
  };

  /**
   * Increment progress on a quest
   */
  const incrementProgress = (questId: string, amount: number = 1) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id !== questId || q.completed) return q;
        const newProgress = Math.min(q.target, q.progress + amount);
        const isDone = newProgress >= q.target;
        return {
          ...q,
          progress: newProgress,
          completed: isDone,
        };
      })
    );

    const quest = quests.find((q) => q.id === questId);
    if (quest && quest.progress + amount >= quest.target && !quest.completed) {
      completeQuest(questId);
    }
  };

  /**
   * Allocate stat points directly
   */
  const allocateStatPoint = (stat: string, points: number = 1) => {
    if (!profile || profile.stats[stat] === undefined) return;
    setProfile({
      ...profile,
      stats: {
        ...profile.stats,
        [stat]: profile.stats[stat] + points,
      },
    });
    trackEvent(AnalyticsEvent.STAT_SELECTED, { stat, pointsAdded: points });
  };

  /**
   * Update profile fields directly
   */
  const updateProfile = (updates: Partial<Profile>) => {
    if (!profile) return;
    setProfile({
      ...profile,
      ...updates,
    });
  };

  /**
   * Full system reset (to allow re-running Awakening onboarding)
   */
  const resetHunter = () => {
    localStorage.removeItem(STORAGE_PROFILE_KEY);
    localStorage.removeItem(STORAGE_QUESTS_KEY);
    localStorage.removeItem(STORAGE_AUTH_KEY);
    localStorage.removeItem(STORAGE_AFFINITY_KEY);
    setProfile(null);
    setQuests([]);
    setPrimaryAffinity(null);
    setAuth({ isAuthenticated: false, user: null });
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
      saveAwakenedProfile,
      completeQuest,
      incrementProgress,
      addXp,
      allocateStatPoint,
      updateProfile,
      resetHunter,
    }),
    [profile, quests, auth, isOnboarded, primaryAffinity]
  );

  return <HunterContext.Provider value={value}>{children}</HunterContext.Provider>;
};

export const useHunter = (): HunterContextType => {
  const context = useContext(HunterContext);
  if (!context) {
    throw new Error('useHunter must be used within a HunterProvider');
  }
  return context;
};
