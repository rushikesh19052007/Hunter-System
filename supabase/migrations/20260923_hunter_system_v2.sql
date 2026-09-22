-- ====================================================================
-- HUNTER SYSTEM DATABASE MIGRATION v2
-- Adds HP/MP, Physical/Mental XP, streak tracking, achievements, 
-- titles, badges, skill points, and system log to profiles table
-- ====================================================================

-- ============================================================
-- 1. EXTEND PROFILES TABLE WITH V2 FIELDS
-- ============================================================

ALTER TABLE IF EXISTS public.profiles
  -- HP/MP vitals
  ADD COLUMN IF NOT EXISTS hp INT DEFAULT 100,
  ADD COLUMN IF NOT EXISTS mp INT DEFAULT 100,
  ADD COLUMN IF NOT EXISTS max_hp INT DEFAULT 100,
  ADD COLUMN IF NOT EXISTS max_mp INT DEFAULT 100,

  -- Physical & Mental XP (separate from total_xp)
  ADD COLUMN IF NOT EXISTS physical_xp INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mental_xp INT DEFAULT 0,

  -- Quest type counters
  ADD COLUMN IF NOT EXISTS quests_completed INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS physical_quests_completed INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mental_quests_completed INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coding_quests_completed INT DEFAULT 0,

  -- Streak tracking
  ADD COLUMN IF NOT EXISTS streak INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS physical_streak INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mental_streak INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS study_streak INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coding_streak INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS perfect_day_streak INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_quest_date DATE,

  -- Customization: titles, badges, frames
  ADD COLUMN IF NOT EXISTS titles JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS equipped_title TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS profile_frame TEXT DEFAULT '',

  -- Skill points
  ADD COLUMN IF NOT EXISTS skill_points JSONB DEFAULT '{"strength":0,"intelligence":0,"endurance":0,"discipline":0,"focus":0,"agility":0}'::JSONB,
  ADD COLUMN IF NOT EXISTS available_skill_points INT DEFAULT 0,

  -- System log (last 20 events)
  ADD COLUMN IF NOT EXISTS system_log JSONB DEFAULT '[]'::JSONB;

-- ============================================================
-- 2. UPDATE LEADERBOARD VIEW TO INCLUDE NEW FIELDS
-- ============================================================

CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT
  id,
  hunter_id,
  display_name,
  total_xp,
  current_level,
  clean_days,
  current_rank,
  affinity,
  stats,
  hp,
  mp,
  max_hp,
  max_mp,
  physical_xp,
  mental_xp,
  quests_completed,
  streak,
  longest_streak,
  equipped_title,
  badges,
  profile_frame,
  ROW_NUMBER() OVER (ORDER BY total_xp DESC, current_level DESC) AS rank_by_xp,
  ROW_NUMBER() OVER (ORDER BY current_level DESC, total_xp DESC) AS rank_by_level,
  ROW_NUMBER() OVER (ORDER BY clean_days DESC, total_xp DESC) AS rank_by_clean_days
FROM public.profiles;

-- ============================================================
-- 3. ACHIEVEMENTS TABLE (server-side record)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.achievements (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  xp_reward INT DEFAULT 0,
  PRIMARY KEY (id, user_id)
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hunters can view their achievements" ON public.achievements;
CREATE POLICY "Hunters can view their achievements"
  ON public.achievements FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Hunters can insert their achievements" ON public.achievements;
CREATE POLICY "Hunters can insert their achievements"
  ON public.achievements FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 4. SYSTEM LOG TABLE (optional server backup)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.system_log_events (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  xp INT,
  stat_xp INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.system_log_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hunters can view their logs" ON public.system_log_events;
CREATE POLICY "Hunters can view their logs"
  ON public.system_log_events FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Hunters can insert their logs" ON public.system_log_events;
CREATE POLICY "Hunters can insert their logs"
  ON public.system_log_events FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 5. GRANT PERMISSIONS
-- ============================================================

GRANT SELECT ON public.leaderboard_view TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.achievements TO anon, authenticated;
GRANT SELECT, INSERT ON public.system_log_events TO anon, authenticated;
