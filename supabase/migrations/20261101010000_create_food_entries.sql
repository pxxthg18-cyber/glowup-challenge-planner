-- Migration: 20261101010000_create_food_entries.sql
-- Description: Create food_entries table for optional Food & Diet Tracker

CREATE TABLE IF NOT EXISTS public.food_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snacks')),
  quantity TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_time TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for rapid lookup by user and date
CREATE INDEX IF NOT EXISTS idx_food_entries_user_date ON public.food_entries(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_food_entries_user_meal ON public.food_entries(user_id, meal_type);

-- Enable Row Level Security
ALTER TABLE public.food_entries ENABLE ROW LEVEL SECURITY;

-- Security Policies: strictly isolate data per user
CREATE POLICY "Users can view their own food entries"
  ON public.food_entries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own food entries"
  ON public.food_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food entries"
  ON public.food_entries
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food entries"
  ON public.food_entries
  FOR DELETE
  USING (auth.uid() = user_id);
