# HUNTR Security Architecture & Review
**Authoritative Security Evaluation — Firebase Project `hunter-x-guild`**

---

## 1. Executive Summary

This security review details the vulnerability remediation, data isolation policies, and authorization rules implemented for the HUNTR platform across its shared Firebase infrastructure (`hunter-x-guild`).

> [!IMPORTANT]
> **Production Safety Guarantee**: Proposed rules in `firestore.rules` are prepared locally for testing and audit. In compliance with strict safety directives, no security rules have been deployed to the live production Firestore instance without manual user confirmation and approval.

---

## 2. Identified Vulnerabilities & Hardening

| Component | Previous Rule Behavior | Identified Vulnerability | Hardened Policy |
|---|---|---|---|
| `guilds/{guildId}` | `allow update: if isAuthenticated();` | Any authenticated user could overwrite guild name, description, or change `leaderUid` to hijack leadership. | Restricted update: only the guild leader (`resource.data.leaderUid == request.auth.uid`) can edit guild properties. Non-leaders are restricted to atomic `memberCount` & `updatedAt` increments during join/leave transactions. |
| `guilds/.../members/{uid}` | `allow read, write: if isAuthenticated();` | Any user could modify or delete another user's guild membership or forge admin/officer roles. | Create: restricted to self-join (`auth.uid == uid`) or leader addition. Update: strictly guild leader. Delete: self-leave or leader kick. |
| `guilds/.../joinRequests/{uid}` | `allow read, write: if isAuthenticated();` | Any user could approve, reject, or delete another hunter's join request. | Create: strictly applicant (`auth.uid == uid`). Read/Update/Delete: restricted to applicant or guild leader. |
| `friendRequests/{requestId}` | Unchecked fields & transitions | Self-friend requests were possible; status transitions could be abused; sender/receiver IDs could be forged. | Added validation: `fromUid != toUid`, initial status must be `'pending'`, update must preserve identities, and status can only transition between `['pending', 'accepted', 'declined']`. |
| `players/{userId}` vs `hunters/{userId}` | Potential leak of private notes, email, or habits | Writing un-sanitized profile objects could leak private data to the public search index. | Sanitization barrier in `syncPublicPlayer`: strictly filters to public fields (`displayName`, `hunterId`, `username`, `level`, `rank`, `totalXp`, `affinity`, `title`, `badges`). Private quests, habits, capsule, and credentials remain solely in `hunters/{userId}`. |

---

## 3. Data Isolation & Privacy Boundary

### 3.1 Private Data Boundary (`/hunters/{userId}`)
- **Owner-only read/write**: `request.auth.uid == userId`.
- Stores user directives, personal records, active quest progress, habits, notes, and local configuration.
- Completely inaccessible to any other user.

### 3.2 Public Data Boundary (`/players/{userId}` & `/leaderboard/{userId}`)
- Readable by all authenticated hunters for friend search, guild member rosters, and global leaderboards.
- Contains zero personally identifiable information (no email, no OAuth tokens, no personal notes, no private quest descriptions).

---

## 4. Cheat Resistance & Server-Side Progression Validation

### Current State: Client-Authoritative Progression
Under current Firestore client SDK operation, XP calculation and stat point allocation are executed on the client and written to `hunters/{userId}` and `leaderboard/{userId}`. While client-side rate limiting and idempotency guards are in place, any client with valid Firebase Auth tokens could theoretically craft direct Firestore writes.

### Server-Side Validation Blueprint (Cloud Functions)
To make HUNTR 100% cheat-proof in a future tier, progression writes should transition to a Callable Cloud Function:

```typescript
// Proposed Cloud Function: completeDirective
// (Designed for zero-dependency local verification - DO NOT DEPLOY WITHOUT APPROVAL)

export const completeDirective = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  const uid = context.auth.uid;
  const { questId, verificationProof } = data;

  const hunterRef = admin.firestore().doc(`hunters/${uid}`);
  const snap = await hunterRef.get();
  if (!snap.exists) {
    throw new functions.https.HttpsError('not-found', 'Hunter profile not found');
  }

  const profile = snap.data();
  const quest = (profile.activeQuests || []).find((q: any) => q.id === questId);
  if (!quest || quest.completed) {
    throw new functions.https.HttpsError('failed-precondition', 'Directive already completed or not found');
  }

  // Authoritative server-side XP & stat point calculation
  const xpReward = DIFFICULTY_XP[quest.difficulty] || 25;
  const statPoints = DIFFICULTY_STAT_POINTS[quest.difficulty] || 1;

  // Apply atomic increment
  await hunterRef.update({
    total_xp: admin.firestore.FieldValue.increment(xpReward),
    available_stat_points: admin.firestore.FieldValue.increment(statPoints),
    quests_completed: admin.firestore.FieldValue.increment(1),
    'activeQuests': profile.activeQuests.map((q: any) =>
      q.id === questId ? { ...q, completed: true, completedAt: admin.firestore.FieldValue.serverTimestamp() } : q
    ),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, xpAwarded: xpReward, statPointsAwarded: statPoints };
});
```

*Status: Architecture designed and documented. Deployment pending owner review and billing clearance.*

---

## 5. Security Testing Verification

Local test suite in `tests/game-engine.test.ts` validates:
1. Username regex validation (`^[a-z0-9_]{3,20}$`) rejects illegal characters, spaces, and casing.
2. Hunter ID entropy and format (`HUNTR-[2-9A-HJ-NP-Z]{8}`).
3. Quest completion idempotency and in-flight deduplication.
4. Friend request identity equality checks (`fromUid != toUid`).
5. Scoped storage key generation preventing cross-account state leakage.
