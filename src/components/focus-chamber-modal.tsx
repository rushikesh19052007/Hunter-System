import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, CheckCircle, X, Shield,
} from 'lucide-react';
import { useHunter } from '@/lib/hunter-store';
import { audioService } from '@/lib/audio-service';

interface FocusChamberModalProps {
  onClose: () => void;
}

export const FocusChamberModal: React.FC<FocusChamberModalProps> = ({ onClose }) => {
  const { addXp, profile, updateProfile } = useHunter();

  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [sessionGoal, setSessionGoal] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [ambiencePlaying, setAmbiencePlaying] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  // Timer interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            setIsCompleted(true);
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsRemaining]);

  // Handle session completion reward
  const handleSessionComplete = () => {
    stopAmbience();
    audioService.playLevelUp();
    const xpReward = Math.min(100, Math.round(durationMinutes * 1.5));
    addXp(xpReward, `Focus Chamber: ${sessionGoal || 'Deep Work'}`);

    if (profile) {
      const logEntry = {
        id: `focus-${Date.now()}`,
        timestamp: Date.now(),
        event_type: 'quest_complete' as const,
        message: `🧘 FOCUS CHAMBER CLEARED: ${durationMinutes}m of deep work (+${xpReward} XP)`,
        xp: xpReward,
      };
      updateProfile({
        system_log: [logEntry, ...(profile.system_log || [])].slice(0, 25),
      });
    }
  };

  const handleStart = () => {
    audioService.playClick();
    setIsActive(true);
  };

  const handlePause = () => {
    audioService.playClick();
    setIsActive(false);
  };

  const handleReset = (mins = durationMinutes) => {
    audioService.playClick();
    setIsActive(false);
    setDurationMinutes(mins);
    setSecondsRemaining(mins * 60);
    setIsCompleted(false);
  };

  // Web Audio Synth for offline ambient white/brown noise
  const toggleAmbience = () => {
    if (ambiencePlaying) {
      stopAmbience();
    } else {
      startAmbience();
    }
  };

  const startAmbience = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate brown noise
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Lowpass filter for deep drone
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;

      const gain = ctx.createGain();
      gain.gain.value = 0.08;

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noiseNodeRef.current = noise;
      setAmbiencePlaying(true);
    } catch {
      setAmbiencePlaying(false);
    }
  };

  const stopAmbience = () => {
    try {
      if (noiseNodeRef.current) {
        (noiseNodeRef.current as AudioBufferSourceNode).stop();
        noiseNodeRef.current.disconnect();
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    } catch {}
    audioCtxRef.current = null;
    noiseNodeRef.current = null;
    setAmbiencePlaying(false);
  };

  useEffect(() => {
    return () => {
      stopAmbience();
    };
  }, []);

  const totalSeconds = durationMinutes * 60;
  const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsRemaining) / totalSeconds) * 100 : 0;
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

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
          maxWidth: '480px',
          backgroundColor: '#090d1f',
          borderRadius: '20px',
          border: '1.5px solid rgba(0, 229, 255, 0.4)',
          padding: '28px',
          boxShadow: '0 0 40px rgba(0, 229, 255, 0.2)',
          color: '#fff',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock style={{ width: '20px', height: '20px', color: '#00e5ff' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 900, fontFamily: "'Orbitron', sans-serif", letterSpacing: '1px' }}>
              FOCUS CHAMBER
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Goal input */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            value={sessionGoal}
            onChange={(e) => setSessionGoal(e.target.value)}
            disabled={isActive}
            placeholder="Current Deep Work Directive (e.g. Finish Algorithm Module)"
            style={{
              width: '100%',
              padding: '10px 14px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '8px',
              color: '#e2e8f0',
              fontSize: '13px',
              outline: 'none',
              fontFamily: "'Inter', sans-serif",
            }}
          />
        </div>

        {/* Countdown display */}
        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <div
            style={{
              fontSize: '64px',
              fontWeight: 900,
              fontFamily: "'Orbitron', monospace",
              color: isCompleted ? '#10b981' : '#00e5ff',
              textShadow: isCompleted ? '0 0 20px rgba(16, 185, 129, 0.6)' : '0 0 20px rgba(0, 229, 255, 0.5)',
              letterSpacing: '2px',
            }}
          >
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>

          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, letterSpacing: '2px', marginTop: '4px' }}>
            {isActive ? '[CHAMBER SEALED — CONCENTRATION ACTIVE]' : isCompleted ? '[SESSION COMPLETED]' : '[STANDBY]'}
          </div>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            height: '6px',
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: '24px',
          }}
        >
          <motion.div
            style={{
              height: '100%',
              backgroundColor: isCompleted ? '#10b981' : '#00e5ff',
              boxShadow: '0 0 8px #00e5ff',
            }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Preset durations */}
        {!isActive && (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
            {[15, 25, 45, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => handleReset(mins)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  backgroundColor: durationMinutes === mins ? 'rgba(0, 229, 255, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                  border: durationMinutes === mins ? '1px solid #00e5ff' : '1px solid rgba(56, 189, 248, 0.15)',
                  color: durationMinutes === mins ? '#00e5ff' : '#94a3b8',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {mins}M
              </button>
            ))}
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          {!isActive ? (
            <button
              type="button"
              onClick={handleStart}
              style={{
                padding: '12px 28px',
                borderRadius: '12px',
                backgroundColor: '#00e5ff',
                color: '#060912',
                fontWeight: 900,
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(0, 229, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Play style={{ width: '16px', height: '16px' }} />
              START FOCUS
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePause}
              style={{
                padding: '12px 28px',
                borderRadius: '12px',
                backgroundColor: '#f59e0b',
                color: '#060912',
                fontWeight: 900,
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Pause style={{ width: '16px', height: '16px' }} />
              PAUSE
            </button>
          )}

          <button
            type="button"
            onClick={() => handleReset(durationMinutes)}
            style={{
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
            title="Reset Timer"
          >
            <RotateCcw style={{ width: '16px', height: '16px' }} />
          </button>

          <button
            type="button"
            onClick={toggleAmbience}
            style={{
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: ambiencePlaying ? 'rgba(168, 85, 247, 0.25)' : 'rgba(15, 23, 42, 0.8)',
              border: ambiencePlaying ? '1px solid #a855f7' : '1px solid rgba(56, 189, 248, 0.2)',
              color: ambiencePlaying ? '#a855f7' : '#94a3b8',
              cursor: 'pointer',
            }}
            title={ambiencePlaying ? 'Disable Cyber Drone Ambience' : 'Enable Cyber Drone Ambience'}
          >
            {ambiencePlaying ? <Volume2 style={{ width: '16px', height: '16px' }} /> : <VolumeX style={{ width: '16px', height: '16px' }} />}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

