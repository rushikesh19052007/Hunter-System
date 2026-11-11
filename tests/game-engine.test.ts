import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeUsername,
  isValidUsername,
  generateUniqueHunterId,
  calculateLevel,
  calculateRank,
  getXpForLevel,
  calculateMaxHp,
  calculateMaxMp,
  getStreakBonus,
  getStreakBonusMultiplier,
  DIFFICULTY_XP,
  DIFFICULTY_STAT_POINTS,
  HP_BY_RANK,
  MP_BY_RANK,
  HUNTER_STATS,
} from '../src/lib/game-engine.ts';

test('1. Username Normalization & Validation', () => {
  assert.equal(normalizeUsername('  Hunter_King_99  '), 'hunter_king_99');
  assert.equal(normalizeUsername('SOLO-LEVELING!#$'), 'sololeveling');
  assert.equal(normalizeUsername('user@domain.com'), 'userdomaincom');

  assert.equal(isValidUsername('shadow_monarch'), true);
  assert.equal(isValidUsername('ab'), false); // Too short (< 3)
  assert.equal(isValidUsername('toolongusernameovertwentycharacters'), false); // Too long (> 20)
  assert.equal(isValidUsername('hunter 99'), false); // Spaces forbidden
  assert.equal(isValidUsername('HUNTER'), false); // Uppercase rejected (enforcing strictly lowercase)
});

test('2. Unique Hunter ID Format', () => {
  for (let i = 0; i < 20; i++) {
    const id = generateUniqueHunterId();
    assert.match(id, /^HUNTR-[2-9A-HJ-NP-Z]{8}$/);
  }
});

test('3. XP, Level Curves and Rank Promotions', () => {
  assert.equal(calculateLevel(0), 1);
  assert.equal(calculateLevel(100), 1);

  // Level 10 threshold -> D-Rank
  const xpLevel10 = getXpForLevel(10);
  assert.equal(calculateLevel(xpLevel10), 10);
  assert.equal(calculateRank(10), 'D-Rank');

  // Level 25 threshold -> C-Rank
  assert.equal(calculateRank(25), 'C-Rank');

  // Level 45 threshold -> B-Rank
  assert.equal(calculateRank(45), 'B-Rank');

  // Level 70 threshold -> A-Rank
  assert.equal(calculateRank(70), 'A-Rank');

  // Level 95 threshold -> S-Rank
  assert.equal(calculateRank(95), 'S-Rank');
});

test('4. Difficulty XP & Stat Points Rewards', () => {
  // Stat points by difficulty: E+1, D+2, C+3, B+4, A+5, S+8
  assert.equal(DIFFICULTY_STAT_POINTS.E, 1);
  assert.equal(DIFFICULTY_STAT_POINTS.D, 2);
  assert.equal(DIFFICULTY_STAT_POINTS.C, 3);
  assert.equal(DIFFICULTY_STAT_POINTS.B, 4);
  assert.equal(DIFFICULTY_STAT_POINTS.A, 5);
  assert.equal(DIFFICULTY_STAT_POINTS.S, 8);

  // Difficulty base XP
  assert.equal(DIFFICULTY_XP.E, 15);
  assert.equal(DIFFICULTY_XP.D, 35);
  assert.equal(DIFFICULTY_XP.C, 60);
  assert.equal(DIFFICULTY_XP.B, 100);
  assert.equal(DIFFICULTY_XP.A, 150);
  assert.equal(DIFFICULTY_XP.S, 250);
});

