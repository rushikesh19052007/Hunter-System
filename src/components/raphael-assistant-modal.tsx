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
  X,
  Shield,
  Zap,
} from 'lucide-react';
import { useHunter } from '@/lib/hunter-store';
import {
  getXpProgress,
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
          description: '45 minutes uninterrupted development on core logic.',
          difficulty: 'C',
          category: 'coding',
          stat: 'int',
          target: 45,
        },
        {
          name: 'Test & Verification Phase',
          description: 'Write unit tests, verify edge cases, and run linting.',
          difficulty: 'D',
          category: 'coding',
          stat: 'per',
          target: 1,
        },
      ];
    } else if (term.includes('fitness') || term.includes('workout') || term.includes('run') || term.includes('gym') || term.includes('muscle')) {
      generated = [
        {
          name: `Phase 1: ${goalInput.slice(0, 30)}`,
          description: 'Primary compound or resistance conditioning session.',
          difficulty: 'D',
          category: 'fitness',
          stat: 'str',
          target: 30,
        },
        {
          name: 'Cardio & Aerobic Threshold',
          description: '20 minutes elevated heart-rate endurance protocol.',
          difficulty: 'E',
          category: 'physical',
          stat: 'agi',
          target: 20,
        },
        {
          name: 'Recovery & Mobility Stretch',
          description: 'Full-body fascial release and static stretching.',
          difficulty: 'E',
          category: 'health',
          stat: 'vit',
          target: 15,
        },
      ];
    } else if (term.includes('read') || term.includes('book') || term.includes('study') || term.includes('learn')) {
      generated = [
        {
          name: `Focused Study: ${goalInput.slice(0, 30)}`,
          description: 'Active reading with margin annotations and note synthesis.',
          difficulty: 'D',
          category: 'study',
          stat: 'int',
          target: 30,
        },
        {
          name: 'Core Synthesis & Summary',
          description: 'Summarize key mental models and write actionable takeaways.',
          difficulty: 'E',
          category: 'knowledge',
          stat: 'per',
          target: 1,
        },
        {
          name: 'Concept Recall Practice',
          description: 'Spaced repetition review of prior lesson material.',
          difficulty: 'E',
          category: 'study',
          stat: 'int',
          target: 15,
        },
      ];
    } else {
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
      <div className="raphael-backdrop" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="raphael-modal-card"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="raphael-header">
            <div className="raphael-brand">
              <div className="raphael-icon-box">
                <Brain className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="raphael-title-row">
                  <h2 className="raphael-title-text">RAPHAEL // SYSTEM ADVISOR</h2>
                  <span className="raphael-engine-badge">
                    Deterministic OS
                  </span>
                </div>
                <p className="raphael-subtitle">Tactical Productivity Intelligence // Zero Cloud APIs // Local Engine</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="modal-close-btn"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="raphael-tabs-bar">
            <button
              type="button"
              onClick={() => setActiveTab('briefing')}
              className={`raphael-tab-btn ${activeTab === 'briefing' ? 'active' : ''}`}
            >
              <Compass className="w-3.5 h-3.5" />
              TACTICAL BRIEFING
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('calculator')}
              className={`raphael-tab-btn ${activeTab === 'calculator' ? 'active' : ''}`}
            >
              <Calculator className="w-3.5 h-3.5" />
              PROGRESSION MATH
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('deconstruct')}
              className={`raphael-tab-btn ${activeTab === 'deconstruct' ? 'active' : ''}`}
            >
              <Target className="w-3.5 h-3.5" />
              GOAL DECONSTRUCTOR
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`raphael-tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
            >
              <Shield className="w-3.5 h-3.5" />
              SYSTEM CODEX
            </button>
          </div>

          {/* Modal Body */}
          <div className="raphael-body">
            {/* TACTICAL BRIEFING */}
            {activeTab === 'briefing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="raphael-info-card">
                  <Sparkles className="w-5 h-5 text-cyan-400" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '12px', lineHeight: 1.6, color: '#cbd5e1' }}>
                    <p style={{ fontWeight: 700, color: '#fff', fontSize: '13px' }}>
                      Hunter Status: {profile?.display_name || 'Hunter'} // {profile?.current_rank || 'E-Rank'} (Level {profile?.current_level || 1})
                    </p>
                    <p style={{ marginTop: '4px' }}>
                      Active trials on board: <strong style={{ color: '#00d9ff' }}>{activeQuests.length}</strong> &bull; Cleared today: <strong style={{ color: '#22d3a6' }}>{completedToday.length}</strong> &bull; Momentum streak: <strong style={{ color: '#f5b942' }}>{profile?.streak || 1} Days</strong>
                    </p>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#8899aa', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Recommended Priority Directives For Today
                  </h3>
                  {recommendedPriorities.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed rgba(255, 255, 255, 0.15)', borderRadius: '12px', color: '#64748b', fontSize: '12px' }}>
                      All directives cleared or no trials active. Create a new quest or inspect the Training Library.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {recommendedPriorities.map((q, idx) => (
                        <div
                          key={q.id}
                          className="raphael-priority-card"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0, 217, 255, 0.15)', border: '1px solid rgba(0, 217, 255, 0.4)', color: '#00d9ff', fontSize: '11px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {idx + 1}
                            </span>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>{q.name}</div>
                              <div style={{ fontSize: '11px', color: '#8899aa', maxWidth: '380px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.description}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: 'rgba(245, 185, 66, 0.12)', border: '1px solid rgba(245, 185, 66, 0.4)', color: '#f5b942' }}>
                              {q.difficulty}-Rank
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#00d9ff', fontFamily: 'monospace' }}>
                              +{q.xp_reward} XP
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(245, 185, 66, 0.08)', border: '1px solid rgba(245, 185, 66, 0.25)', fontSize: '11px', color: '#fde68a', lineHeight: 1.5 }}>
                  <strong style={{ color: '#f5b942' }}>RAPHAEL ADVISORY: </strong>
                  Maintain your daily streak to trigger momentum XP multipliers (+20% at 7d, +50% at 14d, +100% at 30d). Avoid letting your board exceed 8 active trials to mitigate focus fragmentation.
                </div>
              </div>
            )}

            {/* PROGRESSION MATH */}
            {activeTab === 'calculator' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(11, 19, 40, 0.85)', border: '1px solid rgba(0, 217, 255, 0.2)' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#8899aa', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Next Level Gate</span>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#00d9ff', marginTop: '4px', fontFamily: "'Orbitron', sans-serif" }}>Level {(profile?.current_level || 1) + 1}</div>
                    <div style={{ fontSize: '11px', color: '#8899aa', marginTop: '4px', fontFamily: 'monospace' }}>Need {remainingXpForLevel} XP more</div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(11, 19, 40, 0.85)', border: '1px solid rgba(245, 185, 66, 0.2)' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#8899aa', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Next Rank Gate</span>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#f5b942', marginTop: '4px', fontFamily: "'Orbitron', sans-serif" }}>{nextRankInfo?.nextRank || 'Supreme Hunter'}</div>
                    <div style={{ fontSize: '11px', color: '#8899aa', marginTop: '4px', fontFamily: 'monospace' }}>{levelsUntilNextRank} levels / {xpUntilNextRank} XP</div>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#8899aa', marginBottom: '8px' }}>
                    Trials Required to Level Up ({remainingXpForLevel} XP needed)
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', textAlign: 'center' }}>
                    {(['E', 'D', 'C', 'B', 'A', 'S'] as DifficultyGrade[]).map((grade) => {
                      const xp = DIFFICULTY_XP[grade] || 25;
                      const needed = Math.ceil(remainingXpForLevel / xp);
                      return (
                        <div key={grade} style={{ padding: '10px 4px', borderRadius: '8px', background: 'rgba(11, 19, 40, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          <span style={{ fontWeight: 800, fontSize: '11px', color: '#fff' }}>{grade}</span>
                          <div style={{ color: '#00d9ff', fontFamily: 'monospace', fontWeight: 900, fontSize: '16px', margin: '2px 0' }}>{needed}</div>
                          <span style={{ fontSize: '9px', color: '#64748b' }}>{xp} XP</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(11, 19, 40, 0.85)', border: '1px solid rgba(0, 217, 255, 0.2)', fontSize: '12px', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                    Stat Points Rewards Matrix
                  </div>
                  <p style={{ color: '#8899aa', margin: 0 }}>
                    E: +1 pt &bull; D: +2 pts &bull; C: +3 pts &bull; B: +4 pts &bull; A: +5 pts &bull; S: +8 pts.
                    Use points to elevate Strength (STR), Agility (AGI), Intelligence (INT), Vitality (VIT), and Perception (PERC).
                  </p>
                </div>
              </div>
            )}

            {/* GOAL DECONSTRUCTOR */}
            {activeTab === 'deconstruct' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <form onSubmit={handleDeconstruct} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="goal-input-field" style={{ fontSize: '11px', fontWeight: 800, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Enter Real-World Goal / Skill / Project
                  </label>
                  <div className="raphael-input-row">
                    <input
                      id="goal-input-field"
                      type="text"
                      placeholder="e.g. Master TypeScript, Run 10k, Read Clean Code..."
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      className="raphael-text-input"
                    />
                    <button
                      type="submit"
                      className="btn-system-primary"
                      style={{ padding: '10px 18px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.9px' }}
                    >
                      <Brain className="w-4 h-4 mr-1.5" />
                      DECONSTRUCT
                    </button>
                  </div>
                </form>

                {committedNotice && (
                  <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(34, 211, 166, 0.15)', border: '1px solid rgba(34, 211, 166, 0.5)', color: '#22d3a6', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{committedNotice}</span>
                  </div>
                )}

                {deconstructedQuests.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h3 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.9px', color: '#8899aa' }}>
                      Generated Trial Directives (Review Before Adding)
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {deconstructedQuests.map((q, idx) => (
                        <div
                          key={idx}
                          className="raphael-priority-card"
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>{q.name}</span>
                              <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'rgba(245, 185, 66, 0.12)', border: '1px solid rgba(245, 185, 66, 0.4)', color: '#f5b942' }}>
                                {q.difficulty}-Rank
                              </span>
                            </div>
                            <p style={{ fontSize: '11px', color: '#8899aa', margin: '4px 0 0' }}>{q.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCommitQuest(q)}
                            className="btn-hologram-cyan"
                            style={{ padding: '6px 14px', fontSize: '11px', fontWeight: 800, whiteSpace: 'nowrap' }}
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            COMMIT
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px', color: '#cbd5e1', lineHeight: 1.6 }}>
                <div style={{ padding: '14px 16px', borderRadius: '10px', background: 'rgba(11, 19, 40, 0.85)', border: '1px solid rgba(0, 217, 255, 0.2)' }}>
                  <h4 style={{ fontWeight: 800, color: '#fff', fontSize: '13px', margin: '0 0 6px' }}>Autonomous Productivity Architecture</h4>
                  <p style={{ margin: 0 }}>
                    HUNTR converts genuine daily discipline into quantifiable RPG progression. Every directive completed advances your level, awards stat points, and increases momentum.
                  </p>
                </div>
                <div style={{ padding: '14px 16px', borderRadius: '10px', background: 'rgba(11, 19, 40, 0.85)', border: '1px solid rgba(0, 217, 255, 0.2)' }}>
                  <h4 style={{ fontWeight: 800, color: '#fff', fontSize: '13px', margin: '0 0 6px' }}>Transparency & Security Policy</h4>
                  <p style={{ margin: 0 }}>
                    RAPHAEL operates strictly in-browser via deterministic rule engines. No user prompts, personal habits, or private quest names are transmitted to third-party language model endpoints.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="raphael-footer">
            <span>RAPHAEL Tactical Engine v2.5</span>
            <button
              type="button"
              onClick={onClose}
              className="btn-system-secondary"
              style={{ padding: '6px 16px', fontSize: '11px', fontWeight: 800 }}
            >
              DISMISS INTERFACE
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
