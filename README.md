# ⚔️ HUNTR — The Hunter System

> *"You have been chosen. The System has awakened."*

**HUNTR** is a gamified self-improvement web app inspired by *Solo Leveling*. Turn your real-life goals into quests, level up your stats, climb the ranks from **E-Rank** to **S-Rank**, and compete on a global leaderboard — all wrapped in a cinematic, anime-styled interface.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-13-FFCA28?logo=firebase&logoColor=black)
![Deployed on Vercel](https://img.shields.io/badge/Vercel-Deployed-000?logo=vercel&logoColor=white)

---

## ✨ Features

### 🎮 Core Gameplay Loop
- **Quest System** — Accept, create, and complete quests across 13+ categories (Physical, Coding, Study, Mental, Health, Discipline, and more)
- **Difficulty Grades** — E-Class through S-Class quests with scaling XP and stat point rewards
- **XP & Leveling** — Earn experience from every completed quest and watch your level climb
- **Stat Allocation** — Distribute earned skill points across six core stats: STR, AGI, INT, END, DSC, FOC
- **HP & MP Progression** — Max HP grows with physical XP; Max MP grows with mental XP

### 🏆 Ranking & Progression
- **Hunter Ranks** — Progress through E-Rank → D-Rank → C-Rank → B-Rank → A-Rank → S-Rank
- **Achievement System** — Unlock achievements for milestones and special feats
- **Daily Quest System** — Streak-based daily challenges with bonus rewards
- **Hidden Quests** — Discover secret quests for rare bonus XP

### 🌐 Social & Competitive
- **Global Leaderboard** — Compete against other Hunters worldwide
- **Hunter Profiles** — Unique Hunter IDs, display names, and rank badges

### 🎬 Immersive Experience
- **System Awakening** — Cinematic onboarding sequence with a 90-second countdown timer
- **Level-Up Celebrations** — Confetti and animated rank-up dialogs
- **System Notifications** — In-app toast notifications styled as "System Transmissions"
- **Audio System** — Sound effects and system chimes for key events
- **Dark & Light Themes** — Toggle between dark (default) and light mode
- **Framer Motion Animations** — Smooth page transitions and micro-interactions throughout

### 🔒 Auth & Data
- **Firebase Authentication** — Email/password and Google Sign-In
- **Cloud Firestore** — Real-time data sync across devices
- **Error Boundary** — Graceful error handling prevents blank screens

---

## 🛠️ Tech Stack

| Layer        | Technology                                                |
| ------------ | --------------------------------------------------------- |
| **Frontend** | React 19, TypeScript 6, Vite 8                           |
| **Styling**  | Custom CSS with CSS Variables, Framer Motion              |
| **Backend**  | Firebase (Auth, Firestore, Analytics)                     |
| **Icons**    | Lucide React                                              |
| **Effects**  | Canvas Confetti                                           |
| **Linting**  | Oxlint                                                    |
| **Hosting**  | Vercel (with SPA rewrite rules)                           |

---

## 📁 Project Structure

```
Hunter-System/
├── public/                     # Static assets (favicon, icons)
├── src/
│   ├── assets/                 # Images (hero, logos)
│   ├── components/             # Reusable UI components
│   │   ├── hidden-quests-widget.tsx
│   │   ├── hunter-auth-screen.tsx
│   │   ├── leaderboard.tsx
│   │   ├── level-up-dialog.tsx
│   │   ├── notification-center-modal.tsx
│   │   ├── quest-codex-modal.tsx
│   │   ├── quest-guide-modal.tsx
│   │   └── system-settings-modal.tsx
│   ├── lib/                    # Core logic & services
│   │   ├── achievements.ts     # Achievement definitions & triggers
│   │   ├── analytics.ts        # Event tracking
│   │   ├── audio-service.ts    # Sound effects engine
│   │   ├── auth.tsx            # Firebase Auth context & hooks
│   │   ├── daily-system.ts     # Daily quest & streak logic
│   │   ├── default-quests.ts   # Built-in quest catalog
│   │   ├── firebase.ts         # Firebase app initialization
│   │   ├── firestore-converter.ts
│   │   ├── game-engine.ts      # XP, ranks, stats, HP/MP, profiles
│   │   ├── hunter-store.tsx    # Global state (React Context)
│   │   ├── notifications.ts   # In-app notification system
│   │   └── quest-library.ts   # Quest templates & categories
│   ├── routes/
│   │   ├── dashboard/
│   │   │   ├── hunter-hub.tsx          # Main dashboard (quest board)
│   │   │   ├── profile-page.tsx        # Hunter profile & achievements
│   │   │   ├── stat-allocation-page.tsx # Stat point distribution
│   │   │   └── account-settings-page.tsx
│   │   └── onboarding/
│   │       └── system-awakening.tsx    # First-time cinematic onboarding
│   ├── App.tsx                 # Root component, routing, error boundary
│   ├── App.css                 # App-level styles
│   ├── index.css               # Global styles & CSS variables
│   └── main.tsx                # Entry point
├── docs/                       # Design & migration documentation
├── firestore.rules             # Firestore security rules
├── storage.rules               # Firebase Storage security rules
├── firebase.json               # Firebase project configuration
├── vercel.json                 # Vercel SPA rewrite rules
├── vite.config.ts              # Vite configuration with path aliases
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** (comes with Node.js)
- A **Firebase** project ([create one here](https://console.firebase.google.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/rushikesh19052007/Hunter-System.git
cd Hunter-System

# Install dependencies
npm install
```

### Environment Setup

Create a `.env` file in the project root with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

> See [`.env.example`](.env.example) for a reference template.

### Development

```bash
# Start the dev server with HMR
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build & Preview

```bash
# Type-check and build for production
npm run build

# Preview the production build locally
npm run preview
```

### Lint

```bash
npm run lint
```

---

## 🎯 Game Mechanics

### Difficulty Grades & XP Rewards

| Grade   | Label     | XP Earned | Stat XP | Stat Points |
| ------- | --------- | --------- | ------- | ----------- |
| **E**   | E-Class   | 15        | 10      | 1           |
| **D**   | D-Class   | 35        | 20      | 2           |
| **C**   | C-Class   | 60        | 35      | 3           |
| **B**   | B-Class   | 100       | 60      | 4           |
| **A**   | A-Class   | 150       | 100     | 5           |
| **S**   | S-Class   | 250       | 180     | 8           |

### Hunter Stats

| Stat | Full Name    | Description                        |
| ---- | ------------ | ---------------------------------- |
| STR  | Strength     | Physical power & raw force         |
| AGI  | Agility      | Speed, reflexes & coordination     |
| INT  | Intelligence | Knowledge, logic & problem-solving |
| END  | Endurance    | Stamina, resilience & willpower    |
| DSC  | Discipline   | Consistency, focus & self-control  |
| FOC  | Focus        | Concentration & mental clarity     |

### HP / MP System

- **HP** (Health Points) — Increases every 500 physical XP earned. Base HP scales with rank.
- **MP** (Mana Points) — Increases every 500 mental XP earned. Base MP scales with rank.

---

## 🚢 Deployment

The project is configured for **Vercel** with SPA rewrite rules. Push to `main` to trigger auto-deployment, or deploy manually:

```bash
npx vercel --prod
```

Firebase services (Auth, Firestore) are configured via the `.firebaserc` and `firebase.json` files.

---

## 📄 Documentation

Additional design and migration docs are available in the [`docs/`](docs/) directory:

- **Feature Parity Matrix** — Cross-platform feature comparison
- **Firebase Migration Plan** — Backend migration strategy
- **Firestore Schema** — Data model documentation
- **Flutter Audit** — Mobile app audit notes
- **UI/UX Mapping** — Design system reference
- **Web Audit** — Web platform audit

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is private. All rights reserved.

---

<p align="center">
  <strong>⚡ Arise, Hunter. Your system awaits. ⚡</strong>
</p>