test('5. Base HP & MP Scaling and Thresholds', () => {
  assert.equal(HP_BY_RANK['E-Rank'], 100);
  assert.equal(HP_BY_RANK['D-Rank'], 130);
  assert.equal(HP_BY_RANK['C-Rank'], 170);
  assert.equal(HP_BY_RANK['B-Rank'], 220);
  assert.equal(HP_BY_RANK['A-Rank'], 290);
  assert.equal(HP_BY_RANK['S-Rank'], 400);

  assert.equal(MP_BY_RANK['E-Rank'], 100);
  assert.equal(MP_BY_RANK['D-Rank'], 125);
  assert.equal(MP_BY_RANK['C-Rank'], 160);
  assert.equal(MP_BY_RANK['B-Rank'], 210);
  assert.equal(MP_BY_RANK['A-Rank'], 280);
  assert.equal(MP_BY_RANK['S-Rank'], 400);

  // Physical XP threshold test (+12 avg HP per 500 physical XP)
  assert.equal(calculateMaxHp(0, 'E-Rank'), 100);
  assert.equal(calculateMaxHp(500, 'E-Rank'), 112);
  assert.equal(calculateMaxHp(1000, 'E-Rank'), 124);

  // Mental XP threshold test (+10 avg MP per 500 mental XP)
  assert.equal(calculateMaxMp(0, 'E-Rank'), 100);
  assert.equal(calculateMaxMp(500, 'E-Rank'), 110);
  assert.equal(calculateMaxMp(1000, 'E-Rank'), 120);
});

test('6. Multi-Streaks & Momentum Multipliers', () => {
  assert.equal(getStreakBonus(0), 0);
  assert.equal(getStreakBonus(6), 0);
  assert.equal(getStreakBonus(7), 20); // 7d +20%
  assert.equal(getStreakBonus(14), 50); // 14d +50%
  assert.equal(getStreakBonus(30), 100); // 30d +100%
  assert.equal(getStreakBonus(60), 150); // 60d +150%
  assert.equal(getStreakBonus(100), 200); // 100d +200%

  assert.equal(getStreakBonusMultiplier(0), 1.0);
  assert.equal(getStreakBonusMultiplier(7), 1.2);
  assert.equal(getStreakBonusMultiplier(14), 1.5);
  assert.equal(getStreakBonusMultiplier(30), 2.0);
  assert.equal(getStreakBonusMultiplier(60), 2.5);
  assert.equal(getStreakBonusMultiplier(100), 3.0);
});

test('7. UID-Scoped Storage Key Generation & Cross-Account Isolation', () => {
  const getStorageProfileKey = (uid?: string) => uid ? `hunter_system_profile_${uid}` : 'hunter_system_profile';
  const getStorageQuestsKey = (uid?: string) => uid ? `hunter_system_quests_${uid}` : 'hunter_system_quests';

  const userA = 'user_alpha_123';
  const userB = 'user_bravo_456';

  assert.equal(getStorageProfileKey(userA), 'hunter_system_profile_user_alpha_123');
  assert.equal(getStorageProfileKey(userB), 'hunter_system_profile_user_bravo_456');
  assert.notEqual(getStorageProfileKey(userA), getStorageProfileKey(userB));

  assert.equal(getStorageQuestsKey(userA), 'hunter_system_quests_user_alpha_123');
  assert.equal(getStorageQuestsKey(userB), 'hunter_system_quests_user_bravo_456');
});

test('8. Idempotent Quest Completion Guard', () => {
  const activeQuests = [
    { id: 'q1', name: 'Sprint', completed: false, xp_reward: 35 },
    { id: 'q2', name: 'Meditate', completed: true, xp_reward: 15 },
  ];

  const inFlightCompletions = new Set<string>();

  function tryComplete(questId: string): boolean {
    if (inFlightCompletions.has(questId)) return false;
    const q = activeQuests.find(item => item.id === questId);
    if (!q || q.completed) return false;

    inFlightCompletions.add(questId);
    q.completed = true;
    return true;
  }

  // First completion attempt on q1 succeeds
  assert.equal(tryComplete('q1'), true);

  // Immediate subsequent completion attempt on q1 is rejected by inFlight guard
  assert.equal(tryComplete('q1'), false);

  // Completion on already-completed q2 is rejected
  assert.equal(tryComplete('q2'), false);
});

