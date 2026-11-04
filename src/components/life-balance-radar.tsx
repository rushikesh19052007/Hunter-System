import React from 'react';
import { useHunter } from '@/lib/hunter-store';
import { Activity, Brain, Shield, Code, Heart, Users } from 'lucide-react';

export const LifeBalanceRadar: React.FC = () => {
  const { profile } = useHunter();

  if (!profile) return null;

  // Calculate scores (0 to 100) based on actual player statistics & activity
  const phyCount = profile.physical_quests_completed || 0;
  const menCount = profile.mental_quests_completed || 0;
  const codeCount = profile.coding_quests_completed || 0;
  const streak = profile.streak || 0;

  const physicalScore = Math.min(100, Math.round(20 + phyCount * 8 + (profile.stats.STR || 10) * 1.5));
  const learningScore = Math.min(100, Math.round(20 + menCount * 8 + (profile.stats.INT || 10) * 1.5));
  const codingScore = Math.min(100, Math.round(15 + codeCount * 12 + (profile.stats.INT || 10)));
  const disciplineScore = Math.min(100, Math.round(25 + streak * 4 + (profile.stats.PERC || 10) * 1.5));
  const wellnessScore = Math.min(100, Math.round(30 + (profile.stats.VIT || 10) * 2));
  const socialScore = Math.min(100, Math.round(profile.guild_id ? 75 : 35));

  const axes = [
    { label: 'PHYSICAL', value: physicalScore, icon: <Activity className="w-3 h-3 text-emerald-400" /> },
    { label: 'LEARNING', value: learningScore, icon: <Brain className="w-3 h-3 text-purple-400" /> },
    { label: 'CODING', value: codingScore, icon: <Code className="w-3 h-3 text-cyan-400" /> },
    { label: 'DISCIPLINE', value: disciplineScore, icon: <Shield className="w-3 h-3 text-amber-400" /> },
    { label: 'WELLNESS', value: wellnessScore, icon: <Heart className="w-3 h-3 text-rose-400" /> },
    { label: 'SQUAD', value: socialScore, icon: <Users className="w-3 h-3 text-blue-400" /> },
  ];

  // Hexagon geometry points
  const centerX = 120;
  const centerY = 120;
  const maxRadius = 80;

  const getCoordinates = (value: number, index: number, total: number) => {
    const angle = (Math.PI * 2 / total) * index - Math.PI / 2;
    const r = (value / 100) * maxRadius;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    return { x, y };
  };

  const polygonPoints = axes
    .map((axis, i) => {
      const { x, y } = getCoordinates(axis.value, i, axes.length);
      return `${x},${y}`;
    })
    .join(' ');

  const gridCircles = [0.25, 0.5, 0.75, 1.0];

  return (
    <div
      style={{
        backgroundColor: 'rgba(10, 15, 36, 0.75)',
        border: '1px solid rgba(56, 189, 248, 0.15)',
        borderRadius: '16px',
        padding: '20px',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '1.5px', color: '#00e5ff', fontFamily: "'Orbitron', sans-serif" }}>
          LIFE BALANCE RADAR
        </h4>
        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>
          ACTIVE EQUILIBRIUM
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        {/* SVG Radar */}
        <svg width="240" height="240" style={{ overflow: 'visible' }}>
          {/* Background web rings */}
          {gridCircles.map((factor, idx) => {
            const points = axes
              .map((_, i) => {
                const angle = (Math.PI * 2 / axes.length) * i - Math.PI / 2;
                const x = centerX + maxRadius * factor * Math.cos(angle);
                const y = centerY + maxRadius * factor * Math.sin(angle);
                return `${x},${y}`;
              })
              .join(' ');
            return (
              <polygon
                key={idx}
                points={points}
                fill="none"
                stroke="rgba(56, 189, 248, 0.15)"
                strokeWidth="1"
              />
            );
          })}

          {/* Radial axis lines */}
          {axes.map((_, i) => {
            const angle = (Math.PI * 2 / axes.length) * i - Math.PI / 2;
            const x = centerX + maxRadius * Math.cos(angle);
            const y = centerY + maxRadius * Math.sin(angle);
            return (
              <line
                key={i}
                x1={centerX}
                y1={centerY}
                x2={x}
                y2={y}
                stroke="rgba(56, 189, 248, 0.2)"
                strokeWidth="1"
              />
            );
          })}

          {/* Filled active polygon */}
          <polygon
            points={polygonPoints}
            fill="rgba(0, 229, 255, 0.22)"
            stroke="#00e5ff"
            strokeWidth="2"
            style={{ filter: 'drop-shadow(0 0 6px rgba(0, 229, 255, 0.6))' }}
          />

          {/* Data vertices */}
          {axes.map((axis, i) => {
            const { x, y } = getCoordinates(axis.value, i, axes.length);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="4"
                fill="#00e5ff"
                stroke="#040714"
                strokeWidth="1.5"
              />
            );
          })}
        </svg>

        {/* Legend stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', minWidth: '200px' }}>
          {axes.map((axis) => (
            <div
              key={axis.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                borderRadius: '8px',
                border: '1px solid rgba(56, 189, 248, 0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {axis.icon}
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8' }}>{axis.label}</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#fff' }}>{axis.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

