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
  Sparkles,
  ChevronUp,
} from 'lucide-react';
import { useHunter } from '@/lib/hunter-store';
import {
  type Profile,
  getRankBadgeInfo,
  generateHunterId,
  migrateProfile,
} from '@/lib/game-engine';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type SortFilter = 'xp' | 'level' | 'clean_days';

// Legendary seed hunters to ensure 100 ranks are populated if database is fresh
const SEED_HUNTERS: Profile[] = [
  migrateProfile({ id: 'legend-1', hunter_id: 'HUNTER-THOMAS-STR', display_name: 'Thomas Andre', total_xp: 98500, current_level: 98, stats: { STR: 180, AGI: 140, VIT: 195, INT: 110, PERC: 130 }, clean_days: 720, current_rank: 'S-Rank', affinity: 'STR' }),
  migrateProfile({ id: 'legend-2', hunter_id: 'HUNTER-LIUZHI-AGI', display_name: 'Liu Zhigang', total_xp: 94200, current_level: 95, stats: { STR: 165, AGI: 190, VIT: 155, INT: 120, PERC: 160 }, clean_days: 640, current_rank: 'S-Rank', affinity: 'AGI' }),
  migrateProfile({ id: 'legend-3', hunter_id: 'HUNTER-CHAHAE-AGI', display_name: 'Cha Hae-In', total_xp: 76000, current_level: 82, stats: { STR: 135, AGI: 175, VIT: 120, INT: 105, PERC: 160 }, clean_days: 480, current_rank: 'A-Rank', affinity: 'AGI' }),
  migrateProfile({ id: 'legend-4', hunter_id: 'HUNTER-CHOIJN-INT', display_name: 'Choi Jong-In', total_xp: 72500, current_level: 80, stats: { STR: 95, AGI: 110, VIT: 100, INT: 185, PERC: 140 }, clean_days: 410, current_rank: 'A-Rank', affinity: 'INT' }),
  migrateProfile({ id: 'legend-5', hunter_id: 'HUNTER-BAEKYN-STR', display_name: 'Baek Yoonho', total_xp: 68400, current_level: 78, stats: { STR: 170, AGI: 130, VIT: 150, INT: 85, PERC: 120 }, clean_days: 365, current_rank: 'A-Rank', affinity: 'STR' }),
  migrateProfile({ id: 'legend-6', hunter_id: 'HUNTER-MINBYN-VIT', display_name: 'Min Byung-Gyu', total_xp: 59000, current_level: 72, stats: { STR: 80, AGI: 95, VIT: 165, INT: 150, PERC: 130 }, clean_days: 310, current_rank: 'B-Rank', affinity: 'VIT' }),
  migrateProfile({ id: 'legend-7', hunter_id: 'HUNTER-WOOJIN-PERC', display_name: 'Woo Jin-Chul', total_xp: 54200, current_level: 68, stats: { STR: 120, AGI: 135, VIT: 125, INT: 115, PERC: 170 }, clean_days: 280, current_rank: 'B-Rank', affinity: 'PERC' }),
  migrateProfile({ id: 'legend-8', hunter_id: 'HUNTER-GOHGUN-VIT', display_name: 'Go Gun-Hee', total_xp: 49800, current_level: 65, stats: { STR: 130, AGI: 110, VIT: 140, INT: 145, PERC: 155 }, clean_days: 850, current_rank: 'B-Rank', affinity: 'VIT' }),
  migrateProfile({ id: 'legend-9', hunter_id: 'HUNTER-YOOJIN-VIT', display_name: 'Yoo Jinho', total_xp: 22000, current_level: 38, stats: { STR: 65, AGI: 60, VIT: 95, INT: 80, PERC: 75 }, clean_days: 120, current_rank: 'C-Rank', affinity: 'VIT' }),
  migrateProfile({ id: 'legend-10', hunter_id: 'HUNTER-LEEMIN-INT', display_name: 'Lee Joohee', total_xp: 14500, current_level: 28, stats: { STR: 40, AGI: 55, VIT: 65, INT: 90, PERC: 80 }, clean_days: 90, current_rank: 'D-Rank', affinity: 'INT' }),
];



