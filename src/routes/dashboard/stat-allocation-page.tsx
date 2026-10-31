import React from 'react';
import { useHunter } from '@/lib/hunter-store';
import { HUNTER_STATS, type HunterStat } from '@/lib/game-engine';
import {
  Plus,
  ShieldAlert,
  Flame,
  Zap,
  Shield,
  Brain,
  Eye,
  Sparkles,
  Trophy,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { audioService } from '@/lib/audio-service';

export const StatAllocationPage: React.FC = () => {
  const { profile, allocateStatPoint } = useHunter();

  if (!profile) return null;

  // Use available_skill_points (standard in hunter-store & Flutter) with fallback to available_stat_points
  const availablePoints =
    profile.available_skill_points ?? profile.available_stat_points ?? 0;

  // Calculate live Combat Power
  const combatPower =
    profile.current_level * 45 +
    (profile.stats['STR'] || 10) * 12 +
    (profile.stats['AGI'] || 10) * 11 +
    (profile.stats['VIT'] || 10) * 10 +
    (profile.stats['INT'] || 10) * 13 +
    (profile.stats['PERC'] || 10) * 9;

  const statIcons: Record<HunterStat, React.ReactNode> = {
    STR: <Flame className="w-5 h-5 text-red-400" />,
    AGI: <Zap className="w-5 h-5 text-cyan-400" />,
    VIT: <Shield className="w-5 h-5 text-emerald-400" />,
    INT: <Brain className="w-5 h-5 text-purple-400" />,
    PERC: <Eye className="w-5 h-5 text-amber-400" />,
  };

  const statPowerWeights: Record<HunterStat, number> = {
    STR: 12,
    AGI: 11,
    VIT: 10,
    INT: 13,
    PERC: 9,
  };

  const handleAllocate = (code: string) => {
    if (availablePoints <= 0) return;
    audioService.playClick();
    allocateStatPoint(code, 1);
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '28px 20px 80px',
        color: '#fff',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '20px',
          paddingBottom: '24px',
          borderBottom: '1px solid rgba(0, 229, 255, 0.2)',
          marginBottom: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Sparkles className="w-6 h-6 text-cyan-400" />
            <h1
              style={{
                fontSize: '1.9rem',
                fontWeight: 900,
                letterSpacing: '2px',
                margin: 0,
                textTransform: 'uppercase',
                textShadow: '0 0 20px rgba(0, 229, 255, 0.4)',
              }}
            >
              STAT ALLOCATION DIRECTIVE
            </h1>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0, maxWidth: '620px' }}>
            Distribute points earned from level-ups, daily protocols, and dungeon breaks to permanently enhance your primary attributes.
          </p>
        </div>

        {/* Available Points Badge Card */}
        <div
          style={{
            background:
              availablePoints > 0
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.35))'
                : 'linear-gradient(135deg, #0c1020, #13182a)',
            border: availablePoints > 0 ? '1.5px solid #f59e0b' : '1px solid #1c253d',
            borderRadius: '16px',
            padding: '16px 24px',
            minWidth: '220px',
            textAlign: 'center',
            boxShadow:
              availablePoints > 0
                ? '0 0 25px rgba(245, 158, 11, 0.35)'
                : '0 8px 20px rgba(0, 0, 0, 0.5)',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '1.5px',
              color: availablePoints > 0 ? '#fbbf24' : '#00e5ff',
              marginBottom: '4px',
            }}
          >
            AVAILABLE SKILL POINTS
          </span>
          <span
            style={{
              fontSize: '2.5rem',
              fontWeight: 900,
              color: availablePoints > 0 ? '#ffb300' : '#fff',
              textShadow: availablePoints > 0 ? '0 0 15px rgba(255, 179, 0, 0.6)' : 'none',
            }}
          >
            {availablePoints}
          </span>
          <span
            style={{
              display: 'block',
              fontSize: '11px',
              color: '#94a3b8',
              marginTop: '4px',
            }}
          >
            +3 SP granted per level up
          </span>
        </div>
      </div>

      {/* Alert Bar */}
      {availablePoints === 0 ? (
        <div
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '28px',
            color: '#fef3c7',
            fontSize: '0.9rem',
          }}
        >
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <span>
            You currently have <strong>0 unassigned skill points</strong>. Complete daily trials, level up, or conquer dungeon gates to earn more points.
          </span>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'rgba(0, 229, 255, 0.1)',
            border: '1.5px solid rgba(0, 229, 255, 0.6)',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '28px',
            color: '#67e8f9',
            fontSize: '0.9rem',
            boxShadow: '0 0 20px rgba(0, 229, 255, 0.25)',
          }}
        >
          <Sparkles className="w-5 h-5 flex-shrink-0 text-cyan-400 animate-pulse" />
          <span>
            <strong>{availablePoints} UNASSIGNED POINT{availablePoints > 1 ? 'S' : ''} DETECTED!</strong> Allocate points to boost attributes and maximize Combat Power rating.
          </span>
        </div>
      )}

      {/* 5 Primary Attributes Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '18px',
          marginBottom: '32px',
        }}
      >
        {(
          Object.entries(HUNTER_STATS) as [
            HunterStat,
            (typeof HUNTER_STATS)[HunterStat]
          ][]
        ).map(([code, statDef]) => {
          const currentVal = profile.stats[code] || 10;
          const progressPct = Math.min(100, Math.max(10, (currentVal / 150) * 100));
          const weight = statPowerWeights[code] || 10;

          return (
            <div
              key={code}
              style={{
                backgroundColor: '#0c1020',
                borderRadius: '16px',
                border: '1px solid #1c253d',
                borderLeft: `5px solid ${statDef.color}`,
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                transition: 'all 0.2s ease',
              }}
            >
              <div>
                {/* Header Row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: `1.5px solid ${statDef.color}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {statIcons[code]}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 900,
                          color: statDef.color,
                          letterSpacing: '1px',
                        }}
                      >
                        {code}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#94a3b8',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {statDef.name}
                      </div>
                    </div>
                  </div>

                  {/* Value Pill */}
                  <div
                    style={{
                      padding: '6px 16px',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: `1px solid ${statDef.color}`,
                      borderRadius: '10px',
                      fontSize: '1.6rem',
                      fontWeight: 900,
                      color: '#fff',
                      boxShadow: `0 0 15px ${statDef.color}33`,
                    }}
                  >
                    {currentVal}
                  </div>
                </div>

                {/* Stat Progress Bar */}
                <div style={{ margin: '14px 0 10px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      color: '#64748b',
                      fontWeight: 700,
                      marginBottom: '6px',
                    }}
                  >
                    <span>ATTRIBUTE CAPACITY</span>
                    <span>{currentVal} / 150</span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '7px',
                      backgroundColor: '#161d30',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${progressPct}%`,
                        height: '100%',
                        backgroundColor: statDef.color,
                        borderRadius: '4px',
                        boxShadow: `0 0 8px ${statDef.color}`,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Description */}
                <p
                  style={{
                    color: '#cbd5e1',
                    fontSize: '0.85rem',
                    lineHeight: '1.45',
                    margin: '0 0 12px 0',
                    minHeight: '38px',
                  }}
                >
                  {statDef.description}
                </p>

                {/* Power Contribution Pill */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#94a3b8',
                    fontWeight: 600,
                  }}
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>+{weight} Combat Power per point</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handleAllocate(code)}
                disabled={availablePoints <= 0}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border:
                    availablePoints > 0
                      ? `1.5px solid ${statDef.color}`
                      : '1px solid #1e293b',
                  backgroundColor:
                    availablePoints > 0 ? statDef.color : 'rgba(30, 41, 59, 0.4)',
                  color: availablePoints > 0 ? '#000' : '#64748b',
                  fontWeight: 900,
                  fontSize: '13px',
                  letterSpacing: '1px',
                  cursor: availablePoints > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow:
                    availablePoints > 0
                      ? `0 0 18px ${statDef.color}55`
                      : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {availablePoints > 0 ? (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>ALLOCATE +1 {code}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>POINTS DEPLETED</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Combat Power Breakdown Footer Card */}
      <div
        style={{
          backgroundColor: '#0c1020',
          borderRadius: '16px',
          border: '1px solid #1c253d',
          padding: '24px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '16px',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: '1.2rem',
                fontWeight: 900,
                color: '#fff',
                letterSpacing: '1px',
                margin: '0 0 4px 0',
              }}
            >
              COMBAT POWER FORMULA
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
              Official Hunter Association combat calculation synchronized with your Android profile.
            </p>
          </div>

          <div
            style={{
              padding: '10px 20px',
              backgroundColor: 'rgba(236, 72, 153, 0.15)',
              border: '1.5px solid rgba(236, 72, 153, 0.6)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Zap className="w-5 h-5 text-pink-400" />
            <div>
              <div style={{ fontSize: '10px', color: '#f472b6', fontWeight: 800, letterSpacing: '1px' }}>
                CURRENT COMBAT POWER
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff' }}>
                {combatPower.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '10px',
            paddingTop: '16px',
            borderTop: '1px solid #1e293b',
          }}
        >
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            Level: <strong style={{ color: '#67e8f9' }}>Lvl {profile.current_level} (×45)</strong>
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            STR: <strong style={{ color: '#ef4444' }}>{profile.stats.STR || 10} (×12)</strong>
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            AGI: <strong style={{ color: '#00e5ff' }}>{profile.stats.AGI || 10} (×11)</strong>
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            VIT: <strong style={{ color: '#10b981' }}>{profile.stats.VIT || 10} (×10)</strong>
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            INT: <strong style={{ color: '#a855f7' }}>{profile.stats.INT || 10} (×13)</strong>
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            PERC: <strong style={{ color: '#f59e0b' }}>{profile.stats.PERC || 10} (×9)</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatAllocationPage;
