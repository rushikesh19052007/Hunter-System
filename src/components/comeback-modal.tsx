import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Sparkles, Shield, ArrowRight, X, Heart } from 'lucide-react';
import { useHunter } from '@/lib/hunter-store';
import { audioService } from '@/lib/audio-service';

interface ComebackModalProps {
  onClose: () => void;
}

export const ComebackModal: React.FC<ComebackModalProps> = ({ onClose }) => {
  const { addCustomQuest, updateProfile, profile } = useHunter();

  const handleAcceptChallenge = () => {
    audioService.playSuccess();
    addCustomQuest({
      name: 'Comeback Directive: Re-Ignite Momentum',
      description: 'Complete 10 minutes of light movement or focused study to re-align your Hunter frequency.',
      category: 'discipline',
      difficulty: 'E',
      stat: 'PERC',
      target: 1,
      xp_reward: 50,
      stat_xp_reward: 20,
      stat_xp_type: 'both',
      quest_type: 'normal',
      repeatable: 'once',
    });
    onClose();
  };

  const handleRecoveryDay = () => {
    audioService.playClick();
    if (profile) {
      updateProfile({
        streak: 1,
      });
    }
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
          maxWidth: '480px',
          backgroundColor: '#090d1f',
          borderRadius: '20px',
          border: '1.5px solid rgba(0, 229, 255, 0.4)',
          padding: '28px',
          boxShadow: '0 0 40px rgba(0, 229, 255, 0.2)',
          color: '#fff',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(0, 229, 255, 0.15)', border: '1px solid #00e5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)' }}>
            <Flame style={{ width: '28px', height: '28px', color: '#00e5ff' }} />
          </div>
        </div>

        <div style={{ fontSize: '11px', color: '#00e5ff', fontWeight: 900, letterSpacing: '2.5px', marginBottom: '6px' }}>
          [SYSTEM SYNCHRONIZATION DETECTED]
        </div>

        <h3 style={{ fontSize: '22px', fontWeight: 900, fontFamily: "'Orbitron', sans-serif", color: '#fff', marginBottom: '12px' }}>
          WELCOME BACK, HUNTER
        </h3>

        <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '24px' }}>
          Your momentum has been preserved. The System does not punish absence; progress made is permanent. Choose your re-entry protocol:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            type="button"
            onClick={handleAcceptChallenge}
            style={{
              padding: '14px 20px',
              borderRadius: '12px',
              backgroundColor: '#00e5ff',
              color: '#060912',
              fontWeight: 900,
              fontSize: '13px',
              letterSpacing: '1px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(0, 229, 255, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles style={{ width: '18px', height: '18px' }} />
              <span>COMEBACK CHALLENGE (+50 XP)</span>
            </div>
            <ArrowRight style={{ width: '16px', height: '16px' }} />
          </button>

          <button
            type="button"
            onClick={handleRecoveryDay}
            style={{
              padding: '14px 20px',
              borderRadius: '12px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              color: '#94a3b8',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Heart style={{ width: '18px', height: '18px', color: '#10b981' }} />
              <span>RECOVERY DAY PROTOCOL</span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Clean Reset</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

