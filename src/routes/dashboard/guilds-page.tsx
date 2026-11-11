import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Users,
  Plus,
  Crown,
  Search,
  Check,
  X,
  Settings,
  UserX,
  Clock,
  Sparkles,
  Flame,
  Zap,
  LogOut,
  AlertCircle,
} from 'lucide-react';
import {
  type Guild,
  type GuildMember,
  type GuildJoinRequest,
  createGuild,
  searchGuilds,
  joinOpenGuild,
  requestToJoinGuild,
  cancelGuildJoinRequest,
  getUserGuildRequest,
  acceptGuildJoinRequest,
  rejectGuildJoinRequest,
  removeGuildMember,
  leaveGuild,
  updateGuildSettings,
  subscribeToGuild,
  subscribeToGuildMembers,
  subscribeToGuildJoinRequests,
} from '@/lib/guild-service';
import { useHunter } from '@/lib/hunter-store';
import { useAuth } from '@/lib/auth';
import { getRankBadgeInfo } from '@/lib/game-engine';
import { PlayerProfileModal } from '@/components/player-profile-modal';

export const GuildsPage: React.FC = () => {
  const { profile, updateProfile } = useHunter();
  const { user } = useAuth();

  // Active Guild View (if member of a guild)
  const [activeGuild, setActiveGuild] = useState<Guild | null>(null);
  const [guildMembers, setGuildMembers] = useState<GuildMember[]>([]);
  const [guildRequests, setGuildRequests] = useState<GuildJoinRequest[]>([]);

  // Browse / Discovery state
  const [guildsList, setGuildsList] = useState<Guild[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [joinTypeFilter, setJoinTypeFilter] = useState<'all' | 'open' | 'request'>('all');
  const [isBrowseLoading, setIsBrowseLoading] = useState<boolean>(true);

  // User pending join requests map: guildId -> request
  const [pendingRequestsMap, setPendingRequestsMap] = useState<Record<string, GuildJoinRequest | null>>({});

  // Modals & Panels
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [selectedPlayerUid, setSelectedPlayerUid] = useState<string | null>(null);

  // Guild Creation Form State
  const [createName, setCreateName] = useState<string>('');
  const [createTag, setCreateTag] = useState<string>('');
  const [createDesc, setCreateDesc] = useState<string>('');
  const [createIcon] = useState<string>('monarch');
  const [createJoinType, setCreateJoinType] = useState<'open' | 'request'>('open');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const isLeader = activeGuild?.leaderUid === user?.id;

  // 1. Subscribe to Active Guild if user has guild_id
  useEffect(() => {
    if (!profile?.guild_id) {
      setActiveGuild(null);
      setGuildMembers([]);
      setGuildRequests([]);
      return;
    }

    const unsubGuild = subscribeToGuild(profile.guild_id, (g) => {
      setActiveGuild(g);
      if (!g) {
        updateProfile({ guild_id: null, guild_role: null, guild_name: null, guild_tag: null });
      }
    });

    const unsubMembers = subscribeToGuildMembers(profile.guild_id, (m) => {
      setGuildMembers(m);
    });

    let unsubRequests = () => {};
    if (profile.guild_role === 'leader') {
      unsubRequests = subscribeToGuildJoinRequests(profile.guild_id, (r) => {
        setGuildRequests(r);
      });
    }

    return () => {
      unsubGuild();
      unsubMembers();
      unsubRequests();
    };
  }, [profile?.guild_id, profile?.guild_role]);

  // 2. Fetch Browse Guilds
  const refreshGuildsList = async () => {
    setIsBrowseLoading(true);
    try {
      const list = await searchGuilds(searchQuery, joinTypeFilter);
      setGuildsList(list);

      if (user?.id) {
        const reqMap: Record<string, GuildJoinRequest | null> = {};
        for (const g of list) {
          const req = await getUserGuildRequest(g.id, user.id);
          reqMap[g.id] = req;
        }
        setPendingRequestsMap(reqMap);
      }
    } catch (err) {
      console.error('Failed to load guilds:', err);
    } finally {
      setIsBrowseLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshGuildsList();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, joinTypeFilter, user?.id]);

  // Handle Create Guild
  const handleCreateGuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user?.id) return;
    setCreateError(null);

    const cleanName = createName.trim();
    const cleanTag = createTag.trim().toUpperCase();

    if (cleanName.length < 3) {
      setCreateError('Guild name must be at least 3 characters.');
      return;
    }
    if (cleanTag.length < 2 || cleanTag.length > 5) {
      setCreateError('Guild tag must be 2 to 5 characters.');
      return;
    }

    setIsCreating(true);
    try {
      const newGuildId = await createGuild(
        {
          uid: profile.id,
          username: profile.username,
          hunterId: profile.hunter_id,
          displayName: profile.display_name,
          level: profile.current_level,
          rank: profile.current_rank,
        },
        {
          name: cleanName,
          tag: cleanTag,
          description: createDesc.trim(),
          icon: createIcon,
          joinType: createJoinType,
        }
      );

      updateProfile({
        guild_id: newGuildId,
        guild_role: 'leader',
        guild_name: cleanName,
        guild_tag: cleanTag,
      });

      setShowCreateModal(false);
      setCreateName('');
      setCreateTag('');
      setCreateDesc('');
      refreshGuildsList();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create guild');
    } finally {
      setIsCreating(false);
    }
  };

  // Join Open Guild
  const handleJoinOpen = async (guild: Guild) => {
    if (!profile || !user?.id) return;
    if (profile.guild_id) {
      alert('You are already a member of a guild. You must leave your current guild first.');
      return;
    }

    try {
      await joinOpenGuild(
        {
          uid: profile.id,
          username: profile.username,
          hunterId: profile.hunter_id,
          displayName: profile.display_name,
          level: profile.current_level,
          rank: profile.current_rank,
        },
        guild
      );

      updateProfile({
        guild_id: guild.id,
        guild_role: 'member',
        guild_name: guild.name,
        guild_tag: guild.tag,
      });
      refreshGuildsList();
    } catch (err: any) {
      alert(err.message || 'Failed to join guild');
    }
  };

  // Request to Join Private Guild
  const handleRequestToJoin = async (guild: Guild) => {
    if (!profile || !user?.id) return;
    if (profile.guild_id) {
      alert('You are already a member of a guild. You must leave your current guild first.');
      return;
    }

    try {
      await requestToJoinGuild(
        {
          uid: profile.id,
          username: profile.username,
          hunterId: profile.hunter_id,
          displayName: profile.display_name,
          level: profile.current_level,
          rank: profile.current_rank,
        },
        guild.id
      );

      setPendingRequestsMap((prev) => ({
        ...prev,
        [guild.id]: {
          id: profile.id,
          guildId: guild.id,
          uid: profile.id,
          username: profile.username,
          hunterId: profile.hunter_id,
          displayName: profile.display_name,
          level: profile.current_level,
          rank: profile.current_rank,
          status: 'pending',
        },
      }));
    } catch (err: any) {
      alert(err.message || 'Failed to send request');
    }
  };

  // Cancel Request
  const handleCancelRequest = async (guildId: string) => {
    if (!user?.id) return;
    try {
      await cancelGuildJoinRequest(guildId, user.id);
      setPendingRequestsMap((prev) => ({ ...prev, [guildId]: null }));
    } catch (err: any) {
      alert(err.message || 'Failed to cancel request');
    }
  };

  // Leave Guild
  const handleLeaveGuild = async () => {
    if (!profile?.guild_id || !user?.id) return;
    const isSoleLeader = isLeader && (activeGuild?.memberCount ?? 1) <= 1;
    const msg = isSoleLeader
      ? 'You are the sole member and leader. Leaving will disband this guild permanently. Proceed?'
      : 'Are you sure you want to exit your hunter guild?';

    if (confirm(msg)) {
      try {
        await leaveGuild(profile.guild_id, user.id, isLeader);
        updateProfile({
          guild_id: null,
          guild_role: null,
          guild_name: null,
          guild_tag: null,
        });
        setActiveGuild(null);
        refreshGuildsList();
      } catch (err: any) {
        alert(err.message || 'Failed to leave guild');
      }
    }
  };

  // Leader: Remove Member
  const handleRemoveMember = async (memberUid: string, memberName: string) => {
    if (!activeGuild) return;
    if (confirm(`Expel ${memberName} from the guild?`)) {
      try {
        await removeGuildMember(activeGuild.id, memberUid);
      } catch (err: any) {
        alert(err.message || 'Failed to remove member');
      }
    }
  };

  // Leader: Accept Join Request
  const handleAcceptRequest = async (req: GuildJoinRequest) => {
    if (!activeGuild) return;
    try {
      await acceptGuildJoinRequest(activeGuild, req);
    } catch (err: any) {
      alert(err.message || 'Failed to accept request');
    }
  };

  // Leader: Reject Join Request
  const handleRejectRequest = async (reqUid: string) => {
    if (!activeGuild) return;
    try {
      await rejectGuildJoinRequest(activeGuild.id, reqUid);
    } catch (err: any) {
      alert(err.message || 'Failed to reject request');
    }
  };

  return (
    <div className="social-container">
      {/* Top Header */}
      <div className="social-header purple-border">
        <div className="social-title-group">
          <span className="social-badge-label purple">
            <Shield size={14} /> [GLOBAL HUNTER SYNDICATES]
          </span>
          <h1 className="social-main-title purple">GUILD OPERATIONS</h1>
          <p className="social-subtitle">
            Form or pledge allegiance to a Hunter Syndicate. Conquer high-rank raids and conquer territories together.
          </p>
        </div>

        {/* Action Button: Create Guild */}
        {!profile?.guild_id && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="btn-hologram-purple"
          >
            <Plus size={16} /> + CREATE GUILD
          </button>
        )}
      </div>

      {/* 1. ACTIVE GUILD DISPLAY (If user belongs to a guild) */}
      {activeGuild && (
        <section className="guild-hero-banner">
          <div className="guild-hero-top">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'rgba(168, 85, 247, 0.15)',
                  border: '2px solid #a855f7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#d8b4fe',
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  fontFamily: 'var(--font-tech)',
                  boxShadow: '0 0 20px rgba(168, 85, 247, 0.35)',
                  flexShrink: 0,
                }}
              >
                {activeGuild.tag}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', margin: 0, fontFamily: 'var(--font-display)' }}>
                    {activeGuild.name}
                  </h2>
                  <span className="tag-pill-leader">[{activeGuild.tag}]</span>
                  <span className={activeGuild.joinType === 'open' ? 'tag-pill-open' : 'tag-pill-request'}>
                    {activeGuild.joinType === 'open' ? 'Anyone Can Join' : 'Request to Join'}
                  </span>
                </div>

                <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '8px 0 12px', maxWidth: '620px', lineHeight: 1.5 }}>
                  {activeGuild.description || 'No syndicate directive documented.'}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'var(--font-tech)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#fff', fontWeight: 'bold' }}>
                    <Crown size={14} color="#f59e0b" /> Leader: @{activeGuild.leaderUsername}
                  </span>
                  <span>•</span>
                  <span>{activeGuild.memberCount} Members</span>
                  <span>•</span>
                  <span style={{ color: '#c084fc', fontWeight: 'bold' }}>
                    {isLeader ? '★ Syndicate Master' : 'Pledged Member'}
                  </span>
                </div>
              </div>
            </div>

            {/* Guild Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isLeader && (
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(true)}
                  className="btn-hologram-ghost"
                >
                  <Settings size={14} /> Guild Settings
                </button>
              )}

              <button
                type="button"
                onClick={handleLeaveGuild}
                className="btn-hologram-danger"
              >
                <LogOut size={14} /> {isLeader && activeGuild.memberCount <= 1 ? 'Disband Guild' : 'Leave Guild'}
              </button>
            </div>
          </div>

          {/* Leader Requests Management Section */}
          {isLeader && guildRequests.length > 0 && (
            <div
              style={{
                background: 'rgba(12, 18, 40, 0.85)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: 'bold', fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px', fontFamily: 'var(--font-tech)' }}>
                <Clock size={16} /> PENDING RECRUITMENT REQUESTS ({guildRequests.length})
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                {guildRequests.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      background: 'rgba(6, 10, 24, 0.8)',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#fff' }}>{req.displayName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--cyan-primary)', fontFamily: 'var(--font-tech)' }}>@{req.username}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'var(--font-tech)' }}>
                        {req.hunterId} • LVL {req.level} • {req.rank}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleAcceptRequest(req)}
                        className="btn-hologram-cyan btn-sm"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectRequest(req.uid)}
                        className="btn-hologram-danger btn-sm"
                        title="Decline Request"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members Roster */}
          <div className="roster-section">
            <div className="roster-header">
              <span className="roster-title">
                <Users size={16} color="var(--cyan-primary)" /> SYNDICATE ROSTER ({guildMembers.length})
              </span>
            </div>

            <div className="member-list">
              {guildMembers.map((member) => {
                const isMemberLeader = member.role === 'leader';
                const badge = getRankBadgeInfo(member.rank);

                return (
                  <div key={member.uid} className="member-item-row">
                    <div className="member-info-col">
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: isMemberLeader ? 'rgba(168, 85, 247, 0.2)' : 'rgba(56, 189, 248, 0.1)',
                          border: isMemberLeader ? '1px solid #a855f7' : '1px solid rgba(56, 189, 248, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isMemberLeader ? '#d8b4fe' : 'var(--cyan-primary)',
                          fontWeight: 'bold',
                          fontFamily: 'var(--font-tech)',
                        }}
                      >
                        {isMemberLeader ? <Crown size={16} color="#f59e0b" /> : member.displayName.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '0.88rem', color: '#fff' }}>{member.displayName}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--cyan-primary)', fontFamily: 'var(--font-tech)' }}>
                            @{member.username}
                          </span>
                          {isMemberLeader && (
                            <span className="tag-pill-leader">
                              <Crown size={11} color="#f59e0b" /> Master
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'var(--font-tech)', marginTop: '2px' }}>
                          {member.hunterId} • LVL {member.level} • <span style={{ color: badge.color, fontWeight: 'bold' }}>{member.rank}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedPlayerUid(member.uid)}
                        className="btn-hologram-ghost btn-sm"
                        title="View Dossier"
                      >
                        <Search size={13} /> Dossier
                      </button>

                      {isLeader && !isMemberLeader && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.uid, member.displayName)}
                          className="btn-hologram-danger btn-sm"
                          title="Expel Member"
                        >
                          <UserX size={13} /> Expel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 2. DISCOVER & BROWSE GUILDS */}
      <section style={{ marginTop: activeGuild ? '32px' : '0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: 'var(--font-tech)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={18} color="var(--cyan-primary)" /> BROWSE GUILDS
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div className="social-search-input-wrap" style={{ minWidth: '220px' }}>
              <Search size={15} color="#64748b" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or tag..."
                className="social-search-input"
              />
            </div>

            <div className="social-filter-tabs">
              {(['all', 'open', 'request'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setJoinTypeFilter(filter)}
                  className={`social-filter-btn ${joinTypeFilter === filter ? 'active-purple' : ''}`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Guild Cards Grid */}
        {isBrowseLoading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--cyan-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--cyan-primary)', fontFamily: 'var(--font-tech)', letterSpacing: '1px' }}>
              SCANNING REGISTERED SYNDICATES...
            </span>
          </div>
        ) : guildsList.length === 0 ? (
          <div className="empty-state-box">
            <div className="empty-state-icon purple">
              <Shield size={28} />
            </div>
            <h3 className="empty-state-title">No Guilds Found</h3>
            <p className="empty-state-desc">
              No active syndicates match your search criteria. Pioneer the hunter ranks and establish your own syndicate today!
            </p>
            {!profile?.guild_id && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="btn-hologram-purple"
                style={{ marginTop: '6px' }}
              >
                <Plus size={16} /> + Establish Syndicate
              </button>
            )}
          </div>
        ) : (
          <div className="social-grid">
            {guildsList.map((guild) => {
              const isUserMember = profile?.guild_id === guild.id;
              const pendingReq = pendingRequestsMap[guild.id];

              return (
                <div key={guild.id} className="social-card guild-card-purple">
                  <div>
                    <div className="social-card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '12px',
                            background: 'rgba(168, 85, 247, 0.15)',
                            border: '1.5px solid rgba(168, 85, 247, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#d8b4fe',
                            fontWeight: 900,
                            fontSize: '1.1rem',
                            fontFamily: 'var(--font-tech)',
                          }}
                        >
                          {guild.tag}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: 0, fontFamily: 'var(--font-display)' }}>
                            {guild.name}
                          </h3>
                          <div style={{ fontSize: '0.75rem', color: 'var(--cyan-primary)', fontFamily: 'var(--font-tech)', marginTop: '2px' }}>
                            [{guild.tag}] • {guild.memberCount} Members
                          </div>
                        </div>
                      </div>

                      <span className={guild.joinType === 'open' ? 'tag-pill-open' : 'tag-pill-request'}>
                        {guild.joinType === 'open' ? 'Open' : 'Request'}
                      </span>
                    </div>

                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.5, margin: '8px 0 12px', minHeight: '36px' }}>
                      {guild.description || 'No syndicate directive documented.'}
                    </p>

                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-tech)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Crown size={12} color="#f59e0b" /> Master: @{guild.leaderUsername}
                    </div>
                  </div>

                  {/* Card Action */}
                  <div className="social-card-footer">
                    {isUserMember ? (
                      <span className="tag-pill-leader" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                        <Check size={13} /> Your Guild
                      </span>
                    ) : profile?.guild_id ? (
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'var(--font-tech)' }}>
                        (Leave active guild to join)
                      </span>
                    ) : pendingReq ? (
                      <button
                        type="button"
                        onClick={() => handleCancelRequest(guild.id)}
                        className="btn-hologram-ghost btn-sm"
                        style={{ color: '#f59e0b', borderColor: '#f59e0b' }}
                      >
                        Request Pending (Cancel)
                      </button>
                    ) : guild.joinType === 'open' ? (
                      <button
                        type="button"
                        onClick={() => handleJoinOpen(guild)}
                        className="btn-hologram-cyan btn-sm"
                      >
                        Join Guild
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRequestToJoin(guild)}
                        className="btn-hologram-purple btn-sm"
                      >
                        Request to Join
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* CREATE GUILD MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="modal-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal-dialog purple-theme"
            >
              <div className="modal-header purple-theme">
                <h3 className="modal-title">
                  <Crown size={18} color="#f59e0b" /> ESTABLISH NEW GUILD
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="modal-close-btn"
                >
                  <X size={18} />
                </button>
              </div>

              {createError && (
                <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#f43f5e', padding: '10px 16px', margin: '16px 22px 0', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} /> {createError}
                </div>
              )}

              <form onSubmit={handleCreateGuild}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Guild Designation Name</label>
                    <input
                      type="text"
                      required
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder="e.g. HUNTR ELITE"
                      className="form-input purple"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Guild Tag (2-5 Letters Uppercase)</label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      value={createTag}
                      onChange={(e) => setCreateTag(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                      placeholder="e.g. HUN"
                      className="form-input purple"
                      style={{ letterSpacing: '2px', fontWeight: 'bold' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Syndicate Directive / Description</label>
                    <textarea
                      rows={3}
                      value={createDesc}
                      onChange={(e) => setCreateDesc(e.target.value)}
                      placeholder="Describe your guild's trials and code of honor..."
                      className="form-textarea purple"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Admission Protocol</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setCreateJoinType('open')}
                        style={{
                          background: createJoinType === 'open' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(15, 23, 42, 0.7)',
                          border: createJoinType === 'open' ? '1.5px solid #10b981' : '1px solid rgba(56, 189, 248, 0.2)',
                          color: createJoinType === 'open' ? '#34d399' : '#94a3b8',
                          padding: '10px',
                          borderRadius: '8px',
                          fontFamily: 'var(--font-tech)',
                          fontWeight: 'bold',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        Anyone Can Join (Open)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreateJoinType('request')}
                        style={{
                          background: createJoinType === 'request' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(15, 23, 42, 0.7)',
                          border: createJoinType === 'request' ? '1.5px solid #f59e0b' : '1px solid rgba(56, 189, 248, 0.2)',
                          color: createJoinType === 'request' ? '#fbbf24' : '#94a3b8',
                          padding: '10px',
                          borderRadius: '8px',
                          fontFamily: 'var(--font-tech)',
                          fontWeight: 'bold',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        Request to Join (Private)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-hologram-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="btn-hologram-purple"
                  >
                    {isCreating ? 'Establishing...' : 'Form Syndicate'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GUILD SETTINGS MODAL (LEADER ONLY) */}
      <AnimatePresence>
        {showSettingsModal && activeGuild && (
          <div className="modal-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal-dialog purple-theme"
            >
              <div className="modal-header purple-theme">
                <h3 className="modal-title">
                  <Settings size={18} color="#a855f7" /> GUILD SETTINGS & CONTROL
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="modal-close-btn"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Guild Name</label>
                  <input
                    type="text"
                    value={activeGuild.name}
                    onChange={(e) => setActiveGuild({ ...activeGuild, name: e.target.value })}
                    className="form-input purple"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Directive / Description</label>
                  <textarea
                    rows={3}
                    value={activeGuild.description}
                    onChange={(e) => setActiveGuild({ ...activeGuild, description: e.target.value })}
                    className="form-textarea purple"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Join Protocol</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setActiveGuild({ ...activeGuild, joinType: 'open' })}
                      style={{
                        background: activeGuild.joinType === 'open' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(15, 23, 42, 0.7)',
                        border: activeGuild.joinType === 'open' ? '1.5px solid #10b981' : '1px solid rgba(56, 189, 248, 0.2)',
                        color: activeGuild.joinType === 'open' ? '#34d399' : '#94a3b8',
                        padding: '10px',
                        borderRadius: '8px',
                        fontFamily: 'var(--font-tech)',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      Anyone Can Join (Open)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveGuild({ ...activeGuild, joinType: 'request' })}
                      style={{
                        background: activeGuild.joinType === 'request' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(15, 23, 42, 0.7)',
                        border: activeGuild.joinType === 'request' ? '1.5px solid #f59e0b' : '1px solid rgba(56, 189, 248, 0.2)',
                        color: activeGuild.joinType === 'request' ? '#fbbf24' : '#94a3b8',
                        padding: '10px',
                        borderRadius: '8px',
                        fontFamily: 'var(--font-tech)',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      Request to Join (Private)
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="btn-hologram-ghost"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await updateGuildSettings(activeGuild.id, {
                        description: activeGuild.description,
                        joinType: activeGuild.joinType,
                      });
                      setShowSettingsModal(false);
                      refreshGuildsList();
                    } catch (err: any) {
                      alert(err.message || 'Failed to update settings');
                    }
                  }}
                  className="btn-hologram-purple"
                >
                  Save Modifications
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PLAYER PROFILE MODAL */}
      <PlayerProfileModal
        playerUid={selectedPlayerUid}
        onClose={() => setSelectedPlayerUid(null)}
      />
    </div>
  );
};
