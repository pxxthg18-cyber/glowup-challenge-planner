-- ========================================================================
-- GlowUp Security Migration: Complete Row Level Security (RLS) & Auth Profiles
-- Migration: 20261101020000_complete_auth_security_rls.sql
-- ========================================================================

-- 0. Auto-confirm users so new registrations can log in immediately
CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS trigger AS $$
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := NOW();
  END IF;
  IF NEW.confirmed_at IS NULL THEN
    NEW.confirmed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_new_user();

-- Also confirm any existing registered users in auth.users
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 1. Automated Profile Provisioning on User Registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, bio, preferred_theme, focus_daily_target_minutes)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'Embracing my transformative glow-up journey.',
    'light',
    60
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. ENABLE ROW LEVEL SECURITY ON ALL USER TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_board_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bucket_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_step_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_balance_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glowup_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_entries ENABLE ROW LEVEL SECURITY;

-- 3. DROP INSUFFICIENT POLICIES TO RE-CREATE COMPLETE CRUD SUITE
DROP POLICY IF EXISTS "User profiles self access" ON public.profiles;
DROP POLICY IF EXISTS "Profiles select self" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insert self" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update self" ON public.profiles;

CREATE POLICY "Profiles select self" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Profiles insert self" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles update self" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 4. CHALLENGES POLICIES
DROP POLICY IF EXISTS "Challenges user isolation" ON public.challenges;
CREATE POLICY "Challenges select self" ON public.challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Challenges insert self" ON public.challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Challenges update self" ON public.challenges FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Challenges delete self" ON public.challenges FOR DELETE USING (auth.uid() = user_id);

-- 5. MILESTONES POLICIES
DROP POLICY IF EXISTS "Milestones user isolation" ON public.milestones;
CREATE POLICY "Milestones select self" ON public.milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Milestones insert self" ON public.milestones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Milestones update self" ON public.milestones FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Milestones delete self" ON public.milestones FOR DELETE USING (auth.uid() = user_id);

-- 6. GOALS POLICIES
DROP POLICY IF EXISTS "Goals user isolation" ON public.goals;
CREATE POLICY "Goals select self" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Goals insert self" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Goals update self" ON public.goals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Goals delete self" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- 7. HABITS POLICIES
DROP POLICY IF EXISTS "Habits user isolation" ON public.habits;
CREATE POLICY "Habits select self" ON public.habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Habits insert self" ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Habits update self" ON public.habits FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Habits delete self" ON public.habits FOR DELETE USING (auth.uid() = user_id);

-- 8. HABIT LOGS POLICIES
DROP POLICY IF EXISTS "Habit logs user isolation" ON public.habit_logs;
CREATE POLICY "Habit logs select self" ON public.habit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Habit logs insert self" ON public.habit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Habit logs update self" ON public.habit_logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Habit logs delete self" ON public.habit_logs FOR DELETE USING (auth.uid() = user_id);

-- 9. TASKS POLICIES
DROP POLICY IF EXISTS "Tasks user isolation" ON public.tasks;
CREATE POLICY "Tasks select self" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Tasks insert self" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Tasks update self" ON public.tasks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Tasks delete self" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- 10. JOURNAL ENTRIES POLICIES
DROP POLICY IF EXISTS "Journal entries user isolation" ON public.journal_entries;
CREATE POLICY "Journal entries select self" ON public.journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Journal entries insert self" ON public.journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Journal entries update self" ON public.journal_entries FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Journal entries delete self" ON public.journal_entries FOR DELETE USING (auth.uid() = user_id);

-- 11. FOCUS SESSIONS POLICIES
DROP POLICY IF EXISTS "Focus sessions user isolation" ON public.focus_sessions;
CREATE POLICY "Focus sessions select self" ON public.focus_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Focus sessions insert self" ON public.focus_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Focus sessions update self" ON public.focus_sessions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Focus sessions delete self" ON public.focus_sessions FOR DELETE USING (auth.uid() = user_id);

-- 12. VISION BOARD POLICIES
DROP POLICY IF EXISTS "Vision board user isolation" ON public.vision_board_items;
CREATE POLICY "Vision board select self" ON public.vision_board_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Vision board insert self" ON public.vision_board_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Vision board update self" ON public.vision_board_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Vision board delete self" ON public.vision_board_items FOR DELETE USING (auth.uid() = user_id);

