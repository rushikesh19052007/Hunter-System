// Hunter System — Achievement & Hidden Quest System

import type { Profile, Quest } from './game-engine';

// ============================================================
// ACHIEVEMENT DEFINITIONS
// ============================================================

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'progression' | 'consistency' | 'physical' | 'mental' | 'code' | 'rank' | 'special';
  xp_reward: number;
  badge_id?: string;
  title_unlock?: string;
  check: (profile: Profile, quests: Quest[]) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // ---- PROGRESSION ----
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Complete your very first quest.',
    icon: '🏆',
    category: 'progression',
    xp_reward: 50,
    check: (p) => p.quests_completed >= 1,
  },
  {
    id: 'awakening',
    name: 'Awakening',
    description: 'Reach Level 5.',
    icon: '⚡',
    category: 'progression',
    xp_reward: 100,
    check: (p) => p.current_level >= 5,
  },
  {
    id: 'hunter_rank',
    name: 'Hunter',
    description: 'Complete 50 quests.',
    icon: '🗡️',
    category: 'progression',
    xp_reward: 200,
    check: (p) => p.quests_completed >= 50,
  },
  {
    id: 'veteran',
    name: 'Veteran',
    description: 'Complete 250 quests.',
    icon: '⚔️',
    category: 'progression',
    xp_reward: 500,
    check: (p) => p.quests_completed >= 250,
  },
  {
    id: 'legend',
    name: 'Legend',
    description: 'Complete 1000 quests.',
    icon: '👑',
    category: 'progression',
    xp_reward: 2000,
    check: (p) => p.quests_completed >= 1000,
  },
  {
    id: 'momentum',
    name: 'Momentum',
    description: 'Reach 1000 total XP.',
    icon: '🚀',
    category: 'progression',
    xp_reward: 100,
    check: (p) => p.total_xp >= 1000,
  },
  {
    id: 'xp_lord',
    name: 'XP Lord',
    description: 'Accumulate 10,000 total XP.',
    icon: '💎',
    category: 'progression',
    xp_reward: 500,
    check: (p) => p.total_xp >= 10000,
  },

  // ---- CONSISTENCY ----
  {
    id: 'relentless',
    name: 'Relentless',
    description: 'Maintain a 30-day streak.',
    icon: '🔥',
    category: 'consistency',
    xp_reward: 500,
    badge_id: 'relentless',
    check: (p) => p.streak >= 30,
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Maintain a 60-day streak.',
    icon: '🔥',
    category: 'consistency',
    xp_reward: 1000,
    check: (p) => p.streak >= 60,
  },
  {
    id: 'immortal',
    name: 'Immortal',
    description: 'Maintain a 100-day streak.',
    icon: '🔥',
    category: 'consistency',
    xp_reward: 2500,
    check: (p) => p.streak >= 100,
  },
  {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Maintain a 365-day streak.',
    icon: '⭐',
    category: 'consistency',
    xp_reward: 10000,
    check: (p) => p.streak >= 365,
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Complete quests for 7 days straight.',
    icon: '🗓️',
    category: 'consistency',
    xp_reward: 150,
    check: (p) => p.streak >= 7,
  },
  {
    id: 'fortnight_fighter',
    name: 'Fortnight Fighter',
    description: 'Complete quests for 14 days straight.',
    icon: '🗓️',
    category: 'consistency',
    xp_reward: 300,
    check: (p) => p.streak >= 14,
  },

  // ---- PHYSICAL ----
  {
    id: 'iron_body',
    name: 'Iron Body',
    description: 'Complete 100 physical quests.',
    icon: '💪',
    category: 'physical',
    xp_reward: 500,
    check: (p) => p.physical_quests_completed >= 100,
  },
  {
    id: 'titan',
    name: 'Titan',
    description: 'Complete 500 physical quests.',
    icon: '💪',
    category: 'physical',
    xp_reward: 2000,
    check: (p) => p.physical_quests_completed >= 500,
  },
  {
    id: 'hercules',
    name: 'Hercules',
    description: 'Reach Max HP of 300.',
    icon: '❤️',
    category: 'physical',
    xp_reward: 1000,
    check: (p) => p.max_hp >= 300,
  },
  {
    id: 'physical_spark',
    name: 'Physical Spark',
    description: 'Complete your first physical quest.',
    icon: '⚡',
    category: 'physical',
    xp_reward: 50,
    check: (p) => p.physical_quests_completed >= 1,
  },

  // ---- MENTAL ----
  {
    id: 'scholar',
    name: 'Scholar',
    description: 'Complete 100 knowledge or study quests.',
    icon: '🧠',
    category: 'mental',
    xp_reward: 500,
    check: (p) => p.mental_quests_completed >= 100,
  },
  {
    id: 'genius',
    name: 'Genius',
    description: 'Complete 500 knowledge or study quests.',
    icon: '🧠',
    category: 'mental',
    xp_reward: 2000,
    check: (p) => p.mental_quests_completed >= 500,
  },
  {
    id: 'sage',
    name: 'Sage',
    description: 'Reach Max MP of 300.',
    icon: '🔮',
    category: 'mental',
    xp_reward: 1000,
    check: (p) => p.max_mp >= 300,
  },

  // ---- CODE ----
  {
    id: 'code_hunter',
    name: 'Code Hunter',
    description: 'Complete 100 coding quests.',
    icon: '💻',
    category: 'code',
    xp_reward: 500,
    check: (p) => p.coding_quests_completed >= 100,
  },
  {
    id: 'algorithm_master',
    name: 'Algorithm Master',
    description: 'Complete 500 coding quests.',
    icon: '💻',
    category: 'code',
    xp_reward: 2000,
    check: (p) => p.coding_quests_completed >= 500,
  },
  {
    id: 'first_compile',
    name: 'First Compile',
    description: 'Complete your first coding quest.',
    icon: '⌨️',
    category: 'code',
    xp_reward: 50,
    check: (p) => p.coding_quests_completed >= 1,
  },

  // ---- RANK ----
  {
    id: 'rank_d',
    name: 'Awakened',
    description: 'Reach D-Rank.',
    icon: '🟢',
    category: 'rank',
    xp_reward: 200,
    title_unlock: 'Awakened',
    check: (p) => ['D-Rank', 'C-Rank', 'B-Rank', 'A-Rank', 'S-Rank'].includes(p.current_rank),
  },
  {
    id: 'rank_c',
    name: 'Elite Hunter',
    description: 'Reach C-Rank.',
    icon: '🔵',
    category: 'rank',
    xp_reward: 500,
    title_unlock: 'Elite Hunter',
    badge_id: 'elite_hunter',
    check: (p) => ['C-Rank', 'B-Rank', 'A-Rank', 'S-Rank'].includes(p.current_rank),
  },
  {
    id: 'rank_b',
    name: 'Veteran Hunter',
    description: 'Reach B-Rank.',
    icon: '🟣',
    category: 'rank',
    xp_reward: 1000,
    title_unlock: 'Veteran Hunter',
    check: (p) => ['B-Rank', 'A-Rank', 'S-Rank'].includes(p.current_rank),
  },
  {
    id: 'rank_a',
    name: 'Master Hunter',
    description: 'Reach A-Rank.',
    icon: '🌟',
    category: 'rank',
    xp_reward: 2000,
    title_unlock: 'Master Hunter',
    badge_id: 'high_rank',
    check: (p) => ['A-Rank', 'S-Rank'].includes(p.current_rank),
  },
  {
    id: 'rank_s',
    name: 'Monarch',
    description: 'Reach S-Rank — the pinnacle of human evolution.',
    icon: '👑',
    category: 'rank',
    xp_reward: 10000,
    title_unlock: 'Monarch',
    badge_id: 'monarch',
    check: (p) => p.current_rank === 'S-Rank',
  },

  // ---- SPECIAL ----
  {
    id: 'dungeon_survivor',
    name: 'Dungeon Survivor',
    description: 'Complete a Dungeon Break challenge.',
    icon: '💀',
    category: 'special',
    xp_reward: 1000,
    badge_id: 'dungeon_survivor',
    check: (_p, quests) => quests.some(q => q.is_dungeon && q.completed),
  },
  {
    id: 'quest_master',
    name: 'Quest Master',
    description: 'Complete 500 total quests.',
    icon: '🎯',
    category: 'special',
    xp_reward: 2000,
    check: (p) => p.quests_completed >= 500,
  },
];

