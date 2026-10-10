import React from 'react';
import { useHunter } from '@/lib/hunter-store';
import { HUNTER_STATS, type HunterStat } from '@/lib/game-engine';
import { Plus, ShieldAlert } from 'lucide-react';

export const StatAllocationPage: React.FC = () => {
  const { profile, allocateStatPoint } = useHunter();

  if (!profile) return null;

  const availablePoints = profile.available_stat_points || 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">STAT ALLOCATION</h1>
          <p className="text-slate-400 max-w-lg">
            Distribute points earned from completing quests to permanently increase your basic attributes.
          </p>
        </div>
        <div className="bg-slate-900/60 border border-cyan-500/30 rounded-xl p-4 min-w-[200px] flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-colors" />
          <span className="text-sm text-cyan-400 font-medium mb-1 tracking-wider">AVAILABLE POINTS</span>
          <span className="text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">
            {availablePoints}
          </span>
        </div>
      </div>

      {availablePoints === 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex gap-3 text-amber-200">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">You have no stat points available. Complete higher difficulty quests to earn more points.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(Object.entries(HUNTER_STATS) as [HunterStat, typeof HUNTER_STATS[HunterStat]][]).map(([code, statDef]) => {
          const currentVal = profile.stats[code] || 10;
          return (
            <div 
              key={code}
              className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/80 transition-all flex flex-col justify-between"
              style={{
                boxShadow: `0 4px 20px -2px rgba(0,0,0,0.5)`,
                borderLeft: `4px solid ${statDef.color}`
              }}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-wide" style={{ color: statDef.color }}>
                      {code}
                    </h3>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">{statDef.name}</p>
                  </div>
                  <div className="text-3xl font-bold text-white bg-slate-800/80 px-4 py-1 rounded-lg">
                    {currentVal}
                  </div>
                </div>
                <p className="text-sm text-slate-300 mb-4 line-clamp-2" title={statDef.description}>
                  {statDef.description}
                </p>
              </div>
              
              <button
                onClick={() => allocateStatPoint(code, 1)}
                disabled={availablePoints <= 0}
                className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: availablePoints > 0 ? statDef.color : 'rgba(51, 65, 85, 0.5)',
                  color: availablePoints > 0 ? '#fff' : '#94a3b8',
                }}
              >
                <Plus className="w-4 h-4" />
                <span>ALLOCATE 1 POINT</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
