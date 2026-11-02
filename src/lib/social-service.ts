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
  orderBy,
  limit,
  runTransaction,
  writeBatch,
  serverTimestamp,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from './firebase';
import {
  type Profile,
  normalizeUsername,
  isValidUsername,
  generateUniqueHunterId,
} from './game-engine';

export interface PublicPlayer {
  uid: string;
  username: string;
  hunterId: string;
  displayName: string;
  currentLevel: number;
  currentRank: string;
  totalXp: number;
  affinity: string;
  equippedTitle?: string;
  questsCompleted?: number;
  streak?: number;
  guildId?: string | null;
  guildName?: string | null;
  guildTag?: string | null;
  stats?: Record<string, number>;
  updatedAt?: any;
}

export interface Friend {
  uid: string;
  username: string;
  hunterId: string;
  displayName: string;
  level: number;
  rank: string;
  affinity?: string;
  equippedTitle?: string;
  addedAt?: any;
}

export interface FriendRequest {
  id: string;
  fromUid: string;
  toUid: string;
  fromUsername: string;
  fromHunterId: string;
  fromDisplayName: string;
  fromLevel: number;
  fromRank: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt?: any;
}

export type FriendshipStatus =
  | 'none'
  | 'self'
  | 'friends'
  | 'request_sent'
  | 'request_received';

// ============================================================
// USERNAME & HUNTER ID REGISTRY
// ============================================================

/**
 * Checks whether a normalized lowercase username is available.
 */
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const clean = normalizeUsername(username);
  if (!isValidUsername(clean)) return false;

  const userDocRef = doc(firestore, 'usernames', clean);
  const snap = await getDoc(userDocRef);
  return !snap.exists();
}

/**
 * Claims a unique lowercase username atomically using a transaction.
 */
export async function claimUsername(uid: string, username: string): Promise<string> {
  const clean = normalizeUsername(username);
  if (!isValidUsername(clean)) {
    throw new Error('Username must be 3-20 lowercase alphanumeric characters or underscore.');
  }

  const usernameRef = doc(firestore, 'usernames', clean);

  await runTransaction(firestore, async (transaction) => {
    const existing = await transaction.get(usernameRef);
    if (existing.exists() && existing.data()?.uid !== uid) {
      throw new Error(`Username "${clean}" is already claimed by another hunter.`);
    }
    transaction.set(usernameRef, {
      uid,
      username: clean,
      createdAt: serverTimestamp(),
    });
  });

  return clean;
}

/**
 * Claims a permanent unique Hunter ID for a user.
 */
export async function claimHunterId(uid: string, preferredHunterId?: string, username?: string): Promise<string> {
  let hid = preferredHunterId?.toUpperCase();
  if (!hid || !/^HUNTR-[A-Z0-9]{8}$/.test(hid)) {
    hid = generateUniqueHunterId();
  }

  const hunterIdRef = doc(firestore, 'hunterIds', hid);

  await runTransaction(firestore, async (transaction) => {
    const existing = await transaction.get(hunterIdRef);
    if (existing.exists() && existing.data()?.uid !== uid) {
      // Regenerate if collision occurred
      hid = generateUniqueHunterId();
      const retryRef = doc(firestore, 'hunterIds', hid);
      transaction.set(retryRef, {
        uid,
        username: username || 'hunter',
        createdAt: serverTimestamp(),
      });
      return;
    }
    transaction.set(hunterIdRef, {
      uid,
      username: username || 'hunter',
      createdAt: serverTimestamp(),
    });
  });

  return hid;
}

/**
 * Synchronizes the public player profile card (used for global search, profiles, leaderboard).
 */
