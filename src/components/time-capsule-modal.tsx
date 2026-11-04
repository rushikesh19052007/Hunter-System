import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Compass, Lock, Unlock, X, Sparkles, CheckCircle, Shield } from 'lucide-react';
import { useHunter } from '@/lib/hunter-store';
import { audioService } from '@/lib/audio-service';

interface TimeCapsuleModalProps {
  onClose: () => void;
}

interface SavedCapsule {
  id: string;
  message: string;
  sealedAt: string;
  unlockTarget: string; // e.g. "D-Rank" or date
  isSealed: boolean;
}

const STORAGE_CAPSULE_KEY = 'hunter_time_capsule';

export const TimeCapsuleModal: React.FC<TimeCapsuleModalProps> = ({ onClose }) => {
  const { profile } = useHunter();
  const [capsule, setCapsule] = useState<SavedCapsule | null>(null);
  const [message, setMessage] = useState('');
  const [targetRank, setTargetRank] = useState('B-Rank');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CAPSULE_KEY);
      if (saved) {
        setCapsule(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const handleSealCapsule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    audioService.playLevelUp();
    const newCapsule: SavedCapsule = {
      id: `capsule-${Date.now()}`,
      message: message.trim(),
      sealedAt: new Date().toLocaleDateString(),
      unlockTarget: targetRank,
      isSealed: true,
    };

    setCapsule(newCapsule);
    localStorage.setItem(STORAGE_CAPSULE_KEY, JSON.stringify(newCapsule));
  };

  const handleClearCapsule = () => {
    audioService.playClick();
    localStorage.removeItem(STORAGE_CAPSULE_KEY);
    setCapsule(null);
    setMessage('');
  };

  const currentRank = profile?.current_rank || 'E-Rank';
  const rankOrder = ['E-Rank', 'D-Rank', 'C-Rank', 'B-Rank', 'A-Rank', 'S-Rank'];
  const canUnlock = capsule && rankOrder.indexOf(currentRank) >= rankOrder.indexOf(capsule.unlockTarget);

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
          maxWidth: '520px',
          backgroundColor: '#090d1f',
          borderRadius: '20px',
          border: '1.5px solid rgba(129, 140, 248, 0.4)',
          padding: '28px',
          boxShadow: '0 0 40px rgba(129, 140, 248, 0.2)',
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass style={{ width: '22px', height: '22px', color: '#818cf8' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 900, fontFamily: "'Orbitron', sans-serif", letterSpacing: '1px' }}>
              TIME CAPSULE
            </h3>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '20px' }}>
          Seal a transmission for your future awakened self. The capsule stays locked until you attain the designated Hunter Rank.
        </p>

        {!capsule ? (
          <form onSubmit={handleSealCapsule}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#818cf8', letterSpacing: '1.5px', marginBottom: '6px' }}>
                TRANSMISSION TO FUTURE SELF
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Where do you stand today? What vows do you make to your future self?"
                rows={4}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(129, 140, 248, 0.25)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                  fontFamily: "'Inter', sans-serif",
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '1.5px', marginBottom: '6px' }}>
                SEAL CONDITION (TARGET RANK)
              </label>
              <select
                value={targetRank}
                onChange={(e) => setTargetRank(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(129, 140, 248, 0.25)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                <option value="D-Rank">D-Rank (Novice Hunter)</option>
                <option value="C-Rank">C-Rank (Elite Hunter)</option>
                <option value="B-Rank">B-Rank (Veteran Hunter)</option>
                <option value="A-Rank">A-Rank (Master Hunter)</option>
                <option value="S-Rank">S-Rank (Monarch)</option>
              </select>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: '#818cf8',
                color: '#060912',
                fontWeight: 900,
                fontSize: '14px',
                letterSpacing: '1.5px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(129, 140, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Lock style={{ width: '16px', height: '16px' }} />
              SEAL TIME CAPSULE
            </button>
          </form>
        ) : (
          <div>
            <div
              style={{
                padding: '20px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                borderRadius: '14px',
                border: canUnlock ? '1.5px solid #10b981' : '1.5px solid rgba(129, 140, 248, 0.3)',
                boxShadow: canUnlock ? '0 0 20px rgba(16, 185, 129, 0.3)' : '0 0 20px rgba(129, 140, 248, 0.15)',
                marginBottom: '20px',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {canUnlock ? (
                    <Unlock style={{ width: '18px', height: '18px', color: '#10b981' }} />
                  ) : (
                    <Lock style={{ width: '18px', height: '18px', color: '#818cf8' }} />
                  )}
                  <span style={{ fontSize: '13px', fontWeight: 900, color: canUnlock ? '#10b981' : '#818cf8' }}>
                    {canUnlock ? '[CAPSULE UNLOCKED]' : `[SEALED UNTIL ${capsule.unlockTarget.toUpperCase()}]`}
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Sealed: {capsule.sealedAt}</span>
              </div>

              {canUnlock ? (
                <div style={{ fontSize: '14px', color: '#e2e8f0', lineHeight: 1.6, padding: '12px', backgroundColor: 'rgba(6, 9, 18, 0.6)', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                  &ldquo;{capsule.message}&rdquo;
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic', padding: '12px', backgroundColor: 'rgba(6, 9, 18, 0.6)', borderRadius: '8px' }}>
                  The message is encrypted and shielded by System protocol. You are currently {currentRank}. Reach {capsule.unlockTarget} to decrypt.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleClearCapsule}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                color: '#94a3b8',
                border: 'none',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              EXPUNGE & CREATE NEW CAPSULE
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

