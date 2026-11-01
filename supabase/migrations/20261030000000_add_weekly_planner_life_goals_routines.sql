-- ========================================================================
-- GlowUp Feature Migration: Weekly Planner, Life Goals & Bucket List, Self-Care Routines
-- Migration: 20261030000000_add_weekly_planner_life_goals_routines.sql
-- ========================================================================

-- 1. WEEKLY PLANS
-- Prevents duplicate weekly plans for the same user and week via UNIQUE(user_id, week_start_date)
CREATE TABLE IF NOT EXISTS public.weekly_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    priorities JSONB DEFAULT '[]'::jsonb,
    goals JSONB DEFAULT '[]'::jsonb,
    daily_tasks JSONB DEFAULT '{"mon":[],"tue":[],"wed":[],"thu":[],"fri":[],"sat":[],"sun":[]}'::jsonb,
    reflection JSONB DEFAULT '{"accomplishments":"","challenges":"","learnings":"","improvements":"","gratitude":""}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_weekly_plans_user_week ON public.weekly_plans(user_id, week_start_date);

-- 2. LIFE GOALS
CREATE TABLE IF NOT EXISTS public.life_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN (
        'Career', 'Education', 'Fitness', 'Finance', 'Travel', 
        'Personal Development', 'Relationships', 'Lifestyle', 'Other'
    )),
    target_date DATE,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    image_url TEXT,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'achieved', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_life_goals_user ON public.life_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_life_goals_user_status ON public.life_goals(user_id, status);

-- 3. LIFE GOAL MILESTONES
CREATE TABLE IF NOT EXISTS public.life_goal_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES public.life_goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_life_goal_milestones_goal ON public.life_goal_milestones(goal_id);
CREATE INDEX IF NOT EXISTS idx_life_goal_milestones_user ON public.life_goal_milestones(user_id);

-- 4. BUCKET LIST ITEMS
CREATE TABLE IF NOT EXISTS public.bucket_list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'Experiences' CHECK (category IN (
        'Travel', 'Experiences', 'Personal Challenges', 'Aspirations', 'Other'
    )),
    image_url TEXT,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    target_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bucket_list_user ON public.bucket_list_items(user_id);
CREATE INDEX IF NOT EXISTS idx_bucket_list_completed ON public.bucket_list_items(user_id, is_completed);

-- 5. SELF-CARE ROUTINES
CREATE TABLE IF NOT EXISTS public.routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN (
        'Morning Routine', 'Evening Routine', 'Skincare Routine', 
        'Fitness Routine', 'Study Routine', 'Relaxation Routine', 'Custom Routine'
    )),
    preferred_time TEXT,
    is_paused BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    reminder_time TEXT,
    reminder_enabled BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routines_user ON public.routines(user_id);
CREATE INDEX IF NOT EXISTS idx_routines_user_archived ON public.routines(user_id, is_archived);

-- 6. ROUTINE STEPS
CREATE TABLE IF NOT EXISTS public.routine_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 5,
    step_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routine_steps_routine ON public.routine_steps(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_steps_user ON public.routine_steps(user_id);

-- 7. ROUTINE STEP LOGS
CREATE TABLE IF NOT EXISTS public.routine_step_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES public.routine_steps(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT true,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(step_id, date)
);

CREATE INDEX IF NOT EXISTS idx_routine_step_logs_user_date ON public.routine_step_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_routine_step_logs_routine ON public.routine_step_logs(routine_id);

-- ========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict user isolation enforcing ownership using auth.uid() = user_id
-- ========================================================================

ALTER TABLE public.weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bucket_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_step_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Weekly plans user isolation" ON public.weekly_plans
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Life goals user isolation" ON public.life_goals
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Life goal milestones user isolation" ON public.life_goal_milestones
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Bucket list items user isolation" ON public.bucket_list_items
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Routines user isolation" ON public.routines
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Routine steps user isolation" ON public.routine_steps
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Routine step logs user isolation" ON public.routine_step_logs
    FOR ALL USING (auth.uid() = user_id);