export async function syncPublicPlayer(profile: Profile): Promise<void> {
  if (!profile.id) return;

  const cleanUsername = profile.username ? normalizeUsername(profile.username) : normalizeUsername(profile.display_name);

  const publicData: PublicPlayer = {
    uid: profile.id,
    username: cleanUsername,
    hunterId: profile.hunter_id,
    displayName: profile.display_name,
    currentLevel: profile.current_level,
    currentRank: profile.current_rank,
    totalXp: profile.total_xp,
    affinity: profile.affinity,
    equippedTitle: profile.equipped_title || 'The Awakened',
    questsCompleted: profile.quests_completed || 0,
    streak: profile.streak || 1,
    guildId: profile.guild_id || null,
    guildName: profile.guild_name || null,
    guildTag: profile.guild_tag || null,
    stats: profile.stats,
    updatedAt: serverTimestamp(),
  };

  const playerRef = doc(firestore, 'players', profile.id);
  const lbRef = doc(firestore, 'leaderboard', profile.id);

  const batch = writeBatch(firestore);
  batch.set(playerRef, publicData, { merge: true });
  batch.set(
    lbRef,
    {
      id: profile.id,
      hunterId: profile.hunter_id,
      username: cleanUsername,
      displayName: profile.display_name,
      level: profile.current_level,
      rank: profile.current_rank,
      totalXp: profile.total_xp,
      affinity: profile.affinity,
      equippedTitle: profile.equipped_title || 'The Awakened',
      questsCompleted: profile.quests_completed || 0,
      streak: profile.streak || 1,
      guildId: profile.guild_id || null,
      guildName: profile.guild_name || null,
      guildTag: profile.guild_tag || null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();
}

/**
 * Fetches a single public player profile by UID.
 */
export async function getPublicPlayer(uid: string): Promise<PublicPlayer | null> {
  try {
    const snap = await getDoc(doc(firestore, 'players', uid));
    if (snap.exists()) {
      return snap.data() as PublicPlayer;
    }
    // Fallback to leaderboard document
    const lbSnap = await getDoc(doc(firestore, 'leaderboard', uid));
    if (lbSnap.exists()) {
      const data = lbSnap.data();
      return {
        uid,
        username: data.username || normalizeUsername(data.displayName || 'hunter'),
        hunterId: data.hunterId || 'HUNTR-UNKNOWN',
        displayName: data.displayName || 'Hunter',
        currentLevel: data.level || 1,
        currentRank: data.rank || 'E-Rank',
        totalXp: data.totalXp || 0,
        affinity: data.affinity || 'AGI',
        equippedTitle: data.equippedTitle || 'The Awakened',
        questsCompleted: data.questsCompleted || 0,
        streak: data.streak || 1,
        guildId: data.guildId || null,
        guildName: data.guildName || null,
        guildTag: data.guildTag || null,
      };
    }
  } catch (err) {
    console.error('getPublicPlayer error:', err);
  }
  return null;
}

// ============================================================
// HUNTER SEARCH
// ============================================================

/**
 * Searches hunters by lowercase username (prefix match) or exact Hunter ID.
 * Debounced and optimized with Firestore range/equality queries.
 */
export async function searchHunters(
  queryText: string,
  currentUid: string
): Promise<PublicPlayer[]> {
  const trimmed = queryText.trim();
  if (!trimmed) return [];

  const results: PublicPlayer[] = [];
  const seenUids = new Set<string>();

  // 1. Exact Hunter ID lookup if starts with HUNTR-
  if (trimmed.toUpperCase().startsWith('HUNTR-')) {
    const hid = trimmed.toUpperCase();
    try {
      const q = query(collection(firestore, 'players'), where('hunterId', '==', hid), limit(5));
      const snap = await getDocs(q);
      snap.forEach((d) => {
        if (d.id !== currentUid && !seenUids.has(d.id)) {
          seenUids.add(d.id);
          results.push(d.data() as PublicPlayer);
        }
      });
      if (results.length > 0) return results;
    } catch (_) {}
  }

  // 2. Lowercase username prefix search
  const cleanUsername = normalizeUsername(trimmed);
  if (cleanUsername.length >= 2) {
    try {
      const q = query(
        collection(firestore, 'players'),
        where('username', '>=', cleanUsername),
        where('username', '<=', cleanUsername + '\uf8ff'),
        limit(15)
      );
      const snap = await getDocs(q);
      snap.forEach((d) => {
        if (d.id !== currentUid && !seenUids.has(d.id)) {
          seenUids.add(d.id);
          results.push(d.data() as PublicPlayer);
        }
      });
    } catch (e) {
      console.warn('Username prefix search warning:', e);
    }
  }

  return results;
}

// ============================================================
// FRIENDSHIP STATUS & ACTIONS
// ============================================================

/**
 * Determines friendship status between current user and target user.
 */
export async function getFriendshipStatus(
  currentUid: string,
  targetUid: string
): Promise<FriendshipStatus> {
  if (currentUid === targetUid) return 'self';

  try {
    // 1. Check if already friends
    const friendSnap = await getDoc(
      doc(firestore, 'hunters', currentUid, 'friends', targetUid)
    );
    if (friendSnap.exists()) return 'friends';

    // 2. Check if outgoing request sent
    const outgoingSnap = await getDoc(
      doc(firestore, 'friendRequests', `${currentUid}_${targetUid}`)
    );
    if (outgoingSnap.exists() && outgoingSnap.data()?.status === 'pending') {
      return 'request_sent';
    }

    // 3. Check if incoming request received
    const incomingSnap = await getDoc(
      doc(firestore, 'friendRequests', `${targetUid}_${currentUid}`)
    );
    if (incomingSnap.exists() && incomingSnap.data()?.status === 'pending') {
      return 'request_received';
    }
  } catch (err) {
    console.error('getFriendshipStatus error:', err);
  }

  return 'none';
}

/**
 * Sends a friend request from current user to target user.
 */
export async function sendFriendRequest(
  currentUser: {
    uid: string;
    username: string;
    hunterId: string;
    displayName: string;
    level: number;
    rank: string;
  },
  target: PublicPlayer
): Promise<void> {
  if (currentUser.uid === target.uid) {
    throw new Error('You cannot add yourself as a friend.');
  }

  const requestId = `${currentUser.uid}_${target.uid}`;
  const requestRef = doc(firestore, 'friendRequests', requestId);

  // Check if target already sent a request to current user
  const inverseId = `${target.uid}_${currentUser.uid}`;
  const inverseSnap = await getDoc(doc(firestore, 'friendRequests', inverseId));
  if (inverseSnap.exists() && inverseSnap.data()?.status === 'pending') {
    // Auto-accept!
    await acceptFriendRequest(inverseId, target.uid, currentUser.uid);
    return;
  }

  await setDoc(requestRef, {
    id: requestId,
    fromUid: currentUser.uid,
    toUid: target.uid,
    fromUsername: currentUser.username,
    fromHunterId: currentUser.hunterId,
    fromDisplayName: currentUser.displayName,
    fromLevel: currentUser.level,
    fromRank: currentUser.rank,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

/**
 * Accepts a friend request atomically: creates bidirectional friendships in hunters collection.
 */
export async function acceptFriendRequest(
  requestId: string,
  fromUid: string,
  toUid: string
): Promise<void> {
  const [senderPlayer, receiverPlayer] = await Promise.all([
    getPublicPlayer(fromUid),
    getPublicPlayer(toUid),
  ]);

  const batch = writeBatch(firestore);

  // 1. Update friend request status
  const requestRef = doc(firestore, 'friendRequests', requestId);
  batch.update(requestRef, {
    status: 'accepted',
    acceptedAt: serverTimestamp(),
  });

  // 2. Add sender as friend in receiver's friends collection
  const receiverFriendRef = doc(firestore, 'hunters', toUid, 'friends', fromUid);
  batch.set(receiverFriendRef, {
    uid: fromUid,
    username: senderPlayer?.username || 'hunter',
    hunterId: senderPlayer?.hunterId || 'HUNTR-UNKNOWN',
    displayName: senderPlayer?.displayName || 'Hunter',
    level: senderPlayer?.currentLevel || 1,
    rank: senderPlayer?.currentRank || 'E-Rank',
    affinity: senderPlayer?.affinity || 'AGI',
    equippedTitle: senderPlayer?.equippedTitle || 'The Awakened',
    addedAt: serverTimestamp(),
  });

  // 3. Add receiver as friend in sender's friends collection
  const senderFriendRef = doc(firestore, 'hunters', fromUid, 'friends', toUid);
  batch.set(senderFriendRef, {
    uid: toUid,
    username: receiverPlayer?.username || 'hunter',
    hunterId: receiverPlayer?.hunterId || 'HUNTR-UNKNOWN',
    displayName: receiverPlayer?.displayName || 'Hunter',
    level: receiverPlayer?.currentLevel || 1,
    rank: receiverPlayer?.currentRank || 'E-Rank',
    affinity: receiverPlayer?.affinity || 'AGI',
    equippedTitle: receiverPlayer?.equippedTitle || 'The Awakened',
    addedAt: serverTimestamp(),
  });

  await batch.commit();
}

/**
 * Declines or cancels a friend request.
 */
export async function declineFriendRequest(requestId: string): Promise<void> {
  const requestRef = doc(firestore, 'friendRequests', requestId);
  await deleteDoc(requestRef);
}

/**
 * Removes a mutual friendship.
 */
export async function removeFriend(currentUid: string, friendUid: string): Promise<void> {
  const batch = writeBatch(firestore);
  batch.delete(doc(firestore, 'hunters', currentUid, 'friends', friendUid));
  batch.delete(doc(firestore, 'hunters', friendUid, 'friends', currentUid));

  // Also clean up any lingering requests
  batch.delete(doc(firestore, 'friendRequests', `${currentUid}_${friendUid}`));
  batch.delete(doc(firestore, 'friendRequests', `${friendUid}_${currentUid}`));

  await batch.commit();
}

// ============================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================

/**
 * Subscribes to the current user's live friends list.
 */
export function subscribeToFriends(
  uid: string,
  callback: (friends: Friend[]) => void
): Unsubscribe {
  const friendsColl = collection(firestore, 'hunters', uid, 'friends');
  return onSnapshot(
    friendsColl,
    (snap) => {
      const friends: Friend[] = snap.docs.map((d) => d.data() as Friend);
      callback(friends);
    },
    (err) => {
      console.error('subscribeToFriends error:', err);
      callback([]);
    }
  );
}

/**
 * Subscribes to incoming pending friend requests for the current user.
 */
export function subscribeToIncomingFriendRequests(
  uid: string,
  callback: (requests: FriendRequest[]) => void
): Unsubscribe {
  const q = query(
    collection(firestore, 'friendRequests'),
    where('toUid', '==', uid),
    where('status', '==', 'pending')
  );

  return onSnapshot(
    q,
    (snap) => {
      const requests = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as FriendRequest[];
      callback(requests);
    },
    (err) => {
      console.error('subscribeToIncomingFriendRequests error:', err);
      callback([]);
    }
  );
}

