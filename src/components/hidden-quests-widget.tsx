import React, { useState } from 'react';
import { useHunter } from '@/lib/hunter-store';
import { Lock, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface HiddenQuestConfig {
  id: string;
  name: string;
  reward: string;
  conditionDescription: string;
  targetValue: number;
  currentValue: (profile: ReturnType<typeof useHunter>['profile']) => number;
  unit: string;
  color: string;
}

const HIDDEN_QUEST_CONFIGS: HiddenQuestConfig[] = [
  {
    id: 'hq-week-warrior',
    name: 'Week Warrior',
    reward: '+500 XP + 🔥 Badge',
    conditionDescription: 'Complete 7 consecutive days with any quest',
    targetValue: 7,
    currentValue: (p) => Math.min(7, p?.streak || 0),
    unit: 'days',
    color: '#f59e0b',
  },
  {
    id: 'hq-iron-body',
    name: 'Iron Body',
    reward: '+800 XP + 💪 Badge',
    conditionDescription: 'Complete 50 physical quests',
    targetValue: 50,
    currentValue: (p) => Math.min(50, p?.physical_quests_completed || 0),
    unit: 'physical quests',
    color: '#ef4444',
  },
  {
    id: 'hq-scholar',
    name: 'Scholar',
    reward: '+800 XP + 🧠 Title',
    conditionDescription: 'Complete 50 mental or study quests',
    targetValue: 50,
    currentValue: (p) => Math.min(50, p?.mental_quests_completed || 0),
    unit: 'mental quests',
    color: '#8b5cf6',
  },
  {
    id: 'hq-centurion',
    name: 'Centurion',
    reward: '+1000 XP + 🎯 Badge',
    conditionDescription: 'Complete 100 total quests',
    targetValue: 100,
    currentValue: (p) => Math.min(100, p?.quests_completed || 0),
    unit: 'quests',
    color: '#06b6d4',
  },
  {
    id: 'hq-milestone-master',
    name: 'Milestone Master',
    reward: '+200 XP + 🚀 Badge',
    conditionDescription: 'Accumulate 1,000 total XP',
    targetValue: 1000,
    currentValue: (p) => Math.min(1000, p?.total_xp || 0),
    unit: 'XP',
    color: '#10b981',
  },
  {
    id: 'hq-iron-discipline',
    name: 'Iron Discipline',
    reward: '+1500 XP + Special Title',
    conditionDescription: 'Maintain a 30-day consecutive streak',
    targetValue: 30,
    currentValue: (p) => Math.min(30, p?.streak || 0),
    unit: 'days streak',
    color: '#ec4899',
  },
  {
    id: 'hq-code-master',
    name: 'Code Master',
    reward: '+500 XP + 💻 Title',
    conditionDescription: 'Complete 10 coding quests',
    targetValue: 10,
    currentValue: (p) => Math.min(10, p?.coding_quests_completed || 0),
    unit: 'coding quests',
    color: '#3b82f6',
  },
  {
    id: 'hq-balanced-hunter',
    name: 'Balanced Hunter',
    reward: '+2000 XP + Legendary Badge',
    conditionDescription: 'Raise all 5 stats (STR/AGI/VIT/INT/PERC) above 50',
    targetValue: 5,
    currentValue: (p) => {
      if (!p?.stats) return 0;
      return Object.values(p.stats).filter(v => v >= 50).length;
    },
    unit: 'stats above 50',
    color: '#eab308',
  },
  {
    id: 'hq-elite-path',
    name: 'Elite Path',
    reward: '+3000 XP + ⚔️ Title',
    conditionDescription: 'Reach A-Rank hunter status',
    targetValue: 5,
    currentValue: (p) => {
      const rankMap: Record<string, number> = { 'E-Rank': 0, 'D-Rank': 1, 'C-Rank': 2, 'B-Rank': 3, 'A-Rank': 4, 'S-Rank': 5 };
      return Math.min(5, rankMap[p?.current_rank || 'E-Rank'] || 0);
    },
    unit: 'rank levels',
    color: '#f97316',
  },
  {
    id: 'hq-monarchs-trial',
    name: "Monarch's Trial",
    reward: '+10000 XP + 👑 Monarch Title',
    conditionDescription: 'Ascend to S-Rank — the pinnacle of human evolution',
    targetValue: 6,
    currentValue: (p) => {
      const rankMap: Record<string, number> = { 'E-Rank': 0, 'D-Rank': 1, 'C-Rank': 2, 'B-Rank': 3, 'A-Rank': 4, 'S-Rank': 6 };
      return Math.min(6, rankMap[p?.current_rank || 'E-Rank'] || 0);
    },
    unit: 'rank levels',
    color: '#ec4899',
  },
];

export const HiddenQuestsWidget: React.FC = () => {
  const { profile, unlockedAchievements } = useHunter();
  const [expanded, setExpanded] = useState(false);

  if (!profile) return null;

  const lockedQuests = HIDDEN_QUEST_CONFIGS.filter(q => {
    const current = q.currentValue(profile);
    const isUnlocked = unlockedAchievements.some(id => id.includes(q.id.replace('hq-', '')));
    return current < q.targetValue && !isUnlocked;
  });

  if (lockedQuests.length === 0) return null;

  const displayQuests = expanded ? lockedQuests : lockedQuests.slice(0, 3);

  return (
    <div className="hidden-quests-widget">
      <div className="hq-widget-header">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-purple-400" />
          <span className="hq-widget-title">LOCKED HIDDEN TRIALS</span>
          <span className="hq-count-badge">{lockedQuests.length}</span>
        </div>
        {lockedQuests.length > 3 && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="hq-expand-btn"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{expanded ? 'COLLAPSE' : `+${lockedQuests.length - 3} MORE`}</span>
          </button>
        )}
      </div>

      <div className="hq-list">
        {displayQuests.map(quest => {
          const current = quest.currentValue(profile);
          const progressPct = Math.round((current / quest.targetValue) * 100);
          const remaining = quest.targetValue - current;

          return (
            <div key={quest.id} className="hq-item">
              <div className="hq-item-top">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" style={{ color: quest.color }} />
                  <span className="hq-name">{quest.name}</span>
                </div>
                <span className="hq-progress-pct" style={{ color: quest.color }}>{progressPct}%</span>
              </div>

              <p className="hq-condition">{quest.conditionDescription}</p>

              <div className="hq-progress-row">
                <span className="hq-progress-text">
                  {current.toLocaleString()} / {quest.targetValue.toLocaleString()} {quest.unit}
                </span>
                <span className="hq-remaining">{remaining.toLocaleString()} more needed</span>
              </div>

              <div className="hq-track">
                <div
                  className="hq-fill"
                  style={{ width: `${progressPct}%`, background: quest.color }}
                />
              </div>

              <div className="hq-reward-preview">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Reward: {quest.reward}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
