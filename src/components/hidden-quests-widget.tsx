import React from 'react';
import { useHunter } from '@/lib/hunter-store';
import { Lock, Zap, Target } from 'lucide-react';

interface HiddenQuestConfig {
  id: string;
  name: string;
  conditionDescription: string;
  targetValue: number;
  currentValue: number;
}

export const HiddenQuestsWidget: React.FC = () => {
  const { profile, quests } = useHunter();

  if (!profile) return null;

  const physicalQuestsCount = profile.physical_quests_completed || 0;
  const mentalQuestsCount = profile.mental_quests_completed || 0;
  const totalQuests = profile.quests_completed || 0;
  
  // Dummy logic to calculate current values based on profile
  const hiddenQuests: HiddenQuestConfig[] = [
    {
      id: 'hq-1',
      name: 'Iron Body',
      conditionDescription: 'Complete 50 physical quests',
      targetValue: 50,
      currentValue: Math.min(50, physicalQuestsCount)
    },
    {
      id: 'hq-2',
      name: 'Scholar',
      conditionDescription: 'Complete 50 mental/study quests',
      targetValue: 50,
      currentValue: Math.min(50, mentalQuestsCount)
    },
    {
      id: 'hq-3',
      name: 'Centurion',
      conditionDescription: 'Complete 100 quests total',
      targetValue: 100,
      currentValue: Math.min(100, totalQuests)
    },
    {
      id: 'hq-4',
      name: '30-Day Warrior',
      conditionDescription: 'Complete 30 consecutive days with any quest',
      targetValue: 30,
      currentValue: Math.min(30, profile.streak || 0)
    },
    {
      id: 'hq-5',
      name: 'Milestone Master',
      conditionDescription: 'Reach 1000 total XP',
      targetValue: 1000,
      currentValue: Math.min(1000, profile.total_xp)
    }
  ];

  // Only show quests that are NOT YET completed (i.e. currentValue < targetValue)
  const lockedQuests = hiddenQuests.filter(q => q.currentValue < q.targetValue);

  if (lockedQuests.length === 0) return null;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 mt-6">
      <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
        <Lock className="w-4 h-4 text-slate-500" />
        LOCKED HIDDEN QUESTS
      </h3>
      
      <div className="space-y-4">
        {lockedQuests.slice(0, 3).map(quest => {
          const progressPct = Math.round((quest.currentValue / quest.targetValue) * 100);
          return (
            <div key={quest.id} className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-500" />
                  <h4 className="font-bold text-slate-200">{quest.name}</h4>
                </div>
              </div>
              
              <p className="text-xs text-slate-400 mb-3">{quest.conditionDescription}</p>
              
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Progress: {quest.currentValue} / {quest.targetValue}</span>
                <span>{progressPct}% to unlock</span>
              </div>
              
              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-slate-600 h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              
              <p className="text-xs text-slate-500 mt-2 text-right">
                {quest.targetValue - quest.currentValue} more needed
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
