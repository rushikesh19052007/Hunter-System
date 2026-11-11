import {
  type Profile,
  type Quest,
  type DifficultyGrade,
  type QuestCategory,
  type HunterStat,
  type StatXpType,
  type SystemLogEntry,
  type PersonalRecords,
  DEFAULT_PERSONAL_RECORDS,
  normalizeUsername,
  generateUniqueHunterId,
} from './game-engine';

// ============================================================
// ENUM INDEX MAPPINGS (Exact 1:1 match with Flutter Dart enums)
// ============================================================

export const STAT_INDEX_MAP: Record<HunterStat, number> = {
  STR: 0,
  AGI: 1,
  VIT: 2,
  INT: 3,
  PERC: 4,
};

export const INDEX_TO_STAT: Record<number, HunterStat> = {
  0: 'STR',
  1: 'AGI',
  2: 'VIT',
  3: 'INT',
  4: 'PERC',
};

export const DIFFICULTY_INDEX_MAP: Record<DifficultyGrade, number> = {
  E: 0,
  D: 1,
  C: 2,
  B: 3,
  A: 4,
  S: 5,
};

export const INDEX_TO_DIFFICULTY: Record<number, DifficultyGrade> = {
  0: 'E',
  1: 'D',
  2: 'C',
  3: 'B',
  4: 'A',
  5: 'S',
};

export const CATEGORY_INDEX_MAP: Record<QuestCategory, number> = {
  physical: 0,
  mental: 1,
  knowledge: 2,
  coding: 3,
  study: 4,
  health: 5,
  discipline: 6,
  productivity: 7,
  social: 8,
  creative: 9,
  financial: 10,
  personal_development: 11,
  custom: 12,
  fitness: 13,
  learning: 14,
};

export const INDEX_TO_CATEGORY: Record<number, QuestCategory> = {
  0: 'physical',
  1: 'mental',
  2: 'knowledge',
  3: 'coding',
  4: 'study',
  5: 'health',
  6: 'discipline',
  7: 'productivity',
  8: 'social',
  9: 'creative',
  10: 'financial',
  11: 'personal_development',
  12: 'custom',
  13: 'fitness',
  14: 'learning',
};

export const STAT_XP_TYPE_INDEX_MAP: Record<StatXpType, number> = {
  physical: 0,
  mental: 1,
  both: 2,
  none: 3,
};

export const INDEX_TO_STAT_XP_TYPE: Record<number, StatXpType> = {
  0: 'physical',
  1: 'mental',
  2: 'both',
  3: 'none',
};

// ============================================================
// FIRESTORE SERIALIZERS & DESERIALIZERS
// ============================================================

/**
 * Converts a Web Quest to the Firestore format expected by Flutter.
 * Ensures difficulty, category, stat, and statXpType are integers.
 */
export function serializeQuestForFirestore(quest: Quest): Record<string, unknown> {
  const diffIndex = typeof quest.difficulty === 'number'
    ? quest.difficulty
    : (DIFFICULTY_INDEX_MAP[quest.difficulty as DifficultyGrade] ?? 0);

  const catIndex = typeof quest.category === 'number'
    ? quest.category
    : (CATEGORY_INDEX_MAP[quest.category as QuestCategory] ?? 0);

  const statIndex = typeof quest.stat === 'number'
    ? quest.stat
    : (STAT_INDEX_MAP[quest.stat as HunterStat] ?? 0);

  const statXpType = quest.stat_xp_type || 'none';
  const statXpTypeIndex = typeof statXpType === 'number'
    ? statXpType
    : (STAT_XP_TYPE_INDEX_MAP[statXpType as StatXpType] ?? 3);

  return {
    id: quest.id,
    name: quest.name,
    description: quest.description || null,
    difficulty: diffIndex,
    category: catIndex,
    stat: statIndex,
    progress: quest.progress || 0,
    target: quest.target || 1,
    completed: Boolean(quest.completed),
    xpReward: quest.xp_reward || 15,
    statXpReward: quest.stat_xp_reward || 10,
    statXpType: statXpTypeIndex,
    isCustom: Boolean(quest.id.startsWith('custom') || !quest.id.startsWith('starter-')),
  };
}

/**
 * Converts a Firestore Quest (from Flutter or Web) to Web Quest format.
 */
