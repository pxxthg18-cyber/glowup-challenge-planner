-- ========================================================================
-- GlowUp Feature Migration: Life Balance Wheel, Monthly GlowUp Reports, Template Details
-- Migration: 20261101000000_add_life_balance_reports_template_details.sql
-- ========================================================================

-- 1. LIFE BALANCE ASSESSMENTS
-- Stores user life balance evaluations (1-10 scores per dynamic category based on selected plan)
-- Preserves complete historical records; never overwrites previous assessments
CREATE TABLE IF NOT EXISTS public.life_balance_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE SET NULL,
    plan_name TEXT NOT NULL,
    ratings JSONB NOT NULL DEFAULT '[]'::jsonb,
    overall_score NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_life_balance_user ON public.life_balance_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_life_balance_challenge ON public.life_balance_assessments(challenge_id);
CREATE INDEX IF NOT EXISTS idx_life_balance_created ON public.life_balance_assessments(user_id, created_at DESC);

-- 2. GLOWUP PROGRESS REPORTS
-- Dynamic plan-based reporting (weekly summaries, monthly checkpoints, and final reports)
-- Prevents duplicate reports for the same reporting period via UNIQUE(challenge_id, report_type, period_number)
CREATE TABLE IF NOT EXISTS public.glowup_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'final')),
    period_number INTEGER NOT NULL,
    period_title TEXT NOT NULL,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(challenge_id, report_type, period_number)
);

CREATE INDEX IF NOT EXISTS idx_glowup_reports_user ON public.glowup_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_glowup_reports_challenge ON public.glowup_reports(challenge_id);
CREATE INDEX IF NOT EXISTS idx_glowup_reports_created ON public.glowup_reports(user_id, created_at DESC);

-- 3. TEMPLATES EXTENSION
-- Add 6-section metadata columns to templates if they do not already exist
ALTER TABLE public.templates 
    ADD COLUMN IF NOT EXISTS purpose TEXT,
    ADD COLUMN IF NOT EXISTS what_you_will_do JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS duration_label TEXT,
    ADD COLUMN IF NOT EXISTS expected_outcomes TEXT;

-- ========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict user isolation enforcing ownership using auth.uid() = user_id
-- ========================================================================

ALTER TABLE public.life_balance_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glowup_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Life balance user isolation" ON public.life_balance_assessments
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Glowup reports user isolation" ON public.glowup_reports
    FOR ALL USING (auth.uid() = user_id);