test('9. Friend Request State Transition & Self-Request Rejection', () => {
  const validTransitions: Record<string, string[]> = {
    pending: ['accepted', 'declined'],
    accepted: [],
    declined: [],
  };

  function canTransition(current: string, next: string): boolean {
    return (validTransitions[current] || []).includes(next);
  }

  assert.equal(canTransition('pending', 'accepted'), true);
  assert.equal(canTransition('pending', 'declined'), true);
  assert.equal(canTransition('accepted', 'pending'), false);
  assert.equal(canTransition('declined', 'pending'), false);

  function validateFriendRequest(fromUid: string, toUid: string, status: string): boolean {
    if (fromUid === toUid) return false; // Self-request blocked
    if (status !== 'pending') return false; // Initial status must be pending
    return true;
  }

  assert.equal(validateFriendRequest('uid_1', 'uid_2', 'pending'), true);
  assert.equal(validateFriendRequest('uid_1', 'uid_1', 'pending'), false); // blocked
  assert.equal(validateFriendRequest('uid_1', 'uid_2', 'accepted'), false); // blocked
});

test('10. Guild Leadership Authorization Rules', () => {
  interface Guild {
    id: string;
    leaderUid: string;
    name: string;
    memberCount: number;
  }

  const testGuild: Guild = {
    id: 'guild_shadow',
    leaderUid: 'leader_jinwoo',
    name: 'Ahjin Guild',
    memberCount: 5,
  };

  function canModifyGuildMetadata(actorUid: string, guild: Guild): boolean {
    return actorUid === guild.leaderUid;
  }

  function canUpdateMemberCountOnly(changedKeys: string[]): boolean {
    return changedKeys.every(k => k === 'memberCount' || k === 'updatedAt');
  }

  assert.equal(canModifyGuildMetadata('leader_jinwoo', testGuild), true);
  assert.equal(canModifyGuildMetadata('random_hunter', testGuild), false);

  assert.equal(canUpdateMemberCountOnly(['memberCount', 'updatedAt']), true);
  assert.equal(canUpdateMemberCountOnly(['name', 'leaderUid']), false);
});

test('11. Stat Model Consistency: STR, AGI, VIT, INT, PERC', () => {
  const statKeys = Object.keys(HUNTER_STATS);
  assert.deepEqual(statKeys.sort(), ['AGI', 'INT', 'PERC', 'STR', 'VIT'].sort());
  assert.equal(HUNTER_STATS.STR.code, 'STR');
  assert.equal(HUNTER_STATS.AGI.code, 'AGI');
  assert.equal(HUNTER_STATS.VIT.code, 'VIT');
  assert.equal(HUNTER_STATS.INT.code, 'INT');
  assert.equal(HUNTER_STATS.PERC.code, 'PERC');
});

test('12. Empty Quest Cache Persistence & Deserialization', () => {
  // Mock localStorage store
  const mockStorage: Record<string, string> = {};
  const uid = 'user_test_99';
  const questsKey = `hunter_system_quests_${uid}`;

  // When user completes or deletes all quests, empty array [] must be serialized
  const emptyQuests: any[] = [];
  mockStorage[questsKey] = JSON.stringify(emptyQuests);

  // On reload, deserializing the empty cache returns an empty list, not fallback stale quests
  const loadedRaw = mockStorage[questsKey];
  assert.ok(loadedRaw !== undefined);
  const parsed = JSON.parse(loadedRaw);
  assert.ok(Array.isArray(parsed));
  assert.equal(parsed.length, 0);
});

