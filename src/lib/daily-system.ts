// Hunter System — Daily Quest Pool, Bonus Quests & Dungeon Breaks

import type { Quest, Profile, DifficultyGrade, QuestCategory } from './game-engine';
import { DIFFICULTY_XP, DIFFICULTY_STAT_XP, getStatXpType } from './game-engine';
import QUEST_LIBRARY from './quest-library';

const STORAGE_KEY_DAILY = 'hunter_daily_state';

interface DailyState {
  date: string; // ISO date string YYYY-MM-DD
  dailyQuestIds: string[];
  bonusQuest: Quest | null;
  dungeonBreak: DungeonBreak | null;
  lastDungeonDate: string | null;
}

export interface DungeonBreak {
  id: string;
  rank: string;
  challenge: string;
  time_limit_hours: number;
  xp_reward: number;
  stat_xp_reward: number;
  created_at: number;
  expires_at: number;
  completed: boolean;
  dismissed: boolean;
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function loadDailyState(): DailyState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DAILY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDailyState(state: DailyState): void {
  try {
    localStorage.setItem(STORAGE_KEY_DAILY, JSON.stringify(state));
  } catch {}
}

// ============================================================
// DUNGEON BREAK CHALLENGES (by rank)
// ============================================================

const DUNGEON_CHALLENGES: Record<string, { challenge: string; xp: number; statXp: number }> = {
  'E-Rank': {
    challenge: 'Complete 50 push-ups + 30 squats + 10-minute jog within 24 hours.',
    xp: 500, statXp: 200,
  },
  'D-Rank': {
    challenge: 'Solve 3 LeetCode mediums + study for 1 hour within 24 hours.',
    xp: 800, statXp: 300,
  },
  'C-Rank': {
    challenge: 'Complete 100 push-ups AND solve 5 LeetCode problems within 24 hours.',
    xp: 1200, statXp: 450,
  },
  'B-Rank': {
    challenge: 'Complete a 1-hour extreme workout AND solve 5 LeetCode mediums within 24 hours.',
    xp: 1600, statXp: 600,
  },
  'A-Rank': {
    challenge: 'Complete a 2-hour workout, solve 3 LeetCode hard problems, and study 2 hours within 24 hours.',
    xp: 2000, statXp: 800,
  },
  'S-Rank': {
    challenge: 'MONARCH TRIAL: 200 push-ups, 10km run, 5 hard LeetCode problems, and 4 hours of study in 24 hours.',
    xp: 3000, statXp: 1200,
  },
};

// ============================================================
// BONUS QUEST TEMPLATES (by rank)
// ============================================================

const BONUS_QUEST_TEMPLATES: Record<string, Array<{ name: string; desc: string; xp: number; statXp: number; type: 'physical' | 'mental' }>> = {
  'E-Rank': [
    { name: 'Bonus: 50 Push-ups Sprint', desc: 'Complete 50 push-ups as fast as possible.', xp: 80, statXp: 30, type: 'physical' },
    { name: 'Bonus: 30-Min Focus Study', desc: 'Study for 30 minutes without any breaks.', xp: 75, statXp: 25, type: 'mental' },
    { name: 'Bonus: Morning Hydration', desc: 'Drink 2 liters of water before noon.', xp: 60, statXp: 20, type: 'physical' },
  ],
  'D-Rank': [
    { name: 'Bonus: 100 Squats', desc: 'Complete 100 squats in one session.', xp: 120, statXp: 40, type: 'physical' },
    { name: 'Bonus: 1-Hour Deep Study', desc: 'Study continuously for 60 minutes.', xp: 130, statXp: 45, type: 'mental' },
    { name: 'Bonus: Solve 2 LeetCode Easy', desc: 'Solve 2 easy LeetCode problems.', xp: 110, statXp: 40, type: 'mental' },
  ],
  'C-Rank': [
    { name: 'Bonus: 5km Run', desc: 'Complete a 5km run.', xp: 200, statXp: 70, type: 'physical' },
    { name: 'Bonus: 2-Hour Study Block', desc: 'Study for 2 uninterrupted hours.', xp: 250, statXp: 80, type: 'mental' },
    { name: 'Bonus: 3 LeetCode Medium', desc: 'Solve 3 LeetCode medium problems in 90 minutes.', xp: 300, statXp: 100, type: 'mental' },
  ],
  'B-Rank': [
    { name: 'Bonus: Iron Trial', desc: 'Complete 200 total push-ups today.', xp: 350, statXp: 120, type: 'physical' },
    { name: 'Bonus: Deep Code Session', desc: 'Code for 3 hours on a real project.', xp: 400, statXp: 130, type: 'mental' },
    { name: 'Bonus: Scholar\'s Block', desc: 'Study for 4 hours with active recall.', xp: 450, statXp: 140, type: 'mental' },
  ],
  'A-Rank': [
    { name: 'Bonus: 10km Run', desc: 'Complete a 10km run.', xp: 500, statXp: 180, type: 'physical' },
    { name: 'Bonus: Algorithm Blitz', desc: 'Solve 5 LeetCode mediums in one session.', xp: 600, statXp: 200, type: 'mental' },
    { name: 'Bonus: Hyper Focus Marathon', desc: '4-hour hyper-focus coding session.', xp: 550, statXp: 190, type: 'mental' },
  ],
  'S-Rank': [
    { name: 'Bonus: S-Rank Physical Trial', desc: 'Complete a 2-hour full-body workout.', xp: 800, statXp: 300, type: 'physical' },
    { name: 'Bonus: Hard Code Gauntlet', desc: 'Solve 2 LeetCode hard problems.', xp: 900, statXp: 320, type: 'mental' },
    { name: 'Bonus: Scholar\'s Marathon', desc: 'Study for 6 focused hours.', xp: 850, statXp: 310, type: 'mental' },
  ],
};

// ============================================================
// DAILY QUEST GENERATION
// ============================================================

/**
 * Generate a daily quest pool for a hunter based on their rank.
 * Pool: 3 normal + 1 physical + 1 mental + 1 discipline + maybe bonus + maybe dungeon break.
 */
export function generateDailyPool(profile: Profile, userId: string): {
  dailyQuests: Quest[];
  bonusQuest: Quest | null;
  dungeonBreak: DungeonBreak | null;
} {
  const today = getTodayString();
  const existingState = loadDailyState();

  // If today's state already exists, return from cache
  if (existingState && existingState.date === today) {
    return {
      dailyQuests: [], // returned as empty — hub will use stored questIds
      bonusQuest: existingState.bonusQuest,
      dungeonBreak: existingState.dungeonBreak,
    };
  }

  // Filter library quests by rank appropriateness
  const rankDifficulty = getRankDifficulties(profile.current_rank);
  const eligible = QUEST_LIBRARY.filter(q => rankDifficulty.includes(q.difficulty));

  // Shuffle with seed based on today
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);