// ============================================================
// HIDDEN QUESTS
// ============================================================

export interface HiddenQuestDef {
  id: string;
  name: string;
  description: string;
  unlock_condition: string;
  xp_reward: number;
  stat_xp_reward: number;
  badge_id?: string;
  title_unlock?: string;
  check: (profile: Profile, quests: Quest[]) => boolean;
}

export const HIDDEN_QUESTS: HiddenQuestDef[] = [
  {
    id: 'hidden-discipline',
    name: 'Prove Your Discipline',
    description: 'You have maintained a 7-day physical streak. The System acknowledges your discipline.',
    unlock_condition: '7-day physical streak',
    xp_reward: 500,
    stat_xp_reward: 100,
    badge_id: 'relentless',
    check: (p) => p.physical_streak >= 7,
  },
  {
    id: 'hidden-scholar',
    name: 'Scholar\'s Path',
    description: 'Complete 30 study quests. Your mental fortress grows.',
    unlock_condition: '30 study quests completed',
    xp_reward: 800,
    stat_xp_reward: 200,
    title_unlock: 'Scholar',
    check: (p) => p.mental_quests_completed >= 30,
  },
  {
    id: 'hidden-perfection',
    name: 'Perfection',
    description: 'A 14-day streak with at least one physical and one mental quest each day.',
    unlock_condition: '14-day perfect day streak',
    xp_reward: 1000,
    stat_xp_reward: 200,
    check: (p) => p.perfect_day_streak >= 14,
  },
  {
    id: 'hidden-momentum',
    name: 'Momentum',
    description: 'Accumulate 1000 total XP — the journey has begun in earnest.',
    unlock_condition: '1000 total XP',
    xp_reward: 200,
    stat_xp_reward: 50,
    check: (p) => p.total_xp >= 1000,
  },
  {
    id: 'hidden-quest-master',
    name: 'Trial Master',
    description: 'Complete 50 total quests — the System witnesses your dedication.',
    unlock_condition: '50 quests completed',
    xp_reward: 500,
    stat_xp_reward: 100,
    check: (p) => p.quests_completed >= 50,
  },
  {
    id: 'hidden-coder',
    name: 'The Algorithm Awakens',
    description: 'Complete 10 coding quests — your logic has reached a new tier.',
    unlock_condition: '10 coding quests completed',
    xp_reward: 300,
    stat_xp_reward: 80,
    title_unlock: 'Code Hunter',
    check: (p) => p.coding_quests_completed >= 10,
  },
];

