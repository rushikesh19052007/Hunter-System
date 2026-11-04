import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, HelpCircle, Info, MessageSquare, History, ArrowLeft, Send, CheckCircle, Shield } from 'lucide-react';
import { audioService } from '@/lib/audio-service';

export type InfoPageType = 'about' | 'help' | 'faq' | 'feedback' | 'changelog';

interface InfoPagesProps {
  page: InfoPageType;
  onReturnToBase: () => void;
}

export const InfoPages: React.FC<InfoPagesProps> = ({ page, onReturnToBase }) => {
  const [feedbackCategory, setFeedbackCategory] = useState<'bug' | 'feature' | 'praise'>('feature');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    audioService.playSuccess();
    setFeedbackSubmitted(true);
    // Safe offline local save
    try {
      const existing = JSON.parse(localStorage.getItem('hunter_user_feedback') || '[]');
      existing.push({
        id: `fb-${Date.now()}`,
        category: feedbackCategory,
        text: feedbackText.trim(),
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('hunter_user_feedback', JSON.stringify(existing));
    } catch {}
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#040714',
        color: '#e2e8f0',
        padding: '32px 20px 80px',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        {/* Navigation Return */}
        <button
          type="button"
          onClick={onReturnToBase}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            color: '#00e5ff',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            marginBottom: '28px',
          }}
        >
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
          RETURN TO HUNTER BASE
        </button>

        {page === 'about' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Info style={{ width: '28px', height: '28px', color: '#00e5ff' }} />
              <h1 style={{ fontSize: '28px', fontWeight: 900, fontFamily: "'Orbitron', sans-serif", color: '#fff' }}>
                ABOUT HUNTR
              </h1>
            </div>
            <div style={{ fontSize: '13px', color: '#00e5ff', fontWeight: 800, letterSpacing: '2px', marginBottom: '24px' }}>
              [SYSTEM DIRECTIVE // AWAKEN YOUR POTENTIAL]
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', lineHeight: 1.7, fontSize: '14px', color: '#94a3b8' }}>
              <p>
                <strong style={{ color: '#fff' }}>HUNTR</strong> is a gamified RPG productivity operating system inspired by the aesthetic and progression feeling of modern power-fantasy lore. It transforms real-world habits, training, study, and algorithmic craft into character attributes, ranks, and dungeon encounters.
              </p>
              <div style={{ padding: '20px', backgroundColor: 'rgba(15, 23, 42, 0.75)', borderRadius: '14px', borderLeft: '4px solid #00e5ff' }}>
                <h4 style={{ color: '#fff', fontWeight: 900, marginBottom: '6px' }}>CORE ETHOS</h4>
                <p style={{ margin: 0 }}>
                  Progress is irrevocable. Missing a day resets active momentum, but XP and rank earned never decrease. The system encourages consistent, sovereign mastery without guilt-driven mechanics or overwork.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {page === 'help' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <HelpCircle style={{ width: '28px', height: '28px', color: '#10b981' }} />
              <h1 style={{ fontSize: '28px', fontWeight: 900, fontFamily: "'Orbitron', sans-serif", color: '#fff' }}>
                HUNTER MANUAL
              </h1>
            </div>
            <div style={{ fontSize: '13px', color: '#10b981', fontWeight: 800, letterSpacing: '2px', marginBottom: '24px' }}>
              [TACTICAL OPERATION PROCEDURES]
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { title: '1. QUEST DIFFICULTY & STAT REWARDS', desc: 'E-Rank: +1 Stat Point | D-Rank: +2 | C-Rank: +3 | B-Rank: +4 | A-Rank: +5 | S-Rank: +8 Stat Points.' },
                { title: '2. STAT ALLOCATION', desc: 'Allocate earned stat points to STR (Strength), AGI (Agility), VIT (Vitality), INT (Intelligence), or PERC (Perception) in the Stats tab.' },
                { title: '3. DUNGEON BREAKS & BOSS ENCOUNTERS', desc: 'Spontaneous high-difficulty events offering massive XP and permanent baseline attribute boosts.' },
                { title: '4. FOCUS CHAMBER', desc: 'Dedicated Pomodoro timer with synthesized offline brown noise to ensure deep work focus.' },
              ].map((item, idx) => (
                <div key={idx} style={{ padding: '16px', backgroundColor: 'rgba(15, 23, 42, 0.75)', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.15)' }}>
                  <h4 style={{ color: '#00e5ff', fontSize: '13px', fontWeight: 900, marginBottom: '4px' }}>{item.title}</h4>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {page === 'faq' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <HelpCircle style={{ width: '28px', height: '28px', color: '#a855f7' }} />
              <h1 style={{ fontSize: '28px', fontWeight: 900, fontFamily: "'Orbitron', sans-serif", color: '#fff' }}>
                FREQUENT TRANSMISSIONS (FAQ)
              </h1>
            </div>
            <div style={{ fontSize: '13px', color: '#a855f7', fontWeight: 800, letterSpacing: '2px', marginBottom: '24px' }}>
              [SYSTEM QUERIES RESOLVED]
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { q: 'Does HUNTR work offline?', a: 'Yes. The application caches your profile, quests, and records locally. Changes synchronize automatically to Firestore upon reconnection.' },
                { q: 'How does Hunter ID work?', a: 'Your Hunter ID (HUNTR-XXXXXXXX) is unique and permanent. Friends can search your Hunter ID to connect across devices.' },
                { q: 'Is there a penalty for missing a day?', a: 'No XP or level is ever subtracted. Only the consecutive streak counter resets. If you return after 3 days, a Comeback Challenge is offered.' },
                { q: 'What are Guilds?', a: 'Guilds allow hunters to form squads, collaborate on member benchmarks, and organize collective progress.' },
              ].map((item, idx) => (
                <div key={idx} style={{ padding: '18px', backgroundColor: 'rgba(15, 23, 42, 0.75)', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                  <h4 style={{ color: '#fff', fontSize: '14px', fontWeight: 900, marginBottom: '6px' }}>Q: {item.q}</h4>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>{item.a}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {page === 'feedback' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <MessageSquare style={{ width: '28px', height: '28px', color: '#f59e0b' }} />
              <h1 style={{ fontSize: '28px', fontWeight: 900, fontFamily: "'Orbitron', sans-serif", color: '#fff' }}>
                HUNTER FEEDBACK DISPATCH
              </h1>
            </div>
            <div style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 800, letterSpacing: '2px', marginBottom: '24px' }}>
              [TRANSMIT ANOMALIES & FEATURE PROPOSALS]
            </div>

            {!feedbackSubmitted ? (
              <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#94a3b8', marginBottom: '8px' }}>
                    CATEGORY
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['feature', 'bug', 'praise'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFeedbackCategory(cat)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '8px',
                          backgroundColor: feedbackCategory === cat ? 'rgba(245, 158, 11, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                          border: feedbackCategory === cat ? '1px solid #f59e0b' : '1px solid rgba(56, 189, 248, 0.15)',
                          color: feedbackCategory === cat ? '#f59e0b' : '#94a3b8',
                          fontWeight: 800,
                          fontSize: '12px',
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#94a3b8', marginBottom: '8px' }}>
                    YOUR TRANSMISSION
                  </label>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Describe your suggestion or report an issue with the System..."
                    rows={5}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: '#f59e0b',
                    color: '#060912',
                    fontWeight: 900,
                    fontSize: '13px',
                    letterSpacing: '1.5px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Send style={{ width: '16px', height: '16px' }} />
                  SUBMIT TRANSMISSION
                </button>
              </form>
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', backgroundColor: 'rgba(15, 23, 42, 0.8)', borderRadius: '16px', border: '1px solid #10b981' }}>
                <CheckCircle style={{ width: '48px', height: '48px', color: '#10b981', margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>
                  TRANSMISSION RECORDED
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                  Thank you, Hunter. Your directive has been cataloged for future System patches.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {page === 'changelog' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <History style={{ width: '28px', height: '28px', color: '#ec4899' }} />
              <h1 style={{ fontSize: '28px', fontWeight: 900, fontFamily: "'Orbitron', sans-serif", color: '#fff' }}>
                SYSTEM CHANGELOG
              </h1>
            </div>
            <div style={{ fontSize: '13px', color: '#ec4899', fontWeight: 800, letterSpacing: '2px', marginBottom: '24px' }}>
              [VERSION HISTORY & PATCH RELEASES]
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ padding: '20px', backgroundColor: 'rgba(15, 23, 42, 0.75)', borderRadius: '14px', borderLeft: '4px solid #00e5ff' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 900, color: '#00e5ff' }}>v2.0.0 — Unified Hunter Operating System</span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>November 2026</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', color: '#94a3b8', fontSize: '13px', lineHeight: 1.8 }}>
                  <li>Complete cross-platform synchronization with Firebase project `hunter-x-guild`.</li>
                  <li>Solo Leveling Cyber-Dungeon tactical UI overhaul with custom sound synthesis.</li>
                  <li>Command Palette (Ctrl+K) with instant navigation and quick actions.</li>
                  <li>Focus Chamber with integrated synthesized brown-noise audio ambience.</li>
                  <li>Goal-to-Mission Breakdown builder with 3 progressive phases.</li>
                  <li>Life Balance Hexagonal Radar chart for multi-dimensional progress tracking.</li>
                  <li>Weekly Hunter Debrief Report and Comeback Challenge system.</li>
                  <li>Expanded Living World Territory regions & Headquarters rooms.</li>
                  <li>Instant 5-second Undo on directive deletions.</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
