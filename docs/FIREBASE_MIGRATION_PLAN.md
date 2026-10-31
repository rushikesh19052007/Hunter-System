# HUNTR — Supabase to Firebase Migration Plan

**Target Application**: `C:\Users\MAHESH\Documents\Kavya\Hunter-System`  
**Firebase Project**: `hunter-x-guild`  
**Flutter Reference**: `C:\Users\MAHESH\Documents\Kavya\Hunter\lib\firebase_options.dart`  
**Date**: October 2026  
**Auditor**: Senior Full-Stack Developer & Firebase Architect  

---

## 1. Objective

Completely eliminate Supabase from the web application and configure the **identical Firebase backend project (`hunter-x-guild`)** currently employed by the Flutter mobile application. Both Android and Web clients must share the exact same user identity, database collections, document structures, and real-time state.

---

## 2. Shared Firebase Configuration

The web application must initialize Firebase using the exact web credentials declared in the Flutter application's `firebase_options.dart`:

```typescript
export const firebaseConfig = {
  apiKey: "AIzaSyBk16inYpN3ZtISnJicrkujEgUVg5jbsFc",
  authDomain: "hunter-x-guild.firebaseapp.com",
  projectId: "hunter-x-guild",
  storageBucket: "hunter-x-guild.firebasestorage.app",
  messagingSenderId: "693350757736",
  appId: "1:693350757736:web:8457b2f2bfc95e759812dd",
  measurementId: "G-VDFP7VG6N2"
};
```

---

## 3. Step-by-Step Migration Strategy

### Step 3.1: Dependency Transition
1. **Install Official Firebase Modular SDK**:
   ```bash
   npm install firebase@^11.0.0
   ```
2. **Uninstall Supabase**:
   ```bash
   npm uninstall @supabase/supabase-js
   ```

### Step 3.2: Central Firebase Service Module (`src/lib/firebase.ts`)
Create a single, centralized Firebase service module providing typed access to:
* `getAuth(app)`: Authentication instance
* `getFirestore(app)`: Cloud Firestore instance
* `GoogleAuthProvider`: Google OAuth provider
* Firebase Auth state change helpers
* Firestore document reference helpers (`doc(firestore, 'hunters', uid)`, `collection(firestore, 'leaderboard')`)

### Step 3.3: Authentication Service Migration (`src/lib/auth.tsx`)
Replace all Supabase auth logic with Firebase Auth:
1. **Email / Password Registration**:
   * Calls `createUserWithEmailAndPassword(auth, email, password)`
   * Updates profile display name via `updateProfile(user, { displayName })`
   * Writes initial `HunterProfile` into Firestore document `hunters/{uid}`
2. **Email / Password Sign-In**:
   * Calls `signInWithEmailAndPassword(auth, email, password)`
   * On success, immediately loads `hunters/{uid}` from Firestore
3. **Google Sign-In**:
   * Calls `signInWithPopup(auth, new GoogleAuthProvider())`
   * Checks if `hunters/{uid}` exists; if not, triggers default profile creation
4. **Anonymous Sign-In (Guest Trial)**:
   * Calls `signInAnonymously(auth)`
   * Creates guest hunter profile matching Flutter's guest mode
5. **Sign Out**:
   * Calls `signOut(auth)`
   * Clears local storage state and resets context
6. **Persistence**:
   * Configures `browserLocalPersistence` so sessions survive browser tabs, reloads, and closures

### Step 3.4: Data Storage & Real-Time Sync (`src/lib/hunter-store.tsx`)
Replace Supabase SQL queries with Firestore SDK:
1. **Real-Time Snapshot Listener (`onSnapshot`)**:
   ```typescript
   const hunterDocRef = doc(firestore, 'hunters', user.uid);
   const unsubscribe = onSnapshot(hunterDocRef, (snapshot) => {
     if (snapshot.exists()) {
       const remoteData = snapshot.data();
       // Seamlessly update local React state
       setProfile(migrateFirestoreProfile(remoteData));
       if (remoteData.activeQuests) {
         setQuests(remoteData.activeQuests);
       }
     }
   });
   ```
2. **Atomic Writes (`setDoc` with `merge: true`)**:
   * Any change made on Web (e.g. completing a quest, allocating stat points, updating titles) writes directly to `hunters/{uid}` in Firestore.
   * Simultaneously updates `leaderboard/{uid}` with current level, rank, and XP.
3. **Listener Cleanup**:
   * In `useEffect` cleanup return functions, ensure `unsubscribe()` is invoked to prevent memory leaks and redundant Firestore reads.

### Step 3.5: Leaderboard Migration (`src/components/leaderboard.tsx`)
1. Replace Supabase `leaderboard_view` query with Firestore query:
   ```typescript
   const q = query(
     collection(firestore, 'leaderboard'),
     orderBy('totalXp', 'desc'),
     limit(25)
   );
   const snap = await getDocs(q);
   ```
2. Fallback to Solo Leveling Guild seed entries (matching Flutter's `FirebaseService.fetchLeaderboard` demo data) if Firestore is empty.

### Step 3.6: Complete Supabase File & Reference Purge
1. Delete `src/lib/supabase.ts`
2. Delete `supabase/` folder containing migrations and SQL scripts
3. Search entire codebase for `supabase`, `@supabase`, `VITE_SUPABASE`
4. Remove Supabase references in `.env.example`, `package.json`, and comments

---

## 4. Cross-Platform Synchronization Flow

```mermaid
sequenceDiagram
    autonumber
    actor Android as Android App (Flutter)
    participant FS as Cloud Firestore (hunters/{uid})
    actor Web as Web Client (React)

    Note over Android,Web: Both authenticated with same Firebase UID
    Android->>FS: Complete Quest (+60 XP, Level 5, STR +1)
    FS-->>Web: onSnapshot trigger (Instant Real-Time Stream)
    Note over Web: Web UI updates immediately: XP bar fills, Level increases, STR increments
    Web->>FS: Allocate 1 Stat Point to AGI (+1 AGI, -1 SP)
    FS-->>Android: onSnapshot / Firestore stream updates Android immediately
    Note over Android: Android Profile & Stats reflect AGI +1 instantly
```

---

## 5. Security & Error Handling

1. **Authentication State Verification**:
   * No unauthenticated writes to `hunters/{uid}`.
   * `uid` parameter always derived from `auth.currentUser.uid`, never from client-controlled request bodies.
2. **Offline Fallback**:
   * Mirror Flutter's offline resilience: maintain local `localStorage` copy of profile and active quests.
   * If network connection drops, the local copy ensures zero lag or blank screens; writes sync once reconnected.
3. **Firestore Security Rules**:
   * Enforce user ownership: `request.auth.uid == userId`.
   * Public read for `leaderboard` collection with authenticated write restricted to `request.auth.uid == resource.data.id`.