export function deserializeQuestFromFirestore(data: Record<string, unknown>, userId: string): Quest {
  const diffVal = data.difficulty;
  const difficulty: DifficultyGrade = typeof diffVal === 'number'
    ? (INDEX_TO_DIFFICULTY[diffVal] || 'E')
    : (diffVal as DifficultyGrade || 'E');

  const catVal = data.category;
  const category: QuestCategory = typeof catVal === 'number'
    ? (INDEX_TO_CATEGORY[catVal] || 'physical')
    : (catVal as QuestCategory || 'physical');

  const statVal = data.stat;
  const stat: string = typeof statVal === 'number'
    ? (INDEX_TO_STAT[statVal] || 'STR')
    : String(statVal || 'STR');

  const xpTypeVal = data.statXpType ?? data.stat_xp_type;
  const statXpType: StatXpType = typeof xpTypeVal === 'number'
    ? (INDEX_TO_STAT_XP_TYPE[xpTypeVal] || 'none')
    : (xpTypeVal as StatXpType || 'none');

  return {
    id: (data.id as string) || `quest-${Date.now()}`,
    user_id: userId,
    name: (data.name as string) || 'Quest Trial',
    description: (data.description as string) || undefined,
    difficulty,
    category,
    stat,
    progress: (data.progress as number) || 0,
    target: (data.target as number) || 1,
    completed: Boolean(data.completed),
    xp_reward: (data.xpReward as number) || (data.xp_reward as number) || 15,
    stat_xp_reward: (data.statXpReward as number) || (data.stat_xp_reward as number) || 10,
    stat_xp_type: statXpType,
    quest_type: data.isCustom ? 'normal' : 'normal',
    repeatable: 'daily',
  };
}

/**
 * Serializes a Web Profile into the exact Firestore structure used by Flutter.
 * Specifically converts stats map keys to strings ("0", "1", "2", "3", "4")
 * so that Flutter's `int.parse(k)` never throws FormatException.
 */
export function serializeProfileForFirestore(profile: Profile): Record<string, unknown> {
  const statsInFlutterFormat: Record<string, number> = {
    '0': profile.stats.STR ?? profile.stats['0'] ?? 10,
    '1': profile.stats.AGI ?? profile.stats['1'] ?? 10,
    '2': profile.stats.VIT ?? profile.stats['2'] ?? 10,
    '3': profile.stats.INT ?? profile.stats['3'] ?? 10,
    '4': profile.stats.PERC ?? profile.stats['4'] ?? 10,
  };

  const logs = (profile.system_log || []).map((entry) => ({
    id: entry.id,
    timestamp: entry.timestamp,
    eventType: entry.event_type || 'quest_complete',
    message: entry.message,
    xp: entry.xp ?? null,
  }));

  const cleanUsername = profile.username ? normalizeUsername(profile.username) : normalizeUsername(profile.display_name);

  return {
    id: profile.id,
    hunterId: profile.hunter_id,
    username: cleanUsername,
    displayName: profile.display_name,
    totalXp: profile.total_xp,
    currentLevel: profile.current_level,
    stats: statsInFlutterFormat,
    currentRank: profile.current_rank,
    affinity: profile.affinity,
    guildId: profile.guild_id || null,
    guildRole: profile.guild_role || null,
    guildName: profile.guild_name || null,
    guildTag: profile.guild_tag || null,
    hp: profile.hp,
    mp: profile.mp,
    maxHp: profile.max_hp,
    maxMp: profile.max_mp,
    physicalXp: profile.physical_xp,
    mentalXp: profile.mental_xp,
    questsCompleted: profile.quests_completed,
    physicalQuestsCompleted: profile.physical_quests_completed,
    mentalQuestsCompleted: profile.mental_quests_completed,
    codingQuestsCompleted: profile.coding_quests_completed,
    streak: profile.streak,
    physicalStreak: profile.physical_streak || 0,
    mentalStreak: profile.mental_streak || 0,
    studyStreak: profile.study_streak || 0,
    codingStreak: profile.coding_streak || 0,
    perfectDayStreak: profile.perfect_day_streak || 0,
    longestStreak: profile.longest_streak,
    lastQuestDate: profile.last_quest_date || null,
    titles: profile.titles || [],
    equippedTitle: profile.equipped_title || '',
    badges: profile.badges || ['first_blood'],
    achievements: profile.badges || ['first_blood'],
    skillPoints: profile.skill_points || {
      strength: 0,
      intelligence: 0,
      endurance: 0,
      discipline: 0,
      focus: 0,
      agility: 0,
    },
    availableSkillPoints: profile.available_skill_points || 0,
    availableStatPoints: profile.available_stat_points || 0,
    personalRecords: profile.personal_records || { ...DEFAULT_PERSONAL_RECORDS },
    profileFrame: profile.profile_frame || '',
    systemLog: logs,
  };
}

/**
 * Deserializes Firestore data into the Web Profile format.
 * Accurately parses numeric keys ('0'..'4') or named keys ('STR'..'PERC').
 */
