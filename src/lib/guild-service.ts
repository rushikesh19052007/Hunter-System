import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  writeBatch,
  increment,
  serverTimestamp,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from './firebase';

export interface Guild {
  id: string;
  name: string;
  nameLower: string;
  tag: string;
  description: string;
  icon: string;
  joinType: 'open' | 'request';
  leaderUid: string;
  leaderUsername: string;
  leaderDisplayName: string;
  memberCount: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface GuildMember {
  uid: string;
  username: string;
  hunterId: string;
  displayName: string;
  level: number;
  rank: string;
  role: 'leader' | 'member';
  joinedAt?: any;
}

export interface GuildJoinRequest {
  id: string;
  guildId: string;
  uid: string;
  username: string;
  hunterId: string;
  displayName: string;
  level: number;
  rank: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt?: any;
}

// Preset Guild Icons
export const GUILD_ICONS: Record<string, { label: string; iconName: string; color: string }> = {
  monarch: { label: 'Shadow Monarch', iconName: 'Crown', color: '#a855f7' },
  dragon: { label: 'Dragon Fang', iconName: 'Flame', color: '#ef4444' },
  blade: { label: 'Dual Blades', iconName: 'Sword', color: '#00e5ff' },
  shield: { label: 'Iron Aegis', iconName: 'Shield', color: '#10b981' },
  tiger: { label: 'White Tiger', iconName: 'Zap', color: '#f59e0b' },
  phoenix: { label: 'Solar Phoenix', iconName: 'Sparkles', color: '#ec4899' },
};

// ============================================================
// GUILD CREATION & LOOKUP
// ============================================================

/**
 * Creates a new guild atomically. Creator automatically becomes Guild Leader.
 */
export async function createGuild(
  leader: {
    uid: string;
    username: string;
    hunterId: string;
    displayName: string;
    level: number;
    rank: string;
  },
  data: {
    name: string;
    tag: string;
    description: string;
    icon: string;
    joinType: 'open' | 'request';
  }
): Promise<string> {
  const cleanName = data.name.trim();
  const cleanTag = data.tag.trim().toUpperCase();

  if (cleanName.length < 3) {
    throw new Error('Guild name must be at least 3 characters.');
  }
  if (cleanTag.length < 2 || cleanTag.length > 5) {
    throw new Error('Guild tag must be between 2 and 5 characters.');
  }

  const guildId = `guild-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const guildRef = doc(firestore, 'guilds', guildId);
  const memberRef = doc(firestore, 'guilds', guildId, 'members', leader.uid);
  const playerRef = doc(firestore, 'players', leader.uid);
  const hunterRef = doc(firestore, 'hunters', leader.uid);
  const lbRef = doc(firestore, 'leaderboard', leader.uid);

  const batch = writeBatch(firestore);

  // 1. Create Guild Document
  batch.set(guildRef, {
    id: guildId,
    name: cleanName,
    nameLower: cleanName.toLowerCase(),
    tag: cleanTag,
    description: data.description.trim() || 'No description provided.',
    icon: data.icon || 'monarch',
    joinType: data.joinType,
    leaderUid: leader.uid,
    leaderUsername: leader.username,
    leaderDisplayName: leader.displayName,
    memberCount: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // 2. Add Leader as First Member
  batch.set(memberRef, {
    uid: leader.uid,
    username: leader.username,
    hunterId: leader.hunterId,
    displayName: leader.displayName,
    level: leader.level,
    rank: leader.rank,
    role: 'leader',
    joinedAt: serverTimestamp(),
  });

  // 3. Update User's Profile with Guild Details
  const guildUpdates = {
    guildId,
    guildRole: 'leader',
    guildName: cleanName,
    guildTag: cleanTag,
    updatedAt: serverTimestamp(),
  };

  batch.set(playerRef, guildUpdates, { merge: true });
  batch.set(hunterRef, guildUpdates, { merge: true });
  batch.set(lbRef, guildUpdates, { merge: true });

  await batch.commit();
  return guildId;
}

/**
 * Searches and browses guilds with optional query text and join type filter.
 */
export async function searchGuilds(
  searchText = '',
  joinTypeFilter: 'all' | 'open' | 'request' = 'all'
): Promise<Guild[]> {
  try {
    const snap = await getDocs(query(collection(firestore, 'guilds'), limit(100)));
    let list: Guild[] = snap.docs.map((d) => d.data() as Guild);

    // Sort by memberCount descending
    list.sort((a, b) => (Number(b.memberCount) || 0) - (Number(a.memberCount) || 0));

    // Filter by joinType in-memory to prevent missing composite index errors
    if (joinTypeFilter !== 'all') {
      list = list.filter((g) => (g.joinType || 'open') === joinTypeFilter);
    }

    const term = searchText.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (g) =>
          g.nameLower?.includes(term) ||
          g.name?.toLowerCase().includes(term) ||
          g.tag?.toLowerCase().includes(term)
      );
    }

    return list;
  } catch (err) {
    console.error('searchGuilds error:', err);
    return [];
  }
}

/**
 * Gets a single guild by its ID.
 */
export async function getGuild(guildId: string): Promise<Guild | null> {
  try {
    const snap = await getDoc(doc(firestore, 'guilds', guildId));
    if (snap.exists()) {
      return snap.data() as Guild;
    }
  } catch (err) {
    console.error('getGuild error:', err);
  }
  return null;
}

// ============================================================
// MEMBERSHIP & REQUESTS
// ============================================================

/**
 * Joins an open guild immediately.
 */
export async function joinOpenGuild(
  user: {
    uid: string;
    username: string;
    hunterId: string;
    displayName: string;
    level: number;
    rank: string;
  },
  guild: Guild
): Promise<void> {
  if (guild.joinType !== 'open') {
    throw new Error('This guild requires leadership approval to join.');
  }

  const batch = writeBatch(firestore);
  const guildRef = doc(firestore, 'guilds', guild.id);
  const memberRef = doc(firestore, 'guilds', guild.id, 'members', user.uid);
  const playerRef = doc(firestore, 'players', user.uid);
  const hunterRef = doc(firestore, 'hunters', user.uid);
  const lbRef = doc(firestore, 'leaderboard', user.uid);

  // 1. Add member
  batch.set(memberRef, {
    uid: user.uid,
    username: user.username,
    hunterId: user.hunterId,
    displayName: user.displayName,
    level: user.level,
    rank: user.rank,
    role: 'member',
    joinedAt: serverTimestamp(),
  });

  // 2. Increment guild member count
  batch.update(guildRef, {
    memberCount: increment(1),
    updatedAt: serverTimestamp(),
  });

  // 3. Update player profiles
  const guildUpdates = {
    guildId: guild.id,
    guildRole: 'member',
    guildName: guild.name,
    guildTag: guild.tag,
    updatedAt: serverTimestamp(),
  };

  batch.set(playerRef, guildUpdates, { merge: true });
  batch.set(hunterRef, guildUpdates, { merge: true });
  batch.set(lbRef, guildUpdates, { merge: true });

  await batch.commit();
}

/**
 * Requests to join a request-only guild.
 */
export async function requestToJoinGuild(
  user: {
    uid: string;
    username: string;
    hunterId: string;
    displayName: string;
    level: number;
    rank: string;
  },
  guildId: string
): Promise<void> {
  const reqRef = doc(firestore, 'guilds', guildId, 'joinRequests', user.uid);
  await setDoc(reqRef, {
    id: user.uid,
    guildId,
    uid: user.uid,
    username: user.username,
    hunterId: user.hunterId,
    displayName: user.displayName,
    level: user.level,
    rank: user.rank,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

/**
 * Cancels a pending join request.
 */
export async function cancelGuildJoinRequest(guildId: string, uid: string): Promise<void> {
  const reqRef = doc(firestore, 'guilds', guildId, 'joinRequests', uid);
  await deleteDoc(reqRef);
}

/**
 * Checks if user has a pending join request for a guild.
 */
export async function getUserGuildRequest(guildId: string, uid: string): Promise<GuildJoinRequest | null> {
  try {
    const snap = await getDoc(doc(firestore, 'guilds', guildId, 'joinRequests', uid));
    if (snap.exists() && snap.data()?.status === 'pending') {
      return snap.data() as GuildJoinRequest;
    }
  } catch (_) {}
  return null;
}

/**
 * Guild Leader accepts an incoming join request.
 */
export async function acceptGuildJoinRequest(
  guild: Guild,
  request: GuildJoinRequest
): Promise<void> {
  const batch = writeBatch(firestore);

  const guildRef = doc(firestore, 'guilds', guild.id);
  const memberRef = doc(firestore, 'guilds', guild.id, 'members', request.uid);
  const reqRef = doc(firestore, 'guilds', guild.id, 'joinRequests', request.uid);
  const playerRef = doc(firestore, 'players', request.uid);
  const hunterRef = doc(firestore, 'hunters', request.uid);
  const lbRef = doc(firestore, 'leaderboard', request.uid);

  // 1. Add Member
  batch.set(memberRef, {
    uid: request.uid,
    username: request.username,
    hunterId: request.hunterId,
    displayName: request.displayName,
    level: request.level,
    rank: request.rank,
    role: 'member',
    joinedAt: serverTimestamp(),
  });

  // 2. Increment Member Count
  batch.update(guildRef, {
    memberCount: increment(1),
    updatedAt: serverTimestamp(),
  });

  // 3. Mark request accepted or delete it
  batch.delete(reqRef);

  // 4. Update member's profile
  const guildUpdates = {
    guildId: guild.id,
    guildRole: 'member',
    guildName: guild.name,
    guildTag: guild.tag,
    updatedAt: serverTimestamp(),
  };

  batch.set(playerRef, guildUpdates, { merge: true });
  batch.set(hunterRef, guildUpdates, { merge: true });
  batch.set(lbRef, guildUpdates, { merge: true });

  await batch.commit();
}

/**
 * Guild Leader rejects an incoming join request.
 */
export async function rejectGuildJoinRequest(guildId: string, requestUid: string): Promise<void> {
  const reqRef = doc(firestore, 'guilds', guildId, 'joinRequests', requestUid);
  await deleteDoc(reqRef);
}

/**
 * Guild Leader removes a member from the guild.
 */
export async function removeGuildMember(guildId: string, memberUid: string): Promise<void> {
  const batch = writeBatch(firestore);

  const guildRef = doc(firestore, 'guilds', guildId);
  const memberRef = doc(firestore, 'guilds', guildId, 'members', memberUid);
  const playerRef = doc(firestore, 'players', memberUid);
  const hunterRef = doc(firestore, 'hunters', memberUid);
  const lbRef = doc(firestore, 'leaderboard', memberUid);

  batch.delete(memberRef);
  batch.update(guildRef, {
    memberCount: increment(-1),
    updatedAt: serverTimestamp(),
  });

  const clearUpdates = {
    guildId: null,
    guildRole: null,
    guildName: null,
    guildTag: null,
    updatedAt: serverTimestamp(),
  };

  batch.set(playerRef, clearUpdates, { merge: true });
  batch.set(hunterRef, clearUpdates, { merge: true });
  batch.set(lbRef, clearUpdates, { merge: true });

  await batch.commit();
}

/**
 * A user leaves their current guild.
 * If the user is the leader and the sole member, the guild is deleted.
 */
export async function leaveGuild(guildId: string, uid: string, isLeader = false): Promise<void> {
  const guildSnap = await getDoc(doc(firestore, 'guilds', guildId));
  const guildData = guildSnap.data() as Guild | undefined;

  const batch = writeBatch(firestore);
  const playerRef = doc(firestore, 'players', uid);
  const hunterRef = doc(firestore, 'hunters', uid);
  const lbRef = doc(firestore, 'leaderboard', uid);
  const memberRef = doc(firestore, 'guilds', guildId, 'members', uid);

  const clearUpdates = {
    guildId: null,
    guildRole: null,
    guildName: null,
    guildTag: null,
    updatedAt: serverTimestamp(),
  };

  batch.delete(memberRef);
  batch.set(playerRef, clearUpdates, { merge: true });
  batch.set(hunterRef, clearUpdates, { merge: true });
  batch.set(lbRef, clearUpdates, { merge: true });

  if (isLeader && (guildData?.memberCount ?? 1) <= 1) {
    // Sole member & leader: delete guild
    batch.delete(doc(firestore, 'guilds', guildId));
  } else {
    batch.update(doc(firestore, 'guilds', guildId), {
      memberCount: increment(-1),
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
}

/**
 * Guild Leader updates guild settings.
 */
export async function updateGuildSettings(
  guildId: string,
  settings: {
    description?: string;
    icon?: string;
    joinType?: 'open' | 'request';
  }
): Promise<void> {
  const guildRef = doc(firestore, 'guilds', guildId);
  const updates: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (settings.description !== undefined) updates.description = settings.description.trim();
  if (settings.icon !== undefined) updates.icon = settings.icon;
  if (settings.joinType !== undefined) updates.joinType = settings.joinType;

  await updateDoc(guildRef, updates);
}

// ============================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================

export function subscribeToGuild(
  guildId: string,
  callback: (guild: Guild | null) => void
): Unsubscribe {
  const guildRef = doc(firestore, 'guilds', guildId);
  return onSnapshot(
    guildRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as Guild);
      } else {
        callback(null);
      }
    },
    (err) => {
      console.error('subscribeToGuild error:', err);
      callback(null);
    }
  );
}

export function subscribeToGuildMembers(
  guildId: string,
  callback: (members: GuildMember[]) => void
): Unsubscribe {
  const membersRef = collection(firestore, 'guilds', guildId, 'members');
  return onSnapshot(
    membersRef,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as GuildMember);
      list.sort((a, b) => (b.level || 0) - (a.level || 0));
      callback(list);
    },
    (err) => {
      console.error('subscribeToGuildMembers error:', err);
      callback([]);
    }
  );
}

export function subscribeToGuildJoinRequests(
  guildId: string,
  callback: (requests: GuildJoinRequest[]) => void
): Unsubscribe {
  const q = query(
    collection(firestore, 'guilds', guildId, 'joinRequests'),
    where('status', '==', 'pending')
  );

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as GuildJoinRequest[];
      callback(list);
    },
    (err) => {
      console.error('subscribeToGuildJoinRequests error:', err);
      callback([]);
    }
  );
}

