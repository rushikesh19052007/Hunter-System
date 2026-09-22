// Hunter System Core Game Engine — v2.0

// ============================================================
// DIFFICULTY SYSTEM (Letter-based, E through S)
// ============================================================

export type DifficultyGrade = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

export const DIFFICULTY_XP: Record<string, number> = {
  // Legacy numeric support (auto-migrated)
  1: 15,
  2: 35,
  3: 60,
  4: 100,
  5: 150,
  // New letter-based
  E: 15,
  D: 35,
  C: 60,
  B: 100,
  A: 150,
  S: 250,
};

export const DIFFICULTY_STAT_XP: Record<DifficultyGrade, number> = {
  E: 10,
  D: 20,
  C: 35,
  B: 60,
  A: 100,
  S: 180,
};

export const DIFFICULTY_LABEL: Record<DifficultyGrade, string> = {
  E: 'E-Class',
  D: 'D-Class',
  C: 'C-Class',
  B: 'B-Class',
  A: 'A-Class',
  S: 'S-Class',
};

/** Migrate numeric difficulty (1-5) to letter grade */
export function migrateDifficulty(d: number | string): DifficultyGrade {
  if (typeof d === 'string' && ['E', 'D', 'C', 'B', 'A', 'S'].includes(d)) {
    return d as DifficultyGrade;
  }
  const map: Record<number, DifficultyGrade> = { 1: 'E', 2: 'D', 3: 'C', 4: 'B', 5: 'A' };
  return map[Number(d)] || 'E';
}

// ============================================================
// QUEST CATEGORY SYSTEM
// ============================================================

export type QuestCategory =
  | 'physical'
  | 'mental'
  | 'knowledge'
  | 'coding'
  | 'study'
  | 'health'
  | 'discipline'
  | 'productivity'
  | 'social'
  | 'creative'
  | 'financial'
  | 'personal_development'
  | 'custom'
  // Legacy categories (auto-mapped)
  | 'fitness'
  | 'learning';

export type StatXpType = 'physical' | 'mental' | 'both' | 'none';

export function getStatXpType(category: QuestCategory): StatXpType {
  switch (category) {
    case 'physical':
    case 'fitness':
    case 'health':
      return 'physical';
    case 'mental':
    case 'knowledge':
    case 'learning':
    case 'coding':
    case 'study':
    case 'productivity':
      return 'mental';
    case 'discipline':
    case 'personal_development':
      return 'both';
    case 'social':
    case 'creative':
    case 'financial':
    case 'custom':
      return 'none';
    default:
      return 'none';
  }
}

export function getCategoryLabel(category: QuestCategory): string {
  const labels: Record<QuestCategory, string> = {
    physical: 'PHYSICAL',
    mental: 'MENTAL',
    knowledge: 'KNOWLEDGE',
    coding: 'CODING',
    study: 'STUDY',
    health: 'HEALTH',
    discipline: 'DISCIPLINE',
    productivity: 'PRODUCTIVITY',
    social: 'SOCIAL',
    creative: 'CREATIVE',
    financial: 'FINANCIAL',
    personal_development: 'PERSONAL DEV',
    custom: 'CUSTOM',
    fitness: 'FITNESS',
    learning: 'LEARNING',
  };
  return labels[category] || 'QUEST';
}

// ============================================================
// HP / MP PROGRESSION
// ============================================================

/** HP/MP thresholds — every N physical/mental XP = +HP or +MP */
export const HP_INCREASE_PER_THRESHOLD = 12; // avg HP gain per 500 physical XP
export const MP_INCREASE_PER_THRESHOLD = 10; // avg MP gain per 500 mental XP
export const XP_THRESHOLD = 500;

/**
 * Calculate max HP from physical XP accumulated.
 * Every 500 physical XP: +10-15 HP (avg 12)
 */
export function calculateMaxHp(physicalXp: number, rank: string): number {
  const rankBase = HP_BY_RANK[rank] || 100;
  const thresholdsPassed = Math.floor(physicalXp / XP_THRESHOLD);
  return rankBase + thresholdsPassed * HP_INCREASE_PER_THRESHOLD;
}

/**
 * Calculate max MP from mental XP accumulated.
 * Every 500 mental XP: +8-12 MP (avg 10)
 */
export function calculateMaxMp(mentalXp: number, rank: string): number {
  const rankBase = MP_BY_RANK[rank] || 100;
  const thresholdsPassed = Math.floor(mentalXp / XP_THRESHOLD);
  return rankBase + thresholdsPassed * MP_INCREASE_PER_THRESHOLD;
}

