import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  Eye,
  Check,
  X,
  Search,
  Sparkles,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import {
  type Friend,
  type FriendRequest,
  subscribeToFriends,
  subscribeToIncomingFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
} from '@/lib/social-service';
import { isPresenceOnline, type PresenceData } from '@/lib/presence-service';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { useHunter } from '@/lib/hunter-store';
import { getRankBadgeInfo } from '@/lib/game-engine';
import { AddFriendModal } from '@/components/add-friend-modal';
import { PlayerProfileModal } from '@/components/player-profile-modal';

export const FriendsPage: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useHunter();

  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedPlayerUid, setSelectedPlayerUid] = useState<string | null>(null);

  // Presence map for friends: uid -> boolean
  const [presenceMap, setPresenceMap] = useState<Record<string, boolean>>({});

  // 1. Subscribe to real-time friends
  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);

    const unsub = subscribeToFriends(user.id, (list) => {
      setFriends(list);
      setLoading(false);
    });

    return () => unsub();
  }, [user?.id]);

  // 2. Subscribe to real-time incoming friend requests
  useEffect(() => {
    if (!user?.id) return;

    const unsub = subscribeToIncomingFriendRequests(user.id, (list) => {
      setRequests(list);
    });

    return () => unsub();
  }, [user?.id]);

  // 3. Subscribe to real-time presence for each friend
  useEffect(() => {
    if (friends.length === 0) {
      setPresenceMap({});
      return;
    }

    const unsubs: (() => void)[] = [];

    friends.forEach((friend) => {
      const pDoc = doc(firestore, 'presence', friend.uid);
      const unsub = onSnapshot(
        pDoc,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as PresenceData;
            setPresenceMap((prev) => ({
              ...prev,
              [friend.uid]: isPresenceOnline(data),
            }));
          } else {
            setPresenceMap((prev) => ({
              ...prev,
              [friend.uid]: false,
            }));
          }
        },
        (err) => {
          console.warn('Presence listen error for', friend.uid, err);
        }
      );
      unsubs.push(unsub);
    });

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [friends]);

  // Handle Accept
  const handleAcceptRequest = async (req: FriendRequest) => {
    try {
      await acceptFriendRequest(req.id, req.fromUid, req.toUid);
    } catch (err: any) {
      alert(err.message || 'Failed to accept friend request');
    }
  };

  // Handle Decline
  const handleDeclineRequest = async (req: FriendRequest) => {
    try {
      await declineFriendRequest(req.id);
    } catch (err: any) {
      alert(err.message || 'Failed to decline friend request');
    }
  };

  // Handle Remove Friend
  const handleRemoveFriend = async (friend: Friend) => {
    if (!user?.id) return;
    if (confirm(`Sever alliance with ${friend.displayName}?`)) {
      try {
        await removeFriend(user.id, friend.uid);
      } catch (err: any) {
        alert(err.message || 'Failed to remove friend');
      }
    }
  };

  // Filtered and Sorted Friends: Online first, then alphabetical
  const displayedFriends = useMemo(() => {
    let list = [...friends];

    if (searchFilter.trim()) {
      const term = searchFilter.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.username?.toLowerCase().includes(term) ||
          f.displayName?.toLowerCase().includes(term) ||
          f.hunterId?.toLowerCase().includes(term)
      );
    }

    list.sort((a, b) => {
      const onlineA = presenceMap[a.uid] ? 1 : 0;
      const onlineB = presenceMap[b.uid] ? 1 : 0;
      if (onlineA !== onlineB) return onlineB - onlineA; // Online first
      return (a.displayName || a.username || '').localeCompare(b.displayName || b.username || '');
    });

    return list;
  }, [friends, presenceMap, searchFilter]);

  return (
    <div className="social-container">
      {/* Title & Top Action Bar */}
      <div className="social-header">
        <div className="social-title-group">
          <span className="social-badge-label">
            <Users size={14} /> [HUNTER GUILD COMRADES]
          </span>
          <h1 className="social-main-title">SOCIAL SYNDICATE</h1>
          <p className="social-subtitle">
            Manage your network of allied hunters, coordinate party raids, and observe real-time presence.
          </p>
        </div>

        {/* Action Button: + Add Friend */}
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="btn-hologram-cyan"
        >
          <UserPlus size={16} /> + ADD FRIEND
        </button>
      </div>

      {/* Tabs: Friends vs Requests */}
      <div className="social-nav-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('friends')}
          className={`social-nav-tab ${activeTab === 'friends' ? 'active' : ''}`}
        >
          <Users size={15} /> Friends <span className="tab-counter">{friends.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`social-nav-tab ${activeTab === 'requests' ? 'active' : ''}`}
        >
          <Clock size={15} /> Friend Requests
          {requests.length > 0 && (
            <span
              style={{
                backgroundColor: '#f59e0b',
                color: '#000',
                padding: '2px 7px',
                borderRadius: '12px',
                fontSize: '0.7rem',
                fontWeight: 900,
              }}
            >
              {requests.length}
            </span>
          )}
        </button>
      </div>

      {/* Content for Friends Tab */}
      {activeTab === 'friends' && (
        <div>
          {/* Search Filter Bar */}
          {friends.length > 0 && (
            <div className="social-search-bar" style={{ maxWidth: '420px', padding: '8px 12px' }}>
              <div className="social-search-input-wrap">
                <Search size={15} color="#64748b" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value.toLowerCase())}
                  placeholder="Filter squad by username or Hunter ID..."
                  className="social-search-input"
                />
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--cyan-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--cyan-primary)', fontFamily: 'var(--font-tech)', letterSpacing: '1px' }}>
                SYNCHRONIZING HUNTER SQUAD...
              </span>
            </div>
          ) : friends.length === 0 ? (
            /* Empty State */
            <div className="empty-state-box">
              <div className="empty-state-icon">
                <Users size={28} />
              </div>
              <h3 className="empty-state-title">No Comrades Yet</h3>
              <p className="empty-state-desc">
                Your squad is currently empty. Transmit signals across the network and establish alliances with other awakened hunters.
              </p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="btn-hologram-cyan"
                style={{ marginTop: '6px' }}
              >
                <UserPlus size={16} /> Locate Allied Hunters
              </button>
            </div>
          ) : displayedFriends.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', fontSize: '0.85rem', color: '#64748b', fontFamily: 'var(--font-tech)' }}>
              No comrade found matching &quot;{searchFilter}&quot;.
            </div>
          ) : (
            <div className="social-grid">
              {displayedFriends.map((friend) => {
                const online = Boolean(presenceMap[friend.uid]);
                const rankInfo = getRankBadgeInfo(friend.rank);

                return (
                  <div key={friend.uid} className="social-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      {/* Avatar with live presence ring */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '12px',
                            backgroundColor: `${rankInfo.color}15`,
                            border: `1.5px solid ${rankInfo.color}`,
                            color: rankInfo.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '1rem',
                            fontFamily: 'var(--font-tech)',
                          }}
                        >
                          {friend.rank?.split('-')[0] || 'E'}
                        </div>
                        <span
                          className={`presence-dot ${online ? 'online' : 'offline'}`}
                          style={{
                            position: 'absolute',
                            bottom: '-2px',
                            right: '-2px',
                            border: '2px solid #080c1d',
                          }}
                        />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {friend.displayName}
                          </span>
                          <span
                            style={{
                              backgroundColor: `${rankInfo.color}20`,
                              color: rankInfo.color,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                              fontWeight: 900,
                              fontFamily: 'var(--font-tech)',
                            }}
                          >
                            {rankInfo.label}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.78rem', color: 'var(--cyan-primary)', fontFamily: 'var(--font-tech)', marginTop: '2px' }}>
                          @{friend.username}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'var(--font-tech)', marginTop: '4px' }}>
                          <span>LVL {friend.level}</span>
                          <span>•</span>
                          <span className="presence-indicator" style={{ color: online ? '#34d399' : '#64748b' }}>
                            <span className={`presence-dot ${online ? 'online' : 'offline'}`} />
                            {online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions: View Dossier & Remove */}
                    <div className="social-card-footer">
                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                        {friend.hunterId}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedPlayerUid(friend.uid)}
                          className="btn-hologram-ghost btn-sm"
                          title="View Hunter Dossier"
                        >
                          <Eye size={13} /> Dossier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFriend(friend)}
                          className="btn-hologram-danger btn-sm"
                          title="Sever Alliance"
                        >
                          <UserX size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Content for Requests Tab */}
      {activeTab === 'requests' && (
        <div>
          {requests.length === 0 ? (
            <div className="empty-state-box">
              <div className="empty-state-icon">
                <Clock size={28} />
              </div>
              <h3 className="empty-state-title">No Incoming Invitations</h3>
              <p className="empty-state-desc">
                When allied hunters transmit squad invitations, they will manifest here for verification.
              </p>
            </div>
          ) : (
            <div className="social-grid">
              {requests.map((req) => {
                const rankInfo = getRankBadgeInfo(req.fromRank);

                return (
                  <div key={req.id} className="social-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '12px',
                          backgroundColor: `${rankInfo.color}15`,
                          border: `1.5px solid ${rankInfo.color}`,
                          color: rankInfo.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: '1rem',
                          fontFamily: 'var(--font-tech)',
                          flexShrink: 0,
                        }}
                      >
                        {req.fromRank?.split('-')[0] || 'E'}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#fff' }}>
                          {req.fromDisplayName}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--cyan-primary)', fontFamily: 'var(--font-tech)' }}>
                          @{req.fromUsername}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'var(--font-tech)', marginTop: '2px' }}>
                          {req.fromHunterId} • LVL {req.fromLevel}
                        </div>
                      </div>
                    </div>

                    {/* Actions: Accept & Decline */}
                    <div className="social-card-footer">
                      <button
                        type="button"
                        onClick={() => handleDeclineRequest(req)}
                        className="btn-hologram-danger btn-sm"
                      >
                        <X size={14} /> Decline
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAcceptRequest(req)}
                        className="btn-hologram-cyan btn-sm"
                      >
                        <Check size={14} /> Accept Alliance
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Friend Modal */}
      {showAddModal && (
        <AddFriendModal
          onClose={() => setShowAddModal(false)}
          onFriendAdded={() => {}}
        />
      )}

      {/* Selected Player Profile Modal */}
      {selectedPlayerUid && (
        <PlayerProfileModal
          playerUid={selectedPlayerUid}
          onClose={() => setSelectedPlayerUid(null)}
        />
      )}
    </div>
  );
};