  // Pick quests: 1 physical, 1 mental, 1 discipline, 3 any
  const physicalQuests = shuffled.filter(q => ['physical', 'fitness', 'health'].includes(q.category));
  const mentalQuests = shuffled.filter(q => ['mental', 'study', 'knowledge', 'coding'].includes(q.category));
  const disciplineQuests = shuffled.filter(q => q.category === 'discipline' || q.category === 'productivity');
  const anyQuests = shuffled.filter(q => !['social', 'creative', 'financial'].includes(q.category));

  const picks: typeof QUEST_LIBRARY = [];
  if (physicalQuests[0]) picks.push(physicalQuests[0]);
  if (mentalQuests[0]) picks.push(mentalQuests[0]);
  if (disciplineQuests[0]) picks.push(disciplineQuests[0]);
  // Fill remaining from any, avoiding duplicates
  for (const q of anyQuests) {
    if (picks.length >= 6) break;
    if (!picks.find(p => p.id === q.id)) picks.push(q);
  }

  const dailyQuests: Quest[] = picks.map(lq => {
    const statXpType = getStatXpType(lq.category);
    const xpReward = DIFFICULTY_XP[lq.difficulty] || 15;
    const statXpReward = DIFFICULTY_STAT_XP[lq.difficulty] || 10;

    return {
      id: `daily-${today}-${lq.id}`,
      user_id: userId,
      name: lq.name,
      difficulty: lq.difficulty,
      progress: 0,
      target: lq.target,
      stat: lq.stat,
      category: lq.category,
      stat_xp_type: statXpType,
      description: lq.description,
      completed: false,
      xp_reward: xpReward,
      stat_xp_reward: statXpReward,
      quest_type: 'normal',
      repeatable: lq.repeatable,
    };
  });

  // Bonus Quest (30-50% chance)
  let bonusQuest: Quest | null = null;
  const bonusChance = Math.random();
  if (bonusChance < 0.4) {
    const templates = BONUS_QUEST_TEMPLATES[profile.current_rank] || BONUS_QUEST_TEMPLATES['E-Rank'];
    const template = templates[Math.floor(Math.random() * templates.length)];
    const now = Date.now();
    bonusQuest = {
      id: `bonus-${today}-${Math.random().toString(36).slice(2, 7)}`,
      user_id: userId,
      name: template.name,
      difficulty: 'C',
      progress: 0,
      target: 1,
      stat: template.type === 'physical' ? 'STR' : 'INT',
      category: template.type === 'physical' ? 'physical' : 'mental',
      stat_xp_type: template.type,
      description: template.desc,
      completed: false,
      xp_reward: template.xp,
      stat_xp_reward: template.statXp,
      quest_type: 'bonus',
      is_bonus: true,
      time_limit_hours: 24,
      expires_at: now + 24 * 60 * 60 * 1000,
    };
  }

