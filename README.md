# ⚔️ HUNTR — The Hunter System

> *"You have been chosen. The System has awakened."*

**HUNTR** is a personal productivity RPG web application inspired by *Solo Leveling*. Turn real-world habits into directives, allocate stat points, climb ranks from **E-Rank** to **S-Rank**, lead hunter syndicates, and compete on the global leaderboard.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-13-FFCA28?logo=firebase&logoColor=black)
![Deployed on Vercel](https://img.shields.io/badge/Vercel-Deployed-000?logo=vercel&logoColor=white)

---

## ✨ Features

### 🎮 Core Gameplay & Progression
- **Directive & Quest System** — Create, track, and clear quests across 13+ categories (Physical, Coding, Study, Mental, Health, Discipline).
- **Difficulty Grades** — E-Class through S-Class directives with scaling XP and stat point rewards.
- **Stat Point Allocation** — Distribute attribute points into five core parameters: `STR`, `AGI`, `VIT`, `INT`, and `PERC`.
- **HP & MP Pools** — Max HP scales with physical training; Max MP expands through mental focus and deep work.
- **Hunter Ranking** — Progression through E-Rank → D-Rank → C-Rank → B-Rank → A-Rank → S-Rank.

### 🛡️ Guilds & Social Syndicate
- **Hunter Syndicates** — Form or join guilds with open enrollment or request-to-join permissions.
- **Guild Roles** — Syndicate Master role with authority to promote unlimited Commanders or expel members.
- **Hunter Dossiers** — Inspect allied hunter profiles, stat distributions, equipped titles, and achievements.
- **Friend Network** — Send friend requests, accept alliances, and observe real-time status.

### 🏛️ Competitive & Analytics
- **Global Leaderboard** — Live worldwide standings filterable by rank tier (S, A, B, C) and sorted by XP, level, or streak.
- **Training Library // Hunter Codex** — Search and discover 179+ curated directives and challenges.
- **Hunter Profile & Telemetry** — Interactive life balance radar, attribute matrix, and title mastery.

### 🧠 Tactical System Modules
- **RAPHAEL // System Advisor** — Deterministic, offline tactical intelligence delivering comeback plans and goal deconstruction.
- **Focus Chamber** — Integrated Pomodoro focus sessions paired with synthetic ambient brown/white noise generator.
- **System Awakened Visuals** — Pitch-black backdrop, Monarch Blood Red / Crimson palette, and a pure-white light mode.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript 6, Vite 8 |
| **Styling** | Modular CSS, Design Tokens, Framer Motion |
| **Backend & Auth** | Firebase Authentication, Cloud Firestore |
| **Icons & Audio** | Lucide React, Web Audio API |
| **Hosting** | Vercel (SPA configuration) |

---

## 📁 Project Structure

```
Hunter-System/
├── public/                     # Static assets, web app manifest, service worker
├── src/
│   ├── components/             # Reusable modal and interface components
│   │   ├── focus-chamber-modal.tsx
│   │   ├── goal-builder-modal.tsx
│   │   ├── hunter-auth-screen.tsx
│   │   ├── leaderboard.tsx
│   │   ├── mobile-nav-bar.tsx
│   │   ├── player-profile-modal.tsx
│   │   ├── quest-codex-modal.tsx
│   │   ├── raphael-assistant-modal.tsx
│   │   └── system-settings-modal.tsx
│   ├── lib/                    # Game engine and service modules
│   │   ├── audio-service.ts    # Web Audio synth and SFX
│   │   ├── auth.tsx            # Firebase Auth provider
│   │   ├── game-engine.ts      # XP curves, ranks, HP/MP calculations
│   │   ├── guild-service.ts    # Syndicate operations and role management
│   │   ├── hunter-store.tsx    # State management and offline persistence
│   │   └── quest-library.ts    # Codex directive database
│   ├── routes/
│   │   ├── dashboard/
│   │   │   ├── account-settings-page.tsx
│   │   │   ├── friends-page.tsx
│   │   │   ├── guilds-page.tsx
│   │   │   ├── hunter-hub.tsx
│   │   │   └── profile-page.tsx
│   │   └── onboarding/
│   │       └── system-awakening.tsx
│   ├── App.tsx                 # Root application container & tab router
│   ├── App.css                 # Base dashboard layouts & responsive rules
│   ├── index.css               # Design system variables & component themes
│   └── main.tsx                # Client entrypoint
├── tests/                      # Automated game engine verification suite
├── package.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Installation
```bash
git clone https://github.com/rushikesh19052007/Hunter-System.git
cd Hunter-System/WEB
npm install
```

### Development
```bash
npm run dev
```

### Verification & Testing
```bash
npm test
npm run build
```

---

## 🎯 Game Mechanics

### Difficulty & Reward Scaling

| Grade | Label | Base XP | Stat XP | Stat Points |
|---|---|---|---|---|
| **E** | E-Class | 15 | 10 | 1 |
| **D** | D-Class | 35 | 20 | 2 |
| **C** | C-Class | 60 | 35 | 3 |
| **B** | B-Class | 100 | 60 | 4 |
| **A** | A-Class | 150 | 100 | 5 |
| **S** | S-Class | 250 | 180 | 8 |

### Hunter Attributes
- **STR (Strength)**: Physical endurance, resistance workouts, raw power.
- **AGI (Agility)**: Cardiovascular performance, reflexes, habit speed.
- **VIT (Vitality)**: Recovery capacity, sleep hygiene, total HP pool.
- **INT (Intelligence)**: Mental acuity, deep work, logic, cognitive expansion, total MP pool.
- **PERC (Perception)**: Focus retention, situational awareness, mindfulness.

---

<p align="center">
  <strong>⚡ Arise, Hunter. Your system awaits. ⚡</strong>
</p>