// Helper to fill up to 100 realistic hunter candidates
const generateTop100Hunters = (): Profile[] => {
  const list: Profile[] = [...SEED_HUNTERS];
  const affinities = ['STR', 'AGI', 'VIT', 'INT', 'PERC'];
  const names = [
    'Alexander', 'Kurokawa', 'Valeria', 'Kenzo', 'Aria Vance', 'Ezekiel', 'Darius',
    'Seraphina', 'Tatsuya', 'Roxanne', 'Dmitri', 'Kaede', 'Zephyr', 'Orion', 'Bao',
    'Cassian', 'Mei-Ling', 'Soren', 'Thorne', 'Althea', 'Gideon', 'Raven', 'Leon',
    'Nadia', 'Kaelen', 'Vesper', 'Cipher', 'Ignis', 'Lyra', 'Jax', 'Nova', 'Fenris',
  ];

  let currentLevel = 26;
  let currentXp = 12000;
  let currentClean = 80;

  for (let i = 11; i <= 100; i++) {
    const nameIndex = (i - 11) % names.length;
    const aff = affinities[i % affinities.length];
    const generatedUid = `hseed-${i.toString().padStart(3, '0')}`;
    const hId = generateHunterId(generatedUid, aff);

    currentLevel = Math.max(1, currentLevel - (i % 3 === 0 ? 1 : 0));
    currentXp = Math.max(150, Math.floor(currentXp * 0.96));
    currentClean = Math.max(1, currentClean - (i % 2 === 0 ? 1 : 0));

    let rank = 'E-Rank';
    if (currentLevel >= 70) rank = 'A-Rank';
    else if (currentLevel >= 45) rank = 'B-Rank';
    else if (currentLevel >= 25) rank = 'C-Rank';
    else if (currentLevel >= 10) rank = 'D-Rank';

    list.push(migrateProfile({
      id: `gen-hunter-${i}`,
      hunter_id: hId,
      display_name: `${names[nameIndex]} ${String.fromCharCode(65 + (i % 26))}.`,
      total_xp: currentXp,
      current_level: currentLevel,
      stats: { [aff]: 10 + currentLevel * 2 },
      clean_days: currentClean,
      current_rank: rank,
      affinity: aff,
    }));
  }

  return list;
};

