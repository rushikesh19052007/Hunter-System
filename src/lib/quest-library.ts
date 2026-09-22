// Hunter System — Expanded Quest Library (100+ quests)
import type { DifficultyGrade, QuestCategory } from './game-engine';

export interface LibraryQuest {
  id: string;
  name: string;
  category: QuestCategory;
  difficulty: DifficultyGrade;
  description: string;
  stat: 'STR' | 'AGI' | 'VIT' | 'INT' | 'PERC';
  target: number;
  unit: string;
  repeatable: 'daily' | 'weekly' | 'always';
}

export const QUEST_LIBRARY: LibraryQuest[] = [

  // ============================================================
  // PHYSICAL QUESTS (30+)
  // ============================================================
  {
    id: 'phys-001', name: '20 Push-ups', category: 'physical', difficulty: 'E',
    description: 'Complete 20 standard push-ups with proper form.',
    stat: 'STR', target: 20, unit: 'reps', repeatable: 'daily',
  },
  {
    id: 'phys-002', name: '30 Push-ups', category: 'physical', difficulty: 'D',
    description: 'Complete 30 push-ups distributed throughout the day.',
    stat: 'STR', target: 30, unit: 'reps', repeatable: 'daily',
  },
  {
    id: 'phys-003', name: '50 Push-ups', category: 'physical', difficulty: 'C',
    description: 'Complete 50 push-ups to forge upper body endurance.',
    stat: 'STR', target: 50, unit: 'reps', repeatable: 'daily',
  },
  {
    id: 'phys-004', name: 'Century Push-up Challenge', category: 'physical', difficulty: 'B',
    description: 'Complete 100 push-ups distributed throughout the day.',
    stat: 'STR', target: 100, unit: 'reps', repeatable: 'daily',
  },
  {
    id: 'phys-005', name: 'Iron Discipline: 200 Push-ups', category: 'physical', difficulty: 'A',
    description: 'Elite push-up challenge: 200 reps in one day.',
    stat: 'STR', target: 200, unit: 'reps', repeatable: 'weekly',
  },
  {
    id: 'phys-006', name: '50 Squats', category: 'physical', difficulty: 'E',
    description: 'Complete 50 full-depth bodyweight squats.',
    stat: 'STR', target: 50, unit: 'reps', repeatable: 'daily',
  },
  {
    id: 'phys-007', name: '100 Deep Squats', category: 'physical', difficulty: 'C',
    description: 'Complete 100 full-depth squats for explosive lower body power.',
    stat: 'STR', target: 100, unit: 'reps', repeatable: 'daily',
  },
  {
    id: 'phys-008', name: '200 Squat Gauntlet', category: 'physical', difficulty: 'A',
    description: 'Complete 200 squats throughout the day — legs of steel.',
    stat: 'STR', target: 200, unit: 'reps', repeatable: 'weekly',
  },
  {
    id: 'phys-009', name: '30-Second Plank', category: 'physical', difficulty: 'E',
    description: 'Hold a forearm plank for 30 seconds without breaking form.',
    stat: 'VIT', target: 30, unit: 'seconds', repeatable: 'daily',
  },
  {
    id: 'phys-010', name: '1-Minute Plank', category: 'physical', difficulty: 'D',
    description: 'Hold a forearm plank for a full minute.',
    stat: 'VIT', target: 60, unit: 'seconds', repeatable: 'daily',
  },
  {
    id: 'phys-011', name: '2-Minute Plank Hold', category: 'physical', difficulty: 'C',
    description: 'Hold a plank position for 2 minutes straight.',
    stat: 'VIT', target: 120, unit: 'seconds', repeatable: 'daily',
  },
  {
    id: 'phys-012', name: '5-Minute Accumulation Plank', category: 'physical', difficulty: 'B',
    description: 'Accumulate 5 minutes total plank time in a single session.',
    stat: 'VIT', target: 5, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'phys-013', name: '20 Lunges', category: 'physical', difficulty: 'E',
    description: 'Complete 20 alternating lunges for leg conditioning.',
    stat: 'AGI', target: 20, unit: 'reps', repeatable: 'daily',
  },
  {
    id: 'phys-014', name: '50 Lunges', category: 'physical', difficulty: 'D',
    description: 'Complete 50 walking lunges for balance and leg power.',
    stat: 'AGI', target: 50, unit: 'reps', repeatable: 'daily',
  },
  {
    id: 'phys-015', name: '50 Jumping Jacks', category: 'physical', difficulty: 'E',
    description: 'Rapid explosive jumping jacks for cardio activation.',
    stat: 'AGI', target: 50, unit: 'reps', repeatable: 'daily',
  },
  {
    id: 'phys-016', name: '200 Jumping Jacks', category: 'physical', difficulty: 'C',
    description: 'Complete 200 jumping jacks to stimulate explosive agility.',
    stat: 'AGI', target: 200, unit: 'reps', repeatable: 'daily',
  },
  {
    id: 'phys-017', name: '5km Walk', category: 'physical', difficulty: 'D',
    description: 'Complete a brisk 5km walk for cardiovascular health.',
    stat: 'VIT', target: 5, unit: 'km', repeatable: 'daily',
  },
  {
    id: 'phys-018', name: '10km Walk', category: 'physical', difficulty: 'C',
    description: 'A long 10km walk — distance builds discipline.',
    stat: 'VIT', target: 10, unit: 'km', repeatable: 'weekly',
  },
  {
    id: 'phys-019', name: '2km Run', category: 'physical', difficulty: 'D',
    description: 'Complete a 2km jog at a comfortable pace.',
    stat: 'AGI', target: 2, unit: 'km', repeatable: 'daily',
  },
  {
    id: 'phys-020', name: 'Shadow Sprint: 5km Run', category: 'physical', difficulty: 'C',
    description: 'Run 5km to elevate cardiovascular speed and stamina.',
    stat: 'AGI', target: 5, unit: 'km', repeatable: 'daily',
  },
  {
    id: 'phys-021', name: '10km Long Run', category: 'physical', difficulty: 'B',
    description: 'Complete a 10km run — the hunter\'s endurance trial.',
    stat: 'AGI', target: 10, unit: 'km', repeatable: 'weekly',
  },
  {
    id: 'phys-022', name: 'Morning Yoga Routine', category: 'physical', difficulty: 'D',
    description: 'Complete a 20-minute morning yoga or stretching session.',
    stat: 'AGI', target: 20, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'phys-023', name: '30-Minute Core Workout', category: 'physical', difficulty: 'C',
    description: 'A focused 30-minute core strengthening routine.',
    stat: 'STR', target: 30, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'phys-024', name: '1-Hour Sport Activity', category: 'physical', difficulty: 'C',
    description: 'Engage in any physical sport or recreational activity for 1 hour.',
    stat: 'AGI', target: 60, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'phys-025', name: '90-Minute Gym Session', category: 'physical', difficulty: 'B',
    description: 'Complete a full 90-minute gym workout with compound lifts.',
    stat: 'STR', target: 90, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'phys-026', name: '15-Minute HIIT Surge', category: 'physical', difficulty: 'B',
    description: '15 minutes of max-intensity HIIT: burpees, sprints, mountain climbers.',
    stat: 'AGI', target: 15, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'phys-027', name: 'Grip Trial: 3-Min Hang', category: 'physical', difficulty: 'D',
    description: 'Hang from a pull-up bar for an accumulated 3 minutes.',
    stat: 'STR', target: 3, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'phys-028', name: '50 Pull-ups Challenge', category: 'physical', difficulty: 'A',
    description: 'Complete 50 pull-ups — the mark of upper body mastery.',
    stat: 'STR', target: 50, unit: 'reps', repeatable: 'weekly',
  },
  {
    id: 'phys-029', name: 'Mobility Flow Session', category: 'physical', difficulty: 'E',
    description: 'Complete 15 minutes of targeted mobility and joint work.',
    stat: 'AGI', target: 15, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'phys-030', name: '2-Hour Epic Workout', category: 'physical', difficulty: 'S',
    description: 'A 2-hour intense workout combining strength, cardio and mobility.',
    stat: 'STR', target: 120, unit: 'minutes', repeatable: 'weekly',
  },

  // ============================================================
  // CODING QUESTS (25+)
  // ============================================================
  {
    id: 'code-001', name: 'Solve 1 LeetCode Easy', category: 'coding', difficulty: 'E',
    description: 'Solve one LeetCode easy problem with a clean, documented solution.',
    stat: 'INT', target: 1, unit: 'problems', repeatable: 'daily',
  },
  {
    id: 'code-002', name: 'Solve 2 LeetCode Easy', category: 'coding', difficulty: 'D',
    description: 'Solve two LeetCode easy problems.',
    stat: 'INT', target: 2, unit: 'problems', repeatable: 'daily',
  },
  {
    id: 'code-003', name: 'Solve 3 LeetCode Easy', category: 'coding', difficulty: 'C',
    description: 'Solve three LeetCode easy problems back to back.',
    stat: 'INT', target: 3, unit: 'problems', repeatable: 'daily',
  },
  {
    id: 'code-004', name: 'Solve 1 LeetCode Medium', category: 'coding', difficulty: 'C',
    description: 'Tackle one LeetCode medium problem — the true test begins.',
    stat: 'INT', target: 1, unit: 'problems', repeatable: 'daily',
  },
  {
    id: 'code-005', name: 'Solve 2 LeetCode Medium', category: 'coding', difficulty: 'B',
    description: 'Solve two LeetCode medium problems.',
    stat: 'INT', target: 2, unit: 'problems', repeatable: 'daily',
  },
  {
    id: 'code-006', name: 'Solve 3 LeetCode Medium', category: 'coding', difficulty: 'A',
    description: 'Solve three LeetCode medium problems in a single session.',
    stat: 'INT', target: 3, unit: 'problems', repeatable: 'daily',
  },
  {
    id: 'code-007', name: 'Solve 5 LeetCode Medium', category: 'coding', difficulty: 'S',
    description: 'Solve five LeetCode mediums — elite algorithmic capacity.',
    stat: 'INT', target: 5, unit: 'problems', repeatable: 'weekly',
  },
  {
    id: 'code-008', name: 'Solve 1 LeetCode Hard', category: 'coding', difficulty: 'A',
    description: 'Crack one LeetCode hard problem — only the elite dare.',
    stat: 'INT', target: 1, unit: 'problems', repeatable: 'daily',
  },
  {
    id: 'code-009', name: 'Solve 2 LeetCode Hard', category: 'coding', difficulty: 'S',
    description: 'Two hard LeetCode problems solved in one day.',
    stat: 'INT', target: 2, unit: 'problems', repeatable: 'weekly',
  },
  {
    id: 'code-010', name: 'Debug Old Project', category: 'coding', difficulty: 'C',
    description: 'Find and fix at least 3 bugs in an existing project.',
    stat: 'INT', target: 3, unit: 'bugs fixed', repeatable: 'always',
  },
  {
    id: 'code-011', name: 'Learn a New Algorithm', category: 'coding', difficulty: 'C',
    description: 'Study and implement a new algorithm from scratch with notes.',
    stat: 'INT', target: 1, unit: 'algorithm', repeatable: 'always',
  },
  {
    id: 'code-012', name: 'Implement a Data Structure', category: 'coding', difficulty: 'B',
    description: 'Implement a data structure (tree, graph, trie) from scratch.',
    stat: 'INT', target: 1, unit: 'structure', repeatable: 'always',
  },
  {
    id: 'code-013', name: 'Build a Small Feature', category: 'coding', difficulty: 'C',
    description: 'Build one complete, tested feature in any project.',
    stat: 'INT', target: 1, unit: 'feature', repeatable: 'always',
  },
  {
    id: 'code-014', name: 'Refactor Existing Code', category: 'coding', difficulty: 'D',
    description: 'Clean and refactor a section of code for better readability.',
    stat: 'INT', target: 1, unit: 'refactor', repeatable: 'always',
  },
  {
    id: 'code-015', name: 'Read Technical Documentation', category: 'coding', difficulty: 'D',
    description: 'Read official docs for 45 minutes with notes.',
    stat: 'INT', target: 45, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'code-016', name: 'Build a Calculator App', category: 'coding', difficulty: 'D',
    description: 'Build a functioning calculator with proper UI and logic.',
    stat: 'INT', target: 1, unit: 'app', repeatable: 'always',
  },
  {
    id: 'code-017', name: 'Build a TODO App', category: 'coding', difficulty: 'C',
    description: 'Create a full-featured TODO app with CRUD operations.',
    stat: 'INT', target: 1, unit: 'app', repeatable: 'always',
  },
  {
    id: 'code-018', name: 'Build a Chat App', category: 'coding', difficulty: 'B',
    description: 'Build a real-time or simulated chat application.',
    stat: 'INT', target: 1, unit: 'app', repeatable: 'always',
  },
  {
    id: 'code-019', name: '60-Minute Deep Code Session', category: 'coding', difficulty: 'C',
    description: 'Code for 60 uninterrupted minutes on a real project.',
    stat: 'INT', target: 60, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'code-020', name: '2-Hour Coding Marathon', category: 'coding', difficulty: 'B',
    description: 'Code for 2 hours straight on a challenging problem or feature.',
    stat: 'INT', target: 120, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'code-021', name: 'Write Unit Tests', category: 'coding', difficulty: 'C',
    description: 'Write comprehensive unit tests for an existing module.',
    stat: 'INT', target: 10, unit: 'tests', repeatable: 'always',
  },
  {
    id: 'code-022', name: 'Open Source Contribution', category: 'coding', difficulty: 'A',
    description: 'Make a meaningful contribution to an open source project.',
    stat: 'INT', target: 1, unit: 'contribution', repeatable: 'always',
  },
  {
    id: 'code-023', name: 'System Design Study', category: 'coding', difficulty: 'B',
    description: 'Study and diagram one system design concept (DB, API, scaling).',
    stat: 'INT', target: 1, unit: 'design', repeatable: 'always',
  },
  {
    id: 'code-024', name: 'Complete a Coding Challenge', category: 'coding', difficulty: 'C',
    description: 'Finish a competitive programming challenge on any platform.',
    stat: 'INT', target: 1, unit: 'challenge', repeatable: 'always',
  },
  {
    id: 'code-025', name: 'Build a REST API', category: 'coding', difficulty: 'B',
    description: 'Design and implement a simple REST API with at least 4 endpoints.',
    stat: 'INT', target: 1, unit: 'api', repeatable: 'always',
  },

  // ============================================================
  // STUDY QUESTS (20+)
  // ============================================================
  {
    id: 'study-001', name: 'Study 30 Minutes', category: 'study', difficulty: 'E',
    description: 'Focused study session with no distractions for 30 minutes.',
    stat: 'INT', target: 30, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'study-002', name: 'Study 1 Hour', category: 'study', difficulty: 'D',
    description: 'Deep study session for a full hour.',
    stat: 'INT', target: 60, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'study-003', name: 'Study 2 Hours', category: 'study', difficulty: 'C',
    description: 'Two focused hours of studying — intermediate mastery.',
    stat: 'INT', target: 120, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'study-004', name: 'Study 4 Hours', category: 'study', difficulty: 'B',
    description: 'Four hours of deep study — elite academic focus.',
    stat: 'INT', target: 240, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'study-005', name: 'Revise One Chapter', category: 'study', difficulty: 'D',
    description: 'Thoroughly revise one chapter with active recall.',
    stat: 'INT', target: 1, unit: 'chapter', repeatable: 'daily',
  },
  {
    id: 'study-006', name: 'Revise Two Chapters', category: 'study', difficulty: 'C',
    description: 'Revise two chapters with comprehensive notes.',
    stat: 'INT', target: 2, unit: 'chapters', repeatable: 'daily',
  },
  {
    id: 'study-007', name: 'Make Detailed Notes', category: 'study', difficulty: 'D',
    description: 'Create structured, comprehensive notes on a topic.',
    stat: 'INT', target: 1, unit: 'note set', repeatable: 'always',
  },
  {
    id: 'study-008', name: 'Solve 20 Practice Questions', category: 'study', difficulty: 'C',
    description: 'Solve 20 practice questions with explanations checked.',
    stat: 'INT', target: 20, unit: 'questions', repeatable: 'daily',
  },
  {
    id: 'study-009', name: 'Solve 50 Practice Questions', category: 'study', difficulty: 'B',
    description: 'Solve 50 practice questions in one sitting.',
    stat: 'INT', target: 50, unit: 'questions', repeatable: 'weekly',
  },
  {
    id: 'study-010', name: 'Complete One Topic', category: 'study', difficulty: 'C',
    description: 'Fully complete one topic from start to mastery.',
    stat: 'INT', target: 1, unit: 'topic', repeatable: 'always',
  },
  {
    id: 'study-011', name: 'Teach Yourself a Concept', category: 'study', difficulty: 'D',
    description: 'Explain a new concept out loud as if teaching — Feynman method.',
    stat: 'INT', target: 1, unit: 'concept', repeatable: 'always',
  },
  {
    id: 'study-012', name: 'Take a Practice Test', category: 'study', difficulty: 'C',
    description: 'Complete a full practice test under exam conditions.',
    stat: 'INT', target: 1, unit: 'test', repeatable: 'always',
  },
  {
    id: 'study-013', name: 'Review Mistakes', category: 'study', difficulty: 'D',
    description: 'Review all wrong answers from a recent test with analysis.',
    stat: 'INT', target: 1, unit: 'review', repeatable: 'always',
  },
  {
    id: 'study-014', name: 'Create a Summary Sheet', category: 'study', difficulty: 'D',
    description: 'Condense a topic into a one-page study summary.',
    stat: 'PERC', target: 1, unit: 'summary', repeatable: 'always',
  },
  {
    id: 'study-015', name: 'Pomodoro Barrage: 4 Cycles', category: 'study', difficulty: 'C',
    description: '4 × 25-minute Pomodoro sessions with 5-minute breaks.',
    stat: 'PERC', target: 4, unit: 'cycles', repeatable: 'daily',
  },
  {
    id: 'study-016', name: 'Complete a Course Module', category: 'study', difficulty: 'C',
    description: 'Finish one complete module from an online course.',
    stat: 'INT', target: 1, unit: 'module', repeatable: 'always',
  },
  {
    id: 'study-017', name: 'Practice Problems Set', category: 'study', difficulty: 'D',
    description: 'Work through a full problem set from a textbook chapter.',
    stat: 'INT', target: 1, unit: 'set', repeatable: 'always',
  },
  {
    id: 'study-018', name: 'Spaced Repetition Session', category: 'study', difficulty: 'D',
    description: 'Complete 100 flashcard reviews using spaced repetition (Anki).',
    stat: 'INT', target: 100, unit: 'cards', repeatable: 'daily',
  },
  {
    id: 'study-019', name: '6-Hour Study Marathon', category: 'study', difficulty: 'A',
    description: 'A full 6-hour study day with proper breaks — scholar\'s trial.',
    stat: 'INT', target: 360, unit: 'minutes', repeatable: 'weekly',
  },
  {
    id: 'study-020', name: 'Master One Concept Deeply', category: 'study', difficulty: 'B',
    description: 'Spend 3+ hours completely mastering one concept end-to-end.',
    stat: 'INT', target: 3, unit: 'hours', repeatable: 'always',
  },

  // ============================================================
  // KNOWLEDGE QUESTS (15+)
  // ============================================================
  {
    id: 'know-001', name: 'Read 10 Pages', category: 'knowledge', difficulty: 'E',
    description: 'Read 10 pages from a non-fiction book.',
    stat: 'INT', target: 10, unit: 'pages', repeatable: 'daily',
  },
  {
    id: 'know-002', name: 'Read 20 Pages', category: 'knowledge', difficulty: 'D',
    description: 'Read 20 pages from a non-fiction or educational book.',
    stat: 'INT', target: 20, unit: 'pages', repeatable: 'daily',
  },
  {
    id: 'know-003', name: 'Read 50 Pages', category: 'knowledge', difficulty: 'C',
    description: 'Read 50 pages — deep immersion in a book or research paper.',
    stat: 'INT', target: 50, unit: 'pages', repeatable: 'daily',
  },
  {
    id: 'know-004', name: 'Learn 5 New Concepts', category: 'knowledge', difficulty: 'D',
    description: 'Learn and document 5 new concepts from any domain.',
    stat: 'INT', target: 5, unit: 'concepts', repeatable: 'daily',
  },
  {
    id: 'know-005', name: 'Learn 10 New Concepts', category: 'knowledge', difficulty: 'C',
    description: 'Learn and document 10 new concepts — knowledge is power.',
    stat: 'INT', target: 10, unit: 'concepts', repeatable: 'weekly',
  },
  {
    id: 'know-006', name: 'Watch Educational Lecture (30 min)', category: 'knowledge', difficulty: 'D',
    description: 'Watch a 30-minute educational lecture or documentary.',
    stat: 'INT', target: 30, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'know-007', name: 'Watch Educational Lecture (1 hr)', category: 'knowledge', difficulty: 'C',
    description: 'Watch a 1-hour educational lecture with active notes.',
    stat: 'INT', target: 60, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'know-008', name: 'Deep Topic Research (30 min)', category: 'knowledge', difficulty: 'D',
    description: 'Research a specific topic for 30 minutes from primary sources.',
    stat: 'INT', target: 30, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'know-009', name: 'Deep Topic Research (1 hr)', category: 'knowledge', difficulty: 'C',
    description: 'One hour of focused deep-dive research on an unfamiliar topic.',
    stat: 'INT', target: 60, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'know-010', name: 'Learn 10 New Words', category: 'knowledge', difficulty: 'E',
    description: 'Learn 10 new vocabulary words with definitions and examples.',
    stat: 'INT', target: 10, unit: 'words', repeatable: 'daily',
  },
  {
    id: 'know-011', name: 'Summarize an Article', category: 'knowledge', difficulty: 'D',
    description: 'Read and write a concise summary of a published article.',
    stat: 'INT', target: 1, unit: 'article', repeatable: 'daily',
  },
  {
    id: 'know-012', name: 'Write What You Learned Today', category: 'knowledge', difficulty: 'D',
    description: 'Write a reflection documenting everything new you learned today.',
    stat: 'PERC', target: 1, unit: 'reflection', repeatable: 'daily',
  },
  {
    id: 'know-013', name: 'Audio Lecture Immersion (45 min)', category: 'knowledge', difficulty: 'D',
    description: 'Listen to a 45-minute technical podcast with mental timestamps.',
    stat: 'INT', target: 45, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'know-014', name: 'Complete a Course Module', category: 'knowledge', difficulty: 'C',
    description: 'Complete one complete module from any learning platform.',
    stat: 'INT', target: 1, unit: 'module', repeatable: 'always',
  },
  {
    id: 'know-015', name: 'Memory Palace: 5 Concepts', category: 'knowledge', difficulty: 'C',
    description: 'Commit 5 core concepts to long-term memory via spaced recall.',
    stat: 'PERC', target: 5, unit: 'concepts', repeatable: 'always',
  },

  // ============================================================
  // PRODUCTIVITY QUESTS (15+)
  // ============================================================
  {
    id: 'prod-001', name: 'Clean Workspace', category: 'productivity', difficulty: 'E',
    description: 'Reset your desk and workspace to pristine condition.',
    stat: 'PERC', target: 15, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'prod-002', name: 'Plan Tomorrow\'s Tasks', category: 'productivity', difficulty: 'E',
    description: 'Write down tomorrow\'s top 3 high-leverage priorities.',
    stat: 'PERC', target: 3, unit: 'objectives', repeatable: 'daily',
  },
  {
    id: 'prod-003', name: 'Complete Most Important Task', category: 'productivity', difficulty: 'C',
    description: 'Finish the single most impactful task on your list.',
    stat: 'STR', target: 1, unit: 'task', repeatable: 'daily',
  },
  {
    id: 'prod-004', name: 'Clear Your Inbox', category: 'productivity', difficulty: 'D',
    description: 'Reach inbox zero — process, delegate, or archive everything.',
    stat: 'PERC', target: 1, unit: 'cleared', repeatable: 'daily',
  },
  {
    id: 'prod-005', name: 'Organize Digital Files', category: 'productivity', difficulty: 'D',
    description: 'Organize and categorize your digital files and folders.',
    stat: 'PERC', target: 1, unit: 'organized', repeatable: 'always',
  },
  {
    id: 'prod-006', name: 'Complete Pending Task', category: 'productivity', difficulty: 'D',
    description: 'Finish a task that has been sitting on your list too long.',
    stat: 'STR', target: 1, unit: 'task', repeatable: 'daily',
  },
  {
    id: 'prod-007', name: '30-Min Deep Work Block', category: 'productivity', difficulty: 'D',
    description: 'Eliminate notifications for 30 minutes of pure deep work.',
    stat: 'PERC', target: 30, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'prod-008', name: '60-Min Deep Work Block', category: 'productivity', difficulty: 'C',
    description: '60 minutes of zero-distraction deep work on your mission.',
    stat: 'PERC', target: 60, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'prod-009', name: 'S-Rank Focus Chamber: 90 Min', category: 'productivity', difficulty: 'B',
    description: '90 uninterrupted minutes of deep work on your most vital task.',
    stat: 'PERC', target: 90, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'prod-010', name: 'Weekly Review', category: 'productivity', difficulty: 'C',
    description: 'Conduct a full weekly review of goals, wins, and areas to improve.',
    stat: 'PERC', target: 1, unit: 'review', repeatable: 'weekly',
  },
  {
    id: 'prod-011', name: 'Priority Setting Session', category: 'productivity', difficulty: 'D',
    description: 'Spend 20 minutes defining and ranking priorities for the week.',
    stat: 'PERC', target: 20, unit: 'minutes', repeatable: 'weekly',
  },
  {
    id: 'prod-012', name: 'The Frog Slayer: Hardest Task First', category: 'productivity', difficulty: 'B',
    description: 'Complete your most intimidating task before noon.',
    stat: 'STR', target: 1, unit: 'boss task', repeatable: 'daily',
  },
  {
    id: 'prod-013', name: 'Automate a Repetitive Task', category: 'productivity', difficulty: 'B',
    description: 'Write a script or build a system that automates a manual task.',
    stat: 'INT', target: 1, unit: 'automation', repeatable: 'always',
  },
  {
    id: 'prod-014', name: 'Build a System or Habit', category: 'productivity', difficulty: 'C',
    description: 'Design and implement a personal system for tracking a goal.',
    stat: 'PERC', target: 1, unit: 'system', repeatable: 'always',
  },
  {
    id: 'prod-015', name: '2-Hour Hyper-Focus Session', category: 'productivity', difficulty: 'A',
    description: 'Two hours of complete hyper-focus with phone off and alerts silenced.',
    stat: 'PERC', target: 120, unit: 'minutes', repeatable: 'daily',
  },

  // ============================================================
  // DISCIPLINE QUESTS (10+)
  // ============================================================
  {
    id: 'disc-001', name: 'Wake Up Without Snoozing', category: 'discipline', difficulty: 'D',
    description: 'Get up immediately when your alarm goes off — no snooze.',
    stat: 'PERC', target: 1, unit: 'morning', repeatable: 'daily',
  },
  {
    id: 'disc-002', name: 'No Social Media for 1 Hour', category: 'discipline', difficulty: 'E',
    description: 'Avoid all social media platforms for a full hour.',
    stat: 'PERC', target: 1, unit: 'hour', repeatable: 'daily',
  },
  {
    id: 'disc-003', name: 'No Social Media for 2 Hours', category: 'discipline', difficulty: 'D',
    description: 'Two hours of complete social media abstinence.',
    stat: 'PERC', target: 2, unit: 'hours', repeatable: 'daily',
  },
  {
    id: 'disc-004', name: 'No Phone for 2 Hours', category: 'discipline', difficulty: 'C',
    description: 'Zero phone usage for 2 hours — pure presence.',
    stat: 'PERC', target: 2, unit: 'hours', repeatable: 'daily',
  },
  {
    id: 'disc-005', name: 'Complete Planned Task', category: 'discipline', difficulty: 'D',
    description: 'Complete a task you planned to do regardless of motivation.',
    stat: 'STR', target: 1, unit: 'task', repeatable: 'daily',
  },
  {
    id: 'disc-006', name: 'Sleep on Time', category: 'discipline', difficulty: 'D',
    description: 'Go to bed at your planned sleep time without delay.',
    stat: 'VIT', target: 1, unit: 'night', repeatable: 'daily',
  },
  {
    id: 'disc-007', name: 'Follow Daily Routine Fully', category: 'discipline', difficulty: 'C',
    description: 'Complete your full planned daily routine without skipping.',
    stat: 'PERC', target: 1, unit: 'routine', repeatable: 'daily',
  },
  {
    id: 'disc-008', name: 'Cold Shower', category: 'discipline', difficulty: 'C',
    description: 'Take a full cold shower or end with 2+ minutes of cold water.',
    stat: 'VIT', target: 1, unit: 'shower', repeatable: 'daily',
  },
  {
    id: 'disc-009', name: 'Meditation: 10 Minutes', category: 'discipline', difficulty: 'D',
    description: 'Meditate for 10 minutes with focused breath awareness.',
    stat: 'PERC', target: 10, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'disc-010', name: 'Meditation: 20 Minutes', category: 'discipline', difficulty: 'C',
    description: 'Deep 20-minute meditation session.',
    stat: 'PERC', target: 20, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'disc-011', name: 'Digital Detox Day', category: 'discipline', difficulty: 'B',
    description: 'Minimize all unnecessary screen time for an entire day.',
    stat: 'PERC', target: 1, unit: 'day', repeatable: 'weekly',
  },

  // ============================================================
  // HEALTH QUESTS (10+)
  // ============================================================
  {
    id: 'hlth-001', name: 'Drink Sufficient Water', category: 'health', difficulty: 'E',
    description: 'Drink at least 2.5 liters of water throughout the day.',
    stat: 'VIT', target: 3, unit: 'liters', repeatable: 'daily',
  },
  {
    id: 'hlth-002', name: 'Eat a Healthy Meal', category: 'health', difficulty: 'E',
    description: 'Prepare or eat one nutritious, whole-food meal.',
    stat: 'VIT', target: 1, unit: 'meal', repeatable: 'daily',
  },
  {
    id: 'hlth-003', name: 'Take Vitamins/Supplements', category: 'health', difficulty: 'E',
    description: 'Take your daily vitamins or supplements consistently.',
    stat: 'VIT', target: 1, unit: 'day', repeatable: 'daily',
  },
  {
    id: 'hlth-004', name: 'Walk After Meal', category: 'health', difficulty: 'E',
    description: 'Take a 10-minute walk after eating to aid digestion.',
    stat: 'VIT', target: 10, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'hlth-005', name: 'Sleep 7-8 Hours', category: 'health', difficulty: 'C',
    description: 'Get a full 7-8 hours of quality restorative sleep.',
    stat: 'VIT', target: 8, unit: 'hours', repeatable: 'daily',
  },
  {
    id: 'hlth-006', name: 'Take Screen Break', category: 'health', difficulty: 'E',
    description: 'Take a 20-minute break from screens every 2 hours.',
    stat: 'VIT', target: 20, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'hlth-007', name: 'Morning Sunlight Exposure', category: 'health', difficulty: 'D',
    description: 'Get 15 minutes of natural morning sunlight within 60 min of waking.',
    stat: 'VIT', target: 15, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'hlth-008', name: 'Zero Added Sugar Day', category: 'health', difficulty: 'C',
    description: 'Avoid all added sugars and processed sweets for one full day.',
    stat: 'VIT', target: 1, unit: 'day', repeatable: 'daily',
  },
  {
    id: 'hlth-009', name: 'Breathwork Session', category: 'health', difficulty: 'D',
    description: 'Perform 10 minutes of box breathing or physiological sighs.',
    stat: 'PERC', target: 10, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'hlth-010', name: 'Outdoor Activity', category: 'health', difficulty: 'D',
    description: 'Spend 30+ minutes outdoors in nature for mental reset.',
    stat: 'VIT', target: 30, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'hlth-011', name: 'Whole Foods Feast', category: 'health', difficulty: 'D',
    description: 'Eat only nutrient-dense, single-ingredient foods all day.',
    stat: 'VIT', target: 3, unit: 'meals', repeatable: 'daily',
  },

  // ============================================================
  // SOCIAL QUESTS (8)
  // ============================================================
  {
    id: 'soc-001', name: 'Have a Meaningful Conversation', category: 'social', difficulty: 'E',
    description: 'Have a real, in-depth conversation with someone important.',
    stat: 'PERC', target: 1, unit: 'conversation', repeatable: 'daily',
  },
  {
    id: 'soc-002', name: 'Help Someone', category: 'social', difficulty: 'D',
    description: 'Genuinely help someone solve a problem or complete a task.',
    stat: 'PERC', target: 1, unit: 'person', repeatable: 'daily',
  },
  {
    id: 'soc-003', name: 'Call a Friend or Family Member', category: 'social', difficulty: 'E',
    description: 'Make a real voice or video call to reconnect with someone.',
    stat: 'PERC', target: 1, unit: 'call', repeatable: 'daily',
  },
  {
    id: 'soc-004', name: 'Join a Community Event', category: 'social', difficulty: 'C',
    description: 'Participate in an online or in-person community event.',
    stat: 'PERC', target: 1, unit: 'event', repeatable: 'always',
  },
  {
    id: 'soc-005', name: 'Practice Public Speaking', category: 'social', difficulty: 'C',
    description: 'Give a short talk or practice presenting to an audience.',
    stat: 'PERC', target: 1, unit: 'session', repeatable: 'always',
  },
  {
    id: 'soc-006', name: 'Networking Session', category: 'social', difficulty: 'B',
    description: 'Attend a networking event or reach out to 3+ professionals.',
    stat: 'PERC', target: 3, unit: 'connections', repeatable: 'always',
  },
  {
    id: 'soc-007', name: 'Mentor or Teach Someone', category: 'social', difficulty: 'C',
    description: 'Teach or mentor someone on a topic you know well.',
    stat: 'INT', target: 1, unit: 'session', repeatable: 'always',
  },
  {
    id: 'soc-008', name: 'Random Act of Kindness', category: 'social', difficulty: 'E',
    description: 'Perform one genuine act of kindness for a stranger or friend.',
    stat: 'PERC', target: 1, unit: 'act', repeatable: 'daily',
  },

  // ============================================================
  // CREATIVE QUESTS (8)
  // ============================================================
  {
    id: 'crea-001', name: 'Draw or Sketch for 30 Minutes', category: 'creative', difficulty: 'D',
    description: 'Spend 30 minutes drawing, sketching, or doodling.',
    stat: 'PERC', target: 30, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'crea-002', name: 'Write a Short Story', category: 'creative', difficulty: 'C',
    description: 'Write a short story of at least 500 words.',
    stat: 'INT', target: 500, unit: 'words', repeatable: 'always',
  },
  {
    id: 'crea-003', name: 'Create a Piece of Music', category: 'creative', difficulty: 'B',
    description: 'Compose, record, or produce a short piece of music.',
    stat: 'INT', target: 1, unit: 'piece', repeatable: 'always',
  },
  {
    id: 'crea-004', name: 'Photography Session', category: 'creative', difficulty: 'D',
    description: 'Go out and take 20+ intentional, thoughtful photographs.',
    stat: 'PERC', target: 20, unit: 'photos', repeatable: 'always',
  },
  {
    id: 'crea-005', name: 'DIY Craft Project', category: 'creative', difficulty: 'C',
    description: 'Complete a hands-on craft or making project.',
    stat: 'STR', target: 1, unit: 'project', repeatable: 'always',
  },
  {
    id: 'crea-006', name: 'Creative Writing Session', category: 'creative', difficulty: 'D',
    description: 'Spend 30 minutes writing anything creative — journal, poem, fiction.',
    stat: 'INT', target: 30, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'crea-007', name: 'Design Something', category: 'creative', difficulty: 'C',
    description: 'Create a design — UI mockup, poster, logo, or art piece.',
    stat: 'INT', target: 1, unit: 'design', repeatable: 'always',
  },
  {
    id: 'crea-008', name: 'Start a Creative Project', category: 'creative', difficulty: 'B',
    description: 'Begin a new creative project with a clear vision and first deliverable.',
    stat: 'INT', target: 1, unit: 'project', repeatable: 'always',
  },

  // ============================================================
  // PERSONAL DEVELOPMENT QUESTS (5)
  // ============================================================
  {
    id: 'pdev-001', name: 'Journal for 10 Minutes', category: 'personal_development', difficulty: 'E',
    description: 'Write a reflective journal entry about your thoughts and progress.',
    stat: 'PERC', target: 10, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'pdev-002', name: 'Journal for 30 Minutes', category: 'personal_development', difficulty: 'D',
    description: 'A deeper 30-minute journaling session — clarity and growth.',
    stat: 'PERC', target: 30, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'pdev-003', name: 'Plan Long-Term Goals', category: 'personal_development', difficulty: 'C',
    description: 'Spend 45 minutes mapping your 6-month and 1-year goals.',
    stat: 'PERC', target: 45, unit: 'minutes', repeatable: 'always',
  },
  {
    id: 'pdev-004', name: 'Practice Communication Skills', category: 'personal_development', difficulty: 'D',
    description: 'Record yourself speaking or practice structured communication.',
    stat: 'PERC', target: 30, unit: 'minutes', repeatable: 'always',
  },
  {
    id: 'pdev-005', name: 'Do Something Outside Your Comfort Zone', category: 'personal_development', difficulty: 'B',
    description: 'Intentionally do one thing that challenges your limits.',
    stat: 'STR', target: 1, unit: 'challenge', repeatable: 'always',
  },

  // ============================================================
  // SOLO LEVELING LEGENDARY DIRECTIVES (31 Quests from default-quests)
  // ============================================================
  {
    id: 'legend-fit-1', name: 'Shadow Conditioning: 100 Push-ups', category: 'physical', difficulty: 'C',
    description: 'Complete 100 proper form push-ups distributed throughout the day to forge upper body strength.',
    stat: 'STR', target: 100, unit: 'reps', repeatable: 'daily',
  },
  {
    id: 'legend-fit-2', name: 'Grip of the Monarch: Hang & Grip Trial', category: 'physical', difficulty: 'D',
    description: 'Hang from a pull-up bar or perform grip holds for a cumulative total of 3 minutes.',
    stat: 'STR', target: 3, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'legend-fit-3', name: 'Shadow Sprint: 5km Endurance March', category: 'physical', difficulty: 'C',
    description: 'Engage in a 5km run or brisk power-walk to elevate cardiovascular speed and stamina.',
    stat: 'AGI', target: 5, unit: 'km', repeatable: 'daily',
  },
  {
    id: 'legend-fit-4', name: 'Iron Legs: 100 Deep Bodyweight Squats', category: 'physical', difficulty: 'D',
    description: 'Perform 100 full-depth squats to cultivate foundation explosiveness and lower body power.',
    stat: 'STR', target: 100, unit: 'reps', repeatable: 'daily',
  },
  {
    id: 'legend-fit-5', name: 'Core of Steel: 5-Minute Accumulation Plank', category: 'physical', difficulty: 'C',
    description: 'Hold a forearm plank position for an accumulated duration of 5 minutes today.',
    stat: 'VIT', target: 5, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'legend-fit-6', name: 'Quickstep Calisthenics: 200 Jumping Jacks', category: 'physical', difficulty: 'E',
    description: 'Rapid explosive jumping jacks to stimulate sudden adrenaline and agility awakenings.',
    stat: 'AGI', target: 200, unit: 'reps', repeatable: 'daily',
  },
  {
    id: 'legend-fit-7', name: 'High Intensity Mana Surge: 15m HIIT', category: 'physical', difficulty: 'B',
    description: '15 continuous minutes of interval sprints, burpees, and mountain climbers at maximum threshold.',
    stat: 'AGI', target: 15, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'legend-fit-8', name: 'Elastic Recovery: Full Mobility & Stretch Flow', category: 'physical', difficulty: 'E',
    description: 'Perform 20 minutes of targeted hip, hamstring, and thoracic spine mobility work.',
    stat: 'AGI', target: 20, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'legend-learn-1', name: 'Grimoire Codex: 30-Minute Non-Fiction Deep Read', category: 'study', difficulty: 'D',
    description: 'Absorb high-density knowledge from books on technology, philosophy, or human psychology without distraction.',
    stat: 'INT', target: 30, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'legend-learn-2', name: 'Algorithm Gate: Solve 2 Algorithmic Puzzles', category: 'coding', difficulty: 'C',
    description: 'Tackle two complex data structure or programming problems to sharpen logical acuity.',
    stat: 'INT', target: 2, unit: 'problems', repeatable: 'daily',
  },
  {
    id: 'legend-learn-3', name: 'Linguistic Runes: 20 Minutes Language Practice', category: 'study', difficulty: 'D',
    description: 'Practice vocabulary flashcards or foreign language grammar to expand neural plasticity.',
    stat: 'INT', target: 20, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'legend-learn-4', name: 'Knowledge Synthesis: Write a 1-Page Summary', category: 'knowledge', difficulty: 'C',
    description: 'Distill a complex topic or paper into a concise, actionable 1-page breakdown.',
    stat: 'INT', target: 1, unit: 'summary', repeatable: 'daily',
  },
  {
    id: 'legend-learn-5', name: 'Technical Mastery: Build a Micro-Prototype', category: 'coding', difficulty: 'B',
    description: 'Implement a working code prototype or script exploring a brand-new library or API.',
    stat: 'INT', target: 1, unit: 'prototype', repeatable: 'daily',
  },
  {
    id: 'legend-learn-6', name: 'Tactical Archive: Audio Lecture Immersion', category: 'study', difficulty: 'D',
    description: 'Listen intently to a 45-minute technical podcast or masterclass while taking mental timestamps.',
    stat: 'INT', target: 45, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'legend-learn-7', name: 'Memory Palace: Memorize 5 Critical Concept Pillars', category: 'knowledge', difficulty: 'D',
    description: 'Commit 5 core principles or architecture diagrams to long-term memory via spaced recall.',
    stat: 'PERC', target: 5, unit: 'concepts', repeatable: 'daily',
  },
  {
    id: 'legend-learn-8', name: 'Research Abyss: 60-Minute Deep Technical Investigation', category: 'study', difficulty: 'B',
    description: 'Unpack the inner workings of an unfamiliar system, protocol, or framework from primary source docs.',
    stat: 'INT', target: 60, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'legend-hlth-1', name: 'Hydration Font: Drink 3 Liters of Water', category: 'health', difficulty: 'E',
    description: 'Maintain cellular hydration and energy flow by finishing 3000ml of clean water throughout the day.',
    stat: 'VIT', target: 3, unit: 'liters', repeatable: 'daily',
  },
  {
    id: 'legend-hlth-2', name: 'Deep Regeneration: 8 Hours Sleep Chamber', category: 'health', difficulty: 'C',
    description: 'Optimize recovery hormones and synaptic pruning with a minimum of 7.5 to 8 hours restorative sleep.',
    stat: 'VIT', target: 8, unit: 'hours', repeatable: 'daily',
  },
  {
    id: 'legend-hlth-3', name: 'Sugar Purge: Zero Added Refined Sugar', category: 'health', difficulty: 'C',
    description: 'Resist processed sweets, sugary soda, and confections to stabilize blood glucose and dopamine.',
    stat: 'VIT', target: 1, unit: 'day', repeatable: 'daily',
  },
  {
    id: 'legend-hlth-4', name: 'Solar Awakening: 15-Minute Morning Sunlight', category: 'health', difficulty: 'E',
    description: 'Expose eyes and skin to natural morning sunlight within 60 minutes of waking to anchor circadian clock.',
    stat: 'VIT', target: 15, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'legend-hlth-5', name: 'Dopamine Detox: 2 Hours Zero Social Media', category: 'health', difficulty: 'D',
    description: 'Completely disconnect from short-form feeds and reels for a focused reset period.',
    stat: 'PERC', target: 2, unit: 'hours', repeatable: 'daily',
  },
  {
    id: 'legend-hlth-6', name: 'Cold Resistance: 2-Minute Frost Shower', category: 'health', difficulty: 'B',
    description: 'Conclude your shower with 2 minutes of icy cold water to trigger norepinephrine and mental toughness.',
    stat: 'VIT', target: 2, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'legend-hlth-7', name: 'Clean Mana: Whole Foods Nutrient Feast', category: 'health', difficulty: 'D',
    description: 'Eat only nutrient-dense single-ingredient foods with substantial dietary fiber and lean protein.',
    stat: 'VIT', target: 3, unit: 'meals', repeatable: 'daily',
  },
  {
    id: 'legend-hlth-8', name: 'Pranayama Stillness: 10-Minute Breathwork Meditation', category: 'health', difficulty: 'E',
    description: 'Perform box breathing or physiological sighs to activate parasympathetic calm and mental stillness.',
    stat: 'PERC', target: 10, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'legend-prod-1', name: 'S-Rank Focus Chamber: 90-Minute Deep Work Block', category: 'productivity', difficulty: 'B',
    description: 'Eliminate all notifications and enter uninterrupted deep work on your most vital mission.',
    stat: 'PERC', target: 90, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'legend-prod-2', name: 'Inbox Cleansing: Zero Inbox Annihilation', category: 'productivity', difficulty: 'D',
    description: 'Triage, delegate, or archive all incoming communication backlogs down to absolute zero.',
    stat: 'PERC', target: 1, unit: 'cleared', repeatable: 'daily',
  },
  {
    id: 'legend-prod-3', name: 'Sanctuary Order: 15-Minute Environment Declutter', category: 'productivity', difficulty: 'E',
    description: 'Reset your physical desk and battle station to pristine condition to minimize visual distraction.',
    stat: 'PERC', target: 15, unit: 'minutes', repeatable: 'daily',
  },
  {
    id: 'legend-prod-4', name: 'War Council: Evening Battle Plan for Tomorrow', category: 'productivity', difficulty: 'D',
    description: 'Formulate the top 3 high-leverage priorities for tomorrow before entering sleep mode.',
    stat: 'INT', target: 3, unit: 'objectives', repeatable: 'daily',
  },
  {
    id: 'legend-prod-5', name: 'The Frog Slayer: Eliminate Hardest Task First', category: 'productivity', difficulty: 'B',
    description: 'Conquer the single most intimidating or postponed task before midday.',
    stat: 'STR', target: 1, unit: 'boss task', repeatable: 'daily',
  },
  {
    id: 'legend-prod-6', name: 'Pomodoro Barrage: Complete 4 Full Cycles', category: 'productivity', difficulty: 'C',
    description: 'Execute 4 consecutive 25-minute sprints with strict 5-minute restorative breaks.',
    stat: 'PERC', target: 4, unit: 'cycles', repeatable: 'daily',
  },
  {
    id: 'legend-prod-7', name: 'Hunter Journal: 10-Minute Reflection & Review', category: 'productivity', difficulty: 'D',
    description: 'Document what you conquered, where mana was wasted, and recalibrate your internal compass.',
    stat: 'PERC', target: 10, unit: 'minutes', repeatable: 'daily',
  },
];

export default QUEST_LIBRARY;