/** Base HP at each rank */
export const HP_BY_RANK: Record<string, number> = {
  'E-Rank': 100,
  'D-Rank': 130,
  'C-Rank': 170,
  'B-Rank': 220,
  'A-Rank': 290,
  'S-Rank': 400,
};

/** Base MP at each rank */
export const MP_BY_RANK: Record<string, number> = {
  'E-Rank': 100,
  'D-Rank': 125,
  'C-Rank': 160,
  'B-Rank': 210,
  'A-Rank': 280,
  'S-Rank': 400,
};

// ============================================================
// PROFILE TYPE
// ============================================================

export interface SkillPoints {
  strength: number;
  intelligence: number;
  endurance: number;
  discipline: number;
  focus: number;
  agility: number;
}

export type Profile = {
  id: string;
  hunter_id: string;
  display_name: string;
  total_xp: number;
  current_level: number;
  stats: Record<string, number>;
  clean_days: number;
  current_rank: string;
  affinity: string;
  created_at?: string;

  // HP / MP (v2)
  hp: number;
  mp: number;
  max_hp: number;
  max_mp: number;
  physical_xp: number;
  mental_xp: number;

  // Progression (v2)
  quests_completed: number;
  physical_quests_completed: number;
  mental_quests_completed: number;
  coding_quests_completed: number;

  // Streaks (v2)
  streak: number;              // general daily streak
  physical_streak: number;
  mental_streak: number;
  study_streak: number;
  coding_streak: number;
  perfect_day_streak: number;
  longest_streak: number;
  last_quest_date?: string;    // ISO date string

  // Customization (v2)
  titles: string[];
  equipped_title: string;
  badges: string[];
  profile_frame: string;
  skill_points: SkillPoints;
  available_skill_points: number;

  // System log (v2)
  system_log: SystemLogEntry[];
};

export interface SystemLogEntry {
  id: string;
  timestamp: number;
  event_type: 'quest_complete' | 'level_up' | 'rank_up' | 'hp_increase' | 'mp_increase' | 'achievement' | 'dungeon' | 'bonus_quest' | 'record' | 'streak';
  message: string;
  xp?: number;
  stat_xp?: number;
}

// ============================================================
// QUEST TYPE
// ============================================================

export type QuestType = 'normal' | 'bonus' | 'dungeon' | 'hidden' | 'boss';

export type Quest = {
  id: string;
  user_id: string;
  name: string;
  difficulty: DifficultyGrade;
  progress: number;
  target: number;
  stat: string;
  category: QuestCategory;
  stat_xp_type?: StatXpType;
  description?: string;
  completed?: boolean;
  xp_reward?: number;
  stat_xp_reward?: number;
  created_at?: string;

  // Quest type flags (v2)
  quest_type?: QuestType;
  time_limit_hours?: number;
  deadline?: string;
  repeatable?: 'daily' | 'weekly' | 'monthly' | 'always' | 'once';

  // Bonus/Dungeon specific
  is_bonus?: boolean;
  is_dungeon?: boolean;
  expires_at?: number;
};

// ============================================================
// HUNTER STATS
// ============================================================

export type HunterStat = 'STR' | 'AGI' | 'VIT' | 'INT' | 'PERC';

export interface StatDefinition {
  code: HunterStat;
  name: string;
  title: string;
  description: string;
  color: string;
  accentGlow: string;
}

export const HUNTER_STATS: Record<HunterStat, StatDefinition> = {
  STR: {
    code: 'STR',
    name: 'Strength',
    title: 'Physical Might & Power',
    description: 'Increases muscular strength, physical impact, and capacity to overcome high-resistance trials.',
    color: '#ef4444',
    accentGlow: 'rgba(239, 68, 68, 0.4)',
  },
  AGI: {
    code: 'AGI',
    name: 'Agility',
    title: 'Speed & Reflexes',
    description: 'Enhances reaction time, cardiovascular endurance, flexibility, and swift execution.',
    color: '#06b6d4',
    accentGlow: 'rgba(6, 182, 212, 0.4)',
  },
  VIT: {
    code: 'VIT',
    name: 'Vitality',
    title: 'Health & Resilience',
    description: 'Boosts stamina, immune constitution, sleep restoration, and physical durability.',
    color: '#10b981',
    accentGlow: 'rgba(16, 185, 129, 0.4)',
  },
  INT: {
    code: 'INT',
    name: 'Intelligence',
    title: 'Knowledge & Intellect',
    description: 'Sharpens deep work focus, mental acuity, logic, cognitive retention, and learning capacity.',
    color: '#8b5cf6',
    accentGlow: 'rgba(139, 92, 246, 0.4)',
  },
  PERC: {
    code: 'PERC',
    name: 'Perception',
    title: 'Awareness & Discipline',
    description: 'Elevates mindfulness, self-mastery, focus clarity, intuition, and distraction resistance.',
    color: '#f59e0b',
    accentGlow: 'rgba(245, 158, 11, 0.4)',
  },
};

