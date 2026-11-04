import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Sparkles,
  Target,
  Calculator,
  Compass,
  CheckCircle,
  Plus,
  AlertTriangle,
  X,
  ChevronRight,
  Shield,
  Zap,
} from 'lucide-react';
import { useHunter } from '@/lib/hunter-store';
import {
  getXpProgress,
  calculateRank,
  getXpForLevel,
  DIFFICULTY_XP,
  DIFFICULTY_STAT_POINTS,
  type DifficultyGrade,
  type QuestCategory,
} from '@/lib/game-engine';

interface RaphaelAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type RaphaelTab = 'briefing' | 'calculator' | 'deconstruct' | 'manual';

export const RaphaelAssistantModal: React.FC<RaphaelAssistantModalProps> = ({ isOpen, onClose }) => {
  const { profile, quests, addCustomQuest } = useHunter();
  const [activeTab, setActiveTab] = useState<RaphaelTab>('briefing');

  // Goal deconstruction state
  const [goalInput, setGoalInput] = useState('');
  const [deconstructedQuests, setDeconstructedQuests] = useState<Array<{
    name: string;
    description: string;
    difficulty: DifficultyGrade;
    category: QuestCategory;
    stat: string;
    target: number;
  }>>([]);
  const [committedNotice, setCommittedNotice] = useState<string | null>(null);

  // Tactical briefing derived metrics
  const activeQuests = useMemo(() => quests.filter(q => !q.completed), [quests]);
  const completedToday = useMemo(() => quests.filter(q => q.completed), [quests]);

  const recommendedPriorities = useMemo(() => {
    return [...activeQuests]
      .sort((a, b) => {
        const diffRank: Record<string, number> = { S: 6, A: 5, B: 4, C: 3, D: 2, E: 1 };
        return (diffRank[b.difficulty] || 1) - (diffRank[a.difficulty] || 1);
      })
      .slice(0, 3);
  }, [activeQuests]);

  // Progression math
  const xpProg = useMemo(() => {
    if (!profile) return { currentLevel: 1, currentProgressXp: 0, xpNeededForNext: 100, percentage: 0 };
    return getXpProgress(profile.total_xp);
  }, [profile]);

  const remainingXpForLevel = Math.max(0, xpProg.xpNeededForNext - xpProg.currentProgressXp);

  // Calculate next rank gate
  const rankGates: Record<string, { nextRank: string; levelReq: number }> = {
    'E-Rank': { nextRank: 'D-Rank', levelReq: 10 },
    'D-Rank': { nextRank: 'C-Rank', levelReq: 25 },
    'C-Rank': { nextRank: 'B-Rank', levelReq: 45 },
    'B-Rank': { nextRank: 'A-Rank', levelReq: 70 },
    'A-Rank': { nextRank: 'S-Rank', levelReq: 95 },
    'S-Rank': { nextRank: 'National Level', levelReq: 150 },
  };

  const nextRankInfo = profile ? rankGates[profile.current_rank] : null;
  const levelsUntilNextRank = nextRankInfo && profile ? Math.max(0, nextRankInfo.levelReq - profile.current_level) : 0;
  const xpUntilNextRank = nextRankInfo && profile
    ? Math.max(0, getXpForLevel(nextRankInfo.levelReq) - profile.total_xp)
    : 0;

  // Local Rule-Based Goal Deconstructor
  const handleDeconstruct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim()) return;

    const term = goalInput.toLowerCase().trim();
    let generated: typeof deconstructedQuests = [];

    if (term.includes('code') || term.includes('program') || term.includes('dev') || term.includes('web') || term.includes('app')) {
      generated = [
        {
          name: `Architect: ${goalInput.slice(0, 30)}`,
          description: 'Design system schema, component contracts, and repository structure.',
          difficulty: 'C',
          category: 'coding',
          stat: 'int',
          target: 1,
        },
        {
          name: 'Core Implementation Sprint',
          description: 'Ship 90 minutes of focused code without distractions.',
          difficulty: 'B',
          category: 'coding',
          stat: 'per',
          target: 90,
        },
        {
          name: 'Verification & Code Review',
          description: 'Write automated unit tests and verify 0 compiler/lint warnings.',
          difficulty: 'D',
          category: 'coding',
          stat: 'int',
          target: 1,
        },
      ];
    } else if (term.includes('run') || term.includes('gym') || term.includes('workout') || term.includes('fitness') || term.includes('health') || term.includes('weight')) {
      generated = [
        {
          name: `Conditioning: ${goalInput.slice(0, 30)}`,
          description: 'Warm-up stretching, mobility drills, and cardiovascular priming.',
          difficulty: 'E',
          category: 'physical',
          stat: 'agi',
          target: 15,
        },
        {
          name: 'High Intensity Core Progression',
          description: 'Execute planned sets/intervals with strict biomechanical form.',
          difficulty: 'C',
          category: 'physical',
          stat: 'str',
          target: 45,
        },
        {
          name: 'Recovery & Hydration Protocol',
          description: 'Consume post-workout nutrition and minimum 1.5L clean water.',
          difficulty: 'E',
          category: 'physical',
          stat: 'vit',
          target: 1,
        },
      ];
    } else if (term.includes('book') || term.includes('read') || term.includes('study') || term.includes('exam') || term.includes('learn')) {
      generated = [
        {
          name: `Deep Study: ${goalInput.slice(0, 30)}`,
          description: 'Focused chapter analysis with margin annotations and key concept extraction.',
          difficulty: 'D',
          category: 'study',
          stat: 'int',
          target: 30,
        },
        {
          name: 'Feynman Concept Articulation',
          description: 'Summarize the core theorem or narrative in your own concise notes.',
          difficulty: 'C',
          category: 'study',
          stat: 'per',
          target: 1,
        },
        {
          name: 'Flash Review Session',
          description: 'Spaced repetition review of prior lesson material.',
          difficulty: 'E',
          category: 'study',
          stat: 'int',
          target: 15,
        },
      ];
    } else {
      // General productivity breakdown
      generated = [
        {
          name: `Scope & Clarify: ${goalInput.slice(0, 30)}`,
          description: 'Define clear acceptance criteria and milestones for this objective.',
          difficulty: 'D',
          category: 'mental',
          stat: 'per',
          target: 1,
        },
        {
          name: 'Primary Deep-Work Execution Block',
          description: '60 minutes of uninterrupted focus dedicated strictly to this outcome.',
          difficulty: 'C',
          category: 'mental',
          stat: 'int',
          target: 60,
        },
        {
          name: 'Milestone Retrospective',
          description: 'Log progress evidence and schedule subsequent trial phases.',
          difficulty: 'E',
          category: 'mental',
          stat: 'vit',
          target: 1,
        },
      ];
    }

    setDeconstructedQuests(generated);
  };

  const handleCommitQuest = (q: typeof deconstructedQuests[0]) => {
    addCustomQuest({
      name: q.name,
      description: q.description,
      difficulty: q.difficulty,
      category: q.category,
      stat: q.stat,
      target: q.target,
      xp_reward: DIFFICULTY_XP[q.difficulty] || 25,
      stat_xp_reward: DIFFICULTY_STAT_POINTS[q.difficulty] || 1,
      stat_xp_type: q.category === 'physical' ? 'physical' : 'mental',
      repeatable: 'once',
    });
    setCommittedNotice(`Directive "${q.name}" committed to Quest Board.`);
    setTimeout(() => setCommittedNotice(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-slate-950 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-cyan-500/20 bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.25)]">
                <Brain className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-wider text-white font-mono">RAPHAEL // SYSTEM ADVISOR</h2>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Deterministic OS
                  </span>
                </div>
                <p className="text-xs text-slate-400">Tactical Productivity Intelligence // Zero Cloud APIs // Local Engine</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-800 bg-slate-900/30 px-5 gap-2 text-xs font-semibold overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('briefing')}
              className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'briefing'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              TACTICAL BRIEFING
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('calculator')}
              className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'calculator'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              PROGRESSION MATH
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('deconstruct')}
              className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'deconstruct'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              GOAL DECONSTRUCTOR
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'manual'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              SYSTEM CODEX
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* TACTICAL BRIEFING */}
            {activeTab === 'briefing' && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/20 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed text-slate-300 space-y-1">
                    <p className="font-semibold text-white">
                      Hunter Status: {profile?.display_name || 'Hunter'} // {profile?.current_rank || 'E-Rank'} (Level {profile?.current_level || 1})
                    </p>
                    <p>
                      Active trials on board: <span className="text-cyan-300 font-bold">{activeQuests.length}</span>.
                      Cleared today: <span className="text-emerald-300 font-bold">{completedToday.length}</span>.
                      Momentum streak: <span className="text-amber-300 font-bold">{profile?.streak || 1} Days</span>.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Recommended Priority Directives For Today
                  </h3>
                  {recommendedPriorities.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                      All directives cleared or no trials active. Create a new quest or inspect the Codex.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {recommendedPriorities.map((q, idx) => (
                        <div
                          key={q.id}
                          className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 hover:border-cyan-500/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-slate-800 text-cyan-400 font-mono text-xs flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="text-sm font-bold text-white">{q.name}</div>
                              <div className="text-xs text-slate-400 line-clamp-1">{q.description}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                              {q.difficulty}-Rank
                            </span>
                            <span className="text-xs text-cyan-300 font-mono font-bold">
                              +{q.xp_reward} XP
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
                  <span className="font-bold text-amber-400">RAPHAEL ADVISORY: </span>
                  Maintain your daily streak to trigger momentum XP multipliers (+20% at 7d, +50% at 14d, +100% at 30d). Avoid letting your board exceed 8 active trials to mitigate focus fragmentation.
                </div>
              </div>
            )}

            {/* PROGRESSION MATH */}
            {activeTab === 'calculator' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Next Level Gate</span>
                    <div className="text-xl font-black text-cyan-300 mt-1">Level {(profile?.current_level || 1) + 1}</div>
                    <div className="text-xs text-slate-400 mt-1 font-mono">Need {remainingXpForLevel} XP more</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Next Rank Gate</span>
                    <div className="text-xl font-black text-amber-300 mt-1">{nextRankInfo?.nextRank || 'Supreme Hunter'}</div>
                    <div className="text-xs text-slate-400 mt-1 font-mono">{levelsUntilNextRank} levels / {xpUntilNextRank} XP</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Trials Required to Level Up ({remainingXpForLevel} XP needed)
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    {(['E', 'D', 'C', 'B', 'A', 'S'] as DifficultyGrade[]).map((grade) => {
                      const xp = DIFFICULTY_XP[grade] || 25;
                      const needed = Math.ceil(remainingXpForLevel / xp);
                      return (
                        <div key={grade} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                          <span className="font-bold text-white">{grade}-Rank</span>
                          <div className="text-cyan-400 font-mono font-bold text-base mt-1">{needed}</div>
                          <span className="text-[10px] text-slate-500">trials ({xp} XP ea)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                    Stat Points Rewards Matrix
                  </div>
                  <p className="text-slate-400">
                    E: +1 pt &bull; D: +2 pts &bull; C: +3 pts &bull; B: +4 pts &bull; A: +5 pts &bull; S: +8 pts.
                    Use points to elevate Strength (STR), Agility (AGI), Intelligence (INT), Vitality (VIT), and Perception (SEN).
                  </p>
                </div>
              </div>
            )}

            {/* GOAL DECONSTRUCTOR */}
            {activeTab === 'deconstruct' && (
              <div className="space-y-5">
                <form onSubmit={handleDeconstruct} className="space-y-3">
                  <label htmlFor="goal-input-field" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Enter Real-World Goal / Skill / Project
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="goal-input-field"
                      type="text"
                      placeholder="e.g. Master TypeScript, Run 10k, Read Clean Code..."
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs tracking-wider uppercase transition-colors shrink-0 flex items-center gap-1.5"
                    >
                      <Brain className="w-4 h-4" />
                      Deconstruct
                    </button>
                  </div>
                </form>

                {committedNotice && (
                  <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{committedNotice}</span>
                  </div>
                )}

                {deconstructedQuests.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Generated Trial Directives (Review Before Adding)
                    </h3>
                    <div className="space-y-2.5">
                      {deconstructedQuests.map((q, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{q.name}</span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                                {q.difficulty}-Rank
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">{q.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCommitQuest(q)}
                            className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Commit
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SYSTEM CODEX */}
            {activeTab === 'manual' && (
              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white text-sm">Autonomous Productivity Architecture</h4>
                  <p>
                    HUNTR converts genuine daily discipline into quantifiable RPG progression. Every directive completed advances your level, awards stat points, and increases momentum.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white text-sm">Transparency & Security Policy</h4>
                  <p>
                    RAPHAEL operates strictly in-browser via deterministic rule engines. No user prompts, personal habits, or private quest names are transmitted to third-party language model endpoints.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between text-xs text-slate-500">
            <span>RAPHAEL Tactical Engine v2.5</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition-colors"
            >
              Dismiss Interface
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
