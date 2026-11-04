# HUNTR Feature Verification Status Matrix
**Updated: November 2026**

Legend:
- **WORKING**: Verified in runtime and unit test suites.
- **PARTIAL**: Implemented on client; server-side cloud function / emulator test pending.
- **BLOCKED**: Requires external Firebase project owner permissions.

---

## 1. Authentication & Onboarding
| Feature | Status | Notes |
|---|---|---|
| Email Sign-up | **WORKING** | Creates Firebase Auth credential, sets display name, creates hunter profile |
| Email Login | **WORKING** | Authenticates with `signInWithEmailAndPassword`, syncs presence |
| Google Sign-In | **WORKING** | Popup with fallback to redirect flow on popup blocker |
| Guest Login | **WORKING** | Anonymous sign-in for zero-friction preview |
| Logout | **WORKING** | Signs out and clears in-memory user cache |
| System Awakening Flow | **WORKING** | First-time onboarding, affinity selection, Hunter ID generation |
| Returning User Login | **WORKING** | Detects existing profile in Firestore, skips awakening |
| Username Uniqueness | **WORKING** | Validated via `usernames/{username}` lowercase registry |
| Hunter ID Uniqueness | **WORKING** | Enforced via `hunterIds/{hunterId}` immutable documents |
| Account Deletion | **WORKING** | Purges presence, leaderboard, public player, and auth user |

---

## 2. Core Productivity & Game Loop
| Feature | Status | Notes |
|---|---|---|
| Dashboard Hub | **WORKING** | Two-column responsive layout with stats and quest board |
| Quest Creation (Custom) | **WORKING** | Modal with difficulty, category, stat target configuration |
| Quest Deletion & Undo | **WORKING** | 7-second grace recovery window with banner |
| Quest Completion | **WORKING** | Idempotent in-flight lock, XP & stat point awards |
| Stat Allocation Page | **WORKING** | Allocate available points to STR, AGI, INT, VIT, SEN |
| Level Progression | **WORKING** | Level calculation formula verified via automated unit test |
| Rank Promotion Modal | **WORKING** | Full-screen celebration with rewards grid |
| Boss Quests | **WORKING** | Complete & dismiss synchronized with Firestore |
| Dungeon Breaks | **WORKING** | Timed urgent challenge with stat boosts |
| Daily Streaks | **WORKING** | Multipliers up to 3.0x (100d) |
| Achievements Codex | **WORKING** | Unlocked achievements tracking and badges |
| Personal Records | **WORKING** | Benchmark tracking for physical, mental, coding habits |

---

## 3. Smart Productivity Suite
| Feature | Status | Notes |
|---|---|---|
| Deep Focus Chamber | **WORKING** | 25/5/15 Pomodoro timer with procedural Web Audio brown noise |
| Goal Builder | **WORKING** | 3-phase offline goal breakdown into actionable daily quests |
| Weekly Report | **WORKING** | 7-day metric aggregation with XP and momentum score |
| Time Capsule Protocol | **WORKING** | Future rank-locked sealed messages stored in localStorage |
| Comeback Protocol | **WORKING** | Triggered automatically when inactivity exceeds 3 days |
| RAPHAEL System Advisor | **WORKING** | Deterministic local tactical briefing, math calculator, goal deconstructor |
| Command Palette | **WORKING** | Global `Ctrl+K` shortcut, keyboard navigation, view switching |
| Mobile Bottom Navigation | **WORKING** | Fixed docking bar on viewports < 768px |
| Information Pages | **WORKING** | Routed views for `/about`, `/help`, `/faq`, `/feedback`, `/changelog` |

---

## 4. Social & Multiplayer
| Feature | Status | Notes |
|---|---|---|
| Player Search | **WORKING** | Search authenticated public directory via `players` collection |
| Friend Requests | **WORKING** | Validated sender/receiver, status transitions (`pending`, `accepted`, `declined`) |
| Real-time Presence | **WORKING** | Heartbeat updating `presence/{uid}` with online/offline timestamp |
| Guild Discovery | **WORKING** | Browse existing open and request-based guilds |
| Guild Creation | **WORKING** | Creates guild document and initializes leader member record |
| Guild Join & Leave | **WORKING** | Join open guilds or submit join request to leader |
| Global Leaderboard | **WORKING** | Synced via `leaderboard/{uid}` ranking by total XP |

---

## 5. Security & Infrastructure
| Feature | Status | Notes |
|---|---|---|
| Least Privilege Firestore Rules | **WORKING** | Hardened local `firestore.rules` ready for deployment |
| Cross-Account LocalStorage Isolation | **WORKING** | UID-scoped keys prevent cache leakage between users |
| Server-Side Reward Validation | **PARTIAL** | Cloud Functions design documented in `SECURITY_REVIEW.md`; deployment requires owner clearance |
| Automated Unit Tests | **WORKING** | Node.js built-in test runner validating game engine & rules |
| Vercel Deployment & Preview | **WORKING** | Preview verified HTTP 200 OK |
| Production Rule Deployment | **BLOCKED** | Requires owner granting IAM Editor on `hunter-x-guild` to CLI account |