// ============================================================
// XP / LEVEL / RANK CALCULATIONS
// ============================================================

export const getXpForLevel = (level: number): number => {
  if (level <= 1) return 0;
  return Math.floor(50 * Math.pow(level - 1, 1.5) * 1.5 + (level - 1) * 75);
};

export const calculateLevel = (xp: number): number => {
  if (xp <= 0) return 1;
  let level = 1;
  while (getXpForLevel(level + 1) <= xp) {
    level++;
    if (level >= 999) break;
  }
  return level;
};

export const calculateRank = (level: number): string => {
  if (level >= 95) return 'S-Rank';
  if (level >= 70) return 'A-Rank';
  if (level >= 45) return 'B-Rank';
  if (level >= 25) return 'C-Rank';
  if (level >= 10) return 'D-Rank';
  return 'E-Rank';
};

export const getRankBadgeInfo = (rank: string) => {
  switch (rank) {
    case 'S-Rank':
      return { label: 'S-RANK', color: '#ec4899', border: 'border-pink-500', glow: 'shadow-[0_0_25px_rgba(236,72,153,0.6)]' };
    case 'A-Rank':
      return { label: 'A-RANK', color: '#eab308', border: 'border-amber-500', glow: 'shadow-[0_0_20px_rgba(234,179,8,0.5)]' };
    case 'B-Rank':
      return { label: 'B-RANK', color: '#a855f7', border: 'border-purple-500', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.5)]' };
    case 'C-Rank':
      return { label: 'C-RANK', color: '#3b82f6', border: 'border-blue-500', glow: 'shadow-[0_0_18px_rgba(59,130,246,0.5)]' };
    case 'D-Rank':
      return { label: 'D-RANK', color: '#10b981', border: 'border-emerald-500', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]' };
    default:
      return { label: 'E-RANK', color: '#94a3b8', border: 'border-slate-400', glow: 'shadow-[0_0_12px_rgba(148,163,184,0.3)]' };
  }
};

export const getXpProgress = (xp: number) => {
  const currentLevel = calculateLevel(xp);
  const currentLevelBaseXp = getXpForLevel(currentLevel);
  const nextLevelBaseXp = getXpForLevel(currentLevel + 1);
  const xpNeededForNext = nextLevelBaseXp - currentLevelBaseXp;
  const currentProgressXp = Math.max(0, xp - currentLevelBaseXp);
  const percentage = Math.min(100, Math.round((currentProgressXp / xpNeededForNext) * 100));

  return {
    currentLevel,
    currentProgressXp,
    xpNeededForNext,
    percentage,
    totalXp: xp,
  };
};

// ============================================================
// STREAK BONUSES
// ============================================================

export function getStreakBonus(streak: number): number {
  if (streak >= 100) return 200;
  if (streak >= 60) return 150;
  if (streak >= 30) return 100;
  if (streak >= 14) return 50;
  if (streak >= 7) return 20;
  return 0;
}

export function getStreakBonusMultiplier(streak: number): number {
  return 1 + getStreakBonus(streak) / 100;
}

// ============================================================
// TITLES & BADGES
// ============================================================

export const RANK_TITLES: Record<string, string[]> = {
  'D-Rank': ['Awakened', 'Novice Hunter'],
  'C-Rank': ['Elite Hunter'],
  'B-Rank': ['Veteran Hunter'],
  'A-Rank': ['Master Hunter'],
  'S-Rank': ['Monarch'],
};

export const PROFILE_FRAMES: Record<string, string> = {
  'C-Rank': 'bronze',
  'B-Rank': 'silver',
  'A-Rank': 'gold',
  'S-Rank': 'diamond',
};

// ============================================================
// HUNTER ID GENERATOR
// ============================================================

