# HUNTR — Firestore Schema Specification

**Authoritative Backend**: Google Cloud Firestore (`hunter-x-guild`)  
**Shared Platforms**: Flutter (Android/iOS/Desktop) & Web Application (React/Vite)  
**Date**: October 2026  

---

## 1. Overview

Both client platforms connect to the same Cloud Firestore instance. To guarantee complete bidirectional interoperability without data loss, field names, data types, and collection paths are defined strictly according to the Flutter application's established schema.

---

## 2. Collection: `hunters`

* **Path**: `/hunters/{userId}`
* **Document ID**: User UID (`auth.currentUser.uid`)
* **Ownership**: Strictly the authenticated user matching `{userId}`.
* **Security**:
  * Read: `request.auth != null && request.auth.uid == userId`
  * Write: `request.auth != null && request.auth.uid == userId`

### 2.1 Document Fields Schema

| Field Name | Type | Required | Description | Example Value |
|---|---|---|---|---|
| `id` | `String` | Yes | Firebase Auth UID | `"e3b0c44298fc1c149afb"` |
| `hunterId` | `String` | Yes | Unique Hunter Association identifier | `"HUNTER-E3B0C4-AGI"` |
| `displayName` | `String` | Yes | Hunter alias or display name | `"Sung Jin-Woo"` |
| `totalXp` | `Integer` | Yes | Total accumulated lifetime experience points | `589200` |
| `currentLevel` | `Integer` | Yes | Current hunter level (derived from total XP) | `142` |
| `currentRank` | `String` | Yes | Rank classification: `E-Rank`, `D-Rank`, `C-Rank`, `B-Rank`, `A-Rank`, `S-Rank` | `"S-Rank"` |
| `affinity` | `String` | Yes | Primary stat affinity: `STR`, `AGI`, `VIT`, `INT`, `PERC` | `"AGI"` |
| `stats` | `Map<String, Integer>` | Yes | Attribute distribution map (keys are stat enum index or name: `"0"`: STR, `"1"`: AGI, `"2"`: VIT, `"3"`: INT, `"4"`: PERC) | `{"0": 180, "1": 195, "2": 160, "3": 170, "4": 150}` |
| `hp` | `Integer` | Yes | Current health points | `400` |
| `mp` | `Integer` | Yes | Current mana points | `400` |
| `maxHp` | `Integer` | Yes | Maximum health capacity | `400` |
| `maxMp` | `Integer` | Yes | Maximum mana capacity | `400` |
| `physicalXp` | `Integer` | Yes | Physical stat experience accumulated | `25000` |
| `mentalXp` | `Integer` | Yes | Mental stat experience accumulated | `28000` |
| `questsCompleted` | `Integer` | Yes | Total number of cleared quests | `1420` |
| `physicalQuestsCompleted` | `Integer` | Yes | Cleared physical/fitness quests count | `620` |
| `mentalQuestsCompleted` | `Integer` | Yes | Cleared mental/study quests count | `510` |
| `codingQuestsCompleted` | `Integer` | Yes | Cleared coding/algorithm quests count | `290` |
| `streak` | `Integer` | Yes | Current consecutive daily quest streak | `365` |
| `physicalStreak` | `Integer` | No | Consecutive physical quests streak | `180` |
| `mentalStreak` | `Integer` | No | Consecutive mental quests streak | `150` |
| `studyStreak` | `Integer` | No | Consecutive study quests streak | `90` |
| `codingStreak` | `Integer` | No | Consecutive coding quests streak | `120` |
| `perfectDayStreak` | `Integer` | No | Consecutive all-daily-quests-cleared streak | `85` |
| `longestStreak` | `Integer` | Yes | All-time highest streak achieved | `365` |
| `lastQuestDate` | `String` | No | ISO date of last cleared quest (`YYYY-MM-DD`) | `"2026-10-31"` |
| `titles` | `Array<String>` | Yes | List of unlocked hunter titles | `["The Awakened", "Shadow Monarch"]` |
| `equippedTitle` | `String` | Yes | Currently active displayed title | `"Shadow Monarch"` |
| `badges` | `Array<String>` | Yes | List of unlocked achievement badges | `["first_blood", "relentless", "iron_will"]` |
| `skillPoints` | `Map<String, Integer>` | Yes | Allocated skill points map (`strength`, `intelligence`, `endurance`, `discipline`, `focus`, `agility`) | `{"strength": 5, "intelligence": 5, "endurance": 5, "discipline": 5, "focus": 5, "agility": 5}` |
| `availableSkillPoints` | `Integer` | Yes | Unspent skill points (+3 per level-up) | `12` |
| `systemLog` | `Array<Object>` | Yes | Array of recent system transmissions and event logs | `[ { "id": "log-1", "timestamp": 1793472000000, "eventType": "quest_complete", "message": "Cleared: 50 Push-ups (+60 XP)", "xp": 60 } ]` |
| `activeQuests` | `Array<Object>` | Yes | Array of currently enrolled active quests | `[ ... ]` |

