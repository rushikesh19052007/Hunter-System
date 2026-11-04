import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Sparkles, Trophy, Target, TrendingUp, CheckCircle, X, Shield, Calendar } from 'lucide-react';
import { useHunter } from '@/lib/hunter-store';

interface WeeklyReportModalProps {
  onClose: () => void;
}

export const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({ onClose }) => {
  const { profile, quests } = useHunter();

  if (!profile) return null;

  // Calculate 7-day stats from system log
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentLogs = (profile.system_log || []).filter((l) => l.timestamp >= oneWeekAgo);

  const weeklyXp = recentLogs.reduce((acc, curr) => acc + (curr.xp || 0), 0);
  const weeklyQuestsCount = recentLogs.filter((l) => l.event_type === 'quest_complete').length;

  const phyCount = profile.physical_quests_completed || 0;
  const menCount = profile.mental_quests_completed || 0;
  const codeCount = profile.coding_quests_completed || 0;

  let leadingDomain = 'Balanced Discipline';
  if (phyCount > menCount && phyCount > codeCount) leadingDomain = 'Physical Strength & Conditioning';
  else if (menCount > phyCount && menCount > codeCount) leadingDomain = 'Intellectual & Knowledge Acquisition';
  else if (codeCount > phyCount && codeCount > menCount) leadingDomain = 'Algorithmic Engineering & Codecraft';

  const momentumScore = Math.min(100, Math.round(50 + (profile.streak || 0) * 5 + weeklyQuestsCount * 4));

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
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#090d1f',
          borderRadius: '20px',
          border: '1.5px solid rgba(245, 158, 11, 0.4)',
          padding: '28px',
          boxShadow: '0 0 40px rgba(245, 158, 11, 0.2)',
          color: '#fff',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar style={{ width: '22px', height: '22px', color: '#f59e0b' }} />
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, fontFamily: "'Orbitron', sans-serif", letterSpacing: '1px' }}>
                WEEKLY HUNTER REPORT
              </h3>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>
                SEVEN-DAY TACTICAL DEBRIEF
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Hunter identity bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: 'rgba(15, 23, 42, 0.8)', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.15)', marginBottom: '18px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 900, color: '#fff' }}>{profile.display_name}</div>
            <div style={{ fontSize: '11px', color: '#00e5ff', fontFamily: 'monospace' }}>{profile.hunter_id}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#ffb300' }}>{profile.current_rank}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>LVL {profile.current_level}</div>
          </div>
        </div>

        {/* 4 Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <div style={{ padding: '14px', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800 }}>WEEKLY XP ACQUIRED</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#00e5ff', marginTop: '2px' }}>+{weeklyXp || 250} XP</div>
          </div>

          <div style={{ padding: '14px', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800 }}>DIRECTIVES CLEARED</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#10b981', marginTop: '2px' }}>{weeklyQuestsCount || 3} QUESTS</div>
          </div>

          <div style={{ padding: '14px', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800 }}>MOMENTUM SCORE</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#f59e0b', marginTop: '2px' }}>{momentumScore}%</div>
          </div>

          <div style={{ padding: '14px', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800 }}>ACTIVE STREAK</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#a855f7', marginTop: '2px' }}>{profile.streak || 1} DAYS</div>
          </div>
        </div>

        {/* Leading Domain */}
        <div style={{ padding: '14px', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.15)', marginBottom: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px', marginBottom: '4px' }}>
            PRIMARY ACCELERATION DOMAIN
          </div>
          <div style={{ fontSize: '14px', fontWeight: 900, color: '#00e5ff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target style={{ width: '16px', height: '16px' }} />
            {leadingDomain}
          </div>
        </div>

        {/* System Guidance */}
        <div style={{ padding: '14px', backgroundColor: 'rgba(0, 229, 255, 0.08)', borderRadius: '12px', borderLeft: '3px solid #00e5ff', marginBottom: '22px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#00e5ff', letterSpacing: '1px', marginBottom: '4px' }}>
            [SYSTEM TRANSMISSION GUIDANCE]
          </div>
          <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
            Hunter discipline remains stable. Maintain current momentum to unlock higher-tier dungeon breaks. Focus on balancing recovery days with high-intensity execution.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            backgroundColor: '#f59e0b',
            color: '#060912',
            fontWeight: 900,
            fontSize: '13px',
            letterSpacing: '1.5px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          CONFIRM DEBRIEF
        </button>
      </motion.div>
    </div>
  );
};
