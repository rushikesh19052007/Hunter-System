import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Shield,
  Zap,
  Flame,
  Brain,
  Eye,
  ChevronRight,
  Sparkles,
  Award,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useHunter } from '@/lib/hunter-store';
import { HUNTER_STATS, type HunterStat, generateHunterId, type Profile } from '@/lib/game-engine';
import { playSystemChime } from '@/lib/notifications';
import { trackEvent, AnalyticsEvent } from '@/lib/analytics';

interface SystemAwakeningProps {
  onComplete?: () => void;
}

export const SystemAwakening: React.FC<SystemAwakeningProps> = ({ onComplete }) => {
  const { saveAwakenedProfile, profile } = useHunter();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [hunterName, setHunterName] = useState<string>('');
  const [selectedStat, setSelectedStat] = useState<HunterStat>('STR');
  const [nameError, setNameError] = useState<string>('');
  const [isAwakeningSubmitting, setIsAwakeningSubmitting] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(90);
  const [awakenedProfile, setAwakenedProfile] = useState<Profile | null>(null);

  // 90-Second Awakening countdown timer
  useEffect(() => {
    trackEvent(AnalyticsEvent.AWAKENING_STARTED);
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format seconds as mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Screen 1: Start
  const handleStartAwakening = () => {
    playSystemChime('alert');
    setStep(2);
  };

  // Screen 2: Name confirmation
  const handleNameSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!hunterName.trim()) {
      setNameError('The System cannot register a nameless Hunter. Enter your designation.');
      playSystemChime('alert');
      return;
    }
    setNameError('');
    trackEvent(AnalyticsEvent.AWAKENING_NAME_ENTERED, { name: hunterName });
    playSystemChime('quest');
    setStep(3);
  };

  // Screen 3: Choose Stat
  const handleSelectStat = (stat: HunterStat) => {
    setSelectedStat(stat);
    trackEvent(AnalyticsEvent.AWAKENING_STAT_CHOSEN, { stat });
    playSystemChime('quest');
  };

  const handleStatConfirm = () => {
    setStep(4);
  };

  // Screen 4: First Quest Acceptance -> Save Profile
  const handleAcceptFirstQuest = async () => {
    setIsAwakeningSubmitting(true);
    playSystemChime('level');

    try {
      const saved = await saveAwakenedProfile(hunterName, selectedStat);
      setAwakenedProfile(saved);
      trackEvent(AnalyticsEvent.AWAKENING_COMPLETED, {
        name: hunterName,
        stat: selectedStat,
        hunterId: saved.hunter_id,
      });

      // Trigger Confetti Celebration
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'],
      });

      setTimeout(() => {
        setIsAwakeningSubmitting(false);
        setStep(5);
      }, 700);
    } catch (err) {
      console.error('Failed to complete awakening:', err);
      setIsAwakeningSubmitting(false);
      setStep(5);
    }
  };

  // Screen 5: Enter Dashboard
  const handleFinish = () => {
    playSystemChime('quest');
    if (onComplete) {
      onComplete();
    }
  };

  const statIcons: Record<HunterStat, React.ReactNode> = {
    STR: <Flame className="w-8 h-8 text-red-500" />,
    AGI: <Zap className="w-8 h-8 text-cyan-400" />,
    VIT: <Shield className="w-8 h-8 text-emerald-400" />,
    INT: <Brain className="w-8 h-8 text-purple-400" />,
    PERC: <Eye className="w-8 h-8 text-amber-400" />,
  };

  return (
    <div className="system-awakening-container">
      {/* Background Holographic Grid & Scanlines */}
      <div className="awakening-bg-effects">
        <div className="grid-overlay" />
        <div className="scanline-overlay" />
        <div className="glow-sphere cyan" />
        <div className="glow-sphere purple" />
      </div>

      {/* Top System HUD Bar */}
      <header className="awakening-hud-header">
        <div className="hud-tag">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>ARCHITECT ARCHIVE PROTOCOL // V2.0</span>
        </div>

        <div className="hud-timer">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>AWAKENING WINDOW: {formatTime(secondsRemaining)}</span>
        </div>

        <div className="hud-steps">
          <span>SEQUENCE:</span>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`step-pip ${step === i ? 'active' : step > i ? 'completed' : ''}`}
            >
              {i}
            </div>
          ))}
        </div>
      </header>

      {/* Main Multi-Screen Content Container */}
      <main className="awakening-content-wrapper">
        <AnimatePresence mode="wait">
          {/* ================= SCREEN 1: THE SYSTEM AWAKENS ================= */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, scale: 0.92, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
              transition={{ duration: 0.6 }}
              className="awakening-card"
            >
              <div className="system-badge-alert">
                <AlertTriangle className="w-5 h-5 text-cyan-400 animate-bounce" />
                <span>[CRITICAL NOTICE: SOUL RESONANCE DETECTED]</span>
              </div>

              <div className="title-glitch-wrapper">
                <h1 className="awakening-title">THE SYSTEM AWAKENS</h1>
                <p className="awakening-subtitle">
                  A sovereign player has been chosen by the Architect to transcend ordinary human limitations.
                </p>
              </div>

              <div className="pulse-gate-visual">
                <div className="portal-ring ring-outer" />
                <div className="portal-ring ring-mid" />
                <div className="portal-core">
                  <Sparkles className="w-12 h-12 text-cyan-300 animate-pulse" />
                </div>
              </div>

              <div className="lore-box">
                <p className="lore-text">
                  &ldquo;Only those who awaken can perceive the Quests. You are no longer bound by ordinary fate.
                  Prepare to step forward into the ranks of the Awakened Hunters.&rdquo;
                </p>
              </div>

              <button
                type="button"
                id="btn-commence-awakening"
                onClick={handleStartAwakening}
                className="btn-system-primary"
              >
                <span>INITIATE AWAKENING PROTOCOL</span>
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            </motion.div>
          )}

          {/* ================= SCREEN 2: NAME INPUT ================= */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="awakening-card"
            >
              <div className="system-badge-alert">
                <span>[PROTOCOL 02: HUNTER REGISTRY]</span>
              </div>

              <h2 className="screen-heading">DESIGNATE YOUR IDENTITY</h2>
              <p className="screen-desc">
                The Hunter System requires a sovereign handle. All achievements, rank certificates, and
                dungeon clearance logs will be etched under this designation.
              </p>

              <form onSubmit={handleNameSubmit} className="name-form">
                <div className="input-group">
                  <label htmlFor="hunter-name-input" className="input-label">
                    HUNTER DESIGNATION
                  </label>
                  <div className="input-field-wrapper">
                    <input
                      id="hunter-name-input"
                      type="text"
                      autoFocus
                      placeholder="e.g. Sung Jin-Woo, Jin, Monarch..."
                      value={hunterName}
                      onChange={(e) => {
                        setHunterName(e.target.value);
                        if (nameError) setNameError('');
                      }}
                      className="system-text-input"
                      maxLength={30}
                    />
                  </div>
                  {nameError && <p className="error-message">{nameError}</p>}
                </div>

                <div className="hunter-license-preview">
                  <div className="preview-label">PRELIMINARY REGISTRATION TICKET</div>
                  <div className="preview-body">
                    <div>
                      <span className="text-muted">PLAYER: </span>
                      <strong className="text-cyan-300">
                        {hunterName.trim() || 'AWAITING INPUT...'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted">INITIAL CLASSIFICATION: </span>
                      <strong className="text-slate-300">RANK E (CANDIDATE)</strong>
                    </div>
                  </div>
                </div>

                <div className="btn-row">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-system-secondary"
                  >
                    BACK
                  </button>
                  <button
                    type="submit"
                    id="btn-confirm-name"
                    className="btn-system-primary"
                  >
                    <span>CONFIRM DESIGNATION</span>
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ================= SCREEN 3: CHOOSE STAT AFFINITY ================= */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="awakening-card wide-card"
            >
              <div className="system-badge-alert">
                <span>[PROTOCOL 03: MANA ATTUNEMENT]</span>
              </div>

              <h2 className="screen-heading">SELECT YOUR CORE AFFINITY</h2>
              <p className="screen-desc">
                Your awakening channel determines your primary growth path. The selected attribute will
                receive an immediate +5 bonus and specialized quest multipliers.
              </p>

              <div className="stats-grid">
                {(Object.keys(HUNTER_STATS) as HunterStat[]).map((statKey) => {
                  const stat = HUNTER_STATS[statKey];
                  const isSelected = selectedStat === statKey;

                  return (
                    <motion.div
                      key={statKey}
                      whileHover={{ scale: 1.03, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectStat(statKey)}
                      className={`stat-select-card ${isSelected ? 'selected' : ''}`}
                      style={{
                        borderColor: isSelected ? stat.color : 'rgba(255, 255, 255, 0.1)',
                        boxShadow: isSelected ? `0 0 25px ${stat.accentGlow}` : 'none',
                      }}
                    >
                      <div className="stat-card-header">
                        <div className="icon-badge" style={{ background: `${stat.color}15` }}>
                          {statIcons[statKey]}
                        </div>
                        <div className="stat-code-badge" style={{ color: stat.color }}>
                          {stat.code}
                        </div>
                      </div>

                      <h3 className="stat-name" style={{ color: isSelected ? stat.color : '#f8fafc' }}>
                        {stat.name}
                      </h3>
                      <p className="stat-title">{stat.title}</p>
                      <p className="stat-description">{stat.description}</p>

                      <div className="stat-bonus-tag">
                        {isSelected ? '✓ SELECTED AFFINITY (+5 BONUS)' : 'TAP TO SELECT'}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="btn-row">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-system-secondary"
                >
                  BACK
                </button>
                <button
                  type="button"
                  id="btn-confirm-stat"
                  onClick={handleStatConfirm}
                  className="btn-system-primary"
                >
                  <span>ACCEPT {selectedStat} AFFINITY</span>
                  <ChevronRight className="w-5 h-5 ml-1" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ================= SCREEN 4: FIRST QUEST PREVIEW ================= */}
          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
              className="awakening-card"
            >
              <div className="system-badge-alert warning">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>[QUEST NOTIFICATION: DAILY TRIAL ARRIVED]</span>
              </div>

              <h2 className="screen-heading">YOUR FIRST SYSTEM QUEST</h2>
              <p className="screen-desc">
                To complete your awakening contract, you must acknowledge your first daily trial.
              </p>

              <div className="quest-hologram-window">
                <div className="quest-hologram-header">
                  <div className="quest-diff-badge">DIFFICULTY: E-RANK [★☆☆☆☆]</div>
                  <div className="quest-xp-badge">+15 EXP REWARD</div>
                </div>

                <div className="quest-hologram-body">
                  <h3 className="quest-trial-title">
                    [DAILY QUEST: SURVIVAL OF THE AWAKENED]
                  </h3>
                  <p className="quest-trial-desc">
                    Solidify your neural awakening by completing 10 push-ups, a 5-minute brisk walk, or 10 deep
                    diaphragmatic breaths.
                  </p>

                  <div className="quest-objectives-box">
                    <div className="obj-item">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      <span>Physical or Mental Calibration (Target: 10 units)</span>
                    </div>
                    <div className="obj-item">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      <span>Attribute Bonus: +1 {selectedStat} upon completion</span>
                    </div>
                  </div>

                  <div className="quest-warning-strip">
                    <span>WARNING:</span> Failure to complete daily trials will eventually accumulate fatigue points.
                  </div>
                </div>
              </div>

              <div className="btn-row">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="btn-system-secondary"
                  disabled={isAwakeningSubmitting}
                >
                  BACK
                </button>
                <button
                  type="button"
                  id="btn-accept-first-quest"
                  onClick={handleAcceptFirstQuest}
                  disabled={isAwakeningSubmitting}
                  className="btn-system-primary"
                >
                  {isAwakeningSubmitting ? (
                    <span>ETCHING SOUL CONTRACT...</span>
                  ) : (
                    <>
                      <span>ACCEPT QUEST & FINALIZE AWAKENING</span>
                      <ChevronRight className="w-5 h-5 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ================= SCREEN 5: COMPLETION WITH REWARDS ANIMATION ================= */}
          {step === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, type: 'spring', damping: 15 }}
              className="awakening-card celebration-card"
            >
              <div className="trophy-glow-icon">
                <Award className="w-16 h-16 text-yellow-400 animate-bounce" />
              </div>

              <div className="system-badge-alert success">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>[AWAKENING SUCCESSFUL // STATUS: REGISTERED]</span>
              </div>

              <h2 className="celebration-title">WELCOME, HUNTER {hunterName.toUpperCase()}</h2>
              <p className="celebration-subtitle">
                Your awakening ceremony is complete. The System has recognized your rank and issued your Hunter Card.
              </p>

              {/* Holographic Hunter Card */}
              <div className="hunter-license-card">
                <div className="license-top">
                  <div className="license-brand">HUNTER ASSOCIATION CREDENTIAL</div>
                  <div className="license-rank-badge">RANK E</div>
                </div>

                <div className="license-center">
                  <div className="license-avatar">
                    <Sparkles className="w-8 h-8 text-cyan-300" />
                  </div>
                  <div className="license-info">
                    <div className="license-name">{hunterName}</div>
                    <div className="license-id">
                      ID: {awakenedProfile?.hunter_id || profile?.hunter_id || generateHunterId(hunterName, selectedStat)}
                    </div>
                    <div className="license-details">
                      <span>LEVEL: 1</span>
                      <span>AFFINITY: {selectedStat}</span>
                      <span>TOTAL EXP: 15 XP</span>
                    </div>
                  </div>
                </div>

                <div className="license-footer">
                  <span>AUTHORIZED BY SYSTEM ARCHITECT</span>
                  <span className="status-live">● SYSTEM ACTIVE</span>
                </div>
              </div>

              <div className="rewards-summary-box">
                <div className="reward-pill">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Awakening XP: +15 XP</span>
                </div>
                <div className="reward-pill">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>Initial Quests: 31 Unlocked</span>
                </div>
                <div className="reward-pill">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>{selectedStat} Stat: +5 Attunement Bonus</span>
                </div>
              </div>

              <button
                type="button"
                id="btn-enter-dashboard"
                onClick={handleFinish}
                className="btn-system-primary large"
              >
                <span>ENTER THE HUNTER SYSTEM DASHBOARD</span>
                <ChevronRight className="w-6 h-6 ml-2" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default SystemAwakening;
