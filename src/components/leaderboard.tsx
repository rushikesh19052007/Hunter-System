import { PlayerProfileModal } from './player-profile-modal';
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Medal,
  Award,
  Flame,
  Zap,
  TrendingUp,
  Shield,
  Search,
  RotateCw,
  User,
  Users,
  Sparkles,
} from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useHunter } from '@/lib/hunter-store';
import { useAuth } from '@/lib/auth';
import {
  type Profile,
  getRankBadgeInfo,
  generateHunterId,
  migrateProfile,
} from '@/lib/game-engine';
import { audioService } from '@/lib/audio-service';

export type SortFilter = 'xp' | 'level' | 'clean_days';

export interface GlobalRegistryStats {
  totalHunters: number;
  activeHunters: number;
  avgLevel: number;
  dominantAffinity: string;
}

// Built-in Solo Leveling Top Hunters (matching Flutter's FirebaseService fallback)
const DEMO_LEADERBOARD_HUNTERS: Profile[] = [
  migrateProfile({
    id: 'lb-1',
    hunter_id: 'HUNTER-MONARCH-S',
    display_name: 'Sung Jin-Woo',
    current_level: 142,
    current_rank: 'S-Rank',
    total_xp: 589200,
    affinity: 'STR',
    clean_days: 365,
    stats: { STR: 310, AGI: 280, VIT: 290, INT: 260, PERC: 275 },
    quests_completed: 1420,
    equipped_title: 'Shadow Monarch',
  }),
  migrateProfile({
    id: 'lb-2',
    hunter_id: 'HUNTER-GOLIATH-S',
    display_name: 'Thomas Andre',
    current_level: 118,
    current_rank: 'S-Rank',
    total_xp: 412500,
    affinity: 'VIT',
    clean_days: 240,
    stats: { STR: 260, AGI: 190, VIT: 295, INT: 140, PERC: 170 },
    quests_completed: 980,
    equipped_title: 'Goliath',
  }),
  migrateProfile({
    id: 'lb-3',
    hunter_id: 'HUNTER-BLADE-S',
    display_name: 'Cha Hae-In',
    current_level: 98,
    current_rank: 'S-Rank',
    total_xp: 295000,
    affinity: 'AGI',
    clean_days: 180,
    stats: { STR: 195, AGI: 260, VIT: 180, INT: 155, PERC: 220 },
    quests_completed: 760,
    equipped_title: 'Sword Dancer',
  }),
  migrateProfile({
    id: 'lb-4',
    hunter_id: 'HUNTER-BEAST-A',
    display_name: 'Baek Yoonho',
    current_level: 88,
    current_rank: 'S-Rank',
    total_xp: 220000,
    affinity: 'STR',
    clean_days: 150,
    stats: { STR: 240, AGI: 190, VIT: 210, INT: 120, PERC: 160 },
    quests_completed: 640,
    equipped_title: 'White Tiger',
  }),
  migrateProfile({
    id: 'lb-5',
    hunter_id: 'HUNTER-SOLDIER-S',
    display_name: 'Choi Jong-In',
    current_level: 85,
    current_rank: 'S-Rank',
    total_xp: 210000,
    affinity: 'INT',
    clean_days: 140,
    stats: { STR: 120, AGI: 140, VIT: 130, INT: 260, PERC: 190 },
    quests_completed: 610,
    equipped_title: 'Ultimate Soldier',
  }),
  migrateProfile({
    id: 'lb-6',
    hunter_id: 'HUNTER-CHAIRMAN-S',
    display_name: 'Go Gun-Hee',
    current_level: 95,
    current_rank: 'S-Rank',
    total_xp: 310000,
    affinity: 'VIT',
    clean_days: 300,
    stats: { STR: 200, AGI: 170, VIT: 250, INT: 220, PERC: 230 },
    quests_completed: 890,
    equipped_title: 'Guild Chairman',
  }),
  migrateProfile({
    id: 'lb-7',
    hunter_id: 'HUNTER-CHIEF-A',
    display_name: 'Woo Jin-Chul',
    current_level: 72,
    current_rank: 'A-Rank',
    total_xp: 155000,
    affinity: 'PERC',
    clean_days: 110,
    stats: { STR: 160, AGI: 175, VIT: 170, INT: 150, PERC: 220 },
    quests_completed: 480,
    equipped_title: 'Chief Inspector',
  }),
  migrateProfile({
    id: 'lb-8',
    hunter_id: 'HUNTER-HEALER-A',
    display_name: 'Min Byung-Gyu',
    current_level: 68,
    current_rank: 'A-Rank',
    total_xp: 138000,
    affinity: 'VIT',
    clean_days: 95,
    stats: { STR: 100, AGI: 120, VIT: 210, INT: 200, PERC: 170 },
    quests_completed: 420,
    equipped_title: 'Brilliant Healer',
  }),
  migrateProfile({
    id: 'lb-9',
    hunter_id: 'HUNTER-ARCHER-A',
    display_name: 'Lim Tae-Gyu',
    current_level: 64,
    current_rank: 'A-Rank',
    total_xp: 122000,
    affinity: 'PERC',
    clean_days: 85,
    stats: { STR: 130, AGI: 180, VIT: 140, INT: 130, PERC: 215 },
    quests_completed: 390,
    equipped_title: 'Fiend Master',
  }),
  migrateProfile({
    id: 'lb-10',
    hunter_id: 'HUNTER-TANK-A',
    display_name: 'Ma Dong-Wook',
    current_level: 62,
    current_rank: 'A-Rank',
    total_xp: 115000,
    affinity: 'VIT',
    clean_days: 80,
    stats: { STR: 180, AGI: 120, VIT: 220, INT: 110, PERC: 140 },
    quests_completed: 360,
    equipped_title: 'Fame Master',
  }),
  migrateProfile({
    id: 'lb-11',
    hunter_id: 'HUNTER-SHIELD-D',
    display_name: 'Yoo Jinho',
    current_level: 35,
    current_rank: 'D-Rank',
    total_xp: 38000,
    affinity: 'VIT',
    clean_days: 45,
    stats: { STR: 80, AGI: 70, VIT: 120, INT: 90, PERC: 85 },
    quests_completed: 140,
    equipped_title: 'Ahjin Vice Master',
  }),
  migrateProfile({
    id: 'lb-12',
    hunter_id: 'HUNTER-SWORD-E',
    display_name: 'Song Chi-Yul',
    current_level: 28,
    current_rank: 'E-Rank',
    total_xp: 22000,
    affinity: 'AGI',
    clean_days: 30,
    stats: { STR: 65, AGI: 95, VIT: 70, INT: 60, PERC: 80 },
    quests_completed: 90,
    equipped_title: 'Kendo Master',
  }),
  migrateProfile({
    id: 'lb-13',
    hunter_id: 'HUNTER-HEAL-B',
    display_name: 'Lee Joohee',
    current_level: 22,
    current_rank: 'B-Rank',
    total_xp: 18500,
    affinity: 'INT',
    clean_days: 25,
    stats: { STR: 40, AGI: 55, VIT: 75, INT: 110, PERC: 90 },
    quests_completed: 80,
    equipped_title: 'B-Rank Healer',
  }),
];

