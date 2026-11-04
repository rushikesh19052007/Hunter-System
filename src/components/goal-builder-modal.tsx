import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Sparkles, Plus, CheckCircle, X, ChevronRight, Dumbbell, Brain, Shield, Code } from 'lucide-react';
import { useHunter } from '@/lib/hunter-store';
import { audioService } from '@/lib/audio-service';
import { type DifficultyGrade, type QuestCategory, type HunterStat, getStatXpType, DIFFICULTY_XP, DIFFICULTY_STAT_XP } from '@/lib/game-engine';

interface GoalBuilderModalProps {
  onClose: () => void;
}

interface GeneratedMission {
  name: string;
  description: string;
  category: QuestCategory;
  stat: HunterStat;
  difficulty: DifficultyGrade;
  target: number;
}

export const GoalBuilderModal: React.FC<GoalBuilderModalProps> = ({ onClose }) => {
  const { addCustomQuest, profile } = useHunter();
  const [goalText, setGoalText] = useState('');
  const [targetDays, setTargetDays] = useState(30);
  const [generatedPlan, setGeneratedPlan] = useState<{
    goal: string;
    phases: Array<{ title: string; desc: string }>;
    missions: GeneratedMission[];
  } | null>(null);

  const handleDeconstruct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalText.trim()) return;

    audioService.playClick();
    const text = goalText.toLowerCase();

    // Determine domain category based on keyword analysis
    let primaryCategory: QuestCategory = 'productivity';
    let primaryStat: HunterStat = 'PERC';

    if (text.includes('run') || text.includes('gym') || text.includes('workout') || text.includes('weight') || text.includes('muscle') || text.includes('fit') || text.includes('pushup')) {
      primaryCategory = 'physical';
      primaryStat = 'STR';
    } else if (text.includes('code') || text.includes('program') || text.includes('react') || text.includes('dev') || text.includes('app') || text.includes('python')) {
      primaryCategory = 'coding';
      primaryStat = 'INT';
    } else if (text.includes('read') || text.includes('study') || text.includes('exam') || text.includes('book') || text.includes('learn') || text.includes('math')) {
      primaryCategory = 'study';
      primaryStat = 'INT';
    } else if (text.includes('meditat') || text.includes('sleep') || text.includes('habit') || text.includes('focus') || text.includes('discipline') || text.includes('wake')) {
      primaryCategory = 'discipline';
      primaryStat = 'PERC';
    }

    // Build 3 progressive phases
    const phases = [
      { title: 'PHASE 1: FOUNDATION & INITIALIZATION', desc: `Establish the baseline mechanics for "${goalText}". Focus on zero-friction daily initiation.` },
      { title: 'PHASE 2: INTENSITY & MOMENTUM EXPANSION', desc: `Increase resistance thresholds and eliminate cognitive friction. Solidify consistency.` },
      { title: 'PHASE 3: ASCENSION & FINAL TRIAL', desc: `Peak execution phase. Realize objective mastery and solidify permanent habits.` },
    ];

    // Build 3 actionable daily missions
    const missions: GeneratedMission[] = [
      {
        name: `Foundation: ${goalText.slice(0, 32)} Practice`,
        description: `Daily initiation session towards "${goalText}". Dedicate 20 unbroken minutes of focused exertion.`,
        category: primaryCategory,
        stat: primaryStat,
        difficulty: 'E',
        target: 1,
      },
      {
        name: `Conditioning: Core Drill Session`,
        description: `Deliberate technical drill aligned with your primary directive. Review performance metrics.`,
        category: primaryCategory,
        stat: primaryStat === 'STR' ? 'VIT' : primaryStat === 'INT' ? 'AGI' : 'PERC',
        difficulty: 'D',
        target: 1,
      },
      {
        name: `Trial: Momentum Challenge`,
        description: `Overcome resistance and stretch capability limit to advance objective timeline.`,
        category: 'discipline',
        stat: 'PERC',
        difficulty: 'C',
        target: 1,
      },
    ];

    setGeneratedPlan({
      goal: goalText,
      phases,
      missions,
    });
  };

  const handleInjectMissions = () => {
    if (!generatedPlan) return;
    audioService.playLevelUp();

    generatedPlan.missions.forEach((m) => {
      addCustomQuest({
        name: m.name,
        description: m.description,
        category: m.category,
        difficulty: m.difficulty,
        stat: m.stat,
        target: m.target,
        xp_reward: DIFFICULTY_XP[m.difficulty] || 25,
        stat_xp_reward: DIFFICULTY_STAT_XP[m.difficulty] || 15,
        stat_xp_type: getStatXpType(m.category),
        quest_type: 'normal',
        repeatable: 'daily',
      });
    });

    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(4, 7, 20, 0.92)',
        backdropFilter: 'blur(12px)',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#090d1f',
          borderRadius: '20px',
          border: '1.5px solid rgba(0, 229, 255, 0.4)',
          padding: '28px',
          boxShadow: '0 0 40px rgba(0, 229, 255, 0.2)',
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target style={{ width: '22px', height: '22px', color: '#00e5ff' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 900, fontFamily: "'Orbitron', sans-serif", letterSpacing: '1px' }}>
              GOAL-TO-MISSION BUILDER
            </h3>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px', lineHeight: 1.5 }}>
          Input any personal aspiration. The System algorithms will deconstruct it into structured progressive milestones and daily directives.
        </p>

        {!generatedPlan ? (
          <form onSubmit={handleDeconstruct}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#00e5ff', letterSpacing: '1.5px', marginBottom: '6px' }}>
                PRIMARY ASPIRATION / OBJECTIVE
              </label>
              <input
                type="text"
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                placeholder="e.g. Run 10 kilometers without stopping / Master TypeScript in 30 days"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '1.5px', marginBottom: '6px' }}>
                TARGET TIMELINE
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[14, 30, 60, 90].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setTargetDays(days)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      backgroundColor: targetDays === days ? 'rgba(0, 229, 255, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                      border: targetDays === days ? '1px solid #00e5ff' : '1px solid rgba(56, 189, 248, 0.15)',
                      color: targetDays === days ? '#00e5ff' : '#94a3b8',
                      fontWeight: 800,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {days} DAYS
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: '#00e5ff',
                color: '#060912',
                fontWeight: 900,
                fontSize: '14px',
                letterSpacing: '1.5px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(0, 229, 255, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Sparkles style={{ width: '16px', height: '16px' }} />
              DECONSTRUCT INTO DIRECTIVES
            </button>
          </form>
        ) : (
          <div>
            <div style={{ padding: '12px 16px', backgroundColor: 'rgba(0, 229, 255, 0.08)', borderRadius: '10px', border: '1px solid rgba(0, 229, 255, 0.25)', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: '#00e5ff', fontWeight: 800 }}>OBJECTIVE INITIALIZED</div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#fff', marginTop: '2px' }}>{generatedPlan.goal}</div>
            </div>

            {/* Phases */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px', marginBottom: '8px' }}>
                PROGRESSION PHASES
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {generatedPlan.phases.map((p, idx) => (
                  <div key={idx} style={{ padding: '10px 12px', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', borderLeft: '3px solid #00e5ff' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#00e5ff' }}>{p.title}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{p.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Missions */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px', marginBottom: '8px' }}>
                GENERATED DAILY QUEST DIRECTIVES
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {generatedPlan.missions.map((m, idx) => (
                  <div key={idx} style={{ padding: '10px 14px', backgroundColor: 'rgba(15, 23, 42, 0.75)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>{m.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{m.description}</div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 900, padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(0, 229, 255, 0.15)', color: '#00e5ff' }}>
                      {m.difficulty}-RANK
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setGeneratedPlan(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  color: '#94a3b8',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                BACK
              </button>
              <button
                type="button"
                onClick={handleInjectMissions}
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: '#00e5ff',
                  color: '#060912',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '13px',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(0, 229, 255, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <CheckCircle style={{ width: '16px', height: '16px' }} />
                INJECT INTO QUEST BOARD
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

