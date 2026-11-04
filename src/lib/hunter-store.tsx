import { startPresence, stopPresence } from './presence-service';
import { claimUsername, claimHunterId, syncPublicPlayer } from './social-service';
import { leaveGuild } from './guild-service';
import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import {
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from './firebase';
import { useAuth } from './auth';
import {
  type Profile,
  type Quest,
  type DifficultyGrade,
  type QuestCategory,
  type StatXpType,
  type HunterStat,
  DIFFICULTY_XP,
  DIFFICULTY_STAT_XP,
  DIFFICULTY_STAT_POINTS,
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
  createDefaultProfile,
  normalizeUsername,
  DEFAULT_PERSONAL_RECORDS,
  type PersonalRecords,
  type SystemLogEntry,
} from './game-engine';
import QUEST_LIBRARY, { type LibraryQuest } from './quest-library';
import { checkNewAchievements, type NewUnlock } from './achievements';
import {
  generateDailyPool,
  loadTodayDailyState,
  completeDungeonBreak as markDungeonComplete,
  dismissDungeonBreak as markDungeonDismissed,
  completeBonusQuestInState,
  completeBossQuestInState,
  dismissBossQuestInState,
  calculateStreakUpdate,
  type DungeonBreak,
  type BossQuest,
} from './daily-system';
import { audioService } from './audio-service';
import { scheduleNotification } from './notifications';
import {
  serializeProfileForFirestore,
  deserializeProfileFromFirestore,
  serializeQuestForFirestore,
  deserializeQuestFromFirestore,
} from './firestore-converter';

// ============================================================
// CONTEXT TYPE
// ============================================================

export interface HunterContextType {
  profile: Profile | null;
  quests: Quest[];
  dailyQuests: Quest[];
  isOnboarded: boolean;
  isLoading: boolean;
  needsAwakening: boolean;
  primaryAffinity: string | null;
  unlockedAchievements: string[];
  activeBonus: Quest | null;
  activeDungeon: DungeonBreak | null;
  activeBossQuest: BossQuest | null;
  promotionCelebration: PromotionCelebration | null;

  // Level Up Modal State (1:1 with Flutter HunterProvider)
  showLevelUpModal: boolean;
  leveledUpTo: number;
  newRankAchieved: string;
  dismissLevelUpModal: () => void;

  // Actions
  saveAwakenedProfile: (name: string, primaryStat: string, customUsername?: string) => Promise<Profile>;
  completeQuest: (questId: string) => void;
  incrementProgress: (questId: string, amount?: number) => void;
  addXp: (amount: number, source?: string) => void;
  allocateStatPoint: (stat: string, points?: number) => void;
  updateProfile: (updates: Partial<Profile>) => void;
  resetHunter: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  addCustomQuest: (quest: Omit<Quest, 'id' | 'user_id' | 'progress' | 'completed'>) => void;
  completeBonusQuest: () => void;
  completeDungeonBreak: () => void;
  dismissDungeonBreak: () => void;
  completeBossQuest: () => void;
  dismissBossQuest: () => void;
  dismissPromotionCelebration: () => void;
  updatePersonalRecord: (recordId: string, newValue: number, customName?: string, unit?: string, category?: 'physical' | 'mental' | 'coding' | 'study') => void;
  equipTitle: (title: string) => void;
  allocateSkillPoint: (skill: keyof Profile['skill_points']) => void;
  refreshDaily: () => void;
  acceptLibraryQuest: (quest: LibraryQuest) => void;
  deleteQuest: (questId: string) => void;
  lastDeletedQuest: Quest | null;
  undoDeleteQuest: () => void;
  isOnline: boolean;
}

export interface PromotionCelebration {
  prevRank: string;
  newRank: string;
  statPointsGranted: number;
  skillPointsGranted: number;
  unlockedTitles: string[];
  frameUnlocked?: string;
  hpBonus: number;
  mpBonus: number;
}

export const RANK_STAT_POINT_REWARDS: Record<string, number> = {
  'D-Rank': 10,
  'C-Rank': 15,
  'B-Rank': 20,
  'A-Rank': 25,
  'S-Rank': 35,
};

const HunterContext = createContext<HunterContextType | undefined>(undefined);

// Local Storage Keys (UID-Scoped for Cross-Account Isolation)
const getStorageProfileKey = (uid?: string) => uid ? `hunter_system_profile_${uid}` : 'hunter_system_profile';
const getStorageQuestsKey = (uid?: string) => uid ? `hunter_system_quests_${uid}` : 'hunter_system_quests';
const getStorageAchievementsKey = (uid?: string) => uid ? `hunter_system_achievements_${uid}` : 'hunter_system_achievements';

// ============================================================
// PROVIDER IMPLEMENTATION
// ============================================================

export const HunterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, deleteAccount: deleteAuthAccount } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [dailyQuests, setDailyQuests] = useState<Quest[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(['first_blood']);

  const [activeBonus, setActiveBonus] = useState<Quest | null>(null);
  const [activeDungeon, setActiveDungeon] = useState<DungeonBreak | null>(null);
  const [activeBossQuest, setActiveBossQuest] = useState<BossQuest | null>(null);
  const [promotionCelebration, setPromotionCelebration] = useState<PromotionCelebration | null>(null);
  const [lastDeletedQuest, setLastDeletedQuest] = useState<Quest | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissPromotionCelebration = () => setPromotionCelebration(null);

  // Level Up Modal State
  const [showLevelUpModal, setShowLevelUpModal] = useState<boolean>(false);
  const [leveledUpTo, setLeveledUpTo] = useState<number>(1);
  const [newRankAchieved, setNewRankAchieved] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [needsAwakening, setNeedsAwakening] = useState<boolean>(false);
  const isOnboarded = !!profile && !needsAwakening;
  const primaryAffinity = profile?.affinity || null;

  const isSavingRef = useRef<boolean>(false);

  // Connectivity Status Tracker
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Account switching & storage isolation by UID
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setQuests([]);
      setUnlockedAchievements(['first_blood']);
      setActiveBonus(null);
      setActiveDungeon(null);
      setActiveBossQuest(null);
      setNeedsAwakening(false);
      setIsLoading(false);
      return;
    }

    // Load scoped cache for this specific user if not yet in state
    try {
      const savedProf = localStorage.getItem(getStorageProfileKey(user.id));
      if (savedProf) {
        const parsed = JSON.parse(savedProf);
        if (parsed && parsed.id === user.id) {
          setProfile(parsed);
        }
      }
      const savedQuests = localStorage.getItem(getStorageQuestsKey(user.id));
      if (savedQuests) {
        setQuests(JSON.parse(savedQuests));
      }
      const savedAch = localStorage.getItem(getStorageAchievementsKey(user.id));
      if (savedAch) {
        setUnlockedAchievements(JSON.parse(savedAch));
      }
    } catch {
      // quiet fallback
    }
  }, [user?.id]);

  // Sync to scoped localStorage as offline fallback cache
  useEffect(() => {
    if (!user?.id) return;
    if (profile && profile.id === user.id) {
      localStorage.setItem(getStorageProfileKey(user.id), JSON.stringify(profile));
    }
  }, [profile, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    if (quests.length > 0) {
      localStorage.setItem(getStorageQuestsKey(user.id), JSON.stringify(quests));
    }
  }, [quests, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    localStorage.setItem(getStorageAchievementsKey(user.id), JSON.stringify(unlockedAchievements));
  }, [unlockedAchievements, user?.id]);

  // Load daily cycle state on mount
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
      const { bonusQuest, dungeonBreak } = generateDailyPool(profile, profile.id);
      if (bonusQuest) setActiveBonus(bonusQuest);
      if (dungeonBreak) setActiveDungeon(dungeonBreak);
    }
  }, [profile?.id]);

  // ============================================================
  // REAL-TIME FIRESTORE LISTENER (Cross-Platform Synchronization)
  // ============================================================
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const cleanupPresence = startPresence(user.id);
    const hunterDocRef = doc(firestore, 'hunters', user.id);

    const unsubscribe: Unsubscribe = onSnapshot(
      hunterDocRef,
      (snapshot) => {
        setIsLoading(false);
        if (snapshot.exists()) {
          const rawData = snapshot.data();
          const remoteProfile = deserializeProfileFromFirestore(rawData);

          // Migration safeguard: Ensure valid username & standard Hunter ID
          if (!remoteProfile.username || remoteProfile.username.length < 3) {
            const fallback = (remoteProfile.display_name || user.email?.split('@')[0] || 'hunter')
              .toLowerCase()
              .replace(/[^a-z0-9_]/g, '');
            claimUsername(user.id, fallback).then((u) => {
              remoteProfile.username = u;
              syncPublicPlayer(remoteProfile);
            }).catch(() => {});
          }
          if (!remoteProfile.hunter_id || !/^HUNTR-[A-Z0-9]{8}$/.test(remoteProfile.hunter_id)) {
            claimHunterId(user.id, undefined, remoteProfile.username).then((hid) => {
              remoteProfile.hunter_id = hid;
              syncPublicPlayer(remoteProfile);
            }).catch(() => {});
          }

          // Update local profile state
          setProfile(remoteProfile);

          // If activeQuests are present in the Firestore document, deserialize and sync
          if (Array.isArray(rawData.activeQuests) && rawData.activeQuests.length > 0) {
            const remoteQuests: Quest[] = rawData.activeQuests.map((q: Record<string, unknown>) =>
              deserializeQuestFromFirestore(q, user.id)
            );
            setQuests(remoteQuests);
          }

          if (Array.isArray(rawData.badges)) {
            setUnlockedAchievements(rawData.badges);
          }
        } else {
          // No profile in cloud yet: user needs to go through System Awakening
          setNeedsAwakening(true);
          // If hunter profile doesn't exist, purge any stale leaderboard record
          const leaderboardDocRef = doc(firestore, 'leaderboard', user.id);
          deleteDoc(leaderboardDocRef).catch(() => {});
        }
      },
      (error) => {
        console.warn('[Hunter Store] Firestore snapshot listener notice:', error);
        setIsLoading(false);
      }
    );

    return () => {
      cleanupPresence();
      unsubscribe();
    };
  }, [user?.id]);

  // Synchronizes profile and quests to Cloud Firestore with merge
  const syncToFirestore = async (profToSync: Profile, questsToSync: Quest[]) => {
    if (!profToSync.id || isSavingRef.current) return;
    isSavingRef.current = true;

    try {
      const hunterDocRef = doc(firestore, 'hunters', profToSync.id);
      const serializedProfile = serializeProfileForFirestore(profToSync);
      const serializedQuests = questsToSync.map(serializeQuestForFirestore);

      // Save user document
      await setDoc(
        hunterDocRef,
        {
          ...serializedProfile,
          activeQuests: serializedQuests,
        },
        { merge: true }
      );

      // Sync public player profile & leaderboard registry
      await syncPublicPlayer(profToSync);
    } catch (err) {
      console.warn('[Hunter Store] Firestore write notice (offline or permission):', err);
    } finally {
      isSavingRef.current = false;
    }
  };

  const dismissLevelUpModal = () => {
    setShowLevelUpModal(false);
  };

  // ============================================================
  // QUEST ACTIONS
  // ============================================================

  const completingQuestsRef = useRef<Set<string>>(new Set());

  const completeQuest = (questId: string) => {
    if (completingQuestsRef.current.has(questId)) return;
    const quest = quests.find((q) => q.id === questId);
    if (!quest || quest.completed) return;
    if (!profile) return;

    completingQuestsRef.current.add(questId);
    setTimeout(() => {
      completingQuestsRef.current.delete(questId);
    }, 1500);

    const baseXp = quest.xp_reward || (DIFFICULTY_XP[quest.difficulty] ?? 25);
    const statXpAmount = quest.stat_xp_reward || (DIFFICULTY_STAT_XP[quest.difficulty] ?? 10);
    const statXpType = quest.stat_xp_type || getStatXpType(quest.category);

    // Apply streak multiplier
    const streakMultiplier = getStreakBonusMultiplier(profile.streak || 0);
    const xpEarned = Math.round(baseXp * streakMultiplier);

    // Mark quest completed
    const updatedQuests = quests.map((q) =>
      q.id === questId ? { ...q, progress: q.target, completed: true } : q
    );
    setQuests(updatedQuests);

    // Update stats and profile
    const currentStatVal = profile.stats[quest.stat] ?? 10;
    const updatedStats = {
      ...profile.stats,
      [quest.stat]: currentStatVal + 1,
    };

    const isPhysical = ['physical', 'fitness', 'health'].includes(quest.category);
    const isMental = ['mental', 'knowledge', 'learning', 'coding', 'study'].includes(quest.category);
    const isCoding = quest.category === 'coding';

    const newPhysicalXp = isPhysical ? profile.physical_xp + statXpAmount : profile.physical_xp;
    const newMentalXp = isMental ? profile.mental_xp + statXpAmount : profile.mental_xp;

    const newMaxHp = calculateMaxHp(newPhysicalXp, profile.current_rank);
    const newMaxMp = calculateMaxMp(newMentalXp, profile.current_rank);

    // Streak update
    const streakUpdate = calculateStreakUpdate(profile, true, isPhysical, isMental);

    const logEntry = {
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      event_type: 'quest_complete' as const,
      message: `Completed: ${quest.name} (+${xpEarned} XP)`,
      xp: xpEarned,
    };

    let updatedProfile: Profile = {
      ...profile,
      stats: updatedStats,
      quests_completed: (profile.quests_completed || 0) + 1,
      physical_quests_completed: isPhysical
        ? (profile.physical_quests_completed || 0) + 1
        : profile.physical_quests_completed || 0,
      mental_quests_completed: isMental
        ? (profile.mental_quests_completed || 0) + 1
        : profile.mental_quests_completed || 0,
      coding_quests_completed: isCoding
        ? (profile.coding_quests_completed || 0) + 1
        : profile.coding_quests_completed || 0,
      physical_xp: newPhysicalXp,
      mental_xp: newMentalXp,
      max_hp: newMaxHp,
      max_mp: newMaxMp,
      hp: Math.min(newMaxHp, profile.hp + 20),
      mp: Math.min(newMaxMp, profile.mp + 15),
      ...streakUpdate,
      system_log: [logEntry, ...(profile.system_log || [])].slice(0, 25),
    };

    // Add XP and check for level-ups
    const finalProfile = applyXpToProfile(updatedProfile, xpEarned, quest.name);
    setProfile(finalProfile);

    // Sound effect
    audioService.playSuccess();

    // Check achievements
    checkAchievements(finalProfile, updatedQuests);

    // Write to Firestore
    syncToFirestore(finalProfile, updatedQuests);
  };

  const incrementProgress = (questId: string, amount: number = 1) => {
    const quest = quests.find((q) => q.id === questId);
    if (!quest || quest.completed) return;

    const newProgress = Math.min(quest.target, (quest.progress || 0) + amount);
    audioService.playClick();

    if (newProgress >= quest.target) {
      completeQuest(questId);
    } else {
      const updatedQuests = quests.map((q) =>
        q.id === questId ? { ...q, progress: newProgress } : q
      );
      setQuests(updatedQuests);
      if (profile) syncToFirestore(profile, updatedQuests);
    }
  };

  const acceptLibraryQuest = (libQuest: LibraryQuest) => {
    if (!user) return;
    const newQuest: Quest = {
      id: `${libQuest.id}_${Date.now()}`,
      user_id: user.id,
      name: libQuest.name,
      description: libQuest.description,
      difficulty: libQuest.difficulty,
      category: libQuest.category,
      stat: libQuest.stat,
      progress: 0,
      target: libQuest.target,
      completed: false,
      xp_reward: DIFFICULTY_XP[libQuest.difficulty] || 20,
      stat_xp_reward: DIFFICULTY_STAT_XP[libQuest.difficulty] || 10,
      stat_xp_type: getStatXpType(libQuest.category),
      repeatable: 'daily',
    };

    const updatedQuests = [...quests, newQuest];
    setQuests(updatedQuests);
    audioService.playClick();
    if (profile) syncToFirestore(profile, updatedQuests);
  };

  const addCustomQuest = (questData: Omit<Quest, 'id' | 'user_id' | 'progress' | 'completed'>) => {
    if (!user) return;
    const newQuest: Quest = {
      ...questData,
      id: `custom_${Date.now()}`,
      user_id: user.id,
      progress: 0,
      completed: false,
    };

    const updatedQuests = [...quests, newQuest];
    setQuests(updatedQuests);
    audioService.playClick();
    if (profile) syncToFirestore(profile, updatedQuests);
  };

  const deleteQuest = (questId: string) => {
    const questToDelete = quests.find((q) => q.id === questId);
    if (questToDelete) {
      setLastDeletedQuest(questToDelete);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      undoTimerRef.current = setTimeout(() => {
        setLastDeletedQuest(null);
      }, 7000);
    }
    const updatedQuests = quests.filter((q) => q.id !== questId);
    setQuests(updatedQuests);
    audioService.playClick();
    if (profile) syncToFirestore(profile, updatedQuests);
    scheduleNotification({
      title: 'QUEST EXPUNGED',
      message: 'The directive has been removed from your active board. Click Undo to restore.',
      priority: 'low',
      category: 'system',
    });
  };

  const undoDeleteQuest = () => {
    if (!lastDeletedQuest) return;
    const restored = lastDeletedQuest;
    setLastDeletedQuest(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    const updated = [...quests, restored];
    setQuests(updated);
    audioService.playSuccess();
    if (profile) syncToFirestore(profile, updated);
    scheduleNotification({
      title: 'QUEST RESTORED',
      message: `Directive "${restored.name}" has been restored to your active board.`,
      priority: 'low',
      category: 'system',
    });
  };

  // ============================================================
  // DUNGEON BREAK
  // ============================================================

  const completeDungeonBreak = () => {
    if (!activeDungeon || !profile) return;
    markDungeonComplete();

    const xpEarned = activeDungeon.xp_reward;
    const statBoost = 2; // +2 to all attributes

    const updatedStats = { ...profile.stats };
    Object.keys(updatedStats).forEach((key) => {
      updatedStats[key] = (updatedStats[key] || 10) + statBoost;
    });

    const logEntry = {
      id: `dungeon-${Date.now()}`,
      timestamp: Date.now(),
      event_type: 'dungeon' as const,
      message: `DUNGEON CONQUERED: ${activeDungeon.challenge} (+${xpEarned} XP)`,
      xp: xpEarned,
    };

    const updatedProfile: Profile = {
      ...profile,
      stats: updatedStats,
      system_log: [logEntry, ...(profile.system_log || [])].slice(0, 25),
    };

    setActiveDungeon(null);
    audioService.playLevelUp();

    const finalProfile = applyXpToProfile(updatedProfile, xpEarned, 'Dungeon Break');
    setProfile(finalProfile);
    checkAchievements(finalProfile, quests);
    syncToFirestore(finalProfile, quests);
  };

  const dismissDungeonBreak = () => {
    if (activeDungeon) {
      markDungeonDismissed();
      setActiveDungeon(null);
      audioService.playClick();
    }
  };

  const completeBonusQuest = () => {
    if (!activeBonus || !profile) return;
    completeBonusQuestInState();

    const xpEarned = activeBonus.xp_reward || 150;
    setActiveBonus(null);
    audioService.playSuccess();

    const finalProfile = applyXpToProfile(profile, xpEarned, `Bonus: ${activeBonus.name}`);
    setProfile(finalProfile);
    syncToFirestore(finalProfile, quests);
  };

  const completeBossQuest = () => {
    if (!activeBossQuest || !profile) return;
    completeBossQuestInState();

    const xpEarned = activeBossQuest.xp_reward || 350;
    const statBoost = 3;

    const updatedStats = { ...profile.stats };
    Object.keys(updatedStats).forEach((key) => {
      updatedStats[key] = (updatedStats[key] || 10) + statBoost;
    });

    const logEntry: SystemLogEntry = {
      id: `boss-${Date.now()}`,
      timestamp: Date.now(),
      event_type: 'dungeon',
      message: `BOSS SLAIN: ${activeBossQuest.boss_name} (+${xpEarned} XP)`,
      xp: xpEarned,
    };

    const updatedProfile: Profile = {
      ...profile,
      stats: updatedStats,
      system_log: [logEntry, ...(profile.system_log || [])].slice(0, 25),
    };

    setActiveBossQuest(null);
    audioService.playLevelUp();

    const finalProfile = applyXpToProfile(updatedProfile, xpEarned, 'Boss Quest');
    setProfile(finalProfile);
    checkAchievements(finalProfile, quests);
    syncToFirestore(finalProfile, quests);
  };

  const dismissBossQuest = () => {
    if (activeBossQuest) {
      dismissBossQuestInState();
      setActiveBossQuest(null);
      audioService.playClick();
    }
  };

  // ============================================================
  // ATTRIBUTE & SKILL ALLOCATION
  // ============================================================

  const allocateStatPoint = (statKey: string) => {
    if (!profile) return;
    if ((profile.available_skill_points || 0) <= 0) return;

    const currentVal = profile.stats[statKey] || 10;
    const updatedProfile: Profile = {
      ...profile,
      available_skill_points: profile.available_skill_points - 1,
      stats: {
        ...profile.stats,
        [statKey]: currentVal + 1,
      },
    };

    setProfile(updatedProfile);
    audioService.playClick();
    checkAchievements(updatedProfile, quests);
    syncToFirestore(updatedProfile, quests);
  };

  const allocateSkillPoint = (skillKey: keyof Profile['skill_points']) => {
    if (!profile) return;
    if ((profile.available_skill_points || 0) <= 0) return;

    const currentVal = profile.skill_points[skillKey] || 0;
    const updatedProfile: Profile = {
      ...profile,
      available_skill_points: profile.available_skill_points - 1,
      skill_points: {
        ...profile.skill_points,
        [skillKey]: currentVal + 1,
      },
    };

    setProfile(updatedProfile);
    audioService.playClick();
    syncToFirestore(updatedProfile, quests);
  };

  const equipTitle = (title: string) => {
    if (!profile) return;
    const updatedProfile: Profile = {
      ...profile,
      equipped_title: title,
    };
    setProfile(updatedProfile);
    audioService.playClick();
    syncToFirestore(updatedProfile, quests);
  };

  // ============================================================
  // XP & LEVEL PROGRESSION ENGINE
  // ============================================================

  const updatePersonalRecord = (
    recordId: string,
    newValue: number,
    customName?: string,
    unit?: string,
    category?: 'physical' | 'mental' | 'coding' | 'study'
  ) => {
    if (!profile) return;
    const existingRecord = profile.personal_records[recordId];
    if (!existingRecord && !customName) return;

    const record = existingRecord || {
      id: recordId,
      name: customName || recordId,
      value: 0,
      unit: unit || 'units',
      category: category || 'physical',
      achievedAt: new Date().toISOString(),
    };

    const isNewRecord = newValue > record.value;
    const logEntry = isNewRecord ? {
      id: `log-${Date.now()}-rec`,
      timestamp: Date.now(),
      event_type: 'record' as const,
      message: `📈 NEW PERSONAL RECORD: ${record.name} — ${record.value} → ${newValue} ${record.unit}`,
    } : null;

    setProfile(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        personal_records: {
          ...prev.personal_records,
          [recordId]: {
            ...record,
            ...(customName ? { name: customName } : {}),
            ...(unit ? { unit } : {}),
            ...(category ? { category } : {}),
            previousValue: record.value,
            value: newValue,
            achievedAt: new Date().toISOString(),
          },
        },
        system_log: logEntry
          ? [logEntry, ...(prev.system_log || [])].slice(0, 20)
          : prev.system_log,
      };
    });

    if (isNewRecord) {
      scheduleNotification({
        title: '📈 NEW PERSONAL RECORD',
        message: `${record.name}: ${record.value} → ${newValue} ${record.unit}. Keep pushing!`,
        priority: 'high',
        category: 'system',
        playSound: true,
      });
    }
  };

  const addXp = (amount: number, source: string = 'General') => {
    if (!profile) return;
    const finalProfile = applyXpToProfile(profile, amount, source);
    setProfile(finalProfile);
    syncToFirestore(finalProfile, quests);
  };

  const applyXpToProfile = (current: Profile, amount: number, source: string): Profile => {
    const prevLevel = current.current_level;
    const prevRank = current.current_rank;
    const newTotalXp = current.total_xp + amount;
    const newLevel = calculateLevel(newTotalXp);
    const newRank = calculateRank(newLevel);
    const levelsGained = newLevel - prevLevel;
    const rankChanged = newRank !== prevRank;

    let updatedSP = current.available_skill_points || 0;
    let updatedStatPoints = current.available_stat_points ?? current.available_skill_points ?? 0;
    const updatedTitles = [...(current.titles || [])];

    if (levelsGained > 0) {
      updatedSP += levelsGained * 3;
      updatedStatPoints += levelsGained * 2;
      setLeveledUpTo(newLevel);
      setNewRankAchieved(rankChanged ? newRank : '');
      setShowLevelUpModal(true);
      audioService.playLevelUp();
    }

    if (rankChanged) {
      const rankBonusStats = RANK_STAT_POINT_REWARDS[newRank] || 0;
      updatedStatPoints += rankBonusStats;
      const titlesForRank = RANK_TITLES[newRank] || [];
      titlesForRank.forEach((t) => {
        if (!updatedTitles.includes(t)) updatedTitles.push(t);
      });
      const newFrame = PROFILE_FRAMES[newRank] || current.profile_frame;
      const hpBonus = (HP_BY_RANK[newRank] || 100) - (HP_BY_RANK[prevRank] || 100);
      const mpBonus = (MP_BY_RANK[newRank] || 100) - (MP_BY_RANK[prevRank] || 100);

      setPromotionCelebration({
        prevRank,
        newRank,
        statPointsGranted: rankBonusStats,
        skillPointsGranted: 5,
        unlockedTitles: titlesForRank,
        frameUnlocked: newFrame,
        hpBonus: Math.max(0, hpBonus),
        mpBonus: Math.max(0, mpBonus),
      });
    }

    return {
      ...current,
      total_xp: newTotalXp,
      current_level: newLevel,
      current_rank: newRank,
      available_skill_points: updatedSP,
      available_stat_points: updatedStatPoints,
      titles: updatedTitles,
      profile_frame: rankChanged && PROFILE_FRAMES[newRank] ? PROFILE_FRAMES[newRank] : current.profile_frame,
      max_hp: calculateMaxHp(current.physical_xp, newRank),
      max_mp: calculateMaxMp(current.mental_xp, newRank),
    };
  };

  const checkAchievements = (currentProf: Profile, currentQuests: Quest[]) => {
    const newUnlocks = checkNewAchievements(currentProf, currentQuests, unlockedAchievements);
    if (newUnlocks.length === 0) return;

    const newIds = newUnlocks.map((u) => u.id);
    const allUnlocked = [...unlockedAchievements, ...newIds];
    setUnlockedAchievements(allUnlocked);

    let updatedProf = { ...currentProf };
    newUnlocks.forEach((unlock: NewUnlock) => {
      if (unlock.title_unlock && !updatedProf.titles.includes(unlock.title_unlock)) {
        updatedProf.titles = [...updatedProf.titles, unlock.title_unlock];
      }
      if (unlock.badge_id && !updatedProf.badges.includes(unlock.badge_id)) {
        updatedProf.badges = [...updatedProf.badges, unlock.badge_id];
      }
      updatedProf = applyXpToProfile(updatedProf, unlock.xp_reward, `Achievement: ${unlock.name}`);
    });

    setProfile(updatedProf);
    syncToFirestore(updatedProf, currentQuests);
  };

  const saveAwakenedProfile = async (name: string, primaryStat: string, customUsername?: string): Promise<Profile> => {
    const uid = user?.id || `hunter_${Date.now()}`;
    const targetUsername = customUsername || name;
    let cleanUsername = targetUsername.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) cleanUsername = 'hunter_' + Math.random().toString(36).slice(2, 6);
    
    cleanUsername = await claimUsername(uid, cleanUsername);
    const hid = await claimHunterId(uid, undefined, cleanUsername);
    const newProfile = createDefaultProfile(uid, name, primaryStat, cleanUsername);
    newProfile.hunter_id = hid;
    newProfile.username = cleanUsername;

    // Create starter quests matching Flutter
    const starterQuests: Quest[] = [
      {
        id: `starter-1_${Date.now()}`,
        user_id: uid,
        name: '20 Push-ups',
        description: 'Standard push-ups with proper form',
        difficulty: 'E',
        category: 'physical',
        stat: 'STR',
        progress: 0,
        target: 20,
        completed: false,
        xp_reward: 15,
        stat_xp_reward: 10,
        stat_xp_type: 'physical',
        repeatable: 'daily',
      },
      {
        id: `starter-2_${Date.now()}`,
        user_id: uid,
        name: '30s Plank',
        description: 'Core stabilization hold',
        difficulty: 'E',
        category: 'physical',
        stat: 'VIT',
        progress: 0,
        target: 30,
        completed: false,
        xp_reward: 15,
        stat_xp_reward: 10,
        stat_xp_type: 'physical',
        repeatable: 'daily',
      },
      {
        id: `starter-3_${Date.now()}`,
        user_id: uid,
        name: 'LeetCode Problem',
        description: 'Solve 1 algorithmic or coding problem',
        difficulty: 'D',
        category: 'coding',
        stat: 'INT',
        progress: 0,
        target: 1,
        completed: false,
        xp_reward: 35,
        stat_xp_reward: 20,
        stat_xp_type: 'mental',
        repeatable: 'daily',
      },
      {
        id: `starter-4_${Date.now()}`,
        user_id: uid,
        name: '20 Pages Deep Reading',
        description: 'Continuous technical or personal development reading',
        difficulty: 'E',
        category: 'study',
        stat: 'PERC',
        progress: 0,
        target: 20,
        completed: false,
        xp_reward: 15,
        stat_xp_reward: 10,
        stat_xp_type: 'mental',
        repeatable: 'daily',
      },
    ];

    setProfile(newProfile);
    setQuests(starterQuests);
    setNeedsAwakening(false);
    audioService.playAwakening();
    await syncToFirestore(newProfile, starterQuests);
    return newProfile;
  };

  const updateProfile = (updates: Partial<Profile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates };
    setProfile(updated);
    syncToFirestore(updated, quests);
  };

  const refreshDaily = () => {
    if (!profile) return;
    const { bonusQuest, dungeonBreak } = generateDailyPool(profile, profile.id);
    if (bonusQuest) setActiveBonus(bonusQuest);
    if (dungeonBreak) setActiveDungeon(dungeonBreak);
    audioService.playClick();
  };

  const resetHunter = async () => {
    audioService.playClick();
    if (user) {
      try {
        // 1. Remove from global leaderboard immediately so reset hunter does not linger
        const leaderboardDocRef = doc(firestore, 'leaderboard', user.id);
        await deleteDoc(leaderboardDocRef);
      } catch (err) {
        console.warn('[Hunter Store] Error deleting leaderboard entry on reset:', err);
      }

      try {
        // 2. Delete hunter document from Firestore
        const hunterDocRef = doc(firestore, 'hunters', user.id);
        await deleteDoc(hunterDocRef);
      } catch (err) {
        console.warn('[Hunter Store] Error deleting hunter document on reset:', err);
      }
    }

    try {
      const currentUid = user?.id;
      if (currentUid) {
        localStorage.removeItem(getStorageProfileKey(currentUid));
        localStorage.removeItem(getStorageQuestsKey(currentUid));
        localStorage.removeItem(getStorageAchievementsKey(currentUid));
      }
      localStorage.removeItem('hunter_preferred_affinity');
      localStorage.removeItem('local_hunter_profile');
      localStorage.removeItem('daily_system_state');
    } catch {}

    setProfile(null);
    setQuests([]);
    setUnlockedAchievements(['first_blood']);
    setActiveBonus(null);
    setActiveDungeon(null);
    setNeedsAwakening(true);
  };

  const deleteAccount = async () => {
    audioService.playClick();
    const uid = user?.id;

    if (uid) {
      // 1. Remove from global leaderboard while user is still authenticated
      try {
        await deleteDoc(doc(firestore, 'leaderboard', uid));
      } catch (err) {
        console.warn('[Hunter Store] Error removing from leaderboard on account delete:', err);
      }

      // 2. Remove public player profile card
      try {
        await deleteDoc(doc(firestore, 'players', uid));
      } catch (err) {
        console.warn('[Hunter Store] Error removing player profile on account delete:', err);
      }

      // 3. Remove presence doc
      try {
        await deleteDoc(doc(firestore, 'presence', uid));
      } catch (err) {
        console.warn('[Hunter Store] Error removing presence on account delete:', err);
      }

      // 4. Release unique username if claimed
      if (profile?.username) {
        try {
          const clean = normalizeUsername(profile.username);
          await deleteDoc(doc(firestore, 'usernames', clean));
        } catch (err) {
          console.warn('[Hunter Store] Error releasing username on account delete:', err);
        }
      }

      // 5. Leave guild if enrolled
      if (profile?.guild_id) {
        try {
          const isLeader = profile.guild_role === 'leader';
          await leaveGuild(profile.guild_id, uid, isLeader);
        } catch (err) {
          console.warn('[Hunter Store] Error leaving guild on account delete:', err);
        }
      }

      // 6. Remove private hunter profile document from Firestore
      try {
        await deleteDoc(doc(firestore, 'hunters', uid));
      } catch (err) {
        console.warn('[Hunter Store] Error deleting hunter document on account delete:', err);
      }
    }

    // 7. Clear local storage caches
    try {
      if (user?.id) {
        localStorage.removeItem(getStorageProfileKey(user.id));
        localStorage.removeItem(getStorageQuestsKey(user.id));
        localStorage.removeItem(getStorageAchievementsKey(user.id));
      }
      localStorage.removeItem('hunter_preferred_affinity');
      localStorage.removeItem('local_hunter_profile');
      localStorage.removeItem('daily_system_state');
    } catch {}

    // 8. Reset in-memory state
    setProfile(null);
    setQuests([]);
    setUnlockedAchievements(['first_blood']);
    setActiveBonus(null);
    setActiveDungeon(null);
    setNeedsAwakening(true);

    // 9. Delete Firebase Auth user account
    if (deleteAuthAccount) {
      await deleteAuthAccount();
    }
  };

  const value: HunterContextType = {
    profile,
    quests,
    dailyQuests,
    isOnboarded,
    isLoading,
    needsAwakening,
    primaryAffinity,
    unlockedAchievements,
    activeBonus,
    activeDungeon,
    activeBossQuest,
    promotionCelebration,
    showLevelUpModal,
    leveledUpTo,
    newRankAchieved,
    dismissLevelUpModal,
    saveAwakenedProfile,
    completeQuest,
    incrementProgress,
    addXp,
    allocateStatPoint,
    updateProfile,
    resetHunter,
    deleteAccount,
    addCustomQuest,
    completeBonusQuest,
    completeDungeonBreak,
    dismissDungeonBreak,
    completeBossQuest,
    dismissBossQuest,
    dismissPromotionCelebration,
    updatePersonalRecord,
    equipTitle,
    allocateSkillPoint,
    refreshDaily,
    acceptLibraryQuest,
    deleteQuest,
    lastDeletedQuest,
    undoDeleteQuest,
    isOnline,
  };

  return <HunterContext.Provider value={value}>{children}</HunterContext.Provider>;
};

export const useHunter = (): HunterContextType => {
  const context = useContext(HunterContext);
  if (!context) {
    throw new Error('useHunter must be used within a HunterProvider');
  }
  return context;
};