export function deserializeProfileFromFirestore(data: Record<string, unknown>): Profile {
  const rawStats = (data.stats as Record<string, number>) || {};
  const normalizedStats: Record<string, number> = {
    STR: rawStats['0'] ?? rawStats.STR ?? 10,
    AGI: rawStats['1'] ?? rawStats.AGI ?? 10,
    VIT: rawStats['2'] ?? rawStats.VIT ?? 10,
    INT: rawStats['3'] ?? rawStats.INT ?? 10,
    PERC: rawStats['4'] ?? rawStats.PERC ?? 10,
  };

  const rawLogs = (data.systemLog as Array<Record<string, unknown>>) || [];
  const systemLogs: SystemLogEntry[] = rawLogs.map((l) => ({
    id: (l.id as string) || `log-${Date.now()}`,
    timestamp: (l.timestamp as number) || Date.now(),
    event_type: (l.eventType as SystemLogEntry['event_type']) || 'quest_complete',
    message: (l.message as string) || '',
    xp: typeof l.xp === 'number' ? l.xp : undefined,
  }));

  const rawName = (data.displayName as string) || (data.display_name as string) || 'Awakened Hunter';
  const rawUsername = (data.username as string) || normalizeUsername(rawName);
  let hunterId = (data.hunterId as string) || (data.hunter_id as string) || '';
  if (!/^HUNTR-[A-Z0-9]{8}$/.test(hunterId)) {
    hunterId = generateUniqueHunterId();
  }

  return {
    id: (data.id as string) || '',
    hunter_id: hunterId,
    username: rawUsername,
    display_name: rawName,
    total_xp: (data.totalXp as number) || (data.total_xp as number) || 0,
    current_level: (data.currentLevel as number) || (data.current_level as number) || 1,
    stats: normalizedStats,
    clean_days: (data.streak as number) || (data.clean_days as number) || 0,
    current_rank: (data.currentRank as string) || (data.current_rank as string) || 'E-Rank',
    affinity: (data.affinity as string) || 'AGI',
    guild_id: (data.guildId as string) || (data.guild_id as string) || null,
    guild_role: (data.guildRole as 'leader' | 'member') || (data.guild_role as 'leader' | 'member') || null,
    guild_name: (data.guildName as string) || (data.guild_name as string) || null,
    guild_tag: (data.guildTag as string) || (data.guild_tag as string) || null,
    hp: (data.hp as number) ?? 100,
    mp: (data.mp as number) ?? 100,
    max_hp: (data.maxHp as number) ?? (data.max_hp as number) ?? 100,
    max_mp: (data.maxMp as number) ?? (data.max_mp as number) ?? 100,
    physical_xp: (data.physicalXp as number) ?? (data.physical_xp as number) ?? 0,
    mental_xp: (data.mentalXp as number) ?? (data.mental_xp as number) ?? 0,
    quests_completed: (data.questsCompleted as number) ?? (data.quests_completed as number) ?? 0,
    physical_quests_completed: (data.physicalQuestsCompleted as number) ?? (data.physical_quests_completed as number) ?? 0,
    mental_quests_completed: (data.mentalQuestsCompleted as number) ?? (data.mental_quests_completed as number) ?? 0,
    coding_quests_completed: (data.codingQuestsCompleted as number) ?? (data.coding_quests_completed as number) ?? 0,
    streak: (data.streak as number) ?? 1,
    physical_streak: (data.physicalStreak as number) ?? (data.physical_streak as number) ?? 0,
    mental_streak: (data.mentalStreak as number) ?? (data.mental_streak as number) ?? 0,
    study_streak: (data.studyStreak as number) ?? (data.study_streak as number) ?? 0,
    coding_streak: (data.codingStreak as number) ?? (data.coding_streak as number) ?? 0,
    perfect_day_streak: (data.perfectDayStreak as number) ?? (data.perfect_day_streak as number) ?? 0,
    longest_streak: (data.longestStreak as number) ?? (data.longest_streak as number) ?? 1,
    last_quest_date: (data.lastQuestDate as string) ?? (data.last_quest_date as string) ?? undefined,
    titles: (data.titles as string[]) || [],
    equipped_title: (data.equippedTitle as string) ?? (data.equipped_title as string) ?? '',
    badges: Array.from(new Set([...((data.badges as string[]) || ['first_blood']), ...((data.achievements as string[]) || [])])),
    profile_frame: (data.profileFrame as string) ?? (data.profile_frame as string) ?? '',
    skill_points: (data.skillPoints as Profile['skill_points']) ?? {
      strength: 0,
      intelligence: 0,
      endurance: 0,
      discipline: 0,
      focus: 0,
      agility: 0,
    },
    available_skill_points: (data.availableSkillPoints as number) ?? (data.available_skill_points as number) ?? 0,
    available_stat_points: (data.availableStatPoints as number) ?? (data.available_stat_points as number) ?? 0,
    personal_records: (data.personalRecords as PersonalRecords) ?? (data.personal_records as PersonalRecords) ?? { ...DEFAULT_PERSONAL_RECORDS },
    system_log: systemLogs,
  };
}
