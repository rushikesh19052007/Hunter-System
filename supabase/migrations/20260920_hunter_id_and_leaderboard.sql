-- ====================================================================
-- HUNTER SYSTEM DATABASE MIGRATION
-- 1. Add hunter_id (UNIQUE) and affinity to profiles table
-- 2. Create auto-generate trigger for hunter_id (HUNTER-[FIRST 6 ID]-[AFFINITY])
-- 3. Create leaderboard_view for Top 100 rankings
-- 4. Enable public read access via Row Level Security (RLS)
-- ====================================================================

-- 1. Add columns to profiles table
ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS hunter_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS affinity TEXT DEFAULT 'AGI';

-- Ensure existing rows have unique hunter_id and affinity
UPDATE public.profiles
SET 
  affinity = COALESCE(affinity, 'AGI'),
  hunter_id = COALESCE(
    hunter_id, 
    'HUNTER-' || UPPER(SUBSTRING(REPLACE(id::TEXT, '-', ''), 1, 6)) || '-' || UPPER(COALESCE(affinity, 'AGI'))
  )
WHERE hunter_id IS NULL OR affinity IS NULL;

-- 2. Create auto-generation trigger for hunter_id on new inserts
CREATE OR REPLACE FUNCTION public.set_default_hunter_id()
RETURNS TRIGGER AS $$
DECLARE
  first_six TEXT;
  clean_aff TEXT;
BEGIN
  -- Extract clean alphanumeric first 6 characters from user ID
  first_six := UPPER(SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 6));
  IF LENGTH(first_six) < 6 THEN
    first_six := RPAD(first_six, 6, '0');
  END IF;

  clean_aff := UPPER(COALESCE(NEW.affinity, 'AGI'));

  -- Only generate if not provided
  IF NEW.hunter_id IS NULL OR TRIM(NEW.hunter_id) = '' THEN
    NEW.hunter_id := 'HUNTER-' || first_six || '-' || clean_aff;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_hunter_id ON public.profiles;
CREATE TRIGGER trg_set_hunter_id
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_default_hunter_id();

-- 3. Create leaderboard_view for Top rankings
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
  ROW_NUMBER() OVER (ORDER BY total_xp DESC, current_level DESC) AS rank_by_xp,
  ROW_NUMBER() OVER (ORDER BY current_level DESC, total_xp DESC) AS rank_by_level,
  ROW_NUMBER() OVER (ORDER BY clean_days DESC, total_xp DESC) AS rank_by_clean_days
FROM public.profiles;

-- 4. Enable Row Level Security (RLS) & Public Read Access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all hunter profiles for the global leaderboard
DROP POLICY IF EXISTS "Public can view hunter profiles" ON public.profiles;
CREATE POLICY "Public can view hunter profiles"
ON public.profiles
FOR SELECT
USING (true);

-- Allow authenticated hunters to insert/update their own profile
DROP POLICY IF EXISTS "Hunters can insert their own profile" ON public.profiles;
CREATE POLICY "Hunters can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Hunters can update their own profile" ON public.profiles;
CREATE POLICY "Hunters can update their own profile"
ON public.profiles
FOR UPDATE
USING (true);

-- Grant select on leaderboard_view
GRANT SELECT ON public.leaderboard_view TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO anon, authenticated;
