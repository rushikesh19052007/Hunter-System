// Hunter System Core Game Engine

export const DIFFICULTY_XP: Record<number, number> = {
  1: 15,
  2: 35,
  3: 60,
  4: 100,
  5: 150,
};

export type Profile = {
  id: string;
  display_name: string;
  total_xp: number;
  current_level: number;
  stats: Record<string, number>;
  clean_days: number;
  current_rank: string;
};

export type Quest = {
  id: string;
  user_id: string;
  name: string;
  difficulty: number;
  progress: number;
  target: number;
  stat: string;
  category?: string;
  description?: string;
  completed?: boolean;
  xp_reward?: number;
  created_at?: string;
};

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

/**
 * Total cumulative XP required to reach a specific level.
 * Level 1 starts at 0 XP.
 * Level 2: 100 XP
 * Level 3: 250 XP
 * Level 4: 450 XP
 * Level 5: 700 XP, etc.
 */
export const getXpForLevel = (level: number): number => {
  if (level <= 1) return 0;
  // Quadratic scaling for satisfying progression
  return Math.floor(50 * Math.pow(level - 1, 1.5) * 1.5 + (level - 1) * 75);
};

/**
 * Calculates current Hunter level based on total XP accumulated.
 */
export const calculateLevel = (xp: number): number => {
  if (xp <= 0) return 1;
  let level = 1;
  while (getXpForLevel(level + 1) <= xp) {
    level++;
    if (level >= 999) break; // Safety cap
  }
  return level;
};

/**
 * Computes Hunter Rank classification based on current level.
 * E-Rank (1-9) -> D-Rank (10-24) -> C-Rank (25-44) -> B-Rank (45-69) -> A-Rank (70-94) -> S-Rank (95+)
 */
export const calculateRank = (level: number): string => {
  if (level >= 95) return 'S-Rank';
  if (level >= 70) return 'A-Rank';
  if (level >= 45) return 'B-Rank';
  if (level >= 25) return 'C-Rank';
  if (level >= 10) return 'D-Rank';
  return 'E-Rank';
};

/**
 * Returns the color and styling badge metadata for a Hunter rank.
 */
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

/**
 * Returns detailed XP progress breakdown for UI rendering.
 */
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
