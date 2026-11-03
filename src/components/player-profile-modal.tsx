import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  Check,
  Shield,
  Zap,
  Flame,
  Brain,
  Eye,
  Award,
  Sparkles,
  UserCheck,
  UserPlus,
  Clock,
  Users,
} from 'lucide-react';
import {
  type PublicPlayer,
  type FriendshipStatus,
  getFriendshipStatus,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
  getPublicPlayer,
} from '@/lib/social-service';
import { subscribeToUserPresence } from '@/lib/presence-service';
import { useHunter } from '@/lib/hunter-store';
import { useAuth } from '@/lib/auth';
import { getRankBadgeInfo, HUNTER_STATS, type HunterStat } from '@/lib/game-engine';

interface PlayerProfileModalProps {
  playerUid: string | null;
  initialPlayer?: PublicPlayer | null;
  onClose: () => void;
  onFriendStatusChange?: () => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  playerUid,
  initialPlayer,
  onClose,
  onFriendStatusChange,
}) => {
  const { profile: currentProfile } = useHunter();
  const { user } = useAuth();

  const [player, setPlayer] = useState<PublicPlayer | null>(initialPlayer || null);
  const [loading, setLoading] = useState<boolean>(!initialPlayer);
  const [copiedHid, setCopiedHid] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [friendStatus, setFriendStatus] = useState<FriendshipStatus>('none');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  

  // Load player details
  useEffect(() => {
    let active = true;
    const fetchPlayer = async () => {
      if (!playerUid) return;
      if (!initialPlayer) {
        setLoading(true);
        const data = await getPublicPlayer(playerUid);
        if (active) {
          setPlayer(data);
          setLoading(false);
        }
      }
    };
    fetchPlayer();
    return () => {
      active = false;
    };
  }, [playerUid, initialPlayer]);

  // Subscribe to live online presence
  useEffect(() => {
    if (!playerUid) return;
    const unsubscribe = subscribeToUserPresence(playerUid, (online) => {
      setIsOnline(online);
    });
    return unsubscribe;
  }, [playerUid]);

  // Check friendship status
  useEffect(() => {
    let active = true;
    const checkStatus = async () => {
      if (user?.id && playerUid) {
        const st = await getFriendshipStatus(user.id, playerUid);
        if (active) setFriendStatus(st);
      }
    };
    checkStatus();
    return () => {
      active = false;
    };
  }, [user?.id, playerUid]);

  const copyHunterId = () => {
    if (player?.hunterId) {
      navigator.clipboard.writeText(player.hunterId);
      setCopiedHid(true);
      setTimeout(() => setCopiedHid(false), 2000);
    }
  };

  const handleFriendAction = async () => {
    if (!currentProfile || !player || actionLoading) return;
    setActionLoading(true);

    try {
      if (friendStatus === 'none') {
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
        setFriendStatus('request_sent');
        onFriendStatusChange?.();
      } else if (friendStatus === 'request_received') {
        const requestId = `${player.uid}_${currentProfile.id}`;
        await acceptFriendRequest(requestId, player.uid, currentProfile.id);
        setFriendStatus('friends');
        onFriendStatusChange?.();
      } else if (friendStatus === 'friends') {
        if (confirm(`Remove ${player.displayName} from your squad?`)) {
          await removeFriend(currentProfile.id, player.uid);
          setFriendStatus('none');
          onFriendStatusChange?.();
        }
      }
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const rankInfo = getRankBadgeInfo(player?.currentRank || 'E-Rank');
  const isSelf = user?.id === playerUid;

  if (!playerUid) return null;

  return (
    <div className="modal-backdrop">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="modal-dialog"
        style={{ maxWidth: '540px' }}
      >
        {/* Header */}
        <div className="modal-header">
          <h3 className="modal-title">
            <Sparkles size={18} color="var(--cyan-primary)" /> HUNTER DOSSIER
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        {loading || !player ? (
          <div style={{ padding: '60px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--cyan-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--cyan-primary)', fontFamily: 'var(--font-tech)', letterSpacing: '1px' }}>
              RETRIEVING HUNTER DOSSIER...
            </span>
          </div>
        ) : (
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header / Avatar & Identity */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div
                style={{
                  position: 'relative',
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  backgroundColor: `${rankInfo.color}15`,
                  border: `2px solid ${rankInfo.color}`,
                  color: rankInfo.color,
                  boxShadow: `0 0 20px ${rankInfo.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1.5rem',
                  fontFamily: 'var(--font-tech)',
                  flexShrink: 0,
                }}
              >
                {player.currentRank?.split('-')[0] || 'E'}
                {/* Live Online Presence Dot */}
                <span
                  className={`presence-dot ${isOnline ? 'online' : 'offline'}`}
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    width: '12px',
                    height: '12px',
                    border: '2px solid #070a18',
                  }}
                  title={isOnline ? 'Hunter is Online' : 'Hunter is Offline'}
                />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', margin: 0, fontFamily: 'var(--font-display)' }}>
                    {player.displayName}
                  </h3>
                  <span
                    style={{
                      backgroundColor: `${rankInfo.color}25`,
                      color: rankInfo.color,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 900,
                      fontFamily: 'var(--font-tech)',
                    }}
                  >
                    {rankInfo.label}
                  </span>
                </div>

                {/* Lowercase Username */}
                <div style={{ fontSize: '0.85rem', color: 'var(--cyan-primary)', fontFamily: 'var(--font-tech)', marginTop: '2px' }}>
                  @{player.username}
                </div>

                {/* Hunter ID with Copy */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      backgroundColor: 'rgba(6, 10, 24, 0.8)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      color: '#cbd5e1',
                      letterSpacing: '1px',
                    }}
                  >
                    {player.hunterId}
                  </span>
                  <button
                    type="button"
                    onClick={copyHunterId}
                    className="btn-hologram-ghost btn-sm"
                    style={{ padding: '3px 8px' }}
                    title="Copy Hunter ID"
                  >
                    {copiedHid ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  </button>
                  {copiedHid && <span style={{ fontSize: '0.7rem', color: '#10b981', fontFamily: 'var(--font-tech)' }}>Copied!</span>}
                </div>
              </div>
            </div>

            {/* Status / Title / Guild Badges */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                backgroundColor: 'rgba(10, 14, 32, 0.75)',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid rgba(56, 189, 248, 0.15)',
              }}
            >
              <div>
                <span style={{ color: '#64748b', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '1px', fontFamily: 'var(--font-tech)', display: 'block' }}>
                  Equipped Title
                </span>
                <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                  <Award size={13} /> {player.equippedTitle || 'The Awakened'}
                </span>
              </div>

              <div>
                <span style={{ color: '#64748b', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '1px', fontFamily: 'var(--font-tech)', display: 'block' }}>
                  Hunter Guild
                </span>
                <span style={{ color: '#c084fc', fontWeight: 'bold', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                  <Users size={13} />{' '}
                  {player.guildName ? `${player.guildName} [${player.guildTag}]` : 'Free Agent'}
                </span>
              </div>

              <div>
                <span style={{ color: '#64748b', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '1px', fontFamily: 'var(--font-tech)', display: 'block' }}>
                  Progression Level
                </span>
                <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.85rem', marginTop: '2px', display: 'block' }}>
                  Level {player.currentLevel} • {player.totalXp.toLocaleString()} XP
                </span>
              </div>

              <div>
                <span style={{ color: '#64748b', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '1px', fontFamily: 'var(--font-tech)', display: 'block' }}>
                  Transmission State
                </span>
                <span
                  className="presence-indicator"
                  style={{
                    color: isOnline ? '#34d399' : '#64748b',
                    fontWeight: 'bold',
                    marginTop: '2px',
                  }}
                >
                  <span className={`presence-dot ${isOnline ? 'online' : 'offline'}`} />
                  {isOnline ? 'Connected (Online)' : 'Dormant (Offline)'}
                </span>
              </div>
            </div>

            {/* Core Stats Overview */}
            {player.stats && (
              <div>
                <h4 style={{ fontSize: '0.75rem', fontFamily: 'var(--font-tech)', letterSpacing: '1px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Primary Attributes
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                  {(['STR', 'AGI', 'VIT', 'INT', 'PERC'] as HunterStat[]).map((st) => {
                    const cfg = HUNTER_STATS[st];
                    const val = player.stats?.[st] ?? 10;
                    return (
                      <div
                        key={st}
                        style={{
                          backgroundColor: 'rgba(6, 10, 24, 0.8)',
                          border: '1px solid rgba(56, 189, 248, 0.15)',
                          borderRadius: '8px',
                          padding: '8px 4px',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '0.65rem', color: cfg.color, fontWeight: 900, fontFamily: 'var(--font-tech)' }}>
                          {st}
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', marginTop: '2px' }}>
                          {val}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn-hologram-ghost"
          >
            Close
          </button>

          {!isSelf && player && (
            friendStatus === 'friends' ? (
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleFriendAction}
                className="btn-hologram-danger"
              >
                Sever Friendship
              </button>
            ) : friendStatus === 'request_sent' ? (
              <button
                type="button"
                disabled
                className="btn-hologram-ghost"
                style={{ opacity: 0.6 }}
              >
                <Clock size={14} /> Request Sent
              </button>
            ) : friendStatus === 'request_received' ? (
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleFriendAction}
                className="btn-hologram-cyan"
              >
                <Check size={14} /> Accept Request
              </button>
            ) : (
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleFriendAction}
                className="btn-hologram-cyan"
              >
                <UserPlus size={14} /> Add Friend
              </button>
            )
          )}
        </div>
      </motion.div>
    </div>
  );
};
