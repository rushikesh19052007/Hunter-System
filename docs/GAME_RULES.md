# HUNTR — Canonical Game Rules & Progression Mechanics
**Shared Specification between Web (React/Vite) & Mobile (Flutter)**

---

## 1. Hunter Rank Classifications & Level Thresholds

Ranks represent a hunter's structural capacity within the Hunter Association registry.

| Rank | Level Requirement | Description | Visual Theme |
|---|---|---|---|
| **E-Rank** | Level 1 – 9 | Newly awakened civilian hunters undergoing foundational conditioning. | Slate Steel (`#64748b`) |
| **D-Rank** | Level 10 – 24 | Novice operative capable of executing consistent routine trials. | Verdant Emerald (`#10b981`) |
| **C-Rank** | Level 25 – 44 | Seasoned hunter capable of deep focus and consistent multi-habit discipline. | Cyan Core (`#06b6d4`) |
| **B-Rank** | Level 45 – 69 | Elite operative leading guild raiding parties and executing complex goals. | Royal Violet (`#8b5cf6`) |
| **A-Rank** | Level 70 – 94 | High-tier powerhouse possessing extraordinary endurance and skill mastery. | Crimson Rose (`#f43f5e`) |
| **S-Rank** | Level 95+ | National-level anomaly with near-limitless mental and physical momentum. | Astral Gold (`#f59e0b`) |

---

## 2. Experience Points (XP) & Level Curves

Levels are calculated continuously from lifetime accumulated Experience Points (`total_xp`).

### Mathematical Formula
$$\text{Level}(XP) = \left\lfloor \sqrt{\frac{XP}{100}} \right\rfloor + 1$$

$$\text{Base XP for Level } L = (L - 1)^2 \times 100$$

$$\text{XP Required from Level } L \text{ to } L + 1 = (2L - 1) \times 100$$

### Key Level Gates
- Level 1: 0 XP
- Level 10 (D-Rank promotion): 8,100 XP
- Level 25 (C-Rank promotion): 57,600 XP
- Level 45 (B-Rank promotion): 193,600 XP
- Level 70 (A-Rank promotion): 476,100 XP
- Level 95 (S-Rank promotion): 883,600 XP

---

## 3. Directives & Quest Rewards Matrix

Completing a directive awards both Character XP and Available Stat Points based strictly on difficulty grade.

| Grade | Directive Base XP | Stat Points Awarded | Recommended Real-World Scale |
|---|---|---|---|
| **E-Rank** | 15 XP | +1 Stat Point | 10–15 min quick habits (hydration, stretching, 10 pushups) |
| **D-Rank** | 35 XP | +2 Stat Points | 25–30 min focused routine (brisk walk, reading a chapter) |
| **C-Rank** | 60 XP | +3 Stat Points | 45–60 min moderate trial (weight session, coding feature) |
| **B-Rank** | 100 XP | +4 Stat Points | 90–120 min deep work (system design, comprehensive exam prep) |
| **A-Rank** | 150 XP | +5 Stat Points | Major milestone execution (half-marathon, publishing a release) |
| **S-Rank** | 250 XP | +8 Stat Points | Breakthrough achievement (marathon, full project launch, certification) |

---

## 4. Attributes & Stat Allocation

Hunters allocate earned stat points into five primary combat parameters:

1. **STR (Strength)**: Physical power, resistance to fatigue, resistance training.
2. **AGI (Agility)**: Cardiovascular speed, reflexes, swift habit initiation.
3. **INT (Intelligence)**: Cognitive retention, analytical problem solving, programming capability.
4. **VIT (Vitality)**: Recovery rate, sleep hygiene, nutritional fortitude, maximum HP pool.
5. **SEN (Perception)**: Situational awareness, mindfulness, meditation, focus chamber endurance.

---

## 5. Health Points (HP) & Mana Points (MP) Scaling

### Base Capacity by Rank
| Rank | Base HP | Base MP |
|---|---|---|
| **E-Rank** | 100 | 100 |
| **D-Rank** | 130 | 125 |
| **C-Rank** | 170 | 160 |
| **B-Rank** | 220 | 210 |
| **A-Rank** | 290 | 280 |
| **S-Rank** | 400 | 400 |

### Sub-Stat Growth
- **Physical XP**: Every 500 physical stat XP accumulated permanently increases Maximum HP by +12.
- **Mental XP**: Every 500 mental stat XP accumulated permanently increases Maximum MP by +10.

---

## 6. Daily Recalibration & Multi-Streak Momentum

- **Daily Recalibration Epoch**: 00:00 UTC.
- **Streak Calculation**: Increments when at least one active trial is cleared within 24 hours of the previous completion.
- **Absence Threshold**: If `Date.now() - last_quest_date` exceeds 72 hours (3 days), the streak resets and triggers the **Comeback Protocol** re-entry trial.

### Momentum Multipliers on Directive XP
| Continuous Days Active | Momentum Multiplier | Bonus Applied |
|---|---|---|
| 0 – 6 Days | 1.0x | 0% bonus |
| 7 – 13 Days | 1.2x | +20% bonus |
| 14 – 29 Days | 1.5x | +50% bonus |
| 30 – 59 Days | 2.0x | +100% bonus (Double XP) |
| 60 – 99 Days | 2.5x | +150% bonus |
| 100+ Days | 3.0x | +200% bonus (Triple XP) |