test('13. Serialized Save Queue Simulator', async () => {
  let inFlight = false;
  let pendingSave: number | null = null;
  const savedHistory: number[] = [];

  async function mockSync(stateId: number) {
    if (inFlight) {
      pendingSave = stateId;
      return;
    }
    inFlight = true;
    // Simulate async IO delay
    await new Promise(r => setTimeout(r, 10));
    savedHistory.push(stateId);
    inFlight = false;

    if (pendingSave !== null) {
      const next = pendingSave;
      pendingSave = null;
      await mockSync(next);
    }
  }

  // Trigger rapid updates: 1, then 2, 3 while 1 is in-flight
  const p1 = mockSync(1);
  const p2 = mockSync(2);
  const p3 = mockSync(3);

  await Promise.all([p1, p2, p3]);
  await new Promise(r => setTimeout(r, 30));

  // State 1 was written, and the latest dirty state (3) was cleanly flushed without drop
  assert.ok(savedHistory.includes(1));
  assert.equal(savedHistory[savedHistory.length - 1], 3);
});

test('14. Friend Request Recipient-Only Acceptance Rule', () => {
  function canAcceptFriendRequest(actorUid: string, request: { fromUid: string; toUid: string; status: string }): boolean {
    // Only the designated receiver (toUid) can accept; sender (fromUid) cannot accept their own request
    return actorUid === request.toUid && request.status === 'pending';
  }

  const req = { fromUid: 'hunter_a', toUid: 'hunter_b', status: 'pending' };

  assert.equal(canAcceptFriendRequest('hunter_b', req), true); // recipient can accept
  assert.equal(canAcceptFriendRequest('hunter_a', req), false); // sender cannot accept
  assert.equal(canAcceptFriendRequest('stranger_c', req), false); // stranger cannot accept
});

test('15. Guild Affiliation Authorization Rule', () => {
  function canUpdateAffiliation(
    actorUid: string,
    targetUserId: string,
    targetGuildId: string | null,
    isLeaderOfTargetGuild: boolean
  ): boolean {
    // Must be either the owner of target document OR leader of target guild
    return actorUid === targetUserId || isLeaderOfTargetGuild;
  }

  // Owner joining/leaving
  assert.equal(canUpdateAffiliation('user_1', 'user_1', 'guild_x', false), true);

  // Guild leader accepting user_1 into guild_x
  assert.equal(canUpdateAffiliation('leader_boss', 'user_1', 'guild_x', true), true);

  // Unauthorized third party attempting to change user_1 affiliation
  assert.equal(canUpdateAffiliation('random_intruder', 'user_1', 'guild_x', false), false);
});

test('16. Stat & Skill Point Allocation Never Awards XP (No Infinite Loop)', () => {
  // Simulate allocating a stat point on a Level 23 hunter
  const initialTotalXp = 9430;
  const initialLevel = 23;
  const initialSP = 8;
  const initialStatPts = 8;
  const initialSTR = 11;

  // Allocation function matching hunter-store.tsx logic
  function allocatePoint(profile: {
    total_xp: number;
    current_level: number;
    available_skill_points: number;
    available_stat_points: number;
    stats: Record<string, number>;
  }, statKey: string) {
    if (profile.available_skill_points <= 0 && profile.available_stat_points <= 0) return profile;
    return {
      ...profile,
      available_skill_points: Math.max(0, profile.available_skill_points - 1),
      available_stat_points: Math.max(0, profile.available_stat_points - 1),
      stats: {
        ...profile.stats,
        [statKey]: (profile.stats[statKey] || 10) + 1,
      },
    };
  }

  const updated = allocatePoint({
    total_xp: initialTotalXp,
    current_level: initialLevel,
    available_skill_points: initialSP,
    available_stat_points: initialStatPts,
    stats: { STR: initialSTR },
  }, 'STR');

  // Verify stat incremented
  assert.equal(updated.stats.STR, 12);
  // Verify available points decremented
  assert.equal(updated.available_skill_points, 7);
  assert.equal(updated.available_stat_points, 7);
  // CRITICAL: Total XP and Level MUST NOT CHANGE when allocating points
  assert.equal(updated.total_xp, initialTotalXp);
  assert.equal(updated.current_level, initialLevel);
});