// ============================================================
// ACHIEVEMENT CHECK ENGINE
// ============================================================

export interface NewUnlock {
  type: 'achievement' | 'hidden_quest';
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  stat_xp_reward?: number;
  title_unlock?: string;
  badge_id?: string;
}

/**
 * Check which achievements are newly unlocked for a hunter.
 * Returns only newly unlocked items not already in the profile's badge/achievement list.
 */
export function checkNewAchievements(
  profile: Profile,
  quests: Quest[],
  unlockedIds: string[]
): NewUnlock[] {
  const newUnlocks: NewUnlock[] = [];

  for (const ach of ACHIEVEMENTS) {
    if (!unlockedIds.includes(ach.id) && ach.check(profile, quests)) {
      newUnlocks.push({
        type: 'achievement',
        id: ach.id,
        name: ach.name,
        description: ach.description,
        icon: ach.icon,
        xp_reward: ach.xp_reward,
        title_unlock: ach.title_unlock,
        badge_id: ach.badge_id,
      });
    }
  }

  for (const hq of HIDDEN_QUESTS) {
    if (!unlockedIds.includes(hq.id) && hq.check(profile, quests)) {
      newUnlocks.push({
        type: 'hidden_quest',
        id: hq.id,
        name: hq.name,
        description: hq.description,
        icon: '🔓',
        xp_reward: hq.xp_reward,
        stat_xp_reward: hq.stat_xp_reward,
        title_unlock: hq.title_unlock,
        badge_id: hq.badge_id,
      });
    }
  }

  return newUnlocks;
}

// ============================================================
// ACHIEVEMENT DISPLAY HELPERS
// ============================================================

export function getAchievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

export const BADGE_LABELS: Record<string, string> = {
  relentless: '🔥 Relentless',
  elite_hunter: '⚔️ Elite Hunter',
  high_rank: '👑 High Rank',
  dungeon_survivor: '💀 Dungeon Survivor',
  monarch: '🌟 Monarch',
  first_blood: '🏆 First Blood',
};

export function getBadgeLabel(badgeId: string): string {
  return BADGE_LABELS[badgeId] || `🎖️ ${badgeId}`;
}
