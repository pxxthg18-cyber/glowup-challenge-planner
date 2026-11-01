export type ChallengeStatus = 'active' | 'paused' | 'completed' | 'archived' | 'draft';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type GoalStatus = 'not_started' | 'in_progress' | 'achieved' | 'abandoned';
export type HabitFrequencyType = 'daily' | 'weekdays' | 'custom_days' | 'times_per_week';
export type FocusSessionType = 'focus' | 'short_break' | 'long_break';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  preferred_theme: 'light' | 'dark' | 'system';
  focus_daily_target_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  cover_image: string;
  category: string;
  suggested_duration_days: number;
  difficulty: 'Gentle' | 'Beginner' | 'Moderate' | 'Challenging' | 'Intense';
  featured: boolean;
  is_system_template: boolean;
  creator_id?: string | null;
  created_at: string;
  purpose?: string;
  what_you_will_do?: string[];
  duration_label?: string;
  expected_outcomes?: string;
  goals?: TemplateGoal[];
  habits?: TemplateHabit[];
  tasks?: TemplateTask[];
}

export interface TemplateGoal {
  id: string;
  template_id: string;
  title: string;
  description?: string;
  category: string;
  target_metric?: string;
}

export interface TemplateHabit {
  id: string;
  template_id: string;
  title: string;
  description?: string;
  frequency: string;
  frequency_days: number[]; // 0 = Sunday, 1 = Monday, etc.
  time_of_day: string;
  category: string;
}

export interface TemplateTask {
  id: string;
  template_id: string;
  title: string;
  description?: string;
  day_number: number;
  category: string;
  priority: TaskPriority;
  estimated_minutes: number;
}

export interface Challenge {
  id: string;
  user_id: string;
  template_id?: string | null;
  title: string;
  tagline?: string;
  description?: string;
  cover_image?: string;
  category: string;
  duration_days: number;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  status: ChallengeStatus;
  is_open_ended: boolean;
  color_accent: string;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  challenge_id: string;
  user_id: string;
  title: string;
  day_number: number;
  target_date: string; // YYYY-MM-DD
  is_achieved: boolean;
  achieved_at?: string | null;
  reward_note?: string;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  challenge_id?: string | null;
  title: string;
  description?: string;
  category: string;
  target_metric?: string;
  current_value: number;
  target_value?: number;
  unit?: string;
  deadline?: string; // YYYY-MM-DD
  status: GoalStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  challenge_id?: string | null;
  title: string;
  description?: string;
  category: string;
  frequency_type: HabitFrequencyType;
  scheduled_days: number[]; // 0 = Sunday, 1 = Monday ... 6 = Saturday
  target_times_per_week: number;
  time_of_day: string; // 'morning', 'afternoon', 'evening', 'anytime'
  color: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  notes?: string;
  completed_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  challenge_id?: string | null;
  goal_id?: string | null;
  title: string;
  description?: string;
  category: string;
  scheduled_date?: string | null; // YYYY-MM-DD
  due_date?: string | null;       // YYYY-MM-DD
  priority: TaskPriority;
  status: TaskStatus;
  estimated_duration_minutes: number;
  actual_duration_minutes: number;
  notes?: string;
  completed_at?: string | null;
  day_number?: number | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  challenge_id?: string | null;
  entry_date: string; // YYYY-MM-DD
  title?: string;
  content: string;
  mood_rating?: number; // 1 to 5
  gratitude_list?: string[];
  daily_wins?: string[];
  challenges_faced?: string;
  lessons_learned?: string;
  tomorrow_priorities?: string[];
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  challenge_id?: string | null;
  task_id?: string | null;
  duration_minutes: number;
  session_type: FocusSessionType;
  notes?: string;
  started_at: string;
  completed_at: string;
  created_at: string;
}

export interface VisionBoardItem {
  id: string;
  user_id: string;
  challenge_id?: string | null;
  image_url: string;
  caption?: string;
  category: string;
  display_order: number;
  created_at: string;
}

// ==========================================
// FEATURE 1: WEEKLY PLANNER TYPES
// ==========================================

export interface WeeklyPriority {
  id: string;
  text: string;
  completed: boolean;
}

export interface WeeklyGoal {
  id: string;
  title: string;
  completed: boolean;
}

export interface WeeklyDailyTask {
  id: string;
  title: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
}

export interface WeeklyReflection {
  accomplishments: string;
  challenges: string;
  learnings: string;
  improvements: string;
  gratitude: string;
}

export interface WeeklyPlan {
  id: string;
  user_id: string;
  week_start_date: string; // YYYY-MM-DD (Monday)
  week_end_date: string;   // YYYY-MM-DD (Sunday)
  priorities: WeeklyPriority[]; // Exactly 3 priorities
  goals: WeeklyGoal[];
  daily_tasks: Record<string, WeeklyDailyTask[]>; // 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'
  reflection: WeeklyReflection;
  created_at: string;
  updated_at: string;
}

// ==========================================
// FEATURE 2: LIFE GOALS & BUCKET LIST TYPES
// ==========================================

export type LifeGoalCategory =
  | 'Career'
  | 'Education'
  | 'Fitness'
  | 'Finance'
  | 'Travel'
  | 'Personal Development'
  | 'Relationships'
  | 'Lifestyle'
  | 'Other';