-- 13. WEEKLY PLANS POLICIES
DROP POLICY IF EXISTS "Weekly plans user isolation" ON public.weekly_plans;
CREATE POLICY "Weekly plans select self" ON public.weekly_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Weekly plans insert self" ON public.weekly_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Weekly plans update self" ON public.weekly_plans FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Weekly plans delete self" ON public.weekly_plans FOR DELETE USING (auth.uid() = user_id);

-- 14. LIFE GOALS & MILESTONES POLICIES
DROP POLICY IF EXISTS "Life goals user isolation" ON public.life_goals;
CREATE POLICY "Life goals select self" ON public.life_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Life goals insert self" ON public.life_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Life goals update self" ON public.life_goals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Life goals delete self" ON public.life_goals FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Life goal milestones user isolation" ON public.life_goal_milestones;
CREATE POLICY "Life goal milestones select self" ON public.life_goal_milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Life goal milestones insert self" ON public.life_goal_milestones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Life goal milestones update self" ON public.life_goal_milestones FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Life goal milestones delete self" ON public.life_goal_milestones FOR DELETE USING (auth.uid() = user_id);

-- 15. BUCKET LIST POLICIES
DROP POLICY IF EXISTS "Bucket list items user isolation" ON public.bucket_list_items;
CREATE POLICY "Bucket list select self" ON public.bucket_list_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Bucket list insert self" ON public.bucket_list_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Bucket list update self" ON public.bucket_list_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Bucket list delete self" ON public.bucket_list_items FOR DELETE USING (auth.uid() = user_id);

-- 16. ROUTINES & ROUTINE LOGS POLICIES
DROP POLICY IF EXISTS "Routines user isolation" ON public.routines;
CREATE POLICY "Routines select self" ON public.routines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Routines insert self" ON public.routines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Routines update self" ON public.routines FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Routines delete self" ON public.routines FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Routine steps user isolation" ON public.routine_steps;
CREATE POLICY "Routine steps select self" ON public.routine_steps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Routine steps insert self" ON public.routine_steps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Routine steps update self" ON public.routine_steps FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Routine steps delete self" ON public.routine_steps FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Routine step logs user isolation" ON public.routine_step_logs;
CREATE POLICY "Routine step logs select self" ON public.routine_step_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Routine step logs insert self" ON public.routine_step_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Routine step logs update self" ON public.routine_step_logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Routine step logs delete self" ON public.routine_step_logs FOR DELETE USING (auth.uid() = user_id);

-- 17. LIFE BALANCE ASSESSMENTS POLICIES
DROP POLICY IF EXISTS "Life balance user isolation" ON public.life_balance_assessments;
CREATE POLICY "Life balance select self" ON public.life_balance_assessments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Life balance insert self" ON public.life_balance_assessments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Life balance update self" ON public.life_balance_assessments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Life balance delete self" ON public.life_balance_assessments FOR DELETE USING (auth.uid() = user_id);

-- 18. GLOWUP REPORTS POLICIES
DROP POLICY IF EXISTS "Glowup reports user isolation" ON public.glowup_reports;
CREATE POLICY "Glowup reports select self" ON public.glowup_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Glowup reports insert self" ON public.glowup_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Glowup reports update self" ON public.glowup_reports FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Glowup reports delete self" ON public.glowup_reports FOR DELETE USING (auth.uid() = user_id);

-- 19. FOOD ENTRIES POLICIES
DROP POLICY IF EXISTS "Users can view their own food entries" ON public.food_entries;
DROP POLICY IF EXISTS "Users can create their own food entries" ON public.food_entries;
DROP POLICY IF EXISTS "Users can update their own food entries" ON public.food_entries;
DROP POLICY IF EXISTS "Users can delete their own food entries" ON public.food_entries;

CREATE POLICY "Food entries select self" ON public.food_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Food entries insert self" ON public.food_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Food entries update self" ON public.food_entries FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Food entries delete self" ON public.food_entries FOR DELETE USING (auth.uid() = user_id);