export const Leaderboard: React.FC = () => {
  const { profile } = useHunter();
  const [filter, setFilter] = useState<SortFilter>('xp');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hunters, setHunters] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch top 100 hunters from Supabase profiles table or use realistic seeded roster
  const fetchLeaderboard = async () => {
    setLoading(true);
    let fetchedHunters: Profile[] = [];

    if (isSupabaseConfigured && supabase) {
      try {
        const orderColumn = filter === 'xp' ? 'total_xp' : filter === 'level' ? 'current_level' : 'clean_days';
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order(orderColumn, { ascending: false })
          .limit(100);

        if (!error && data && data.length > 0) {
          fetchedHunters = data.map((d: Record<string, unknown>) => migrateProfile({
            id: d.id as string,
            hunter_id: (d.hunter_id as string) || generateHunterId(d.id as string, (d.affinity as string) || 'AGI'),
            display_name: (d.display_name as string) || 'Hunter Candidate',
            total_xp: (d.total_xp as number) || 0,
            current_level: (d.current_level as number) || 1,
            stats: (d.stats as Record<string, number>) || {},
            clean_days: (d.clean_days as number) || 0,
            current_rank: (d.current_rank as string) || 'E-Rank',
            affinity: (d.affinity as string) || 'AGI',
          }));
        }
      } catch (err) {
        console.warn('[Leaderboard] Supabase fetch fallback to local pool:', err);
      }
    }

    // If fetched is empty, use seed pool
    if (fetchedHunters.length === 0) {
      fetchedHunters = generateTop100Hunters();
    }

    // Merge or replace current user profile into the pool so user is always present
    if (profile) {
      const existingIdx = fetchedHunters.findIndex((h) => h.id === profile.id || h.hunter_id === profile.hunter_id);
      if (existingIdx !== -1) {
        fetchedHunters[existingIdx] = profile;
      } else {
        fetchedHunters.push(profile);
      }
    }

    setHunters(fetchedHunters);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [filter, profile?.total_xp, profile?.current_level, profile?.clean_days]);

  // Sort and filter hunters
  const sortedHunters = useMemo(() => {
    const list = [...hunters];

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
      // clean_days
      return (b.clean_days || 0) - (a.clean_days || 0);
    });

    if (!searchQuery.trim()) {
      return list.slice(0, 100);
    }

    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (h) =>
        h.display_name.toLowerCase().includes(q) ||
        h.hunter_id?.toLowerCase().includes(q) ||
        h.current_rank.toLowerCase().includes(q)
    ).slice(0, 100);
  }, [hunters, filter, searchQuery]);

  // Find current user's global position
  const currentUserRank = useMemo(() => {
    if (!profile) return null;
    const sorted = [...hunters].sort((a, b) => {
      if (filter === 'xp') return (b.total_xp || 0) - (a.total_xp || 0);
      if (filter === 'level') return (b.current_level || 0) - (a.current_level || 0);
      return (b.clean_days || 0) - (a.clean_days || 0);
    });

    const index = sorted.findIndex((h) => h.id === profile.id || h.hunter_id === profile.hunter_id);
    return index !== -1 ? index + 1 : null;
  }, [hunters, profile, filter]);

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
            <h1 className="leaderboard-title">GLOBAL HUNTER REGISTRY</h1>
          </div>
          <p className="leaderboard-subtitle">
            Live worldwide standings certified by the Hunter Association Archives. Top 100 Awakened.
          </p>
        </div>

        {/* Current User Standing Banner */}
        {profile && currentUserRank && (
          <div className="current-user-standing-card">
            <div className="standing-left">
              <div className="standing-rank-badge">
                #{currentUserRank}
              </div>
              <div>
                <span className="standing-label">YOUR ACTIVE STANDING</span>
                <div className="standing-user-name">
                  {profile.display_name}
                  <span className="standing-hunter-id">({profile.hunter_id})</span>
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
                <span>{profile.total_xp} XP</span>
              </div>
              <div className="stat-pill">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>{profile.clean_days}d STREAK</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="leaderboard-controls">
        <div className="filter-buttons-group">
          <button
            type="button"
            onClick={() => setFilter('xp')}
            className={`filter-tab-btn ${filter === 'xp' ? 'active' : ''}`}
          >
            <Flame className="w-4 h-4 mr-1 text-amber-400" />
            <span>SORT BY TOTAL XP</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('level')}
            className={`filter-tab-btn ${filter === 'level' ? 'active' : ''}`}
          >
            <Zap className="w-4 h-4 mr-1 text-cyan-400" />
            <span>SORT BY LEVEL</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('clean_days')}
            className={`filter-tab-btn ${filter === 'clean_days' ? 'active' : ''}`}
          >
            <TrendingUp className="w-4 h-4 mr-1 text-emerald-400" />
            <span>SORT BY CLEAN DAYS</span>
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
            onClick={fetchLeaderboard}
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
          <div className="col-clean">CLEAN DAYS</div>
          <div className="col-xp">TOTAL EXP</div>
        </div>

        <div className="leaderboard-rows-list">
          {sortedHunters.map((hunter, index) => {
            const rankNum = index + 1;
            const rankStyle = getRankBadgeStyle(rankNum);
            const isCurrentUser = profile && (hunter.id === profile.id || hunter.hunter_id === profile.hunter_id);
            const hunterRankInfo = getRankBadgeInfo(hunter.current_rank);

            return (
              <motion.div
                key={hunter.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.4) }}
                className={`leaderboard-row ${rankStyle.bg} ${
                  isCurrentUser ? 'current-user-row' : ''
                }`}
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
                      {isCurrentUser && (
                        <span className="you-badge">[YOU]</span>
                      )}
                      <span
                        className="hunter-rank-tag"
                        style={{ color: hunterRankInfo.color, borderColor: hunterRankInfo.color }}
                      >
                        {hunter.current_rank}
                      </span>
                    </div>
                    <span className="hunter-id-text">{hunter.hunter_id}</span>
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

                {/* Clean Days Column */}
                <div className="col-clean">
                  <span className="clean-days-val">{hunter.clean_days}d</span>
                  <span className="clean-days-sub">streak</span>
                </div>

                {/* XP Column */}
                <div className="col-xp">
                  <span className="xp-val">{hunter.total_xp.toLocaleString()} XP</span>
                </div>
              </motion.div>
            );
          })}

          {sortedHunters.length === 0 && (
            <div className="empty-leaderboard">
              <p>No Hunters matching search query.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
