import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, Award, Shield, ArrowRight, Heart, Droplets, CheckCircle } from 'lucide-react';
import { type PromotionCelebration } from '@/lib/hunter-store';
import { audioService } from '@/lib/audio-service';
import { getRankBadgeInfo } from '@/lib/game-engine';

interface PromotionCelebrationModalProps {
  celebration: PromotionCelebration;
  onDismiss: () => void;
}

export const PromotionCelebrationModal: React.FC<PromotionCelebrationModalProps> = ({
  celebration,
  onDismiss,
}) => {
  useEffect(() => {
    audioService.playLevelUp();

    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#00e5ff', '#a855f7', '#ffb300', '#ec4899', '#10b981'],
    });

    const timer = setTimeout(() => {
      confetti({
        particleCount: 70,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        colors: ['#00e5ff', '#ffb300'],
      });
      confetti({
        particleCount: 70,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
        colors: ['#a855f7', '#ec4899'],
      });
    }, 350);

    return () => clearTimeout(timer);
  }, []);

  const prevBadge = getRankBadgeInfo(celebration.prevRank);
  const newBadge = getRankBadgeInfo(celebration.newRank);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(4, 7, 20, 0.92)',
        backdropFilter: 'blur(12px)',
        padding: '20px',
      }}
      onClick={onDismiss}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 18, stiffness: 220 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '500px',
          backgroundColor: '#090d1f',
          borderRadius: '24px',
          border: `2px solid ${newBadge.color}`,
          padding: '32px 28px',
          textAlign: 'center',
          boxShadow: `0 0 50px ${newBadge.color}40`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow ambient header */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '260px',
            height: '140px',
            borderRadius: '50%',
            background: newBadge.color,
            filter: 'blur(80px)',
            opacity: 0.35,
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <Sparkles style={{ width: '18px', height: '18px', color: newBadge.color }} />
          <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '3px', color: newBadge.color }}>
            [RANK ADVANCEMENT DIRECTIVE]
          </span>
          <Sparkles style={{ width: '18px', height: '18px', color: newBadge.color }} />
        </div>

        <h2 style={{ fontSize: '26px', fontWeight: 900, fontFamily: "'Orbitron', sans-serif", color: '#fff', marginBottom: '16px', letterSpacing: '1px' }}>
          RANK PROMOTION
        </h2>

        {/* Transition Crest */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', margin: '20px 0' }}>
          <div style={{ padding: '10px 16px', borderRadius: '12px', border: `1px solid ${prevBadge.color}`, color: prevBadge.color, fontWeight: 900, fontSize: '15px' }}>
            {celebration.prevRank}
          </div>
          <ArrowRight style={{ width: '22px', height: '22px', color: '#94a3b8' }} />
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{ padding: '12px 22px', borderRadius: '14px', background: `${newBadge.color}20`, border: `2px solid ${newBadge.color}`, color: newBadge.color, fontWeight: 900, fontSize: '18px', boxShadow: `0 0 20px ${newBadge.color}60` }}
          >
            {celebration.newRank}
          </motion.div>
        </div>

        {/* Rewards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '24px 0', textAlign: 'left' }}>
          {celebration.statPointsGranted > 0 && (
            <div style={{ padding: '12px', backgroundColor: 'rgba(15, 23, 42, 0.75)', borderRadius: '12px', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>BONUS STAT POINTS</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#00e5ff' }}>+{celebration.statPointsGranted} PTS</div>
            </div>
          )}

          {celebration.skillPointsGranted > 0 && (
            <div style={{ padding: '12px', backgroundColor: 'rgba(15, 23, 42, 0.75)', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>SKILL POINTS</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#a855f7' }}>+{celebration.skillPointsGranted} PTS</div>
            </div>
          )}

          {celebration.hpBonus > 0 && (
            <div style={{ padding: '12px', backgroundColor: 'rgba(15, 23, 42, 0.75)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Heart style={{ width: '12px', height: '12px', color: '#ef4444' }} /> MAX HP BASE
              </div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#ef4444' }}>+{celebration.hpBonus} HP</div>
            </div>
          )}

          {celebration.mpBonus > 0 && (
            <div style={{ padding: '12px', backgroundColor: 'rgba(15, 23, 42, 0.75)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Droplets style={{ width: '12px', height: '12px', color: '#3b82f6' }} /> MAX MP BASE
              </div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#3b82f6' }}>+{celebration.mpBonus} MP</div>
            </div>
          )}
        </div>

        {/* Unlocked Titles */}
        {celebration.unlockedTitles && celebration.unlockedTitles.length > 0 && (
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1.5px', marginBottom: '8px', fontWeight: 700 }}>
              NEW TITLES UNLOCKED
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
              {celebration.unlockedTitles.map((title) => (
                <span
                  key={title}
                  style={{
                    padding: '4px 10px',
                    backgroundColor: 'rgba(255, 179, 0, 0.12)',
                    border: '1px solid rgba(255, 179, 0, 0.4)',
                    color: '#ffb300',
                    fontSize: '12px',
                    borderRadius: '6px',
                    fontWeight: 700,
                  }}
                >
                  ⚜ {title}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onDismiss}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            backgroundColor: newBadge.color,
            color: '#060912',
            fontWeight: 900,
            fontSize: '14px',
            letterSpacing: '2px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: `0 0 25px ${newBadge.color}60`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle style={{ width: '18px', height: '18px' }} />
          CLAIM RANK POWERS
        </button>
      </motion.div>
    </div>
  );
};

