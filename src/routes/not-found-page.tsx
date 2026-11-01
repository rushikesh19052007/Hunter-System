import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft, Radio } from 'lucide-react';

interface NotFoundPageProps {
  onReturnToBase: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onReturnToBase }) => {
  return (
    <div className="not-found-wrapper">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="not-found-card"
      >
        {/* Warning Icon Badge */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: 'rgba(244, 63, 94, 0.12)',
            border: '2px solid rgba(244, 63, 94, 0.5)',
            color: '#f43f5e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 25px rgba(244, 63, 94, 0.35)',
          }}
        >
          <ShieldAlert size={32} />
        </div>

        {/* 404 Error Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-tech)', fontWeight: 900, color: '#f43f5e', letterSpacing: '2px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Radio size={14} className="animate-pulse" /> [SECTOR ANOMALY // 404]
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '2px', color: '#fff', margin: 0, fontFamily: 'var(--font-display)' }}>
            TARGET NOT FOUND
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.5, margin: '6px 0 0', maxWidth: '380px' }}>
            This hunting zone does not exist or has been severed by a high-grade dungeon break.
          </p>
        </div>

        {/* Action Button */}
        <div style={{ width: '100%', marginTop: '16px' }}>
          <button
            type="button"
            onClick={onReturnToBase}
            className="btn-hologram-cyan"
            style={{ width: '100%', padding: '12px' }}
          >
            <ArrowLeft size={16} /> RETURN TO BASE
          </button>
        </div>
      </motion.div>
    </div>
  );
};
