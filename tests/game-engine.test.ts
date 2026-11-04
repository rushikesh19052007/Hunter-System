import test from 'node:test';
import assert from 'node:assert/strict';

// Import compiled functions from game-engine (or run with ts-node/strip-types)
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
  DIFFICULTY_STAT_XP,
  DIFFICULTY_STAT_POINTS,
  HP_BY_RANK,
  MP_BY_RANK,
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