  // Dungeon Break (5-10% chance, with 3-7 day cooldown)
  let dungeonBreak: DungeonBreak | null = null;
  const lastDungeonDate = existingState?.lastDungeonDate || null;
  const daysSinceDungeon = lastDungeonDate
    ? Math.floor((Date.now() - new Date(lastDungeonDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  const dungeonChance = Math.random();
  if (dungeonChance < 0.07 && daysSinceDungeon >= 3) {
    const config = DUNGEON_CHALLENGES[profile.current_rank] || DUNGEON_CHALLENGES['E-Rank'];
    const now = Date.now();
    dungeonBreak = {
      id: `dungeon-${today}-${Math.random().toString(36).slice(2, 7)}`,
      rank: profile.current_rank,
      challenge: config.challenge,
      time_limit_hours: 24,
      xp_reward: config.xp,
      stat_xp_reward: config.statXp,
      created_at: now,
      expires_at: now + 24 * 60 * 60 * 1000,
      completed: false,
      dismissed: false,
    };
  }

  const newState: DailyState = {
    date: today,
    dailyQuestIds: dailyQuests.map(q => q.id),
    bonusQuest,
    dungeonBreak,
    lastDungeonDate: dungeonBreak ? today : (existingState?.lastDungeonDate || null),
  };

  saveDailyState(newState);

  return { dailyQuests, bonusQuest, dungeonBreak };
}

/** Load today's daily state from storage */
export function loadTodayDailyState(): DailyState | null {
  const state = loadDailyState();
  if (!state || state.date !== getTodayString()) return null;
  return state;
}

/** Mark dungeon break as completed */
export function completeDungeonBreak(): void {
  const state = loadDailyState();
  if (!state?.dungeonBreak) return;
  state.dungeonBreak.completed = true;
  saveDailyState(state);
}

/** Dismiss dungeon break */
export function dismissDungeonBreak(): void {
  const state = loadDailyState();
  if (!state?.dungeonBreak) return;
  state.dungeonBreak.dismissed = true;
  saveDailyState(state);
}

/** Update bonus quest as completed */
export function completeBonusQuestInState(): void {
  const state = loadDailyState();
  if (!state?.bonusQuest) return;
  state.bonusQuest.completed = true;
  saveDailyState(state);
}

// Helper: determine difficulty range allowed for a given rank
function getRankDifficulties(rank: string): DifficultyGrade[] {
  switch (rank) {
    case 'S-Rank': return ['C', 'B', 'A', 'S'];
    case 'A-Rank': return ['B', 'A', 'S'];
    case 'B-Rank': return ['C', 'B', 'A'];
    case 'C-Rank': return ['D', 'C', 'B'];
    case 'D-Rank': return ['E', 'D', 'C'];
    default: return ['E', 'D'];
  }
}

// ============================================================
// STREAK CALCULATION
// ============================================================

export function calculateStreakUpdate(
  profile: Profile,
  completedToday: boolean,
  hasPhysicalToday: boolean,
  hasMentalToday: boolean
): Partial<Profile> {
  const today = getTodayString();
  const lastDate = profile.last_quest_date;

  if (!lastDate) {
    return {
      streak: completedToday ? 1 : 0,
      last_quest_date: today,
      longest_streak: Math.max(profile.longest_streak || 0, completedToday ? 1 : 0),
    };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak = profile.streak || 0;

  if (lastDate === today) {
    // Already updated today
    newStreak = profile.streak;
  } else if (lastDate === yesterdayStr) {
    // Consecutive day
    newStreak = completedToday ? newStreak + 1 : 0;
  } else {
    // Missed a day — reset streak
    newStreak = completedToday ? 1 : 0;
  }

  const newPhysicalStreak = hasPhysicalToday
    ? (profile.physical_streak || 0) + 1
    : 0;
  const newMentalStreak = hasMentalToday
    ? (profile.mental_streak || 0) + 1
    : 0;

  const perfectDay = hasPhysicalToday && hasMentalToday;
  const newPerfectStreak = perfectDay
    ? (profile.perfect_day_streak || 0) + 1
    : 0;

  return {
    streak: newStreak,
    physical_streak: newPhysicalStreak,
    mental_streak: newMentalStreak,
    perfect_day_streak: newPerfectStreak,
    longest_streak: Math.max(profile.longest_streak || 0, newStreak),
    last_quest_date: today,
  };
}