export const Leaderboard: React.FC = () => {
  const { profile } = useHunter();
  const { user } = useAuth();
  const [filter, setFilter] = useState<SortFilter>('xp');
  const [rankFilter, setRankFilter] = useState<string>('ALL');
  const [selectedPlayerUid, setSelectedPlayerUid] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hunters, setHunters] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [registryStats, setRegistryStats] = useState<GlobalRegistryStats | null>(null);

  // Fetch top hunters from Firestore collection 'leaderboard'
  const fetchLeaderboard = async () => {
    setLoading(true);
    let fetchedHunters: Profile[] = [];

    try {
      const q = query(
        collection(firestore, 'leaderboard'),
        orderBy('totalXp', 'desc'),
        limit(25)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        fetchedHunters = snap.docs.map((d) => {
          const data = d.data();
          return migrateProfile({
            id: d.id,
            hunter_id: (data.hunterId as string) || generateHunterId(d.id, (data.affinity as string) || 'AGI'),
            display_name: (data.displayName as string) || 'Unknown Hunter',
            total_xp: (data.totalXp as number) || 0,
            current_level: (data.level as number) || 1,
            stats: (data.stats as Record<string, number>) || {},
            clean_days: (data.streak as number) || 0,
            current_rank: (data.rank as string) || 'E-Rank',
            affinity: (data.affinity as string) || 'AGI',
            equipped_title: (data.equippedTitle as string) || 'The Awakened',
            quests_completed: (data.questsCompleted as number) || 0,
          });
        });
      }
    } catch (err) {
      console.warn('[Leaderboard] Firestore fetch fallback to demo roster:', err);
    }

    // If Firestore yielded no hunters, use built-in demo hunters
    if (fetchedHunters.length === 0) {
      fetchedHunters = [...DEMO_LEADERBOARD_HUNTERS];
    }

    // Merge or update current user profile so user is always visible in leaderboard
    if (profile) {
      const existingIdx = fetchedHunters.findIndex(
        (h) => h.id === profile.id || h.hunter_id === profile.hunter_id
      );
      if (existingIdx !== -1) {
        fetchedHunters[existingIdx] = profile;
      } else {
        fetchedHunters.push(profile);
      }
    } else if (user) {
      // If profile is null (deleted or reset), ensure user is never shown in fetchedHunters
      fetchedHunters = fetchedHunters.filter((h) => h.id !== user.id);
    }

    setHunters(fetchedHunters);

    // Compute registry aggregates
    const total = fetchedHunters.length;
    const active = fetchedHunters.filter((h) => h.total_xp > 0).length;
    const sumLvl = fetchedHunters.reduce((acc, h) => acc + h.current_level, 0);
    const avgLvl = Math.max(1, Math.round(sumLvl / total));

    const tally: Record<string, number> = {};
    fetchedHunters.forEach((h) => {
      tally[h.affinity] = (tally[h.affinity] || 0) + 1;
    });
    let topAff = 'AGI';
    let maxCount = 0;
    for (const [aff, count] of Object.entries(tally)) {
      if (count > maxCount) {
        maxCount = count;
        topAff = aff;
      }
    }

    setRegistryStats({
      totalHunters: total,
      activeHunters: active,
      avgLevel: avgLvl,
      dominantAffinity: topAff,
    });

    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [profile?.total_xp, profile?.current_level, profile?.clean_days]);

  // Sort and filter hunters
  const sortedHunters = useMemo(() => {
    let list = [...hunters];

    // Filter by rank pill
    if (rankFilter !== 'ALL') {
      list = list.filter((h) => h.current_rank.includes(rankFilter));
    }

    // Sort
    list.sort((a, b) => {
      if (filter === 'xp') {
        return (b.total_xp || 0) - (a.total_xp || 0);
      }
      if (filter === 'level') {
        if ((b.current_level || 0) !== (a.current_level || 0)) {
          return (b.current_level || 0) - (a.current_level || 0);
        }
        return (b.total_xp || 0) - (a.total_xp || 0);
      }
      return (b.clean_days || 0) - (a.clean_days || 0);
    });

    // Search query
    if (!searchQuery.trim()) {
      return list;
    }

    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (h) =>
        h.display_name.toLowerCase().includes(q) ||
        h.hunter_id?.toLowerCase().includes(q) ||
        h.current_rank.toLowerCase().includes(q)
    );
  }, [hunters, filter, rankFilter, searchQuery]);

  // Find current user's global position
  const currentUserRank = useMemo(() => {
    if (!profile) return null;
    const sorted = [...hunters].sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0));
    const index = sorted.findIndex((h) => h.id === profile.id || h.hunter_id === profile.hunter_id);
    return index !== -1 ? index + 1 : null;
  }, [hunters, profile]);

  const getRankBadgeStyle = (rankNum: number) => {
    if (rankNum === 1) {
      return {
        bg: 'rank-gold',
        icon: <Trophy className="w-5 h-5 text-amber-300" />,
        label: '#1',
        border: 'border-amber-400/80',
        glow: 'shadow-[0_0_20px_rgba(245,158,11,0.5)]',
      };
    }
    if (rankNum === 2) {
      return {
        bg: 'rank-silver',
        icon: <Medal className="w-5 h-5 text-slate-200" />,
        label: '#2',
        border: 'border-slate-300/80',
        glow: 'shadow-[0_0_15px_rgba(203,213,225,0.4)]',
      };
    }
    if (rankNum === 3) {
      return {
        bg: 'rank-bronze',
        icon: <Award className="w-5 h-5 text-amber-600" />,
        label: '#3',
        border: 'border-amber-700/80',
        glow: 'shadow-[0_0_15px_rgba(180,83,9,0.3)]',
      };
    }
    return {
      bg: 'rank-standard',
      icon: null,
      label: `#${rankNum}`,
      border: 'border-white/10',
      glow: '',
    };
  };

  return (
    <div className="leaderboard-container">
      {/* Leaderboard Header Banner */}
      <div className="leaderboard-header">
        <div className="leaderboard-title-group">
          <div className="title-with-badge">
            <Trophy className="w-8 h-8 text-amber-400" />
            <h1 className="leaderboard-title">GLOBAL HUNTER GUILD</h1>
          </div>
          <p className="leaderboard-subtitle">
            Live worldwide standings certified by the Hunter Association Archives. Top Awakened.
          </p>
        </div>

        {/* Global Registry Aggregate Stats Widget */}
        <div className="global-stats-bar">
          <div className="global-stat-card">
            <div className="global-stat-icon-wrapper text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
            <div className="global-stat-details">
              <span className="global-stat-label">REGISTERED HUNTERS</span>
              <span className="global-stat-value">
                {registryStats?.totalHunters || 100}
              </span>
            </div>
          </div>

          <div className="global-stat-card">
            <div className="global-stat-icon-wrapper text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
            <div className="global-stat-details">
              <span className="global-stat-label">ACTIVE COMBATANTS</span>
              <span className="global-stat-value">
                {registryStats?.activeHunters || 98}
              </span>
            </div>
          </div>

          <div className="global-stat-card">
            <div className="global-stat-icon-wrapper text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="global-stat-details">
              <span className="global-stat-label">AVG POWER LEVEL</span>
              <span className="global-stat-value">
                LVL {registryStats?.avgLevel || 42}
              </span>
            </div>
          </div>

          <div className="global-stat-card">
            <div className="global-stat-icon-wrapper text-purple-400">
              <Shield className="w-4 h-4" />
            </div>
            <div className="global-stat-details">
              <span className="global-stat-label">DOMINANT AFFINITY</span>
              <span className="global-stat-value">
                {registryStats?.dominantAffinity || 'AGI'}
              </span>
            </div>
          </div>
        </div>

        {/* Current User Standing Bar (Flutter Parity) */}
        {profile && (
          <div
            className="current-user-standing-card"
            style={{
              background: 'linear-gradient(135deg, #162544, #131c36)',
              borderColor: 'rgba(0, 229, 255, 0.6)',
            }}
          >
            <div className="standing-left">
              <div
                className="standing-rank-badge"
                style={{ backgroundColor: '#00e5ff', color: '#000' }}
              >
                #{currentUserRank || 1}
              </div>
              <div>
                <span className="standing-label">YOUR ACTIVE STANDING</span>
                <div className="standing-user-name">
                  {profile.display_name} <span className="you-badge">(YOU)</span>
                  <span className="standing-hunter-id"> • {profile.hunter_id}</span>
                </div>
                <div style={{ color: '#67e8f9', fontSize: '0.85rem', fontWeight: 600 }}>
                  Level {profile.current_level} • {profile.current_rank}
                </div>
              </div>
            </div>

            <div className="standing-stats">
              <div className="stat-pill">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>LVL {profile.current_level}</span>
              </div>
              <div className="stat-pill">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span style={{ color: '#ffb300', fontWeight: 'bold' }}>
                  {profile.total_xp.toLocaleString()} XP
                </span>
              </div>
              <div className="stat-pill">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>{profile.clean_days}d STREAK</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rank Filter Tabs (Matching Flutter: ALL, S-Rank, A-Rank, B-Rank, C-Rank) */}
      <div style={{ display: 'flex', gap: '8px', padding: '12px 0', overflowX: 'auto' }}>
        {['ALL', 'S-Rank', 'A-Rank', 'B-Rank', 'C-Rank'].map((rf) => {
          const isSel = rankFilter === rf;
          return (
            <button
              key={rf}
              type="button"
              onClick={() => {
                audioService.playClick();
                setRankFilter(rf);
              }}
              style={{
                backgroundColor: isSel ? '#00e5ff' : '#131828',
                color: isSel ? '#000' : '#fff',
                borderColor: isSel ? '#00e5ff' : '#222c42',
                borderRadius: '10px',
                padding: '8px 16px',
                fontWeight: 'bold',
                fontSize: '12px',
                border: '1px solid',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {rf}
            </button>
          );
        })}
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="leaderboard-controls">
        <div className="filter-buttons-group">
          <button
            type="button"
            onClick={() => {
              audioService.playClick();
              setFilter('xp');
            }}
            className={`filter-tab-btn ${filter === 'xp' ? 'active' : ''}`}
          >
            <Flame className="w-4 h-4 mr-1 text-amber-400" />
            <span>SORT BY TOTAL XP</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioService.playClick();
              setFilter('level');
            }}
            className={`filter-tab-btn ${filter === 'level' ? 'active' : ''}`}
          >
            <Zap className="w-4 h-4 mr-1 text-cyan-400" />
            <span>SORT BY LEVEL</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioService.playClick();
              setFilter('clean_days');
            }}
            className={`filter-tab-btn ${filter === 'clean_days' ? 'active' : ''}`}
          >
            <TrendingUp className="w-4 h-4 mr-1 text-emerald-400" />
            <span>SORT BY STREAK</span>
          </button>
        </div>

        <div className="search-and-refresh">
          <div className="search-input-wrapper">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Hunter name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="leaderboard-search-input"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              audioService.playClick();
              fetchLeaderboard();
            }}
            className="btn-refresh"
            title="Refresh Leaderboard"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="leaderboard-table-wrapper">
        <div className="leaderboard-table-header">
          <div className="col-rank">RANK</div>
          <div className="col-hunter">HUNTER IDENTITY</div>
          <div className="col-affinity">AFFINITY</div>
          <div className="col-level">LEVEL</div>
          <div className="col-clean">STREAK</div>
          <div className="col-xp">TOTAL EXP</div>
        </div>

        <div className="leaderboard-rows-list">
          {sortedHunters.map((hunter, index) => {
            const rankNum = index + 1;
            const rankStyle = getRankBadgeStyle(rankNum);
            const isCurrentUser =
              profile && (hunter.id === profile.id || hunter.hunter_id === profile.hunter_id);
            const hunterRankInfo = getRankBadgeInfo(hunter.current_rank);

            return (
              <motion.div
                key={hunter.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.4) }}
                onClick={() => setSelectedPlayerUid(hunter.id)}
                style={{ cursor: 'pointer' }}
                className={`leaderboard-row ${rankStyle.bg} ${
                  isCurrentUser ? 'current-user-row' : ''
                } hover:border-cyan-500/40 transition`}
              >
                {/* Rank Column */}
                <div className="col-rank">
                  <div className={`rank-position-pill ${rankStyle.bg}`}>
                    {rankStyle.icon}
                    <span>{rankStyle.label}</span>
                  </div>
                </div>

                {/* Hunter Identity Column */}
                <div className="col-hunter">
                  <div className="hunter-avatar-mini">
                    <User className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="hunter-text-meta">
                    <div className="hunter-name-row">
                      <span className="hunter-name-text">{hunter.display_name}</span>
                      {isCurrentUser && <span className="you-badge">[YOU]</span>}
                      <span
                        className="hunter-rank-tag"
                        style={{ color: hunterRankInfo.color, borderColor: hunterRankInfo.color }}
                      >
                        {hunter.current_rank}
                      </span>
                    </div>
                    <span className="hunter-id-text">
                      {hunter.equipped_title || 'The Awakened'} • {hunter.hunter_id}
                    </span>
                  </div>
                </div>

                {/* Affinity Column */}
                <div className="col-affinity">
                  <span className={`affinity-pill ${hunter.affinity?.toLowerCase() || 'agi'}`}>
                    {hunter.affinity || 'AGI'}
                  </span>
                </div>

                {/* Level Column */}
                <div className="col-level">
                  <span className="level-highlight">LVL {hunter.current_level}</span>
                </div>

                {/* Streak Column */}
                <div className="col-clean">
                  <span className="clean-days-val">{hunter.clean_days}d</span>
                  <span className="clean-days-sub">streak</span>
                </div>

                {/* XP Column */}
                <div className="col-xp">
                  <span className="xp-val" style={{ color: '#ffb300', fontWeight: 'bold' }}>
                    {hunter.total_xp.toLocaleString()} XP
                  </span>
                </div>
              </motion.div>
            );
          })}

          {sortedHunters.length === 0 && !loading && (
            <div className="empty-leaderboard">
              <Shield className="w-10 h-10 text-slate-600 mb-3" />
              <p className="font-bold text-slate-300">No Hunters Found</p>
              <p className="text-sm text-slate-500 mt-1">
                No hunters match the current filter criteria.
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedPlayerUid && (
        <PlayerProfileModal
          playerUid={selectedPlayerUid}
          onClose={() => setSelectedPlayerUid(null)}
        />
      )}
    </div>
  );
};

export default Leaderboard;