export const generateHunterId = (userId: string, affinity: string): string => {
  const cleanId = (userId || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  let first6 = cleanId.slice(0, 6);
  if (first6.length < 6) {
    const fallback = Math.random().toString(36).substring(2, 8).toUpperCase();
    first6 = (first6 + fallback).slice(0, 6);
  }
  const cleanAffinity = (affinity || 'AGI').toUpperCase().trim();
  return `HUNTER-${first6}-${cleanAffinity}`;
};

// ============================================================
// DIFFICULTY DISPLAY HELPERS
// ============================================================

export function getDifficultyColor(difficulty: DifficultyGrade | string): string {
  const colors: Record<string, string> = {
    E: '#94a3b8',
    D: '#10b981',
    C: '#3b82f6',
    B: '#a855f7',
    A: '#eab308',
    S: '#ec4899',
  };
  return colors[String(difficulty).toUpperCase()] || '#94a3b8';
}

export function getDifficultyStars(difficulty: DifficultyGrade | string): string {
  const stars: Record<string, string> = {
    E: '★☆☆☆☆☆',
    D: '★★☆☆☆☆',
    C: '★★★☆☆☆',
    B: '★★★★☆☆',
    A: '★★★★★☆',
    S: '★★★★★★',
  };
  return stars[String(difficulty).toUpperCase()] || '★☆☆☆☆☆';
}

// ============================================================
// DEFAULT PROFILE FACTORY
// ============================================================

export function createDefaultProfile(id: string, name: string, affinity: string): Profile {
  const hunterId = generateHunterId(id, affinity);
  const initialStats: Record<string, number> = {
    STR: 10, AGI: 10, VIT: 10, INT: 10, PERC: 10,
  };
  if (initialStats[affinity] !== undefined) {
    initialStats[affinity] += 5;
  }

  return {
    id,
    hunter_id: hunterId,
    display_name: name,
    total_xp: 15,
    current_level: 1,
    stats: initialStats,
    clean_days: 1,
    current_rank: 'E-Rank',
    affinity,

    hp: 100,
    mp: 100,
    max_hp: 100,
    max_mp: 100,
    physical_xp: 0,
    mental_xp: 0,

    quests_completed: 0,
    physical_quests_completed: 0,
    mental_quests_completed: 0,
    coding_quests_completed: 0,

    streak: 1,
    physical_streak: 0,
    mental_streak: 0,
    study_streak: 0,
    coding_streak: 0,
    perfect_day_streak: 0,
    longest_streak: 1,
    last_quest_date: new Date().toISOString().split('T')[0],

    titles: [],
    equipped_title: '',
    badges: ['first_blood'],
    profile_frame: '',
    skill_points: { strength: 0, intelligence: 0, endurance: 0, discipline: 0, focus: 0, agility: 0 },
    available_skill_points: 0,

    system_log: [{
      id: 'log-init',
      timestamp: Date.now(),
      event_type: 'quest_complete',
      message: 'System Awakening complete. Hunter registered.',
    }],
  };
}

/** Migrate an old profile shape to v2 */
export function migrateProfile(old: Partial<Profile> & Record<string, unknown>): Profile {
  return {
    id: (old.id as string) || 'hunter-' + Math.random().toString(36).slice(2, 9),
    hunter_id: (old.hunter_id as string) || generateHunterId((old.id as string) || '', (old.affinity as string) || 'AGI'),
    display_name: (old.display_name as string) || 'Awakened Hunter',
    total_xp: (old.total_xp as number) || 0,
    current_level: (old.current_level as number) || 1,
    stats: (old.stats as Record<string, number>) || { STR: 10, AGI: 10, VIT: 10, INT: 10, PERC: 10 },
    clean_days: (old.clean_days as number) || 0,
    current_rank: (old.current_rank as string) || 'E-Rank',
    affinity: (old.affinity as string) || 'AGI',
    created_at: (old.created_at as string) || undefined,

    hp: (old.hp as number) || 100,
    mp: (old.mp as number) || 100,
    max_hp: (old.max_hp as number) || 100,
    max_mp: (old.max_mp as number) || 100,
    physical_xp: (old.physical_xp as number) || 0,
    mental_xp: (old.mental_xp as number) || 0,

    quests_completed: (old.quests_completed as number) || 0,
    physical_quests_completed: (old.physical_quests_completed as number) || 0,
    mental_quests_completed: (old.mental_quests_completed as number) || 0,
    coding_quests_completed: (old.coding_quests_completed as number) || 0,

    streak: (old.streak as number) || (old.clean_days as number) || 0,
    physical_streak: (old.physical_streak as number) || 0,
    mental_streak: (old.mental_streak as number) || 0,
    study_streak: (old.study_streak as number) || 0,
    coding_streak: (old.coding_streak as number) || 0,
    perfect_day_streak: (old.perfect_day_streak as number) || 0,
    longest_streak: (old.longest_streak as number) || (old.clean_days as number) || 0,
    last_quest_date: (old.last_quest_date as string) || undefined,

    titles: (old.titles as string[]) || [],
    equipped_title: (old.equipped_title as string) || '',
    badges: (old.badges as string[]) || [],
    profile_frame: (old.profile_frame as string) || '',
    skill_points: (old.skill_points as SkillPoints) || { strength: 0, intelligence: 0, endurance: 0, discipline: 0, focus: 0, agility: 0 },
    available_skill_points: (old.available_skill_points as number) || 0,

    system_log: (old.system_log as SystemLogEntry[]) || [],
  };
}