export type LifeGoalStatus = 'not_started' | 'in_progress' | 'achieved' | 'archived';

export interface LifeGoalMilestone {
  id: string;
  goal_id: string;
  user_id: string;
  title: string;
  description?: string;
  target_date?: string;
  is_completed: boolean;
  completed_at?: string | null;
  display_order: number;
  created_at: string;
}

export interface LifeGoal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: LifeGoalCategory;
  target_date?: string;
  priority: 'low' | 'medium' | 'high';
  image_url?: string;
  status: LifeGoalStatus;
  milestones?: LifeGoalMilestone[];
  created_at: string;
  updated_at: string;
}

export type BucketListCategory =
  | 'Travel'
  | 'Experiences'
  | 'Personal Challenges'
  | 'Aspirations'
  | 'Other';

export interface BucketListItem {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: BucketListCategory;
  image_url?: string;
  is_completed: boolean;
  completed_at?: string | null;
  target_date?: string;
  created_at: string;
}

// ==========================================
// FEATURE 3: SELF-CARE ROUTINE TYPES
// ==========================================

export type RoutineCategory =
  | 'Morning Routine'
  | 'Evening Routine'
  | 'Skincare Routine'
  | 'Fitness Routine'
  | 'Study Routine'
  | 'Relaxation Routine'
  | 'Custom Routine';

export interface RoutineStep {
  id: string;
  routine_id: string;
  user_id: string;
  title: string;
  description?: string;
  duration_minutes: number;
  step_order: number;
  created_at: string;
}

export interface Routine {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: RoutineCategory;
  preferred_time?: string;
  is_paused: boolean;
  is_archived: boolean;
  reminder_time?: string;
  reminder_enabled: boolean;
  display_order: number;
  steps?: RoutineStep[];
  created_at: string;
  updated_at: string;
}

export interface RoutineStepLog {
  id: string;
  routine_id: string;
  step_id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  completed_at: string;
}

export interface RoutineConsistencyStats {
  currentStreak: number;
  longestStreak: number;
  weeklyConsistency: number;
  monthlyConsistency: number;
  mostConsistentRoutine: string | null;
  dailyHistory: Record<string, number>; // date -> count of completed steps
}

// ==========================================
// Life Balance Wheel
// ==========================================
export interface LifeBalanceCategoryItem {
  name: string;
  description: string;
  icon?: string;
  suggestionIfLow: string;
  suggestionIfHigh: string;
}

export interface LifeBalanceRating {
  category: string;
  score: number; // 1 to 10
  description?: string;
}

export interface LifeBalanceAssessment {
  id: string;
  user_id: string;
  challenge_id?: string | null;
  plan_name: string;
  ratings: LifeBalanceRating[];
  overall_score: number;
  notes?: string;
  created_at: string;
}

// ==========================================
// Dynamic GlowUp Progress Reports
// ==========================================
export type GlowUpReportType = 'weekly' | 'monthly' | 'final';

export interface ConsistentHabitMetric {
  title: string;
  streak: number;
  rate: number;
}

export interface HabitImprovementMetric {
  title: string;
  rate: number;
}

export interface AchievedMilestoneMetric {
  title: string;
  day_number: number;
}

export interface WheelCategoryDelta {
  category: string;
  delta: number;
}

export interface GlowUpReportMetrics {
  plan_name: string;
  total_duration_days: number;
  current_day: number;
  period_start_date: string;
  period_end_date: string;
  overall_completion_rate: number;
  total_activities_logged: number;
  completed_activities: number;
  pending_activities: number;
  previous_period_comparison?: number; // e.g. +8
  // Goals
  total_goals: number;
  completed_goals: number;
  in_progress_goals: number;
  pending_goals: number;
  goal_completion_rate: number;
  // Habits
  habit_completion_rate: number;
  total_habit_checkins: number;
  consistent_habits: ConsistentHabitMetric[];
  habits_needing_improvement: HabitImprovementMetric[];
  // Routines
  completed_routine_steps: number;
  routine_consistency_rate: number;
  missed_routines: string[];
  // Challenges & Milestones
  achieved_milestones: AchievedMilestoneMetric[];
  total_milestones: number;
  active_challenge_status: string;
  // Focus
  total_focus_minutes: number;
  // Achievements & Insights
  achievements: string[];
  areas_for_improvement: string[];
  actionable_suggestions: string[];
  // Life Balance Wheel Progress
  life_balance_baseline?: number;
  life_balance_current?: number;
  life_balance_delta?: number;
  wheel_category_improvements?: WheelCategoryDelta[];
}

export interface GlowUpReport {
  id: string;
  user_id: string;
  challenge_id: string;
  plan_name: string;
  report_type: GlowUpReportType;
  period_number: number;
  period_title: string;
  period_start_date: string;
  period_end_date: string;
  metrics: GlowUpReportMetrics;
  created_at: string;
  updated_at: string;
}

// ==========================================
// Food & Diet Tracker Types
// ==========================================
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface FoodEntry {
  id: string;
  user_id: string;
  food_name: string;
  meal_type: MealType;
  quantity?: string | null;
  entry_date: string; // YYYY-MM-DD
  entry_time?: string | null; // e.g. "08:30"
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyFoodSummary {
  date: string;
  totalEntries: number;
  mealsLoggedCount: number; // e.g. 3 of 4
  loggedMealTypes: MealType[];
}



