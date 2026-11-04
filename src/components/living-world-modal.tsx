import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Globe, Shield, Building, Award, Target, Sparkles, X, ChevronRight, Lock, CheckCircle, Flame, Dumbbell, Brain, Code, BookOpen,
} from 'lucide-react';
import { useHunter } from '@/lib/hunter-store';
import { audioService } from '@/lib/audio-service';

interface LivingWorldModalProps {
  onClose: () => void;
}

export const LivingWorldModal: React.FC<LivingWorldModalProps> = ({ onClose }) => {
  const { profile } = useHunter();
  const [activeTab, setActiveTab] = useState<'map' | 'hq'>('map');

  if (!profile) return null;

  const phyCount = profile.physical_quests_completed || 0;
  const menCount = profile.mental_quests_completed || 0;
  const codeCount = profile.coding_quests_completed || 0;
  const rank = profile.current_rank || 'E-Rank';
  const level = profile.current_level || 1;

  const regions = [
    {
      id: 'iron-citadel',
      name: 'THE IRON CITADEL',
      domain: 'Strength & Physical Durability',
      lore: 'The imposing bastion where hunters forge unyielding constitution through resistance training.',
      progress: Math.min(100, Math.round(15 + phyCount * 10)),
      color: '#10b981',
      icon: <Dumbbell className="w-5 h-5" />,
    },
    {
      id: 'mind-sanctum',
      name: 'THE MIND SANCTUM',
      domain: 'Intellect & Cognitive Fortitude',
      lore: 'A holographic repository dedicated to deep intellectual synthesis, logic, and memory retention.',
      progress: Math.min(100, Math.round(15 + menCount * 10)),
      color: '#a855f7',
      icon: <Brain className="w-5 h-5" />,
    },
    {
      id: 'abyssal-frontier',
      name: 'THE ABYSSAL FRONTIER',
      domain: 'Algorithmic Engineering & Codecraft',
      lore: 'High-density computational proving grounds where hunters construct software systems.',
      progress: Math.min(100, Math.round(10 + codeCount * 14)),
      color: '#00e5ff',
      icon: <Code className="w-5 h-5" />,
    },
    {
      id: 'silent-archives',
      name: 'THE SILENT ARCHIVES',
      domain: 'Deep Reading & Contemplation',
      lore: 'Ancient crystalline vault preserved for undisturbed literary immersion and strategic study.',
      progress: Math.min(100, Math.round(20 + menCount * 8)),
      color: '#f59e0b',
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      id: 'ember-wilds',
      name: 'THE EMBER WILDS',
      domain: 'Aerobic Agility & Outdoor Expeditions',
      lore: 'Rugged untamed plains challenging speed, endurance, and cardiovascular capacity.',
      progress: Math.min(100, Math.round(10 + phyCount * 9)),
      color: '#ef4444',
      icon: <Flame className="w-5 h-5" />,
    },
    {
      id: 'celestial-summit',
      name: 'THE CELESTIAL SUMMIT',
      domain: 'Long-Term Mastery & Sovereign Will',
      lore: 'The zenith realm above the cloud barrier. Accessible only to persistent masters.',
      progress: Math.min(100, Math.round(level * 1.5)),
      color: '#ec4899',
      icon: <Sparkles className="w-5 h-5" />,
    },
  ];

  const hqRooms = [
    {
      id: 'command-deck',
      name: 'CENTRAL COMMAND DECK',
      desc: 'Tactical holographic terminal monitoring active directives and daily cycle metrics.',
      unlocked: true,
      req: 'Unlocked by Default',
    },
    {
      id: 'training-dojo',
      name: 'KINETIC TRAINING DOJO',
      desc: 'Zero-inertia gravitational chamber for push-up records, sprints, and physical drills.',
      unlocked: level >= 5,
      req: 'Requires Level 5',
    },
    {
      id: 'trophy-hall',
      name: 'SOVEREIGN TROPHY HALL',
      desc: 'Showcase of cleared dungeon cores, promotion relics, and personal record banners.',
      unlocked: rank !== 'E-Rank',
      req: 'Requires D-Rank or Higher',
    },
    {
      id: 'meditation-sanctuary',
      name: 'NEURAL SANCTUARY',
      desc: 'Acoustic isolation zone designed for breathing protocols and mind restoration.',
      unlocked: level >= 15,
      req: 'Requires Level 15',
    },
    {
      id: 'squad-briefing-room',
      name: 'GUILD WAR ROOM',
      desc: 'Long-range comms terminal coordinating co-op raids and squad expeditions.',
      unlocked: !!profile.guild_id,
      req: 'Requires Guild Membership',
    },
  ];

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
          maxWidth: '640px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#090d1f',
          borderRadius: '20px',
          border: '1.5px solid rgba(168, 85, 247, 0.4)',
          padding: '28px',
          boxShadow: '0 0 40px rgba(168, 85, 247, 0.2)',
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe style={{ width: '22px', height: '22px', color: '#a855f7' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 900, fontFamily: "'Orbitron', sans-serif", letterSpacing: '1px' }}>
              EXPANDED HUNTER WORLD
            </h3>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(56, 189, 248, 0.15)', paddingBottom: '12px' }}>
          <button
            type="button"
            onClick={() => { audioService.playClick(); setActiveTab('map'); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: activeTab === 'map' ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
              border: activeTab === 'map' ? '1px solid #a855f7' : '1px solid transparent',
              color: activeTab === 'map' ? '#a855f7' : '#94a3b8',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Globe style={{ width: '16px', height: '16px' }} />
            TERRITORY REGIONS
          </button>
          <button
            type="button"
            onClick={() => { audioService.playClick(); setActiveTab('hq'); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: activeTab === 'hq' ? 'rgba(0, 229, 255, 0.25)' : 'transparent',
              border: activeTab === 'hq' ? '1px solid #00e5ff' : '1px solid transparent',
              color: activeTab === 'hq' ? '#00e5ff' : '#94a3b8',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Building style={{ width: '16px', height: '16px' }} />
            HUNTER HEADQUARTERS
          </button>
        </div>

        {/* Map View */}
        {activeTab === 'map' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {regions.map((reg) => (
              <div
                key={reg.id}
                style={{
                  padding: '16px',
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  borderRadius: '12px',
                  border: `1px solid ${reg.color}35`,
                  boxShadow: `0 0 15px ${reg.color}15`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ color: reg.color }}>{reg.icon}</div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff', fontFamily: "'Orbitron', sans-serif" }}>
                        {reg.name}
                      </div>
                      <div style={{ fontSize: '11px', color: reg.color, fontWeight: 700 }}>
                        {reg.domain}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 900, color: reg.color }}>
                    {reg.progress}% RESTORED
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4, margin: '8px 0' }}>
                  {reg.lore}
                </p>

                <div style={{ height: '5px', backgroundColor: 'rgba(30, 41, 59, 0.8)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${reg.progress}%`, backgroundColor: reg.color }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* HQ View */}
        {activeTab === 'hq' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {hqRooms.map((room) => (
              <div
                key={room.id}
                style={{
                  padding: '16px',
                  backgroundColor: room.unlocked ? 'rgba(15, 23, 42, 0.75)' : 'rgba(10, 15, 30, 0.5)',
                  borderRadius: '12px',
                  border: room.unlocked ? '1px solid rgba(0, 229, 255, 0.3)' : '1px solid rgba(56, 189, 248, 0.1)',
                  opacity: room.unlocked ? 1 : 0.65,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {room.unlocked ? (
                      <CheckCircle style={{ width: '18px', height: '18px', color: '#10b981' }} />
                    ) : (
                      <Lock style={{ width: '18px', height: '18px', color: '#64748b' }} />
                    )}
                    <span style={{ fontSize: '14px', fontWeight: 900, color: room.unlocked ? '#00e5ff' : '#94a3b8', fontFamily: "'Orbitron', sans-serif" }}>
                      {room.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: room.unlocked ? '#10b981' : '#f59e0b' }}>
                    {room.unlocked ? 'ONLINE' : room.req}
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4 }}>
                  {room.desc}
                </p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};
