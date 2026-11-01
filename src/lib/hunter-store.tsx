import { startPresence, stopPresence } from './presence-service';
import { claimUsername, claimHunterId, syncPublicPlayer } from './social-service';
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
} from './game-engine';
import QUEST_LIBRARY, { type LibraryQuest } from './quest-library';
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
import { audioService } from './audio-service';
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
  equipTitle: (title: string) => void;
  allocateSkillPoint: (skill: keyof Profile['skill_points']) => void;
  refreshDaily: () => void;
  acceptLibraryQuest: (quest: LibraryQuest) => void;
  deleteQuest: (questId: string) => void;
}

const HunterContext = createContext<HunterContextType | undefined>(undefined);

// Local Storage Keys
const STORAGE_PROFILE_KEY = 'hunter_system_profile';
const STORAGE_QUESTS_KEY = 'hunter_system_quests';
const STORAGE_ACHIEVEMENTS_KEY = 'hunter_system_achievements';

// ============================================================
// PROVIDER IMPLEMENTATION
// ============================================================

export const HunterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, deleteAccount: deleteAuthAccount } = useAuth();

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

  const [dailyQuests, setDailyQuests] = useState<Quest[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ACHIEVEMENTS_KEY);
      return saved ? JSON.parse(saved) : ['first_blood'];
    } catch {
      return ['first_blood'];
    }
  });

  const [activeBonus, setActiveBonus] = useState<Quest | null>(null);
  const [activeDungeon, setActiveDungeon] = useState<DungeonBreak | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [needsAwakening, setNeedsAwakening] = useState<boolean>(false);

  // Level Up Modal State
  const [showLevelUpModal, setShowLevelUpModal] = useState<boolean>(false);
  const [leveledUpTo, setLeveledUpTo] = useState<number>(1);
  const [newRankAchieved, setNewRankAchieved] = useState<string>('');

  const isSavingRef = useRef<boolean>(false);

  // Sync to localStorage as offline fallback cache
  useEffect(() => {
    if (profile) localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));
    else localStorage.removeItem(STORAGE_PROFILE_KEY);
  }, [profile]);

  useEffect(() => {
    if (quests.length > 0) localStorage.setItem(STORAGE_QUESTS_KEY, JSON.stringify(quests));
  }, [quests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_ACHIEVEMENTS_KEY, JSON.stringify(unlockedAchievements));
  }, [unlockedAchievements]);

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

  const completeQuest = (questId: string) => {
    const quest = quests.find((q) => q.id === questId);
    if (!quest || quest.completed) return;
    if (!profile) return;

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
    const updatedQuests = quests.filter((q) => q.id !== questId);
    setQuests(updatedQuests);
    audioService.playClick();
    if (profile) syncToFirestore(profile, updatedQuests);
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
    const updatedTitles = [...(current.titles || [])];

    if (levelsGained > 0) {
      updatedSP += levelsGained * 3;
      setLeveledUpTo(newLevel);
      setNewRankAchieved(rankChanged ? newRank : '');
      setShowLevelUpModal(true);
      audioService.playLevelUp();
    }

    if (rankChanged) {
      const titlesForRank = RANK_TITLES[newRank] || [];
      titlesForRank.forEach((t) => {
        if (!updatedTitles.includes(t)) updatedTitles.push(t);
      });
    }

    return {
      ...current,
      total_xp: newTotalXp,
      current_level: newLevel,
      current_rank: newRank,
      available_skill_points: updatedSP,
      titles: updatedTitles,
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
      localStorage.removeItem(STORAGE_PROFILE_KEY);
      localStorage.removeItem(STORAGE_QUESTS_KEY);
      localStorage.removeItem(STORAGE_ACHIEVEMENTS_KEY);
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
      try {
        // 1. Remove from global leaderboard first while user is still authenticated
        const leaderboardDocRef = doc(firestore, 'leaderboard', uid);
        await deleteDoc(leaderboardDocRef);
      } catch (err) {
        console.warn('[Hunter Store] Error removing from leaderboard on account delete:', err);
      }

      try {
        // 2. Remove hunter profile document from Firestore
        const hunterDocRef = doc(firestore, 'hunters', uid);
        await deleteDoc(hunterDocRef);
      } catch (err) {
        console.warn('[Hunter Store] Error deleting hunter document on account delete:', err);
      }
    }

    // 3. Clear local storage caches
    try {
      localStorage.removeItem(STORAGE_PROFILE_KEY);
      localStorage.removeItem(STORAGE_QUESTS_KEY);
      localStorage.removeItem(STORAGE_ACHIEVEMENTS_KEY);
      localStorage.removeItem('hunter_preferred_affinity');
      localStorage.removeItem('local_hunter_profile');
      localStorage.removeItem('daily_system_state');
    } catch {}

    // 4. Reset in-memory state
    setProfile(null);
    setQuests([]);
    setUnlockedAchievements(['first_blood']);
    setActiveBonus(null);
    setActiveDungeon(null);
    setNeedsAwakening(true);

    // 5. Delete Firebase Auth user account
    if (deleteAuthAccount) {
      await deleteAuthAccount();
    }
  };

  return (
    <HunterContext.Provider
      value={{
        profile,
        quests,
        dailyQuests,
        isOnboarded: profile !== null,
        isLoading,
        needsAwakening,
        primaryAffinity: profile?.affinity || null,
        unlockedAchievements,
        activeBonus,
        activeDungeon,
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
        equipTitle,
        allocateSkillPoint,
        refreshDaily,
        acceptLibraryQuest,
        deleteQuest,
      }}
    >
      {children}
    </HunterContext.Provider>
  );
};

export const useHunter = (): HunterContextType => {
  const context = useContext(HunterContext);
  if (!context) {
    throw new Error('useHunter must be used within a HunterProvider');
  }
  return context;
};
