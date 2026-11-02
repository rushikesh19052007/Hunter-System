import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  UserPlus,
  UserCheck,
  Clock,
  Eye,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  type PublicPlayer,
  type FriendshipStatus,
  searchHunters,
  getFriendshipStatus,
  sendFriendRequest,
  acceptFriendRequest,
} from '@/lib/social-service';
import { useHunter } from '@/lib/hunter-store';
import { useAuth } from '@/lib/auth';
import { getRankBadgeInfo } from '@/lib/game-engine';
import { PlayerProfileModal } from './player-profile-modal';

interface AddFriendModalProps {
  onClose: () => void;
  onFriendAdded?: () => void;
}

export const AddFriendModal: React.FC<AddFriendModalProps> = ({ onClose, onFriendAdded }) => {
  const { profile: currentProfile } = useHunter();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [results, setResults] = useState<PublicPlayer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayerUid, setSelectedPlayerUid] = useState<string | null>(null);

  // Status mapping for search results
  const [statusMap, setStatusMap] = useState<Record<string, FriendshipStatus>>({});
  const [actionLoadingMap, setActionLoadingMap] = useState<Record<string, boolean>>({});

  const debounceTimerRef = useRef<any>(null);

  /**
   * Automatic lowercase handling:
   * Converts input to lowercase on keystroke and paste.
   * Special exception: If user types "HUNTR-", retains uppercase format for Hunter ID lookup.
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val.trim().toLowerCase().startsWith('huntr-')) {
      val = val.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    } else {
      val = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    }
    setSearchTerm(val);
  };

  // Debounced search effect
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!searchTerm.trim()) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const found = await searchHunters(searchTerm, user?.id || '');
        setResults(found);

        // Fetch friendship statuses
        if (user?.id && found.length > 0) {
          const statuses: Record<string, FriendshipStatus> = {};
          await Promise.all(
            found.map(async (p) => {
              statuses[p.uid] = await getFriendshipStatus(user.id, p.uid);
            })
          );
          setStatusMap(statuses);
        }
      } catch (err: any) {
        console.error('Search error:', err);
        setError('Error querying Hunter network. Please verify connection.');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchTerm, user?.id]);

  const handleAction = async (player: PublicPlayer) => {
    if (!currentProfile || !user) return;
    const currentStatus = statusMap[player.uid] || 'none';

    setActionLoadingMap((prev) => ({ ...prev, [player.uid]: true }));
    try {
      if (currentStatus === 'none') {
        await sendFriendRequest(
          {
            uid: currentProfile.id,
            username: currentProfile.username,
            hunterId: currentProfile.hunter_id,
            displayName: currentProfile.display_name,
            level: currentProfile.current_level,
            rank: currentProfile.current_rank,
          },
          player
        );
        setStatusMap((prev) => ({ ...prev, [player.uid]: 'request_sent' }));
        onFriendAdded?.();
      } else if (currentStatus === 'request_received') {
        const requestId = `${player.uid}_${currentProfile.id}`;
        await acceptFriendRequest(requestId, player.uid, currentProfile.id);
        setStatusMap((prev) => ({ ...prev, [player.uid]: 'friends' }));
        onFriendAdded?.();
      }
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [player.uid]: false }));
    }
  };

  return (
    <>
      <div className="modal-backdrop">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="modal-dialog"
          style={{ maxWidth: '520px' }}
        >
          {/* Header */}
          <div className="modal-header">
            <h3 className="modal-title">
              <UserPlus size={18} color="var(--cyan-primary)" /> ADD ALLIED HUNTER
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="modal-close-btn"
            >
              <X size={18} />
            </button>
          </div>

          <div className="modal-body">
            {/* Search Input Bar */}
            <div className="form-group">
              <label className="form-label">
                Search Username or Permanent Hunter ID
              </label>
              <div className="social-search-input-wrap">
                <Search size={16} color="#64748b" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleInputChange}
                  placeholder="e.g. mahesh or HUNTR-7K4P9X2M"
                  autoFocus
                  className="social-search-input"
                  style={{ fontFamily: 'var(--font-tech)', fontSize: '0.95rem' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', fontFamily: 'var(--font-tech)', marginTop: '4px' }}>
                <span>Auto lowercase conversion</span>
                <span>Exact Hunter ID or prefix match</span>
              </div>
            </div>

            {/* Search State / Results */}
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {loading ? (
                <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--cyan-primary)', fontSize: '0.8rem', fontFamily: 'var(--font-tech)', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--cyan-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                  SCANNING HUNTER REGISTRY...
                </div>
              ) : error ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: '#f43f5e', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <AlertCircle size={16} /> {error}
                </div>
              ) : searchTerm.trim() && results.length === 0 ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: '#64748b', fontSize: '0.85rem', fontFamily: 'var(--font-tech)' }}>
                  No active Hunter found matching &quot;{searchTerm}&quot;.
                </div>
              ) : !searchTerm.trim() ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: '#475569', fontSize: '0.82rem', fontFamily: 'var(--font-tech)' }}>
                  Type a lowercase username or Hunter ID above to initiate target search.
                </div>
              ) : (
                results.map((player) => {
                  const rankInfo = getRankBadgeInfo(player.currentRank);
                  const status = statusMap[player.uid] || 'none';
                  const isActionLoading = actionLoadingMap[player.uid] || false;

                  return (
                    <div
                      key={player.uid}
                      style={{
                        background: 'rgba(10, 14, 32, 0.75)',
                        border: '1px solid rgba(56, 189, 248, 0.15)',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            backgroundColor: `${rankInfo.color}15`,
                            border: `1.5px solid ${rankInfo.color}`,
                            color: rankInfo.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '0.95rem',
                            fontFamily: 'var(--font-tech)',
                            flexShrink: 0,
                          }}
                        >
                          {player.currentRank.split('-')[0]}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '0.88rem', color: '#fff' }}>
                              {player.displayName}
                            </span>
                            <span
                              style={{
                                backgroundColor: `${rankInfo.color}20`,
                                color: rankInfo.color,
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontSize: '0.65rem',
                                fontWeight: 900,
                                fontFamily: 'var(--font-tech)',
                              }}
                            >
                              {rankInfo.label}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--cyan-primary)', fontFamily: 'var(--font-tech)' }}>
                            @{player.username}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                            {player.hunterId} • LVL {player.currentLevel}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => setSelectedPlayerUid(player.uid)}
                          className="btn-hologram-ghost btn-sm"
                          title="View Hunter Dossier"
                        >
                          <Eye size={13} />
                        </button>

                        {/* Friendship State Button */}
                        {player.uid === user?.id ? (
                          <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'var(--font-tech)', padding: '6px 8px' }}>
                            This is You
                          </span>
                        ) : status === 'friends' ? (
                          <span className="tag-pill-open" style={{ padding: '6px 10px' }}>
                            <UserCheck size={13} /> Friends
                          </span>
                        ) : status === 'request_sent' ? (
                          <span className="tag-pill-request" style={{ padding: '6px 10px' }}>
                            <Clock size={13} /> Sent
                          </span>
                        ) : status === 'request_received' ? (
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleAction(player)}
                            className="btn-hologram-cyan btn-sm"
                          >
                            Accept
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleAction(player)}
                            className="btn-hologram-cyan btn-sm"
                          >
                            <UserPlus size={13} /> Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Selected Profile Modal */}
      {selectedPlayerUid && (
        <PlayerProfileModal
          playerUid={selectedPlayerUid}
          onClose={() => setSelectedPlayerUid(null)}
        />
      )}
    </>
  );
};
