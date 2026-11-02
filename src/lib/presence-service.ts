import {
  doc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from './firebase';

export interface PresenceData {
  state: 'online' | 'offline';
  lastSeen?: any;
  client?: string;
  updatedAt?: any;
}

const PRESENCE_TIMEOUT_MS = 90_000; // 90 seconds timeout for stale heartbeat
let heartbeatTimer: any = null;
let currentTrackingUid: string | null = null;

/**
 * Checks if a presence document indicates a truly active user.
 * Both the explicit 'online' state and a recent heartbeat (<90s) are required.
 */
export function isPresenceOnline(data?: PresenceData | null): boolean {
  if (!data || data.state !== 'online') return false;
  if (!data.lastSeen) return true; // Recently set

  let lastSeenMillis = 0;
  if (typeof data.lastSeen.toMillis === 'function') {
    lastSeenMillis = data.lastSeen.toMillis();
  } else if (typeof data.lastSeen === 'number') {
    lastSeenMillis = data.lastSeen;
  } else if (data.lastSeen instanceof Date) {
    lastSeenMillis = data.lastSeen.getTime();
  }

  if (lastSeenMillis === 0) return true;
  return Date.now() - lastSeenMillis < PRESENCE_TIMEOUT_MS;
}

/**
 * Initializes and maintains real-time online presence for the current user.
 */
export function startPresence(uid: string): () => void {
  if (currentTrackingUid === uid && heartbeatTimer) {
    return stopPresence;
  }

  currentTrackingUid = uid;
  const presenceRef = doc(firestore, 'presence', uid);

  const updateOnline = async () => {
    try {
      await setDoc(
        presenceRef,
        {
          state: 'online',
          lastSeen: serverTimestamp(),
          client: 'web',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      // Quiet fail if offline
    }
  };

  const updateOffline = async () => {
    try {
      await setDoc(
        presenceRef,
        {
          state: 'offline',
          lastSeen: serverTimestamp(),
          client: 'web',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      // Quiet fail
    }
  };

  // 1. Initial online signal
  updateOnline();

  // 2. Periodic heartbeat every 30 seconds
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(updateOnline, 30_000);

  // 3. Visibility and tab focus lifecycle handlers
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      updateOnline();
      if (!heartbeatTimer) {
        heartbeatTimer = setInterval(updateOnline, 30_000);
      }
    } else {
      updateOffline();
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
    }
  };

  const handleBeforeUnload = () => {
    updateOffline();
  };

  const handleOnline = () => updateOnline();
  const handleOffline = () => updateOffline();

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('pagehide', handleBeforeUnload);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('pagehide', handleBeforeUnload);
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    updateOffline();
    currentTrackingUid = null;
  };
}

export function stopPresence(): void {
  if (currentTrackingUid) {
    const presenceRef = doc(firestore, 'presence', currentTrackingUid);
    setDoc(
      presenceRef,
      {
        state: 'offline',
        lastSeen: serverTimestamp(),
        client: 'web',
      },
      { merge: true }
    ).catch(() => {});
  }
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  currentTrackingUid = null;
}

/**
 * Subscribes to the live presence of a single user.
 */
export function subscribeToUserPresence(
  uid: string,
  callback: (isOnline: boolean, data: PresenceData | null) => void
): Unsubscribe {
  const presenceRef = doc(firestore, 'presence', uid);
  return onSnapshot(
    presenceRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as PresenceData;
        callback(isPresenceOnline(data), data);
      } else {
        callback(false, null);
      }
    },
    () => {
      callback(false, null);
    }
  );
}