### 2.2 Sub-Structure: `activeQuests` Objects

Each object in the `activeQuests` array conforms to:
* `id` (`String`): Unique identifier (e.g., `"phys-001_1793472000000"` or `"custom_1793472000000"`)
* `name` (`String`): Quest title
* `description` (`String`, optional): Instructions / guidelines
* `difficulty` (`Integer`): Enum index `0` (E), `1` (D), `2` (C), `3` (B), `4` (A), `5` (S)
* `category` (`Integer`): Category enum index (`0`: physical, `1`: mental, `3`: coding, `4`: study, etc.)
* `stat` (`Integer`): Associated stat enum index (`0`: STR, `1`: AGI, `2`: VIT, `3`: INT, `4`: PERC)
* `progress` (`Integer`): Current quantity cleared
* `target` (`Integer`): Goal quantity required
* `completed` (`Boolean`): Completion status flag
* `xpReward` (`Integer`): Total experience awarded upon clearance
* `statXpReward` (`Integer`, optional): Stat XP awarded toward HP/MP expansion
* `statXpType` (`Integer`, optional): Stat XP target (`0`: physical, `1`: mental, `2`: both, `3`: none)
* `isCustom` (`Boolean`): Flag indicating if user created this quest

---

## 3. Collection: `leaderboard`

* **Path**: `/leaderboard/{userId}`
* **Document ID**: User UID (`auth.currentUser.uid`)
* **Ownership**: Public read; write restricted to matching authenticated user.
* **Security**:
  * Read: `true` (Publicly accessible to all authenticated or anonymous hunters)
  * Write: `request.auth != null && request.auth.uid == userId`

### 3.1 Document Fields Schema

| Field Name | Type | Required | Description | Example Value |
|---|---|---|---|---|
| `id` | `String` | Yes | Firebase Auth UID | `"e3b0c44298fc1c149afb"` |
| `hunterId` | `String` | Yes | Unique Hunter Association ID | `"HUNTER-E3B0C4-AGI"` |
| `displayName` | `String` | Yes | Display name | `"Sung Jin-Woo"` |
| `level` | `Integer` | Yes | Current hunter level | `142` |
| `rank` | `String` | Yes | Current rank string | `"S-Rank"` |
| `totalXp` | `Integer` | Yes | Total XP (used as primary sort key) | `589200` |
| `affinity` | `String` | Yes | Core stat affinity | `"AGI"` |
| `equippedTitle` | `String` | Yes | Active equipped title | `"Shadow Monarch"` |
| `questsCompleted` | `Integer` | Yes | Total quests completed | `1420` |
| `streak` | `Integer` | Yes | Current streak days | `365` |
| `updatedAt` | `Timestamp` | Yes | Server timestamp of last synchronization | `FieldValue.serverTimestamp()` |

### 3.2 Required Indexes
* **Leaderboard Rank Query**:
  * Collection: `leaderboard`
  * Field: `totalXp` (Descending)
  * Scope: Collection
