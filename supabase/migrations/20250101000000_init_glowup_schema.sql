-- GlowUp Schema Migration
-- Complete PostgreSQL schema with Row Level Security (RLS) policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    preferred_theme TEXT DEFAULT 'light',
    focus_daily_target_minutes INTEGER DEFAULT 60,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TEMPLATES (Default curated templates & public shared templates)
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    tagline TEXT,
    description TEXT NOT NULL,
    cover_image TEXT,
    category TEXT NOT NULL, -- 'Wellness', 'Fitness', 'Productivity', 'Self-Care', 'Mindset', 'Academic'
    suggested_duration_days INTEGER NOT NULL,
    difficulty TEXT DEFAULT 'Moderate',
    featured BOOLEAN DEFAULT false,
    is_system_template BOOLEAN DEFAULT true,
    creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TEMPLATE GOALS
CREATE TABLE IF NOT EXISTS public.template_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    target_metric TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TEMPLATE HABITS
CREATE TABLE IF NOT EXISTS public.template_habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    frequency TEXT DEFAULT 'daily', -- 'daily', 'weekdays', '3_times_week', etc.
    frequency_days INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6],
    time_of_day TEXT DEFAULT 'anytime',
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TEMPLATE TASKS
CREATE TABLE IF NOT EXISTS public.template_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    day_number INTEGER NOT NULL, -- e.g. Day 1, Day 2, etc.
    category TEXT NOT NULL,
    priority TEXT DEFAULT 'medium',
    estimated_minutes INTEGER DEFAULT 20,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CHALLENGES (Personalized instances created by users)
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    cover_image TEXT,
    category TEXT NOT NULL,
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived', 'draft')),
    is_open_ended BOOLEAN DEFAULT false,
    color_accent TEXT DEFAULT '#C9879B',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CHALLENGE MILESTONES
CREATE TABLE IF NOT EXISTS public.milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    day_number INTEGER NOT NULL,
    target_date DATE NOT NULL,
    is_achieved BOOLEAN DEFAULT false,
    achieved_at TIMESTAMPTZ,
    reward_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. GOALS
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    target_metric TEXT,
    current_value NUMERIC DEFAULT 0,
    target_value NUMERIC,
    unit TEXT,
    deadline DATE,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'achieved', 'abandoned')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. HABITS
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    frequency_type TEXT DEFAULT 'daily' CHECK (frequency_type IN ('daily', 'weekdays', 'custom_days', 'times_per_week')),
    scheduled_days INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6], -- 0 = Sunday, 1 = Monday...
    target_times_per_week INTEGER DEFAULT 7,
    time_of_day TEXT DEFAULT 'anytime',
    color TEXT DEFAULT '#C9879B',
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. HABIT LOGS (Daily completions)
CREATE TABLE IF NOT EXISTS public.habit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT true,
    notes TEXT,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(habit_id, date)
);

-- 11. TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
    goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'General',
    scheduled_date DATE,
    due_date DATE,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed')),
    estimated_duration_minutes INTEGER DEFAULT 25,
    actual_duration_minutes INTEGER DEFAULT 0,
    notes TEXT,
    completed_at TIMESTAMPTZ,
    day_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. JOURNAL ENTRIES
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE SET NULL,
    entry_date DATE NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 5),
    gratitude_list TEXT[],
    daily_wins TEXT[],
    challenges_faced TEXT,
    lessons_learned TEXT,
    tomorrow_priorities TEXT[],
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. FOCUS SESSIONS
CREATE TABLE IF NOT EXISTS public.focus_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE SET NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    duration_minutes INTEGER NOT NULL,
    session_type TEXT DEFAULT 'focus' CHECK (session_type IN ('focus', 'short_break', 'long_break')),
    notes TEXT,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. VISION BOARD ITEMS
CREATE TABLE IF NOT EXISTS public.vision_board_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE SET NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    category TEXT DEFAULT 'Inspiration',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_challenges_user ON public.challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_challenge ON public.goals(user_id, challenge_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_challenge ON public.habits(user_id, challenge_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON public.habit_logs(habit_id, date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON public.tasks(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_journal_user_date ON public.journal_entries(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_focus_user_date ON public.focus_sessions(user_id, started_at);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_board_items ENABLE ROW LEVEL SECURITY;

-- Templates: System templates readable by all; custom templates readable/editable by creator
CREATE POLICY "Templates viewable by everyone" ON public.templates
    FOR SELECT USING (is_system_template = true OR auth.uid() = creator_id);
CREATE POLICY "Custom templates insertable by creator" ON public.templates
    FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Custom templates updatable by creator" ON public.templates
    FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Template goals viewable with template" ON public.template_goals
    FOR SELECT USING (true);
CREATE POLICY "Template habits viewable with template" ON public.template_habits
    FOR SELECT USING (true);
CREATE POLICY "Template tasks viewable with template" ON public.template_tasks
    FOR SELECT USING (true);

-- User-owned tables: strict isolation per auth.uid()
CREATE POLICY "User profiles self access" ON public.profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Challenges user isolation" ON public.challenges
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Milestones user isolation" ON public.milestones
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Goals user isolation" ON public.goals
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Habits user isolation" ON public.habits
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Habit logs user isolation" ON public.habit_logs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Tasks user isolation" ON public.tasks
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Journal entries user isolation" ON public.journal_entries
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Focus sessions user isolation" ON public.focus_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Vision board user isolation" ON public.vision_board_items
    FOR ALL USING (auth.uid() = user_id);
