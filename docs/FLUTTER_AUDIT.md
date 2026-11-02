# HUNTR — Deep Flutter Application Audit (Source of Truth)

**Repository Reference**: [https://github.com/kavya-dungrani/HUNTR](https://github.com/kavya-dungrani/HUNTR)  
**Local Location**: `C:\Users\MAHESH\Documents\Kavya\Hunter`  
**Audit Date**: October 2026  
**Auditor**: Principal Flutter Engineer & Senior Full-Stack Architect  

---

## 1. Executive Summary

The Flutter application serves as the **authoritative reference implementation (Source of Truth)** for the HUNTR platform — a gamified self-improvement and productivity RPG inspired by *Solo Leveling*. The application embodies a dark cyberpunk/dungeon aesthetic, responsive layout paradigms, real-time Firebase backend integration, sound and haptic cues, and a state engine governed by `Provider`.

---

## 2. Technical Stack & Dependencies

From `pubspec.yaml`:
* **Flutter SDK**: `^3.13.5` (Dart SDK 3.x)
* **Core Dependencies**:
  * `firebase_core: ^3.15.2`: Firebase SDK root initialization
  * `firebase_auth: ^5.5.1`: Authentication engine (Email/Password, Google Sign-In, Anonymous)
  * `cloud_firestore: ^5.6.5`: Cloud Firestore database engine
  * `google_sign_in: ^7.2.0`: Google OAuth provider
  * `provider: ^6.1.5`: Reactive state management (`ChangeNotifierProvider`, `Consumer`)
  * `shared_preferences: ^2.5.3`: Local disk persistence and offline fallback cache
  * `google_fonts: ^6.2.1`: Rajdhani and Orbitron typography integration
  * `confetti: ^0.8.0`: Celebration particles on level-up
  * `uuid: ^4.5.1`: Identifier generation
  * `cupertino_icons: ^1.0.8`: Native iconography

---

## 3. Architecture & Directory Anatomy

```
lib/
├── firebase_options.dart               # Multiplatform Firebase config
├── main.dart                           # Entrypoint, theme bootstrap, root router
├── models/
│   ├── achievements.dart               # 21 achievement definitions & unlock rules
│   ├── daily_system.dart               # DungeonBreak, Red Gates, daily quest generator
│   ├── game_engine.dart                # Core formulas: XP, level, rank, stats, HP/MP
│   └── quest_library.dart              # Pre-registered quest codex (30+ trials)
├── providers/
│   └── hunter_provider.dart            # Central business logic & reactive state
├── screens/
│   ├── hunter_auth_screen.dart         # Sign In / Sign Up / Affinity Selection / Google Auth
│   ├── hunter_hub_screen.dart          # Primary Dashboard (HUD, Gauges, Gates, Quests)
│   ├── leaderboard_screen.dart         # Guild Hall / Global Rankings (#1-#25, top 3 podium)
│   ├── profile_screen.dart             # Status Window (Attributes, Titles, Achievements, Combat Power)
│   └── system_awakening_screen.dart    # Onboarding ceremony & soul attunement
├── services/
│   ├── audio_service.dart              # Audio playback & haptic feedback controller
│   └── firebase_service.dart           # Firebase Auth & Firestore CRUD/Sync layer
├── theme/
│   └── hunter_theme.dart               # Color tokens, gradients, card decorations, button styles
└── widgets/
    ├── add_quest_dialog.dart           # Custom quest modal builder
    ├── level_up_dialog.dart            # Elastic animated modal with confetti on level-up
    ├── notification_center_dialog.dart # System Logs / Transmissions archive
    ├── quest_codex_dialog.dart         # Codex modal to browse and accept trials
    └── system_settings_dialog.dart     # System protocols, audio switch, logout, reset
```

---

## 4. Design System & Theming Tokens

Defined in `lib/theme/hunter_theme.dart`:

### 4.1 Color Palette
* **Backgrounds**:
  * Root Background (`bgDark`): `#070913` / `#060912`
  * Card Surface (`bgCard`): `#0d1117` / `#0c101e` / `#0e1322`
  * Card Elevated (`bgCardLight`): `#161b22` / `#14192b`
  * Input Surface (`bgSurface`): `#1a1f2e` / `#070a14`
* **Borders**:
  * Default Dim: `#21262d` / `#1c253d`
  * Light / Active: `#30363d` / `#26324d`
* **Accent Colors**:
  * Cyan Primary: `#06b6d4`
  * Cyan Light / Glow: `#67e8f9`
  * Purple Secondary: `#8b5cf6`
  * Pink Accent: `#ec4899`
  * Amber (XP/Gold): `#f59e0b` / `#eab308`
  * Emerald (Success/Vitality): `#10b981`
  * Red / Crimson (Danger/STR): `#ef4444` / `#f43f5e`
  * Blue (Mana): `#3b82f6`
  * Slates: `slate300: #cbd5e1`, `slate400: #94a3b8`, `slate500: #64748b`, `slate600: #475569`
* **Stat Colors**:
  * **STR**: `#ef4444` (Kinetic Red)
  * **AGI**: `#06b6d4` (Shadow Cyan)
  * **VIT**: `#10b981` (Life Emerald)
  * **INT**: `#8b5cf6` (Mana Purple)
  * **PERC**: `#f59e0b` (Discipline Amber)
* **Vitals**:
  * **HP**: `#f43f5e`
  * **MP**: `#3b82f6`

### 4.2 Typography
* **System Headings / Ranks / HUD**: `Orbitron` (Google Font), `FontWeight.w700` / `w900`, uppercase, `letterSpacing: 1.5 - 3.0`
* **Body / Labels / Form Elements**: `Rajdhani` (Google Font), `FontWeight.w500` / `w600` / `w700`

### 4.3 Visual Elevation & Glows
* Cyan holographic cards with `boxShadow: [BoxShadow(color: cyan.withAlpha(0.2-0.35), blurRadius: 20-30)]`
* Red Gate glowing alert box with crimson pulse shadow (`#ef4444`)
* Border radii: Standard `12px` - `16px` for cards, `8px` - `10px` for buttons and chips, `20px` for dialogs

---

## 5. Screen-by-Screen Inventory

### 5.1 Root Router (`HunterRootRouter` in `main.dart`)
* Checks `hunter.isLoading`: Shows centered spinner with glowing text: `"INITIALIZING HUNTER SYSTEM..."`
* If `hunter.isOnboarded` (`hunter.profile != null`): Navigates immediately to `HunterHubScreen`.
* Otherwise: Navigates to `HunterAuthScreen`.

### 5.2 Hunter Authentication Screen (`hunter_auth_screen.dart`)
* Dual Mode: **LOG IN** and **SIGN UP** tabs with smooth border/background animation.
* **Sign Up Flow**:
  * Hunter Designation Name (text)
  * Communication Codex / Email
  * Passcode & Confirm Passcode (with hide/show toggle)
  * **Core Affinity Selector**: Horizontal glowing pills for `STR`, `AGI`, `VIT`, `INT`, `PERC` with descriptive badges (`Monarch of Destruction`, `Shadow Step Assassin`, etc.).
  * "AWAKEN HUNTER" submit button.
* **Log In Flow**:
  * Email & Passcode inputs
  * "AUTHENTICATE LICENSE" submit button.
* **Alternative Options**:
  * "Continue with Google" button (branded G icon, direct Google Auth).
  * "Quick Trial / Offline Guest Mode" button for instant anonymous entry.
* Form validation, clear error messages with Solo Leveling system flavoring.

### 5.3 Hunter Hub Screen (`hunter_hub_screen.dart`)
The main game command center:
1. **Top HUD Header**:
   * Avatar Shield Icon (clickable, pushes `ProfileScreen`)
   * Display Name & Level
   * Rank Badge pill (`E-RANK`, `D-RANK`, etc.)
   * Hunter ID (`HUNTER-XXXXXX-AFF`) & Equipped Title (`〔The Awakened〕`)
   * Quick action icon buttons: Leaderboard (`Icons.leaderboard`), Notification Center (`Icons.notifications_none`), Settings (`Icons.settings`).
2. **Gauges Card**:
   * **HP (HEALTH)**: Numeric label `HP / MaxHP`, glowing crimson progress indicator.
   * **MP (MANA)**: Numeric label `MP / MaxMP`, glowing blue progress indicator.
   * **LEVEL XP**: Level number, `CurrentXP / NeededXP (Percentage%)`, glowing cyan gradient bar.
3. **Streak Banner**:
   * Fire icon, `X DAY STREAK`, dynamic bonus tag (`+20%`, `+50%`, `+100% Bonus XP`).
4. **Emergency Gate / Red Gate Banner** (when `activeDungeon` is present):
   * Animated red border, `EMERGENCY GATE` badge, 1-second live countdown ticker (`HH:MM:SS`), challenge description, reward badges (`+XP`, `+Stat Points`), `CONQUER GATE` button, and dismiss icon.
5. **Daily Protocols (Mandatory)**:
   * 4-5 dynamic daily quests tailored to rank.
6. **Active Trials & Quests**:
   * Category Filter Pills (`ALL`, `PHYSICAL`, `CODING`, `STUDY`, `DISCIPLINE`).
   * Active quest tiles with Difficulty badge (`E`, `D`, `C`, `B`, `A`, `S`), Target stat (`+STR`, etc.), Title, Description, Progress bar, `+1` increment button, `DONE` button, and delete button if custom.
7. **Bottom Action Bar**:
   * 4 quick-action bottom buttons:
     * `CODEX` (`Icons.menu_book`, cyan) -> opens `QuestCodexDialog`
     * `NEW QUEST` (`Icons.add_box`, purple) -> opens `AddQuestDialog`
     * `STATUS` (`Icons.person`, amber) -> pushes `ProfileScreen`
     * `GUILD` (`Icons.leaderboard`, pink) -> pushes `LeaderboardScreen`
8. **Level Up Modal (`LevelUpDialog`)**:
   * Confetti blast, elastic scale animation, `[ SYSTEM NOTIFICATION ]`, `LEVEL UP!`, `LEVEL X`, rank promotion badge if rank increased, rewards breakdown (`+3 SP`, `+HP/+MP Capacity`), `CLAIM REWARDS` button.

### 5.4 Profile / Status Window Screen (`profile_screen.dart`)
* Holographic Status Card with full hunter statistics:
  * Display Name, Rank Badge, Hunter ID, Equipped Title.
  * Level, Combat Power Rating Formula:
    $$\text{Combat Power} = (\text{Level} \times 45) + (\text{STR} \times 12) + (\text{AGI} \times 11) + (\text{VIT} \times 10) + (\text{INT} \times 13) + (\text{PERC} \times 9)$$
  * Quests Completed, Total XP progress bar.
* **Unassigned Skill Points Banner**: Displays available SP (+3 SP awarded per level up).
* **Primary Attributes Section**:
  * STR, AGI, VIT, INT, PERC cards with individual values, description, progress bars, and `+` point allocation buttons.
* **Earned Titles Section**: Clickable title tags (`The Awakened`, `Shadow Monarch`, `Iron Breaker`, etc.) allowing the player to equip their desired title.
* **Achievements & Badges Section**: 21 achievements in a 2-column grid showing unlocked state, icons, descriptions, and XP rewards.
* Top bar action: Share Profile snackbar, Logout Hunter License button.

### 5.5 Leaderboard / Guild Screen (`leaderboard_screen.dart`)
* Top 3 Podium Cards (#1 Gold, #2 Silver, #3 Bronze) with distinctive glowing borders and trophies.
* Rank Filter Pills: `ALL`, `S-Rank`, `A-Rank`, `B-Rank`, `C-Rank`.
* User Standing Bar: Highlights the currently logged-in user with "(YOU)", their level, rank, and XP.
* Scrollable roster of top 25 hunters with rank number, display name, rank badge, equipped title, level, and total XP.

### 5.6 Modals & Dialogs
* `QuestCodexDialog`: Searchable, categorizable database of 30+ pre-registered quests across physical, coding, study, and health domains. "ACCEPT TRIAL" enrolls the quest directly into active quests.
* `AddQuestDialog`: Form to craft custom trials with custom name, description, target count, category, difficulty grade (E-S), and associated stat boost.
* `SystemSettingsDialog`: Displays linked Hunter ID and account email/UID, Sound Effects toggle, Logout button, and Rebirth / Full System Reset with double confirmation.
* `NotificationCenterDialog`: Displays chronological System Logs timeline with timestamps, event icons, descriptions, and XP bonuses.

---

## 6. Audio & Haptics Engine

Implemented in `lib/services/audio_service.dart`:
* **Sound Toggle**: `soundEnabled` boolean state persisted per user.
* Sound Triggers:
  * `playClick()`: Tap interactions, button presses, tab switches.
  * `playSuccess()`: Quest completion, task clearing.
  * `playLevelUp()`: Level up, rank promotion, gate victory.
  * `playAwakening()`: Initial account registration and awakening ceremony.
  * `playDungeonAlert()`: Red gate emergence.

---

## 7. Firebase Services & Data Schema

Configured in `lib/firebase_options.dart` and `lib/services/firebase_service.dart`:
* **Firebase Project ID**: `hunter-x-guild`
* **Auth**:
  * Email/Password Auth
  * Google Sign-In (`GoogleAuthProvider`)
  * Anonymous Sign-In (`signInAnonymously`)
* **Firestore Collections**:
  1. `hunters/{uid}`: Comprehensive document for user profile, stats, streaks, inventory, and active quests:
     ```json
     {
       "id": "user_uid",
       "hunterId": "HUNTER-XXXXXX-AGI",
       "displayName": "Sung Jin-Woo",
       "totalXp": 589200,
       "currentLevel": 142,
       "stats": { "0": 180, "1": 195, "2": 160, "3": 170, "4": 150 },
       "currentRank": "S-Rank",
       "affinity": "AGI",
       "hp": 400,
       "mp": 400,
       "maxHp": 400,
       "maxMp": 400,
       "physicalXp": 25000,
       "mentalXp": 28000,
       "questsCompleted": 1420,
       "physicalQuestsCompleted": 620,
       "mentalQuestsCompleted": 510,
       "codingQuestsCompleted": 290,
       "streak": 365,
       "physicalStreak": 180,
       "mentalStreak": 150,
       "studyStreak": 90,
       "codingStreak": 120,
       "perfectDayStreak": 85,
       "longestStreak": 365,
       "lastQuestDate": "2026-10-31",
       "titles": ["The Awakened", "Shadow Monarch"],
       "equippedTitle": "Shadow Monarch",
       "badges": ["first_blood", "relentless", "iron_will"],
       "skillPoints": { "strength": 5, "intelligence": 5, "endurance": 5, "discipline": 5, "focus": 5, "agility": 5 },
       "availableSkillPoints": 12,
       "systemLog": [
         { "id": "log-1", "timestamp": 1793472000000, "eventType": "quest_complete", "message": "Completed: 50 Push-ups (+60 XP)", "xp": 60 }
       ],
       "activeQuests": [
         {
           "id": "quest_id",
           "name": "50 Push-ups",
           "description": "Standard push-ups",
           "difficulty": 2,
           "category": 0,
           "stat": 0,
           "progress": 50,
           "target": 50,
           "completed": true,
           "xpReward": 60,
           "statXpReward": 35,
           "statXpType": 0,
           "isCustom": false
         }
       ]
     }
     ```
  2. `leaderboard/{uid}`: Public leaderboard index:
     ```json
     {
       "id": "user_uid",
       "hunterId": "HUNTER-XXXXXX-AGI",
       "displayName": "Sung Jin-Woo",
       "level": 142,
       "rank": "S-Rank",
       "totalXp": 589200,
       "affinity": "AGI",
       "equippedTitle": "Shadow Monarch",
       "questsCompleted": 1420,
       "streak": 365,
       "updatedAt": "SERVER_TIMESTAMP"
     }
     ```

---

## 8. Summary of Strengths

* Clear, self-contained business logic in `game_engine.dart` and `hunter_provider.dart`.
* Instant local caching in `SharedPreferences` with offline resiliency.
* High aesthetic quality matching Solo Leveling lore.
* Robust data structure keeping all user progress atomic in Firestore.
