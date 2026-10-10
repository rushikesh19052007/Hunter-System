import React from 'react';
import { motion } from 'framer-motion';
import { X, BookOpen, Clock, Target, Repeat, Zap } from 'lucide-react';
import { type Quest, getDifficultyColor, getCategoryLabel, getDifficultyStars, DIFFICULTY_XP, DIFFICULTY_STAT_POINTS } from '@/lib/game-engine';

interface QuestGuideModalProps {
  quest: Quest;
  onClose: () => void;
}

export const QuestGuideModal: React.FC<QuestGuideModalProps> = ({ quest, onClose }) => {
  const diffColor = getDifficultyColor(quest.difficulty);
  const xpReward = quest.xp_reward || DIFFICULTY_XP[quest.difficulty] || 25;
  const statPoints = DIFFICULTY_STAT_POINTS[quest.difficulty] || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl relative"
      >
        <div 
          className="h-1 w-full absolute top-0 left-0" 
          style={{ backgroundColor: diffColor }}
        />
        
        <div className="flex justify-between items-start p-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4" style={{ color: diffColor }} />
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: diffColor }}>
                QUEST GUIDE
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">{quest.name}</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors bg-slate-800/50 p-1.5 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">DIFFICULTY</p>
              <p className="font-bold text-white flex items-center gap-2">
                <span style={{ color: diffColor }}>{quest.difficulty}-Rank</span>
                <span className="text-xs text-slate-500">{getDifficultyStars(quest.difficulty)}</span>
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">REWARD</p>
              <p className="font-bold text-emerald-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                {xpReward} XP + {statPoints} SP
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">CATEGORY</p>
              <p className="font-bold text-cyan-400">{getCategoryLabel(quest.category)}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">REPEATABLE</p>
              <p className="font-bold text-purple-400 flex items-center gap-1">
                <Repeat className="w-3.5 h-3.5" />
                {quest.repeatable ? quest.repeatable.toUpperCase() : 'ONCE'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-500" />
              HOW TO COMPLETE
            </h3>
            <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap bg-slate-800/30 p-4 rounded-lg border border-slate-700/30">
              {quest.description || 'No detailed instructions provided for this quest. Follow the objective name to complete it.'}
            </div>
          </div>

          {quest.time_limit_hours && (
             <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-3 text-amber-200">
               <Clock className="w-5 h-5 flex-shrink-0" />
               <p className="text-sm">This quest has a recommended time limit of <strong>{quest.time_limit_hours} hours</strong>. Complete it swiftly to train agility.</p>
             </div>
          )}

        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/80">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
          >
            UNDERSTOOD
          </button>
        </div>
      </motion.div>
    </div>
  );
};
