import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, Award, ArrowUpRight } from 'lucide-react';
import { audioService } from '@/lib/audio-service';

interface LevelUpDialogProps {
  newLevel: number;
  newRank?: string;
  onDismiss: () => void;
}

export const LevelUpDialog: React.FC<LevelUpDialogProps> = ({
  newLevel,
  newRank,
  onDismiss,
}) => {
  useEffect(() => {
    // Play sound and trigger confetti explosion
    audioService.playLevelUp();

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff1a40', '#a855f7', '#ffb300', '#ec4899', '#10b981'],
    });

    const timer = setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ff1a40', '#ffb300'],
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#a855f7', '#ec4899'],
      });
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const hasNewRank = !!newRank && newRank.trim().length > 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(6, 8, 18, 0.85)',
        backdropFilter: 'blur(8px)',
        padding: '20px',
      }}
      onClick={onDismiss}
    >
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 250 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#0c101d',
          borderRadius: '20px',
          border: '2px solid #ff1a40',
          padding: '28px',
          textAlign: 'center',
          boxShadow: '0 0 40px rgba(255, 26, 64, 0.4)',
          position: 'relative',
        }}
      >
        {/* System Header Tag */}
        <div
          style={{
            display: 'inline-block',
            padding: '6px 14px',
            backgroundColor: 'rgba(255, 26, 64, 0.15)',
            border: '1px solid rgba(255, 26, 64, 0.5)',
            borderRadius: '8px',
            color: '#ff1a40',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '2px',
            marginBottom: '16px',
          }}
        >
          [ SYSTEM NOTIFICATION ]
        </div>

        {/* Level Up Title */}
        <h2
          style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '3px',
            margin: '0 0 8px 0',
            textShadow: '0 0 25px rgba(255, 26, 64, 0.7)',
          }}
        >
          LEVEL UP!
        </h2>

        {/* New Level Badge */}
        <div
          style={{
            color: '#67e8f9',
            fontSize: '1.4rem',
            fontWeight: 800,
            letterSpacing: '2px',
            marginBottom: hasNewRank ? '16px' : '20px',
          }}
        >
          LEVEL {newLevel}
        </div>

        {/* Rank Promotion Banner */}
        {hasNewRank && (
          <div
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              borderRadius: '10px',
              padding: '10px 16px',
              color: '#fff',
              fontWeight: 900,
              fontSize: '13px',
              letterSpacing: '1.5px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>RANK PROMOTION: {newRank}</span>
          </div>
        )}

        {/* Rewards Breakdown */}
        <div
          style={{
            backgroundColor: '#141928',
            borderRadius: '12px',
            border: '1px solid #26304a',
            padding: '16px',
            marginBottom: '24px',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Skill Points Granted</span>
            <span style={{ color: '#ffb300', fontWeight: 'bold', fontSize: '14px' }}>+3 SP</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Maximum Capacity</span>
            <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '13px' }}>
              +HP / +MP Extended
            </span>
          </div>
        </div>

        {/* Claim Rewards Button */}
        <button
          type="button"
          onClick={() => {
            audioService.playClick();
            onDismiss();
          }}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: '#ff1a40',
            color: '#000',
            fontWeight: 900,
            fontSize: '14px',
            letterSpacing: '1.5px',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(255, 26, 64, 0.4)',
            transition: 'all 0.15s ease',
          }}
        >
          CLAIM REWARDS
        </button>
      </motion.div>
    </div>
  );
};

export default LevelUpDialog;
