# HUNTR — Deep Web Application Audit

**Repository Reference**: [https://github.com/rushikesh19052007/Hunter-System.git](https://github.com/rushikesh19052007/Hunter-System.git)  
**Local Location**: `C:\Users\MAHESH\Documents\Kavya\Hunter-System`  
**Audit Date**: October 2026  
**Auditor**: Principal Full-Stack Engineer & Firebase Architect  

---

## 1. Executive Summary

The independent web application is built as a **Single Page Application (SPA)** using **React 19, TypeScript, and Vite**. While it shares the gamified RPG concept inspired by *Solo Leveling*, it currently operates on an **isolated Supabase backend** (`@supabase/supabase-js`) with distinct database tables, schema conventions, and layout discrepancies compared to the Flutter reference application.

---

## 2. Technical Stack & Dependencies

From `package.json`:
* **Runtime / Framework**: `React 19.2.8` & `React-DOM 19.2.8`
* **Build Tool**: `Vite 8.3.0` with `@vitejs/plugin-react 6.1.1`
* **Language & Linter**: `TypeScript ~6.0.2`, `oxlint ^1.81.0`
* **Styling & UI**:
  * Tailwind CSS utilities & custom stylesheet system (`index.css`, `App.css`)
  * `lucide-react: ^1.46.0` (iconography)
  * `framer-motion: ^13.3.0` (transitions and component animations)
  * `canvas-confetti: ^1.9.4` (particle effects)
* **Backend Layer (Target of Deprecation)**:
  * `@supabase/supabase-js: ^2.116.0`
* **Deployment Target**: Vercel (`vercel.json`) with SPA routing rewrites.

---

## 3. Architecture & Directory Anatomy

```
src/
├── App.css                             # Application-level styling and layout
├── App.tsx                             # Root layout, notifications toast, tab switcher
├── index.css                           # Global design system tokens and typography
├── main.tsx                            # React DOM entrypoint
├── assets/
│   ├── hero.png                        # Hero visual artwork
│   ├── react.svg                       # Default template asset (unused)
│   └── vite.svg                        # Default template asset (unused)
├── components/
│   ├── hidden-quests-widget.tsx        # Secret archives preview
│   ├── leaderboard.tsx                 # Supabase-based leaderboard & seed generator
│   ├── notification-center-modal.tsx   # System logs & notifications modal
│   ├── quest-codex-modal.tsx           # Library quest browser modal
│   ├── quest-guide-modal.tsx           # Individual quest execution guidance
│   └── system-settings-modal.tsx       # Audio toggles, quiet hours, local activity logs
├── lib/
│   ├── achievements.ts                 # Achievement rules & hidden quest definitions
│   ├── analytics.ts                    # Local in-memory telemetry buffer
│   ├── auth.tsx                        # Supabase auth wrapper & 5-year session retention
│   ├── daily-system.ts                 # Dungeon break, daily pool, streaks
│   ├── default-quests.ts               # Starter quests
│   ├── game-engine.ts                  # XP, level, rank, stats, HP/MP formulas
│   ├── hunter-store.tsx                # React context state engine (Supabase debounced sync)
│   ├── notifications.ts                # Web Audio API synthesizers & toast notifications
│   ├── quest-library.ts                # 30+ library quests
│   └── supabase.ts                     # Supabase client initialization (To be removed)
└── routes/
    ├── dashboard/
    │   ├── account-settings-page.tsx   # Vitals, export/import JSON, danger zone reset
    │   ├── hunter-hub.tsx              # Split-screen dashboard (Left: Status, Right: Quests)
    │   ├── profile-page.tsx            # Full-page status window with tabbed sections
    │   └── stat-allocation-page.tsx    # Standalone stat & skill allocation page
    └── onboarding/
        └── system-awakening.tsx        # 5-step onboarding ceremony with timer
```

---

## 4. Current Supabase Integrations (To Be Replaced)

Supabase is currently deeply intertwined with several modules:

### 4.1 Client Initialization (`src/lib/supabase.ts`)
* Reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
* Exports singleton `supabase` client and `isSupabaseConfigured` flag.

### 4.2 Authentication Flow (`src/lib/auth.tsx`)
* Calls `supabase.auth.getSession()` and `supabase.auth.onAuthStateChange()`.
* Calls `supabase.auth.signInWithOAuth({ provider: 'google' })`.
* If Supabase is unconfigured or errors, falls back to simulated offline users (`hunter.solo@gmail.com`).
* Persists sessions in `localStorage` under `hunter_auth_session` with a custom 5-year expiration check.

### 4.3 Profile Synchronization (`src/lib/hunter-store.tsx`)
* Debounced 1.5-second auto-save sending SQL updates:
  ```typescript
  client.from('profiles').upsert({
    id: profile.id,
    hunter_id: profile.hunter_id,
    display_name: profile.display_name,
    total_xp: profile.total_xp,
    current_level: profile.current_level,
    stats: profile.stats,
    ...
  })
  ```
* Rehydrates on startup by querying `supabase.from('profiles').select('*').eq('id', uid).single()`.

### 4.4 Global Leaderboard (`src/components/leaderboard.tsx`)
* Queries `supabase.from('leaderboard_view').select('*').order(orderCol).limit(100)`.
* Aggregates summary statistics by querying `supabase.from('profiles').select('id, total_xp, current_level, affinity')`.
* Fills gaps with generated seed hunters if Supabase is offline.

### 4.5 Account Reset / Danger Zone (`src/routes/dashboard/account-settings-page.tsx`)
* Deletes rows in `notifications`, `system_log_events`, and `achievements` tables.
* Archives user into `backup_profiles`.

---

## 5. UI/UX Differences vs. Flutter Reference

While the web application has a cyberpunk theme, it differs from Flutter in key visual and architectural ways:

1. **Top Header & Navigation**:
   * **Web**: Uses a desktop horizontal navbar with tab buttons (`DASHBOARD`, `STATS`, `PROFILE`, `LEADERBOARD`, `SETTINGS`) plus theme toggles and logout.
   * **Flutter**: Features an integrated mobile/responsive **Top HUD** (clickable avatar shield, hunter ID, rank pill, quick icon buttons for Leaderboard, Notifications, Settings) and a persistent **Bottom Action Bar** (`CODEX`, `NEW QUEST`, `STATUS`, `GUILD`).
2. **Dashboard Layout**:
   * **Web**: Employs a 2-column split desktop grid (`hub-profile-panel` on the left, `hub-quest-panel` on the right).
   * **Flutter**: Employs a unified, mobile-first vertical stack:
     - Top HUD
     - Gauges Card (HP, MP, XP bars together)
     - Streak Banner (with dynamic multiplier tag)
     - Emergency Gate Banner (if active)
     - Daily Protocols Section
     - Active Trials & Quests with category pill filters
3. **Authentication & Onboarding**:
   * **Web**: Separates login into an `AuthGate` screen, and then an independent 5-step `SystemAwakening` route.
   * **Flutter**: Combines login and awakening smoothly in `HunterAuthScreen` (Sign In / Sign Up tabs with animated borders, live affinity selector with description, Google auth, and guest trial).
4. **Dialogs & Overlay Components**:
   * Flutter utilizes modal dialogs for `LevelUpDialog` (with confetti), `QuestCodexDialog`, `AddQuestDialog`, `SystemSettingsDialog`, and `NotificationCenterDialog`.
   * Web currently uses a mix of full-page routes and modals.
5. **Color Accents & Glows**:
   * Web uses standard Tailwind utility classes (`text-cyan-400`, `bg-slate-900`) alongside custom CSS.
   * Flutter uses exact HSL/Hex tokens: Cyan `#06b6d4`, Light Cyan `#67e8f9`, Purple `#8b5cf6`, Pink `#ec4899`, Crimson `#ef4444`, Amber `#f59e0b`.

---

## 6. Audio Engine Audit

The web app implements an acoustic synthesizer in `src/lib/notifications.ts` utilizing the browser's `AudioContext` (Web Audio API):
* `playSystemChime('quest')`: High-frequency two-tone acoustic ping (`880Hz -> 1760Hz`).
* `playSystemChime('level')`: Major triad chord progression (`C5 -> E5 -> G5 -> C6`).
* `playSystemChime('alert')`: Low pulsing alarm tone (`220Hz -> 165Hz`).
* This approach avoids network round-trips for audio files, operates with zero latency, and respects user mute preferences and browser autoplay restrictions.

---

## 7. Migration Requirements

1. **Remove Supabase**:
   * Uninstall `@supabase/supabase-js`.
   * Delete `src/lib/supabase.ts` and `supabase/` directory.
   * Remove `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env.example` and codebase.
2. **Install & Initialize Firebase**:
   * Install official `firebase` package (`^11.x` or `^10.x`).
   * Create `src/lib/firebase.ts` with web credentials from Flutter's `firebase_options.dart`.
   * Implement Firebase Auth with Email/Password, Google Sign-In (`signInWithPopup`), and Anonymous Auth.
3. **Align Data Layer with Flutter Firestore**:
   * Migrate reads/writes to `hunters/{uid}` and `leaderboard/{uid}` with Firestore real-time listeners (`onSnapshot`).
4. **Replicate Flutter UI/UX & Responsive Flow**:
   * Recreate the Flutter Top HUD and Bottom Action Bar.
   * Reproduce exact colors, Orbitron/Rajdhani typography, and dialog designs.
